-- Adds hashed API key support (MT-03/SEC-02) WITHOUT touching existing keys.
-- New projects created after this migration store api_key_hash + api_key_last4
-- and leave api_key NULL; the raw key is shown once at creation time and never
-- persisted in plaintext again. Existing projects keep their plaintext api_key
-- untouched — deliberately not migrated, to avoid any risk to already-connected
-- production sites (decision: 2026-07-30).

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS api_key_hash TEXT,
  ADD COLUMN IF NOT EXISTS api_key_last4 TEXT;

COMMENT ON COLUMN projects.api_key IS 'Legacy plaintext key. NULL for projects created after 2026-07-30 — those use api_key_hash instead. Do not backfill existing rows (would break already-configured client sites without a coordinated key rotation).';
COMMENT ON COLUMN projects.api_key_hash IS 'sha256 hex digest of the raw key. Populated only for projects created after 2026-07-30. The raw value is shown once at creation and never stored.';
COMMENT ON COLUMN projects.api_key_last4 IS 'Last 4 chars of the raw key, for display/identification only (e.g. "API Key: ****ab12"). Populated for both legacy (computed on read) and new (stored) projects.';
