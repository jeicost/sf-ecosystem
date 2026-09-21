// Panel de operación de Email Ops: de los tickets a las cifras del departamento.
//
// Función pura a propósito (sin BD, sin red): recibe filas y devuelve números.
// Así se puede probar con datos inventados y la ruta solo se ocupa de acotar el
// cliente. Y es la doctrina de la casa: el modelo extrae, TypeScript CUENTA —
// ningún total del panel sale de la IA.
//
// Es también la referencia de cómo cuelga un dashboard en MIRA: el dato vive en
// nuestras tablas, acotado por cliente en servidor, y se agrega aquí.

import type { FieldValue } from './schema'

/** Lo mínimo de un ticket que necesita el panel (subconjunto de TicketRow). */
export interface StatsTicket {
  kind: string
  status: string
  service_date: string | null
  delivery_type: string | null
  urgency: number | null
  missing_fields: string[] | null
  first_message_at: string | null
  from_address: string | null
  /** Quién originó el encargo si llegó reenviado (lo extrae la IA). */
  original_sender?: string | null
  fields: Record<string, FieldValue> | null
}

export type DeliveryKey = 'local' | 'nacional' | 'internacional' | 'none'

export interface OpsStats {
  totals: {
    /** Encargos (kind = shipment_request, sin descartados). */
    requests: number
    /** Suma de bultos donde el correo daba la cifra. */
    packages: number
    /** Cuántos encargos traían cifra de bultos (el resto no la declaró). */
    packagesKnown: number
    /** Encargos con todos los campos obligatorios rellenos. */
    complete: number
    /** Urgencia ≥ 4. */
    urgent: number
    /** Clientes distintos que han hecho encargos. */
    clients: number
    /** Correos que no eran encargos (facturas, publicidad, conversación). */
    other: number
  }
  /** Encargos por fecha de servicio, ascendente. */
  byDay: { date: string; count: number }[]
  /** Encargos sin fecha de servicio (no entran en byDay). */
  noDate: number
  byDelivery: { key: DeliveryKey; count: number }[]
  byVehicle: { key: string; count: number }[]
  /**
   * Una fila por ORGANIZACIÓN. Si una organización escribe desde varios
   * departamentos (RENFE: Promociones, Centro Médico, Ed. Triada), se agrupan
   * y `departments` lista los nombres que aparecieron.
   */
  clients: { name: string; requests: number; packages: number; lastDate: string | null; departments: string[] }[]
  /** Qué campo obligatorio falta más a menudo. */
  missing: { field: string; count: number }[]
}

/**
 * El vehículo viene en texto libre ("furgoneta", "furgón ADR", "moto"...).
 * Se agrupa por familia. OJO al orden: "furgoneta" contiene "furg", así que se
 * comprueba antes que "furgón".
 */
export function vehicleFamily(raw: FieldValue | undefined): string {
  if (raw === null || raw === undefined || String(raw).trim() === '') return 'none'
  const v = String(raw).toLowerCase()
  if (v.includes('moto')) return 'moto'
  if (v.includes('furgoneta')) return 'furgoneta'
  if (v.includes('furg')) return 'furgon'
  if (v.includes('cami') || v.includes('trail')) return 'camion'
  if (v.includes('coche') || v.includes('turismo')) return 'coche'
  return 'otro'
}

/**
 * Nombre del cliente para agrupar. El remitente llega como
 * "AJOOMAL ASOCIADOS S.L. — Rosa García, 913821710": la empresa es lo que va
 * antes del guion largo. Sin remitente se usa el dominio del correo.
 */
export function clientName(t: StatsTicket): string {
  const rem = t.fields?.remitente
  if (typeof rem === 'string' && rem.trim()) {
    const company = rem.split(/\s+[—–-]\s+/)[0].trim()
    if (company) return company.slice(0, 80)
  }
  const domain = (t.from_address || '').split('@')[1]
  return domain ? domain.toLowerCase() : 'Desconocido'
}

// ── Organización del remitente ────────────────────────────────────────────
// Un cliente grande escribe desde varios departamentos con nombres distintos
// ("RENFE Promociones", "Centro Médico Fuencarral (RENFE)"...). El nombre no
// sirve para agruparlos; el DOMINIO del correo, sí. Tres salvaguardas:
//  · si el correo llegó reenviado, manda el remitente ORIGINAL;
//  · los correos gratuitos (gmail, hotmail...) no son una organización;
//  · el dominio propio del departamento (el del reenviador) tampoco.

const FREE_MAIL = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es',
  'live.com', 'live.es', 'msn.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com',
  'protonmail.com', 'proton.me', 'telefonica.net', 'movistar.es', 'gmx.com', 'gmx.es',
])

/** Sufijos de segundo nivel: en "empresa.com.es" el dominio es de tres etiquetas. */
const SECOND_LEVEL = new Set(['com.es', 'org.es', 'gob.es', 'edu.es', 'nom.es', 'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.mx', 'com.ar', 'com.br', 'com.co', 'com.pe', 'com.pt'])

