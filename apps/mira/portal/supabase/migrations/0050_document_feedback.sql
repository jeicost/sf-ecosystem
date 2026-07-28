-- 0050: feedback sobre documentos/informes del Toolkit (B4).
-- El único bucle de feedback que aprendía era el 👍/👎 del chat de agentes;
-- los informes no tenían ninguno. Estas notas se reinyectan en la siguiente
-- generación del mismo tool para el mismo cliente (patrón agent_interactions).
CREATE TABLE IF NOT EXISTS document_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  queue_id uuid,
  tool_slug text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('helpful', 'not_helpful')),
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_feedback_client_tool
  ON document_feedback(client_id, tool_slug, created_at DESC);

ALTER TABLE document_feedback ENABLE ROW LEVEL SECURITY;
-- Escrituras/lecturas via service role (rutas API con auth propia); sin
-- políticas anon — mismo tratamiento que agent_interactions tras (y).
