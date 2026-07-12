"""Add updated_at auto-trigger for users table; add collection index for guides

Revision ID: 005
Revises: 004
Create Date: 2026-05-09
"""
from alembic import op
import sqlalchemy as sa

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── updated_at trigger function (shared across tables) ────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # ── Apply trigger to users ────────────────────────────────────────────────
    op.execute("""
        DROP TRIGGER IF EXISTS set_users_updated_at ON users;
        CREATE TRIGGER set_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    """)

    # ── Apply trigger to user_instagram ──────────────────────────────────────
    op.execute("""
        DROP TRIGGER IF EXISTS set_user_instagram_updated_at ON user_instagram;
        CREATE TRIGGER set_user_instagram_updated_at
        BEFORE UPDATE ON user_instagram
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    """)

    # ── Apply trigger to guides ───────────────────────────────────────────────
    op.execute("""
        DROP TRIGGER IF EXISTS set_guides_updated_at ON guides;
        CREATE TRIGGER set_guides_updated_at
        BEFORE UPDATE ON guides
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    """)

    # ── Index on guides.collection for filter performance ────────────────────
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_guides_collection ON guides (collection);
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS set_guides_updated_at ON guides;")
    op.execute("DROP TRIGGER IF EXISTS set_user_instagram_updated_at ON user_instagram;")
    op.execute("DROP TRIGGER IF EXISTS set_users_updated_at ON users;")
    op.execute("DROP FUNCTION IF EXISTS trigger_set_updated_at;")
    op.execute("DROP INDEX IF EXISTS ix_guides_collection;")
