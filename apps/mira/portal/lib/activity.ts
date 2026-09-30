import { adminClient } from '@/lib/supabase'
import { toJson, writable } from '@/lib/db-json'

// Registro de actividad: qué páginas se abren, qué acciones se lanzan y qué
// errores devuelve la API, por usuario y marca.
//
// Nació el 30-sep porque Usoa entró a las 10:00 y no dejó ninguna huella: sin
// esto no hay forma de saber si solo miró o si algo le falló. Es deliberadamente
// pobre en datos: ruta, acción, un meta pequeño (tamaños, ids, código de error).
// NUNCA contenido de documentos ni texto de usuario.
//
// Fire-and-forget: registrar jamás puede ralentizar ni romper la petición que
// se registra. Si la escritura falla, se pierde el apunte y no pasa nada más.

export type ActivityKind = 'page' | 'action' | 'error'

export interface ActivityEntry {
  userId?: string | null
  clientId?: string | null
  kind: ActivityKind
  route: string
  meta?: Record<string, unknown>
}

/** Solo servidor. No espera a la escritura. */
export function logActivity(entry: ActivityEntry): void {
  try {
    const meta = entry.meta ? sanitizeMeta(entry.meta) : {}
    void adminClient()
      .from('mira_activity')
      .insert(writable({
        user_id: entry.userId || null,
        client_id: entry.clientId || null,
        kind: entry.kind,
        route: entry.route.slice(0, 200),
        meta: toJson(meta),
      }))
      .then(({ error }) => { if (error) console.error('[activity] no se pudo registrar', error.message) })
  } catch (err) {
    console.error('[activity] excepción al registrar', err)
  }
}

/** El meta se recorta: nada de textos largos, nada que huela a contenido. */
function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (v == null) continue
    if (typeof v === 'string') out[k] = v.slice(0, 200)
    else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v
    else if (Array.isArray(v)) out[k] = v.slice(0, 20).map((x) => (typeof x === 'string' ? x.slice(0, 120) : x))
    else if (typeof v === 'object') out[k] = JSON.stringify(v).slice(0, 300)
  }
  return out
}

/**
 * Registra el desenlace de una ruta de API en una sola línea: éxito con su
 * meta, o error con su código. Se usa así:
 *   const done = trackRoute('tender/generate', access)
 *   … ; done({ secciones: 10 })            // éxito
 *   … ; done.error(500, 'No se pudo…')      // fallo
 */
export function trackRoute(route: string, access: { userId?: string; clientId?: string } | null, meta: Record<string, unknown> = {}) {
  const started = Date.now()
  const base = { userId: access?.userId, clientId: access?.clientId, route }
  const done = (extra: Record<string, unknown> = {}) =>
    logActivity({ ...base, kind: 'action', meta: { ...meta, ...extra, ms: Date.now() - started } })
  done.error = (status: number, message?: string, extra: Record<string, unknown> = {}) =>
    logActivity({ ...base, kind: 'error', meta: { ...meta, ...extra, status, message: message?.slice(0, 200), ms: Date.now() - started } })
  return done
}
