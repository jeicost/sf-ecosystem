/**
 * Memoria de precios: rangos comparables a partir de las fichas de condiciones.
 * TODO EN TYPESCRIPT, sin modelo: una cifra que se presenta como «lo que hemos
 * cobrado por esto» tiene que ser un cálculo reproducible sobre fichas
 * concretas, no una opinión. (Regla de la casa: el modelo clasifica, TS computa.)
 */

export interface FichaParaComparar {
  id: string
  customer_name: string | null
  customer_sector: string | null
  service_scope: string | null
  doc_kind: string
  doc_date: string | null
  outcome: string
  status: string
  conditions: Array<{ concepto: string; importe: number | null; unidad: string; moneda?: string; condiciones?: string }>
}

export interface Comparable {
  concepto: string
  unidad: string
  n: number
  min: number
  mediana: number
  max: number
  ultimo: { importe: number; cliente: string | null; fecha: string | null; ficha_id: string }
  muestras: Array<{ importe: number; cliente: string | null; fecha: string | null; condiciones: string; ficha_id: string; outcome: string }>
}

export interface ConsultaComparables {
  /** Palabras del concepto a buscar (p. ej. «urgente moto», «palet»). Vacío = todos. */
  q?: string
  scope?: string
  /** Solo fichas revisadas (por defecto, también las extraídas sin revisar). */
  soloRevisadas?: boolean
  /** Solo fichas con resultado ganada/renovada. */
  soloGanadas?: boolean
  desde?: string
}

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'por', 'con', 'para', 'un', 'una', 'al'])

export function normalizarConcepto(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizarUnidad(s: string): string {
  const u = normalizarConcepto(s)
  if (/envio|servicio|expedicion/.test(u)) return 'por envío'
  if (/bulto|paquete/.test(u)) return 'por bulto'
  if (/\bkm\b|kilometro/.test(u)) return 'por km'
  if (/hora/.test(u)) return 'por hora'
  if (/\bkg\b|kilo/.test(u)) return 'por kg'
  if (/palet/.test(u)) return 'por palet'
  if (/mes|mensual/.test(u)) return 'mensual'
  if (/%|porcentaje/.test(u)) return '%'
  return u || 'unidad'
}

function tokens(s: string): string[] {
  return normalizarConcepto(s).split(' ').filter((t) => t.length > 2 && !STOP.has(t))
}

function coincide(concepto: string, q: string | undefined): boolean {
  if (!q || !q.trim()) return true
  const qt = tokens(q)
  if (!qt.length) return true
  const ct = new Set(tokens(concepto))
  return qt.every((t) => [...ct].some((c) => c.startsWith(t) || t.startsWith(c)))
}

export function mediana(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Agrupa las líneas de condiciones por concepto normalizado + unidad y calcula
 * mínimo, mediana, máximo y la última cifra cobrada (por fecha del documento).
 */
export function comparables(fichas: FichaParaComparar[], consulta: ConsultaComparables = {}): Comparable[] {
  const grupos = new Map<string, { concepto: string; unidad: string; muestras: Comparable['muestras'] }>()
  for (const f of fichas) {
    if (f.status === 'discarded') continue
    if (consulta.soloRevisadas && f.status !== 'reviewed') continue
    if (consulta.soloGanadas && !['ganada', 'renovada'].includes(f.outcome)) continue
    if (consulta.scope && f.service_scope && f.service_scope !== consulta.scope) continue
    if (consulta.desde && f.doc_date && f.doc_date < consulta.desde) continue
    for (const c of f.conditions || []) {
      if (c.importe === null || c.importe === undefined || !Number.isFinite(c.importe) || c.importe < 0) continue
      if (!coincide(c.concepto, consulta.q)) continue
      const unidad = normalizarUnidad(c.unidad || '')
      const key = `${normalizarConcepto(c.concepto)}|${unidad}`
      const g = grupos.get(key) || { concepto: c.concepto.trim(), unidad, muestras: [] }
      g.muestras.push({ importe: c.importe, cliente: f.customer_name, fecha: f.doc_date, condiciones: c.condiciones || '', ficha_id: f.id, outcome: f.outcome })
      grupos.set(key, g)
    }
  }
  const out: Comparable[] = []
  for (const g of grupos.values()) {
    const importes = g.muestras.map((m) => m.importe)
    const ultimo = [...g.muestras].sort((a, b) => ((b.fecha || '') > (a.fecha || '') ? 1 : -1))[0]
    out.push({
      concepto: g.concepto,
      unidad: g.unidad,
      n: g.muestras.length,
      min: Math.min(...importes),
      mediana: mediana(importes),
      max: Math.max(...importes),
      ultimo: { importe: ultimo.importe, cliente: ultimo.cliente, fecha: ultimo.fecha, ficha_id: ultimo.ficha_id },
      muestras: g.muestras.sort((a, b) => ((b.fecha || '') > (a.fecha || '') ? 1 : -1)).slice(0, 25),
    })
  }
  return out.sort((a, b) => b.n - a.n || a.concepto.localeCompare(b.concepto))
}
