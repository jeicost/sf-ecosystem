"""
Freepik Mystic AI image generation client.
Docs: https://docs.freepik.com/api/mystic
"""
from __future__ import annotations
import asyncio
import logging

import httpx

from app.config import settings

log = logging.getLogger(__name__)

_BASE = "https://api.freepik.com/v1/ai/mystic"
_HEADERS = {"x-freepik-api-key": settings.freepik_api_key, "Content-Type": "application/json"}

# Motor por tipo de contenido
_ENGINE_MAP = {
    "realistic": "magnific_sharpy",   # ciudades, gastronomía, personas
    "landscape": "magnific_illusio",  # paisajes, naturaleza
}

# Prompts auto-generados según tipo de guía y colección
_PROMPT_TEMPLATES = {
    # guide_type → base prompt
    "world":      "cinematic travel photography, {city_hint}, golden hour light, editorial magazine style, sharp focus",
    "local":      "aerial architectural photography of {city}, Spain, warm light, editorial magazine cover",
    "collection": "{collection_mood} photography, {city}, Spain, professional editorial, moody lighting",
    "influencer": "upscale restaurant interior dining scene, Spain, warm candlelight, editorial food & lifestyle",
    "dossier":    "modern city skyline {city}, architectural photography, editorial",
}

_COLLECTION_MOODS = {
    "foodie-selection":  "fine dining gourmet food",
    "foodie-hoodie":     "street food urban gastronomy",
    "wellness-nature":   "zen spa wellness nature",
    "nomadas-digitales": "coworking modern city lifestyle",
    "ocio-nocturno":     "vibrant nightlife bar scene",
    "estandar":          "travel city lifestyle",
}


def _build_prompt(guide_data: dict) -> tuple[str, str]:
    """Returns (prompt, engine)."""
    city        = guide_data.get("city", "")
    guide_type  = guide_data.get("guideType") or guide_data.get("guide_type", "local")
    collection  = guide_data.get("collection", "estandar")

    city_hint = city.title() if city and city.upper() != "GLOBAL" else "world landmark"
    collection_mood = _COLLECTION_MOODS.get(collection, "travel city lifestyle")

    template = _PROMPT_TEMPLATES.get(guide_type, _PROMPT_TEMPLATES["local"])
    prompt = template.format(
        city=city.title(),
        city_hint=city_hint,
        collection_mood=collection_mood,
    )

    # Engine: realistic para todo excepto wellness/naturaleza
    engine = _ENGINE_MAP["landscape"] if "wellness" in collection or "natura" in collection else _ENGINE_MAP["realistic"]

    return prompt, engine


async def generate_cover_image(
    guide_data: dict,
    custom_prompt: str | None = None,
) -> bytes:
    """
    Generate a cover image for a guide using Freepik Mystic.
    Returns raw image bytes (JPEG).
    """
    if not settings.freepik_api_key:
        raise ValueError("FREEPIK_API_KEY no configurada en .env")

    prompt, engine = _build_prompt(guide_data)
    if custom_prompt:
        prompt = custom_prompt

    log.info(f"[freepik] prompt={prompt!r} engine={engine}")

    async with httpx.AsyncClient(timeout=90) as client:
        # 1. Lanzar tarea de generación
        resp = await client.post(
            _BASE,
            headers={"x-freepik-api-key": settings.freepik_api_key, "Content-Type": "application/json"},
            json={
                "prompt": prompt,
                "aspect_ratio": "traditional_3_4",  # A4 portrait
                "engine": engine,
                "num_images": 1,
                "styling": {
                    "style": "photo",
                    "color": "warm",
                    "framing": "portrait",
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()

        # 2. Obtener task_id — Freepik puede responder sync o async
        task_id = data.get("data", {}).get("task_id") or data.get("task_id")
        if not task_id:
            # Respuesta síncrona directa con imagen
            img_url = (
                (data.get("data") or [{}])[0].get("url")
                or data.get("url")
            )
            if img_url:
                return await _download(client, img_url)
            raise ValueError(f"Freepik: respuesta inesperada — {data}")

        # 3. Polling hasta completar (máx 60s)
        for _ in range(30):
            await asyncio.sleep(2)
            poll = await client.get(
                f"{_BASE}/{task_id}",
                headers={"x-freepik-api-key": settings.freepik_api_key},
            )
            poll.raise_for_status()
            poll_data = poll.json()
            status = poll_data.get("data", {}).get("status") or poll_data.get("status")
            if status in ("COMPLETED", "SUCCESS", "completed", "success"):
                images = poll_data.get("data", {}).get("images") or poll_data.get("data", [])
                if isinstance(images, list) and images:
                    img_url = images[0].get("url") if isinstance(images[0], dict) else images[0]
                else:
                    img_url = poll_data.get("data", {}).get("url")
                if img_url:
                    return await _download(client, img_url)
                raise ValueError("Freepik: tarea completada pero sin URL de imagen")
            if status in ("FAILED", "ERROR", "failed", "error"):
                raise ValueError(f"Freepik: generación fallida — {poll_data}")

    raise TimeoutError("Freepik: tiempo de espera agotado (60s)")


async def _download(client: httpx.AsyncClient, url: str) -> bytes:
    r = await client.get(url, timeout=30)
    r.raise_for_status()
    return r.content
