# PRÓXIMOS PASOS — SF Ecosystem (actualizado 2026-08-03)

Estado de referencia: Quick Actions 2.0 + Plan Maestro B1-B5 completos y en producción (bitácora completa en `docs/DEBT.md`, entradas (ii)(jj)(kk)(nn)(oo)(pp)(qq)(rr)(ss)(tt)(uu)(vv)(ww)(xx)(yy)(zz)(aaa)). Migraciones 0048/0049/0050/0051/0056/0058/0059/0060/0061/0062/0063 todas aplicadas. Este fichero lista SOLO lo que queda. Última verificación de vigencia de cada ítem contra el código real: 2026-08-03.

## Discoolver — guías + curador (2026-08-06)

**El producto de guías (dg-editor) queda en un estado cerrado y documentado.** Punto de
partida para la siguiente fase: `ESTADO_2026-08-06.md` en `~/Developer/discoolver-dg-editor`
(repo del cliente, fuera del monorepo). La **integración con el curador de Discoolver** se
planifica en otro hilo.

**Web pública reposicionada y en producción** (commits `4cf6f32`..`f668658`): la home pasa a
ser tienda editorial de guías y `/influencers` a landing de captación de creators con dos
tracks. La **landing de la app** quedó sustituida por el cambio y se recuperó del histórico en
`clients/discoolver/app-landing`, con proyecto Vercel y páginas de CMS propias. Las tres webs
y sus dominios, en el registro de proyectos.

**Pendiente del CEO (bloquea el piloto de guías con creators):** foto de los dos influencers,
crear la cuenta de Apify y pasar el token, alta en Gumroad o Lemon Squeezy, domicilio fiscal y
NIF para la página de privacidad, y revisión legal del acuerdo de creator.

**Pendiente de Diego:** los endpoints de listado del CMS (`/cms/v1/business|city|category`)
devuelven 500 con el usuario `atenea`, y hace falta una URL pública canónica por negocio — es
lo que se codifica en el QR impreso de cada ficha. Documento completo:
`spring-handoff/INTEGRACION_CMS_2026-08.md`.

**Sin resolver:** `discoolver.com` sirve una web antigua en inglés distinta de las dos
actuales. O se migra o se redirige, pero hoy hay contenido duplicado indexándose.


## Auditoría de stack técnico + limpieza (DEBT xx→zz, 2026-07-31) — ✅ CERRADO COMPLETO

Fases A-D ejecutadas y verificadas (commits `82bb05d`..`1056fa7`): cruft huérfano y paquetes vacíos borrados, bug real de Tailwind v3/v4 arreglado en `ai-agency-sf-next` (y de paso TODAS sus versiones flotantes fijadas en `08beee6` — la mención anterior aquí a `@ai-sdk/anthropic`/`ai` era incorrecta, esas deps nunca existieron en esa app), `@sf/supabase` con factories reales adoptado en `sf-crm`/`sf-cms`/`mira/portal`, MIRA a Next 16. Los 3 pendientes que esta sección listaba se cerraron el mismo 2026-07-31: migración completa de los 33 ficheros restantes de `mira/portal` (DEBT zz — única excepción documentada: `proxy.ts`, por semántica de batching de cookies), sesión autenticada verificada en vivo incluso con sesión fragmentada en 5 cookies (zz+aaa), y el pineo de `ai-agency-sf-next`.

**Único pendiente real que queda de esta ronda:**
- Decisión de negocio (no técnica): migrar `apps/startup-factory-web` a SF-CMS como el resto de landings — hoy usa contenido local propio (`content/`, sin `@sf/cms-client`, verificado 2026-08-03).

## MIRA — UI + light mode + 3 bugs del audit final (DEBT yy/aaa, 2026-07-31) — ✅ CERRADO, con pendientes menores

Chat de departamento embebido en las 5 páginas de depto (Quick Actions como chips dentro del propio chat), parche `!important` de light mode retirado tras migrar los ficheros reales, sidebar arreglado (active-state de Toolkit, hover del Tour, labels a inglés), y los 3 bugs preexistentes del audit final (rebote de `/home` en hard reload, archivado de proyectos que no persistía por RLS sin política de UPDATE, `/api/*` devolviendo redirect en vez de 401) arreglados y reverificados en vivo. Detalle en DEBT (yy)(zz)(aaa).

