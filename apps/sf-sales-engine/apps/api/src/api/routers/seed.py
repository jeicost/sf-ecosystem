"""
POST /seed/upload endpoint — Bulk CSV upload for leads.

Converts scripts/seed_vbs.py logic into an HTTP endpoint:
- POST /seed/upload(client_id, csv_file: UploadFile, skip_scoring?: bool) → bulk upload
- Parse CSV (venture_builders_enriched.csv format)
- Filter "no encontrado" rows
- Score each row with Claude Haiku (unless skip_scoring=true)
- Upsert to Supabase leads table
- Sync to Notion
"""
import asyncio
import csv
import io
import json
import os
import uuid
from typing import Any
from uuid import UUID

import anthropic
import httpx
import structlog
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from supabase import AsyncClient

from api.deps import get_supabase, get_settings

log = structlog.get_logger()
router = APIRouter()

HAIKU_MODEL = "claude-haiku-4-5-20251001"

# Error handling constants
MAX_RETRIES = 3
RETRY_DELAY = 1.0  # seconds
API_TIMEOUT = 30.0  # seconds

# ICP SF interno (Venture Builders)
ICP_CONTEXT = """
Buscamos Venture Builders e inversores que financien o construyan startups B2B/SaaS en LATAM o Europa.
- Industrias: Venture Capital, Venture Building, Startup Studio, Accelerator, Corporate Innovation
- Geografías: España, México, Colombia, Argentina, Chile, Thailand, Singapore
- Pain que resolvemos: las startups de su portafolio no tienen sistema de adquisición de clientes B2B
- Presupuesto mínimo: $1000/mes
- Descalificadores: solo hardware/biotech, solo B2C, menos de 3 startups activas
"""

SCORE_PROMPT = """\
Evalúa si este Venture Builder / inversor encaja con nuestro ICP.

NUESTRO ICP:
{icp}

VENTURE BUILDER A EVALUAR:
- Nombre: {name}
- Tipo: {tipo}
- Web: {web}
- Sectores de interés: {sectors}
- Fases de inversión: {phases}
- Geografía: {geography}
- Descripción: {description}
- Estado verificación: {status}

Responde SOLO con este JSON (sin markdown):
{{"score": <0-100>, "classification": "<hot|warm|cold|disqualify>", "reason": "<máximo 2 líneas>", "confidence": <0.0-1.0>}}

Criterios: hot≥75 · warm 50-74 · cold 20-49 · disqualify<20 o tiene descalificador.
"""


class SeedUploadResponse(BaseModel):
    """Response from /seed/upload endpoint."""
    total_rows: int
    valid_rows: int
    skipped_rows: int
    inserted_leads: int
    notion_pages_created: int
    score_distribution: dict[str, int]
    hot_leads: list[str]
    errors: list[str]


async def load_csv(csv_file: UploadFile) -> tuple[list[dict], int, int]:
    """Read and validate CSV, filter out "no encontrado" rows with error handling."""
    if not csv_file.filename:
        log.warning("seed.no_filename")
        raise HTTPException(status_code=400, detail="No filename provided")

    # Validate file type
    if csv_file.content_type and "csv" not in csv_file.content_type.lower():
        log.warning("seed.invalid_file_type", content_type=csv_file.content_type)
        raise HTTPException(status_code=400, detail="File must be CSV format")

    # Read file content as text
    try:
        content = await csv_file.read()
    except Exception as e:
        log.error("seed.file_read_error", filename=csv_file.filename, error=str(e))
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if not content:
        log.warning("seed.empty_file", filename=csv_file.filename)
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Decode file
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        log.warning("seed.invalid_encoding", filename=csv_file.filename)
        raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded")

    # Parse CSV
    try:
        reader = csv.DictReader(io.StringIO(text_content))
        if not reader.fieldnames:
            log.warning("seed.no_header", filename=csv_file.filename)
            raise HTTPException(status_code=400, detail="CSV has no header row")
        rows = list(reader)
    except csv.Error as e:
        log.error("seed.csv_parse_error", filename=csv_file.filename, error=str(e))
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")

    if not rows:
        log.warning("seed.no_data_rows", filename=csv_file.filename)
        raise HTTPException(status_code=400, detail="CSV has no data rows")

    total = len(rows)
    # Filter out "no encontrado" rows
    valid = [
        r
        for r in rows
        if "no encontrado" not in r.get("Notas", "").lower() and r.get("Inversor", "").strip()
    ]
    skipped = total - len(valid)

    log.info("csv.loaded", filename=csv_file.filename, total=total, valid=len(valid), skipped=skipped)
    return valid, total, skipped


