/**
 * RÚBRICA DE INFORMES — mide si sirven, no si salen.
 *
 * El eval que existía (evals/full-sweep) registra milisegundos, tokens, coste y
 * caracteres: comprueba que los informes SE GENEREN. Tras 93 informes en
 * producción y 0 valoraciones de cliente en `document_feedback`, nadie tenía
 * ningún dato sobre si valían algo.
 *
 * Esta rúbrica puntúa informes YA GUARDADOS en generation_queue, así que sirve
 * para medir antes/después de un cambio de prompt sin volver a generarlos.
 *
 * Casi todo es determinista y gratis. El juez LLM (--judge) sólo añade la
 * pregunta que no se puede automatizar: ¿esta frase valdría para otro cliente?
 *
 *   npx tsx --env-file=.env.local evals/reports/rubric.ts --tool action-plan
 *   npx tsx --env-file=.env.local evals/reports/rubric.ts --id f7fce2dd-...
 *   npx tsx --env-file=.env.local evals/reports/rubric.ts --tool action-plan --judge
 */
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const args = process.argv.slice(2)
const arg = (k: string) => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : undefined
}
const WANT_JUDGE = args.includes('--judge')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Campos donde "unknown" es una NO-respuesta: son el encargo, no un dato ausente. */
const JUDGEMENT_FIELDS = ['effort', 'probability', 'impact', 'priority', 'severity', 'difficulty']
const DODGE_VALUES = ['unknown', 'tbd', 'n/a', 'por definir', 'to be defined', 'desconocido', '']

/** Relleno consultor. Cada acierto es una frase que valdría para cualquier marca. */
const FILLER = [
  /\ben el mundo actual\b/i, /\bcabe destacar\b/i, /\bes importante (mencionar|destacar|señalar)\b/i,
  /\bcontenido de (alta )?calidad\b/i, /\boptimizar la estrategia\b/i, /\bmejorar la presencia\b/i,
  /\bcrear contenido atractivo\b/i, /\baumentar el engagement\b/i, /\bhoy en d[ií]a\b/i,
  /\bconfigurar el tracking\b/i, /\bbest practices\b/i, /\baprovechar las sinergias\b/i,
  /\bpúblico objetivo\b(?![^.]*\b(de|:)\b)/i,
]
/** Dueños que no son nadie. */
const VAGUE_OWNER = /^(el |the )?(equipo|team|marketing|agencia|agency|todos|tbd|n\/a|-)?$/i

interface Score { name: string; got: number; max: number; note: string }

function walk(node: unknown, fn: (key: string, val: unknown, path: string) => void, path = '') {
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, fn, `${path}[${i}]`))
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      fn(k, v, path ? `${path}.${k}` : k)
      walk(v, fn, path ? `${path}.${k}` : k)
    }
  }
}

