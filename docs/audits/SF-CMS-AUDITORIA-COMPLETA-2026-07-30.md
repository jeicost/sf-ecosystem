# SF-CMS — Auditoría completa (producto + sitios cliente) · 2026-07-30

**Sucesor de** `docs/audits/SF-CMS-GAP-AUDIT-2026-07-21.md` (67 findings, 6 agentes, P0 arreglados el mismo día). Este documento reconcilia ese roadmap contra el código de hoy, suma hallazgos nuevos de la sesión del 2026-07-30, e inventaría por primera vez el estado de conexión-a-CMS de **todos** los sitios cliente, no solo del producto sf-cms en sí.

**Método:** 3 agentes Explore (producto sf-cms · sitios cliente · documentación/auditorías previas) + 1 agente Plan con verificación en vivo adicional (greps, `vercel project ls`, `gh secret list`, `node scripts/check-schema-drift.mjs`) contra el código y la infraestructura reales del 2026-07-30.

---

## Resumen ejecutivo

- El plan de cierre por bloques B0-B4 (aprobado 2026-07-24) avanzó de verdad: **B0, B1 y B2 están hechos** (editor por campos, redirects automáticos, versionado con restore) salvo Draft Mode. **B3 va a medio camino** (rate limiting, cron de publicación programada y tracking de deploy hooks sí; auth hardening y Sentry no). **B4 no ha empezado** (media library incompleta).
- **El hallazgo más urgente no estaba en ningún roadmap anterior:** ningún proyecto tiene `vercel_hook_url` configurado — publicar contenido en el CMS **nunca dispara un rebuild real en ningún sitio**. Se reclasifica como P0.
- **El ítem de seguridad más urgente sigue sin resolver desde el 24/07:** la `service_role` key de Supabase quedó expuesta en un chat anterior y no consta que se haya rotado.
- El backup nocturno automático del CMS **lleva roto desde que se creó** — el workflow de GitHub Actions requiere 2 secrets que nunca se configuraron.
- De los sitios cliente: 2 están sanos en producción (Salsa Burgers, Startup Factory), 3 están listos en código pero con una decisión de negocio pendiente (NC Global, Discoolver web, Adrian Grooves), 1 está en producción pero nunca se conectó al CMS (MIRA Landing), y 1 es un caso aparte sin resolver (discoolver-cms, vivo como código pero sin deploy).
- Un patrón de riesgo nuevo esta sesión: sitios desplegados por Vercel CLI sin repositorio Git pueden perder su código fuente para siempre si Vercel purga los blobs (le pasó a `discoolver-landing`; se reconstruyó desde cero hoy). Vale la pena revisar qué otros proyectos comparten ese riesgo.
- Nada de esto bloquea seguir rediseñando páginas ya conectadas (Salsa, Startup Factory) — pero si el objetivo es que el CMS sea la fuente de verdad para *todos* los sitios, el Tramo 1 (P0 de producto) es el que hace que esa promesa sea real.

---

## Plan de acción priorizado

Un solo orden, cuatro tramos secuenciales. Cada ítem es independiente dentro de su tramo — se puede picar en cualquier momento.

### Tramo 0 — Seguridad, no-código, hazlo ya
- [ ] Rotar la `service_role` key de Supabase del proyecto `dmzecrlkclocqaywkjtc` (quedó expuesta en un chat anterior) y actualizarla en `.env.local` de `apps/sf-cms` + envs de Vercel de todos los sitios que la usan.
- [ ] Confirmar/activar "Disable signups" en Supabase Auth → Providers (el gate de código ya protege el admin, pero signups públicos generan usuarios huérfanos).
- [ ] Crear los GitHub secrets `SF_CMS_SUPABASE_URL` y `SF_CMS_SUPABASE_SERVICE_ROLE_KEY` para que el backup nocturno (`sf-cms-nightly-backup.yml`) vuelva a correr.

### Tramo 1 — P0 de producto (código, ya diagnosticado)
- [ ] **`vercel_hook_url`**: decidir el mecanismo y configurarlo en los 6 proyectos reales de la tabla `projects` — sin esto, "publicar" en el CMS no hace nada en ningún sitio.
- [ ] Dejar de devolver `api_key` en claro en `GET /api/admin/projects` — hashearla o al menos no incluirla en listados (MT-03/SEC-02).
- [ ] Wrapper `withAdminAuth(handler)` para que ningún endpoint nuevo pueda olvidar el check de admin (SEC-03).
- [ ] Draft Mode / preview real del sitio antes de publicar (EDUX-N4) — hoy solo hay preview interno de secciones dentro del propio CMS.

