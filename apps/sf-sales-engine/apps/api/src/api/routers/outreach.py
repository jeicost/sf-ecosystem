"""Outbound send + proposal generation — replaces two n8n workflows:

  - workflows/outreach/instantly-campaign-launcher.json → POST /outreach/send/{lead_id}
  - workflows/proposals/call-brief-to-proposal.json     → POST /outreach/generate-proposal

Both are direct Claude/Instantly calls from FastAPI, same pattern as the rest
of this API — no queue, no Telegram-approval node graph. Neither n8n workflow
was ever deployed; these are the first real implementations.
"""
from uuid import UUID

import anthropic
import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.deps import Settings, get_settings, get_supabase
from api.integrations.instantly import InstantlyNotConfiguredError, add_lead_to_campaign
from api.integrations.telegram import send_telegram_alert
from supabase import AsyncClient

log = structlog.get_logger()
router = APIRouter()

SONNET_MODEL = "claude-sonnet-4-6"

PROPOSAL_PROMPT = """\
Eres un consultor senior de Startup Factory redactando una propuesta comercial B2B.

BRIEF DE LA LLAMADA:
{call_brief}

CONTEXTO DE PROPUESTAS GANADAS SIMILARES (Commercial Brain):
{similar_proposals}

Redacta una propuesta comercial completa en español, con estas secciones:
1. Resumen del problema (2-3 líneas, en las palabras del prospect)
2. Solución propuesta (servicios concretos, no genéricos)
3. Alcance y entregables
4. Inversión estimada (usa rangos si no hay cifra exacta en el brief)
5. Próximos pasos

Tono: consultivo, directo, sin relleno corporativo. Máximo 500 palabras.
"""


class SendOutreachRequest(BaseModel):
    campaign_id: str


class SendOutreachResponse(BaseModel):
    lead_id: UUID
    sent: bool
    detail: str


@router.post("/send/{lead_id}", response_model=SendOutreachResponse)
async def send_outreach(
    lead_id: UUID,
    payload: SendOutreachRequest,
    settings: Settings = Depends(get_settings),
    db: AsyncClient = Depends(get_supabase),
) -> SendOutreachResponse:
    """Adds a lead to an Instantly campaign (Instantly then sends per the
    campaign's own sequence) and logs the send to outbound_log."""
    result = await db.table("leads").select(
        "id,email,first_name,last_name,company_name,icebreaker_used"
    ).eq("id", str(lead_id)).limit(1).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = result.data[0]
    if not lead.get("email"):
        raise HTTPException(status_code=422, detail="Lead has no email address")

    try:
        await add_lead_to_campaign(
            settings,
            campaign_id=payload.campaign_id,
            email=lead["email"],
            first_name=lead.get("first_name"),
            last_name=lead.get("last_name"),
            company_name=lead.get("company_name"),
        )
    except InstantlyNotConfiguredError as e:
        raise HTTPException(status_code=503, detail="Instantly integration not configured") from e
    except Exception as e:
        log.error("outreach.send_failed", lead_id=str(lead_id), error=str(e))
        raise HTTPException(status_code=502, detail=f"Instantly API error: {e}") from e

    await db.table("outbound_log").insert(
        {
            "lead_id": str(lead_id),
            "channel": "email",
            "body": lead.get("icebreaker_used") or "",
            "sent_at": "now()",
        }
    ).execute()

    await db.table("leads").update(
        {"stage": "contacted", "first_contact_at": "now()", "last_contact_at": "now()"}
    ).eq("id", str(lead_id)).execute()

    log.info("outreach.sent", lead_id=str(lead_id), campaign_id=payload.campaign_id)

    return SendOutreachResponse(
        lead_id=lead_id, sent=True, detail=f"Added to Instantly campaign {payload.campaign_id}"
    )


class GenerateProposalRequest(BaseModel):
    client_id: UUID
    prospect_company: str
    call_brief: str
    industry: str | None = None


class GenerateProposalResponse(BaseModel):
    proposal_id: UUID | None
    content: str


@router.post("/generate-proposal", response_model=GenerateProposalResponse)
async def generate_proposal(
    payload: GenerateProposalRequest,
    settings: Settings = Depends(get_settings),
    db: AsyncClient = Depends(get_supabase),
) -> GenerateProposalResponse:
    """Generates a proposal from a call brief using the Commercial Brain RAG
    pattern (top similar won proposals as context), saves it to
    `proposal_library` with outcome='pending'.

    Does NOT export to Google Docs (the old n8n workflow did) — that needs
    OAuth credentials not currently configured anywhere in this repo. The
    generated text is returned directly and saved to Supabase; wiring a Docs
    export is a follow-up once those credentials exist.
    """
    query = db.table("proposal_library").select(
        "raw_content,services_proposed,problem_solved"
    ).eq("client_id", str(payload.client_id)).eq("outcome", "won")

    if payload.industry:
        query = query.eq("prospect_industry", payload.industry)

    similar = await query.limit(3).execute()

    similar_text = "\n\n".join(
        f"- Problema: {p.get('problem_solved', 'N/A')} | Servicios: {', '.join(p.get('services_proposed') or [])}"
        for p in (similar.data or [])
    ) or "Sin propuestas previas similares."

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    message = await client.messages.create(
        model=SONNET_MODEL,
        max_tokens=1200,
        messages=[
            {
                "role": "user",
                "content": PROPOSAL_PROMPT.format(
                    call_brief=payload.call_brief, similar_proposals=similar_text
                ),
            }
        ],
    )
    content = message.content[0].text  # type: ignore[index]

    saved = await db.table("proposal_library").insert(
        {
            "client_id": str(payload.client_id),
            "prospect_industry": payload.industry,
            "raw_content": content,
            "outcome": "pending",
        }
    ).execute()

    proposal_id = saved.data[0]["id"] if saved.data else None

    await send_telegram_alert(
        settings,
        f"📄 Propuesta generada para *{payload.prospect_company}* — revisar antes de enviar.",
    )

    log.info("proposal.generated", client_id=str(payload.client_id), proposal_id=proposal_id)

    return GenerateProposalResponse(proposal_id=proposal_id, content=content)
