# CRM + Sales Engine — Arquitectura de integración con MIRA Comercial

> Documento de planificación (2026-07-19). Sin código ejecutado — es el plan para la sesión de integración comercial.

## Estado actual (verificado por auditoría)

Hay **tres sistemas desconectados** que comparten proyecto Supabase (`nnevhtfxuawexliwlbmh`) pero no se hablan:

| Sistema | Qué hace | Tablas | Estado |
|---|---|---|---|
| **MIRA comercial** (`apps/mira/portal/app/api/comercial/*`) | Discovery real (Tavily + Claude Haiku), qualify, icebreaker, proposal (streaming + brand_profiles) | `leads`, `lead_activities`, `icp_profiles`, `proposal_library`, `prospect_context` | ✅ **Funcional** con `TAVILY_API_KEY` |
| **MIRA sales-engine** (`apps/mira/portal/app/api/sales-engine/*`) | discover/enrich/sync-crm | `lead_discovery_results`, `apollo_enrichment_results`, `crm_contacts` | 🔴 **Mock** (Tavily "NOT IMPLEMENTED", Apollo stub, scoring aleatorio) |
| **sf-crm** (`apps/sf-crm`) | UI CRM: Dashboard, contacts, pipeline, discovery, outreach (Resend), prospection (Apollo search + CSV import) | `crm_contacts`, `leads`, `discovery_runs`, `outreach_emails` | ✅ Funcional. `crm_contacts` ya recibe datos **reales** hoy por 2 vías propias, no solo por el mock: "Add to Pipeline" tras una búsqueda Apollo real en Prospection, y el importador CSV (`POST /api/leads/import`, usado por ambas UIs) |
| **sf-sales-engine** (Python FastAPI, Railway) | Motor real: scrapers, enrichment, scoring, Apollo+Hunter (2026-07-17). Ampliado 2026-07-19 (ver detalle abajo) tras eliminar n8n (nunca desplegado) | migrations propias `001-003` | ✅ Funcional pero **MIRA nunca lo llama** |

**La fractura:** el lead-gen real de MIRA escribe en `leads`; el CRM lee `crm_contacts`. Nada conecta ambas mitades salvo el camino mock — **pero `crm_contacts` ya no depende solo de ese mock**, sf-crm también la alimenta directamente (ver fila de arriba).

### sf-sales-engine — endpoints reales disponibles hoy (2026-07-19)

n8n fue evaluado y eliminado (nunca estuvo desplegado; ver `sf_sales_engine_n8n_removed_2026_07_19` en memoria). Todo lo que iba a hacer n8n son ahora llamadas directas a Claude desde FastAPI, mismo patrón que ya usa MIRA:

| Endpoint | Reemplaza (n8n) | Nota |
|---|---|---|
| `POST /discovery/run` | `discovery-trigger.json` | Además tiene cron propio diario (`.github/workflows/sf-sales-engine-daily-discovery.yml`, 6am UTC) — **no hace falta que MIRA construya su propio disparador periódico** |
| `POST /leads/search` | — | Apollo+Hunter+cache, ya consumido por sf-crm Prospection |
| `POST /icebreaker/generate` | `icebreaker-generator.json` | Ver ⚠️ duplicación abajo |
| `POST /outreach/send/{lead_id}` | `instantly-campaign-launcher.json` | Vía Instantly (campañas secuenciadas) — canal **distinto** al de sf-crm, ver nota de outreach abajo |
| `POST /outreach/generate-proposal` | `call-brief-to-proposal.json` | Ver ⚠️ duplicación abajo |
| `POST /webhooks/hot-lead` | `hot-lead-alert.json` | Pensado para un Supabase Database Webhook en `leads` (hot_score≥75) — alerta Telegram + icebreaker automático |
| `POST /webhooks/instantly-reply` | `reply-classifier.json` | Clasifica respuestas con Haiku, actualiza `stage` |

Env vars nuevas que estos endpoints necesitan (además de `SALES_ENGINE_API_URL`/`SALES_ENGINE_API_KEY` que ya menciona este doc): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `INSTANTLY_API_KEY`, `WEBHOOK_SECRET`.

### ⚠️ Duplicación a resolver en Fase C (nueva, no estaba prevista)

El trabajo de hoy en sf-sales-engine creó dos duplicados que este doc no contemplaba al escribirse:

