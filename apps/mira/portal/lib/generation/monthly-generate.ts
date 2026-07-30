// Monthly Content System — orquestación de las 2 llamadas (F4).
// El route de generate delega aquí cuando tool_slug === 'monthly-content-system':
// contexto operativo → fase 1 estrategia → fase 2 producción → merge +
// calendario computado en TS. Lanza Error con mensaje legible si algo falla
// (el route lo persiste en error_message).

import { generateWithWebSearch } from '@/lib/grounding/web-research'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { getDocumentFeedbackBlock } from '@/lib/generation/toolkit-prompts'
import {
  buildMonthlyStrategyPrompt,
  buildMonthlyProductionPrompt,
  buildMonthlyIdeaBankPrompt,
  type MonthlyPromptParams,
} from '@/lib/generation/monthly-prompts'
import { getMonthlyOperatingContext } from '@/lib/business-reports/monthly-context'
import { computeCalendarEntries } from '@/lib/business-reports/monthly-calendar'

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function monthLabel(month: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return month
  return `${MONTH_NAMES[Number(m[2]) - 1] ?? month} ${m[1]}`
}

async function callAndParse(
  clientId: string,
  prompt: string,
  maxTokens: number,
  imageBlocks: any[],
  phase: string
): Promise<Record<string, any>> {
  // web_search disponible como tool -- Claude decide si la necesita (huecos
  // de tendencias/datos del sector que ni el brand brain ni la memoria
  // tienen), no una búsqueda forzada. maxToolLoops=2 (no el default 3): son
  // 3 fases secuenciales dentro de maxDuration=800, conviene no arriesgar el
  // presupuesto de tiempo por fase. Ver lib/grounding/web-research.ts.
  const { message, text } = await generateWithWebSearch({
    clientId,
    route: 'toolkit/generate',
    model: 'claude-opus-4-8',
    maxTokens,
    userContent: imageBlocks.length
      ? [...imageBlocks, { type: 'text' as const, text: prompt }]
      : prompt,
    maxToolLoops: 2,
  })
  if (message.stop_reason === 'max_tokens') {
    throw new Error(`Monthly ${phase}: respuesta truncada en max_tokens`)
  }
  try {
    const parsed = extractJson(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ExtractJsonError('Model output is not a JSON object', text)
    }
    return parsed as Record<string, any>
  } catch (err) {
    throw new Error(
      `Monthly ${phase}: no se pudo extraer JSON — ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

export async function generateMonthlySystem(params: {
  clientId: string
  inputData: Record<string, any>
  attachmentText?: string
  attachmentImageBlocks: any[]
}): Promise<Record<string, unknown>> {
  const { clientId, inputData, attachmentText, attachmentImageBlocks } = params

  const month =
    typeof inputData.mes === 'string' && /^\d{4}-\d{2}$/.test(inputData.mes)
      ? inputData.mes
      : new Date().toISOString().slice(0, 7)

  const plataformas = (Array.isArray(inputData.plataformas) ? inputData.plataformas : ['instagram'])
    .map((p: unknown) => String(p).toLowerCase())
    .filter(Boolean)

  const [brain, ctx, feedbackBlock] = await Promise.all([
    fetchBrandBrain(clientId),
    getMonthlyOperatingContext(clientId, month),
    getDocumentFeedbackBlock(clientId, 'monthly-content-system'),
  ])

  const promptParams: MonthlyPromptParams = {
    month,
    monthLabel: monthLabel(month),
    postsPorPilar: Math.min(Math.max(Number(inputData.posts_por_pilar) || 4, 1), 5),
    plataformas: plataformas.length ? plataformas : ['instagram'],
    includeReels: inputData.include_reels !== 'no',
    brainBlock: brain ? formatBrandBrainForPrompt(brain) : '',
    pillarsBlock: ctx.pillarsBlock,
    previousBoardBlock: ctx.previousBoardBlock,
    ...(attachmentText ? { attachmentText } : {}),
    ...(typeof inputData.contexto_adicional === 'string' && inputData.contexto_adicional.trim()
      ? { contextoAdicional: inputData.contexto_adicional.trim() }
      : {}),
    ...(feedbackBlock ? { feedbackBlock } : {}),
  }

  // Fase 1 — estrategia (los adjuntos de imagen entran aquí: moodboards, refs)
  const strategy = await callAndParse(
    clientId,
    buildMonthlyStrategyPrompt(promptParams),
    9000,
    attachmentImageBlocks,
    'fase 1 (estrategia)'
  )

  // Fase 2 — producción, con la estrategia ya decidida como contrato.
  // 14k: con 8 pilares registrados la fase truncaba en 12k (build real Salsa).
  const strategyJson = JSON.stringify(strategy, null, 1)
  const production = await callAndParse(
    clientId,
    buildMonthlyProductionPrompt(promptParams, strategyJson),
    14000,
    [],
    'fase 2 (producción)'
  )

  // Fase 3 — idea bank en llamada propia (no compite con briefs+captions)
  const ideaBank = await callAndParse(
    clientId,
    buildMonthlyIdeaBankPrompt(promptParams, strategyJson),
    6000,
    [],
    'fase 3 (idea bank)'
  )

  // Merge + open items renumerados + calendario determinista
  const openItems = [
    ...(Array.isArray(strategy.open_items) ? strategy.open_items : []),
    ...(Array.isArray(production.open_items) ? production.open_items : []),
    ...(Array.isArray(ideaBank.open_items) ? ideaBank.open_items : []),
  ].map((o, i) => ({ ...(o && typeof o === 'object' ? o : { item: String(o) }), n: i + 1 }))

  const captions = Array.isArray(production.captions) ? production.captions : []
  const heroTitles = (Array.isArray(production.hero_briefs) ? production.hero_briefs : [])
    .map((h: any) => String(h?.hook || h?.title || ''))
    .filter(Boolean)

  const { open_items: _s, ...strategyRest } = strategy
  const { open_items: _p, ...productionRest } = production
  const { open_items: _i, ...ideaBankRest } = ideaBank

  return {
    ...strategyRest,
    ...productionRest,
    ...ideaBankRest,
    month,
    month_label: monthLabel(month),
    open_items: openItems,
    calendar_entries: computeCalendarEntries(month, captions, heroTitles),
    previous_month_stats: ctx.previousStats,
    generated_with: { phases: 3, calendar: 'computed' },
  }
}
