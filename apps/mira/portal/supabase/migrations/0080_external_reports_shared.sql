-- Un informe de Power BI puede servir a VARIAS marcas (25-sep-2026).
--
-- Los informes de Envíos y Facturación son del grupo Aldea, que en MIRA son
-- cuatro marcas distintas: Albasanz Express, GTD Mensajeros, GLS Ciudad Lineal
-- y Dadybox. Con un informe por marca habría que pegar la misma URL cuatro
-- veces y acordarse de cambiarla en cuatro sitios el día que Power BI la
-- renueve — el clásico dato duplicado que se queda viejo en tres copias.
--
-- Por qué no se reutiliza billing_group_id: esa columna solo la usa el recuento
-- de asientos (lib/seats.ts). Agrupar ahí a las cuatro marcas cambiaría su
-- facturación como efecto colateral de configurar un informe.
--
-- El informe sigue PERTENECIENDO a una marca (client_id): esa es la única que
-- puede editarlo. Las demás lo ven, y solo si están en esta lista.

ALTER TABLE external_reports
  ADD COLUMN IF NOT EXISTS shared_client_ids uuid[] NOT NULL DEFAULT '{}';

-- Para resolver "¿qué informes ve esta marca?" sin recorrer la tabla entera.
CREATE INDEX IF NOT EXISTS external_reports_shared_idx
  ON external_reports USING GIN (shared_client_ids);