**Pendiente real de esta ronda — ✅ CERRADO el mismo 2026-08-03 (commit `5bd8543`):** traducciones al inglés de Questionnaires (lista+detalle)/Terms/Privacy hechas y verificadas en producción; los 6 hovers `/8` pasados a `/10`; `load-missing-pillars` borrada (código muerto sin consumidores que además habría duplicado pilares). Único resto menor: confirmación visual de los badges de `ArchitectArchetype.tsx` en modo claro con datos reales (contraste matemático correcto).

## MIRA — Revisión adversarial de la Fase Brand Brain — 9 hallazgos reales corregidos (DEBT ww, 2026-07-30) — ✅ CERRADO

Workflow de 4 dimensiones + verificación adversarial (2 verificadores por hallazgo) sobre todo lo construido en (vv). 11 de 15 hallazgos sobrevivieron; 9 corregidos, 2 documentados sin parchear (patrón `user_metadata.plan` sistémico en 25+ ficheros — sesión de seguridad aparte; límite del polyfill de DOMMatrix para renderizado futuro — no getText()). Los 2 más serios: `brain-lint.ts` marcaba SIEMPRE vacías 6 secciones reales (columnas planas fuera de `brand_data`, contaminando el aviso semanal para el 100% de los clientes), y `content_hash` NULL en documentos preexistentes disparaba síntesis innecesaria + riesgo de reabrir contradicciones ya resueltas por un humano. Detalle completo en DEBT (ww).

**Pendiente real de esta ronda:**
- ~~Aplicar la migración `0063_backfill_content_hash.sql`~~ ✅ **Aplicada y verificada el 2026-07-30** — 0 documentos `drive_sync` con `content_hash` NULL tras el backfill.
- Sesión de seguridad dedicada para el patrón `user_metadata.plan` en todo el repo.

## MIRA — Brand Brain como "LLM Wiki" (DEBT vv, 2026-07-30) — ✅ CERRADO, con acciones reales pendientes del CEO

A petición del CEO tras compartir una metodología de bases de conocimiento con LLMs, el Brand Brain gana síntesis real (no solo indexar) contra los documentos de Drive, contradicciones estructuradas con aviso visual (ya no un prefijo de texto invisible), un índice navegable por sección, y una revisión automática semanal. Sin migrar el schema de `brand_data` (sigue siendo jsonb, decisión razonada). De paso, encontrado y arreglado (con el CEO pidiendo explícitamente "dale a todo") un bug real y serio: la extracción de PDF llevaba tiempo fallando en silencio en producción (`filesSynced: 0`, sin ningún error visible sin mirar logs de Vercel) — 4 iteraciones hasta la causa raíz real (pdfjs-dist + hoisting de pnpm + rutas de tracing de Vercel). Verificado en vivo de punta a punta con el Brand Book PDF real de Salsa Burgers: propuesta real generada, contradicción real detectada (misión extendida del Brand Book vs. misión minimalista actual del Brain). Detalle completo, incluida la saga de los 4 intentos de fix, en DEBT (vv).

**Pendiente real de esta ronda (acciones del CEO, no técnicas):**
- **Revisar la propuesta pendiente y la contradicción real que quedaron en Salsa Burgers** (`brain_change_proposals`/`brain_contradictions`, dato real no sintético, dejado a propósito para que la agencia lo revise en `/brand-brain`).
- ~~Decidir cuándo activar `DRIVE_BRAIN_SYNTHESIS=1` para el resto de clientes~~ ✅ **Activado globalmente el mismo día** — Salsa Burgers y Dadybox sincronizaron bien; **Startup Factory, Discoolver y NC Global Assets necesitan reconectar Google Drive** (token expirado/revocado).
- El cron semanal de lint (domingos 06:00 UTC) no se ha ejecutado todavía en producción — se activará solo cuando Vercel lo dispare.

## MIRA — Auditoría completa pre-lanzamiento: Brand Brain, Integraciones, chatbots y resto de secciones (DEBT uu, 2026-07-30) — ✅ CERRADA