### Tramo 2 — Decisiones de sitio (negocio, no código)
- [ ] NC Global: cutover de dominio de `ncglobalassets.com` de la SPA legacy al proyecto Next.js nuevo (ya conectado a CMS).
- [ ] Discoolver: publicar o no `discoolver-landing` (reconstruido hoy, en `clients/discoolver/web`).
- [ ] Discoolver: retomar o archivar `discoolver-cms` (admin panel propio, vivo como código, sin deploy desde hace ~3 semanas).
- [ ] MIRA Landing: ¿migrar a sf-cms o dejarlo hardcodeado?
- [ ] Adrian Grooves: asignar dominio propio (hoy solo preview `*.vercel.app`).

### Tramo 3 — Cierre de producto B4 + limpieza (sin prisa)
- [ ] Media library: endpoint DELETE, capturar `alt_text` al subir + UI para editarlo después, papelera en vez de hard-delete, input de `og_image_url` en editor de páginas y posts.
- [ ] Búsqueda y paginación en el admin de Pages/Posts.
- [ ] Autosave / aviso de cambios sin guardar en el editor.
- [ ] Meta robots / noindex por página.
- [ ] Dropear las columnas i18n muertas documentadas en la migración 007.
- [ ] Enganchar `apps/cms-qa-harness` a CI.
- [ ] Borrar el secret huérfano `VERCEL_PROJECT_ID_SF_LINKS` de GitHub (sf-links fue decomisionado el 28/07).
- [ ] Discoolver `creators-landing`: completar canonical + og:image (hueco SEO puntual, no bloqueante).

---

## Tabla de reconciliación vs. la auditoría del 21/07

