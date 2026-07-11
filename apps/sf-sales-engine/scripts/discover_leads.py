"""
Descubre leads nuevos desde internet usando Tavily + Claude Haiku.
Sin APIs de pago extra: Tavily free tier (1000 búsquedas/mes) + Anthropic (ya tienes).

Uso:
    uv run python scripts/discover_leads.py [--dry-run] [--limit N] [--geo España]

Flujo:
    ICP profile → queries Tavily → Claude extrae empresas → score → Supabase + Notion
"""
import argparse
import asyncio
import json
import os
import sys
import uuid
from pathlib import Path

import anthropic
import httpx
import structlog
import yaml

log = structlog.get_logger()

ROOT         = Path(__file__).parent.parent
ICP_PATH     = ROOT / "clients" / "sf-internal" / "icp-profile.yaml"
SF_CLIENT_ID = "00000000-0000-0000-0000-000000000001"
HAIKU_MODEL  = "claude-haiku-4-5-20251001"

# Términos de búsqueda por tipo de organización (complementan el ICP)
SEARCH_TERMS = [
    "venture builder",
    "startup studio",
    "aceleradora startups",
    "inversor startup B2B",
    "corporate innovation hub",
]

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


def load_icp() -> dict:
    with open(ICP_PATH) as f:
        return yaml.safe_load(f)


def build_queries(icp: dict, geo_filter: str | None = None) -> list[str]:
    """Genera queries Tavily cruzando términos × geografías del ICP."""
    geographies = icp.get("geographies", [])
    if geo_filter:
        geographies = [g for g in geographies if geo_filter.lower() in g.lower()]
        if not geographies:
            geographies = [geo_filter]

    queries = []
    for term in SEARCH_TERMS:
        for geo in geographies[:4]:  # máx 4 geos por término
            queries.append(f"{term} {geo} 2025 2026 contacto fundador CEO")

    # Queries adicionales de trigger events del ICP
    for trigger in icp.get("trigger_events", [])[:2]:
        queries.append(f"{trigger} España LATAM startup 2026")

    return queries


async def tavily_search(api_key: str, query: str, max_results: int = 8) -> list[dict]:
    """Llama a Tavily Search API."""
    async with httpx.AsyncClient(timeout=25) as client:
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
        if r.status_code != 200:
            log.warning("tavily.error", query=query[:50], status=r.status_code)
            return []
        return r.json().get("results", [])


async def extract_companies(
    ai: anthropic.AsyncAnthropic,
    results: list[dict],
    query: str,
) -> list[dict]:
    """Usa Claude Haiku para extraer empresas estructuradas de los resultados de Tavily."""
    if not results:
        return []

    results_text = "\n\n".join(
        f"[{i+1}] TÍTULO: {r.get('title', '')}\nURL: {r.get('url', '')}\nCONTENIDO: {r.get('content', '')[:400]}"
        for i, r in enumerate(results)
    )

    msg = await ai.messages.create(
        model=HAIKU_MODEL,
        max_tokens=2000,
        messages=[{"role": "user", "content": EXTRACT_PROMPT.format(results_text=results_text)}],
    )

    raw = msg.content[0].text.strip()  # type: ignore[index]
    # Strip markdown si Haiku lo añade
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        companies = json.loads(raw)
        if not isinstance(companies, list):
            return []
        log.info("extract.done", query=query[:50], found=len(companies))
        return companies
    except json.JSONDecodeError:
        log.warning("extract.json_error", query=query[:50], raw=raw[:100])
        return []


