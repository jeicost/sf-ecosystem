# MIRA — Sesión 4: Validación, roster y motor comercial vivo

> Preparado al cierre de la Sesión 3 (2026-07-19). Estado de partida: TODO el producto desplegado y probado — toolkit ai-agency, white-label total, BYO Claude + consumo, Super Admin, presentaciones PPTX con imágenes IA, Content Engine + calendario, puente CRM (E2E 13/13), 19 IDORs cerrados, Drive↔Brain sincronizando 5 clientes.

## F0 — Walkthrough de validación con el usuario (~20 min)
Recorrido guiado de todo lo nuevo en su navegador (Cmd+Shift+R primero):
`/toolkit` (portada + score + versiones) → `/toolkit/overview` (deck unificado) → `/admin` (visión agencia + consumo) → `/toolkit/content-engine` (generar pack real de 1 pilar) → `/calendar` (aprobar desde el calendario) → `/documents` (crear doc-deck → ver imágenes IA → editar slide 3 por chat → descargar PPTX y abrirlo) → `/comercial/pipeline` con Dadybox (Enviar a CRM → verlo en sf-crm). Anotar cualquier fricción → fixes en caliente.

## F1 — C3 Revisión de producto del roster (pendiente de 3 intentos — hacerla PRIMERO en la sesión)
Repasar con el usuario los 30 agentes y 25 quick actions por departamento (roster completo en `lib/agent-meta.ts` + `lib/generation/quick-action-prompts.ts`): qué sobra, falta o se renombra según los servicios que vende. Aplicar los cambios (metadata + prompts + componentes quick-actions).

## F2 — Motor comercial vivo
1. Desplegar `apps/sf-sales-engine` (FastAPI) en Railway (o confirmar si la otra sesión ya lo hizo — revisar memoria `sf_sales_engine_n8n_removed`).
2. **Cerrar el gap de auth del motor**: `/leads/search` no valida `X-API-Key` (hallazgo D1) — añadir dependency de auth en el motor ANTES de exponerlo público.
3. `SALES_ENGINE_API_URL` + `SALES_ENGINE_API_KEY` reales en Vercel (mira-portal) y en sf-crm.
4. Probar discovery profundo desde MIRA (`sales-engine/discover`) end-to-end.
5. Env vars del motor pendientes del usuario: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `INSTANTLY_API_KEY`, `WEBHOOK_SECRET` (para webhooks hot-lead y respuestas Instantly).

## F3 — Completar el mapa CRM
1. Crear workspace de Salsa Burgers en sf-crm (`apps/sf-crm/src/lib/workspaces.ts`) + fila en `client_workspaces` (y valorar SF y NC Global).
2. Configurar el Supabase Database Webhook de hot-lead (`leads.hot_score>=75` → `POST /webhooks/hot-lead` del motor) si el usuario quiere alertas Telegram.

## F4 — Pulido post-walkthrough
Lo que salga de F0 + candidatos conocidos: estados de error del iframe de reportes (P2 de la review), empty-states de DriveFoldersPanel, i18n de las vistas nuevas (calendar/content-engine están solo en ES), mobile-check de la portada del toolkit.

## Backlog (sin fecha)
Google Slides API (`?template=gslides`) · Canva Connect · PDF server-side · puente MIRA→CMS (descartado por ahora, diseño mapeado en memoria) · consolidar `migrations/` vs `supabase/migrations/` · baseline completa de tablas phantom (0031) · excluir ~/Desktop/Claude de iCloud (⚠️ recomendación operativa urgente — corrompe git/node_modules cada sesión).

## Cómo arrancar la sesión
`/buenos-dias` o directamente: leer memoria `session-3-mira-ejecucion-2026-07-19` → empezar por F1 (roster) que solo necesita al usuario, con F2 (Railway) en paralelo si hay credenciales.
