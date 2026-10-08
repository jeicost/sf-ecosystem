-- 0092: Fichas de condiciones comerciales (fase 1 de propuestas, 8-oct-2026).
-- Aplicada a mano vía Management API.
--
-- De cada documento comercial leído (ofertas, contratos, tarifas, correos de
-- las carpetas de SharePoint/OneDrive conectadas con propósito «commercial»)
-- se extrae UNA O VARIAS fichas estructuradas: cliente, servicio, condiciones
-- económicas, compromisos, vigencia y resultado, con la cita literal de la que
-- sale cada dato y su confianza (lo deducido se marca para revisar, como en
-- Email Ops). La extracción va por LOTES (Message Batches API, mitad de
-- precio) con el modelo barato; las fichas revisadas alimentan la memoria de
-- precios (rangos comparables, calculados en TS) y, en la fase 2, al
-- asistente de propuestas.

CREATE TABLE IF NOT EXISTS commercial_fichas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id      uuid REFERENCES agent_documents(id) ON DELETE SET NULL,
  ordinal          int  NOT NULL DEFAULT 1,            -- varias fichas por documento
  source_path      text,                               -- ruta del fichero en la carpeta conectada
  doc_kind         text NOT NULL DEFAULT 'otro',       -- oferta | contrato | tarifa | correo | otro
  doc_date         date,
  customer_name    text,
  customer_sector  text,
  customer_contact text,
  service_scope    text,                               -- local | nacional | internacional | mixto | ''
  service_summary  text,
  conditions       jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{concepto, importe, unidad, moneda, condiciones}]
  surcharges       jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{concepto, importe, unidad}]
  discounts        text,
  payment_terms    text,
  commitments      jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{tipo, detalle}] plazos, horarios, penalizaciones, seguro…
  volume_estimate  text,
  validity_from    date,
  validity_to      date,
  outcome          text NOT NULL DEFAULT 'desconocido', -- ganada | perdida | renovada | caducada | desconocido
  confidence       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {campo: 0..1}
  evidence         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {campo: "cita literal"}
  status           text NOT NULL DEFAULT 'extracted',   -- extracted | reviewed | discarded
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commercial_fichas_client   ON commercial_fichas(client_id, status, customer_name);
CREATE INDEX IF NOT EXISTS idx_commercial_fichas_document ON commercial_fichas(document_id);
ALTER TABLE commercial_fichas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commercial_fichas: users read their clients" ON commercial_fichas
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- Cola de extracción: un trabajo por documento. Se envían en lotes a la API y
-- el cron recoge los resultados cuando el lote termina.
CREATE TABLE IF NOT EXISTS commercial_extraction_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_id   uuid NOT NULL REFERENCES agent_documents(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending',   -- pending | submitted | done | failed | skipped
  batch_id      text,                              -- id del lote en la API
  custom_id     text,                              -- id de la petición dentro del lote
  attempts      int  NOT NULL DEFAULT 0,
  fichas_count  int  NOT NULL DEFAULT 0,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id)
);
CREATE INDEX IF NOT EXISTS idx_commercial_jobs_queue ON commercial_extraction_jobs(client_id, status, created_at);
ALTER TABLE commercial_extraction_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commercial_jobs: users read their clients" ON commercial_extraction_jobs
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

CREATE TABLE IF NOT EXISTS commercial_batches (
  id               text PRIMARY KEY,                -- id del lote en la API de Anthropic
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'in_progress', -- in_progress | ended | collected | failed
  request_count    int  NOT NULL DEFAULT 0,
  succeeded        int  NOT NULL DEFAULT 0,
  errored          int  NOT NULL DEFAULT 0,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz,
  collected_at     timestamptz,
  error            text
);
CREATE INDEX IF NOT EXISTS idx_commercial_batches_open ON commercial_batches(status) WHERE status IN ('in_progress', 'ended');
ALTER TABLE commercial_batches ENABLE ROW LEVEL SECURITY;
