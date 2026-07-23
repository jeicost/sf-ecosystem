# DEBT.md — Deuda técnica de MIRA

Registro honesto de deuda técnica conocida. Última verificación completa: **2026-07-22** (post fase 2). Todas las rutas son relativas a `apps/mira/portal/` salvo que se indique lo contrario. Cada entrada verificada contra el código con grep en la fecha indicada.

---

## ✅ Resuelto (fase 2 — verificado 2026-07-22)

| Deuda | Resolución verificada |
|---|---|
| Fugas BYO Claude (rutas llamando a Anthropic con la key de la plataforma) | 17/17 rutas de `app/api/` usan `createMessageForClient`/`getClaudeForClient`; grep de `new Anthropic`/`anthropic.messages.create` en `app/api/` devuelve 0 resultados |
| **(d)** Mismatch de `redirect_uri` en OAuth Drive | `app/api/brand-brain/drive/authorize/route.ts:26` usa `process.env.GOOGLE_REDIRECT_URI` (fallback al valor del navegador solo si la env no existe), igual que el callback (`callback/route.ts:116,133`) |
| **(b)** Export a Drive solo por Service Account | `app/api/export/google-drive/route.ts:67-98` intenta primero el Drive del cliente (`getClientDriveAccessToken` + `uploadHtmlToClientDrive`, `destination: 'client_drive'`) con fallback al Service Account (L103). Residual: ver deuda nueva **(k)** |
| **(e)** Light mode dependiente del parche `!important` | ~95 ficheros migrados el 2026-07-21/22 — 116 ficheros usan ya clases semánticas (`text-ink`/`bg-card`/`border-line`), quedan 33 con clases dark hardcodeadas. El parche `!important` de `globals.css` **sigue activo como red de seguridad** — su retirada es deuda nueva **(j)** |
| Toolkit sin grounding (generaciones sin datos reales del sitio) | `lib/grounding/` (`site-snapshot`, `seo-checks`, `web-research`, `grounding-contract`) cableado en `app/api/toolkit/generate/route.ts:10-12`; el resultado lleva `result.grounding` (L332). Residual: ver deuda nueva **(m)** |
| Tarjeta Canva con flujo api-key incorrecto | Ahora OAuth 2.0 + PKCE (S256) real: `lib/integrations/oauth-config.ts:61-68` (`pkce: true`), `app/api/integrations/oauth/[tool]/start/route.ts:55-70` genera `code_verifier`/`code_challenge`, el callback lo envía en el exchange. Residual: ver deuda nueva **(l)** |

---

## a) `visual_jobs`: subsistema fantasma

*(Verificado de nuevo 2026-07-22: sigue igual.)* La migración `supabase/migrations/0028_visual_jobs.sql` crea 4 tablas (`visual_jobs` L6, `visual_assets` L33, `visual_feedback` L59, `visual_approvals` L85) con RLS completo — y **ninguna ruta de la app las usa**. Grep de `visual_jobs`/`visual-provider`/`visual-storage`/`visual-refinement` sobre `app/` y `components/` devuelve 0 resultados.

Ficheros huérfanos en `lib/generation/`: `visual-provider.ts`, `mock-visual-provider.ts`, `visual-storage.ts`, `visual-refinement.ts`, `feature-flags.ts`.

**Qué haría falta:** decidir si el pipeline de jobs visuales asíncronos se retoma o se elimina. Si se elimina: borrar los 5 ficheros + migración de drop de las 4 tablas. Si se retoma: cablear rutas `/api/visual-jobs` que hoy no existen.

---

## c) API keys de clientes en claro

*(Verificado de nuevo 2026-07-22: sigue igual.)* `lib/integrations/getClientApiKey.ts:53-55` lee la key desde `tool_connections.metadata.api_key` / `metadata.apiKey` **en texto plano**; L65 deja el TODO explícito: *"If lib/crypto.ts exists, decrypt the key here"* — `lib/crypto.ts` sigue sin existir.

