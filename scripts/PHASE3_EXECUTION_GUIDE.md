# Phase 3 Execution Guide — Supabase Separation

This document provides step-by-step instructions for executing Phase 3 (Supabase Separation) of the SF Ecosystem architecture.

## Overview

**Objective**: Separate 2 shared Supabase instances into 5 independent instances, one per product domain.

**Timeline**: ~3 hours (can be parallelized)

**Current State**:
- `nnevhtfxuawexliwlbmh` (shared): MIRA, ai-agency-sf-next, sf-crm, sf-sales-engine
- `dmzecrlkclocqaywkjtc` (shared): sf-cms, sf-links, sf-reports

**Target State**:
| Domain | Instance | Apps | Status |
|--------|----------|------|--------|
| CMS + Landings | `sf-cms` | sf-cms, startup-factory-web | 🔄 Phase 3.1 |
| AI Agency SF | `ai-agency` | ai-agency-sf-next, sf-links, sf-reports | 🔄 Phase 3.2 |
| CRM SF | `sf-crm` | sf-crm, sf-sales-engine (merged) | 🔄 Phase 3.3 |
| MIRA | Verify/create | mira, mira-landing | 🔄 Phase 3.4 |
| Teacher MBAI | `teacher-mbai` | projects/forma | 🔄 Phase 3.5 |

---

## Execution Order

Execute in this order: **CMS → AI Agency → CRM → MIRA → Teacher MBAI**

This order minimizes dependencies and allows early verification.

---

## Phase 3.1: CMS + Landings Instance

**Duration**: 30 min  
**Apps affected**: sf-cms, startup-factory-web

### Step 1: Create new Supabase project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: `sf-cms`
   - **Database Password**: (generate strong password, store in 1Password under "SF Ecosystem Supabase Keys")
   - **Region**: Same as current (check in project settings)
4. Wait for project creation (~2 min)
5. Copy the project URL: `https://[PROJECT_ID].supabase.co`
6. Copy the anon key from Settings → API → Project API keys

### Step 2: Apply schema

1. Go to SQL Editor in new `sf-cms` project
2. Open `scripts/migrations/01_sf-cms-schema.sql`
3. Copy and paste entire content into SQL Editor
4. Click "Run" (wait for success)

### Step 3: Create seed data

If existing data exists in `dmzecrlkclocqaywkjtc`:

```bash
# Export data from old instance (if any)
npx supabase db pull --db-url "postgresql://..." > export-cms-data.sql

# Import into new instance (if applicable)
```

For now, leave empty. Data will be migrated during next step.

### Step 4: Update `.env.local`

Update **both** apps:

**apps/sf-cms/.env.local**:
```
NEXT_PUBLIC_SUPABASE_URL=https://[sf-cms-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sf-cms-anon-key]
```

**apps/startup-factory-web/.env.local**:
```
NEXT_PUBLIC_SUPABASE_URL=https://[sf-cms-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sf-cms-anon-key]
```

### Step 5: Test locally

```bash
cd apps/sf-cms
npm install  # refresh dependencies
npm run dev  # should start on http://localhost:3000
```

Verify login works (admin user).

### Step 6: Deploy to Vercel

```bash
cd apps/sf-cms
vercel --prod

# Do the same for startup-factory-web
cd ../startup-factory-web
vercel --prod
```

Monitor deployment. Should take ~2-3 min.

### Step 7: Verify

- Visit https://cms.startupsfactory.es → should show CMS admin
- Visit https://startupsfactory.es → should show landing (using same Supabase)

---

## Phase 3.2: AI Agency SF Instance

**Duration**: 30 min  
**Apps affected**: ai-agency-sf-next, sf-links, sf-reports  
**Data source**: Migrate `brand_brains`, `tool_runs` from `nnevhtfxuawexliwlbmh`

### Step 1: Create new Supabase project

1. Go to https://app.supabase.com
2. Create project named `ai-agency`
3. Copy URL and anon key

### Step 2: Apply schema

1. Go to SQL Editor in new `ai-agency` project
2. Open `scripts/migrations/02_ai-agency-schema.sql`
3. Copy and paste entire content
4. Click "Run"

### Step 3: Migrate data

Migrate `brand_brains` and `tool_runs` from `nnevhtfxuawexliwlbmh`:

```bash
# Using supabase-js (once npm install completes)
node scripts/migrate-ai-agency-data.mjs
```

### Step 4: Update `.env.local`

Update all 3 apps:

**apps/ai-agency-sf-next/.env.local**:
```
NEXT_PUBLIC_SUPABASE_URL=https://[ai-agency-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ai-agency-anon-key]
```

