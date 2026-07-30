-- 0063: Backfill de content_hash para documentos de Drive sincronizados
-- antes de la migración 0062 (2026-07-30). Hallazgo real de la revisión
-- adversarial de esa ronda: content_hash quedó NULL para toda fila
-- preexistente (sin backfill en 0062), y syncDriveFolder compara
-- `existing.content_hash !== contentHash` -- con NULL a la izquierda, esa
-- comparación es SIEMPRE true en JS, así que cada documento ya sincronizado
-- se trataba como "nuevo/cambiado" en su primer re-sync tras el deploy,
-- disparando síntesis (Sonnet) innecesaria y con riesgo de reabrir
-- contradicciones que un humano ya había marcado resolved/dismissed.
--
-- digest(extracted_text, 'sha256') en Postgres produce el mismo hash que
-- crypto.createHash('sha256').update(text).digest('hex') en Node para el
-- mismo string (ambos sobre los bytes UTF-8, mismo algoritmo, misma
-- codificación hex en minúsculas) -- así que si el contenido real de Drive
-- no ha cambiado desde el último sync, el próximo cálculo en JS coincidirá
-- con este backfill y correctamente NO se tratará como cambiado.
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE agent_documents
SET content_hash = encode(digest(extracted_text, 'sha256'), 'hex')
WHERE document_type = 'drive_sync'
  AND content_hash IS NULL
  AND extracted_text IS NOT NULL;
