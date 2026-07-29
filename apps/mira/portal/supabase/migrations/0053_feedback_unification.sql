-- 0053: Feedback unificado (P3 Fase 2, 2026-07-29)
-- document_feedback cubre también quick actions (action_id) y distingue el
-- contexto del feedback. Aditiva; el código es resiliente pre-aplicación.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

ALTER TABLE document_feedback
  ADD COLUMN IF NOT EXISTS action_id uuid,
  ADD COLUMN IF NOT EXISTS context text NOT NULL DEFAULT 'toolkit'
    CHECK (context IN ('toolkit','document','quick_action','monthly'));

CREATE INDEX IF NOT EXISTS idx_document_feedback_action
  ON document_feedback(action_id);
