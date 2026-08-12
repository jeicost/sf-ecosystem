import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getToolkitPrompt } from '@/lib/generation/toolkit-prompts'
import { createMessageForClient, estimateCostUsd } from '@/lib/anthropic-client'
import { TOOLKIT_TOOLS as TOOLKIT_TOOL_DEFS } from '@/lib/toolkit-tools'
import { extractJson, ExtractJsonError } from '@/lib/generation/extract-json'
import { getSessionUser } from '@/lib/resolve-client'
import { canUseFeature } from '@/lib/plans'

// Long-running generation: allow up to 800s on Vercel (fluid compute)
export const maxDuration = 800

// Batch-generatable tools: everything except tools with their own dedicated route
const TOOLKIT_TOOLS: string[] = TOOLKIT_TOOL_DEFS.filter((t) => !t.hasDedicatedRoute).map(
  (t) => t.slug
)

const MODEL = 'claude-opus-4-8'
const MAX_OUTPUT_TOKENS = 16000
const MAX_ATTEMPTS = 3

/**
 * Topes de coste del lote (P0 fuga 3).
 *
 * Medido: 12 tools sin ruta dedicada × 3 intentos × Opus con 16.000 tokens de
 * salida = 36 llamadas ≈ 16 $ que se disparan con un clic. Peor aún, `tools`
 * no venía deduplicado y el filtro sólo comprueba pertenencia, así que
 * ['seo-audit'] repetido 100 veces generaba 100 informes: coste sin techo.
 *
 * MAX_TOOLS_PER_BATCH = el catálogo completo, así que el lote normal (los 12)
 * no cambia; lo que se corta es la repetición. MAX_BATCH_RETRIES es TOTAL del
 * lote (no por informe, que es lo que se descontrolaba): con 6, el peor caso
 * pasa de 36 a 18 llamadas, de ~16 $ a ~8 $.
 */
const MAX_TOOLS_PER_BATCH = TOOLKIT_TOOLS.length
const MAX_BATCH_RETRIES = 6

/**
 * Reloj del lote: no arrancar un informe que la plataforma va a matar.
 *
 * Medido: maxDuration son 800 s y los 12 tools del catálogo suman 117 min de
 * tiempo anunciado (lib/toolkit-tools.ts: brand-briefing ~20 min,
 * brandbook-content-system ~30 min...). El lote por defecto NUNCA cabe. Al
 * morir la función, el informe en vuelo se paga igual, su fila queda en
 * 'processing' para siempre y el caller no recibe `generated`: un cron que
 * interprete el 504 como fallo relanza el lote entero y vuelve a pagar los
 * informes ya hechos (~0,42 $ cada uno). Parando a los 700 s devolvemos lo
 * generado y la lista `skipped`, para que el reintento pida sólo lo que falta.
 */
const BATCH_DEADLINE_MS = 700_000

/**
 * Tokens de entrada aproximados por informe (prompt de toolkit + contexto de marca).
 * Junto con MAX_OUTPUT_TOKENS (la salida se cuenta al tope, no a lo que emita
 * el modelo), hace que estimated_cost_usd sea un TECHO, no una previsión.
 */
const EST_INPUT_TOKENS = 4000

/** Recuento y coste del lote ANTES de ejecutarlo: la ruta deja de ser una caja negra. */
function estimateBatch(toolCount: number) {
  const minCalls = toolCount
  const maxCalls = toolCount + MAX_BATCH_RETRIES
  const perCall = estimateCostUsd(MODEL, EST_INPUT_TOKENS, MAX_OUTPUT_TOKENS)
  return {
    model: MODEL,
    reports: toolCount,
    max_attempts_per_report: MAX_ATTEMPTS,
    max_retries_per_batch: MAX_BATCH_RETRIES,
    max_model_calls: maxCalls,
    estimated_cost_usd: Number((perCall * minCalls).toFixed(2)),
    max_cost_usd: Number((perCall * maxCalls).toFixed(2)),
  }
}

/** extractJson wrapper that guarantees a plain object (batch results are objects). */
function extractJsonObject(text: string): Record<string, unknown> {
  const parsed = extractJson(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ExtractJsonError('Model output is not a JSON object', text)
  }
  return parsed as Record<string, unknown>
}

