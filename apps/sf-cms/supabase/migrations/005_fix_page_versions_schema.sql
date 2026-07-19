-- page_versions in production has NO column to actually hold a content
-- snapshot: confirmed via PostgREST schema introspection 2026-07-19 that it
-- has id/page_id/version_number/created_by/created_at plus unused
-- content_es/content_en/content_th columns (same drift pattern as pages'
-- content_es/en/th/metadata) — but no sections_json. The page version
-- history feature has never been able to work in production: even with
-- created_by/version_number populated correctly, the actual page content
-- being "versioned" had nowhere to go.
--
-- This adds the missing column. IF NOT EXISTS guards environments where
-- 001_create_sf_cms_schema.sql's original sections_json JSONB NOT NULL
-- definition DID apply correctly (this becomes a no-op there).

ALTER TABLE page_versions ADD COLUMN IF NOT EXISTS sections_json JSONB;
