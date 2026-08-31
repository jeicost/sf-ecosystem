// Monthly Content System — orquestación de las 3 fases (F4).
// El route de generate delega aquí cuando tool_slug === 'monthly-content-system':
// contexto operativo → fase 1 estrategia → fase 2 producción → crítica de la
// fase 2 (en paralelo con la fase 3 idea bank) → merge + calendario computado
// en TS. Lanza Error con mensaje legible si algo falla (el route lo persiste
// en error_message).
//
// La crítica (31-ago-2026, punto 2.4 del plan de excelencia) va SOLO sobre la
// fase 2: es donde vive lo que el cliente ve (captions y briefs) y el
// presupuesto es maxDuration=800 con 3 llamadas ya en vuelo. El informe de
// julio de Salsa (d7c8e889) salió con 10/18 captions con [COMPLETAR:],
// 0 caracteres thai pese al «non-negotiable» del Brain y registro
// rioplatense — nadie lo releyó antes de entregarlo.

import { generateWithWebSearch } from '@/lib/grounding/web-research'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { critiqueAndRevise } from '@/lib/generation/report-pipeline'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { getDocumentFeedbackBlock } from '@/lib/generation/toolkit-prompts'
import { getApprovedExamplesBlock } from '@/lib/generation/approved-examples'
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
  phase: string,
  toolLoops = 2
): Promise<Record<string, any>> {
  // web_search disponible como tool -- Claude decide si la necesita (huecos
  // de tendencias/datos del sector que ni el brand brain ni la memoria
  // tienen), no una búsqueda forzada. La fase 1 (estrategia) admite 2 loops;
  // las fases 2-3 van con 1: la corrida real del 31-ago tardó 854s de pared
  // — POR ENCIMA del maxDuration=800 del route — y el grueso eran vueltas de
  // búsqueda en fases que ya tienen todo el contexto que necesitan.
  const CONCISE =
    '\n\nIMPORTANT: your entire response MUST be a single COMPLETE valid JSON object. ' +
    'If you are running long, shorten descriptions rather than leaving the JSON unclosed.'
  const baseContent = imageBlocks.length
    ? [...imageBlocks, { type: 'text' as const, text: prompt }]
    : prompt

  const run = (mt: number, content: any) => generateWithWebSearch({
    clientId, route: 'toolkit/generate', model: 'claude-opus-4-8',
    maxTokens: mt, userContent: content, maxToolLoops: toolLoops,
  })

  let { message, text } = await run(maxTokens, baseContent)

  // Reintento ante truncación o JSON inválido (E8, plan 08-11). Este fallo
  // ya ocurrió de verdad: el monthly de Salsa se truncó el 29-07. Antes se
  // lanzaba y el job moría; ahora se reintenta una vez con más presupuesto.
  const parses = () => { try { const p = extractJson(text); return p && typeof p === 'object' && !Array.isArray(p) } catch { return false } }
  if (message.stop_reason === 'max_tokens' || !parses()) {
    const bumped = Math.min(32000, Math.max(maxTokens + 8000, Math.ceil(maxTokens * 1.5)))
    const retryContent = typeof baseContent === 'string'
      ? baseContent + CONCISE
      : [...(baseContent as any[]), { type: 'text' as const, text: CONCISE }]
    ;({ message, text } = await run(bumped, retryContent))
  }

  try {
    const parsed = extractJson(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ExtractJsonError('Model output is not a JSON object', text)
    }
    return parsed as Record<string, any>
  } catch (err) {
    throw new Error(
      `Monthly ${phase}: no se pudo extraer JSON tras reintento — ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

/** Checkpoint por fase (2.7 del plan de excelencia): lo que ya se pagó no se
 *  repaga. La corrida real del 31-ago tardó 854s de pared con maxDuration=800:
 *  si Vercel mata la función a mitad, el siguiente intento reanuda desde la
 *  última fase completada en vez de regenerar desde cero. */
export interface MonthlyCheckpoint {
  v: 1
  month: string
  strategy?: Record<string, any>
  draft_production?: Record<string, any>
}

export async function generateMonthlySystem(params: {
  clientId: string
  inputData: Record<string, any>
  attachmentText?: string
  attachmentImageBlocks: any[]
  /** Fila de generation_queue donde persistir checkpoints (opcional). */
  queueId?: string
  /** Checkpoint de un intento anterior muerto, si el route lo encontró. */
  checkpoint?: MonthlyCheckpoint | null
  /** Persiste el checkpoint en la fila; inyectado por el route (adminClient). */
  saveCheckpoint?: (queueId: string, cp: MonthlyCheckpoint) => Promise<void>
}): Promise<Record<string, unknown>> {
  const { clientId, inputData, attachmentText, attachmentImageBlocks, queueId, saveCheckpoint } = params

  const month =
    typeof inputData.mes === 'string' && /^\d{4}-\d{2}$/.test(inputData.mes)
      ? inputData.mes
      : new Date().toISOString().slice(0, 7)

  const plataformas = (Array.isArray(inputData.plataformas) ? inputData.plataformas : ['instagram'])
    .map((p: unknown) => String(p).toLowerCase())
    .filter(Boolean)

  const [brain, ctx, feedbackBlock, approvedExamplesBlock] = await Promise.all([
    fetchBrandBrain(clientId),
    getMonthlyOperatingContext(clientId, month),
    getDocumentFeedbackBlock(clientId, 'monthly-content-system'),
    getApprovedExamplesBlock(clientId), // few-shot: piezas aprobadas sin editar
  ])

  const promptParams: MonthlyPromptParams = {
    month,
    monthLabel: monthLabel(month),
    postsPorPilar: Math.min(Math.max(Number(inputData.posts_por_pilar) || 4, 1), 5),
    plataformas: plataformas.length ? plataformas : ['instagram'],
    includeReels: inputData.include_reels !== 'no',
    // omitContentPillars: los pilares ya viajan en pillarsBlock (los
    // registrados en content_pillars, la fuente operativa) — con el brain
    // completo aparecían DOS veces y con listas distintas (14 en el brain de
    // Salsa vs 9 registrados buenos), y el modelo mezclaba ambas.
    brainBlock: brain ? formatBrandBrainForPrompt(brain, { omitContentPillars: true }) : '',
    pillarsBlock: ctx.pillarsBlock,
    previousBoardBlock: ctx.previousBoardBlock,
    ...(attachmentText ? { attachmentText } : {}),
    ...(typeof inputData.contexto_adicional === 'string' && inputData.contexto_adicional.trim()
      ? { contextoAdicional: inputData.contexto_adicional.trim() }
      : {}),
    ...(feedbackBlock ? { feedbackBlock } : {}),
    ...(approvedExamplesBlock ? { approvedExamplesBlock } : {}),
  }

  // El checkpoint solo vale si es del MISMO mes; guardar nunca rompe la
  // generación (best-effort).
  const resume = params.checkpoint && params.checkpoint.v === 1 && params.checkpoint.month === month
    ? params.checkpoint
    : null
  const persist = async (cp: MonthlyCheckpoint) => {
    if (!queueId || !saveCheckpoint) return
    try { await saveCheckpoint(queueId, cp) } catch { /* nunca romper por telemetría */ }
  }

  // Fase 1 — estrategia (los adjuntos de imagen entran aquí: moodboards, refs)
  const strategy = resume?.strategy ?? await callAndParse(
    clientId,
    buildMonthlyStrategyPrompt(promptParams),
    9000,
    attachmentImageBlocks,
    'fase 1 (estrategia)'
  )
  if (!resume?.strategy) await persist({ v: 1, month, strategy })

  // Fase 2 — producción, con la estrategia ya decidida como contrato.
  // 14k: con 8 pilares registrados la fase truncaba en 12k (build real Salsa).
  const strategyJson = JSON.stringify(strategy, null, 1)
  const productionPrompt = buildMonthlyProductionPrompt(promptParams, strategyJson)
  const draftProduction = resume?.draft_production ?? await callAndParse(
    clientId,
    productionPrompt,
    14000,
    [],
    'fase 2 (producción)',
    1
  )
  if (!resume?.draft_production) await persist({ v: 1, month, strategy, draft_production: draftProduction })

  // Crítica de la fase 2 + fase 3 en PARALELO: no comparten dependencias
  // (la fase 3 solo necesita la estrategia), así que la crítica no añade
  // tiempo de pared salvo la revisión, que solo se dispara si el crítico
  // encuentra hallazgos que la ameritan. critiqueAndRevise NUNCA empeora:
  // ante cualquier fallo de crítico o revisor devuelve el borrador
  // (principio del pipeline, ver report-pipeline.ts).
  const [critiqued, ideaBank] = await Promise.all([
    critiqueAndRevise({
      clientId,
      toolSlug: 'monthly-content-system',
      prompt: productionPrompt,
      model: 'claude-opus-4-8',
      maxTokens: 14000,
      draft: draftProduction,
    }),
    callAndParse(
      clientId,
      buildMonthlyIdeaBankPrompt(promptParams, strategyJson),
      6000,
      [],
      'fase 3 (idea bank)',
      1
    ),
  ])
  const production = critiqued.data as Record<string, any>

  // Merge + open items renumerados + calendario determinista
  const openItems = [
    ...(Array.isArray(strategy.open_items) ? strategy.open_items : []),
    ...(Array.isArray(production.open_items) ? production.open_items : []),
    ...(Array.isArray(ideaBank.open_items) ? ideaBank.open_items : []),
  ]
    .map((o) => (o && typeof o === 'object' ? o : { item: String(o) }))
    // Dedupe: las 3 fases repiten los mismos huecos con palabras distintas
    // (el informe de sept-2026 salió con 23 open items, la mitad duplicados
    // — hallazgo del juez). Clave laxa: primeras ~8 palabras normalizadas.
    .filter((() => {
      const seen = new Set<string>()
      return (o: any) => {
        const key = String(o.item || '')
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, '')
          .split(/\s+/)
          .slice(0, 8)
          .join(' ')
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      }
    })())
    .map((o, i) => ({ ...o, n: i + 1 }))

  const captions = Array.isArray(production.captions) ? production.captions : []

  // Aritmética del ratio promo — misma filosofía que el economics-contract:
  // el modelo CLASIFICA cada pieza (is_promo, un juicio) y TS hace la cuenta,
  // que así no se puede esquivar. El juez del 31-ago cazó el ratio declarado
  // como "22% [JUDGEMENT]" con la cuenta real (5/17 = 29%) sin hacer, y la
  // decisión de adyacencia delegada al cliente en un open_item.
  const promoDays = captions
    .filter((c: any) => c?.is_promo === true)
    .map((c: any) => Number(c.suggested_day))
    .filter((d: number) => Number.isFinite(d))
    .sort((a: number, b: number) => a - b)
  const adjacent: number[][] = []
  for (let i = 1; i < promoDays.length; i++) {
    if (promoDays[i] - promoDays[i - 1] <= 1) adjacent.push([promoDays[i - 1], promoDays[i]])
  }
  const promoRatioComputed = captions.length
    ? {
        promo_captions: promoDays.length,
        total_captions: captions.length,
        promo_pct_actual: Math.round((promoDays.length / captions.length) * 100),
        promo_days: promoDays,
        adjacent_promo_days: adjacent,
        source: 'computed from per-caption is_promo marks',
      }
    : undefined
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
    // El ratio declarado por la fase 3 (el objetivo) convive con la cuenta
    // real: promo_ratio.computed confronta al modelo con su propia mezcla.
    ...(promoRatioComputed
      ? {
          promo_ratio: {
            ...(ideaBank.promo_ratio && typeof ideaBank.promo_ratio === 'object' ? ideaBank.promo_ratio : {}),
            computed: promoRatioComputed,
          },
        }
      : {}),
    calendar_entries: computeCalendarEntries(month, captions, heroTitles),
    previous_month_stats: ctx.previousStats,
    generated_with: { phases: 3, calendar: 'computed', critique: 'fase-2' },
    // Trazabilidad del pipeline — mismo shape que persiste la ruta no-monthly
    // (route.ts, result._pipeline): la rúbrica lee result_data._pipeline.stages.
    // Aquí viaja dentro del propio result porque el route guarda este objeto
    // tal cual como result_data.
    _pipeline: {
      stages: critiqued.stages,
      findings_count: critiqued.findings.length,
      findings: critiqued.findings.map((f) => ({ severity: f.severity, kind: f.kind, where: f.where })),
      ...(critiqued.degradedReason ? { degraded: critiqued.degradedReason } : {}),
    },
  }
}
