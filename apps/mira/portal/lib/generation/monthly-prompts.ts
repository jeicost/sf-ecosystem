// Monthly Content System (F4) — prompts de las 3 llamadas secuenciales.
// El schema completo no cabe con calidad en una sola respuesta (con 8 pilares
// truncaba incluso partido en 2), así que se genera en 3 fases y se fusiona:
//   Fase 1 (estrategia): pilares + funnel + tablero semanal + prioridades +
//                        aprendizajes del mes anterior
//   Fase 2 (producción): hero briefs + plantilla de brief + captions listas
//                        (shape GeneratedPost del engine)
//   Fase 3 (idea bank):  campañas + activaciones + influencers + comunidad +
//                        KPIs 30/60/90 + promo ratio
// El calendario del mes NO lo escribe el modelo: se computa en TS
// (monthly-calendar.ts) a partir de las captions y el mes real.
//
// Los bloques METHOD son del 31-ago-2026. El informe de julio de Salsa
// (generation_queue d7c8e889) salió con 10/18 captions con [COMPLETAR:],
// 0 caracteres thai pese al «every caption carries at least one Thai line —
// non-negotiable» del Brand Brain, y registro rioplatense («Deslizá»,
// «Contanos») en una marca EN+TH. En el resto de herramientas está medido que
// el METHOD fue la palanca grande (informes al 38-45% subieron a 91-100% al
// añadirlo); el monthly era la única herramienta de alto valor sin él.
// También del 31-ago: cae el tope de «máx 6 pilares activos» — el sistema
// real de Salsa (el deck que la agencia entrega a mano) opera 9 pilares; el
// número de activos es un juicio que se declara, no una cuota.

import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { REPORT_VOICE_CONTRACT } from '@/lib/grounding/report-voice-contract'
import { JUDGMENT_CONTRACT } from '@/lib/grounding/judgment-contract'

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
  /** Few-shot: piezas que el cliente aprobó sin editar (Pilar 2.2). */
  approvedExamplesBlock?: string
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
    p.approvedExamplesBlock || '',
    p.feedbackBlock || '',
    GROUNDING_CONTRACT,
    JUDGMENT_CONTRACT,
    REPORT_VOICE_CONTRACT,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n')
}

// Los valores válidos de "platform" son las plataformas que el usuario
// seleccionó — el schema hardcodeaba "instagram|linkedin|tiktok" y Salsa usa
// facebook y tiktok, jamás linkedin (su Brain lo veta explícitamente).
function platformEnum(p: MonthlyPromptParams): string {
  return p.plataformas.join('|')
}

