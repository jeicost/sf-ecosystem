/**
 * Pruebas puras (sin red, sin BD) de Email Ops: threading, merge, prioridad,
 * coerción del esquema y firma Svix del webhook.
 *
 *   npx tsx evals/email-ops/pure.ts
 */
import { createHmac } from 'crypto'
import { normalizeSubject, isGenericSubject, newThreadKey } from '../../lib/email-ops/threading'
import { mergeExtractionIntoTicket, applyManualFields, emptyTicketState } from '../../lib/email-ops/merge'
import { computePriority } from '../../lib/email-ops/priority'
import { COURIER_V1_FIELDS, coerceFields, computeMissingFields, requiredFieldsFor } from '../../lib/email-ops/schema'
import { verifySvixSignature, parseInboundEvent, extractAddress, extractDisplayName } from '../../lib/email-ops/resend-inbound'
import { validateExtraction } from '../../lib/email-ops/extract'
import { htmlToText, autoReplyReason } from '../../lib/email-ops/pipeline'
import { sniffImageType } from '../../lib/vision'
import type { Extraction } from '../../lib/email-ops/types'
import { motivoRevision, camposARevisar, cuentaRevision } from '../../lib/email-ops/review'
import { destinatarioRespuesta, asuntoRespuesta, cuerpoRespuesta, borradorRespuesta } from '../../lib/email-ops/reply'
import { parseRecipients, puedeResponder, smtpConfigFor, threadHeaders, aplicarModoPrueba, validarBorrador, filaEnviada } from '../../lib/email-ops/send'

let failures = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`✅ ${name}`)
  else { failures++; console.log(`❌ ${name}`, detail !== undefined ? JSON.stringify(detail) : '') }
}

// ── threading ────────────────────────────────────────────────────────────
// Filtro barato de automáticos (1-oct): sin modelo para rebotes y out-of-office.
check('autoReplyReason: respuesta automática', autoReplyReason('ana@cliente.es', 'Respuesta automática: PROBLEMAS CON LA LLEGADA') !== null)
check('autoReplyReason: no-reply', autoReplyReason('"GLS" <no-reply@gls-spain.es>', 'Tu envío') !== null)
check('autoReplyReason: mailer-daemon', autoReplyReason('MAILER-DAEMON@mx.es', 'Undelivered Mail Returned to Sender') !== null)
check('autoReplyReason: encargo real pasa', autoReplyReason('maria@museo.es', 'Recogida en Museoteca envío internacional') === null)
check('autoReplyReason: RE: INCIDENCIAS pasa (lo decide el modelo)', autoReplyReason('ops@cliente.es', 'RE: INCIDENCIAS.') === null)
check('sniffImageType: PNG', sniffImageType(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0,0])) === 'image/png')
check('sniffImageType: JPEG declarado como png', sniffImageType(Buffer.from([0xff,0xd8,0xff,0xe0,0,0x10,0x4a,0x46,0x49,0x46,0,1])) === 'image/jpeg')
check('sniffImageType: PDF no es imagen', sniffImageType(Buffer.from('%PDF-1.4 hola mundo')) === null)
check('normalizeSubject quita RE/FW anidados', normalizeSubject('RE: Fwd: RV: Recogida urgente  mañana') === 'recogida urgente mañana')
check('normalizeSubject con [n]', normalizeSubject('Re[2]: Pedido 4411') === 'pedido 4411')
check('isGenericSubject', isGenericSubject('pedido') && !isGenericSubject('pedido 4411'))
check('newThreadKey limpia <>', newThreadKey('<abc@x.es>', 'r1') === 'msg:abc@x.es' && newThreadKey(null, 'r1') === 'msg:r1')

