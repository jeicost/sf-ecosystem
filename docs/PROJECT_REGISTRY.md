# Project Registry — Vercel + Supabase Source of Truth

Single source of truth for which local folder deploys to which Vercel project, which domain it serves, and which Supabase project it uses (if any).

**Before ANY `vercel --prod` (or bare `vercel`) command, run:**
```bash
node scripts/verify-project-links.mjs
```
If it does not print PASS for the folder you're about to deploy, STOP. Do not deploy.

---

## Golden Rule

Never run `vercel` or `vercel --prod` from the monorepo ROOT. Always `cd` into the specific app/client folder first. The monorepo root **intentionally has no `.vercel/project.json`** — this forces any bare root-level `vercel` command to fail loudly instead of silently deploying to a random project.

---

## Registry Table

| Local Folder | Vercel Project Name | Project ID | Org ID | Production Domain | Supabase Project | Notes |
|---|---|---|---|---|---|---|
| `apps/mira/portal` | mira-portal | `prj_75UXcFgDkNPjJWKtPMu9o2XijCjL` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none (vercel.app only) | `nnevhtfxuawexliwlbmh` | **ZERO INTERFERENCE** — do not modify config without explicit request. MIRA is off-limits. |
| `apps/startup-factory-web` | startup-factory-web | `prj_XqOuowAPVwCIquJSGvtW1j7D1iiE` | `jeicosts-projects` | startupsfactory.es | `nnevhtfxuawexliwlbmh` (via shared tools) | SF main marketing site. Root Directory on Vercel = "." |
| `apps/sf-cms` | sf-cms | `prj_istn9Vc3c7zd17QkzakT9CUWmW3B` | `team_7QGpRqqi1FjrJugGLL0sDehf` | cms.startupsfactory.es, sf-cms.vercel.app | `dmzecrlkclocqaywkjtc` | **UPDATED 2026-07-19:** Domain was OURS all along (see resolved finding below). App is now self-contained (no workspace deps) — CLI deploy from `apps/sf-cms` works. Project has NO git integration; deploy via `cd apps/sf-cms && vercel --prod`. |
| `apps/sf-crm` | sf-crm | `prj_TR1XsOLUpLcpQxsu5yFmYKGEvJfk` | `team_7QGpRqqi1FjrJugGLL0sDehf` | sf-crm-phi.vercel.app | `nnevhtfxuawexliwlbmh` | CRM platform (internal use). |
| `packages/cms-client` | cms-client | `prj_KjoFaJi7fH4b2OC14wDEzH8lm74N` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none | — | Shared NPM package (not typically deployed standalone). |
| `clients/salsa-burgers` | salsa-burgers-web | `prj_ermiutbVMzAyE8lRL3mrot8g5JRC` | `team_7QGpRqqi1FjrJugGLL0sDehf` | salsaburgers.com, www.salsaburgers.com | — | **FIXED 2026-07-16:** Was mislinked to orphan project (`prj_CE4lSOWL...`). Now points to real production project. |
| `clients/nc-global-assets` | nc-global-assets | `prj_dglycSdtgX52oCSDNqAfq8JeME82` | `jeicosts-projects` | ncglobalassets.com, www.ncglobalassets.com | — | Legacy Vite SPA (being replaced by nc-global-assets-next). |
| `clients/nc-global-assets-next` | nc-global-assets-next | `prj_GqKIJAxeq8ZgJ9VB6GYIr3O7qwlD` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none (WIP) | — | Next.js port of NC Global (mid-migration, low priority, zero production risk). |
| `apps/sf-links` | sf-links | (not yet inspected) | — | links.startupsfactory.es | — | Link shortener (currently unlinked locally, low priority). |
| `clients/discoolver/creators-landing` | discoolver-creators-landing | `prj_No9UIOs54YPJW4iVQyeWnoNVpXG4` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-creators-landing-jeicosts-projects.vercel.app | — | Static HTML landing. Deployed 2026-07-19. |
| `clients/discoolver/briefing` | discoolver-briefing | `prj_leUpb2tNZkSikGVeVHUt8JwJujQZ` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-briefing-jeicosts-projects.vercel.app | — | Static HTML briefing page. Deployed 2026-07-19. |
| `clients/discoolver/deliverables/investor-deck-site` | discoolver-investor-deck | `prj_clu0ci7Z7FuvEsPq6GkHzvXliP48` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-investor-deck-jeicosts-projects.vercel.app | — | Static HTML + investor deck PDF. Deployed 2026-07-19. |
| `clients/discoolver/design-studio` | discoolver-design-studio | `prj_SoMU6F5A7bvp85cfPIFimYo5B2jP` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-design-studio-jeicosts-projects.vercel.app | — | Vite + React design template studio. Deployed 2026-07-19. |

