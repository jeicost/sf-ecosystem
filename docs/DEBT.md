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

## o) ✅ Resuelto (mecanismo), gateado sin activar — Enforcement de plan roto en dos capas (nueva 2026-07-23, corregido en "base técnica" antes de esta entrada quedar marcada, aviso de obsolescencia añadido 2026-07-24)

*(Esta entrada describía el regex fantasma original — quedó desactualizada sin marcarlo; corregido ahora para que la próxima sesión no parta de un estado que ya no es real.)*

`proxy.ts` usaba un regex con slugs en español que no existen como rutas reales — nunca bloqueaba nada. Corregido en la pieza "base técnica" de Fase 2 (commit `c887657`): ahora usa `getActiveSectionFromPath` (`lib/sections.ts`), la misma fuente de verdad que el resto de la app, cubriendo Marketing correctamente pese a no tener prefijo de ruta común. Como el middleware corre en toda petición (incluida navegación directa por URL), este fix también cierra el acceso directo por URL que antes eludía el candado visual del frontend — no hizo falta añadir guards por página aparte.

Sigue **gateado y apagado** (`ENFORCE_PLAN_LIMITS` sin definir en Vercel prod) — construido a propósito así para no afectar a la beta activa. El 2026-07-24 se verificó contra uso real de cada cliente (ver [[mira-fase2-decisiones-2026-07-24]]) y se arregló el único bloqueante encontrado (`PLAN_SECTIONS` no incluía `'operations'` en ningún plan de cliente, ver (cc)). **No queda ningún motivo técnico para no activarlo** — solo falta que el usuario decida el momento.

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

---

## z) ✅ Resuelto — Quick Actions: preview en JSON crudo, guardado en memoria indetectable, guardado en Drive borraba el resultado (2026-07-23/24)

Feedback real de Natalia (Dadybox, beta) por WhatsApp: las quick actions "crear post"/"crear newsletter" mostraban "cosas de código" en la preview, y ni "guardar en memoria" ni "guardar en Drive" parecían funcionar. Investigación confirmó 4 causas distintas, las 4 corregidas (commit `6446692`):

1. `QuickActionResult.tsx` compartía un único estado `error` entre fallo de generación y fallo de guardado — un fallo al guardar en Drive sustituía **todo el resultado ya generado** por una tarjeta de error. Separado en `error` (generación, bloquea todo, sin cambios) vs `saveError`/`saveNote` (guardado, aviso inline, nunca oculta el resultado).
2. Project Memory no tenía ningún enlace de navegación en toda la app — el guardado funcionaba, pero era un callejón sin salida. Añadido enlace global en el sidebar + enlace directo "Ver en Memoria" tras guardar.
3. `ContentPreview` volcaba `JSON.stringify` crudo (`outputType: 'json'`/`'document'` mal encajado) para prácticamente todas las quick actions salvo `responder_ticket`. Confirmado el mismo desajuste en ~19 quick actions de los 5 departamentos, no solo las 2 reportadas. Añadidos renderizadores `social_post`/`newsletter` a medida + un renderizador genérico `structured` (cabecera + campos formateados por tipo) que sustituye el volcado crudo en el resto — mismo criterio aplicado al HTML que se exporta a Drive (`generateHTML()`).
4. `getClientDriveAccessToken` no distinguía "cliente sin Drive conectado" de "conectado pero sin scope de escritura" (`hasDriveWriteScope`, construido en sesión anterior para Brand Brain pero nunca conectado aquí) — al fallar, caía en silencio al Service Account de la plataforma sin decir por qué.

Verificado en vivo con usuario QA real sobre el cliente real de Dadybox: generación legible en Marketing (`crear_post`, `crear_newsletter`), Comercial (`calificar_reply`), Finanzas (`proyeccion_financiera`) y Strategy (`brainstorm_ideas`) — 4 departamentos distintos, formas de JSON muy distintas, todas renderizadas de forma legible. Guardado en memoria + enlace confirmados. Fallo de Drive confirmado que ya no borra el resultado.

**Hallazgo adicional, sin resolver — el fallback de Drive (Service Account) está roto de raíz, no es solo un problema de mensaje**: diagnosticado en vivo que `GOOGLE_DRIVE_FOLDER_ID` apunta a una carpeta llamada "MIRA Exports" en el **My Drive personal** de la service account (`mira-drive-uploader@mira-portal.iam.gserviceaccount.com`), no a una Shared Drive — confirmado consultando la propia API de Drive (`driveId` ausente en la respuesta). Los Service Accounts tienen 0 cuota de almacenamiento propia; cualquier intento de crear un fichero ahí falla con `Service Accounts do not have storage quota...`, sea cual sea el código. Añadido `supportsAllDrives: true` a la llamada (necesario en cualquier caso, pero no suficiente por sí solo) y limpiado el mensaje de error para que ya no muestre el texto crudo de Google al usuario final. **Pendiente de decisión del usuario**: para que el fallback de plataforma funcione de verdad hace falta crear una Shared Drive de Google Workspace y compartirla con esa service account (requiere Workspace, no una cuenta personal) — mientras tanto, el único camino que funciona hoy es que cada cliente conecte su propio Google Drive desde `/integrations` (ese camino sí está verificado correcto en código: scope real, `supportsAllDrives` ya presente).

