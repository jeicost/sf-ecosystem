# Phase 3: Supabase Separation — SQL Schemas & Migration Scripts

This directory contains the complete SQL schemas and data migration infrastructure for Phase 3 of the SF Ecosystem architecture.

## Files Overview

### SQL Schemas (Apply first to new instances)

- **`01_sf-cms-schema.sql`** — CMS instance schema
  - Tables: pages, projects, page_versions, page_activity, posts, media, clients
  - RLS: Admin-only (is_admin() check)
  - For: sf-cms, startup-factory-web apps

- **`02_ai-agency-schema.sql`** — AI Agency SF instance schema
  - Tables: brand_brains, tool_runs, usage_log, clients
  - RLS: Client isolation (current_user_client_slug())
  - For: ai-agency-sf-next, sf-links, sf-reports apps

- **`03_sf-crm-schema.sql`** — CRM SF instance schema (merged)
  - Tables: crm_contacts, leads, icp_profiles, proposal_library, win_loss_history, market_intel, lead_activities, prospect_context, lead_cache, discovery_runs, outbound_log, usage_log
  - RLS: Workspace isolation (current_workspace_id())
  - For: sf-crm, sf-sales-engine (merged) apps
  - Special: Includes 1395 Discoolver contacts + SF contacts

- **`04_mira-schema.sql`** — MIRA instance schema
  - Tables: mira_users, clients, brand_profiles, content_pillars, reference_library, post_history, tool_runs, sections, usage_log, mira_subscriptions
  - RLS: Client isolation (current_user_client_id())
  - For: mira, mira-landing apps

- **`05_teacher-mbai-schema.sql`** — Teacher MBAI instance schema (deferred)
  - Tables: users, courses, enrollments, content_modules, concepts, concept_reviews, sessions, quiz_attempts
  - RLS: User + course isolation
  - For: projects/forma app
  - Status: Create when Teacher MBAI is ready to scale

### Data Migration Scripts

Located in parent directory (`scripts/`):

- **`migrate-ai-agency-data.mjs`**
  - Migrates: brand_brains, tool_runs, usage_log, clients
  - Source: nnevhtfxuawexliwlbmh → new ai-agency instance
  - Usage: `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/migrate-ai-agency-data.mjs`

- **`migrate-crm-data.mjs`**
  - Migrates: crm_contacts (with workspace assignment), leads, icp_profiles, etc.
  - Special: Assigns Discoolver contacts to discoolver-workspace, others to sf-workspace
  - Expected result: 1395 Discoolver + ~50 SF contacts
  - Source: nnevhtfxuawexliwlbmh → new sf-crm instance
  - Usage: `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/migrate-crm-data.mjs`

- **`seed-mira-clients.mjs`**
  - Creates: Jacoste and Startup Factory clients with brand profiles and subscriptions
  - Source: Seed data (not migrated, fresh creation)
  - Target: new mira instance
  - Usage: `NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/seed-mira-clients.mjs`

### Execution Guide

- **`PHASE3_EXECUTION_GUIDE.md`**
  - Complete step-by-step instructions for executing Phase 3.1-3.5
  - Includes: Pre-migration checklist, domain-by-domain procedures, verification steps
  - Located in parent `scripts/` directory

---

## Execution Order

Execute in this order (can parallelize non-dependent phases):

### Phase 3.1: CMS + Landings (30 min)

1. Create Supabase project: `sf-cms`
2. Apply schema: `01_sf-cms-schema.sql`
3. Update `.env.local` in sf-cms and startup-factory-web
4. Test locally, deploy to Vercel

### Phase 3.2: AI Agency SF (30 min)

1. Create Supabase project: `ai-agency`
2. Apply schema: `02_ai-agency-schema.sql`
3. Migrate data: `migrate-ai-agency-data.mjs`
4. Update `.env.local` in 3 apps (ai-agency-sf-next, sf-links, sf-reports)
5. Test locally, deploy to Vercel

### Phase 3.3: CRM SF (45 min)

1. Create Supabase project: `sf-crm`
2. Apply schema: `03_sf-crm-schema.sql`
3. Create workspaces (sf-workspace, discoolver-workspace) via SQL
4. Migrate data: `migrate-crm-data.mjs` (includes 1395 Discoolver contacts)
5. Update `.env.local` in sf-crm and sf-sales-engine
6. Test locally, deploy to Vercel

### Phase 3.4: MIRA (30 min)

1. Verify/create Supabase project: `mira-prod`
2. Apply schema: `04_mira-schema.sql` (if new)
3. Seed data: `seed-mira-clients.mjs`
4. Update `.env.local` in mira and mira-landing
5. Test locally, deploy to Vercel

### Phase 3.5: Teacher MBAI (Deferred)

Execute when projects/forma is ready to scale.

---

## How to Apply a Schema

### Via Supabase UI (Recommended for single-shot)

1. Go to https://app.supabase.com
2. Select the project
3. Go to SQL Editor
4. Create new query
5. Copy entire contents of `XX_*.sql` file
6. Paste into editor
7. Click "Run"
8. Wait for "Success"

### Via SQL command line (Advanced)

```bash
psql "postgresql://[user]:[password]@db.[project-ref].supabase.co:5432/postgres" < scripts/migrations/01_sf-cms-schema.sql
```

---

## RLS Helper Functions

Each schema file creates RLS helper functions specific to that domain:

- **CMS**: `is_admin()` — checks user_metadata.is_admin = true
- **AI Agency**: `current_user_client_slug()` — extracts user_metadata.client_slug
- **CRM**: `current_workspace_id()` — extracts user_metadata.workspace_id
- **MIRA**: `current_user_client_id()` — extracts user_metadata.client_id
- **Teacher MBAI**: Uses auth.uid() for user identification

