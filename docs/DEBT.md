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

## q) ✅ Resuelto — Quick actions de Finanzas Y Admin rotas en producción (2026-07-23)

Verificado con `INSERT`s reales contra Supabase producción, en dos pasadas: `department='finanzas'` viola `quick_actions_results_department_check` (primer hallazgo). Al verificar el fix con una generación real de `responder_ticket` (Admin), salió el mismo error — **`department='admin'` también viola el CHECK en producción**. El constraint real en prod solo permitía `('comercial','marketing','strategy','community')`; ni `'finanzas'` ni `'admin'` estaban, pese a que el comentario de `supabase/migrations/0015_fase1_recovery_schema.sql:68` dice *"16 quick actions across 4 departments"* incluyendo admin — el esquema vivo divergía del que describen las migraciones (mismo patrón que el hallazgo de `tool_connections`, punto p). Las 3 quick actions de Finanzas Y las 3 de Admin (`responder_ticket`, `crear_faq`, `crear_tutorial`) devolvían 500 siempre.

**Resuelto:** `supabase/migrations/0039_quick_actions_finanzas_dept.sql` (commit `982675c`) recrea el CHECK incluyendo tanto `'finanzas'` como `'admin'` (y mantiene `'community'` por si hay datos históricos con ese valor). Aplicada en producción por el usuario el 2026-07-23 y **verificada con un segundo `INSERT` real**: `admin`/`finanzas` ya pasan el CHECK (solo fallan por la FK de un `client_id` de prueba, esperado); un departamento inventado sigue correctamente bloqueado.

---

## r) ✅ Resuelto — Estado de agentes y contadores de Strategy siempre falsos (2026-07-23)

Dos bugs de la misma familia, ambos verificados contra el esquema real:
- `lib/get-agent-status.ts:13-18` consultaba `agent_sessions`, que **no existe en producción**, y además se llamaba con el cliente admin de service-role directamente desde componentes `'use client'` — esa key nunca está presente en el bundle del navegador, así que habría fallado igualmente aunque la tabla existiera. El error se tragaba y siempre devolvía `'idle'`.
- `lib/department-stats.ts:60-69,71-81` filtraba `generation_queue` por `agent_type`/`agent_role`, columnas que **nunca existieron** en ninguna migración (0013→0038) — los contadores de "planes"/"ideas" de Strategy estaban fijos en 0.

**Resuelto (commit `982675c`):** nueva ruta servidor `app/api/agent-status/route.ts` + `lib/agent-status.ts` (consulta `agent_activity`, la tabla real) + hook `lib/use-agent-statuses.ts`, cableado en las 5 páginas de departamento — mismo patrón ya usado por `/api/department-stats`/`useDepartmentStats`. `lib/get-agent-status.ts` eliminado (sin otros callers). Contadores de Strategy redefinidos sobre `agent_activity` (completados por agente de Strategy; ideas = solo `spark`). Verificado end-to-end con filas de `agent_activity` sembradas: `/api/agent-status` y `/api/department-stats` devuelven datos reales, no `idle`/`0` fijos.

---

## s) ✅ Resuelto — "Generar Reporte" perdía 2 de 3 métricas seleccionadas en silencio (2026-07-23)

`StrategyQuickActions.tsx:37,41,45` tiene 3 checkboxes (`revenue`, `mrr`, `churn`) con el mismo `name="metrics"`, los 3 marcados por defecto. `QuickActionButton.tsx:41` construía el input con `Object.fromEntries(new FormData(...))`, que con claves duplicadas solo conservaba la última — el backend recibía solo `"churn"` aunque el usuario viera los 3 marcados.

**Resuelto (commit `982675c`):** `QuickActionButton.tsx` ahora usa `formData.getAll(key)` por cada clave y colapsa a array solo cuando hay más de un valor — arregla la clase de bug para cualquier futuro formulario de quick action con campos repetidos, no solo este. Verificado con Playwright: el payload real enviado a `/api/quick-actions` ahora lleva `"metrics":["revenue","mrr","churn"]`.

---

## t) ✅ Resuelto (Quick Actions) / ⏳ pendiente (chat de Agentes) — Sin contrato anti-invención (2026-07-23)