---

## aa) ⚠️ Incidente — borrado accidental de `quick_actions_results` de un cliente real en producción durante limpieza de QA (2026-07-23)

Al limpiar los artefactos de una sesión de QA (usuario, grant) contra el cliente real de Dadybox, un script de limpieza incluyó un segundo `delete()` sobre `quick_actions_results` filtrado solo por `client_id` — sin acotar por los IDs exactos de las filas de prueba. Como `client_id` es el cliente real (no un sandbox), el delete borró **todas** las filas de esa tabla para Dadybox, no solo las de prueba. El proyecto Supabase (`nnevhtfxuawexliwlbmh`) está en plan Free, sin backups ni Point-in-Time Recovery — confirmado en el Dashboard, sin ningún camino de recuperación.

Vía logs de producción de Vercel (que sí conservan metadata aunque no contenido) se confirmó que 5 de esas filas correspondían a generaciones reales del 2026-07-23 entre las 15:27–16:04 UTC, ajeno a cualquier prueba de esta sesión (las pruebas de QA solo tocaron `localhost`, nunca producción) — casi con toda seguridad la sesión real de Natalia justo antes de su feedback por WhatsApp. No se pudo recuperar el contenido generado (los logs de Vercel solo capturan lo que el código pasa a `console.error`/`console.warn`, no el cuerpo de la petición/respuesta). `project_memory` no se vio afectada (tabla distinta, nunca tocada).

**Lección — ver también [[feedback-production-db-changes]]**: al limpiar datos de prueba contra una tabla multi-tenant en producción, acotar **siempre** por el ID exacto de cada fila creada durante la prueba (guardado de antemano), nunca por una columna compartida como `client_id`/`project_id` aunque parezca "obviamente" solo iba a afectar a las filas de hoy. Hacer un `SELECT` de solo lectura inmediatamente antes de cualquier `delete()` contra producción, y revisar su resultado, no asumir el alcance.

---

## bb) ✅ Resuelto — `GET /api/integrations/tools` rompía con 500 para todos los clientes reales, dejaba `/integrations` mostrando "desconectado" aunque el cliente sí conectó la herramienta (auditoría + fix 2026-07-23/24)

Durante la auditoría de conexiones (Drive, OpenAI, Canva, Zoho) se encontró y **verificó en vivo contra producción** un bug activo hoy, no solo teórico. `app/api/integrations/tools/route.ts:46-52` consulta `brand_profiles` así:

```ts
const { data: profile, error: profileError } = await db
  .from('brand_profiles').select('user_id').eq('id', clientId).single()
if (profileError) throw profileError
```

`clientId` aquí es siempre `clients.id` (el id canónico que pasa toda la app, confirmado por el propio comentario de la migración `0041_fix_tool_connections_fk.sql`) — pero `brand_profiles.id` es una PK propia, distinta. Confirmado en vivo con el cliente real de Dadybox: `brand_profiles` tiene una fila con `id=b2d2c0c3-...` para `client_id=e664873b-...` (el id real de Dadybox) — la consulta nunca puede encontrar coincidencia, así que `.single()` siempre falla.

**Segundo bug independiente, no detectado por la auditoría inicial, encontrado al verificar en vivo**: la consulta también falla con `42703: column brand_profiles.user_id does not exist` — la columna `user_id` que el código asume que existe en `brand_profiles` directamente **no existe en el esquema real**. Aunque se arreglara el `.eq('id', ...)` para usar `client_id` en vez de `id`, seguiría rompiendo por esta segunda causa.

Como el handler hace `if (profileError) throw profileError`, el `GET` entero devuelve 500 (`route.ts:67-70`, catch genérico → `{error:'Failed to fetch tools'}`). `useToolConnections.ts:26-38` captura ese fallo en un estado `error` que **nunca se renderiza en `app/(dashboard)/integrations/page.tsx`** — no hay ningún banner ni mensaje. Efecto práctico: `connectedTools` se queda en `[]` para siempre, y **la página de Integraciones muestra todas las herramientas como "desconectado" para todo cliente real, incluso las que sí conectó correctamente** (el `POST` de conexión sí escribe bien en `tool_connections` — verificado, ese camino no está roto). Un cliente que conecta su OpenAI hoy la verá "desconectada" la próxima vez que cargue la página, aunque la generación de imágenes siga funcionando por debajo (esa lee directo de `tool_connections` vía `getClientApiKey`, no pasa por este endpoint roto).

**Resuelto (commit `077fe79`)**: en vez de reparar la consulta a `brand_profiles` (que no tiene ninguna columna que enlace con el usuario dueño), se eliminó el round-trip entero. `requireClientAccess` (`lib/auth-server.ts`) ya valida la sesión y devuelve el `user` autenticado con `user_metadata.plan` — exactamente el mismo patrón que usan `proxy.ts`, `lib/resolve-client.ts` y todos los demás puntos de enforcement de plan del código. El handler simplemente usa ese `user` ya validado en vez de volver a consultar la BD. Investigado con un agente de exploración antes de tocar nada: confirmado que ninguna tabla (`clients`, `brand_profiles`, `mira_project_access`) tiene un concepto de "usuario dueño" distinto del usuario de sesión — el plan siempre ha sido una propiedad del usuario autenticado, no del cliente.

