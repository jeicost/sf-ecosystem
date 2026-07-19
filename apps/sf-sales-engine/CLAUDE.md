# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Motor de adquisición B2B con IA vendido por Startup Factory. Cada cliente tiene su propio Commercial Brain calibrado con su ICP, propuestas ganadoras y señales de mercado.

Doble uso: SF lo usa internamente (`clients/sf-internal/`) y lo vende como producto a otras empresas.

---

## Stack y separación de responsabilidades

| Capa | Runtime | Qué hace |
|---|---|---|
| Data Pipeline | Python 3.12 + FastAPI + Arq | Scraping, enriquecimiento, scoring IA, outreach, webhooks |
| Base de datos | Supabase (Postgres + pgvector) | Bus de comunicación + Commercial Brain |
| Portal | Next.js 16 (deprecated → sf-crm) | Dashboard — migrado a `apps/sf-crm/` |

**Regla clave**: todo lo que antes iba a n8n (outreach, calificación, propuestas, alertas) son ahora llamadas directas a Claude desde FastAPI — mismo patrón que usa MIRA (`apps/mira/`, ver `api/routers/webhooks.py` y `api/routers/outreach.py`). n8n fue evaluado y eliminado (2026-07-19): nunca estuvo desplegado, y el único pipeline funcional (discovery.py) ya bypaseaba n8n desde el principio.

---

## Comandos

```bash
# Setup — --all-extras es obligatorio: sin él pytest/ruff/mypy no se instalan
# (dev deps están en [project.optional-dependencies] de cada paquete, no en el root)
uv sync --all-packages --all-extras

# Desarrollo
make dev-api                  # FastAPI en localhost:8000 (hot-reload)

# Lint y tests
make lint                     # ruff check + mypy --strict
make test                     # pytest con cobertura
uv run pytest packages/scoring/tests/test_scorer.py -v   # un solo test file
uv run pytest -k "test_score" # un solo test por nombre

# Scripts operacionales
make discover-leads           # Tavily discovery completo (~5 min, 22 queries) — también corre en cron diario, ver GitHub Actions
make discover-dry             # preview sin guardar en Supabase
uv run python scripts/discover_leads.py --geo España   # filtrar por geografía
uv run python scripts/generate_icebreakers.py [--dry-run] [--limit N] [--overwrite]
uv run python scripts/seed_vbs.py [--dry-run] [--skip-scoring] [--limit N]
uv run python scripts/onboard_client.py <slug> "<Nombre>" <tier>   # nuevo cliente

# Migraciones
make migrate                  # muestra instrucciones (aplicar vía Supabase CLI o dashboard)
```

**CI** (`.github/workflows/sf-sales-engine-ci.yml`, en la raíz del repo — GitHub Actions no escanea `.github/` dentro de subcarpetas, así que este archivo vivió muerto hasta 2026-07-19): pytest bloquea el merge; ruff y mypy corren pero no bloquean todavía (~34 errores de ruff y ~300 de mypy --strict preexistentes en archivos no tocados — mypy nunca había completado un run limpio por un bug de configuración de paths, ya arreglado). Limpiar esa deuda y pasar ambos a bloqueantes es trabajo pendiente, no de esta ronda.

**Cron de discovery diario** (`.github/workflows/sf-sales-engine-daily-discovery.yml`): reemplaza el n8n `discovery-trigger.json` (nunca desplegado) — corre `scripts/discover_leads.py` a las 6am UTC vía GitHub Actions en vez de un workflow de n8n. Necesita los secrets `SF_SALES_ENGINE_SUPABASE_URL`, `SF_SALES_ENGINE_SUPABASE_SERVICE_KEY`, `SF_SALES_ENGINE_ANTHROPIC_API_KEY`, `SF_SALES_ENGINE_TAVILY_API_KEY`, `SF_SALES_ENGINE_NOTION_API_KEY`, `SF_SALES_ENGINE_NOTION_VBS_DATABASE_ID` configurados en GitHub (Settings → Secrets) — pendiente de que el usuario los añada.

---

## Arquitectura Python (uv workspace)

6 paquetes internos con dependencias declaradas en el `pyproject.toml` raíz:

```
packages/
  scrapers/    → Tavily, Apollo, Hunter (todos implementados; Apify pendiente)
  enrichment/  → EnrichmentEngine (implementado — orquesta scrapers + cache + costos)
  scoring/     → LeadScorer con Claude Haiku (implementado)
  notion_sync/ → sync bidireccional Supabase ↔ Notion (implementado)

apps/
  api/    → FastAPI, todo implementado con llamadas directas a Claude (sin n8n):
            /health, /discovery/run, /discovery/runs, /leads/, /leads/score,
            /leads/search, /icebreaker/generate, /outreach/send/{lead_id},
            /outreach/generate-proposal, /webhooks/hot-lead, /webhooks/instantly-reply
  worker/ → Arq job queue: discovery_run_job, notion_sync_job
```

