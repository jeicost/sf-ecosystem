# CRM + Sales Engine — Arquitectura de integración con MIRA Comercial

> Documento de planificación (2026-07-19). Sin código ejecutado — es el plan para la sesión de integración comercial.

## Estado actual (verificado por auditoría)

Hay **tres sistemas desconectados** que comparten proyecto Supabase (`nnevhtfxuawexliwlbmh`) pero no se hablan:

| Sistema | Qué hace | Tablas | Estado |
|---|---|---|---|
| **MIRA comercial** (`apps/mira/portal/app/api/comercial/*`) | Discovery real (Tavily + Claude Haiku), qualify, icebreaker, proposal (streaming + brand_profiles) | `leads`, `lead_activities`, `icp_profiles`, `proposal_library`, `prospect_context` | ✅ **Funcional** con `TAVILY_API_KEY` |
| **MIRA sales-engine** (`apps/mira/portal/app/api/sales-engine/*`) | discover/enrich/sync-crm | `lead_discovery_results`, `apollo_enrichment_results`, `crm_contacts` | 🔴 **Mock** (Tavily "NOT IMPLEMENTED", Apollo stub, scoring aleatorio) |
| **sf-crm** (`apps/sf-crm`) | UI CRM: contacts, pipeline, discovery, outreach, prospection | `crm_contacts`, `leads`, `discovery_runs`, `outreach_emails` | ✅ Funcional pero lee `crm_contacts`, que solo alimenta el mock |
| **sf-sales-engine** (Python FastAPI :8000) | Motor real: scrapers, enrichment, scoring, Apollo+Hunter (integrados 2026-07-17), Instantly/Telegram (2026-07-19) | migrations propias `001-003` | ✅ Funcional pero **MIRA nunca lo llama** |

**La fractura:** el lead-gen real de MIRA escribe en `leads`; el CRM lee `crm_contacts`. Nada conecta ambas mitades salvo el camino mock.

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
