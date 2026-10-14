/**
 * ¿Cuánto cuesta UNA unidad de trabajo? Un documento de licitación (una memoria)
 * y una tanda de correos de Email Ops.
 *
 *   npx tsx --env-file=.env.local evals/consumo/coste-unidad.ts [días] [tanda]
 *   npx tsx --env-file=.env.local evals/consumo/coste-unidad.ts 45 10
 *
 * MIDE, no estima: lee `mira_usage_log` y lo tasa con el mismo estimador que usa
 * el freno de gasto (`estimateCostUsdWithCache`, con la ruta, para que la
 * escritura de caché a 1 h se cobre a 2× como en la lista de Anthropic). No
 * gasta nada: ni una llamada al modelo.
 *
 * Por qué existe: el 14-oct-2026 Carlos preguntó cuánto consume cada memoria de
 * Usoa y cada tanda de diez correos. Un entregable que cita cifras se GENERA;
 * a mano, en una semana miente. Si alguien vuelve a preguntar, se relanza esto.
 *
 * Las dos unidades no se miden igual, y es deliberado:
 *  · Un CORREO es una llamada (`lib/email-ops/extract.ts` tiene una sola), así
 *    que la tanda de N es N veces el reparto por llamada.
 *  · Una MEMORIA no es una llamada: es extraer el pliego, generar, completar y
 *    los turnos de chat alrededor. Se agrupan las filas `tender/*` por marca
 *    partiendo donde hay un hueco de más de HUECO_MIN minutos, y se cuenta
 *    cuántos `tender/generate` hay en cada grupo (uno = una memoria completa,
 *    21 secciones).
 */
import { createClient } from '@supabase/supabase-js'
import { estimateCostUsdWithCache, cachea1h } from '../../lib/anthropic-client'

const dias = Number(process.argv[2] || 45)
const TANDA = Number(process.argv[3] || 10)
/** Más de esto entre dos llamadas y se considera otra sesión de trabajo. */
const HUECO_MIN = 45

interface Fila {
  route: string | null
  model: string
  input_tokens: number
  output_tokens: number
  cache_creation_tokens: number | null
  cache_read_tokens: number | null
  created_at: string
  client_id: string
  used_client_key: boolean | null
}

const coste = (r: Fila) =>
  estimateCostUsdWithCache(r.model, r.input_tokens || 0, r.output_tokens || 0, r.cache_creation_tokens || 0, r.cache_read_tokens || 0, r.route)

