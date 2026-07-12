"""Guide CRUD — v2 API with PostgreSQL."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.api.v2.auth import get_current_user, TokenData
from app.db import get_db
from app.db import crud
from app.db.models import GuideRow, ItemRow
from app.models.guide_v2 import (
    GuideCreate, GuideUpdate, GuideOut, GuideSummary, GuideType,
)

router = APIRouter(prefix="/v3/guides", tags=["guides-v3"])


@router.get("", response_model=list[GuideSummary])
async def list_guides(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    q: Optional[str] = Query(None, description="Search by city or edition"),
    status: Optional[str] = Query(None),
    collection: Optional[str] = Query(None),
    guide_type: Optional[str] = Query(None, description="world|local|collection|influencer|dossier"),
    db: AsyncSession = Depends(get_db),
    current: TokenData = Depends(get_current_user),
):
    stmt = select(GuideRow).order_by(GuideRow.updated_at.desc())

    # Influencers only see their own guides
    if current.role == "influencer" and current.user_id:
        stmt = stmt.where(GuideRow.owner_id == uuid.UUID(current.user_id))

    if q:
        term = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(GuideRow.city).like(term),
                func.lower(GuideRow.edition).like(term),
            )
        )
    if status:
        stmt = stmt.where(GuideRow.status == status)
    if collection:
        stmt = stmt.where(GuideRow.collection == collection)
    if guide_type:
        stmt = stmt.where(GuideRow.guide_type == guide_type)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    guides = list(result.scalars().all())

    # Fetch item counts for all returned guides in one query
    if guides:
        guide_ids = [g.id for g in guides]
        counts_stmt = (
            select(ItemRow.guide_id, func.count(ItemRow.id).label("cnt"))
            .where(ItemRow.guide_id.in_(guide_ids))
            .group_by(ItemRow.guide_id)
        )
        counts_result = await db.execute(counts_stmt)
        counts_map = {row.guide_id: row.cnt for row in counts_result}
        for g in guides:
            g.__dict__["items_count"] = counts_map.get(g.id, 0)

    return guides


@router.get("/{guide_id}", response_model=GuideOut)
async def get_guide(guide_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    return guide


@router.post("", response_model=GuideOut, status_code=201)
async def create_guide(
    data: GuideCreate,
    db: AsyncSession = Depends(get_db),
    current: TokenData = Depends(get_current_user),
):
    # Influencers can only create influencer-type guides and always own them
    if current.role == "influencer":
        data.guide_type = GuideType.influencer
        if current.user_id:
            data.owner_id = uuid.UUID(current.user_id)
    guide = await crud.create_guide(db, data, created_by=current.email)
    return guide


@router.patch("/{guide_id}", response_model=GuideOut)
async def update_guide(
    guide_id: uuid.UUID,
    data: GuideUpdate,
    db: AsyncSession = Depends(get_db),
):
    guide = await crud.update_guide(db, guide_id, data)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    return guide


@router.delete("/{guide_id}", status_code=204)
async def delete_guide(guide_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    deleted = await crud.delete_guide(db, guide_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Guía no encontrada")


@router.post("/{guide_id}/duplicate", response_model=GuideSummary, status_code=201)
async def duplicate_guide(
    guide_id: uuid.UUID,
    new_city: Optional[str] = Query(None),
    new_year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Deep-copy a guide with all its items. Returns the new guide."""
    try:
        new_guide = await crud.duplicate_guide(
            db, guide_id,
            new_city=new_city.upper() if new_city else None,
            new_year=new_year,
        )
        return new_guide
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
