# DEBT.md — Deuda técnica de MIRA

Registro honesto de deuda técnica conocida. Última verificación completa: **2026-07-30** (entrada vv). Todas las rutas son relativas a `apps/mira/portal/` salvo que se indique lo contrario. Cada entrada verificada contra el código con grep en la fecha indicada.

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

## a) ✅ Resuelto (código) / en espera (tablas) — `visual_jobs`: subsistema fantasma

*(Re-verificado 2026-07-30 durante el barrido de deuda de la auditoría qq: la decisión SÍ se tomó, este punto había quedado desactualizado.)* Los 5 ficheros huérfanos de `lib/generation/` (`visual-provider.ts`, `mock-visual-provider.ts`, `visual-storage.ts`, `visual-refinement.ts`, `feature-flags.ts`) fueron eliminados en el commit `4c0575d` (P4, 2026-07-29) — confirmado con `test -f`/`ls`, ya no existen. `docs/VISUAL_GENERATION_INTEGRATION.md` documenta explícitamente que ese sistema "nunca se conectó" y murió en P4.

Las 4 tablas de `supabase/migrations/0028_visual_jobs.sql` se dejan **intactas a propósito**, no por indecisión: las reclama el draft del handoff W6 de Visual Production Foundation, en espera de la decisión reuse-vs-namespace del equipo externo (ver memoria `project_mira_visual_production` / `docs/NEXT_STEPS.md`). No tocar hasta esa respuesta.

---

## c) API keys de clientes en claro

*(Verificado de nuevo 2026-07-22: sigue igual.)* `lib/integrations/getClientApiKey.ts:53-55` lee la key desde `tool_connections.metadata.api_key` / `metadata.apiKey` **en texto plano**; L65 deja el TODO explícito: *"If lib/crypto.ts exists, decrypt the key here"* — `lib/crypto.ts` sigue sin existir.

**Qué haría falta:** cifrado at-rest (AES-GCM con key en env, o Supabase Vault), migración de las filas existentes y descifrado en `getClientApiKey`.

---

## f) ✅ Resuelto — `StudioArchetype` con proyectos decorativos mock

*(Re-verificado 2026-07-30 durante el barrido de deuda de la auditoría qq: este punto había quedado desactualizado.)* `DEFAULT_PROJECTS` ya no existe en `components/archetypes/StudioArchetype.tsx` — la prop `projects` tiene default `[]` con un empty state honesto real (i18n `archetype.studio.empty-title/-desc`). El único caller (`app/(dashboard)/agent/[role]/page.tsx`) pasa `workspaceData`, poblado por `app/api/studio/approved-visuals/route.ts` con imágenes reales aprobadas de `approval_queue.asset_url`. Resuelto en los commits `bd011ac` (29/07, "Studio con imágenes reales aprobadas") y `b383a54` (30/07, arquetipos con datos reales).

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

---

## mm) Fase 2 ejecutada: P0-P6 + P8 en un día; P7 parcial (2026-07-29)

Plan completo en `~/.claude/plans/pasale-un-buen-sistema-cached-quill.md`. Commits: P0 `a9a04a8`+limpieza QA total · P1 rama `feat/visual-production-foundation` (`170ce78`, respuesta handoff visual + scaffolding, SIN mergear a propósito) · P2 `3fb3393`+`e23e1a4` (0052 APLICADA, conocimiento unificado) · migraciones 0053-0055 redactadas `bcc00c5` · P3 `ad2b277` (tema claro/oscuro 5 motores + feedback unificado + Refinar en informes) · P4 `4c0575d` (arquetipos 23/23 conectados en tab Workspace, tool de imagen en chat designer/spark, covers monthly, sistema visual muerto borrado) · P6 `ec7c03a` (brain chat propuesta+confirmación, lib/brain-tools) · P5 merge `d29cfa7` (cuestionarios completos + plan 'consulta' + gating toolkit por plan) · P8 `c557aec` (Brand Brain operativo: campo web + defaults brain-first + pilares en tarjetas + explicadores + esquema Drive) · P7-parcial `a33cd68`.

**Decisiones de alcance**: monthly/voice-guide SIN modo oscuro a propósito (su look claro ES el spec del método del CEO); playbook/deck ganan modo por theme-flip (no re-arquitectura); FeedbackButtons solo montado en QuickActionResult (informes/documentos conservan su UI inline equivalente).

**PENDIENTE**:
- **Migraciones 0053/0054/0055 sin aplicar** (todo el código es resiliente: feedback de quick actions, cuestionarios y brain chat degradan con mensaje claro hasta aplicarlas).
- ~~P7 wizard completo~~ ✅ COMPLETADO el mismo día (`6f92b8a`): 5 pasos, atrás, revisión editable, asistente por paso (extrae de texto libre sin escribir en BD), panel de huérfanos con borrado por ID exacto. El chat libre original se conserva en `/admin/onboarding/chat`.
- P5 dejó anotado: `save_project_memory` del ingest no liga project_id (añadir vía brain-tools); `/api/questionnaires/generate` fuera de EXPENSIVE_API_PREFIXES del rate-limit (1 línea en proxy.ts si se quiere).

**✅ VERIFICACIÓN E2E COMPLETA (2026-07-29, mismo día, con datos reales)**: las 3 migraciones (0053/0054/0055) aplicadas y sondadas; 32/33 checks PASS con evidencia real contra Salsa Burgers — Playwright con dos sesiones (cliente + una agencia sintética creada/borrada para la prueba):
- P2: el agente copywriter (NO el rol 'brand') citó contenido real de Drive — confirma que el índice unificado funciona para todos los agentes, no solo el de marca.
- P3: theme=dark/light cambia la URL de export real; feedback 👍 guardado con `context=toolkit` correcto; Refinar confirmado por datos (`_history` con la instrucción exacta) — el único "FAIL" del primer pase fue el test comprobando a los 25s una llamada opus que tardó más, no un bug de producto.
- P4: la pestaña Workspace del arquetipo Studio renderiza en `/agent/designer`; Zoe generó una imagen real en el chat (verificada por `<img>` en el DOM).
- P5: cuestionario generado de huecos reales de Salsa (11 preguntas con `maps_to`), enviado, respondido, completado, ingestado — la respuesta llegó al `brand_data` real.
- P6: "Cuéntale a MIRA" con el caso del foodtruck — propuesta creada, el cliente NO puede confirmar (solo ve pendiente), la agencia confirma → `brand_data` y `project_memory` reflejan el cambio.
- P7: abrir `/admin/onboarding` confirmado que NO crea clientes; wizard completo creó un cliente+proyecto+brand_profile real de punta a punta; el huérfano preexistente de la sesión anterior se borró por la UI real.
- Cierre: Salsa restaurada byte-a-byte a su `brand_data` original; TODOS los artefactos sintéticos borrados y verificados (usuario de auth, cliente del wizard, generación, feedback, cuestionario+cascade, propuesta, 3 memorias, imagen de storage, grant QA); dev server apagado.

**Pendiente real que queda** (nada bloqueante): reconexión de Drive de un cliente para probar en vivo la creación de carpetas Conocimiento/Entregables por proyecto (P2) — el flujo está verificado por código y build, no por UI real con OAuth activo; decisión del equipo visual sobre las tablas 0028 (handoff W6, ver entrada anterior).

---

## nn) ✅ Migración 0051 verificada en vivo + bug real de `pdf-parse` encontrado y arreglado + Salsa Drive reconectado + Studio con datos reales (2026-07-29, tarde)

Continuación de (ll)/(mm) el mismo día. Todo verificado contra producción real (Salsa Burgers, cuenta de Nirada), no solo por código.

**Migración 0051 aplicada** (CEO, SQL editor) — desbloqueó `generation_queue.tool_slug` para `brand-book`/`monthly-content-system`. Verificado con 2 generaciones reales completas contra Salsa:
- Brand Book: `200`, `queue_id e2386324`, 116.5s, contenido real con grounding (cita el Drive real del cliente).
- Monthly Content System: `200`, `queue_id d7c8e889`, ~310s, 6 pilares/18 captions — confirma que el fix de `a9a04a8` (3 fases + techo 800s) resolvió el timeout que había fallado esa misma mañana a las 10:03.

**Contaminación de conocimiento en Salsa, encontrada y limpiada**: el propio Brand Book generado señaló "assets internos de prueba (E2E)" en su memoria. Investigado con lectura directa a Supabase (service role, solo `SELECT` antes de cualquier borrado): 5 filas de `agent_documents` (vía la vista `knowledge_items`, `source: drive`) resultaron ser documentación técnica interna de MIRA/el equipo visual (schemas JSON `$id: https://mira.local/schemas/...` para `approval_event`/`feedback_event`/`qa_report`, política de reliability de assets) — sincronizada por error desde una subcarpeta `DOCUMENTATION - VISUAL REFERENCE & GPT/` dentro del Drive de Salsa. Borradas por ID exacto de `agent_documents` (la vista `knowledge_items` resultó ser de solo lectura — no se puede `DELETE` directo sobre ella, hay que ir a la tabla base). El CEO movió esa subcarpeta fuera del árbol sincronizado de Salsa en Drive — causa raíz cerrada. Contenido real conservado intacto: el Brand Book PDF, `README (1).md` (12 casos de campaña reales y detallados de Salsa — oro real, no tocar) y los 2 documentos subidos por chat.

**Bug real encontrado y arreglado — `/api/brand-brain/drive/folders` crasheaba en los 3 métodos (GET/POST/DELETE)**: reproducido en vivo con Playwright + confirmado con `vercel logs` en directo (no solo teoría): `ReferenceError: DOMMatrix is not defined`. Causa: `lib/drive-sync.ts` tenía `const { PDFParse } = require('pdf-parse')` **a nivel de módulo** (no dentro de la función) — a diferencia de los otros 3 sitios del código que ya usan `await import('pdf-parse')` de forma perezosa (`lib/attachments.ts`, `app/api/brand-brain/upload-document/route.ts`, `app/api/agent/[role]/upload-document/route.ts`). Ese require estático se ejecutaba en CADA petición a la ruta (incluso GET, que nunca toca un PDF), y `pdf-parse@2.4.5` intenta cargar `@napi-rs/canvas` (no instalado) y cae en un polyfill que referencia `DOMMatrix`, inexistente en el runtime Node de Vercel — tumbando el módulo entero. **Resuelto** (`9eb08f0`): import dinámico dentro de `extractPdfText`, mismo patrón que los otros 3 sitios. Verificado en vivo tras el deploy: `200` limpio en GET y POST, sync real de la carpeta de Salsa exitoso.

