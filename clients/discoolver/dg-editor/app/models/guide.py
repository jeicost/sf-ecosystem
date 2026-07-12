from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class GuideType(str, Enum):
    mundo = "mundo"
    pais = "pais"
    nomadas = "nomadas"
    moteros = "moteros"
    familias = "familias"
    luxury = "luxury"


class GuideStatus(str, Enum):
    draft = "draft"
    review = "review"
    published = "published"


class RecomendadoCategory(str, Enum):
    restaurant = "restaurant"
    hotel = "hotel"
    activity = "activity"
    bar = "bar"
    shop = "shop"
    transport = "transport"
    tip = "tip"


class PriceRange(str, Enum):
    one = "€"
    two = "€€"
    three = "€€€"
    four = "€€€€"


class Coordinates(BaseModel):
    lat: float
    lng: float


class Subsection(BaseModel):
    id: str
    name: str
    slug: str
    order: int = 0
    active: bool = True
    content: str = ""


class Section(BaseModel):
    id: str
    name: str
    slug: str
    active: bool = True
    order: int = 0
    content: str = ""
    subsections: list[Subsection] = Field(default_factory=list)


class Recomendado(BaseModel):
    id: str
    name: str
    category: RecomendadoCategory
    description: str
    address: str = ""
    price_range: PriceRange = PriceRange.two
    rating: float = Field(default=0.0, ge=0, le=5)
    active: bool = True
    section_id: str
    tags: list[str] = Field(default_factory=list)
    coordinates: Optional[Coordinates] = None
    website: str = ""
    image_url: str = ""


class ColorPalette(BaseModel):
    primary: str = "#C8102E"
    secondary: str = "#1A1A2E"
    accent: str = "#F4A300"
    background: str = "#FAF8F5"
    text: str = "#1C1C1C"


class Typography(BaseModel):
    heading_font: str = "Montserrat"
    body_font: str = "Lora"
    accent_font: str = "Montserrat"
    base_size_pt: float = 10.0


class MapAsset(BaseModel):
    id: str
    label: str
    file: str = ""
    section_id: Optional[str] = None


class Assets(BaseModel):
    cover_image: str = ""
    logo: str = "static/images/disclover-logo.svg"
    color_palette: ColorPalette = Field(default_factory=ColorPalette)
    typography: Typography = Field(default_factory=Typography)
    maps: list[MapAsset] = Field(default_factory=list)


class HistoryChange(BaseModel):
    tool: str
    target: str
    summary: str


class HistoryEntry(BaseModel):
    version: str
    timestamp: datetime
    changes: list[HistoryChange] = Field(default_factory=list)
    author: str = "chatbot"
    snapshot_path: str = ""


class GuideMetadata(BaseModel):
    id: str
    title: str
    destination: str
    type: GuideType = GuideType.pais
    language: str = "es"
    version: str = "1.0"
    status: GuideStatus = GuideStatus.draft
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    slug: str = ""
    tags: list[str] = Field(default_factory=list)
    author: str = "Equipo Disclover"


class Guide(BaseModel):
    metadata: GuideMetadata
    sections: list[Section] = Field(default_factory=list)
    recomendados: list[Recomendado] = Field(default_factory=list)
    assets: Assets = Field(default_factory=Assets)
    history: list[HistoryEntry] = Field(default_factory=list)

    def get_section(self, section_id: str) -> Optional[Section]:
        return next((s for s in self.sections if s.id == section_id), None)

    def get_recomendado(self, rec_id: str) -> Optional[Recomendado]:
        return next((r for r in self.recomendados if r.id == rec_id), None)

    def active_sections(self) -> list[Section]:
        return sorted([s for s in self.sections if s.active], key=lambda s: s.order)

    def recomendados_for_section(self, section_id: str) -> list[Recomendado]:
        return [r for r in self.recomendados if r.section_id == section_id and r.active]


# ─── Request/response helpers ─────────────────────────────────────────────────

class GuideSummary(BaseModel):
    id: str
    title: str
    destination: str
    type: GuideType
    status: GuideStatus
    version: str
    updated_at: datetime
    slug: str


class CreateGuideRequest(BaseModel):
    title: str
    destination: str
    type: GuideType = GuideType.pais
    language: str = "es"
    author: str = "Equipo Disclover"


class PatchMetadataRequest(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    language: Optional[str] = None
    status: Optional[GuideStatus] = None
    tags: Optional[list[str]] = None
    author: Optional[str] = None
