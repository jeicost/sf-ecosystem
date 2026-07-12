"""CRUD operations using SQLAlchemy async."""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import GuideRow, ItemRow, MediaAssetRow, UserRow
from app.models.guide_v2 import GuideCreate, GuideUpdate, ItemCreate, ItemUpdate


# ── Users ─────────────────────────────────────────────────────────────────────

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[UserRow]:
    result = await db.execute(select(UserRow).where(UserRow.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[UserRow]:
    result = await db.execute(select(UserRow).where(UserRow.id == user_id))
    return result.scalar_one_or_none()


# ── Guides ────────────────────────────────────────────────────────────────────

async def get_guide(db: AsyncSession, guide_id: uuid.UUID) -> GuideRow | None:
    result = await db.execute(
        select(GuideRow)
        .options(selectinload(GuideRow.items), selectinload(GuideRow.media))
        .where(GuideRow.id == guide_id)
    )
    return result.scalar_one_or_none()


async def list_guides(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[GuideRow]:
    result = await db.execute(
        select(GuideRow).order_by(GuideRow.updated_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def create_guide(db: AsyncSession, data: GuideCreate, created_by: str = "editor") -> GuideRow:
    from app.models.guide_v2 import COLLECTION_ACCENT
    accent = data.accent_color or COLLECTION_ACCENT.get(str(data.collection), "#C8006B")

    guide = GuideRow(
        city=data.city.upper(),
        year=data.year,
        edition=data.edition or f"Edición {data.city.capitalize()} {data.year}",
        director=data.director,
        director_role=data.director_role,
        guide_type=str(data.guide_type.value) if data.guide_type else "world",
        collection=str(data.collection.value),
        primary_color=data.primary_color,
        accent_color=accent,
        owner_id=data.owner_id,
        created_by=created_by,
    )
    db.add(guide)
    await db.flush()
    # Reload with relationships to avoid lazy-load issues in async context
    return await get_guide(db, guide.id)


async def update_guide(db: AsyncSession, guide_id: uuid.UUID, data: GuideUpdate) -> GuideRow | None:
    guide = await get_guide(db, guide_id)
    if not guide:
        return None

    patch = data.model_dump(exclude_none=True)
    for field, value in patch.items():
        if hasattr(guide, field):
            # Serialize Pydantic sub-models to dicts for JSONB columns
            if hasattr(value, "model_dump"):
                value = value.model_dump()
            elif isinstance(value, list) and value and hasattr(value[0], "model_dump"):
                value = [v.model_dump() for v in value]
            setattr(guide, field, value)

    guide.updated_at = datetime.utcnow()
    await db.flush()
    return await get_guide(db, guide_id)


async def delete_guide(db: AsyncSession, guide_id: uuid.UUID) -> bool:
    result = await db.execute(delete(GuideRow).where(GuideRow.id == guide_id))
    return result.rowcount > 0


# ── Items ─────────────────────────────────────────────────────────────────────

async def get_item(db: AsyncSession, item_id: uuid.UUID) -> ItemRow | None:
    result = await db.execute(select(ItemRow).where(ItemRow.id == item_id))
    return result.scalar_one_or_none()


async def list_items(
    db: AsyncSession,
    guide_id: uuid.UUID,
    section: str | None = None,
    item_type: str | None = None,
    enabled_only: bool = True,
) -> list[ItemRow]:
    q = select(ItemRow).where(ItemRow.guide_id == guide_id)
    if section:
        q = q.where(ItemRow.section == section)
    if item_type:
        q = q.where(ItemRow.item_type == item_type)
    if enabled_only:
        q = q.where(ItemRow.enabled == True)  # noqa: E712
    q = q.order_by(ItemRow.section, ItemRow.sort_order, ItemRow.created_at)
    result = await db.execute(q)
    return list(result.scalars().all())


async def create_item(db: AsyncSession, guide_id: uuid.UUID, data: ItemCreate) -> ItemRow:
    payload = data.model_dump()
    # Serialize nested Pydantic models
    for key in ("stats", "categories", "timeline_items", "extra"):
        v = payload.get(key)
        if v and isinstance(v, list) and v and hasattr(v[0], "model_dump"):
            payload[key] = [i.model_dump() for i in v]

    item = ItemRow(guide_id=guide_id, **payload)
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def bulk_create_items(db: AsyncSession, guide_id: uuid.UUID, items: list[ItemCreate]) -> list[ItemRow]:
    rows = []
    for data in items:
        row = await create_item(db, guide_id, data)
        rows.append(row)
    return rows


async def update_item(db: AsyncSession, item_id: uuid.UUID, data: ItemUpdate) -> ItemRow | None:
    item = await get_item(db, item_id)
    if not item:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item_id: uuid.UUID) -> bool:
    result = await db.execute(delete(ItemRow).where(ItemRow.id == item_id))
    return result.rowcount > 0


async def delete_items_by_section(db: AsyncSession, guide_id: uuid.UUID, section: str) -> int:
    result = await db.execute(
        delete(ItemRow).where(ItemRow.guide_id == guide_id, ItemRow.section == section)
    )
    return result.rowcount


# ── Media ─────────────────────────────────────────────────────────────────────

async def create_media_asset(
    db: AsyncSession,
    guide_id: uuid.UUID,
    url: str,
    storage_key: str,
    cdn_url: str,
    field_key: str | None = None,
    item_id: uuid.UUID | None = None,
    original_filename: str | None = None,
    size_bytes: int | None = None,
    mime_type: str | None = None,
) -> MediaAssetRow:
    asset = MediaAssetRow(
        guide_id=guide_id,
        item_id=item_id,
        url=url,
        storage_key=storage_key,
        cdn_url=cdn_url,
        field_key=field_key,
        original_filename=original_filename,
        size_bytes=size_bytes,
        mime_type=mime_type,
    )
    db.add(asset)
    await db.flush()
    await db.refresh(asset)
    return asset


async def list_media(db: AsyncSession, guide_id: uuid.UUID) -> list[MediaAssetRow]:
    result = await db.execute(
        select(MediaAssetRow)
        .where(MediaAssetRow.guide_id == guide_id)
        .order_by(MediaAssetRow.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_media_asset(db: AsyncSession, asset_id: uuid.UUID) -> bool:
    result = await db.execute(delete(MediaAssetRow).where(MediaAssetRow.id == asset_id))
    return result.rowcount > 0


# ── Guide duplication ─────────────────────────────────────────────────────────

async def duplicate_guide(
    db: AsyncSession,
    source_id: uuid.UUID,
    new_city: str | None = None,
    new_year: str | None = None,
    created_by: str = "editor",
) -> GuideRow:
    """Deep-copy a guide (all fields + items). Excludes media assets (they keep URLs)."""
    source = await get_guide(db, source_id)
    if not source:
        raise ValueError(f"Guide {source_id} not found")

    # Copy guide fields
    new_guide = GuideRow(
        city=new_city or source.city,
        year=new_year or source.year,
        edition=f"Edición {new_city or source.city} 20{new_year or source.year}",
        director=source.director,
        director_role=source.director_role,
        collection=source.collection,
        primary_color=source.primary_color,
        accent_color=source.accent_color,
        status="draft",
        cover_headline1=source.cover_headline1,
        cover_headline2=source.cover_headline2,
        cover_tagline=source.cover_tagline,
        cover_sub_tagline=source.cover_sub_tagline,
        cover_bg_color=source.cover_bg_color,
        cover_tint_opacity=source.cover_tint_opacity,
        headline_align=source.headline_align,
        directors_letter=source.directors_letter,
        director_pull_quote=source.director_pull_quote,
        director_signature=source.director_signature,
        criteria_list=source.criteria_list,
        mission_text=source.mission_text,
        persona_name=source.persona_name,
        persona_tagline=source.persona_tagline,
        persona_origen=source.persona_origen,
        persona_disciplina=source.persona_disciplina,
        persona_bio=source.persona_bio,
        persona_quote=source.persona_quote,
        persona_awards=source.persona_awards,
        persona_quotes=source.persona_quotes,
        ad_config=source.ad_config,
        back_cover_config=source.back_cover_config,
        site_url=source.site_url,
        created_by=created_by,
    )
    db.add(new_guide)
    await db.flush()

    # Deep-copy items
    for item in source.items:
        new_item = ItemRow(
            guide_id=new_guide.id,
            item_type=item.item_type,
            section=item.section,
            subcategory=item.subcategory,
            badge=item.badge,
            name=item.name,
            tagline=item.tagline,
            description=item.description,
            photo_url=item.photo_url,
            sort_order=item.sort_order,
            enabled=item.enabled,
            web=item.web,
            address=item.address,
            discoolver_url=item.discoolver_url,
            event_when=item.event_when,
            event_where=item.event_where,
            handle=item.handle,
            platform=item.platform,
            city=item.city,
            stats=item.stats,
            categories=item.categories,
            timeline_year=item.timeline_year,
            timeline_items=item.timeline_items,
            extra=item.extra,
        )
        db.add(new_item)

    await db.flush()
    await db.refresh(new_guide)
    return new_guide