**Salsa Drive reconectado con scope de escritura**: verificado en `drive_connections` que `granted_scopes` ahora incluye `drive.file` + `drive.readonly` (antes solo tenía una conexión de lectura de 2026-07-19, sin `drive.file`). La lectura ya funcionaba (por eso el sync no fallaba por falta de conexión, sino por el bug de pdf-parse); ahora también puede exportar a su propio Drive. **Aviso de UX real, no arreglado**: la tarjeta genérica de Google Drive en `/integrations` (compartida con Claude/OpenAI/Freepik) llama a `handleToolDisconnect`→`tool_connections` (sistema de API keys genérico) si se clica estando ya "Connected" — Drive nunca usa esa tabla (usa `drive_connections` con su propio flujo OAuth), así que el clic no hace nada útil ni rompe nada, pero confunde. La gestión real de Drive vive solo en Brand Brain → Documentos (`DriveFoldersPanel`). Pendiente: o quitar Drive de esa tarjeta genérica, o darle su propio handler de disconnect.

**CI limpiado**: job `deploy` de `.github/workflows/deploy.yml` eliminado (usaba `VERCEL_TOKEN` caducado; el deploy real siempre fue por integración nativa de Vercel, no por este workflow — ver (dd) punto 3). Solo queda el `typecheck`.

**Track A del plan de referencias visuales ejecutado** (`bd011ac`) — el resto (librería curada de Post References, `vp_visual_references`) queda diseñado y sin construir hasta que el equipo del Visual Production Foundation responda (nota de estado ya redactada y entregada al CEO para reenviar). Lo hecho ahora, verificado en vivo contra Salsa:
- `components/archetypes/StudioArchetype.tsx`: `DEFAULT_PROJECTS` (3 proyectos falsos, visibles en prod para TODO cliente desde que P4 conectó el tab Workspace) sustituido por piezas reales de `approval_queue` (mismo dato que `/approvals`). Verificado: ningún cliente tiene aún ninguna pieza aprobada — el empty state real ("No hay piezas aprobadas todavía") es honesto, no inventa datos.
- Nuevo `app/api/studio/approved-visuals` + `lib/studio-references.ts` (query compartida).
- `generate_image` (chat de designer/spark, `app/api/agent/route.ts`): antes de escribir el prompt, Claude ve como bloque de visión la última pieza real aprobada del cliente (mismo patrón que `editar_imagen_visual`) — solo mejora el grounding del prompt de texto, sin cambiar el modelo/endpoint de imagen.
- Eliminadas 2 rutas sin ningún caller en toda la app: `app/api/drive-references` (duplicaba `brand_references`, que sí está vivo vía `lib/onboarding/tools.ts`/`lib/brain-tools`) y `app/api/memory/save` (endpoint de solo lectura inalcanzable).

**Hallazgo colateral, sin arreglar (fuera de alcance de esta ronda)**: error 400 real en `/agent/[role]` — `column agent_activity.created_at does not exist`, en las queries de `getAgentActivityTasks`/`getAgentStats` (pestañas Activity/Performance). Pre-existente, no introducido hoy.

---

## oo) Cierre comercial de arquetipos + auditoría (docs/UX/software) + capa 1-2 de prompts (2026-07-30)

Sesión larga, pedida explícitamente por el CEO como cierre "a nivel comercial, sin fallos ni cabos sueltos" de todo el sistema de agentes. 3 auditorías en paralelo (documentación completa del monorepo, UX de la experiencia de agentes, software/seguridad) antes de tocar código.

**Hallazgo de las auditorías — los 5 arquetypes restantes tenían el MISMO bug que Studio ayer, más grave**: `OracleArchetype`, `AnalystArchetype`, `ExplorerArchetype`, `ArchitectArchetype`, `SentinelArchetype` mostraban datos 100% inventados a los 23 agentes sin excepción, con botones decorativos sin ningún handler real (Analyst "Re-score"/"Send to Finn", Explorer "Research"/"Contact" — ni siquiera tenían `onClick`; Sentinel tenía un stub explícito `onClick={e => e.stopPropagation()}`). Bug adicional real en `ARCHETYPE_CUSTOMIZATIONS` (`lib/agent-archetypes.ts`): keyed por nombre de persona (`alex`, `vera`...) mientras el único caller real pasa el slug de rol — nunca hizo match, mismo patrón que el `AGENT_ARCHETYPE_MAP` que P4 ya había arreglado. **Resuelto**: eliminado por estar completamente muerto (ningún componente leía sus campos), no re-keyeado.

**Auditoría UX (dura, no diplomática) encontró, más allá del dato falso**:
- i18n roto en los 6 (mezcla EN/ES hardcodeada) mientras el resto de la app usa `t()` — un cliente español veía "New Project" junto a texto en español en la misma pantalla.
- 3 colores hardcodeados (`#444`, `#1E1E1E`) sin equivalente en modo claro.
- Cero estados de carga/error — un fallo de red y "sin datos real" se veían idénticos.
- Cero responsive (`grid-cols-3` fijo sin `md:`) — inusable en móvil.
- Accesibilidad: flechas/puntos del carrusel de Oracle sin `aria-label`.
- Solo Studio tenía un empty state diseñado; Analyst con `results=[]` colapsaba el panel derecho dejando un hueco sin mensaje.
- Dato bueno: About/Activity/Chat/Performance ya estaban bien hechos y localizados — el problema estaba concentrado en Workspace.

**Auditoría software/seguridad**:
- Aislamiento entre clientes: seguro, verificado línea a línea en `resolveRequestClient`.
- El grounding visual de ayer (P4) descargaba la imagen de referencia en CADA mensaje de designer/spark, no solo cuando iba a generar imagen — coste/latencia innecesarios. **Resuelto**: solo en el primer turno (`sanitized.length === 0`).
- Inyección de prompts real y sin mitigar: `app/api/comercial/icebreaker/route.ts` interpola `company_name`/`linkedin_summary` de leads (dato de terceros) directo en el prompt sin ningún filtro — mismo patrón en `lib/client-memory.ts`/`lib/knowledge.ts`. Mitigación ligera añadida (ver más abajo); la defensa estructural completa queda pendiente, es tema de otra sesión.
- Mi idea original de "una ruta genérica multi-arquetipo" NO encaja con la convención real del repo (125 rutas pequeñas en 53 `app/api/*`, cada una con su `lib/*.ts`) — descartada a favor de 5 rutas pequeñas (una por archetype, no por agente).

**Decisiones del CEO caso por caso** (con datos reales verificados en Supabase antes de decidir, no solo teoría):
- Analyst: `icp-scorer`/`reply-qualifier` → tabla `leads` real. `atlas` → `competitive-analysis` real (bucketing por competidor/oportunidad/diferenciación en vez de caliente/frío). `ads-manager`/`quant`/`fiscal` → vacío honesto, sin dato real que encaje.
- Architect: `content-strategist`/`social-media-manager` → Monthly real. `strategos`/`blueprint` → `action-plan` real (**confirmado con 5 filas reales de Salsa antes de decidir**). `proposal-writer` → histórico real de `crear_propuesta` (**confirmado 4 filas reales de Salsa con executive_summary/pricing/next_steps**, aunque el botón de crear nuevas se retiró hace días). `midas` → `proyeccion_financiera` real (mecanismo listo, Salsa con 0 filas hoy). `orchestrator`/`onboard` → vacío honesto.
- Sentinel: los 3 agentes → aprobaciones pendientes + coste real (`mira_usage_log`) + tasa de éxito real (`quick_actions_results.status`) — sin depender de `agent_activity.created_at` (columna rota, ver arriba).

**Arquitectura implementada**: registro `WorkspaceStatus<T> = {status:'ready',data}|{status:'empty'}|{status:'error',message}` (`lib/archetype-workspace.ts`) usado por los 6 archetypes; 5 rutas nuevas `app/api/archetypes/{oracle,analyst,explorer,architect,sentinel}-data` + sus `lib/*.ts` fetchers; `app/api/studio/approved-visuals` migrada al mismo contrato tri-estado (antes un fallo de red devolvía `[]`, indistinguible de "sin datos"). `app/(dashboard)/agent/[role]/page.tsx` con un solo loader genérico (`workspaceEndpoint(role, clientId)` según `getArchetype(role)`) reemplazando el loader hardcodeado solo-Studio de ayer.

**Verificado en vivo en producción** (no solo build): Playwright contra Salsa real tras cada deploy — `copywriter` con copy real generado (`[RECOMENDACIÓN]` correctamente etiquetado), `strategos` con Plan de Acción 30/60/90 real y link a `/toolkit/report/[id]`, `community-manager` con $3.88 de coste real / 86% tasa de éxito / 0 pendientes, `fiscal`/`icp-scorer`/`lead-scout` con el vacío honesto correcto. Un primer intento de verificación salió con datos falsos todavía visibles — **el deploy aún no había propagado**; el poll por status HTTP 307 no es señal fiable de que un deploy nuevo esté live (307 lo devuelve el middleware de auth para cualquier ruta, exista o no la nueva). Repetido tras confirmar `vercel ls` con estado `Ready`, correcto.

