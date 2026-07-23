# MIRA — Fase 2: Plan de lanzamiento SaaS (<1 mes desde su activación)

> Auditoría de arquitectura de producto realizada el 2026-07-23. **Guardada para activar más adelante** — los ajustes estructurales indispensables (seguridad, RLS, sidebar móvil) ya se ejecutaron por separado el mismo día y no se repiten aquí. Ver estado real al final de este documento.

## Context

MIRA lleva semanas de trabajo intensivo (multi-empresa, motor comercial, revisión UX/UI completa, grounding real del toolkit, proyectos, Canva/Drive/BYO Claude, prompts) y el producto **funciona bien en modo agencia**: Startup Factory da de alta a cada cliente a mano y lo acompaña. El objetivo de esta fase es lanzarlo en **menos de un mes** como **producto de autoservicio** para freelancers, emprendedores y startups que se dan de alta ellos solos, sin acompañamiento manual. Eso es un salto de "herramienta interna madura" a "SaaS público" que toca capas nunca auditadas: alta de usuarios, cobro, límites de gasto, seguridad ante desconocidos de internet, y si la experiencia tiene sentido para un usuario solo (hoy el modelo de datos gira en torno a "clientes de una agencia").

## Hallazgos de la auditoría (3 áreas, verificadas con fichero:línea)

### A) Negocio / monetización / GTM

**Gaps críticos:**
1. **Signup público: no existe.** Login (`app/login/page.tsx`) solo autentica; no hay `/signup` ni endpoint de creación de cuenta. El landing (`mira-landing`) no tiene backend (`output:'export'`) — sus CTAs van a un formulario `formsubmit.co` que manda un email y redirige a `/thank-you`, que dice literalmente *"We'll reach out within 24 hours"*.
2. **Pagos: cero integración real.** 0 referencias a Stripe/PayPal en package.json de todo el monorepo. Los 3 sitios que mencionan "Stripe" (`operations/billing`, `admin/facturacion`, `client-portal/config`) son paneles internos de P&L de la agencia con banner *"Sample Data Only — Stripe integration not configured"*. Existe una tabla `mira_subscriptions` pero en un schema muerto (`scripts/migrations/04_mira-schema.sql`) no usado por la app real.
3. **Sin límite técnico de gasto.** `getClaudeForClient()`/`createMessageForClient()` (lib/anthropic-client.ts) llaman al modelo primero y registran consumo DESPUÉS (`logUsage`, fire-and-forget). Sin BYO key, cualquier usuario nuevo generaría contra la key de plataforma sin ningún cap.
4. **Onboarding: 100% manual, ~20-40 min por cliente.** `scripts/onboard-client.ts` (crea cliente+brand_profile; "creación de carpetas" es placeholder sin implementar) + `create-admin.mjs`/`manage-user.ts` (password aleatoria, `email_confirm:true` sin verificación real) + INSERT manual en `mira_project_access` (sin script reutilizable). Sin UI de admin que lo orqueste.
5. **Legal: inexistente.** Cero Términos/Privacidad/Cookies en portal ni landing. El landing carga GTM sin banner de consentimiento.
6. **Email transaccional: solo recuperación de password por defecto de Supabase**, con `redirectTo` apuntando a una URL de PREVIEW de Vercel, no a producción. Sin bienvenida, sin confirmación.
7. **⚠️ Discrepancia de modelo de negocio**: el landing ya vende **pago único** ("MIRA Marketing" $99 / "MIRA Full Stack" $299 one-time + addon $9.99/mes opcional). No encaja con un SaaS de autoservicio por suscripción/uso.
8. El landing está construido (`apps/mira-landing/out/`) pero sin `.vercel/project.json` — verificar manualmente si `www.miralanding.com` sirve la versión actual.

### B) Seguridad / fiabilidad / observabilidad

**ALTO (lo CRÍTICO — key expuesta, DEV_MODE_BYPASS, RLS de las 5 tablas — ya se resolvió el 2026-07-23, ver estado abajo):**
1. Cero rate limiting en las ~20 rutas que llaman a Claude/OpenAI/Tavily/Apollo.
2. Cero observabilidad: sin Sentry/equivalente, sin healthcheck, solo `console.error` disperso en 70/103 rutas.
3. CI/CD sin gate real: `lint.yml` solo corre typecheck (0 tests en todo el portal); `deploy.yml` despliega a prod en cada push a `main` sin depender de que lint pase.
4. Sin proceso de borrado de cuenta/GDPR: `leads`/`crm_contacts` sin FK/cascade hacia `clients`; ni endpoint ni runbook.

**MEDIO:**
5. Construir signup público desde cero — sin captcha, sin verificación real de email, sin rate limiting de intentos.
6. Migraciones en 2 carpetas con números duplicados, aplicación 100% manual.
7. Comparación de secretos (webhook, batch) con `!==` simple, no timing-safe.

### C) UX self-serve para freelancer solo

**Veredicto: un freelancer que llegaba antes del 2026-07-23 no podía ni crear una cuenta — todo lo demás es secundario hasta resolver eso.**

