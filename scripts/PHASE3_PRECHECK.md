# Phase 3 Pre-Execution Checklist

**Status**: Ready for execution  
**Last Updated**: 2026-05-20  
**Critical**: Execute Phase 0 (RLS Audit) before Phase 3.1

---

## 📋 Pre-Flight Checklist

### Environment Setup
- [ ] Node.js 18+ installed: `node --version`
- [ ] npm dependencies available: `npm list @supabase/supabase-js`
- [ ] Supabase account access: https://app.supabase.com
- [ ] Vercel account access: https://vercel.com
- [ ] 1Password access for credential storage
- [ ] GitHub connection to Vercel configured

### Phase 0: RLS Security Audit (CRITICAL — DO FIRST)

Execute these RLS audit queries in EACH of the 2 old instances:

**Instance 1: nnevhtfxuawexliwlbmh**
```sql
-- 1. Check RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: All should have rowsecurity = true

-- 2. Check for insecure USING(true) policies
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND qual LIKE '%true%';
-- Expected: EMPTY (no results) — if you see anything, there's a security gap
```

**Instance 2: dmzecrlkclocqaywkjtc**
```sql
-- Same queries as above
-- Verify all tables have RLS enabled
-- Verify no USING(true) policies without client isolation
```

**If you find RLS gaps:**
1. Stop immediately — do NOT proceed to Phase 3
2. Review `scripts/migrations/RLS_HARDENING_PHASE_1.sql` (not yet created — will be provided)
3. Apply hardening patches to old instances first
4. Re-verify with above queries

---

## 🔄 Data Backup (Before Phase 3.1)

**CRITICAL**: Backup old instances before creating new ones.

```bash
# Export data from old instances (requires anon keys)
node scripts/backup-old-instances.mjs

# Verify backups were created
ls -lh backups/
```

**Keep backups for 48 hours minimum after Phase 3 completion.**

---

## 📊 Phase-by-Phase Execution Order

### Phase 3.1: CMS + Landings (30 min)

**Supabase Setup:**
1. Create new project: `sf-cms` at https://app.supabase.com
2. Copy project URL and anon key
3. In SQL Editor: paste entire `scripts/migrations/01_sf-cms-schema.sql` → Run

**Verification:**
```sql
-- In sf-cms SQL Editor
SELECT COUNT(*) FROM pages;  -- Should be 0 (empty)
SELECT policyname FROM pg_policies WHERE tablename = 'pages';  -- Should show RLS policies
```

**App Updates:**
```bash
# Update environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://[sf-cms-project-id].supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=[sf-cms-anon-key]

# Test locally
cd apps/sf-cms && npm run dev
# Visit http://localhost:3000 — should load without errors

# Deploy
cd apps/sf-cms && vercel --prod
cd ../startup-factory-web && vercel --prod
```

**Verification:**
```bash
curl -I https://cms.startupsfactory.es    # Should be 200
curl -I https://startupsfactory.es        # Should be 200
```

---

### Phase 3.2: AI Agency SF (30 min)

**Supabase Setup:**
1. Create new project: `ai-agency` at https://app.supabase.com
2. In SQL Editor: paste `scripts/migrations/02_ai-agency-schema.sql` → Run
3. Set environment variables in root `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[ai-agency-project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[ai-agency-anon-key]
   ```

**Data Migration:**
```bash
node scripts/migrate-ai-agency-data.mjs
```

**Verification:**
```sql
-- In ai-agency SQL Editor
SELECT COUNT(*) FROM brand_brains;  -- Should be > 0 (migrated data)
SELECT COUNT(*) FROM tool_runs;     -- Should be > 0
```

**App Updates:**
```bash
cd apps/ai-agency-sf-next && npm run dev
# Verify tools load and data visible

vercel --prod
# Also deploy sf-links and sf-reports with same credentials
```

---

### Phase 3.3: CRM SF (45 min) — CRITICAL

**Supabase Setup:**
1. Create new project: `sf-crm`
2. In SQL Editor: paste `scripts/migrations/03_sf-crm-schema.sql` → Run
3. Create workspaces:
   ```sql
   INSERT INTO workspaces (slug, name) VALUES
     ('sf-workspace', 'Startup Factory'),
     ('discoolver-workspace', 'Discoolver');
   ```