Same for **apps/sf-links/.env.local** and **apps/sf-reports/.env.local**

### Step 5: Test locally

```bash
cd apps/ai-agency-sf-next
npm install
npm run dev  # http://localhost:3000
```

Verify tools load and brand_brains data visible.

### Step 6: Deploy

```bash
vercel --prod --yes  # for each of the 3 apps
```

### Step 7: Verify

- Visit https://agency.startupsfactory.es (or current domain)
- Check tools → should see SF client data
- Verify sf-links and sf-reports work

---

## Phase 3.3: CRM SF Instance (Merged)

**Duration**: 45 min  
**Apps affected**: sf-crm, sf-sales-engine (merged into single app)  
**Data source**: Migrate from `nnevhtfxuawexliwlbmh` (1395 Discoolver contacts + SF contacts)

### Step 1: Create new Supabase project

1. Go to https://app.supabase.com
2. Create project named `sf-crm`
3. Copy URL and anon key

### Step 2: Apply schema

1. Go to SQL Editor in new `sf-crm` project
2. Open `scripts/migrations/03_sf-crm-schema.sql`
3. Copy and paste entire content
4. Click "Run"

### Step 3: Create workspaces

```sql
INSERT INTO workspaces (slug, name, owner_id) VALUES
  ('sf-workspace', 'Startup Factory', 'sf-team'),
  ('discoolver-workspace', 'Discoolver', 'discoolver-team');
```

### Step 4: Migrate data

Migrate all tables from `nnevhtfxuawexliwlbmh` to new instance:

```bash
node scripts/migrate-crm-data.mjs
```

This will:
- Copy `crm_contacts` + 1395 Discoolver contacts
- Copy `leads`, `icp_profiles`, `proposal_library`
- Copy `win_loss_history`, `market_intel`, `lead_activities`, etc.
- Assign workspace_id correctly for each

### Step 5: Verify data migration

```sql
-- Check contact counts
SELECT workspace_id, COUNT(*) FROM crm_contacts GROUP BY workspace_id;
-- Expected: sf-workspace (~50), discoolver-workspace (1395)

-- Check leads
SELECT COUNT(*) FROM leads;
-- Expected: 107 leads
```

### Step 6: Update `.env.local`

**apps/sf-crm/.env.local**:
```
NEXT_PUBLIC_SUPABASE_URL=https://[sf-crm-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sf-crm-anon-key]
```

Same for **apps/sf-sales-engine/.env.local**

### Step 7: Test locally

```bash
cd apps/sf-crm
npm install
npm run dev

# Verify:
# - Can see SF contacts
# - Can see Discoolver contacts (with ?workspace=discoolver-workspace)
# - Pipeline visual loads
# - Leads/discovery tools work
```

### Step 8: Deploy

```bash
vercel --prod --yes  # for both apps
```

### Step 9: Verify in production

- Visit https://crm.startupsfactory.es
- Check SF workspace → 50 contacts visible
- Check Discoolver workspace → 1395 contacts visible
- Test discovery tools

---

## Phase 3.4: MIRA Instance

**Duration**: 30 min  
**Apps affected**: mira, mira-landing  
**Decision point**: Is `dmzecrlkclocqaywkjtc` the correct MIRA instance or staging?

### Step A: If `dmzecrlkclocqaywkjtc` is MIRA (most likely)

1. Rename instance in Supabase UI to `mira-prod` (for clarity)
2. Note the project URL: `https://dmzecrlkclocqaywkjtc.supabase.co`
3. Copy anon key from Settings → API
4. Verify tables exist: `brand_profiles`, `content_pillars`, `tool_runs`, `mira_users`, `clients`

### Step B: If `dmzecrlkclocqaywkjtc` is NOT MIRA or is staging

1. Create new project named `mira-prod`
2. Apply schema from `scripts/migrations/04_mira-schema.sql`
3. Seed with MIRA client data (Bootstrap Jacoste client, etc.)

### Step 1: Update `.env.local` in MIRA

**apps/mira/.env.local**:
```
NEXT_PUBLIC_SUPABASE_URL=https://[mira-instance-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[mira-anon-key]
```

**apps/mira-landing/.env.local** (if separate):
```
NEXT_PUBLIC_SUPABASE_URL=https://[mira-instance-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[mira-anon-key]
```

### Step 2: Test locally

```bash
cd apps/mira
npm install
npm run dev  # http://localhost:3001
```

Login with MIRA user and verify:
- Brand Brain loads
- Sections visible
- Tool runs work
- Adaptation Engine responds

### Step 3: Deploy

```bash
vercel --prod --yes
```

