/**
 * Avisador de leads — un solo sitio para las cuatro webs.
 *
 * POR QUÉ EXISTE. Cada web avisaba por su cuenta con formsubmit.co, y el
 * 20-ago-2026 se descubrió que eso no puede funcionar desde un servidor:
 * **formsubmit devuelve 403 a las IP de Vercel**. El mismo envío desde una red
 * doméstica devuelve 200, así que el fallo era invisible en pruebas locales.
 * Los registros de producción de discoolver.com lo confirmaron: el lead se
 * guardaba, el enrutado al buzón correcto funcionaba, y el aviso se rechazaba.
 * Dos leads reales llevaban semanas marcados como no avisados sin que nadie lo
 * supiera — uno de ellos, un socio pidiendo información.
 *
 * EL DISEÑO. Las webs ya no avisan: solo GUARDAN en `leads`, que es su único
 * trabajo y el que nunca falla. Este proceso lee lo que está sin avisar y lo
 * manda por Resend. Ventajas sobre integrar Resend en cada web:
 *
 *  · Una integración en vez de cuatro, y las webs no se vuelven a tocar.
 *  · Funciona para la landing de MIRA, que es estática y no tiene servidor.
 *  · Rescata lo ya perdido: al encenderse salen los avisos atrasados.
 *  · Si un envío falla, la fila sigue sin avisar y se reintenta en la pasada
 *    siguiente. Antes un aviso perdido lo estaba para siempre.
 *
 * A QUÉ BUZÓN VA CADA UNO. Es la misma decisión que ya estaba en el código de
 * discoolver (`ROUTING` en su /api/waitlist), traída aquí para que viva en un
 * solo sitio ahora que el aviso es común.
 */

import { createAdminClient } from '@/lib/supabase/admin'

/** Una fila de `leads` tal y como la escriben las webs. */
interface Lead {
  id: string
  site: string
  source: string
  email: string
  locale: string | null
  payload: Record<string, unknown> | null
  created_at: string
}

/**
 * Buzón de destino por web y formulario. La clave es `site` o `site:source`
 * cuando una misma web reparte según quién tenga que contestar.
 */
const DESTINOS: Record<string, string> = {
  // Discoolver reparte en tres según quién contesta (decisión 20-ago-2026).
  'discoolver:360-demo': 'info@discoolver.com',
  'discoolver:360-destinos': 'info@discoolver.com',
  'discoolver:360-alojamientos': 'info@discoolver.com',
  'discoolver:360-agencias': 'info@discoolver.com',
  'discoolver:influencer': 'mk@discoolver.com',
  'discoolver:creator-guide': 'mk@discoolver.com',
  'discoolver:creator-video': 'mk@discoolver.com',
  discoolver: 'hello@discoolver.com',
  'mira-landing': 'info@startupsfactory.es',
  ncglobal: 'contact@ncglobalassets.com',
  salsa: 'info@salsaburgers.com',
}

/** El buzón que le toca a un lead, con respaldo para una web nueva. */
export function destinoDe(lead: Pick<Lead, 'site' | 'source'>): string {
  return (
    DESTINOS[`${lead.site}:${lead.source}`] ??
    DESTINOS[lead.site] ??
    process.env.LEADS_FALLBACK_EMAIL ??
    'info@startupsfactory.es'
  )
}

/** Asunto legible: quien abre la bandeja debe saber qué es sin entrar. */
function asunto(lead: Lead): string {
  const quien = typeof lead.payload?.name === 'string' ? ` — ${lead.payload.name}` : ''
  return `[${lead.site}] ${lead.source}${quien}`
}

/** El cuerpo, en texto plano: todos los campos, sin perder ninguno. */
function cuerpo(lead: Lead): string {
  const lineas = [
    `Web:     ${lead.site}`,
    `Form:    ${lead.source}`,
    `Email:   ${lead.email}`,
    `Idioma:  ${lead.locale ?? '—'}`,
    `Fecha:   ${lead.created_at}`,
    '',
  ]
  for (const [k, v] of Object.entries(lead.payload ?? {})) {
    if (v === null || v === undefined || v === '') continue
    lineas.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
  }
  lineas.push('', `Lead ${lead.id}`)
  return lineas.join('\n')
}

interface Resultado {
  pendientes: number
  enviados: number
  fallidos: number
  errores: string[]
  motivo?: string
}

/**
 * Envía los avisos que faltan y marca las filas. Nunca lanza: un fallo de
 * correo no debe tumbar el cron ni perder el lead, que ya está guardado.
 *
 * @param limite Tope por pasada, para no agotar la cuota si hay atasco.
 */
export async function avisarLeadsPendientes(limite = 25): Promise<Resultado> {
  const apiKey = process.env.RESEND_API_KEY
  const remitente = process.env.LEADS_FROM_EMAIL
  if (!apiKey || !remitente) {
    // Sin credenciales no se hace nada y se dice por qué. Los leads siguen
    // guardados y sin avisar, que es exactamente el estado recuperable.
    return { pendientes: 0, enviados: 0, fallidos: 0, errores: [], motivo: 'RESEND_API_KEY o LEADS_FROM_EMAIL sin configurar' }
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('leads')
    .select('id, site, source, email, locale, payload, created_at')
    .eq('notified', false)
    .order('created_at', { ascending: true })
    .limit(limite)

  if (error) return { pendientes: 0, enviados: 0, fallidos: 0, errores: [error.message] }

  const leads = (data ?? []) as Lead[]
  const res: Resultado = { pendientes: leads.length, enviados: 0, fallidos: 0, errores: [] }

  for (const lead of leads) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: remitente,
          to: [destinoDe(lead)],
          // Responder al aviso escribe a la persona, que es lo que uno espera.
          reply_to: lead.email,
          subject: asunto(lead),
          text: cuerpo(lead),
        }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!r.ok) {
        res.fallidos++
        res.errores.push(`${lead.id}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`)
        continue // sin marcar: se reintenta en la pasada siguiente
      }
      // Solo se marca DESPUÉS de que Resend confirme. Marcar antes convertiría
      // un fallo de envío en un lead perdido, que es lo que veníamos a evitar.
      const { error: upErr } = await db.from('leads').update({ notified: true }).eq('id', lead.id)
      if (upErr) {
        res.fallidos++
        res.errores.push(`${lead.id}: enviado pero no marcado — ${upErr.message}`)
        continue
      }
      res.enviados++
    } catch (e) {
      res.fallidos++
      res.errores.push(`${lead.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return res
}
