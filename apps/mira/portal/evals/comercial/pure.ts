/**
 * Pruebas puras (sin red) de las fichas comerciales: esquema, coerción,
 * campos a revisar, memoria de precios.
 *   npx tsx evals/comercial/pure.ts
 */
import { FICHA_SCHEMA, parseFicha, parseFichaOutput, camposARevisar, buildFichaParams, extractJsonText, filaFicha } from '../../lib/comercial/fichas'
import { comparables, normalizarConcepto, normalizarUnidad, mediana } from '../../lib/comercial/comparables'

let failures = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`✅ ${name}`)
  else { failures++; console.log(`❌ ${name}`, detail !== undefined ? JSON.stringify(detail) : '') }
}

// ── esquema: sin tipos unión ni anulables (lección del 7-oct) ──────────────
const schemaText = JSON.stringify(FICHA_SCHEMA)
check('esquema sin null ni anyOf', !schemaText.includes('"null"') && !schemaText.includes('anyOf') && !schemaText.includes('oneOf'))
check('esquema: todos los objetos cierran additionalProperties', (schemaText.match(/"type":"object"/g) || []).length === (schemaText.match(/"additionalProperties":false/g) || []).length)

// ── parse / coerción ───────────────────────────────────────────────────────
const raw = {
  is_commercial: 'yes', document_kind: 'oferta', notes: 'Revisión IPC anual.',
  fichas: [{
    doc_kind: 'oferta', doc_date: '2025-03-14', customer_name: 'Clínica Dental Aurora, S.L.', customer_sector: 'sanidad', customer_contact: 'Marta Vilches (Administración)',
    service_scope: 'mixto', service_summary: 'Ruta diaria entre tres centros y laboratorio; urgentes moto; nacional 24 h.',
    conditions: [
      { concepto: 'Ruta diaria tres centros', importe: '38,00', unidad: 'por día', moneda: 'EUR', condiciones: 'lunes a viernes' },
      { concepto: 'Urgente moto dentro de la M-30', importe: '14.50', unidad: 'por servicio', moneda: '', condiciones: 'hasta 5 kg' },
      { concepto: 'Envío nacional 24 h', importe: '9.80', unidad: 'por envío', moneda: 'EUR', condiciones: 'hasta 2 kg' },
      { concepto: 'kg adicional nacional', importe: '1.290,50', unidad: 'por kg', moneda: 'EUR', condiciones: '' },
      { concepto: '', importe: '5', unidad: '', moneda: '', condiciones: '' },
    ],
    surcharges: [{ concepto: 'Combustible', importe: '3', unidad: '%' }, { concepto: 'Espera', importe: '6', unidad: 'EUR/15 min' }],
    discounts: '', payment_terms: 'Mensual, 30 días transferencia', commitments: [{ tipo: 'seguro', detalle: 'hasta 300 € por bulto' }, { tipo: '', detalle: 'aviso por correo en cada entrega' }, { tipo: 'plazo', detalle: '' }],
    volume_estimate: '22 días/mes y 15 urgentes', validity_from: '2025-04-01', validity_to: '2026-03-31', outcome: 'lo que sea',
    confidence: { customer_name: '1', service_scope: '0.6', conditions: '1', validity_to: '1', doc_date: '1', payment_terms: '0.95', commitments: '1' },
    evidence: { customer_name: 'Clínica Dental Aurora, S.L.', service_scope: 'tres centros de Madrid… red nacional', conditions: '38,00 € por día de servicio', validity_to: '31 de marzo de 2026', doc_date: '14 de marzo de 2025', payment_terms: 'pago a 30 días', commitments: 'Seguro de mercancía incluido' },
  }],
}
const out = parseFichaOutput(raw)
const f = out.fichas[0]
check('parseFichaOutput: comercial con 1 ficha', out.is_commercial && out.fichas.length === 1 && out.document_kind === 'oferta')
check('importes: coma decimal española y punto', f.conditions[0].importe === 38 && f.conditions[1].importe === 14.5)
check('importes: miles con punto y coma decimal', f.conditions[3].importe === 1290.5)
check('moneda vacía → EUR', f.conditions[1].moneda === 'EUR')
check('condición sin concepto se descarta', f.conditions.length === 4)
check('compromiso sin detalle se descarta; tipo vacío → otro', f.commitments.length === 2 && f.commitments[1].tipo === 'otro')
check('outcome inválido → desconocido', f.outcome === 'desconocido')
check('fechas válidas', f.validity_from === '2025-04-01' && f.doc_date === '2025-03-14')
check('confianza numérica acotada', f.confidence.service_scope === 0.6 && f.confidence.customer_name === 1)
check('no comercial → sin fichas', parseFichaOutput({ is_commercial: 'no', fichas: [{ customer_name: 'x' }] }).fichas.length === 0)
check('parseFicha tolera basura', parseFicha(null).customer_name === '' && parseFicha('x').conditions.length === 0)

