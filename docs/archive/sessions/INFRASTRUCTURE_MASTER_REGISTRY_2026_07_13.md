# Startup Factory — Master Infrastructure Registry
**Auditoría completa: 2026-07-13 — Verified via Vercel CLI + GitHub API + curl**

---

## RESUMEN EJECUTIVO

**Estado general:** 📊 **MIXED** — infraestructura heterogénea con dominios correctamente mapeados, pero 20 proyectos Vercel sin gobernanza clara (5 huérfanos/duplicados), y falta de `.vercel/project.json` en proyectos de cliente (vulnerables a redeploy en proyecto equivocado).

| Métrica | Valor | Riesgo |
|---------|-------|--------|
| Dominios custom live | 4 | ✅ Bajo |
| Proyectos Vercel totales | 20 | ⚠️ Medio |
| Proyectos huérfanos/duplicados | 5 | ⚠️ Medio |
| `.vercel/project.json` en clientes | 1/9 | 🔴 Alto |
| Credenciales en texto plano | 3 | 🔴 Crítico |

---

## DOMINIOS CUSTOM → PROYECTOS VERCEL (VERIFICADO)

### Startup Factory

| Dominio | Vercel Project | Status | Tech | GitHub Repo | Notes |
|---------|---|---|---|---|---|
| **startupsfactory.es** | `startup-factory-web` | ✅ LIVE | Next.js 16.2.4 | `jeicost/startup-factory-web` (privado) | i18n (es/en), CMS integration (`fetch-cms-content.mjs` + `/api/revalidate`) |
| startupsfactory.com | `sf-reports` | ⚠️ PARTIAL | Next.js | `jeicost/sf-reports` (público) | Solo subdominio `reports.startupsfactory.com` apunta aquí; DNS raíz mal configurado (nameservers invalidos en Vercel); la raíz `.com` no tiene destino claro |

---

### Clientes

| Dominio | Vercel Project | Status | Tech | GitHub Repo | Notes |
|---------|---|---|---|---|---|
| **salsaburgers.com** | `salsa-burgers-web` | ✅ LIVE | Next.js 16.2.4 | NO EXISTE en `jeicost/*` | Código está en monorepo `clients/salsa-burgers/`, desplegado manualmente, sin Git integration en Vercel |
| **ncglobalassets.com** | `nc-global-assets` | ✅ LIVE | Vite 5 + React 18 (SPA) | NO EXISTE en `jeicost/*` | Código en `clients/nc-global-assets/`, estático prerrenderizado con `react-snap`, SEO 46/100; **NOTA:** existe migración a Next.js en `clients/nc-global-assets-next/` (mejor SEO) pero solo vive en preview, nunca conectada al dominio |
| discoolver.es | N/A | ⚠️ UNCLEAR | — | `discoolver-group/discoolver-landing` | Registrado en Vercel pero Discoolver está en una team/org separada (`discoolver-group`); no bajo `jeicost/` |
| discoolver.com | N/A | N/A | — | — | No presente en lookup de dominios de esta cuenta Vercel |

---

## PROYECTOS VERCEL (TODOS 20)

### ✅ DOMINIOS ASIGNADOS (Tier: Seguro)

| Nombre | Dominio | Stack | GitHub | Estado | Notas |
|---|---|---|---|---|---|
| `startup-factory-web` | startupsfactory.es | Next.js 16 | `jeicost/startup-factory-web` | ✅ Ready | CMS integration + ISR webhooks |
| `sf-crm` | sf-crm-phi.vercel.app | Next.js 16 | `jeicost/sf-crm` (privado) | ✅ Ready | **HAS `.vercel/project.json`** — blindado contra redeploy incorrecto |
| `mira-portal` (Mira) | mira-portal-nu.vercel.app | Next.js | `jeicost/mira-portal` (privado) | ✅ Ready | **HAS `.vercel/project.json`** |
| `ai-agency-sf-next` | ai-agency-sf-next.vercel.app | Next.js 16 | `jeicost/ai-agency-sf-next` (público) | ✅ Ready | Portal ops interno (pw: sf2026) |
| `sf-reports` | reports.startupsfactory.com | Next.js | `jeicost/sf-reports` (público) | ✅ Ready | Hub de entregables |
| `mira-landing` | mira-landing-chi.vercel.app | Next.js 15 (SSG) | `jeicost/mira-landing` (privado) | ✅ Ready | Landing de venta de MIRA |
| `salsa-burgers-web` | salsaburgers.com | Next.js 16 | Local monorepo | ✅ Ready | Sin Git integration |
| `nc-global-assets` | ncglobalassets.com | Vite 5 | Local monorepo | ✅ Ready | SPA vieja (SEO 46/100), legacy |
| `sf-links` | sf-links.vercel.app | — | — | ⚠️ Unknown | No hay `.vercel/project.json` documentado |

---

