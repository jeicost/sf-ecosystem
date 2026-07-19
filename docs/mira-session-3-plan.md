# MIRA — Sesión 3: Nivel Producto Final (plan maestro)

> Diagnóstico cerrado el 2026-07-19 con exploración multi-agente + decisiones de producto del usuario. Estado de partida: los 11 puntos originales certificados por la review multi-agente (ver memoria `MIRA_REVIEW_MULTIAGENTE_2026_07_19`).

## Decisiones de producto (confirmadas por el usuario)
1. **Toolkit "como el original de ai agency" = AMBAS experiencias**: portada de entregables por cliente (estilo `apps/sf-reports/{cliente}/index.html`) + deck unificado tipo `toolkit-reports.html`.
2. **BYO Claude**: key del cliente en Integraciones con **fallback a la de plataforma** + registro de consumo por cliente.
3. **"Juntar" = CRM** (no CMS): ejecutar la integración CRM/Sales Engine en el departamento comercial (`docs/crm-architecture.md`).
4. **Presentaciones: TODO** — calidad visual, imágenes IA, export PPTX real y edición slide a slide.

## F0 — Arranque (10 min): cerrar Drive
- Usuario: clic "Connect" en /integrations (esquema ya desbloqueado, callback arreglado).
- Automático: replicar tokens a los 5 clientes en `drive_connections`, sembrar las 5 carpetas conocidas en `drive_folders` (IDs: Salsa `1z1osTOfJUxDqaTeQzh69QNBj-bvn3uBb`, SF `1AEJwsyq_eJoWB-Dhl0g5QIjz2dyQ76Vl`, Dadybox `1a9wBuo9CsRfragLbLVZzEeGLV6v2RHc-`, Discoolver `1qsJyFD3CZyJxQwuNYExAS_mqiyl8GZ8F`, NC `1sb9oGFmgQdRkdTeMgbdFKb_gGUs3a7zI`), ejecutar `syncDriveFolder` (lib/drive-sync.ts) por carpeta, verificar `agent_documents` + mapas en `project_memory`.

## F1 — Toolkit como el original (agente frontend + agente datos, ~2.5h)
Referencias exactas: `apps/sf-reports/salsa-burgers/index.html` (portada) y `toolkit-reports.html` (deck), `apps/ai-agency-sf-next/app/page.jsx` (stats/cards).
1. **Portada de entregables** — rediseñar `/toolkit`: hero con branding del cliente (logo + `--client-primary`, glow, badge con dot), grid de tarjetas de entregable con **categoría** (Brand Intelligence / Content / Digital Audit / Strategy), **score /100** extraído de `result_data.overall_score` cuando exista, descripción y CTA "Ver informe →"; sección "Landings activas" (enlaces por cliente, datos en `clients.settings` o tabla nueva); bloque **histórico** por tool (todas las generaciones anteriores de `generation_queue` con fecha y "Ver versión").
2. **Deck unificado** — nueva vista `/toolkit/overview` (+ export `?template=editorial-all`): compila los 10 reportes del cliente en un micrositio de scroll continuo con nav-dots (reutiliza `getAdapter()` por tool → seleccionar 1-2 secciones destacadas de cada uno + cover + closing). Botón "Ver informe completo" por sección.

## F2 — BYO Claude + medición de consumo (agente backend, ~2h)
1. `lib/anthropic-client.ts`: `getClaudeForClient(clientId)` → usa `getClientApiKey(clientId,'anthropic', process.env.ANTHROPIC_API_KEY)` (helper ya existe y la tarjeta Claude ya está en Integraciones).
2. Cablearlo en TODAS las rutas de generación: `toolkit/generate`, `toolkit/generate-batch`, `documents/generate`, `documents/refine`, `quick-actions`, `agent` (chat), `brief`, `brand-brain/chatbot`, `drive-sync` (summaries).
3. **Tabla `usage_log`** (migración): client_id, route, model, input_tokens, output_tokens (de `message.usage`), used_client_key boolean, created_at + coste estimado calculado. Insert fire-and-forget en el wrapper.
4. Panel de consumo por cliente en el nuevo super admin (F3).

