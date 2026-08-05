# Discoolver — Web

Landing pública de Discoolver (home + `/influencers`), reconstruida en Next.js 15 App Router
tras la pérdida del código fuente original (deploy hecho por Vercel CLI sin repo Git — ver
`clients/discoolver/CLAUDE.md` del monorepo para el contexto completo del incidente).

## Stack

- Next.js 16 (App Router) + React 19
- CSS: tokens + componentes recuperados 1:1 del bundle de producción original (`app/globals.css`),
  más Tailwind v4 para utilidades puntuales
- Fuentes: Space Grotesk (display) + Geist / Geist Mono (body / mono), vía `next/font/google`
- Contenido editable vía SF-CMS (build-time bake, ver más abajo)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` (home) y `http://localhost:3000/influencers`.

## Build

```bash
npm run build   # corre scripts/fetch-cms-content.mjs antes de `next build`
```

## Contenido editable desde SF-CMS

El copy editable (headlines, subheads, testimonios, FAQ, etc. — **no** el layout/diseño) vive en
sf-cms, proyecto `discoolver`, páginas `home` e `influencers` (sección `flat-fields`, id `content`).

- `scripts/fetch-cms-content.mjs` corre **antes** de `next build` (ver `package.json`), descarga
  ambas páginas de sf-cms y escribe `content/pages.json` (gitignored, se regenera en cada build).
- `lib/cms-pages.ts` expone `loadCmsSections()` / `section()` / `mergeContent()` — cada
  `app/**/page.tsx` mergea el JSON del CMS sobre el fallback hardcodeado en
  `lib/content/{home,influencers}.ts` (CMS gana solo si el campo no está vacío).
- **Un cambio en el CMS se refleja en el próximo `vercel --prod`, no al instante.** Sin envs o con
  el CMS caído/con la página en `draft`, el script nunca rompe el build — se queda con el copy
  hardcodeado (fallback siempre presente, la web nunca queda en blanco).

Env vars (`.env.example`):

```
SF_CMS_API_URL=https://cms.startupsfactory.es/api/public
SF_CMS_API_KEY=sk_xxxxx
SF_CMS_PROJECT_SLUG=discoolver
```

Las dos páginas en sf-cms están en `status: draft` — publícalas manualmente desde el admin de
sf-cms cuando se confirme que el contenido es correcto.

## Assets

Todos los assets (`public/assets/*`, `public/favicon.ico`, etc.) se descargaron directo del
dominio en vivo `discoolver-landing.vercel.app` (los binarios seguían siendo públicos aunque el
código fuente se había purgado). Varias imágenes PNG son muy pesadas (20-35MB, renders sin
comprimir) — pendiente de compresión antes de un deploy real (ver sección "Pendiente" en
`clients/discoolver/CLAUDE.md`).

## Estructura

```
app/
  page.tsx                    # Home
  influencers/page.tsx
  layout.tsx                  # fonts, metadata base, skip-link, JSON-LD
  api/waitlist/route.ts       # stub — valida y loguea, sin proveedor de email conectado aún
components/
  layout/                     # Nav, Footer
  sections/                   # Hero, Categories, TravelBrain, HowItWorks, Experiences,
                               # MapSection, ForCreators, AppComingSoon, Testimonials, FAQ,
                               # CTA, Wordmark
  sections/influencers/       # InfluencerHero, ValueProps, Tools, Criteria, Territory,
                               # Testimonials, Form, Downloadables
  ui/                         # Icon, Reveal, HeroForm, Countdown
lib/
  content/{home,influencers}.ts  # copy hardcodeado (fallback + fuente de los campos del CMS)
  cms-pages.ts                # helpers de merge CMS
  site.ts / seo.ts / jsonld.ts
scripts/fetch-cms-content.mjs
```
