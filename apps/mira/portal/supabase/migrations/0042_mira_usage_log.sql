-- BUG: 0033_usage_log.sql (`CREATE TABLE IF NOT EXISTS usage_log`) has been a
-- silent no-op since the day it was written. apps/sf-sales-engine shares this
-- same Supabase project (nnevhtfxuawexliwlbmh) and ALREADY has its own
-- `usage_log` table (apps/sf-sales-engine/supabase/migrations/003_data_pipeline.sql,
-- actively written to by packages/enrichment/src/enrichment/cache.py for
-- Apollo/Hunter/Tavily cost tracking -- the same cost-limit check
-- leads_search.py's /search endpoint uses). Two unrelated apps picked the
-- same table name for two incompatible schemas; sf-sales-engine's happened to
-- exist first, so IF NOT EXISTS made MIRA's version a no-op. Confirmed live:
-- the table has sf-sales-engine's columns (source, records_fetched,
-- api_cost_usd, run_id), none of MIRA's (route, model, input_tokens,
-- output_tokens, used_client_key) -- every MIRA insert has failed with
-- PGRST204 since day one, silently swallowed by logUsage()'s error handling.
--
-- Do NOT touch or rename the existing `usage_log` table -- it's live,
-- actively read/written by sf-sales-engine. Give MIRA's version its own name.

CREATE TABLE IF NOT EXISTS mira_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  route text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  used_client_key boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mira_usage_log_client_created ON mira_usage_log(client_id, created_at DESC);

ALTER TABLE mira_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mira_usage_log: read own client" ON mira_usage_log
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
