"""Initial schema — guides, items, media_assets

Revision ID: 001
Revises:
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'guides',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        # Identity
        sa.Column('city',            sa.String(100), nullable=False),
        sa.Column('year',            sa.String(4),   nullable=False),
        sa.Column('edition',         sa.String(200)),
        sa.Column('director',        sa.String(200), server_default='Carlos Jacoste'),
        sa.Column('director_role',   sa.String(200), server_default='CEO & Fundador — discoolver'),
        # Collection & colors
        sa.Column('collection',      sa.String(50),  server_default='estandar'),
        sa.Column('primary_color',   sa.String(7),   server_default='#C8006B'),
        sa.Column('accent_color',    sa.String(7)),
        # Status
        sa.Column('status',          sa.String(20),  server_default='draft'),
        # Cover
        sa.Column('cover_headline1',  sa.String(200), server_default='INSPIRING'),
        sa.Column('cover_headline2',  sa.String(200), server_default='the World'),
        sa.Column('cover_tagline',    sa.String(300), server_default='coolest places in the world'),
        sa.Column('cover_sub_tagline',sa.String(300)),
        sa.Column('cover_photo_url',  sa.Text),
        sa.Column('cover_bg_color',   sa.String(7),   server_default='#1a1a1a'),
        sa.Column('cover_tint_opacity', sa.Float,     server_default='0.0'),
        sa.Column('headline_align',   sa.String(10),  server_default='right'),
        # Director
        sa.Column('directors_letter',    sa.Text),
        sa.Column('director_photo_url',  sa.Text),
        sa.Column('director_pull_quote', sa.Text),
        sa.Column('director_signature',  sa.String(300)),
        sa.Column('criteria_list',       JSONB),
        sa.Column('mission_text',        sa.Text),
        # Persona del Año
        sa.Column('persona_name',          sa.String(200)),
        sa.Column('persona_tagline',        sa.String(300)),
        sa.Column('persona_photo_url',      sa.Text),
        sa.Column('persona_body_photo_url', sa.Text),
        sa.Column('persona_origen',         sa.String(100)),
        sa.Column('persona_disciplina',     sa.String(100)),
        sa.Column('persona_bio',            sa.Text),
        sa.Column('persona_quote',          sa.Text),
        sa.Column('persona_awards',         JSONB),
        sa.Column('persona_quotes',         JSONB),
        # Config blobs
        sa.Column('ad_config',         JSONB),
        sa.Column('back_cover_config', JSONB),
        sa.Column('site_url',          sa.String(200), server_default='discoolver.com'),
        # Meta
        sa.Column('created_at',  sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('updated_at',  sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('created_by',  sa.String(200), server_default='editor'),
    )
    op.create_index('ix_guides_city_year', 'guides', ['city', 'year'])
    op.create_index('ix_guides_status', 'guides', ['status'])
    op.create_index('ix_guides_updated_at', 'guides', ['updated_at'])

    op.create_table(
        'items',
        sa.Column('id',        UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('guide_id',  UUID(as_uuid=True), sa.ForeignKey('guides.id', ondelete='CASCADE'), nullable=False),
        sa.Column('item_type', sa.String(50),  nullable=False),
        sa.Column('section',   sa.String(100), nullable=False),
        sa.Column('subcategory', sa.String(100)),
        sa.Column('badge',     sa.String(50)),
        sa.Column('name',      sa.String(300), nullable=False),
        sa.Column('tagline',   sa.String(300)),
        sa.Column('description', sa.Text),
        sa.Column('photo_url',   sa.Text),
        sa.Column('sort_order',  sa.Integer, server_default='0'),
        sa.Column('enabled',     sa.Boolean, server_default='true'),
        # Place fields
        sa.Column('web',             sa.String(500)),
        sa.Column('address',         sa.String(300)),
        sa.Column('discoolver_url',  sa.String(500)),
        # Event fields
        sa.Column('event_when',  sa.String(200)),
        sa.Column('event_where', sa.String(200)),
        # Influencer fields
        sa.Column('handle',      sa.String(100)),
        sa.Column('platform',    sa.String(50)),
        sa.Column('city',        sa.String(100)),
        sa.Column('stats',       JSONB),
        sa.Column('categories',  JSONB),
        # Timeline fields
        sa.Column('timeline_year',  sa.String(10)),
        sa.Column('timeline_items', JSONB),
        # Overflow
        sa.Column('extra', JSONB),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_items_guide_section', 'items', ['guide_id', 'section'])
    op.create_index('ix_items_guide_type',    'items', ['guide_id', 'item_type'])

    op.create_table(
        'media_assets',
        sa.Column('id',        UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('guide_id',  UUID(as_uuid=True), sa.ForeignKey('guides.id', ondelete='CASCADE'), nullable=False),
        sa.Column('item_id',   UUID(as_uuid=True), sa.ForeignKey('items.id',  ondelete='SET NULL')),
        sa.Column('url',          sa.Text,         nullable=False),
        sa.Column('storage_key',  sa.String(500)),
        sa.Column('cdn_url',      sa.Text),
        sa.Column('field_key',    sa.String(100)),
        sa.Column('original_filename', sa.String(300)),
        sa.Column('size_bytes',   sa.Integer),
        sa.Column('mime_type',    sa.String(100)),
        sa.Column('created_at',   sa.DateTime, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_media_guide', 'media_assets', ['guide_id'])


def downgrade() -> None:
    op.drop_table('media_assets')
    op.drop_table('items')
    op.drop_table('guides')
