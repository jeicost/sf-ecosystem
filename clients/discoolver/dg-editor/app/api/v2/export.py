"""Export endpoints — PDF y web estática."""
from __future__ import annotations
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, crud
from app.models.guide_v2 import ExportRequest, ExportResult

router = APIRouter(prefix="/v2/guides/{guide_id}/export", tags=["export-v2"])


# Maps (config_key → db_section_key) used in _build_sections
_SECTION_MAP = {
    "restaurantes":            "restaurantes",
    "gastronomia_bcn":         "gastronomia_bcn",
    "fiesta":                  "fiesta",
    "ocioEventos":             "ocio_eventos",
    "arteExposiciones":        "arte_exposiciones",
    "experienciasActividades": "experiencias",
    "alojamientos":            "alojamientos",
    "shopping":                "shopping",
}


def _build_sections(guide, items_to_list: callable) -> dict:
    """
    Build the sections dict applying per-guide enable/disable flags.
    sections_config schema: { "restaurantes": {"enabled": bool, "page_number": str}, ... }
    """
    cfg = guide.sections_config or {}
    result = {}
    for config_key, db_key in _SECTION_MAP.items():
        section_cfg = cfg.get(db_key, {})
        enabled = section_cfg.get("enabled", True)
        result[config_key] = {
            "enabled":    enabled,
            "pageNumber": section_cfg.get("page_number"),
            "items":      items_to_list(db_key) if enabled else [],
        }
    return result


def _guide_to_config(guide, items) -> dict:
    """Convierte GuideRow + ItemRow[] → GuideConfig compatible con design-studio."""
    from collections import defaultdict

    # Group items by section
    by_section: dict = defaultdict(list)
    for item in items:
        by_section[item.section].append(item)

    def items_to_list(section: str) -> list[dict]:
        return [
            {
                "name": it.name,
                "tagline": it.tagline,
                "description": it.description,
                "photo": it.photo_url,
                "badge": it.badge,
                "web": it.web,
                "address": it.address,
                "discoolverUrl": it.discoolver_url,
                "subcategory": it.subcategory,
            }
            for it in sorted(by_section.get(section, []), key=lambda x: x.sort_order)
            if it.enabled
        ]

    def influencer_to_dict(it) -> dict:
        return {
            "name": it.name,
            "handle": it.handle,
            "platform": it.platform,
            "city": it.city,
            "description": it.description,
            "photo": it.photo_url,
            "stats": it.stats or [],
            "categories": it.categories or [],
        }

    def timeline_to_list() -> list[dict]:
        tl = sorted(by_section.get("persona_timeline", []), key=lambda x: x.timeline_year or "")
        return [
            {"year": it.timeline_year, "items": it.timeline_items or []}
            for it in tl
        ]

    config = {
        "city": guide.city,
        "year": guide.year,
        "edition": guide.edition,
        "director": guide.director,
        "primaryColor": guide.primary_color,
        "accentColor": guide.accent_color,
        "collection": guide.collection,

        # Cover
        "coverHeadline1": guide.cover_headline1,
        "coverHeadline2": guide.cover_headline2,
        "coverTagline": guide.cover_tagline,
        "coverSubTagline": guide.cover_sub_tagline,
        "coverPhoto": guide.cover_photo_url,
        "coverBgColor": guide.cover_bg_color,
        "coverTintOpacity": guide.cover_tint_opacity,
        "headlineAlign": guide.headline_align,

        # Director
        "directorsLetter": guide.directors_letter,
        "directorRole": guide.director_role,
        "directorPhoto": guide.director_photo_url,
        "directorPullQuote": guide.director_pull_quote,
        "directorSignature": guide.director_signature,
        "criteriaList": guide.criteria_list or [],
        "missionText": guide.mission_text,

        # Persona del Año
        "personaDelAno": {
            "name": guide.persona_name,
            "tagline": guide.persona_tagline,
            "photo": guide.persona_photo_url,
            "bodyPhoto": guide.persona_body_photo_url,
            "origen": guide.persona_origen,
            "disciplina": guide.persona_disciplina,
            "bio": guide.persona_bio,
            "quote": guide.persona_quote,
            "awards": guide.persona_awards or [],
            "quotes": guide.persona_quotes or [],
            "timeline": timeline_to_list(),
            "recomendados": items_to_list("persona_recom"),
        },

        # Sections — respects per-guide enable/disable from sections_config
        "sections": _build_sections(guide, items_to_list),

        "influencers": [
            influencer_to_dict(it)
            for it in sorted(by_section.get("influencers", []), key=lambda x: x.sort_order)
            if it.enabled
        ],

        # Template 18 — 10 Saves: editor's top picks (section: top_saves)
        "topSaves": items_to_list("top_saves"),

        # Template 20 — Coollections: items grouped by subcategory (travel style)
        "coollections": _build_coollections(by_section),

        # Ad & back cover
        "ad": guide.ad_config or {},
        "backCover": guide.back_cover_config or {},
        "siteUrl": guide.site_url,
    }
    return config


