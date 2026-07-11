import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import anthropic
import httpx
import structlog
import yaml
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import AsyncClient

from api.deps import get_settings, get_supabase

log = structlog.get_logger()
router = APIRouter()

# Error handling constants
MAX_RETRIES = 3
RETRY_DELAY = 1.0  # seconds
API_TIMEOUT = 30.0  # seconds

# Prompts (copied from discover_leads.py)
EXTRACT_PROMPT = """\
Analiza estos resultados de búsqueda web y extrae todas las empresas/organizaciones
que podrían ser Venture Builders, inversores, aceleradoras o studios de startups.

RESULTADOS DE BÚSQUEDA:
{results_text}

Para cada empresa encontrada, extrae lo que puedas. Si no tienes un dato, usa null.
Responde SOLO con este JSON (array, sin markdown):
[
  {{
    "company_name": "Nombre exacto de la empresa",
    "company_website": "URL del sitio web o null",
    "linkedin_url": "URL de LinkedIn de la empresa o null",
    "industry": "Tipo: Venture Builder | Startup Studio | Accelerator | VC | Corporate Innovation",
    "geography": "País o ciudad principal",
    "key_person_name": "Nombre del CEO/fundador si aparece o null",
    "key_person_title": "Cargo (CEO, Managing Partner, etc.) o null",
    "description": "1-2 frases describiendo qué hacen",
    "trigger_signals": ["señal1", "señal2"]
  }}
]

Extrae SOLO empresas reales con nombre claro. Ignora resultados vagos o sin empresa identificable.
Si no encuentras ninguna empresa válida, devuelve [].
"""

SCORE_PROMPT = """\
Evalúa si esta empresa encaja con nuestro ICP de Venture Builders/Inversores.

NUESTRO ICP:
- Buscamos: Venture Builders, Startup Studios, Aceleradoras, VCs, Corporate Innovation
- Geografías: España, LATAM (México, Colombia, Argentina, Chile), SEA (Thailand, Singapore)
- Pain que resolvemos: sus startups no tienen sistema de adquisición B2B escalable
- Presupuesto mínimo: $1000/mes
- Descalificadores: solo hardware/biotech, solo B2C, menos de 3 startups activas

EMPRESA A EVALUAR:
- Nombre: {company_name}
- Tipo: {industry}
- Geografía: {geography}
- Persona clave: {key_person} ({key_person_title})
- Descripción: {description}
- Señales: {trigger_signals}

Responde SOLO con este JSON (sin markdown):
{{"score": <0-100>, "classification": "<hot|warm|cold|disqualify>", "reason": "<máximo 2 líneas>", "confidence": <0.0-1.0>}}

Criterios: hot≥75 · warm 50-74 · cold 20-49 · disqualify<20 o tiene descalificador.
"""

SEARCH_TERMS = [
    "venture builder",
    "startup studio",
    "aceleradora startups",
    "inversor startup B2B",
    "corporate innovation hub",
]

HAIKU_MODEL = "claude-haiku-4-5-20251001"


class DiscoveryRunRequest(BaseModel):
    client_id: UUID
    icp_id: UUID
    geo_filter: str | None = None


class DiscoveryRunResponse(BaseModel):
    run_id: UUID
    status: str
    message: str


class DiscoveryRunSummary(BaseModel):
    id: UUID
    client_id: UUID
    leads_found: int
    hot_count: int
    warm_count: int
    total_cost_usd: float | None
    started_at: str
    finished_at: str | None


def get_client_root() -> Path:
    """Get root directory of sf-sales-engine app."""
    return Path(__file__).parent.parent.parent.parent


def load_client_icp(client_slug: str) -> dict:
    """Load ICP profile from client config."""
    root = get_client_root()
    icp_path = root / "clients" / client_slug / "icp-profile.yaml"
    if not icp_path.exists():
        log.error("icp_not_found", client_slug=client_slug, path=str(icp_path))
        raise FileNotFoundError(f"ICP not found for client {client_slug}")
    with open(icp_path) as f:
        return yaml.safe_load(f)


