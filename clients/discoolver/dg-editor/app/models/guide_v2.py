"""
Pydantic v2 models aligned with design-studio GuideConfig.
These are the API request/response schemas — separate from the ORM models.
"""
from __future__ import annotations
import uuid
from enum import Enum
from typing import Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# ── Enums ─────────────────────────────────────────────────────────────────────

class GuideStatus(str, Enum):
    draft = "draft"
    review = "review"
    published = "published"
    archived = "archived"


class GuideType(str, Enum):
    world      = "world"       # Guía del Mundo
    local      = "local"       # Guía Local
    collection = "collection"  # Colecciones temáticas (Nómada Digital, Moteros, etc.)
    influencer = "influencer"  # Guía del Influencer
    dossier    = "dossier"     # Dosier libre (chatbot IA)


class GuideCollection(str, Enum):
    """13 colecciones temáticas de Discoolver + estandar como default."""
    estandar           = "estandar"            # default
    club_hero          = "club-hero"
    plotwist_date      = "plotwist-date"
    wellness_nature    = "wellness-nature"
    music_circuit      = "music-circuit"
    shopping_lover     = "shopping-lover"
    foodie_hoodie      = "foodie-hoodie"
    foodie_selection   = "foodie-selection"
    family_weekend     = "family-weekend"
    cultura_misterio   = "cultura-misterio"
    solo_explorer      = "solo-explorer"
    nomadas_digitales  = "nomadas-digitales"
    hidden_gems        = "hidden-gems"
    amantes_motor      = "amantes-motor"


COLLECTION_ACCENT: dict[str, str] = {
    "estandar":          "#C8006B",
    "club-hero":         "#8B5CF6",
    "plotwist-date":     "#F43F5E",
    "wellness-nature":   "#10B981",
    "music-circuit":     "#F97316",
    "shopping-lover":    "#EC4899",
    "foodie-hoodie":     "#D97706",
    "foodie-selection":  "#B45309",
    "family-weekend":    "#0EA5E9",
    "cultura-misterio":  "#0D9488",
    "solo-explorer":     "#475569",
    "nomadas-digitales": "#6366F1",
    "hidden-gems":       "#9F6CA8",
    "amantes-motor":     "#EF4444",
}

# Metadatos editoriales por colección (título display + descripción para el editor UI)
COLLECTION_META: dict[str, dict] = {
    "estandar":          {"label": "Estándar",              "desc": "Guía clásica Discoolver sin temática específica."},
    "club-hero":         {"label": "Club Hero",             "desc": "Pre-night, cena con energía, coctelería con intención y un club final que de verdad merezca el cierre."},
    "plotwist-date":     {"label": "Plotwist Date",         "desc": "Citas con sorpresa, estética y memoria. Un pequeño giro inesperado para que el plan no se sienta obvio."},
    "wellness-nature":   {"label": "Wellness + Nature",     "desc": "Bajar el ritmo y resetear el cuerpo sin salir del todo de la ciudad. Bienestar real, espacios tranquilos, naturaleza suave."},
    "music-circuit":     {"label": "Music Circuit",         "desc": "Descubrir la ciudad a través de su escena musical viva: salas, bares con identidad sonora, tiendas de discos."},
    "shopping-lover":    {"label": "Shopping Lover",        "desc": "Concept stores, marcas con identidad comercial propia y zonas con valor editorial. Estilo y personalidad, no lujo vacío."},
    "foodie-hoodie":     {"label": "Foodie with a Hoodie",  "desc": "Lectura callejera y urbana: barras, mercados, street food, casas de comidas con actitud."},
    "foodie-selection":  {"label": "Foodie Selection",      "desc": "Gastronómica de nivel alto. Mesas memorables, producto, técnica y contexto. Premium sin caer en lujo vacío."},
    "family-weekend":    {"label": "Family Weekend",        "desc": "Fin de semana en familia: comer bien, pasear, descubrir y descansar sin sobrecargar el día."},
    "cultura-misterio":  {"label": "Cultura & Misterio",   "desc": "Patrimonio, relato histórico, arquitectura y una capa más enigmática. Rincones y lecturas menos obvias."},
    "solo-explorer":     {"label": "Solo Authentic Explorer","desc": "Para quien viaja solo: ciudad auténtica, amable y fácil de leer. Barrios con verdad, cafés y cultura accesible."},
    "nomadas-digitales": {"label": "Nómadas Digitales",     "desc": "Work cafés, espacios cómodos, barrios agradables para moverse a pie y trabajar sin perder funcionalidad."},
    "hidden-gems":       {"label": "Aesthetic Hidden Gems", "desc": "Madrid visual, delicado y menos evidente. Lugares con belleza, diseño y atmósfera, lejos de lo turístico."},
    "amantes-motor":     {"label": "Amantes del Motor",    "desc": "La máquina y la velocidad como protagonistas: circuitos, clásicos, sidecars y cultura del motor real."},
}

