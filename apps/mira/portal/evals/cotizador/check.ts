// Comprobación de las piezas puras del Cotizador. Sin red, sin BD, gratis.
//   npx tsx evals/cotizador/check.ts
import { missingForQuote, isQuotable, mergeEngineMissing } from '../../lib/cotizador/readiness'
import { prefillFromTicket, postalCodeFrom, dimensionsFrom } from '../../lib/cotizador/prefill'
import {
  hasUsablePrice, usableOption, optionCurrency, classifyOutcome, engineMissingFields, canonicalQuoteRequest,
  type QuoteResponse,
} from '../../lib/cotizador/contract'
import { sanitizeEngineMessage } from '../../lib/cotizador/client'
import { unusableReason } from '../../lib/cotizador/contract'
import { cleanPatch, stateAfterSave, quoteErrorFor, type QuoteShipment } from '../../lib/cotizador/store'
import { readFileSync } from 'fs'
import { join } from 'path'

let pass = 0, fail = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, detail !== undefined ? JSON.stringify(detail) : '') }
}

console.log('\nCP dentro de direcciones libres')
check('coge el CP y no el número de nave',
  postalCodeFrom('Laboratorios Norte, C/ Valportillo Primera 12, nave 4, 28108 Alcobendas (Madrid)') === '28108')
check('coge el CP al final',
  postalCodeFrom('Hospital Virgen del Rocío, Av. Manuel Siurot s/n, 41013 Sevilla') === '41013')
check('el caso de control de Almería',
  postalCodeFrom('Pol. Ind. La Redonda, 04810 Oria (Almería)') === '04810')
check('sin CP devuelve null', postalCodeFrom('Calle Mayor s/n, Madrid') === null)
check('no confunde un teléfono de 9 cifras', postalCodeFrom('Contacto 616223344, Madrid') === null)
check('no acepta provincia 53+', postalCodeFrom('Zona 53001 inventada') === null)

console.log('\nMedidas')
check('60 x 40 x 40 cm', JSON.stringify(dimensionsFrom('60 x 40 x 40 cm')) === '[60,40,40]')
check('60x80x60', JSON.stringify(dimensionsFrom('60x80x60')) === '[60,80,60]')
check('decimales con coma', JSON.stringify(dimensionsFrom('60,5 × 40 × 40')) === '[60.5,40,40]')
check('dos medidas no valen', dimensionsFrom('60 x 40') === null)
check('texto libre no vale', dimensionsFrom('varias medidas') === null)
// La unidad se LEE y se convierte. Sin esto, un palet en metros salia como
// 1,2 cm y uno en milimetros como seis metros de largo (28-sep-2026).
check('metros → centímetros', JSON.stringify(dimensionsFrom('1,20 x 0,80 x 1,00 m')) === '[120,80,100]')
check('milímetros → centímetros', JSON.stringify(dimensionsFrom('600 x 400 x 400 mm')) === '[60,40,40]')
check('«1 palet de 120 x 100 x 160» NO se interpreta', dimensionsFrom('1 palet de 120 x 100 x 160') === null)
check('unidades mezcladas NO se adivinan', dimensionsFrom('120 cm x 1 m x 60 cm') === null)
check('unidad desconocida NO se interpreta', dimensionsFrom('60 x 40 x 40 pulgadas') === null)

console.log('\nPrefill: el encargo real de 3 bultos NO se convierte en paquetes')
const ticketReal = {
  fecha: '2026-08-20', bultos: 3, medidas: '60 x 40 x 40 cm', peso_kg: 24,
  tipo_entrega: 'nacional',
  recogida_direccion: 'Laboratorios Norte, C/ Valportillo Primera 12, nave 4, 28108 Alcobendas (Madrid)',
  entrega_direccion: 'Hospital Virgen del Rocío, Av. Manuel Siurot s/n, 41013 Sevilla',
}
const pre = prefillFromTicket(ticketReal)
check('propone CP de origen 28108', pre.origin_postal_code?.value === '28108')
check('propone CP de destino 41013', pre.destination_postal_code?.value === '41013')
check('propone país ES porque el encargo dice nacional', pre.origin_country?.value === 'ES')
check('NO propone paquetes con 3 bultos y unas solas medidas', pre.packages === undefined)
check('explica por qué', pre.blocked.some((b) => b.includes('3 bultos')), pre.blocked)
check('nunca propone paletización', !('palletized' in pre))