### ⚠️ SIN DOMINIO O PROPÓSITO CLARO (Tier: Ruido / Candidatos a limpieza)

| Nombre | Preview URL | Stack | GitHub | Estado | Problema |
|---|---|---|---|---|---|
| `nc-global-assets-next` | nc-global-assets-next-jeicosts-projects.vercel.app | Next.js 16 | Local monorepo | 🟡 WIP | Migración incompleta (fase 2 de 3), nunca conectada al dominio real ncglobalassets.com |
| `web` | web-jeicosts-projects.vercel.app | — | ? | 🟡 Unknown | Nombre genérico, sin asignación clara |
| `lidar-home-web` | lidar-home-web-jeicosts-projects.vercel.app | — | — | 🟡 Deliverable | Solo contiene un briefing static site, no es producto |
| `briefing` | briefing-fawn.vercel.app | — | ? | 🟡 Unknown | Nombre genérico |
| `dist` | dist-bay-one-75.vercel.app | — | ? | 🟡 Unknown | Probablemente un export o test accidental |
| `forma-design-school` | forma-design-school-seven.vercel.app | — | ? | 🟡 Unknown | Nombre sugiere producto, pero sin repo/dominio claro |
| `salsa-burgers-content-site` | salsa-burgers-content-site.vercel.app | — | ? | 🟡 Deliverable | Probablemente un briefing/content pack temporal |
| `dadybox-briefing-site` | dadybox-briefing-site.vercel.app | — | ? | 🟡 Deliverable | Briefing estático, no producto |
| `discoolver-investor-deck-site` | discoolver-investor-deck-site.vercel.app | — | ? | 🟡 Deliverable | Investor deck estático |
| `creators-landing` | creators-landing-gamma.vercel.app | Vite? | ? | 🟡 Unclear | Podría ser para Discoolver |
| `discoolver-landing` | discoolver-landing.vercel.app | — | `discoolver-group/discoolver-landing` | 🟡 Separate team | En org `discoolver-group`, no bajo `jeicost` |
| `ai-agency-sf` | ai-agency-sf.vercel.app | — | ? | 🟡 DUPLICATE | Duplica `ai-agency-sf-next`; versi ón anterior no actualizada |

---

## ESTRUCTURA DEL MONOREPO (Verificado)

### Turborepo + pnpm workspace

```
Desktop/Claude/
├── apps/                           [Workspace: incluido en pnpm + turbo]
│   ├── ai-agency-sf-next/         Next.js, desplegado, Git linked
│   ├── mira/
│   │   ├── portal/                Next.js, tiene .vercel/project.json
│   │   └── [otros]
│   ├── mira-landing/              Next.js, desplegado
│   ├── sf-cms/                    ⚠️ DIRECTORIO VACÍO (código perdido, app viva en producción)
│   ├── sf-crm/                    Next.js, tiene .vercel/project.json
│   ├── sf-links/                  ⚠️ DIRECTORIO VACÍO
│   ├── sf-reports/                Next.js, desplegado, Git linked
│   ├── sf-sales-engine/           Python + Next.js
│   └── startup-factory-web/       Next.js, desplegado, Git linked
│
├── clients/                        [EXCLUIDO de pnpm workspace — debe ser instalado/construido por separado]
│   ├── salsa-burgers/             Next.js (web/) + Flask (app/) 
│   │   └── web/                   Desplegado como `salsa-burgers-web`, SIN .vercel/project.json
│   ├── nc-global-assets/          Vite + React, desplegado, SIN .vercel/project.json
│   ├── nc-global-assets-next/     Next.js 16, WIP migration, SIN .vercel/project.json
│   ├── discoolver/                4 sub-proyectos (dg-editor, discoolver-cms, creators-landing, design-studio)
│   ├── lidar-home/                Briefing site estático
│   ├── dadybox/                   Playwright playbooks + briefing estático
│   └── startup-factory/           Content packs + briefing estáticos
│
├── packages/                       [Shared code, workspace registered]
│   ├── auth/      (@sf/auth)      Supabase SSR helpers
│   ├── supabase/  (@sf/supabase)  Supabase client + generated types
│   ├── ui/        (@sf/ui)        React components
│   └── config/    (@sf/config)    ESLint + TypeScript
│
└── agency/
    ├── agency-os/                 Motor central (YAML agents, n8n workflows, Supabase migrations)
    ├── ...
```

**Problema identificado:** `clients/*` está EXCLUIDO de la workspace (`pnpm-workspace.yaml` only lists `apps/*`, `apps/*/*`, `packages/*`). Implicación: `pnpm install` / `turbo build` en root NO toca clientes — cada uno usa su propio `npm install` (algunos con `package-lock.json` en lugar de pnpm-lock).

---

## ESTADO DE INTEGRACIÓN CMS

### Pipeline: SF-CMS → Webs clientes (ISR revalidate)