| ID | Título | Severidad original | Estado hoy | Evidencia |
|---|---|---|---|---|
| SEC-08/MT-04, MT-05, SEC-07, SEED-1, EDUX-N1, OPS-01, OPS-02, SEC-01 | Los 7 P0 del 21/07 | P0 | **RESUELTO** | Ya desplegados el mismo día (commits `b9e46f8`, `c6a8138`, `75a5d67`), no re-verificados hoy campo a campo — sin indicios de regresión. |
| EDUX-S4 | Sidebar título/slug/status/SEO en editor de páginas | P1 | **PARCIAL** | SEO title/description/canonical sí existen en el editor. Falta `og_image_url` en la UI. |
| EDUX-S1 | Edición híbrida por campo (no solo chat) | P1 | **RESUELTO** | `components/editor/FieldEditor.tsx` + `SectionsEditor.tsx` — añadir/reordenar/duplicar/borrar secciones desde formulario. |
| EDUX-S2 | Restore real de versiones + historial | P1 | **RESUELTO** | Tab "History" en el editor de páginas, snapshot automático en cada save (`app/api/admin/pages/[pageId]/route.ts:81-100`). Solo cubre `pages`, no `posts`. |
| EDUX-N3 | Papelera (hoy hard-delete) | P1 | **ABIERTO** | Sin cambios. |
| EDUX-N4 | Preview real del sitio (Draft Mode) | P1 | **ABIERTO** | `grep -r "draftMode\|Draft Mode" apps/sf-cms` → 0 resultados. |
| EDUX-S3 | Pantallas Settings/Users prometidas por el dashboard | P1 | **ABIERTO** | `app/admin/page.tsx` sigue siendo 100% estático — texto aspiracional sin funcionalidad real. |
| EDUX-S5/SEED-3/SEED-2 | Media: alt_text, DELETE, picker og_image | P1 | **ABIERTO** | `alt_text` nunca se pasa al subir (`app/admin/media/page.tsx`); sin endpoint DELETE; sin picker de `og_image` en editores. |
| MT-01 | Modelo de roles por proyecto | P1 | **RESUELTO** | `user_project_roles` + `canAccessProject()` en todas las rutas admin; pantalla `Access` funcional (alta/baja de editores). |
| MT-02/SEC-06 | Identidad en audit log | P1 | No re-verificado hoy en detalle | Pendiente confirmar si `audit_log.user_id`/`created_by` ya se completan. |
| MT-03/SEC-02 | API keys hasheadas | P1 | **ABIERTO** | `app/api/admin/projects/route.ts:19` sigue haciendo `select('...api_key...')` y devolviéndolo en claro. |
| SEC-03 | Wrapper `withAdminAuth` | P1 | **ABIERTO** | `grep -r "withAdminAuth" apps/sf-cms` → 0 resultados. |
| SEC-09 | Logout roto | P1 | No re-verificado hoy | — |
| SEC-10/NEW-5 | Validación de uploads de media | P1 | **RESUELTO** | Confirmado por agente Explore: magic bytes, MIME whitelist sin SVG, límite 10MB. |
| MT-07 | GET público de página individual devuelve drafts | P1 | No re-verificado hoy | — |
| OPS-05 | Cron: publicación programada + retención de versiones | P1 | **RESUELTO (solo posts)** | `app/api/cron/publish/route.ts`, cada 15 min. Páginas no tienen estado `scheduled` — solo Draft/Published. |
| OPS-06 | Backup propio | P1 | **RESUELTO EN CÓDIGO, ROTO EN CI** | El workflow existe pero le faltan 2 GitHub secrets — ver hallazgo nuevo abajo. |
| OPS-07 | Estado de deploy hooks visible | P1 | **RESUELTO el tracking, ABIERTO el uso real** | `deploy_events` existe y se registra, pero **0 de 6 proyectos tiene `vercel_hook_url` configurado** — ver hallazgo nuevo, reclasificado a P0. |
| OPS-03 | Rate limiting real + límite en `/chat` | P1 | **PARCIAL** | `lib/rate-limit.ts` existe pero es in-memory por instancia serverless — limitación documentada por el propio autor, no resuelve bajo carga real. |
| OPS-04 | Sentry | P1 | **ABIERTO** | `instrumentation.ts`/`lib/capture-error.ts` cableados, pero `SENTRY_DSN` no existe en `.env.local` — falta que el usuario cree el proyecto Sentry. |
| OPS-10 | Drift check scriptado | P1 | **RESUELTO** | `node scripts/check-schema-drift.mjs` ejecutado hoy → "Schema matches snapshot — no drift." |
| NEW-1 | Sección `seo` (schema.org) editable | P1 | No re-verificado hoy | — |
| NEW-2 | `cover_url` fantasma en posts | P1 | No re-verificado hoy | — |
| NEW-3 | Dos generadores de sitemap en conflicto + dominio canónico | P1 | **RESUELTO** (dominio) | Apex decidido y codificado en `startupsfactory.es` (confirmado en CLAUDE.md raíz). Conflicto de generadores no re-verificado. |
| NEW-4 | Slug publicado cambia = 404 sin redirect | P1 | **RESUELTO** | Migración 011, tabla `redirects`, PATCH de pages/posts registra old→new, verificado E2E según memoria del 24/07. |
| DX-01 | 3 copias divergentes del fetch script | P1 | **PARCIAL** | Env vars unificadas (`SF_CMS_*`/`CMS_*` aceptados en los 3), pero siguen siendo 3 archivos copiados a mano, no una fuente única. |
| DX-02 | `section_types` como fuente de verdad real | P1 | **ABIERTO** | El selector de tipos en el editor visual sigue acoplado 1:1 a `components/preview/registry.ts` — tipos custom por cliente (`flat-fields`, `story`, etc.) no aparecen, solo editables por JSON crudo. |
| DX-07 | Onboarding para conectar un sitio nuevo | P1 | No re-verificado hoy | `docs/EDITING_LANDINGS_SAFELY.md` existe y cubre edición segura; no confirmado si cubre el flujo de "conectar sitio nuevo" específicamente. |
| DX-05/DX-06 | Header antes del fallback / `/settings` sin `?project=` | P1 | **RESUELTO** (ya lo decía el 21/07) | — |
| P2 — Optimización de imágenes, búsqueda/paginación admin, autosave, meta robots por página, webhooks salientes, versionado API pública, headers de seguridad admin, a11y admin, unificar logins, stubs vacíos, columnas i18n muertas, qa-harness en CI | P2 | **Parcial**: stubs vacíos y carpetas `packages/* 2` **RESUELTOS** (ya no existen). El resto — búsqueda/paginación, autosave, meta robots por página, i18n muertas, qa-harness en CI — **reconfirmados ABIERTOS** hoy con grep (0 resultados en cada caso). | — |

---

## Hallazgos nuevos (2026-07-30)

### 🔴 P0 — Nuevo