function scoreReport(r: Record<string, any>): { scores: Score[]; total: number; max: number } {
  const text = JSON.stringify(r)
  const words = text.split(/\s+/).length
  const scores: Score[] = []

  // 1 · ECONOMÍA DERIVADA — ¿cruzó los números que tenía?
  const econ = r.derived_economics
  const calcs = Array.isArray(econ?.calculations) ? econ.calculations.length : 0
  scores.push({
    name: 'Economía derivada', max: 2,
    got: calcs >= 2 ? 2 : calcs === 1 ? 1 : 0,
    note: calcs ? `${calcs} cálculo(s), veredicto "${econ?.verdict ?? '—'}"` : 'no cruzó ningún número',
  })

  // 2 · CRITERIO — ¿se mojó donde le pagan por mojarse?
  let judged = 0, dodged = 0
  const dodgedWhere: string[] = []
  walk(r, (k, v, path) => {
    if (!JUDGEMENT_FIELDS.includes(k)) return
    judged++
    const s = String(v ?? '').trim().toLowerCase()
    if (v == null || DODGE_VALUES.includes(s)) { dodged++; dodgedWhere.push(path) }
  })
  const dodgeRate = judged ? dodged / judged : 0
  scores.push({
    name: 'Criterio asumido', max: 2,
    got: judged === 0 ? 1 : dodged === 0 ? 2 : dodgeRate < 0.3 ? 1 : 0,
    note: judged ? `${dodged}/${judged} esquivados${dodged ? ' → ' + dodgedWhere.slice(0, 3).join(', ') : ''}` : 'sin campos de juicio',
  })

  // 3 · ESPECIFICIDAD — relleno por cada 1.000 palabras
  const hits = FILLER.reduce((n, re) => n + (text.match(new RegExp(re, 'gi'))?.length ?? 0), 0)
  const per1k = (hits / words) * 1000
  scores.push({
    name: 'Especificidad', max: 2,
    got: per1k < 0.5 ? 2 : per1k < 2 ? 1 : 0,
    note: `${hits} frases de relleno (${per1k.toFixed(1)}/1k palabras)`,
  })

  // 4 · RIGOR — el suelo que NO se puede perder al pedir más criterio
  const gaps = Array.isArray(r.data_gaps) ? r.data_gaps.length : 0
  const labels = (text.match(/\[(ASSUMPTION|RECOMMENDATION|MISSING: real data|JUDGEMENT)\]/g) || []).length
  scores.push({
    name: 'Rigor de fuentes', max: 2,
    got: gaps > 0 && labels > 0 ? 2 : gaps > 0 || labels > 0 ? 1 : 0,
    note: `${gaps} data_gaps · ${labels} etiquetas`,
  })

  // 5 · DUEÑOS REALES
  const owners: string[] = []
  walk(r, (k, v) => { if (k === 'owner' && typeof v === 'string') owners.push(v) })
  const vague = owners.filter((o) => VAGUE_OWNER.test(o.trim())).length
  scores.push({
    name: 'Dueños con nombre', max: 1,
    got: owners.length === 0 ? 0 : vague === 0 ? 1 : 0,
    note: owners.length ? `${owners.length - vague}/${owners.length} con nombre real` : 'sin dueños',
  })

  // 6 · CRITERIOS DE PARADA — número Y momento
  const ex: string[] = [
    ...(r.success_definition?.exit_thresholds ?? []),
    ...(r.kill_rule ? [JSON.stringify(r.kill_rule)] : []),
  ].map(String)
  const usable = ex.filter((t) => /\d/.test(t) && /(d[ií]a|semana|mes|week|day|month|fecha)/i.test(t)).length
  scores.push({
    name: 'Criterios de parada', max: 1,
    got: usable > 0 ? 1 : 0,
    note: ex.length ? `${usable}/${ex.length} con número y plazo` : 'ninguno',
  })

  // 7 · LA APUESTA — ¿hay una decisión no obvia y un camino descartado?
  const bet = r.the_bet?.call || r.campaign_job
  const rejected = Array.isArray(r.rejected_alternatives) ? r.rejected_alternatives.length : 0
  scores.push({
    name: 'Apuesta explícita', max: 2,
    got: bet && rejected >= 2 ? 2 : bet || rejected ? 1 : 0,
    note: bet ? `apuesta declarada · ${rejected} alternativa(s) descartada(s)` : 'sin apuesta ni descartes',
  })

  return { scores, total: scores.reduce((a, s) => a + s.got, 0), max: scores.reduce((a, s) => a + s.max, 0) }
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
  const id = arg('--id'), tool = arg('--tool'), limit = Number(arg('--limit') ?? 8)
  let q = supabase.from('generation_queue')
    .select('id, tool_slug, client_id, created_at, result_data')
    .eq('status', 'completed').order('created_at', { ascending: false })
  if (id) q = q.eq('id', id)
  if (tool) q = q.eq('tool_slug', tool)
  const { data, error } = await q.limit(id ? 1 : limit)
  if (error) throw new Error(error.message)
  if (!data?.length) return console.log('Sin informes que puntuar.')

  const totals: number[] = []
  for (const row of data) {
    const { scores, total, max } = scoreReport(row.result_data || {})
    totals.push(total / max)
    const stages = (row.result_data as any)?._pipeline?.stages
    console.log(`\n${'─'.repeat(72)}`)
    console.log(`${row.tool_slug}  ${row.id.slice(0, 8)}  ${row.created_at.slice(0, 10)}` +
      (stages ? `  · pipeline ${stages} etapas` : '  · pasada única'))
    console.log(`NOTA: ${total}/${max}`)
    for (const s of scores) {
      const bar = '█'.repeat(s.got) + '░'.repeat(s.max - s.got)
      console.log(`  ${bar.padEnd(3)} ${s.name.padEnd(20)} ${String(s.got) + '/' + s.max}  ${s.note}`)
    }
    if (WANT_JUDGE) console.log('\n  JUEZ:\n' + (await judge(row.result_data)).split('\n').map((l) => '  ' + l).join('\n'))
  }
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length
  console.log(`\n${'═'.repeat(72)}\nMEDIA sobre ${totals.length} informes: ${(avg * 100).toFixed(0)}%`)
}

main().catch((e) => { console.error(e); process.exit(1) })
