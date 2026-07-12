"""
CMS Bridge — conexión con api.discoolver.com para buscar e importar recomendados.

Rutas:
  GET  /v2/cms/cities                       → ciudades disponibles
  GET  /v2/cms/categories                   → categorías disponibles
  GET  /v2/cms/subregions                   → subregiones
  GET  /v2/cms/search                       → buscar recomendados (con filtros)
  GET  /v2/cms/business/{id}               → detalle de un recomendado
  GET  /v2/cms/business/{id}/gallery       → galería de imágenes
  POST /v2/guides/{guide_id}/cms/import    → importar selección como items
"""
from __future__ import annotations

import uuid
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v2.auth import get_current_user
from app.db import crud, get_db
from app.models.guide_v2 import ItemCreate, ItemOut, ItemType
from app.services.cms_client import cms

router = APIRouter(tags=["cms-bridge"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cms_error(exc: Exception) -> HTTPException:
    if isinstance(exc, httpx.HTTPStatusError):
        return HTTPException(
            status_code=502,
            detail=f"CMS API devolvió {exc.response.status_code}: {exc.response.text[:200]}",
        )
    return HTTPException(status_code=502, detail=f"Error conectando al CMS: {exc}")


# ── Catálogo ──────────────────────────────────────────────────────────────────

@router.get("/v2/cms/cities", summary="Ciudades disponibles en el CMS")
async def list_cms_cities(
    language: str = Query("es"),
    _=Depends(get_current_user),
) -> list[dict]:
    try:
        return await cms.get_cities(language)
    except Exception as exc:
        raise _cms_error(exc)


@router.get("/v2/cms/categories", summary="Categorías disponibles en el CMS")
async def list_cms_categories(
    language: str = Query("es"),
    _=Depends(get_current_user),
) -> list[dict]:
    try:
        return await cms.get_categories(language)
    except Exception as exc:
        raise _cms_error(exc)


@router.get("/v2/cms/subregions", summary="Subregiones activas en el CMS")
async def list_cms_subregions(
    language: str = Query("es"),
    _=Depends(get_current_user),
) -> list[dict]:
    try:
        return await cms.get_subregions(language)
    except Exception as exc:
        raise _cms_error(exc)


# ── Búsqueda ──────────────────────────────────────────────────────────────────

@router.get("/v2/cms/search", summary="Buscar recomendados en el CMS")
async def search_cms_businesses(
    language: str = Query("es"),
    city: Optional[int] = Query(None, description="ID de ciudad"),
    category: Optional[int] = Query(None, description="ID de categoría"),
    subcategory: Optional[int] = Query(None),
    name: str = Query("", description="Filtrar por nombre"),
    state: Optional[int] = Query(4, description="Estado (4=publicado)"),
    outstanding: int = Query(0),
    outstanding_in_category: int = Query(0),
    sponsored: int = Query(0),
    _=Depends(get_current_user),
) -> list[dict]:
    try:
        return await cms.search_businesses(
            language=language,
            city=city,
            category=category,
            subcategory=subcategory,
            name=name,
            state=state,
            outstanding=outstanding,
            outstanding_in_category=outstanding_in_category,
            sponsored=sponsored,
        )
    except Exception as exc:
        raise _cms_error(exc)


@router.get("/v2/cms/business/{business_id}", summary="Detalle de un recomendado del CMS")
async def get_cms_business(
    business_id: int,
    language: str = Query("es"),
    _=Depends(get_current_user),
) -> dict:
    try:
        return await cms.get_business_detail(business_id, language)
    except Exception as exc:
        raise _cms_error(exc)


@router.get("/v2/cms/business/{business_id}/gallery", summary="Galería de imágenes de un recomendado")
async def get_cms_business_gallery(
    business_id: int,
    _=Depends(get_current_user),
) -> list[dict]:
    try:
        return await cms.get_business_gallery(business_id)
    except Exception as exc:
        raise _cms_error(exc)


# ── Import ────────────────────────────────────────────────────────────────────

class CMSImportItem(BaseModel):
    business_id: int
    section: Optional[str] = None       # si no se pasa, se infiere de la categoría del CMS
    badge: Optional[str] = None
    sort_order: int = 0


class CMSImportRequest(BaseModel):
    items: list[CMSImportItem]
    language: str = "es"
    replace_section: Optional[str] = None  # si se pasa, borra esa sección antes de insertar


@router.post(
    "/v2/guides/{guide_id}/cms/import",
    response_model=list[ItemOut],
    status_code=201,
    summary="Importar recomendados del CMS como items de la guía",
)
async def import_cms_businesses(
    guide_id: uuid.UUID,
    body: CMSImportRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
) -> list[ItemOut]:
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    if body.replace_section:
        await crud.delete_items_by_section(db, guide_id, body.replace_section)

    import asyncio

    try:
        pairs = await asyncio.gather(*[
            asyncio.gather(
                cms.get_business_detail(e.business_id, body.language),
                cms.get_business_gallery(e.business_id),
            )
            for e in body.items
        ])
    except Exception as exc:
        raise _cms_error(exc)

    created: list[ItemOut] = []
    for entry, (biz, gallery) in zip(body.items, pairs):
        item_dict = cms.business_to_item_dict(biz, section=entry.section, gallery=gallery)
        item_dict["badge"] = entry.badge
        item_dict["sort_order"] = entry.sort_order
        row = await crud.create_item(db, guide_id, ItemCreate(**item_dict))
        created.append(row)

    return created


# ── Preview (sin guardar) ─────────────────────────────────────────────────────

@router.get(
    "/v2/cms/business/{business_id}/preview",
    summary="Preview de cómo quedaría el item si se importa",
)
async def preview_cms_business(
    business_id: int,
    section: Optional[str] = Query(None),
    language: str = Query("es"),
    _=Depends(get_current_user),
) -> dict[str, Any]:
    try:
        biz = await cms.get_business_detail(business_id, language)
        gallery = await cms.get_business_gallery(business_id)
    except Exception as exc:
        raise _cms_error(exc)

    item_dict = cms.business_to_item_dict(biz, section=section, gallery=gallery)
    return {
        "cms_raw": biz,
        "mapped_item": item_dict,
        "gallery": gallery[:5],
    }