1. **Framing "agencia" incrustado en el copy visible**: `<title>` = "MIRA — AI Agency Platform", tagline fijo "AI Agency Platform", home dice "Tu agencia de IA", badge "AGENCY" en el admin panel. El modelo de datos gira en torno a `clients.id` con grants — pensado para "empleado de agencia con acceso a varias empresas", no "freelancer que ES su negocio".
2. **⚠️ El gating por plan es COSMÉTICO, no real.** `lib/plans.ts` dice que `starter` solo ve `['marketing']`, pero solo se aplica en el candado visual del sidebar. Las páginas de comercial/finanzas/strategy/operations no comprueban el plan en ningún punto — accesibles por URL directa. Además el intento de enforcement en `proxy.ts` usa slugs en español que no existen como rutas reales — es enforcement fantasma (ver `docs/DEBT.md` punto (o)).
3. **Onboarding sin checklist de activación.** El tour (`onboarding-modal.tsx`) es narrativo, se ve una vez, y estaba 100% en inglés hardcoded sin locale awareness. Brand Brain no tiene indicador de % completado ni orden sugerido.
4. **Complejidad sin reducir**: 23 agentes / 5 departamentos / 13 informes visibles y usables desde el segundo 1 para cualquier plan.
5. **Precio invisible dentro de la app.** Sin pantalla de comparación de planes, sin CTA de upgrade funcional.
6. **Cero soporte in-app.** Sin chat; `resources/page.tsx` tiene todos los vídeos como placeholder sin grabar. El manual PDF no está enlazado desde ningún sitio de la app.
7. **Sidebar global no responsive — resuelto el 2026-07-23** (ver estado abajo).
8. **i18n real ~35%, y mezclada incluso donde "existe".** 43 de 66 páginas sin ningún soporte de idioma. Incluso Home tiene la mayoría de su copy hardcoded en español.

## Inventario de lo YA construido y validado (fases 1-3, para no re-auditar)
- Multi-empresa con grants (`mira_project_access`), switcher por cliente activo.
- Motor comercial (discovery Apollo/Hunter vía Railway) + puente a CRM (`promoteLeadToCrm`), pendiente solo de la Apollo key real del usuario.
- Sidebar/departamentos con bug de sección Marketing corregido, roster de 23 agentes coherente.
- Quick actions (27, contexto de marca completo, guard anti-invención en las numéricas).
- Toolkit con grounding real (fetch del sitio + checks deterministas + Tavily + contrato anti-alucinación).
- Documents/presentaciones (11 layouts, paridad HTML↔PPTX, refine por slide, imágenes IA).
- Proyectos con memoria y entregables asociados + carpeta Drive por proyecto.
- BYO Claude 17/17 rutas + logUsage; BYO OpenAI para imágenes con tracking.
- Canva Connect (OAuth+PKCE) y export a Drive del cliente — funcionales, pendientes de config externa.
- Light mode ~95% migrado a tokens semánticos.
- Manual de usuario en PDF (`docs/MIRA-Manual-de-Usuario.pdf`) — no enlazado desde la app.

## Decisiones de producto (confirmadas por el usuario, 2026-07-23)
1. **Lanzamiento**: beta cerrada/waitlist en 30 días desde la activación; self-serve 100% automático en 60-90 días.
2. **Proveedor de pago**: abierto — Stripe directo vs Merchant-of-Record (Paddle/LemonSqueezy), decisión pendiente con trade-offs más abajo.
3. **Modelo de negocio**: setup fee (pago único, "puesta en marcha y entrenamiento inicial") + cuota mensual, con dos precios según origen de la IA.

## Diseño del modelo de precios (propuesta a validar)

**Estructura de 2 capas:**
- **Setup fee (pago único)**: cubre la puesta en marcha — configuración de Brand Brain, importación de documentos/Drive, primera sesión de entrenamiento. Durante la beta (semi-manual) justifica el mayor coste operativo; cuando el wizard sea 100% self-serve, puede bajar de precio o ser opcional.
- **Cuota mensual por plan** (starter/growth/scale, esqueleto ya en `lib/plans.ts` — hoy solo controla visibilidad, hace falta enforcement real), cada uno en dos variantes:
  - **"IA incluida"** — MIRA absorbe el coste de Claude/OpenAI, precio mensual más alto pero con **límite duro de generaciones/mes** (hoy no existe ningún cap técnico — pieza de infraestructura más urgente para que este modelo sea viable).
  - **"Trae tu IA" (BYO)** — el cliente conecta su propia key (infraestructura YA construida al 100%: 17/17 rutas, `usage_log.used_client_key` ya distingue el origen), precio mensual más bajo, sin cap de MIRA.
  - El paquete "IA incluida" se precia para salir **más barato que BYO + plataforma por separado** — incentiva la venta gestionada.

