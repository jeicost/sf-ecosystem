"""Add users, user_instagram tables; add guide_type and owner_id to guides

Revision ID: 004
Revises: 003
Create Date: 2026-05-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(200), unique=True, nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('hashed_password', sa.String(300), nullable=False),
        sa.Column('role', sa.String(20), server_default='influencer'),
        sa.Column('status', sa.String(20), server_default='active'),
        sa.Column('profile_photo_url', sa.Text),
        sa.Column('bio', sa.Text),
        sa.Column('ig_handle', sa.String(100)),
        sa.Column('ig_followers', sa.Integer),
        sa.Column('application_notes', sa.Text),
        sa.Column('applied_at', sa.DateTime),
        sa.Column('approved_at', sa.DateTime),
        sa.Column('approved_by', sa.String(200)),
        sa.Column('rejection_reason', sa.Text),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_role_status', 'users', ['role', 'status'])

    # ── user_instagram (user-level connection for influencers) ────────────────
    op.create_table(
        'user_instagram',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('ig_user_id', sa.String(100), nullable=False),
        sa.Column('ig_username', sa.String(100), nullable=False),
        sa.Column('access_token', sa.Text, nullable=False),
        sa.Column('token_expires_at', sa.DateTime),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── guides: new columns ───────────────────────────────────────────────────
    op.add_column('guides', sa.Column('guide_type', sa.String(50), server_default='world'))
    op.add_column('guides', sa.Column(
        'owner_id', UUID(as_uuid=True),
        sa.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
    ))
    op.create_index('ix_guides_guide_type', 'guides', ['guide_type'])
    op.create_index('ix_guides_owner_id', 'guides', ['owner_id'])


def downgrade() -> None:
    op.drop_index('ix_guides_owner_id', 'guides')
    op.drop_index('ix_guides_guide_type', 'guides')
    op.drop_column('guides', 'owner_id')
    op.drop_column('guides', 'guide_type')
    op.drop_table('user_instagram')
    op.drop_index('ix_users_role_status', 'users')
    op.drop_index('ix_users_email', 'users')
    op.drop_table('users')
