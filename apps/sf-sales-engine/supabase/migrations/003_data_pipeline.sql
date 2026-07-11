-- ─────────────────────────────────────────────────────────────
-- 003: Data Pipeline operations
-- lead_cache, usage_log, discovery_runs, outbound_log
-- ─────────────────────────────────────────────────────────────

CREATE TABLE lead_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  raw_data JSONB DEFAULT '{}',
  sources TEXT[],
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);

CREATE TABLE usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  source TEXT,
  records_fetched INTEGER DEFAULT 0,
  api_cost_usd NUMERIC(10, 4) DEFAULT 0,
  run_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  icp_id UUID,
  sources_used TEXT[],
  leads_found INTEGER DEFAULT 0,
  leads_scored INTEGER DEFAULT 0,
  hot_count INTEGER DEFAULT 0,
  warm_count INTEGER DEFAULT 0,
  cold_count INTEGER DEFAULT 0,
  disqualified_count INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10, 4) DEFAULT 0,
  duration_seconds INTEGER,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE outbound_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  channel TEXT CHECK (channel IN ('email', 'linkedin', 'sms')),
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('replied', 'bounced', 'unsubscribed', 'no_response'))
);

-- Limpieza automática del cache expirado (cron o pg_cron)
CREATE INDEX ON lead_cache (expires_at);
CREATE INDEX ON lead_cache (domain);
CREATE INDEX ON usage_log (client_id, created_at DESC);
CREATE INDEX ON discovery_runs (client_id, started_at DESC);
CREATE INDEX ON outbound_log (lead_id, sent_at DESC);
