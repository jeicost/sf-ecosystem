"""Media upload endpoint — DigitalOcean Spaces."""
from __future__ import annotations
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, crud
from app.models.guide_v2 import MediaAssetOut
from app.services import spaces

router = APIRouter(prefix="/v3/guides/{guide_id}/media", tags=["media-v3"])

ALLOWED_MIME = {
    "image/jpeg", "image/png", "image/webp",
    "image/gif", "image/svg+xml",
}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.get("", response_model=list[MediaAssetOut])
async def list_media(guide_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await crud.list_media(db, guide_id)


@router.post("", response_model=MediaAssetOut, status_code=201)
async def upload_media(
    guide_id: uuid.UUID,
    file: UploadFile = File(...),
    field_key: str | None = Form(None),
    item_id: uuid.UUID | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de archivo no permitido: {content_type}. Permitidos: {', '.join(ALLOWED_MIME)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 10 MB)")

    result = spaces.upload_file(
        file_bytes=file_bytes,
        original_filename=file.filename or "upload",
        guide_id=str(guide_id),
    )

    asset = await crud.create_media_asset(
        db,
        guide_id=guide_id,
        url=result["url"],
        storage_key=result["storage_key"],
        cdn_url=result["cdn_url"],
        field_key=field_key,
        item_id=item_id,
        original_filename=result["original_filename"],
        size_bytes=result["size_bytes"],
        mime_type=result["mime_type"],
    )

    # Auto-update the relevant field on the guide or item
    cdn_url = result["cdn_url"]
    if field_key and not item_id:
        field_map = {
            "cover_photo":        "cover_photo_url",
            "director_photo":     "director_photo_url",
            "persona_photo":      "persona_photo_url",
            "persona_body_photo": "persona_body_photo_url",
        }
        if field_key in field_map:
            from app.models.guide_v2 import GuideUpdate
            await crud.update_guide(db, guide_id, GuideUpdate(**{field_map[field_key]: cdn_url}))

    elif field_key == "item_photo" and item_id:
        from app.models.guide_v2 import ItemUpdate
        await crud.update_item(db, item_id, ItemUpdate(photo_url=cdn_url))

    return asset


@router.post("/generate-ai", response_model=MediaAssetOut, status_code=201)
async def generate_ai_photo(
    guide_id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a cover photo with Freepik Mystic AI and save it as media asset.
    Body: { field_key?: str, prompt?: str }
    """
    from app.services.freepik_client import generate_cover_image
    from app.config import settings as cfg

    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    if not cfg.freepik_api_key:
        raise HTTPException(status_code=422, detail="FREEPIK_API_KEY no configurada. Añade FREEPIK_API_KEY=tu_clave en el archivo .env del proyecto.")

    field_key    = body.get("field_key", "cover_photo")
    custom_prompt = body.get("prompt")

    guide_data = {
        "city":        guide.city,
        "guide_type":  guide.guide_type,
        "collection":  guide.collection,
        "cover_tagline": guide.cover_tagline,
    }

    try:
        img_bytes = await generate_cover_image(guide_data, custom_prompt)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))

    result = spaces.upload_file(
        file_bytes=img_bytes,
        original_filename=f"ai-cover-{guide.city.lower()}.jpg",
        guide_id=str(guide_id),
    )

    asset = await crud.create_media_asset(
        db,
        guide_id=guide_id,
        url=result["url"],
        storage_key=result["storage_key"],
        cdn_url=result["cdn_url"],
        field_key=field_key,
        item_id=None,
        original_filename=result["original_filename"],
        size_bytes=result["size_bytes"],
        mime_type=result["mime_type"],
    )

    # Auto-aplicar como foto de portada
    if field_key == "cover_photo":
        from app.models.guide_v2 import GuideUpdate
        await crud.update_guide(db, guide_id, GuideUpdate(cover_photo_url=result["cdn_url"]))

    return asset


@router.delete("/{asset_id}", status_code=204)
async def delete_media(
    guide_id: uuid.UUID,
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    from app.db.models import MediaAssetRow
    from sqlalchemy import select

    result = await db.execute(
        select(MediaAssetRow).where(
            MediaAssetRow.id == asset_id,
            MediaAssetRow.guide_id == guide_id,
        )
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset no encontrado")

    if asset.storage_key:
        spaces.delete_file(asset.storage_key)

    await crud.delete_media_asset(db, asset_id)
