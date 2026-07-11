# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static HTML deliverables hub for SF clients. No build process — pure HTML files deployed directly to Vercel. Each client gets a folder with their audit reports, accessible only via direct URL (the root `index.html` shows a locked portal message).

**Access**: noindex + nofollow (set in `vercel.json` headers). Not public — shared with clients via direct links.

## Structure

```
sf-reports/
├── index.html              # Root — locked portal, links to /{slug}/history.html
├── logo-sf.svg
├── vercel.json             # noindex headers + redirects
├── {client-slug}/
│   ├── index.html          # Client hub — links to all their reports
│   ├── seo.html            # SEO audit report
│   ├── marketing.html      # Marketing audit report
│   ├── briefing.html       # Brand briefing (some clients)
│   ├── content.html        # Content audit (some clients)
│   ├── history.html        # Version history UI
│   ├── history.json        # Version history data
│   └── .versions/          # Archived snapshots (v001, v002, …)
│       └── v001/           # Copy of reports at that version
└── .versions.json          # (per client)
```

Current clients: `dadybox`, `discoolver`, `jeicost`, `ncglobalassets`, `salsa-burgers`, `startupsfactory`, `cero-agency`, `lidar-home`, `mira`, `startup-factory`.

## Adding a new deliverable for an existing client

1. Place the HTML file in `apps/sf-reports/{client-slug}/`
2. Add a link to it from `{client-slug}/index.html`
3. Commit + push → GitHub Action auto-deploys via Vercel deploy hook

## Adding a new client

1. Create `apps/sf-reports/{new-slug}/` with at least `index.html`
2. Update root `index.html` if it lists clients
3. Commit + push

## Deploy

Auto-deploys on push to `main` when `.html` or `.json` files change — GitHub Action (`.github/workflows/auto-deploy.yml`) triggers the Vercel deploy hook stored in `VERCEL_DEPLOY_HOOK_URL` secret.

Manual deploy:
```bash
vercel --prod   # from apps/sf-reports/
```

Vercel project: `prj_CKehhayVoAOeStxtyyyTV6g3Xl3t`

## Version history system

Each client has a `history.json` that tracks report versions:

```json
{ "versions": [{ "version": "v001", "date": "2026-05-01", "notes": "Initial audit" }] }
```

`history.html` reads `history.json` and `.versions/` to render a changelog UI. When publishing a new version, copy current reports into `.versions/v00N/` and update `history.json`.

## vercel.json

- `cleanUrls: false` — keeps `.html` extensions in URLs
- All pages get `X-Robots-Tag: noindex, nofollow` (private)
- Redirects: `/seo` → `/dadybox/seo`, `/marketing` → `/dadybox/marketing` (legacy)