---

## Known Orphan / Blocklisted Projects

**These project IDs must NEVER appear in any `.vercel/project.json` file. If found, it is a bug — fix immediately.**

| Vercel Project Name | Project ID | Why It Exists | Action |
|---|---|---|---|
| salsa-burgers (orphan) | `prj_CE4lSOWLgD7VJDAhwr6NJncqtKq6` | Created by accident ~2026-07-14 during rootDirectory experiment. No domain attached. | Do NOT use. If seen in any `.vercel/project.json`, that file is misconfigured. Do not delete from Vercel dashboard automatically — flag for manual cleanup by a human. |

---

## RESOLVED Finding (2026-07-19): cms.startupsfactory.es Was Ours All Along

**Status:** ✅ Resolved. The "external account" theory was WRONG.

The domain `cms.startupsfactory.es` and the alias `sf-cms.vercel.app` were attached to OUR `sf-cms` project (`prj_istn9Vc3c7zd17QkzakT9CUWmW3B`) the whole time. What looked like an "external app" was our own **stale production deployment from 2026-05-25** (the project had no git integration, so months of pushes never deployed; the old UI predated the local rebuild and was mistaken for a lost external app).

**What happened on 2026-07-19:** a fresh CLI deploy (`cd apps/sf-cms && vercel --prod`) replaced the stale deployment. `cms.startupsfactory.es` now serves the rebuilt CMS (Supabase Auth login, settings/media APIs). The DNS cutover planned as "Fase 2.2" happened implicitly — no DNS change was ever needed.

**Rollback:** possible at any time from the Vercel dashboard (promote the 2026-05-25 deployment `sf-q1lijxlt2`). Note the old deployment's build may also contain the "lost" admin source (uploaded at deploy time) — potentially recoverable via `vercel pull`/build artifacts if ever needed.

**Also fixed 2026-07-19:** Vercel SSO Deployment Protection was enabled on sf-cms (and applied to new projects by team default), blocking public API access with 302 redirects. Removed via API (`ssoProtection: null`) for sf-cms and the 4 discoolver projects. New projects will need the same toggle.

---

## Incident Log

| Date | What Broke | Root Cause | Fix & Status |
|---|---|---|---|
| 2026-07-16 | `clients/salsa-burgers` linked to orphan project; monorepo root linked to mira-portal | (1) Commit `2dd8074` (2026-07-14) edited `.vercel/project.json` rootDirectory field without correcting projectId in same change — projectId remained at orphan value. (2) Root linking cause unknown, pre-existing. | See **Pasos de Arreglo 1-3** in `FASE_0_BIS` of project plan. |

---

## Verification Script

Run `node scripts/verify-project-links.mjs` before every `vercel --prod`. The script:
- Checks every deploying folder's local `.vercel/project.json` against this registry
- Fails if projectId is wrong or on the blocklist
- Fails if the monorepo root has a `.vercel/project.json` (should never exist)
- Supports `--live` flag to cross-check against `vercel project inspect` (optional, slower)
- Exit code 0 = PASS, 1 = FAIL

```bash
# Check all projects
node scripts/verify-project-links.mjs

# Check one project before deploying it
node scripts/verify-project-links.mjs clients/salsa-burgers

# Deep cross-check against live Vercel dashboard (optional, slower)
node scripts/verify-project-links.mjs --live
```

---

## Supabase Project Mapping

See `docs/SUPABASE_CONFIG.md` for detailed Supabase project breakdown. Quick reference:

- **`dmzecrlkclocqaywkjtc`** — SF-CMS only (isolated for security)
- **`nnevhtfxuawexliwlbmh`** — MIRA, SF-CRM, SF-Sales-Engine, ai-agency-sf-next (shared "agency-os" project)

Every file in the codebase that references Supabase has been verified to use the correct project ID.

---

## How to Update This Registry

1. **Vercel changes:** Run `vercel project inspect <projectName>` and `vercel domains inspect <domain>` to get current live state. Update table above with exact values.
2. **Supabase changes:** Update `docs/SUPABASE_CONFIG.md` first (source of truth), then reference from here.
3. **New projects:** Add row to registry table, create `.vercel/project.json` in local folder, update the blocklist if applicable, add entry to incident log.
4. **Keep in sync:** This file and `scripts/verify-project-links.mjs` must stay synchronized. If you edit one, edit the other.

---

**Last updated:** 2026-07-16  
**Next review:** Before any major deployment phase or when adding new projects.
