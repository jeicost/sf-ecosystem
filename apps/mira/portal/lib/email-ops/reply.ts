import type { FieldDef, FieldValue } from './schema'
import { fieldLabel } from './schema'
import { camposARevisar } from './review'

// Responder al remitente desde el parte (Carlos, 7-oct-2026: «un botón para
// poder responder los correos»). Sin modelo y sin servidor de correo propio:
// se prepara un borrador a partir de los datos del parte y se abre en el
// cliente de correo de la persona (mailto:), que es desde donde la empresa ya
// escribe a sus clientes. Los datos que MIRA dedujo se piden confirmar en el
// propio texto, así la revisión la hace también el cliente.

export interface Borrador { to: string; subject: string; body: string; mailto: string }

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i

/** A quién se responde: a quien pidió el envío (reenvíos) si trae correo; si no, al remitente del último mensaje. */
export function destinatarioRespuesta(ticket: { original_sender?: string | null; from_address?: string | null }, messages: Array<{ from_address: string | null; received_at: string }> = []): string {
  const original = ticket.original_sender ? EMAIL_RE.exec(ticket.original_sender)?.[0] : null
  if (original) return original
  const ultimo = [...messages].sort((a, b) => (a.received_at < b.received_at ? 1 : -1)).find((m) => m.from_address && EMAIL_RE.test(m.from_address))
  return (ultimo?.from_address && EMAIL_RE.exec(ultimo.from_address)?.[0]) || (ticket.from_address && EMAIL_RE.exec(ticket.from_address)?.[0]) || ''
}

export function asuntoRespuesta(subject: string | null | undefined): string {
  const s = (subject || '').trim()
  if (!s) return 'RE: su solicitud de envío'
  return /^(re|rv|fwd?|fw):/i.test(s) ? s.replace(/^(fwd?|fw|rv):\s*/i, 'RE: ') : `RE: ${s}`
}

/** Valor legible de un campo para el correo. */
function texto(def: FieldDef, v: FieldValue | undefined): string | null {
  if (v === null || v === undefined || v === '') return null
  if (def.type === 'date') { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v)); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v) }
  if (def.type === 'number' && def.key === 'peso_kg') return `${v} kg`
  if (def.type === 'enum') return String(v)
  return String(v)
}

/**
 * Cuerpo del correo: confirmación de lo recibido, campo a campo, con «(por
 * favor, confírmenlo)» en lo que MIRA dedujo y una lista de lo que falta.
 */
export function cuerpoRespuesta(opts: {
  ticket: { fields?: Record<string, FieldValue> | null; confidence?: Record<string, number> | null; evidence?: Record<string, string> | null; manual_overrides?: Record<string, unknown> | null; missing_fields?: string[] | null; summary?: string | null }
  schema: readonly FieldDef[]
  firma: string
}): string {
  const { ticket, schema, firma } = opts
  const revisar = new Set(camposARevisar(ticket, schema).map((c) => c.key))
  const lineas: string[] = []
  for (const f of schema) {
    const v = texto(f, ticket.fields?.[f.key])
    if (!v) continue
    lineas.push(`- ${fieldLabel(f, 'es')}: ${v}${revisar.has(f.key) ? ' (por favor, confírmenlo)' : ''}`)
  }
  const faltan = (ticket.missing_fields || []).map((k) => schema.find((f) => f.key === k)).filter((f): f is FieldDef => !!f).map((f) => fieldLabel(f, 'es').toLowerCase())
  const partes = [
    'Buenos días:',
    '',
    `Hemos recibido su solicitud${ticket.summary ? ` (${ticket.summary.replace(/\.$/, '')})` : ''} y la hemos registrado con estos datos:`,
    '',
    ...(lineas.length ? lineas : ['- (sin datos registrados todavía)']),
    '',
  ]
  if (faltan.length) partes.push(`Para poder programar el servicio necesitamos que nos indiquen: ${faltan.join(', ')}.`, '')
  if (revisar.size) partes.push('Los datos marcados «por favor, confírmenlo» los hemos interpretado de su mensaje: si alguno no es correcto, indíquennoslo en respuesta a este correo.', '')
  partes.push('Quedamos a su disposición.', '', 'Un saludo,', firma)
  return partes.join('\n')
}

export function mailtoRespuesta(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function borradorRespuesta(opts: {
  ticket: Parameters<typeof cuerpoRespuesta>[0]['ticket'] & { original_sender?: string | null; from_address?: string | null; subject?: string | null }
  messages?: Array<{ from_address: string | null; received_at: string }>
  schema: readonly FieldDef[]
  firma: string
}): Borrador {
  const to = destinatarioRespuesta(opts.ticket, opts.messages)
  const subject = asuntoRespuesta(opts.ticket.subject)
  const body = cuerpoRespuesta({ ticket: opts.ticket, schema: opts.schema, firma: opts.firma })
  return { to, subject, body, mailto: mailtoRespuesta(to, subject, body) }
}
