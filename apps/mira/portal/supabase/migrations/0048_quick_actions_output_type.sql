-- 0048: output_type real + error_message + saneo de filas zombis
--
-- error_message estaba en el esquema de 0013/0015 pero NUNCA llegó a la BD real
-- (mismo patrón que 0044): todos los update({status:'failed', error_message})
-- del código fallaban en silencio — segunda causa de las filas zombis.
ALTER TABLE quick_actions_results
  ADD COLUMN IF NOT EXISTS error_message text;

-- client_documentation.extracted_text también estaba en el esquema (0015) pero
-- no en la BD real: agent-context.ts la selecciona en cada generación (el
-- grounding por documentos de quick actions fallaba en silencio) y el nuevo
-- "Guardar en Documentos" la escribe para que esos docs sirvan de grounding.
ALTER TABLE client_documentation
  ADD COLUMN IF NOT EXISTS extracted_text text;

-- La columna output_type existía desde 0013 pero NUNCA se escribió: su CHECK
-- original ('image','document','video','json') rechazaba los tipos reales que
-- la UI usa ('social_post','newsletter','text','structured'), así que el route
-- nunca la pobló y el tipado viajaba solo como prop de React. Se ensancha el
-- CHECK conservando los 4 valores antiguos por si hay datos históricos.
ALTER TABLE quick_actions_results
  DROP CONSTRAINT IF EXISTS quick_actions_results_output_type_check;
ALTER TABLE quick_actions_results
  ADD CONSTRAINT quick_actions_results_output_type_check
  CHECK (output_type IS NULL OR output_type IN (
    'image', 'document', 'video', 'json',
    'social_post', 'newsletter', 'text', 'structured'
  ));

-- Saneo one-time: filas atascadas en processing (la función murió sin marcar
-- failed — 6 en producción a fecha de esta migración). El "reaper" continuo
-- para casos futuros vive en el GET de /api/quick-actions.
UPDATE quick_actions_results
SET status = 'failed',
    error_message = 'Timed out — stuck in processing (backfill 0048)'
WHERE status = 'processing'
  AND created_at < NOW() - INTERVAL '1 hour';
