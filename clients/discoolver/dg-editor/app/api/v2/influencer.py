"""
Influencer routes — user-level Instagram OAuth + AI classification + guide import.

Instagram flow for influencers (user-level, not guide-level):
  GET  /v2/users/me/instagram/auth-url         → OAuth URL
  GET  /v2/instagram/user-callback             → OAuth callback (public, no auth)
  GET  /v2/users/me/instagram/status           → connected? username? expires?
  GET  /v2/users/me/instagram/media            → paginated feed
  DELETE /v2/users/me/instagram/connection     → disconnect

AI endpoints:
  POST /v2/users/me/instagram/classify         → classify feed posts as recommendations
  POST /v2/users/me/instagram/suggest-guides   → propose guide topics from content

Guide import:
  POST /v2/guides/{guide_id}/instagram/import-user → import selected classified posts
"""
from __future__ import annotations

import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v2.auth import TokenData, get_current_user, require_active
from app.config import settings
from app.db import get_db
from app.db.models import UserInstagramRow, UserRow
from app.db import crud
from app.models.guide_v2 import ItemCreate, ItemType
from app.services.instagram_client import instagram_client
from app.services.instagram_ai import classify_posts, suggest_guides

router = APIRouter(tags=["influencer"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class IGStatusOut(BaseModel):
    connected: bool
    username: Optional[str] = None
    expires_at: Optional[datetime] = None


class IGMediaOut(BaseModel):
    posts: list[dict]
    next_cursor: Optional[str] = None


class ClassifyRequest(BaseModel):
    cursor: Optional[str] = None  # fetch from this cursor onwards; None = latest
    limit: int = 30               # max posts to classify in one call (1-50)


class ClassifiedPost(BaseModel):
    post_id: str
    is_recommendation: bool
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    badge: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    location_hint: Optional[str] = None
    # Original post data kept so frontend can show the image
    photo_url: Optional[str] = None
    permalink: Optional[str] = None
    media_type: Optional[str] = None
    timestamp: Optional[str] = None


class ClassifyResult(BaseModel):
    classified: list[ClassifiedPost]
    total: int
    recommendations_found: int


class GuideSuggestion(BaseModel):
    title: str
    city: Optional[str] = None
    guide_type: str = "influencer"
    estimated_items: int
    sections: list[str]
    rationale: str
    post_count_supporting: int


class SuggestGuidesResult(BaseModel):
    suggestions: list[GuideSuggestion]


class ImportPostItem(BaseModel):
    post_id: str
    name: str
    category: str            # maps to section
    subcategory: Optional[str] = None
    badge: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    permalink: Optional[str] = None
    sort_order: int = 0


class ImportFromUserRequest(BaseModel):
    posts: list[ImportPostItem]


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_user_ig(db: AsyncSession, user_id: uuid.UUID) -> Optional[UserInstagramRow]:
    result = await db.execute(
        select(UserInstagramRow).where(UserInstagramRow.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def _get_valid_token(conn: UserInstagramRow, db: AsyncSession) -> str:
    """Return token, auto-refreshing if it expires in < 7 days."""
    now = datetime.now(timezone.utc)
    expires = conn.token_expires_at
    if expires:
        # Make naive datetime timezone-aware for comparison
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < now + timedelta(days=7):
            refreshed = await instagram_client.refresh_token(conn.access_token)
            conn.access_token = refreshed["access_token"]
            new_exp = refreshed["expires_at"]
            conn.token_expires_at = new_exp.replace(tzinfo=None) if new_exp.tzinfo else new_exp
            conn.updated_at = datetime.utcnow()
            await db.flush()
    return conn.access_token


# ── Instagram OAuth (user-level) ──────────────────────────────────────────────

@router.get("/v2/users/me/instagram/auth-url")
async def user_ig_auth_url(current: TokenData = Depends(require_active)):
    """Build the Meta OAuth URL for user-level Instagram connection."""
    if not settings.instagram_app_id:
        raise HTTPException(status_code=503, detail="Instagram no configurado. Contacta al administrador.")

    params = {
        "client_id":     settings.instagram_app_id,
        "redirect_uri":  settings.instagram_user_redirect_uri,
        "scope":         "instagram_business_basic",
        "response_type": "code",
        "state":         current.user_id,  # user_id encoded in state
    }
    auth_url = f"https://api.instagram.com/oauth/authorize?{urllib.parse.urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/v2/instagram/user-callback")
async def user_ig_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),   # user_id
    error: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth callback for user-level Instagram connection (no Bearer auth — Meta redirects here).
    Stores connection in UserInstagramRow then redirects to /editor.
    """
    if error:
        return RedirectResponse(url=f"/editor?ig_error={error}")

    if not code or not state:
        return RedirectResponse(url="/editor?ig_error=missing_params")

    try:
        user_id = uuid.UUID(state)
    except ValueError:
        return RedirectResponse(url="/editor?ig_error=invalid_state")

    # Verify user exists
    result = await db.execute(select(UserRow).where(UserRow.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return RedirectResponse(url="/editor?ig_error=user_not_found")

    try:
        # Exchange code → short-lived token
        token_data = await instagram_client.exchange_code_user(code)
        short_token = token_data["access_token"]
        ig_user_id = str(token_data["user_id"])

        # Exchange → long-lived token
        long_data = await instagram_client.exchange_long_lived(short_token)
        access_token = long_data["access_token"]
        expires_at = long_data["expires_at"]

        # Get IG username + profile picture (best-effort)
        ig_info = await instagram_client.get_user_info(access_token)
        ig_username = ig_info.get("username", "")
        profile_picture_url = ig_info.get("profile_picture_url")

        # Sync profile photo and handle to UserRow
        if profile_picture_url and not user.profile_photo_url:
            user.profile_photo_url = profile_picture_url
        if not user.ig_handle and ig_username:
            user.ig_handle = ig_username

        # Upsert UserInstagramRow
        existing = await _get_user_ig(db, user_id)
        if existing:
            existing.ig_user_id = ig_user_id
            existing.ig_username = ig_username
            existing.access_token = access_token
            existing.token_expires_at = expires_at.replace(tzinfo=None) if expires_at.tzinfo else expires_at
            existing.updated_at = datetime.utcnow()
        else:
            conn = UserInstagramRow(
                user_id=user_id,
                ig_user_id=ig_user_id,
                ig_username=ig_username,
                access_token=access_token,
                token_expires_at=expires_at.replace(tzinfo=None) if expires_at.tzinfo else expires_at,
            )
            db.add(conn)

        await db.flush()
        return RedirectResponse(url="/portal?ig_connected=1")

    except Exception as e:
        return RedirectResponse(url=f"/editor?ig_error={urllib.parse.quote(str(e)[:100])}")


# ── Instagram status / media ──────────────────────────────────────────────────

@router.get("/v2/users/me/instagram/status", response_model=IGStatusOut)
async def user_ig_status(
    current: TokenData = Depends(require_active),
    db: AsyncSession = Depends(get_db),
):
    if not current.user_id:
        raise HTTPException(status_code=400, detail="user_id no disponible en el token")
    conn = await _get_user_ig(db, uuid.UUID(current.user_id))
    if not conn:
        return IGStatusOut(connected=False)
    return IGStatusOut(
        connected=True,
        username=conn.ig_username,
        expires_at=conn.token_expires_at,
    )


@router.get("/v2/users/me/instagram/media", response_model=IGMediaOut)
async def user_ig_media(
    cursor: Optional[str] = Query(None),
    current: TokenData = Depends(require_active),
    db: AsyncSession = Depends(get_db),
):
    if not current.user_id:
        raise HTTPException(status_code=400, detail="user_id no disponible en el token")

    conn = await _get_user_ig(db, uuid.UUID(current.user_id))
    if not conn:
        raise HTTPException(status_code=404, detail="Instagram no conectado")

    token = await _get_valid_token(conn, db)
    data = await instagram_client.get_media(token, after=cursor)
    return IGMediaOut(posts=data["posts"], next_cursor=data.get("next_cursor"))


@router.delete("/v2/users/me/instagram/connection", status_code=204)
async def user_ig_disconnect(
    current: TokenData = Depends(require_active),
    db: AsyncSession = Depends(get_db),
):
    if not current.user_id:
        raise HTTPException(status_code=400, detail="user_id no disponible en el token")

    conn = await _get_user_ig(db, uuid.UUID(current.user_id))
    if conn:
        await db.delete(conn)
        await db.flush()


# ── AI: classify posts ────────────────────────────────────────────────────────

@router.post("/v2/users/me/instagram/classify", response_model=ClassifyResult)
async def classify_user_posts(
    data: ClassifyRequest,
    current: TokenData = Depends(require_active),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch posts from the user's Instagram and use Claude to classify
    which ones are place recommendations, extracting editorial content.
    """
    if not current.user_id:
        raise HTTPException(status_code=400, detail="user_id no disponible en el token")

    conn = await _get_user_ig(db, uuid.UUID(current.user_id))
    if not conn:
        raise HTTPException(status_code=404, detail="Conecta tu Instagram antes de clasificar")

    limit = max(1, min(data.limit, 50))
    token = await _get_valid_token(conn, db)
    media_data = await instagram_client.get_media(token, after=data.cursor)
    posts = media_data["posts"][:limit]

    if not posts:
        return ClassifyResult(classified=[], total=0, recommendations_found=0)

    raw_classified = await classify_posts(posts, conn.ig_username)

    # Merge photo_url from original posts into classified results
    posts_by_id = {p["id"]: p for p in posts}
    classified = []
    for item in raw_classified:
        original = posts_by_id.get(item.get("post_id", ""), {})
        media_type = original.get("media_type", "IMAGE")
        if media_type in ("VIDEO", "REEL"):
            photo = original.get("thumbnail_url") or original.get("media_url")
        else:
            photo = original.get("media_url") or original.get("thumbnail_url")

        classified.append(ClassifiedPost(
            post_id=item.get("post_id", ""),
            is_recommendation=item.get("is_recommendation", False),
            name=item.get("name"),
            category=item.get("category"),
            subcategory=item.get("subcategory"),
            badge=item.get("badge"),
            tagline=item.get("tagline"),
            description=item.get("description"),
            location_hint=item.get("location_hint"),
            photo_url=photo,
            permalink=original.get("permalink"),
            media_type=media_type,
            timestamp=original.get("timestamp"),
        ))

    recs = sum(1 for c in classified if c.is_recommendation)
    return ClassifyResult(classified=classified, total=len(classified), recommendations_found=recs)


# ── AI: suggest guides ────────────────────────────────────────────────────────

class SuggestFromClassifiedRequest(BaseModel):
    classified: list[dict]  # output from /classify, passed back by the client


@router.post("/v2/users/me/instagram/suggest-guides", response_model=SuggestGuidesResult)
async def suggest_user_guides(
    data: SuggestFromClassifiedRequest,
    current: TokenData = Depends(require_active),
    db: AsyncSession = Depends(get_db),
):
    """
    Given classified posts (from /classify), propose which guides the influencer
    could create and what content would go in each.
    """
    if not current.user_id:
        raise HTTPException(status_code=400, detail="user_id no disponible en el token")

    conn = await _get_user_ig(db, uuid.UUID(current.user_id))
    username = conn.ig_username if conn else "influencer"

    suggestions_raw = await suggest_guides(data.classified, username)

    suggestions = []
    for s in suggestions_raw:
        suggestions.append(GuideSuggestion(
            title=s.get("title", ""),
            city=s.get("city"),
            guide_type=s.get("guide_type", "influencer"),
            estimated_items=s.get("estimated_items", 0),
            sections=s.get("sections", []),
            rationale=s.get("rationale", ""),
            post_count_supporting=s.get("post_count_supporting", 0),
        ))

    return SuggestGuidesResult(suggestions=suggestions)


# ── Import classified posts into a guide ──────────────────────────────────────

@router.post("/v2/guides/{guide_id}/instagram/import-user", status_code=201)
async def import_user_posts_to_guide(
    guide_id: uuid.UUID,
    data: ImportFromUserRequest,
    current: TokenData = Depends(require_active),
    db: AsyncSession = Depends(get_db),
):
    """
    Import selected classified posts into a guide as recomendado items.
    Works for both influencers (their own guides) and editors (any guide).
    """
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    # Influencers can only import into their own guides
    if current.role == "influencer" and str(guide.owner_id) != current.user_id:
        raise HTTPException(status_code=403, detail="Solo puedes importar a tus propias guías")

    # Get current max sort_order per section
    max_order: dict[str, int] = {}
    for item in guide.items:
        max_order[item.section] = max(max_order.get(item.section, -1), item.sort_order) + 1

    created = []
    for post in data.posts:
        section = post.category  # category from classification maps to section
        sort_order = max_order.get(section, 0)
        max_order[section] = sort_order + 1

        item = await crud.create_item(db, guide_id, ItemCreate(
            item_type=ItemType.recomendado,
            section=section,
            subcategory=post.subcategory,
            badge=post.badge,
            name=post.name,
            tagline=post.tagline,
            description=post.description,
            photo_url=post.photo_url,
            sort_order=sort_order,
            enabled=True,
            extra={
                "instagram_post_id":  post.post_id,
                "instagram_permalink": post.permalink,
                "imported_by":        current.email,
            },
        ))
        created.append({"id": str(item.id), "name": item.name, "section": item.section})

    return {"created": len(created), "items": created}
