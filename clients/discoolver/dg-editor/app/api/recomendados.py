import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.models.guide import Recomendado, RecomendadoCategory, PriceRange
from app.storage import guide_repo

router = APIRouter(tags=["recomendados"])


class CreateRecomendadoRequest(BaseModel):
    name: str
    category: RecomendadoCategory
    description: str
    address: str = ""
    price_range: PriceRange = PriceRange.two
    rating: float = 0.0
    section_id: str
    tags: list[str] = []
    website: str = ""
    image_url: str = ""


class PatchRecomendadoRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    price_range: Optional[PriceRange] = None
    rating: Optional[float] = None
    tags: Optional[list[str]] = None
    website: Optional[str] = None
    image_url: Optional[str] = None
    active: Optional[bool] = None
    section_id: Optional[str] = None


class ToggleRequest(BaseModel):
    active: bool


@router.get("/guides/{guide_id}/recomendados", response_model=list[Recomendado])
def list_recomendados(
    guide_id: str,
    section_id: Optional[str] = None,
    category: Optional[RecomendadoCategory] = None,
    active: Optional[bool] = None,
):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    recs = guide.recomendados
    if section_id:
        recs = [r for r in recs if r.section_id == section_id]
    if category:
        recs = [r for r in recs if r.category == category]
    if active is not None:
        recs = [r for r in recs if r.active == active]
    return recs


@router.post("/guides/{guide_id}/recomendados", response_model=Recomendado, status_code=201)
def add_recomendado(guide_id: str, req: CreateRecomendadoRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    rec = Recomendado(
        id=f"rec-{str(uuid.uuid4())[:8]}",
        **req.model_dump(),
    )
    guide.recomendados.append(rec)
    guide_repo.save_guide(guide)
    return rec


@router.patch("/guides/{guide_id}/recomendados/{rec_id}", response_model=Recomendado)
def patch_recomendado(guide_id: str, rec_id: str, req: PatchRecomendadoRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    rec = guide.get_recomendado(rec_id)
    if not rec:
        raise HTTPException(404, "Recomendado no encontrado")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(rec, field, value)
    guide_repo.save_guide(guide)
    return rec


@router.patch("/guides/{guide_id}/recomendados/{rec_id}/toggle", response_model=Recomendado)
def toggle_recomendado(guide_id: str, rec_id: str, req: ToggleRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    rec = guide.get_recomendado(rec_id)
    if not rec:
        raise HTTPException(404, "Recomendado no encontrado")
    rec.active = req.active
    guide_repo.save_guide(guide)
    return rec


@router.delete("/guides/{guide_id}/recomendados/{rec_id}", status_code=204)
def delete_recomendado(guide_id: str, rec_id: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    original_len = len(guide.recomendados)
    guide.recomendados = [r for r in guide.recomendados if r.id != rec_id]
    if len(guide.recomendados) == original_len:
        raise HTTPException(404, "Recomendado no encontrado")
    guide_repo.save_guide(guide)