Verificado en vivo con una sesión QA real contra el cliente real de Dadybox: la respuesta pasó de 403 (mal montado el test, `user_metadata.client_id` no coincidía) a 200 una vez corregido el metadata de prueba, con la página renderizando completa (17 herramientas, sin banner de error, estadísticas de uso reales visibles). No se pudo crear/borrar un usuario Auth nuevo para la verificación — la Admin API de GoTrue devuelve intermitentemente `invalid JWT: unrecognized JWT kid` con la `SUPABASE_SERVICE_ROLE_KEY` actual (createUser/deleteUser fallan más seguido que updateUser/getUserById) — se reutilizó un usuario QA huérfano de una ronda anterior en su lugar. Esto mismo bloqueó antes el borrado del usuario QA de la incidencia de `quick_actions_results` (ver (aa)) — **posible deuda de rotación de claves de Supabase pendiente de investigar aparte**, no se ha llegado a la causa raíz.

---

## cc) ✅ Resuelto — `/admin/users` renderizaba siempre vacío (consultaba `mira_users`, 0 filas) + PLAN_SECTIONS no incluía 'operations' en ningún plan de cliente (2026-07-24)

Al construir la vista de "clientes y usuarios" del panel de super admin (pedida por el usuario para administrar planes sin scripts), se encontró que `app/(dashboard)/admin/users/page.tsx` ya existía pero consultaba `mira_users` + `mira_projects` + `storage_limits` — el modelo de datos legacy pre-`0016_unify_auth_users.sql`. `mira_users` tiene 0 filas desde que el auth se unificó sobre `auth.users` (confirmado antes en esta misma sesión) — la página llevaba renderizando una lista vacía de usuarios sin que nadie lo notara.

**Resuelto (commit `b5b5142`)**: reescrita contra el modelo real (`clients` + `mira_project_access` + `auth.users.user_metadata.plan`). Nuevo `GET /api/admin/clients-users` (lista clientes con sus usuarios/rol/plan reales) y `PATCH /api/admin/users/plan` (cambia el plan de un usuario, solo super_admin), ambos con reintentos ante el fallo intermitente de la Admin API de GoTrue (ver `docs/DEBT.md` (bb) y memoria `supabase-service-role-gotrue-quirk`). Verificado en vivo: 5 clientes/7 accesos reales mostrados correctamente, cambio de plan confirmado persistido tras recargar.

De paso, al construir esta vista se encontró que **`PLAN_SECTIONS` (`lib/plans.ts`) no incluía `'operations'` (departamento Admin/Soporte) en ningún plan de cliente real** — solo `super_admin` — pese a presentarse en toda la app como un departamento normal, al mismo nivel que Marketing/Comercial/Estrategia/Finanzas (`lib/department-meta.ts`, sidebar, home). Si se hubiera activado `ENFORCE_PLAN_LIMITS` sin arreglar esto, cualquier cliente real habría quedado bloqueado de Admin/Operaciones en cuanto lo usara, sin excepción de plan. Confirmado con el usuario (recomendación aceptada): añadido a todos los planes, igual que Marketing.

También se cambió `proxy.ts` para que el redirect de enforcement lleve el motivo (`?blocked=<sección>&plan=<actual>`) en vez de un bounce mudo a `/home`, con un banner nuevo en Home que explica qué plan hace falta y da un contacto real — evita el mismo patrón de confusión silenciosa que causó el feedback original de Natalia.

**Actualización 2026-07-24 (más tarde el mismo día)**: `b5b5142` y todos los commits posteriores ya están desplegados en producción (ver (dd)). `ENFORCE_PLAN_LIMITS` sigue sin activarse, pero ya no hay ningún motivo técnico para no hacerlo — es pura decisión de timing del usuario. Ver [[mira-fase2-decisiones-2026-07-24]].

---

## dd) ✅ Resuelto — CI redesplegaba las 7 apps sin filtrar + un fallo bloqueaba el resto + mira-landing llevaba semanas sin desplegar (2026-07-24)

Al empujar un lote grande (36 commits) de esta sesión a `main` por primera vez en un tiempo, se encontraron y arreglaron 3 problemas reales del propio pipeline, no del código de MIRA:

1. **`deploy.yml` desplegaba las 7 apps del monorepo en cada push a `main`, sin filtrar por carpeta** — un push solo de MIRA reconstruía y redesplegaba también startup-factory-web, ai-agency-sf-next, sf-cms, sf-crm y sf-links sin ningún cambio real. Arreglado (`a7ea5c1`) con un job `changes` nuevo usando `dorny/paths-filter@v4`; cada paso de deploy ahora depende de `needs.changes.outputs.<app> == 'true'`. `packages/**` marca todas las apps como cambiadas (conservador, cualquiera puede depender de un paquete compartido). El checkout del job de filtrado necesita `fetch-depth: 0` — un clone superficial puede no tener el SHA `before` del evento push contra el que compara `dorny/paths-filter`, sobre todo con un push de muchos commits.