**Qué haría falta:** cifrado at-rest (AES-GCM con key en env, o Supabase Vault), migración de las filas existentes y descifrado en `getClientApiKey`.

---

## f) `StudioArchetype` con proyectos decorativos mock

*(Verificado de nuevo 2026-07-22: sigue igual.)* `components/archetypes/StudioArchetype.tsx:29` define `DEFAULT_PROJECTS` (hardcoded) y `:100` lo usa como default de la prop `projects`. Único caller: `components/archetypes/AgentArchetypeWrapper.tsx:56` — no alimenta proyectos reales.

**Qué haría falta:** alimentar `projects` desde datos reales (p. ej. `quick_actions_results` visuales o `project_memory`) o vaciar el default y mostrar empty state.

---

## g) Prompts de quick actions sin botón + componente muerto

*(Verificado de nuevo 2026-07-22: sigue igual.)*

- `lib/generation/quick-action-prompts.ts:311` (`proyectar_revenue`) y `:403` (`auditar_innovacion`) tienen prompt completo pero **ningún botón** en `components/` ni `app/` los dispara.
- `components/DepartmentQuickActions.tsx` sigue sin importarse desde ningún fichero — código muerto.

**Qué haría falta:** añadir los 2 botones (Finanzas y Strategy respectivamente) o borrar los prompts; borrar `DepartmentQuickActions.tsx`.

---

## h) Pricing de `gpt-image-1` duplicado (ya consistente)

*(Re-verificado 2026-07-22: la **inconsistencia** se corrigió — ambos sitios dicen ahora `in: 5` — pero la **duplicación** sigue.)*

| Sitio | Valor |
|---|---|
| `lib/anthropic-client.ts:80` (`MODEL_PRICING`) | `'gpt-image-1': { in: 5, out: 40 }` |
| `app/api/usage/summary/route.ts:9` (`IMAGE_MODEL_PRICING`) | `'gpt-image-1': { in: 5, out: 40, perImage: 0.04 }` |

Dos fuentes de verdad: cualquier cambio futuro de precio puede volver a divergir.

**Qué haría falta:** un único mapa de pricing exportado (p. ej. `lib/pricing.ts`) consumido por ambos.

---

## j) Retirada del parche `!important` de light mode (nueva 2026-07-22)

`app/globals.css` mantiene ~45 reglas `[data-theme="light"] ... !important` (a partir de L60) como red de seguridad tras la migración masiva a clases semánticas. Quedan **33 ficheros** en `app/`+`components/` con `text-white`/`text-gray-*`/`bg-gray-*` que aún dependen del parche.

**Qué haría falta:** migrar los 33 ficheros restantes, hacer verificación visual completa de todas las pantallas en light mode y, solo entonces, borrar el bloque `!important` de `globals.css`.

---

## k) Conexiones Drive antiguas requieren re-autorización (nueva 2026-07-22)

El authorize de Brand Brain pide ahora `drive.readonly` + `drive.file` (`app/api/brand-brain/drive/authorize/route.ts:82-84`), pero las conexiones creadas **antes** del cambio solo tienen `drive.readonly`: para esos clientes el export al Drive del cliente falla y `app/api/export/google-drive/route.ts:103` cae al fallback de Service Account (carpeta de la plataforma).

**Qué haría falta:** forzar/solicitar re-autorización de las conexiones Drive existentes (o detectar el scope insuficiente y mostrar CTA de reconexión en la UI de integraciones).

---

## l) App de Canva sin registrar para usuarios externos (nueva 2026-07-22)

El flujo OAuth+PKCE está implementado, pero requiere una app registrada en **Canva Developers** y pasar su **review** para que funcione con usuarios externos. Envs necesarias: `NEXT_PUBLIC_CANVA_CLIENT_ID` y `CANVA_CLIENT_SECRET` (`lib/integrations/oauth-config.ts:61-62`; `app/api/export/canva/route.ts:44` falla con mensaje si faltan). El redirect registrado en Canva debe ser **exactamente** `<APP_URL>/api/integrations/oauth/callback`.

