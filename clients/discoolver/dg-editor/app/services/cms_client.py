"""
Cliente async para la API del CMS de Discoolver (api.discoolver.com).

Auth: POST /cms/v1/user → CMSAuthorization token (header en peticiones siguientes).
El token se cachea en memoria y se renueva automáticamente al recibir 401.
"""
from __future__ import annotations

import asyncio
import logging
import re
from typing import Any, Optional

import httpx

from app.config import settings

log = logging.getLogger(__name__)


def _strip_html(html: Optional[str]) -> Optional[str]:
    """Quita tags HTML (Quill editor), entidades comunes y colapsa espacios."""
    if not html:
        return None
    text = re.sub(r"<[^>]+>", " ", html)
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    text = re.sub(r"\s+", " ", text).strip()
    return text or None

# ── Mapeo CMS category → sección de la guía ──────────────────────────────────
# Ajustar si el desarrollador confirma nombres exactos de categorías en el CMS.
_CATEGORY_TO_SECTION: dict[str, str] = {
    "restaurante":    "restaurantes",
    "restaurantes":   "restaurantes",
    "bar":            "fiesta",
    "club":           "fiesta",
    "discoteca":      "fiesta",
    "fiesta":         "fiesta",
    "ocio":           "ocio",
    "experiencia":    "experiencias",
    "experiencias":   "experiencias",
    "arte":           "arte",
    "cultura":        "arte",
    "hotel":          "alojamientos",
    "alojamiento":    "alojamientos",
    "alojamientos":   "alojamientos",
    "tienda":         "shopping",
    "shopping":       "shopping",
    "moda":           "shopping",
}

DEFAULT_SECTION = "ocio"


def _map_section(category_name: str) -> str:
    key = category_name.lower().strip()
    for fragment, section in _CATEGORY_TO_SECTION.items():
        if fragment in key:
            return section
    return DEFAULT_SECTION


# ── CMS Client ────────────────────────────────────────────────────────────────

