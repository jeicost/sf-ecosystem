-- ============================================================================
-- DRAFT — NO APLICAR — SIN NÚMERO DE SECUENCIA
-- Visual Production Foundation · eventos, QA independiente y feedback humano
-- Depende de draft_01_core.sql. Mismas condiciones: se numera al aprobarse.
-- ============================================================================

-- Traza append-only del job: cada transición, intento y decisión.
-- Cumple el requisito de observabilidad del handoff (status history, brand
-- module version, intentos de generación/QA, feedback, aprobaciones, retries,
-- latencia y coste).
create table if not exists public.vp_visual_job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.vp_visual_jobs(id) on delete cascade,
  step text not null,
  from_status text,
  to_status text,
  detail jsonb not null default '{}'::jsonb,
  latency_ms int,
  cost_usd numeric(10,4),
  actor text not null default 'worker' check (actor in ('system','worker','human')),
  created_at timestamptz not null default now(),
  -- Idempotencia del worker: un mismo paso no se registra dos veces por intento
  unique (job_id, step, created_at)
);
create index if not exists idx_vp_events_job on public.vp_visual_job_events(job_id, created_at);

-- QA INDEPENDIENTE del creador (regla dura del handoff: el creador nunca se
-- auto-aprueba; la aprobación humana es otro paso posterior).
create table if not exists public.vp_visual_qa_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.vp_visual_jobs(id) on delete cascade,
  asset_id uuid not null references public.vp_visual_job_assets(id) on delete cascade,
  verdict text not null check (verdict in ('pass','fail','needs_review')),
  checks jsonb not null default '[]'::jsonb, -- [{check, ok, detail}]
  qa_model text,
  created_at timestamptz not null default now()
);
create index if not exists idx_vp_qa_job on public.vp_visual_qa_runs(job_id);

-- Feedback humano (APPROVE / EDIT / PASS — mismo vocabulario que el deck
-- mensual de MIRA para que el cliente no aprenda dos sistemas)
create table if not exists public.vp_visual_feedback (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.vp_visual_jobs(id) on delete cascade,
  asset_id uuid references public.vp_visual_job_assets(id) on delete set null,
  outcome text not null check (outcome in ('approve','edit','pass')),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_vp_feedback_job on public.vp_visual_feedback(job_id);

alter table public.vp_visual_job_events enable row level security;
alter table public.vp_visual_qa_runs enable row level security;
alter table public.vp_visual_feedback enable row level security;

create policy vp_events_read on public.vp_visual_job_events for select
  using (job_id in (select id from public.vp_visual_jobs where client_id in
    (select project_id from public.mira_project_access where user_id = auth.uid())));
create policy vp_qa_read on public.vp_visual_qa_runs for select
  using (job_id in (select id from public.vp_visual_jobs where client_id in
    (select project_id from public.mira_project_access where user_id = auth.uid())));
create policy vp_fb_read on public.vp_visual_feedback for select
  using (job_id in (select id from public.vp_visual_jobs where client_id in
    (select project_id from public.mira_project_access where user_id = auth.uid())));
