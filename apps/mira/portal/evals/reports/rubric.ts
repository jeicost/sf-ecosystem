/**
 * RÚBRICA DE INFORMES — mide si sirven, no si salen.
 *
 * El eval que existía (evals/full-sweep) registra milisegundos, tokens, coste y
 * caracteres: comprueba que los informes SE GENEREN. Tras 93 informes en
 * producción y 0 valoraciones de cliente en `document_feedback`, nadie tenía
 * ningún dato sobre si valían algo.
 *
 * EXPECTATIVAS POR HERRAMIENTA. La primera versión de esta rúbrica puntuaba a
 * todos por el mismo rasero y era injusta: un seo-audit sacaba 0 en «apuesta
 * explícita» porque ese campo no existe en su esquema, no porque el informe
 * fuera malo. Aquí cada herramienta declara qué criterios le aplican, y los que
 * no aplican salen del denominador. Así las notas se pueden comparar entre sí.
 *
 * Casi todo es determinista y gratis. El juez LLM (--judge) sólo añade la
 * pregunta que no se puede automatizar: ¿esta frase valdría para otro cliente?
 *
 *   npx tsx --env-file=.env.local evals/reports/rubric.ts --all
 *   npx tsx --env-file=.env.local evals/reports/rubric.ts --tool action-plan
 *   npx tsx --env-file=.env.local evals/reports/rubric.ts --id <uuid> --judge
 */
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const args = process.argv.slice(2)
const arg = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const WANT_JUDGE = args.includes('--judge')
const ALL = args.includes('--all')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Crit = 'economics' | 'judgment' | 'specificity' | 'rigor' | 'owners' | 'kill' | 'bet'

/**
 * Qué se le exige a cada herramienta. Un criterio ausente no puntúa NI resta:
 * sale del denominador. Deriva de lo que su prompt realmente pide (ver
 * ECONOMICS_TOOLS en toolkit-prompts.ts y los esquemas de cada case).
 */
const EXPECT: Record<string, Crit[]> = {
  'action-plan':                  ['economics', 'judgment', 'specificity', 'rigor', 'owners', 'kill', 'bet'],
  'marketing-campaign-generator': ['economics', 'judgment', 'specificity', 'rigor', 'kill', 'bet'],
  'investor-deck':                ['economics', 'judgment', 'specificity', 'rigor'],
  'marketing-audit':              ['economics', 'judgment', 'specificity', 'rigor'],
  'content-pack':                 ['economics', 'judgment', 'specificity', 'rigor'],
  'community-growth-blueprint':   ['economics', 'judgment', 'specificity', 'rigor'],
  'brand-briefing':               ['judgment', 'specificity', 'rigor'],
  'competitive-analysis':         ['judgment', 'specificity', 'rigor'],
  'seo-audit':                    ['judgment', 'specificity', 'rigor', 'owners'],
  'brand-book':                   ['judgment', 'specificity', 'rigor'],
  'brandbook-content-system':     ['judgment', 'specificity', 'rigor'],
  'monthly-content-system':       ['judgment', 'specificity', 'rigor'],
  'content-engine':               ['judgment', 'specificity', 'rigor'],
}
const DEFAULT_EXPECT: Crit[] = ['judgment', 'specificity', 'rigor']

/** Campos donde "unknown" es una NO-respuesta: son el encargo, no un dato ausente. */
const JUDGEMENT_FIELDS = ['effort', 'probability', 'impact', 'priority', 'severity', 'difficulty']
const DODGE_VALUES = ['unknown', 'tbd', 'n/a', 'por definir', 'to be defined', 'desconocido', '']

/** Relleno consultor. Cada acierto es una frase que valdría para cualquier marca. */
const FILLER = [
  /\ben el mundo actual\b/i, /\bcabe destacar\b/i, /\bes importante (mencionar|destacar|señalar)\b/i,
  /\bcontenido de (alta )?calidad\b/i, /\boptimizar la estrategia\b/i, /\bmejorar la presencia\b/i,
  /\bcrear contenido atractivo\b/i, /\baumentar el engagement\b/i, /\bhoy en d[ií]a\b/i,
  /\bconfigurar el tracking\b/i, /\bbest practices\b/i, /\baprovechar las sinergias\b/i,
]
const VAGUE_OWNER = /^(el |the )?(equipo|team|marketing|agencia|agency|todos|tbd|n\/a|-)?$/i