// ── schema ───────────────────────────────────────────────────────────────
const schema = COURIER_V1_FIELDS
const required = requiredFieldsFor(schema, null)
const coerced = coerceFields(schema, { fecha: '18/08/2026', recogida_hora_inicio: '9h', bultos: '3 cajas', peso_kg: '24,5', tipo_entrega: 'Nacional', medidas: '', entrega_hora_fin: '25:00' })
check('coerce fecha dd/mm/yyyy', coerced.fecha === '2026-08-18', coerced.fecha)
check('coerce hora 9h', coerced.recogida_hora_inicio === '09:00', coerced.recogida_hora_inicio)
check('coerce bultos', coerced.bultos === 3, coerced.bultos)
check('coerce peso coma', coerced.peso_kg === 24.5, coerced.peso_kg)
check('coerce enum minúsculas', coerced.tipo_entrega === 'nacional')
check('coerce vacío → null', coerced.medidas === null)
check('coerce hora inválida → null', coerced.entrega_hora_fin === null)
check('missing fields', computeMissingFields(coerced, required).includes('recogida_direccion') && !computeMissingFields(coerced, required).includes('fecha'))

// ── validateExtraction ───────────────────────────────────────────────────
const raw = { kind: 'shipment_request', summary: 'x', urgency: 9, fields: { fecha: '2026-08-18', bultos: 3 }, confidence: { fecha: 2, bultos: 0.9 }, evidence: { fecha: 'mañana 18/08' } }
const ext = validateExtraction(raw, schema)
check('urgency acotada a 5', ext.urgency === 5)
check('confianza acotada a 1', ext.confidence.fecha === 1 && ext.confidence.bultos === 0.9)
check('campo ausente → null y conf 0', ext.fields.remitente === null && ext.confidence.remitente === 0)

// ── merge ────────────────────────────────────────────────────────────────
const e1: Extraction = { kind: 'shipment_request', summary: 'Recogida 3 cajas', original_sender: 'Marta', urgency: 4, notes: null,
  fields: { ...coerceFields(schema, {}), fecha: '2026-08-18', recogida_hora_inicio: '09:00', recogida_hora_fin: '11:00', bultos: 3, recogida_direccion: 'Alcobendas', entrega_direccion: 'Sevilla', remitente: 'Marta', destinatario: 'Farmacia', tipo_entrega: 'nacional' },
  confidence: { fecha: 1, recogida_hora_inicio: 1, recogida_hora_fin: 1, bultos: 1, recogida_direccion: 1, entrega_direccion: 1, remitente: 0.9, destinatario: 0.9, tipo_entrega: 0.7 }, evidence: {} }
const ctx = { schema, required, receivedAt: '2026-08-17T09:30:00Z' }
const s1 = mergeExtractionIntoTicket(null, e1, ctx)
check('merge inicial: kind y count', s1.kind === 'shipment_request' && s1.message_count === 1)
check('merge inicial: denormalizados', s1.service_date === '2026-08-18' && s1.delivery_type === 'nacional')
check('merge inicial: missing', s1.missing_fields.length === 0, s1.missing_fields)

const e2: Extraction = { kind: 'shipment_request', summary: 'Cambio de hora', original_sender: null, urgency: 3, notes: null,
  fields: { ...coerceFields(schema, {}), recogida_hora_inicio: '12:00', recogida_hora_fin: '13:00' },
  confidence: { recogida_hora_inicio: 1, recogida_hora_fin: 1 }, evidence: {} }
const s2 = mergeExtractionIntoTicket(s1, e2, { ...ctx, receivedAt: '2026-08-17T11:15:00Z' })
check('merge respuesta: actualiza hora, conserva resto', s2.fields.recogida_hora_inicio === '12:00' && s2.fields.recogida_direccion === 'Alcobendas' && s2.message_count === 2)
check('merge respuesta: summary del encargo se conserva', s2.summary === 'Recogida 3 cajas', s2.summary)
check('merge respuesta: urgency = max, first_message conservado', s2.urgency === 4 && s2.first_message_at === '2026-08-17T09:30:00Z' && s2.last_message_at === '2026-08-17T11:15:00Z')

const e3: Extraction = { ...e2, kind: 'other', summary: 'Gracias', fields: coerceFields(schema, {}), confidence: {} }
const s3 = mergeExtractionIntoTicket(s2, e3, { ...ctx, receivedAt: '2026-08-17T12:00:00Z' })
check('merge "gracias": kind no baja a other', s3.kind === 'shipment_request')

