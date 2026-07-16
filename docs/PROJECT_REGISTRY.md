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
| `apps/sf-cms` | sf-cms | `prj_istn9Vc3c7zd17QkzakT9CUWmW3B` | `jeicosts-projects` | (cms.startupsfactory.es is on EXTERNAL account — do not touch) | `dmzecrlkclocqaywkjtc` | Content management platform (isolated Supabase project by design). Live at https://cms.startupsfactory.es but deployed from external Vercel account. |
| `apps/sf-crm` | sf-crm | `prj_TR1XsOLUpLcpQxsu5yFmYKGEvJfk` | `team_7QGpRqqi1FjrJugGLL0sDehf` | sf-crm-phi.vercel.app | `nnevhtfxuawexliwlbmh` | CRM platform (internal use). |
| `packages/cms-client` | cms-client | `prj_KjoFaJi7fH4b2OC14wDEzH8lm74N` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none | — | Shared NPM package (not typically deployed standalone). |
| `clients/salsa-burgers` | salsa-burgers-web | `prj_ermiutbVMzAyE8lRL3mrot8g5JRC` | `team_7QGpRqqi1FjrJugGLL0sDehf` | salsaburgers.com, www.salsaburgers.com | — | **FIXED 2026-07-16:** Was mislinked to orphan project (`prj_CE4lSOWL...`). Now points to real production project. |
| `clients/nc-global-assets` | nc-global-assets | `prj_dglycSdtgX52oCSDNqAfq8JeME82` | `jeicosts-projects` | ncglobalassets.com, www.ncglobalassets.com | — | Legacy Vite SPA (being replaced by nc-global-assets-next). |
| `clients/nc-global-assets-next` | nc-global-assets-next | `prj_GqKIJAxeq8ZgJ9VB6GYIr3O7qwlD` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none (WIP) | — | Next.js port of NC Global (mid-migration, low priority, zero production risk). |
| `apps/sf-links` | sf-links | (not yet inspected) | — | links.startupsfactory.es | — | Link shortener (currently unlinked locally, low priority). |

---

## Known Orphan / Blocklisted Projects

**These project IDs must NEVER appear in any `.vercel/project.json` file. If found, it is a bug — fix immediately.**

| Vercel Project Name | Project ID | Why It Exists | Action |
|---|---|---|---|
| salsa-burgers (orphan) | `prj_CE4lSOWLgD7VJDAhwr6NJncqtKq6` | Created by accident ~2026-07-14 during rootDirectory experiment. No domain attached. | Do NOT use. If seen in any `.vercel/project.json`, that file is misconfigured. Do not delete from Vercel dashboard automatically — flag for manual cleanup by a human. |

---

## Critical Finding: cms.startupsfactory.es Lives in External Account

**Status:** 🟡 Documented, affects SF-CMS cutover decisions.

The live admin at `cms.startupsfactory.es` and `sf-cms.vercel.app` is NOT served by the `sf-cms` project under our Vercel account (`prj_istn9Vc3c7zd17QkzakT9CUWmW3B`). Evidence:

1. `sf-cms.vercel.app` cannot exist as an alias in our account because it's already taken by the external deployment.
2. `curl -I sf-cms.vercel.app/login` and `curl -I cms.startupsfactory.es/login` both return the same HTTP `etag: 0796e3da47772d6e87b547b99855f358` — they are the same deployment.
3. Our local project `sf-cms` is served as `sf-cms-jeicosts-projects.vercel.app` (the auto-generated alias).

**Implication:** The CMS admin currently in use (with dashboard, stats, rich Post editor) was deployed from a different Vercel account (likely the original before the code-loss incident of 2026-07-12). We cannot:
- See its source code
- Modify it directly
- Roll it back via our Vercel dashboard

**Path to Cutover (viable without external account access):**
- `cms.startupsfactory.es` is a subdomain of `startupsfactory.es`, which **we own** (DNS managed externally, not in Vercel DNS).
- We control the DNS and can re-point the subdomain to our own `sf-cms` project (`prj_istn9Vc3c7zd17QkzakT9CUWmW3B`) at any time via `vercel domains add cms.startupsfactory.es sf-cms`.
- This is a **high-impact, irreversible action** (the external admin becomes inaccessible on that URL) — requires explicit user approval, not included in general plan approvals.

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
