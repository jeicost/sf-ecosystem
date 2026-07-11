# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Motor de adquisición B2B con IA vendido por Startup Factory. Cada cliente tiene su propio Commercial Brain calibrado con su ICP, propuestas ganadoras y señales de mercado.

Doble uso: SF lo usa internamente (`clients/sf-internal/`) y lo vende como producto a otras empresas.

---

## Stack y separación de responsabilidades

| Capa | Runtime | Qué hace |
|---|---|---|
| Data Pipeline | Python 3.12 + FastAPI + Arq | Scraping, enriquecimiento, scoring IA |
| Workflows | n8n (self-hosted, Docker) | Outreach, calificación, propuestas, alertas HITL |
| Base de datos | Supabase (Postgres + pgvector) | Bus de comunicación + Commercial Brain |
| Portal | Next.js 16 (deprecated → sf-crm) | Dashboard — migrado a `apps/sf-crm/` |

**Regla clave**: Python escribe en Supabase → n8n lee de Supabase. Sin llamadas directas entre capas.

---

## Comandos

```bash
# Setup
uv sync --all-packages        # instala todo el workspace Python

# Desarrollo
make dev-api                  # FastAPI en localhost:8000 (hot-reload)
make dev-n8n                  # n8n en localhost:5678 (Docker)

# Lint y tests
make lint                     # ruff check + mypy --strict
make test                     # pytest con cobertura
uv run pytest packages/scoring/tests/test_scorer.py -v   # un solo test file
uv run pytest -k "test_score" # un solo test por nombre

# Scripts operacionales
make discover-leads           # Tavily discovery completo (~5 min, 22 queries)
make discover-dry             # preview sin guardar en Supabase
uv run python scripts/discover_leads.py --geo España   # filtrar por geografía
uv run python scripts/generate_icebreakers.py [--dry-run] [--limit N] [--overwrite]
uv run python scripts/seed_vbs.py [--dry-run] [--skip-scoring] [--limit N]
uv run python scripts/onboard_client.py <slug> "<Nombre>" <tier>   # nuevo cliente

# Migraciones
make migrate                  # muestra instrucciones (aplicar vía Supabase CLI o dashboard)
```

---

## Arquitectura Python (uv workspace)

6 paquetes internos con dependencias declaradas en el `pyproject.toml` raíz:

```
packages/
  scrapers/    → TavilyScraper (implementado), Apollo/Hunter/Apify (stubs Semana 2)
  enrichment/  → EnrichmentEngine (stub — orquesta scrapers)
  scoring/     → LeadScorer con Claude Haiku (implementado)
  notion_sync/ → sync bidireccional Supabase ↔ Notion (implementado)

apps/
  api/    → FastAPI: /health, /discovery/run (501 stub), /leads/, /leads/score
  worker/ → Arq job queue: discovery_run_job (stub), notion_sync_job
```

**Lo que está implementado y funcional hoy**: los `scripts/` directos (discover_leads.py, generate_icebreakers.py, seed_vbs.py) y el package `scoring`. Los `apps/api/` y `apps/worker/` son scaffolds para cuando los scripts se conviertan en servicio.

---

## Supabase — schema (3 migraciones)

**001** — Commercial Brain: `icp_profiles`, `proposal_library` (pgvector RAG), `win_loss_history`, `market_intel`  
**002** — Pipeline CRM: `leads`, `lead_activities`, `prospect_context`  
**003** — Data Ops: `lead_cache`, `usage_log`, `discovery_runs`, `outbound_log`

Proyecto: `nnevhtfxuawexliwlbmh` (compartido con `sf-crm`).

**Quirk importante**: la tabla `leads` usa `icebreaker_used` (no `icebreaker`). La tabla `crm_contacts` de sf-crm usa `icebreaker`. Son distintos.

`leads` tiene `REPLICA IDENTITY FULL` para Supabase Realtime → n8n dispara workflows cuando `hot_score >= 75`.

---

## Clientes — estructura por slug

```
clients/
  _template/           → copiar con onboard_client.py
    config.yaml        → client_id UUID, nombre, tier
    icp-profile.yaml   → snapshot human-readable (canónico en Supabase icp_profiles)
    sources.yaml       → fuentes habilitadas (Apollo, Apify, Tavily, Hunter)
    pipeline-stages.yaml
  sf-internal/         → SF usa esto para prospección de VBs
```

`SF_CLIENT_ID = "00000000-0000-0000-0000-000000000001"` está hardcodeado en todos los scripts. Para otros clientes usar el UUID de `config.yaml`.

---

## n8n workflows

```
workflows/
  data-pipeline/    → discovery-trigger (cron 6am) · hot-lead-alert (Realtime)
  outreach/         → icebreaker-generator (HITL Telegram) · instantly-campaign-launcher
  qualification/    → reply-classifier (Instantly webhook → Haiku → stage update)
  proposals/        → call-brief-to-proposal (Tally → RAG → Sonnet → Google Doc)
  ops/              → telegram-alerts
```

Nombre de workflow: `[CLIENT]_[SERVICE]_[ACTION]`. Prompts siempre en `prompts/`, nunca en el JSON.

---

## Prompts — convenciones

```
prompts/
  scoring/lead-scorer.md         → Haiku, max_tokens 256
  outreach/cold-icebreaker.md    → Sonnet, max_tokens 200, 2 oraciones / 45 palabras
  proposals/proposal-generator.md
  qualification/reply-classifier.md
  enrichment/icp-analyzer.md
```

Frontmatter obligatorio: `version: "1.0.0"`. Incrementar semver en cada cambio de prompt. Modelo barato (scoring rápido): `claude-haiku-4-5-20251001`. Modelo calidad: `claude-sonnet-4-6`.

---

## Commercial Brain — patrón de consumo

Antes de generar cualquier icebreaker, score o propuesta, inyectar en el system prompt:

1. `icp_profiles` del cliente
2. `prospect_context` del lead (ya scrapado)
3. Top-3 `proposal_library` por cosine similarity al sector
4. `win_loss_history` del sector (objeciones esperadas)
5. `market_intel` reciente relevante

---

## Convenciones Python

- Async-first: `httpx.AsyncClient`, NO `requests`
- Pydantic v2 para todo lo que cruce process boundary
- `structlog` para logging (NO `print`, NO `logging` stdlib)
- `mypy --strict` en CI
- Tests: `pytest` + `respx` para mock HTTP

---

## Reglas absolutas

- Todo workflow nuevo → runbook en `docs/runbooks/`
- Nuevo cliente → `sources.yaml` explícito (sin defaults implícitos)
- NUNCA bypass TOS LinkedIn/Crunchbase — solo Apify actors oficiales