const manual = applyManualFields(s2, { bultos: 4, peso_kg: 24 }, 'user-1', { schema, required, now: '2026-08-17T12:30:00Z' })
check('applyManualFields registra cambios y overrides', manual.changed.length === 2 && !!manual.state.manual_overrides.bultos && manual.state.confidence.bultos === 1)
const e4: Extraction = { ...e2, fields: { ...coerceFields(schema, {}), bultos: 99 }, confidence: { bultos: 1 } }
const s4 = mergeExtractionIntoTicket(manual.state, e4, { ...ctx, receivedAt: '2026-08-17T13:00:00Z' })
check('merge nunca pisa un override manual', s4.fields.bultos === 4)

// ── priority ─────────────────────────────────────────────────────────────
const now = new Date('2026-08-17T10:00:00')
const pUrgent = computePriority({ fields: { fecha: '2026-08-17', recogida_hora_inicio: '12:00', tipo_entrega: 'internacional' }, urgency: 5, missing_fields: [], first_message_at: '2026-08-17T09:00:00' }, now)
const pLater = computePriority({ fields: { fecha: '2026-08-25', recogida_hora_inicio: '09:00', tipo_entrega: 'local' }, urgency: 2, missing_fields: [], first_message_at: '2026-08-17T09:00:00' }, now)
check('priority urgente > lejano', pUrgent > pLater && pUrgent <= 100 && pLater >= 0, { pUrgent, pLater })
check('priority incompleto suma', computePriority({ fields: {}, urgency: 3, missing_fields: ['fecha'], first_message_at: null }, now) === 15 + 12 + 5)

// ── webhook ──────────────────────────────────────────────────────────────
const secretRaw = Buffer.from('supersecretkey-for-tests-1234567890').toString('base64')
const secret = `whsec_${secretRaw}`
const body = JSON.stringify({ type: 'email.received', data: { email_id: 'em_1', from: 'Marta <marta@x.es>', to: ['albasanz-operaciones@in.mira.test'], subject: 'Hola', attachments: [{ id: 'att_1', filename: 'a.pdf', content_type: 'application/pdf' }] } })
const ts = String(Math.floor(Date.now() / 1000))
const sig = createHmac('sha256', Buffer.from(secretRaw, 'base64')).update(`msg_1.${ts}.${body}`).digest('base64')
const headers = (h: Record<string, string>) => ({ get: (k: string) => h[k.toLowerCase()] ?? null })
check('svix firma válida', verifySvixSignature(body, headers({ 'svix-id': 'msg_1', 'svix-timestamp': ts, 'svix-signature': `v1,${sig}` }), secret))
check('svix firma con varias entradas', verifySvixSignature(body, headers({ 'svix-id': 'msg_1', 'svix-timestamp': ts, 'svix-signature': `v1,AAAA v1,${sig}` }), secret))
check('svix firma inválida', !verifySvixSignature(body + ' ', headers({ 'svix-id': 'msg_1', 'svix-timestamp': ts, 'svix-signature': `v1,${sig}` }), secret))
check('svix timestamp viejo', !verifySvixSignature(body, headers({ 'svix-id': 'msg_1', 'svix-timestamp': String(Number(ts) - 900), 'svix-signature': `v1,${sig}` }), secret))
const evt = parseInboundEvent(JSON.parse(body))
check('parseInboundEvent', !!evt && evt.emailId === 'em_1' && evt.attachments.length === 1 && evt.to[0].includes('albasanz'))
check('parseInboundEvent ignora otros', parseInboundEvent({ type: 'email.sent', data: {} }) === null)
check('extractAddress/name', extractAddress('Marta Ruiz <Marta@X.es>') === 'marta@x.es' && extractDisplayName('Marta Ruiz <m@x.es>') === 'Marta Ruiz')

// ── html → texto ─────────────────────────────────────────────────────────
check('htmlToText', htmlToText('<div>Hola<br>mundo &amp; <b>fin</b></div><style>x{}</style>') === 'Hola\nmundo & fin')