def row_to_lead(row: dict, client_id: str) -> dict:
    """Map CSV row to leads table schema."""
    geo_parts = [p for p in [row.get("Geografía", ""), row.get("HQ Country", "")] if p]
    geography = " — ".join(dict.fromkeys(geo_parts))  # dedup if same

    notes_parts = []
    if row.get("Próxima acción"):
        notes_parts.append(f"Acción: {row['Próxima acción']}")
    if row.get("Notas"):
        notes_parts.append(row["Notas"])

    return {
        "id": str(uuid.uuid4()),
        "client_id": client_id,
        "company_name": row.get("Inversor", "").strip(),
        "company_website": row.get("Web", "").strip() or None,
        "email": row.get("Email", "").strip() or None,
        "linkedin_url": row.get("LinkedIn", "").strip() or None,
        "industry": row.get("Sectores interés", "").strip() or row.get("Tipo", ""),
        "geography": geography or None,
        "linkedin_summary": row.get("Descripción", "").strip() or None,
        "trigger_event": row.get("Ticket/Fases", "").strip() or None,
        "source": "csv_upload",
        "stage": "prospected",
        "assigned_to": row.get("Owner sugerido", "").strip() or None,
        "notes": " | ".join(notes_parts) if notes_parts else None,
        "hot_score": 0,
    }


async def score_lead(client: anthropic.AsyncAnthropic, row: dict) -> tuple[int, str, str]:
    """Score a VB against the ICP with error handling. Returns (score, classification, reason)."""
    name = row.get("Inversor", "Unknown")
    try:
        prompt = SCORE_PROMPT.format(
            icp=ICP_CONTEXT,
            name=name,
            tipo=row.get("Tipo", ""),
            web=row.get("Web", ""),
            sectors=row.get("Sectores interés", ""),
            phases=row.get("Ticket/Fases", ""),
            geography=f"{row.get('Geografía', '')} ({row.get('HQ Country', '')})",
            description=row.get("Descripción", "")[:300],
            status=row.get("Notas", ""),
        )

        msg = await client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )

        if not msg.content or not msg.content[0].text:
            log.warning("score.empty_response", name=name)
            return 0, "cold", "No response from AI"

        text = msg.content[0].text.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        try:
            raw = json.loads(text)
            # Validate required fields
            if not all(k in raw for k in ["score", "classification", "reason"]):
                log.warning("score.missing_fields", name=name, keys=list(raw.keys()))
                return 0, "cold", "Invalid scoring response"
            # Validate score range
            if not isinstance(raw["score"], (int, float)) or not 0 <= raw["score"] <= 100:
                log.warning("score.invalid_score", name=name, score=raw.get("score"))
                return 0, "cold", "Invalid score value"
            return raw["score"], raw["classification"], raw["reason"]
        except json.JSONDecodeError as e:
            log.warning("score.json_error", name=name, error=str(e), raw=text[:200])
            return 0, "cold", "JSON parse error"
    except anthropic.APIError as e:
        log.error("score.api_error", name=name, error=str(e), status=getattr(e, "status_code", None))
        raise ValueError(f"Claude API error during scoring: {str(e)}")
    except Exception as e:
        log.error("score.unexpected_error", name=name, error=str(e), exc_info=True)
        raise ValueError(f"Unexpected error during scoring: {str(e)}")


