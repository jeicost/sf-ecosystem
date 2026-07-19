from uuid import UUID

from pydantic import BaseModel, Field


class ICPProfile(BaseModel):
    icp_name: str
    industries: list[str]
    company_sizes: list[str]
    geographies: list[str]
    job_titles: list[str]
    pain_points: list[str]
    trigger_events: list[str]
    disqualifiers: list[str]
    min_budget_usd: int = 0


class ScoringInput(BaseModel):
    lead_id: UUID
    client_id: UUID
    icp: ICPProfile
    # Datos del lead a scorear
    title: str | None = None
    company_name: str | None = None
    company_size: str | None = None
    industry: str | None = None
    geography: str | None = None
    linkedin_summary: str | None = None
    trigger_signals: list[str] = []


class LeadScore(BaseModel):
    lead_id: UUID
    score: int = Field(ge=0, le=100)
    classification: str  # 'hot' | 'warm' | 'cold' | 'disqualify'
    reason: str          # 2 líneas max explicando el score
    confidence: float = Field(ge=0.0, le=1.0)
