// Banco de pruebas del contrato v1 SIN host real.
//
//   npx tsx evals/cotizador/smoke.ts          → contra un servidor de mentira
//   npx tsx evals/cotizador/smoke.ts --real   → contra el host de test de verdad
//                                               (usa COTIZADOR_BASE_URL/TOKEN)
//
// Qué prueba cada modo, y qué NO:
//   · En modo mock el servidor de mentira hace ECO del cuerpo recibido, y lo
//     que se comprueba es que EL CLIENTE ENVÍA EL CASO DE CONTROL congelado
//     (§6.2 de la guía) tal cual, más los caminos fail-closed del capítulo 9.
//     Los importes 134,93 / 142,61 NO se verifican aquí: un mock que devuelve
//     134,93 solo demuestra que el mock devuelve 134,93 (revisión del 30-sep).
//   · Con --real se afirman los importes contra el motor de verdad.
import { createServer } from 'http'
import type { AddressInfo } from 'net'

const TOKEN = 'token-de-mentira-solo-para-esta-prueba'

/**
 * Request de control CONGELADO (§6.2 de la guía): 04810 Almería → 29001
 * Málaga, un palet 60×80×60 de 280 kg, paletizado, servicio AUTO, con las DOS
 * áreas de tarificación tal cual las nombra el motor. Es un literal a
 * propósito: si el contrato cambia, se cambia aquí con el número de versión.
 */
export const CONTROL_REQUEST = {
  shipmentRef: 'MIRA-TEST-001',
  origin: { country: 'ES', postalCode: '04810', ratingArea: 'Almería' },
  destination: { country: 'ES', postalCode: '29001', ratingArea: 'Málaga' },
  palletized: true,
  service: 'AUTO' as const,
  packages: [{ id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 280 }],
}

/** Respuesta OK con la FORMA del contrato. Los importes son de relleno. */
const OK_SHAPE = {
  schemaVersion: 'v1',
  traceId: 'trace-control-0001',
  quoteId: 'q-0001',
  status: 'OK',
  currency: 'EUR',
  dataVersion: 'draft-mock',
  recommended: { provider: 'Palletways', service: 'ECONOMY', total: 134.93, currency: 'EUR', breakdown: { base: 120, fuel: 14.93 } },
  alternatives: [{ provider: 'Palletways', service: 'PREMIUM', total: 142.61, currency: 'EUR' }],
  warnings: [],
  errors: [],
}