Tras aplicar `GROUNDING_CONTRACT` + `EDITORIAL_CONTRACT` a los 11 tools de Toolkit y los 4 tipos de Documents (ver commit `748ca0f`), quedó confirmado que **ninguna de las 25 quick actions ni de los 23 agentes** importaba `GROUNDING_CONTRACT` (`lib/grounding/grounding-contract.ts`). Quick Actions tenía solo un guard ad hoc de una línea, repetido en 4/25 prompts (el clúster financiero) — las 21 restantes, incluida `analizar_competencia`, no tenían ninguna instrucción anti-invención. El chat de agentes depende solo de frases sueltas de estilo dentro de cada system prompt (`lib/agent-prompts-i18n.ts`).

**Resuelto para Quick Actions (commit `06a5e26`):** `GROUNDING_CONTRACT` cableado en el contexto compartido de `lib/generation/quick-action-prompts.ts`, más una regla nueva de "campo opcional en blanco → criterio profesional etiquetado `[RECOMENDACIÓN]`, nunca una cifra inventada" — y guardas específicas en los 6 casos con riesgo concreto (`crear_propuesta`, `generar_icp`, `crear_campaña_ads`, `generar_reporte` — que además ganó un campo `datos_reales` opcional porque antes no había forma de darle cifras reales —, `analizar_competencia`, `analizar_tendencias`). De paso, se revisaron los ~60 campos de formulario de las 5 quick actions departamentales: ~12 pasaron de obligatorios a opcionales donde el dato era secundario/de criterio (tono, contexto adicional, presupuesto aún no decidido), dejando obligatorios solo los campos sin los que la acción no tiene sobre qué generar. Verificado con generaciones reales dejando campos opcionales en blanco: presupuestos pendientes se marcan `[COMPLETAR: dato real]` en vez de inventarse, el análisis competitivo etiqueta cada afirmación con `[SUPUESTO]`, y un reporte sin `datos_reales` se queda cualitativo con huecos marcados en vez de cifras fabricadas.

**Pendiente:** el chat de Agentes (23 agentes, conversacional, sin el mismo control de esquema de salida que Quick Actions) sigue sin contrato — deliberadamente fuera de esta ronda, es un caso más difícil (no hay un JSON de salida que forzar, y el contrato tal como está escrito asume bloques de contexto tipo documento).

---

## u) Código muerto/huérfano detectado en la auditoría cruzada de Agentes (2026-07-23)

**Resuelto (commit `f82f1a5`):**
- `components/quick-actions/DepartmentQuickActions.tsx` (huérfano + bug propio) — eliminado.
- `app/api/agent/context/retrieve/route.ts` — eliminado, sin callers.
- `app/api/quick-actions/demo/route.ts`, `.../test/route.ts`, `app/webhook/test/route.ts`, `app/webhook/claude/route.ts` — eliminados, los 4 vestigios de la arquitectura de cola n8n ya reemplazada (el segundo par, en `app/webhook/`, se encontró de rebote al buscar referencias a `proyectar_revenue`; ninguno tenía caller real).
- `lib/generation/quick-action-prompts.ts` — `auditar_innovacion` cableada como 6ª quick action de Strategy (prompt ya existía, solo faltaba el botón); `proyectar_revenue` eliminada en vez de cablearse (duplica `proyeccion_financiera` de Finanzas con un esquema de salida peor — no aporta cablearla también).
- `AdminQuickActions.tsx` `outputType:'text'` — `QuickActionResult.tsx`'s `ContentPreview` ya tiene caso para `'text'`.
- `app/api/agent/route.ts:13-17` — claves `MAX_TOKENS` de `oracle`/`radar`/`kairos` eliminadas.

**Pendiente, sin urgencia:**
- `AgentMetadata.department` (`'operaciones'`) vs `DepartmentMetadata.slug` (`'operations'`) — inconsistencia ES/EN, sin impacto hoy porque nada filtra por ese campo. Bajo riesgo, no se ha tocado.
- `agent_documents` (chat de agentes) vs `client_documentation` (Quick Actions) — dos almacenes de "documentos de contexto para IA" que no se comunican entre sí. Decisión del usuario (2026-07-23): dejarlo documentado, no unificar por ahora.

