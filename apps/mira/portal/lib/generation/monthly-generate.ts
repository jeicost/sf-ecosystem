// Monthly Content System — orquestación de las 2 llamadas (F4).
// El route de generate delega aquí cuando tool_slug === 'monthly-content-system':
// contexto operativo → fase 1 estrategia → fase 2 producción → merge +
// calendario computado en TS. Lanza Error con mensaje legible si algo falla
// (el route lo persiste en error_message).

import { createMessageForClient } from '@/lib/anthropic-client'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { getDocumentFeedbackBlock } from '@/lib/generation/toolkit-prompts'
import {
  buildMonthlyStrategyPrompt,
  buildMonthlyProductionPrompt,
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
  const message = await createMessageForClient(clientId, 'toolkit/generate', {
    model: 'claude-opus-4-8',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: imageBlocks.length
          ? [...imageBlocks, { type: 'text' as const, text: prompt }]
          : prompt,
      },
    ],
  })
  if (message.stop_reason === 'max_tokens') {
    throw new Error(`Monthly ${phase}: respuesta truncada en max_tokens`)
  }
  const text = message.content
    .map((b: any) => ('text' in b ? b.text : ''))
    .filter(Boolean)
    .join('\n')
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

  // Fase 2 — producción, con la estrategia ya decidida como contrato
  const production = await callAndParse(
    clientId,
    buildMonthlyProductionPrompt(promptParams, JSON.stringify(strategy, null, 1)),
    12000,
    [],
    'fase 2 (producción)'
  )

  // Merge + open items renumerados + calendario determinista
  const openItems = [
    ...(Array.isArray(strategy.open_items) ? strategy.open_items : []),
    ...(Array.isArray(production.open_items) ? production.open_items : []),
  ].map((o, i) => ({ ...(o && typeof o === 'object' ? o : { item: String(o) }), n: i + 1 }))

  const captions = Array.isArray(production.captions) ? production.captions : []
  const heroTitles = (Array.isArray(production.hero_briefs) ? production.hero_briefs : [])
    .map((h: any) => String(h?.hook || h?.title || ''))
    .filter(Boolean)

  const { open_items: _s, ...strategyRest } = strategy
  const { open_items: _p, ...productionRest } = production

  return {
    ...strategyRest,
    ...productionRest,
    month,
    month_label: monthLabel(month),
    open_items: openItems,
    calendar_entries: computeCalendarEntries(month, captions, heroTitles),
    previous_month_stats: ctx.previousStats,
    generated_with: { phases: 2, calendar: 'computed' },
  }
}
