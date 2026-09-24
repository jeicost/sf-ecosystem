// Banco de pruebas del contrato v1 SIN host real.
//
//   npx tsx evals/cotizador/smoke.ts          → contra un servidor de mentira
//   npx tsx evals/cotizador/smoke.ts --real   → contra el host de test de verdad
//                                               (usa COTIZADOR_BASE_URL/TOKEN)
//
// El servidor de mentira responde EXACTAMENTE lo que documenta la guía para el
// caso de aceptación conjunta (04810 Almería → 29001 Málaga, 60×80×60, 280 kg
// paletizado → Palletways QP: ECONOMY 134,93 y PREMIUM 142,61) y para los
// errores del capítulo 9. Sirve para dos cosas: que el cliente esté probado el
// día que llegue la URL, y que una regresión futura se note aquí y no en una
// llamada real.
import { createServer } from 'http'
import type { AddressInfo } from 'net'

const TOKEN = 'token-de-mentira-solo-para-esta-prueba'

const CONTROL_OK = {
  schemaVersion: 'v1',
  shipmentRef: 'MIRA-TEST-001',
  traceId: 'trace-control-0001',
  quoteId: 'q-0001',
  status: 'OK',
  currency: 'EUR',
  dataVersion: 'draft-c1933675a15f',
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
        // Almería disponible; el destino no lo necesita.
        return send(200, {
          provider: 'Palletways', traceId: 'trace-areas-1',
          origin: { status: 'AVAILABLE', options: ['Almería', 'Almería Norte'] },
          destination: { status: 'NOT_REQUIRED', options: [] },
        })
      }
      if (payload.shipmentRef === 'CASO-SIN-DATOS') return send(422, { status: 'MISSING_REQUIRED_DATA', errors: [{ code: 'MISSING_REQUIRED_DATA', field: 'packages' }] })
      if (payload.shipmentRef === 'CASO-SCHENKER') return send(422, { status: 'MAPPING_UNAVAILABLE', errors: [{ code: 'MAPPING_UNAVAILABLE' }], recommended: null })
      if (payload.shipmentRef === 'CASO-GLS-SIN-FUEL') return send(200, {
        status: 'PENDING_PARAMETER', currency: 'EUR', traceId: 't-gls',
        recommended: { provider: 'GLS', service: 'ECONOMY', total: null }, alternatives: [],
        errors: [{ code: 'PENDING_PARAMETER', message: 'fuel' }],
      })
      if (payload.shipmentRef === 'CASO-BASURA') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<html>no soy json</html>') }
      return send(200, { ...CONTROL_OK, shipmentRef: payload.shipmentRef })
    })
  })
}

let pass = 0, fail = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, detail !== undefined ? JSON.stringify(detail).slice(0, 300) : '') }
}

const BASE_REQUEST = {
  origin: { country: 'ES', postalCode: '04810', ratingArea: 'Almería' },
  destination: { country: 'ES', postalCode: '29001' },
  palletized: true,
  service: 'AUTO' as const,
  packages: [{ id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 280 }],
}

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
    console.log('\nContra un servidor de mentira que habla el contrato v1')
  }

  // Se importa DESPUÉS de fijar el entorno: la configuración se lee al llamar.
  const { requestQuote, requestRatingAreas } = await import('../../lib/cotizador/client')
  const { hasUsablePrice, primaryErrorCode } = await import('../../lib/cotizador/contract')

  console.log('\nPaso 1 · áreas de tarificación')
  const { result: areas } = await requestRatingAreas({
    origin: { country: 'ES', postalCode: '04810' },
    destination: { country: 'ES', postalCode: '29001' },
    palletized: true,
  })
  check('el origen pide área', areas?.origin.status === 'AVAILABLE', areas?.origin)
  check('y ofrece opciones exactas', (areas?.origin.options.length ?? 0) > 0, areas?.origin.options)
  check('el destino no la necesita', areas?.destination.status === 'NOT_REQUIRED', areas?.destination)

  console.log('\nPaso 2 · caso de aceptación conjunta')
  const { response: ok } = await requestQuote({ shipmentRef: 'MIRA-TEST-001', ...BASE_REQUEST })
  check('status OK', ok.status === 'OK', ok.status)
  check('hay precio utilizable', hasUsablePrice(ok))
  check('ECONOMY 134,93', ok.recommended?.total === 134.93, ok.recommended?.total)
  check('PREMIUM 142,61 en alternativas', ok.alternatives?.[0]?.total === 142.61, ok.alternatives)
  check('traceId presente', !!ok.traceId)
  check('dataVersion presente', !!ok.dataVersion)

  if (real) { console.log(`\n${pass} pasan · ${fail} fallan\n`); process.exit(fail === 0 ? 0 : 1) }

  console.log('\nErrores: fail-closed')
  const { response: sinDatos } = await requestQuote({ shipmentRef: 'CASO-SIN-DATOS', ...BASE_REQUEST })
  check('MISSING_REQUIRED_DATA no es precio', !hasUsablePrice(sinDatos))
  check('y se puede leer su código', primaryErrorCode(sinDatos) === 'MISSING_REQUIRED_DATA', primaryErrorCode(sinDatos))

  const { response: schenker } = await requestQuote({ shipmentRef: 'CASO-SCHENKER', ...BASE_REQUEST })
  check('MAPPING_UNAVAILABLE no es precio', !hasUsablePrice(schenker))
  check('código MAPPING_UNAVAILABLE', primaryErrorCode(schenker) === 'MAPPING_UNAVAILABLE')

  const { response: gls } = await requestQuote({ shipmentRef: 'CASO-GLS-SIN-FUEL', ...BASE_REQUEST })
  check('PENDING_PARAMETER con total nulo NO es precio', !hasUsablePrice(gls), gls.recommended)
  check('y no se inventa un total', gls.recommended?.total === null)

  const { response: basura } = await requestQuote({ shipmentRef: 'CASO-BASURA', ...BASE_REQUEST })
  check('respuesta que no es JSON no es precio', !hasUsablePrice(basura))
  check('se marca como BAD_RESPONSE', basura.status === 'BAD_RESPONSE', basura.status)

  // Token equivocado: el servidor responde 401 y MIRA no puede sacar precio.
  process.env.COTIZADOR_TOKEN = 'token-que-no-vale'
  const { requestQuote: q2 } = await import('../../lib/cotizador/client?bust=1' as string).catch(() => ({ requestQuote }))
  const { response: noAuth } = await (q2 as typeof requestQuote)({ shipmentRef: 'MIRA-TEST-001', ...BASE_REQUEST })
  check('401 no produce precio', !hasUsablePrice(noAuth))
  check('y se ve UNAUTHORIZED', primaryErrorCode(noAuth) === 'UNAUTHORIZED', primaryErrorCode(noAuth))

  // Sin configuración: apagado, no a medias.
  process.env.COTIZADOR_BASE_URL = ''
  process.env.COTIZADOR_TOKEN = ''
  const { response: off } = await requestQuote({ shipmentRef: 'X', ...BASE_REQUEST })
  check('sin configurar devuelve NOT_CONFIGURED', off.status === 'NOT_CONFIGURED', off.status)

  await close()
  console.log(`\n${pass} pasan · ${fail} fallan\n`)
  process.exit(fail === 0 ? 0 : 1)
}
main()