**Lo que está implementado y funcional hoy**: prácticamente todo — scripts/, todos los packages, y todas las rutas de `apps/api/`. `/discovery/run` corre síncrono (TODO propio en el código: encolarlo en Arq para no bloquear la request en discoveries largos).

---

## Supabase — schema (3 migraciones)

**001** — Commercial Brain: `icp_profiles`, `proposal_library` (pgvector RAG), `win_loss_history`, `market_intel`  
**002** — Pipeline CRM: `leads`, `lead_activities`, `prospect_context`  
**003** — Data Ops: `lead_cache`, `usage_log`, `discovery_runs`, `outbound_log`

Proyecto: `nnevhtfxuawexliwlbmh` (compartido con `sf-crm`).

**Quirk importante**: la tabla `leads` usa `icebreaker_used` (no `icebreaker`). La tabla `crm_contacts` de sf-crm usa `icebreaker`. Son distintos.

`leads` tiene `REPLICA IDENTITY FULL` para que Supabase Database Webhooks pueda notificar `POST /webhooks/hot-lead` cuando se inserta un lead con `hot_score >= 75` (antes alimentaba el listener Realtime de n8n; mismo mecanismo de Postgres, nuevo destino).

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

## Reemplazo de n8n — llamadas directas a Claude

Cada workflow de n8n (nunca desplegado) tiene un endpoint FastAPI equivalente, todos en `apps/api/src/api/`:

| n8n workflow (eliminado) | Trigger | Reemplazo |
|---|---|---|
| `data-pipeline/discovery-trigger.json` | Cron 6am | `.github/workflows/sf-sales-engine-daily-discovery.yml` (GitHub Actions cron) llamando `scripts/discover_leads.py` |
| `data-pipeline/hot-lead-alert.json` | Supabase Realtime | Supabase Database Webhook → `POST /webhooks/hot-lead` (`routers/webhooks.py`) — alerta Telegram + genera icebreaker en la misma request |
| `outreach/icebreaker-generator.json` | Encadenado desde hot-lead-alert | `POST /icebreaker/generate` (`routers/icebreaker.py`) — ya estaba implementado, solo faltaba registrarlo en `main.py` |
| `outreach/instantly-campaign-launcher.json` | Aprobación Telegram | `POST /outreach/send/{lead_id}` (`routers/outreach.py`) — añade el lead a una campaña de Instantly |
| `qualification/reply-classifier.json` | Webhook Instantly | `POST /webhooks/instantly-reply` (`routers/webhooks.py`) — clasifica con Haiku, actualiza `stage`. El workflow original encadenaba a `vapi-call-scheduler.json`, que nunca existió; el reemplazo no encadena a nada inexistente |
| `proposals/call-brief-to-proposal.json` | Webhook Tally | `POST /outreach/generate-proposal` (`routers/outreach.py`) — Sonnet + contexto RAG de `proposal_library`. No exporta a Google Docs (necesitaría OAuth no configurado); guarda el texto en Supabase |
| `ops/telegram-alerts.json` | Genérico | `api/integrations/telegram.py` — función compartida, no un servicio aparte |

Integraciones nuevas en `api/integrations/`: `telegram.py` (alertas), `instantly.py` (envío de campañas — verificar el payload contra la API actual de Instantly antes de confiar en producción, ver comentario en el archivo). Ambas degradan con gracia (log + skip) si faltan las env vars, no rompen la request que las llama.

Setup pendiente (usuario): configurar `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`/`INSTANTLY_API_KEY`/`WEBHOOK_SECRET` en `.env` (ver `.env.example`), crear el Database Webhook en el dashboard de Supabase apuntando a `POST /webhooks/hot-lead`, y los secrets de GitHub para el cron diario.

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
- `mypy --strict` configurado (no bloqueante en CI todavía — ver nota de deuda preexistente arriba)
- Tests: `pytest` + `respx` para mock HTTP

---

## Reglas absolutas

- Todo workflow nuevo → runbook en `docs/runbooks/`
- Nuevo cliente → `sources.yaml` explícito (sin defaults implícitos)
- NUNCA bypass TOS LinkedIn/Crunchbase — solo Apify actors oficiales
