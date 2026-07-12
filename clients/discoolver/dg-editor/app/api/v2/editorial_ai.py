"""Claude API — generación editorial de textos para fichas de guía."""
from __future__ import annotations
import uuid
import json

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db, crud
from app.models.guide_v2 import AIGenerateRequest, AIGenerateResult, ItemUpdate, ItemCreate, ItemType

router = APIRouter(prefix="/v2/guides/{guide_id}/ai", tags=["ai-editorial"])

# Guía de estilo Discoolver — se incluye en cada prompt
STYLE_GUIDE = """
Eres el editor de contenido de discoolver, la guía de viajes más cool del mundo.
Tu estilo de escritura es:
- Conciso, directo, sin relleno
- Tono cómplice, como un amigo local que te da el dato
- Máximo 3-4 frases por descripción de lugar
- Nunca uses "sin duda", "increíble", "maravilloso", "espectacular" de forma genérica
- Usa datos concretos: año de apertura, qué lo hace único, para qué tipo de persona es ideal
- Para recomendados de fiesta: atmósfera primero, luego qué ofrece
- Para restaurantes: propuesta gastronómica primero, luego ambiente
- Para alojamientos: el elemento diferencial único primero
- Para experiencias: la emoción/sensación primero, luego los detalles
- Para arte/exposiciones: el artista y la pieza clave primero
- El tagline es una frase corta (5-10 palabras) que sintetiza la propuesta en modo editorial
- Siempre en español, salvo nombres propios
"""


