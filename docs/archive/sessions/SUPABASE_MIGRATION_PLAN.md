# Supabase Separation Plan — Phase 3

## Current State (Shared/Mixed Instances)

| Instance | Projects | Type |
|----------|----------|------|
| `nnevhtfxuawexliwlbmh` | ai-agency-sf-next, sf-crm | Shared — **CRITICAL: 15 tables without proper RLS** ✅ Fixed Phase 0 |
| `dmzecrlkclocqaywkjtc` | sf-cms, sf-links | Shared |
| Unknown | mira (portal), startup-factory-web, sf-reports, sf-sales-engine | Not configured in .env.local |

**Problem**: Multiple projects share same database instance → cross-contamination risk if RLS policies fail.

---

## Target State (Separated by Product Domain)

| Domain | Instance | Apps | Purpose |
|--------|----------|------|---------|
| **1. CMS + Landings** | `sf-cms` (new) | sf-cms, startup-factory-web, mira-landing | Public pages, client landings, CMS data |
| **2. AI Agency SF** | `ai-agency` (new) | ai-agency-sf-next, sf-links, sf-reports | Operations portal, QR links, reports |
| **3. CRM SF** | `sf-crm` (new) | sf-crm, sf-sales-engine | Contacts, pipeline, leads, discovery data |
| **4. MIRA** | Verify or create | mira | Multi-tenant SaaS platform |
| **5. Teacher MBAI** | `teacher-mbai` (new) | projects/forma | Educational platform (future) |

---

## Migration Tasks

### Phase 3.1: CMS + Landings Instance

**Apps affected**: sf-cms, startup-factory-web  
**Source data**: dmzecrlkclocqaywkjtc (if it's the CMS data) or new empty instance

1. [ ] Create new Supabase project: `sf-cms`
2. [ ] Export schema from current instance (if data exists)
3. [ ] Create tables: pages, projects, page_versions, page_activity, posts, media, clients
4. [ ] Enable RLS on all tables
5. [ ] Create RLS policies (admin-only for management)
6. [ ] Migrate seed data if needed
7. [ ] Update `.env.local`: `NEXT_PUBLIC_SUPABASE_URL=https://sf-cms.supabase.co`
8. [ ] Test locally: `npm run dev`
9. [ ] Deploy to Vercel: `vercel --prod`

### Phase 3.2: AI Agency SF Instance

**Apps affected**: ai-agency-sf-next, sf-links, sf-reports  
**Source data**: nnevhtfxuawexliwlbmh (extract brand_brains, tool_runs tables)

1. [ ] Create new Supabase project: `ai-agency`
2. [ ] Create tables: brand_brains, tool_runs, usage_log, clients
3. [ ] Migrate brand_brains + tool_runs from nnevhtfxuawexliwlbmh
4. [ ] Enable RLS: `client_slug = current_user_client_slug()`
5. [ ] Verify helper functions exist
6. [ ] Update `.env.local` in all 3 apps
7. [ ] Test locally
8. [ ] Deploy all 3 apps

### Phase 3.3: CRM SF Instance

**Apps affected**: sf-crm, sf-sales-engine (to be merged)  
**Source data**: nnevhtfxuawexliwlbmh (extract leads, icp_profiles, proposal_library, etc.)

1. [ ] Create new Supabase project: `sf-crm`
2. [ ] Create merged schema:
   - From sf-crm: crm_contacts, workspaces, pipeline_stages
   - From sf-sales-engine: leads, icp_profiles, proposal_library, win_loss_history, market_intel, lead_activities, prospect_context, lead_cache, usage_log, discovery_runs, outbound_log
3. [ ] Migrate data from nnevhtfxuawexliwlbmh
4. [ ] Enable RLS: `workspace_id = current_workspace_id()`
5. [ ] Verify 1395 Discoolver contacts migrated
6. [ ] Update `.env.local` in both apps
7. [ ] Test with Discoolver + SF workspaces
8. [ ] Deploy both apps

### Phase 3.4: MIRA Instance

**Apps affected**: mira (portal)  
**Source data**: Verify if dmzecrlkclocqaywkjtc is MIRA's instance or create new

1. [ ] Determine: Is `dmzecrlkclocqaywkjtc` MIRA's instance or staging?
   - If yes: Update `.env.local` in apps/mira
   - If no: Create new `mira-prod` instance
2. [ ] Create/verify tables: mira_users, clients, sections, content_pillars, brand_brains, tool_runs, etc.
3. [ ] Enable RLS: `client_id = current_user_client_id()`
4. [ ] Migrate seed data
5. [ ] Update `.env.local`
6. [ ] Test on localhost:3001
7. [ ] Deploy to Vercel

### Phase 3.5: Teacher MBAI (Future)

**Apps affected**: projects/forma  
**Timeline**: Not urgent; can be done when proyecto scales

---

## Pre-Migration Checklist

- [ ] All RLS helper functions exist in Phase 0 (✅ done)
- [ ] All tables have proper RLS policies (✅ done in Phase 0)
- [ ] Backup current data from nnevhtfxuawexliwlbmh
- [ ] Export schema from dmzecrlkclocqaywkjtc to understand structure
- [ ] List all tables in nnevhtfxuawexliwlbmh to identify migration scope

---

## Migration Verification (Post-Deploy)

For each instance, verify:

```sql
-- 1. RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Result: ALL tables should have rowsecurity=true

-- 2. No USING(true) policies
SELECT tablename, policyname, qual 
FROM pg_policies WHERE qual LIKE '%true%';
-- Result: Should be EMPTY

-- 3. Client isolation test
-- [Run as Client A user]
SELECT COUNT(*) FROM crm_contacts WHERE workspace_id = 'workspace-b';
-- Result: 0 (cannot see other workspace's data)
```

---

## Rollback Plan

If migration fails:
1. Revert `.env.local` to point to old instances
2. Redeploy apps from git
3. Investigate RLS policies in Supabase SQL editor
4. Fix issues in Phase 0 SQL

**Do NOT delete old Supabase instances** until migration is verified live for 48 hours.

---

## Timeline Estimate

- **Phase 3.1 (CMS)**: 30 min
- **Phase 3.2 (AI Agency)**: 30 min
- **Phase 3.3 (CRM)**: 45 min (merge + data migration)
- **Phase 3.4 (MIRA)**: 30 min
- **Phase 3.5 (Teacher)**: Deferred

**Total**: ~3 hours (can be parallelized for some steps)

---

## Status

- Phase 0 ✅ RLS hardening + helper functions
- Phase 1 ✅ Git repository
- Phase 2 ✅ Turborepo monorepo
- Phase 3 🔄 **IN PROGRESS**