export function buildMonthlyStrategyPrompt(p: MonthlyPromptParams): string {
  return `You are the monthly content strategist for this brand. You produce PART 1 of the operating system for ${p.monthLabel}: the pillar system, the weekly board and the priorities. A working document the team executes — not a theory deck.

${sharedContext(p)}

METHOD — work through these steps in order. The order is the value: a board assembled section by section reads like a template.

STEP 1 — LANGUAGE RULES FIRST. Read the language rules in the BRAND CONTEXT
(the Languages section, per-channel rules, any voice or QA rule about
language) before deciding anything else. They govern every piece of
audience-facing copy in this system — not your default, and not the language
this prompt happens to be written in. This strategy document itself is a
working document for the team: write its prose in English unless the brand
context says the team works in another language. Never introduce a dialect
register the brand does not use: if the declared tone shows no voseo or
regional slang, neither do you — in any language.

STEP 2 — PILLAR COUNT IS A JUDGMENT, NOT A QUOTA. Start from the REGISTERED
pillars and respect them. There is no fixed cap on active pillars: a brand
operating 9 healthy pillars runs 9; a brand with 3 weak ones must not be
inflated to 6. Decide how many run THIS month and defend the number in
active_pillar_judgment. Every resting pillar gets its own reason in
dormant_note — "resting" without a reason is a dodge. Status honesty:
ALREADY_RUNNING only when the context gives evidence the pillar actually
runs; anything you invented or evolved is PROPOSED. Presenting a proposal as
established practice is the fastest way to lose the client's trust in the
whole document.

STEP 3 — THE BRAIN'S SCAR TISSUE IS DECISION MATERIAL. what_flopped,
open_questions, the voice golden rule and the banned phrases are constraints
that must visibly shape the board — not decoration to paraphrase back. If a
pillar's natural format is something that already flopped, say how this month
avoids the same death. If an open question blocks a call, the call goes to
open_items with an owner — it does not get made silently.

STEP 4 — FUNNEL AND PROMO ARE THIS-MONTH CALLS. funnel_balance is a judgment
about THIS month with its reasoning stated ("why this split now"), never a
default 60/30/10. Promotional pressure obeys the 1:3 rule: at most ~1 clearly
promotional piece per week — promotional over-posting kills organic reach.
The weekly_board must respect both.

STEP 5 — THE BOARD IS CONCRETE OR IT IS NOTHING. Every weekly_board row is a
piece someone could start producing tomorrow: a working title with the actual
subject in it, not "post about our values". Platforms come only from the list
the user selected — never schedule a platform the brand does not operate.

STEP 6 — PRIORITY IS A BET. priority_board answers "if only 7 pieces get made
this month, which 7 and why THESE" — an ordered bet where each why names what
the piece moves. Seven pieces that all "build awareness" is a board nobody
thought about.

STEP 7 — LEAVE PART 2 A SOLVABLE JOB. Part 2 writes at most 18
ready-to-publish captions. If active pillars × posts per pillar exceeds 18,
set cadences so the coverage decision is obvious (which pillars publish
captions weekly, which live on a hero piece or a biweekly slot). Part 2 will
declare the final distribution — your cadences must make it defensible.

RULES:
- Pillars: start from the registered pillars. Each one: status ALREADY_RUNNING (exists) or PROPOSED (new/evolved). The number of ACTIVE pillars is your declared judgment (METHOD STEP 2); every registered pillar that rests this month goes to dormant_note with its reason.
- weekly_board: the month has 4-5 weeks — one entry per week, max 7 rows per pillar FOR THE WHOLE MONTH (not per week). Each row is a concrete piece with working title, not a placeholder.
- priority_board: exactly 7 pieces — the ones that move the needle if only 7 get made. Ordered.
- previous_month_learnings: ONLY from the previous board above (verdicts APPROVE/PASS + client notes). No board = empty array, never invented learnings.
- Language: METHOD STEP 1 — working-document prose in English unless the brand context says otherwise; anything audience-facing follows the brand's language rules.

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
  "active_pillar_judgment": "[JUDGEMENT] how many pillars run this month and why exactly that number for THIS brand",
  "dormant_note": "registered pillars resting this month, each with its reason (or empty)",
  "funnel_balance": {"tofu_pct": 0, "mofu_pct": 0, "bofu_pct": 0, "rationale": "why this split THIS month"},
  "weekly_board": [
    {"week": 1, "theme": "the thread of the week", "rows": [
      {"pillar": "", "format": "reel|carousel|photo|story|post", "platform": "${platformEnum(p)}", "working_title": "concrete working title", "goal": "what it must achieve"}
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
    ? 'Posts marked as reel carry a reel_script with timecoded scenes.'
    : 'No reels this month — do not generate reel_script.'
  return `You are the monthly content producer for this brand. PART 1 (strategy) is already decided — you produce PART 2 for ${p.monthLabel}: hero briefs, ready-to-publish captions and the reusable brief template. Everything must execute the strategy below, not reinvent it.

PART 1 — STRATEGY ALREADY DECIDED (follow it):
${strategyJson}

${sharedContext(p)}

METHOD — work through these steps in order.

STEP 1 — LANGUAGE IS A CONTRACT, NOT A DEFAULT. Before writing a single
caption, read the language rules in the BRAND CONTEXT (Languages section,
per-channel rules, any voice or QA rule about language). They dictate the
language of every caption — not your default, and not the language of this
prompt. If the brand requires a line in another language in every piece
(e.g. a Thai line in every caption), that line appears IN the caption text,
actually written in that language — "[add Thai line here]" is a failed
deliverable. So is copy whose register drifts into a dialect the brand never
uses (voseo, regional slang) when the declared tone shows none. Record what
you actually wrote in each caption's "language" field (e.g. "en+th").

STEP 2 — PUBLISHABLE OR NOT DELIVERED. Publishable means the client can
copy-paste the caption today without touching it. Any bracketed blank —
"[COMPLETAR: …]", "[INSERT …]", "___", "add X here" — makes the whole report
a failure. When a piece depends on a choice nobody has made (this month's
featured product, guest, track), there are exactly two honest moves: MAKE
the choice from the brand context and label it [JUDGEMENT] in
visual_direction, or send the piece to open_items with an owner and exactly
what is needed — and write a different, completable caption in its place.
Never ship the blank.

STEP 3 — CRAFT HIERARCHY. Every piece obeys the craft rules of the
hand-built decks this system replaces:
- The hook lands in the first 1.5 seconds of a video or the first line of
  copy. A hook that needs context to work is not a hook.
- The product is the visual hero. visual_direction says what the camera
  sees, and what it sees is the product doing something — not a mood.
- Promo pressure 1:3: at most ~1 clearly promotional caption per week —
  promotional over-posting kills organic reach. You classify every caption
  yourself in is_promo (a JUDGEMENT, never dodged), and you schedule so no
  two is_promo pieces land on adjacent suggested_days. The actual ratio and
  adjacency are computed downstream FROM YOUR MARKS — the arithmetic cannot
  be dodged, only the classification can be wrong.
- 3-5 hashtags in the caption; the rest go to first_comment_hashtags.
- suggested_day follows the weekly_board cadence: a pillar slotted for
  week 3 does not get all its captions on days 2-6.

STEP 4 — HERO BRIEFS ARE SHOOTABLE. A small team must be able to shoot each
hero brief WITHOUT asking a single question: every shot with its time range,
framing, action and on-screen text, in order. "B-roll of the kitchen" is not
a shot; "0-3s close-up, sauce hits the patty, overlay: <the actual overlay
text>" is.

STEP 5 — DECLARE THE CAPTION COVERAGE. With the active pillars from PART 1
and ${p.postsPorPilar} posts per pillar the maths can exceed the 18-caption
cap. That is a decision, not an accident: priority_board pillars are covered
first, and the real distribution goes in caption_allocation.distribution.
Every ACTIVE pillar with no caption this month appears in
caption_allocation.not_covered with the reason it is still served (a hero
brief covers it, biweekly cadence, next month's rotation). Nothing is left
implicit.

STEP 6 — HONESTY CARRIES OVER. A pillar the strategy marked PROPOSED stays
proposed: its captions must not pretend a ritual or series already exists.
The 9th field of full_brief_template is ALWAYS the inspired-by guardrail:
references give structure, never copy.

STEP 7 — OPEN ITEMS ARE FOR MISSING INFORMATION, NOT FOR YOUR JOB. An
open_item exists because something is genuinely missing — an asset, an
approval, a file, a fact only the client knows. An editorial judgment you
can make from the context (does this piece count as promo? does the series
respect the promo cadence? which product features this week?) is YOUR call:
make it, label it [JUDGEMENT], and move on. Sending the client a decision
you were hired to take is a dodge, and so is listing the same item twice
with different words. Before finishing, deduplicate your open_items.

RULES:
- hero_briefs: exactly 3 — the month's hero pieces (from priority_board top). Timecoded shot flow per METHOD STEP 4.
- captions: up to ${p.postsPorPilar} per ACTIVE pillar from PART 1, max 18 in total — the distribution is YOUR declared decision (METHOD STEP 5). Platforms: ${p.plataformas.join(', ')} — only these. Ready to publish in the EXACT brand voice (we-say / we-never-say vocabulary) and in the language(s) the brand context dictates (METHOD STEP 1). ${reelNote} Every caption carries pillar_name (from PART 1) and suggested_day (1-28, spread across the month, consistent with weekly_board).
- full_brief_template: the 9 fields of a reusable brief; the 9th is ALWAYS the inspired-by guardrail (references = structure, never a copy).
- Working-document prose (objectives, instructions, visual directions) in English unless the brand context says otherwise; caption copy ALWAYS per the brand's language rules.

Generate PART 2 JSON:
{
  "hero_briefs": [
    {
      "title": "", "pillar": "", "platform": "one of: ${p.plataformas.join(', ')}", "objective": "",
      "hook": "first line/shot that stops the scroll",
      "shot_flow": [{"time": "0-3s", "shot": "framing", "action": "what happens", "text_overlay": "the actual on-screen text, in the language the brand rules dictate"}],
      "cta": "", "success_metric": "how we will know it worked"
    }
  ],
  "full_brief_template": [
    {"n": 1, "field": "", "instruction": ""}
  ],
  "captions": [
    {
      "pillar_name": "", "platform": "${platformEnum(p)}", "suggested_day": 1,
      "language": "language(s) actually written, per the brand's rules — e.g. 'en' or 'en+th'",
      "is_promo": false,
      "is_promo_rationale": "[JUDGEMENT] one line: why this piece is (or is not) clearly promotional — price-led, discount, offer or launch push vs content. Decide for EVERY caption; the promo ratio is computed from this field, so a dodge here is a dodge on the ratio.",
      "hook": "", "copy": "full body ready to publish — copy-paste publishable, zero blanks", "caption": "short caption (max 300 chars)",
      "hashtags": ["#", "3-5 max in the caption"], "first_comment_hashtags": ["#", "the rest go here"],
      "cta": "", "visual_direction": "",
      "reel_script": {"duration": "30s", "scenes": [{"time": "0-3s", "action": "", "text_overlay": ""}]}
    }
  ],
  "caption_allocation": {
    "distribution": [{"pillar": "", "captions": 0, "why": ""}],
    "not_covered": [{"pillar": "", "why": "how this ACTIVE pillar is still served this month"}]
  },
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

METHOD:

1. GROUNDED OR CUT. Every campaign concept, activation and ritual names
   something of THIS brand — a pillar, a product, a place, an audience
   segment from the context. If a play could appear unchanged in another
   brand's idea bank, it is filler: cut it and deliver fewer, better.

2. PROMO RATIO IS THE MONTH'S JUDGMENT — AND THE ARITHMETIC IS NOT YOURS TO
   SKIP. content_pct/promo_pct is a call about THIS brand THIS month,
   consistent with the 1:3 promo rule and with funnel_balance from PART 1.
   "rule" states why this mix now — never a default 80/20. The REAL ratio is
   computed downstream from the per-caption is_promo marks of PART 2, so do
   not hedge the number or defer it to an open_item: commit to the target
   mix and let the computed figure confront it. You cannot see the final
   caption list from here — never state a count of promo pieces or claim
   the plan "sits inside" the ceiling (the sept-2026 draft claimed «4 promos
   = 25%» while PART 2 had marked 5 = 31%): state the target and the rule;
   the counting happens downstream.

3. IDEAS THE BRAND CAN ACTUALLY EXECUTE. Activations sized to the team and
   money visible in the context. Influencer tiers sized to the brand's real
   pull — a neighbourhood brand does not open with mid-tier trades — and
   "who" names a profile type findable in this brand's actual city/scene.

4. KPIs ONLY WITH TODAY'S INSTRUMENTS. kpis_30_60_90 contains only metrics
   measurable with what the brand demonstrably has (platform insights,
   channels named in the context). A KPI that needs a tool nobody has is an
   open_item, not a KPI.

5. SAME LANGUAGE AND PUBLISHABILITY CONTRACT AS PART 2. Prose in English as
   a working document unless the brand context says otherwise; any sample
   copy inside an idea follows the brand's caption language rules; zero
   bracketed blanks — an idea that cannot be specified with the available
   information goes to open_items with an owner.

RULES:
- idea_bank: campaign concepts (absorbs the old campaign generator), activation playbook, a 3-tier influencer system and a community engine (absorbs the old community growth), all grounded in THIS brand — nothing generic.
- kpis_30_60_90: only metrics measurable with what the brand has today (brain/channels). No tools that do not exist.

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
