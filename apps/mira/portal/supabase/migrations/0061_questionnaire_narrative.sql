-- 0061: narrativa opcional en cuestionarios (Informes de decisión, 2026-07-30)
-- El CEO pidió poder crear, desde la gestión de clientes en super admin, un
-- informe narrativo (resumen ejecutivo, diagnóstico, benchmark...) con un
-- formulario de decisión embebido al final -- ejemplo real aportado
-- (Adrian Grooves). En vez de un sistema nuevo en paralelo, se generaliza el
-- sistema de cuestionarios ya existente (0054): questionnaire_questions.kind
-- 'select'/'multi_select' + options ya cubre "choice cards" de una o varias
-- opciones -- solo faltaba dónde meter el texto narrativo que acompaña a las
-- preguntas. Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

ALTER TABLE client_questionnaires ADD COLUMN IF NOT EXISTS narrative jsonb;
COMMENT ON COLUMN client_questionnaires.narrative IS
  'Array opcional de {heading?, body} -- secciones de texto narrativo mostradas antes de las preguntas (resumen ejecutivo, diagnóstico, benchmark, etc.), como en un informe editorial.';