2. **Un fallo en el deploy de una app bloqueaba en silencio el resto** — descubierto en la primera ejecución real del filtro nuevo: falló el deploy de mira-portal (ver punto 3) y todos los pasos posteriores del mismo job —incluido mira-landing, que sí tenía cambios reales listos— se saltaron sin más, porque `if:` implica `&& success()` por defecto en GitHub Actions. Arreglado (`30be46c`) añadiendo `(success() || failure())` a la condición de cada paso de deploy, para que corran de forma independiente; el job sigue reportando fallo si algún paso falla.

3. **El paso de deploy de mira-portal en el Action falla con "Could not retrieve Project Settings"** — los secrets `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID_MIRA` no resuelven un proyecto válido (probablemente `VERCEL_TOKEN` caducado, sin confirmar — no se pueden leer valores de secrets para diagnosticar más). **No bloquea despliegues reales**: confirmado en vivo que la integración nativa de Git de Vercel despliega mira-portal correctamente y casi al instante en cada push, independiente de este Action. El paso del Action es redundante para mira-portal, pero conviene arreglarlo o quitarlo porque deja "Deploy to Vercel" siempre en rojo. Requiere que el usuario revise/regenere el token de Vercel — no es un fix de código.

4. **`apps/mira-landing` (la landing de marketing de MIRA, distinta de mira-portal) no tenía ningún proyecto de Vercel enlazado**, y `docs/PROJECT_REGISTRY.md` ya lo marcaba explícitamente "AMBIGUOUS — DO NOT DEPLOY" (riesgo real de desplegar sobre el proyecto equivocado, posiblemente mira-portal). Confirmado con el usuario: el proyecto real es `mira-landing` (`mira-landing-chi.vercel.app`, mismo org que mira-portal). Enlazado (`vercel link --project mira-landing`), registro actualizado y desplegado de verdad (`e687d20` + `vercel --prod` en vivo) — las páginas de Términos/Privacidad/Cookies y el banner de consentimiento construidos antes en esta misma sesión llevaban commiteados pero nunca publicados hasta este momento. Sin integración de git — solo se despliega con `vercel --prod` manual desde `apps/mira-landing`, igual que sf-cms.

---

## ee) ✅ Resuelto — Chat de alta de clientes construido; de paso, extracción de PDF rota en 2 rutas existentes (nueva, sin arreglar en esas rutas) (2026-07-24)

Construido el chat de onboarding pedido por el usuario (`/admin/onboarding`) — el admin pega la info de un cliente nuevo + adjunta documentos/imágenes, y el sistema (tool-use real con Claude, mismo patrón que `web_search` en `app/api/agent/route.ts`) crea el cliente + Brand Brain completo, con un merge profundo de `brand_data` para no pisar campos ya guardados en turnos posteriores, y dos niveles de ejecución: guardado automático de contenido (Brand Brain/referencias/memoria) sin clic, y creación de acceso real (usuario+grant) solo tras confirmación explícita en la UI, nunca por una respuesta de chat parseada. Sustituye un intento previo completo pero nunca conectado a ninguna UI (`app/api/brand-brain/chatbot/{route,init}.ts`, borrado) que tenía bugs de esquema reales sin detectar — su allowlist de columnas para `project_memory` y `agent_documents` usaba nombres que no existen en las tablas reales.

**Hallazgo de paso, no arreglado (fuera de alcance de esta ronda)**: las rutas de subida de documentos ya existentes (`app/api/brand-brain/upload-document/route.ts`, `app/api/agent/[role]/upload-document/route.ts`) aceptan PDF en su lista de tipos permitidos pero hacen `Buffer.from(arrayBuffer).toString('utf-8')` sobre el archivo — un PDF no es texto UTF-8, así que el "texto extraído" de cualquier PDF real subido por esas rutas es basura, silenciosamente, sin ningún error. El chat de onboarding nuevo NO hereda este bug — usa `pdf-parse@2.4.5` (ya estaba en `package.json`, instalado pero sin usar en ningún sitio) para una extracción real. Las 2 rutas existentes se quedan con el bug tal cual, sin tocar.

**También encontrado y arreglado de paso**: `clients.slug` nunca tuvo un constraint único a nivel de BD (solo un check-then-insert a nivel de aplicación en `scripts/onboard-full-client.mjs`) — añadido en la migración `0047_onboarding_chat.sql`, verificado antes en vivo que los 6 clientes reales no tenían duplicados ni nulos.

---

## ff) ✅ Resuelto — la migración 0044 nunca se aplicó: conectar el Drive propio del cliente estaba roto de raíz (2026-07-24)

Al responder una pregunta directa del usuario ("¿ahora cada cliente puede conectar su Google Drive?") se verificó en vivo en vez de confiar en la auditoría anterior de esta misma sesión (que daba ese camino por bueno solo por lectura de código) — y no lo estaba. `drive_connections` **no tenía la columna `granted_scopes`** en producción pese a que `supabase/migrations/0044_drive_connections_granted_scopes.sql` la añade — la migración se escribió pero nunca se ejecutó contra la BD real (mismo patrón que `brand_documents`/`tool_connections` en rondas anteriores). Confirmado con un test de escritura real: cualquier `UPDATE`/`INSERT` con `granted_scopes` en el payload fallaba con `PGRST204`. El callback de OAuth (`app/api/brand-brain/drive/callback/route.ts`) siempre incluye ese campo al guardar — así que **conectar el Drive propio de un cliente estaba roto de raíz**: cualquier cliente que completara el consentimiento de Google se encontraba con el callback fallando al guardar el resultado.

