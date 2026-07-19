"""Direct Telegram Bot API calls — replaces the old n8n `ops/telegram-alerts` workflow.

One HTTP hop instead of a webhook → n8n → Telegram Bot node chain. Degrades to a
no-op log line when TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID aren't configured, so
callers never need to guard for missing credentials themselves.
"""
import httpx
import structlog

from api.deps import Settings

log = structlog.get_logger()

TELEGRAM_API_BASE = "https://api.telegram.org"
API_TIMEOUT = 10.0


async def send_telegram_alert(settings: Settings, text: str) -> bool:
    """Send a Markdown-formatted message to the configured alert chat.

    Returns True if the message was sent, False if credentials are missing
    or the Telegram API call failed (both are logged, neither raises —
    a failed alert must never take down the caller's actual work).
    """
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        log.warning("telegram.not_configured", text=text[:100])
        return False

    url = f"{TELEGRAM_API_BASE}/bot{settings.telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": settings.telegram_chat_id,
        "text": text,
        "parse_mode": "Markdown",
    }

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            r = await client.post(url, json=payload)
            if r.status_code == 200:
                log.info("telegram.sent", chat_id=settings.telegram_chat_id)
                return True
            log.error("telegram.send_failed", status=r.status_code, response=r.text[:200])
            return False
    except httpx.RequestError as e:
        log.error("telegram.request_error", error=str(e))
        return False