// ── Revisión de lo deducido y respuesta al remitente (7-oct-2026) ──
check('revisión: literal (1) no se marca', motivoRevision('Madrid', 1, 'Madrid', false) === null)
check('revisión: deducido (0.6) se marca', motivoRevision('local', 0.6, 'ambas en Madrid', false) === 'deducido')
check('revisión: ambiguo (0.3)', motivoRevision('2026-10-08', 0.3, 'mañana', false) === 'ambiguo')
check('revisión: con valor y sin evidencia', motivoRevision(3, 1, '', false) === 'sin-evidencia')
check('revisión: corregido a mano no se marca', motivoRevision('x', 0.3, '', true) === null)
check('revisión: vacío no se marca', motivoRevision(null, 0, '', false) === null)
const tk = { fields: { fecha: '2026-10-08', tipo_entrega: 'local', bultos: 2, remitente: 'Museo' }, confidence: { fecha: 0.6, tipo_entrega: 0.6, bultos: 1, remitente: 1 }, evidence: { fecha: 'mañana', tipo_entrega: 'Madrid → Madrid', bultos: 'dos sobres', remitente: 'Museo' }, manual_overrides: {}, missing_fields: ['recogida_direccion'], summary: 'Recogida de dos sobres', original_sender: null, from_address: 'Ana <ana@museo.es>', subject: 'Fwd: Recogida urgente' }
const rev = camposARevisar(tk, COURIER_V1_FIELDS)
check('camposARevisar: fecha y tipo_entrega deducidos, bultos y remitente no', rev.map((r) => r.key).sort().join(',') === 'fecha,tipo_entrega' && cuentaRevision(tk) === 2)
check('destinatario: el correo del remitente aunque venga con nombre', destinatarioRespuesta(tk) === 'ana@museo.es')
check('destinatario: original_sender manda si trae correo', destinatarioRespuesta({ original_sender: 'Pepe <pepe@cliente.com>', from_address: 'ana@museo.es' }) === 'pepe@cliente.com')
check('asunto: RE: y sin Fwd', asuntoRespuesta('Fwd: Recogida urgente') === 'RE: Recogida urgente' && asuntoRespuesta('RE: x') === 'RE: x' && asuntoRespuesta(null) === 'RE: su solicitud de envío')
const cuerpo = cuerpoRespuesta({ ticket: tk, schema: COURIER_V1_FIELDS, firma: 'Equipo de operaciones · GLS' })
check('cuerpo: fecha en dd/mm/yyyy y marcada para confirmar; bultos sin marca', cuerpo.includes('Fecha: 08/10/2026 (por favor, confírmenlo)') && cuerpo.includes('Bultos: 2') && !cuerpo.includes('Bultos: 2 (por favor'))
check('cuerpo: pide lo que falta y firma', cuerpo.includes('necesitamos que nos indiquen: dirección de recogida') && cuerpo.trim().endsWith('Equipo de operaciones · GLS'))
const b = borradorRespuesta({ ticket: tk, schema: COURIER_V1_FIELDS, firma: 'Ops' })
check('mailto: destinatario, asunto y cuerpo codificados', b.mailto.startsWith('mailto:ana%40museo.es?subject=RE%3A%20Recogida%20urgente&body=Buenos') && decodeURIComponent(b.mailto.split('&body=')[1]).includes('Fecha: 08/10/2026'))