interface Score { crit: Crit; name: string; got: number; max: number; note: string }

function walk(node: unknown, fn: (key: string, val: unknown, path: string) => void, path = '') {
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, fn, `${path}[${i}]`))
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      fn(k, v, path ? `${path}.${k}` : k)
      walk(v, fn, path ? `${path}.${k}` : k)
    }
  }
}

function scoreReport(r: Record<string, any>, toolSlug: string) {
  const expect = EXPECT[toolSlug] ?? DEFAULT_EXPECT
  const text = JSON.stringify(r)
  const words = text.split(/\s+/).length
  const all: Score[] = []

  const econ = r.derived_economics
  const calcs = Array.isArray(econ?.calculations) ? econ.calculations.length : 0
  all.push({ crit: 'economics', name: 'Economía derivada', max: 2,
    got: calcs >= 2 ? 2 : calcs === 1 ? 1 : 0,
    note: calcs ? `${calcs} cálculo(s), veredicto "${econ?.verdict ?? '—'}"` : 'no cruzó ningún número' })

  let judged = 0, dodged = 0
  const where: string[] = []
  walk(r, (k, v, p) => {
    if (!JUDGEMENT_FIELDS.includes(k)) return
    judged++
    const s = String(v ?? '').trim().toLowerCase()
    if (v == null || DODGE_VALUES.includes(s)) { dodged++; where.push(p) }
  })
  all.push({ crit: 'judgment', name: 'Criterio asumido', max: 2,
    got: judged === 0 ? 1 : dodged === 0 ? 2 : dodged / judged < 0.3 ? 1 : 0,
    note: judged ? `${dodged}/${judged} esquivados${dodged ? ' → ' + where.slice(0, 2).join(', ') : ''}` : 'sin campos de juicio' })

  const hits = FILLER.reduce((n, re) => n + (text.match(new RegExp(re, 'gi'))?.length ?? 0), 0)
  const per1k = (hits / words) * 1000
  all.push({ crit: 'specificity', name: 'Especificidad', max: 2,
    got: per1k < 0.5 ? 2 : per1k < 2 ? 1 : 0,
    note: `${hits} frases de relleno (${per1k.toFixed(1)}/1k palabras)` })

  const gaps = Array.isArray(r.data_gaps) ? r.data_gaps.length : 0
  const labels = (text.match(/\[(ASSUMPTION|RECOMMENDATION|MISSING: real data|JUDGEMENT)\]/g) || []).length
  all.push({ crit: 'rigor', name: 'Rigor de fuentes', max: 2,
    got: gaps > 0 && labels > 0 ? 2 : gaps > 0 || labels > 0 ? 1 : 0,
    note: `${gaps} data_gaps · ${labels} etiquetas` })

  const owners: string[] = []
  walk(r, (k, v) => { if (k === 'owner' && typeof v === 'string') owners.push(v) })
  const vague = owners.filter((o) => VAGUE_OWNER.test(o.trim())).length
  all.push({ crit: 'owners', name: 'Dueños con nombre', max: 1,
    got: owners.length === 0 ? 0 : vague === 0 ? 1 : 0,
    note: owners.length ? `${owners.length - vague}/${owners.length} con nombre real` : 'sin dueños' })

  const ex: string[] = [
    ...(r.success_definition?.exit_thresholds ?? []),
    ...(r.kill_rule ? [JSON.stringify(r.kill_rule)] : []),
  ].map(String)
  const usable = ex.filter((t) => /\d/.test(t) && /(d[ií]a|semana|mes|week|day|month|fecha)/i.test(t)).length
  all.push({ crit: 'kill', name: 'Criterios de parada', max: 1,
    got: usable > 0 ? 1 : 0,
    note: ex.length ? `${usable}/${ex.length} con número y plazo` : 'ninguno' })

  const bet = r.the_bet?.call || r.campaign_job
  const rejected = Array.isArray(r.rejected_alternatives) ? r.rejected_alternatives.length : 0
  all.push({ crit: 'bet', name: 'Apuesta explícita', max: 2,
    got: bet && rejected >= 2 ? 2 : bet || rejected ? 1 : 0,
    note: bet ? `apuesta declarada · ${rejected} descartada(s)` : 'sin apuesta ni descartes' })

  const scores = all.filter((s) => expect.includes(s.crit))
  const skipped = all.filter((s) => !expect.includes(s.crit)).map((s) => s.name)
  return {
    scores, skipped,
    total: scores.reduce((a, s) => a + s.got, 0),
    max: scores.reduce((a, s) => a + s.max, 0),
  }
}

