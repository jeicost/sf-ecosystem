-- 0031: BASELINE DOCUMENTAL de tablas sin DDL versionado
-- migration-date: 2026-07-19
--
-- ⚠️ DOCUMENTAL — NO EJECUTAR EN PRODUCCIÓN (las tablas ya existen ahí).
-- Objetivo: reproducibilidad. Estas tablas se consultan/escriben desde el código
-- (`.from('...')`) pero no tenían CREATE TABLE en ninguna migración. El esquema
-- de abajo se obtuvo por introspección REST de producción (2026-07-19).
--
-- DEUDA DE MIGRACIONES: existen DOS carpetas divergentes —
--   apps/mira/portal/supabase/migrations/  (0009..0031, la principal)
--   apps/mira/portal/migrations/           (0001..0003: toolkit_results, lead_discovery_results, apollo_enrichment_results)
-- Consolidar en una sola carpeta en una sesión futura.
--
-- Tablas referenciadas en código SIN columnas conocidas (vacías en prod al introspectar)
-- o INEXISTENTES — requieren introspección manual vía SQL Editor antes de recrear:
--   mira_projects (vacía), drive_connections (vacía), mira_users (vacía),
--   icp_profiles, brand_references, proposal_library, lead_activities,
--   prospect_context, agent_sessions (INEXISTENTE), mira_clients (INEXISTENTE).
--   → mira_clients y agent_sessions se referencian en código pero NO existen en prod:
--     posibles rutas muertas (client-portal/info lee mira_clients). Revisar.

-- ── Tablas con esquema introspectado (columnas reales de prod) ──────────────

CREATE TABLE IF NOT EXISTS approval_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  post_id uuid,
  platform text,
  tipo text,
  copy text,
  edited_copy text,
  caption text,
  edited_caption text,
  hashtags text[],
  asset_url text,
  status text,
  tone_warning text,
  reviewer_notes text,
  scheduled_time timestamptz,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS post_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  pillar_id uuid,
  platform text,
  content text,
  status text,
  performance jsonb,
  embedding vector,
  approved_by uuid,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  canal text,
  tipo text,
  prioridad text,
  contenido text,
  propuesta_respuesta text,
  status text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS agent_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  agent_name text,
  user_query text,
  agent_response text,
  outcome text,
  user_feedback text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text,
  first_name text,
  last_name text,
  email text,
  title text,
  company_name text,
  company_website text,
  industry text,
  geography text,
  linkedin_url text,
  linkedin_summary text,
  source text,
  stage text,
  classification text,
  hot_score numeric,
  trigger_event text,
  icebreaker text,
  notes text,
  assigned_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  campaign_id uuid,
  icp_id uuid,
  first_name text,
  last_name text,
  email text,
  title text,
  company_name text,
  company_website text,
  company_size text,
  company_news text,
  industry text,
  geography text,
  linkedin_url text,
  linkedin_summary text,
  source text,
  stage text,
  bant_score numeric,
  hot_score numeric,
  trigger_event text,
  icebreaker_used text,
  notes text,
  notion_page_id text,
  assigned_to uuid,
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  reply_received_at timestamptz,
  call_scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
