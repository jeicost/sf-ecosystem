-- 0033: usage_log — consumo de Claude por cliente (BYO keys)
-- migration-date: 2026-07-19

CREATE TABLE IF NOT EXISTS usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  route text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  used_client_key boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_log_client_created ON usage_log(client_id, created_at DESC);

ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- Los clientes ven su propio consumo; super_admin ve todo
CREATE POLICY "usage_log: read own client" ON usage_log
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
