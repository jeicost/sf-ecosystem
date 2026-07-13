-- OAuth sessions table for temporary state tokens during OAuth flow
create table if not exists public.oauth_sessions (
  id bigserial primary key,
  state text unique not null,
  tool text not null,
  client_id uuid not null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,

  constraint oauth_sessions_client_id_fkey
    foreign key (client_id) references public.mira_clients(id) on delete cascade
);

-- Index for fast state lookup
create index if not exists idx_oauth_sessions_state on public.oauth_sessions(state);
create index if not exists idx_oauth_sessions_expires_at on public.oauth_sessions(expires_at);

-- Enable RLS
alter table public.oauth_sessions enable row level security;

-- Policy: Sessions are service-only (backend cleans them)
create policy "oauth_sessions_service_access"
  on public.oauth_sessions
  using (false)
  with check (false);
