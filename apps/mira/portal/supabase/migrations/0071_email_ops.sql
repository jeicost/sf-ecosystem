-- 0071 — Email Ops: bandeja operativa por correo (Grupo Aldea: Albasanz Express,
-- GTD Mensajeros, Dadybox, GLS Ciudad Lineal).
--
-- Los correos llegan por REENVÍO a direcciones de ingesta (Resend Inbound), se
-- analizan con Claude y se convierten en tickets (una fila por hilo) con los
-- datos operativos que hoy copian a mano al "Excel de trabajo operaciones".
--
-- Aditiva: crea 6 tablas NUEVAS, no toca ninguna existente.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql
--
-- Regla de diseño: lo que se filtra u ordena es COLUMNA (status, kind, department,
-- priority, service_date, delivery_type, received_at); el contenido extraído va en
-- `fields` jsonb porque el esquema de campos divergirá por cliente
-- (lib/email-ops/schema.ts, clave `schema_key` en email_ops_settings).

-- ── Buzones de ingesta: una dirección por departamento y cliente ─────────────
CREATE TABLE IF NOT EXISTS email_inboxes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  department    text NOT NULL,                       -- 'operaciones', 'internacional', ...
  address       text NOT NULL UNIQUE,                -- completa, en minúsculas
  display_name  text,
  active        boolean NOT NULL DEFAULT true,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_inboxes_client ON email_inboxes(client_id, active);

-- ── Ajustes por cliente: esquema de campos, reglas para la IA, requeridos ────
CREATE TABLE IF NOT EXISTS email_ops_settings (
  client_id        uuid PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  schema_key       text NOT NULL DEFAULT 'courier_v1',
  rules            text,                             -- texto libre que se inyecta en el prompt
  required_fields  text[],                           -- NULL = los del esquema
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Tickets: un hilo de correo = un encargo ──────────────────────────────────
CREATE TABLE IF NOT EXISTS email_tickets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  inbox_id          uuid REFERENCES email_inboxes(id) ON DELETE SET NULL,
  department        text,
  thread_key        text NOT NULL,
  kind              text NOT NULL DEFAULT 'shipment_request',
  status            text NOT NULL DEFAULT 'open',
  priority          numeric NOT NULL DEFAULT 0,
  service_date      date,                            -- denormalizado de fields.fecha
  delivery_type     text,                            -- denormalizado de fields.tipo_entrega
  subject           text,
  from_address      text,
  original_sender   text,                            -- quien pidió el envío (cabeceras citadas)
  summary           text,
  fields            jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence        jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {campo: 0..1}
  evidence          jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {campo: "cita literal del correo"}
  missing_fields    text[] NOT NULL DEFAULT '{}',
  manual_overrides  jsonb NOT NULL DEFAULT '{}'::jsonb,   -- {campo: {by, at}} → el merge nunca lo pisa
  urgency           smallint,
  message_count     int NOT NULL DEFAULT 0,
  first_message_at  timestamptz,
  last_message_at   timestamptz,
  closed_at         timestamptz,
  closed_by         uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, thread_key)
);
ALTER TABLE email_tickets DROP CONSTRAINT IF EXISTS email_tickets_kind_check;
ALTER TABLE email_tickets ADD CONSTRAINT email_tickets_kind_check
  CHECK (kind IN ('shipment_request', 'other'));
ALTER TABLE email_tickets DROP CONSTRAINT IF EXISTS email_tickets_status_check;
ALTER TABLE email_tickets ADD CONSTRAINT email_tickets_status_check
  CHECK (status IN ('open', 'closed', 'discarded'));
ALTER TABLE email_tickets DROP CONSTRAINT IF EXISTS email_tickets_delivery_check;
ALTER TABLE email_tickets ADD CONSTRAINT email_tickets_delivery_check
  CHECK (delivery_type IS NULL OR delivery_type IN ('local', 'nacional', 'internacional'));
