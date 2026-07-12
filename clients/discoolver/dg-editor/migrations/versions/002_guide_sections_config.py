"""Add sections_config JSONB to guides

Revision ID: 002
Revises: 001
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

DEFAULT_SECTIONS = {
    "restaurantes":            {"enabled": True,  "page_number": "11"},
    "gastronomia_bcn":         {"enabled": True,  "page_number": "12"},
    "fiesta":                  {"enabled": True,  "page_number": "18"},
    "ocio_eventos":            {"enabled": True,  "page_number": "22"},
    "arte_exposiciones":       {"enabled": True,  "page_number": "25"},
    "experiencias":            {"enabled": True,  "page_number": "28"},
    "alojamientos":            {"enabled": True,  "page_number": "30"},
    "shopping":                {"enabled": True,  "page_number": "38"},
    "influencers":             {"enabled": True,  "page_number": "44"},
    "persona_del_ano":         {"enabled": True,  "page_number": "5"},
    "nota_director":           {"enabled": True,  "page_number": "1"},
}


def upgrade() -> None:
    op.add_column(
        'guides',
        sa.Column('sections_config', JSONB, nullable=True)
    )
    # Backfill existing rows with defaults
    op.execute(
        f"UPDATE guides SET sections_config = '{{}}'::jsonb WHERE sections_config IS NULL"
    )


def downgrade() -> None:
    op.drop_column('guides', 'sections_config')
