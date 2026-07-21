# SF-CMS migrations — Supabase CLI

Replaces "paste SQL into the dashboard by hand," the root cause behind every
undocumented-column incident found in the 2026-07-19/21 audit (`page_versions`,
`pages.client_slug`/`section_id`, `posts.client_slug`, `audit_log`, `projects.vercel_hook_url`
— five separate cases of production drifting from the tracked migration files).

## One-time setup (you, not me — requires interactive browser login)

```bash
cd apps/sf-cms
npm run db:link
```

This opens a browser to authenticate the Supabase CLI against your account,
then links this folder to project `dmzecrlkclocqaywkjtc`. Do this once per
machine you run migrations from.

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

## Why this instead of the dashboard SQL editor

The dashboard editor has no memory of what's already been applied — every
past incident (5 and counting) happened because someone ran SQL there once,
it worked, and nobody wrote down what they ran. `db push` tracks applied
migrations in the linked project itself; `db diff` gives an honest answer to
"does prod actually match what's in git" instead of assuming it does.