CREATE INDEX IF NOT EXISTS idx_email_tickets_list    ON email_tickets(client_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_email_tickets_updated ON email_tickets(client_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_tickets_service ON email_tickets(client_id, service_date);

-- ── Mensajes crudos: uno por correo recibido ─────────────────────────────────
CREATE TABLE IF NOT EXISTS email_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  inbox_id         uuid REFERENCES email_inboxes(id) ON DELETE SET NULL,
  ticket_id        uuid REFERENCES email_tickets(id) ON DELETE SET NULL,
  resend_email_id  text NOT NULL UNIQUE,             -- idempotencia: Resend reintenta webhooks
  message_id       text,
  in_reply_to      text,
  references_ids   text[],
  thread_key       text,
  from_address     text,
  from_name        text,
  to_addresses     text[],
  cc_addresses     text[],
  subject          text,
  text_body        text,
  html_body        text,
  attachments      jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{resend_id, filename, content_type, size, path, extracted}]
  extraction       jsonb,                                -- salida validada de la IA (auditoría / evals)
  status           text NOT NULL DEFAULT 'received',
  attempts         int NOT NULL DEFAULT 0,
  last_error       text,
  received_at      timestamptz NOT NULL DEFAULT now(),
  processed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_messages DROP CONSTRAINT IF EXISTS email_messages_status_check;
ALTER TABLE email_messages ADD CONSTRAINT email_messages_status_check
  CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored'));
CREATE INDEX IF NOT EXISTS idx_email_messages_client_recv ON email_messages(client_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_ticket      ON email_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_msgid       ON email_messages(client_id, message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_pending     ON email_messages(status, attempts, received_at)
  WHERE status IN ('received', 'failed', 'processing');

-- ── Correcciones manuales: el bucle de aprendizaje ───────────────────────────
CREATE TABLE IF NOT EXISTS email_corrections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ticket_id      uuid NOT NULL REFERENCES email_tickets(id) ON DELETE CASCADE,
  field          text NOT NULL,
  before         jsonb,
  after          jsonb,
  email_excerpt  text,                               -- primeros ~1500 chars del primer mensaje
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_corrections_client ON email_corrections(client_id, created_at DESC);

-- ── Ejemplos de entrenamiento: few-shot por cliente ──────────────────────────
CREATE TABLE IF NOT EXISTS email_training_examples (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source            text NOT NULL DEFAULT 'upload',      -- 'upload' | 'correction' | 'seed'
  email_text        text NOT NULL,
  attachments_text  text,
  expected_kind     text NOT NULL DEFAULT 'shipment_request',
  expected_fields   jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes             text,
  active            boolean NOT NULL DEFAULT true,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_training_examples DROP CONSTRAINT IF EXISTS email_training_source_check;
ALTER TABLE email_training_examples ADD CONSTRAINT email_training_source_check
  CHECK (source IN ('upload', 'correction', 'seed'));
CREATE INDEX IF NOT EXISTS idx_email_training_client ON email_training_examples(client_id, active, created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Toda la lectura/escritura va por rutas de API con service_role (ignora RLS)
-- tras resolveRequestClient + requireEmailOps. Las políticas son cinturón
-- adicional: si algún día se lee desde el navegador con la publishable key
-- (realtime de email_tickets lo hace), ya está acotado por cliente.
-- mira_project_access.project_id guarda el CLIENT id (nombre heredado, ver 0025).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['email_inboxes','email_ops_settings','email_tickets','email_messages','email_corrections','email_training_examples']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s: read own client" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%s: read own client" ON %I FOR SELECT USING (
        client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
        OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
      )$p$, t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s: write own client" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%s: write own client" ON %I FOR UPDATE USING (
        client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
        OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
      )$p$, t, t);
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;

-- ── Realtime: la lista de tickets se refresca sola en el navegador ───────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE email_tickets;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL; -- sin publicación (entorno local sin realtime)
END $$;