**Lo que este modelo exige construir:**
1. **Enforcement real de plan** (server-side, no solo el candado visual — y arreglar el regex fantasma de `proxy.ts`, DEBT.md punto o).
2. **Cap de generaciones/mes** sobre `usage_log` (ya tiene `used_client_key`, `client_id`, `created_at`): función que sume el mes en curso y bloquee/avise al superar el límite. Con BYO (`used_client_key=true`), sin cap.
3. **Facturación real** (Stripe o MoR): cobro único (setup) + suscripción recurrente, webhook de activación/impago.
4. **Página de precios** en el portal y rediseño del pricing del landing.

## Corto plazo — 30 días desde la activación (objetivo: beta cerrada/waitlist lista)
**Base técnica:**
- Rate limiting básico en las ~20 rutas caras, Sentry + healthcheck + alerta de gasto diario, gate de CI (build+typecheck obligatorio antes de deploy a prod).
- Enforcement real de plan (server-side) — necesario para diferenciar cohortes de la beta.
- Cap de generaciones/mes con key de plataforma — imprescindible antes de abrir a desconocidos aunque sea beta cerrada.

**Producto — victorias rápidas:**
- Traducir el onboarding tour y completar i18n de Home (primera pantalla que ve cualquiera).
- Enlazar el manual PDF desde algún punto de la app.
- Onboarding admin más rápido: unificar `onboard-client.ts` + `create-admin.mjs` + el INSERT manual en un solo comando idempotente con checklist — bajar de 20-40 min a <10 min mientras siga siendo semi-manual.
- Corregir el `redirectTo` de recovery email (apunta a preview de Vercel, no a producción).
- Sustituir en `resources/page.tsx` los vídeos placeholder por algo real mínimo (o quitar la sección).

**Legal (mínimo viable pero real):**
- Términos de Servicio, Política de Privacidad, Política de Cookies — plantillas adaptadas.
- Banner de consentimiento de cookies en el landing.
- Footer legal en landing + enlaces desde el portal.

**GTM/Landing:**
- Sustituir el formulario actual por una landing de waitlist real con el nuevo modelo de precios (setup fee + mensual, IA incluida vs BYO), aunque el checkout no esté automatizado — puede ser un link de pago simple solo para el setup fee.
- Actualizar el copy del landing (hoy mezcla mensaje de agencia con mensaje de autoservicio).

## Medio plazo — 60-90 días (objetivo: self-serve 100% automático)
- Signup público real: formulario + captcha + verificación de email real + creación transaccional automática de cliente+usuario+grant.
- Motor de facturación completo: suscripción recurrente + setup fee + webhooks de activación/impago, con el proveedor decidido.
- Checklist de activación real en el onboarding (% de Brand Brain completado, "haz esto primero").
- Completar i18n a cobertura alta.
- Retirar el parche `!important` de light mode tras verificación visual completa.
- Consolidar migraciones y documentar el estado real de RLS de toda la BD.
- Proceso de borrado de cuenta/GDPR real.
- Considerar una "vista simplificada" para el freelancer solo (vs. vista agencia).

## Largo plazo — >90 días
- Cifrado at-rest de las API keys BYO de clientes.
- Decidir `visual_jobs`: cablear el pipeline async o eliminar el subsistema fantasma.
- Push de re-autorización de Drive a clientes con conexiones antiguas + cierre de la revisión de la app de Canva.
- Soporte in-app real (chat).
- Analítica de producto/activación más sofisticada (funnels, cohortes).

---

## Estado real a fecha de guardado (2026-07-23) — ajustes ya ejecutados fuera de esta fase

Antes de activar este roadmap se cerraron, en una sesión aparte, los siguientes puntos que este documento daba como pendientes:
- 🔴 Service_role key expuesta en `check_gen.js` (repo público) — revocada por el usuario + fichero eliminado + `.gitignore`.
- `NEXT_PUBLIC_DEV_MODE_BYPASS` eliminado del código en los 10 sitios (no solo desactivado por env).
- RLS activada en `leads`, `mira_projects`, `drive_connections`, `tool_connections`, `crm_contacts` (migración `0037_rls_hardening.sql`).
- **Sidebar responsive real** en `app/(dashboard)/layout.tsx` (drawer móvil con overlay, reutilizando el `SidebarContent` real — NO se usó `components/DashboardLayout.tsx`, que resultó ser un prototipo huérfano sin auth/multi-empresa/departamentos real, cablearlo habría sido una regresión).
- DEBT.md corregido: punto (n) marcado resuelto; nuevo punto (o) documenta el enforcement de plan roto (candado cosmético + regex fantasma en `proxy.ts`) como deuda a resolver en el "Enforcement real de plan" de este roadmap.

Pendiente aún de purgar: el historial de git de la key expuesta (requiere `git filter-repo`/BFG + force-push — operación de alto impacto en un monorepo compartido, a coordinar aparte).

**Para activar esta fase**: revisar si algo cambió desde el 2026-07-23, confirmar el proveedor de pago (Stripe vs MoR) y arrancar por "Enforcement real de plan" + "Cap de generaciones/mes", que son prerrequisito técnico de todo lo demás.
