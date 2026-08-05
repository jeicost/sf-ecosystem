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

## Deploy Hooks — patrón de git-integration (rollout 2026-07-30)

Los 6 proyectos reales de `sf-cms.projects` (salsaburgers, startupsfactory, ncglobalassets, discoolver, adrian-grooves; `qa-harness` excluido — nunca se despliega) tienen `vercel_hook_url` configurado: publicar una página en el CMS dispara un rebuild real vía Vercel Deploy Hook, no solo un cambio en la base de datos. Patrón usado para conectar cada uno (piloteado en Adrian Grooves el 2026-07-30, extendido a los otros 4 el mismo día):

1. `cd <carpeta> && vercel git connect https://github.com/jeicost/sf-ecosystem.git --yes` — conecta el proyecto Vercel al monorepo. **Ojo:** esto puede disparar de inmediato un build de producción de `main` (observado en 2 de 4 casos), antes de terminar de configurar nada. No es necesariamente un problema (si el código no cambió, el build reproduce lo mismo que ya está en vivo), pero hay que vigilarlo.
2. `PATCH /v9/projects/{id}`: `rootDirectory` a la ruta exacta desde la que hoy se despliega por CLI, `installCommand`/`buildCommand` forzados a `npm install`/`npm run build` (evita que Vercel autodetecte Turborepo/pnpm desde la raíz del monorepo), y **`sourceFilesOutsideRootDirectory: false`**.
3. El paso 2 es imprescindible para carpetas dentro del glob de `pnpm-workspace.yaml` (`apps/*`, `apps/*/*`, `packages/*`) — le pasó a `startup-factory-web`: con `sourceFilesOutsideRootDirectory` en `true` (default), Vercel instala desde la raíz del monorepo usando el `pnpm-lock.yaml` raíz, que tiene dependencias `workspace:*` que `npm install` no entiende (`EUNSUPPORTEDPROTOCOL`) → build de producción falló en vivo (sin impacto: un deploy fallido nunca reemplaza al anterior, pero mejor evitarlo). Las carpetas bajo `clients/*` no están en ese glob y no lo sufren.
4. **Nunca probar la configuración empujando a `main` directamente** una vez conectado — cualquier push a `main` ahora dispara un build de producción real en cada proyecto conectado. Probar así: crear una rama temporal (`git checkout -b test/x && git push origin test/x`), crear un Deploy Hook temporal apuntando a esa rama (`ref` = nombre de la rama → build sale como `target: null`/preview, nunca pisa producción), dispararlo, esperar `READY`/`ERROR`, borrar el hook y la rama.
5. Una vez validado: borrar cualquier Deploy Hook viejo/obsoleto del proyecto, crear el definitivo con `ref: "main"`, y guardar su URL en `sf-cms.projects.vercel_hook_url` (tabla en el proyecto Supabase `dmzecrlkclocqaywkjtc`) vía PATCH a `/rest/v1/projects?slug=eq.<slug>`.

**Hallazgo adicional del rollout:** `salsaburgers` y `startupsfactory` ya tenían una conexión Git en Vercel de meses atrás, apuntando a repos standalone (`jeicost/salsa-burgers-web`, `jeicost/startup-factory-web`) sin push desde mayo de 2026 — de antes de la consolidación en el monorepo. Tenían incluso un Deploy Hook viejo ("CMS Publish") ya creado pero nunca conectado a `sf-cms`. Si se hubiera activado tal cual, habría reconstruido ambos sitios en producción con código de dos meses de antigüedad. Se desconectaron esos repos viejos (`vercel git disconnect`) antes de conectar el monorepo — los repos standalone se dejaron intactos en GitHub, solo dejaron de estar enlazados a Vercel.

---

## Registry Table