Auditoría con 2 workflows en paralelo pedida explícitamente por el CEO antes del plan de lanzamiento/venta. Encontrados y corregidos: 10 sitios más de prototype pollution (misma familia que (ss)), crash 8/8 de `/client-portal/entregas` para entregas en `queued`/`processing`/`failed`, 2 bugs reales de Brand Brain (pilares con `[object Object]`, campo duplicado), 4 sitios más de la carrera `client_id=undefined` (qualify/scoring/performance/approvals), fricción de UX en `/login` (no redirigía sesión ya autenticada), y un bug de seguridad real en `/api/client/documentation` (GET sin ninguna comprobación de autorización — IDOR real entre clientes — y POST/upload usando el cliente de navegador sin sesión server-side, probablemente 401 permanente). Todo corregido y alineado con los patrones ya establecidos (`resolveRequestClient`/`getSessionUser`/`safeLookup`). Detalle completo en DEBT (uu).

**Pendiente real de esta ronda:**
- Dos síntomas reportados por un workflow (400 de `/toolkit` en `clients?select=settings`, fetch intermitente de stats de `/comercial`) no se pudieron reproducir con el código actual — sin descartar que fueran blips transitorios de red.

## MIRA — Revisión adversarial + bug real del Centro de Documentos (DEBT ss, 2026-07-30) — ✅ CERRADO

Revisión de (rr) con 4 agentes + verificación escéptica: 5 hallazgos reales, los 5 corregidos (prototype pollution en chat por departamento, 2 bugs de robustez en informes de decisión, 1 documentado sin arreglar por no tener camino de UI hoy). Además, bug real reportado por el CEO en el Centro de Documentos (Playbook Operativo generaba una guía de "cómo escribir esto" en vez de contenido, con datos sin investigar) — corregido con investigación web real (Tavily) + un aviso de alcance explícito cuando el tema pedido es contenido publicable en vez de una guía interna. Verificado en vivo con una generación real completa. Detalle en DEBT (ss).

**Pendiente real de esta ronda:** ninguno — ver (tt) abajo, ya cerrado el mismo día.

## MIRA — `web_search` agéntico en Quick Actions + Monthly Content System (DEBT tt, 2026-07-30) — ✅ CERRADO

A petición explícita del CEO ("no quiero un aviso repetitivo, quiero que sean inteligentes de verdad"), Quick Actions (`crear_newsletter`, `crear_post` y las 18 restantes) y el Monthly Content System ganan la misma tool `web_search` que ya tiene el chat de agentes — el modelo decide por su cuenta si necesita buscar, no es una búsqueda forzada. Verificado en vivo con 2 generaciones reales de `crear_newsletter`: un tema especulativo no disparó búsqueda (honesto sobre el hueco de datos), un tema real y actual sí la disparó y citó cifras reales con fuente. Detalle en DEBT (tt).

**Pendiente real:** Monthly Content System comparte el mecanismo pero no se verificó en vivo por separado (3 llamadas Opus secuenciales, más caro de probar) — riesgo bajo, mismo helper ya probado en Quick Actions.

## MIRA — Chat por departamento + informes de decisión + bug real de Pipeline (DEBT rr, 2026-07-30) — ✅ CERRADO, con 2 pendientes reales

Chat por departamento (una sola voz) construido y verificado en vivo en las 5 páginas de depto. Informes de decisión interactivos (MVP) construidos y verificados en vivo con datos sintéticos — narrativa + choice cards con badge de recomendación, generalizando el sistema de cuestionarios ya existente. Bug real (no reportado, encontrado investigando) en `/comercial/pipeline`+`/comercial/icebreaker` corregido — una carrera de montaje disparaba una query con `client_id=undefined`; el "CRM roto" de la primera pasada resultó ser dato real (0 leads legítimos en el cliente probado), corregido tras verificar con un cliente con leads reales. Detalle completo en DEBT (rr).