GUIDE_TYPE_ACCENT: dict[str, str] = {
    "world":      "#C8006B",
    "local":      "#059669",
    "collection": "#6366F1",
    "influencer": "#EC4899",
    "dossier":    "#475569",
}


class ItemType(str, Enum):
    recomendado    = "recomendado"
    event          = "event"
    influencer     = "influencer"
    timeline       = "timeline"
    persona_recom  = "persona_recom"


# ── Sub-models ────────────────────────────────────────────────────────────────

class StatKPI(BaseModel):
    num: str
    label: str


class CriteriaItem(BaseModel):
    name: str
    desc: str


class AdFeature(BaseModel):
    icon: str
    title: str
    desc: str


class BackCoverFeature(BaseModel):
    icon: str
    label: str


# ── Items ─────────────────────────────────────────────────────────────────────

class ItemBase(BaseModel):
    item_type: ItemType
    section: str
    subcategory: str | None = None
    badge: str | None = None
    name: str
    tagline: str | None = None
    description: str | None = None
    photo_url: str | None = None
    sort_order: int = 0
    enabled: bool = True

    # Recomendado / place
    web: str | None = None
    address: str | None = None
    discoolver_url: str | None = None

    # Event
    event_when: str | None = None
    event_where: str | None = None

    # Influencer
    handle: str | None = None
    platform: str | None = None
    city: str | None = None
    stats: list[StatKPI] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)

    # Timeline
    timeline_year: str | None = None
    timeline_items: list[str] = Field(default_factory=list)

    extra: dict[str, Any] = Field(default_factory=dict)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    subcategory: str | None = None
    badge: str | None = None
    name: str | None = None
    tagline: str | None = None
    description: str | None = None
    photo_url: str | None = None
    sort_order: int | None = None
    enabled: bool | None = None
    web: str | None = None
    address: str | None = None
    discoolver_url: str | None = None
    event_when: str | None = None
    event_where: str | None = None
    handle: str | None = None
    platform: str | None = None
    city: str | None = None
    stats: list[StatKPI] | None = None
    categories: list[str] | None = None
    timeline_year: str | None = None
    timeline_items: list[str] | None = None
    extra: dict[str, Any] | None = None


class ItemOut(ItemBase):
    id: uuid.UUID
    guide_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Guide ─────────────────────────────────────────────────────────────────────

class GuideCreate(BaseModel):
    city: str
    year: str = Field(min_length=2, max_length=4)
    edition: str | None = None
    director: str = "Carlos Jacoste"
    director_role: str = "CEO & Fundador — discoolver"
    guide_type: GuideType = GuideType.world
    collection: GuideCollection = GuideCollection.estandar
    primary_color: str = "#C8006B"
    accent_color: str | None = None
    owner_id: uuid.UUID | None = None

    @field_validator("accent_color", mode="before")
    @classmethod
    def derive_accent(cls, v, info):
        if v:
            return v
        collection = info.data.get("collection", "estandar")
        return COLLECTION_ACCENT.get(str(collection), "#C8006B")


