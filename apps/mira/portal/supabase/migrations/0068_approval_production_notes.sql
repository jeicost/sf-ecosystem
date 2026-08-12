-- 0068 — Separa lo publicable de las notas de producción, y guarda los avisos
-- del validador de reglas del cliente.
--
-- Detectado el 2026-08-12 probando la siembra con Salsa Burgers: composeCopy
-- concatenaba la dirección visual DENTRO del copy, así que el cliente que
-- copiara y pegara la pieza en Instagram se llevaba las instrucciones para el
-- diseñador. Y las qa_rules que cada marca tiene escritas en su Cerebro no las
-- comprobaba nadie: Salsa exige 3-5 hashtags en el caption y el motor generó 8.
--
-- Aditiva: dos columnas nuevas, nada existente se toca.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS production_notes text;
ALTER TABLE approval_queue ADD COLUMN IF NOT EXISTS qa_flags jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN approval_queue.production_notes IS
  'Dirección visual, guion de reel y pilar: lo que necesita quien produce la pieza, NUNCA parte del texto publicable.';
COMMENT ON COLUMN approval_queue.qa_flags IS
  'Avisos del validador de qa_rules del propio cliente: [{rule, detail, severity}]. Vacío = pasó las comprobaciones mecánicas.';