**Pendiente real de esta ronda:**
- ~~Aplicar migración 0061~~ ✅ **Aplicada y verificada en vivo el 2026-07-30** (CEO vía SQL editor) — probado de punta a punta con un cuestionario sintético real: narrativa con y sin encabezado, ambas se renderizan correctamente antes de las preguntas; datos de prueba borrados por ID exacto después.
- **Reproducir el bug del wizard de alta con la sesión real del CEO**: el código de `/admin/onboarding` parece correcto (5 pasos, botón Atrás, revisión) — no se pudo reproducir con la única sesión de prueba disponible (cuenta cliente, sin acceso a `/admin/*`). Probar de nuevo y confirmar si el CEO entraba por `/admin/onboarding/chat` (el chat libre, que sigue existiendo aparte) en vez de `/admin/onboarding`.
- **Generación por IA de la narrativa de los informes de decisión** (pasada 2, no construida a propósito — pasada 1 es redacción manual).

## MIRA — Auditoría de producción-robustez pre-lanzamiento (DEBT qq, 2026-07-30) — ✅ CERRADA

Confirmado el modelo de negocio actual (CEO sigue dando de alta cada cliente a mano) como sólido a nivel producción: trust-boundaries reales cerrados (RLS de `mira_project_access`, auth de Integraciones consolidado sobre `resolveRequestClient`), 19 rutas de debug/fix/init huérfanas eliminadas, `maxDuration` + 5 índices hot-path añadidos, 2 N+1 reales convertidos a `Promise.all`. Verificado en vivo tras el deploy (Playwright: home/roster/integrations/brand-book, sin errores de consola). Detalle completo, incluido el hallazgo de que `@sentry/node` rompe el build real (revertido, `@sentry/nextjs` es la vía correcta para una sesión futura), en DEBT (qq).

**Pendiente real de esta ronda:**
- **Observabilidad real (Sentry o similar)**: sigue sin existir ningún error-tracking en producción — solo `console.error`/`vercel logs`. Intentar de nuevo con `@sentry/nextjs` (no `@sentry/node` a pelo, ver DEBT qq) en una sesión dedicada.
- **Cifrado de API keys de `tool_connections`**: siguen en texto plano (deuda ya conocida, DEBT c) — el CEO decidió explícitamente conectar Apollo/Hunter ya y cifrar después.

## MIRA — Arquetipos + Prompts + cierre técnico (DEBT oo/pp, 2026-07-30) — ✅ CERRADO COMPLETO

Los 6 archetypes muestran datos reales o vacío honesto. Los 23 prompts de agente tienen límite de rol explícito (verificado en vivo, 3 rondas de fix). Capa 3 de prompts cerrada (quick actions 6/19 mejorados, Business Reports/monthly/document ya en nivel experto sin cambios, "otros" revisados). i18n ronda 2 completa (541 claves, 32 archivos, todo Toolkit + Comercial + shared components). Modo claro con 3 bugs sistémicos reales arreglados (texto blanco en botones de color, selectores CSS muertos, paleta neón de Toolkit). Bucket `brand-assets` migrado a privado con signed URLs. Bug real `agent_activity.created_at` arreglado. Tarjeta de Google Drive ya no dispara un disconnect falso. Chat guiado de quick actions bajado a Sonnet (coste). Detalle completo de todo esto en DEBT (pp).

**Pendiente real de esta ronda:**
- **Defensa estructural anti-inyección**: hoy solo hay una regla de texto en los contratos de grounding; falta un mecanismo real de sanitización/delimitación para contenido de leads/documentos. Sesión de seguridad aparte.
- **Idea abierta, sin decidir**: un chat unificado (uno solo, no por departamento) donde el CEO pida lo que sea en lenguaje natural y el sistema llame internamente a los agentes/herramientas que hagan falta, en vez de entrar agente por agente. Requiere pensar: ¿un orchestrator real sobre los 23 agentes con tool-calling entre ellos, o un router más simple que clasifica intención y delega a un solo agente? Cómo se relaciona con el agente `orchestrator` ya existente (hoy vacío, sin dato real). No empezar sin diseñarlo primero con el CEO.

## Acciones del CEO (no técnicas)

