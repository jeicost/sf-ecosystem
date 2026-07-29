import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getToolkitPrompt, type ToolPromptParams } from '@/lib/generation/toolkit-prompts'
import { createMessageForClient } from '@/lib/anthropic-client'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { canUseFeature } from '@/lib/plans'
import {
  fetchSiteSnapshot,
  formatSnapshotForPrompt,
  type SiteSnapshot,
} from '@/lib/grounding/site-snapshot'
import { computeSeoChecks, deriveScore, type SeoCheck } from '@/lib/grounding/seo-checks'
import { searchWeb, formatSourcesForPrompt } from '@/lib/grounding/web-research'
import { buildAttachmentBlocks, type Attachment } from '@/lib/attachments'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { enrichPaletteCmyk } from '@/lib/export/color-utils'
import { generateMonthlySystem } from '@/lib/generation/monthly-generate'

// Single-tool generation with opus can take minutes; el monthly son 3
// llamadas secuenciales — mismo techo que el content-engine (fluid compute)
export const maxDuration = 800

// Tools grounded with a live site snapshot (deterministic SEO checks apply)
const SNAPSHOT_GROUNDED_TOOLS = ['seo-audit', 'marketing-audit', 'brand-briefing']
// Tools grounded with web research sources
const RESEARCH_GROUNDED_TOOLS = ['competitive-analysis', 'investor-deck']

const CHECK_STATUS_TO_CARD_STATUS: Record<SeoCheck['status'], string> = {
  pass: 'good',
  warn: 'warning',
  fail: 'critical',
  unknown: 'unknown',
}

/** Maps a statCard label (model-generated) to a deterministic check, by keyword. */
function findCheckForLabel(label: string, checks: SeoCheck[]): SeoCheck | null {
  const l = label.toLowerCase()
  // No deterministic hreflang check exists — never map hreflang cards to the lang check
  if (/hreflang/.test(l)) return null
  const rules: Array<[string, RegExp]> = [
    ['img-alt', /\balt\b/],
    ['meta-description', /meta\s*desc/],
    ['title', /title|t[íi]tulo|style\s*chars/],
    ['schema', /schema/],
    ['https', /https|\bssl\b/],
    ['robots', /robots/],
    ['sitemap', /sitemap/],
    ['canonical', /canonical/],
    ['viewport', /viewport|mobile|m[óo]vil/],
    ['h1', /\bh1\b/],
    ['analytics', /analytics|ga4|gtm/],
    ['og-tags', /\bog\b|open\s*graph/],
    ['lang', /\blang\b|idioma/],
  ]
  for (const [id, re] of rules) {
    if (re.test(l)) return checks.find((c) => c.id === id) ?? null
  }
  return null
}

/** Short measured value for a statCard, derived from the snapshot. */
function measuredValueForCheck(check: SeoCheck, s: SiteSnapshot): string {
  switch (check.id) {
    case 'title':
      return String(s.titleLength)
    case 'meta-description':
      return String(s.metaDescriptionLength)
    case 'img-alt':
      return `${s.imgWithAlt}/${s.imgTotal}`
    case 'schema':
      return String(s.schemaTypes.length)
    case 'h1':
      return String(s.h1Count)
    case 'https':
      return s.https ? 'Sí' : 'No'
    case 'robots':
      return s.robotsTxtExists ? 'Sí' : 'No'
    case 'sitemap':
      return s.sitemapExists ? 'Sí' : 'No'
    case 'canonical':
      return s.canonical ? 'Sí' : 'No'
    case 'viewport':
      return s.viewport ? 'Sí' : 'No'
    case 'analytics':
      return s.analyticsDetected ? 'Sí' : 'No'
    case 'lang':
      return s.lang ?? 'No'
    case 'og-tags':
      return `${(s.ogTitlePresent ? 1 : 0) + (s.ogImagePresent ? 1 : 0)}/2`
    default:
      return check.evidence
  }
}

/** True when the value is a bare number / ratio / percentage (unverifiable if no check). */
function isNumericValue(v: unknown): boolean {
  if (typeof v === 'number') return true
  if (typeof v !== 'string') return false
  return /^\s*\d+([.,]\d+)?\s*(\/\s*\d+)?\s*%?\s*$/.test(v)
}

/**
 * Overwrites statCard values that correspond to measurable checks with the
 * measured evidence. Cards with no matching check keep model text, but numeric
 * unverifiable values are nulled (never present fabricated figures as measured).
 */