console.log('\nPrefill: un solo bulto sí es inequívoco')
const unBulto = prefillFromTicket({ ...ticketReal, bultos: 1, peso_kg: 280, medidas: '60 x 80 x 60 cm' })
check('propone un package', unBulto.packages?.value.length === 1)
check('con quantity 1', unBulto.packages?.value[0].quantity === 1)
check('con el peso del encargo', unBulto.packages?.value[0].weightKg === 280)
check('con las tres medidas', unBulto.packages?.value[0].lengthCm === 60 && unBulto.packages?.value[0].heightCm === 60)

console.log('\nPuerta de cotización')
const completo = {
  origin_country: 'ES', origin_postal_code: '04810',
  destination_country: 'ES', destination_postal_code: '29001',
  palletized: true,
  packages: [{ id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 280 }],
}
check('el caso de control es cotizable', isQuotable(completo))
check('sin paletización declarada NO es cotizable',
  missingForQuote({ ...completo, palletized: null }).some((m) => m.reason === 'palletized'))
check('paletizado false SÍ vale (es una respuesta)', isQuotable({ ...completo, palletized: false }))
check('sin bultos NO es cotizable',
  missingForQuote({ ...completo, packages: [] }).some((m) => m.reason === 'packages_empty'))
check('peso 0 NO es cotizable',
  missingForQuote({ ...completo, packages: [{ id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 0 }] })
    .some((m) => m.reason === 'package_weight'))
check('cantidad decimal NO vale',
  missingForQuote({ ...completo, packages: [{ id: 'P1', quantity: 1.5, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 10 }] })
    .some((m) => m.reason === 'package_quantity'))
check('ids repetidos se detectan',
  missingForQuote({ ...completo, packages: [
    { id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 10 },
    { id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 10 }] })
    .some((m) => m.reason === 'package_id_duplicated'))
check('sin CP de destino NO es cotizable',
  missingForQuote({ ...completo, destination_postal_code: '' }).some((m) => m.reason === 'destination_postal_code'))

// ── Regresiones de la revisión adversarial del 30-sep ────────────────────────

console.log('\nMoneda: sale de la opción, si no de la raíz, y si no hay ninguna NO hay precio')
const OK: QuoteResponse = { status: 'OK', currency: 'EUR', recommended: { provider: 'P', service: 'ECONOMY', total: 134.93 }, alternatives: [] }
check('con moneda en la raíz hay precio', hasUsablePrice(OK))
check('la moneda de la raíz vale por defecto', usableOption(OK.recommended, OK)?.currency === 'EUR')
check('la moneda de la opción manda sobre la raíz',
  optionCurrency({ total: 1, currency: 'GBP' }, { currency: 'EUR' }) === 'GBP')
check('moneda vacía en la opción cae a la raíz', optionCurrency({ total: 1, currency: '  ' }, { currency: 'EUR' }) === 'EUR')
const sinMoneda: QuoteResponse = { status: 'OK', recommended: { total: 134.93 }, alternatives: [] }
check('OK con total pero sin moneda NO es precio (nunca EUR por defecto)', !hasUsablePrice(sinMoneda))
check('y usableOption devuelve null, no un EUR inventado', usableOption(sinMoneda.recommended, sinMoneda) === null)
check('alternativa sin moneda propia hereda la raíz', usableOption({ total: 142.61 }, OK)?.currency === 'EUR')

