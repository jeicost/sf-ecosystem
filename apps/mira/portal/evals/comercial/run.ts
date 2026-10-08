/**
 * Pasada REAL (gasta créditos, ~0,05 $) de la extracción de fichas sobre los
 * fixtures inventados de evals/comercial/fixtures. Sin lote, llamada directa,
 * para juzgar la calidad de la extracción antes de abrir el grifo del cron.
 *   EVAL_CLIENT_ID=<uuid> npx tsx --env-file=.env.local evals/comercial/run.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { extractFichasNow, camposARevisar } from '../../lib/comercial/fichas'

const CLIENT_ID = process.env.EVAL_CLIENT_ID || '3949b629-feec-4497-9d73-91214027cca1'
const DIR = join(__dirname, 'fixtures')

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const files = readdirSync(DIR).filter((f) => f.endsWith('.txt'))
  let fallos = 0
  for (const file of files) {
    const text = readFileSync(join(DIR, file), 'utf8')
    const t0 = Date.now()
    const out = await extractFichasNow(db, CLIENT_ID, { title: file, path: `Clientes/${file}`, text })
    const ms = Date.now() - t0
    console.log(`\n=== ${file} (${ms} ms) · comercial=${out.is_commercial} · tipo=${out.document_kind} · fichas=${out.fichas.length}${out.notes ? ` · notas: ${out.notes}` : ''}`)
    for (const f of out.fichas) {
      console.log(`  cliente: ${f.customer_name} (${f.customer_sector}) · ámbito ${f.service_scope} · ${f.doc_date} · vigencia ${f.validity_from}→${f.validity_to} · ${f.outcome}`)
      console.log(`  servicio: ${f.service_summary}`)
      for (const c of f.conditions) console.log(`    - ${c.concepto}: ${c.importe} ${c.moneda} ${c.unidad}${c.condiciones ? ` (${c.condiciones})` : ''}`)
      if (f.surcharges.length) console.log(`  recargos: ${f.surcharges.map((s) => `${s.concepto} ${s.importe} ${s.unidad}`).join(' · ')}`)
      if (f.commitments.length) console.log(`  compromisos: ${f.commitments.map((c) => `${c.tipo}: ${c.detalle}`).join(' · ')}`)
      console.log(`  pago: ${f.payment_terms} · volumen: ${f.volume_estimate} · descuentos: ${f.discounts || '—'}`)
      console.log(`  a revisar: ${camposARevisar(f as unknown as typeof f & Record<string, unknown>).join(', ') || 'nada'}`)
    }
    // Expectativas mínimas por fixture
    if (file.startsWith('oferta-clinica')) {
      const f = out.fichas[0]
      const ok = !!f && /aurora/i.test(f.customer_name) && f.conditions.some((c) => c.importe === 38) && f.conditions.some((c) => c.importe === 14.5) && f.validity_to === '2026-03-31' && f.surcharges.some((s) => s.importe === 3)
      console.log(ok ? '  ✅ oferta: cliente, 38 €, 14,50 €, vigencia y recargo 3 %' : '  ❌ oferta: faltan datos clave'); if (!ok) fallos++
    }
    if (file.startsWith('contrato-editorial')) {
      const f = out.fichas[0]
      const ok = !!f && /brezo/i.test(f.customer_name) && f.conditions.some((c) => c.importe === 0.42) && f.conditions.some((c) => c.importe === 48) && f.validity_from === '2024-11-01' && f.commitments.some((c) => /penaliz/i.test(c.tipo) || /50 %|50%/.test(c.detalle))
      console.log(ok ? '  ✅ contrato: cliente, 0,42 €/kg, 48 €/palet, vigencia y penalización' : '  ❌ contrato: faltan datos clave'); if (!ok) fallos++
    }
    if (file.startsWith('manual')) {
      const ok = !out.is_commercial && out.fichas.length === 0
      console.log(ok ? '  ✅ manual: no comercial, sin fichas' : '  ❌ manual: debería no ser comercial'); if (!ok) fallos++
    }
  }
  console.log(fallos ? `\n❌ ${fallos} fallos` : '\n✅ extracción correcta en los 3 fixtures')
  process.exit(fallos ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })
