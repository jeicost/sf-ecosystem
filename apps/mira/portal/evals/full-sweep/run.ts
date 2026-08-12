/**
 * Barrido completo del producto sobre un cliente real.
 *
 * Ejercita las DOS superficies principales de MIRA por su punto de entrada real,
 * el mismo que usa producción:
 *   · los 8 informes de negocio  → getToolkitPrompt + createMessageForClient
 *   · las 19 acciones rápidas    → generateQuickAction
 *
 * Vuelca cada salida a disco para poder evaluarlas una a una. Registra tokens,
 * coste y tiempo de cada una, que es la mitad del diagnóstico: una herramienta
 * que tarda 4 minutos o cuesta 2 $ es un problema de producto aunque el texto
 * sea bueno.
 *
 *   npx tsx --env-file=.env.local evals/full-sweep/run.ts --client "Salsa Burgers" --only reports
 *   npx tsx --env-file=.env.local evals/full-sweep/run.ts --client "Salsa Burgers" --only actions
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { createMessageForClient, estimateCostUsd } from '../../lib/anthropic-client'
import { getToolkitPrompt } from '../../lib/generation/toolkit-prompts'
import { generateMonthlySystem } from '../../lib/generation/monthly-generate'
import { generateQuickAction } from '../../lib/quick-actions/generate'
import { QUICK_ACTIONS } from '../../lib/quick-actions/registry'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'runs')
const CARLOS = 'af1af6fa-ec61-416f-a517-18efc32ea363'

const REPORTS = [
  'brand-briefing', 'marketing-audit', 'competitive-analysis', 'seo-audit',
  'action-plan', 'brand-book', 'investor-deck', 'monthly-content-system',
]

/** Entradas realistas para Salsa Burgers — un cliente de verdad, no "test test". */
const REPORT_INPUT: Record<string, Record<string, unknown>> = {
  'brand-briefing': { company_name: 'Salsa Burgers', industry: 'Premium burgers / food delivery', website: 'https://salsaburgers.com' },
  'marketing-audit': { website: 'https://salsaburgers.com', focus: 'Instagram and delivery growth in Bangkok' },
  'competitive-analysis': { competitors: 'Daddy Burger, Firehouse, 25 Degrees Bangkok', market: 'Bangkok premium burger delivery' },
  'seo-audit': { website: 'https://salsaburgers.com', target_keywords: 'best burger bangkok, wagyu burger delivery, sathorn burger' },
  'action-plan': { goal: 'Grow delivery orders 30% in 90 days', horizon: '90 days' },
  'brand-book': { scope: 'Full brand guidelines for the Salsa ritual identity' },
  'investor-deck': { raise_goal: 'Expansion to a second Bangkok location', stage: 'seed' },
  'monthly-content-system': { month: 'September 2026', platforms: 'instagram, tiktok' },
}

/** Valores por campo requerido, plausibles para esta marca. */
const QA_VALUE: Record<string, unknown> = {
  topic: 'The glove ritual and the 18 house sauces', platform: 'Instagram', tone: 'bold',
  theme: 'New sauce of the month launch', product: 'Wagyu burger with Tom Yum sauce',
  duration: '30s', style: 'dark editorial', idea: 'How the Salsa ritual works, step by step',
  goal: 'Increase delivery orders', budget: '30000 THB', refinement: 'Make the sauce pour the hero, darker background',
  period: 'August 2026', sector: 'Premium burgers and food delivery', region: 'Bangkok, Thailand',
  current_state: 'Single location in Sathorn, delivery via Grab', strategic_goal: 'Second location and own delivery channel',
  timeline: '12 months', client_name: 'Corporate catering leads in Sathorn', target_count: 50,
  objection: 'Your burgers are more expensive than the competition', context: 'Follow-up after a corporate catering tasting',
  call_goal: 'Close a weekly corporate catering order', current_revenue: '1200000 THB/month',
  scenario: 'Opening a second location in Q1', expenses: 'Rent, staff, beef sourcing, delivery commissions',
  current_expenses: 'Beef 38%, staff 22%, rent 15%, delivery commissions 18%',
  issue: 'Order arrived with the wrong sauce', tutorial_topic: 'How to order for a group',
}

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback
}

interface Row {
  surface: 'report' | 'action'
  id: string
  ok: boolean
  ms: number
  inTok: number
  outTok: number
  usd: number
  chars: number
  error?: string
  output?: unknown
}

async function main() {
  const clientName = arg('client', 'Salsa Burgers')!
  const only = arg('only', 'all')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: client } = await db.from('clients').select('id,name').eq('name', clientName).single()
  if (!client) throw new Error(`Cliente no encontrado: ${clientName}`)

  mkdirSync(OUT, { recursive: true })
  const rows: Row[] = []

  if (only === 'all' || only === 'reports') {
    console.log(`\n▸ INFORMES (${REPORTS.length}) — ${client.name}`)
    for (const slug of REPORTS) {
      const t0 = Date.now()
      try {
        // El monthly NO pasa por getToolkitPrompt: la ruta lo desvía a su propio
        // generador de 2 llamadas. El arnés tiene que imitar ese desvío o da un
        // falso negativo (me pasó el 12-ago y reporté un fallo que no existía).
        if (slug === 'monthly-content-system') {
          const out = await generateMonthlySystem({ clientId: client.id, inputData: REPORT_INPUT[slug] || {}, attachmentImageBlocks: [] })
          const text = JSON.stringify(out, null, 2)
          rows.push({ surface: 'report', id: slug, ok: true, ms: Date.now() - t0, inTok: 0, outTok: 0, usd: 0, chars: text.length, output: text })
          writeFileSync(join(OUT, `report-${slug}.txt`), text)
          console.log(`  ✅ ${slug.padEnd(24)} ${((Date.now() - t0) / 1000).toFixed(0)}s  ${text.length} chars  (vía generateMonthlySystem)`)
          continue
        }
        const prompt = await getToolkitPrompt(slug, { clientId: client.id, inputData: REPORT_INPUT[slug] || {} })
        if (!prompt) throw new Error('getToolkitPrompt devolvió null (slug desconocido)')
        const res = await createMessageForClient(client.id, `eval/report/${slug}`, {
          model: 'claude-opus-4-8', max_tokens: 16000,
          messages: [{ role: 'user', content: prompt }],
        })
        const text = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('')
        const row: Row = {
          surface: 'report', id: slug, ok: true, ms: Date.now() - t0,
          inTok: res.usage.input_tokens, outTok: res.usage.output_tokens,
          usd: estimateCostUsd('claude-opus-4-8', res.usage.input_tokens, res.usage.output_tokens),
          chars: text.length, output: text,
        }
        rows.push(row)
        writeFileSync(join(OUT, `report-${slug}.txt`), `PROMPT (${prompt.length} chars)\n${'='.repeat(60)}\n${prompt.slice(0, 4000)}\n\n\nSALIDA\n${'='.repeat(60)}\n${text}`)
        console.log(`  ✅ ${slug.padEnd(24)} ${(row.ms / 1000).toFixed(0)}s  ${row.chars} chars  ${row.usd.toFixed(2)}$`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        rows.push({ surface: 'report', id: slug, ok: false, ms: Date.now() - t0, inTok: 0, outTok: 0, usd: 0, chars: 0, error: msg })
        console.log(`  ❌ ${slug.padEnd(24)} ${msg.slice(0, 80)}`)
      }
    }
  }

  if (only === 'all' || only === 'actions') {
    const actions = QUICK_ACTIONS as Array<{ id: string; department: string; fields: Array<{ name: string; required?: boolean; defaultValue?: unknown; options?: Array<{ value: string }> }> }>
    console.log(`\n▸ ACCIONES RÁPIDAS (${actions.length}) — ${client.name}`)
    for (const a of actions) {
      const t0 = Date.now()
      // Rellena cada campo requerido con un valor plausible; si no hay, usa la
      // primera opción del select o el default declarado.
      const inputData: Record<string, unknown> = {}
      for (const f of a.fields || []) {
        if (!f.required && f.defaultValue === undefined) continue
        inputData[f.name] = QA_VALUE[f.name] ?? f.defaultValue ?? f.options?.[0]?.value ?? 'Salsa Burgers'
      }
      try {
        const r = await generateQuickAction({
          clientId: client.id, userId: CARLOS, department: a.department,
          actionType: a.id, inputData,
        } as never) as { result?: unknown; error?: string }
        const text = typeof r?.result === 'string' ? r.result : JSON.stringify(r?.result ?? r, null, 2)
        rows.push({ surface: 'action', id: a.id, ok: !r?.error, ms: Date.now() - t0, inTok: 0, outTok: 0, usd: 0, chars: text.length, output: text, error: r?.error })
        writeFileSync(join(OUT, `action-${a.id}.txt`), `INPUT\n${JSON.stringify(inputData, null, 2)}\n\nSALIDA\n${'='.repeat(60)}\n${text}`)
        console.log(`  ${r?.error ? '❌' : '✅'} ${a.id.padEnd(24)} ${((Date.now() - t0) / 1000).toFixed(0)}s  ${text.length} chars ${r?.error ? '· ' + r.error.slice(0, 60) : ''}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        rows.push({ surface: 'action', id: a.id, ok: false, ms: Date.now() - t0, inTok: 0, outTok: 0, usd: 0, chars: 0, error: msg })
        console.log(`  ❌ ${a.id.padEnd(24)} ${msg.slice(0, 80)}`)
      }
    }
  }

  writeFileSync(join(OUT, '_summary.json'), JSON.stringify(rows.map(({ output, ...r }) => r), null, 2))
  const okc = rows.filter((r) => r.ok).length
  const usd = rows.reduce((a, r) => a + r.usd, 0)
  const secs = rows.reduce((a, r) => a + r.ms, 0) / 1000
  console.log(`\n${okc}/${rows.length} OK · ${usd.toFixed(2)}$ registrados · ${secs.toFixed(0)}s totales`)
  console.log(`→ ${OUT}`)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