async def score_company(ai: anthropic.AsyncAnthropic, company: dict) -> tuple[int, str, str]:
    """Scorea una empresa contra el ICP."""
    prompt = SCORE_PROMPT.format(
        company_name=company.get("company_name", ""),
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
    raw = msg.content[0].text.strip()  # type: ignore[index]
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    data = json.loads(raw.strip())
    return data["score"], data["classification"], data["reason"]


def company_to_lead(company: dict, score: int, classification: str, reason: str) -> dict:
    """Convierte una empresa extraída al esquema de la tabla leads."""
    linkedin_summary_parts = []
    if company.get("description"):
        linkedin_summary_parts.append(company["description"])
    if company.get("trigger_signals"):
        linkedin_summary_parts.append("Señales: " + ", ".join(company["trigger_signals"]))

    return {
        "id": str(uuid.uuid4()),
        "client_id": SF_CLIENT_ID,
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
    """Elimina duplicados por company_name normalizado."""
    seen: set[str] = set()
    unique = []
    for c in companies:
        key = c.get("company_name", "").lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(c)
    return unique


async def upsert_supabase(leads: list[dict]) -> int:
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        log.error("supabase.missing_env")
        return 0

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }
    inserted = 0
    async with httpx.AsyncClient(base_url=url, headers=headers, timeout=30) as client:
        for lead in leads:
            r = await client.post(
                "/rest/v1/leads",
                content=json.dumps([lead]),
                params={"on_conflict": "company_name,client_id"},
            )
            if r.status_code in (200, 201):
                inserted += 1
            else:
                log.warning("supabase.skip", name=lead["company_name"], status=r.status_code)
    return inserted


async def sync_notion(leads: list[dict]) -> int:
    api_key = os.environ.get("NOTION_API_KEY", "")
    db_id   = os.environ.get("NOTION_VBS_DATABASE_ID", "")
    if not api_key or not db_id:
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
                "Stage":  {"select": {"name": lead["stage"]}},
                "Score":  {"number": lead.get("hot_score", 0)},
            }
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


async def main(dry_run: bool, limit: int | None, geo_filter: str | None) -> None:
    # Cargar env
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_key:
        log.error("missing_env", var="TAVILY_API_KEY")
        sys.exit(1)

    icp      = load_icp()
    queries  = build_queries(icp, geo_filter)
    ai       = anthropic.AsyncAnthropic()

    log.info("discovery.start", queries=len(queries), geo_filter=geo_filter or "all")

    all_companies: list[dict] = []

    for i, query in enumerate(queries):
        log.info("query", n=i + 1, total=len(queries), q=query[:70])
        try:
            results   = await tavily_search(tavily_key, query)
            companies = await extract_companies(ai, results, query)
            all_companies.extend(companies)
        except Exception as e:
            log.warning("query.failed", query=query[:50], error=str(e))
            continue

    # Dedup por nombre
    unique = dedup_companies(all_companies)
    log.info("dedup.done", before=len(all_companies), after=len(unique))

    if limit:
        unique = unique[:limit]

    # Score + build leads
    leads: list[dict] = []
    score_dist: dict[str, int] = {"hot": 0, "warm": 0, "cold": 0, "disqualify": 0}

    for i, company in enumerate(unique):
        if not company.get("company_name"):
            continue
        try:
            score, classification, reason = await score_company(ai, company)
            score_dist[classification] = score_dist.get(classification, 0) + 1
            lead = company_to_lead(company, score, classification, reason)
            leads.append(lead)
            log.info(
                "scored",
                n=i + 1,
                name=company["company_name"],
                score=score,
                cls=classification,
            )
        except Exception as e:
            log.warning("score.failed", name=company.get("company_name"), error=str(e))

    log.info("score.distribution", **score_dist)

    hot_leads = [l for l in leads if l.get("hot_score", 0) >= 75]
    if hot_leads:
        log.info("hot_leads_found", count=len(hot_leads),
                 names=[l["company_name"] for l in hot_leads])

    if dry_run:
        log.info("dry_run.complete", would_insert=len(leads))
        print("\n--- PREVIEW (primeros 10) ---")
        for l in leads[:10]:
            score = l.get("hot_score", 0)
            flag  = "🔴" if score >= 75 else "🟡" if score >= 50 else "⚪"
            print(f"  {flag} {l['company_name']:35} {score:3}  {l.get('geography') or '':20}  {l.get('industry') or ''}")
        return

    # Upsert Supabase
    if leads:
        inserted = await upsert_supabase(leads)
        log.info("supabase.done", inserted=inserted)

        notion_created = await sync_notion(leads)
        if notion_created:
            log.info("notion.done", created=notion_created)

    log.info(
        "discovery.complete",
        queries_run=len(queries),
        companies_found=len(unique),
        leads_scored=len(leads),
        hot=score_dist.get("hot", 0),
        warm=score_dist.get("warm", 0),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Descubre leads nuevos con Tavily + Claude")
    parser.add_argument("--dry-run",  action="store_true", help="Muestra resultados sin guardar")
    parser.add_argument("--limit",    type=int,             help="Procesa solo N empresas (para test)")
    parser.add_argument("--geo",      type=str,             help="Filtra por geografía (ej: España)")
    args = parser.parse_args()

    asyncio.run(main(dry_run=args.dry_run, limit=args.limit, geo_filter=args.geo))