**Capa 1-2 del plan de prompts (68 prompts totales, capas 3 — quick actions/Business Reports/monthly/documents, ~44 más — quedan para otra sesión)**:
- Los 5 contratos compartidos (`GROUNDING_CONTRACT`, `AGENT_CHAT_GROUNDING_NOTE`, `EDITORIAL_CONTRACT`, `REPORT_VOICE_CONTRACT`, `formatBrandBrainForPrompt`) ya eran de buena calidad — mejoras quirúrgicas, no reescritura: desambiguación `[RECOMENDACIÓN]` vs `[SUPUESTO]` + ejemplo de calibración, regla de anti-inyección (dato de terceros nunca es instrucción) en los dos contratos de grounding, nota de precedencia entre `EDITORIAL_CONTRACT`/`REPORT_VOICE_CONTRACT`, guía para Brand Brain casi vacío.
- Los 23 prompts de agente (`lib/agent-prompts-i18n.ts`) ya tenían buena calidad (plantilla TRAITS/TONE/OUTPUT/CONSTRAINTS/MÉTODO/FORMATO/EJEMPLO consistente) — se añadió a los 23 (ES+EN, simetría mantenida) una frase de límite/derivación específica (a qué agente redirigir ante una petición fuera de su rol) + una regla genérica de respaldo.
- **Bug real cometido y corregido en el propio proceso**: el primer script de inserción localizaba el bloque de cada rol con una búsqueda global sobre todo el fichero, que siempre encuentra la ocurrencia en la sección ES sin importar qué idioma tocaba — mezcló las dos frases (ES+EN) dentro del bloque ES y dejó el bloque EN intacto en los 23. Detectado con `git diff --stat` + lectura antes de comitear, revertido con `git checkout --` y rehecho separando explícitamente las secciones ES/EN antes de buscar cada rol.
- **Verificado en vivo con llamadas reales a `/api/agent`, en 3 rondas sucesivas de fix→redeploy→re-test**:
1. Alex (copywriter) al pedirle una proyección financiera se negó a inventar cifras y pidió los datos reales (grounding funcionando) — pero Fiscal, al pedirle copy de Instagram, lo escribió sin derivar a nadie porque su único ejemplo de límite (precios→Midas) no cubría ese caso. Confirma que un solo ejemplo por agente no basta; se añadió una regla genérica de respaldo ("si no encaja con tu OUTPUT, dilo y sugiere qué agente del equipo sí encaja") — commit `cecc4d9`.
2. Repetido el mismo test tras ese fix: Fiscal ya derivaba bien, pero Alex (copywriter), al redirigir, inventó una colega inexistente ("Maya — Estratega de Negocio & Crecimiento") — no está en el roster real de 23 agentes. La regla genérica pedía "sugerir qué agente" sin anclarlo a un roster real, así que el modelo improvisó un nombre plausible. **Fix**: la regla genérica ahora pide citar departamento/especialidad (Comercial, Marketing, Estrategia, Operaciones o Finanzas), nunca el nombre de un colega no verificado — commit `c4aa0e9`.
3. Repetido de nuevo tras ese segundo fix: copywriter → "Estrategia o Finanzas" (sin nombre inventado), Fiscal → "Marketing/Contenido" (sin nombre inventado). Confirmado resuelto.

**Pendiente real que queda**:
- ~~Capa 3 de prompts (quick actions, Business Reports, monthly, documents, ~44 prompts) — siguiente fase explícita.~~ **Cerrado en (pp), 2026-07-30.**
- Defensa estructural completa contra inyección de prompts (la mitigación de hoy es una regla de texto, no un mecanismo de sanitización) — sesión de seguridad aparte.
- ~~Unificación de layout entre archetypes (Analyst/Explorer en 2 columnas vs. el resto apilado) — decisión de diseño, no bug, documentada para una ronda de diseño futura.~~ **Decidido en (pp): mantener, es un patrón master-detail real, no una inconsistencia.**
- ~~`column agent_activity.created_at does not exist` (ver entrada nn) — sigue sin arreglar, no introducido por esta ronda.~~ **Arreglado en (pp).**

---

## pp) Cierre técnico total del sistema de agentes: bug real, migración de storage, i18n ronda 2, modo claro, capa 3 de prompts (2026-07-30)

Sesión maratón, pedida por el CEO como "dale a todo lo que nos falte" tras cerrar (oo). Alcance acordado explícitamente por adelantado: todo lo técnico ejecutable sin nuevas claves/decisiones de negocio, más decisiones de diseño que sí podía resolver yo mismo — explícitamente fuera: Stripe, Canva, ENFORCE_PLAN_LIMITS, defensa anti-inyección estructural, acciones del CEO en su propia cuenta de Google.

**1. Bug real arreglado — `agent_activity.created_at` no existe**: la tabla (migración 0015) nunca tuvo esa columna, solo `started_at`/`completed_at`. `lib/agent-activity-stats.ts` (pestañas Activity/Performance de `/agent/[role]`), `lib/department-stats.ts` (`getAgentStatus`) y el webhook dormido de `agent-activity` seguían consultando/insertando `created_at` → 400 reales en producción. Corregido a `started_at` en los 3 sitios. Commit `49876b9`.

**2. Bucket `brand-assets` migrado a privado + proxy firmado**: recibía adjuntos de negocio (P&L, hilos de email de quick actions) y logos de cliente, público y legible por cualquiera con la URL. Nuevo `/api/brand-assets` (signed URL de 1h, valida sesión + grant de cliente) sustituye `getPublicUrl()` en todos los consumidores; subida de logo movida a `/api/brand-assets/logo` (server-side) en `BrandBrainEditor` y el chat de onboarding — la subida directa desde navegador nunca tuvo policy de INSERT real. `buildAttachmentBlocks` descarga por path (service role) en vez de `fetch(url)` para adjuntos de brand-assets. Eliminado `components/brain/VisualAssets.tsx` (código muerto haciendo lo mismo sin autenticar). Migración 0056 aplicada por el CEO vía SQL editor: bucket a privado + backfill de las 6 URLs de logo reales (Salsa, Dadybox, Discoolver, Startup Factory, NC Global, Adrian Grooves). **Verificado en vivo de punta a punta**: proxy resuelve el logo real de Salsa (200, imagen real), bloquea cross-tenant (403) y path traversal (400); subida re-testeada con un round-trip seguro (re-subir los bytes exactos del logo de Salsa, hash idéntico antes/después); tras aplicar el SQL, la URL pública vieja deja de responder (confirmado con cache-bust) y el dashboard real sigue mostrando el logo vía el proxy nuevo. Commits `5551c57` (código) + `0056...sql` (aplicada por CEO).

**3. Tarjeta de Google Drive en `/integrations` — disconnect falso arreglado**: Drive usa su propio OAuth (tabla `drive_connections`), no `tool_connections` — el botón "Conectado" de la tarjeta, al hacer clic, llamaba al disconnect genérico (tabla equivocada): no revocaba nada real, la UI podía marcar "desconectado" mientras la conexión real seguía activa. Sin un revoke real (llamada a Google + limpieza de `drive_connections`/`drive_folders`, fuera de alcance), se reemplazó por un mensaje honesto explicando cómo revocar desde la cuenta de Google. Verificado en vivo. Commit `43e6e06`.

**4. Coste del chat guiado de quick actions bajado de Opus a Sonnet**: el entrevistador (extracción de campos por tool-use, hasta 8 llamadas por sesión) usaba Opus para una tarea puramente estructural — mismo criterio que ya aplicaba `admin/onboarding/extract`. La generación real de la quick action se queda en Opus. Confirmado con `mira_usage_log` real (~2-2.6k tokens de entrada por turno) y verificado en vivo que el tool-use sigue funcionando igual de bien con Sonnet. Commit `663f400`.

**5. Limpieza de código muerto**: ruta `app/api/toolkit/deliverables` (único consumidor de la tabla legacy `toolkit_results`) eliminada. Verificado que la entrada (g) de este mismo documento ya estaba resuelta de una sesión anterior no documentada (los 2 prompts huérfanos que mencionaba ya no existen; `DepartmentQuickActions.tsx` se relocalizó y hoy se usa activamente en 5 páginas) — actualizada, no repetido el trabajo. Commit `98e996b`.

**6. Decisiones de diseño**:
- **Layout de archetypes (Analyst/Explorer en 2 columnas vs. el resto)**: investigado a fondo — es un patrón master-detail real (lista + panel de inspección sticky que aparece al seleccionar un lead/competidor), no una inconsistencia. Unificarlo perdería usabilidad real. Decisión: mantener tal cual.
- **Agente `onboard` sin dato real**: confirmado que no existe ningún quick action, tool de Business Reports o tabla ligada a este rol en todo el producto (es "Procesos, SOPs y formación de equipos" de Operaciones, no progreso de un wizard de cliente) — construir uno real sería una feature nueva (tracker de SOPs), no una tarea de wiring de esta ronda. Se queda vacío honesto por diseño, no por pereza.

**7. i18n ronda 2 — 541 claves + wiring completo de 32 archivos**: auditoría con 5 agentes en paralelo encontró ~29 archivos con literales sin traducir (mucho más de lo esperado — comparable en volumen a toda la sesión de arquetipos anterior). Cobertura completa: árbol de Toolkit (brand-briefing, investor-deck, competitive-analysis, brand-book, monthly-content-system, overview, report/[id], cards, hub), Comercial completo (page, IcpCriteriaPanel, qualify, icebreaker, scoring, pipeline, discovery, proposals, CrmContactsPanel), `agent-workspace.tsx`, `document-uploader.tsx`, AgentWorkspace en Finanzas/Strategy. Proceso: claves añadidas primero a `lib/i18n.ts` en un solo commit controlado (evitando el bug de mezcla ES/EN de la sesión anterior), luego 10 agentes en paralelo aplicaron el wiring, cada uno tocando solo sus propios archivos (nunca `lib/i18n.ts`, evitando conflictos de escritura concurrente). Symmetry ES/EN verificada: 1747/1747. **Bugs reales encontrados durante el wiring, no solo cosméticos**:
- `pipeline/page.tsx`: 7 de 8 etiquetas de `STAGES` nunca se localizaban (el fallback leía `.label` crudo en vez de pasar por `t()`) — corregido con un `Record<LeadStage,string>` exhaustivo.
- `icebreaker/page.tsx`: los 2 prompts de IA a Claude (`generateFromLead`/`generateManual`) se enviaban siempre en español pese a que `locale` ya viajaba en el body.
- `toolkit/page.tsx`: `FALLBACK_DESCRIPTIONS` y los tool-configs de competitive-analysis/brand-book/monthly eran consts a nivel de módulo que no podían llamar a `t()` — convertidos a funciones `get*Config(locale)`.
Decisión: títulos con emoji + nombre de agente estilizado (Quinn, Finn, Vera) se dejaron hardcodeados, mismo precedente que "Rex — Lead Discovery" de la ronda 1 (branding, no copy traducible). Commits `1395d1e` (claves) + `632a541` (wiring). Verificado en vivo: pipeline/icebreaker/brand-briefing/finanzas-plan/strategy-proyectos cargan sin errores de consola tras el deploy.

