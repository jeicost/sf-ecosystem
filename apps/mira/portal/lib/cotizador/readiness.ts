import type { QuotePackage } from './contract'

// ¿Se puede preguntar el precio de este envío? Función pura, sin red ni BD:
// es la puerta que impide llamar al Cotizador con datos fabricados.
//
// La guía v1 es explícita: «Si faltan peso, dimensiones, paletización, CP/país
// o definición suficiente de packages[], el encargo debe quedar
// PENDIENTE_DATOS. No se usan valores por defecto para fabricar una
// cotización.» Por eso aquí no hay ni un solo valor por defecto.

export type MissingReason =
  | 'origin_country' | 'origin_postal_code'
  | 'destination_country' | 'destination_postal_code'
  | 'palletized'
  | 'packages_empty'
  | 'package_quantity' | 'package_dimensions' | 'package_weight' | 'package_id_duplicated'

export interface MissingItem {
  reason: MissingReason
  /** Índice del bulto cuando el problema es de un bulto concreto. */
  packageIndex?: number
  packageId?: string
}

export interface ShipmentDraft {
  origin_country?: string | null
  origin_postal_code?: string | null
  destination_country?: string | null
  destination_postal_code?: string | null
  palletized?: boolean | null
  packages?: unknown
}

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0
const positive = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v) && v > 0

/** Un bulto válido según el contrato: medidas y peso POR UNIDAD, todo > 0. */
export function packageProblems(p: unknown, index: number): MissingItem[] {
  const out: MissingItem[] = []
  const pkg = (p ?? {}) as Partial<QuotePackage>
  const id = typeof pkg.id === 'string' ? pkg.id : undefined
  const q = pkg.quantity
  if (!(typeof q === 'number' && Number.isInteger(q) && q >= 1)) {
    out.push({ reason: 'package_quantity', packageIndex: index, packageId: id })
  }
  if (!positive(pkg.lengthCm) || !positive(pkg.widthCm) || !positive(pkg.heightCm)) {
    out.push({ reason: 'package_dimensions', packageIndex: index, packageId: id })
  }
  if (!positive(pkg.weightKg)) {
    out.push({ reason: 'package_weight', packageIndex: index, packageId: id })
  }
  return out
}

/**
 * Todo lo que impide cotizar. Lista vacía = listo para preguntar.
 *
 * `ratingArea` NO se comprueba aquí a propósito: quién lo necesita lo decide el
 * Cotizador en /rating-areas, y MIRA no puede adivinarlo.
 */
export function missingForQuote(s: ShipmentDraft): MissingItem[] {
  const out: MissingItem[] = []
  if (!filled(s.origin_country)) out.push({ reason: 'origin_country' })
  if (!filled(s.origin_postal_code)) out.push({ reason: 'origin_postal_code' })
  if (!filled(s.destination_country)) out.push({ reason: 'destination_country' })
  if (!filled(s.destination_postal_code)) out.push({ reason: 'destination_postal_code' })
  // false es una respuesta válida; null/undefined significa que nadie lo ha
  // dicho, y el contrato prohíbe deducirlo por peso o medidas.
  if (typeof s.palletized !== 'boolean') out.push({ reason: 'palletized' })

  const packages = Array.isArray(s.packages) ? s.packages : []
  if (packages.length === 0) {
    out.push({ reason: 'packages_empty' })
    return out
  }
  const seen = new Set<string>()
  packages.forEach((p, i) => {
    out.push(...packageProblems(p, i))
    const id = (p as Partial<QuotePackage>)?.id
    if (typeof id === 'string') {
      if (seen.has(id)) out.push({ reason: 'package_id_duplicated', packageIndex: i, packageId: id })
      seen.add(id)
    }
  })
  return out
}

export function isQuotable(s: ShipmentDraft): boolean {
  return missingForQuote(s).length === 0
}

/** Estado que corresponde a un envío según lo que le falte. */
export function statusForDraft(s: ShipmentDraft): 'pendiente_datos' | 'listo' {
  return isQuotable(s) ? 'listo' : 'pendiente_datos'
}
