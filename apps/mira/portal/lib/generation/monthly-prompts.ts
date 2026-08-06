// Monthly Content System (F4) — prompts de las 3 llamadas secuenciales.
// El schema completo no cabe con calidad en una sola respuesta (con 8 pilares
// truncaba incluso partido en 2), así que se genera en 3 fases y se fusiona:
//   Fase 1 (estrategia): pilares (máx 6 activos) + funnel + tablero semanal +
//                        prioridades + aprendizajes del mes anterior
//   Fase 2 (producción): hero briefs + plantilla de brief + captions listas
//                        (shape GeneratedPost del engine)
//   Fase 3 (idea bank):  campañas + activaciones + influencers + comunidad +
//                        KPIs 30/60/90 + promo ratio
// El calendario del mes NO lo escribe el modelo: se computa en TS
// (monthly-calendar.ts) a partir de las captions y el mes real.

import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { REPORT_VOICE_CONTRACT } from '@/lib/grounding/report-voice-contract'

export interface MonthlyPromptParams {
  month: string // 'YYYY-MM'
  monthLabel: string // 'agosto 2026'
  postsPorPilar: number
  plataformas: string[]
  includeReels: boolean
  brainBlock: string
  pillarsBlock: string
  previousBoardBlock: string
  attachmentText?: string
  contextoAdicional?: string
  feedbackBlock?: string
}

