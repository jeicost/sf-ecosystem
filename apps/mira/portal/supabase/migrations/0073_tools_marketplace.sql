-- 0073 — Tools: el escaparate de módulos de negocio.
--
-- «Library» pasa a llamarse Tools y deja de ser una línea de navegación para ser
-- una sección con página propia: lo que el cliente tiene contratado + un
-- marketplace con el resto del catálogo, bloqueado y pedible.
--
-- Lo que esta migración resuelve: hasta hoy, QUIÉN tiene abierta una herramienta
-- vertical vivía en dos Set<string> de UUIDs dentro de lib/entitlements.ts, así
-- que dar acceso a un cliente exigía commit + deploy. El propio fichero ya lo
-- avisaba: "Cuando esto crezca, migrar a un flag por cliente en BD".
--
-- Aditiva: crea 3 tablas NUEVAS, no toca ninguna existente.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

-- ── Qué módulos tiene abiertos cada marca ────────────────────────────────────
-- tool_id es texto libre a propósito, igual que clients.plan (0069): el catálogo
-- vive en lib/tools/catalog.ts y va a crecer. Un CHECK aquí obligaría a una
-- migración por cada módulo nuevo.
CREATE TABLE IF NOT EXISTS client_tools (
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tool_id     text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  enabled_at  timestamptz NOT NULL DEFAULT now(),
  enabled_by  uuid,
  notes       text,
  PRIMARY KEY (client_id, tool_id)
);
CREATE INDEX IF NOT EXISTS idx_client_tools_client ON client_tools(client_id) WHERE enabled;

COMMENT ON TABLE client_tools IS 'Módulos de MIRA habilitados por marca. Fuente de verdad del acceso (lib/tools/access.ts); las allowlists de lib/entitlements.ts quedan solo como semilla y fallback.';
COMMENT ON COLUMN client_tools.enabled_by IS 'auth.users.id de quien lo encendió desde /admin/tools. Null = sembrado por migración.';

-- ── Peticiones del marketplace ───────────────────────────────────────────────
-- tool_id 'custom' = "queremos un módulo a medida para nuestro negocio", que es
-- media propuesta de valor de la agencia y hasta ahora no tenía dónde entrar.
CREATE TABLE IF NOT EXISTS tool_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tool_id       text NOT NULL,
  requested_by  uuid,
  message       text,
  status        text NOT NULL DEFAULT 'new',
  created_at    timestamptz NOT NULL DEFAULT now(),
  handled_at    timestamptz
);
ALTER TABLE tool_requests DROP CONSTRAINT IF EXISTS tool_requests_status_check;
ALTER TABLE tool_requests ADD CONSTRAINT tool_requests_status_check
  CHECK (status IN ('new', 'contacted', 'enabled', 'declined'));

CREATE INDEX IF NOT EXISTS idx_tool_requests_open ON tool_requests(created_at DESC) WHERE status = 'new';
-- Una sola petición abierta por marca y herramienta: la tarjeta dice "pedida"
-- en vez de dejar pedir lo mismo diez veces.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_requests_one_open
  ON tool_requests(client_id, tool_id) WHERE status = 'new';

-- ── Packs de imágenes comprados ──────────────────────────────────────────────
-- El plan incluye N imágenes al mes (lib/billing/plans.ts). Cuando se agotan se
-- vende el pack de 100 (79 €). Los packs aplican al mes en que se compran.
CREATE TABLE IF NOT EXISTS image_packs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  images             integer NOT NULL,
  source             text NOT NULL,
  stripe_session_id  text UNIQUE,
  granted_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE image_packs DROP CONSTRAINT IF EXISTS image_packs_source_check;
ALTER TABLE image_packs ADD CONSTRAINT image_packs_source_check
  CHECK (source IN ('stripe', 'agency'));

CREATE INDEX IF NOT EXISTS idx_image_packs_client_month ON image_packs(client_id, created_at DESC);

COMMENT ON COLUMN image_packs.stripe_session_id IS 'UNIQUE: el webhook de Stripe puede reintentar el mismo evento, y sin esto cada reintento regalaría 100 imágenes.';

-- ── Semilla: nadie pierde acceso el día del deploy ───────────────────────────
-- Los mismos ids que hoy están en TENDER_CLIENTS y EMAIL_OPS_CLIENTS. El JOIN
-- contra clients evita reventar por FK si alguna marca ya no existe.
INSERT INTO client_tools (client_id, tool_id, notes)
SELECT c.id, v.tool_id, 'sembrado desde lib/entitlements.ts (0073)'
FROM (VALUES
  ('3949b629-feec-4497-9d73-91214027cca1'::uuid, 'tenders'),    -- GTD Mensajeros
  ('1a093072-97fb-46e4-aea7-65c3eb9e1e29'::uuid, 'tenders'),    -- GLS Ciudad Lineal
  ('91abb051-cae5-462d-b1fa-8e50a299e3b3'::uuid, 'tenders'),    -- Discoolver 360
  ('7bdfe0d0-c1d9-4282-9792-aed1075c048b'::uuid, 'email-ops'),  -- Albasanz Express
  ('3949b629-feec-4497-9d73-91214027cca1'::uuid, 'email-ops'),  -- GTD Mensajeros
  ('e664873b-034d-48cd-9a45-8631672ef375'::uuid, 'email-ops'),  -- Dadybox
  ('1a093072-97fb-46e4-aea7-65c3eb9e1e29'::uuid, 'email-ops')   -- GLS Ciudad Lineal
) AS v(client_id, tool_id)
JOIN clients c ON c.id = v.client_id
ON CONFLICT (client_id, tool_id) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Mismo patrón que 0071: la escritura real va por rutas de API con service_role
-- tras comprobar sesión y cliente; las políticas son el cinturón adicional para
-- cualquier lectura desde el navegador. mira_project_access.project_id guarda el
-- CLIENT id (nombre heredado, ver 0025).
--
-- Ojo con la asimetría deliberada: el cliente PUEDE leer qué tiene abierto y
-- crear peticiones, pero NO puede encenderse una herramienta a sí mismo — no hay
-- política de INSERT/UPDATE sobre client_tools ni sobre image_packs para nadie
-- que no sea super_admin.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['client_tools','tool_requests','image_packs']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s: read own client" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%s: read own client" ON %I FOR SELECT USING (
        client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
        OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
      )$p$, t, t);
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;

-- Solo tool_requests admite escritura desde el navegador, y solo alta.
DROP POLICY IF EXISTS "tool_requests: create for own client" ON tool_requests;
CREATE POLICY "tool_requests: create for own client" ON tool_requests FOR INSERT WITH CHECK (
  client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
  OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
);

DROP POLICY IF EXISTS "client_tools: agency writes" ON client_tools;
CREATE POLICY "client_tools: agency writes" ON client_tools FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
) WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
);
