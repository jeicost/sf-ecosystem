# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing landing page for MIRA. **Bilingual (ES default at `/`, EN at `/en`) and CMS-driven since 2026-08-12.**

**No content lives in the JSX.** Copy lives in `lib/content/home.ts` (ES) and
`lib/content/en/home.ts` (EN) — 154 flat fields each — and SF-CMS overrides it at
build time. `app/page.tsx` and `app/en/page.tsx` are thin wrappers that resolve
the copy and hand it to the shared `app/home-view.tsx`. Writing a sentence into
the JSX would take it out of the CMS and out of the other language at once.

⚠️ **The CMS OVERRIDES the code.** `mergeContent` walks the fallback's keys and the
CMS wins on any non-empty string. So after rewriting copy you MUST re-seed before
deploying (`npx tsx scripts/seed-cms-mira.ts`) or the old text ships — and you
won't notice locally, where only the fallbacks render. In Discoolver this cost 40
real collisions.

The EN file is **typed against the ES one**: adding a field without translating it
does not compile, instead of leaving a silent blank section on `/en`.

## Commands

```bash
npm run dev     # localhost:3000
npm run build   # static export → out/
npm start       # preview the static export
```

No lint script in package.json. No tests.

## Architecture

**Next.js 15** with `output: 'export'` (fully static). Deploys as a static site — no server-side rendering, no API routes.

- `app/layout.tsx` — global styles (inline `<style>`), GTM, Google Fonts (Space Grotesk), Vercel Analytics
- `app/page.tsx` / `app/en/page.tsx` — thin wrappers: resolve copy, set metadata
- `app/home-view.tsx` — the whole landing, driven by the content object
- `lib/content/home.ts` + `lib/content/en/home.ts` — the copy (source of truth)
- `lib/cms-pages.ts` — `pageContent()`: fallback merged with the CMS bake
- `scripts/fetch-cms-content.mjs` — bakes `content/pages.json` at build time. If the
  CMS is down the build does NOT fail and keeps the previous bake: a landing down
  because of a slow CMS is worse than one with yesterday's copy.
- `scripts/seed-cms-mira.ts` — idempotent seeding of `home` and `home-en`
- `app/thank-you/page.tsx` — post-form-submission page
- `app/robots.ts` + `app/sitemap.ts` — SEO files, domain from `NEXT_PUBLIC_SITE_URL` env var
- `content/pages-complete.json` — content reference (not consumed by the app at runtime)
- `public/` — logos (Discoolver, NC, Salsa, SF), `og-image.png`, `icon.svg`

### Domain and CMS

Production: `https://mira-landing-chi.vercel.app` (project `mira-landing`, already
linked in `.vercel/project.json`).

SF-CMS project `mira` = `7de0e72f-89e6-4f3e-98f6-94411a9b424c`, slugs `home` and
`home-en`. Vercel needs `SF_CMS_API_KEY` and `SF_CMS_API_URL` (both set in
production). Content is baked at BUILD time, so a CMS edit needs a redeploy.

### Tracking

GTM `GTM-5QZTPDX5` loaded `beforeInteractive` in layout. Vercel Analytics via `@vercel/analytics/next`.

### Form

Contact/purchase form uses FormSubmit (no backend needed). Activated — submit goes to `thank-you` page on success.

### Styling

Everything is inline styles. No Tailwind, no CSS modules. Global CSS is injected as a `<style>` string in `layout.tsx`. Animations defined there (`agentFloat`, `ripple1`, `coreGlow`, etc.).

Color palette: dark `#0a0a0f` base, purple accent `#7c3aed` / `#5b21b6`, text `#f4f4f8`.

### Sections

hero · problem · Brand Brain · how it works · team · tools · Tenders · pricing
(5 plans + add-ons) · FAQ · closing CTA.

Prices come from the 12-ago-2026 model, itself calculated on measured cost from
710 real calls. **Never invent a figure here** — change the model first.

## Deploy

```bash
npx tsx scripts/seed-cms-mira.ts   # SI se ha tocado el copy — o se publica el viejo
npx next build                     # NOT --experimental-build-mode compile: skips the type check
vercel --prod
```