function fakeServer() {
  return createServer((req, res) => {
    const auth = req.headers.authorization
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      const send = (code: number, payload: unknown) => {
        res.writeHead(code, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(payload))
      }
      if (auth !== `Bearer ${TOKEN}`) return send(401, { status: 'UNAUTHORIZED', errors: [{ code: 'UNAUTHORIZED' }] })
      const payload = body ? JSON.parse(body) : {}

      if (req.url?.endsWith('/rating-areas')) {
        // Las dos puntas piden área: el control lleva Almería y Málaga.
        return send(200, {
          provider: 'Palletways', traceId: 'trace-areas-1',
          origin: { status: 'AVAILABLE', options: ['Almería', 'Almería Norte'] },
          destination: { status: 'AVAILABLE', options: ['Málaga'] },
          echo: payload,
        })
      }
      switch (payload.shipmentRef) {
        case 'CASO-SIN-DATOS':
          return send(422, { status: 'MISSING_REQUIRED_DATA', errors: [{ code: 'MISSING_REQUIRED_DATA', field: 'origin.ratingArea' }, { code: 'MISSING_REQUIRED_DATA', field: 'packages' }] })
        case 'CASO-SCHENKER':
          return send(422, { status: 'MAPPING_UNAVAILABLE', errors: [{ code: 'MAPPING_UNAVAILABLE' }], recommended: null })
        case 'CASO-GLS-SIN-FUEL':
          return send(200, {
            status: 'PENDING_PARAMETER', currency: 'EUR', traceId: 't-gls',
            recommended: { provider: 'GLS', service: 'ECONOMY', total: null }, alternatives: [],
            errors: [{ code: 'PENDING_PARAMETER', message: 'fuel' }],
          })
        case 'CASO-BASURA':
          res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<html>no soy json</html>')
        case 'CASO-VACIO':
          res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('')
        case 'CASO-SIN-STATUS':
          return send(200, { recommended: { total: 99, currency: 'EUR' } })
        case 'CASO-5XX':
          return send(500, { error: 'boom', detail: 'Bearer secreto-que-no-debe-salir http://interno.local/x' })
        case 'CASO-OK-SIN-PRECIO':
          return send(200, { ...OK_SHAPE, recommended: null, alternatives: [] })
        case 'CASO-OK-TOTAL-TEXTO':
          return send(200, { ...OK_SHAPE, recommended: { ...OK_SHAPE.recommended, total: '134.93' } })
        case 'CASO-SIN-MONEDA': {
          const { currency: _c, ...sinRaiz } = OK_SHAPE
          return send(200, { ...sinRaiz, recommended: { provider: 'Palletways', service: 'ECONOMY', total: 134.93 }, alternatives: [] })
        }
        case 'CASO-MONEDA-EN-OPCION': {
          const { currency: _c, ...sinRaiz } = OK_SHAPE
          return send(200, { ...sinRaiz, recommended: { provider: 'X', service: 'ECONOMY', total: 120, currency: 'GBP' }, alternatives: [] })
        }
        default:
          return send(200, { ...OK_SHAPE, shipmentRef: payload.shipmentRef, echo: payload })
      }
    })
  })
}

let pass = 0, fail = 0, unverified = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, detail !== undefined ? JSON.stringify(detail).slice(0, 300) : '') }
}
function skip(name: string) { unverified++; console.log('  ~', name, '(sin verificar: solo con --real)') }

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

