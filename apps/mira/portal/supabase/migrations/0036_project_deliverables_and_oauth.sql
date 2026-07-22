-- 0036 — Fase 2: entregables por proyecto + OAuth sessions (Canva PKCE)
-- Aditiva y segura. Aplicar en el SQL editor del dashboard (nnevhtfxuawexliwlbmh).

-- 1) Entregables por proyecto
alter table public.generation_queue
  add column if not exists project_id uuid references public.mira_projects(id) on delete set null;
create index if not exists idx_generation_queue_project_id
  on public.generation_queue(project_id);

-- 2) oauth_sessions — la 0027 nunca se aplicó (FK a mira_clients, tabla inexistente).
--    Se crea aquí con el FK correcto a clients + soporte PKCE.
create table if not exists public.oauth_sessions (
  id bigserial primary key,
  state text unique not null,
  tool text not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  code_verifier text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_oauth_sessions_state on public.oauth_sessions(state);
create index if not exists idx_oauth_sessions_expires_at on public.oauth_sessions(expires_at);
alter table public.oauth_sessions enable row level security;
drop policy if exists "oauth_sessions_service_access" on public.oauth_sessions;
create policy "oauth_sessions_service_access"
  on public.oauth_sessions
  using (false)
  with check (false);