def build_queries(icp: dict, geo_filter: str | None = None) -> list[str]:
    """Generate Tavily queries from ICP."""
    geographies = icp.get("geographies", [])
    if geo_filter:
        geographies = [g for g in geographies if geo_filter.lower() in g.lower()]
        if not geographies:
            geographies = [geo_filter]

    queries = []
    for term in SEARCH_TERMS:
        for geo in geographies[:4]:  # max 4 geos per term
            queries.append(f"{term} {geo} 2025 2026 contacto fundador CEO")

    # Additional trigger event queries
    for trigger in icp.get("trigger_events", [])[:2]:
        queries.append(f"{trigger} España LATAM startup 2026")

    return queries


async def tavily_search(api_key: str, query: str, max_results: int = 8) -> list[dict]:
    """Call Tavily Search API with retry logic."""
    if not api_key:
        log.error("tavily.missing_key")
        raise ValueError("TAVILY_API_KEY not configured")

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
                r = await client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": api_key,
                        "query": query,
                        "search_depth": "advanced",
                        "max_results": max_results,
                        "include_answer": False,
                        "include_raw_content": False,
                    },
                )
                if r.status_code == 200:
                    return r.json().get("results", [])
                elif r.status_code in (429, 503):  # rate limit or service unavailable
                    if attempt < MAX_RETRIES - 1:
                        log.warning(
                            "tavily.retry",
                            query=query[:50],
                            status=r.status_code,
                            attempt=attempt + 1,
                        )
                        await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                        continue
                    else:
                        log.error("tavily.max_retries_exceeded", query=query[:50], status=r.status_code)
                        raise ValueError(f"Tavily API error (status {r.status_code}): max retries exceeded")
                else:
                    log.error("tavily.error", query=query[:50], status=r.status_code, response=r.text[:200])
                    return []
        except asyncio.TimeoutError:
            log.warning("tavily.timeout", query=query[:50], attempt=attempt + 1)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                continue
            raise ValueError(f"Tavily API timeout after {MAX_RETRIES} attempts")
        except httpx.RequestError as e:
            log.error("tavily.request_error", query=query[:50], error=str(e), attempt=attempt + 1)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                continue
            raise ValueError(f"Tavily API request failed: {str(e)}")
    return []


async def extract_companies(
    ai: anthropic.AsyncAnthropic,
    results: list[dict],
    query: str,
) -> list[dict]:
    """Use Claude Haiku to extract structured companies from Tavily results with error handling."""
    if not results:
        return []

    results_text = "\n\n".join(
        f"[{i+1}] TÍTULO: {r.get('title', '')}\nURL: {r.get('url', '')}\nCONTENIDO: {r.get('content', '')[:400]}"
        for i, r in enumerate(results)
    )

    try:
        msg = await ai.messages.create(
            model=HAIKU_MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": EXTRACT_PROMPT.format(results_text=results_text)}],
        )

        if not msg.content or not msg.content[0].text:
            log.warning("extract.empty_response", query=query[:50])
            return []

        raw = msg.content[0].text.strip()
        # Strip markdown if Haiku adds it
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        try:
            companies = json.loads(raw)
            if not isinstance(companies, list):
                log.warning("extract.invalid_format", query=query[:50], type=type(companies).__name__)
                return []
            log.info("extract.done", query=query[:50], found=len(companies))
            return companies
        except json.JSONDecodeError as e:
            log.warning("extract.json_error", query=query[:50], error=str(e), raw=raw[:200])
            return []
    except anthropic.APIError as e:
        log.error("extract.api_error", query=query[:50], error=str(e), status=getattr(e, "status_code", None))
        raise ValueError(f"Claude API error during extraction: {str(e)}")
    except Exception as e:
        log.error("extract.unexpected_error", query=query[:50], error=str(e), exc_info=True)
        return []


