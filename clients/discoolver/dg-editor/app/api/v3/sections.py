"""Section enable/disable and page number configuration per guide."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, crud

router = APIRouter(prefix="/v3/guides/{guide_id}/sections", tags=["sections-v3"])

DEFAULT_SECTIONS = {
    "restaurantes":      {"enabled": True,  "page_number": "11"},
    "gastronomia_bcn":   {"enabled": True,  "page_number": "12"},
    "fiesta":            {"enabled": True,  "page_number": "18"},
    "ocio_eventos":      {"enabled": True,  "page_number": "22"},
    "arte_exposiciones": {"enabled": True,  "page_number": "25"},
    "experiencias":      {"enabled": True,  "page_number": "28"},
    "alojamientos":      {"enabled": True,  "page_number": "30"},
    "shopping":          {"enabled": True,  "page_number": "38"},
    "influencers":       {"enabled": True,  "page_number": "44"},
    "persona_del_ano":   {"enabled": True,  "page_number": "5"},
    "nota_director":     {"enabled": True,  "page_number": "1"},
}


class SectionPatch(BaseModel):
    enabled: Optional[bool] = None
    page_number: Optional[str] = None


@router.get("")
async def get_sections_config(guide_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    # Merge defaults with stored config
    config = dict(DEFAULT_SECTIONS)
    stored = guide.sections_config or {}
    for key, val in stored.items():
        if key in config:
            config[key] = {**config[key], **val}
    return config


@router.patch("/{section_key}")
async def patch_section(
    guide_id: uuid.UUID,
    section_key: str,
    data: SectionPatch,
    db: AsyncSession = Depends(get_db),
):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    if section_key not in DEFAULT_SECTIONS:
        raise HTTPException(status_code=404, detail=f"Sección '{section_key}' no existe")

    current = dict(guide.sections_config or {})
    section_data = current.get(section_key, dict(DEFAULT_SECTIONS[section_key]))

    if data.enabled is not None:
        section_data["enabled"] = data.enabled
    if data.page_number is not None:
        section_data["page_number"] = data.page_number

    current[section_key] = section_data
    from app.models.guide_v2 import GuideUpdate
    await crud.update_guide(db, guide_id, GuideUpdate(sections_config=current))

    return section_data
