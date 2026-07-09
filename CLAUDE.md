# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

Turborepo + pnpm workspace. **Package manager: pnpm** (never npm/yarn at root level).

```
Desktop/Claude/
├── apps/                      # Products and internal tools (each deploys independently)
│   ├── mira/portal            # MIRA SaaS portal — 30 AI agents + Brand Brain (portal-six-kappa-22.vercel.app)
│   ├── mira-landing/          # MIRA marketing site
│   ├── sf-cms/                # Headless CMS for client landings (cms.startupsfactory.es)
│   ├── sf-crm/                # CRM + Sales Engine unified (sf-crm-phi.vercel.app)
│   ├── sf-sales-engine/       # B2B discovery engine (Python + Next.js portal)
│   ├── ai-agency-sf-next/     # Internal ops portal — briefings, audits, deliverables (ai-agency-sf-next.vercel.app)
│   ├── sf-reports/            # Client deliverables hub (sf-reports.vercel.app)
│   ├── sf-links/              # SF link/QR tool
│   └── startup-factory-web/   # Main SF website (startupsfactory.es)
│
├── packages/                  # Shared code (not deployed independently)
│   ├── auth/      (@sf/auth)       # Supabase SSR helpers
│   ├── supabase/  (@sf/supabase)   # Supabase client + generated types
│   ├── ui/        (@sf/ui)         # Shared React components
│   └── config/    (@sf/config)     # Shared ESLint + TypeScript configs
│
├── clients/                   # Per-client projects (non-SF tools)
│   ├── discoolver/            # dg-editor (FastAPI+React) + landing + deliverables
│   ├── salsa-burgers/         # App (Flask+PG Railway) + web + deliverables
│   ├── nc-global-assets/      # Web (Vite+React) + deliverables
│   └── dadybox/               # Playwright playbooks + deliverables
│
├── agency/agency-os/          # Motor central — agents YAML, n8n workflows, Supabase migrations
├── tools/                     # Local MCPs (apple-mail, freepik, google-slides)
└── scripts/                   # Root automation scripts (migrations, seeding)
```

Read `ARCHITECTURE.md` for the full system design and client/product map.

---

## Commands

### Root (all apps via Turborepo)

```bash
pnpm dev          # start all dev servers in parallel
pnpm build        # build all apps (respects ^build dependencies)
pnpm lint         # lint all apps
pnpm type-check   # TypeScript check all apps
```

### Single app

```bash
cd apps/sf-crm && npm run dev      # Next.js apps use npm locally
cd apps/sf-crm && npm run build
cd apps/sf-crm && npm run lint
```

### Deploy (each app is independent)

```bash
cd apps/<app-name>
vercel --prod
```

Every app that deploys to Vercel **must have** `.vercel/project.json` with its own `projectId`. Without it, Vercel uses the parent `.vercel/project.json` (which points to sf-cms) and the deploy goes to the wrong project. Always verify before deploying:

```bash
cat apps/<app-name>/.vercel/project.json
```

---

## Shared Packages

Apps declare shared packages as workspace dependencies. They are not published to npm.

```json
{ "dependencies": { "@sf/auth": "*", "@sf/supabase": "*" } }
```

`@sf/auth` — Supabase SSR helpers (server-side cookie auth). Use this in Next.js apps instead of rolling custom auth.  
`@sf/supabase` — Supabase client singleton + generated types. Import: `import { createClient } from '@sf/supabase'`.

---

## Supabase

All SF tools share one Supabase project: **`nnevhtfxuawexliwlbmh`**

Tables owned by each product:
- **MIRA**: `mira_clients`, `mira_users`, `mira_subscriptions`, agent-specific tables
- **SF Sales Engine / SF CRM**: `leads` (SF workspace, `client_id = 00000000-...-000001`), `crm_contacts` (Discoolver and other workspaces), `lead_activities`, `discovery_runs`, `icp_profiles`, `proposal_library`
- **SF CMS**: `projects`, `pages`, `sections`, `posts`

**Important field quirk**: `leads.icebreaker_used` (Sales Engine table) ≠ `crm_contacts.icebreaker` (CRM generic table). Different column names for the same concept.

Schema migrations live in `apps/sf-sales-engine/supabase/migrations/`. Apply via Supabase dashboard SQL editor — there is no automated migration runner.

---

## Deploying Client Projects

Client projects under `clients/` are not part of the Turborepo workspace. Each deploys independently and has its own stack:

| Client | Stack | Deploy |
|---|---|---|
| Salsa Burgers app | Flask + PostgreSQL (Railway) | Railway auto-deploy |
| Salsa Burgers web | Next.js | `vercel --prod` from `clients/salsa-burgers/web/` |
| Discoolver dg-editor | FastAPI + React | Railway / manual |
| NC Global Assets | Vite + React | `vercel --prod` |

**Before touching any client domain config**, check `memory/clients_production_domains_registry.md` first.

---

## SEO Checklist — Obligatorio Pre-Deploy

Aplica a todas las webs y landings. Verificar antes de cualquier `vercel --prod`:

- [ ] **Title tag** — max 60 chars, keyword + brand
- [ ] **Meta description** — 120-160 chars, CTA implícito
- [ ] **Canonical tag** — self-canonical en TODAS las páginas
- [ ] **OG tags** — og:title, og:description, og:image (1200×630px), og:url
- [ ] **Blog posts** — BlogPosting schema JSON-LD (datePublished + author obligatorio)
- [ ] **Dominio www** — sitemap.xml, robots.txt, canonical, redirects todos apuntan a `www`
- [ ] **Sitemap** — referenciado en robots.txt

### Dominio — regla absoluta

Siempre `https://www.domain.com`. Redirect 308 de `domain.com` → `www.domain.com`. Aplica en: robots.txt, sitemap.xml, canonical tags, metadata.

### Next.js — patrón de metadata

```ts
export const metadata: Metadata = {
  title: 'Page Title — Brand',         // < 60 chars
  description: 'Description 120-160 chars',
  metadataBase: new URL('https://www.domain.com'),
  alternates: { canonical: '/page-slug' },
  openGraph: {
    type: 'website',
    url: 'https://www.domain.com/page-slug',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};
```

Blog posts usan `generateMetadata()` async + `generateStaticParams()`. BlogPosting schema va en `app/blog/[slug]/layout.tsx` como `<script type="application/ld+json">`.

### React SPA (Vite)

Usar el helper `updatePageMeta()` en un `useEffect` por ruta. Implementado en `clients/salsa-burgers/web/` como referencia.

### Performance targets (mobile)
- FCP < 2.5s · TBT < 200ms · CLS < 0.1
- Medir con Lighthouse antes de deploy a producción

---

## MCP Servers (`.mcp.json`)

Configurados en raíz: Figma, Freepik, Google Drive (ncglobal + personal), Apple Mail, Google Slides. Se activan automáticamente en Claude Code.

---

## Per-App CLAUDE.md

Cada app tiene su propio CLAUDE.md con contexto específico:
- `apps/sf-crm/CLAUDE.md` — multi-workspace auth, dual-table pattern, styling
- `apps/sf-sales-engine/CLAUDE.md` — Python uv workspace, scripts operacionales, Commercial Brain