export function extractEmail(raw: string | null | undefined): string | null {
  const m = (raw || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return m ? m[0].toLowerCase() : null
}

/** "e.dominguez@colaboradores.renfe.es" → "renfe.es". */
export function registrableDomain(email: string | null): string | null {
  const host = email?.split('@')[1]?.toLowerCase().replace(/\.$/, '')
  if (!host || !host.includes('.')) return null
  const labels = host.split('.')
  const lastTwo = labels.slice(-2).join('.')
  return SECOND_LEVEL.has(lastTwo) && labels.length >= 3 ? labels.slice(-3).join('.') : lastTwo
}

/** Clave de agrupación: dominio de la organización o, si no lo hay, el nombre. */
export function orgKey(t: StatsTicket, internalDomains: Set<string>): string {
  for (const cand of [t.original_sender, t.from_address]) {
    const d = registrableDomain(extractEmail(cand))
    if (d && !FREE_MAIL.has(d) && !internalDomains.has(d)) return `@${d}`
  }
  return `#${clientName(t).toLowerCase()}`
}

const STOP = new Set(['DEL', 'LAS', 'LOS', 'THE', 'AND', 'SAU', 'SLU', 'LTD', 'INC'])

/**
 * Nombre visible de un grupo con varios departamentos: la palabra que TODOS
 * comparten ("RENFE"); si no hay ninguna, la primera etiqueta del dominio.
 */
export function groupDisplayName(names: string[], key: string): string {
  if (names.length === 1) return names[0]
  const words = (n: string) => n.match(/[\p{L}\p{N}]{3,}/gu) || []
  const common = words(names[0]).find((w) => {
    const W = w.toUpperCase()
    return !STOP.has(W) && names.every((n) => words(n).some((x) => x.toUpperCase() === W))
  })
  if (common) return common
  return key.startsWith('@') ? key.slice(1).split('.')[0].toUpperCase() : names[0]
}

function inc<K>(map: Map<K, number>, key: K, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by)
}

export function computeOpsStats(tickets: StatsTicket[], opts: { internalDomains?: string[] } = {}): OpsStats {
  const internal = new Set((opts.internalDomains || []).map((d) => d.toLowerCase()))
  const live = tickets.filter((t) => t.status !== 'discarded')
  const requests = live.filter((t) => t.kind === 'shipment_request')
  const other = live.filter((t) => t.kind === 'other').length

  let packages = 0
  let packagesKnown = 0
  let complete = 0
  let urgent = 0
  const byDay = new Map<string, number>()
  let noDate = 0
  const byDelivery = new Map<DeliveryKey, number>()
  const byVehicle = new Map<string, number>()
  const byClient = new Map<string, { names: Map<string, number>; requests: number; packages: number; lastDate: string | null }>()
  const missing = new Map<string, number>()

  for (const t of requests) {
    const b = t.fields?.bultos
    const bultos = typeof b === 'number' && Number.isFinite(b) && b >= 0 ? b : null
    if (bultos !== null) { packages += bultos; packagesKnown++ }

    const miss = t.missing_fields || []
    if (miss.length === 0) complete++
    for (const f of miss) inc(missing, f)

    if ((t.urgency ?? 0) >= 4) urgent++

    if (t.service_date) inc(byDay, t.service_date.slice(0, 10))
    else noDate++

    const d = t.delivery_type
    inc(byDelivery, d === 'local' || d === 'nacional' || d === 'internacional' ? d : 'none')

    inc(byVehicle, vehicleFamily(t.fields?.tipo_vehiculo))

    const key = orgKey(t, internal)
    const c = byClient.get(key) ?? { names: new Map<string, number>(), requests: 0, packages: 0, lastDate: null }
    inc(c.names, clientName(t))
    c.requests++
    if (bultos !== null) c.packages += bultos
    const when = t.service_date || t.first_message_at?.slice(0, 10) || null
    if (when && (!c.lastDate || when > c.lastDate)) c.lastDate = when
    byClient.set(key, c)
  }

  const desc = <T extends { count: number }>(a: T, b: T) => b.count - a.count

  return {
    totals: {
      requests: requests.length,
      packages,
      packagesKnown,
      complete,
      urgent,
      clients: byClient.size,
      other,
    },
    byDay: [...byDay].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    noDate,
    byDelivery: [...byDelivery].map(([key, count]) => ({ key, count })).sort(desc),
    byVehicle: [...byVehicle].map(([key, count]) => ({ key, count })).sort(desc),
    clients: [...byClient].map(([key, c]) => {
      // Departamentos ordenados por volumen: el principal primero.
      const names = [...c.names].sort((a, b) => b[1] - a[1]).map(([n]) => n)
      return { name: groupDisplayName(names, key), requests: c.requests, packages: c.packages, lastDate: c.lastDate, departments: names.length > 1 ? names : [] }
    }).sort((a, b) => b.requests - a.requests || b.packages - a.packages || a.name.localeCompare(b.name)),
    missing: [...missing].map(([field, count]) => ({ field, count })).sort(desc),
  }
}
