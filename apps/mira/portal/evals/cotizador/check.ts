// Comprobación de las piezas puras del Cotizador. Sin red, sin BD, gratis.
//   npx tsx evals/cotizador/check.ts
import { missingForQuote, isQuotable } from '../../lib/cotizador/readiness'
import { prefillFromTicket, postalCodeFrom, dimensionsFrom } from '../../lib/cotizador/prefill'

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

console.log(`\n${pass} pasan · ${fail} fallan\n`)
process.exit(fail === 0 ? 0 : 1)
