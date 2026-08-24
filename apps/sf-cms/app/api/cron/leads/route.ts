import { timingSafeEqual } from 'node:crypto'
import { avisarLeadsPendientes } from '@/lib/leads-notify'
import { captureError } from '@/lib/capture-error'

export const runtime = 'nodejs'

/**
 * Avisa por correo de los leads que las webs han guardado y nadie ha visto.
 *
 * Corre cada 10 minutos (ver vercel.json). Es deliberadamente aburrido: lee lo
 * que está sin avisar, lo manda por Resend y marca la fila. Toda la lógica vive
 * en lib/leads-notify; aquí solo está la autenticación y la respuesta.
 *
 * Se puede disparar a mano para no esperar:
 *   curl "https://cms.startupsfactory.es/api/cron/leads" -H "authorization: Bearer $CRON_SECRET"
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const res = await avisarLeadsPendientes()
    // Los fallos se devuelven en el cuerpo en vez de lanzar: el cron debe
    // terminar bien aunque un correo concreto no salga, porque el lead sigue
    // guardado y se reintenta solo en la pasada siguiente.
    return Response.json(res)
  } catch (e) {
    captureError(e, { route: 'cron/leads' })
    return Response.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 })
  }
}
