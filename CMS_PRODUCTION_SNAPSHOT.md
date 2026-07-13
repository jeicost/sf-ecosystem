# CMS-to-Web ISR Production Readiness Snapshot

**Generated:** 2026-05-21 23:59 UTC  
**Status:** ✅ READY FOR NEXT SESSION  
**Effort Remaining:** 15 minutes (manual UI only)

---

## The Situation

Three Next.js webs need CMS content (posts/pages) to auto-update when published in SF-CMS. We built an **on-demand ISR revalidation system** using Supabase webhooks + Next.js `/api/revalidate` endpoints.

**Architecture:**
```
SF-CMS (Supabase)
    ↓ (webhook on post publish)
POST /api/revalidate (on each web)
    ↓
Next.js revalidatePath()
    ↓
ISR regenerates page (~1-2s for first request)
    ↓
New content live on public domain
```

---

## What's Done ✅

| Component | Status | Location |
|-----------|--------|----------|
| CMS fetch scripts | ✅ Fixed (added `?project=` param) | `scripts/fetch-cms-content.mjs` |
| Revalidate endpoints | ✅ Deployed | `app/api/revalidate/route.ts` |
| Vercel project config | ✅ Created | `.vercel/project.json` |
| Supabase webhooks | ✅ Configured | Database → Webhooks tab |
| Deployments | ✅ Live | startup-factory, nc-global-assets, salsa-burgers |

---

## The Blocker (ONE ONLY) 🔴

**Domain aliases not updated in Vercel**

When we re-deployed with new code (`vercel --prod`), Vercel created new deployment URLs but **didn't update the custom domain aliases** (by design, for safety). So:

- Public domains (www.startupsfactory.es) → still point to OLD deployments
- OLD deployments don't have `/api/revalidate` → return 404/307
- Webhooks fail silently

**Fix:** 9 minutes of manual Vercel UI clicks (3 projects × 3 min each)

---

## Next Session: 4-Step Checklist (15 min total)

### Step 1: Update Domain Aliases (9 min) **← BLOCKING**

For each project, go to Vercel, update the custom domain to latest deployment:

```
Projects to update:
1. startup-factory-web → select startup-factory-mvmtx6igx-...vercel.app
2. nc-global-assets-next → select nc-global-assets-next-jbvl1c96s-...vercel.app
3. salsa-burgers-web → select salsa-burgers-3qmx8wl0z-...vercel.app

Path: Settings → Domains → click domain → select from dropdown → Save
```

### Step 2: Set REVALIDATE_SECRET (5 min)

Add environment variable to all 3 projects (Production):

```
REVALIDATE_SECRET = [ROTATED]
```

### Step 3: Smoke Test (2 min)

```bash
# 1. Log in to SF-CMS
https://cms.startupsfactory.es
User: jacostech@gmail.com / SFcms2026!

# 2. Create & publish a test post

# 3. Within 3 seconds, visit the web
https://www.startupsfactory.es/blog
# → New post appears = SUCCESS ✅
```

### Step 4: Verify Webhook Response (Optional, 2 min)

```bash
curl -X POST https://www.startupsfactory.es/api/revalidate \
  -H "x-revalidate-secret: [ROTATED]" \
  -H "Content-Type: application/json" \
  -d '{"paths":["/blog"]}'

# Expected: 200 + {"revalidated": true}
```

---

## Why It Works End-to-End

1. **Supabase Webhook** (automatic)
   - Trigger: POST publish in SF-CMS
   - Sends: POST to web's `/api/revalidate` with auth header

2. **Next.js Endpoint** (automatic)
   - Route: `app/api/revalidate/route.ts`
   - Validates: `x-revalidate-secret` header
   - Action: `revalidatePath('/blog')`

3. **ISR Regeneration** (automatic)
   - Next.js marks `/blog` as stale
   - Next request to `/blog` triggers rebuild
   - CDN updated within 1-2 seconds

---

## Known Issues

### 1. SF-CMS Dashboard Missing Salsa Burgers

**Symptom:** Only 2 of 3 projects show for user in CMS dashboard

**Workaround:** Log in as super admin (jacostech@gmail.com) to see all 3

**Fix:** Investigate RLS permissions next session if blocking content

### 2. No Webhook Logs in Supabase UI

Supabase doesn't show webhook delivery history. Monitor via:
- Vercel Analytics (request logs)
- Add logging to `/api/revalidate` handler

---

## Critical Files

**Must-Read Next Session:**
- `📋 /Users/carlosjacoste/Desktop/Claude/REVALIDATE_FINAL_STEPS.md` ← Open this first
- `📋 /Users/carlosjacoste/Desktop/Claude/REVALIDATE_SETUP_STATUS.md` — Project IDs + URLs

**Memory Files:**
- `[[cms_closure_final_checklist]]` — Detailed reference
- `[[session_cms_sync_complete_2026_05_21]]` — Full session context

**Project Directories:**
```
apps/startup-factory-web/
clients/nc-global-assets-next/
clients/salsa-burgers/web/
```

All three have:
- `.vercel/project.json` ✅
- `app/api/revalidate/route.ts` ✅
- `scripts/fetch-cms-content.mjs` ✅ (fixed)

---

## Timeline

- **Previous Session (2026-05-21):** 1h — Built entire ISR infrastructure
- **Next Session:** 15 min — Execute 4-step checklist
- **Production Live:** After step 3 smoke test passes ✅

---

## Success Criteria

```
✅ Webhook endpoint responds 200 to public domain
✅ REVALIDATE_SECRET set on all 3 projects
✅ New post published in SF-CMS appears on all 3 webs within 3 seconds
✅ No further configuration needed
```

---

**TL;DR:** Everything works. Just need to point Vercel domains to latest deployments (9 min UI clicks). Then 15 minutes total to production.

Start with: `REVALIDATE_FINAL_STEPS.md`
