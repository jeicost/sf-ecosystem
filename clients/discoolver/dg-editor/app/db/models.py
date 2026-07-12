"""
SQLAlchemy ORM models for the Discoolver Guide Editor.
Supports both PostgreSQL (production) and SQLite (local dev).
Uses sa.JSON (works on both) and sa.Uuid (works on both via SQLAlchemy 2.0).
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON, Boolean, DateTime, Float, ForeignKey, Integer,
    String, Text, Uuid, func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserRow(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(300), nullable=False)
    # role: admin | editor | influencer
    role: Mapped[str] = mapped_column(String(20), default="influencer")
    # status: active | pending | rejected  (pending/rejected only apply to influencers)
    status: Mapped[str] = mapped_column(String(20), default="active")

    # Profile
    profile_photo_url: Mapped[Optional[str]] = mapped_column(Text)
    bio: Mapped[Optional[str]] = mapped_column(Text)

    # Influencer profile (filled during application)
    ig_handle: Mapped[Optional[str]] = mapped_column(String(100))
    ig_followers: Mapped[Optional[int]] = mapped_column(Integer)

    # Application tracking
    application_notes: Mapped[Optional[str]] = mapped_column(Text)
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    approved_by: Mapped[Optional[str]] = mapped_column(String(200))
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    guides: Mapped[list["GuideRow"]] = relationship(
        "GuideRow", back_populates="owner", foreign_keys="GuideRow.owner_id"
    )
    instagram_account: Mapped[Optional["UserInstagramRow"]] = relationship(
        "UserInstagramRow", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class UserInstagramRow(Base):
    """User-level Instagram connection (influencers connect once at account level)."""
    __tablename__ = "user_instagram"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    ig_user_id: Mapped[str] = mapped_column(String(100), nullable=False)
    ig_username: Mapped[str] = mapped_column(String(100), nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["UserRow"] = relationship("UserRow", back_populates="instagram_account")


class GuideRow(Base):
    __tablename__ = "guides"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Identity
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[str] = mapped_column(String(4), nullable=False)
    edition: Mapped[Optional[str]] = mapped_column(String(200))
    director: Mapped[str] = mapped_column(String(200), default="Carlos Jacoste")
    director_role: Mapped[str] = mapped_column(String(200), default="CEO & Fundador — discoolver")

    # Guide type: world | local | collection | influencer | dossier
    guide_type: Mapped[str] = mapped_column(String(50), default="world")

    # Owner (influencer user_id or null for editor-created guides)
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Collection & colors
    collection: Mapped[str] = mapped_column(String(50), default="estandar")
    primary_color: Mapped[str] = mapped_column(String(7), default="#C8006B")
    accent_color: Mapped[Optional[str]] = mapped_column(String(7))

    # Status
    status: Mapped[str] = mapped_column(String(20), default="draft")

    # Cover (Template 01/02)
    cover_headline1: Mapped[str] = mapped_column(String(200), default="INSPIRING")
    cover_headline2: Mapped[str] = mapped_column(String(200), default="the World")
    cover_tagline: Mapped[str] = mapped_column(String(300), default="coolest places in the world")
    cover_sub_tagline: Mapped[Optional[str]] = mapped_column(String(300))
    cover_photo_url: Mapped[Optional[str]] = mapped_column(Text)
    cover_bg_color: Mapped[str] = mapped_column(String(7), default="#1a1a1a")
    cover_tint_opacity: Mapped[float] = mapped_column(Float, default=0.0)
    headline_align: Mapped[str] = mapped_column(String(10), default="right")

    # Editorial / Director's letter (Template 04)
    directors_letter: Mapped[Optional[str]] = mapped_column(Text)
    director_photo_url: Mapped[Optional[str]] = mapped_column(Text)
    director_pull_quote: Mapped[Optional[str]] = mapped_column(Text)
    director_signature: Mapped[Optional[str]] = mapped_column(String(300))
    criteria_list: Mapped[Optional[list]] = mapped_column(JSON)  # [{name, desc}]
    mission_text: Mapped[Optional[str]] = mapped_column(Text)

    # Persona del Año (Template 05)
    persona_name: Mapped[Optional[str]] = mapped_column(String(200))
    persona_tagline: Mapped[Optional[str]] = mapped_column(String(300))
    persona_photo_url: Mapped[Optional[str]] = mapped_column(Text)
    persona_body_photo_url: Mapped[Optional[str]] = mapped_column(Text)
    persona_origen: Mapped[Optional[str]] = mapped_column(String(100))
    persona_disciplina: Mapped[Optional[str]] = mapped_column(String(100))
    persona_bio: Mapped[Optional[str]] = mapped_column(Text)
    persona_quote: Mapped[Optional[str]] = mapped_column(Text)
    persona_awards: Mapped[Optional[list]] = mapped_column(JSON)  # string[]
    persona_quotes: Mapped[Optional[list]] = mapped_column(JSON)  # [{text, attr}]

    # Ad page (Template 15)
    ad_config: Mapped[Optional[dict]] = mapped_column(JSON)

    # Back cover (Template 16)
    back_cover_config: Mapped[Optional[dict]] = mapped_column(JSON)

    # Site config
    site_url: Mapped[str] = mapped_column(String(200), default="discoolver.com")

    # Section-level enable/disable + page numbers
    # { "restaurantes": {"enabled": true, "page_number": "11"}, ... }
    sections_config: Mapped[Optional[dict]] = mapped_column(JSON)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by: Mapped[str] = mapped_column(String(200), default="editor")

    # Relationships
    owner: Mapped[Optional["UserRow"]] = relationship(
        "UserRow", back_populates="guides", foreign_keys=[owner_id]
    )
    items: Mapped[list["ItemRow"]] = relationship("ItemRow", back_populates="guide", cascade="all, delete-orphan")
    media: Mapped[list["MediaAssetRow"]] = relationship("MediaAssetRow", back_populates="guide", cascade="all, delete-orphan")
    instagram_connection: Mapped[Optional["InstagramConnectionRow"]] = relationship("InstagramConnectionRow", back_populates="guide", uselist=False, cascade="all, delete-orphan")


class ItemRow(Base):
    """
    Universal items table: recomendados, events, influencers, timeline entries, awards.
    item_type drives which fields are used.
    """
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guide_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("guides.id", ondelete="CASCADE"), nullable=False)

    # Discriminator
    item_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # item_type values:
    #   recomendado   → sections: restaurantes, fiesta, ocio, arte, experiencias, alojamientos, shopping
    #   event         → section: ocio_eventos (featured or grid)
    #   influencer    → section: influencers
    #   timeline      → section: persona_timeline
    #   persona_recom → section: persona_recomendados

    # Section this item belongs to
    section: Mapped[str] = mapped_column(String(100), nullable=False)

    # Sub-section / category
    subcategory: Mapped[Optional[str]] = mapped_column(String(100))

    # Badge (visual label on photo)
    badge: Mapped[Optional[str]] = mapped_column(String(50))

    # ── Common fields ─────────────────────────────────────
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    tagline: Mapped[Optional[str]] = mapped_column(String(300))
    description: Mapped[Optional[str]] = mapped_column(Text)
    photo_url: Mapped[Optional[str]] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # ── Recomendado / place fields ─────────────────────────
    web: Mapped[Optional[str]] = mapped_column(String(500))
    address: Mapped[Optional[str]] = mapped_column(String(300))
    discoolver_url: Mapped[Optional[str]] = mapped_column(String(500))

    # ── Event fields ───────────────────────────────────────
    event_when: Mapped[Optional[str]] = mapped_column(String(200))
    event_where: Mapped[Optional[str]] = mapped_column(String(200))

    # ── Influencer fields ──────────────────────────────────
    handle: Mapped[Optional[str]] = mapped_column(String(100))
    platform: Mapped[Optional[str]] = mapped_column(String(50))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    stats: Mapped[Optional[list]] = mapped_column(JSON)       # [{num, label}]
    categories: Mapped[Optional[list]] = mapped_column(JSON)  # string[]

    # ── Timeline fields ────────────────────────────────────
    timeline_year: Mapped[Optional[str]] = mapped_column(String(10))
    timeline_items: Mapped[Optional[list]] = mapped_column(JSON)  # string[]

    # ── Flexible overflow ──────────────────────────────────
    extra: Mapped[Optional[dict]] = mapped_column(JSON)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    guide: Mapped["GuideRow"] = relationship("GuideRow", back_populates="items")


class GuideSnapshotRow(Base):
    __tablename__ = "guide_snapshots"

    id:          Mapped[uuid.UUID]   = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guide_id:    Mapped[uuid.UUID]   = mapped_column(ForeignKey("guides.id", ondelete="CASCADE"), nullable=False)
    label:       Mapped[Optional[str]] = mapped_column(String(200))
    trigger:     Mapped[Optional[str]] = mapped_column(String(50))   # "pre_export" | "manual" | "auto"
    config:      Mapped[dict]        = mapped_column(JSON, nullable=False)
    items_count: Mapped[int]         = mapped_column(Integer, default=0)
    created_at:  Mapped[datetime]    = mapped_column(DateTime, server_default=func.now())
    created_by:  Mapped[str]         = mapped_column(String(200), default="editor")


class InstagramConnectionRow(Base):
    __tablename__ = "instagram_connections"

    id:               Mapped[uuid.UUID]      = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guide_id:         Mapped[uuid.UUID]      = mapped_column(ForeignKey("guides.id", ondelete="CASCADE"), unique=True, nullable=False)
    ig_user_id:       Mapped[str]            = mapped_column(String(100), nullable=False)
    ig_username:      Mapped[str]            = mapped_column(String(100), nullable=False)
    access_token:     Mapped[str]            = mapped_column(Text, nullable=False)   # long-lived (60 días)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at:       Mapped[datetime]       = mapped_column(DateTime, server_default=func.now())
    updated_at:       Mapped[datetime]       = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    guide: Mapped["GuideRow"] = relationship("GuideRow", back_populates="instagram_connection")


class MediaAssetRow(Base):
    __tablename__ = "media_assets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guide_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("guides.id", ondelete="CASCADE"), nullable=False)
    item_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("items.id", ondelete="SET NULL"))

    # Storage
    url: Mapped[str] = mapped_column(Text, nullable=False)
    storage_key: Mapped[Optional[str]] = mapped_column(String(500))
    cdn_url: Mapped[Optional[str]] = mapped_column(Text)

    # Meta
    field_key: Mapped[Optional[str]] = mapped_column(String(100))
    original_filename: Mapped[Optional[str]] = mapped_column(String(300))
    size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    guide: Mapped["GuideRow"] = relationship("GuideRow", back_populates="media")
