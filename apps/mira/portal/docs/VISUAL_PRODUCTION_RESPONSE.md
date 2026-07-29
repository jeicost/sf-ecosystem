# MIRA — Developer Technical Response
## Visual Production Foundation · respuesta al Pre-Implementation Handoff v0.1

**Fecha:** 2026-07-29 · **Estado:** discovery completo, scaffolding no destructivo preparado en la rama `feat/visual-production-foundation`. Ninguna implementación de runtime autorizada ni realizada, conforme al handoff.

---

## 1. STACK

- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind. Monorepo Turborepo + pnpm.
- **Runtime/Hosting:** Vercel serverless (Node runtime). Deploy **nativo en push a `main`** (sin CI intermedio para esta app). Rutas de generación ya operan con `maxDuration = 800` (fluid compute) — precedente para trabajos largos, aunque el pipeline visual NO debe ser una request síncrona (de acuerdo con el handoff).
- **Datos:** Supabase (proyecto `nnevhtfxuawexliwlbmh`): Postgres + RLS, Storage, Auth (GoTrue). Migraciones SQL manuales numeradas (`supabase/migrations/00NN_*.sql`) aplicadas vía SQL editor — no hay runner automático.
- **IA:** Anthropic SDK (`claude-opus-4-8` para generación de entregables, `claude-sonnet-4-6` para chat). OpenAI `gpt-image-1` **ya en producción** para 3 quick actions visuales (server-side).
- **Entornos:** producción (`mira-portal-nu.vercel.app`) + local dev. **Staging = Vercel Preview Deployments** por rama (cada push a una rama no-main genera URL de preview con el mismo build).
- **Branch workflow recomendado:** feature branch → preview deploy → merge a `main` (deploy prod automático). Esta respuesta y el scaffolding viven en `feat/visual-production-foundation`.

## 2. REPOSITORY MAP

App: `apps/mira/portal/` dentro del monorepo `Claude.nosync`.

| Área | Ruta |
|---|---|
| Rutas API | `app/api/*/route.ts` |
| Quick Actions (registry + orquestación) | `lib/quick-actions/registry.ts`, `lib/quick-actions/generate.ts`, `app/api/quick-actions/route.ts` (+ `/guided`, `/retry`) |
| UI Quick Actions | `components/QuickActionButton.tsx` (modal form/chat), `components/QuickActionResult.tsx`, `components/quick-actions/GuidedQuickActionChat.tsx` |
| Auth / tenancy | `lib/resolve-client.ts` (`getSessionUser`, `resolveRequestClient`, `userCanAccessClient`), `proxy.ts` (middleware), `lib/require-super-admin.ts` |
| Generación de imagen actual | `lib/generation/openai-image.ts` (`generateAndStoreImage`) |
| Identidad de marca (tipos canónicos) | `lib/brand-data.ts`, `lib/brand-brain.ts` (`fetchBrandBrain`/`formatBrandBrainForPrompt`) |
| Storage/upload server-side (patrón) | `app/api/attachments/upload/route.ts`; subida a Drive del cliente: `lib/export/drive-upload.ts` |
| Trabajos largos (patrón actual) | tabla `generation_queue` + polling del cliente (`app/api/toolkit/generate`, `app/api/toolkit/status`) |
| Cron existente | `app/api/cron/drive-sync/route.ts` (diario, `CRON_SECRET`, definido en `vercel.json`) |
| Migraciones | `supabase/migrations/` (próximo número libre al escribir esto: 0052) |
| Scaffolding visual (nuevo, esta rama) | `lib/visual-production/*`, `app/api/visual-jobs/route.ts`, `supabase/migrations/drafts/visual-production/*.sql` |

## 3. DATA MODEL