### Step 4: Verify production

- Visit https://mira.startupsfactory.es
- Login with MIRA credentials
- Verify all client features work

---

## Phase 3.5: Teacher MBAI (Deferred)

**Status**: Not urgent. Can be done when `projects/forma` is ready for scaling.

When needed:
1. Create new Supabase project `teacher-mbai`
2. Apply schema from `scripts/migrations/05_teacher-mbai-schema.sql`
3. Update `.env.local` in `projects/forma`
4. Deploy

---

## Post-Migration Verification

### For each instance, verify RLS is enforced

```sql
-- In Supabase SQL Editor for each instance

-- 1. Check RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: All tables have rowsecurity = true

-- 2. Check no USING(true) policies exist
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND qual LIKE '%true%';
-- Expected: No results (empty)

-- 3. Test client isolation
-- [Run as Client A user via auth token]
SELECT COUNT(*) FROM leads WHERE workspace_id = 'workspace-b';
-- Expected: 0 (cannot see other workspace data)
```

### Monitor domains

After all deployments, verify domains are live:

```bash
curl -I https://cms.startupsfactory.es
curl -I https://startupsfactory.es
curl -I https://agency.startupsfactory.es
curl -I https://crm.startupsfactory.es
curl -I https://mira.startupsfactory.es
```

All should return `HTTP/2 200` or `3xx redirects`.

---

## Rollback Plan

If critical issue during any phase:

1. Revert `.env.local` to point to old instances
2. Re-deploy affected apps: `vercel --prod`
3. Investigate RLS policies in Supabase SQL Editor
4. Do NOT delete new instances until verified live for 48 hours

**Warning**: Keep old instances (`nnevhtfxuawexliwlbmh`, `dmzecrlkclocqaywkjtc`) intact for 48 hours before deletion.

---

## Credentials Storage

Store new Supabase keys in 1Password under "SF Ecosystem Supabase Keys":

- **sf-cms**: URL + anon key
- **ai-agency**: URL + anon key
- **sf-crm**: URL + anon key
- **mira**: URL + anon key (if new)
- **teacher-mbai**: URL + anon key (future)

Each entry should include:
- Project URL
- Anon key
- Admin/service role key (if needed)
- Database password

---

## Migration Scripts (To Be Created)

Following scripts are referenced but not yet created:

- `scripts/migrate-ai-agency-data.mjs` — Migrates brand_brains, tool_runs
- `scripts/migrate-crm-data.mjs` — Migrates crm_contacts, leads, etc. (1395 Discoolver + SF)
- `scripts/seed-mira-clients.mjs` — Seeds MIRA with initial clients (Jacoste, etc.)

Create these once npm install completes and Supabase JS client is available.

---

## Checklist

### Pre-Migration
- [ ] npm install completed (Supabase JS client available)
- [ ] All migration SQL files ready (01-05)
- [ ] Backup of current data from nnevhtfxuawexliwlbmh
- [ ] Backup of current data from dmzecrlkclocqaywkjtc

### Phase 3.1 (CMS)
- [ ] `sf-cms` project created
- [ ] Schema applied
- [ ] `.env.local` updated in sf-cms and startup-factory-web
- [ ] Tested locally
- [ ] Deployed to Vercel
- [ ] Verified in production

### Phase 3.2 (AI Agency)
- [ ] `ai-agency` project created
- [ ] Schema applied
- [ ] Data migrated (brand_brains, tool_runs)
- [ ] `.env.local` updated in 3 apps
- [ ] Tested locally
- [ ] Deployed to Vercel
- [ ] Verified in production

### Phase 3.3 (CRM)
- [ ] `sf-crm` project created
- [ ] Schema applied (merged sf-crm + sf-sales-engine)
- [ ] Workspaces created (SF + Discoolver)
- [ ] Data migrated (1395 Discoolver contacts + SF contacts)
- [ ] `.env.local` updated in 2 apps
- [ ] Tested locally
- [ ] Deployed to Vercel
- [ ] Verified in production

### Phase 3.4 (MIRA)
- [ ] MIRA instance verified or created
- [ ] Schema applied (if new)
- [ ] `.env.local` updated in mira + mira-landing
- [ ] Tested locally
- [ ] Deployed to Vercel
- [ ] Verified in production

### Phase 3.5 (Teacher MBAI)
- [ ] Deferred (mark done when needed)

### Post-Migration
- [ ] RLS verified on all 5 instances
- [ ] Client isolation tested
- [ ] All domains live and responding
- [ ] Old instances kept for 48 hours
- [ ] Credentials stored in 1Password
- [ ] Health check scripts updated