console.log('\nTotal: solo un número finito y positivo es un precio')
check('total null NO es precio', !hasUsablePrice({ ...OK, recommended: { total: null } }))
check('total NaN NO es precio', !hasUsablePrice({ ...OK, recommended: { total: NaN } }))
check('total "134.93" (texto) NO es precio', !hasUsablePrice({ ...OK, recommended: { total: '134.93' as unknown as number } }))
check('total 0 NO es precio', !hasUsablePrice({ ...OK, recommended: { total: 0 } }))
check('total negativo NO es precio', !hasUsablePrice({ ...OK, recommended: { total: -5 } }))
check('sin recommended NO es precio aunque diga OK', !hasUsablePrice({ ...OK, recommended: null }))
check('status ≠ OK con recommended relleno NO es precio',
  !hasUsablePrice({ status: 'PENDING_PARAMETER', currency: 'EUR', recommended: { total: 120 } }))

console.log('\nDesenlace: qué estado le toca al envío (§9 y §10 paso 8)')
check('OK utilizable → usable', classifyOutcome(OK, 200) === 'usable')
check('MISSING_REQUIRED_DATA → pendiente_datos, NO no_cotizable',
  classifyOutcome({ status: 'MISSING_REQUIRED_DATA', errors: [{ code: 'MISSING_REQUIRED_DATA', field: 'packages' }] }, 422) === 'pendiente_datos')
check('MAPPING_UNAVAILABLE → no_cotizable', classifyOutcome({ status: 'MAPPING_UNAVAILABLE' }, 422) === 'no_cotizable')
check('NO_RATE → no_cotizable', classifyOutcome({ status: 'NO_RATE' }, 422) === 'no_cotizable')
check('PENDING_PARAMETER → no_cotizable (veredicto explícito del motor), sin precio',
  classifyOutcome({ status: 'PENDING_PARAMETER', recommended: { total: null } }, 200) === 'no_cotizable')
for (const code of ['TIMEOUT', 'NETWORK_ERROR', 'BAD_RESPONSE', 'NOT_CONFIGURED', 'INTERNAL_ERROR', 'UNAUTHORIZED', 'INVALID_REQUEST']) {
  check(`${code} → unresolved: el estado del envío NO cambia`, classifyOutcome({ status: code }, 0) === 'unresolved')
}
check('OK sin precio utilizable → unresolved (contrato roto), no cotizado', classifyOutcome({ ...OK, recommended: null }, 200) === 'unresolved')
check('OK sin moneda → unresolved, no cotizado', classifyOutcome(sinMoneda, 200) === 'unresolved')
check('sin status → unresolved', classifyOutcome({}, 200) === 'unresolved')
check('HTTP 5xx → unresolved aunque el cuerpo diga NO_RATE', classifyOutcome({ status: 'NO_RATE' }, 503) === 'unresolved')

console.log('\nCampos que faltan según el motor, fusionados con los de MIRA sin duplicar')
const faltan = engineMissingFields({ status: 'MISSING_REQUIRED_DATA', errors: [
  { code: 'MISSING_REQUIRED_DATA', field: 'origin.ratingArea' }, { code: 'MISSING_REQUIRED_DATA', field: 'packages' },
  { code: 'MISSING_REQUIRED_DATA', field: 'packages' }, { code: 'X' }, { code: 'Y', field: 42 as unknown as string },
] })
check('se leen solo los campos de texto, sin repetir', JSON.stringify(faltan) === '["origin.ratingArea","packages"]', faltan)
const fusion = mergeEngineMissing([{ reason: 'packages_empty' }], faltan)
check('packages del motor NO se duplica con packages_empty de MIRA', fusion.filter((m) => m.field === 'packages').length === 0, fusion)
check('origin.ratingArea sí se añade como engine_required',
  fusion.some((m) => m.reason === 'engine_required' && m.field === 'origin.ratingArea'), fusion)
check('la lista local se conserva íntegra', fusion[0]?.reason === 'packages_empty')
check('el mismo campo del motor no entra dos veces', mergeEngineMissing([], ['a', 'a', ' a ']).length === 1)