**Qué haría falta:** registrar la app en Canva Developers, configurar el redirect exacto, superar la review y poblar las envs en Vercel.

---

## m) Generaciones históricas del toolkit sin grounding (nueva 2026-07-22)

Las generaciones del toolkit anteriores al cableado de `lib/grounding/` siguen en `project_memory` **sin marcar**: no hay forma de distinguirlas de las nuevas salvo por la ausencia de `result_data.grounding` (las nuevas lo llevan siempre — `app/api/toolkit/generate/route.ts:332`).

**Qué haría falta:** decidir si se marcan retroactivamente (backfill con flag `pre_grounding`), se regeneran o simplemente se documenta que ausencia de `result_data.grounding` = generación legacy sin datos reales.

---

## n) ✅ Resuelto — Batch de cambios de prompts aplicado (fase 3, commit `6cc3232`, 2026-07-22)

*(Corregido 2026-07-23: este punto quedó desactualizado — el batch de `docs/PROMPTS_AUDIT_2026_07.md` sección 4 (quick wins Q1-Q5 + medios M1-M5) se aprobó y aplicó en la fase 3. Ver `lib/generation/quick-action-prompts.ts` y `lib/agent-prompts-i18n.ts` en ese commit.)*

Pendiente real: los cambios **grandes** del informe (G4 — i18n completo de los 39 prompts de quick actions/toolkit/documents, G5 — migrar a structured outputs/tool use) siguen sin decisión ni ejecutar.

---

## o) Enforcement de plan roto en dos capas (nueva 2026-07-23)

Verificado durante la auditoría de lanzamiento SaaS: el gating por plan (`lib/plans.ts`) es **cosmético en el frontend Y código muerto en el middleware**.
- `components/section-switcher.tsx` solo pinta un candado visual — ninguna página de `app/(dashboard)/comercial|finanzas|strategy|operations/*` comprueba el plan del usuario; accesibles por URL directa.
- `proxy.ts` SÍ intenta enforcement server-side con un regex (`/^\/(marketing|comercial|estrategia|innovacion|finanzas)(\/|$)/`), pero usa slugs **en español que no existen como rutas reales** — la app usa `strategy`/`operations` en inglés (ver `lib/sections.ts`), y Marketing no tiene un prefijo de ruta común (vive en `/roster`, `/command`, `/approvals`, `/performance`, `/brief`). El regex nunca matchea nada — es enforcement fantasma.

**Qué haría falta:** corregir el regex a los slugs reales (o mejor, un `guardSection(pathname, plan)` compartido usado tanto en `proxy.ts` como en cada `page.tsx` de departamento) — ver Fase 2 del roadmap de lanzamiento (`docs/MIRA-LANZAMIENTO-FASE2.md`), sección "Enforcement real de plan".

---

## p) ✅ Resuelto — `tool_connections`/`affiliate_tracking`/`tool_setup_progress` no existían en producción (descubierto y arreglado 2026-07-23)

Al aplicar la migración `0037_rls_hardening.sql` (RLS de `tool_connections`), Supabase devolvió `relation "tool_connections" does not exist`. Verificado con `information_schema.tables`: las 3 tablas de `supabase/migrations/0010_tool_integrations.sql` **nunca se aplicaron a producción**, pese a estar en el repo desde hace tiempo y ser usadas por código activo (`lib/integrations/getClientApiKey.ts`, `app/api/integrations/tools/route.ts`, `app/api/integrations/affiliate/route.ts`, `lib/integrations/canva.ts`, `app/api/integrations/oauth/callback/route.ts`).

**Impacto real durante todo ese tiempo:** `getClientApiKey.ts:35-46` trata cualquier error de la query (incluido "tabla no existe") igual que "sin clave conectada" — nunca lanza el error, solo `console.error` (invisible sin Sentry) y devuelve `defaultKey`. Resultado: **todas las generaciones con Claude/OpenAI han usado siempre la key de plataforma**, nunca la BYO del cliente, sin ningún error visible. Intentar *conectar* una key desde `/integrations` sí debía fallar de forma visible (el `INSERT` a una tabla inexistente no puede tener éxito silencioso).

