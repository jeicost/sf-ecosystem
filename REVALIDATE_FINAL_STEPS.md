# CMS-to-Web ISR Revalidation — Final Deployment Steps

**Status:** 2026-05-21 23:59 UTC  
**Blocker:** Manual Vercel domain alias update ONLY  
**Estimated Time to Production:** 15 minutes (manual steps only)

---

## ✅ ALREADY COMPLETE (Previous Session)

- [x] **Phase A** — CMS fetch scripts fixed (added `?project=` param)
- [x] **Phase B** — All 3 `/api/revalidate` endpoints deployed
- [x] **Phase C.1 (Partial)** — Vercel projects re-deployed with new code
- [x] **Phase C (Webhooks)** — Supabase Database Webhooks created:
  - startup-factory-web → POST /api/revalidate
  - nc-global-assets-next → POST /api/revalidate
  - salsa-burgers/web → POST /api/revalidate

---

## 🔴 NEXT SESSION: Manual Steps Required

### BLOCKING ISSUE: Domain Alias Configuration (15 minutes)

**Symptom:** Webhooks POST to public domains return 404/307, not 200

**Reason:** Vercel domain aliases pinned to old deployments; manual update required per project

**Latest Deployment URLs (correct targets):**
- Startup Factory: `startup-factory-mvmtx6igx-jeicosts-projects.vercel.app`
- NC Global Assets: `nc-global-assets-next-jbvl1c96s-jeicosts-projects.vercel.app`
- Salsa Burgers: `salsa-burgers-3qmx8wl0z-jeicosts-projects.vercel.app`

**Fix (per project — 3 projects × 3 min each = 9 min total):**

1. Go to Vercel project:
   - https://vercel.com/jeicosts-projects/startup-factory-web
   - https://vercel.com/jeicosts-projects/nc-global-assets-next
   - https://vercel.com/jeicosts-projects/salsa-burgers-web

2. Settings → Domains

3. Click custom domain (www.startupsfactory.es / www.ncglobalassets.com / salsaburgers.com)

4. In the modal, select latest deployment from dropdown

5. Save

---

### ENVIRONMENT VARIABLES: Set on All 3 Projects (5 minutes)

After domain alias fix, set `REVALIDATE_SECRET` on each Vercel project.

**Value:** `[ROTATED]`  
*Generate new one with: `openssl rand -hex 32`*

**Via Vercel UI:**
1. Project Settings → Environment Variables
2. Add new: `REVALIDATE_SECRET` = `[ROTATED]`
3. Select "Production" + "Preview" (or all)
4. Save

**Via Vercel CLI (if preferred):**
```bash
# For each project, run from its directory:

cd /Users/carlosjacoste/Desktop/Claude/apps/startup-factory-web
VERCEL_PROJECT_ID=prj_XqOuowAPVwCIquJSGvtW1j7D1iiE \
VERCEL_ORG_ID=team_7QGpRqqi1FjrJugGLL0sDehf \
vercel env add REVALIDATE_SECRET production --value="[ROTATED]"

cd /Users/carlosjacoste/Desktop/Claude/clients/nc-global-assets-next
VERCEL_PROJECT_ID=prj_GqKIJAxeq8ZgJ9VB6GYIr3O7qwlD \
VERCEL_ORG_ID=team_7QGpRqqi1FjrJugGLL0sDehf \
vercel env add REVALIDATE_SECRET production --value="[ROTATED]"

cd /Users/carlosjacoste/Desktop/Claude/clients/salsa-burgers/web
VERCEL_PROJECT_ID=prj_ermiutbVMzAyE8lRL3mrot8g5JRC \
VERCEL_ORG_ID=team_7QGpRqqi1FjrJugGLL0sDehf \
vercel env add REVALIDATE_SECRET production --value="[ROTATED]"
```

---

## 🧪 SMOKE TEST (After Steps Above — 2 minutes)

1. Log in to SF-CMS (cms.startupsfactory.es)
   - User: `carlos@startupsfactory.es` or `jacostech@gmail.com` (super admin)
   - Password: `[ROTATED]`

2. Create test post:
   - Title: "Test ISR Post 2026-05-21"
   - Slug: "test-isr-post"
   - Content: "Testing webhook revalidation"
   - Project: startupsfactory (or ncglobalassets, salsaburgers)

3. Publish

4. Within 3 seconds, visit public domain:
   - https://www.startupsfactory.es/blog
   - https://www.ncglobalassets.com/blog
   - https://salsaburgers.com/blog
   
   *Should see new post in the list*

5. Verify webhook payload (optional):
   ```bash
   curl -X POST https://www.startupsfactory.es/api/revalidate \
     -H "x-revalidate-secret: [ROTATED]" \
     -H "Content-Type: application/json" \
     -d '{"paths":["/blog"]}'
   
   # Should return 200 + {"revalidated": true}
   ```

---

## 📋 Complete Checklist (Next Session Entry Point)

- [ ] **STEP 1** (9 min): Update domain aliases on all 3 Vercel projects to latest deployment
- [ ] **STEP 2** (5 min): Set REVALIDATE_SECRET env var on all 3 projects
- [ ] **STEP 3** (2 min): Smoke test — publish post, verify appears on all 3 public domains within 3s
- [ ] **STEP 4** (Optional): Verify webhook response via curl

---

## 🔗 Related Files & References

- Memory: `[[session_cms_sync_complete_2026_05_21]]` — full context
- Memory: `[[cms_sync_phase_c_domain_alias_issue]]` — detailed domain fix
- Status Doc: `/Users/carlosjacoste/Desktop/Claude/REVALIDATE_SETUP_STATUS.md`

---

## ⚠️ Known Issues (Pre-Production)

### 1. SF-CMS Dashboard Visibility Issue
**Problem:** Only 2 of 3 projects appear in dashboard for current user (Salsa Burgers missing)  
**Root Cause:** Likely RLS policy or query filter based on user permissions  
**Status:** Investigate in next session if blocking content creation  
**Workaround:** Use super admin (`jacostech@gmail.com`) to see all 3

### 2. Webhook Delivery Logging
**Current State:** No built-in Supabase webhook delivery logs in UI  
**Recommendation:** Monitor via Vercel Analytics or enable request logging in `/api/revalidate` handlers

### 3. Content Sync Timing
**Expected Latency:**
- CMS publish → webhook trigger: <100ms
- Webhook → Vercel revalidatePath: <500ms
- Page regeneration on next request: 1-2s (first request slow, cached after)
- CDN purge: <1s

---

## 🎯 Success Criteria

Production-ready when:
- [x] All 3 /api/revalidate endpoints respond with 200
- [x] Webhooks configured in Supabase
- [ ] Domain aliases updated in Vercel UI ← **NEXT SESSION**
- [ ] REVALIDATE_SECRET set on all 3 projects ← **NEXT SESSION**
- [ ] Smoke test: new post visible on all 3 domains within 3 seconds ← **NEXT SESSION**

---

**Created:** 2026-05-21 (end of Phase C automation session)  
**Next Action:** Execute checklist above in fresh session  
**Estimated Next Session Duration:** 20 minutes (all manual UI steps)