async def upsert_supabase(
    db: AsyncClient, leads: list[dict], settings
) -> int:
    """Insert/update leads in Supabase with error handling. Returns count inserted."""
    if not leads:
        return 0

    try:
        # Validate all leads have required fields
        for lead in leads:
            if not lead.get("company_name"):
                log.warning("supabase.missing_company_name", lead_id=lead.get("id"))
                continue
            if not lead.get("client_id"):
                log.warning("supabase.missing_client_id", company=lead.get("company_name"))
                continue

        # Upsert via Supabase client
        result = await db.table("leads").upsert(
            leads,
            on_conflict="client_id,company_name",  # Avoid duplicates
        ).execute()
        count = len(result.data) if result.data else 0
        log.info("supabase.upsert_done", total=len(leads), inserted=count)
        return count
    except Exception as e:
        log.error("supabase.upsert_failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Supabase upsert failed: {str(e)}"
        )


async def sync_notion(leads: list[dict]) -> int:
    """Sync leads to Notion if configured with error handling."""
    api_key = os.environ.get("NOTION_API_KEY", "")
    db_id = os.environ.get("NOTION_VBS_DATABASE_ID", "")

    if not api_key or not db_id:
        log.info("notion.skip", reason="NOTION_API_KEY or NOTION_VBS_DATABASE_ID not configured")
        return 0

    if not leads:
        return 0

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }

    created = 0
    async with httpx.AsyncClient(
        base_url="https://api.notion.com/v1", headers=headers, timeout=API_TIMEOUT
    ) as client:
        for lead in leads:
            company_name = lead.get("company_name", "Unknown")
            try:
                props: dict[str, Any] = {
                    "Nombre": {"title": [{"text": {"content": company_name}}]},
                    "Stage": {"select": {"name": lead.get("stage", "prospected")}},
                    "Score": {"number": lead.get("hot_score", 0)},
                }
                if lead.get("email"):
                    props["Email"] = {"email": lead["email"]}
                if lead.get("company_website"):
                    props["Web"] = {"url": lead["company_website"]}
                if lead.get("linkedin_url"):
                    props["LinkedIn"] = {"url": lead["linkedin_url"]}
                if lead.get("geography"):
                    props["Geografía"] = {"rich_text": [{"text": {"content": lead["geography"]}}]}
                if lead.get("industry"):
                    props["Sector"] = {"rich_text": [{"text": {"content": lead["industry"]}}]}

                try:
                    r = await client.post(
                        "/pages",
                        content=json.dumps({
                            "parent": {"database_id": db_id},
                            "properties": props,
                        }),
                    )
                    if r.status_code == 200:
                        created += 1
                        log.debug("notion.page_created", company=company_name)
                    elif r.status_code in (429, 503):
                        log.warning("notion.rate_limit", company=company_name, status=r.status_code)
                        await asyncio.sleep(1)
                    else:
                        log.warning("notion.page_failed", company=company_name, status=r.status_code, response=r.text[:200])
                except asyncio.TimeoutError:
                    log.warning("notion.timeout", company=company_name)
                except httpx.RequestError as e:
                    log.warning("notion.request_error", company=company_name, error=str(e))
            except Exception as e:
                log.error("notion.page_error", company=company_name, error=str(e), exc_info=True)

    log.info("notion.sync_complete", total=len(leads), created=created)
    return created


