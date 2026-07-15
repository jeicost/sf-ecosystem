-- Visual Generation System Tables
-- Supports async visual job workflow: accepted → planning → rendering → qa → completed
-- All tables RLS-protected by client_id following existing patterns

-- Main visual job record
create table if not exists public.visual_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  project_id uuid,
  user_id uuid,
  action_type text not null, -- crear_post_visual, crear_carrusel_visual, editar_imagen_visual
  status text not null default 'accepted', -- accepted, planning, rendering, qa, completed, error
  brand_id uuid,
  request_payload jsonb not null, -- original user input + context
  provider text, -- 'mock', 'openai', 'midjourney', etc.
  provider_job_id text, -- external job reference
  result_payload jsonb, -- final generated assets/specs
  error_message text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint visual_jobs_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete cascade,
  constraint visual_jobs_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null
);

create index if not exists idx_visual_jobs_client_id on public.visual_jobs(client_id);
create index if not exists idx_visual_jobs_status on public.visual_jobs(status);
create index if not exists idx_visual_jobs_user_id on public.visual_jobs(user_id);

-- Visual assets (individual images, carousel slides, etc.)
create table if not exists public.visual_assets (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  client_id uuid not null,
  storage_path text, -- s3/supabase path: clients/{clientId}/visual-jobs/{jobId}/{source|candidates|final}/
  asset_type text not null, -- post, carousel_slide, image_edit
  slide_index int, -- for carousels: which slide this is
  width int,
  height int,
  version int not null default 1, -- for tracking refinements
  approval_status text not null default 'pending', -- pending, approved, rejected, revision_requested
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  provider_job_id text, -- external reference for this specific asset

  constraint visual_assets_job_id_fkey
    foreign key (job_id) references public.visual_jobs(id) on delete cascade,
  constraint visual_assets_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete cascade
);

create index if not exists idx_visual_assets_job_id on public.visual_assets(job_id);
create index if not exists idx_visual_assets_client_id on public.visual_assets(client_id);
create index if not exists idx_visual_assets_approval_status on public.visual_assets(approval_status);

-- Refinement feedback (conversational flow for edits)
create table if not exists public.visual_feedback (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  asset_id uuid,
  client_id uuid not null,
  version int, -- which version of the asset this feedback is for
  refinement_prompt text not null, -- "make background darker", "fix only the headline"
  blocked_elements text[], -- elements that should NOT be regenerated
  previous_provider_job_id text, -- for chaining refinements without full regeneration
  status text not null default 'pending', -- pending, applied, rejected
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint visual_feedback_job_id_fkey
    foreign key (job_id) references public.visual_jobs(id) on delete cascade,
  constraint visual_feedback_asset_id_fkey
    foreign key (asset_id) references public.visual_assets(id) on delete set null,
  constraint visual_feedback_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete cascade
);

create index if not exists idx_visual_feedback_job_id on public.visual_feedback(job_id);
create index if not exists idx_visual_feedback_asset_id on public.visual_feedback(asset_id);
create index if not exists idx_visual_feedback_client_id on public.visual_feedback(client_id);

-- Approval workflow (audit trail)
create table if not exists public.visual_approvals (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  client_id uuid not null,
  approved_by uuid,
  approval_status text not null, -- approved, rejected, revision_requested
  feedback text, -- reason for rejection or revision request
  created_at timestamp with time zone not null default now(),

  constraint visual_approvals_asset_id_fkey
    foreign key (asset_id) references public.visual_assets(id) on delete cascade,
  constraint visual_approvals_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete cascade,
  constraint visual_approvals_approved_by_fkey
    foreign key (approved_by) references auth.users(id) on delete set null
);

create index if not exists idx_visual_approvals_asset_id on public.visual_approvals(asset_id);
create index if not exists idx_visual_approvals_client_id on public.visual_approvals(client_id);
create index if not exists idx_visual_approvals_approved_by on public.visual_approvals(approved_by);

-- Enable RLS for all visual tables
alter table public.visual_jobs enable row level security;
alter table public.visual_assets enable row level security;
alter table public.visual_feedback enable row level security;
alter table public.visual_approvals enable row level security;

-- RLS Policies: visual_jobs
create policy "Users can view their own visual jobs"
  on public.visual_jobs for select
  using (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Users can create visual jobs for their clients"
  on public.visual_jobs for insert
  with check (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Users can update their own visual jobs"
  on public.visual_jobs for update
  using (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Super admins can view all visual jobs"
  on public.visual_jobs for select
  using ((auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin');

-- RLS Policies: visual_assets
create policy "Users can view assets for their jobs"
  on public.visual_assets for select
  using (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Users can create assets for their jobs"
  on public.visual_assets for insert
  with check (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Super admins can view all assets"
  on public.visual_assets for select
  using ((auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin');

-- RLS Policies: visual_feedback
create policy "Users can view feedback for their jobs"
  on public.visual_feedback for select
  using (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Users can submit feedback for their jobs"
  on public.visual_feedback for insert
  with check (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Super admins can view all feedback"
  on public.visual_feedback for select
  using ((auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin');

-- RLS Policies: visual_approvals
create policy "Users can view approvals for their assets"
  on public.visual_approvals for select
  using (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Users can submit approvals for their assets"
  on public.visual_approvals for insert
  with check (client_id in (
    select project_id from mira_project_access where user_id = auth.uid()
  ));

create policy "Super admins can view all approvals"
  on public.visual_approvals for select
  using ((auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin');
