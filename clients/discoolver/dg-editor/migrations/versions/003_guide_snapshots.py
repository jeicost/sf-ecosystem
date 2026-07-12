"""Add guide_snapshots table

Revision ID: 003
Revises: 002
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'guide_snapshots',
        sa.Column('id',         UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('guide_id',   UUID(as_uuid=True), sa.ForeignKey('guides.id', ondelete='CASCADE'), nullable=False),
        sa.Column('label',      sa.String(200)),          # e.g. "Pre-export PDF 2026-05-02"
        sa.Column('trigger',    sa.String(50)),            # "pre_export" | "manual" | "auto"
        sa.Column('config',     JSONB, nullable=False),   # full GuideConfig JSON snapshot
        sa.Column('items_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('created_by', sa.String(200), server_default='editor'),
    )
    op.create_index('ix_snapshots_guide', 'guide_snapshots', ['guide_id'])


def downgrade() -> None:
    op.drop_table('guide_snapshots')