**Decididas por el usuario (2026-07-23) — no se ejecutan en esta ronda pero SÍ se retoman:**
- **`archetypes-demo` + `lib/agent-archetypes.ts` + `lib/department-tools.ts`**: el usuario confirmó que el sistema de 5 "arquetipos" (interfaces de chat distintas según el tipo de trabajo del agente — Explorador, Analista, Arquitecto, Centinela, Estudio) le parece una idea válida y trabajada, y quiere integrarla al producto real más adelante ("habría que pensarla un poco más para integrarla, pero yo la haría"). **No se toca ahora** — sigue siendo código aislado con taxonomía de nombres incompatible con `AGENT_METADATA` real, pero ya no es "código huérfano a limpiar", es una idea de roadmap pendiente de diseñar antes de conectarla.
- **`app/api/agent-interactions/route.ts`** (feedback 👍/👎): el usuario confirmó que quiere esto — **implementado el mismo día** (ver más abajo), no queda pendiente.

---

## Feedback del usuario implementado el mismo día (2026-07-23)

Tras explicar el mapa de solapes y las piezas a medio construir, el usuario pidió 3 cosas concretas — las 3 implementadas y verificadas:

**1. Los agentes de chat ahora pueden buscar en internet.** Antes, el chat de los 23 agentes no tenía ningún acceso a información real (a diferencia de 5 herramientas grounded de Toolkit) — o inventaba con cautela ("no tengo ese dato") o simplemente no podía saber nada actual. Ahora usan tool-use real de Claude: `app/api/agent/route.ts` define una tool `web_search` (reutiliza `lib/grounding/web-research.ts`, mismo Tavily que usa Toolkit), con un loop de hasta 3 búsquedas por turno antes de responder. `AGENT_CHAT_GROUNDING_NOTE` actualizada para decir "busca antes de decir que no lo sabes". Verificado en vivo.

**2. Feedback 👍/👎 en el chat de agentes, con memoria real.** Cada respuesta del asistente en `/agent/[role]` tiene ahora botones de "útil"/"no útil" (`lib/hooks/useAgentChat.ts:sendFeedback`, UI en `app/(dashboard)/agent/[role]/page.tsx`). Se guarda en `agent_interactions` — tabla que ya existía pero cuya ruta (`app/api/agent-interactions/route.ts`) usaba el cliente de navegador sin sesión (nunca habría podido escribir de forma fiable); reescrita con `adminClient()` + auth real. Cierre del loop: `app/api/agent/route.ts` ahora lee las últimas 3 interacciones marcadas `not_helpful` para ese agente/cliente y las inyecta en el system prompt para que no repita el mismo error — la idea original del comentario *"triggers Brand Brain refinement"* (que nunca se construyó) queda resuelta de forma más simple y sí funcional.

**3. El botón de "me gusta" de Quick Actions, que ya existía visualmente pero era puro estado local (`setLiked`, sin persistir nunca), ahora escribe de verdad en `quick_actions_results.liked_by_user`** (columna que existía en el esquema desde el principio, sin ninguna ruta que la usara). Nuevo `PATCH /api/quick-actions` + carga el estado inicial al abrir un resultado ya generado.

---

## Mapa de solapes funcionales — Toolkit / Documents / Quick Actions / Agentes (2026-07-23)

Auditoría completa en el artefacto publicado durante la sesión (Toolkit ↔ Documents ↔ Quick Actions ↔ Agentes). Resumen: no se encontró ningún agente con función exclusiva — casi todos tienen una quick action de departamento equivalente generando el mismo tipo de output, y varios (contenido, campañas, análisis competitivo, propuestas, informes) tienen además un tool de Toolkit o tipo de Documento haciendo la misma función con distinto nivel de rigor. El caso más claro: `analizar_competencia` (Quick Action) vs `competitive-analysis` (Toolkit, grounded + cita fuente) — mismo nombre de trabajo, fiabilidad muy distinta según el camino de entrada.

**Decisión del usuario (2026-07-23)**: no consolidar los 3 caminos por ahora — Quick Actions y Toolkit ya le parecen bien tal como están. En su lugar, cerrar la brecha real: dar a los agentes de chat acceso a búsqueda web (ver arriba, ya implementado) para que no sean el eslabón débil del trío.

---

## v) ✅ Resuelto — RLS bloqueaba en silencio a todos los usuarios reales no-admin (2026-07-23)

Durante la auditoría de Ventas/Pipeline se detectó que las lecturas RLS desde el navegador devolvían vacío para clientes reales. La política propia de `mira_project_access` (`"mira_project_access: users see own"`, editada en algún momento directamente en el Dashboard — no coincidía con ningún archivo de migración) resolvía `user_id` vía `SELECT mira_users.id FROM mira_users WHERE mira_users.auth_id = auth.uid()`, un patrón puente que la migración `0016_unify_auth_users.sql` dejó obsoleto al pasar `mira_project_access.user_id` a referenciar `auth.users(id)` directamente — pero la política nunca se actualizó para reflejarlo.

