# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing landing page for MIRA (the AI team product). Single-page app — all content lives in `app/page.tsx` (~1300 lines). No backend, no auth, no database.

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
- `app/page.tsx` — entire landing page as one large Client Component (`'use client'`)
- `app/thank-you/page.tsx` — post-form-submission page
- `app/robots.ts` + `app/sitemap.ts` — SEO files, domain from `NEXT_PUBLIC_SITE_URL` env var
- `content/pages-complete.json` — content reference (not consumed by the app at runtime)
- `public/` — logos (Discoolver, NC, Salsa, SF), `og-image.png`, `icon.svg`

### Domain

Production: `https://www.miralanding.com` (no Vercel alias yet — no `.vercel/project.json`). Domain via `NEXT_PUBLIC_SITE_URL` env var, fallback `https://www.miralanding.com`.

### Tracking

GTM `GTM-5QZTPDX5` loaded `beforeInteractive` in layout. Vercel Analytics via `@vercel/analytics/next`.

### Form

Contact/purchase form uses FormSubmit (no backend needed). Activated — submit goes to `thank-you` page on success.

### Styling

Everything is inline styles. No Tailwind, no CSS modules. Global CSS is injected as a `<style>` string in `layout.tsx`. Animations defined there (`agentFloat`, `ripple1`, `coreGlow`, etc.).

Color palette: dark `#0a0a0f` base, purple accent `#7c3aed` / `#5b21b6`, text `#f4f4f8`.

### Content structure (page.tsx)

Data constants defined at the top of the file:
- `TEAM_VISUALS` — inline SVGs per department (MKT, SLS, STR, INN, ADM, FIN)
- `TEAMS` — department metadata (agents, colors, capabilities)
- `STEPS` — "How it works" steps
- `FAQS` — FAQ accordion content
- `PORTAL_URL` — hardcoded to `https://mira.startupsfactory.es/login`

All page sections are rendered in one `return` block. State: `openFaq` (FAQ accordion) and `activeTeam` (department tabs).

## Deploy

No `.vercel/project.json` — link first before deploying:

```bash
vercel link   # select the mira-landing project
vercel --prod
```