@router.post("/upload", response_model=SeedUploadResponse)
async def upload_seed_csv(
    client_id: UUID,
    csv_file: UploadFile = File(...),
    skip_scoring: bool = Query(False),
    db: AsyncClient = Depends(get_supabase),
) -> SeedUploadResponse:
    """
    Bulk upload leads from CSV with comprehensive error handling.

    - Validates client_id is provided
    - Accepts CSV file with Venture Builders data
    - Filters "no encontrado" rows
    - Scores with Claude Haiku unless skip_scoring=true
    - Upserts to Supabase leads table
    - Syncs to Notion if configured

    Query params:
    - client_id (required): UUID of the client
    - skip_scoring (optional): Skip AI scoring step (default: false)

    Request body:
    - csv_file: The CSV file (multipart/form-data)

    Returns:
    - Summary of processed rows, inserted leads, score distribution, hot leads, errors
    """
    # Validate client_id
    if not client_id:
        log.warning("seed.upload.missing_client_id")
        raise HTTPException(status_code=422, detail="client_id is required")

    errors: list[str] = []

    # Load and validate CSV
    try:
        valid_rows, total_rows, skipped_rows = await load_csv(csv_file)
    except HTTPException:
        raise
    except Exception as e:
        log.error("seed.csv_read_error", error=str(e))
        raise HTTPException(status_code=400, detail=f"CSV read error: {str(e)}")

    if not valid_rows:
        log.warning("seed.no_valid_rows", total=total_rows)
        raise HTTPException(status_code=400, detail="No valid rows found in CSV")

    # Convert rows to leads
    leads: list[dict] = []
    score_dist: dict[str, int] = {"hot": 0, "warm": 0, "cold": 0, "disqualify": 0}

    anthropic_client = None
    if not skip_scoring:
        settings = get_settings()
        if not settings.anthropic_api_key:
            log.error("seed.missing_anthropic_key")
            raise HTTPException(status_code=500, detail="Anthropic API key not configured")
        anthropic_client = anthropic.AsyncAnthropic(
            api_key=settings.anthropic_api_key
        )

    for i, row in enumerate(valid_rows):
        inversor_name = row.get("Inversor", f"Row {i}")
        try:
            lead = row_to_lead(row, str(client_id))

            if not skip_scoring and anthropic_client:
                try:
                    score, classification, reason = await score_lead(
                        anthropic_client, row
                    )
                    lead["hot_score"] = score
                    lead["notes"] = f"[Score: {score} — {classification}] {reason}" + (
                        f" | {lead['notes']}" if lead.get("notes") else ""
                    )
                    score_dist[classification] = score_dist.get(classification, 0) + 1
                    log.info(
                        "seed.scored",
                        n=i + 1,
                        name=inversor_name,
                        score=score,
                        cls=classification,
                    )
                except ValueError as e:
                    log.warning("seed.score_failed", name=inversor_name, error=str(e))
                    errors.append(f"Scoring failed for {inversor_name}: {str(e)}")
                    lead["hot_score"] = 0
                except Exception as e:
                    log.error("seed.score_unexpected_error", name=inversor_name, error=str(e), exc_info=True)
                    errors.append(f"Scoring error for {inversor_name}: {str(e)}")
                    lead["hot_score"] = 0

            leads.append(lead)
        except Exception as e:
            log.error("seed.row_conversion_failed", index=i, row=inversor_name, error=str(e), exc_info=True)
            errors.append(f"Row {i} ({inversor_name}) conversion failed: {str(e)}")

    if not leads:
        log.error("seed.no_leads_converted", total=len(valid_rows))
        raise HTTPException(status_code=422, detail="No leads could be converted from CSV rows")

    # Upsert to Supabase
    settings = get_settings()
    try:
        inserted = await upsert_supabase(db, leads, settings)
    except HTTPException:
        raise
    except Exception as e:
        log.error("seed.upsert_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to upsert leads: {str(e)}")

    # Sync to Notion
    try:
        notion_created = await sync_notion(leads)
    except Exception as e:
        log.error("seed.notion_sync_error", error=str(e))
        errors.append(f"Notion sync error: {str(e)}")
        notion_created = 0

    # Calculate hot leads
    hot_leads = [
        l["company_name"] for l in leads if l.get("hot_score", 0) >= 75
    ]

    log.info(
        "seed.upload.complete",
        client_id=str(client_id),
        total=total_rows,
        valid=len(valid_rows),
        inserted=inserted,
        notion=notion_created,
        hot_count=len(hot_leads),
        errors_count=len(errors),
    )

    return SeedUploadResponse(
        total_rows=total_rows,
        valid_rows=len(valid_rows),
        skipped_rows=skipped_rows,
        inserted_leads=inserted,
        notion_pages_created=notion_created,
        score_distribution=score_dist,
        hot_leads=hot_leads,
        errors=errors,
    )