## F3 — Sección Super Admin dedicada (agente frontend, ~1.5h)
Estilo `apps/ai-agency-sf-next`: nueva `/admin` real (gating super_admin ya existe):
- Fila de StatCards: clientes activos, entregables generados (generation_queue), documentos, consumo Claude del mes (F2).
- Grid de ClientCards con logo/color real → clic activa el workspace; por cliente: nº reportes, último entregable, estado Drive, consumo.
- Accesos: usuarios (ya existe), facturación (mock señalizado), sistema.

## F4 — Presentaciones nivel superior — "todo" (agente templates + agente export, ~3h)
1. **Layouts nuevos** en `deck-template.ts`: timeline, comparison (2 columnas), quote, image+text, chart (Chart.js en slide), agenda.
2. **Imágenes IA por slide**: en `documents/generate` para doc-deck, generar portada + 2-3 imágenes de sección con `generateAndStoreImage()` (OpenAI ya activo) usando la marca; guardarlas en el JSON del deck.
3. **Export PPTX real**: nueva ruta `?format=pptx` que convierte `slides[]` a PowerPoint editable (python-pptx vía script o pptxgenjs) con colores/fuentes de la marca.
4. **Edición slide a slide**: `documents/refine` acepta `slide_index` → regenera solo esa slide; UI: seleccionar slide en el preview y chat contextual.
5. **One-pager real**: plantilla compacta de 1 página (deuda P2 de la review).

## F5 — MK Content productizado para todos (agente producto, ~2h)
Base existente: skill `mk-content` + `toolkit/content-pack` + `/api/brief` (pipeline Marco→Luna→Alex) + `/approvals` + `content_pillars`.
1. Tool guiada "Content Engine": elegir pilar(es) del cliente → nº posts por pilar → plataformas → genera pack (copy+caption+hashtags+scripts de reel por pilar) → todo a `approval_queue`.
2. Vista **calendario editorial** (mes) sobre `approval_queue`/`post_history` con estados.
3. Revisión de producto contigo: repaso de los 5 departamentos y sus quick actions/agentes — cuáles sobran, cuáles faltan, renombres (sesión interactiva, no código).

## F6 — CRM/Sales Engine en Comercial (agente integraciones, ~2.5h)
Ejecutar `docs/crm-architecture.md` fases A-D:
- A: seguridad — `resolveRequestClient()` en `comercial/*` (cierra la mayor parte de la deuda de 14 IDORs).
- B: puente `leads → crm_contacts` + tabla `client_workspaces` + botón "Enviar a CRM".
- C: motor único — sustituir stubs `sales-engine/*` por llamadas al motor Python (SALES_ENGINE_API_URL) con Apollo+Hunter reales.
- D: verificación E2E discovery→lead→CRM visible en sf-crm.

## F7 — Deuda de seguridad restante (agente seguridad, ~1h)
IDORs fuera de comercial (mapeados en memoria): `agent-settings`, `brain/versions`, `brief`, `agent` chat, `agent/context/retrieve`, `agent/[role]/{documents,upload-document}`, `brand-brain/{documents,upload-document,drive/ingest}` + P1s (quick-actions GET, project-memory PATCH, department-stats, DELETE roto en client/documentation/[id]) → aplicar `resolveRequestClient`/`userCanAccessClient` de `lib/resolve-client.ts`. Verificar `NEXT_PUBLIC_DEV_MODE_BYPASS` off en prod y elevar seeds a super_admin.

## Ejecución multi-agente
Orquestación por fases con agentes especializados en paralelo donde no chocan (F1+F2+F4 tocan áreas distintas), review de seguridad + QA funcional al final (patrón de la sesión 2), verificación E2E con walkthrough del usuario.

## Fuera de alcance (siguiente después)
Google Slides API (`?template=gslides`), Canva Connect, PDF server-side, consolidación de carpetas de migraciones, baseline completa de tablas phantom.