@router.post("/generate", response_model=AIGenerateResult)
async def generate_editorial_text(
    guide_id: uuid.UUID,
    data: AIGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Genera textos editoriales (description y/o tagline) para las fichas
    de una guía usando Claude con la guía de estilo Discoolver.
    """
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada")

    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    # Cargar items a procesar
    if data.item_ids:
        items = [i for i in guide.items if i.id in data.item_ids]
    else:
        items = list(guide.items)

    # Filtrar solo items con datos básicos pero sin texto (o todos si overwrite)
    target_items = []
    for item in items:
        needs_description = not item.description or data.overwrite
        needs_tagline = (not item.tagline or data.overwrite) and data.field in ("tagline", "both")
        if (data.field == "description" and needs_description) or \
           (data.field == "tagline" and needs_tagline) or \
           (data.field == "both" and (needs_description or needs_tagline)):
            if item.name:
                target_items.append(item)

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    generated = 0
    skipped = 0
    result_items = []

    for item in target_items:
        try:
            context_parts = [
                f"Lugar: {item.name}",
                f"Sección de la guía: {item.section}",
            ]
            if item.subcategory:
                context_parts.append(f"Subcategoría: {item.subcategory}")
            if item.address:
                context_parts.append(f"Ubicación: {item.address}")
            if item.web:
                context_parts.append(f"Web: {item.web}")
            if item.tagline and data.field == "description":
                context_parts.append(f"Tagline existente: {item.tagline}")
            if data.style_hint:
                context_parts.append(f"Contexto adicional: {data.style_hint}")

            city = guide.city
            context = "\n".join(context_parts)

            if data.field == "both":
                prompt = (
                    f"Para la Guía Discoolver {city}:\n{context}\n\n"
                    f"Escribe:\n"
                    f"TAGLINE: (máx 10 palabras, estilo editorial)\n"
                    f"DESCRIPCION: (2-3 frases, estilo Discoolver)\n\n"
                    f"Solo el texto, sin comillas, sin explicaciones."
                )
            elif data.field == "tagline":
                prompt = (
                    f"Para la Guía Discoolver {city}:\n{context}\n\n"
                    f"Escribe un tagline editorial (máx 10 palabras) para este lugar.\n"
                    f"Solo el tagline, sin comillas, sin explicaciones."
                )
            else:  # description
                prompt = (
                    f"Para la Guía Discoolver {city}:\n{context}\n\n"
                    f"Escribe una descripción editorial (2-3 frases) para este lugar.\n"
                    f"Solo el texto de la descripción, sin comillas, sin explicaciones."
                )

            message = client.messages.create(
                model="claude-haiku-4-5-20251001",  # rápido y barato para generación masiva
                max_tokens=200,
                system=STYLE_GUIDE,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text.strip()

            update_data = {}
            if data.field == "both":
                lines = response_text.split("\n")
                for line in lines:
                    if line.upper().startswith("TAGLINE:"):
                        update_data["tagline"] = line.split(":", 1)[1].strip()
                    elif line.upper().startswith("DESCRIPCION:") or line.upper().startswith("DESCRIPCIÓN:"):
                        update_data["description"] = line.split(":", 1)[1].strip()
                # Fallback si no tiene el formato esperado
                if not update_data:
                    update_data["description"] = response_text
            elif data.field == "tagline":
                update_data["tagline"] = response_text
            else:
                update_data["description"] = response_text

            updated = await crud.update_item(db, item.id, ItemUpdate(**update_data))
            result_items.append({
                "id": str(item.id),
                "name": item.name,
                **update_data,
            })
            generated += 1

        except Exception as e:
            skipped += 1
            result_items.append({
                "id": str(item.id),
                "name": item.name,
                "error": str(e),
            })

    return AIGenerateResult(
        generated=generated,
        skipped=skipped,
        items=result_items,
    )


# ── Suggest endpoints ─────────────────────────────────────────────────────────

SECTION_LABELS: dict[str, str] = {
    "restaurantes":      "Restaurantes",
    "fiesta":            "Fiesta y vida nocturna",
    "ocio_eventos":      "Ocio y Eventos",
    "arte_exposiciones": "Arte y Exposiciones",
    "experiencias":      "Experiencias",
    "alojamientos":      "Alojamientos",
    "shopping":          "Shopping",
    "influencers":       "Influencers",
}

SECTION_BADGE_OPTIONS: dict[str, list[str]] = {
    "restaurantes":      ["WOW", "LUXURY", "LOCAL", "ICÓNICO", "TRENDY"],
    "fiesta":            ["WOW", "LUXURY", "LOCAL", "ICÓNICO", "SPEAKEASY"],
    "ocio_eventos":      ["WOW", "LOCAL", "IMPRESCINDIBLE"],
    "arte_exposiciones": ["ICÓNICO", "EMERGENTE", "IMPRESCINDIBLE"],
    "experiencias":      ["WOW", "LUXURY", "LOCAL", "ÚNICA"],
    "alojamientos":      ["LUXURY", "BOUTIQUE", "LOCAL", "DESIGN"],
    "shopping":          ["LOCAL", "LUXURY", "TRENDY", "VINTAGE"],
    "influencers":       [],
}


class SuggestSectionConfig(BaseModel):
    section: str
    count: int = 6


class SuggestRequest(BaseModel):
    sections: list[SuggestSectionConfig]
    style_hint: str | None = None


class SuggestedItem(BaseModel):
    section: str
    name: str
    tagline: str | None = None
    description: str | None = None
    address: str | None = None
    web: str | None = None
    subcategory: str | None = None
    badge: str | None = None


class SuggestResult(BaseModel):
    suggestions: list[SuggestedItem]
    total: int


class AcceptSuggestionsRequest(BaseModel):
    items: list[SuggestedItem]


@router.post("/suggest", response_model=SuggestResult)
async def suggest_items(
    guide_id: uuid.UUID,
    data: SuggestRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Genera sugerencias de recomendados para las secciones indicadas.
    NO guarda nada — devuelve sugerencias para que el editor apruebe.
    """
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada")

    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    all_suggestions: list[SuggestedItem] = []

    for sec_cfg in data.sections:
        section = sec_cfg.section
        count = max(1, min(sec_cfg.count, 20))
        label = SECTION_LABELS.get(section, section)
        badge_opts = SECTION_BADGE_OPTIONS.get(section, [])

        badge_hint = f'  "badge": uno de {badge_opts} o null,' if badge_opts else '  "badge": null,'

        style_extra = f"\nContexto adicional: {data.style_hint}" if data.style_hint else ""

        prompt = f"""Para la Guía Discoolver {guide.city} {guide.year}:{style_extra}

Genera exactamente {count} recomendados reales para la sección "{label}".

Devuelve SOLO un array JSON válido, sin texto antes ni después:
[
  {{
    "name": "Nombre real del lugar",
    "tagline": "Frase editorial 6-10 palabras",
    "description": "2-3 frases estilo Discoolver: conciso, cómplice, dato concreto",
    "address": "Dirección real en {guide.city}",
    "web": "https://... (si la conoces, si no null)",
    "subcategory": "subcategoría opcional o null",
{badge_hint}
  }}
]

Reglas:
- Lugares reales y conocidos en {guide.city}
- Tagline: máximo 10 palabras, en español, modo editorial
- Descripción: 2-3 frases, nunca uses "increíble" o "espectacular" sin datos
- No inventes webs si no las conoces con certeza (pon null)
- Devuelve exactamente {count} items"""

        try:
            message = client.messages.create(
                model="claude-opus-4-7",
                max_tokens=4096,
                system=STYLE_GUIDE,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = message.content[0].text.strip()

            # Extract JSON array — handle markdown code blocks
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()

            items_data = json.loads(raw)
            for item_data in items_data:
                all_suggestions.append(SuggestedItem(
                    section=section,
                    name=item_data.get("name", ""),
                    tagline=item_data.get("tagline"),
                    description=item_data.get("description"),
                    address=item_data.get("address"),
                    web=item_data.get("web"),
                    subcategory=item_data.get("subcategory"),
                    badge=item_data.get("badge"),
                ))
        except Exception as e:
            # Don't fail the whole request if one section fails
            all_suggestions.append(SuggestedItem(
                section=section,
                name=f"[Error generando {label}: {str(e)[:80]}]",
            ))

    return SuggestResult(suggestions=all_suggestions, total=len(all_suggestions))


@router.post("/suggest/accept", status_code=201)
async def accept_suggestions(
    guide_id: uuid.UUID,
    data: AcceptSuggestionsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Guarda las sugerencias aprobadas como items reales de la guía."""
    guide = await crud.get_guide(db, guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")

    # Get current max sort_order per section to append at the end
    existing_by_section: dict[str, int] = {}
    for item in guide.items:
        existing_by_section[item.section] = max(
            existing_by_section.get(item.section, 0), item.sort_order + 1
        )

    created = []
    for i, suggestion in enumerate(data.items):
        section = suggestion.section
        sort_order = existing_by_section.get(section, 0)
        existing_by_section[section] = sort_order + 1

        item_create = ItemCreate(
            item_type=ItemType.recomendado,
            section=section,
            name=suggestion.name,
            tagline=suggestion.tagline,
            description=suggestion.description,
            address=suggestion.address,
            web=suggestion.web,
            subcategory=suggestion.subcategory,
            badge=suggestion.badge,
            sort_order=sort_order,
            enabled=True,
        )
        item = await crud.create_item(db, guide_id, item_create)
        created.append({"id": str(item.id), "name": item.name, "section": item.section})

    return {"created": len(created), "items": created}
