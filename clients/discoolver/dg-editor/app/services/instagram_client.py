"""
Instagram Graph API client — Instagram API with Instagram Login (Dec 2024).
Requires a Meta app with instagram_business_basic scope.
"""
from __future__ import annotations

import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from app.config import settings


class InstagramClient:
    OAUTH_URL      = "https://api.instagram.com/oauth/authorize"
    TOKEN_URL      = "https://api.instagram.com/oauth/access_token"
    LONG_TOKEN_URL = "https://graph.instagram.com/access_token"
    REFRESH_URL    = "https://graph.instagram.com/refresh_access_token"
    GRAPH_URL      = "https://graph.instagram.com"

    # ── OAuth ──────────────────────────────────────────────────────────────────

    def get_auth_url(self, guide_id: str) -> str:
        """Build the Instagram OAuth authorization URL."""
        params = {
            "client_id":     settings.instagram_app_id,
            "redirect_uri":  settings.instagram_redirect_uri,
            "scope":         "instagram_business_basic",
            "response_type": "code",
            "state":         guide_id,
        }
        return f"{self.OAUTH_URL}?{urllib.parse.urlencode(params)}"

    async def exchange_code(self, code: str) -> dict:
        """Exchange short-lived auth code for a short-lived access token (guide-level flow)."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(self.TOKEN_URL, data={
                "client_id":     settings.instagram_app_id,
                "client_secret": settings.instagram_app_secret,
                "grant_type":    "authorization_code",
                "redirect_uri":  settings.instagram_redirect_uri,
                "code":          code,
            })
            resp.raise_for_status()
            return resp.json()  # {access_token, user_id}

    async def exchange_code_user(self, code: str) -> dict:
        """Exchange short-lived auth code for a short-lived access token (user-level flow)."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(self.TOKEN_URL, data={
                "client_id":     settings.instagram_app_id,
                "client_secret": settings.instagram_app_secret,
                "grant_type":    "authorization_code",
                "redirect_uri":  settings.instagram_user_redirect_uri,
                "code":          code,
            })
            resp.raise_for_status()
            return resp.json()  # {access_token, user_id}

    async def exchange_long_lived(self, short_token: str) -> dict:
        """Exchange short-lived token for a long-lived token (valid ~60 days)."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(self.LONG_TOKEN_URL, params={
                "grant_type":    "ig_exchange_token",
                "client_secret": settings.instagram_app_secret,
                "access_token":  short_token,
            })
            resp.raise_for_status()
            data = resp.json()  # {access_token, token_type, expires_in}
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 5183944))
            return {"access_token": data["access_token"], "expires_at": expires_at}

    async def refresh_token(self, token: str) -> dict:
        """Refresh a long-lived token (call when < 7 days remaining)."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(self.REFRESH_URL, params={
                "grant_type":   "ig_refresh_token",
                "access_token": token,
            })
            resp.raise_for_status()
            data = resp.json()
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 5183944))
            return {"access_token": data["access_token"], "expires_at": expires_at}

    # ── Graph API ──────────────────────────────────────────────────────────────

    async def get_user_info(self, token: str) -> dict:
        """GET /me — returns id, username, account_type, media_count, profile_picture_url."""
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{self.GRAPH_URL}/me", params={
                "fields":       "id,username,account_type,media_count,profile_picture_url",
                "access_token": token,
            })
            resp.raise_for_status()
            return resp.json()

    async def get_media(self, token: str, after: Optional[str] = None) -> dict:
        """
        GET /me/media — returns paginated media list.
        For CAROUSEL_ALBUM, also fetches the first child image URL.
        """
        params: dict = {
            "fields":       "id,caption,media_url,thumbnail_url,timestamp,media_type,permalink",
            "access_token": token,
        }
        if after:
            params["after"] = after

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(f"{self.GRAPH_URL}/me/media", params=params)
            resp.raise_for_status()
            data = resp.json()

            posts = data.get("data", [])
            # For carousels, fetch first child's media_url
            for post in posts:
                if post.get("media_type") == "CAROUSEL_ALBUM" and not post.get("media_url"):
                    child_url = await self._get_carousel_first_image(client, post["id"], token)
                    if child_url:
                        post["media_url"] = child_url

            next_cursor = None
            paging = data.get("paging", {})
            cursors = paging.get("cursors", {})
            if paging.get("next"):
                next_cursor = cursors.get("after")

            return {"posts": posts, "next_cursor": next_cursor}

    async def _get_carousel_first_image(
        self, client: httpx.AsyncClient, media_id: str, token: str
    ) -> Optional[str]:
        try:
            resp = await client.get(
                f"{self.GRAPH_URL}/{media_id}/children",
                params={"fields": "media_url", "access_token": token},
            )
            children = resp.json().get("data", [])
            if children:
                return children[0].get("media_url")
        except Exception:
            pass
        return None

    # ── Mapping ────────────────────────────────────────────────────────────────

    def post_to_item_dict(
        self,
        post: dict,
        username: str = "",
        section: str = "influencers",
        badge: Optional[str] = None,
        sort_order: int = 0,
    ) -> dict:
        """Map an Instagram post to a dict compatible with ItemCreate."""
        caption = (post.get("caption") or "").strip()
        lines = [l.strip() for l in caption.splitlines() if l.strip()]

        # name: first line of caption (≤100 chars) or @username
        if lines:
            name = lines[0][:100]
            tagline = lines[1][:150] if len(lines) > 1 else ""
        else:
            name = f"@{username}" if username else "Instagram post"
            tagline = ""

        # photo: IMAGE → media_url; VIDEO/REEL → thumbnail_url
        media_type = post.get("media_type", "IMAGE")
        if media_type in ("VIDEO", "REEL"):
            photo_url = post.get("thumbnail_url") or post.get("media_url")
        else:
            photo_url = post.get("media_url") or post.get("thumbnail_url")

        return {
            "item_type":   "recomendado",
            "section":     section,
            "name":        name,
            "tagline":     tagline,
            "description": caption,
            "photo_url":   photo_url,
            "enabled":     True,
            "sort_order":  sort_order,
            "badge":       badge,
            "extra": {
                "instagram_post_id":   post.get("id"),
                "instagram_permalink": post.get("permalink"),
                "instagram_media_type": media_type,
                "instagram_timestamp": post.get("timestamp"),
            },
        }


instagram_client = InstagramClient()
