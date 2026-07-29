-- ============================================================================
-- DRAFT — NO APLICAR — SIN NÚMERO DE SECUENCIA
-- Visual Production Foundation · núcleo (jobs, assets, brand modules)
-- Handoff v0.1, 2026-07-29. Se numerará (00NN) SOLO cuando el equipo del
-- sistema visual apruebe la arquitectura y el runtime quede autorizado.
-- ============================================================================
--
-- ⚠️ CONFLICTO DOCUMENTADO CON LA MIGRACIÓN 0028 (ya aplicada, tablas VACÍAS
-- y sin rutas que las usen): `visual_jobs`, `visual_assets`, `visual_feedback`,
-- `visual_approvals` existen con OTRO esquema y OTRA máquina de estados
-- (accepted→planning→rendering→qa→completed vs la del handoff
-- draft→validating_inputs→…→completed).
--
-- DECISIÓN PENDIENTE (reunión de revisión de drafts):
--   OPCIÓN A — REUTILIZAR: ALTERs aditivos sobre las tablas 0028 (añadir
--     brief/plan/attempt_count/claimed_at/brand_module_id…, ampliar el CHECK
--     de status a la máquina nueva manteniendo los valores viejos). Pro: sin
--     duplicidad de nombres. Contra: arrastra columnas legacy (brand_id sin FK,
--     provider_job_id) y dos vocabularios de estado conviviendo.
--   OPCIÓN B — NAMESPACIAR (este draft): tablas nuevas con prefijo `vp_`,
--     0028 queda intacta y se retira en una migración de higiene posterior.
--     Pro: contrato limpio 1:1 con el handoff. Contra: nombres menos obvios.
-- Este draft implementa la OPCIÓN B; convertirlo a la A es mecánico.
-- ============================================================================

-- Módulos visuales de marca VERSIONADOS (reproducción vía API de lo validado
-- en los Custom GPTs; nunca se llama a un GPT privado desde MIRA).
create table if not exists public.vp_brand_visual_modules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  module jsonb not null default '{}'::jsonb, -- series, roles de referencia, reglas, prompts base
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (client_id, version)
);
create index if not exists idx_vp_bvm_client_status on public.vp_brand_visual_modules(client_id, status);

-- Job de producción visual gobernado
create table if not exists public.vp_visual_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.mira_projects(id) on delete set null,
  source_action text, -- quick action de origen (p.ej. crear_post_visual)
  status text not null default 'draft' check (status in (
    'draft','validating_inputs','input_blocked','resolving_brand_module',
    'gathering_references','planning','awaiting_plan_review','generating',
    'qa_running','qa_blocked','awaiting_creative_review','creative_approved',
    'post_processing','exporting','storing','completed',
    'generation_failed','export_failed','storage_failed','rejected','cancelled'
  )),
  brand_module_id uuid references public.vp_brand_visual_modules(id) on delete set null,
  brand_module_version int,
  brief jsonb not null default '{}'::jsonb,
  plan jsonb,
  attempt_count int not null default 0,
  max_attempts int not null default 3,
  claimed_at timestamptz, -- claim del worker (timeout de paso si excede umbral)
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_vp_jobs_client on public.vp_visual_jobs(client_id);
-- Índice para el claim del worker (FOR UPDATE SKIP LOCKED sobre pendientes)
create index if not exists idx_vp_jobs_claim on public.vp_visual_jobs(status, created_at)
  where claimed_at is null;

-- Assets del job (inputs, referencias usadas, candidatos, finales, exports)
create table if not exists public.vp_visual_job_assets (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.vp_visual_jobs(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  kind text not null check (kind in ('input','reference','candidate','final','export')),
  storage_path text not null, -- bucket PRIVADO; ver lib/visual-production/storage-paths.ts
  mime_type text not null default 'image/png',
  width int,
  height int,
  meta jsonb not null default '{}'::jsonb, -- modelo, seed, prompt hash… nunca secretos
  created_at timestamptz not null default now()
);
create index if not exists idx_vp_assets_job on public.vp_visual_job_assets(job_id, kind);

-- Referencias de marca reutilizables (no atadas a un job)
create table if not exists public.vp_visual_references (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  brand_module_id uuid references public.vp_brand_visual_modules(id) on delete set null,
  role text not null, -- rol en el sistema de marca (hero, producto, textura…)
  storage_path text,
  external_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_vp_refs_client_role on public.vp_visual_references(client_id, role);

-- RLS (patrón 0045/0046: lectura para miembros del cliente vía
-- mira_project_access — recordar: su columna project_id ES el client id;
-- escrituras solo service role).
alter table public.vp_brand_visual_modules enable row level security;
alter table public.vp_visual_jobs enable row level security;
alter table public.vp_visual_job_assets enable row level security;
alter table public.vp_visual_references enable row level security;

create policy vp_bvm_read on public.vp_brand_visual_modules for select
  using (client_id in (select project_id from public.mira_project_access where user_id = auth.uid()));
create policy vp_jobs_read on public.vp_visual_jobs for select
  using (client_id in (select project_id from public.mira_project_access where user_id = auth.uid()));
create policy vp_assets_read on public.vp_visual_job_assets for select
  using (client_id in (select project_id from public.mira_project_access where user_id = auth.uid()));
create policy vp_refs_read on public.vp_visual_references for select
  using (client_id in (select project_id from public.mira_project_access where user_id = auth.uid()));
