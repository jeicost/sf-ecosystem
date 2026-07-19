from typing import Any
from uuid import UUID

import structlog
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from scoring.lead_scorer import LeadScorer
from scoring.models import LeadScore, ScoringInput

from api.deps import get_supabase
from supabase import AsyncClient

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

# Icebreaker generation lives in api.routers.icebreaker (POST /icebreaker/generate) —
# it's the real implementation; this router used to have a placeholder duplicate.
