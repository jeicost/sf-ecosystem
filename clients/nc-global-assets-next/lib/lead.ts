/**
 * Guardar el lead antes de darlo por bueno.
 *
 * POR QUÉ. Esta landing enviaba a formsubmit y no guardaba nada: si el tercero
 * fallaba, el dato desaparecía. Y encima redirigía a /thank-you pasara lo que
 * pasara, así que nadie se enteraba nunca. La auditoría del 20-ago-2026 lo
 * confirmó en producción.
 *
 * Mismo patrón que discoolver.com desde el 13-ago: la base de datos es el
 * destino y el correo es el aviso. Si el aviso falla, el lead ya está a salvo
 * y `notified: false` marca cuáles hay que repescar a mano.
 *
 * POR QUÉ DESDE EL NAVEGADOR. Se hace desde el navegador por coherencia con las otras webs y
 * porque el envío del aviso ya vive ahí. Se escribe con la anon key, que es
 * pública por diseño y cuya política solo permite INSERT en `leads`: no puede
 * leer los leads, ni editarlos, ni tocar ninguna otra tabla del CMS. Alguien
 * podría meter filas basura; se asume, porque el spam se filtra en un minuto y
 * un lead perdido no se recupera nunca (migración 017 de sf-cms).
 */

const URL_BASE = process.env.NEXT_PUBLIC_LEADS_SUPABASE_URL?.replace(/\/$/, '')
const ANON = process.env.NEXT_PUBLIC_LEADS_SUPABASE_ANON_KEY

export interface Lead {
  source: string
  email: string
  locale?: string
  /** El resto de campos del formulario, tal cual. */
  payload?: Record<string, string>
  /** Si el aviso por correo llegó a salir. */
  notified: boolean
}

/**
 * Devuelve true si la fila quedó escrita. Nunca lanza: quien llama decide qué
 * enseñar, y un fallo aquí no debe romper el formulario.
 */
export async function guardarLead(lead: Lead): Promise<boolean> {
  if (!URL_BASE || !ANON) return false
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        // Sin política de SELECT, pedir la fila de vuelta hace fallar el INSERT
        // entero. Obligatorio, no es una optimización.
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        site: "ncglobal",
        source: lead.source,
        email: lead.email,
        locale: lead.locale ?? 'es',
        payload: lead.payload ?? {},
        notified: lead.notified,
      }),
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false
  }
}
