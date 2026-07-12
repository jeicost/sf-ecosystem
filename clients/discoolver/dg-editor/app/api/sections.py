from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.models.guide import Section, Subsection
from app.storage import guide_repo

router = APIRouter(tags=["sections"])


class ToggleRequest(BaseModel):
    active: bool


class ContentRequest(BaseModel):
    content: str


class OrderRequest(BaseModel):
    new_order: int


@router.get("/guides/{guide_id}/sections", response_model=list[Section])
def list_sections(guide_id: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    return sorted(guide.sections, key=lambda s: s.order)


@router.patch("/guides/{guide_id}/sections/{section_id}/toggle", response_model=Section)
def toggle_section(guide_id: str, section_id: str, req: ToggleRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    section = guide.get_section(section_id)
    if not section:
        raise HTTPException(404, "Sección no encontrada")
    section.active = req.active
    guide_repo.save_guide(guide)
    return section


@router.patch("/guides/{guide_id}/sections/{section_id}/content", response_model=Section)
def update_section_content(guide_id: str, section_id: str, req: ContentRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    section = guide.get_section(section_id)
    if not section:
        raise HTTPException(404, "Sección no encontrada")
    section.content = req.content
    guide_repo.save_guide(guide)
    return section


@router.patch("/guides/{guide_id}/sections/{section_id}/order", response_model=Section)
def reorder_section(guide_id: str, section_id: str, req: OrderRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    section = guide.get_section(section_id)
    if not section:
        raise HTTPException(404, "Sección no encontrada")
    section.order = req.new_order
    guide_repo.save_guide(guide)
    return section


@router.patch(
    "/guides/{guide_id}/sections/{section_id}/subsections/{sub_id}/toggle",
    response_model=Subsection,
)
def toggle_subsection(guide_id: str, section_id: str, sub_id: str, req: ToggleRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    section = guide.get_section(section_id)
    if not section:
        raise HTTPException(404, "Sección no encontrada")
    sub = next((s for s in section.subsections if s.id == sub_id), None)
    if not sub:
        raise HTTPException(404, "Subsección no encontrada")
    sub.active = req.active
    guide_repo.save_guide(guide)
    return sub


@router.patch(
    "/guides/{guide_id}/sections/{section_id}/subsections/{sub_id}/content",
    response_model=Subsection,
)
def update_subsection_content(guide_id: str, section_id: str, sub_id: str, req: ContentRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    section = guide.get_section(section_id)
    if not section:
        raise HTTPException(404, "Sección no encontrada")
    sub = next((s for s in section.subsections if s.id == sub_id), None)
    if not sub:
        raise HTTPException(404, "Subsección no encontrada")
    sub.content = req.content
    guide_repo.save_guide(guide)
    return sub