console.log('\nCotización caducada: la forma canónica ignora ids y orden, y ve los cambios')
const base = {
  shipmentRef: 'MIRA-1', origin: { country: 'ES', postalCode: '04810', ratingArea: 'Almería' },
  destination: { country: 'ES', postalCode: '29001' }, palletized: true, service: 'AUTO' as const,
  packages: [
    { id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 280 },
    { id: 'P2', quantity: 2, lengthCm: 30, widthCm: 30, heightCm: 30, weightKg: 10 },
  ],
}
check('la misma petición da la misma forma', canonicalQuoteRequest(base) === canonicalQuoteRequest({ ...base }))
check('otro shipmentRef NO cuenta como cambio', canonicalQuoteRequest(base) === canonicalQuoteRequest({ ...base, shipmentRef: 'MIRA-2' }))
check('otros ids de bulto NO cuentan como cambio',
  canonicalQuoteRequest(base) === canonicalQuoteRequest({ ...base, packages: base.packages.map((p, i) => ({ ...p, id: `Z${i}` })) }))
check('reordenar bultos NO cuenta como cambio',
  canonicalQuoteRequest(base) === canonicalQuoteRequest({ ...base, packages: [base.packages[1], base.packages[0]] }))
check('cambiar el peso SÍ cuenta',
  canonicalQuoteRequest(base) !== canonicalQuoteRequest({ ...base, packages: [{ ...base.packages[0], weightKg: 281 }, base.packages[1]] }))
check('cambiar el destino SÍ cuenta',
  canonicalQuoteRequest(base) !== canonicalQuoteRequest({ ...base, destination: { country: 'ES', postalCode: '41013' } }))
check('añadir el área de destino SÍ cuenta',
  canonicalQuoteRequest(base) !== canonicalQuoteRequest({ ...base, destination: { ...base.destination, ratingArea: 'Málaga' } }))
check('cambiar el servicio SÍ cuenta', canonicalQuoteRequest(base) !== canonicalQuoteRequest({ ...base, service: 'PREMIUM' }))
check('cambiar la paletización SÍ cuenta', canonicalQuoteRequest(base) !== canonicalQuoteRequest({ ...base, palletized: false }))
check('quitar un bulto SÍ cuenta', canonicalQuoteRequest(base) !== canonicalQuoteRequest({ ...base, packages: [base.packages[0]] }))
check('la petición guardada como jsonb (ida y vuelta por JSON) sigue coincidiendo',
  canonicalQuoteRequest(base) === canonicalQuoteRequest(JSON.parse(JSON.stringify(base))))

console.log('\nMotivos saneados: ni tokens ni URLs internas llegan a la BD ni a la pantalla')
const sucio = 'fetch failed http://cotizador.interno:8080/api Authorization: Bearer abc.DEF-123 fin'
const limpio = sanitizeEngineMessage(sucio) || ''
check('la URL desaparece', !limpio.includes('cotizador.interno') && !limpio.includes('http'), limpio)
check('el token desaparece', !limpio.includes('abc.DEF-123'), limpio)
check('el resto del motivo se conserva', limpio.includes('fetch failed') && limpio.includes('fin'), limpio)
check('se recorta a 200 caracteres', (sanitizeEngineMessage('x'.repeat(500)) || '').length === 200)
check('lo que no es texto devuelve null', sanitizeEngineMessage(undefined) === null && sanitizeEngineMessage({ a: 1 }) === null)

// ── Regresiones de la revisión del 01-oct ────────────────────────────────────

console.log('\n[1] Pedir precio y Consultar áreas guardan ANTES de preguntar al motor')
// Es comportamiento de React sin DOM aquí, así que se comprueba el texto: el
// servidor cotiza el envío GUARDADO, y si estas llamadas dejan de persistir
// primero, el precio vuelve a no ser de lo que el operador ve.
const editor = readFileSync(join(__dirname, '../../components/cotizador/ShipmentEditor.tsx'), 'utf8')
const bodyOf = (name: string) => {
  const start = editor.indexOf(`const ${name} = async () => {`)
  const end = editor.indexOf('\n  }\n', start)
  return start >= 0 && end > start ? editor.slice(start, end) : ''
}
for (const fn of ['ask', 'askAreas']) {
  const body = bodyOf(fn)
  const guard = body.indexOf('if (!(await saveBeforeAsking())) return')
  const call = body.indexOf('fetch(')
  check(`${fn} guarda primero y aborta si falla, antes del fetch al motor`, guard >= 0 && call > guard, { guard, call })
}
check('save devuelve si el servidor guardó (boolean)', /const save = async \(\): Promise<boolean>/.test(editor))

