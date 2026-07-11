"""
Genera icebreakers ultrapersonalizados con Claude Sonnet para los hot leads.
Los guarda en Supabase (campo icebreaker_used) y actualiza Notion.

Uso:
    uv run python scripts/generate_icebreakers.py [--dry-run] [--limit N]
"""
import asyncio
import json
import os
import sys
from pathlib import Path

import anthropic
import httpx
import structlog

log = structlog.get_logger()

SONNET = "claude-sonnet-4-6"
SF_CLIENT_ID = "00000000-0000-0000-0000-000000000001"

ICEBREAKER_PROMPT = """\
Eres un experto en ventas B2B consultivo de alto nivel. Escribe las primeras 2 oraciones
de un cold email para este Venture Builder / inversor.

CONTEXTO DE SF:
Startup Factory es una agencia de IA que ayuda a las startups del portafolio de Venture
Builders a escalar su adquisición de clientes B2B. No competimos con los VBs —
somos su partner de crecimiento para las startups que construyen.

DATOS DEL PROSPECT:
- Nombre: {company}
- Sector de inversión: {sector}
- Fases: {phases}
- Descripción: {description}
- Geografía: {geography}

REGLAS ABSOLUTAS:
- MÁXIMO 2 oraciones, 45 palabras en total
- Referencia algo CONCRETO y ESPECÍFICO del prospect (su sector, su modelo, sus fases)
- NO uses: "vi tu empresa en LinkedIn", "creo que podemos ayudarte", "me pongo en contacto"
- Tono: directo, peer-to-peer, sin corporativo
- Escribe en español de España (tú, no vos)
- Termina con una pregunta o hook que invite a responder
- NO incluyas saludo ni firma, solo las 2 oraciones

Ejemplos de tono correcto:
"Lleváis años construyendo startups en el espacio fintech — curioso cómo estáis resolviendo
la parte de adquisición B2B para las que están en fase pre-PMF. ¿Es algo que os estáis
planteando escalar de forma sistemática?"

"Vi que vuestro portfolio se concentra en corporate innovation. La parte que más les cuesta
a esas startups suele ser el outbound B2B una vez que el piloto corporativo termina.
¿Cómo lo estáis abordando ahora mismo?"

Genera el icebreaker para {company}:"""


def load_env():
    env = Path(__file__).parent.parent / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


async def get_hot_leads() -> list[dict]:
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    async with httpx.AsyncClient(base_url=url, headers=headers) as client:
        r = await client.get(
            "/rest/v1/leads",
            params={
                "client_id": f"eq.{SF_CLIENT_ID}",
                "hot_score": "gte.75",
                "select": "id,company_name,industry,geography,linkedin_summary,trigger_event,icebreaker_used",
                "order": "hot_score.desc",
            },
        )
        r.raise_for_status()
        return r.json()


async def save_icebreaker(lead_id: str, text: str) -> None:
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    headers = {
        "apikey": key, "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    async with httpx.AsyncClient(base_url=url, headers=headers) as client:
        r = await client.patch(
            f"/rest/v1/leads?id=eq.{lead_id}",
            content=json.dumps({"icebreaker_used": text}),
        )
        r.raise_for_status()


async def generate_icebreaker(client: anthropic.AsyncAnthropic, lead: dict) -> str:
    description = (lead.get("linkedin_summary") or "")[:300]
    sector = lead.get("industry") or "Venture Building"
    phases = lead.get("trigger_event") or "Pre-seed / Seed"
    geo = (lead.get("geography") or "España").split(" — ")[0]

    prompt = ICEBREAKER_PROMPT.format(
        company=lead["company_name"],
        sector=sector,
        phases=phases,
        description=description,
        geography=geo,
    )

    msg = await client.messages.create(
        model=SONNET,
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()  # type: ignore[index]


async def main(dry_run: bool, limit: int | None, overwrite: bool) -> None:
    leads = await get_hot_leads()

    if not overwrite:
        leads = [l for l in leads if not l.get("icebreaker_used")]

    if limit:
        leads = leads[:limit]

    log.info("icebreakers.start", total=len(leads), dry_run=dry_run, overwrite=overwrite)

    client = anthropic.AsyncAnthropic()
    results = []

    for i, lead in enumerate(leads):
        try:
            ice = await generate_icebreaker(client, lead)
            results.append({"company": lead["company_name"], "icebreaker": ice})

            log.info("generated", n=i + 1, company=lead["company_name"])
            print(f"\n{'─'*60}")
            print(f"🏢 {lead['company_name']}")
            print(f"✉️  {ice}")

            if not dry_run:
                await save_icebreaker(lead["id"], ice)
                log.info("saved", company=lead["company_name"])

        except Exception as e:
            log.error("failed", company=lead["company_name"], error=str(e))

    print(f"\n\n{'═'*60}")
    print(f"✅ {len(results)}/{len(leads)} icebreakers generados")
    if dry_run:
        print("⚠️  Dry-run: no se guardó nada en Supabase")
    else:
        print("✓  Guardados en Supabase (campo icebreaker_used)")


if __name__ == "__main__":
    import argparse
    load_env()

    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--overwrite", action="store_true", help="Regenera aunque ya tengan icebreaker")
    args = parser.parse_args()

    asyncio.run(main(dry_run=args.dry_run, limit=args.limit, overwrite=args.overwrite))