**DEPLOY-01 — Ningún proyecto tiene `vercel_hook_url` configurado.**
Consultada la tabla `projects` completa (6 filas: Salsa Burgers, NC Global Assets, Startup Factory, Discoolver, Adrian Grooves, QA Harness) — las 6 tienen `vercel_hook_url` en `null`. El mecanismo (`lib/deploy-hook.ts`, dispara el hook y registra el resultado en `deploy_events`) funciona y está probado, pero nunca se conectó a un hook real de ningún proyecto Vercel. **Consecuencia práctica: publicar contenido en el CMS hoy no cambia nada en ningún sitio en producción hasta que alguien corra `vercel --prod` manualmente.** Esto convierte "editar desde el CMS" en una promesa rota para cualquier sitio que no se rebuildee a mano tras cada cambio.

### 🟡 P1 — Nuevo

**OPS-11 — Backup nocturno de CI roto desde su creación.**
`.github/workflows/sf-cms-nightly-backup.yml:31-32` requiere los secrets `SF_CMS_SUPABASE_URL` y `SF_CMS_SUPABASE_SERVICE_ROLE_KEY`. `gh secret list` confirma que **no existen** en el repo (solo hay secrets `VERCEL_*`). El workflow lleva corriendo sin credenciales o fallando silenciosamente desde que se creó — el backup "resuelto" de OPS-06 nunca se ha ejecutado con éxito en CI.

**BIZ-01 — `clients/discoolver/discoolver-cms` sin deploy, decisión de negocio pendiente.**
Repo real y recuperado (115 archivos trackeados, commit `2d02a1b` del 12/07), app Next.js completa de admin propio de Discoolver (dashboard, professionals, transactions, recommended — no relacionado con sf-cms). `vercel project ls` confirma que **no existe ningún proyecto Vercel** para este código, y no hay actividad desde el 12/07. No es un bug — es una pregunta sin responder: ¿se retoma y despliega, o se archiva?

### 🟢 P2 — Nuevo

**CLEAN-01 — Secret huérfano en GitHub.** `VERCEL_PROJECT_ID_SF_LINKS` sigue existiendo pese a que el proyecto `sf-links` fue decomisionado el 2026-07-28.

### ✅ Verificado y cerrado sin acción — patrón "componente duplicado muerto"
A raíz de un bug real encontrado y arreglado hoy en `nc-global-assets-next` (un `Footer` sin CSS coexistiendo con el `Footer.tsx` correcto, nunca importado — causaba que el footer se viera sin estilos en producción), se hizo un barrido en `clients/adrian-grooves` y `clients/discoolver/web` por si el mismo patrón se repetía. **No se repite** — cada proyecto tiene un único componente `Footer`, correctamente importado. Sin acción pendiente.

### ⚠️ Riesgo estructural identificado — pérdida de código fuente en deploys CLI sin Git
`discoolver-landing` (el sitio que hoy sirve `discoolver-landing.vercel.app`) se desplegó en su momento vía `vercel deploy` sin repositorio Git conectado. Cuando se intentó recuperar el código fuente hoy para rediseñarlo, la API de Vercel devolvió `410 Gone` en los 8 deployments del historial del proyecto — **Vercel purga el código fuente de los deploys por CLI sin Git tras un período de retención**, y ya había pasado. El sitio siguió funcionando (el build compilado seguía vivo), pero fue irrecuperable como código editable; se reconstruyó pixel-perfect desde cero. **Recomendación:** identificar si hay otros proyectos Vercel del equipo desplegados por CLI sin Git (candidatos: cualquier `.vercel/project.json` sin un `.git` correspondiente en la misma carpeta o en un remote configurado) y, si son importantes, conectarlos a un repo Git para que esto no vuelva a pasar.

---

## Inventario de sitios cliente

