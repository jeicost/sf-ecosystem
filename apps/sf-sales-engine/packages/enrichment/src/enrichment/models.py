from pydantic import BaseModel


class TriggerSignal(BaseModel):
    type: str        # 'funding' | 'hiring' | 'expansion' | 'news'
    description: str
    source_url: str | None = None


class EnrichedLead(BaseModel):
    """Lead enriquecido listo para scoring. Cruza datos de múltiples fuentes."""
    first_name: str | None = None
    last_name: str | None = None
    title: str | None = None
    email: str | None = None
    email_verified: bool = False
    linkedin_url: str | None = None
    company_name: str | None = None
    company_website: str | None = None
    company_size: str | None = None
    industry: str | None = None
    geography: str | None = None
    linkedin_summary: str | None = None
    company_news: str | None = None
    trigger_signals: list[TriggerSignal] = []
    sources_used: list[str] = []
    raw_data: dict = {}