**Resuelto:** `supabase/migrations/0038_tool_connections_backfill.sql` (idempotente, `CREATE TABLE/INDEX IF NOT EXISTS`) crea las 3 tablas + activa RLS. Aplicada en prod el 2026-07-23. Verificado con REST que las 3 tablas responden 200.

**Qué haría falta ahora:** probar en vivo que conectar una key BYO (Claude, OpenAI o Canva) desde `/integrations` funciona de principio a fin — nunca se ha podido verificar porque la tabla no existía.

---

## q) Quick actions de Finanzas rotas en producción — CHECK constraint desactualizado (nueva 2026-07-23)

Verificado con un `INSERT` real contra Supabase producción: `department='finanzas'` viola `quick_actions_results_department_check`. La tabla se creó con `('comercial','marketing','strategy','community','admin')` (`supabase/migrations/0015_fase1_recovery_schema.sql:73`) — sin `'finanzas'` — y ninguna migración posterior la amplió, pese a que `components/quick-actions/FinanzasQuickActions.tsx:112,128` lleva tiempo enviando ese departamento. Las 3 quick actions de Finanzas (Proyección Financiera, Cash Flow, Optimización de Costos) devuelven 500 siempre.

**Qué haría falta:** `ALTER TABLE quick_actions_results DROP CONSTRAINT quick_actions_results_department_check` + recrearlo incluyendo `'finanzas'` (y revisar si `'community'` sigue haciendo falta o es el nombre legacy de `'admin'` — ver dato en el comentario de la propia migración, línea 68: *"16 quick actions across 4 departments"*).

---

## r) Estado de agentes y contadores de Strategy siempre falsos — tablas/columnas que no existen en producción (nueva 2026-07-23)

Dos bugs de la misma familia, ambos verificados contra el esquema real:
- `lib/get-agent-status.ts:13-18` consulta `agent_sessions`, que **no existe en producción** (confirmado, `0031_baseline_missing_tables.sql:18-20` ya la marcaba como *"INEXISTENTE"*). El error se traga y siempre devuelve `'idle'` — las tarjetas de agente de los 5 departamentos nunca muestran actividad real.
- `lib/department-stats.ts:60-69,71-81` filtra `generation_queue` por `agent_type`/`agent_role`, columnas que **nunca existieron** en ninguna migración (0013→0038) — los contadores de "planes"/"ideas" de la página Strategy están fijos en 0.

Existe ya una implementación correcta y sin usar: `lib/department-stats.ts:95` consulta `agent_activity` (la tabla real) pero no tiene ningún caller en el repo.

**Qué haría falta:** sustituir el import de `get-agent-status.ts` por la función de `department-stats.ts:95` en las 5 páginas de departamento; para los contadores de Strategy, o se añade backfill de `agent_type`/`agent_role`/`agent_id` a `generation_queue`, o se rediseña la métrica sobre `agent_activity`.

---

## s) "Generar Reporte" (Quick Action Strategy) pierde 2 de 3 métricas seleccionadas en silencio (nueva 2026-07-23)

`StrategyQuickActions.tsx:37,41,45` tiene 3 checkboxes (`revenue`, `mrr`, `churn`) con el mismo `name="metrics"`, los 3 marcados por defecto. `QuickActionButton.tsx:41` construye el input con `Object.fromEntries(new FormData(...))`, que con claves duplicadas solo conserva la última — el backend recibe solo `"churn"` aunque el usuario vea los 3 marcados.

**Qué haría falta:** `name="metrics[]"` + leer todos los valores con `formData.getAll('metrics')` en vez de `Object.fromEntries`.

---

## t) Sin contrato anti-invención en Quick Actions ni en el chat de Agentes (nueva 2026-07-23)

