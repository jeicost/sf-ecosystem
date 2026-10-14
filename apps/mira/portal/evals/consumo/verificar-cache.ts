/**
 * ¿La caché está acertando, y la ventana de 1 HORA hace efecto?
 *
 *   npx tsx --env-file=.env.local evals/consumo/verificar-cache.ts [desde-ISO]
 *
 * No se le puede preguntar a la API: se deduce del registro. Para cada llamada
 * se mira el HUECO con la anterior de la misma marca y modelo (la caché es POR
 * MODELO) y si leyó caché. Lectura del resultado:
 *  · Si solo acierta con huecos < 5 min, el `ttl: '1h'` NO está aplicando.
 *  · Si acierta a los 15-60 min pero no a los > 60, la hora funciona.
 *  · Si acierta dentro de un mensaje (< 1 min) pero NO entre un mensaje y el
 *    siguiente, el problema no es la ventana: hay un bloque VOLÁTIL por delante
 *    del prefijo, que lo invalida. Eso fue el bloque de estado del chat hasta
 *    el 14-oct-2026 (137 tokens invalidando 60.000).
 *
 * Medido el 14-oct ANTES del arreglo: tender/chat acertaba el 100 % con huecos
 * < 5 min y el 50 % a los 5-60, reescribiendo 30-55k tokens por llamada;
 * email-ops-extract, que no tiene bloque volátil, el 85-88 % a los 5-60 min.
 * Después del arreglo, el chat debería parecerse a Email Ops.
 */
//   npx tsx --env-file=.env.local evals/consumo/verificar-cache.ts
import { createClient } from '@supabase/supabase-js'

interface Fila { route: string | null; model: string; input_tokens: number; cache_creation_tokens: number | null; cache_read_tokens: number | null; created_at: string; client_id: string; used_client_key: boolean | null }

const BANDAS = [
  { eti: '< 1 min', max: 60 },
  { eti: '1-5 min', max: 300 },
  { eti: '5-15 min', max: 900 },
  { eti: '15-60 min', max: 3600 },
  { eti: '> 60 min', max: Infinity },
]

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const filas: Fila[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('mira_usage_log')
      .select('route,model,input_tokens,cache_creation_tokens,cache_read_tokens,created_at,client_id,used_client_key')
      .gte('created_at', '2026-10-08').order('created_at').range(from, from + 999)
    if (error) throw error
    filas.push(...((data || []) as Fila[]))
    if (!data || data.length < 1000) break
  }
  const plat = filas.filter((f) => !f.used_client_key && f.route)

  for (const ruta of ['tender/chat', 'email-ops-extract']) {
    const xs = plat.filter((f) => f.route === ruta)
    if (!xs.length) continue
    console.log(`\n### ${ruta} — ${xs.length} llamadas desde el 8-oct (el día que se puso CACHE_1H)\n`)
    // Hueco respecto a la llamada anterior de la MISMA marca y modelo (la caché es por modelo)
    const porClave = new Map<string, Fila[]>()
    for (const f of xs) {
      const clave = `${f.client_id}|${f.model}`
      porClave.set(clave, [...(porClave.get(clave) || []), f])
    }
    const bandas = BANDAS.map((b) => ({ ...b, n: 0, conLectura: 0, leido: 0, escrito: 0 }))
    for (const [, lista] of porClave) {
      const ord = [...lista].sort((a, b) => a.created_at.localeCompare(b.created_at))
      for (let i = 1; i < ord.length; i++) {
        const seg = (+new Date(ord[i].created_at) - +new Date(ord[i - 1].created_at)) / 1000
        const b = bandas.find((x) => seg <= x.max)!
        b.n++
        const cr = ord[i].cache_read_tokens || 0
        if (cr > 1000) b.conLectura++
        b.leido += cr
        b.escrito += ord[i].cache_creation_tokens || 0
      }
    }
    console.log('hueco con la anterior'.padEnd(22), 'llam'.padStart(5), 'leen caché'.padStart(11), '%'.padStart(5), 'cR medio'.padStart(9), 'cW medio'.padStart(9))
    for (const b of bandas) {
      if (!b.n) continue
      console.log(
        b.eti.padEnd(22), String(b.n).padStart(5), String(b.conLectura).padStart(11),
        `${Math.round((100 * b.conLectura) / b.n)}%`.padStart(5),
        Math.round(b.leido / b.n).toString().padStart(9),
        Math.round(b.escrito / b.n).toString().padStart(9)
      )
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