These are declared in each schema and used in RLS policies.

---

## Data Migration Details

### AI Agency Migration

- **Tables**: brand_brains, tool_runs, usage_log, clients
- **Batch size**: 50 records per insert (to avoid timeout)
- **Key behavior**: Copies all data as-is, no transformation
- **Expected duration**: < 5 seconds (few records)
- **Verification**:
  ```sql
  SELECT COUNT(*) FROM brand_brains;  -- Expected: all AI Agency clients
  SELECT COUNT(*) FROM tool_runs;     -- Expected: 100+ runs
  ```

### CRM Migration

- **Tables**: 14 tables including crm_contacts, leads, icp_profiles, etc.
- **Special handling**: crm_contacts get workspace_id assigned:
  - If company contains "Discoolver" → discoolver-workspace
  - Otherwise → sf-workspace
- **Expected breakdown**: ~50 SF + 1395 Discoolver = 1445 total contacts
- **Batch size**: 50 records per insert
- **Expected duration**: ~10 seconds (1400+ contacts)
- **Verification**:
  ```sql
  SELECT workspace_id, COUNT(*) FROM crm_contacts GROUP BY workspace_id;
  -- Expected: sf-workspace=~50, discoolver-workspace=1395
  SELECT COUNT(*) FROM leads;  -- Expected: 107
  ```

### MIRA Seeding

- **Operation**: Creates fresh data (not migrated)
- **Clients**: Jacoste, Startup Factory
- **Subscriptions**: Both set to "premium" active
- **Brand Profiles**: Initialized with tone, value props, visual guidelines
- **Duration**: < 1 second
- **Verification**:
  ```sql
  SELECT COUNT(*) FROM clients;          -- Expected: 2
  SELECT COUNT(*) FROM brand_profiles;   -- Expected: 2
  ```

---

## Prerequisites

### Before running migrations:

1. **Supabase instances created** with URLs and anon keys
2. **Schemas applied** to new instances (via SQL Editor)
3. **npm install completed** (provides Supabase JS client)
4. **Environment variables set**:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
   export NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
   ```

### System requirements:

- Node.js 18+
- @supabase/supabase-js 2.39.0+

---

## Troubleshooting

### Schema application fails in SQL Editor

**Error**: "PGRST..." or "permission denied"

**Solution**:
- Use project's service role key (not anon key) if applying via CLI
- Or use SQL Editor in Supabase UI (auto-authenticated)
- Verify RLS is not blocking schema creation (usually isn't, RLS applied after)

### Migration script times out

**Error**: "Timeout waiting for response"

**Solution**:
- Check network connectivity
- Verify Supabase instance is running
- Try reducing batch size (change `batchSize` in script)
- Retry migration

### "No API key found in request"

**Error**: When running migration script

**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable is set
- Check key is not expired (get fresh copy from Supabase UI)
- Use correct key for target instance (not source)

### Workspace_id constraint violations

**Error**: "duplicate key value violates unique constraint" in CRM migration

**Solution**:
- Verify workspaces exist before migrating:
  ```sql
  INSERT INTO workspaces (slug, name) VALUES
    ('sf-workspace', 'Startup Factory'),
    ('discoolver-workspace', 'Discoolver');
  ```
- Or clear target tables and re-run migration

---

## Verification Checklist

### After each schema application:

- [ ] No SQL errors in editor
- [ ] Tables visible in Supabase Table Editor
- [ ] Indexes created
- [ ] RLS policies listed in Policies tab
- [ ] Helper functions visible in Function Editor

### After each data migration:

- [ ] Record counts match expectations (see Data Migration Details)
- [ ] No duplicate key errors
- [ ] No constraint violations
- [ ] Workspace assignments correct (for CRM)
- [ ] Sample data queryable:
  ```sql
  SELECT * FROM [table] LIMIT 1;
  ```

### Before deploying app:

- [ ] `.env.local` updated with new instance URL and key
- [ ] Tested locally: `npm run dev`
- [ ] No auth errors on first load
- [ ] RLS doesn't block user's own data

---

## Rollback Instructions

If migration fails critically:

1. **Keep new Supabase instances intact** (don't delete)
2. **Revert `.env.local`** to point to old instances
3. **Redeploy apps**: `vercel --prod`
4. **Investigate error** in Supabase SQL Editor
5. **Fix schema/policies** in Phase 3.0 (RLS hardening)
6. Retry migration

Never delete old instances (`nnevhtfxuawexliwlbmh`, `dmzecrlkclocqaywkjtc`) until verified live for 48 hours.

---

## Maintenance After Migration

### Adding new clients to MIRA

```bash
# 1. Add to clients table
INSERT INTO clients (client_id, name, plan, email) VALUES
  ('new-client-id', 'New Client', 'starter', 'email@example.com');

# 2. Create brand profile
INSERT INTO brand_profiles (client_id, brand_name, ...) VALUES (...);

# 3. Add subscription
INSERT INTO mira_subscriptions (client_id, plan, status) VALUES
  ('new-client-id', 'starter', 'active');
```

### Updating RLS policies

Edit policies in Supabase UI (Policy Editor tab).

Keys to remember:
- Never use `USING(true)` without proper isolation condition
- Always test policy with sample user JWT before deploying
- Policies are per-table, check all related tables

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL POLICIES](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- Phase 3 Execution Guide: `scripts/PHASE3_EXECUTION_GUIDE.md`
- Supabase Migration Plan: `SUPABASE_MIGRATION_PLAN.md`
