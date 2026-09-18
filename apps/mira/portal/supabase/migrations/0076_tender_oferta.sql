-- Licitaciones: oferta económica + aprendizaje por cliente (18-sep-2026).
-- Aplicada a mano vía Management API el 2026-09-18.
--
-- `tenders.oferta` guarda la oferta económica generada/editada (líneas de
-- precios unitarios, criterios automáticos, estrategia). Las licitaciones con
-- oferta y status presentada/ganada son los EJEMPLOS de los que aprende el
-- agente para las siguientes (few-shot, igual que email_training_examples).
--
-- `tender_settings.playbook` es la doctrina de precios destilada del cliente
-- (editable por la agencia): cómo bajar según la fórmula de puntuación.

ALTER TABLE tenders ADD COLUMN IF NOT EXISTS oferta jsonb;

CREATE TABLE IF NOT EXISTS tender_settings (
  client_id  uuid PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  playbook   text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tender_settings ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo el service-role (las rutas API autorizan con requireTool).