1. **Reconexión Drive de 3 clientes** (Startup Factory, Discoolver, NC Global Assets) — verificado en vivo el 2026-07-30 disparando el sync real: los 3 fallan con "Token has been expired or revoked". Un clic por cliente en MIRA → Integraciones → Conectar Google Drive. ✅ Salsa (2026-07-29) y ✅ Dadybox (confirmado funcionando en vivo el 2026-07-30) ya no necesitan nada.
2. **Adrian Grooves**: entregarle la password temporal (`Mira-9Ud41Adr!7`, reseteada 2026-07-27) por canal seguro; que la cambie al entrar. Configurarle Drive con el protocolo.
3. **Revisar Drive de Discoolver antes de dar por bueno su onboarding visual**: en Salsa se encontró y limpió documentación técnica interna de MIRA (schemas JSON de otro proyecto) mezclada por error en su carpeta de conocimiento (DEBT nn) — comprobar que no pasa lo mismo ahí (Dadybox ya confirmado limpio, sync real exitoso 2026-07-30).
4. **Google Drive — revocar acceso desde la propia cuenta si se quiere desconectar**: la tarjeta de Integraciones ya no ofrece un botón de desconexión falso (DEBT pp); revocar hoy se hace desde Google Account → Seguridad → Apps de terceros.
5. **Conectar Apollo.io + Hunter.io**: el CEO ya tiene cuentas reales en ambos servicios (para probar Discovery "modo profundo" en Comercial) — solo falta pegar las 2 API keys reales en MIRA → Integraciones (código ya verificado listo de punta a punta, DEBT qq).

## MIRA — Business Reports (DEBT ll/nn) — ✅ CERRADO

Brand Book y Monthly Content System verificados con generaciones reales completas contra Salsa (200 OK, contenido real, sin truncar). Migración 0051 aplicada. Bug de timeout del monthly (fix `a9a04a8`) confirmado resuelto en producción. Sin pendientes de esta ronda.

## Visual Production Foundation — esperando respuesta externa (DEBT nn)

- Nota de estado ya redactada para reenviar al equipo/persona del handoff — resume: seguimos esperando (a) contrato de marca congelado Salsa/Dadybox/Discoolver, (b) su decisión sobre 0028 reuse-vs-namespace, (c) aprobación de "one small backend foundation task".
- Mientras tanto, ejecutado ya (Track A, sin tocar nada gated): Studio (designer/spark) con piezas reales aprobadas en vez de mock; `generate_image` con grounding visual real vía Claude vision. Ver detalle en DEBT (nn).
- Pendiente real (Track B, NO empezar sin luz verde externa): aplicar `vp_brand_visual_modules`/`vp_visual_references`, descargar e indexar de verdad las fotos de "Post References" de Drive, cross-link con el JSON de 12 casos de `README (1).md` de Salsa.

## MIRA — técnico pendiente (por prioridad)

1. **ENFORCE_PLAN_LIMITS**: sin bloqueantes; CEO preguntó qué era el 2026-08-03 — explicado, decisión aún abierta (antes de activar: comprobar plan de cada cliente real vs. lo que usa).
2. **Stripe**: CEO confirmó GO el 2026-08-03 — esperando 3 respuestas para arrancar el build-out: ¿cuenta Stripe creada?, ¿suscripción por plan o factura por proyecto?, ¿moneda (EUR/THB/USD)?
3. **Canva**: OAuth completo en código; faltan registro de app + review + envs `NEXT_PUBLIC_CANVA_CLIENT_ID`/`CANVA_CLIENT_SECRET` (DEBT l).
4. **Imágenes — mejoras reales** (`images.edit` de OpenAI con referencia real en vez de solo texto, carousel multi-imagen, tamaños 4:5/9:16): ligado a Track B de Visual Production Foundation — no elegir modelo/endpoint final hasta que se resuelva (ver sección arriba).
5. **Drive — mejoras**: watch/push de cambios (hoy sync diario), toggle de auto_sync por carpeta en el panel (columna ya existe).
6. **Publicación en redes**: FUERA del producto por decisión CEO (2026-07-28). Si algún día se retoma: puente n8n contra los webhooks dormidos (`/api/webhook/queue-post|alert|agent-activity`, protegidos por `WEBHOOK_SECRET`) — no reconstruir desde cero.
7. **Tablas `visual_jobs` (0028) sin rutas**: decisión ligada a Visual Production Foundation, no una ronda de higiene aparte.