| Local Folder | Vercel Project Name | Project ID | Org ID | Production Domain | Supabase Project | Notes |
|---|---|---|---|---|---|---|
| `apps/mira/portal` | mira-portal | `prj_75UXcFgDkNPjJWKtPMu9o2XijCjL` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none (vercel.app only) | `nnevhtfxuawexliwlbmh` | **ZERO INTERFERENCE** — do not modify config without explicit request. MIRA is off-limits. |
| `apps/startup-factory-web` | startup-factory-web | `prj_XqOuowAPVwCIquJSGvtW1j7D1iiE` | `team_7QGpRqqi1FjrJugGLL0sDehf` | startupsfactory.es | `nnevhtfxuawexliwlbmh` (via shared tools) | SF main marketing site. Root Directory on Vercel = "." **2026-07-21:** SSO protection disabled (302'd previews); CMS_API_URL added to Preview env; live canonical is APEX (www→apex 307 — contradicts the www rule, pending decision, see audit NEW-3). **2026-07-30:** git-connected al monorepo (ver "Deploy Hooks — patrón de git-integration" arriba) — reemplaza un repo standalone obsoleto sin push desde mayo. Deploy Hook real en `sf-cms.projects.vercel_hook_url` (slug `startupsfactory`). |
| `apps/sf-cms` | sf-cms | `prj_istn9Vc3c7zd17QkzakT9CUWmW3B` | `team_7QGpRqqi1FjrJugGLL0sDehf` | cms.startupsfactory.es, sf-cms.vercel.app | `dmzecrlkclocqaywkjtc` | **UPDATED 2026-07-19:** Domain was OURS all along (see resolved finding below). App is now self-contained (no workspace deps) — CLI deploy from `apps/sf-cms` works. Project has NO git integration; deploy via `cd apps/sf-cms && vercel --prod`. |
| `apps/sf-crm` | sf-crm | `prj_TR1XsOLUpLcpQxsu5yFmYKGEvJfk` | `team_7QGpRqqi1FjrJugGLL0sDehf` | sf-crm-phi.vercel.app | `nnevhtfxuawexliwlbmh` | CRM platform (internal use). |
| `packages/cms-client` | cms-client | `prj_KjoFaJi7fH4b2OC14wDEzH8lm74N` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none | — | Shared NPM package (not typically deployed standalone). |
| `clients/salsa-burgers` | salsa-burgers-web | `prj_ermiutbVMzAyE8lRL3mrot8g5JRC` | `team_7QGpRqqi1FjrJugGLL0sDehf` | salsaburgers.com, www.salsaburgers.com | — | **FIXED 2026-07-16:** Was mislinked to orphan project (`prj_CE4lSOWL...`). Now points to real production project. **2026-07-30:** git-connected al monorepo (ver "Deploy Hooks — patrón de git-integration" arriba) — reemplaza un repo standalone obsoleto sin push desde mayo. Deploy Hook real en `sf-cms.projects.vercel_hook_url` (slug `salsaburgers`). |
| `clients/_archive/nc-global-assets-vite` | nc-global-assets | `prj_dglycSdtgX52oCSDNqAfq8JeME82` | `team_7QGpRqqi1FjrJugGLL0sDehf` | (none — domain moved off 2026-07-30) | — | Legacy Vite SPA. **ARCHIVED locally 2026-07-28.** **DOMAIN CUTOVER DONE 2026-07-30:** `ncglobalassets.com`/`www.ncglobalassets.com` moved to `nc-global-assets-next`. This project kept intact (not deleted) as instant rollback: re-add both domains here via the Vercel API/dashboard if the new site needs to be reverted. Do not deploy from here. |
| `clients/nc-global-assets-next` | nc-global-assets-next | `prj_GqKIJAxeq8ZgJ9VB6GYIr3O7qwlD` | `team_7QGpRqqi1FjrJugGLL0sDehf` | ncglobalassets.com, www.ncglobalassets.com (apex→www 308, matches prior config) | via SF-CMS (`ncglobalassets`) | **LIVE since 2026-07-30** — CMS-wired (17/8/5/4 sections across home/about/services/contact), redesigned in this session's earlier work. Two real bugs found and fixed during the cutover: (1) a committed `package-lock.json` broke Vercel's cloud build ("Cannot find module 'react'") despite building fine locally — removed + gitignored, this project resolves deps fresh on every deploy; (2) `og-image.jpg` referenced in metadata since project creation but the file never existed (404) — generated from the hero photo, deployed. **2026-07-30 (más tarde):** git-connected al monorepo, ya no depende solo de CLI (ver "Deploy Hooks — patrón de git-integration" arriba; también se corrigió `framework` de `"services"` a `"nextjs"` en este paso). Deploy Hook real en `sf-cms.projects.vercel_hook_url` (slug `ncglobalassets`). |
| ~~`apps/sf-links`~~ | sf-links | (never existed locally) | — | links.startupsfactory.es (unclaimed) | — | 🪦 **DECOMMISSIONED 2026-07-28 (CEO decision):** folder was empty (code lost to a phantom submodule); local folder and gitlink removed. Domain `links.startupsfactory.es` is free. If the product is ever revived, start from scratch. |
| `apps/sf-reports` | sf-reports | `prj_CKehhayVoAOeStxtyyyTV6g3Xl3t` | `team_7QGpRqqi1FjrJugGLL0sDehf` | internal (X-Robots noindex) | — | Client audit-report host (static, `buildCommand:""`). Added to registry 2026-07-23 so verify-project-links validates it. |
| `apps/mira-landing` | mira-landing | `prj_onxCLqdAsKfJIsVJk9XJbwJU8ssN` | `team_7QGpRqqi1FjrJugGLL0sDehf` | mira-landing-chi.vercel.app (custom domain www.miralanding.com claimed via `NEXT_PUBLIC_SITE_URL`, not verified as actually attached) | — | **RESOLVED 2026-07-24:** confirmed with the user + linked locally (`vercel link --project mira-landing`). No git integration — deploys only via `vercel --prod` from this folder (same as sf-cms). Last real deploy before this was 2026-05-31. |
| `clients/discoolver/creators-landing` | discoolver-creators-landing | `prj_No9UIOs54YPJW4iVQyeWnoNVpXG4` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-creators-landing-jeicosts-projects.vercel.app | — | Static HTML landing. Deployed 2026-07-19. |
| `clients/discoolver/briefing` | discoolver-briefing | `prj_leUpb2tNZkSikGVeVHUt8JwJujQZ` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-briefing-jeicosts-projects.vercel.app | — | Static HTML briefing page. Deployed 2026-07-19. |
| `clients/discoolver/deliverables/investor-deck-site` | discoolver-investor-deck | `prj_clu0ci7Z7FuvEsPq6GkHzvXliP48` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-investor-deck-jeicosts-projects.vercel.app | — | Static HTML + investor deck PDF. Deployed 2026-07-19. |
| `clients/discoolver/design-studio` | discoolver-design-studio | `prj_SoMU6F5A7bvp85cfPIFimYo5B2jP` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-design-studio-jeicosts-projects.vercel.app | — | Vite + React design template studio. Deployed 2026-07-19. |
| `clients/adrian-grooves` | adrian-grooves | `prj_TZgrFmJKtGEqINtmwUcHqwm0LIBd` | `team_7QGpRqqi1FjrJugGLL0sDehf` | none (preview) | via SF-CMS (`adrian-grooves`) | Landing de venta del curso de Adrian Grooves (Next 16, build-time bake). Creado 2026-07-24. Preview `*.vercel.app`, sin dominio custom aún. SSO off. **PILOTO 2026-07-30:** conectado a GitHub (`jeicost/sf-ecosystem`, `rootDirectory: clients/adrian-grooves`, rama de producción `main`) — primer proyecto del ecosistema desplegado por push en vez de `vercel --prod` manual. `installCommand`/`buildCommand` forzados a `npm install`/`npm run build` (Vercel detectaba Turborepo desde la raíz del monorepo y quería `pnpm install` a nivel de los 14 workspaces — falla real, verificada). Deploy Hook real creado y guardado en `sf-cms.projects.vercel_hook_url` — publicar en el CMS ahora sí dispara un rebuild real. `commandForIgnoringBuildStep` probado y desactivado (cancelaba builds que sí tocaban la carpeta — bug a investigar antes de reactivarlo). Patrón de referencia para conectar el resto de proyectos cuando se decida. |
| `clients/discoolver/app-landing` | discoolver-app-landing | `prj_OPIF4zs5ZiU6ROBPqQ5FsADIJh4i` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-app-landing.vercel.app | (pendiente: página propia en sf-cms) | **Landing de la APP de Discoolver** (descubrimiento local, lista de espera por invitación). Es el contenido que vivía en `discoolver-landing` hasta el 2026-08-05, recuperado íntegro del histórico (`4cf6f32~1`) a su propia carpeta y proyecto cuando `clients/discoolver/web` se reposicionó como tienda de guías. **Son dos productos distintos: no mezclar los copys.** Sin git-integration: deploy con `vercel --prod` desde la carpeta. Al crear el proyecto, Vercel NO detectó el framework (`framework: null` → 404 en el primer deploy); corregido por API a `nextjs` — mismo patrón que ya pasó con nc-global-assets-next y discoolver-landing. |
| `clients/discoolver/web` | discoolver-landing | `prj_fxRmmDp5z9FBUPmZurgb43GsN5Ep` | `team_7QGpRqqi1FjrJugGLL0sDehf` | discoolver-landing.vercel.app | via SF-CMS (`discoolver`, slugs `home`/`influencers`, published) | **RECONSTRUIDO 2026-07-29** (código original perdido, Vercel purgó los blobs de un deploy CLI sin git — reconstruido pixel-perfect, loop-diseno score 9.7/10) — **LIVE en producción 2026-07-30.** Antes de desplegar se encontró y arregló: (1) la carpeta estaba trackeada como un gitlink huérfano en el monorepo (mismo patrón que perdió `sf-links` antes) — el rebuild de ayer nunca se había commiteado realmente hasta hoy; (2) `framework` del proyecto Vercel estaba mal detectado como `"services"` en vez de `"nextjs"`, rompiendo cualquier deploy; (3) SSO Deployment Protection seguía activo (no se había desactivado como en los otros 4 proyectos de Discoolver). Los 3 arreglados y verificados. Páginas `home`/`influencers` publicadas en sf-cms. **2026-07-30 (más tarde):** git-connected al monorepo (ver "Deploy Hooks — patrón de git-integration" arriba). Deploy Hook real en `sf-cms.projects.vercel_hook_url` (slug `discoolver`). **2026-08-05: REPOSICIONAMIENTO EN PRODUCCIÓN** — la home pasa de waitlist de app a tienda editorial de guías y `/influencers` a landing de captación con 2 tracks (commits `4cf6f32`+`5b5309e`, deploy READY, verificado en vivo). Antes de desplegar se encontró que las páginas de sf-cms conservaban los campos del posicionamiento antiguo y **40 claves colisionaban** con las nuevas (34 en `home`, 6 en `influencers`) — habrían publicado el copy viejo pese a verse bien en local; las 3 páginas (`home`, `influencers`, `creators-landing`) se re-sembraron con el set actual. |

---

## Nota — `clients/lidar-home/deliverables/briefing-site/vercel.json`

Este fichero existe en disco (`buildCommand`/`installCommand` en `null`) pero **no tiene ningún proyecto Vercel real vinculado** (`.vercel/project.json` ausente) y LiDAR Home no tiene app real hoy (solo `deliverables/`, ver `SCHEMA.md` de memoria). Encontrado en la auditoría de 2026-07-31 — no es un proyecto activo, no requiere entrada en la tabla de registro. Revisar si sigue haciendo falta cuando LiDAR Home tenga alta real en MIRA/CMS.

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

**Last updated:** 2026-07-31 (corregidas 2 filas con Org ID desactualizado, verificado que los 15 `.vercel/project.json` reales coinciden con este registro)
**Next review:** Before any major deployment phase or when adding new projects.