// ── responder desde el buzón (8-oct) ─────────────────────────────────────
check('parseRecipients: limpia, baja a minúsculas, quita nombres y duplicados', JSON.stringify(parseRecipients('María <Maria@Museo.es>, ops@x.es; maria@museo.es\nmal')) === JSON.stringify(['maria@museo.es', 'ops@x.es']))
check('puedeResponder: IMAP completo sí', puedeResponder({ source: 'imap', imap_host: 'imap.x.es', imap_user: 'a@x.es', imap_password: 'enc', ms_connection_id: null }).ok)
check('puedeResponder: reenvío no', !puedeResponder({ source: 'resend', imap_host: null, imap_user: null, imap_password: null, ms_connection_id: null }).ok)
check('puedeResponder: Microsoft sin conexión no', JSON.stringify(puedeResponder({ source: 'microsoft', imap_host: null, imap_user: null, imap_password: null, ms_connection_id: null })) === JSON.stringify({ ok: false, reason: 'ms-disconnected' }))
check('smtpConfigFor: deriva imap.→smtp. 465 SSL', JSON.stringify(smtpConfigFor({ imap_host: 'imap.serviciodecorreo.es', smtp_host: null, smtp_port: null, smtp_secure: null })) === JSON.stringify({ host: 'smtp.serviciodecorreo.es', port: 465, secure: true }))
check('smtpConfigFor: explícito manda', smtpConfigFor({ imap_host: 'imap.x.es', smtp_host: 'mail.x.es', smtp_port: 587, smtp_secure: false }).port === 587)
const hilo = threadHeaders([
  { message_id: '<a@x>', references_ids: [], received_at: '2026-10-08T07:00:00Z', direction: 'inbound' },
  { message_id: '<mia@mira>', references_ids: ['<a@x>'], received_at: '2026-10-08T08:00:00Z', direction: 'outbound' },
  { message_id: '<b@x>', references_ids: ['<a@x>'], received_at: '2026-10-08T09:00:00Z', direction: 'inbound' },
])
check('threadHeaders: responde al último recibido, no al enviado', hilo.inReplyTo === '<b@x>' && JSON.stringify(hilo.references) === JSON.stringify(['<a@x>', '<b@x>']))
check('threadHeaders: sin recibidos → vacío', threadHeaders([]).inReplyTo === null)
const base = { to: ['cliente@museo.es'], cc: ['ops@museo.es'], subject: 'RE: Recogida', body: 'Hola' }
const prueba = aplicarModoPrueba(base, 'Carlos@StartupsFactory.es')
check('modo prueba: redirige, marca asunto y avisa del destino original', prueba.test && prueba.draft.to[0] === 'carlos@startupsfactory.es' && prueba.draft.cc.length === 0 && prueba.draft.subject === '[PRUEBA] RE: Recogida' && prueba.draft.body.includes('cliente@museo.es') && prueba.draft.body.includes('cc ops@museo.es') && prueba.draft.body.endsWith('Hola'))
check('modo prueba: sin dirección no cambia nada', !aplicarModoPrueba(base, '').test && aplicarModoPrueba(base, null).draft === base)
check('modo prueba: dirección inválida = apagado', !aplicarModoPrueba(base, 'no-es-correo').test)
check('validarBorrador: falta destinatario', !validarBorrador({ to: '', subject: 'x', body: 'y' }).ok)
check('validarBorrador: asunto sin saltos y cc sin repetir el para', (() => { const v = validarBorrador({ to: 'a@x.es', cc: 'a@x.es, b@x.es', subject: 'Hola\nmundo', body: 'ok' }); return v.ok && v.draft.subject === 'Hola mundo' && JSON.stringify(v.draft.cc) === JSON.stringify(['b@x.es']) })())
const fila = filaEnviada({ ticket: { id: 't1', client_id: 'c1', inbox_id: 'i1', thread_key: 'msg:a@x' }, inbox: { address: 'gtd.local@gtdmensajeros.es', display_name: 'GTD Local' }, draft: base, messageId: '<m@gtd>', inReplyTo: '<b@x>', references: ['<a@x>', '<b@x>'], sentBy: 'u1', now: '2026-10-08T10:00:00Z' })
check('filaEnviada: outbound/sent, hilo y buzón del parte', fila.direction === 'outbound' && fila.status === 'sent' && fila.thread_key === 'msg:a@x' && fila.from_address === 'gtd.local@gtdmensajeros.es' && fila.resend_email_id.startsWith('sent:') && fila.in_reply_to === '<b@x>' && fila.text_body === 'Hola')

console.log(failures ? `\n❌ ${failures} fallos` : '\n✅ todo en verde')
process.exit(failures ? 1 : 0)
