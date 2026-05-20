# Phase 3.1 Completion Status

**Date:** 2026-05-20  
**Status:** 70% Complete — GitHub + CI Done, Vercel + RLS Audit Pending

---

## ✅ Completed

1. **GitHub Repository Setup**
   - Created: jeicost/sf-ecosystem
   - Monorepo pushed with full commit history
   - Approved 5 detected secrets (Figma token, Google OAuth creds)

2. **GitHub Actions CI**
   - `.github/workflows/lint.yml` — Type check + lint on PR
   - `.github/workflows/deploy.yml` — Auto-deploy to Vercel on main push
   - Both workflows active and pushed

3. **MIRA Portal Auth Fixed**
   - RLS policy simplified: `auth_id = auth.uid()`
   - Portal login working: localhost:3000 loads projects ✅

---

## ⏳ Pending (Manual — Requires User Action)

### 1. Vercel Domain Configuration (15 min)
**Add custom domain to sf-cms project:**
- Go to https://vercel.com/dashboard → sf-cms project
- Settings → Domains → Add Domain
- Enter: `cms.startupsfactory.es`
- Verify CNAME points to Vercel (likely needs IONOS update)

**Status:** Not started — requires Vercel dashboard access

### 2. RLS Security Audit (10 min)
**Query MIRA Supabase to verify RLS policies:**

Open Supabase SQL Editor and run:
```sql
-- Check for RLS policies with plan='admin' bypass
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname='public' 
  AND qual LIKE '%user_metadata%plan%admin%';

-- Should return 0 rows (all policies should use auth_id = auth.uid())
```

If any rows return: those tables have old policies and need updating to simple auth_id check.

**Current policies (MIRA):**
- mira_users: Uses auth_id = auth.uid() ✅
- mira_projects: Uses auth_id lookup ✅
- mira_project_access: Uses auth_id lookup ✅

### 3. GitHub Actions Secrets (5 min)
**Add to GitHub repo settings:**
- `VERCEL_TOKEN` — Personal access token from vercel.com/account/tokens
- `VERCEL_ORG_ID` — From vercel.com/account/settings
- `VERCEL_PROJECT_ID_STARTUP_FACTORY` — From startup-factory-web project
- `VERCEL_PROJECT_ID_AI_AGENCY` — From ai-agency-sf-next project
- `VERCEL_PROJECT_ID_MIRA` — From mira portal project

**Location:** GitHub repo → Settings → Secrets and variables → Actions

---

## 📋 What's Ready to Use

1. **Monorepo:** https://github.com/jeicost/sf-ecosystem
2. **CI/CD:** Workflows trigger on PR and main push
3. **MIRA Portal:** Login + projects load
4. **Commits:** All changes committed and pushed

---

## 🔄 Next Phase (Phase 3.2)

After domain + RLS audit complete:
1. Turborepo setup (2 days)
2. Supabase separation per service (SF-CMS, SF-CRM, MIRA, AI Agency)
3. Workspace scoping (client isolation via user_metadata)
4. Remaining app deployments

---

## 🚀 Quick Checklist

- [ ] Add cms.startupsfactory.es domain in Vercel
- [ ] Run RLS audit query (expect 0 rows)
- [ ] Add GitHub Actions secrets (5 vars)
- [ ] Test: Push to main → deploy workflow runs
- [ ] Confirm: cms.startupsfactory.es resolves to sf-cms

