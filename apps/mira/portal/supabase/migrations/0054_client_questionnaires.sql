-- 0054: Cuestionarios a cliente (P5 Fase 2, 2026-07-29)
-- MIRA genera cuestionarios (de huecos del brain + open_questions + plantilla
-- intake) que el cliente responde asíncrono con su login. Al completarse, la
-- agencia los ingesta al brain/memoria (SIEMPRE manual). No pasan por
-- generation_queue (CHECK de tool_slug + semántica distinta).
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

CREATE TABLE IF NOT EXISTS client_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  intro text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','in_progress','completed','ingested','archived')),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','brain_gaps','intake_template','onboarding')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  ingested_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_client_questionnaires_client
  ON client_questionnaires(client_id, status);

CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES client_questionnaires(id) ON DELETE CASCADE,
  position int NOT NULL,
  section text,
  prompt text NOT NULL,
  help text,
  kind text NOT NULL DEFAULT 'long_text'
    CHECK (kind IN ('text','long_text','select','multi_select','number','url')),
  options jsonb,
  required boolean NOT NULL DEFAULT false,
  maps_to text
);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_q
  ON questionnaire_questions(questionnaire_id, position);

CREATE TABLE IF NOT EXISTS questionnaire_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questionnaire_questions(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  value jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final')),
  answered_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id)
);

-- RLS: lectura para miembros del cliente (patrón mira_project_access, cuyo
-- project_id ES el client id); escrituras vía service role en las rutas.
ALTER TABLE client_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY cq_read ON client_questionnaires FOR SELECT
  USING (client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid()));
CREATE POLICY qq_read ON questionnaire_questions FOR SELECT
  USING (questionnaire_id IN (SELECT id FROM client_questionnaires WHERE client_id IN
    (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())));
CREATE POLICY qa_read ON questionnaire_answers FOR SELECT
  USING (client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid()));
