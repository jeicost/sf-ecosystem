# Backlog de bugs del ecosistema — re-verificado 2026-08-03

Origen: auditoría de ecosistema del 2026-07-31 (9 agentes), cuyo informe original no se persistió a disco. Esta re-verificación se hizo desde cero contra el código actual, la BD Supabase en vivo (`nnevhtfxuawexliwlbmh`) y HTTP en producción donde aplica. Cada ítem tiene veredicto y evidencia `fichero:línea`. Ninguno está arreglado aún — este documento es el backlog de trabajo.

## Prioridad ALTA — rotos en producción con usuarios/clientes reales hoy

### 1. sf-crm — mapeo snake_case/camelCase (parcial) + schema fantasma
**App desplegada**: sf-crm-phi.vercel.app.
- `crm_contacts` ya se arregló (`src/lib/db.ts:4-41`, `mapCrmContactRow`/`unmapCrmContactRow`).
- **`leads` sigue roto**: `db.ts:65` hace `data as Lead[]` sin mapear (columnas reales `first_name`/`company_name`/`hot_score`, tipo TS camelCase). Consumo roto en runtime: `api/contacts/route.ts:16` → `ContactsClient.tsx:50` (`contact.firstName.toLowerCase()` → TypeError/nombres en blanco). `createLead` (`db.ts:77`) inserta camelCase tal cual → insert falla.
- **`lead_activities` roto**: `db.ts:167` filtra por `contact_id` — verificado en vivo: `42703 column does not exist`.
- **`outreach_emails` no existe** (verificado en vivo, `PGRST205`) — `db.ts:194/210/216` la consulta. **`discovery_runs.workspace_id` no existe** en la BD viva (`db.ts:230`) — la migración que lo define (`scripts/migrations/03_sf-crm-schema.sql:164-172`) nunca se aplicó; la BD real coincide con `apps/sf-sales-engine/supabase/migrations/003_data_pipeline.sql:25-41`. Rutas `/api/outreach/emails` y `/api/discovery/run` → 500 siempre.

### 2. startup-factory-web — `<html>`/`<body>` duplicados
**Verificado en producción**: `startupsfactory.es/es` sirve dos `<html>` y dos `<body>` anidados. Causa: `app/layout.tsx:118,132` (root) los renderiza y `app/[locale]/layout.tsx:87,91` los renderiza otra vez. HTML inválido en la web pública principal — riesgo de hydration errors y malo para SEO/parsers.

### 3. NC Global Assets — newsletter con éxito falso
**Verificado en producción** (www.ncglobalassets.com): `components/Footer.tsx:17` — `if (email.includes('@')) setSubDone(true)`, muestra "✓ You're on the list." sin enviar nada a ningún sitio. El email del visitante se descarta. (El otro form del sitio, `LeadMagnet.tsx:34`, sí envía de verdad vía formsubmit.co — solo el newsletter del footer es fake.)

### 4. sf-reports — links rotos en el hub de entregables
**Verificado en producción** (sf-reports.vercel.app): `jeicost/index.html:50` → `/jeicost/briefing` y `lidar-home/index.html:50` → `/lidar-home/briefing` son links **activos** que dan 404 (no existe el fichero, y `cleanUrls: false`). Es el hub que se entrega a clientes. Los demás links extensionless también darían 404 pero están deshabilitados (`pointer-events: none`).

## Prioridad MEDIA — rotos pero sin usuarios externos afectados hoy

### 5. ai-agency-sf-next — cascada CSS deja paddings/margins a 0
`app/globals.css:1-7`: `@import "tailwindcss"` (v4) seguido de un reset **sin capa** (`* { margin: 0; padding: 0; }`). En Tailwind v4 las utilidades viven en `@layer utilities` y el CSS sin capa siempre gana → todas las clases `p-*`/`m-*`/`mx-auto` quedan en 0 (incluido el centrado). Portal interno del equipo, no clientes. Fix: mover el reset a `@layer base` o eliminarlo (v4 trae preflight).

### 6. sf-sales-engine — 3 problemas estructurales
- `packages/notion_sync/src/notion_sync/client.py:33-47`: `upsert_lead`/`query_leads`/`ensure_properties` lanzan `NotImplementedError` — y el worker lo usa de verdad (`apps/worker/src/worker/jobs/notion_sync.py:123`): 392 líneas de retry/backoff para un job que jamás sincroniza nada (100% de leads acaban en `errors`).
- `apps/api/src/api/routers/seed.py:31`: router completo (`/seed/upload`) nunca registrado en `main.py:8` — endpoint inalcanzable.
- `.github/workflows/sf-sales-engine-ci.yml:36-49`: ruff y mypy corren con `continue-on-error: true` (~34 errores ruff y ~300 mypy pendientes reconocidos en comentarios) — el gate de CI no existe en la práctica.

### 7. discoolver-dg-editor — vías de fallo silencioso en export PDF (evolucionado)
El flujo principal ya NO traga errores (v2 propaga 500 y el editor React los muestra — `TabExport.jsx:100-106`). Quedan 2 vías silenciosas reales:
- `app/services/pdf_renderer.py:116-117,205-211`: sin Playwright instalado, `_placeholder_fallback` escribe un fichero de TEXTO y lo devuelve como PDF exitoso (riesgo real en deploy Railway). `main.py` anuncia además un "WeasyPrint fallback" que no existe.
- `pdf_renderer.py:196-197`: `_merge_pdfs` descarta en silencio páginas cuyo PDF temporal falta o pesa <100 bytes → PDF incompleto entregado como éxito.

## Prioridad BAJA — no desplegado aún

### 8. Discoolver web — waitlist stub
`clients/discoolver/web/app/api/waitlist/route.ts:3-21`: stub deliberado (comentado como tal), `console.log` + `{ok:true}` falso. 3 formularios postean ahí (`HeroForm.tsx:30`, `AppComingSoon.tsx:18`, `InfluencerForm.tsx:34`). La web **no está en producción todavía** (su CLAUDE.md lo lista como pendiente pre-deploy) — bloqueante de deploy, no incendio.

## Hallazgo colateral (2026-08-03)
Las Supabase keys locales de `apps/sf-crm/.env.local` (`SUPABASE_SERVICE_KEY`) y `apps/sf-sales-engine/.env` responden `401 Unregistered API key` — quedaron obsoletas tras la rotación del incidente de la service key (DEBT, incidente cerrado). Cualquier script local que las use falla. Reponerlas desde el dashboard cuando se trabaje en esas apps.
