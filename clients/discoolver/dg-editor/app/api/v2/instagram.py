"""
Instagram integration — OAuth flow + media fetch + import as items.

Rutas:
  GET    /v2/instagram/auth-url?guide_id={id}           → URL para iniciar OAuth
  GET    /v2/instagram/callback?code=...&state={guide_id} → callback OAuth (no auth)
  GET    /v2/guides/{guide_id}/instagram/status          → ¿conectado? + username
  GET    /v2/guides/{guide_id}/instagram/media           → feed de posts paginado
  POST   /v2/guides/{guide_id}/instagram/import          → crear items desde posts
  DELETE /v2/guides/{guide_id}/instagram/connection      → desconectar Instagram
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v2.auth import get_current_user
from app.config import settings
from app.db import crud, get_db
from app.db.models import InstagramConnectionRow
from app.models.guide_v2 import ItemCreate, ItemOut
from app.services.instagram_client import instagram_client

router = APIRouter(tags=["instagram"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class InstagramStatusOut(BaseModel):
    connected: bool
    username: Optional[str] = None
    expires_at: Optional[datetime] = None


class InstagramMediaOut(BaseModel):
    posts: list[dict]
    next_cursor: Optional[str] = None


class InstagramImportItem(BaseModel):
    post_id: str
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    media_type: str = "IMAGE"
    permalink: Optional[str] = None
    timestamp: Optional[str] = None
    section: str = "influencers"
    badge: Optional[str] = None
    sort_order: int = 0


class InstagramImportRequest(BaseModel):
    posts: list[InstagramImportItem]


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_connection(
    guide_id: uuid.UUID, db: AsyncSession
) -> Optional[InstagramConnectionRow]:
    result = await db.execute(
        select(InstagramConnectionRow).where(InstagramConnectionRow.guide_id == guide_id)
    )
    return result.scalar_one_or_none()


async def _refresh_if_needed(
    conn: InstagramConnectionRow, db: AsyncSession
) -> InstagramConnectionRow:
    """Auto-refresh the token if it expires in less than 7 days."""
    if conn.token_expires_at:
        expires_aware = conn.token_expires_at.replace(tzinfo=timezone.utc) if conn.token_expires_at.tzinfo is None else conn.token_expires_at
        threshold = datetime.now(timezone.utc) + timedelta(days=7)
        if expires_aware < threshold:
            try:
                refreshed = await instagram_client.refresh_token(conn.access_token)
                conn.access_token = refreshed["access_token"]
                conn.token_expires_at = refreshed["expires_at"]
                conn.updated_at = datetime.now(timezone.utc)
                await db.commit()
                await db.refresh(conn)
            except Exception:
                pass  # keep using existing token; will fail when truly expired
    return conn


# ── OAuth endpoints (no auth guard — Instagram redirects here) ────────────────

@router.get("/v2/instagram/auth-url", summary="URL para iniciar conexión con Instagram")
async def get_auth_url(
    guide_id: str = Query(..., description="ID de la guía a conectar"),
    _=Depends(get_current_user),
) -> dict:
    if not settings.instagram_app_id:
        raise HTTPException(
            status_code=503,
            detail="Instagram no configurado. Añade INSTAGRAM_APP_ID al .env",
        )
    return {"auth_url": instagram_client.get_auth_url(guide_id)}


@router.get("/v2/instagram/callback", summary="Callback OAuth de Instagram", include_in_schema=False)
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(..., description="guide_id pasado como state"),
    db: AsyncSession = Depends(get_db),
):
    """
    Instagram redirige aquí después de que el influencer autoriza.
    Intercambia el código por un token de larga duración y redirige al editor.
    """
    editor_url = f"/editor/guides/{state}/instagram"

    try:
        # 1. Short-lived token
        short = await instagram_client.exchange_code(code)
        short_token = short["access_token"]
        ig_user_id = str(short.get("user_id", ""))

        # 2. Long-lived token
        long = await instagram_client.exchange_long_lived(short_token)
        access_token = long["access_token"]
        expires_at: Optional[datetime] = long.get("expires_at")

        # 3. User info
        user_info = await instagram_client.get_user_info(access_token)
        ig_username = user_info.get("username", "")
        if not ig_user_id:
            ig_user_id = str(user_info.get("id", ""))

        # 4. Parse guide_id
        try:
            guide_uuid = uuid.UUID(state)
        except ValueError:
            return RedirectResponse(url=f"{editor_url}?error=invalid_state")

        # 5. Upsert connection
        existing = await _get_connection(guide_uuid, db)
        if existing:
            existing.ig_user_id = ig_user_id
            existing.ig_username = ig_username
            existing.access_token = access_token
            existing.token_expires_at = expires_at
            existing.updated_at = datetime.now(timezone.utc)
        else:
            conn = InstagramConnectionRow(
                guide_id=guide_uuid,
                ig_user_id=ig_user_id,
                ig_username=ig_username,
                access_token=access_token,
                token_expires_at=expires_at,
            )
            db.add(conn)

        await db.commit()
        return RedirectResponse(url=f"{editor_url}?connected=1")

    except httpx.HTTPStatusError as exc:
        return RedirectResponse(url=f"{editor_url}?error=api_{exc.response.status_code}")
    except Exception:
        return RedirectResponse(url=f"{editor_url}?error=unknown")


# ── Guide-scoped endpoints (require auth) ─────────────────────────────────────

@router.get(
    "/v2/guides/{guide_id}/instagram/status",
    response_model=InstagramStatusOut,
    summary="Estado de la conexión Instagram de esta guía",
)
async def get_status(
    guide_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
) -> InstagramStatusOut:
    conn = await _get_connection(guide_id, db)
    if not conn:
        return InstagramStatusOut(connected=False)
    return InstagramStatusOut(
        connected=True,
        username=conn.ig_username,
        expires_at=conn.token_expires_at,
    )


@router.get(
    "/v2/guides/{guide_id}/instagram/media",
    response_model=InstagramMediaOut,
    summary="Feed de posts del Instagram conectado",
)
async def get_media(
    guide_id: uuid.UUID,
    after: Optional[str] = Query(None, description="Cursor para paginación"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
) -> InstagramMediaOut:
    conn = await _get_connection(guide_id, db)
    if not conn:
        raise HTTPException(status_code=404, detail="Instagram no conectado a esta guía")

    conn = await _refresh_if_needed(conn, db)

    try:
        result = await instagram_client.get_media(conn.access_token, after=after)
        return InstagramMediaOut(**result)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            raise HTTPException(status_code=401, detail="Token de Instagram expirado. Reconecta tu cuenta.")
        raise HTTPException(status_code=502, detail=f"Error de Instagram API: {exc.response.status_code}")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error obteniendo posts: {exc}")


@router.post(
    "/v2/guides/{guide_id}/instagram/import",
    response_model=list[ItemOut],
    status_code=201,
    summary="Importar posts seleccionados como fichas",
)
async def import_posts(
    guide_id: uuid.UUID,
    body: InstagramImportRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
) -> list[ItemOut]:
    conn = await _get_connection(guide_id, db)
    if not conn:
        raise HTTPException(status_code=404, detail="Instagram no conectado a esta guía")

    created: list = []
    for i, post in enumerate(body.posts):
        raw_post = {
            "id":             post.post_id,
            "caption":        post.caption or "",
            "media_url":      post.media_url,
            "thumbnail_url":  post.thumbnail_url,
            "media_type":     post.media_type,
            "permalink":      post.permalink,
            "timestamp":      post.timestamp,
        }
        item_dict = instagram_client.post_to_item_dict(
            raw_post,
            username=conn.ig_username,
            section=post.section,
            badge=post.badge,
            sort_order=post.sort_order + i,
        )
        item_row = await crud.create_item(db, guide_id, ItemCreate(**item_dict))
        created.append(item_row)

    return [ItemOut.model_validate(r) for r in created]


@router.delete(
    "/v2/guides/{guide_id}/instagram/connection",
    status_code=204,
    summary="Desconectar Instagram de esta guía",
    response_model=None,
)
async def disconnect(
    guide_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    conn = await _get_connection(guide_id, db)
    if not conn:
        raise HTTPException(status_code=404, detail="No hay conexión Instagram para esta guía")
    await db.delete(conn)
    await db.commit()
