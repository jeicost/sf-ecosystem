# MIRA — Plan Maestro de Cierre

> Reconstruido el 2026-07-21 (la sesión que lo redactaba se cortó antes de guardarlo). Estado verificado contra git log y working tree, no contra memoria.

## Estado de partida (verificado 2026-07-21 ~11:00)

**Sesión 3 completa** (2026-07-19): toolkit ai-agency, white-label total, BYO Claude + `usage_log`, Super Admin `/admin`, presentaciones PPTX + imágenes IA, Content Engine + calendario, puente CRM (E2E 13/13), 19 IDORs cerrados, Drive↔Brain en 5 clientes.

**Sesión 4 casi completa** (ejecutada 2026-07-21 09:30–10:42):
- ✅ F1 Roster: síntesis 30→23 agentes (6/7/4/3) — `ff94a83`, `0022ce7`, `2b04561`
- ✅ Home operativo + sidebar admin-first + tour + light mode — `796490d`; fix columna phantom `clients.settings` — `6015ffb`
- ✅ F2 Motor: auth `X-API-Key` en todos los routers (D1 cerrado) — `ecf089a`; deploy Railway — `81e8893`; `SALES_ENGINE_API_URL/KEY` en Vercel — `c203493`
- ✅ F3.1: workspace Salsa Burgers en sf-crm — `808eb0a`; sección CRM en nav Sales — `2409b10`
- ⏳ Pendientes de S4: F0 walkthrough, F2.4 discovery E2E, F2.5 env vars del usuario, F3.2 webhook hot-lead, F4 pulido

**WIP sin commitear** (refactor multi-empresa, interrumpido ~10:59):
- Nuevo `GET /api/me/clients` — clientes por grants de `mira_project_access` (3 niveles: usuario 1 grant / admin N grants / super_admin todos)
- `lib/client-context.tsx` reescrito: prioridad guardado-con-acceso → metadata.client_id-con-grant → primer grant; super admin sin selección aterriza en `/admin`
- `client-switcher.tsx` consume `/api/me/clients` (ya no lista la tabla `clients` desde el navegador)
- `(dashboard)/layout.tsx`: badge de aprobaciones sigue al cliente ACTIVO, no al de metadata
- `api/documents` y `api/project-memory` endurecidos con `resolveRequestClient` (error de compilación `user.id` → `access.userId` ya corregido; type-check limpio)
- ⚠️ `vercel.json` raíz: se añadió `experimentalServices.sf-sales-engine` con `routePrefix: "/"` — **probable leftover del experimento pre-Railway. El motor vive en Railway y la raíz del monorepo no debe deployar nada. Decidir: revertir (recomendado).**

---

## C0 — Cerrar el WIP multi-empresa (~45 min) — PRIMERO
1. Decidir `vercel.json` raíz (recomendación: `git checkout vercel.json`).
2. Probar en local los 3 niveles de acceso: usuario normal (1 grant), admin multi-cliente (switcher muestra solo sus grants), super_admin (todos + aterriza en `/admin` sin selección). Verificar que perder un grant limpia el localStorage y no deja workspace fantasma.
3. Descartar los `tsconfig.tsbuildinfo` de sf-cms/sf-crm del commit (ruido de build).
4. Commit (`feat(mira): multi-empresa access — grants como fuente de verdad`) + `vercel --prod` desde `apps/mira` (verificar link con `node scripts/verify-project-links.mjs apps/mira` antes).
5. Smoke en prod: login de un usuario cliente real → ve solo su empresa.

## C1 — Walkthrough de validación con el usuario (~20 min)
El F0 de S4, aún pendiente — recorrido en su navegador (Cmd+Shift+R):
`/toolkit` → `/toolkit/overview` → `/admin` → `/toolkit/content-engine` (pack real de 1 pilar) → `/calendar` → `/documents` (doc-deck → imágenes IA → editar slide por chat → PPTX) → `/comercial/pipeline` con Dadybox (Enviar a CRM → verlo en sf-crm). Anotar fricción → fixes en caliente.

## C2 — Motor comercial vivo E2E (~1h)
1. Probar discovery profundo desde MIRA (`sales-engine/discover`) contra el motor en Railway — E2E completo discovery→lead→CRM.
2. Env vars del motor que solo el usuario puede aportar: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `INSTANTLY_API_KEY`, `WEBHOOK_SECRET`.

## C3 — Completar el mapa CRM (~30 min)
1. Valorar workspaces SF y NC Global en sf-crm (Salsa ya hecho).
2. Supabase Database Webhook hot-lead (`leads.hot_score>=75` → `POST /webhooks/hot-lead`) si el usuario quiere alertas Telegram (requiere C2.2).

## C4 — Pulido post-walkthrough (~1-2h, según C1)
Lo que salga de C1 + candidatos conocidos: estados de error del iframe de reportes (P2), empty-states de DriveFoldersPanel, i18n de `/calendar` y `/content-engine` (solo ES), mobile-check de la portada del toolkit.

## C5 — Cierre operativo
1. **Excluir `~/Desktop/Claude` de iCloud** (⚠️ urgente — corrompe git/node_modules cada sesión; renombrado `.nosync` ya aplicado, verificar que basta).
2. Consolidar `portal/migrations/` vs `portal/supabase/migrations/` (o documentar cuál manda).
3. Actualizar `ARCHITECTURE.md` + CLAUDE.md de mira si el modelo de acceso multi-empresa cambia el onboarding de clientes.
4. Guardar memoria de cierre + `/buenas-noches`.

## Criterios de cierre (definition of done)
- [ ] Un usuario cliente ve solo su empresa; un admin multi-empresa cambia entre las suyas; super_admin ve todo
- [ ] Walkthrough C1 completado sin fricción bloqueante
- [ ] Discovery→lead→CRM funciona E2E contra Railway en prod
- [ ] Sin cambios sin commitear en `apps/mira`
- [ ] `vercel.json` raíz limpio y raíz sin `.vercel/project.json`

## Backlog post-cierre (sin fecha)
Google Slides API (`?template=gslides`) · Canva Connect · PDF server-side · puente MIRA→CMS (descartado, diseño en memoria) · baseline tablas phantom (0031) · panel de consumo con gráficas históricas.