**8. Modo claro — 3 bugs sistémicos reales, no solo cosméticos**:
- `.text-white` se remapeaba a texto casi negro en modo claro para CUALQUIER uso, rompiendo ~30 botones CTA de color saturado (`bg-violet-600`, `bg-[#EC4899]`...) donde el fondo ya daba el contraste.
- Los selectores de atributo que intentaban remapear estilos inline (`rgba(255,255,255,...)`, `#ffffff`) en modo claro NUNCA matchearon nada: comparaban contra el string fuente del JSX, pero React serializa el atributo `style` vía CSSOM real (espacio tras cada coma, hex convertido a `rgb()`) — verificado con Playwright. Afectaba a `agent-pipeline-header.tsx` (usado en Marketing/Finanzas/Operations/Strategy) y varias páginas más.
- Los 5 componentes "Result" de Toolkit (action-plan, competitive-analysis, investor-deck, marketing-audit, seo-audit — reusados en Strategy) usaban una paleta neón como color de texto, ilegible en modo claro.
Los 3 arreglados vía el mismo mecanismo de selector de atributo (ahora corregido para matchear la forma real serializada), sin tocar los componentes. Más limpieza: 23 clases Tailwind `bg/border-[#COLOR]NN` sin la barra de opacidad (nunca aplicaban ningún tinte en ningún tema) en Integraciones y Brain. Commit `0ad1a22`. Verificado en vivo: botones de Integraciones muestran texto blanco correcto en modo claro; el mecanismo de selector confirmado funcionando con Playwright antes de aplicar.

**9. Capa 3 de prompts — cierre completo**: de los 19 prompts de quick actions, 6 estaban muy por debajo del nivel de sus hermanos en el mismo fichero (un one-liner genérico sin ninguna regla vs. reglas concretas de tono/longitud/estructura): `responder_ticket`, `crear_faq`, `crear_tutorial`, `crear_newsletter`, `crear_video_brief` reescritos con reglas concretas de qué SÍ y qué NO hacer (mismo JSON schema, verificado contra `QuickActionResult.tsx` para no añadir campos que la UI nunca renderizaría); `analisis_cashflow` ganó la misma regla de grounding numérico que ya tenían sus hermanos. Los 13 quick-actions restantes, los 11 tools de Business Reports (`toolkit-prompts.ts`), los 3 de `monthly-prompts.ts` y los 4 de `document-prompts.ts` ya estaban en nivel experto (reglas de grounding explícitas, tiers de dependencias, anti-alucinación por campo) — revisados los 18, cero cambios, mismo criterio de "mejora quirúrgica, no reescritura" que capa 1-2 (no forzar cambios donde no hacen falta). De los "otros" prompts sueltos: `brand-brain/analyze-document` mejorado (reglas de extracción concretas + marca `[CONFLICTO]` si el documento contradice el perfil actual); `brand-brain/[clientId]/route.ts` eliminado por ser código muerto (nunca llamado, columnas de schema que ya no existen). Commits `08abe86` + `3614224`. **Verificado en vivo**: `responder_ticket` y `crear_newsletter` probados con datos reales de Salsa — la calidad del output es notablemente superior a lo que el prompt genérico anterior habría producido (tono de marca capturado con precisión, distinción correcta entre lo que puede resolver el agente vs. lo que necesita confirmación humana).

**Pendiente real que queda de esta ronda**:
- Defensa estructural completa contra inyección de prompts — sigue pendiente, sesión de seguridad aparte (ya documentado en (oo), no repetido aquí).
- Idea abierta sin decidir: un chat unificado (no por departamento) donde el CEO pida lo que sea y el sistema llame internamente a los agentes que hagan falta — ver `docs/NEXT_STEPS.md` punto 13, no empezar sin diseñarlo primero.
- 4 clientes con Drive reconectado y CEO acciones pendientes (ver `docs/NEXT_STEPS.md`), sin relación con esta ronda.

---

## qq) ✅ Auditoría de producción-robustez pre-lanzamiento (Tier 0-4) + Sentry intentado y revertido + conexión Apollo/Hunter (2026-07-30)

Pedida por el CEO como auditoría completa de "qué falta antes del lanzamiento", con el modelo de negocio aclarado explícitamente primero: NO es un lanzamiento self-serve/facturación — el CEO sigue dando de alta a cada cliente a mano (Salsa Burgers, Dadybox, Discoolver, NC Global Assets, Adrian Grooves, Startup Factory); el objetivo era confirmar que el sistema ACTUAL es sólido/seguro a nivel producción, sin tocar el backlog ya conocido (Stripe, Canva, ENFORCE_PLAN_LIMITS, Visual Production Track B, defensa anti-inyección estructural — todo eso queda fuera). 3 agentes Explore en paralelo (seguridad/aislamiento de inquilinos, fiabilidad/manejo de errores, cruce de documentación+rendimiento) + 1 agente Plan que releyó cada fichero él mismo en vez de fiarse de los resúmenes, y corrigió 2 hallazgos falsos antes de escribir el plan final.

**Tier 0 — el hallazgo "crítico" inicial resultó ser falso, verificado en vivo antes de escribir ninguna migración**: la auditoría cruda daba por hecho que `brain_versions`/`brain_resources`/`brain_learnings` (migración 0009, RLS nunca activada) tenían una fuga cross-tenant explotable porque `components/brain/BrainVersionHistory.tsx`/`BrainResources.tsx` las consultaban con el cliente anon-key del navegador. Verificado contra la API REST real antes de tocar nada: `PGRST205 — could not find the table` para las 3 — la migración 0009 nunca se aplicó a producción. No hubo nunca fuga real. **Resuelto** (commit `0a1cc16`): en vez de la migración RLS planeada, se borraron los 2 componentes muertos (confirmado cero importadores).

**Tier 1 — trust-boundary reales, baratos de arreglar** (commit `8685387`):
1. `mira_project_access` seguía dejando que el plan `'admin'` (asignable de verdad, no solo super_admin) leyera toda la tabla de grants cross-tenant — resto de una política de emergencia de una incidencia anterior ya resuelta. Antes de aplicar el fix se descubrió que la única cuenta real con `plan='admin'` (`carlos@startupsfactory.es`, la del propio CEO) solo tenía grant explícito para Startup Factory — apretar la política la habría dejado fuera de gestionar Integraciones de los otros 5 clientes reales. Preguntado al CEO, decidió backfillear grants reales primero. Migraciones aplicadas en producción por el CEO vía SQL editor: `0058_fix_mira_project_access_admin_plan.sql` (quita la rama `'admin'` de la política) y `0059_carlos_agency_grants.sql` (grant `admin` real sobre los 5 clientes activos para esa cuenta — corregido antes de aplicar un bug propio de nombre de columna, `client_id`→`project_id`, detectado leyendo la migración 0025 de rename).
2. `app/api/admin/{execute,apply}-migrations/route.ts` gateados solo por `WEBHOOK_SECRET` (compartido con webhooks de n8n) en vez de sesión/super_admin — ambos inertes hoy (no pueden ejecutar DDL vía REST de Supabase de todos modos). Eliminados.
3. `lib/auth-server.ts::requireClientAccess()` (único caller: `integrations/tools/route.ts`) comprobaba `user_metadata.client_id` directo, ignorando la tabla de grants — un segundo mecanismo de autorización sin auditar frente al patrón estándar (`resolveRequestClient`, usado por 35+ rutas). Consolidado: los 3 handlers de `integrations/tools/route.ts` migrados a `resolveRequestClient`; `lib/auth-server.ts` y un tercer helper completamente muerto (`lib/require-client-access.ts`, cero importadores) eliminados.

**Tier 2** (commit `aaf5f9f`): 19 rutas de debug/fix/init/populate huérfanas eliminadas (`debug-dadybox`, `fix/rls-all`, `ensure-tables` — este último con un patrón `supabase.rpc('exec', {sql:...})` de SQL arbitrario vía RPC que no debía existir ni dormido —, y 16 más), todas con cero referencias fuera de `app/api/` verificadas antes de borrar.

**Tier 3 — rendimiento** (commit `d5149d8`): `app/api/agent/route.ts` (la ruta más usada de toda la app, el chat de los 23 agentes) no tenía `maxDuration` a diferencia de sus comparables — añadido `maxDuration=300`. Migración `0060_hot_path_indexes.sql` (aplicada en producción) añade índices en `approval_queue`/`post_history`/`alerts`/`agent_interactions`/`crm_contacts` — corregida sobre la marcha la asunción de la auditoría cruda de que `crm_contacts` tiene `client_id` (no lo tiene, solo `workspace_id`).

**Tier 4 — observabilidad, con un hallazgo real de mayor peso que el resto de la ronda**: se intentó añadir Sentry (`@sentry/node` + `instrumentation.ts`, mismo patrón que `apps/sf-cms`) para cerrar el hueco real de "ningún error se ve salvo que un cliente se queje" (documentado ya en ~30 incidencias de este mismo fichero). **`@sentry/node` rompe el build real de producción**: su auto-instrumentación de OpenTelemetry (`import-in-the-middle`) usa APIs de Node puro (`worker_threads`, `node:child_process`) que webpack no puede empaquetar al llegar vía `instrumentation.ts`. Añadir `@sentry/node` a `serverExternalPackages` (mismo mecanismo que ya soluciona el problema de `pdf-parse` en este mismo `next.config.ts`) **no lo arregla** — confirmado con un `npm run build` real, no solo `tsc --noEmit` (el fallo es invisible al typecheck). **Revertido por completo** (commit `8913f4d`): `instrumentation.ts`, `lib/capture-error.ts`, la dependencia y las 2 llamadas `captureError` vueltas a `console.error` plano — manteniendo el fix real e independiente de N+1 (`Promise.all` en `getDepartmentStats` y `getToolkitDependencies`, que no dependía de Sentry para nada). `vercel ls`/`vercel inspect` confirmaron que el build fallido nunca llegó a servir tráfico (Vercel no promociona un deploy en error), pero todo el lote de Tier 4 quedó bloqueado hasta el revert. **Pendiente para una sesión dedicada**: la opción correcta es `@sentry/nextjs` (SDK completo, con su propio plugin de webpack pensado exactamente para este problema) en vez de `@sentry/node` a pelo.

**Nota que resuelve la duda que dejó abierta la entrada (pp)**: `apps/sf-cms` usa el mismo `@sentry/node`+`instrumentation.ts` y su `next.config.ts` **ni siquiera tiene** `serverExternalPackages` para él — y aun así construye limpio. Probado en vivo (`SENTRY_DSN=<fake> npm run build` real en `apps/sf-cms`, no solo lectura de código): compila sin el error de `worker_threads`/`import-in-the-middle` que tumbó a MIRA. Diferencia real entre ambos: sf-cms está en **Next 16** (`"next": "^16.0.0"`), MIRA en **Next 15.3.9** — el bundler de Next 16 externaliza/resuelve este tipo de dependencia Node-only de forma distinta. Confirmado además que `SENTRY_DSN` **no está configurado en Vercel producción de sf-cms** (variable ausente), así que ese camino nunca se ha ejercitado de verdad en producción — el hallazgo es "el build no se rompe", no "Sentry ya está capturando errores ahí". No se toca sf-cms en esta ronda (fuera de alcance de esta auditoría, que es solo MIRA); queda anotado para cuando se retome observabilidad real en cualquiera de las dos apps.