- **Tenancy = cliente.** Tabla `clients` (id uuid). NO existe entidad "workspace/tenant" por encima ni entidad "brand" separada: **`brand_profiles` es 1:1 con el cliente** (el detalle rico vive en `brand_profiles.brand_data` JSONB, tipado en `lib/brand-data.ts`). → Para el handoff, la combinación tenant/client/brand de MIRA colapsa a **client** (DIFFERENT, ver checklist). `BrandVisualModule` encajaría como tabla nueva versionada colgando de `client_id`.
- **Usuarios y membresía:** Supabase Auth + tabla `mira_project_access` (grants usuario→cliente; **aviso de naming legacy: su columna `project_id` contiene el CLIENT id**). Plan/rol del usuario en `auth.users.user_metadata.plan` (`super_admin | admin | scale | growth | starter`).
- **Proyectos:** `mira_projects` (client_id, slug). Los entregables (`generation_queue.project_id`) y memoria (`project_memory.project_id`) pueden colgar de un proyecto.
- **Convenciones:** PKs `uuid DEFAULT gen_random_uuid()`, timestamps `timestamptz DEFAULT now()`, FKs con `ON DELETE CASCADE/SET NULL`, CHECK constraints estrictos para enums (p. ej. `generation_queue.tool_slug` es una allowlist — cualquier valor nuevo exige migración), RLS por `client_id` vía `mira_project_access` (patrón de las migraciones 0045/0046).
- **⚠️ CONFLICTO A DECIDIR:** la migración **0028 ya creó** `visual_jobs`, `visual_assets`, `visual_feedback`, `visual_approvals` — vacías, sin rutas que las usen, con esquema y máquina de estados (`accepted→planning→rendering→qa→completed`) DISTINTOS a los del handoff (`draft→validating_inputs→…`). Los drafts de esta rama documentan las dos opciones (reutilizar con ALTERs aditivos vs. namespaciar tablas nuevas `vp_*`). **Decisión conjunta pendiente antes de numerar/aplicar nada.**

## 4. QUICK ACTIONS

- **¿Existe `POST /api/quick-actions`?** SÍ (`app/api/quick-actions/route.ts`), más `POST /api/quick-actions/guided` (modo conversacional) y `/retry`.
- **Contrato (simplificado):** request `{ action_id, input_data, clientId?, project_id?, attachments? }` → auth por sesión + grant (`resolveRequestClient`) → ejecución **SÍNCRONA dentro de la request** (Claude escribe un spec; si la acción es visual, se llama a `gpt-image-1` en la misma request) → inserta resultado en `quick_actions_results` (status, `output_data` con `image_url` firmada) → response con el resultado completo. La UI NO hace polling para quick actions (sí lo hace para el Toolkit, que usa `generation_queue` + `GET /api/toolkit/status?queue_id=`).
- **Registro/ruteo de acciones:** array tipado en `lib/quick-actions/registry.ts` (id, department, fields, outputType); prompts por acción en `lib/generation/quick-action-prompts.ts`.
- **Respuestas a las 4 preguntas:** (1) Sí existe. (2) **Hoy NO crea trabajo durable** — es síncrono; el patrón durable existente en la app es `generation_queue` + polling y es el que proponemos imitar para visual jobs. (3) La UI ya sabe hacer polling (Toolkit) — reutilizable. (4) Las acciones son **client-specific** (siempre ejecutan sobre el cliente activo autorizado; no hay scope brand aparte, ver §3).

## 5. STORAGE

- **Buckets:** `generated-assets` (**privado**, imágenes generadas; acceso por **signed URLs de 7 días**), `brand-assets` (público hoy — logos y adjuntos; ya anotado en deuda interna para pasar a privado — **el handoff prohíbe bucket público para producción visual: se cumplirá usando bucket privado nuevo o `generated-assets`**).
- **Flujo de subida:** server-side vía API route con service role tras autorización (`app/api/attachments/upload`: allowlist de MIME, límites 5 ficheros × 15 MB, path `{clientId}/{prefix}/{timestamp}-{nombre-saneado}`). La subida directa desde navegador NO está permitida por policy (verificado).
- **Signed URLs:** `supabase.storage.from(bucket).createSignedUrl(path, expiry)` — ejemplo vivo en `lib/generation/openai-image.ts`.
- **Aislamiento:** el path SIEMPRE se construye con el `client_id` resuelto server-side (nunca del body), y la autorización pasa por `resolveRequestClient`/`userCanAccessClient` antes de tocar storage.
- **Ejemplo completo (flujo real de imagen):** (1) POST quick action autorizada → (2) `generateAndStoreImage` guarda `clients/{clientId}/quick-actions/{actionId}/{n}.png` en `generated-assets` → (3) fila en `quick_actions_results.output_data {image_url, image_path}` → (4) signed URL 7d devuelta a la UI → (5) toda lectura posterior re-firma vía `app/api/assets`.
- **Metadata de assets:** no hay tabla genérica de assets hoy (los paths viven en el JSONB de resultados). Las tablas del sistema visual (0028 o `vp_*`) cubrirían esto.