Las 5 filas existentes de `drive_connections` (una por cada cliente real) se crearon todas en el mismo minuto el 2026-07-19 — no tiene pinta de ser 5 conexiones reales completadas por 5 clientes distintos, sino datos de seed/prueba de una sesión anterior.

**Resuelto**: aplicada la migración `0044` (ya existía el fichero, solo faltaba ejecutarla) — `ALTER TABLE drive_connections ADD COLUMN IF NOT EXISTS granted_scopes text[]`. Verificado en vivo: la escritura ya no falla, y las 5 filas existentes quedan con `granted_scopes: null` (el default conservador correcto de la propia migración — se tratan como "necesita reconectar" hasta que el cliente pase por el flujo real y quede registrado qué scope concedió). **Efecto práctico**: la conexión de Drive por cliente ya funciona para conexiones nuevas, pero los 5 clientes con una fila existente necesitan reconectar una vez para que su export a su propio Drive funcione — hasta entonces caen al fallback de Service Account, que sigue roto aparte (ver (z), Shared Drive pendiente).

**Aviso de higiene, no repetir**: durante la investigación se ejecutó por descuido un `select('*')` sobre `drive_connections`, que imprimió en claro el `access_token`/`refresh_token` de OAuth reales de un cliente (Dadybox) en la salida de terminal. Se avisó al usuario para que revoque el acceso de MIRA desde la cuenta de Google del cliente y reconecte. Lección: nunca seleccionar `*` en una tabla que se sabe que guarda tokens/secretos — pedir solo las columnas necesarias, siempre.

---

## gg) ✅ Resuelto — Gran simplificación por departamentos (2026-07-27) + corrección de dos alarmas previas