**Incidente de sesión concurrente, sin pérdida de datos**: los ficheros de Tier 4 quedaron mezclados en un commit ajeno de Discoolver (`c2f64ca`) por una carrera de `git add`/`git commit` con otro proceso trabajando en paralelo en el mismo repo — verificado con `git show --stat`/`git log --oneline --all -- <fichero>` que los 7 ficheros están completos y correctos dentro de ese commit, no se intentó ninguna reescritura de historia. Ver memoria `feedback_git_commit_pathspec_scoping` (ya recogida por otra sesión) — de ahora en adelante todo commit en este repo debe ir acotado por pathspec (`git commit -m "..." -- <path>`, el flag `-m` siempre antes de `--`).

**Verificación en vivo tras el deploy corregido** (Playwright, sesión real): `/home`, `/roster` (ambas ejercitan el `Promise.all` de `getDepartmentStats`), `/integrations` (ejercita el `resolveRequestClient` consolidado; tarjetas de Apollo y Hunter visibles) y `/toolkit/brand-book` (ejercita el `Promise.all` de `getToolkitDependencies`) — las 4 sin ningún error de consola.

**Apollo.io + Hunter.io — nada que construir**: la integración ya existía de punta a punta (`lib/integrations/marketplace-tools.ts` ya las lista con `status:'disconnected'`, `api-validators.ts` ya valida contra los health-checks reales de cada proveedor, Discovery "modo profundo" ya gatea con un error real `apollo_hunter_not_connected`, no silencioso). El CEO se dio de alta con cuentas reales en ambos servicios para probar la parte comercial — la única acción pendiente es suya: pegar las 2 API keys reales en `/integrations` desde la UI. **Deuda conocida y aceptada explícitamente por el CEO ("conectar ya, cifrado después")**: las keys quedan en `tool_connections.metadata` en texto plano — ver entrada **(c)** de este mismo documento, sigue siendo la misma deuda, no una nueva.

---

## rr) Chat por departamento + informes de decisión interactivos + 1 bug real de CRM (2026-07-30)

Continuación el mismo día de (qq). El CEO envió una tanda de ideas "para pensar" de cara al lanzamiento a clientes finales — se entró en modo plan, se exploró el código, se hicieron preguntas de alcance y se ejecutó lo aprobado. Además, mientras corría en background el barrido completo de deuda pendiente (pedido justo antes de esta tanda), se lanzó una segunda investigación en vivo sobre 5 puntos concretos del mensaje del CEO — encontrando un bug real no reportado y confirmando que una feature pedida ya existía.

**Bug real encontrado y corregido, severidad reevaluada tras verificar en vivo**: el CEO no reportó esto, salió de la investigación de "¿funciona el CRM?". `/comercial/pipeline` y `/comercial/icebreaker` consultaban `leads` directo desde el navegador (cliente anon-key) dentro de un `useEffect` sin ningún guard `if (!clientId) return` — el primer render dispara la query con `client_id=eq.undefined` (400 + error de consola) porque `useActiveClient()` resuelve el cliente activo de forma asíncrona. **La primera pasada de investigación concluyó "CRM roto" viendo 0 leads con error de consola — pero verificado de nuevo con un cliente que sí tiene leads reales (NC Global Assets, 3 filas), el pipeline los mostraba perfectamente**: el "0" observado con Salsa Burgers era el dato real (0 leads legítimos), no un bug. El único defecto real es el ruido de la carrera del primer render, cosmético pero real. **Resuelto**: guard `if (!clientId) return` en ambas páginas, mismo patrón que ya usa `use-department-stats.ts`.

**Chat "Cuéntale a MIRA" — ya existía, confirmado con el CEO**: la feature que pidió (actualizar el brand brain hablando, sin subir documentos) es exactamente P6 (`ec7c03a`, 29/07), verificado intacto byte a byte. El problema era descubribilidad: tarjeta cerrada por defecto en `/brand-brain`, sin ningún color/badge distinto a las demás. **Resuelto**: se abre sola la primera vez por navegador (localStorage), borde ámbar + badge "SIN FORMULARIOS".

**Bug del wizard de alta reportado por el CEO, sin poder reproducir en vivo esta sesión**: "solo trae el chat, no deja volver atrás". El código de `/admin/onboarding` (`WizardShell.tsx`, commit `6f92b8a`) contradice el reporte — 5 pasos, botón Atrás funcional, revisión editable, tal como se construyó. No se pudo reproducir en vivo porque la única sesión de prueba disponible (`nirada@ncglobalassets.com`) es una cuenta cliente sin acceso a `/admin/*` (redirige a `/home`, correcto por diseño). **Pendiente real**: reproducir con la sesión real del CEO (super_admin) — hipótesis más probable es que entrara por `/admin/onboarding/chat` (el chat libre, que sigue existiendo aparte a propósito) pensando que era el alta.

**Chat por departamento (opción A: una sola voz), construido y verificado en vivo**: nuevo rol virtual `dept:<slug>` en `app/api/agent/route.ts` que reutiliza el mismo loop de tool-use/memoria/Brand Brain del chat de un agente, con un system prompt sintetizado (`lib/department-prompt.ts`) que combina la experiencia de todos los agentes del departamento en una sola voz — sin inventar nombres de colegas fuera del roster real (misma regla que ya se añadió a los 23 prompts en (oo)). Nueva página `/agent/dept/[slug]` + botón "Hablar con todo el equipo" en las 5 páginas de departamento (nuevo prop `action` opcional en `PageHeader`, retrocompatible con sus otros 13 usos). Verificado en vivo contra Salsa Burgers: respuesta real y bien fundamentada en la marca del cliente.

**Informes de decisión interactivos (MVP), la pieza más grande de la ronda**: el CEO pidió, desde la gestión de clientes en super admin, poder crear un informe narrativo con un formulario de decisión embebido (aportó un ejemplo real completo preparado para Adrian Grooves — resumen ejecutivo, diagnóstico, benchmark, opciones de precio con "choice cards" de una/varias opciones marcadas como recomendación, notas libres). En vez de un sistema nuevo en paralelo, se generalizó el de cuestionarios ya existente (P5, migración 0054): `questionnaire_questions.kind` `select`/`multi_select` + `options` (jsonb) ya cubría "una o varias opciones" — solo hacía falta que `options` aceptase objetos `{label, description?, recommended?}` además de strings planos, y que el runner pasara de `<select>`/checkboxes nativos a choice cards clicables con badge de "Recomendación". Migración **0061** (columna `narrative` jsonb en `client_questionnaires`, array de `{heading?, body}` mostrado antes de las preguntas) — **redactada, PENDIENTE de aplicar por el CEO**. Nuevo builder manual `/admin/questionnaires/new` + botón "Crear informe de decisión" por cliente en `/admin/users` (pasada 1: redacción manual, sin IA todavía). El gating de solo-ver/responder para el plan `consulta` ya existía y se reutiliza sin cambios.

