# SF-CMS — Auditoría "WordPress-class" · 2026-07-21

**Método:** 6 agentes expertos en paralelo (workflow multi-agente), un lente cada uno: Editor UX, Seguridad, Fiabilidad & Ops, Multi-tenancy & Roles, SEO & Media, DX & Integración. Cada agente verificó los defectos ya sospechados (con evidencia `file:line`) y buscó gaps nuevos comparando contra un CMS maduro (WordPress, Webflow, Contentful, Sanity). **67 findings** en total. Los P0 se arreglaron y desplegaron el mismo día (commits `b9e46f8`, `c6a8138`, `75a5d67`).

---

## Resumen ejecutivo

El SF-CMS es funcional y su patrón de integración (build-time bake con fallback hardcodeado) es sólido: una caída del CMS no puede tumbar ninguna web. Pero la auditoría encontró **7 P0 reales** — el más grave: *cualquier* usuario autenticado de Supabase tenía control admin total sobre el contenido de todos los clientes (verificado en vivo con un segundo usuario existente). Todos los P0 quedaron **arreglados y en producción hoy**.

Lo que separa al SF-CMS de un WordPress no son esos bugs (ya resueltos) sino tres carencias estructurales, todas P1:

1. **El editor depende 100% del chat** — sin edición por formulario, sin historial/restore real, sin papelera, sin preview del sitio real. Corregir un typo requiere redactar una instrucción a un LLM.
2. **Sin modelo de roles ni identidad** — un solo flag admin global, audit log sin autor, una API key por proyecto en texto plano sin rotación.
3. **Sin operaciones** — sin backups propios, sin monitoring activo, sin cron (no hay publicación programada), deploy hooks fire-and-forget.

---

## ✅ P0 — Arreglados y desplegados hoy

| ID | Defecto | Fix aplicado |
|---|---|---|
| SEC-08 / MT-04 | `requireSession()` y el middleware aceptaban **cualquier usuario autenticado** — sin check de admin. Verificado: `nirada@ncglobalassets.com` tenía acceso admin total. | Ambos gates exigen `app_metadata.is_admin === true`. Flag puesto a `jacostech@` vía Admin API **antes** de desplegar el check. ⚠️ `nirada@` queda sin acceso admin deliberadamente — si lo necesita, requiere el modelo de roles (MT-01) o el flag explícito. |
| MT-05 | `is_admin()` (RLS) leía `user_metadata`, **auto-editable por el propio usuario** — escalada trivial. | Migración 008: `is_admin()` lee `app_metadata` (solo editable server-side). |
| SEC-07 | `audit_log` sin RLS — legible con la anon key pública vía PostgREST. | Migración 008: RLS habilitado + política SELECT solo-admin. |
| SEED-1 | El PATCH de páginas **descartaba** `seo_title`/`seo_description` — el SEO de páginas nunca persistió. | PATCH acepta `seo_title`, `seo_description`, `og_image_url`, `canonical_url`. (Falta UI de inputs — EDUX-S4, P1.) |
| EDUX-N1 | El chat escribía el output del LLM **directo sobre páginas publicadas**, antes de revisión. Agravante: pulsar Save tras un edit por chat re-enviaba el estado local viejo y **revertía el cambio silenciosamente**. | El chat ahora es propose-only: devuelve las secciones como borrador de trabajo, sincronizadas al estado del editor; solo Save persiste (y es el camino que snapshotea versiones). |
| OPS-01 | El chat leía/escribía `pages.version_number`, columna **inexistente en todas las migraciones** (drift), con numeración inconsistente vs el PATCH. | Resuelto por eliminación: el chat ya no escribe; el PATCH numera por `count` como siempre. |
| OPS-02 | Snapshot-then-update sin transacción: el chat podía sobrescribir contenido tras fallar el snapshot. | Resuelto por eliminación (el chat no persiste). El PATCH ya abortaba en `versionErr`. |
| SEC-01 | Fallback `\|\| 'dev-secret-unsafe'` en `/api/revalidate` de startup-factory-web y nc-global-assets-next. | Fail-closed (503 sin secret configurado) + comparación timing-safe en ambos. Salsa ya estaba bien. |

**Verificación post-deploy:** admin API 401 sin auth · `/admin` redirige a login · API pública 200 con key · 33/33 rutas de SF-web en 200 · loop editorial completo (override en CMS → build → renderizado) demostrado y revertido.

---

## 🟡 P1 — Bloquean flujos editoriales/operativos reales (backlog priorizado)

