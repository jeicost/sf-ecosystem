# Data Flow — SF Sales Engine

## Principio fundamental
Python escribe en Supabase → n8n lee de Supabase. Sin llamadas directas entre capas.

## Flujo completo

```
Cron (6am UTC)
  └─ n8n: discovery-trigger.json
       └─ POST /discovery/run (FastAPI)
            └─ Arq: discovery_run job
                 ├─ scrapers/apollo.py → RawLead[]
                 ├─ scrapers/apify_linkedin.py → enriquece
                 ├─ enrichment/core.py → EnrichedLead[]
                 ├─ scoring/lead_scorer.py → LeadScore[]
                 └─ Supabase: INSERT leads + prospect_context
                      └─ Realtime trigger (hot_score ≥ 75)
                           └─ n8n: hot-lead-alert.json
                                ├─ Telegram alert
                                └─ icebreaker-generator.json
                                     ├─ Fetch Commercial Brain (Supabase)
                                     ├─ Claude Sonnet: icebreaker
                                     └─ Human review (Telegram)
                                          └─ APROBADO
                                               └─ instantly-campaign-launcher.json
                                                    ├─ Send via Instantly
                                                    ├─ INSERT outbound_log
                                                    └─ UPDATE leads.stage = 'contacted'

Webhook: Instantly reply received
  └─ n8n: reply-classifier.json
       ├─ Claude Haiku: classify reply
       ├─ UPDATE leads.stage
       └─ hot? → vapi-call-scheduler.json
                  └─ Schedule Vapi call + Google Calendar

Webhook: Call brief submitted
  └─ n8n: call-brief-to-proposal.json
       ├─ Fetch proposal_library (RAG)
       ├─ Claude Sonnet: generate proposal
       └─ Create Google Doc + notify Telegram
```