| Sitio | Carpeta | Conectado a sf-cms | Producción real | Estado |
|---|---|---|---|---|
| Salsa Burgers | `clients/salsa-burgers` | ✅ Sí | ✅ salsaburgers.com | Sano. |
| Startup Factory | `apps/startup-factory-web` | ✅ Sí | ✅ startupsfactory.es | Sano. |
| NC Global Assets (Next) | `clients/nc-global-assets-next` | ✅ Sí (arreglado hoy) | ❌ dominio real sigue en la SPA legacy | Código listo, falta decisión de cutover de dominio. |
| NC Global Assets (legacy) | `clients/_archive/nc-global-assets-vite` | ❌ No | ✅ es la que sirve ncglobalassets.com hoy | Sigue viva hasta el cutover — no tocar. |
| Discoolver — landing principal | `clients/discoolver/web` | ✅ Sí (páginas `home`/`influencers` en draft) | ❌ no desplegado | Reconstruido hoy desde cero (código fuente original perdido — ver hallazgo de riesgo estructural). Pendiente decisión de publicar. |
| Discoolver — Creators Landing | `clients/discoolver/creators-landing` | ✅ Sí | ✅ en producción | Sano, salvo hueco SEO puntual (falta canonical + og:image). |
| Discoolver — Briefing / Design Studio / Investor Deck | `clients/discoolver/{briefing,design-studio,deliverables/investor-deck-site}` | ❌ No, por diseño | ✅ en producción | Microsites de entrega puntual — no requieren CMS ni SEO completo. |
| Discoolver — CMS propio | `clients/discoolver/discoolver-cms` | N/A (no es cliente de sf-cms) | ❌ sin deploy | Ver hallazgo BIZ-01. |
| Adrian Grooves | `clients/adrian-grooves` | ✅ Sí | ⚠️ solo preview `*.vercel.app` | Código y SEO completos, falta dominio propio. |
| MIRA Landing | `apps/mira-landing` | ❌ No | ✅ en producción (deploy de hace ~2 meses) | Candidato claro a migrar — además meta description excede 160 caracteres. |
| Lidar Home | `clients/lidar-home` | ❌ No | ❌ solo briefing estático | Sin producto web real todavía. |
| Dadybox | `clients/dadybox` | ❌ No | ❌ solo briefing estático | Sin producto web real — el resto son generadores de deliverables en Python. |
| MIRA Portal, SF-CRM, SF-Sales-Engine, AI Agency SF, SF-Reports | `apps/mira/portal`, `apps/sf-crm`, `apps/sf-sales-engine`, `apps/ai-agency-sf-next`, `apps/sf-reports` | N/A | ✅ cada uno en su modelo | Correctamente fuera del alcance de sf-cms — son apps autenticadas/internas, no sitios de marketing. MIRA tiene su propio sistema de deuda técnica en `docs/DEBT.md`/`docs/NEXT_STEPS.md`, no se audita aquí. |

---

## Roadmap actualizado B0-B5

- **B0 — Higiene base:** ✅ Hecho.
- **B1 — Unificación de scripts + dominio canónico:** ✅ Hecho.
- **B2 — Editor usable sin developer:** ✅ Hecho en su mayoría (campos, reorder, versionado+restore, redirects). Falta: Draft Mode.
- **B3 — Operable y seguro:** 🟡 Parcial. Hecho: rate limiting (con limitación conocida), cron de posts programados, tracking de deploy hooks, drift check. Falta: `withAdminAuth`, API keys hasheadas, Sentry activo, y —nuevo— arreglar el backup de CI.
- **B4 — Media library completa:** ⬜ No empezado. DELETE, alt_text, papelera, og_image en UI.
- **B5 — Cierre final (nuevo):** agrupa lo que queda suelto tras B4: Draft Mode, `vercel_hook_url` en todos los proyectos, `withAdminAuth`, hasheo de API keys, y decisión sobre `section_types` como fuente de verdad real (DX-02) para que sitios con tipos de sección custom (Discoolver, NC Global) puedan editarse por formulario y no solo por JSON crudo.

---

## Apéndice — comandos de verificación usados hoy

```bash
# Estado de vercel_hook_url por proyecto
curl "$SUPABASE_URL/rest/v1/projects?select=id,name,slug,vercel_hook_url" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"

# withAdminAuth wrapper
grep -rln "withAdminAuth" apps/sf-cms --include="*.ts" --include="*.tsx"

# API key en claro
grep -n "api_key" apps/sf-cms/app/api/admin/projects/route.ts

# Sentry
grep -c "SENTRY" apps/sf-cms/.env.local

# Draft Mode
grep -rln "draftMode\|Draft Mode" apps/sf-cms --include="*.ts" --include="*.tsx"

# Carpetas huérfanas / stubs muertos (P2 del 21/07)
find packages -maxdepth 1 -iname "* 2"
find apps/sf-cms/app/api/admin/pages/chat apps/sf-cms/app/api/auth/login -type f

# Drift de schema
node scripts/check-schema-drift.mjs

# Secrets de GitHub Actions
gh secret list

# Proyectos Vercel existentes (para confirmar si discoolver-cms tiene deploy)
vercel project ls --scope jeicosts-projects
```

---

*Generado en la sesión del 2026-07-30. Reconciliado contra `docs/audits/SF-CMS-GAP-AUDIT-2026-07-21.md` y la memoria de cierre `sf-cms-estado-y-plan` (2026-07-24). Los ítems marcados "no re-verificado hoy" heredan su estado del 21/07 sin nueva evidencia — confirmarlos en la próxima pasada antes de darlos por ciertos.*
