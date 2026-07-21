from functools import lru_cache

from fastapi import Header, HTTPException
from pydantic_settings import BaseSettings

from supabase import AsyncClient, create_async_client


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    anthropic_api_key: str
    redis_url: str = "redis://localhost:6379"
    environment: str = "development"

    # Shared secret for the business routers (discovery, leads, icebreaker,
    # outreach). Callers (MIRA, sf-crm) send it as `X-API-Key`.
    api_key: str | None = None

    # Optional — power the direct-call replacements for what n8n used to do.
    # Features degrade gracefully (log + skip) when these are unset.
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    instantly_api_key: str | None = None
    webhook_secret: str | None = None  # shared secret for /webhooks/* endpoints

    class Config:
        env_file = ".env"
        # El .env del monorepo también contiene claves de los scrapers
        # (APOLLO_API_KEY, HUNTER_API_KEY, …) que no son campos de Settings.
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Router-level guard: validate `X-API-Key` on every business endpoint.

    Fail-closed outside development: if API_KEY is not configured the API
    refuses to serve rather than running open to the internet.
    """
    settings = get_settings()
    if not settings.api_key:
        if settings.environment == "development":
            return
        raise HTTPException(status_code=503, detail="API key not configured")
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


async def get_supabase() -> AsyncClient:
    settings = get_settings()
    return await create_async_client(settings.supabase_url, settings.supabase_service_key)