async function judge(report: Record<string, any>): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const msg = await client.messages.create({
    model: 'claude-opus-4-8', max_tokens: 1200,
    messages: [{ role: 'user', content: `Eres el cliente que ha pagado por este entregable y lo lee con prisa y escepticismo.

Contesta SOLO esto, en español y sin rodeos:
1. Las 3 frases que valdrían igual para otro cliente de otro sector (cítalas literales).
2. El cálculo que tenía los datos delante y no hizo (si lo hay).
3. La decisión que esquivó.
4. Una nota del 1 al 10 y una sola frase de por qué.

INFORME:
${JSON.stringify(report).slice(0, 60000)}` }],
  })
  return msg.content.map((b: any) => ('text' in b ? b.text : '')).join('')
}

async function main() {
  const id = arg('--id'), tool = arg('--tool')
  const limit = Number(arg('--limit') ?? (ALL ? 200 : 8))
  let q = supabase.from('generation_queue')
    .select('id, tool_slug, created_at, result_data')
    .eq('status', 'completed').order('created_at', { ascending: false })
  if (id) q = q.eq('id', id)
  if (tool) q = q.eq('tool_slug', tool)
  const { data, error } = await q.limit(id ? 1 : limit)
  if (error) throw new Error(error.message)
  if (!data?.length) return console.log('Sin informes que puntuar.')

  const byTool = new Map<string, number[]>()

  for (const row of data) {
    const { scores, skipped, total, max } = scoreReport(row.result_data || {}, row.tool_slug)
    if (!max) continue
    byTool.set(row.tool_slug, [...(byTool.get(row.tool_slug) ?? []), total / max])

    if (!ALL) {
      const stages = (row.result_data as any)?._pipeline?.stages
      console.log(`\n${'─'.repeat(74)}`)
      console.log(`${row.tool_slug}  ${row.id.slice(0, 8)}  ${row.created_at.slice(0, 10)}` +
        (stages ? `  · pipeline ${stages} etapas` : '  · pasada única'))
      console.log(`NOTA: ${total}/${max}`)
      for (const s of scores) {
        console.log(`  ${('█'.repeat(s.got) + '░'.repeat(s.max - s.got)).padEnd(3)} ${s.name.padEnd(20)} ${s.got}/${s.max}  ${s.note}`)
      }
      if (skipped.length) console.log(`  n/a: ${skipped.join(', ')}`)
      if (WANT_JUDGE) console.log('\n  JUEZ:\n' + (await judge(row.result_data)).split('\n').map((l) => '  ' + l).join('\n'))
    }
  }

  console.log(`\n${'═'.repeat(74)}`)
  console.log('LÍNEA BASE POR HERRAMIENTA'.padEnd(34) + 'n'.padStart(4) + '   nota')
  console.log('─'.repeat(74))
  const rows = [...byTool.entries()]
    .map(([t, v]) => ({ t, n: v.length, avg: v.reduce((a, b) => a + b, 0) / v.length }))
    .sort((a, b) => a.avg - b.avg)
  for (const { t, n, avg } of rows) {
    const pct = Math.round(avg * 100)
    const bar = '█'.repeat(Math.round(avg * 20)).padEnd(20, '░')
    console.log(`${t.padEnd(32)} ${String(n).padStart(3)}   ${bar} ${String(pct).padStart(3)}%`)
  }
  const flat = [...byTool.values()].flat()
  console.log('─'.repeat(74))
  console.log(`GLOBAL sobre ${flat.length} informes: ${Math.round((flat.reduce((a, b) => a + b, 0) / flat.length) * 100)}%`)
}

main().catch((e) => { console.error(e); process.exit(1) })
