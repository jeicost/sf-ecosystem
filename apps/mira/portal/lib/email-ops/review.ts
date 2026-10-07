import type { FieldDef, FieldValue } from './schema'

// Datos que MIRA ha SUPUESTO, marcados para revisión (Carlos, 7-oct-2026: «si el
// sistema presupone algún dato lo debe marcar para revisión»).
//
// El modelo devuelve, por campo, una confianza (1 = escrito tal cual; 0,6 =
// deducido con seguridad; 0,3 = ambiguo) y la evidencia literal de la que sale.
// Aquí no se llama a ningún modelo: TypeScript decide con esas dos señales
// qué campos lleva el parte que NO están escritos en el correo. Lo que la
// persona corrige a mano (manual_overrides) deja de estar en revisión.

export type MotivoRevision = 'deducido' | 'ambiguo' | 'sin-evidencia'

export interface CampoARevisar { key: string; motivo: MotivoRevision; confianza: number | null; evidencia: string | null }

/** Por debajo de esto el dato se considera deducido, no leído. */
export const UMBRAL_LITERAL = 0.95
/** Por debajo de esto, ambiguo: ni siquiera la deducción es segura. */
export const UMBRAL_AMBIGUO = 0.5

export function motivoRevision(value: FieldValue | undefined, conf: number | undefined, evidencia: string | undefined, manual: boolean): MotivoRevision | null {
  if (manual) return null
  if (value === null || value === undefined || value === '') return null
  const c = typeof conf === 'number' && Number.isFinite(conf) ? conf : null
  if (c !== null && c < UMBRAL_AMBIGUO) return 'ambiguo'
  if (c !== null && c < UMBRAL_LITERAL) return 'deducido'
  if (!evidencia || !String(evidencia).trim()) return 'sin-evidencia'
  return null
}

export function camposARevisar(
  ticket: { fields?: Record<string, FieldValue> | null; confidence?: Record<string, number> | null; evidence?: Record<string, string> | null; manual_overrides?: Record<string, unknown> | null },
  schema: readonly FieldDef[],
): CampoARevisar[] {
  const out: CampoARevisar[] = []
  for (const f of schema) {
    const motivo = motivoRevision(ticket.fields?.[f.key], ticket.confidence?.[f.key], ticket.evidence?.[f.key], !!ticket.manual_overrides?.[f.key])
    if (motivo) out.push({ key: f.key, motivo, confianza: ticket.confidence?.[f.key] ?? null, evidencia: ticket.evidence?.[f.key] ?? null })
  }
  return out
}

/** Recuento rápido para la tabla, sin esquema: todos los campos con valor cuya confianza no llega al umbral. */
export function cuentaRevision(ticket: { fields?: Record<string, FieldValue> | null; confidence?: Record<string, number> | null; evidence?: Record<string, string> | null; manual_overrides?: Record<string, unknown> | null }): number {
  let n = 0
  for (const [k, v] of Object.entries(ticket.fields || {})) {
    if (motivoRevision(v, ticket.confidence?.[k], ticket.evidence?.[k], !!ticket.manual_overrides?.[k])) n++
  }
  return n
}