class CMSClient:
    """Singleton async client para api.discoolver.com."""

    def __init__(self) -> None:
        self._token: Optional[str] = None
        self._lock = asyncio.Lock()
        self.base_url = settings.cms_api_url.rstrip("/")
        self._client: Optional[httpx.AsyncClient] = None

    def _http(self) -> httpx.AsyncClient:
        """Returns (or creates) the shared persistent HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=15.0)
        return self._client

    # ── Auth ──────────────────────────────────────────────────────────────────

    async def _login(self) -> str:
        """Obtiene un nuevo CMSAuthorization token."""
        resp = await self._http().post(
            f"{self.base_url}/cms/v1/user",
            json={"user": settings.cms_api_user, "password": settings.cms_api_password},
        )
        resp.raise_for_status()
        data = resp.json()
        token = (
            data.get("token")
            or data.get("authorization")
            or data.get("CMSAuthorization")
            or data.get("access_token")
            or data.get("jwt")
        )
        if not token:
            raise ValueError(f"CMS login: no se encontró token en respuesta: {list(data.keys())}")
        log.info("[CMS] Login OK — token obtenido")
        return str(token)

    async def _get_token(self) -> str:
        async with self._lock:
            if not self._token:
                self._token = await self._login()
        return self._token

    def _auth_headers(self, token: str) -> dict[str, str]:
        return {"CMSAuthorization": token}

    # ── Request helper con auto-retry en 401 ─────────────────────────────────

    async def _get(self, path: str, params: Optional[dict] = None) -> Any:
        token = await self._get_token()
        client = self._http()
        resp = await client.get(
            f"{self.base_url}{path}",
            headers=self._auth_headers(token),
            params=params,
        )
        if resp.status_code == 401:
            async with self._lock:
                self._token = None
                self._token = await self._login()
            resp = await client.get(
                f"{self.base_url}{path}",
                headers=self._auth_headers(self._token),
                params=params,
            )
        resp.raise_for_status()
        return resp.json()

    # ── Endpoints de catálogo ─────────────────────────────────────────────────

    async def get_cities(self, language: str = "es") -> list[dict]:
        data = await self._get(f"/cms/v1/city/{language}")
        return data if isinstance(data, list) else data.get("data", data.get("cities", []))

    async def get_categories(self, language: str = "es") -> list[dict]:
        data = await self._get(f"/cms/v1/category/{language}")
        return data if isinstance(data, list) else data.get("data", data.get("categories", []))

    async def get_subregions(self, language: str = "es") -> list[dict]:
        data = await self._get(f"/cms/v1/subregion/{language}/actives")
        return data if isinstance(data, list) else data.get("data", [])

    # ── Búsqueda de recomendados ──────────────────────────────────────────────

    async def search_businesses(
        self,
        *,
        language: str = "es",
        city: Optional[int] = None,
        category: Optional[int] = None,
        subcategory: Optional[int] = None,
        name: str = "",
        state: Optional[int] = None,         # 4 = publicado (según Postman)
        outstanding: int = 0,
        outstanding_in_category: int = 0,
        sponsored: int = 0,
    ) -> list[dict]:
        params: dict[str, Any] = {"language": language, "name": name}
        if city is not None:
            params["city"] = city
        if category is not None:
            params["category"] = category
        if subcategory is not None:
            params["subcategory"] = subcategory
        if state is not None:
            params["state"] = state
        params["outstanding"] = outstanding
        params["outstandingInCategory"] = outstanding_in_category
        params["sponsored"] = sponsored

        data = await self._get("/cms/v1/business", params=params)
        return data if isinstance(data, list) else data.get("data", data.get("businesses", []))

    async def get_business_detail(self, business_id: int, language: str = "es") -> dict:
        data = await self._get(f"/cms/v1/business/{business_id}/{language}")
        return data if isinstance(data, dict) else data.get("data", {})

    async def get_business_gallery(self, business_id: int) -> list[dict]:
        data = await self._get(f"/cms/v2/gallery/{business_id}")
        return data if isinstance(data, list) else data.get("data", data.get("images", []))

    async def get_business_contacts(self, business_id: int) -> list[dict]:
        data = await self._get(f"/cms/v2/contact/{business_id}")
        return data if isinstance(data, list) else data.get("data", [])

    # ── Conversión business → ItemCreate dict ────────────────────────────────

    def business_to_item_dict(
        self,
        biz: dict,
        section: Optional[str] = None,
        gallery: Optional[list[dict]] = None,
    ) -> dict:
        """
        Convierte un business del CMS (campos reales de api.discoolver.com) al
        dict que acepta ItemCreate.
        Campos clave: title, subtitle, description, web, address,
                      urlDiscoolver, categories[0].rawId, id
        Gallery item clave: cloudUrl
        """
        # Sección: inferir de categories[0].rawId si no se pasa explícitamente
        cat_raw = ""
        cats = biz.get("categories") or []
        if cats and isinstance(cats[0], dict):
            cat_raw = cats[0].get("rawId") or cats[0].get("name") or ""
        resolved_section = section or _map_section(str(cat_raw))

        # Foto principal: primera imagen con cloudUrl de la galería
        photo_url: Optional[str] = None
        if gallery:
            for img in gallery:
                cloud = img.get("cloudUrl")
                if cloud:
                    photo_url = cloud
                    break

        # URL canónica en discoolver.com
        url_path = biz.get("urlDiscoolver") or biz.get("url")
        discoolver_url = f"https://discoolver.com/{url_path}" if url_path else None

        # Descripción: viene como HTML de Quill — se limpia a texto plano
        description = _strip_html(biz.get("description")) or _strip_html(biz.get("descriptionShort"))

        # extra: cms_id + city para trazabilidad y futuros cruces
        city_raw = ""
        if isinstance(biz.get("city"), dict):
            city_raw = biz["city"].get("rawId") or ""

        extra = {
            "cms_id": biz.get("id"),
            "cms_city": city_raw,
            "cms_category_raw": cat_raw,
        }

        return {
            "item_type": "recomendado",
            "section": resolved_section,
            "name": biz.get("title") or "",
            "tagline": biz.get("subtitle"),
            "description": description,
            "photo_url": photo_url,
            "web": biz.get("web"),
            "address": biz.get("address") or None,
            "discoolver_url": discoolver_url,
            "badge": None,
            "sort_order": 0,
            "enabled": True,
            "extra": extra,
        }


# ── Singleton global ──────────────────────────────────────────────────────────
cms = CMSClient()
