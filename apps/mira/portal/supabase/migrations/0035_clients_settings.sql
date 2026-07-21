-- 0035: clients.settings — jsonb de configuración por cliente
-- migration-date: 2026-07-21
--
-- La UI del toolkit (LandingsSection) y la home leen `clients.settings.landings`
-- (array de {title, url, meta}) pero la columna nunca existió en prod: la
-- sección de landings no se mostraba y la home fallaba con "Client not found".
-- El código ya es tolerante a su ausencia; esta migración la crea para poder
-- configurar landings por cliente.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Ejemplo de uso (rellenar por cliente cuando se quiera):
-- UPDATE clients SET settings = jsonb_set(settings, '{landings}', '[
--   {"title": "Web principal", "url": "https://www.salsaburgers.com", "meta": "Producción"}
-- ]'::jsonb) WHERE slug = 'salsa-burgers';
