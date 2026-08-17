/**
 * Evals de la extracción de Email Ops.
 *
 * Compromiso: ningún cambio de prompt/esquema de lib/email-ops/extract.ts va a
 * producción sin correr esto. La extracción es determinista de comprobar sin
 * juez LLM: los datos están escritos en el correo, o el motor los saca o no.
 * Y lo más importante es lo que NO debe salir: `must_be_null` falla si el
 * modelo se inventa un dato que el correo no trae.
 *
 * Uso:
 *   cd apps/mira/portal
 *   npx tsx --env-file=.env.local evals/email-ops/run.ts             # todos
 *   npx tsx --env-file=.env.local evals/email-ops/run.ts factura     # filtra por id
 *
 * Los fixtures del entrenamiento real del cliente van a fixtures/ con su caso
 * en cases/ (mismo formato); los que sean sensibles no se commitean.
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { analyzeEmail } from '../../lib/email-ops/extract'
import { COURIER_V1_FIELDS } from '../../lib/email-ops/schema'

const HERE = dirname(fileURLToPath(import.meta.url))
const CASES = join(HERE, 'cases')
const FIXTURES = join(HERE, 'fixtures')

// Albasanz Express: dueño del piloto.
const CLIENT_ID = process.env.EVAL_CLIENT_ID || '7bdfe0d0-c1d9-4282-9792-aed1075c048b'

interface Case {
  id: string
  description: string
  fixture: string
  received_at: string
  expected: {
    kind: 'shipment_request' | 'other'
    urgency_min?: number
    fields?: Record<string, string | number>
    contains?: Record<string, string>
    must_be_null?: string[]
  }
}

function parseFixture(raw: string): { from: string; to: string[]; subject: string; text: string } {
  const lines = raw.split('\n')
  let from = '', subject = ''
  const to: string[] = []
  let i = 0
  for (; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('De: ')) from = l.slice(4).trim()
    else if (l.startsWith('Para: ')) to.push(l.slice(6).trim())
    else if (l.startsWith('Asunto: ')) subject = l.slice(8).trim()
    else if (l.trim() === '') { i++; break }
  }
  return { from, to, subject, text: lines.slice(i).join('\n') }
}

async function main() {
  const filter = process.argv[2]
  const files = readdirSync(CASES).filter((f) => f.endsWith('.json') && (!filter || f.includes(filter)))
  let failed = 0
  for (const file of files) {
    const c = JSON.parse(readFileSync(join(CASES, file), 'utf-8')) as Case
    const fx = parseFixture(readFileSync(join(FIXTURES, c.fixture), 'utf-8'))
    const started = Date.now()
    const out = await analyzeEmail({
      clientId: CLIENT_ID,
      clientName: 'Albasanz Express',
      schema: COURIER_V1_FIELDS,
      rules: null,
      examples: [],
      message: { from: fx.from, to: fx.to, subject: fx.subject, receivedAt: c.received_at, text: fx.text },
      attachmentsText: '',
      imageBlocks: [],
    })
    const problems: string[] = []
    if (out.kind !== c.expected.kind) problems.push(`kind: esperado ${c.expected.kind}, salió ${out.kind}`)
    if (c.expected.urgency_min && out.urgency < c.expected.urgency_min) problems.push(`urgency ${out.urgency} < ${c.expected.urgency_min}`)
    for (const [k, v] of Object.entries(c.expected.fields || {})) {
      if (out.fields[k] !== v) problems.push(`${k}: esperado ${JSON.stringify(v)}, salió ${JSON.stringify(out.fields[k])}`)
    }
    for (const [k, needle] of Object.entries(c.expected.contains || {})) {
      const val = String(out.fields[k] ?? '')
      if (!val.toLowerCase().includes(needle.toLowerCase())) problems.push(`${k} no contiene "${needle}": ${JSON.stringify(out.fields[k])}`)
    }
    for (const k of c.expected.must_be_null || []) {
      if (out.fields[k] !== null && out.fields[k] !== undefined) problems.push(`${k} debía ser null y salió ${JSON.stringify(out.fields[k])} (INVENTADO)`)
    }
    const ok = problems.length === 0
    if (!ok) failed++
    console.log(`${ok ? '✅' : '❌'} ${c.id} (${Date.now() - started} ms) — ${c.description}`)
    for (const p of problems) console.log(`     · ${p}`)
    if (!ok) console.log('     salida:', JSON.stringify({ kind: out.kind, urgency: out.urgency, summary: out.summary, fields: out.fields }, null, 0).slice(0, 900))
  }
  console.log(`\n${files.length - failed}/${files.length} casos en verde`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