async function generateToolReport(
  admin: ReturnType<typeof adminClient>,
  clientId: string,
  userId: string | null,
  toolSlug: string,
  inputData: Record<string, unknown>,
  retryBudget: { left: number }
): Promise<string> {
  const { data: queueData, error: queueError } = await admin
    .from('generation_queue')
    .insert({
      client_id: clientId,
      user_id: userId,
      tool_slug: toolSlug,
      input_data: inputData,
      status: 'processing',
    })
    .select('id')
    .single()

  if (queueError || !queueData) {
    console.error(`[${toolSlug}] Queue insert error:`, queueError)
    throw new Error(`Queue insert failed: ${queueError?.message ?? 'unknown'}`)
  }

  const queueId = queueData.id

  try {
    const prompt = await getToolkitPrompt(toolSlug, { clientId, inputData })
    if (!prompt) throw new Error('Unknown tool')

    let result: Record<string, unknown> = {}
    let lastError = ''

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const message = await createMessageForClient(clientId, 'toolkit/generate-batch', {
          model: MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: [{ role: 'user', content: prompt }],
        })

        if (message.stop_reason === 'max_tokens') {
          throw new Error('Response truncated at max_tokens')
        }

        // Concatenate all text blocks (models may emit non-text blocks first)
        const text = message.content
          .map((b) => ('text' in b ? b.text : ''))
          .filter(Boolean)
          .join('\n')
        // Throws ExtractJsonError (with text preview) when no JSON can be extracted
        result = extractJsonObject(text)

        if (Object.keys(result).length === 0) {
          throw new Error(
            `Empty JSON object. stop=${message.stop_reason} blocks=[${message.content.map((b) => b.type).join(',')}]`
          )
        }
        break
      } catch (err) {
        lastError =
          err instanceof ExtractJsonError
            ? `JSON extraction failed: ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Unknown error'
        result = {}
        // El reintento consume presupuesto COMPARTIDO del lote: un informe que
        // falla siempre ya no arrastra a los 11 restantes a 3 intentos cada uno.
        if (attempt < MAX_ATTEMPTS && retryBudget.left > 0) {
          retryBudget.left--
          await new Promise((r) => setTimeout(r, 5000))
        } else {
          break
        }
      }
    }

    if (Object.keys(result).length === 0) {
      throw new Error(lastError || 'Generation produced empty result')
    }

    // Fetch brand color
    let brandColor = '#8B5CF6'
    try {
      const { data: brandProfile } = await admin
        .from('brand_profiles')
        .select('brand_data')
        .eq('client_id', clientId)
        .single()

      if (brandProfile?.brand_data?.visual_identity?.colors?.primary) {
        brandColor = brandProfile.brand_data.visual_identity.colors.primary
      }
    } catch {
      console.warn(`[${toolSlug}] Could not fetch brand color`)
    }

    const { error: updateError } = await admin
      .from('generation_queue')
      .update({
        status: 'completed',
        result_data: { ...result, brandColor },
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    if (updateError) throw new Error(`Update failed: ${updateError.message}`)

    console.log(`[${toolSlug}] ✅ Generated: ${queueId}`)
    return queueId
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await admin
      .from('generation_queue')
      .update({ status: 'failed', error_message: message })
      .eq('id', queueId)
    console.error(`[${toolSlug}] Generation failed:`, message)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.BATCH_SECRET
    if (!secret || req.headers.get('x-batch-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Entitlement por plan (P5): la ruta es server-to-server (x-batch-secret,
    // sin sesión normalmente), pero si la invoca un usuario logueado su plan
    // debe incluir toolkitGenerate — el plan 'consulta' queda fuera.
    const sessionUser = await getSessionUser().catch(() => null)
    if (sessionUser && !canUseFeature(sessionUser.user_metadata?.plan, 'toolkitGenerate')) {
      return NextResponse.json(
        { error: 'Your plan does not include generating Business Reports' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { client_id, input_data = {} } = body

    if (!client_id) {
      return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    }

    const requested: string[] =
      Array.isArray(body.tools) && body.tools.length > 0
        ? body.tools.filter((t: string) => TOOLKIT_TOOLS.includes(t))
        : TOOLKIT_TOOLS

    // Dedupe + tope: el filtro sólo comprobaba pertenencia, así que un slug
    // repetido N veces generaba N informes con Opus. Ver MAX_TOOLS_PER_BATCH.
    const toolsToRun = Array.from(new Set(requested)).slice(0, MAX_TOOLS_PER_BATCH)

    const estimate = estimateBatch(toolsToRun.length)

    // Recuento y coste ANTES de gastar: sin esto el cliente pulsa un botón y no
    // ve venir la factura. `estimate_only` permite consultarlo sin ejecutar nada.
    if (body.estimate_only === true) {
      return NextResponse.json({ success: true, client_id, estimate, tools: toolsToRun })
    }

    const admin = adminClient()
    const userId = null // batch-generated, no specific user
    const retryBudget = { left: MAX_BATCH_RETRIES }

    console.log(
      `🚀 Batch generation for ${client_id}: ${toolsToRun.length} tools, ` +
        `hasta ${estimate.max_model_calls} llamadas ≈ ${estimate.max_cost_usd} $`
    )

    const results: Record<string, string> = {}
    const errors: Record<string, string> = {}
    const skipped: string[] = []
    const startedAt = Date.now()
    let slowestReportMs = 0

    for (const toolSlug of toolsToRun) {
      // Ver BATCH_DEADLINE_MS: si no cabe otro informe del tamaño del más lento
      // visto, se para en vez de pagarlo para que lo mate maxDuration.
      if (Date.now() - startedAt + slowestReportMs > BATCH_DEADLINE_MS) {
        skipped.push(toolSlug)
        continue
      }
      const reportStartedAt = Date.now()
      try {
        results[toolSlug] = await generateToolReport(
          admin,
          client_id,
          userId,
          toolSlug,
          (input_data as Record<string, Record<string, unknown>>)[toolSlug] || {},
          retryBudget
        )
        await new Promise((r) => setTimeout(r, 2000))
      } catch (error) {
        errors[toolSlug] = error instanceof Error ? error.message : 'Unknown error'
      }
      slowestReportMs = Math.max(slowestReportMs, Date.now() - reportStartedAt)
    }

    if (skipped.length > 0) {
      console.warn(
        `⏱️ Batch for ${client_id}: ${skipped.length} tools skipped at the ${BATCH_DEADLINE_MS / 1000}s deadline: ${skipped.join(', ')}`
      )
    }

    console.log(`✅ Batch complete for ${client_id}: ${Object.keys(results).length}/${toolsToRun.length}`)

    return NextResponse.json({
      success: true,
      client_id,
      generated: results,
      errors,
      skipped,
      total: toolsToRun.length,
      success_count: Object.keys(results).length,
      estimate,
      retries_used: MAX_BATCH_RETRIES - retryBudget.left,
    })
  } catch (error) {
    console.error('Batch generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch generation failed' },
      { status: 500 }
    )
  }
}