console.log('\n[2] Guardar sin cambiar la petición conserva el estado en CUALQUIER estado')
const guardado: QuoteShipment = {
  id: 's1', client_id: 'c1', ticket_id: null, shipment_ref: 'MIRA-1',
  origin_country: 'ES', origin_postal_code: '04810', origin_rating_area: null,
  destination_country: 'ES', destination_postal_code: '29001', destination_rating_area: null,
  palletized: true, service: 'AUTO',
  packages: [{ id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 280 }],
  extras: null, declared_value_eur: null,
  // Tras un MISSING_REQUIRED_DATA: el motor pidió el área de origen, que MIRA no sabe comprobar.
  status: 'pendiente_datos', missing: [{ reason: 'engine_required', field: 'origin.ratingArea' }],
  notes: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
}
const soloNotas = stateAfterSave(guardado, { ...guardado, notes: 'llamar antes' })
check('pendiente_datos + solo notas → sigue pendiente_datos (antes bajaba a listo)', soloNotas.status === 'pendiente_datos', soloNotas)
check('y conserva el campo que pidió el motor',
  soloNotas.missing.some((m) => m.reason === 'engine_required' && m.field === 'origin.ratingArea'), soloNotas.missing)
const sinCambios = stateAfterSave(guardado, { ...guardado })
check('guardado sin cambios → idéntico', sinCambios.status === 'pendiente_datos' && sinCambios.missing.length === 1)
const conArea = stateAfterSave(guardado, { ...guardado, origin_rating_area: 'Almería' })
check('poner el área SÍ cambia la petición → se recalcula por readiness (listo)', conArea.status === 'listo', conArea)
check('y los engine_required desaparecen: solo el motor puede confirmar que ya está', conArea.missing.length === 0, conArea.missing)
const cotizado = { ...guardado, status: 'cotizado' as const, missing: [] }
check('cotizado + solo notas → sigue cotizado', stateAfterSave(cotizado, { ...cotizado, notes: 'x' }).status === 'cotizado')
check('cotizado + cambio de peso → listo',
  stateAfterSave(cotizado, { ...cotizado, packages: [{ ...cotizado.packages[0], weightKg: 281 }] }).status === 'listo')
const listo = { ...guardado, status: 'listo' as const, missing: [] }
check('listo + quitar el CP de destino → pendiente_datos',
  stateAfterSave(listo, { ...listo, destination_postal_code: null }).status === 'pendiente_datos')

console.log('\n[3] Alternativa sin importe: se distingue «sin moneda» de «sin total»')
check('con moneda y total null → no_total (antes decía «sin moneda»)', unusableReason({ total: null, currency: 'EUR' }) === 'no_total')
check('con moneda de la raíz y total en texto → no_total', unusableReason({ total: '12' as unknown as number }, { currency: 'EUR' }) === 'no_total')
check('sin moneda en ningún sitio → no_currency', unusableReason({ total: 12 }, {}) === 'no_currency')
check('sin moneda Y sin total → no_currency (la moneda es lo primero que falta)', unusableReason({ total: null }, null) === 'no_currency')
check('utilizable → null', unusableReason({ total: 12, currency: 'EUR' }) === null)

