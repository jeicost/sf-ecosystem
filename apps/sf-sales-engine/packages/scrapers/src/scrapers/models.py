from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, HttpUrl


class RawLead(BaseModel):
    """Datos crudos de una fuente externa antes del enriquecimiento."""
    first_name: str | None = None
    last_name: str | None = None
    title: str | None = None
    email: str | None = None
    linkedin_url: str | None = None
    company_name: str | None = None
    company_website: str | None = None
    company_size: str | None = None
    industry: str | None = None
    geography: str | None = None
    source: str = "unknown"  # 'apollo' | 'apify_linkedin' | 'crunchbase' | 'gmaps'
    raw_data: dict = {}


class ScraperResult(BaseModel):
    """Resultado de un scraper: leads extraídos + metadata de la ejecución."""
    leads: list[RawLead]
    source: str
    records_fetched: int
    estimated_cost_usd: float = 0.0
    error: str | None = None