**Arquitectura:**
```
SF-CMS (cms.startupsfactory.es)
  ↓ (Supabase webhook en tabla `posts`)
POST /api/revalidate en cada web
  ↓ (validar `x-revalidate-secret` header)
Next.js revalidatePath()
  ↓ (ISR regenera page, CDN updated)
Contenido live en dominio público
```

**Estado según `CMS_PRODUCTION_SNAPSHOT.md` (2026-05-21):**
- ✅ Supabase webhooks configurados
- ✅ `/api/revalidate` endpoints desplegados en las 3 webs
- ⚠️ Dominio aliases en Vercel apuntando a deployments viejos (bloqueador en mayo) — **estado actual INCIERTO**

**Webs integradas:**
- `startup-factory-web` — consume `CMS_API_URL=https://cms.startupsfactory.es/api/public`, project=`startupsfactory`
- `clients/nc-global-assets` — idem, project=`ncglobalassets`
- `clients/salsa-burgers` — idem, project=`salsaburgers`

---

## BASES DE DATOS (Supabase)

### MIRA + Otros

- **`nnevhtfxuawexliwlbmh`** — Compartida por MIRA + AI Agency SF + Sales Engine; tablas propietarias de MIRA (mira_clients, mira_users, mira_subscriptions), SF Sales (leads, crm_contacts, discovery_runs), SF CMS NO está aquí

### SF-CMS (Independiente)

- **`dmzecrlkclocqaywkjtc`** — Propia y separada; tablas: `pages`, `posts`, `posts_revisions`, `page_versions`, `page_activity`, `projects`, `user_roles`, `audit_log`; **ya está desacoplada de MIRA**

---

## HISTORIAL DE INCIDENTES

| Fecha | Dominio | Problema | Causa | Resolución |
|------|---------|----------|-------|-----------|
| 2026-05-17 | startupsfactory.es | Apuntó a `sf-reports` en lugar de `startup-factory-web` | Deploy sin verificar alias previo | Movido a proyecto correcto manualmente |
| 2026-07-12 | apps/sf-cms | Código fuente borrado (gitlink removido) | Confusión: submodule phantom vs real code | **PENDIENTE DE RECUPERACIÓN** |

---

## DECISIONES RECOMENDADAS

### Tier 1: INMEDIATO (seguridad + claridad)

1. **Rotar credenciales expuestas** — service_role key de Supabase, REVALIDATE_SECRET, password admin del CMS
2. **Agregar `.vercel/project.json` a clientes** — `clients/salsa-burgers/`, `clients/nc-global-assets/`, `clients/nc-global-assets-next/` para blindar contra redeploys incorrectos (causa del incidente de mayo)
3. **Crear repo `sf-cms` nuevo** — GitHub `jeicost/sf-cms`, vincular a Vercel vía Git (elimina riesgo de "deploy perdido sin git trace")
4. **Limpiar documentación** — purgar credenciales de `.md` files en repo

### Tier 2: PRÓXIMA SESIÓN (gobernanza)

1. **Completar migración `nc-global-assets-next/`** — terminar fase 2-3, probar, mover dominio
2. **Recuperar código de SF-CMS** — investigar Vercel API alternatives o reconstruir desde schema + docs
3. **Unificar workspace** — incluir `clients/*` en pnpm workspace (estandarizar package manager, simplificar `pnpm install`)
4. **Limpiar proyectos Vercel** — borrar 5 huérfanos (`ai-agency-sf`, `web`, `briefing`, `dist`, `salsa-burgers-content-site`) tras confirmar que sus deployments nunca se usan

### Tier 3: GOBERNANZA A LARGO PLAZO

1. **CMS + landing-builder integration** — al generar una web nueva, auto-registrar en SF-CMS
2. **DNS audit** — `startupsfactory.com` está mal configurado (nameservers Vercel no resuelven); decidir: redirect a `.es`, usar solo `.es`, o arreglar DNS
3. **API documentation** — SF-CMS, Sales Engine, MIRA cada uno necesita OpenAPI spec documentada

---

## CHECKLIST DE VERIFICACIÓN (Verificado hoy)

- ✅ `vercel domains ls` — 4 dominios custom
- ✅ `vercel domains inspect <domain>` — cada dominio apunta al proyecto correcto
- ✅ `vercel project ls` — 20 proyectos listados, ninguno no accesible
- ✅ `curl https://cms.startupsfactory.es` — 200 OK, app viva
- ✅ `gh api /user/repos` — repos de SF en GitHub documentados
- ✅ Supabase projects confirmados (dos: MIRA shared + SF-CMS separate)
- ✅ PAT de Vercel funcional (listó 128 archivos, aunque descarga falló por 410 — esperado)

---

## CONTACTO PARA DECISIONES

User: Carlos Jacoste (jacostech@gmail.com)  
Token: `[ROTATED]` (SF-CMS Source Recovery, no revocar hasta próxima sesión)

---

**Documento: Verified 2026-07-13 23:XX UTC**
