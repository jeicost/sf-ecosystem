# Quick Actions — Current State (MIRA Production)

## Overview

**Quick Actions** is MIRA's synchronous content generation system, deployed in production with 6 departments × 3 actions each (18 total). Each action triggers a single Claude Opus 4.1 call and writes results to Supabase for async polling by the UI.

### Request Flow

```
QuickActionButton.tsx (user clicks action)
  ↓
POST /api/quick-actions { action_type, clientId, ...formData }
  ↓
app/api/quick-actions/route.ts
  ├─ INSERT quick_actions_results { action_type, status:'processing', ... }
  ├─ Resolve prompt: getQuickActionPrompt(action_type, { clientId, inputData })
  ├─ Call Claude Opus 4.1 synchronously
  ├─ Extract JSON response
  ├─ UPDATE quick_actions_results { status:'completed', result_data:json, ... }
  └─ FIRE-AND-FORGET write to project_memory (same client_id)
  ↓
GET /api/quick-actions?action_id={id} (polling every 2s from UI)
  ↓
QuickActionResult.tsx displays status → result when ready
```

## Tables

### `quick_actions_results`
- `id` (uuid, PK)
- `client_id` (uuid, FK → clients)
- `action_type` (text, **NO CHECK constraint** — new types don't need migration)
- `status` (text: 'processing' | 'completed' | 'error')
- `input_data` (jsonb)
- `result_data` (jsonb)
- `error_message` (text, nullable)
- `created_at`, `updated_at` (timestamps)
- RLS: users can only read their own actions (by `client_id`)

### `project_memory`
- Async sink for all generated results (Quick Actions, Toolkit reports, agent conversations)
- Written via fire-and-forget `PUT /api/memory` after result is saved
- Consumed by agents via `fetchBrandBrain()` and formatted into prompts

## Current Action Types (by Department)

### Comercial (3 actions)
- `crear_estrategia_descubrimiento` → Discovery strategy JSON
- `generar_llamada_en_frio` → Cold call script
- `crear_propuesta_customizada` → Proposal outline

### Marketing (3 actions)
- `crear_estrategia_social` → Social media plan JSON
- `generar_post_twitter` → Tweet + hashtags
- `crear_carousel` → Carousel JSON with text per slide (image URLs **expected to exist**, no generation)

### Estrategia (3 actions)
- `crear_roadmap_estrategico` → Strategic roadmap JSON
- `analizar_competencia_rápida` → Competitive analysis
- `generar_core_values` → Core values framework

### Operaciones (3 actions)
- `crear_checklist_onboarding` → Onboarding checklist
- `optimizar_workflows` → Workflow optimization JSON
- `crear_plan_escalabilidad` → Scalability plan

### Finanzas (3 actions)
- `proyectar_ingresos` → Revenue projection JSON
- `optimizar_costos` → Cost optimization plan
- `crear_pitch_deck` → Pitch deck structure

### Innovación (1 action)
- `brainstorm_nuevos_productos` → Product ideas JSON

## Gaps (Not Blocking Production, Base for Track 4)

1. **Synchronous only** — All generations block the Vercel serverless function. Timeout risk for slow generations.
   - **Fix**: Track 4 adds async queue + webhook polling for new visual generation types.

2. **No retry logic** — If Claude fails mid-request, result row stays in `status:'processing'` forever.
   - **Fix**: Track 4 adds `max_retries` + exponential backoff.

3. **No image generation** — `crear_carousel` returns text-only JSON; image URLs in the response assume they already exist somewhere (no upstream generation).
   - **Fix**: Track 4 integration with Visual Production Agent provides actual image generation.

4. **No Storage for images** — No Supabase Storage bucket for generated assets yet.
   - **Fix**: Track 4 creates `generated-assets` bucket.

5. **No visual feedback/refinement** — Results cannot be refined or edited; new request = new generation.
   - **Fix**: Track 4 adds `visual_feedback` table + refinement conversational flow.

## Prompt Resolution

`lib/generation/quick-action-prompts.ts` contains a single `if (actionType === ...)` chain (no registry pattern). Each branch returns a static prompt string or function. **No client-specific personalization yet** — all prompts are generic, though agents do inject Brand Brain context.

**Decision point**: Should Quick Action prompts also reference Brand Brain before Claude? Currently only agents do (via `fetchBrandBrain()` in agent route). Recommend yes — add to Track 4 spec.

## Deployment Checklist

- ✅ 18 actions wired to UI
- ✅ RLS on `quick_actions_results` verified
- ✅ Polling UI (`QuickActionResult.tsx`) updates every 2s
- ⏳ No image generation backend (visual agent pending)
- ⏳ No async queue (Track 4)
- ⏳ No Supabase Storage (Track 4)

## Next Steps

- **Track 1 (now)**: Deploy MIRA with this state (Quick Actions fully functional, text-only)
- **Track 4.X-Z**: Add 3 new visual action types (`crear_post_visual`, `crear_carrusel_visual`, `editar_imagen_visual`) to department arrays
- **Track 4.AA-EE**: Async job model + storage + UI states
- **Track 4 Integration**: Swap mock provider for real Visual Production Agent when specification arrives (2-3 days)