Tras aplicar `GROUNDING_CONTRACT` + `EDITORIAL_CONTRACT` a los 11 tools de Toolkit y los 4 tipos de Documents (ver commit `748ca0f`), queda confirmado que **ninguna de las 25 quick actions ni de los 23 agentes** importa `GROUNDING_CONTRACT` (`lib/grounding/grounding-contract.ts`). Quick Actions tiene solo un guard ad hoc de una línea, repetido en 4/25 prompts (el clúster financiero) — las 21 restantes, incluida `analizar_competencia` (un análisis de mercado con nombres de competidores), no tienen ninguna instrucción anti-invención. El chat de agentes depende solo de frases sueltas de estilo dentro de cada system prompt (`lib/agent-prompts-i18n.ts`).

**Qué haría falta:** decidir si se extiende el contrato a Quick Actions (encaja bien, ya son prompts de un solo turno con JSON de salida) y evaluar una versión ligera para el chat de agentes (más difícil por ser conversacional y sin el mismo control de esquema de salida).

---

## u) Código muerto/huérfano detectado en la auditoría cruzada de Agentes (nueva 2026-07-23)

Lista condensada, cada uno verificado por grep sin callers salvo donde se indica lo contrario:
- `components/quick-actions/DepartmentQuickActions.tsx` — huérfano, y con un bug propio (`activeActionId` nunca coincide con `actionType`) que los 5 componentes reales ya corrigieron.
- `lib/generation/quick-action-prompts.ts:302-317,396-415` — `proyectar_revenue` y `auditar_innovacion`, prompt completo sin botón.
- `app/api/agent-interactions/route.ts` — tabla real (`agent_interactions`), pero el chat real de agentes nunca la llama; el *"Brand Brain refinement"* que promete el comentario no ocurre.
- `app/api/agent/context/retrieve/route.ts` — sin callers.
- `lib/department-tools.ts` + `lib/agent-archetypes.ts` — taxonomía de nombres/departamentos incompatible con `AGENT_METADATA`/`DEPARTMENT_METADATA` real; solo los usa la isla desconectada `app/(dashboard)/archetypes-demo/`.
- `app/api/agent/route.ts:13-17` — claves `MAX_TOKENS` para `oracle`/`radar`/`kairos`, agentes retirados en la consolidación del 2026-07-21.
- `AgentMetadata.department` (`'operaciones'`) vs `DepartmentMetadata.slug` (`'operations'`) — inconsistencia ES/EN, sin impacto hoy porque nada filtra por ese campo.
- `AdminQuickActions.tsx:22` declara `outputType:'text'` pero `QuickActionResult.tsx`'s `ContentPreview` no tiene caso para `'text'` — se renderiza como JSON crudo.
- `app/api/quick-actions/demo/route.ts`, `.../test/route.ts` — vestigios de una arquitectura de cola n8n ya reemplazada; gateados a no-producción, sin riesgo.
- `agent_documents` (chat de agentes) vs `client_documentation` (Quick Actions) — dos almacenes de "documentos de contexto para IA" que no se comunican entre sí.

**Qué haría falta:** limpieza cuando toque — ninguno es urgente, pero `archetypes-demo`/`department-tools.ts` es el que más riesgo tiene de reactivarse por error con nombres que ya no resuelven.

---

## Mapa de solapes funcionales — Toolkit / Documents / Quick Actions / Agentes (nueva 2026-07-23)

Auditoría completa en el artefacto publicado durante la sesión (Toolkit ↔ Documents ↔ Quick Actions ↔ Agentes). Resumen: no se encontró ningún agente con función exclusiva — casi todos tienen una quick action de departamento equivalente generando el mismo tipo de output, y varios (contenido, campañas, análisis competitivo, propuestas, informes) tienen además un tool de Toolkit o tipo de Documento haciendo la misma función con distinto nivel de rigor. El caso más claro: `analizar_competencia` (Quick Action, sin grounding) vs `competitive-analysis` (Toolkit, grounded + cita fuente) — mismo nombre de trabajo, fiabilidad muy distinta según el camino de entrada.

**Qué haría falta:** decisión de producto sobre si consolidar (un único motor de "análisis competitivo" reutilizado por los 3 puntos de entrada) o mantener los 3 caminos pero igualar el nivel de rigor.
