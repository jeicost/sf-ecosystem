"""Items CRUD — recomendados, events, influencers, timeline."""
from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, crud
from app.models.guide_v2 import ItemCreate, ItemUpdate, ItemOut

router = APIRouter(prefix="/v3/guides/{guide_id}/items", tags=["items-v3"])


@router.get("", response_model=list[ItemOut])
async def list_items(
    guide_id: uuid.UUID,
    section: str | None = Query(None),
    item_type: str | None = Query(None),
    include_disabled: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    return await crud.list_items(
        db, guide_id,
        section=section,
        item_type=item_type,
        enabled_only=not include_disabled,
    )


@router.post("", response_model=ItemOut, status_code=201)
async def create_item(
    guide_id: uuid.UUID,
    data: ItemCreate,
    db: AsyncSession = Depends(get_db),
):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    return await crud.create_item(db, guide_id, data)


@router.post("/bulk", response_model=list[ItemOut], status_code=201)
async def bulk_create_items(
    guide_id: uuid.UUID,
    items: list[ItemCreate],
    replace_section: str | None = Query(None, description="Borra los items de esta sección antes de insertar"),
    db: AsyncSession = Depends(get_db),
):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    if replace_section:
        await crud.delete_items_by_section(db, guide_id, replace_section)

    return await crud.bulk_create_items(db, guide_id, items)


@router.patch("/{item_id}", response_model=ItemOut)
async def update_item(
    guide_id: uuid.UUID,
    item_id: uuid.UUID,
    data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    item = await crud.update_item(db, item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    if item.guide_id != guide_id:
        raise HTTPException(status_code=403, detail="Item no pertenece a esta guía")
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    guide_id: uuid.UUID,
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    item = await crud.get_item(db, item_id)
    if not item or item.guide_id != guide_id:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    await crud.delete_item(db, item_id)


@router.delete("", status_code=204)
async def delete_section_items(
    guide_id: uuid.UUID,
    section: str = Query(..., description="Sección a vaciar"),
    db: AsyncSession = Depends(get_db),
):
    await crud.delete_items_by_section(db, guide_id, section)
