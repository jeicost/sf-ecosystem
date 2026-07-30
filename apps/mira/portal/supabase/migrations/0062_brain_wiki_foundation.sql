-- 0062: Fundación del "Brand Brain como wiki" (2026-07-30)
-- Aditiva, sin cambio de comportamiento visible. Prepara el terreno para que
-- Drive-sync pueda sintetizar (no solo indexar) contra el Brand Brain, y para
-- que las contradicciones se registren de forma estructurada en vez de un
-- prefijo de texto invisible. Nada de esto se lee/escribe todavía en código
-- (eso llega en las fases 1-2) — es seguro aplicar antes de desplegar código.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

-- (1) brain_change_proposals admite orígenes automáticos (Drive-sync, lint)
-- además de los 2 ya existentes (chat de agencia/cliente), y guarda de qué
-- documentos concretos salió una propuesta automática.
ALTER TABLE brain_change_proposals
  DROP CONSTRAINT IF EXISTS brain_change_proposals_origin_check;
ALTER TABLE brain_change_proposals
  ADD CONSTRAINT brain_change_proposals_origin_check
  CHECK (origin IN ('agency', 'client', 'drive_sync', 'lint'));
ALTER TABLE brain_change_proposals
  ADD COLUMN IF NOT EXISTS source_document_ids uuid[];

-- (2) Contradicciones estructuradas — sustituye al prefijo de texto libre
-- '[CONFLICTO]' de analyze-document y da un destino compartido a cualquier
-- productor (chat, Drive-sync, análisis de documento, lint). El ciclo de
-- vida (open→resolved/dismissed) es independiente de la propuesta que la
-- originó: si se rechaza la propuesta, la contradicción sigue abierta hasta
-- que un humano la resuelva explícitamente.
CREATE TABLE IF NOT EXISTS brain_contradictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL,
  field_path text NOT NULL,
  existing_value_excerpt text,
  proposed_value_excerpt text,
  note text NOT NULL,
  source_type text NOT NULL
    CHECK (source_type IN ('chat', 'drive_sync', 'document_analysis', 'manual', 'lint')),
  source_proposal_id uuid REFERENCES brain_change_proposals(id) ON DELETE SET NULL,
  source_document_id uuid REFERENCES agent_documents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brain_contradictions_client_status
  ON brain_contradictions(client_id, status);

ALTER TABLE brain_contradictions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY brain_contradictions_read ON brain_contradictions FOR SELECT
    USING (client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- (3) Procedencia por sección del Brand Brain — de dónde salió el último
-- valor aplicado a cada sección de primer nivel de brand_data (identity,
-- offer, tone_and_voice...). Granularidad de SECCIÓN, no de leaf-field, para
-- que encaje con la agrupación por "página" del índice navegable (fase 2).
CREATE TABLE IF NOT EXISTS brain_field_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL,
  field_path text NOT NULL,
  source_type text NOT NULL
    CHECK (source_type IN ('chat', 'drive_sync', 'document_analysis', 'manual', 'lint', 'onboarding')),
  source_ref text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, field_path)
);
CREATE INDEX IF NOT EXISTS idx_brain_field_provenance_client
  ON brain_field_provenance(client_id);

ALTER TABLE brain_field_provenance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY brain_field_provenance_read ON brain_field_provenance FOR SELECT
    USING (client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- (4) Dedup real de documentos de Drive por contenido (no solo por
-- google_drive_file_id) — para que un re-sync no vuelva a sintetizar/proponer
-- sobre un documento que no cambió de verdad.
ALTER TABLE agent_documents ADD COLUMN IF NOT EXISTS content_hash text;
CREATE INDEX IF NOT EXISTS idx_agent_documents_client_content_hash
  ON agent_documents(client_id, content_hash);

-- (5) Cierre de deuda documental: brand_references nunca tuvo un CREATE TABLE
-- versionado (confirmado — solo se conoce por 0052, que ya le hace ALTER
-- asumiendo que existe). IF NOT EXISTS: no-op contra la tabla real de
-- producción, solo crea la tabla si el entorno arranca de cero.
CREATE TABLE IF NOT EXISTS brand_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL,
  url text NOT NULL,
  title text,
  pillar text,
  why_worked text,
  what_to_repeat text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, url)
);
CREATE INDEX IF NOT EXISTS idx_brand_references_client ON brand_references(client_id);

ALTER TABLE brand_references ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY brand_references_read ON brand_references FOR SELECT
    USING (client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- NOTA — content_pillars, a propósito NO se toca en esta migración:
-- app/api/brand-brain/route.ts y app/api/load-data/route.ts ya hacen
-- upsert(..., { onConflict: 'client_id,pillar_name' }) contra esa tabla, pero
-- ninguna migración versionada añadió jamás esa constraint única. Verificado
-- hoy (2026-07-30) vía script de solo lectura contra las 25 filas reales de
-- producción: CERO duplicados de (client_id, pillar_name) — es seguro añadir
-- la constraint sin decisiones de "qué duplicado descartar". Falta solo
-- confirmar si ya existe (aplicada ad-hoc en algún momento sin migración,
-- patrón ya visto en este repo) antes de intentar crearla dos veces:
--
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'content_pillars'::regclass AND contype = 'u';
--
-- Si esa consulta ya muestra una unique constraint sobre
-- (client_id, pillar_name), no hace falta nada más. Si no aparece, aplicar:
--
--   ALTER TABLE content_pillars ADD CONSTRAINT content_pillars_client_pillar_key
--     UNIQUE (client_id, pillar_name);
--
-- El código (lib/brain-tools/index.ts, lib/onboarding/tools.ts) ya funciona
-- en ambos casos: si la constraint no existe todavía, el upsert falla con
-- 42P10 y cae a un insert normal (mismo comportamiento que antes) — no hace
-- falta coordinar el deploy de código con el momento exacto en que se aplique
-- este ALTER.
