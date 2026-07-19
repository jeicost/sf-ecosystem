"""
Icebreaker generation endpoint.

POST /icebreaker/generate → generates personalized icebreakers for hot leads
using Claude Sonnet. Updates leads.icebreaker_used in Supabase.
"""
import asyncio
import json
from uuid import UUID

import anthropic
import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.deps import get_settings, get_supabase
from supabase import AsyncClient

log = structlog.get_logger()
router = APIRouter()

SONNET = "claude-sonnet-4-6"

# Error handling constants
MAX_RETRIES = 3
RETRY_DELAY = 1.0  # seconds
API_TIMEOUT = 30.0  # seconds

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


class IcebreakerGenerateRequest(BaseModel):
    client_id: UUID
    lead_ids: list[str] | None = None


class IcebreakerResult(BaseModel):
    lead_id: str
    company: str
    icebreaker: str
    saved: bool


class IcebreakerGenerateResponse(BaseModel):
    total: int
    generated: int
    results: list[IcebreakerResult]


async def _get_hot_leads(
    db: AsyncClient, client_id: str, specific_lead_ids: list[str] | None = None
) -> list[dict]:
    """Fetch hot leads for a client with error handling."""
    try:
        query = db.table("leads").select(
            "id,company_name,industry,geography,linkedin_summary,trigger_event,icebreaker_used"
        )

        if specific_lead_ids:
            if not specific_lead_ids:
                log.warning("icebreaker.empty_lead_ids")
                return []
            # Build OR condition for specific lead IDs
            filters = " or ".join([f'id.eq."{lid}"' for lid in specific_lead_ids])
            query = query.filter(filters)
        else:
            # Default: fetch all hot leads (hot_score >= 75)
            query = query.eq("client_id", client_id).gte("hot_score", 75)

        result = await query.order("hot_score", desc=True).execute()
        log.info("icebreaker.leads_fetched", count=len(result.data or []), client_id=client_id)
        return result.data or []
    except Exception as e:
        log.error("icebreaker.fetch_error", client_id=client_id, error=str(e), exc_info=True)
        raise ValueError(f"Failed to fetch leads: {str(e)}")


async def _save_icebreaker(
    supabase_url: str, service_key: str, lead_id: str, icebreaker_text: str
) -> bool:
    """Save icebreaker to Supabase leads.icebreaker_used with retry logic."""
    if not supabase_url or not service_key:
        log.error("save_icebreaker.missing_credentials", lead_id=lead_id)
        return False

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(
                base_url=supabase_url, headers=headers, timeout=API_TIMEOUT
            ) as client:
                r = await client.patch(
                    f"/rest/v1/leads?id=eq.{lead_id}",
                    content=json.dumps({"icebreaker_used": icebreaker_text}),
                )
                if r.status_code in (200, 204):
                    return True
                elif r.status_code in (429, 503):
                    if attempt < MAX_RETRIES - 1:
                        log.warning("save_icebreaker.retry", lead_id=lead_id, status=r.status_code, attempt=attempt + 1)
                        await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                        continue
                    else:
                        log.error("save_icebreaker.max_retries", lead_id=lead_id, status=r.status_code)
                        return False
                else:
                    log.error("save_icebreaker.failed", lead_id=lead_id, status=r.status_code, response=r.text[:200])
                    return False
        except TimeoutError:
            log.warning("save_icebreaker.timeout", lead_id=lead_id, attempt=attempt + 1)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                continue
            return False
        except httpx.RequestError as e:
            log.warning("save_icebreaker.request_error", lead_id=lead_id, error=str(e), attempt=attempt + 1)
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
                continue
            return False
    return False