## 6. BACKGROUND JOBS

- **Hoy:** NO hay worker/cola externa (ni Inngest/BullMQ/QStash ni Edge Functions en uso). Patrones existentes: (a) `generation_queue` — fila `processing` + ejecución en la request (maxDuration 800) + polling del cliente + estados `queued|processing|completed|failed` con `error_message`; (b) **cron Vercel diario** (`vercel.json` → `/api/cron/drive-sync` con `Authorization: Bearer CRON_SECRET`) que procesa hasta N elementos por corrida con claim implícito por `last_synced_at`.
- **Recomendación (menos disruptiva, sin dependencias nuevas):** tabla de jobs (las visual_jobs decididas en §3) + **worker = ruta cron Vercel** invocada cada minuto (Vercel cron soporta `* * * * *`) que hace **claim atómico** (`UPDATE … SET status='claimed', claimed_at=now() WHERE id = (SELECT … WHERE status='pending' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`) y avanza UN paso de la máquina de estados por invocación (validate → plan → generate → qa → …), con reintentos por `attempt_count` + `max_attempts`, timeout por paso (si `claimed_at` excede umbral → liberar), idempotencia por `(job_id, step)` en la tabla de eventos, y cancelación = estado `cancelled` que el worker respeta antes de cada paso. La UI consume por polling (patrón Toolkit ya existente) — realtime de Supabase como mejora opcional posterior. La interfaz está tipada (sin implementación) en `lib/visual-production/worker.ts`.

## 7. AI INTEGRATION

- **OpenAI:** llamadas **server-side only** (`lib/generation/openai-image.ts`, fetch directo a la REST API; sin SDK pineado — se añadiría versionado si el runtime lo requiere). Modelo actual de imagen: `gpt-image-1` (1024×1024). **No se ha elegido modelo definitivo para el runtime visual** (prohibido por el handoff — CONFIRMED, sin decisión tomada).
- **API keys:** patrón BYO-key **por cliente** (tabla de integraciones, resuelta server-side) con fallback a la key de plataforma (`OPENAI_API_KEY` / Anthropic equivalente). Nunca expuestas al navegador.
- **Prompts:** en código versionado (`lib/generation/*.ts`), no en DB. Para el runtime visual, el handoff pide módulos de marca versionados → tabla `brand_visual_modules` (draft) con `version` + payload, alineable con `lib/brand-data.ts`.
- **Custom GPTs:** MIRA **no llamará Custom GPTs privados** (CONFIRMED — límite aceptado). Los comportamientos validados en GPTs se reproducirán vía API + brand modules versionados.
- **Coste/uso:** tabla `mira_usage_log` registra consumo por ruta/cliente (patrón reutilizable para latencia/coste por job).
- **Streaming:** implementado en el chat de agentes (SSE) — disponible como patrón si el runtime lo necesita.

## 8. FILES PROVIDED (sanitizados, en esta rama)

- `docs/VISUAL_PRODUCTION_RESPONSE.md` (este documento)
- `lib/visual-production/types.ts` — interfaces `VisualJob`, `VisualJobAsset`, `VisualReference`, `VisualQaRun`, `VisualFeedback`, `BrandVisualModule`, `VisualJobEvent`
- `lib/visual-production/status.ts` — estados canónicos + mapa de transiciones permitidas
- `lib/visual-production/flags.ts` — feature flag `VISUAL_PRODUCTION_ENABLED` (default OFF)
- `lib/visual-production/storage-paths.ts` — helper de rutas de storage privado
- `lib/visual-production/worker.ts` — interfaz del worker (sin lógica de proveedor)
- `app/api/visual-jobs/route.ts` — stub que responde `501 NOT_IMPLEMENTED` (y `404` con el flag apagado)
- `supabase/migrations/drafts/visual-production/draft_01_core.sql` + `draft_02_events_qa.sql` — borradores SIN aplicar y SIN número de secuencia, con el análisis del conflicto 0028 en cabecera
- Referencias de solo lectura ya en `main`: `lib/brand-data.ts`, `lib/generation/openai-image.ts`, `lib/export/color-utils.ts`, `app/api/attachments/upload/route.ts`, `supabase/migrations/0028_*.sql`