async def score_company(ai: anthropic.AsyncAnthropic, company: dict) -> tuple[int, str, str]:
    """Score a company against the ICP with error handling."""
    company_name = company.get("company_name", "Unknown")
    try:
        prompt = SCORE_PROMPT.format(
            company_name=company_name,
            industry=company.get("industry", ""),
            geography=company.get("geography", ""),
            key_person=company.get("key_person_name") or "Desconocido",
            key_person_title=company.get("key_person_title") or "—",
            description=company.get("description", "")[:300],
            trigger_signals=", ".join(company.get("trigger_signals", [])) or "Ninguna",
        )

        msg = await ai.messages.create(
            model=HAIKU_MODEL,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )

        if not msg.content or not msg.content[0].text:
            log.warning("score.empty_response", company=company_name)
            return 0, "cold", "No response from AI"

        raw = msg.content[0].text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        try:
            data = json.loads(raw)
            # Validate required fields
            if not all(k in data for k in ["score", "classification", "reason"]):
                log.warning("score.missing_fields", company=company_name, keys=list(data.keys()))
                return 0, "cold", "Invalid scoring response"
            # Validate score range
            if not isinstance(data["score"], (int, float)) or not 0 <= data["score"] <= 100:
                log.warning("score.invalid_score", company=company_name, score=data.get("score"))
                return 0, "cold", "Invalid score value"
            return data["score"], data["classification"], data["reason"]
        except json.JSONDecodeError as e:
            log.warning("score.json_error", company=company_name, error=str(e), raw=raw[:200])
            return 0, "cold", "JSON parse error"
    except anthropic.APIError as e:
        log.error("score.api_error", company=company_name, error=str(e), status=getattr(e, "status_code", None))
        raise ValueError(f"Claude API error during scoring: {str(e)}")
    except Exception as e:
        log.error("score.unexpected_error", company=company_name, error=str(e), exc_info=True)
        raise ValueError(f"Unexpected error during scoring: {str(e)}")


def company_to_lead(
    company: dict,
    score: int,
    classification: str,
    reason: str,
    client_id: UUID,
) -> dict:
    """Convert extracted company to leads table schema."""
    linkedin_summary_parts = []
    if company.get("description"):
        linkedin_summary_parts.append(company["description"])
    if company.get("trigger_signals"):
        linkedin_summary_parts.append("Señales: " + ", ".join(company["trigger_signals"]))

    return {
        "id": str(uuid4()),
        "client_id": str(client_id),
        "company_name": company.get("company_name", "").strip(),
        "company_website": company.get("company_website") or None,
        "linkedin_url": company.get("linkedin_url") or None,
        "email": None,
        "first_name": company.get("key_person_name") or None,
        "title": company.get("key_person_title") or None,
        "industry": company.get("industry") or None,
        "geography": company.get("geography") or None,
        "linkedin_summary": " | ".join(linkedin_summary_parts) or None,
        "trigger_event": ", ".join(company.get("trigger_signals", [])) or None,
        "source": "tavily_discovery",
        "stage": "prospected",
        "hot_score": score,
        "notes": f"[Score: {score} — {classification}] {reason}",
    }


def dedup_companies(companies: list[dict]) -> list[dict]:
    """Remove duplicates by normalized company_name."""
    seen: set[str] = set()
    unique = []
    for c in companies:
        key = c.get("company_name", "").lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(c)
    return unique


async def upsert_supabase(db: AsyncClient, leads: list[dict]) -> int:
    """Upsert leads to Supabase with error handling and validation."""
    if not leads:
        return 0

    inserted = 0
    for lead in leads:
        company_name = lead.get("company_name", "Unknown")
        try:
            # Validate required fields
            if not company_name:
                log.warning("supabase.missing_company_name", lead_id=lead.get("id"))
                continue
            if not lead.get("client_id"):
                log.warning("supabase.missing_client_id", company=company_name)
                continue

            await db.table("leads").upsert([lead], ignore_duplicates=False).execute()
            inserted += 1
            log.debug("supabase.lead_upserted", company=company_name, lead_id=lead.get("id"))
        except Exception as e:
            log.error("supabase.upsert_failed", company=company_name, lead_id=lead.get("id"), error=str(e), exc_info=True)

    log.info("supabase.batch_complete", total=len(leads), inserted=inserted)
    return inserted


