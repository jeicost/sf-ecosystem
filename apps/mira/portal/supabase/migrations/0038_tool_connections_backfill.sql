-- 0038 — Backfill de la migración 0010, que nunca se aplicó a producción.
-- Descubierto 2026-07-23 al aplicar 0037 (RLS): "relation tool_connections does not exist".
-- Confirmado con information_schema.tables: tool_connections, affiliate_tracking y
-- tool_setup_progress (las 3 tablas de 0010_tool_integrations.sql) faltan en prod, pese a
-- que el código las usa activamente (getClientApiKey.ts, integrations/tools, integrations/
-- affiliate, canva.ts, oauth/callback). Idempotente por si quedó algo a medias.

DO $$ BEGIN
  CREATE TYPE tool_status AS ENUM ('connected', 'disconnected', 'pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tool_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  status tool_status DEFAULT 'pending',
  account_email TEXT,
  account_handle TEXT,
  auth_token TEXT,
  metadata JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, tool_id)
);

CREATE TABLE IF NOT EXISTS affiliate_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referral_url TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tool_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  critical_tools_connected INT DEFAULT 0,
  total_critical_tools INT DEFAULT 5,
  setup_percentage INT DEFAULT 0,
  last_checked TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_tool_connections_client ON tool_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_tool_connections_status ON tool_connections(status);
CREATE INDEX IF NOT EXISTS idx_tool_connections_tool ON tool_connections(tool_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_client ON affiliate_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_tool ON affiliate_tracking(tool_id);

-- RLS de tool_connections (de la 0037, repetida aquí porque antes fallaba silenciosamente
-- al no existir la tabla — DROP POLICY IF EXISTS la hace segura de re-ejecutar).
ALTER TABLE tool_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_connections: read own client" ON tool_connections;
CREATE POLICY "tool_connections: read own client" ON tool_connections
  FOR SELECT USING (
    client_id IN (
      SELECT bp.id FROM brand_profiles bp
      WHERE bp.client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- affiliate_tracking / tool_setup_progress: mismo patrón que tool_connections (defensa en
-- profundidad; hoy solo se consultan vía adminClient() server-side).
ALTER TABLE affiliate_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliate_tracking: service only" ON affiliate_tracking;
CREATE POLICY "affiliate_tracking: service only" ON affiliate_tracking
  USING (false) WITH CHECK (false);

ALTER TABLE tool_setup_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tool_setup_progress: service only" ON tool_setup_progress;
CREATE POLICY "tool_setup_progress: service only" ON tool_setup_progress
  USING (false) WITH CHECK (false);