Sesión de simplificación decidida ítem a ítem con el CEO tras auditar las ~24 páginas de sidebar contra su código real. Resultado (commits `303e2cd` Fase A, `54d6596` Fase B): sidebar de 24 → 15 ítems sin perder ninguna función real (lo fusionado vive como pestañas en la página dueña de los datos); dos bugs de cliente arreglados (crash de Brand Brain por objetos de audiencia renderizados crudos — React #31 para TODOS los clientes reales; y el toggle ES/EN que no reaccionaba en 6 páginas por un segundo sistema de locale no-reactivo, `lib/use-locale.ts`, eliminado); datos falsos retirados de 90-Day Plan/My Plan/Portfolio/ROI de Performance; footer "Other Available Teams" eliminado; stats del roster de Marketing corregidas (mostraban contactos de CRM como "In approval" y alertas hardcodeadas a 0); quick actions sombra de Comercial eliminadas y las de contenido de Marketing conectadas a la cola de aprobación real (`POST /api/approvals` nuevo).

**Corrección de dos alarmas previas de esta misma bitácora:**
1. **(cc)/(dd) exageraban el riesgo de Billing/System**: existía un guard server-side en `operations/layout.tsx` (anterior a todo) que expulsaba a CUALQUIER no-super_admin de todo el árbol `/operations` — Billing/System nunca estuvieron expuestos a clientes, ni siquiera tras el fix de `PLAN_SECTIONS`. La alarma de confidencialidad era infundada.
2. **Pero ese mismo guard era un bug real**: tras añadir `operations` a los planes de cliente, el icono aparecía en el sidebar y el guard rebotaba a `/home` en silencio — el "operations manda a los usuarios a home" reportado por el CEO con Nirada en producción. Resuelto moviendo el guard a las 3 sub-páginas internas (billing/system/users, vía `lib/require-super-admin.ts`) y dejando `/operations` (My Team: soporte/FAQ/tutoriales) abierto a clientes.

**Deuda residual nueva**: los prompts de `generar_icp`/`crear_propuesta`/`calificar_reply` en `lib/generation/quick-action-prompts.ts` quedan huérfanos (sin botón que los dispare) — mismo patrón que la entrada (g); limpiar o reutilizar en una ronda futura. Los ficheros de Billing/System siguen en el árbol como herramientas internas super_admin, con contenido mock — decidir su futuro (rehacer como facturación real del cliente cuando llegue Stripe, o mover a /admin).

---

## hh) ✅ Fase C i18n — 20 páginas cliente traducidas; queda un lote pendiente documentado (2026-07-27)

Continuación de (gg): el CEO eligió cobertura completa de inglés para las ~43 páginas cliente. Se lanzó un workflow de 5 agentes en paralelo; 4 murieron a mitad de edición por límite de sesión, dejando ficheros con claves `t()` sin diccionario. Recuperado inline: se extrajeron las 416 claves realmente usadas (filtrando falsos positivos del grep como `access_type`), se recuperaron los textos originales del `git diff`, y se autoró el diccionario completo ES/EN inyectado centralmente en `lib/i18n.ts` (ahora **978/978 claves simétricas**, antes 288/288). Commit `590b496`.

**Verificado con Playwright (usuario QA, ambos idiomas)**: home, approvals, performance, brief, documents, brand-brain, project-memory — 7/7 con marcadores correctos en ES y EN, cero claves crudas visibles. Dos falsos negativos del test resueltos por el camino: el selector `button:has-text('ES')` matchea substrings (usar `localStorage.setItem('locale')`+reload determinista), y los marcadores con CSS `uppercase` requieren comparación case-insensitive (Playwright devuelve el texto renderizado).

**Cobertura conseguida** (los ficheros que los agentes sí tocaron, todos con diccionario completo): home, brief, approvals, calendar, performance, documents + documents/[id], projects/[slug] + projects/new, client-portal config/documentation/entregas, toolkit action-plan/marketing-audit/seo-audit (página + resultado), BrandBrainEditor, ProjectMemoryViewer.

**⚠️ Scope restante SIN traducir** (los lotes que los 4 agentes muertos no llegaron a tocar — siguen con literales hardcodeados; próxima ronda):
- Toolkit: landing, overview, report/[id] y los ~8 sub-tools restantes (content-calendar, competitor-analysis, etc.)
- Comercial: interiores de scoring/icebreaker/qualify/proposals + literales de los paneles `components/comercial/*` (CrmContactsPanel, IcpCriteriaPanel incluidos)
- Componentes compartidos: `components/agent-workspace.tsx`, `components/document-uploader.tsx`
- Props de AgentWorkspace (títulos/placeholders) en páginas de Strategy y Finanzas
- Community y páginas menores restantes

El mecanismo (contexto reactivo + diccionario simétrico) ya está probado — la ronda pendiente es solo trabajo mecánico de claves. Mantener SIEMPRE la simetría ES/EN de `lib/i18n.ts` (typecheck no la valida; un desbalance deja claves crudas en un idioma).

---

## ii) ✅ Quick Actions 2.0 — poda, chat guiado, adjuntos, destinos; y 3 sistemas rotos de raíz descubiertos (2026-07-27)

Sesión de auditoría + rediseño completo de quick actions (plan aprobado por el CEO; datos previos: 43 ejecuciones históricas, todas de un día de pruebas, 0 likes). Commits `6354a2d`→`a49f1a3` (F0-F5), todo desplegado vía integración nativa.

**Lo construido**: registry declarativo único (`lib/quick-actions/registry.ts`, 20 acciones — poda 21→20 con fusiones Post/Post Visual y Carousel/Carrusel Visual vía toggle `with_image`, brainstorm_ideas y auditar_innovacion eliminados/fusionados, 3 prompts huérfanos borrados); Comercial reconstruido 1→4 acciones conectadas al pipeline (responder_objecion, email_seguimiento, preparar_llamada con `lead_picker` + "Guardar en el lead"; crear_campaña rehecha con `discovery_search` + CTA que precarga Prospección); **modo chat guiado "Cuéntamelo" en las 20** (`/api/quick-actions/guided`, molde del onboarding chat, historial client-side, adjuntos con visión/PDF); adjuntos también en modo formulario; autofill desde Brand Brain/ICP; destinos universales (aprobar TODO tipo con `asset_url` de imágenes, Copiar, Guardar en Documentos con grounding futuro); robustez (failed+error_message+Reintentar+reaper — adiós filas zombis); agentes con memoria multi-turno real y PDFs legibles.

**Tres sistemas que estaban rotos DE RAÍZ en producción (deriva de esquema — migraciones escritas pero nunca aplicadas, patrón (ff) otra vez):**
1. `quick_actions_results.error_message` no existía → TODOS los `markFailed` del código fallaban en silencio → filas zombis en processing para siempre (6 saneadas por ID exacto).
2. `client_documentation` tiene un esquema REAL distinto al de la migración 0015 (`storage_url`/`filename`/`file_size_bytes` + CHECK de doc_type 'brand-book|handbook|product-doc|marketing|other') → **el grounding por documentos de todas las generaciones Y la biblioteca de Documentos entera (listar/subir) fallaban con error de columna desde siempre**. Arreglado contra el esquema real (alias PostgREST en GET para no tocar el front).
3. `pdf-parse` v2 no sobrevive el bundling de webpack (falta `serverExternalPackages`) → el path de PDF del onboarding también estaba roto en runtime. Arreglado en next.config.

**✅ Migración 0048 APLICADA por el CEO el 2026-07-27** (SQL editor del dashboard) y verificada en vivo: `error_message` ✓, `client_documentation.extracted_text` ✓, CHECK de `output_type` acepta los tipos reales ✓ (probe insert+delete). Los fallbacks de resiliencia del código quedan como red de seguridad sin coste.

**Deuda nueva anotada**: (a) bucket `brand-assets` es público y ahora recibe adjuntos de negocio (P&L, hilos de email) — migrar a bucket privado + signed URLs; (b) `editar_imagen_visual` regenera desde prompt con visión del original (no es edición pixel-perfect; `images.edit` de OpenAI sería el upgrade); (c) carousel con imágenes solo genera la cover (limitación documentada en el prompt); (d) el coste del chat guiado es opus por turno — vigilar `mira_usage_log` (ruta `quick-actions-guided`) y decidir si el entrevistador baja a un modelo menor; (e) `MODEL_PRICING` de opus corregido {15,75}→{5,25} — los consumos históricos del panel estaban sobreestimados ×3.

---

## jj) ✅ Plan Maestro B1 (Cimientos) — memoria por proyecto, prompts con contrato, y DOS sistemas más rotos de raíz (2026-07-28)

Primer bloque del Plan Maestro (auditoría de 3 agentes sobre 8 áreas; decisiones CEO: eliminar concepto publicado/programado, eliminar Brief, Drive OAuth-cliente único, orden cimientos-primero). Commit `de8e217`. Escritorio limpiado (basura `Claude 2` y prototipo `mira-local` — pusheado su snapshot final a jeicost/mira-portal antes de borrar).

**Memoria**: `getClientMemoryContext(clientId, projectId?)` prioriza la memoria del proyecto activo (+globales) — antes era ciega a proyectos y todo se mezclaba; cableado en agent/quick-actions/guided/toolkit/documents. Dedup 24h en auto-logs. Viewer con editar/borrar/añadir manual y fallback de categorías. `bannedPhrases` reales desde `brand_data.banned_phrases` (+campo en editor; antes hardcodeado a `[]`).

**Dos sistemas más rotos de raíz** (misma familia que (ii) — deriva de esquema/tabla vacía):
1. **Crear proyectos NUNCA funcionó para nadie**: `mira_users` estaba VACÍA (ningún flujo la poblaba — el alta de clientes crea auth.users + grants pero no mira_users), su FK bloqueaba `mira_projects.user_id`, y aun provisionando, la RLS de mira_projects bloquea inserts client-side. Fix: `POST /api/projects` server-side (auto-provisiona mira_users, slugs con reintento) + `useProjectManagement` la consume + `POST /api/me/ensure-mira-user` reutilizable. Verificado E2E por UI → fila real.
2. **El auto-log del toolkit a project_memory fallaba en silencio desde siempre**: escribía category `generation`, que el CHECK real de la tabla rechaza (fire-and-forget → nadie lo vio). Ahora escribe `content`. (El "bug del viewer con generation" que documentó la auditoría era teórico: esas filas nunca pudieron existir.)

**Prompts**: GROUNDING_CONTRACT añadido a comercial/{proposal,qualify,score,icebreaker,discovery}, onboarding, analyze-document y content-engine; comercial lee `fetchBrandBrain` canónico + memoria (muerta la lectura paralela de Nova por columnas propias); los 23 prompts de agente profundizados (MÉTODO/FORMATO/EJEMPLO DE ESTILO, ES-EN); guided recibe memoria. **Fixes**: ui/Card por tokens (invisible en modo claro), borrados DashboardLayout.tsx y drive/ingest muertos.

**Bloques pendientes del Plan Maestro**: B2 Marketing sin teatro (eliminar Brief y concepto publicado, Alertas fuera de UI, identidad visual dura en imágenes + upload de logo), B3 Drive completo (matar SA, carpetas por proyecto, auto-sync cron, export desde Toolkit, reconexión 5 clientes), B4 Documentos (renderizador único editorial + document_feedback con reinyección), B5 UI (Comercial primero, PageHeader, móvil, modo claro). El plan completo con verificaciones vive en el fichero de plan de la sesión 2026-07-28.

---

## kk) ✅ Plan Maestro B2-B5 EJECUTADO COMPLETO (2026-07-28)

Los 4 bloques restantes del Plan Maestro en un solo día, cada uno verificado y desplegado: `742cf83` (B2), `f454e1a` (B3), `6a0e3d4` (B4), `c977a0c` (B5).

**B2 Marketing sin teatro**: Brief ELIMINADO (relay hardcodeado a 2 clientes; /brief→/roster); fuera el concepto publicado/programado ("Aprobar y programar"→"Aprobar", KPI Publicados→Ratio de aprobación real); pestaña Alertas retirada (tabla+webhook dormidos); identidad visual DURA (hex+tipografía exactos) en prompts de imagen; upload de LOGO en Brand Brain (logos/{clientId} + espejo clients.logo_url vía /api/brand-brain/logo-mirror) — antes vacío en todos los clientes.

**B3 Drive completo**: modelo de UNA carpeta de conocimiento por cliente (recursiva, purpose default brand, límites 100 ficheros/20 docs); auto-sync diario (cron Vercel 05:00 UTC → /api/cron/drive-sync con CRON_SECRET en prod; /api/cron en allowlist del proxy); entregables "MIRA — Entregables/{Proyecto}" auto-creados; FALLBACK SERVICE ACCOUNT ELIMINADO (lib/google-drive.ts y test-google-drive borrados) — sin Drive el export da 409 con mensaje accionable. **Protocolo de alta documentado**: cliente conecta OAuth 1 vez → pega el enlace de su carpeta de conocimiento → sync inmediato + diario; la carpeta de Entregables nace en su raíz (limitación scope drive.file) y el cliente puede arrastrarla dentro de la suya. Migración **0049** (auto_sync_enabled — la 0030 nunca llegó a la BD real) con código resiliente pre-aplicación.

**B4 Documentos**: renderizador ÚNICO editorial para todo el export a Drive (adapters + generateEditorialHTML; muerta la plantilla morada paralela); feedback de documentos (barra 👍/👎+nota en informes → tabla document_feedback, migración **0050**) con REINYECCIÓN de las últimas 3 notas negativas en la siguiente generación del mismo tool (toolkit-prompts) y en refine; los ❤ de quick actions por fin se usan (outputs favoritos como señal de estilo en prompts). Resiliente pre-0050.

**B5 UI**: Comercial migrada al sistema de diseño (45 hex→0; discovery era la peor con 34), PageHeader en las 5 páginas, móvil contenido (kanban snap-x, tablas con scroll propio, grids responsive), barrido global de clases hex en páginas cliente 23→0 (bonus: banners de Integraciones tenían clases inválidas `bg-[#10B981]20`).

**✅ Migraciones 0049 + 0050 APLICADAS por el CEO el 2026-07-28** y verificadas en vivo: auto_sync_enabled=true en las 5 carpetas existentes ✓; document_feedback con insert y CHECK de outcome funcionando ✓ (probe borrada). **Pendiente CEO restante**: avisar a los 5 clientes seed de RECONECTAR su Drive (banner needsReauth visible en Integraciones). CRON_SECRET ya en Vercel production.

**Deuda que queda del plan maestro** (anotada, no bloqueante): i18n de toolkit/comercial interiores (ronda pendiente desde (hh)); modo claro del resto de páginas no-Comercial sin auditar exhaustivamente; bucket brand-assets público (adjuntos de negocio — mover a privado+signed URLs); Canva sin credenciales (l); pptx solo decks.

---

## ll) Business Reports F0-F4 — Toolkit sintetizado + 2 reports de nivel consultora (2026-07-28/29)

El Toolkit pasa a **Business Reports**: 11 herramientas → 8 reports, formularios brain-first, adjuntos reales, semáforo de completitud, Brand Book y Monthly Content System nuevos sobre el método destilado del CEO (`~/Desktop/Brand_Content_System_GPT`). Commits: `b29840f` (F0 brain), `98cf205` (F1), `9379065` (F2), `1908006` (F3), `7272a6f` (F4). Verificaciones: F1 Playwright 21/21 con generación real + PDF adjunto referenciado; F2 12/12 + radar quick real en PROD con Tavily (6 fuentes citadas).

**Bugs de producción encontrados y arreglados de paso:**
1. **La subida de adjuntos desde navegador NUNCA funcionó** — el bucket brand-assets no tiene policy de INSERT para authenticated (cero objetos de cliente en TODO el bucket; solo logos/ subidos server-side). Afectaba a Quick Actions, onboarding chat y los nuevos reports. Fix: `/api/attachments/upload` server-side (resolveRequestClient + admin client, allowlist de mime/prefijo, límites 5×15MB); `uploadFilesToBucket` ahora postea ahí — todos los consumidores arreglados de una vez.
2. **Brain F0 no llegaba a los reports**: toolkit-prompts emitía un resumen manual de 9 líneas en vez de `formatBrandBrainForPrompt` — golden rule, vocabulario con porqués, oferta, restricciones y what-flopped NUNCA entraban a ningún informe del toolkit. Arreglado (entra el formato completo).
3. **`subtitle: 'Salsa Burgers'` hardcodeado** en 5 configs de tools — se mostraba a TODOS los clientes. Runner ahora cae a `activeClient.name`.
4. **CHECK de `generation_queue.tool_slug` sin los slugs nuevos** (deriva de esquema nº6): descubierto en el primer build real. **Migración 0051 escrita, PENDIENTE de aplicar** — bloquea los builds reales de brand-book y monthly-content-system.

**Deuda nueva (anotada, no bloqueante):**
- **Tags de dependencias descoordinados**: `TOOLKIT_MEMORY_QUERIES` busca tags con guion bajo (`brand_briefing`) pero el auto-log escribe el slug con guion (`brand-briefing`) — las dependencias entre reports probablemente NUNCA han matcheado filas del auto-log (solo las de otros escritores). brand-book escribe ambas convenciones; el resto pendiente de una ronda de higiene.
- **Tavily local muerto**: la key de producción es sensitive (no se puede pull) y la de sf-sales-engine/.env está revocada. En local `searchWeb` devuelve [] silenciosamente — los QA de competitive/investor en local salen sin fuentes. Conseguir una key de dev o documentarlo en cada QA.
- **Monthly en prod = 2 llamadas opus secuenciales (9k+12k)** con `maxDuration=300` en el route de generate: riesgo de timeout con clientes de brain grande. Si pasa: subir maxDuration (fluid compute) o partir en 2 requests.
- **`components/unified-history.tsx` es código muerto** (ningún consumidor) — candidata a borrado en la ronda de higiene.
- i18n de todas las superficies nuevas de Business Reports (configs, /strategy/plan, botones del informe) — hoy ES hardcodeado, coherente con el interior del toolkit que ya estaba pendiente (hh).
- `formatTone` en toolkit-prompts quedó sin uso tras el cambio al formato completo del brain (inofensivo; borrar en higiene).

**Pendiente de verificación real (tras aplicar 0051)**: build completo de brand-book (consistency_findings, CMYK determinista, Voice Guide A4 → Slides en Drive) y de monthly (2 fases, verify-deck, Slides editable, materialización a la Cola). Los QA fixtures viven en el scratchpad de la sesión (`br_cleanup.txt` con TODOS los IDs a borrar al cierre, incluida la fila PROD del radar `f741091a`).