// ── campos a revisar ───────────────────────────────────────────────────────
const revisar = camposARevisar(f as unknown as typeof f & Record<string, unknown>)
check('a revisar: deducido (0.6) y sin evidencia; no los literales', revisar.includes('service_scope') && revisar.includes('customer_sector') && revisar.includes('volume_estimate') && !revisar.includes('customer_name') && !revisar.includes('conditions'))
check('a revisar: desconocido/vacío no cuenta', !revisar.includes('outcome') && !revisar.includes('discounts'))

// ── petición ───────────────────────────────────────────────────────────────
const params = buildFichaParams('GTD Mensajeros', { title: 'Oferta', path: 'Clientes/Aurora/Oferta.docx', modified_at: '2025-03-14T10:00:00Z', text: 'x'.repeat(70_000) }) as { system: Array<{ text: string; cache_control?: unknown }>; messages: Array<{ content: string }>; output_config: { format: { type: string } } }
check('petición: system con caché 1 h y salida estructurada', !!params.system[0].cache_control && params.output_config.format.type === 'json_schema')
check('petición: documento recortado con aviso', params.messages[0].content.includes('documento recortado') && params.messages[0].content.length < 61_000)
check('extractJsonText saca el JSON del bloque', extractJsonText([{ type: 'text', text: 'pre {"a":1} post' }]) === '{"a":1}')
const fila = filaFicha('c1', 'd1', 'Clientes/Aurora/Oferta.docx', f, 1)
check('filaFicha: estado extracted y campos vacíos a null', fila.status === 'extracted' && fila.discounts === null && fila.customer_name === 'Clínica Dental Aurora, S.L.')

// ── comparables ────────────────────────────────────────────────────────────
check('normalizarConcepto', normalizarConcepto('  Urgente MOTO (M-30) ') === 'urgente moto m 30')
check('normalizarUnidad', normalizarUnidad('por servicio') === 'por envío' && normalizarUnidad('€/kg') === 'por kg' && normalizarUnidad('EUR/hora') === 'por hora')
check('mediana par e impar', mediana([1, 3, 2]) === 2 && mediana([1, 2, 3, 4]) === 2.5)
const fichas = [
  { id: 'a', customer_name: 'Aurora', customer_sector: 'sanidad', service_scope: 'local', doc_kind: 'oferta', doc_date: '2025-03-14', outcome: 'ganada', status: 'reviewed', conditions: [{ concepto: 'Urgente moto M-30', importe: 14.5, unidad: 'por servicio' }, { concepto: 'Ruta diaria', importe: 38, unidad: 'por día' }] },
  { id: 'b', customer_name: 'Museo', customer_sector: 'cultura', service_scope: 'local', doc_kind: 'tarifa', doc_date: '2024-06-01', outcome: 'desconocido', status: 'extracted', conditions: [{ concepto: 'Urgente moto', importe: 12, unidad: 'servicio' }, { concepto: 'Urgente moto', importe: null, unidad: 'servicio' }] },
  { id: 'c', customer_name: 'Brezo', customer_sector: 'editorial', service_scope: 'nacional', doc_kind: 'contrato', doc_date: '2024-10-02', outcome: 'ganada', status: 'reviewed', conditions: [{ concepto: 'Urgente moto', importe: 16, unidad: 'por servicio' }, { concepto: 'Palet completo', importe: 48, unidad: 'por palet' }] },
  { id: 'd', customer_name: 'Basura', customer_sector: '', service_scope: 'local', doc_kind: 'oferta', doc_date: '2025-01-01', outcome: 'perdida', status: 'discarded', conditions: [{ concepto: 'Urgente moto', importe: 99, unidad: 'por servicio' }] },
]
const todos = comparables(fichas, { q: 'urgente moto' })
check('comparables: agrupa por concepto+unidad, ignora descartadas e importes nulos', todos.length === 2 && todos[0].n === 2 && todos[0].min === 12 && todos[0].max === 16 && todos[0].mediana === 14)
check('comparables: último por fecha', todos[0].ultimo.importe === 16 && todos[0].ultimo.cliente === 'Brezo')
check('comparables: solo revisadas y ganadas', comparables(fichas, { q: 'urgente moto', soloRevisadas: true, soloGanadas: true }).reduce((a, c) => a + c.n, 0) === 2)
check('comparables: filtro de ámbito', comparables(fichas, { q: 'urgente', scope: 'nacional' })[0].ultimo.cliente === 'Brezo')
check('comparables: sin consulta devuelve todo ordenado por n', comparables(fichas)[0].concepto.toLowerCase().includes('urgente'))
check('comparables: búsqueda por prefijo («palet» encuentra «Palet completo»)', comparables(fichas, { q: 'palet' })[0].max === 48)

console.log(failures ? `\n❌ ${failures} fallos` : '\n✅ todo en verde')
process.exit(failures ? 1 : 0)
