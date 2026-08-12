/**
 * Evals v0 del motor de licitaciones (Pilar 1 del plan).
 *
 * El compromiso es: ningún cambio de prompt del motor de licitaciones va a
 * producción sin correr esto antes. Es el motor que factura — un criterio mal
 * extraído se traduce en puntos perdidos en una oferta real.
 *
 * Por qué la EXTRACCIÓN se puede evaluar sin juez LLM: la estructura de
 * puntuación está escrita literalmente en el pliego (grupos, criterios, puntos).
 * O el motor la reproduce o no. Eso hace el eval determinista y barato, sin la
 * circularidad de pedirle a un modelo que se corrija a sí mismo.
 *
 * Uso:
 *   cd apps/mira/portal
 *   npx tsx --env-file=.env.local evals/tender/run.ts            # todos los casos
 *   npx tsx --env-file=.env.local evals/tender/run.ts rtve       # filtra por id
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { extractTenderCriteria, type TenderCriteria } from '../../lib/generation/tender-memoria'

const HERE = dirname(fileURLToPath(import.meta.url))
const CASES = join(HERE, 'cases')
const FIXTURES = join(HERE, 'fixtures')

// Cliente sobre el que se corre (GTD: es el dueño de este corpus).
const CLIENT_ID = process.env.EVAL_CLIENT_ID || '3949b629-feec-4497-9d73-91214027cca1'

interface ExpectedCriterion { match: string; group: string; points: number | null }
interface Case {
  id: string
  description: string
  fixture: string
  expected: {
    expediente_contains?: string
    total_points?: number | null
    groups?: Record<string, { count: number; points: number }>
    criteria: ExpectedCriterion[]
  }
}

interface Check { name: string; pass: boolean; detail: string }

function checkCase(c: Case, got: TenderCriteria): Check[] {
  const checks: Check[] = []
  const list = got.criteria || []

  if (c.expected.expediente_contains) {
    const ok = (got.expediente || '').includes(c.expected.expediente_contains)
    checks.push({ name: 'expediente', pass: ok, detail: ok ? got.expediente! : `esperaba contener "${c.expected.expediente_contains}", obtuve "${got.expediente ?? '—'}"` })
  }

  if (c.expected.total_points !== undefined) {
    const ok = got.total_points === c.expected.total_points
    checks.push({ name: 'total_points', pass: ok, detail: `esperaba ${c.expected.total_points}, obtuve ${got.total_points}` })
  }

  // Grupos: nº de criterios y suma de puntos por grupo.
  for (const [group, exp] of Object.entries(c.expected.groups || {})) {
    const inGroup = list.filter((x) => x.group === group)
    const sum = inGroup.reduce((a, x) => a + (x.points || 0), 0)
    checks.push({
      name: `grupo:${group}`,
      pass: inGroup.length === exp.count && sum === exp.points,
      detail: `esperaba ${exp.count} criterios / ${exp.points} pts, obtuve ${inGroup.length} / ${sum}`,
    })
  }

  // Cada criterio esperado debe aparecer, en su grupo y con sus puntos.
  for (const exp of c.expected.criteria) {
    const re = new RegExp(exp.match, 'i')
    const hit = list.find((x) => re.test(x.name || ''))
    if (!hit) {
      checks.push({ name: `criterio:${exp.match}`, pass: false, detail: 'NO ENCONTRADO' })
      continue
    }
    const okGroup = hit.group === exp.group
    const okPoints = exp.points === null || hit.points === exp.points
    checks.push({
      name: `criterio:${exp.match}`,
      pass: okGroup && okPoints,
      detail: `"${hit.name}" grupo=${hit.group}${okGroup ? '' : ` (esperaba ${exp.group})`} pts=${hit.points}${okPoints ? '' : ` (esperaba ${exp.points})`}`,
    })
  }

  // Anti-alucinación: criterios de más que nadie pidió.
  const expectedCount = Object.values(c.expected.groups || {}).reduce((a, g) => a + g.count, 0)
  if (expectedCount) {
    const ok = list.length <= expectedCount
    checks.push({ name: 'sin criterios inventados', pass: ok, detail: `${list.length} criterios extraídos, ${expectedCount} esperados` })
  }

  return checks
}

async function main() {
  const filter = process.argv[2]
  const files = readdirSync(CASES).filter((f) => f.endsWith('.json') && (!filter || f.includes(filter)))
  if (!files.length) { console.error('Sin casos que correr.'); process.exit(1) }

  let totalChecks = 0, totalPass = 0, casesFailed = 0

  for (const file of files) {
    const c: Case = JSON.parse(readFileSync(join(CASES, file), 'utf8'))
    const pliego = readFileSync(join(FIXTURES, c.fixture), 'utf8')
    process.stdout.write(`\n▸ ${c.id} — extrayendo…`)

    let got: TenderCriteria
    try {
      got = await extractTenderCriteria(CLIENT_ID, pliego)
    } catch (e) {
      console.log(`\r▸ ${c.id} — ❌ el motor falló: ${e instanceof Error ? e.message : e}`)
      casesFailed++
      continue
    }

    const checks = checkCase(c, got)
    const pass = checks.filter((x) => x.pass).length
    totalChecks += checks.length; totalPass += pass
    if (pass < checks.length) casesFailed++

    console.log(`\r▸ ${c.id} — ${pass}/${checks.length} comprobaciones`)
    for (const ch of checks) {
      console.log(`   ${ch.pass ? '🟢' : '🔴'} ${ch.name.padEnd(34)} ${ch.detail}`)
    }
  }

  const pct = totalChecks ? Math.round((totalPass / totalChecks) * 100) : 0
  console.log(`\n${casesFailed === 0 ? '✅' : '⚠️ '} ${totalPass}/${totalChecks} comprobaciones (${pct}%) · ${files.length - casesFailed}/${files.length} casos limpios`)
  process.exit(casesFailed === 0 ? 0 : 1)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
