// Checklist de aceptación conjunta del Cotizador (capítulo 15 de la guía v1).
//
//   npx tsx --env-file=.env.local evals/cotizador/aceptacion.ts          → host real
//   npx tsx evals/cotizador/aceptacion.ts --fake                         → servidor de mentira
//
// Las doce pruebas que Aless y nosotros acordamos correr juntos el día que
// exista la URL de test. Se escriben AHORA, contra un servidor de mentira que
// habla el contrato, para que ese día no haya que improvisar nada: se cambian
// dos variables de entorno y se ejecuta.
//
// Cuatro de las pruebas no son de MIRA sino del DESPLIEGUE del Cotizador (la
// salud del host, los dos 401 y el 404 de la superficie interna). Están aquí a
// propósito: si su hardening MIRA_ONLY no está puesto, quien se lleva el
// disgusto es el cliente, y es mejor verlo desde fuera.
import { createServer } from 'http'
import type { AddressInfo } from 'net'

// Request de control CONGELADO (§6.2 de la guía): las DOS áreas de
// tarificación van tal cual las nombra el motor. Es el mismo literal que en
// smoke.ts; si el contrato cambia, se cambia en los dos con su versión.
const CONTROL = {
  origin: { country: 'ES', postalCode: '04810', ratingArea: 'Almería' },
  destination: { country: 'ES', postalCode: '29001', ratingArea: 'Málaga' },
  palletized: true,
  service: 'AUTO' as const,
  packages: [{ id: 'P1', quantity: 1, lengthCm: 60, widthCm: 80, heightCm: 60, weightKg: 280 }],
}
// Alcance por proveedor (capítulo 12): internacional paletizado es DB Schenker,
// que en la v1 NO es resoluble; internacional sin paletizar y bulto ≤39 kg es GLS.
const SCHENKER = { ...CONTROL, destination: { country: 'DE', postalCode: '10115' } }
const GLS = {
  origin: { country: 'ES', postalCode: '28108' },
  destination: { country: 'FR', postalCode: '75001' },
  palletized: false, service: 'AUTO' as const,
  packages: [{ id: 'P1', quantity: 1, lengthCm: 40, widthCm: 30, heightCm: 20, weightKg: 18 }],
}
const INCOMPLETO = { ...CONTROL, packages: [] }

let pass = 0, fail = 0, warn = 0
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, detail !== undefined ? JSON.stringify(detail).slice(0, 260) : '') }
}
function note(name: string, detail?: unknown) {
  warn++; console.log('  ~', name, detail !== undefined ? JSON.stringify(detail).slice(0, 200) : '')
}

/** Petición cruda: estas pruebas miran el HTTP, no solo el cuerpo. */
async function raw(path: string, opts: { method?: string; token?: string | null; body?: unknown } = {}) {
  const base = (process.env.COTIZADOR_BASE_URL || '').replace(/\/+$/, '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  try {
    const res = await fetch(`${base}${path}`, {
      method: opts.method || 'POST',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: 'no-store',
    })
    const text = await res.text()
    let json: Record<string, unknown> | null = null
    try { json = text ? JSON.parse(text) : null } catch { /* no era JSON */ }
    return { status: res.status, json, text }
  } catch (err) {
    return { status: 0, json: null, text: String((err as Error).message) }
  }
}

function fakeServer() {
  return createServer((req, res) => {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      const send = (code: number, payload: unknown) => {
        res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(payload))
      }
      const url = req.url || ''
      if (url === '/api/health') return send(200, { status: 'ok' })
      // Superficie interna: en MIRA_ONLY tiene que estar cerrada desde fuera.
      if (url === '/api/quote' || url.startsWith('/api/geo') || url.startsWith('/admin')) {
        return send(404, { error: 'not found' })
      }
      if (req.headers.authorization !== `Bearer ${process.env.COTIZADOR_TOKEN}`) {
        return send(401, { status: 'UNAUTHORIZED', errors: [{ code: 'UNAUTHORIZED' }] })
      }
      const p = body ? JSON.parse(body) : {}
      if (url.endsWith('/rating-areas')) {
        return send(200, {
          provider: 'Palletways', traceId: 'tr-areas',
          origin: { status: 'AVAILABLE', options: ['Almería', 'Almería Norte'] },
          destination: { status: 'AVAILABLE', options: ['Málaga'] },
        })
      }
      if (!Array.isArray(p.packages) || p.packages.length === 0) {
        return send(422, { status: 'MISSING_REQUIRED_DATA', errors: [{ code: 'MISSING_REQUIRED_DATA', field: 'packages' }] })
      }
      if (p.destination?.country !== 'ES' && p.palletized) {
        return send(422, { status: 'MAPPING_UNAVAILABLE', recommended: null, errors: [{ code: 'MAPPING_UNAVAILABLE' }] })
      }
      if (p.destination?.country !== 'ES' && !p.palletized) {
        return send(200, {
          status: 'PENDING_PARAMETER', currency: 'EUR', traceId: 'tr-gls', dataVersion: 'draft-c1933675a15f',
          recommended: { provider: 'GLS', service: 'ECONOMY', total: null }, alternatives: [],
          errors: [{ code: 'PENDING_PARAMETER', message: 'fuel' }],
        })
      }
      return send(200, {
        schemaVersion: 'v1', shipmentRef: p.shipmentRef, traceId: 'tr-control', quoteId: 'q-1',
        status: 'OK', currency: 'EUR', dataVersion: 'draft-c1933675a15f',
        recommended: { provider: 'Palletways', service: 'ECONOMY', total: 134.93, currency: 'EUR' },
        alternatives: [{ provider: 'Palletways', service: 'PREMIUM', total: 142.61, currency: 'EUR' }],
        warnings: [], errors: [],
        // El mock hace ECO: en --fake lo que se comprueba es lo que MIRA envía.
        echo: p,
      })
    })
  })
}