Confirmado en vivo: `mira_users` tiene 0 filas. De las 7 cuentas reales, solo la única con `user_metadata.plan = 'admin'` (`carlos@startupsfactory.es`) pasaba esta política alguna vez. Las otras 4 cuentas de cliente reales llevaban bloqueadas desde que la política existe — y por cascada (subconsultas de otras tablas contra `mira_project_access` se evalúan bajo el RLS del propio usuario), esto arrastraba a cualquier otra tabla cuya política dependiera de `mira_project_access`.

**Resuelto (migración `0040_fix_mira_project_access_rls.sql`, aplicada en vivo vía SQL Editor):** sustituida la subconsulta muerta por `user_id = auth.uid()` directo, sin tocar la rama de `plan = 'admin'`. Verificado con un barrido de las 22 tablas cuyas políticas dependen de `mira_project_access`: 12 con datos reales dieron paridad exacta entre lectura con service role y lectura RLS-scoped con un usuario de prueba real (no-admin); el resto sin datos para probar. No se encontró el mismo patrón de `mira_users` en ninguna otra política del proyecto.

**Hallazgo colateral, sin relación con RLS, sin resolver:** 160 de las 161 filas de `leads` tienen `client_id = '00000000-0000-0000-0000-000000000001'`. Corrección sobre la nota anterior: no son datos huérfanos de test — ese UUID es `SF_CLIENT_ID`, el sentinel hardcodeado en `apps/sf-sales-engine/clients/sf-internal/config.yaml` para la prospección interna de Venture Builders de Startup Factory. Es dato legítimo de SF, simplemente no pertenece a ningún cliente de MIRA (comparten la misma tabla `leads` en el proyecto Supabase compartido). No bloquea nada, no requiere limpieza.

---

## w) ✅ Resuelto — tool_connections/affiliate_tracking/tool_setup_progress con FK a la tabla equivocada (2026-07-23)

Descubierto al construir Discovery "modo profundo" (Apollo + Hunter): las 3 tablas de `0010_tool_integrations.sql` (backfillada en `0038` tras descubrir que nunca se había aplicado a producción) tienen `client_id REFERENCES brand_profiles(id)` — pero `brand_profiles` tiene su propio `id` independiente (PK propia), no comparte valor con `clients.id`. El vínculo real al cliente vive en `brand_profiles.client_id`, una columna aparte. Todo el código de la app (`getClientApiKey.ts`, `app/api/integrations/tools/route.ts`, `app/api/integrations/affiliate/route.ts`) siempre pasó `clientId` = `clients.id` (el mismo id canónico que usan `leads`, `icp_profiles`, `mira_project_access`, etc.) — que nunca coincide con `brand_profiles.id`.

Confirmado en vivo: los 5 clientes reales tienen `brand_profiles.id` distinto de su `clients.id`, y las 3 tablas tenían 0 filas — la página `/integrations` (Canva, Anthropic, OpenAI, Freepik, Magnific) **nunca ha funcionado para ningún cliente real**; cada intento de "conectar" fallaba con una violación de FK silenciada detrás de un genérico "Failed to connect tool".

**Resuelto (migración `0041_fix_tool_connections_fk.sql`, aplicada en vivo vía SQL Editor):** las 3 FK ahora apuntan a `clients(id)` directamente. Como las tablas estaban vacías, corrección sin riesgo de datos. De paso, se simplificó la política RLS de `tool_connections` (escrita en `0037_rls_hardening.sql` alrededor del join de 2 saltos que este fix invalidaba) al mismo patrón de 1 salto que usan `leads`/`mira_projects`/`drive_connections` — dejarla como estaba habría vuelto a bloquear en silencio a todos los usuarios reales, la misma clase de bug que **(v)**. Verificado en vivo: inserción real en las 3 tablas para un cliente real, y lectura RLS-scoped con un usuario de prueba no-admin (no service role).

---

## x) ✅ Resuelto — `usage_log` de MIRA nunca escribió una fila, colisión de nombre con `apps/sf-sales-engine` (2026-07-23)

