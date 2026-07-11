"""
Carga los Venture Builders desde data/seed/venture_builders_enriched.csv
a Supabase (tabla leads) + scoring con Claude Haiku + Notion sync opcional.

Uso:
    make seed-vbs
    uv run python scripts/seed_vbs.py [--dry-run] [--skip-scoring] [--limit N]

Requiere en .env:
    SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
    NOTION_API_KEY + NOTION_VBS_DATABASE_ID  (solo si notion_sync.enabled=true)
"""
import argparse
import asyncio
import csv
import json
import os
import sys
import uuid
from pathlib import Path

import anthropic
import httpx
import structlog

log = structlog.get_logger()

CSV_PATH = Path(__file__).parent.parent / "data" / "seed" / "venture_builders_enriched.csv"
SF_CLIENT_ID = "00000000-0000-0000-0000-000000000001"
HAIKU_MODEL = "claude-haiku-4-5-20251001"

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


def load_csv() -> list[dict]:
    """Lee el CSV y filtra los no encontrados."""
    if not CSV_PATH.exists():
        log.error("csv.not_found", path=str(CSV_PATH))
        sys.exit(1)

    with open(CSV_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    total = len(rows)
    # Filtrar no encontrados
    valid = [r for r in rows if "no encontrado" not in r.get("Notas", "").lower()
             and r.get("Inversor", "").strip()]
    skipped = total - len(valid)
    log.info("csv.loaded", total=total, valid=len(valid), skipped=skipped)
    return valid


def row_to_lead(row: dict) -> dict:
    """Mapea una fila del CSV al esquema de la tabla leads."""
    geo_parts = [p for p in [row.get("Geografía", ""), row.get("HQ Country", "")] if p]
    geography = " — ".join(dict.fromkeys(geo_parts))  # dedup si son iguales

    notes_parts = []
    if row.get("Próxima acción"):
        notes_parts.append(f"Acción: {row['Próxima acción']}")
    if row.get("Notas"):
        notes_parts.append(row["Notas"])

    return {
        "id": str(uuid.uuid4()),
        "client_id": SF_CLIENT_ID,
        "company_name": row.get("Inversor", "").strip(),
        "company_website": row.get("Web", "").strip() or None,
        "email": row.get("Email", "").strip() or None,
        "linkedin_url": row.get("LinkedIn", "").strip() or None,
        "industry": row.get("Sectores interés", "").strip() or row.get("Tipo", ""),
        "geography": geography or None,
        "linkedin_summary": row.get("Descripción", "").strip() or None,
        "trigger_event": row.get("Ticket/Fases", "").strip() or None,
        "source": "csv_vbs",
        "stage": "prospected",
        "assigned_to": row.get("Owner sugerido", "").strip() or None,
        "notes": " | ".join(notes_parts) if notes_parts else None,
        "hot_score": 0,
    }


async def score_lead(client: anthropic.AsyncAnthropic, row: dict) -> tuple[int, str, str]:
    """Scorea un VB contra el ICP de SF. Retorna (score, classification, reason)."""
    prompt = SCORE_PROMPT.format(
        icp=ICP_CONTEXT,
        name=row.get("Inversor", ""),
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
    text = msg.content[0].text.strip()  # type: ignore[index]
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    raw = json.loads(text.strip())
    return raw["score"], raw["classification"], raw["reason"]


async def upsert_supabase(leads: list[dict]) -> int:
    """Inserta/actualiza leads en Supabase. Retorna count insertados."""
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not url or not key:
        log.error("supabase.missing_env", vars=["SUPABASE_URL", "SUPABASE_SERVICE_KEY"])
        return 0

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    async with httpx.AsyncClient(base_url=url, headers=headers, timeout=30) as client:
        # Upsert por company_name + client_id (evita duplicados al re-ejecutar)
        r = await client.post(
            "/rest/v1/leads",
            content=json.dumps(leads),
            headers={"Prefer": "resolution=merge-duplicates,return=representation"},
        )
        if r.status_code not in (200, 201):
            log.error("supabase.upsert_failed", status=r.status_code, body=r.text[:300])
            return 0
        return len(r.json())


async def sync_notion(leads: list[dict]) -> int:
    """Sincroniza leads a Notion si está configurado."""
    api_key = os.environ.get("NOTION_API_KEY", "")
    db_id = os.environ.get("NOTION_VBS_DATABASE_ID", "")

    if not api_key or not db_id:
        log.info("notion.skip", reason="NOTION_API_KEY o NOTION_VBS_DATABASE_ID no configurados")
        return 0

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }

    created = 0
    async with httpx.AsyncClient(base_url="https://api.notion.com/v1", headers=headers, timeout=30) as client:
        for lead in leads:
            props: dict = {
                "Nombre": {"title": [{"text": {"content": lead["company_name"]}}]},
                "Stage": {"select": {"name": lead["stage"]}},
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

            r = await client.post("/pages", content=json.dumps({
                "parent": {"database_id": db_id},
                "properties": props,
            }))
            if r.status_code == 200:
                created += 1
            else:
                log.warning("notion.page_failed", name=lead["company_name"], status=r.status_code)

    return created


async def main(dry_run: bool, skip_scoring: bool, limit: int | None) -> None:
    rows = load_csv()
    if limit:
        rows = rows[:limit]

    anthropic_client = anthropic.AsyncAnthropic() if not skip_scoring else None
    leads: list[dict] = []
    score_dist: dict[str, int] = {"hot": 0, "warm": 0, "cold": 0, "disqualify": 0}

    for i, row in enumerate(rows):
        lead = row_to_lead(row)

        if not skip_scoring and anthropic_client:
            try:
                score, classification, reason = await score_lead(anthropic_client, row)
                lead["hot_score"] = score
                lead["notes"] = f"[Score: {score} — {classification}] {reason}" + (
                    f" | {lead['notes']}" if lead.get("notes") else ""
                )
                score_dist[classification] = score_dist.get(classification, 0) + 1
                log.info("scored", n=i + 1, name=row["Inversor"], score=score, cls=classification)
            except Exception as e:
                log.warning("score.failed", name=row["Inversor"], error=str(e))
                lead["hot_score"] = 0

        leads.append(lead)

    # Mostrar distribución de scores
    if not skip_scoring:
        log.info("score.distribution", **score_dist)
        hot_leads = [l for l in leads if l.get("hot_score", 0) >= 75]
        if hot_leads:
            log.info("hot_leads", count=len(hot_leads),
                     names=[l["company_name"] for l in hot_leads])

    if dry_run:
        log.info("dry_run.complete", would_insert=len(leads))
        for l in leads[:5]:
            print(f"  {l['company_name']:30} score={l['hot_score']:3} {l['geography'] or ''}")
        return

    # Upsert en Supabase
    inserted = await upsert_supabase(leads)
    log.info("supabase.done", inserted=inserted)

    # Sync a Notion
    notion_created = await sync_notion(leads)
    if notion_created:
        log.info("notion.done", created=notion_created)

    log.info("seed.complete", total=len(leads), supabase=inserted, notion=notion_created)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Venture Builders a Supabase + Notion")
    parser.add_argument("--dry-run", action="store_true", help="Muestra qué haría sin insertar")
    parser.add_argument("--skip-scoring", action="store_true", help="Salta el scoring con Haiku")
    parser.add_argument("--limit", type=int, help="Procesa solo N filas (para testing)")
    args = parser.parse_args()

    # Cargar .env si existe
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

    asyncio.run(main(dry_run=args.dry_run, skip_scoring=args.skip_scoring, limit=args.limit))
