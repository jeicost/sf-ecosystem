# CMS ISR Production Deployment — Next Session Start Here

**Session Date:** 2026-05-21 (closed, 1h + compaction)  
**Status:** ✅ Ready for production in 15 minutes  
**Time Zone:** UTC  

---

## What This Is

End-to-end CMS-to-Web sync infrastructure for 3 Next.js projects:
- Startup Factory Web
- NC Global Assets  
- Salsa Burgers Web

Posts published in SF-CMS automatically revalidate on all 3 webs via webhooks + ISR.

---

## What You Need to Do (15 min)

**Open this file first:** `REVALIDATE_FINAL_STEPS.md` (in this folder)

Then execute the 4-step checklist:
1. **Domain aliases** (9 min) — Update Vercel UI
2. **Environment variables** (5 min) — Set REVALIDATE_SECRET
3. **Smoke test** (2 min) — Publish post, verify on all 3 webs  
4. **Verify webhook** (optional, 2 min) — Test endpoint via curl

---

## Files in This Directory

```
REVALIDATE_FINAL_STEPS.md          ← Main checklist (OPEN THIS FIRST)
REVALIDATE_SETUP_STATUS.md         ← Reference (project IDs, env vars, URLs)
CMS_PRODUCTION_SNAPSHOT.md         ← Quick overview
NEXT_SESSION_START_HERE.md         ← This file
```

---

## The Issue (Already Solved, Just Context)

Domain aliases in Vercel need manual update because they're pinned to old deployments. Fix is 9 UI clicks. That's it.

---

## Memory Files (Full Context)

If you want detailed context:
- `[[cms_closure_final_checklist]]` — Technical details + known issues
- `[[session_cms_sync_complete_2026_05_21]]` — Full session history + architecture

---

## Success = 15 Min

When smoke test passes (new post visible on all 3 webs within 3 seconds), you're done. 

System is production-ready.

---

**Start with:** `REVALIDATE_FINAL_STEPS.md`