const suma = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const media = (xs: number[]) => (xs.length ? suma(xs) / xs.length : 0)
const pctl = (xs: number[], p: number) => {
  if (!xs.length) return 0
  const o = [...xs].sort((a, b) => a - b)
  return o[Math.min(o.length - 1, Math.floor(p * o.length))]
}
const agrupar = <T>(xs: T[], clave: (x: T) => string): Map<string, T[]> => {
  const m = new Map<string, T[]>()
  for (const x of xs) m.set(clave(x), [...(m.get(clave(x)) || []), x])
  return m
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY: lánzalo con --env-file=.env.local')
  const db = createClient(url, key)

  const { data: clientes } = await db.from('clients').select('id,name,ai_budget_usd')
  const nombre = new Map((clientes || []).map((c) => [c.id as string, c.name as string]))
  const desde = new Date(Date.now() - dias * 86400e3).toISOString()

  const filas: Fila[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('mira_usage_log')
      .select('route,model,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens,created_at,client_id,used_client_key')
      .gte('created_at', desde).order('created_at').range(from, from + 999)
    if (error) throw error
    filas.push(...((data || []) as Fila[]))
    if (!data || data.length < 1000) break
  }
  // Con la clave del cliente el gasto es SUYO: no entra en lo que nos cuesta.
  const plat = filas.filter((f) => !f.used_client_key && f.route)

  console.log(`\n${'═'.repeat(76)}`)
  console.log(`COSTE POR UNIDAD · ${dias} días (desde ${desde.slice(0, 10)}) · ${plat.length} llamadas con la clave de plataforma`)
  console.log('═'.repeat(76))

  // ── UNA TANDA DE CORREOS ──────────────────────────────────────────────────
  const correos = plat.filter((f) => f.route === 'email-ops-extract')
  console.log(`\n\n■ EMAIL OPS · una tanda de ${TANDA} correos\n`)
  if (!correos.length) {
    console.log('  Sin llamadas de email-ops-extract en la ventana.')
  } else {
    const fila = (etiq: string, xs: Fila[]) => {
      const cs = xs.map(coste)
      console.log(
        '  ' + etiq.padEnd(26), String(xs.length).padStart(5),
        media(cs).toFixed(4).padStart(9), pctl(cs, 0.5).toFixed(4).padStart(9), pctl(cs, 0.9).toFixed(4).padStart(9),
        (media(cs) * TANDA).toFixed(2).padStart(9), (pctl(cs, 0.9) * TANDA).toFixed(2).padStart(9)
      )
    }
    console.log('  ' + ' '.repeat(26), 'corr.'.padStart(5), 'media$'.padStart(9), 'mediana$'.padStart(9), 'p90$'.padStart(9), `tanda${TANDA}$`.padStart(9), 'p90tanda'.padStart(9))
    fila('TODOS', correos)
    for (const [cid, xs] of [...agrupar(correos, (c) => c.client_id)].sort((a, b) => b[1].length - a[1].length)) fila(nombre.get(cid) || cid.slice(0, 8), xs)
    for (const [m, xs] of [...agrupar(correos, (c) => c.model)].sort((a, b) => b[1].length - a[1].length)) fila(`modelo ${m.replace('claude-', '')}`, xs)

    const cr = correos.filter((f) => (f.cache_read_tokens || 0) > 1000).length
    const sinCache = media(correos.map((f) => estimateCostUsdWithCache(f.model, (f.input_tokens || 0) + (f.cache_creation_tokens || 0) + (f.cache_read_tokens || 0), f.output_tokens || 0, 0, 0, f.route)))
    console.log(`\n  tokens por correo: in ${Math.round(media(correos.map((f) => f.input_tokens || 0)))} · cW ${Math.round(media(correos.map((f) => f.cache_creation_tokens || 0)))} · cR ${Math.round(media(correos.map((f) => f.cache_read_tokens || 0)))} · out ${Math.round(media(correos.map((f) => f.output_tokens || 0)))}`)
    console.log(`  aciertan la caché: ${cr}/${correos.length} (${Math.round((100 * cr) / correos.length)} %) · sin caché saldría a ${sinCache.toFixed(4)} $/correo`)
    const porDia = agrupar(correos, (c) => c.created_at.slice(0, 10))
    console.log(`  total ${suma(correos.map(coste)).toFixed(2)} $ · ${porDia.size} días con tráfico · media ${Math.round(correos.length / porDia.size)} correos/día, máx ${Math.max(...[...porDia.values()].map((v) => v.length))}`)
  }

  // ── UNA MEMORIA ───────────────────────────────────────────────────────────
  const tender = plat.filter((f) => f.route!.startsWith('tender/'))
  console.log(`\n\n■ LICITACIONES · una memoria\n`)
  if (!tender.length) {
    console.log('  Sin llamadas tender/* en la ventana.')
  } else {
    console.log('  ' + 'ruta'.padEnd(20), 'llam'.padStart(5), 'total$'.padStart(8), 'media$'.padStart(8), 'in'.padStart(7), 'cW'.padStart(7), 'cR'.padStart(7), 'out'.padStart(7), 'modelo')
    for (const [r, xs] of [...agrupar(tender, (t) => t.route!)].sort((a, b) => suma(b[1].map(coste)) - suma(a[1].map(coste)))) {
      const t = (sel: (f: Fila) => number) => Math.round(media(xs.map(sel))).toLocaleString('es-ES')
      console.log(
        '  ' + r.replace('tender/', '').padEnd(20), String(xs.length).padStart(5),
        suma(xs.map(coste)).toFixed(2).padStart(8), media(xs.map(coste)).toFixed(4).padStart(8),
        t((f) => f.input_tokens || 0).padStart(7), t((f) => f.cache_creation_tokens || 0).padStart(7),
        t((f) => f.cache_read_tokens || 0).padStart(7), t((f) => f.output_tokens || 0).padStart(7),
        ' ' + [...new Set(xs.map((x) => x.model.replace('claude-', '')))].join(',')
      )
    }

    // Sesiones de trabajo
    const sesiones: Array<{ cid: string; ini: string; filas: Fila[] }> = []
    for (const [cid, xs] of agrupar(tender, (t) => t.client_id)) {
      let actual: Fila[] = []
      for (const f of [...xs].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
        if (actual.length && +new Date(f.created_at) - +new Date(actual[actual.length - 1].created_at) > HUECO_MIN * 60000) {
          sesiones.push({ cid, ini: actual[0].created_at, filas: actual }); actual = []
        }
        actual.push(f)
      }
      if (actual.length) sesiones.push({ cid, ini: actual[0].created_at, filas: actual })
    }
    const nGen = (s: { filas: Fila[] }) => s.filas.filter((f) => f.route === 'tender/generate').length
    const conGen = sesiones.filter((s) => nGen(s) > 0).sort((a, b) => a.ini.localeCompare(b.ini))

    console.log(`\n  Sesiones que produjeron memoria (hueco de corte ${HUECO_MIN} min):\n`)
    for (const s of conGen) {
      const porR = agrupar(s.filas, (f) => f.route!.replace('tender/', ''))
      const desglose = [...porR.entries()].map(([r, xs]) => [r, suma(xs.map(coste))] as const).sort((a, b) => b[1] - a[1])
      console.log(`  ${s.ini.slice(0, 16).replace('T', ' ')}  ${(nombre.get(s.cid) || '?').slice(0, 14).padEnd(15)} ${String(s.filas.length).padStart(2)} llam · ${nGen(s)} mem · ${suma(s.filas.map(coste)).toFixed(2).padStart(5)} $ = ${desglose.map(([r, c]) => `${r} ${c.toFixed(2)}`).join(' + ')}`)
    }
    const cs = conGen.map((s) => suma(s.filas.map(coste)))
    const gens = suma(conGen.map(nGen))
    console.log(`\n  sesión completa: media ${media(cs).toFixed(2)} $ · mediana ${pctl(cs, 0.5).toFixed(2)} $ · mín ${Math.min(...cs).toFixed(2)} $ · máx ${Math.max(...cs).toFixed(2)} $`)
    console.log(`  POR MEMORIA (reparte cada sesión entre sus memorias): ${(suma(cs) / gens).toFixed(2)} $`)
    const gen = tender.filter((f) => f.route === 'tender/generate')
    console.log(`  solo la llamada que la escribe: ${media(gen.map(coste)).toFixed(2)} $ de media (${gen.length} veces)`)
  }

  // ── Encuadre y topes ──────────────────────────────────────────────────────
  console.log(`\n\n■ Para encuadrar\n`)
  const resto = plat.filter((f) => f.route !== 'email-ops-extract' && !f.route!.startsWith('tender/'))
  console.log(`  licitaciones ${suma(tender.map(coste)).toFixed(2)} $ · Email Ops ${suma(correos.map(coste)).toFixed(2)} $ · resto de MIRA ${suma(resto.map(coste)).toFixed(2)} $ · TOTAL ${suma(plat.map(coste)).toFixed(2)} $`)
  const cW1h = suma(plat.filter((f) => cachea1h(f.route)).map((f) => f.cache_creation_tokens || 0))
  console.log(`  escritura de caché a 1 h (se cobra a 2× la entrada): ${(cW1h / 1e6).toFixed(2)} M tokens`)
  console.log(`\n  Mes en curso frente al tope de cada marca:`)
  const mes = plat.filter((f) => f.created_at >= new Date().toISOString().slice(0, 7) + '-01')
  for (const [cid, xs] of [...agrupar(mes, (f) => f.client_id)].sort((a, b) => suma(b[1].map(coste)) - suma(a[1].map(coste)))) {
    const tope = clientes?.find((c) => c.id === cid)?.ai_budget_usd ?? 30
    const g = suma(xs.map(coste))
    if (g < 0.01) continue
    console.log(`    ${(nombre.get(cid) || '?').padEnd(22)} ${g.toFixed(2).padStart(6)} $ de ${String(tope).padStart(3)} $ (${Math.round((100 * g) / Number(tope || 1))} %)`)
  }
  console.log()
}

main().catch((e) => { console.error(e?.message || e); process.exit(1) })