### Editor (lo que un editor de WordPress espera y aquí no existe)
- **EDUX-S4 (M)** — El editor de páginas no tiene inputs de título, slug, status ni SEO. El fix del PATCH ya persiste SEO; falta el sidebar de ajustes (patrón ya existente en el editor de posts).
- **EDUX-S1 (L)** — Edición solo-chat: añadir edición híbrida (inputs por campo en cada SectionPreviewCard, botones mover/duplicar/borrar, picker de secciones). *Equivalente WP: Gutenberg.*
- **EDUX-S2 (M)** — Restore real de versiones: endpoint `POST /versions/[id]/restore` + UI de historial con diff. *Equivalente WP: Revisions.*
- **EDUX-N3 (M)** — Papelera: hoy borrar es hard-delete sin recuperación. *Equivalente WP: Trash 30 días.*
- **EDUX-N4 (L)** — Preview real del sitio (Next.js Draft Mode + token) en vez del mock neutral.
- **EDUX-S3 (M)** — Pantallas Settings/Users prometidas por el dashboard que no existen.
- **EDUX-S5 / SEED-3 / SEED-2 (M)** — Media: editar `alt_text` (hoy siempre vacío), DELETE de archivos, picker de `og_image` en editores.

### Seguridad e identidad
- **MT-01 (L)** — Modelo de roles por proyecto (`user_project_roles`: admin/editor/viewer) — prerequisito para dar acceso a clientes como nirada sin exponer todo. *Equivalente WP: roles + multisite.*
- **MT-02 / SEC-06 (M)** — `requireSession()` debe devolver el user y propagarlo a `audit_log.user_id` y `created_by` (hoy: trail sin autor).
- **MT-03 / SEC-02 (M)** — API keys: hashear, mostrar una vez, rotación con gracia, dejar de devolverlas en GET. *Equivalente WP: Application Passwords.*
- **SEC-03 (M)** — Wrapper único `withAdminAuth(handler)`: un `requireSession()` olvidado hoy expone todo (el service role bypasea RLS).
- **SEC-09 (S)** — Logout roto: borra una cookie legacy inexistente; la sesión Supabase sigue viva. Reescribir con `supabase.auth.signOut()`.
- **SEC-10 / NEW-5 (S)** — Upload de media sin validación: allowlist MIME, magic bytes, límite de tamaño, sanitizar SVG.
- **MT-07 (S)** — El GET público de página individual devuelve **drafts** (falta `.eq('status','published')` — los listados sí filtran).
- **Acción manual pendiente (Supabase dashboard):** deshabilitar signups públicos en Auth > Providers — el gate de código ya protege, pero los signups solo generan usuarios huérfanos.

### Operaciones
- **OPS-05 (M)** — Cron: publicación programada (`published_at` futuro hoy no hace nada), retención de versiones, reintento de hooks.
- **OPS-06 (M)** — Backup propio: export nocturno de projects/pages/posts a JSON (GitHub Actions ya existe en el repo).
- **OPS-07 (M)** — Deploy hooks fire-and-forget: registrar éxito/fallo y mostrárselo al editor (hoy un publish puede no llegar nunca al sitio y nadie se entera).
- **OPS-03 (M)** — Rate limiting real (Upstash) + límite en `/chat` (coste Anthropic sin cap).
- **OPS-04 (S)** — Sentry: crear proyecto, `SENTRY_DSN` en Vercel, cablear el chat route.
- **OPS-10 (S)** — Drift check scriptado (`scripts/check-schema-drift.mjs` vía introspección PostgREST) — `db:diff` necesita Docker, no instalado.

### SEO & contenido
- **NEW-1 (M)** — Las webs leen una sección tipo `seo` (schema.org) que ninguna página del CMS tiene — seedearla como sección editable.
- **NEW-2 (M)** — `cover_url` fantasma: las webs lo leen para portada/og:image pero no existe en el schema de posts.
- **NEW-3 (S)** — SF-web tiene DOS generadores de sitemap en conflicto (fetch script vs `app/sitemap.ts`) y además el dominio canónico real es **apex** (www→apex 307), contradiciendo la regla www del CLAUDE.md — unificar y decidir dominio canónico.
- **NEW-4 (L)** — Cambiar slug publicado = 404 sin redirect. *Equivalente WP: plugin Redirection.*

### DX
- **DX-01 (M)** — 3 copias divergentes del fetch script con nombres de env vars incompatibles (salsa `.env.example` documenta `SF_CMS_*` pero su script lee `CMS_*`). Corto plazo: aceptar ambos nombres en los 3. 
- **DX-02 (L)** — `section_types` como fuente de verdad real (hoy: prompt + preview + renderer × N webs para añadir un tipo).
- **DX-07 (M)** — README/checklist de onboarding para conectar la web nº4 (hoy no existe).
- **DX-05 / DX-06 (S)** — ✅ **Ya arreglados hoy** (header antes del fallback de envs; `/settings` sin `?project=`).

## 🟢 P2 — Paridad nice-to-have (selección)

Optimización de imágenes (resize/webp/srcset) · búsqueda y paginación en admin · autosave + aviso de cambios sin guardar · meta robots/noindex por página · webhooks salientes genéricos · versionado del contrato API público · headers de seguridad en el panel admin · accesibilidad del admin (aria) · unificar las dos páginas de login · borrar stubs vacíos (`api/admin/pages/chat/`, `api/auth/login/`) y carpetas `packages/* 2` (residuos Finder, sin referencias en el workspace) · columnas i18n muertas (limpiar en migración futura) · qa-harness con asserts en CI.

---

## Matriz de paridad WordPress (resumen)

| Capacidad | WordPress | SF-CMS hoy |
|---|---|---|
| Edición por bloques/campos | Gutenberg | ❌ Solo chat LLM (+preview read-only) |
| Revisiones + restore | ✅ Diff + restore server-side | ⚠️ Snapshots sí; restore client-side sin historial |
| Papelera | ✅ 30 días | ❌ Hard-delete |
| Roles | ✅ 5 roles + multisite | ❌ Flag admin único global |
| Auditoría con autor | ✅ (plugins core-adjacent) | ⚠️ Trail sin identidad |
| SEO por página | ✅ Yoast/RankMath | ⚠️ Persiste desde hoy; sin UI aún |
| Media library | ✅ alt/caption/delete/featured | ⚠️ Solo upload + copy URL |
| Publicación programada | ✅ WP-Cron | ❌ |
| Backups | ✅ Ecosistema maduro | ❌ Solo Supabase |
| Redirects al cambiar slug | ✅ | ❌ 404 |
| API keys gestionables | ✅ App Passwords | ❌ Plaintext, sin rotación |
| Seguridad del admin | ✅ Roles core | ✅ **Desde hoy** (app_metadata gate + RLS) |
| Resiliencia frente a caída del CMS | ❌ (WP caído = web caída) | ✅ **Mejor que WP** (build-time bake + fallback) |

---

## Roadmap sugerido (3 sprints)

**Sprint 1 — "El editor puede trabajar solo"** (mayor ROI editorial):
EDUX-S4 (sidebar título/slug/status/SEO) · EDUX-S2 (restore + historial) · MT-02/SEC-06 (identidad en audit) · SEC-09 (logout) · MT-07 (drafts fuera del API público) · SEC-10 (validación uploads) · OPS-04 (Sentry).

**Sprint 2 — "Operable y multi-cliente"**:
MT-01 (roles por proyecto → desbloquea acceso de clientes) · OPS-05 (cron: scheduled publish + retención) · OPS-06 (backup export) · OPS-07 (estado de deploy hooks) · MT-03/SEC-02 (API keys hasheadas + rotación) · SEC-03 (withAdminAuth).

**Sprint 3 — "Paridad editorial"**:
EDUX-S1 (edición híbrida por campo) · EDUX-N3 (papelera) · NEW-4 (redirects) · SEED-2/3 (og_image + alt_text) · DX-01/DX-07 (unificar scripts + onboarding) · NEW-3 (un solo sitemap + decisión dominio canónico).

---

## Anexo — Qué más se hizo en la sesión (contexto)

- **NC Global Next** (`clients/nc-global-assets-next`): port de UI completado (About/Services/Contact + form Formspree + chat modal), **dos bugs preexistentes del port arreglados** (secciones invisibles por ScrollReveal ausente; todas las imágenes en 404 por `/assets/` sin copiar), CMS cableado con overrides opt-in, proyecto Vercel linkado (`rootDirectory` limpiado, SSO off) y **preview verificado** (9 rutas en 200). Sin dominio — el cutover de `ncglobalassets.com` es decisión aparte.
- **SF-web** (`startupsfactory.es`): 12 páginas con overrides CMS (fallback = contenido actual, paridad de texto verificada byte a byte), seed idempotente (`scripts/adhoc/seed-sfweb-cms-pages.mjs`), webhook fail-closed, envs de preview corregidos (`CMS_API_URL` faltaba en Preview), en producción y verificado 33/33.
- Datos de auditoría en bruto: 67 findings con evidencia `file:line` en el JSON de la sesión (`scratchpad/audit-findings.json`).

*Generado por la sesión del 2026-07-21 (Claude Fable 5). Los findings citados llevan evidencia file:line verificada; los IDs referencian el JSON de hallazgos.*