**Verificado en vivo con datos sintéticos desechables** (creados y borrados por ID exacto contra NC Global Assets, nunca un cliente de negocio real): choice cards de una y varias opciones, badge de recomendación, clic-para-seleccionar, autosave, y persistencia tras recargar — las 5 cosas funcionando de punta a punta. **Un intento de verificación salió con un error real de React (#31, "objects are not valid as a React child")** — resultó ser que aún no había hecho `git push` del código nuevo, así que producción seguía sirviendo el `<select>` nativo antiguo intentando renderizar mis opciones-objeto nuevas; repetido tras el deploy correcto, limpio. La narrativa (migración 0061) no se pudo probar en vivo todavía porque la columna no existe en producción hasta que el CEO la aplique.

**Deuda corregida de paso durante el barrido completo de `docs/DEBT.md`** (pedido separado del CEO, "qué nos falta de deuda"): 61 de 71 ítems verificados en vivo uno por uno (no solo releídos) — la mayoría siguen abiertos tal como estaban documentados, pero 14 resultaron ya resueltos sin que el documento lo reflejara (entradas **(a)** y **(f)** corregidas arriba; el resto — migración 0051, bucket `brand-assets`, tags de dependencias, riesgo de timeout de monthly, extracción de PDF — ya estaban correctamente marcadas ✅ en rondas anteriores, solo la redacción cruda de la primera pasada del barrido no había cruzado esa información).

**Pendiente real que queda de esta ronda**:
- ~~Aplicar migración 0061~~ ✅ **Aplicada y verificada en vivo el 2026-07-30**: confirmado que la columna existe (`select=id,narrative` pasa de 400 a 200) y probado de punta a punta con un cuestionario sintético real contra NC Global Assets — 2 secciones narrativas (una con encabezado, una sin) se renderizan correctamente antes de las preguntas, sin errores de consola. Datos de prueba borrados por ID exacto.
- Reproducir en vivo el bug del wizard de alta con la sesión real del CEO — confirmar si es `/admin/onboarding/chat` vs `/admin/onboarding`, o algo más.
- Fase 2 (explícitamente no construir todavía, solo pensada): BYO-Claude para clientes (arquitectura ya lista vía `getClaudeForClient`/`used_client_key`, falta decisión de modelo de precio) y explicar el consumo a clientes (los datos ya existen en `mira_usage_log`, falta decidir si es una vista cliente-facing o solo argumentario del CEO).
- Generación por IA del contenido narrativo de los informes de decisión (pasada 2, no construida a propósito en esta ronda).

---

## ss) Revisión adversarial de (rr) — 5 hallazgos reales corregidos + bug del Centro de Documentos encontrado por el CEO (2026-07-30)

El CEO pidió "revisa que esté todo bien" sobre lo construido en (rr). Se lanzó una revisión de 4 ángulos en paralelo (seguridad/control de acceso, riesgo de regresión en ficheros compartidos, corrección de la lógica nueva, smoke-test en vivo) + una fase de verificación escéptica independiente de cada hallazgo antes de aceptarlo. 5 hallazgos, los 5 confirmados con repro real (no solo lectura de código), los 5 corregidos:

1. **[medio] Prototype pollution en el chat por departamento**: `DEPARTMENT_METADATA`/`DEPT_AGENTS` son objetos planos; `slug in DEPARTMENT_METADATA` y el acceso directo por índice devuelven propiedades HEREDADAS de `Object.prototype` para slugs como `constructor`/`__proto__`/`toString`/`valueOf` — un usuario autenticado podía mandar `role:"dept:constructor"` a `/api/agent` y tumbar la petición con un 500 (mensaje de error interno crudo expuesto), o romper `/agent/dept/constructor` en el cliente. **Resuelto**: `Object.hasOwn(...)` antes de indexar en los 2 puntos de validación (`parseDepartmentChatRole`, `getDepartmentBySlug`) + defensa en profundidad en `getDepartmentAgents`. Verificado en vivo: los 4 slugs maliciosos (`constructor`, `__proto__`, `toString`, `hasOwnProperty`) devuelven 404 limpio; la página cliente muestra el 404 en vez de romperse.
2. **[alto] `POST /api/questionnaires` acoplaba CUALQUIER creación de cuestionario a la migración 0061**: el insert mandaba siempre la clave `narrative` (aunque fuera `null`), así que sin la migración aplicada, hasta un cuestionario normal sin narrativa fallaría. **Resuelto**: solo se incluye la clave cuando hay contenido real; si aun así falla por la columna ausente, 503 con mensaje claro en vez de 500 crudo.
3. **[alto] Choice-cards con label duplicado quedaban indistinguibles**: el label de la opción se usaba como React `key` Y como valor comparado — dos opciones con el mismo texto (typo/copy-paste en el builder) se seleccionaban/deseleccionaban como una sola, con el warning de React de keys duplicadas de propina. **Resuelto**: `key` pasa a ser el índice (fix inmediato) + validación nueva en el builder (cliente y servidor) que exige ≥2 opciones con texto y sin duplicados por pregunta — cierra la causa, no solo el síntoma.
4. **[alto] El builder dejaba crear una pregunta de opción sin ninguna opción**: si era obligatoria, el cliente no tenía ninguna tarjeta que pulsar y el cuestionario quedaba en un callejón sin salida. Misma validación del punto 3 lo cubre.
5. **[medio, no arreglado, documentado]** Si un admin edita/borra una opción después de que el cliente ya respondió (hoy solo posible entrando directo a Supabase — el builder no tiene edición post-creación), el valor guardado ya no corresponde a ninguna tarjeta actual pero sigue contando como "respondida" para la validación de obligatorias. No se arregla ahora: no existe ningún camino de UI que lo produzca hoy; anotado para cuando se construya edición de cuestionarios existentes.

**Aparte, mientras corría la revisión, el CEO reportó un bug real de producción en el Centro de Documentos** (no relacionado con (rr) — sistema mucho más antiguo): pidió un playbook sobre "Inteligencia Artificial y Logística" para el pilar Radar Logístico de Dadybox y recibió una guía editorial de "cómo escribir esto" en vez de contenido real, con varios datos como `[COMPLETAR: dato real]` sin que el sistema investigara nada.

**Causa raíz real** (verificada leyendo el código, no solo el síntoma): el Centro de Documentos (`lib/generation/document-prompts.ts`, 4 tipos: playbook/deck/results/onepager) **nunca tuvo grounding web** — a diferencia de Business Reports (`competitive-analysis`/`investor-deck` en `app/api/toolkit/generate/route.ts`) y el chat de agentes, aquí el modelo solo tenía Brand Brain + memoria interna, cero investigación externa; de ahí los `[COMPLETAR]` sin rellenar. Y "Playbook Operativo" es **por diseño** una guía interna de ejecución (`docs.type-playbook-desc` ya lo decía: "Guía paso a paso con estrategia, ejecución y métricas"), no la pieza de contenido final — coincidía exactamente con lo que pedía su propio prompt, pero no con lo que el CEO esperaba, sin ningún aviso del desajuste.

**Resuelto (2 fixes complementarios)**:
1. **Investigación real**: mismo patrón que `competitive-analysis`/`investor-deck` (búsqueda previa y determinista con Tavily sobre el campo "Tema", no un tool-use interactivo — esto es generación de un solo turno, no un chat). Los 4 tipos de documento reciben ahora un bloque de fuentes reales cuando hay tema.
2. **Aviso de alcance explícito**: si el "Tema" describe claramente una pieza a publicar (newsletter, post, artículo) en vez de un proceso de negocio, el documento debe decirlo como primera sección y señalar Quick Actions (`crear_newsletter`/etc.) como la vía correcta para el contenido final. Descripción de "Playbook Operativo" en la UI aclarada en el mismo sentido (ES/EN).

**Verificado en vivo con una generación real completa** (NC Global Assets, tema "Inteligencia artificial en logística de comercio internacional", limpiado después por ID exacto): la Sección 1 del resultado real dice literalmente *"Antes de empezar: esto es la guía, no la newsletter... Para generar la pieza final —con copy, asuntos de email y CTA— usa las Quick Actions de MIRA (crear_newsletter)"* — el aviso de alcance funcionando exactamente como se diseñó. Las secciones de ejecución citan datos reales con fuente (`-15% costos, +35% inventario (McKinsey, vía Oracle [2])`) en vez de placeholders, y el propio documento incluye un array `data_gaps` honesto listando qué datos internos de NC Global (tasa de apertura, tamaño de lista) no estaban disponibles y hacían falta para fijar objetivos — ni inventados ni simplemente omitidos.

**Pendiente real**: nada bloqueante. La generación por IA de la narrativa de los informes de decisión (Tier 4 de (rr), pasada 2) sigue fuera de alcance a propósito.

---

## tt) `web_search` agéntico extendido a Quick Actions y Monthly Content System (2026-07-30)

El CEO, tras ver el aviso de alcance del Centro de Documentos (ss), pidió explícitamente que los generadores de CONTENIDO real (Quick Actions — `crear_newsletter`, `crear_post`, etc. — y Monthly Content System) no se limiten a repetir un aviso de "esto es una guía, no el contenido" una y otra vez, sino que sean lo bastante inteligentes para investigar de verdad cuando les falte información, igual que ya hace el Centro de Documentos.

**Diferencia deliberada de patrón frente al fix de (ss)**: el Centro de Documentos usa búsqueda determinista (una query fija a partir del campo "Tema", antes de generar) porque ahí SIEMPRE hay un único campo de tema claro por brief. Quick Actions tiene 20 tipos de acción con campos de formulario distintos entre sí (no hay un "tema" único y consistente) — en vez de escribir lógica de construcción de query a medida para cada una (que sí tiene sentido para 2 tools concretos de Business Reports, `competitive-analysis`/`investor-deck`, ver arriba), aquí se usa el patrón **agéntico**: se le da a Claude la tool `web_search` y decide POR SU CUENTA, mirando lo que ya tiene (Brand Brain, memoria de proyecto, documentos, el brief del usuario), si necesita buscar algo — igual que ya hace el chat de los 23 agentes desde 2026-07-23.

**Implementado**: nuevo helper compartido `generateWithWebSearch` (`lib/grounding/web-research.ts`) — mismo tool-use loop que `app/api/agent/route.ts` (ejecutar la búsqueda real, devolver el resultado, continuar hasta la respuesta final) pero sin streaming, para generación batch de un solo turno. `WEB_SEARCH_TOOL` se centralizó ahí (antes duplicado dentro de `agent/route.ts`). Conectado en:
- `lib/quick-actions/generate.ts`: las 20 quick actions ganan la tool de golpe, sin tocar cada prompt uno a uno.
- `lib/generation/monthly-generate.ts`: las 3 fases del Monthly Content System (`callAndParse`, helper ya compartido entre ellas) — `maxToolLoops=2` en vez del default 3, para no arriesgar el presupuesto de `maxDuration=800` con 3 fases secuenciales.

**Verificado en vivo con 2 generaciones reales de `crear_newsletter`** (NC Global Assets, limpiadas después por ID exacto):
1. Un tema deliberadamente especulativo ("tarifas arancelarias 2026", datos que hoy no existen de forma confirmada): el modelo **no buscó** — decidió que no había nada fiable que encontrar y fue honesto al respecto (`[SUPUESTO]` explícito, `data_gaps` listando qué faltaba) en vez de inventar cifras o buscar sin sentido. Confirmado con `mira_usage_log`: **1 sola llamada**, sin tool-use.
2. Un tema real y actual ("inversión extranjera reciente en Tailandia, con fuente"): el modelo **sí buscó** — `mira_usage_log` confirma **2 llamadas** (170 tokens de salida en la primera, la tool-call; 9959 tokens de entrada en la segunda, ya con los resultados de búsqueda incorporados). El newsletter final citó cifras reales verificables (aprobaciones del Board of Investment tailandés, 38.700M$, +37% interanual, fuente indicada) en vez de placeholders o invenciones.

Este par de pruebas confirma el comportamiento exacto que pidió el CEO: ni búsqueda forzada e innecesaria, ni invención — el modelo busca cuando de verdad hace falta y se queda callado/honesto cuando no hay nada real que encontrar.

**Pendiente real**: Monthly Content System comparte el mismo mecanismo ya probado en Quick Actions pero **no se verificó en vivo por separado** (3 llamadas Opus secuenciales, más caro y lento de probar) — riesgo bajo dado que es el mismo helper, pero queda como pendiente de verificación si se quiere confirmación empírica específica.

---

## uu) Auditoría completa pre-lanzamiento — Brand Brain, Integraciones, chatbots y resto de secciones (2026-07-30)

El CEO pidió una auditoría genuinamente completa ("pásale tus mejores agentes a todo el sistema... acuérdate del brand brain, integraciones, chatbots y todas las secciones") antes de pasar al plan de lanzamiento y venta. 2 workflows en paralelo (smoke-test en vivo de casi todas las páginas + barrido de seguridad centrado en la clase de bug de prototype pollution ya conocida de (ss); auditoría funcional profunda de Brand Brain/Integraciones/chatbots + revisión de riesgo del código de Quick Actions/Monthly Content System). Hallazgos reales, verificados uno a uno antes de aceptarlos:

**Prototype pollution — 10 sitios más de la misma familia que (ss)**, entre los 2 workflows y un grep de seguimiento propio: catálogos indexados por rol/id de agente en `department-meta.ts`/`department-prompt.ts`/`agent-prompts-i18n.ts`/`agent-quick-prompts.ts`/`agent-archetypes.ts`/`oracle-data.ts`/`plans.ts`/`oauth-config.ts` y las rutas `api/agent/route.ts`/`api/agent/[role]/upload-document`/`home/page.tsx`/`comercial/qualify/route.ts`, más 1 sitio adicional encontrado ya cerrando esta ronda en `department-stats/route.ts` (`allStats[dept]` con `dept` de un query param sin validar) — todos corregidos con el helper compartido `lib/safe-lookup.ts` (`safeLookup`/`safeLookupOr`/`hasOwnKey`) ya introducido en (ss), extendido en vez de reinventado.

**`/client-portal/entregas` crasheaba 8/8 veces para cualquier entrega en estado `queued`/`processing`/`failed`**: `STATUS_COLORS` (mapa de colores de estado) solo cubría los 3 valores post-traducción (`delivered`/`in-review`/`generated`), no los 4 valores reales del CHECK constraint de `generation_queue.status` en su forma cruda. Corregido con `safeLookupOr` + 3 claves i18n nuevas (`portal.entregas.status-{queued,processing,failed}`).

**Brand Brain — 2 bugs reales**: pilares de contenido con `themes` guardado como objetos `{name, focus}` (de un flujo de generación más nuevo) rendían `[object Object]` en vez del nombre — corregido extrayendo `.name` cuando no es string. Un bloque JSX de "Competitive Positioning" duplicado por error en la pestaña "Audiencia y Mercado" (se renderizaba dos veces) — eliminado el duplicado. El error "No se pudo cargar el perfil de marca" que un workflow reportó 4/4 veces **no se pudo reproducir** (6/6 en vivo limpio, el guard de carga ya existe y es correcto) — no se marca como resuelto porque no hay nada que reproducir; queda como posible falso positivo del workflow, no como bug confirmado.

**Carrera `client_id=undefined` — misma familia que el bug de (rr), 4 sitios más sin arreglar todavía**: `comercial/qualify`, `comercial/scoring`, `performance` y `approvals` consultaban Supabase directo desde el navegador en un `useEffect`/`useCallback` sin guard `if (!clientId) return` antes de que `useActiveClient()` resolviera de forma asíncrona — mismo síntoma que (rr) (error de consola en la primera carga, autocorregido en el segundo render). Los 4 corregidos con el mismo guard ya usado en pipeline/icebreaker/calendar. `approvals/page.tsx` además evita montar el canal realtime (`approvals-realtime-undefined`) cuando `clientId` es falsy.

**`GET /api/client/documentation` y `POST /api/client/documentation/upload` — bug real más serio de lo esperado**: ambas rutas usaban `createClient()` (el cliente de navegador, `createBrowserClient` sin adaptador de cookies) dentro de una Route Handler server-side, en vez de `adminClient()` + `getSessionUser()`/`resolveRequestClient` como el resto de la app (incluida su propia ruta hermana `DELETE .../[id]/route.ts`, que sí usa el patrón correcto). Consecuencias reales, no cosméticas: (a) el GET no comprobaba autorización en absoluto — cualquier usuario autenticado podía pasar el `client_id` de OTRO cliente en el query string y leer sus documentos (IDOR real, no solo teórico); (b) el POST llamaba a `db.auth.getUser()` sobre un cliente sin sesión adjunta, lo que probablemente devolvía usuario nulo de forma consistente (401 permanente, no solo intermitente) — explicaría por qué la subida de documentos parecía fallar sin patrón claro. **Corregido**: ambas rutas migradas a `adminClient()` + `getSessionUser()` + `userCanAccessClient()`, mismo contrato que `DELETE`.

**`/login` no redirigía una sesión ya autenticada a `/home`**: confirmado intencional a nivel de middleware (`proxy.ts` lo trata como ruta pública, sin comprobar `user`) — no es un fallo de seguridad (la sesión sigue siendo válida, solo se ve el formulario de nuevo), pero es una fricción de UX real. Añadido un `useEffect` en el propio componente cliente que comprueba la sesión al montar y redirige a `/home` si ya existe.

**`/toolkit` — el 400 de `clients?select=settings` no se pudo reproducir**: el `useEffect` que hace esa query ya tiene el guard `if (!clientId) return`, y `clients.id` es `UUID` (sin mismatch de tipo posible). Sin causa de código identificada — no se descarta que fuera un blip transitorio de red durante el smoke-test original, mismo veredicto que el caso de Brand Brain de arriba.

**No confirmado ni desmentido**: el fetch intermitente "Failed to fetch comercial stats" — `use-department-stats.ts` ya tenía el guard correcto (`if (!activeClient?.id) return`), así que no es la misma clase de carrera; la ruta que consulta (`department-stats/route.ts`) recibió igualmente el fix de prototype pollution de arriba, pero no hay evidencia de que esa fuera la causa de un fallo de red genuino. Queda anotado, no resuelto — no se fabricó un fix sin causa confirmada.

**Verificación**: `npx tsc --noEmit` limpio tras el lote completo; commits acotados por pathspec.

**Pendiente real que queda de esta ronda**:
- Confirmar si "Failed to fetch comercial stats" y el 400 de `/toolkit` eran blips transitorios reales o síntomas de algo no descubierto — sin repro no hay más que investigar por ahora.
- Defensa estructural anti-inyección — sigue pendiente, ya documentado en (oo)/(pp), no repetido aquí.

---

## vv) Brand Brain como "LLM Wiki" (4 fases) + saga de 4 intentos para arreglar la extracción de PDF en Vercel (2026-07-30)

El CEO compartió una metodología ("LLM Wiki": el LLM sintetiza cada fuente nueva de forma persistente contra una base de conocimiento con contradicciones señaladas explícitamente, en vez de RAG plano que redescubre todo en cada consulta) y pidió aplicarla al Brand Brain. Analizado primero, luego planificado en modo plan, luego construido en 4 fases aprobadas.

**Diagnóstico previo a construir nada**: MIRA ya tenía el mecanismo de síntesis correcto (`propose_brain_change` del chat "Cuéntale a MIRA", `brain_change_proposals` con confirmación humana) pero solo se disparaba desde el chat — `lib/drive-sync.ts` solo indexaba (resumen Haiku plano + mapa de carpeta), cero síntesis contra el Brand Brain, cero detección de contradicciones. El único precedente de "contradicción" era el string-prefix `'[CONFLICTO]'` de `analyze-document`, sin estructura ni tratamiento visual.

**Decisión de arquitectura clave**: NO migrar `brand_data` a tablas por sección — sigue siendo un único jsonb, decisión razonada (~11 consumidores directos, objeto deliberadamente abierto y tolerante a legacy). En su lugar, capa de navegación (`lib/brand-brain-pages.ts`, registro estático sección→categoría, reutiliza las 6 categorías ya existentes de `BrandBrainEditor.tsx`) + 2 tablas nuevas aditivas.

**Fase 0 — fundación** (migración `0062_brain_wiki_foundation.sql`): `brain_contradictions` (contradicciones estructuradas, ciclo de vida `open→resolved/dismissed` independiente de la propuesta que las originó — si se rechaza la propuesta, la contradicción sigue abierta), `brain_field_provenance` (de qué sección vino cada cambio), `content_hash` en `agent_documents`, `brain_change_proposals` admite `origin` `drive_sync`/`lint`. Cierre de deuda documental: `brand_references` nunca tuvo `CREATE TABLE` versionado (solo se conocía por 0052, que ya le hacía `ALTER` asumiendo que existía) — creada con `IF NOT EXISTS`. Bug real encontrado de paso: `content_pillars` no tenía la `UNIQUE(client_id,pillar_name)` que el código ya asumía en sus `upsert` — verificado con las 25 filas reales de producción (0 duplicados), fix con fallback seguro (`42P10` → cae a `insert` normal) para no depender de coordinar el deploy con el momento exacto del `ALTER`.

**Fase 1 — la palanca de mayor impacto**: `lib/brain-tools/drive-synthesis.ts` — dado el `brand_data` actual + documentos nuevos/cambiados de una carpeta (por `content_hash`, no por `google_drive_file_id`), Claude Sonnet decide si hay sustancia real que proponer y si algo contradice lo que ya se sabe. Mismo contrato `BrainChange` que ya usa el chat — nunca aplica nada directo. Síntesis una vez por carpeta por sync (no por documento), circuit-breaker de propuestas nuevas por corrida del cron, flag `DRIVE_BRAIN_SYNTHESIS` apagado por defecto.

**Fase 2 — riqueza de wiki**: pestaña "Índice" nueva en `/brand-brain` (última fuente/fecha por sección + badge de contradicciones abiertas, vía `GET /api/brand-brain/index`). `analyze-document` ya no usa el prefijo de texto `[CONFLICTO]` — escribe en `brain_contradictions` estructurado; `BrandBrainSuggestions.tsx` da tratamiento visual distinto (borde/badge ámbar) a un campo con contradicción asociada. Paginación real en `GET /api/brain/proposals` (antes `.limit(30)` fijo sin paginación — huérfanas en silencio para clientes con volumen). Nuevo endpoint agregado `GET /api/brain/proposals/summary` (solo agencia, mismo patrón `WorkspaceStatus<T>` de `lib/sentinel-data.ts`) para no depender de entrar cliente por cliente.

**Fase 3 — lint periódico**: `app/api/cron/brain-lint/route.ts` (semanal, domingos 06:00 UTC, no solapa con drive-sync) + `lib/brain-lint.ts` — por cliente: contradicciones abiertas, secciones vacías (chequeo propio de completitud, no el heurístico de conteo de `formatBrandBrainForPrompt`), secciones sin actualizar 90+ días, carpetas de Drive sin ninguna propuesta derivada. Resultado en `project_memory` (reusa `ProjectMemoryViewer.tsx`, no tabla nueva).

**Saga de 4 intentos para arreglar la extracción de PDF real en Vercel** (encontrada probando la Fase 1 con el Brand Book PDF real de Salsa Burgers — `filesSynced: 0` silencioso, ningún error visible sin mirar logs):
1. `ReferenceError: DOMMatrix is not defined` — `pdfjs-dist` (dependencia de `pdf-parse`) intenta cargar `@napi-rs/canvas` para el polyfill; el binario nativo existe en local (darwin-arm64) pero no en el runtime serverless de Vercel (linux). Intento 1 (`serverExternalPackages`) NO funcionó — confirmado con logs reales, mismo error exacto. Fix real: polyfill propio de `DOMMatrix` (matriz afín 2D funcional, no un stub vacío) — consolidado en `lib/pdf-extract.ts`, que de paso unificó 4 sitios que parseaban PDF por separado con el mismo código duplicado (`drive-sync.ts`, `attachments.ts`, 2 rutas de `upload-document`).
2. Con DOMMatrix resuelto, apareció un 2º error real: `Setting up fake worker failed: Cannot find module pdf.worker.mjs`. Intento con `require.resolve`+`createRequire(import.meta.url)` dentro de `lib/pdf-extract.ts` (bundleado por webpack) falló en runtime: `TypeError: t is not a function`.
3. Causa raíz real: `pdfjs-dist` vive *hoisted* en el `node_modules` de la RAÍZ del monorepo (pnpm workspace), no en `apps/mira/portal/node_modules` — y el fichero del worker no se traza automáticamente al bundle serverless (resolución dinámica, no `import` estático). Fix con `outputFileTracingIncludes` en `next.config.ts` + `require.resolve` (esta vez en el propio `next.config.ts`, Node puro, no bundleado) — pero con ruta ABSOLUTA, que Next.js concatena con el directorio del proyecto en vez de usarla tal cual → deploy roto con `ENOENT` de ruta duplicada (`.../apps/mira/portal/vercel/path0/...`).
4. Fix final: `path.relative(process.cwd(), rutaAbsoluta)` — `outputFileTracingIncludes` siempre espera una ruta relativa al directorio del proyecto, sea cual sea el nivel de hoisting de pnpm. Verificado leyendo el `.nft.json` del build ANTES de desplegar (ya había fallado un deploy por no hacer esto la vez anterior).

**Verificado en vivo de punta a punta con el PDF real de Salsa Burgers** (cliente real, con autorización explícita del CEO para el pilote): tras el 4º fix, `content_hash` pasó de `null` a un hash real, `updated_at` se actualizó (antes atascado en 2026-07-19), `sync_status: completed`, `files_synced: 1` — y la síntesis produjo una propuesta real (`origin: drive_sync`, pendiente de confirmación) más una contradicción real y bien razonada: el Brand Book propone una misión extendida que choca con la misión minimalista actual del Brain, correctamente marcada como contradicción abierta en vez de aplicarse en silencio. Lógica del lint (Fase 3) verificada por separado, solo lectura, contra los mismos datos reales: detecta correctamente las 19 secciones vacías reales de Salsa y no marca su carpeta de Drive como huérfana (sí produjo una propuesta real).

**Pendiente real que queda**:
- ~~Activar `DRIVE_BRAIN_SYNTHESIS=1` para el resto de clientes~~ ✅ **Activado globalmente el mismo día** (`DRIVE_BRAIN_SYNTHESIS=1` en Vercel, es un flag único para todos los clientes, sin granularidad por cliente). Cron de Drive-sync disparado manualmente contra los 5 clientes con carpeta conectada: Salsa Burgers y Dadybox sincronizaron correctamente; **Startup Factory, Discoolver y NC Global Assets fallaron con "Token has been expired or revoked"** — necesitan reconectar Google Drive desde MIRA → Integraciones (acción del CEO, no técnica).
- Revisar/confirmar la propuesta pendiente y la contradicción real que quedaron en `brain_change_proposals`/`brain_contradictions` de Salsa Burgers (dato real, no sintético — no se borró a propósito, es exactamente el resultado esperado a revisar).
- El cron semanal de lint (Fase 3) no se ha ejecutado todavía en producción (solo verificada su lógica por separado) — se activará solo cuando Vercel ejecute el cron programado.
- Generación por IA de la narrativa de los informes de decisión y defensa estructural anti-inyección — ya documentadas como pendientes en rondas anteriores, no repetidas aquí.

---

## ww) Revisión adversarial de (vv) — 9 hallazgos reales corregidos + 2 documentados sin parchear (2026-07-30)

El CEO pidió "pasa una revisión y guardamos" sobre todo lo construido en (vv). Workflow de 4 dimensiones en paralelo (seguridad/auth, corrección/robustez, riesgo de build/config, UI/i18n) + verificación adversarial de cada hallazgo (2 verificadores independientes releyendo el código real, no el resumen, antes de aceptar). 15 hallazgos crudos, **11 sobrevivieron la verificación** (2/2 votos). Los 9 accionables se corrigieron; los 2 restantes se documentan aquí en vez de parchearse (razón explicada en cada uno).

**[HIGH] `brain-lint.ts` marcaba SIEMPRE vacías 6 secciones reales**: `name`/`mission`/`description`/`proposition`/`values`/`tone_of_voice` son columnas planas de `brand_profiles`, fuera del jsonb `brand_data` — la query solo traía `brand_data`, así que esas 6 claves eran siempre `undefined` y `isEmptyValue` las marcaba vacías sin importar su contenido real. Cada cliente activo iba a recibir cada domingo un aviso falso de "6 secciones vacías" en `project_memory`, contaminando la señal de salud del brain para el 100% de los clientes. **Corregido**: la query ahora también trae las 6 columnas planas y las combina con `brand_data` antes de evaluar vacío.

**[HIGH] `content_hash` NULL en documentos preexistentes disparaba un falso "documento cambiado" masivo**: la migración 0062 añadió `content_hash` sin backfill — para cualquier documento sincronizado antes de esa migración, `existing.content_hash` es `null`, y `null !== '<hash>'` es siempre `true` en JS. Con `DRIVE_BRAIN_SYNTHESIS` activo, la primera corrida tras el deploy trataría cada carpeta ya sincronizada como si TODOS sus documentos fueran nuevos — coste de Sonnet innecesario, y riesgo real de reabrir contradicciones que un humano ya había marcado `resolved`/`dismissed` (el dedup solo mira contradicciones `open`). **Corregido**: migración `0063_backfill_content_hash.sql` calcula el mismo hash en SQL (`pgcrypto`, `digest(extracted_text,'sha256')`) para las filas existentes — produce el mismo valor que el cálculo en Node para el mismo contenido, así que si Drive no cambió de verdad, el próximo sync ya no lo verá como cambiado.

**[MEDIUM] Circuit-breaker de propuestas (`MAX_NEW_PROPOSALS_PER_RUN=20`) inalcanzable**: `MAX_FOLDERS_PER_RUN=12` y como máximo 1 propuesta por carpeta → el tope real de una corrida es 12, siempre por debajo de 20. El breaker nunca se disparaba bajo la config actual — código muerto, no una protección real. **Corregido**: bajado a `8`, por debajo de `MAX_FOLDERS_PER_RUN`, para que sí pueda activarse de verdad.

**[MEDIUM] El update final de `drive_folders.sync_status` no comprobaba su propio error**, a diferencia de cada otra escritura de la misma función — un fallo transitorio de red dejaría `last_synced_at` desactualizado en silencio, sin ningún log, y esa carpeta volvería a ser la primera candidata la noche siguiente (orden por `last_synced_at` ascendente), desplazando otras. **Corregido**: comprobación + `console.error`, mismo patrón que el resto de `syncDriveFolder`.

**[MEDIUM] `orphanDriveFolders` se calculaba por CLIENTE, no por carpeta**, pese a reportarse como si fuera por carpeta: si el cliente tenía ALGUNA propuesta `drive_sync` en toda su historia (cualquier carpeta, cualquier momento), TODAS sus carpetas quedaban exentas de marcarse huérfanas para siempre — enmascarando exactamente el problema que este lint está diseñado para detectar. **Corregido**: cruce real por carpeta vía `agent_documents.source_metadata->>drive_folder_row` contra `source_document_ids` de las propuestas.

**[MEDIUM] `BrandBrainIndexView.tsx` ignoraba `res.ok`**: un 401 (sesión expirada) o 403 (grant revocado) se renderizaba como "índice vacío, sin contradicciones" en vez de un error — indistinguible de un Brand Brain genuinamente sano. **Corregido**: estado de error explícito cuando la respuesta no es `ok`.

**[MEDIUM] Panel de contradicciones nuevo con texto español hardcodeado**, sin pasar por `t()`, mezclado con el resto del componente (ya en inglés hardcodeado, deuda preexistente no introducida aquí). **Corregido**: las 2 frases nuevas ahora usan `t()`/`lib/i18n.ts` (ES+EN simétrico) — no se tocó el resto del componente, fuera de alcance de este hallazgo.

**[LOW] Deep-link `?tab=index` no estaba en la whitelist** de `BrandBrainEditor.tsx` pese a añadirse a `TabType`/botones/descripciones — un enlace futuro tipo "revisa esta contradicción" nunca habría abierto la pestaña correcta. **Corregido**: añadido a la whitelist.

**[LOW] `SYNTHESIZE_TOOL` no validaba el shape de cada `change`/`contradiction`** antes de usarlos — sin `strict:true`, un item mal formado (p.ej. sin `field_path`) se habría perdido silenciosamente al fallar el insert por la constraint NOT NULL. **Corregido**: filtro de shape antes de devolver el resultado.

**[MEDIUM, documentado sin parchear] Gate de `/api/brain/proposals/summary` depende de `user_metadata.plan`**: mismo patrón de autorización usado en 25+ ficheros de todo el repo (no introducido por esta ronda) — pero `/summary` es el primer endpoint que expone un agregado cross-cliente (nombres de todos los clientes + propuestas pendientes) detrás de ese mismo gate. `user_metadata` es, por defecto, auto-editable por el propio usuario autenticado vía `supabase.auth.updateUser({data:...})` (a diferencia de `app_metadata`, que exige service role) — no se encontró en el repo ningún trigger que lo bloquee, pero tampoco se pudo confirmar en vivo si el proyecto Supabase real tiene alguna protección fuera del código versionado. No se parcheó solo este endpoint (crearía inconsistencia con los otros 25+ sitios que comparten el mismo patrón) — **queda como hallazgo real para una sesión de seguridad dedicada que revise el patrón `user_metadata.plan` en todo el repo, no solo aquí**.

**[MEDIUM, documentado sin parchear] El polyfill de `DOMMatrix` (`lib/pdf-extract.ts`) es correcto para `getText()`** (multiply/translate/scale/inverse verificados contra la convención estándar de matriz afín 2D) **pero no implementa todos los métodos que pdfjs-dist podría necesitar para renderizar** (miniaturas, export a imagen). Hoy no hay ninguna feature que ejercite esa ruta, así que no se expandió el polyfill de forma especulativa — se dejó un comentario explícito en el código para que quien construya esa feature en el futuro revise el polyfill primero, en vez de asumir que ya está resuelto para renderizado.

**Verificación**: `npx tsc --noEmit` + `npm run build` limpios tras el lote completo de 9 fixes.

**Pendiente real que queda**:
- Aplicar la migración `0063_backfill_content_hash.sql` en producción (SQL editor de Supabase, CEO).
- Sesión de seguridad dedicada para el patrón `user_metadata.plan` en todo el repo (no solo `/proposals/summary`).
- Revisar el polyfill de `DOMMatrix` antes de construir cualquier feature de renderizado de PDF (miniaturas, export a imagen).
