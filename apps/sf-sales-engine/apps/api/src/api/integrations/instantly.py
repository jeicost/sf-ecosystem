"""Direct Instantly.ai API calls — replaces the old n8n
`outreach/instantly-campaign-launcher` workflow.

NOTE: Instantly's API surface changes between v1/v2 — verify the endpoint/payload
shape against https://developer.instantly.ai before relying on this in production.
Kept as a single function with a single request call so that verification/update
is a one-place change.
"""
import httpx
import structlog

from api.deps import Settings

log = structlog.get_logger()

INSTANTLY_API_BASE = "https://api.instantly.ai/api/v2"
API_TIMEOUT = 15.0


class InstantlyNotConfiguredError(Exception):
    """Raised when INSTANTLY_API_KEY is missing."""


async def add_lead_to_campaign(
    settings: Settings,
    campaign_id: str,
    email: str,
    first_name: str | None = None,
    last_name: str | None = None,
    company_name: str | None = None,
) -> dict:
    """Add a lead to an Instantly campaign — Instantly sends per the campaign's
    own sequence once the lead is added, so this call *is* "launching outreach"
    for that lead.

    Raises InstantlyNotConfiguredError if INSTANTLY_API_KEY isn't set — callers
    should catch this and surface a clear "not configured" response rather than
    a raw 500, same pattern as sf-crm's Resend integration.
    """
    if not settings.instantly_api_key:
        log.warning("instantly.not_configured", email=email)
        raise InstantlyNotConfiguredError("INSTANTLY_API_KEY not configured")

    payload = {
        "campaign": campaign_id,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "company_name": company_name,
    }

    async with httpx.AsyncClient(
        base_url=INSTANTLY_API_BASE,
        headers={"Authorization": f"Bearer {settings.instantly_api_key}"},
        timeout=API_TIMEOUT,
    ) as client:
        r = await client.post("/leads", json=payload)
        r.raise_for_status()
        log.info("instantly.lead_added", email=email, campaign_id=campaign_id)
        return r.json()
