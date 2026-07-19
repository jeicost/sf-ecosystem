from functools import lru_cache

from pydantic_settings import BaseSettings

from supabase import AsyncClient, create_async_client


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    anthropic_api_key: str
    redis_url: str = "redis://localhost:6379"
    environment: str = "development"

    # Optional — power the direct-call replacements for what n8n used to do.
    # Features degrade gracefully (log + skip) when these are unset.
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    instantly_api_key: str | None = None
    webhook_secret: str | None = None  # shared secret for /webhooks/* endpoints

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


async def get_supabase() -> AsyncClient:
    settings = get_settings()
    return await create_async_client(settings.supabase_url, settings.supabase_service_key)