async def sync_notion(leads: list[dict], notion_api_key: str, db_id: str) -> int:
    """Sync leads to Notion database with error handling."""
    if not notion_api_key or not db_id:
        log.warning("notion.credentials_missing")
        return 0

    if not leads:
        return 0

    headers = {
        "Authorization": f"Bearer {notion_api_key}",
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
                props: dict = {
                    "Nombre": {"title": [{"text": {"content": company_name}}]},
                    "Stage": {"select": {"name": lead.get("stage", "prospected")}},
                    "Score": {"number": lead.get("hot_score", 0)},
                }
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
                        content=json.dumps({"parent": {"database_id": db_id}, "properties": props}),
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


async def run_discovery(
    client_id: UUID,
    icp_id: UUID,
    db: AsyncClient,
    geo_filter: str | None = None,
) -> tuple[UUID, dict]:
    """Execute full discovery pipeline: Tavily → extraction → scoring → Supabase → Notion."""
    run_id = uuid4()
    start_time = datetime.utcnow()

    try:
        # Load environment and credentials
        settings = get_settings()
        tavily_key = os.environ.get("TAVILY_API_KEY", "")
        if not tavily_key:
            log.error("missing_env", var="TAVILY_API_KEY")
            raise ValueError("TAVILY_API_KEY not configured")

        # Fetch client slug from Supabase (for loading ICP)
        # For now, hardcode to sf-internal; later query icp_profiles table
        client_slug = "sf-internal"

        # Load ICP
        icp = load_client_icp(client_slug)
        queries = build_queries(icp, geo_filter)

        log.info(
            "discovery.start",
            run_id=str(run_id),
            client_id=str(client_id),
            queries=len(queries),
            geo_filter=geo_filter or "all",
        )

        # Tavily search phase
        ai = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        all_companies: list[dict] = []

        for i, query in enumerate(queries):
            log.info("query", run_id=str(run_id), n=i + 1, total=len(queries), q=query[:70])
            try:
                results = await tavily_search(tavily_key, query)
                companies = await extract_companies(ai, results, query)
                all_companies.extend(companies)
            except Exception as e:
                log.warning("query.failed", query=query[:50], error=str(e))
                continue

        # Deduplication
        unique = dedup_companies(all_companies)
        log.info("dedup.done", run_id=str(run_id), before=len(all_companies), after=len(unique))

        # Scoring phase
        leads: list[dict] = []
        score_dist: dict[str, int] = {"hot": 0, "warm": 0, "cold": 0, "disqualify": 0}

        for i, company in enumerate(unique):
            if not company.get("company_name"):
                continue
            try:
                score, classification, reason = await score_company(ai, company)
                score_dist[classification] = score_dist.get(classification, 0) + 1
                lead = company_to_lead(company, score, classification, reason, client_id)
                leads.append(lead)
                log.info(
                    "scored",
                    run_id=str(run_id),
                    n=i + 1,
                    name=company["company_name"],
                    score=score,
                    cls=classification,
                )
            except Exception as e:
                log.warning("score.failed", name=company.get("company_name"), error=str(e))

        log.info("score.distribution", run_id=str(run_id), **score_dist)

        # Persistence phase
        if leads:
            inserted = await upsert_supabase(db, leads)
            log.info("supabase.done", run_id=str(run_id), inserted=inserted)

            # Notion sync (optional)
            notion_key = os.environ.get("NOTION_API_KEY", "")
            notion_db = os.environ.get("NOTION_VBS_DATABASE_ID", "")
            if notion_key and notion_db:
                notion_created = await sync_notion(leads, notion_key, notion_db)
                if notion_created:
                    log.info("notion.done", run_id=str(run_id), created=notion_created)

        finish_time = datetime.utcnow()
        duration = int((finish_time - start_time).total_seconds())

        # Record run metadata
        run_metadata = {
            "id": str(run_id),
            "client_id": str(client_id),
            "icp_id": str(icp_id),
            "sources_used": ["tavily"],
            "leads_found": len(unique),
            "leads_scored": len(leads),
            "hot_count": score_dist.get("hot", 0),
            "warm_count": score_dist.get("warm", 0),
            "cold_count": score_dist.get("cold", 0),
            "disqualified_count": score_dist.get("disqualify", 0),
            "total_cost_usd": None,  # TODO: compute from Tavily API cost
            "duration_seconds": duration,
            "started_at": start_time.isoformat(),
            "finished_at": finish_time.isoformat(),
        }

        await db.table("discovery_runs").insert([run_metadata]).execute()
        log.info(
            "discovery.complete",
            run_id=str(run_id),
            queries_run=len(queries),
            companies_found=len(unique),
            leads_scored=len(leads),
            hot=score_dist.get("hot", 0),
            warm=score_dist.get("warm", 0),
        )

        return run_id, run_metadata

    except Exception as e:
        log.error("discovery.failed", run_id=str(run_id), error=str(e), exc_info=True)
        # Record error in discovery_runs
        try:
            await db.table("discovery_runs").insert(
                [
                    {
                        "id": str(run_id),
                        "client_id": str(client_id),
                        "icp_id": str(icp_id),
                        "error": str(e),
                        "started_at": start_time.isoformat(),
                    }
                ]
            ).execute()
        except Exception as db_error:
            log.error("discovery.error_logging_failed", error=str(db_error))
        raise


@router.post("/run", response_model=DiscoveryRunResponse)
async def trigger_discovery_run(
    req: DiscoveryRunRequest,
    db: AsyncClient = Depends(get_supabase),
) -> DiscoveryRunResponse:
    """Trigger a discovery run for the client.

    Validates client_id and icp_id exist before processing.
    Runs synchronously (TODO: enqueue in Arq for background processing).
    Returns run_id immediately, then executes discovery pipeline.
    """
    # Validate client_id and icp_id
    if not req.client_id or not req.icp_id:
        log.warning("discovery.invalid_params", client_id=str(req.client_id), icp_id=str(req.icp_id))
        raise HTTPException(
            status_code=422,
            detail="client_id and icp_id are required and must be valid UUIDs"
        )

    log.info("discovery.run.triggered", client_id=str(req.client_id), icp_id=str(req.icp_id))

    try:
        run_id, metadata = await run_discovery(
            client_id=req.client_id,
            icp_id=req.icp_id,
            db=db,
            geo_filter=req.geo_filter,
        )
        return DiscoveryRunResponse(
            run_id=run_id,
            status="completed",
            message=f"Discovery run completed. Found {metadata['leads_found']} companies, "
            f"scored {metadata['leads_scored']} leads. "
            f"Hot: {metadata['hot_count']}, Warm: {metadata['warm_count']}.",
        )
    except ValueError as e:
        log.error("discovery.validation_error", client_id=str(req.client_id), error=str(e))
        raise HTTPException(status_code=400, detail=f"Invalid request: {str(e)}")
    except Exception as e:
        log.error("discovery.endpoint_error", client_id=str(req.client_id), error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Discovery run failed: {str(e)}")


@router.get("/runs", response_model=list[DiscoveryRunSummary])
async def list_discovery_runs(
    client_id: UUID,
    limit: int = 20,
    db: AsyncClient = Depends(get_supabase),
) -> list[Any]:
    """Lista los últimos discovery runs de un cliente con validación y error handling."""
    if not client_id:
        log.warning("discovery.list.missing_client_id")
        raise HTTPException(status_code=422, detail="client_id is required")

    if limit < 1 or limit > 100:
        log.warning("discovery.list.invalid_limit", limit=limit)
        raise HTTPException(status_code=422, detail="limit must be between 1 and 100")

    try:
        result = (
            await db.table("discovery_runs")
            .select("*")
            .eq("client_id", str(client_id))
            .order("started_at", desc=True)
            .limit(limit)
            .execute()
        )
        log.info("discovery.list.success", client_id=str(client_id), count=len(result.data or []))
        return result.data or []
    except Exception as e:
        log.error("discovery.list.error", client_id=str(client_id), error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list discovery runs: {str(e)}")