- **Icebreaker**: existe en MIRA (`comercial/icebreaker`, contexto Tavily) **y** en sf-sales-engine (`/icebreaker/generate`, contexto Commercial Brain RAG). No son intercambiables sin decidir cuál es la canónica.
- **Propuesta**: existe en MIRA (`comercial/proposal`, streaming + brand_profiles) **y** en sf-sales-engine (`/outreach/generate-proposal`, RAG de `proposal_library`).

La Fase C no debe limitarse a sustituir los stubs de `discover`/`enrich` — también tiene que decidir cuál de las dos implementaciones de icebreaker/proposal se conserva antes de construir el puente, o quedarán dos caminos activos escribiendo resultados distintos para el mismo lead.

### Dos canales de outreach (no son redundantes)

- **sf-crm → Resend** (`POST /api/outreach/send-email`): envío de un email suelto, compuesto a mano, para un contacto puntual.
- **sf-sales-engine → Instantly** (`POST /outreach/send/{lead_id}`): añade el lead a una campaña con secuencia automática de varios emails.

Mantener ambos — cubren casos de uso distintos, no hay que elegir uno.

## Decisiones propuestas

1. **Tabla canónica de contactos: `crm_contacts`.** Es la que lee sf-crm y la que ya tiene mapeo snake↔camel en `src/lib/db.ts`. `leads` queda como tabla de trabajo del discovery de MIRA (staging).
2. **Puente `leads → crm_contacts`:** al calificar un lead en MIRA (score ≥ umbral o acción "Añadir a CRM"), upsert en `crm_contacts` con mapeo `heat_score→hot_score`, `client_id→workspace`. Un solo módulo `lib/comercial/promote-lead.ts`.
3. **Un solo motor de discovery:** eliminar los 3 stubs de `app/api/sales-engine/*` en MIRA y sustituirlos por llamadas HTTP al motor Python (`SALES_ENGINE_API_URL` + `SALES_ENGINE_API_KEY`, endpoint `POST /leads/search` ya existente con Apollo+Hunter+cache). El comercial de MIRA (Tavily) se mantiene como discovery "ligero"; Apollo vía motor = discovery "profundo".
4. **Mapeo tenant:** tabla `client_workspaces (client_id uuid PK, workspace text)` para traducir MIRA client_id ↔ sf-crm workspace. RLS calcada de `0026_clients_rls.sql`.
5. **Seguridad primero:** cerrar el gap cross-tenant conocido en las APIs comerciales de MIRA (validar que el `client_id` del body pertenece al usuario vía `requireClientAccess`, ya existe en `lib/auth-server.ts`).

## Fases de ejecución (próxima sesión)

1. **Fase A (seguridad, 30 min):** `requireClientAccess` en todos los `app/api/comercial/*` y `app/api/sales-engine/*`.
2. **Fase B (puente, 1h):** `promote-lead.ts` + botón "Enviar a CRM" en la UI de pipeline de MIRA + tabla `client_workspaces`.
3. **Fase C (motor único, 1-2h):** reemplazar stubs de sales-engine por fetch al motor Python; env vars `SALES_ENGINE_API_URL/KEY` en Vercel; desplegar el motor en Railway si no está.
4. **Fase D (verificación):** flujo completo Discovery MIRA → lead calificado → crm_contacts → visible en sf-crm.

## Decisión abierta
- ¿CRM propio (sf-crm) como producto final o sincronización con CRM externo (HubSpot/Pipedrive) para clientes que ya tengan uno? Recomendación: sf-crm para el servicio gestionado; conector externo como fase posterior.

## Referencias (memoria de sesión, 2026-07-19)
- `sf_sales_engine_n8n_removed_2026_07_19` — detalle completo de los endpoints nuevos, qué reemplazan, y qué queda pendiente de configurar (env vars, Supabase Database Webhook, GitHub secrets del cron).
- `mira_sf_crm_mira_integration_roadmap` — roadmap equivalente diseñado desde el lado de sf-crm/sf-sales-engine, converge con las Fases A-D de este doc.
- `mira_concurrent_work_caution` — antes de ejecutar cualquier fase, confirmar que no hay otro proceso trabajando en `apps/mira/` en paralelo (pasó activamente durante la sesión del 2026-07-19: 6+ commits concurrentes, dos de ellos absorbieron sin querer cambios de otra sesión por compartir el mismo índice de git).
