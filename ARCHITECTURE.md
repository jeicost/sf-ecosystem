# Startup Factory — Architecture Map
> Actualizado: 2026-05-11

---

## Qué es SF

Startup studio con tres patas:
1. **Agencia IA** — retainer mensual · marketing + web + estrategia IA
2. **Venture** — participa como co-fundador/socio en startups propias
3. **Software** — construye y vende MIRA (primero clientes, luego mercado)

---

## Ventures & Clientes

| Empresa | Tipo | Stack |
|---|---|---|
| Salsa Burgers | Venture (marca propia) | Flask+PG Railway · Next.js web · SF-CMS |
| Discoolver | Venture (co-fundada) | dg-editor (repo externo del cliente) · creators landing |
| NC Global Assets | Empresa propia en TH | Vite+React · SF-CMS |
| Dadybox | Cliente externo | Playwright playbooks · próximo: MIRA |
| 0 Agency | En pipeline | — |

---

## Herramientas Internas (solo equipo SF)

```
┌─────────────────────────────────────────────────────────┐
│  MIRA portal — mira.startupsfactory.es                  │
│  30 agentes IA · Marketing/Comercial/Estrategia/etc.    │
│  Hoy: uso interno → Siguiente: clientes → Luego: SaaS  │
├─────────────────────────────────────────────────────────┤
│  AI Agency SF — ai-agency-sf-next.vercel.app            │
│  Genera briefings, auditorías, content packs            │
│  Solo equipo SF · pw: sf2026                            │
├─────────────────────────────────────────────────────────┤
│  SF Sales Engine — localhost:3004                       │
│  Motor comercial B2B · leads · icebreakers · Supabase  │
├─────────────────────────────────────────────────────────┤
│  SF-CMS — cms.startupsfactory.es                        │
│  Edita contenido de todas las landings de clientes      │
└─────────────────────────────────────────────────────────┘
```

---

## Entregables para Clientes (ellos pueden ver)

```
┌─────────────────────────────────────────────────────────┐
│  SF Reports — sf-reports.vercel.app                     │
│  Auditorías SEO + Marketing por cliente                 │
│  /salsa-burgers · /discoolver · /dadybox · /ncglobal…  │
├─────────────────────────────────────────────────────────┤
│  Landings de cada cliente                               │
│  salsaburgers.com · ncglobalassets.com · etc.           │
├─────────────────────────────────────────────────────────┤
│  Briefings, decks, content sites                        │
│  Cada uno en su URL Vercel propia                       │
└─────────────────────────────────────────────────────────┘
```

---

## Infraestructura (invisible al usuario)

```
apps/mira/portal/       ← MIRA portal (Next.js) — 30 agentes, prompts en TS (lib/agent-meta.ts)
apps/sf-sales-engine/   ← Motor comercial (Python/FastAPI, Railway) — discovery/enrichment/scoring
apps/sf-crm/            ← CRM (Next.js, Vercel) — pipeline, contactos, prospection
supabase/               ← Migraciones por app (no hay una carpeta central única)

Supabase: nnevhtfxuawexliwlbmh (compartido: MIRA + sf-crm + sf-sales-engine + AI Agency SF)
```

Nota (2026-07-19): esta sección describía un `agency-os/` con n8n en Railway que **ya no existe** —
fue reemplazado por `apps/mira` hace tiempo, y el n8n de Railway asociado (`agency-os-production-6b4a.up.railway.app`)
es una referencia muerta. Ningún componente del stack actual depende de n8n; MIRA y sf-sales-engine
llaman a Claude directamente desde sus rutas API.

---

## Paths locales

```
Desktop/Claude/
├── apps/
│   ├── mira/               ← MIRA SaaS portal — 30 agentes IA (git)
│   ├── ai-agency-sf-next/  ← portal ops interno (git)
│   ├── startup-factory-web/← web SF (git)
│   ├── sf-cms/             ← CMS (git)
│   ├── sf-reports/         ← portal auditorías para clientes
│   ├── sf-sales-engine/    ← motor comercial (git · Supabase · sin n8n)
│   ├── sf-crm/             ← CRM (git)
│   └── mira-landing/       ← landing venta MIRA (Vercel)
│
├── clients/
│   ├── salsa-burgers/      ← app (Flask) + web (Next.js) + deliverables/
│   ├── discoolver/         ← creators landing + deliverables/ (dg-editor: repo externo ~/Desktop/discoolver-dg-editor)
│   ├── nc-global-assets-next/ ← web (Next, WIP cutover; la Vite legacy está en clients/_archive/)
│   ├── dadybox/            ← playbooks (Playwright) + deliverables/
│   └── startup-factory/    ← content/ + deliverables/
│
├── assets/                 ← logos SF · MIRA
└── tools/                  ← apple-mail-mcp · freepik-mcp · google-slides-mcp
```

---

## Flujo de trabajo con un cliente nuevo

> ⚠️ Sección desactualizada (2026-07-19): `pnpm seed:express` ya no existe en el repo.
> No se investigó a fondo cuál es el flujo de onboarding vigente — fuera del alcance
> de la revisión de n8n/MIRA de esta sesión. Verificar antes de seguir estos pasos.

```
1. Brand Brain express
   pnpm seed:express <slug>
   → agency-os/clients/<slug>/

2. Generar entregables desde AI Agency SF
   ai-agency-sf-next.vercel.app
   → briefing HTML · audit HTML · content HTML

3. Auditoría publicada en SF Reports
   /sf-digital-audit <slug> <url>
   → sf-reports.vercel.app/<slug>

4. Landing construida + conectada a SF-CMS
   → cms.startupsfactory.es

5. Acceso a MIRA según plan
   mira.startupsfactory.es
```

---

## Producto: MIRA

| Fase | Estado |
|---|---|
| Uso interno SF | ✅ Activo |
| Acceso clientes SF | Siguiente |
| SaaS público | Futuro |

**Pricing:** MIRA Marketing $99 · MIRA Full Stack $299 · Updates $9.99/mes  
**Landing:** mira-landing-chi.vercel.app (sin dominio propio aún)