class GuideUpdate(BaseModel):
    # Identity
    city: str | None = None
    year: str | None = None
    edition: str | None = None
    director: str | None = None
    director_role: str | None = None
    guide_type: GuideType | None = None
    collection: GuideCollection | None = None
    primary_color: str | None = None
    accent_color: str | None = None
    status: GuideStatus | None = None

    # Cover
    cover_headline1: str | None = None
    cover_headline2: str | None = None
    cover_tagline: str | None = None
    cover_sub_tagline: str | None = None
    cover_photo_url: str | None = None
    cover_bg_color: str | None = None
    cover_tint_opacity: float | None = None
    headline_align: str | None = None

    # Director
    directors_letter: str | None = None
    director_photo_url: str | None = None
    director_pull_quote: str | None = None
    director_signature: str | None = None
    criteria_list: list[CriteriaItem] | None = None
    mission_text: str | None = None

    # Persona del Año
    persona_name: str | None = None
    persona_tagline: str | None = None
    persona_photo_url: str | None = None
    persona_body_photo_url: str | None = None
    persona_origen: str | None = None
    persona_disciplina: str | None = None
    persona_bio: str | None = None
    persona_quote: str | None = None
    persona_awards: list[str] | None = None
    persona_quotes: list[dict] | None = None

    # Ad & Back cover
    ad_config: dict | None = None
    back_cover_config: dict | None = None
    sections_config: dict | None = None

    site_url: str | None = None


class GuideSummary(BaseModel):
    id: uuid.UUID
    city: str
    year: str
    edition: str | None
    guide_type: str
    collection: str
    primary_color: str
    accent_color: str | None
    status: str
    owner_id: uuid.UUID | None = None
    updated_at: datetime
    items_count: int = 0

    class Config:
        from_attributes = True


class GuideOut(BaseModel):
    id: uuid.UUID
    city: str
    year: str
    edition: str | None
    director: str
    director_role: str
    guide_type: str
    collection: str
    primary_color: str
    accent_color: str | None
    status: str
    owner_id: uuid.UUID | None = None

    # Cover
    cover_headline1: str
    cover_headline2: str
    cover_tagline: str
    cover_sub_tagline: str | None
    cover_photo_url: str | None
    cover_bg_color: str
    cover_tint_opacity: float
    headline_align: str

    # Director
    directors_letter: str | None
    director_photo_url: str | None
    director_pull_quote: str | None
    director_signature: str | None
    criteria_list: list[CriteriaItem] = Field(default_factory=list)
    mission_text: str | None

    # Persona
    persona_name: str | None
    persona_tagline: str | None
    persona_photo_url: str | None
    persona_body_photo_url: str | None
    persona_origen: str | None
    persona_disciplina: str | None
    persona_bio: str | None
    persona_quote: str | None
    persona_awards: list[str] = Field(default_factory=list)
    persona_quotes: list[dict] = Field(default_factory=list)

    @field_validator("criteria_list", "persona_awards", "persona_quotes", mode="before")
    @classmethod
    def null_to_empty_list(cls, v):
        return v if v is not None else []

    # Config blobs
    ad_config: dict | None
    back_cover_config: dict | None
    sections_config: dict | None
    site_url: str

    # Relations
    items: list[ItemOut] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime
    created_by: str

    model_config = {"from_attributes": True}


# ── Media ─────────────────────────────────────────────────────────────────────

class MediaAssetOut(BaseModel):
    id: uuid.UUID
    guide_id: uuid.UUID
    item_id: uuid.UUID | None
    url: str
    cdn_url: str | None
    field_key: str | None
    original_filename: str | None
    size_bytes: int | None
    mime_type: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Export ────────────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    format: str = "pdf"   # "pdf" | "web"
    templates: list[int] | None = None  # None = all, or [1, 2, 3] for specific


class ExportResult(BaseModel):
    url: str
    format: str
    generated_at: datetime


# ── AI Editorial ──────────────────────────────────────────────────────────────

class AIGenerateRequest(BaseModel):
    item_ids: list[uuid.UUID] | None = None  # None = generate for all empty items
    field: str = "description"               # "description" | "tagline" | "both"
    style_hint: str | None = None            # Extra context for the AI
    overwrite: bool = False                  # True = overwrite existing text


class AIGenerateResult(BaseModel):
    generated: int
    skipped: int
    items: list[dict]