**Data Migration:**
```bash
export NEXT_PUBLIC_SUPABASE_URL=https://[sf-crm-project-id].supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=[sf-crm-anon-key]

node scripts/migrate-crm-data.mjs
```

**Verification:**
```sql
-- Critical: verify workspace assignment
SELECT workspace_id, COUNT(*) FROM crm_contacts GROUP BY workspace_id;
-- Expected: sf-workspace (~50), discoolver-workspace (1395)

SELECT COUNT(*) FROM leads;  -- Expected: 107
```

**App Updates & Deploy:**
```bash
cd apps/sf-crm && npm run dev
# Verify SF and Discoolver contacts visible with correct workspace isolation

vercel --prod
# Also deploy sf-sales-engine (merged)
```

---

### Phase 3.4: MIRA (30 min)

**Decision Point**: Is `dmzecrlkclocqaywkjtc` the correct MIRA instance?

**If YES (most likely):**
1. Verify in Supabase UI: tables exist (`brand_profiles`, `mira_users`, `sections`, etc.)
2. Note project URL and key
3. Update `.env.local` in `apps/mira`

**If NO (empty or staging):**
1. Create new project: `mira-prod`
2. In SQL Editor: paste `scripts/migrations/04_mira-schema.sql` → Run
3. Seed clients:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=https://[mira-project-id].supabase.co
   export NEXT_PUBLIC_SUPABASE_ANON_KEY=[mira-anon-key]
   
   node scripts/seed-mira-clients.mjs
   ```

**Verification:**
```sql
SELECT COUNT(*) FROM clients;          -- Expected: 2
SELECT COUNT(*) FROM brand_profiles;   -- Expected: 2
```

**App Updates & Deploy:**
```bash
cd apps/mira && npm run dev  # http://localhost:3001
vercel --prod
```

---

### Phase 3.5: Teacher MBAI (Deferred)

**Skip for now.** Execute when `projects/forma` is ready to scale.

When needed:
```bash
# Create new project: teacher-mbai
# Apply schema: scripts/migrations/05_teacher-mbai-schema.sql
# Update .env.local in projects/forma
# Deploy
```

---

## 🔐 Post-Migration Verification

After ALL phases complete, verify RLS on new instances:

```bash
# For each new instance (sf-cms, ai-agency, sf-crm, mira):
# Run in their SQL Editors:

-- 1. RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. No insecure USING(true) policies
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND qual LIKE '%true%';
-- Should be EMPTY

-- 3. Test client isolation (if applicable)
-- Log in as different clients and verify they cannot see each other's data
```

---

## 🚨 Rollback Plan

If any phase fails:

1. **Keep new instances intact** (don't delete)
2. **Revert `.env.local`** to point to old instances
3. **Re-deploy affected apps**: `vercel --prod`
4. **Investigate error** in Supabase SQL Editor
5. **DO NOT DELETE old instances** for 48 hours

---

## 💾 Credential Storage (1Password)

Create entry: "SF Ecosystem Supabase Keys — Phase 3"

For each new instance, store:
- Project URL
- Anon key
- Database password (from creation dialog)
- Created date
- Status (e.g., "Live since 2026-05-20")

---

## 📞 Support References

**Issues during migration?**

1. Check `scripts/migrations/README.md` → Troubleshooting section
2. Check `scripts/PHASE3_EXECUTION_GUIDE.md` → detailed procedures
3. Verify backup files exist in `backups/` before proceeding
4. Never delete old instances until 48 hours post-migration

**Critical SQL Queries:**

All verification queries are documented in each schema file and execution guide. Copy-paste directly from documentation.

---

## ✅ Final Checklist Before Going Live

- [ ] All 5 phases executed (3.1-3.4, 3.5 deferred)
- [ ] RLS verified on all new instances (no USING(true))
- [ ] All apps tested locally and deployed to Vercel
- [ ] All domains resolving correctly (curl -I checks)
- [ ] Backups stored securely in 1Password
- [ ] 48-hour clock started for old instances
- [ ] No errors in Vercel deployment logs
- [ ] Client isolation verified (test with different accounts if applicable)

---

**Last step:** After 48 hours of stable production operation, old instances can be safely archived/deleted.

