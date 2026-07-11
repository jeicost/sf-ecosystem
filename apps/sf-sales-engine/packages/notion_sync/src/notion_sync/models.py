from pydantic import BaseModel


class NotionLead(BaseModel):
    """Representación de un lead en Notion (mapeado a propiedades de la DB)."""
    notion_page_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    title: str | None = None
    email: str | None = None
    company_name: str | None = None
    company_website: str | None = None
    industry: str | None = None
    geography: str | None = None
    stage: str = "prospected"
    hot_score: int = 0
    source: str | None = None
    notes: str | None = None
    linkedin_url: str | None = None


class SyncResult(BaseModel):
    total: int
    created: int
    updated: int
    errors: int
    error_details: list[str] = []
