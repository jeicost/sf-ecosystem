"""
IA classification of Instagram posts for influencer guide generation.

Two main functions:
  classify_posts()   — decide which posts are place recommendations + extract editorial content
  suggest_guides()   — group classified recommendations into potential guide topics
"""
from __future__ import annotations

import json
from typing import Optional

import anthropic

from app.config import settings

# ── Sections available in influencer guides ───────────────────────────────────
INFLUENCER_SECTIONS = [
    "restaurantes",
    "fiesta",
    "ocio_eventos",
    "arte_exposiciones",
    "experiencias",
    "alojamientos",
    "shopping",
]

SECTION_BADGES: dict[str, list[str]] = {
    "restaurantes":      ["WOW", "LUXURY", "LOCAL", "ICÓNICO", "TRENDY"],
    "fiesta":            ["WOW", "LUXURY", "LOCAL", "ICÓNICO"],
    "ocio_eventos":      ["WOW", "LOCAL", "IMPRESCINDIBLE"],
    "arte_exposiciones": ["ICÓNICO", "EMERGENTE", "IMPRESCINDIBLE"],
    "experiencias":      ["WOW", "LUXURY", "LOCAL", "ÚNICA"],
    "alojamientos":      ["LUXURY", "BOUTIQUE", "LOCAL", "DESIGN"],
    "shopping":          ["LOCAL", "LUXURY", "TRENDY", "VINTAGE"],
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_json(raw: str) -> list:
    """Extract JSON array from Claude response (handles markdown code blocks)."""
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    return json.loads(raw)


# ── classify_posts ────────────────────────────────────────────────────────────

CLASSIFY_SYSTEM = """
Eres el asistente editorial de Discoolver, la guía de viajes más cool del mundo.
Tu tarea es analizar posts de Instagram de un creador de contenido e identificar
cuáles son recomendaciones reales de lugares (restaurantes, bares, hoteles,
experiencias, tiendas, museos, etc.).

Para cada post que SÍ sea una recomendación, extraes contenido editorial conciso:
- Estilo Discoolver: directo, cómplice, dato concreto, sin adjetivos genéricos
- Tagline: 5-10 palabras, modo editorial
- Descripción: 2-3 frases máximo
- Siempre en español, salvo nombres propios

Para posts que NO son recomendaciones (selfies, reposts, contenido personal sin lugar),
simplemente marca is_recommendation: false.
"""


async def classify_posts(
    posts: list[dict],
    username: str,
    city_hint: str = "",
) -> list[dict]:
    """
    Classify Instagram posts to identify place recommendations.

    Args:
        posts:      list of post dicts from Instagram Graph API
        username:   influencer's @handle (for context)
        city_hint:  optional city/country context to help IA

    Returns:
        list of classification dicts, one per post
    """
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY no configurada")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    results: list[dict] = []

    # Process in batches of 15 to stay within token limits
    batch_size = 15
    for i in range(0, len(posts), batch_size):
        batch = posts[i : i + batch_size]
        batch_results = await _classify_batch(client, batch, username, city_hint)
        results.extend(batch_results)

    return results


async def _classify_batch(
    client: anthropic.Anthropic,
    posts: list[dict],
    username: str,
    city_hint: str,
) -> list[dict]:
    location_context = f"El influencer publica principalmente desde: {city_hint}." if city_hint else ""

    posts_summary = []
    for post in posts:
        caption = (post.get("caption") or "").strip()[:400]
        posts_summary.append({
            "post_id":    post.get("id", ""),
            "media_type": post.get("media_type", "IMAGE"),
            "caption":    caption,
            "timestamp":  post.get("timestamp", ""),
        })

    sections_list = ", ".join(INFLUENCER_SECTIONS)
    badges_hint = json.dumps(SECTION_BADGES, ensure_ascii=False)

    prompt = f"""Influencer: @{username}
{location_context}

Analiza estos {len(posts)} posts de Instagram y clasifica cada uno.

Posts:
{json.dumps(posts_summary, ensure_ascii=False, indent=2)}

Devuelve SOLO un array JSON válido con exactamente {len(posts)} objetos, uno por post, en el mismo orden:
[
  {{
    "post_id": "mismo id del post",
    "is_recommendation": true o false,
    "name": "Nombre del lugar (null si no es recomendación)",
    "category": "una de: {sections_list} (null si no aplica)",
    "subcategory": "subcategoría específica o null",
    "badge": "badge apropiado según el lugar (opciones por sección: {badges_hint}) o null",
    "tagline": "5-10 palabras estilo Discoolver o null",
    "description": "2-3 frases editoriales concisas o null",
    "location_hint": "ciudad/país inferido del post o null"
  }}
]

Reglas:
- is_recommendation=true solo si el post muestra claramente un lugar concreto al que ir
- Selfies, paisajes genéricos, reposts, contenido personal → is_recommendation=false
- Si el caption nombra el lugar, úsalo como name
- description: nunca uses "increíble", "espectacular", "sin duda"
- Devuelve exactamente {len(posts)} objetos en el mismo orden que el input"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        system=CLASSIFY_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    try:
        batch_results = _extract_json(raw)
        # Safety: ensure we have one result per post
        if len(batch_results) != len(posts):
            raise ValueError(f"Expected {len(posts)} results, got {len(batch_results)}")
        return batch_results
    except Exception as e:
        # Fallback: return all posts as non-recommendations with error note
        return [
            {"post_id": p.get("id", ""), "is_recommendation": False, "_error": str(e)}
            for p in posts
        ]


# ── suggest_guides ────────────────────────────────────────────────────────────

SUGGEST_SYSTEM = """
Eres el editor jefe de Discoolver. Basándote en las recomendaciones de un creador
de contenido, propones los temas de guías que tendría sentido crear para publicar
en la plataforma.

Piensas en qué guías serían más valiosas para los usuarios de Discoolver:
- Guías por ciudad/destino con suficiente masa crítica de recomendaciones
- Guías temáticas (solo restaurantes, solo alojamientos, etc.) si hay suficiente contenido
- No propongas guías con menos de 4 recomendaciones potenciales
"""


async def suggest_guides(classified_posts: list[dict], username: str) -> list[dict]:
    """
    Analyze classified recommendations and suggest guide topics.

    Args:
        classified_posts:  output from classify_posts() — only is_recommendation=true items used
        username:          influencer's @handle

    Returns:
        list of guide suggestion dicts
    """
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY no configurada")

    recommendations = [p for p in classified_posts if p.get("is_recommendation")]
    if not recommendations:
        return []

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    # Send only the fields relevant for grouping
    recs_summary = [
        {
            "name":          r.get("name"),
            "category":      r.get("category"),
            "location_hint": r.get("location_hint"),
            "badge":         r.get("badge"),
        }
        for r in recommendations
    ]

    prompt = f"""Influencer: @{username}
Total de recomendaciones identificadas: {len(recommendations)}

Recomendaciones:
{json.dumps(recs_summary, ensure_ascii=False, indent=2)}

Propón las guías que debería crear este influencer para Discoolver.

Devuelve SOLO un array JSON válido:
[
  {{
    "title": "Título de la guía (ej: 'Bangkok' o 'Restaurantes de Madrid')",
    "city": "ciudad principal o null si es temática",
    "guide_type": "world o local o influencer",
    "estimated_items": número estimado de recomendaciones,
    "sections": ["lista", "de", "secciones", "relevantes"],
    "rationale": "1-2 frases explicando por qué esta guía tiene sentido",
    "post_count_supporting": número de posts que sustentan esta guía
  }}
]

Reglas:
- Solo propón guías con al menos 4 recomendaciones potenciales
- Prioriza destinos con más concentración de contenido
- Máximo 5 sugerencias
- Si hay poco contenido, sugiere menos guías pero más sólidas"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=SUGGEST_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    try:
        return _extract_json(raw)
    except Exception:
        return []