function overrideStatCards(
  result: Record<string, unknown>,
  checks: SeoCheck[],
  snapshot: SiteSnapshot
): void {
  const cards = result.statCards
  if (!Array.isArray(cards)) return
  for (const card of cards) {
    if (!card || typeof card !== 'object') continue
    const c = card as Record<string, unknown>
    const label = typeof c.label === 'string' ? c.label : ''
    const check = label ? findCheckForLabel(label, checks) : null
    if (check && check.status !== 'unknown') {
      c.value = measuredValueForCheck(check, snapshot)
      c.status = CHECK_STATUS_TO_CARD_STATUS[check.status]
      c.description = check.evidence
    } else if (isNumericValue(c.value)) {
      c.value = null
    }
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  try {
    const body = await req.json()
    const { tool_slug, input_data } = body

    if (!tool_slug || !input_data) {
      return NextResponse.json({ error: 'Missing tool_slug or input_data' }, { status: 400 })
    }

    // Adjuntos del usuario (F1 Business Reports): texto extraído como fuente
    // primaria del prompt + imágenes como bloques de visión (patrón QA).
    // P3: el tema elegido al generar se persiste para que informe y exports
    // salgan coherentes sin re-elegir (query param del export lo puede pisar)
    if (body.theme === 'light' || body.theme === 'dark') {
      input_data._theme = body.theme
    } else if (input_data._theme !== 'light' && input_data._theme !== 'dark') {
      delete input_data._theme
    }

    const attachments: Attachment[] = Array.isArray(body.attachments) ? body.attachments : []
    const { contentBlocks: attachmentImageBlocks, textContext: attachmentText } =
      await buildAttachmentBlocks(attachments)
    if (attachments.length) {
      // Metadatos (no blobs) para trazabilidad del informe
      input_data._attachments = attachments.map((a: Attachment) => ({ name: a.name, type: a.type, url: a.url }))
    }

    // Multi-empresa: clientId del body validado por grant; sin él, primer grant.
    // (Mismo patrón que quick-actions / project-memory — nunca el primer grant a ciegas.)
    const access = await resolveRequestClient(body.clientId ?? null)

    let clientId: string
    let userId: string
    if (access.ok) {
      clientId = access.clientId
      userId = access.userId
    } else {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // Entitlement por plan (P5): el plan 'consulta' no incluye generar informes.
    // resolveRequestClient no expone metadata — se lee el user de sesión directamente.
    const sessionUser = await getSessionUser()
    if (!canUseFeature(sessionUser?.user_metadata?.plan, 'toolkitGenerate')) {
      return NextResponse.json(
        { error: 'Tu plan no incluye la generación de Business Reports' },
        { status: 403 }
      )
    }

    const admin = adminClient()

    // Optional project scoping: validate the project belongs to this client
    const requestedProjectId =
      typeof body.project_id === 'string' && body.project_id ? body.project_id : null
    let projectId: string | null = null
    if (requestedProjectId) {
      const { data: project } = await admin
        .from('mira_projects')
        .select('id, client_id')
        .eq('id', requestedProjectId)
        .maybeSingle()
      if (!project || project.client_id !== clientId) {
        return NextResponse.json(
          { error: 'Project not found for this client' },
          { status: 403 }
        )
      }
      projectId = project.id
    }

    // ---- Grounding: gather verified facts BEFORE prompting ----
    let snapshot: SiteSnapshot | null = null
    let siteFactsBlock: string | undefined
    let sourcesBlock: string | undefined
    let sourcesCount = 0

    const inputUrl =
      typeof input_data.url_sitio === 'string' ? input_data.url_sitio.trim() : ''

    if (SNAPSHOT_GROUNDED_TOOLS.includes(tool_slug) && inputUrl) {
      snapshot = await fetchSiteSnapshot(inputUrl)
      siteFactsBlock = formatSnapshotForPrompt(snapshot)
    } else if (tool_slug === 'competitive-analysis') {
      const competitors = [
        input_data.competidor_1,
        input_data.competidor_2,
        input_data.competidor_3,
      ]
        .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        .map((c) => c.trim())
        .slice(0, 3)
      // El focus del formulario orienta las queries (fusión quick action 2026-07-28)
      const focusTerms: Record<string, string> = {
        pricing: 'precios tarifas promociones modelo de cobro',
        features: 'productos funcionalidades características gama',
        positioning: 'posicionamiento marca propuesta de valor mensaje',
      }
      const focusQuery =
        focusTerms[input_data.focus as string] || 'productos precios posicionamiento reseñas'
      const marketQuery = `análisis de mercado tendencias sector ${competitors.join(' vs ')}`
      const searches = await Promise.all([
        ...competitors.map((c) => searchWeb(`${c} empresa ${focusQuery}`, 3)),
        searchWeb(marketQuery, 3),
      ])
      const allSources = searches.flat()
      sourcesCount = allSources.length
      sourcesBlock = formatSourcesForPrompt(allSources, 'competitive research')
    } else if (tool_slug === 'investor-deck') {
      const sectorHint = [
        typeof input_data.company_name === 'string' ? input_data.company_name : '',
        typeof input_data.problem_market_size === 'string'
          ? input_data.problem_market_size.slice(0, 120)
          : '',
      ]
        .filter(Boolean)
        .join(' — ')
      const marketResults = await searchWeb(
        `market size TAM SAM SOM growth ${sectorHint}`,
        5
      )
      sourcesCount = marketResults.length
      sourcesBlock = formatSourcesForPrompt(marketResults, 'market size research')
    }

    // Insert generation request into queue with 'processing' status
    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .insert({
        client_id: clientId,
        user_id: userId,
        project_id: projectId,
        tool_slug,
        input_data,
        status: 'processing',
      })
      .select('id')
      .single()

    if (queueError || !queueData) {
      console.error('Queue insert error:', queueError)
      return NextResponse.json({ error: queueError?.message || 'Queue insert failed' }, { status: 500 })
    }

    const queueId = queueData.id

    let result: Record<string, unknown>

    if (tool_slug === 'monthly-content-system') {
      // ── Monthly Content System: 2 llamadas secuenciales + merge (F4) ──
      try {
        result = await generateMonthlySystem({
          clientId,
          inputData: input_data,
          ...(attachmentText ? { attachmentText } : {}),
          attachmentImageBlocks,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Monthly generation failed'
        await admin
          .from('generation_queue')
          .update({ status: 'failed', error_message: msg })
          .eq('id', queueId)
        return NextResponse.json({ error: msg }, { status: 500 })
      }
    } else {

    // Generate prompt for this tool (grounding blocks are optional params —
    // toolkit-prompts consumes them once its signature is extended)
    const promptParams: ToolPromptParams & {
      siteFactsBlock?: string
      sourcesBlock?: string
    } = {
      clientId,
      inputData: input_data,
      projectId,
      ...(siteFactsBlock ? { siteFactsBlock } : {}),
      ...(sourcesBlock ? { sourcesBlock } : {}),
      ...(attachmentText ? { attachmentText } : {}),
    }
    const prompt = await getToolkitPrompt(tool_slug, promptParams)

    if (!prompt) {
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: 'Unknown tool' })
        .eq('id', queueId)

      return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
    }

    // Call Claude — el radar competitivo rápido va en sonnet con schema corto
    // (fusión de la quick action analizar_competencia, 2026-07-28)
    const isQuickCompetitive =
      tool_slug === 'competitive-analysis' && input_data.profundidad === 'quick'
    // brand-book en modo audit: solo findings — mucho más corto y barato
    const isBrandBookAudit = tool_slug === 'brand-book' && input_data.mode === 'audit'
    const message = await createMessageForClient(clientId, 'toolkit/generate', {
      model: isQuickCompetitive ? 'claude-sonnet-4-6' : 'claude-opus-4-8',
      max_tokens: isQuickCompetitive ? 8000 : isBrandBookAudit ? 8000 : 16000,
      messages: [
        {
          role: 'user',
          content: attachmentImageBlocks.length
            ? [...attachmentImageBlocks, { type: 'text' as const, text: prompt }]
            : prompt,
        },
      ],
    })

    if (message.stop_reason === 'max_tokens') {
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: 'Response truncated at max_tokens' })
        .eq('id', queueId)
      return NextResponse.json({ error: 'Response truncated' }, { status: 500 })
    }

    // Extract JSON from Claude's response (concatenate all text blocks)
    const text = message.content
      .map((b) => ('text' in b ? b.text : ''))
      .filter(Boolean)
      .join('\n')

    try {
      const parsed = extractJson(text)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new ExtractJsonError('Model output is not a JSON object', text)
      }
      result = parsed as Record<string, unknown>
    } catch (err) {
      const errorMessage =
        err instanceof ExtractJsonError
          ? `No se pudo extraer JSON de la respuesta del modelo: ${err.message}`
          : `JSON extraction failed: ${err instanceof Error ? err.message : String(err)}`
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', queueId)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    }

    // Never save an empty report as completed
    if (Object.keys(result).length === 0) {
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: 'Empty result after JSON parse' })
        .eq('id', queueId)
      return NextResponse.json({ error: 'Empty result after JSON parse' }, { status: 500 })
    }

    // Brand book: rgb/cmyk NUNCA vienen del modelo — se calculan aquí (C.1)
    if (tool_slug === 'brand-book') {
      const rd = result as Record<string, any>
      if (Array.isArray(rd?.colors?.palette)) {
        rd.colors.palette = enrichPaletteCmyk(rd.colors.palette)
      }
    }

    // ---- Deterministic post-parse override (measured facts beat model output) ----
    let checks: SeoCheck[] = []
    if (snapshot && SNAPSHOT_GROUNDED_TOOLS.includes(tool_slug)) {
      checks = computeSeoChecks(snapshot)
      result.overall_score = deriveScore(checks)
      overrideStatCards(result, checks, snapshot)
    }

    if (
      SNAPSHOT_GROUNDED_TOOLS.includes(tool_slug) ||
      RESEARCH_GROUNDED_TOOLS.includes(tool_slug)
    ) {
      result.grounding = {
        snapshot_fetched: snapshot ? !snapshot.fetchError : false,
        sources_count: sourcesCount,
        contract_version: 1,
        checks,
      }
    }

    const generationTime = Date.now() - startTime

    // Inject brandColor from Brand Brain
    let brandColor = '#8B5CF6' // default purple fallback
    try {
      const { data: brandProfile } = await admin
        .from('brand_profiles')
        .select('brand_data')
        .eq('client_id', clientId)
        .single()

      if (brandProfile?.brand_data?.visual_identity?.colors?.primary) {
        brandColor = brandProfile.brand_data.visual_identity.colors.primary
      }
    } catch (e) {
      console.warn('Could not fetch brand color:', e)
    }

    // Add brandColor to result
    const resultWithBrandColor = {
      ...result,
      brandColor,
    }

    // Debug: log what we're saving
    console.log(`[${tool_slug}] Saving result for queue ${queueId}:`, {
      hasResult: !!resultWithBrandColor,
      resultKeys: Object.keys(resultWithBrandColor),
      resultSize: JSON.stringify(resultWithBrandColor).length,
      brandColor,
    })

    // Update queue with result
    const { error: updateError } = await admin
      .from('generation_queue')
      .update({
        status: 'completed',
        result_data: resultWithBrandColor,
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    // Auto-log to project memory (fire and forget, non-blocking). Dedup: la
    // misma tool en <24h para el mismo cliente/proyecto actualiza en vez de
    // duplicar (evita que regeneraciones desplacen memorias valiosas).
    // brand-book guarda su resumen ejecutivo real (written_summary_md) — es lo
    // que futuros reports leen como dependencia, no un JSON truncado.
    const resultSummary =
      typeof (result as any)?.written_summary_md === 'string' && (result as any).written_summary_md.trim()
        ? (result as any).written_summary_md.slice(0, 900)
        : JSON.stringify(result).slice(0, 200)

    ;(async () => {
      const title = `Toolkit: ${tool_slug}`
      const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString()
      let dupQuery = admin
        .from('project_memory')
        .select('id')
        .eq('client_id', clientId)
        .eq('title', title)
        .gte('created_at', dayAgo)
        .limit(1)
      dupQuery = projectId ? dupQuery.eq('project_id', projectId) : dupQuery.is('project_id', null)
      const { data: dup } = await dupQuery
      if (dup?.length) {
        await admin
          .from('project_memory')
          .update({ summary: resultSummary, full_content: result })
          .eq('id', dup[0].id)
      } else {
        // category 'content' — el CHECK real de project_memory rechaza
        // 'generation' (el auto-log del toolkit llevaba fallando en silencio
        // a nivel de BD desde siempre por esto).
        await admin.from('project_memory').insert({
          client_id: clientId,
          project_id: projectId,
          title,
          category: 'content',
          summary: resultSummary,
          full_content: result,
          tags: [tool_slug, 'toolkit', ...(tool_slug === 'brand-book' ? ['brand_book'] : [])],
          source_department: 'toolkit',
        })
      }
    })().catch((e) => console.error('project_memory auto-log failed:', e))

    return NextResponse.json({
      success: true,
      queue_id: queueId,
      result,
      generation_time_ms: generationTime,
    })
  } catch (error) {
    console.error('Generation endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check generation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const queue_id = searchParams.get('queue_id')

    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('generation_queue')
      .select('*')
      .eq('id', queue_id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      queue_id,
      status: data.status,
      result_data: data.result_data,
      error_message: data.error_message,
      completed_at: data.completed_at,
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
