import type { QuotePackage } from './contract'

// Qué se puede sacar del encargo SIN inventar nada.
//
// La guía v1 permite «normalizar únicamente datos objetivos» y prohíbe dos
// atajos concretos, que son justo los que tentaría automatizar:
//   · repartir un peso total entre varios bultos;
//   · replicar una única cadena de medidas a varios bultos.
// Un encargo real de Email Ops trae `bultos: 3`, `medidas: "60 x 40 x 40 cm"`
// y `peso_kg: 24`. Nadie sabe si esos 24 kg son el total o los de cada bulto,
// ni si las medidas valen para los tres. Por eso, con más de un bulto, aquí NO
// se propone ningún package: lo escribe el operador.
//
// Nada de esto se guarda solo: alimenta el formulario y lo confirma una
// persona. `suggestions` explica de dónde sale cada valor y `blocked` explica
// por qué falta lo que falta.

export interface PrefillField<T> {
  value: T
  /** Campo del ticket del que sale, para poder enseñarlo junto al dato. */
  from: string
  raw?: string
}

export interface PrefillResult {
  origin_postal_code?: PrefillField<string>
  destination_postal_code?: PrefillField<string>
  origin_country?: PrefillField<string>
  destination_country?: PrefillField<string>
  packages?: PrefillField<QuotePackage[]>
  /** Motivos legibles de lo que NO se ha propuesto y por qué. */
  blocked: string[]
}

/** CP español: 5 dígitos, provincia 01–52. */
const SPANISH_POSTAL = /\b(0[1-9]|[1-4]\d|5[0-2])\d{3}\b/g

/**
 * Busca el CP dentro de una dirección libre. Se queda con la ÚLTIMA aparición
 * válida: en español el código postal va justo antes de la localidad
 * ("…nave 4, 28108 Alcobendas (Madrid)"), mientras que los números de portal o
 * de nave aparecen antes y no tienen cinco dígitos.
 */
export function postalCodeFrom(address: unknown): string | null {
  if (typeof address !== 'string') return null
  const matches = address.match(SPANISH_POSTAL)
  if (!matches || matches.length === 0) return null
  return matches[matches.length - 1]
}

/**
 * "60 x 40 x 40 cm" → [60, 40, 40]. Acepta x/×/*, decimales con coma y unidad
 * opcional. Devuelve null si no hay EXACTAMENTE tres números: "60x40" o
 * "varias medidas" no son medidas utilizables.
 */
export function dimensionsFrom(text: unknown): [number, number, number] | null {
  if (typeof text !== 'string') return null
  const cleaned = text.replace(/,(\d)/g, '.$1')
  const parts = cleaned.split(/\s*[x×*]\s*/i)
  if (parts.length !== 3) return null
  const nums = parts.map((p) => {
    const m = p.match(/\d+(?:\.\d+)?/)
    return m ? Number(m[0]) : NaN
  })
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return null
  return [nums[0], nums[1], nums[2]]
}

export interface TicketFieldsLike {
  bultos?: unknown
  medidas?: unknown
  peso_kg?: unknown
  recogida_direccion?: unknown
  entrega_direccion?: unknown
  tipo_entrega?: unknown
  [key: string]: unknown
}

export function prefillFromTicket(fields: TicketFieldsLike | null | undefined): PrefillResult {
  const out: PrefillResult = { blocked: [] }
  const f = fields || {}

  const origenCp = postalCodeFrom(f.recogida_direccion)
  if (origenCp) out.origin_postal_code = { value: origenCp, from: 'recogida_direccion', raw: String(f.recogida_direccion) }
  else out.blocked.push('No se ha encontrado un código postal en la dirección de recogida.')

  const destinoCp = postalCodeFrom(f.entrega_direccion)
  if (destinoCp) out.destination_postal_code = { value: destinoCp, from: 'entrega_direccion', raw: String(f.entrega_direccion) }
  else out.blocked.push('No se ha encontrado un código postal en la dirección de entrega.')

  // El país solo se propone cuando el propio encargo dice que es nacional y el
  // CP es español. En cualquier otro caso lo elige el operador: un envío
  // internacional sin país declarado no se adivina.
  const nacional = typeof f.tipo_entrega === 'string' && /nacional/i.test(f.tipo_entrega)
  if (nacional && origenCp) out.origin_country = { value: 'ES', from: 'tipo_entrega', raw: String(f.tipo_entrega) }
  if (nacional && destinoCp) out.destination_country = { value: 'ES', from: 'tipo_entrega', raw: String(f.tipo_entrega) }
  if (!nacional) out.blocked.push('El encargo no declara envío nacional: el país de origen y destino los elige el operador.')

  // ── packages[]: el punto donde el contrato prohíbe ser listo ──────────────
  const bultos = typeof f.bultos === 'number' ? f.bultos : Number(f.bultos)
  const peso = typeof f.peso_kg === 'number' ? f.peso_kg : Number(f.peso_kg)
  const dims = dimensionsFrom(f.medidas)

  if (!Number.isFinite(bultos) || bultos < 1) {
    out.blocked.push('El encargo no dice cuántos bultos son.')
  } else if (bultos > 1) {
    out.blocked.push(
      `El encargo trae ${bultos} bultos con unas solas medidas${Number.isFinite(peso) ? ` y un peso de ${peso} kg` : ''}: ` +
      'no consta si el peso es por bulto o el total, ni si las medidas valen para todos. ' +
      'El contrato prohíbe repartir el peso o replicar las medidas: hay que escribir cada bulto.'
    )
  } else if (!dims) {
    out.blocked.push('Las medidas del encargo no se pueden leer como largo × ancho × alto.')
  } else if (!Number.isFinite(peso) || peso <= 0) {
    out.blocked.push('El encargo no trae un peso utilizable.')
  } else {
    // Un solo bulto: medidas y peso son suyos sin ambigüedad posible.
    out.packages = {
      value: [{ id: 'P1', quantity: 1, lengthCm: dims[0], widthCm: dims[1], heightCm: dims[2], weightKg: peso }],
      from: 'bultos + medidas + peso_kg',
      raw: `${bultos} bulto · ${String(f.medidas)} · ${peso} kg`,
    }
  }

  // La paletización NUNCA se propone: el contrato la exige explícita.
  out.blocked.push('La paletización no se deduce nunca del peso ni de las medidas: hay que declararla.')
  return out
}