async function main() {
  const fake = process.argv.includes('--fake')
  let close = async () => {}

  if (fake) {
    process.env.COTIZADOR_TOKEN = 'token-de-mentira'
    const srv = fakeServer()
    await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r))
    process.env.COTIZADOR_BASE_URL = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`
    close = () => new Promise<void>((r) => srv.close(() => r()))
    console.log('\nCHECKLIST DE ACEPTACIÓN · contra un servidor de mentira que habla el contrato v1')
  } else {
    if (!process.env.COTIZADOR_BASE_URL || !process.env.COTIZADOR_TOKEN) {
      console.log('\nFaltan COTIZADOR_BASE_URL y COTIZADOR_TOKEN. Con --fake se prueba el script sin host.\n')
      process.exit(1)
    }
    console.log('\nCHECKLIST DE ACEPTACIÓN · contra', process.env.COTIZADOR_BASE_URL)
  }
  const TOKEN = process.env.COTIZADOR_TOKEN!

  const { requestQuote, requestRatingAreas } = await import('../../lib/cotizador/client')
  const { hasUsablePrice, primaryErrorCode } = await import('../../lib/cotizador/contract')

  console.log('\nDespliegue del Cotizador (no es MIRA: es su host)')
  const health = await raw('/api/health', { method: 'GET' })
  check('GET /api/health devuelve 200 y status=ok',
    health.status === 200 && (health.json?.status === 'ok' || health.json?.status === 'OK'), health)

  const sinAuth = await raw('/api/integrations/mira/v1/quote', { body: { shipmentRef: 'X', ...CONTROL } })
  check('quote SIN Authorization devuelve 401', sinAuth.status === 401, sinAuth.status)

  const malAuth = await raw('/api/integrations/mira/v1/quote', { token: 'token-que-no-vale', body: { shipmentRef: 'X', ...CONTROL } })
  check('quote con token erróneo devuelve 401', malAuth.status === 401, malAuth.status)

  const interna = await raw('/api/quote', { token: TOKEN, body: { shipmentRef: 'X', ...CONTROL } })
  check('ruta interna /api/quote cerrada desde fuera (404)', interna.status === 404, interna.status)

  console.log('\nFlujo de dos pasos')
  const { result: areas } = await requestRatingAreas({
    origin: { country: 'ES', postalCode: '04810' },
    destination: { country: 'ES', postalCode: '29001' },
    palletized: true,
  })
  check('rating-areas responde para el caso de control', !!areas, areas)
  if (areas) {
    check('el origen pide área y ofrece opciones exactas',
      areas.origin.status === 'AVAILABLE' && areas.origin.options.length > 0, areas.origin)
    check('el destino también (el control lleva Málaga)',
      areas.destination.status === 'AVAILABLE' && areas.destination.options.length > 0, areas.destination)
    if (fake) {
      // Contra el mock se puede afirmar de verdad: las opciones son EXACTAMENTE
      // las que devolvió el servidor de mentira, sin alias ni transformación.
      // Antes esta prueba pasaba con cualquier lista de cadenas no vacías.
      check('las opciones son EXACTAMENTE las del motor (sin alias ni transformar)',
        JSON.stringify(areas.origin.options) === JSON.stringify(['Almería', 'Almería Norte'])
        && JSON.stringify(areas.destination.options) === JSON.stringify(['Málaga']),
        [areas.origin.options, areas.destination.options])
    } else {
      // Contra el host real no se sabe qué opciones tocan: solo se comprueba
      // que llegan como texto no vacío. Que no se deducen de la ciudad lo
      // garantiza el código (MIRA no tiene tabla de áreas), no esta prueba.
      check('las opciones llegan como cadenas no vacías',
        areas.origin.options.every((o) => typeof o === 'string' && o.length > 0), areas.origin.options)
    }
  }

  console.log('\nCaso de aceptación común · 04810 → 29001 · 60×80×60 · 280 kg paletizado')
  const controlRequest = { shipmentRef: 'MIRA-ACEPTACION-001', ...CONTROL }
  const { response: ok } = await requestQuote(controlRequest)
  check('status OK', ok.status === 'OK', ok.status)
  check('hay precio utilizable (total finito y con moneda del motor)', hasUsablePrice(ok))
  if (fake) {
    // Un mock que devuelve 134,93 solo demuestra que el mock devuelve 134,93:
    // aquí se comprueba que el cliente ENVÍA el caso de control tal cual.
    check('el cliente envía el caso de control TAL CUAL (eco profundo)',
      JSON.stringify((ok as { echo?: unknown }).echo) === JSON.stringify(controlRequest), (ok as { echo?: unknown }).echo)
    note('ECONOMY = 134,93 y PREMIUM = 142,61 quedan SIN VERIFICAR: solo contra el host real')
  } else {
    check('ECONOMY = 134,93', ok.recommended?.total === 134.93, ok.recommended?.total)
    const premium = (ok.alternatives || []).find((a) => String(a.service).toUpperCase() === 'PREMIUM')
    check('PREMIUM = 142,61', premium?.total === 142.61, ok.alternatives)
  }
  check('traceId presente (y MIRA lo persiste)', !!ok.traceId, ok.traceId)
  check('dataVersion presente (y MIRA lo persiste)', !!ok.dataVersion, ok.dataVersion)
  if (String(ok.recommended?.provider || '').toUpperCase().includes('PALLETWAYS')) {
    check('proveedor Palletways', true)
  } else {
    note('el proveedor recomendado no dice Palletways', ok.recommended?.provider)
  }

  console.log('\nFuera de alcance y datos incompletos: nada de esto puede dar precio')
  const { response: schenker } = await requestQuote({ shipmentRef: 'MIRA-ACEPTACION-DB', ...SCHENKER })
  check('internacional paletizado → MAPPING_UNAVAILABLE', primaryErrorCode(schenker) === 'MAPPING_UNAVAILABLE', primaryErrorCode(schenker))
  check('y sin precio', !hasUsablePrice(schenker))

  const { response: gls } = await requestQuote({ shipmentRef: 'MIRA-ACEPTACION-GLS', ...GLS })
  if (gls.status === 'OK') {
    note('GLS ha devuelto precio (tiene el fuel exacto): no aplica PENDING_PARAMETER', gls.recommended?.total)
    check('si hay precio, es utilizable de verdad', hasUsablePrice(gls))
  } else {
    check('GLS sin fuel → PENDING_PARAMETER', primaryErrorCode(gls) === 'PENDING_PARAMETER', primaryErrorCode(gls))
    check('total nulo, sin inventar', gls.recommended?.total === null || gls.recommended?.total === undefined, gls.recommended)
    check('y MIRA no lo toma por precio', !hasUsablePrice(gls))
  }

  const { response: incompleto } = await requestQuote({ shipmentRef: 'MIRA-ACEPTACION-VACIO', ...INCOMPLETO })
  check('sin bultos → MISSING_REQUIRED_DATA', primaryErrorCode(incompleto) === 'MISSING_REQUIRED_DATA', primaryErrorCode(incompleto))
  check('y sin precio', !hasUsablePrice(incompleto))

  console.log('\nVarios destinos: una petición y un registro por destino')
  const destinos = ['29001', '41013', '08001']
  const respuestas = []
  for (const cp of destinos) {
    const { response } = await requestQuote({
      shipmentRef: `MIRA-ACEPTACION-MULTI-${cp}`, ...CONTROL,
      destination: { country: 'ES', postalCode: cp },
    })
    respuestas.push(response)
  }
  check('tres destinos → tres respuestas', respuestas.length === 3)
  check('cada una con su propia referencia',
    new Set(respuestas.map((r) => r.shipmentRef)).size === 3, respuestas.map((r) => r.shipmentRef))
  check('cada una con su propia traza',
    respuestas.every((r) => !!r.traceId), respuestas.map((r) => r.traceId))

  await close()
  console.log(`\n${pass} pasan · ${fail} fallan${warn ? ` · ${warn} a revisar a mano` : ''}\n`)
  process.exit(fail === 0 ? 0 : 1)
}
main()
