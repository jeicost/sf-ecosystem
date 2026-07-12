"""
Bulk import photos from URLs (for Cloudinary migration or mass-tagging).
Descarga cada URL, la sube a DO Spaces y actualiza el item/guide.
"""
import asyncio
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, crud
from app.models.guide_v2 import GuideUpdate, ItemUpdate
from app.services import spaces

router = APIRouter(prefix="/v2/guides/{guide_id}/bulk-photos", tags=["bulk-photos"])

MAX_CONCURRENT = 4   # parallel downloads
MAX_SIZE_BYTES = 10 * 1024 * 1024


class PhotoEntry(BaseModel):
    url: str
    field_key: Optional[str] = None   # e.g. "cover_photo", "director_photo"
    item_id: Optional[uuid.UUID] = None


class BulkPhotoRequest(BaseModel):
    photos: list[PhotoEntry]


class BulkPhotoResult(BaseModel):
    imported: int
    failed: int
    results: list[dict]


async def _download_and_upload(
    entry: PhotoEntry,
    guide_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(entry.url)
            resp.raise_for_status()

        file_bytes = resp.content
        if len(file_bytes) > MAX_SIZE_BYTES:
            return {"url": entry.url, "ok": False, "error": "Archivo demasiado grande (>10MB)"}

        content_type = resp.headers.get("content-type", "image/jpeg")
        if not content_type.startswith("image/"):
            return {"url": entry.url, "ok": False, "error": f"No es imagen: {content_type}"}

        # Guess filename from URL
        filename = entry.url.split("?")[0].split("/")[-1] or "photo.jpg"
        if "." not in filename:
            ext = {"image/jpeg": ".jpg", "image/png": ".png",
                   "image/webp": ".webp"}.get(content_type, ".jpg")
            filename += ext

        result = spaces.upload_file(
            file_bytes=file_bytes,
            original_filename=filename,
            guide_id=str(guide_id),
        )
        cdn_url = result["cdn_url"]

        # Save to media_assets and update target field
        await crud.create_media_asset(
            db,
            guide_id=guide_id,
            url=result["url"],
            storage_key=result["storage_key"],
            cdn_url=cdn_url,
            field_key=entry.field_key,
            item_id=entry.item_id,
            original_filename=filename,
            size_bytes=result["size_bytes"],
            mime_type=content_type,
        )

        # Auto-update the right field
        GUIDE_FIELD_MAP = {
            "cover_photo":        "cover_photo_url",
            "director_photo":     "director_photo_url",
            "persona_photo":      "persona_photo_url",
            "persona_body_photo": "persona_body_photo_url",
        }
        if entry.field_key and entry.field_key in GUIDE_FIELD_MAP and not entry.item_id:
            await crud.update_guide(
                db, guide_id,
                GuideUpdate(**{GUIDE_FIELD_MAP[entry.field_key]: cdn_url})
            )
        elif entry.item_id:
            await crud.update_item(db, entry.item_id, ItemUpdate(photo_url=cdn_url))

        return {"url": entry.url, "ok": True, "cdn_url": cdn_url}

    except Exception as e:
        return {"url": entry.url, "ok": False, "error": str(e)}


@router.post("", response_model=BulkPhotoResult)
async def bulk_import_photos(
    guide_id: uuid.UUID,
    data: BulkPhotoRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Descarga hasta 50 fotos de URLs externas, las sube a DO Spaces
    y actualiza los campos correspondientes.
    Útil para migrar desde Cloudinary o importar fotos desde Excel.
    """
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    if len(data.photos) > 50:
        raise HTTPException(status_code=400, detail="Máximo 50 fotos por petición")

    # Process in batches to avoid overwhelming the server
    results = []
    for i in range(0, len(data.photos), MAX_CONCURRENT):
        batch = data.photos[i:i + MAX_CONCURRENT]
        batch_results = await asyncio.gather(
            *[_download_and_upload(entry, guide_id, db) for entry in batch]
        )
        results.extend(batch_results)

    imported = sum(1 for r in results if r["ok"])
    failed   = len(results) - imported

    return BulkPhotoResult(imported=imported, failed=failed, results=results)