function sharedContext(p: MonthlyPromptParams): string {
  return [
    p.brainBlock ? `BRAND CONTEXT (Source of Truth):\n${p.brainBlock}` : '',
    p.pillarsBlock,
    p.previousBoardBlock,
    p.attachmentText
      ? `USER ATTACHMENTS (primary source — use their actual content):\n${p.attachmentText}`
      : '',
    p.contextoAdicional ? `CONTEXT FOR THIS MONTH (from the user): ${p.contextoAdicional}` : '',
    p.feedbackBlock || '',
    GROUNDING_CONTRACT,
    REPORT_VOICE_CONTRACT,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n')
}

export function buildMonthlyStrategyPrompt(p: MonthlyPromptParams): string {
  return `You are the monthly content strategist for this brand. You produce PART 1 of the operating system for ${p.monthLabel}: the pillar system, the weekly board and the priorities. A working document the team executes — not a theory deck.

${sharedContext(p)}

RULES:
- Pillars: start from the registered pillars. Each one: status ALREADY_RUNNING (exists) or PROPOSED (new/evolved). ACTIVATE AT MOST 6 pillars this month — a focused month beats spray; every other registered pillar goes to dormant_note with its reason. If a registered pillar should rest this month, list it in dormant_note instead of forcing content into it.
- weekly_board: the month has 4-5 weeks — one entry per week, max 7 rows per pillar FOR THE WHOLE MONTH (not per week). Each row is a concrete piece with working title, not a placeholder.
- priority_board: exactly 7 pieces — the ones that move the needle if only 7 get made. Ordered.
- previous_month_learnings: ONLY from the previous board above (verdicts APPROVE/PASS + client notes). No board = empty array, never invented learnings.
- Write every prose field in English, unless the brand voice explicitly calls for another language.

Generate PART 1 JSON:
{
  "month": "${p.month}",
  "pillars": [
    {
      "name": "",
      "status": "ALREADY_RUNNING|PROPOSED",
      "promise": "what the audience gets every time this pillar publishes",
      "audience": "who it speaks to (from the brain)",
      "funnel_role": "tofu|mofu|bofu",
      "cadence": "e.g. 2x/week",
      "do": "the #1 rule of this pillar",
      "dont": "the mistake that kills this pillar",
      "idea_seeds": ["3-5 concrete content seeds"]
    }
  ],
  "dormant_note": "registered pillars resting this month and why (or empty)",
  "funnel_balance": {"tofu_pct": 0, "mofu_pct": 0, "bofu_pct": 0, "rationale": "why this split THIS month"},
  "weekly_board": [
    {"week": 1, "theme": "the thread of the week", "rows": [
      {"pillar": "", "format": "reel|carousel|photo|story|post", "platform": "instagram|linkedin|tiktok", "working_title": "concrete working title", "goal": "what it must achieve"}
    ]}
  ],
  "priority_board": [{"n": 1, "title": "", "pillar": "", "why_priority": ""}],
  "previous_month_learnings": [{"learning": "", "evidence": "APPROVE/PASS + concrete piece or note"}],
  "open_items": [{"n": 1, "item": "", "owner": "client|agency", "needed_for": ""}]
}`
}

export function buildMonthlyProductionPrompt(
  p: MonthlyPromptParams,
  strategyJson: string
): string {
  const reelNote = p.includeReels
    ? 'Instagram/TikTok posts marked as reel carry a reel_script with timecoded scenes.'
    : 'No reels this month — do not generate reel_script.'
  return `You are the monthly content producer for this brand. PART 1 (strategy) is already decided — you produce PART 2 for ${p.monthLabel}: hero briefs, ready-to-publish captions and the idea bank. Everything must execute the strategy below, not reinvent it.

PART 1 — STRATEGY ALREADY DECIDED (follow it):
${strategyJson}

${sharedContext(p)}

RULES:
- hero_briefs: exactly 3 — the month's hero pieces (from priority_board top). Timecoded shot flow: every shot with its time, framing, action and on-screen text. A small team must be able to shoot it just by reading the brief.
- captions: ${p.postsPorPilar} per ACTIVE pillar from PART 1 (max 18 captions in total — if the maths gives more, prioritize the priority_board pillars). Platforms: ${p.plataformas.join(', ')}. Ready to publish in the EXACT brand voice (we-say / we-never-say vocabulary). ${reelNote} Every caption carries pillar_name (from PART 1) and suggested_day (1-28, spread across the month, consistent with weekly_board).
- full_brief_template: the 9 fields of a reusable brief; the 9th is ALWAYS the inspired-by guardrail (references = structure, never a copy).
- Write every prose field in English, unless the brand voice explicitly calls for another language.

Generate PART 2 JSON:
{
  "hero_briefs": [
    {
      "title": "", "pillar": "", "platform": "", "objective": "",
      "hook": "first line/shot that stops the scroll",
      "shot_flow": [{"time": "0-3s", "shot": "framing", "action": "what happens", "text_overlay": ""}],
      "cta": "", "success_metric": "how we will know it worked"
    }
  ],
  "full_brief_template": [
    {"n": 1, "field": "", "instruction": ""}
  ],
  "captions": [
    {
      "pillar_name": "", "platform": "instagram|linkedin|tiktok", "suggested_day": 1,
      "hook": "", "copy": "full body ready to publish", "caption": "short caption (max 300 chars)",
      "hashtags": ["#"], "cta": "", "visual_direction": "",
      "reel_script": {"duration": "30s", "scenes": [{"time": "0-3s", "action": "", "text_overlay": ""}]}
    }
  ],
  "open_items": [{"n": 1, "item": "", "owner": "client|agency", "needed_for": ""}]
}`
}

// Fase 3 — idea bank: material para los meses siguientes. Va en llamada propia
// (la fase 2 con briefs+captions ya llena su presupuesto; truncaba en 12k con
// clientes de 8 pilares — hallazgo del primer build real con Salsa).
export function buildMonthlyIdeaBankPrompt(
  p: MonthlyPromptParams,
  strategyJson: string
): string {
  return `You are the monthly content strategist for this brand. PARTS 1-2 are done — you produce PART 6 for ${p.monthLabel}: the idea bank and the promo ratio. Material for the NEXT months, grounded in THIS brand.

PART 1 — STRATEGY ALREADY DECIDED (context):
${strategyJson}

${sharedContext(p)}

RULES:
- idea_bank: campaign concepts (absorbs the old campaign generator), activation playbook, a 3-tier influencer system and a community engine (absorbs the old community growth), all grounded in THIS brand — nothing generic.
- kpis_30_60_90: only metrics measurable with what the brand has today (brain/channels). No tools that do not exist.
- Write every prose field in English, unless the brand voice explicitly calls for another language.

Generate PART 6 JSON:
{
  "promo_ratio": {"content_pct": 0, "promo_pct": 0, "rule": "the month's content/promo mix rule and why"},
  "idea_bank": {
    "campaign_concepts": [{"name": "", "concept": "", "pillar": "", "when": "ideal moment of the year"}],
    "activation_playbook": [{"play": "", "how": "", "cost": "zero|low|medium"}],
    "influencer_system": {"tiers": [{"tier": "nano|micro|mid", "who": "concrete profile for this brand", "deal": "what is offered", "content": "what they create"}], "rule": ""},
    "community_engine": [{"ritual": "", "cadence": "", "why": ""}],
    "kpis_30_60_90": {"d30": [""], "d60": [""], "d90": [""]},
    "dormant_pillars": ["parked ideas with potential"]
  },
  "open_items": [{"n": 1, "item": "", "owner": "client|agency", "needed_for": ""}]
}`
}