Al preparar la base técnica de Fase 2 (cap de generaciones/mes) se detectó que `usage_log` tenía 0 filas desde siempre, para cualquier cliente. Primera causa encontrada: `logUsage()` (`lib/anthropic-client.ts`) insertaba sin `await` (fire-and-forget) — en el modelo serverless de Vercel el lambda puede congelarse antes de que el insert llegue a Supabase. Se corrigió (`await` en las 5 llamadas: `agent/route.ts`, `comercial/{qualify,proposal}/route.ts`, `openai-image.ts`) — pero al verificar en vivo con una llamada real de principio a fin, el insert seguía fallando: `PGRST204 — Could not find the 'model' column of 'usage_log' in the schema cache`.

Causa real: `apps/sf-sales-engine` comparte el mismo proyecto Supabase (`nnevhtfxuawexliwlbmh`) y ya tiene su propia tabla `usage_log` (`003_data_pipeline.sql` — `source`, `records_fetched`, `api_cost_usd`, `run_id`; escrita activamente por `packages/enrichment/cache.py` para el cost-tracking de Apollo/Hunter/Tavily). La migración de MIRA (`0033_usage_log.sql`, `CREATE TABLE IF NOT EXISTS usage_log`) llevaba desde el 2026-07-19 siendo un no-op silencioso porque la tabla ya existía con otro dueño — MIRA nunca pudo crear sus columnas (`route`, `model`, `input_tokens`, `output_tokens`, `used_client_key`). Efecto colateral: los 3 dashboards de consumo (`app/api/{admin,home}/overview/route.ts`, `app/api/usage/summary/route.ts`) llevaban igual de vacíos desde siempre, sin que nadie lo notara.

**Resuelto (migración `0042_mira_usage_log.sql`, aplicada en vivo):** tabla nueva `mira_usage_log` con el esquema que MIRA siempre necesitó, sin tocar la `usage_log` de sf-sales-engine (activa, con datos reales). Los 4 sitios de MIRA que referenciaban `usage_log` repuntados a `mira_usage_log`. Verificado en vivo de punta a punta con Playwright: login real, mensaje real a un agente, respuesta real de Claude, y confirmación de una fila nueva y correcta en `mira_usage_log` (antes: 0 filas incluso tras una llamada exitosa).

---

## y) ✅ Resuelto — `approval_queue`/`post_history`/`alerts`/`agent_interactions` sin RLS, `agent_interactions` con fuga cruzada de datos reales confirmada (2026-07-24)

Auditoría completa de cobertura RLS (`docs/RLS_AND_MIGRATIONS_STATE.md`, escrita esta misma fecha) encontró 4 tablas sin ningún `ENABLE ROW LEVEL SECURITY` — `0037_rls_hardening.sql` había endurecido 5 de las 6 tablas "baseline" de `0031_baseline_missing_tables.sql` pero dejó fuera exactamente estas 4. Verificado en vivo **antes** de aplicar el fix: un usuario de prueba con grant sobre un único cliente pudo leer una fila real de `agent_interactions` perteneciente a **otro cliente real** (Dadybox) sin ningún bloqueo — no era deuda técnica histórica, era una fuga de datos activa entre inquilinos.

Aplicado `0045_rls_missing_tables.sql` (patrón estándar) para las 4 tablas. Al reverificar, `agent_interactions` **seguía filtrando** pese al fix — resultó tener 2 políticas adicionales activas en producción, `agent_interactions_select_public` (`USING (true)`) y `agent_interactions_insert_public` (`WITH CHECK (true)`), **ninguna de las dos presente en ningún fichero de migración** — creadas a mano en el Dashboard de Supabase, mismo patrón exacto que la incidencia de `mira_project_access` de esta misma sesión (ver memoria `mira-rls-incident-2026-07`). Como las políticas permisivas del mismo comando se combinan con `OR`, la política correcta convivía sin efecto con una completamente abierta. Confirmado que `app/api/agent-interactions/route.ts` usa `adminClient()` (service role) tanto para leer como escribir, así que las 2 políticas `_public` no tenían ningún propósito legítimo — pura superficie de ataque sin ningún caller real dependiendo de ellas. Ambas eliminadas. Verificado en vivo tras el fix completo: lectura cruzada bloqueada, intento de inserción cruzada rechazado con `new row violates row-level security policy`, lectura del propio cliente intacta.

**Lección**: una auditoría basada en `grep` sobre ficheros de migración no puede detectar políticas creadas directamente en el Dashboard y nunca versionadas — ni cuando faltan (esta mañana) ni cuando sobran y son peligrosamente permisivas (este caso). Ver la sección 2 de `docs/RLS_AND_MIGRATIONS_STATE.md` para el detalle completo.