def _build_coollections(by_section: dict) -> list[dict]:
    """
    Groups coollection items by subcategory (travel style).
    Returns [{style, items: [{name, tagline, description, photo, badge, address}]}]
    """
    from collections import defaultdict
    raw = sorted(by_section.get("coollections", []), key=lambda x: x.sort_order)
    groups: dict = defaultdict(list)
    for it in raw:
        if it.enabled:
            groups[it.subcategory or "General"].append({
                "name": it.name,
                "tagline": it.tagline,
                "description": it.description,
                "photo": it.photo_url,
                "badge": it.badge,
                "address": it.address,
                "section": it.section,
            })
    return [{"style": style, "items": items} for style, items in groups.items()]


async def _save_snapshot(
    db: AsyncSession,
    guide_id: uuid.UUID,
    config: dict,
    items_count: int,
    trigger: str = "pre_export",
    label: str | None = None,
) -> None:
    from app.db.models import GuideSnapshotRow
    snap = GuideSnapshotRow(
        guide_id=guide_id,
        label=label or f"Pre-export {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        trigger=trigger,
        config=config,
        items_count=items_count,
    )
    db.add(snap)
    await db.flush()


@router.post("", response_model=ExportResult)
async def export_guide(
    guide_id: uuid.UUID,
    data: ExportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    items = await crud.list_items(db, guide_id, enabled_only=True)
    config = _guide_to_config(guide, items)

    # Auto-snapshot before every export
    await _save_snapshot(db, guide_id, config, len(items), trigger="pre_export")

    if data.format == "pdf":
        from app.services.pdf_renderer import render_pdf
        url = await render_pdf(guide_id=str(guide_id), config=config)
    elif data.format == "web":
        from app.services.web_renderer import render_web
        url = await render_web(guide_id=str(guide_id), config=config)
    else:
        raise HTTPException(status_code=400, detail="Formato no soportado: usa 'pdf' o 'web'")

    return ExportResult(
        url=url,
        format=data.format,
        generated_at=datetime.utcnow(),
    )


@router.get("/history", summary="Historial de snapshots")
async def list_snapshots(guide_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.db.models import GuideSnapshotRow
    result = await db.execute(
        select(GuideSnapshotRow)
        .where(GuideSnapshotRow.guide_id == guide_id)
        .order_by(GuideSnapshotRow.created_at.desc())
        .limit(20)
    )
    rows = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "label": r.label,
            "trigger": r.trigger,
            "items_count": r.items_count,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.post("/snapshot", summary="Crear snapshot manual")
async def create_snapshot(
    guide_id: uuid.UUID,
    label: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    items = await crud.list_items(db, guide_id, enabled_only=False)
    config = _guide_to_config(guide, items)
    await _save_snapshot(
        db, guide_id, config, len(items),
        trigger="manual",
        label=label or f"Snapshot manual {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
    )
    return {"ok": True, "items_count": len(items)}


@router.get("/config", summary="Ver GuideConfig JSON (para preview)")
async def get_guide_config(
    guide_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Devuelve el GuideConfig JSON que consumen los templates del design-studio."""
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    items = await crud.list_items(db, guide_id, enabled_only=True)
    return _guide_to_config(guide, items)
