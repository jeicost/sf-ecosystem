# PRÓXIMOS PASOS — SF Ecosystem (actualizado 2026-07-30)

Estado de referencia: Quick Actions 2.0 + Plan Maestro B1-B5 completos y en producción (bitácora completa en `docs/DEBT.md`, entradas (ii)(jj)(kk)(nn)(oo)(pp)(qq)(rr)). Migraciones 0048/0049/0050/0051/0056/0058/0059/0060 aplicadas; **0061 pendiente** (ver abajo). Este fichero lista SOLO lo que queda.

## MIRA — Chat por departamento + informes de decisión + bug real de Pipeline (DEBT rr, 2026-07-30) — ✅ CERRADO, con 2 pendientes reales

Chat por departamento (una sola voz) construido y verificado en vivo en las 5 páginas de depto. Informes de decisión interactivos (MVP) construidos y verificados en vivo con datos sintéticos — narrativa + choice cards con badge de recomendación, generalizando el sistema de cuestionarios ya existente. Bug real (no reportado, encontrado investigando) en `/comercial/pipeline`+`/comercial/icebreaker` corregido — una carrera de montaje disparaba una query con `client_id=undefined`; el "CRM roto" de la primera pasada resultó ser dato real (0 leads legítimos en el cliente probado), corregido tras verificar con un cliente con leads reales. Detalle completo en DEBT (rr).

**Pendiente real de esta ronda:**
- **Aplicar migración 0061** (columna `narrative` en `client_questionnaires`) — sin esto, la narrativa de los informes de decisión se ignora en silencio (no rompe nada, solo no se ve).
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

1. **Reconexión Drive de 4 clientes** (Startup Factory, Dadybox, Discoolver, NC Global) — ✅ Salsa ya reconectado con scope de escritura completo (verificado 2026-07-29). Un clic por cliente en MIRA → Integraciones → Conectar Google Drive.
2. **Adrian Grooves**: entregarle la password temporal (`Mira-9Ud41Adr!7`, reseteada 2026-07-27) por canal seguro; que la cambie al entrar. Configurarle Drive con el protocolo.
3. **Dadybox**: revocar el acceso de MIRA en su cuenta Google y reconectar (fuga de token en terminal, DEBT ff) — pendiente desde el 24/07.
4. **Revisar Drive de Dadybox/Discoolver antes de dar por bueno su onboarding visual**: en Salsa se encontró y limpió documentación técnica interna de MIRA (schemas JSON de otro proyecto) mezclada por error en su carpeta de conocimiento (DEBT nn) — comprobar que no pasa lo mismo en las otras.
5. **Google Drive — revocar acceso desde la propia cuenta si se quiere desconectar**: la tarjeta de Integraciones ya no ofrece un botón de desconexión falso (DEBT pp); revocar hoy se hace desde Google Account → Seguridad → Apps de terceros.
6. **Conectar Apollo.io + Hunter.io**: el CEO ya tiene cuentas reales en ambos servicios (para probar Discovery "modo profundo" en Comercial) — solo falta pegar las 2 API keys reales en MIRA → Integraciones (código ya verificado listo de punta a punta, DEBT qq).
7. **Aplicar migración `0061_questionnaire_narrative.sql`** en el SQL editor de Supabase — desbloquea la narrativa de los nuevos informes de decisión (DEBT rr). Aditiva y segura (columna nullable, `IF NOT EXISTS`).

## MIRA — Business Reports (DEBT ll/nn) — ✅ CERRADO

Brand Book y Monthly Content System verificados con generaciones reales completas contra Salsa (200 OK, contenido real, sin truncar). Migración 0051 aplicada. Bug de timeout del monthly (fix `a9a04a8`) confirmado resuelto en producción. Sin pendientes de esta ronda.

## Visual Production Foundation — esperando respuesta externa (DEBT nn)

- Nota de estado ya redactada para reenviar al equipo/persona del handoff — resume: seguimos esperando (a) contrato de marca congelado Salsa/Dadybox/Discoolver, (b) su decisión sobre 0028 reuse-vs-namespace, (c) aprobación de "one small backend foundation task".
- Mientras tanto, ejecutado ya (Track A, sin tocar nada gated): Studio (designer/spark) con piezas reales aprobadas en vez de mock; `generate_image` con grounding visual real vía Claude vision. Ver detalle en DEBT (nn).
- Pendiente real (Track B, NO empezar sin luz verde externa): aplicar `vp_brand_visual_modules`/`vp_visual_references`, descargar e indexar de verdad las fotos de "Post References" de Drive, cross-link con el JSON de 12 casos de `README (1).md` de Salsa.

## MIRA — técnico pendiente (por prioridad)

1. **ENFORCE_PLAN_LIMITS**: sin bloqueantes desde el 24/07, activación pendiente de decisión CEO.
2. **Stripe**: elegido como pasarela (24/07), build-out pendiente (facturación real de clientes; los ficheros mock de Operations→Billing esperan esto).
3. **Canva**: OAuth completo en código; faltan registro de app + review + envs `NEXT_PUBLIC_CANVA_CLIENT_ID`/`CANVA_CLIENT_SECRET` (DEBT l).
4. **Imágenes — mejoras reales** (`images.edit` de OpenAI con referencia real en vez de solo texto, carousel multi-imagen, tamaños 4:5/9:16): ligado a Track B de Visual Production Foundation — no elegir modelo/endpoint final hasta que se resuelva (ver sección arriba).
5. **Drive — mejoras**: watch/push de cambios (hoy sync diario), toggle de auto_sync por carpeta en el panel (columna ya existe).
6. **Publicación en redes**: FUERA del producto por decisión CEO (2026-07-28). Si algún día se retoma: puente n8n contra los webhooks dormidos (`/api/webhook/queue-post|alert|agent-activity`, protegidos por `WEBHOOK_SECRET`) — no reconstruir desde cero.
7. **Tablas `visual_jobs` (0028) sin rutas**: decisión ligada a Visual Production Foundation, no una ronda de higiene aparte.

## Resto del ecosistema

- **SF-CMS**: plan de cierre por bloques pendiente (memoria `sf-cms-estado-y-plan`); dominio apex decidido.
- **sf-reports**: sigue siendo el hub MANUAL de entregables; candidato a alimentarse desde el export editorial de MIRA en el futuro.
- **Reglas de oro vigentes** (no olvidar): verificar columnas reales en BD antes de confiar en ficheros de migración (5 casos de deriva encontrados); nunca `select('*')` en tablas con tokens; deletes de producción solo por IDs exactos verificados; `node scripts/verify-project-links.mjs` antes de cualquier `vercel --prod`.
