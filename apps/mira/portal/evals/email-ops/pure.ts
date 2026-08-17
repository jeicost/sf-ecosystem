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
import { htmlToText } from '../../lib/email-ops/pipeline'
import type { Extraction } from '../../lib/email-ops/types'

let failures = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`✅ ${name}`)
  else { failures++; console.log(`❌ ${name}`, detail !== undefined ? JSON.stringify(detail) : '') }
}

// ── threading ────────────────────────────────────────────────────────────
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

console.log(failures ? `\n❌ ${failures} fallos` : '\n✅ todo en verde')
process.exit(failures ? 1 : 0)
