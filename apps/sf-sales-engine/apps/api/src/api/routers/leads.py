from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import AsyncClient

from api.deps import get_supabase
from scoring.lead_scorer import LeadScorer
from scoring.models import LeadScore, ScoringInput

log = structlog.get_logger()
router = APIRouter()


class LeadListResponse(BaseModel):
    data: list[Any]
    count: int


@router.get("/", response_model=LeadListResponse)
async def list_leads(
    client_id: UUID,
    stage: str | None = None,
    min_score: int | None = None,
    limit: int = 50,
    db: AsyncClient = Depends(get_supabase),
) -> LeadListResponse:
    """Lista leads de un cliente con filtros opcionales."""
    query = db.table("leads").select("*").eq("client_id", str(client_id))
    if stage:
        query = query.eq("stage", stage)
    if min_score:
        query = query.gte("hot_score", min_score)
    result = await query.order("hot_score", desc=True).limit(limit).execute()
    return LeadListResponse(data=result.data, count=len(result.data))


@router.post("/score", response_model=LeadScore)
async def score_lead(
    payload: ScoringInput,
    db: AsyncClient = Depends(get_supabase),
) -> LeadScore:
    """Scorea un lead contra el ICP del cliente usando Claude Haiku."""
    scorer = LeadScorer()
    score = await scorer.score(payload)
    log.info("lead.scored", lead_id=str(payload.lead_id), score=score.score)
    return score


class IcebreakerRequest(BaseModel):
    lead_id: UUID
    client_id: UUID


class IcebreakerResponse(BaseModel):
    lead_id: UUID
    icebreaker: str
    model: str
    tokens_used: int | None = None


@router.post("/icebreaker", response_model=IcebreakerResponse)
async def generate_icebreaker(
    payload: IcebreakerRequest,
    db: AsyncClient = Depends(get_supabase),
) -> IcebreakerResponse:
    """Generates personalized cold-email icebreaker for a lead.

    TODO (Semana 2):
    1. Fetch lead and Commercial Brain context from Supabase
    2. Load client's win_loss_history + market_intel
    3. Call Claude Sonnet with injected context
    4. Cache icebreaker in leads.icebreaker_used
    5. Return structured response
    """
    log.info("icebreaker.requested", lead_id=str(payload.lead_id), client_id=str(payload.client_id))
    # Placeholder
    return IcebreakerResponse(
        lead_id=payload.lead_id,
        icebreaker="[Placeholder] Icebreaker generation not yet implemented.",
        model="claude-sonnet-4-6",
        tokens_used=None,
    )