async def _generate_icebreaker_text(
    client: anthropic.AsyncAnthropic, lead: dict
) -> str:
    """Generate icebreaker using Claude Sonnet with error handling."""
    company_name = lead.get("company_name", "Unknown")
    try:
        description = (lead.get("linkedin_summary") or "")[:300]
        sector = lead.get("industry") or "Venture Building"
        phases = lead.get("trigger_event") or "Pre-seed / Seed"
        geo = (lead.get("geography") or "España").split(" — ")[0]

        prompt = ICEBREAKER_PROMPT.format(
            company=company_name,
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

        if not msg.content or not msg.content[0].text:
            log.warning("icebreaker.empty_response", company=company_name)
            raise ValueError("Empty response from Claude Sonnet")

        return msg.content[0].text.strip()
    except anthropic.APIError as e:
        log.error("icebreaker.api_error", company=company_name, error=str(e), status=getattr(e, "status_code", None))
        raise ValueError(f"Claude API error: {str(e)}")
    except Exception as e:
        log.error("icebreaker.generation_error", company=company_name, error=str(e), exc_info=True)
        raise ValueError(f"Failed to generate icebreaker: {str(e)}")


@router.post("/generate", response_model=IcebreakerGenerateResponse)
async def generate_icebreakers(
    req: IcebreakerGenerateRequest,
    db: AsyncClient = Depends(get_supabase),
) -> IcebreakerGenerateResponse:
    """
    Generate personalized icebreakers for hot leads.

    Validates client_id before processing.
    If lead_ids not provided, fetches all hot leads (hot_score >= 75) for the client.
    For each lead, generates icebreaker using Claude Sonnet and saves to Supabase.

    Returns summary of generation results.
    """
    # Validate client_id
    if not req.client_id:
        log.warning("icebreaker.invalid_client_id")
        raise HTTPException(status_code=422, detail="client_id is required")

    settings = get_settings()

    try:
        # Fetch leads
        leads = await _get_hot_leads(
            db, str(req.client_id), specific_lead_ids=req.lead_ids
        )
        log.info(
            "icebreaker.generate.start",
            client_id=str(req.client_id),
            total=len(leads),
            specific_ids=bool(req.lead_ids),
        )

        if not leads:
            log.info("icebreaker.no_leads", client_id=str(req.client_id))
            return IcebreakerGenerateResponse(total=0, generated=0, results=[])

        # Initialize Claude client
        if not settings.anthropic_api_key:
            log.error("icebreaker.missing_api_key")
            raise ValueError("Anthropic API key not configured")

        anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        results = []

        for i, lead in enumerate(leads):
            lead_id = lead.get("id", "unknown")
            company_name = lead.get("company_name", "Unknown")

            try:
                # Generate icebreaker
                icebreaker_text = await _generate_icebreaker_text(
                    anthropic_client, lead
                )
                log.info(
                    "icebreaker.generated",
                    n=i + 1,
                    company=company_name,
                    lead_id=lead_id,
                )

                # Save to Supabase
                saved = await _save_icebreaker(
                    settings.supabase_url,
                    settings.supabase_service_key,
                    lead_id,
                    icebreaker_text,
                )

                results.append(
                    IcebreakerResult(
                        lead_id=lead_id,
                        company=company_name,
                        icebreaker=icebreaker_text,
                        saved=saved,
                    )
                )

                if saved:
                    log.info("icebreaker.saved", lead_id=lead_id)
                else:
                    log.warning("icebreaker.save_failed", lead_id=lead_id)

            except ValueError as e:
                log.warning(
                    "icebreaker.generation_failed",
                    company=company_name,
                    lead_id=lead_id,
                    error=str(e),
                )
                results.append(
                    IcebreakerResult(
                        lead_id=lead_id,
                        company=company_name,
                        icebreaker="",
                        saved=False,
                    )
                )
            except Exception as e:
                log.error(
                    "icebreaker.unexpected_error",
                    company=company_name,
                    lead_id=lead_id,
                    error=str(e),
                    exc_info=True,
                )
                results.append(
                    IcebreakerResult(
                        lead_id=lead_id,
                        company=company_name,
                        icebreaker="",
                        saved=False,
                    )
                )

        generated_count = sum(1 for r in results if r.saved)
        log.info(
            "icebreaker.generate.complete",
            client_id=str(req.client_id),
            total=len(leads),
            generated=generated_count,
        )

        return IcebreakerGenerateResponse(
            total=len(leads), generated=generated_count, results=results
        )

    except ValueError as e:
        log.error("icebreaker.validation_error", client_id=str(req.client_id), error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log.error("icebreaker.generate.error", client_id=str(req.client_id), error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Icebreaker generation failed: {str(e)}")