No se incluyen: secretos, keys, datos personales ni assets privados de clientes.

## 9. CONFLICTS / LIMITATIONS

1. **Tablas 0028 vs entidades del handoff** (§3): misma familia de nombres, esquema y estados distintos. Requiere decisión reuse-vs-namespace ANTES de numerar migraciones.
2. **Sin entidad brand separada:** brand = client en MIRA (1 marca por cliente). Si el sistema visual necesita N marcas por cliente en el futuro, es un cambio de modelo mayor — hoy `BrandVisualModule.client_id` es el scope correcto.
3. **Sin cola externa:** el worker será cron+claim sobre Postgres (§6) salvo que se apruebe añadir un proveedor de colas. Límite práctico: pasos individuales ≤ ~privilegio de maxDuration de Vercel; el diseño por-pasos del handoff encaja bien con esto.
4. **Quick actions síncronas:** encolar un visual job durable desde una quick action es un cambio pequeño (insert + return job_id) pero rompe el contrato actual "respuesta con resultado completo" para esa acción — la UI de esa acción pasa a polling (patrón ya existente en Toolkit).
5. **Documentación previa desactualizada:** `docs/VISUAL_GENERATION_INTEGRATION.md` describe un sistema de jobs que nunca se conectó (será reescrito apuntando a esta foundation); referencias antiguas a "30 agentes" y "webhooks n8n" — la realidad es 23 agentes y llamadas directas.
6. **Signed URLs de 7 días:** los enlaces embebidos en resultados caducan; el runtime debe re-firmar al servir (patrón `app/api/assets` ya existente).

## 10. RECOMMENDED NEXT TECHNICAL STEP

Una única acción pequeña y reversible: **sesión de revisión de los 2 drafts SQL** para (a) decidir reuse-vs-namespace de las tablas 0028, (b) congelar la máquina de estados definitiva (la del handoff está tipada en `status.ts` con transiciones explícitas), y (c) aprobar el mecanismo worker cron+claim. Con eso aprobado, la primera implementación real sería solo la migración numerada + el claim del worker devolviendo jobs vacíos — sin proveedor de imagen todavía.

---

## CHECKLIST DEL HANDOFF (sección D)

| Supuesto | Veredicto | Nota |
|---|---|---|
| MIRA usa Supabase (DB + storage) | **CONFIRMED** | |
| Tenants/workspaces, clients, brands, users, memberships | **DIFFERENT** | Solo clients + users + grants; brand 1:1 con client; sin workspaces |
| `POST /api/quick-actions` existe | **CONFIRMED** | Síncrono hoy |
| Quick Actions pueden encolar trabajo durable | **DIFFERENT** | Hoy no; patrón `generation_queue`+polling listo para replicar |
| La UI puede hacer polling/suscribirse a estado de job | **CONFIRMED** | Polling implementado (Toolkit); realtime disponible no usado |
| Se puede añadir bucket privado | **CONFIRMED** | `generated-assets` ya es privado con signed URLs |
| Signed URLs soportadas | **CONFIRMED** | 7 días, re-firma server-side |
| Se puede añadir worker/cola | **CONFIRMED** | Vía cron Vercel + claim (recomendado); cola externa requeriría aprobación |
| Llamadas OpenAI server-side | **CONFIRMED** | Con BYO-key por cliente + fallback plataforma |
| Feature flags disponibles | **CONFIRMED** | Por env var (`lib/visual-production/flags.ts`, OFF por defecto) |
| Existe staging para pruebas seguras | **DIFFERENT** | No hay staging dedicado; Vercel Preview Deployments por rama cumplen la función |
