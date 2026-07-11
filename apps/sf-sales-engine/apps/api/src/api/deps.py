from functools import lru_cache

from pydantic_settings import BaseSettings
from supabase import AsyncClient, create_async_client


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    anthropic_api_key: str
    redis_url: str = "redis://localhost:6379"
    environment: str = "development"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


async def get_supabase() -> AsyncClient:
    settings = get_settings()
    return await create_async_client(settings.supabase_url, settings.supabase_service_key)
