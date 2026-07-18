# SF CRM — Startup Factory

Enterprise Customer Relationship Management platform for Startup Factory and partner workspaces (Discoolver, Dadybox).

## Features

- **Multi-Workspace Support** — SF Workspace, Discoolver, Dadybox with separate authentication
- **Pipeline Management** — Visual sales pipeline with stage tracking
- **Contact Management** — Dual-table design (leads for SF, crm_contacts for others)
- **Lead Scoring** — Automatic scoring: hot (≥75), warm (50-74), cold (<50)
- **Prospection** — Apollo.io integration for prospect search
- **Outreach** — Email campaigns powered by Resend API
- **Discovery** — Automated company research runs
- **Metrics** — Pipeline health, conversion rates, deal analytics
- **Integrations** — 15+ tools marketplace (Apollo, LinkedIn, Clearbit, etc.)

## Stack

- **Frontend** — Next.js 16, React 19, TypeScript
- **Backend** — Next.js API Routes
- **Database** — Supabase PostgreSQL
- **Email** — Resend API
- **Auth** — Custom cookie-based (httpOnly, 7-day sessions)
- **Styling** — CSS modules with variables (no Tailwind)

## Getting Started

### Prerequisites

- Node.js 18+ / pnpm
- Supabase project (nnevhtfxuawexliwlbmh)
- Environment variables configured

### Installation

```bash
# Copy environment variables
cp .env.local.example .env.local

# Install dependencies (from root)
pnpm install

# Run dev server
cd apps/sf-crm
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://nnevhtfxuawexliwlbmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

SF_WORKSPACE_PASSWORD=sf2026
DISCOOLVER_WORKSPACE_PASSWORD=disc2026

RESEND_API_KEY=...
APOLLO_API_KEY=...
```

## Database Schema

### leads (SF Workspace only)
- `id` (UUID), `client_id` (UUID), `first_name`, `last_name`, `company_name`, `title`, `email`, `phone`, `linkedin_url`, `geography`, `industry`, `hot_score` (INT, 0-100), `stage`, `icebreaker_used`, `proposal_sent`, `created_at`, `updated_at`

### crm_contacts (Dadybox, Discoolver, other workspaces)
- `id` (UUID), `workspace_id` (TEXT), `first_name`, `last_name`, `company_name`, `title`, `email`, `phone`, `linkedin_url`, `geography`, `industry`, `hot_score` (INT, 0-100), `stage`, `notes`, `created_at`, `updated_at`
- **Important**: camelCase ↔ snake_case mapping handled by `lib/db.ts` (mapCrmContactRow / unmapCrmContactRow)

### lead_activities
- `id`, `contact_id`, `type`, `description`, `metadata`, `created_at`, `created_by`

### outreach_emails
- `id`, `contact_id`, `to`, `subject`, `body`, `status`, `sent_at`, `opened_at`, `clicked_at`, `workspace_id`

### discovery_runs
- `id`, `workspace_id`, `client_id`, `company`, `status`, `results`, `error`, `started_at`, `completed_at`

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Pipeline | `/[workspace]/pipeline` | Sales pipeline visualization |
| Contacts | `/[workspace]/contacts` | All contacts with filtering |
| Prospection | `/[workspace]/prospection` | Prospect search & import |
| Outreach | `/[workspace]/outreach` | Email campaigns |
| Discovery | `/[workspace]/discovery` | Company research |
| Metrics | `/[workspace]/metrics` | Analytics dashboard |
| Integrations | `/[workspace]/integrations` | 15-tool marketplace |

## API Routes

- `POST /api/auth` — Login
- `POST /api/auth/logout` — Logout
- `PATCH /api/contacts/[id]` — Update contact
- `PATCH /api/contacts/bulk` — Bulk update
- `POST /api/leads/import` — Batch import
- `POST /api/outreach/send-email` — Send emails
- `POST /api/prospection/search` — Search prospects
- `POST /api/discovery/run` — Start discovery

## Styling

### CSS Variables
- Colors: `--color-primary`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
- Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Borders: `--border-color`, `--border-color-light`

### Dark Mode
Automatic via `prefers-color-scheme` or manual via `data-theme="dark"` on root element.

## Lead Scoring

Score is calculated from enriched data:
- Email: +20pts
- Phone: +10pts
- LinkedIn: +15pts
- Company: +20pts
- Title: +15pts
- Industry: +10pts
- Geography: +5pts

Result: hot (≥75), warm (50-74), cold (<50)

## Authentication

Custom httpOnly cookie-based auth:
- 7-day session duration
- Per-workspace passwords in `.env.local`
- Automatic redirect to login on session expiry
- Logout clears session cookie

## Deployment

```bash
# Verify .vercel/project.json exists
cat apps/sf-crm/.vercel/project.json

# Deploy to Vercel
cd apps/sf-crm
vercel --prod
```

## Development

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Start production server
npm run start
```

## License

Internal use only — Startup Factory.
