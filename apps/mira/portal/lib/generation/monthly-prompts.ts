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
      ? `ARCHIVOS ADJUNTOS DEL USUARIO (fuente primaria — usa su contenido real):\n${p.attachmentText}`
      : '',
    p.contextoAdicional ? `CONTEXTO DEL MES (del usuario): ${p.contextoAdicional}` : '',
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
- weekly_board: the month has 4-5 weeks — one entry per week, máx 7 filas por pilar EN TODO EL MES (no per week). Each row is a concrete piece with working title, not a placeholder.
- priority_board: exactly 7 pieces — the ones that move the needle if only 7 get made. Ordered.
- previous_month_learnings: ONLY from the previous board above (verdicts APPROVE/PASS + client notes). No board = empty array, never invented learnings.
- Todo en español (salvo que la voz de la marca indique otra cosa).

Generate PART 1 JSON:
{
  "month": "${p.month}",
  "pillars": [
    {
      "name": "",
      "status": "ALREADY_RUNNING|PROPOSED",
      "promise": "qué recibe la audiencia cada vez que este pilar publica",
      "audience": "a quién le habla (del brain)",
      "funnel_role": "tofu|mofu|bofu",
      "cadence": "p.ej. 2x/semana",
      "do": "la regla nº1 de este pilar",
      "dont": "el error que mata este pilar",
      "idea_seeds": ["3-5 semillas de contenido concretas"]
    }
  ],
  "dormant_note": "pilares registrados que este mes descansan y por qué (o vacío)",
  "funnel_balance": {"tofu_pct": 0, "mofu_pct": 0, "bofu_pct": 0, "rationale": "por qué este reparto ESTE mes"},
  "weekly_board": [
    {"week": 1, "theme": "hilo de la semana", "rows": [
      {"pillar": "", "format": "reel|carrusel|foto|story|post", "platform": "instagram|linkedin|tiktok", "working_title": "título de trabajo concreto", "goal": "qué debe conseguir"}
    ]}
  ],
  "priority_board": [{"n": 1, "title": "", "pillar": "", "why_priority": ""}],
  "previous_month_learnings": [{"learning": "", "evidence": "APPROVE/PASS + pieza o nota concreta"}],
  "open_items": [{"n": 1, "item": "", "owner": "cliente|agencia", "needed_for": ""}]
}`
}

export function buildMonthlyProductionPrompt(
  p: MonthlyPromptParams,
  strategyJson: string
): string {
  const reelNote = p.includeReels
    ? 'Los posts de instagram/tiktok marcados como reel llevan reel_script con escenas timecodeadas.'
    : 'Sin reels este mes — no generes reel_script.'
  return `You are the monthly content producer for this brand. PART 1 (strategy) is already decided — you produce PART 2 for ${p.monthLabel}: hero briefs, ready-to-publish captions and the idea bank. Everything must execute the strategy below, not reinvent it.

PART 1 — ESTRATEGIA YA DECIDIDA (síguela):
${strategyJson}

${sharedContext(p)}

RULES:
- hero_briefs: exactly 3 — the month's hero pieces (from priority_board top). Shot flow timecodeado: cada plano con tiempo, encuadre, acción y texto en pantalla. Un equipo pequeño debe poder grabarlo leyendo el brief.
- captions: ${p.postsPorPilar} por pilar ACTIVO de PART 1 (máximo 18 captions en total — si el cálculo da más, prioriza los pilares del priority_board). Plataformas: ${p.plataformas.join(', ')}. Listas para publicar en la voz EXACTA de la marca (vocabulario decimos/nunca decimos). ${reelNote} Cada caption lleva pillar_name (de PART 1) y suggested_day (1-28, repartidos por el mes, coherentes con weekly_board).
- full_brief_template: los 9 campos de un brief reutilizable; el 9º es SIEMPRE el guardrail inspired-by (referencias = estructura, nunca copia).
- Todo en español (salvo que la voz de la marca indique otra cosa).

Generate PART 2 JSON:
{
  "hero_briefs": [
    {
      "title": "", "pillar": "", "platform": "", "objective": "",
      "hook": "primera frase/plano que detiene el scroll",
      "shot_flow": [{"time": "0-3s", "shot": "encuadre", "action": "qué pasa", "text_overlay": ""}],
      "cta": "", "success_metric": "cómo sabremos que funcionó"
    }
  ],
  "full_brief_template": [
    {"n": 1, "field": "", "instruction": ""}
  ],
  "captions": [
    {
      "pillar_name": "", "platform": "instagram|linkedin|tiktok", "suggested_day": 1,
      "hook": "", "copy": "cuerpo completo listo para publicar", "caption": "caption corta (máx 300 chars)",
      "hashtags": ["#"], "cta": "", "visual_direction": "",
      "reel_script": {"duration": "30s", "scenes": [{"time": "0-3s", "action": "", "text_overlay": ""}]}
    }
  ],
  "open_items": [{"n": 1, "item": "", "owner": "cliente|agencia", "needed_for": ""}]
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

PART 1 — ESTRATEGIA YA DECIDIDA (contexto):
${strategyJson}

${sharedContext(p)}

RULES:
- idea_bank: conceptos de campaña (absorbe el antiguo campaign generator), playbook de activación, sistema de influencers en 3 tiers y motor de comunidad (absorbe el antiguo community growth), todo aterrizado a ESTA marca — nada genérico.
- kpis_30_60_90: solo métricas medibles con lo que la marca tiene hoy (brain/canales). Sin herramientas que no existen.
- Todo en español (salvo que la voz de la marca indique otra cosa).

Generate PART 6 JSON:
{
  "promo_ratio": {"content_pct": 0, "promo_pct": 0, "rule": "la regla de mezcla del mes y por qué"},
  "idea_bank": {
    "campaign_concepts": [{"name": "", "concept": "", "pillar": "", "when": "momento ideal del año"}],
    "activation_playbook": [{"play": "", "how": "", "cost": "0€|bajo|medio"}],
    "influencer_system": {"tiers": [{"tier": "nano|micro|medio", "who": "perfil concreto para esta marca", "deal": "qué se ofrece", "content": "qué crean"}], "rule": ""},
    "community_engine": [{"ritual": "", "cadence": "", "why": ""}],
    "kpis_30_60_90": {"d30": [""], "d60": [""], "d90": [""]},
    "dormant_pillars": ["ideas aparcadas con potencial"]
  },
  "open_items": [{"n": 1, "item": "", "owner": "cliente|agencia", "needed_for": ""}]
}`
}