console.log('\n[4] OK sin precio se guarda como OK_WITHOUT_PRICE, no como «no contestó»')
const okSin = quoteErrorFor({ status: 'OK', currency: 'EUR', recommended: null, alternatives: [] }, { transportError: undefined }, 'unresolved')
check('error_code OK_WITHOUT_PRICE', okSin.errorCode === 'OK_WITHOUT_PRICE', okSin)
check('con su mensaje, no «El motor no contestó»', okSin.errors[0]?.message === 'El motor respondió OK sin precio utilizable.', okSin.errors)
const caido = quoteErrorFor({ status: 'BAD_RESPONSE', errors: [{ code: 'BAD_RESPONSE', message: 'x' }] }, { transportError: 'BAD_RESPONSE', message: 'no era JSON' }, 'unresolved')
check('un fallo de transporte sigue siendo BAD_RESPONSE', caido.errorCode === 'BAD_RESPONSE', caido)
const timeout = quoteErrorFor({ status: 'TIMEOUT', errors: [] }, { transportError: 'TIMEOUT' }, 'unresolved')
check('timeout sin mensaje → «El motor no contestó.»', timeout.errorCode === 'TIMEOUT' && timeout.errors[0]?.message === 'El motor no contestó.', timeout)
const veredicto = quoteErrorFor({ status: 'NO_RATE', errors: [{ code: 'NO_RATE', message: 'sin tarifa http://x' }] }, {}, 'no_cotizable')
check('un veredicto conserva el código del motor y sanea el mensaje',
  veredicto.errorCode === 'NO_RATE' && veredicto.errors[0]?.message === 'sin tarifa [url]', veredicto)

console.log('\n[5] Un bulto con campos vacíos NO se guarda como 0')
const vacio = cleanPatch({ packages: [{ id: 'P1', quantity: null, lengthCm: '', widthCm: undefined, heightCm: '  ', weightKg: null }] }).packages![0]
check('null → NaN, no 0', Number.isNaN(vacio.quantity) && Number.isNaN(vacio.weightKg), vacio)
check('"" y "  " → NaN, no 0', Number.isNaN(vacio.lengthCm) && Number.isNaN(vacio.heightCm), vacio)
check('undefined → NaN', Number.isNaN(vacio.widthCm))
check('y readiness lo trata como carencia (medidas y peso)',
  missingForQuote({ ...completo, packages: [vacio] }).some((m) => m.reason === 'package_dimensions')
  && missingForQuote({ ...completo, packages: [vacio] }).some((m) => m.reason === 'package_weight'))
check('un valor real se conserva; "60,5" con coma no se adivina (NaN)',
  cleanPatch({ packages: [{ lengthCm: 60, widthCm: '40', heightCm: '60,5' }] }).packages![0].lengthCm === 60
  && cleanPatch({ packages: [{ widthCm: '40' }] }).packages![0].widthCm === 40
  && Number.isNaN(cleanPatch({ packages: [{ heightCm: '60,5' }] }).packages![0].heightCm))
check('tras ir y volver por JSON (jsonb) el vacío es null, que readiness también trata como carencia',
  missingForQuote({ ...completo, packages: JSON.parse(JSON.stringify([vacio])) }).some((m) => m.reason === 'package_weight'))
// El editor pinta '' para NaN y para null (Number.isFinite(null) es false).
check('PackagesEditor.val pinta vacío para NaN y null',
  /const val = \(n: number\) => \(Number\.isFinite\(n\) \? String\(n\) : ''\)/.test(
    readFileSync(join(__dirname, '../../components/cotizador/PackagesEditor.tsx'), 'utf8')))

console.log('\n[6] Solo los veredictos explícitos hacen NO_COTIZABLE; un código desconocido no cambia el estado')
for (const code of ['MAPPING_UNAVAILABLE', 'NO_PROVIDER', 'NO_RATE', 'NO_ZONE', 'OVER_LIMIT', 'UNMAPPED_SURCHARGE', 'NO_ENCONTRADO_EN_TABLAS', 'PENDING_PARAMETER']) {
  check(`${code} → no_cotizable`, classifyOutcome({ status: code }, 422) === 'no_cotizable')
}
for (const code of ['RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'CODIGO_NUEVO_V2', 'MAINTENANCE']) {
  check(`${code} → unresolved (antes se conservaba como veredicto no_cotizable)`, classifyOutcome({ status: code }, 200) === 'unresolved')
}
check('MISSING_REQUIRED_DATA sigue siendo pendiente_datos', classifyOutcome({ status: 'MISSING_REQUIRED_DATA' }, 422) === 'pendiente_datos')

console.log(`\n${pass} pasan · ${fail} fallan\n`)
process.exit(fail === 0 ? 0 : 1)
