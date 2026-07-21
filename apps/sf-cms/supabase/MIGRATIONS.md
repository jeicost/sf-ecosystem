# SF-CMS migrations — Supabase CLI

Replaces "paste SQL into the dashboard by hand," the root cause behind every
undocumented-column incident found in the 2026-07-19/21 audit (`page_versions`,
`pages.client_slug`/`section_id`, `posts.client_slug`, `audit_log`, `projects.vercel_hook_url`
— five separate cases of production drifting from the tracked migration files).

## Setup status: ✅ DONE (2026-07-21)

Already completed on this machine — no action needed:
- Access token stored in `.env.local` as `SUPABASE_ACCESS_TOKEN` (gitignored).
  Commands below read it automatically when run via the npm scripts; if
  running `npx supabase` directly, `export SUPABASE_ACCESS_TOKEN=$(grep
  SUPABASE_ACCESS_TOKEN .env.local | cut -d= -f2)` first.
- Project linked to `dmzecrlkclocqaywkjtc`.
- Migrations 001-007 (applied by hand in the dashboard before CLI adoption)
  marked as applied via `supabase migration repair --status applied 001 ... 007`
  so `db push` doesn't try to re-run them. `migration list` shows local and
  remote fully in sync.

On a NEW machine: create a token at supabase.com/dashboard/account/tokens,
add it to `.env.local`, then `npm run db:link`.

## Applying a new migration

1. Add a new file to `supabase/migrations/`, numbered sequentially
   (`008_whatever.sql`), following the pattern of `001`-`007`.
2. `npm run db:push` — applies any migration not yet recorded as run
   against the linked project. Prints exactly what it's about to run before
   applying.

## Checking for drift

```bash
npm run db:diff
```

Compares the linked project's real schema against the migrations directory
and shows anything that doesn't match — this is the check that would have
caught every drift incident above the moment it happened, instead of months
later during an unrelated feature.

⚠️ `db:diff` requires Docker Desktop (the CLI spins up a local shadow
database to diff against) — NOT currently installed on this machine, so this
command won't run today. `db:push` does NOT need Docker and is the one that
matters for the daily workflow. Install Docker Desktop only if/when you want
drift detection; until then, the PostgREST introspection trick documented in
memory (GET /rest/v1/ with the service key → `definitions`) is the manual
fallback for checking real column state.

## Why this instead of the dashboard SQL editor

The dashboard editor has no memory of what's already been applied — every
past incident (5 and counting) happened because someone ran SQL there once,
it worked, and nobody wrote down what they ran. `db push` tracks applied
migrations in the linked project itself; `db diff` gives an honest answer to
"does prod actually match what's in git" instead of assuming it does.