## Resto del ecosistema

- **Backlog de bugs re-verificado 2026-08-03** — ver [`docs/audits/ECOSISTEMA-BUGS-2026-08-03.md`](audits/ECOSISTEMA-BUGS-2026-08-03.md) (evidencia fichero:línea + verificación en vivo). Resumen por prioridad:
  - **ALTA (producción con usuarios reales)**: sf-crm (leads sin mapear snake_case + `outreach_emails`/`discovery_runs.workspace_id` inexistentes → 500s), startup-factory-web (`<html>`/`<body>` duplicados servidos en startupsfactory.es), NC Global (newsletter del footer con éxito falso en www.ncglobalassets.com), sf-reports (links activos a 404 en el hub de clientes).
  - **MEDIA (interno o latente)**: ai-agency-sf-next (reset CSS sin capa anula todos los paddings/margins con Tailwind v4), sf-sales-engine (notion_sync 100% stub usado por el worker, router seed sin registrar, CI ruff/mypy con `continue-on-error`), dg-editor (2 vías de fallo silencioso en export PDF).
  - **BAJA (sin desplegar)**: waitlist stub de Discoolver web — bloqueante de deploy futuro.
  - Colateral: keys Supabase locales de sf-crm y sf-sales-engine rotadas (401) — reponer al trabajar en esas apps.
- **SF-CMS**: plan de cierre por bloques pendiente (memoria `sf-cms-estado-y-plan`); dominio apex decidido.
- **sf-reports**: sigue siendo el hub MANUAL de entregables; candidato a alimentarse desde el export editorial de MIRA en el futuro.
- **Reglas de oro vigentes** (no olvidar): verificar columnas reales en BD antes de confiar en ficheros de migración (5 casos de deriva encontrados); nunca `select('*')` en tablas con tokens; deletes de producción solo por IDs exactos verificados; `node scripts/verify-project-links.mjs` antes de cualquier `vercel --prod`.

## Ola 2026-08-03 (tarde) — ejecutado tras el "vamos con todo" del CEO

- ✅ **Sentry en MIRA**: implementado con `@sentry/nextjs` v10 (Turbopack nativo, build verificado). NO-OP hasta poner `NEXT_PUBLIC_SENTRY_DSN` en Vercel — **acción CEO: crear proyecto en sentry.io y pegar el DSN** (opcional: SENTRY_AUTH_TOKEN/ORG/PROJECT para source maps).
- ✅ **dg-editor**: los 2 fallos silenciosos de PDF eliminados (commit `67c39ae` en su repo, pusheado); e2e real verificado con BARCELONA-26. Playwright instalado en su .venv (no estaba — el "caso normal" llevaba roto en este Mac).
- ✅ **Waitlist Discoolver web**: real vía formsubmit (`165460c`) — destino `carlos@discoolver.com` (único buzón activado), override por env `WAITLIST_FORWARD_EMAIL`.
- ✅ **Keys locales rotadas**: sf-crm y sales-engine repuestas y verificadas.
- 📋 **sf-crm schema**: `apps/sf-crm/scripts/migrations/04_outreach_discovery_real.sql` lista para que **el CEO la aplique vía SQL editor** (incluye queries de verificación previa/posterior). El código ya está preparado (unmaps aplicados) — al aplicarla, outreach y discovery funcionan de punta a punta. Efecto colateral positivo esperado: el upsert de `status` del worker de sales-engine dejará de fallar en silencio.
- ❌ **Chat unificado (punto 10 histórico): DESCARTADO por el CEO** — resuelto con el chat por departamento.
- CEO hizo: password de Adrian Grooves entregada. CEO pendiente aún: Drive ×3, keys Apollo/Hunter, revisar Brand Brain Salsa, DSN de Sentry, aplicar la 04, respuestas de Stripe.
- Cola técnica siguiente: sesión de seguridad MIRA (user_metadata.plan + anti-inyección), migración startupsfactory.es → SF-CMS (GO del CEO: "terminar"), limpieza CI sales-engine (~334 errores con continue-on-error).
