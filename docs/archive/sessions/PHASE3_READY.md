# Phase 3: Supabase Separation — READY FOR EXECUTION

**Status**: ✅ All infrastructure prepared and documented  
**Commit**: `25d3cc7` (backup + pre-execution checklist)  
**Date**: 2026-05-20

---

## 📦 What's Included

### SQL Schemas (Apply to new Supabase instances)
- ✅ `scripts/migrations/01_sf-cms-schema.sql` — CMS instance (pages, projects, posts, media)
- ✅ `scripts/migrations/02_ai-agency-schema.sql` — AI Agency instance (brand_brains, tool_runs)
- ✅ `scripts/migrations/03_sf-crm-schema.sql` — CRM SF instance (crm_contacts, leads, 1395 Discoolver)
- ✅ `scripts/migrations/04_mira-schema.sql` — MIRA instance (clients, brand_profiles, content_pillars)
- ✅ `scripts/migrations/05_teacher-mbai-schema.sql` — Teacher MBAI instance (deferred)

### Data Migration Scripts
- ✅ `scripts/migrate-ai-agency-data.mjs` — Migrates brand_brains + tool_runs
- ✅ `scripts/migrate-crm-data.mjs` — Migrates CRM data with workspace assignment (1395 Discoolver to discoolver-workspace)
- ✅ `scripts/seed-mira-clients.mjs` — Seeds MIRA with Jacoste + Startup Factory clients
- ✅ `scripts/backup-old-instances.mjs` — Exports data from old instances before deletion

### Documentation
- ✅ `scripts/migrations/README.md` — Comprehensive reference (RLS helpers, troubleshooting, verification)
- ✅ `scripts/PHASE3_EXECUTION_GUIDE.md` — Step-by-step procedures for each phase with expected outcomes
- ✅ `scripts/PHASE3_PRECHECK.md` — Pre-flight checklist with RLS audit and rollback plan

---

## 🚀 Quick Start

### Phase 0: RLS Audit (CRITICAL — Do First)
```bash
# Open Supabase SQL Editor for each old instance:
# 1. nnevhtfxuawexliwlbmh
# 2. dmzecrlkclocqaywkjtc

# Run verification queries from PHASE3_PRECHECK.md
# Look for: RLS enabled on all tables, NO USING(true) policies without client isolation
# If found: STOP and apply RLS hardening before proceeding
```

### Backup Old Instances (Before Phase 3.1)
```bash
# Requires anon keys from old instances (already in migration scripts)
node scripts/backup-old-instances.mjs

# Creates: backups/nnevhtfxuawexliwlbmh_[timestamp].sql
#          backups/dmzecrlkclocqaywkjtc_[timestamp].sql
# KEEP FOR 48 HOURS after Phase 3 completion
```

### Phase 3.1-3.4: Execution
Follow `scripts/PHASE3_PRECHECK.md` section-by-section:

1. **Phase 3.1** (30 min): Create `sf-cms` instance, apply schema, test, deploy
2. **Phase 3.2** (30 min): Create `ai-agency` instance, migrate data, deploy
3. **Phase 3.3** (45 min): Create `sf-crm` instance, migrate 1395 Discoolver + SF contacts, deploy
4. **Phase 3.4** (30 min): Verify/create MIRA instance, deploy
5. **Phase 3.5**: Deferred (execute when projects/forma ready)

---

## 📋 Files Reference

| File | Purpose | Use When |
|------|---------|----------|
| `PHASE3_PRECHECK.md` | Phase-by-phase execution checklist | Starting Phase 3 |
| `PHASE3_EXECUTION_GUIDE.md` | Detailed step-by-step procedures | Following specific phase |
| `migrations/README.md` | RLS helpers, troubleshooting, SQL verification | Debugging or understanding RLS |
| `migrate-*.mjs` | Data migration scripts | After schema applied |
| `backup-old-instances.mjs` | Pre-migration backup | Before Phase 3.1 |

---

## ⚠️ Critical Constraints

1. **RLS Must Be Enforced**: No USING(true) without client isolation filters
2. **Data Integrity**: Must backup old instances BEFORE creating new ones
3. **48-Hour Rule**: Keep old instances intact for 48 hours after Phase 3 completion
4. **Workspace Assignment**: CRM migration uses heuristic: company containing "Discoolver" → discoolver-workspace
5. **No Data Loss**: Each migration script includes batch handling and error recovery

---

## 🔍 RLS Helper Functions by Domain

Each schema creates isolation helpers:

| Domain | Helper Function | Extracts From |
|--------|-----------------|----------------|
| CMS | `is_admin()` | `auth.jwt() → user_metadata.is_admin` |
| AI Agency | `current_user_client_slug()` | `auth.jwt() → user_metadata.client_slug` |
| CRM | `current_workspace_id()` | `auth.jwt() → user_metadata.workspace_id` |
| MIRA | `current_user_client_id()` | `auth.jwt() → user_metadata.client_id` |
| Teacher MBAI | `auth.uid()` | Direct user auth |

---

## ✅ Verification Checklist (Post-Migration)

After each phase completes:
- [ ] RLS policies listed in Supabase UI
- [ ] Record counts match expectations (see PHASE3_EXECUTION_GUIDE.md)
- [ ] No constraint violations
- [ ] Apps tested locally without auth errors
- [ ] Vercel deployment logs show no errors
- [ ] Domains responding with 200 status

---

## 🚨 If Something Breaks

1. **During Phase 3.X**: Revert `.env.local` to old instances, re-deploy, investigate error
2. **RLS violation**: Check policies in SQL Editor, verify helper functions exist
3. **Data migration timeout**: Reduce batch size in script, retry
4. **Domain doesn't resolve**: Check Vercel deployment status, confirm CNAME records

See `scripts/PHASE3_EXECUTION_GUIDE.md` → Troubleshooting section for detailed solutions.

---

## 📞 Next Steps

1. ✅ Read `scripts/PHASE3_PRECHECK.md` → understand Phase 0-4 order
2. 🔐 Execute Phase 0 RLS audit (verify old instances are secure)
3. 💾 Run `node scripts/backup-old-instances.mjs` (backup before creating new instances)
4. 🚀 Begin Phase 3.1 (Create sf-cms Supabase instance)

**Expected Total Duration**: ~3 hours (can be parallelized)

**Domains Affected**:
- cms.startupsfactory.es (CMS)
- agency.startupsfactory.es (AI Agency)
- crm.startupsfactory.es (CRM)
- mira.startupsfactory.es (MIRA)

---

## 🎯 Success Criteria

Phase 3 is complete when:

1. All 5 Supabase instances created and populated with data
2. All 4 apps (CMS, AI Agency, CRM, MIRA) deployed to Vercel with new instances
3. RLS verified on all instances (no USING(true) without isolation)
4. All domains live and responding with correct data isolation
5. Old instances kept intact for 48 hours, then archived
6. Credentials stored in 1Password

---

**Last commit**: `25d3cc7` (2026-05-20)  
**All SQL schemas, migration scripts, and documentation ready for execution**

