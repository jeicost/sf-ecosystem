"""Reactive endpoints that replace n8n's Realtime/webhook-triggered workflows.

Both routes below are the direct-call replacement for:
  - workflows/data-pipeline/hot-lead-alert.json  (Supabase Realtime → Telegram → icebreaker)
  - workflows/qualification/reply-classifier.json (Instantly webhook → Haiku → stage update)

Neither n8n workflow was ever deployed (see git history / CLAUDE.md note). This
collapses each multi-node n8n graph into one FastAPI endpoint + one Claude call,
matching the direct-call pattern MIRA already uses (no queue, no orchestrator).

Setup (once endpoints are deployed):
  - Supabase Dashboard → Database → Webhooks → new webhook on `leads`,
    event INSERT, condition `hot_score >= 75`, target this API's
    POST /webhooks/hot-lead. Same REPLICA IDENTITY FULL on `leads` that used
    to feed n8n's Realtime listener works unchanged for Database Webhooks.
  - Instantly campaign → reply webhook → POST /webhooks/instantly-reply.
Both routes require `X-Webhook-Secret` to match WEBHOOK_SECRET when configured.
"""
import json
from typing import Any

import anthropic
import structlog
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from api.deps import Settings, get_settings, get_supabase
from api.integrations.telegram import send_telegram_alert
from api.routers.icebreaker import _generate_icebreaker_text
from supabase import AsyncClient

log = structlog.get_logger()
router = APIRouter()

HAIKU_MODEL = "claude-haiku-4-5-20251001"

REPLY_CLASSIFY_PROMPT = """\
Eres un experto en calificación de respuestas de outreach B2B. Clasifica esta respuesta.

RESPUESTA DEL PROSPECT:
{reply_text}

Responde SOLO con este JSON (sin markdown):
{{"stage": "<qualified|replied|lost>", "reason": "<máximo 1 línea>"}}

Criterios:
- "qualified": muestra interés real, pide más info, quiere agendar llamada
- "replied": respuesta neutra/ambigua, no descarta pero tampoco confirma interés
- "lost": rechazo explícito, "no interesado", fuera de oficina permanente, unsubscribe
"""


def _check_webhook_secret(settings: Settings, provided: str | None) -> None:
    if settings.webhook_secret and provided != settings.webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")


class SupabaseWebhookPayload(BaseModel):
    """Shape Supabase Database Webhooks POST on row events."""
    type: str  # INSERT | UPDATE | DELETE
    table: str
    record: dict[str, Any]
    old_record: dict[str, Any] | None = None


@router.post("/hot-lead")
async def handle_hot_lead(
    payload: SupabaseWebhookPayload,
    x_webhook_secret: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    db: AsyncClient = Depends(get_supabase),
) -> dict:
    """Fires when Supabase's Database Webhook posts a new/updated hot lead.

    Sends a Telegram alert immediately and generates the icebreaker in the same
    request — no separate workflow hop needed, unlike the old n8n graph that
    chained hot-lead-alert.json → icebreaker-generator.json over two nodes.
    """
    _check_webhook_secret(settings, x_webhook_secret)

    lead = payload.record
    lead_id = lead.get("id")
    company = lead.get("company_name", "Unknown")
    score = lead.get("hot_score", 0)

    log.info("webhook.hot_lead.received", lead_id=lead_id, company=company, score=score)

    await send_telegram_alert(
        settings,
        f"🔥 *Hot lead*: {company} (score {score})\nGenerando icebreaker...",
    )

    icebreaker_text = ""
    try:
        anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        icebreaker_text = await _generate_icebreaker_text(anthropic_client, lead)

        await db.table("leads").update({"icebreaker_used": icebreaker_text}).eq(
            "id", lead_id
        ).execute()

        await send_telegram_alert(
            settings,
            f"✍️ Icebreaker para *{company}*:\n\n{icebreaker_text}\n\n"
            f"Revisar y enviar manualmente, o vía POST /outreach/send/{lead_id}.",
        )
    except Exception as e:
        log.error("webhook.hot_lead.icebreaker_failed", lead_id=lead_id, error=str(e))
        await send_telegram_alert(settings, f"⚠️ Fallo generando icebreaker para {company}: {e}")

    return {"lead_id": lead_id, "icebreaker_generated": bool(icebreaker_text)}


class InstantlyReplyPayload(BaseModel):
    """Generic shape for an inbound-reply webhook — verify field names against
    Instantly's actual webhook payload docs before relying on this in production."""
    lead_email: str
    reply_text: str
    campaign_id: str | None = None


@router.post("/instantly-reply")
async def handle_instantly_reply(
    payload: InstantlyReplyPayload,
    x_webhook_secret: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    db: AsyncClient = Depends(get_supabase),
) -> dict:
    """Classifies an inbound outreach reply and updates the lead's stage.

    Replaces workflows/qualification/reply-classifier.json — that workflow also
    referenced a sibling workflow (`vapi-call-scheduler.json`) that was never
    created in the repo; this endpoint does the one job it could actually do
    (classify + update stage) and stops there instead of chaining to nothing.
    """
    _check_webhook_secret(settings, x_webhook_secret)

    result = await db.table("leads").select("id,company_name,stage").eq(
        "email", payload.lead_email
    ).limit(1).execute()

    if not result.data:
        log.warning("webhook.instantly_reply.lead_not_found", email=payload.lead_email)
        raise HTTPException(status_code=404, detail="Lead not found for this email")

    lead = result.data[0]
    lead_id = lead["id"]

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    message = await client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=150,
        messages=[{"role": "user", "content": REPLY_CLASSIFY_PROMPT.format(reply_text=payload.reply_text)}],
    )
    classification = json.loads(message.content[0].text)  # type: ignore[index]
    new_stage = classification["stage"]

    await db.table("leads").update(
        {"stage": new_stage, "reply_received_at": "now()"}
    ).eq("id", lead_id).execute()

    await db.table("lead_activities").insert(
        {"lead_id": lead_id, "type": "email_replied", "content": payload.reply_text}
    ).execute()

    log.info(
        "webhook.instantly_reply.classified",
        lead_id=lead_id,
        stage=new_stage,
        reason=classification["reason"],
    )

    if new_stage == "qualified":
        await send_telegram_alert(
            settings,
            f"✅ *{lead['company_name']}* respondió y califica — {classification['reason']}",
        )

    return {"lead_id": lead_id, "stage": new_stage, "reason": classification["reason"]}