async function main() {
  const real = process.argv.includes('--real')
  let close = async () => {}

  if (real) {
    if (!process.env.COTIZADOR_BASE_URL || !process.env.COTIZADOR_TOKEN) {
      console.log('\n--real necesita COTIZADOR_BASE_URL y COTIZADOR_TOKEN en el entorno.\n'); process.exit(1)
    }
    console.log('\nContra el host REAL:', process.env.COTIZADOR_BASE_URL)
  } else {
    const srv = fakeServer()
    await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r))
    const port = (srv.address() as AddressInfo).port
    process.env.COTIZADOR_BASE_URL = `http://127.0.0.1:${port}`
    process.env.COTIZADOR_TOKEN = TOKEN
    close = () => new Promise<void>((r) => srv.close(() => r()))
    console.log('\nContra un servidor de mentira que habla el contrato v1 y hace eco de lo que recibe')
  }

  // Se importa DESPUÉS de fijar el entorno: la configuración se lee al llamar.
  const { requestQuote, requestRatingAreas } = await import('../../lib/cotizador/client')
  const { hasUsablePrice, primaryErrorCode, classifyOutcome, usableOption, engineMissingFields } = await import('../../lib/cotizador/contract')

  console.log('\nPaso 1 · áreas de tarificación')
  const areasPayload = {
    origin: { country: 'ES', postalCode: '04810' },
    destination: { country: 'ES', postalCode: '29001' },
    palletized: true,
  }
  const { result: areas } = await requestRatingAreas(areasPayload)
  check('el origen pide área', areas?.origin.status === 'AVAILABLE', areas?.origin)
  check('y ofrece opciones exactas', (areas?.origin.options.length ?? 0) > 0, areas?.origin.options)
  check('el destino pide área (el control lleva Málaga)', areas?.destination.status === 'AVAILABLE', areas?.destination)
  if (!real) {
    check('el cliente envía a /rating-areas exactamente país+CP+paletizado',
      sameJson((areas?.raw as { echo?: unknown })?.echo, areasPayload), (areas?.raw as { echo?: unknown })?.echo)
  }

  console.log('\nPaso 2 · el cliente envía el caso de control (§6.2)')
  const { response: ok, call } = await requestQuote(CONTROL_REQUEST)
  check('status OK', ok.status === 'OK', ok.status)
  check('hay precio utilizable', hasUsablePrice(ok))
  check('la moneda sale de la opción o de la raíz, nunca de MIRA', usableOption(ok.recommended, ok)?.currency === 'EUR', ok.recommended)
  check('traceId presente', !!ok.traceId)
  check('dataVersion presente', !!ok.dataVersion)
  check('HTTP 200', call.status === 200, call.status)
  if (real) {
    check('ECONOMY 134,93', ok.recommended?.total === 134.93, ok.recommended?.total)
    const premium = (ok.alternatives || []).find((a) => String(a.service).toUpperCase() === 'PREMIUM')
    check('PREMIUM 142,61 en alternativas', premium?.total === 142.61, ok.alternatives)
  } else {
    check('el cliente envía el caso de control TAL CUAL (eco profundo)',
      sameJson((ok as { echo?: unknown }).echo, CONTROL_REQUEST), (ok as { echo?: unknown }).echo)
    check('con origin.ratingArea = Almería y destination.ratingArea = Málaga',
      (ok as { echo?: { origin?: { ratingArea?: string }; destination?: { ratingArea?: string } } }).echo?.origin?.ratingArea === 'Almería'
      && (ok as { echo?: { destination?: { ratingArea?: string } } }).echo?.destination?.ratingArea === 'Málaga')
    skip('ECONOMY 134,93')
    skip('PREMIUM 142,61 en alternativas')
  }

  if (real) {
    console.log(`\n${pass} pasan · ${fail} fallan\n`); process.exit(fail === 0 ? 0 : 1)
  }

  console.log('\nErrores: fail-closed')
  const { response: sinDatos, call: cSinDatos } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-SIN-DATOS' })
  check('MISSING_REQUIRED_DATA no es precio', !hasUsablePrice(sinDatos))
  check('y se puede leer su código', primaryErrorCode(sinDatos) === 'MISSING_REQUIRED_DATA', primaryErrorCode(sinDatos))
  check('→ el envío queda PENDIENTE_DATOS, no no_cotizable', classifyOutcome(sinDatos, cSinDatos.status) === 'pendiente_datos')
  check('y se leen los campos que nombra el motor',
    sameJson(engineMissingFields(sinDatos), ['origin.ratingArea', 'packages']), engineMissingFields(sinDatos))

  const { response: schenker, call: cSch } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-SCHENKER' })
  check('MAPPING_UNAVAILABLE no es precio', !hasUsablePrice(schenker))
  check('código MAPPING_UNAVAILABLE', primaryErrorCode(schenker) === 'MAPPING_UNAVAILABLE')
  check('→ el envío queda NO_COTIZABLE', classifyOutcome(schenker, cSch.status) === 'no_cotizable')

  const { response: gls } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-GLS-SIN-FUEL' })
  check('PENDING_PARAMETER con total nulo NO es precio', !hasUsablePrice(gls), gls.recommended)
  check('y no se inventa un total', gls.recommended?.total === null)

  const { response: basura, call: cBasura } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-BASURA' })
  check('respuesta que no es JSON no es precio', !hasUsablePrice(basura))
  check('se marca como BAD_RESPONSE', basura.status === 'BAD_RESPONSE', basura.status)
  check('→ el estado del envío NO cambia (unresolved)', classifyOutcome(basura, cBasura.status) === 'unresolved')
  check('y el HTML crudo no se guarda', cBasura.raw === null, cBasura.raw)

  const { response: vacio, call: cVacio } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-VACIO' })
  check('200 con cuerpo vacío es BAD_RESPONSE, no INTERNAL_ERROR', vacio.status === 'BAD_RESPONSE', vacio.status)
  check('→ unresolved', classifyOutcome(vacio, cVacio.status) === 'unresolved')

  const { response: sinStatus, call: cSinStatus } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-SIN-STATUS' })
  check('200 con JSON sin `status` es BAD_RESPONSE', sinStatus.status === 'BAD_RESPONSE', sinStatus.status)
  check('y su total suelto no se toma por precio', !hasUsablePrice(sinStatus) && classifyOutcome(sinStatus, cSinStatus.status) === 'unresolved')

  const { response: cinco, call: cCinco } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-5XX' })
  check('5xx es BAD_RESPONSE aunque venga JSON', cinco.status === 'BAD_RESPONSE' && cCinco.status === 500, [cinco.status, cCinco.status])
  check('→ unresolved, no no_cotizable', classifyOutcome(cinco, cCinco.status) === 'unresolved')
  const textoCinco = JSON.stringify(cinco.errors) + (cCinco.message ?? '')
  check('el motivo guardado no lleva tokens ni URLs', !/secreto|http:\/\//.test(textoCinco), textoCinco)

  const { response: okSinPrecio, call: cOkSin } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-OK-SIN-PRECIO' })
  check('OK sin recommended NO es precio', !hasUsablePrice(okSinPrecio))
  check('→ unresolved (contrato roto), no cotizado ni no_cotizable', classifyOutcome(okSinPrecio, cOkSin.status) === 'unresolved')

  const { response: okTexto } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-OK-TOTAL-TEXTO' })
  check('OK con total "134.93" (texto) NO es precio', !hasUsablePrice(okTexto), okTexto.recommended)

  const { response: sinMoneda } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-SIN-MONEDA' })
  check('OK con total pero SIN moneda (ni opción ni raíz) NO es precio', !hasUsablePrice(sinMoneda), sinMoneda.recommended)
  check('y MIRA no le pone EUR', usableOption(sinMoneda.recommended, sinMoneda) === null)

  const { response: gbp } = await requestQuote({ ...CONTROL_REQUEST, shipmentRef: 'CASO-MONEDA-EN-OPCION' })
  check('la moneda de la opción vale aunque la raíz no la traiga', usableOption(gbp.recommended, gbp)?.currency === 'GBP', gbp.recommended)

  // Token equivocado: el servidor responde 401 y MIRA no puede sacar precio.
  process.env.COTIZADOR_TOKEN = 'token-que-no-vale'
  const { response: noAuth, call: cNoAuth } = await requestQuote(CONTROL_REQUEST)
  check('401 no produce precio', !hasUsablePrice(noAuth))
  check('y se ve UNAUTHORIZED', primaryErrorCode(noAuth) === 'UNAUTHORIZED', primaryErrorCode(noAuth))
  check('→ unresolved: es un fallo de MIRA, no un veredicto sobre el envío', classifyOutcome(noAuth, cNoAuth.status) === 'unresolved')
  process.env.COTIZADOR_TOKEN = TOKEN

  // Red caída: puerto cerrado. El mensaje no puede llevar la URL.
  await close()
  const { response: caida, call: cCaida } = await requestQuote(CONTROL_REQUEST)
  check('red caída devuelve NETWORK_ERROR', caida.status === 'NETWORK_ERROR', caida.status)
  check('→ unresolved', classifyOutcome(caida, cCaida.status) === 'unresolved')
  check('y el motivo no lleva la URL del motor', !/127\.0\.0\.1|http/.test(cCaida.message ?? '') && !/127\.0\.0\.1|http/.test(JSON.stringify(caida.errors)), cCaida.message)

  // Sin configuración: apagado, no a medias.
  process.env.COTIZADOR_BASE_URL = ''
  process.env.COTIZADOR_TOKEN = ''
  const { response: off } = await requestQuote(CONTROL_REQUEST)
  check('sin configurar devuelve NOT_CONFIGURED', off.status === 'NOT_CONFIGURED', off.status)

  console.log(`\n${pass} pasan · ${fail} fallan${unverified ? ` · ${unverified} sin verificar (importes, solo con --real)` : ''}\n`)
  process.exit(fail === 0 ? 0 : 1)
}
main()
