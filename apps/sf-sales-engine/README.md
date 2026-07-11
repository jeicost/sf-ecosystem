# SF Sales Engine

Motor de adquisición B2B con IA vendido por Startup Factory.
Lee [PLAN.md](./PLAN.md) para el contexto estratégico completo.

## Quickstart

```bash
cp .env.example .env        # rellena con tus API keys
make install                 # instala dependencias Python (uv sync)
make dev-n8n                 # levanta n8n en localhost:5678
make dev-api                 # levanta FastAPI en localhost:8000
make seed-vbs                # carga los 54 VBs en Supabase + Notion (SF interno)
```

## Stack

| Capa | Tech | Puerto |
|---|---|---|
| Data Pipeline | Python 3.12 + FastAPI + Arq | :8000 |
| Workflows | n8n self-hosted | :5678 |
| Base de datos | Supabase (Postgres + pgvector) | — |
| Portal | Next.js 16 | :3000 |

## Estructura

```
apps/api/        → FastAPI: /discovery/run, /leads/score
apps/worker/     → Arq: jobs async en background
packages/        → scrapers, enrichment, scoring, notion_sync
workflows/       → JSONs de n8n versionados
prompts/         → librería de prompts con semver
clients/         → config por empresa cliente
supabase/        → migrations SQL
```

## Onboarding de cliente nuevo

```bash
pnpm onboard:client <slug>   # crea clients/<slug>/ con los 4 archivos base
```
