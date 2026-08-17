// Esquema de campos de Email Ops. Es el "Excel de trabajo operaciones" del
// cliente expresado como definición: cada FieldDef es una columna. Vive en
// código (no en BD) para que la IA, la validación, la UI y el export lean la
// MISMA fuente; `schema_key` en email_ops_settings elige cuál aplica al cliente
// (v1: el mismo para las cuatro marcas del Grupo Aldea).
//
// Módulo de datos puros: sin imports de servidor, se puede usar en el navegador.

export type FieldType = 'date' | 'time' | 'int' | 'number' | 'text' | 'enum'

export interface FieldDef {
  key: string
  type: FieldType
  enum?: readonly string[]
  required: boolean
  labels: { es: string; en: string }
  /** Cabecera de la columna en el XLSX exportado (el nombre que ellos usan). */
  excelHeader: string
  /** Pista para la IA sobre qué buscar / cómo normalizar. */
  hint: string
}

export type FieldValue = string | number | null

export const DELIVERY_TYPES = ['local', 'nacional', 'internacional'] as const
export type DeliveryType = (typeof DELIVERY_TYPES)[number]

export const COURIER_V1_FIELDS: readonly FieldDef[] = [
  { key: 'fecha', type: 'date', required: true, labels: { es: 'Fecha', en: 'Date' }, excelHeader: 'Fecha',
    hint: 'Fecha del servicio (recogida). ISO YYYY-MM-DD. Si el correo dice "mañana" o "el lunes", resuélvelo respecto a la fecha del correo.' },
  { key: 'tipo_entrega', type: 'enum', enum: DELIVERY_TYPES, required: true, labels: { es: 'Tipo de entrega', en: 'Delivery type' }, excelHeader: 'Tipo de entrega',
    hint: 'local = misma ciudad/área metropolitana; nacional = resto de España; internacional = fuera de España. Dedúcelo de las direcciones si no se dice.' },
  { key: 'tipo_vehiculo', type: 'text', required: false, labels: { es: 'Tipo de vehículo', en: 'Vehicle' }, excelHeader: 'Tipo de vehículo',
    hint: 'Vehículo pedido o deducido del volumen: moto, coche, furgoneta, furgón, camión, trailer. Si piden frío/refrigerado, ADR u otra característica, añádela al tipo (p. ej. "furgoneta refrigerada", "furgón ADR"), no la pongas sola.' },
  { key: 'recogida_hora_inicio', type: 'time', required: true, labels: { es: 'Recogida desde', en: 'Pickup from' }, excelHeader: 'Hora inicio recogida',
    hint: 'HH:MM (24h). Inicio de la ventana de recogida.' },
  { key: 'recogida_hora_fin', type: 'time', required: false, labels: { es: 'Recogida hasta', en: 'Pickup until' }, excelHeader: 'Hora fin recogida',
    hint: 'HH:MM (24h). Fin de la ventana de recogida.' },
  { key: 'entrega_hora_inicio', type: 'time', required: false, labels: { es: 'Entrega desde', en: 'Delivery from' }, excelHeader: 'Hora inicio entrega',
    hint: 'HH:MM (24h). Inicio de la ventana de entrega.' },
  { key: 'entrega_hora_fin', type: 'time', required: false, labels: { es: 'Entrega hasta', en: 'Delivery until' }, excelHeader: 'Hora fin entrega',
    hint: 'HH:MM (24h). Fin de la ventana de entrega / hora límite.' },
  { key: 'bultos', type: 'int', required: true, labels: { es: 'Bultos', en: 'Packages' }, excelHeader: 'Número de bultos',
    hint: 'Número entero de bultos/paquetes/palets.' },
  { key: 'peso_kg', type: 'number', required: false, labels: { es: 'Peso (kg)', en: 'Weight (kg)' }, excelHeader: 'Pesos',
    hint: 'Peso total en kg (número). Convierte gramos/toneladas.' },
  { key: 'medidas', type: 'text', required: false, labels: { es: 'Medidas', en: 'Dimensions' }, excelHeader: 'Medidas',
    hint: 'Medidas tal como vengan, normalizadas a "L x A x H cm" cuando sea posible.' },
  { key: 'recogida_direccion', type: 'text', required: true, labels: { es: 'Dirección de recogida', en: 'Pickup address' }, excelHeader: 'Localización de recogida',
    hint: 'Dirección completa de recogida (calle, número, CP, ciudad). Copia literal, no la completes.' },
  { key: 'entrega_direccion', type: 'text', required: true, labels: { es: 'Dirección de entrega', en: 'Delivery address' }, excelHeader: 'Localización de entrega',
    hint: 'Dirección completa de entrega. Copia literal, no la completes.' },
  { key: 'remitente', type: 'text', required: true, labels: { es: 'Remitente', en: 'Sender' }, excelHeader: 'Remitente',
    hint: 'Quién envía: empresa y/o persona de contacto, teléfono si aparece.' },
  { key: 'destinatario', type: 'text', required: true, labels: { es: 'Destinatario', en: 'Recipient' }, excelHeader: 'Destinatario',
    hint: 'Quién recibe: empresa y/o persona de contacto, teléfono si aparece.' },
]

export const SCHEMAS: Record<string, readonly FieldDef[]> = {
  courier_v1: COURIER_V1_FIELDS,
}

export const DEFAULT_SCHEMA_KEY = 'courier_v1'

export interface EmailOpsSettings {
  schema_key?: string | null
  rules?: string | null
  required_fields?: string[] | null
}

export function getSchema(schemaKey?: string | null): readonly FieldDef[] {
  return SCHEMAS[schemaKey || DEFAULT_SCHEMA_KEY] || COURIER_V1_FIELDS
}

export function getSchemaForClient(settings?: EmailOpsSettings | null): readonly FieldDef[] {
  return getSchema(settings?.schema_key)
}

/** Campos requeridos: los del ajuste del cliente si existen, si no los del esquema. */
export function requiredFieldsFor(schema: readonly FieldDef[], settings?: EmailOpsSettings | null): string[] {
  const keys = new Set(schema.map((f) => f.key))
  const custom = settings?.required_fields?.filter((k) => keys.has(k))
  if (custom && custom.length > 0) return custom
  return schema.filter((f) => f.required).map((f) => f.key)
}

export function computeMissingFields(fields: Record<string, FieldValue>, required: string[]): string[] {
  return required.filter((k) => {
    const v = fields[k]
    return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
  })
}

/** input_schema de la tool de extracción, generado del esquema para que no diverjan. */
export function buildToolInputSchema(schema: readonly FieldDef[]): Record<string, unknown> {
  const fieldProps: Record<string, unknown> = {}
  for (const f of schema) {
    const base: Record<string, unknown> = { description: f.hint }
    if (f.type === 'enum') {
      base.type = ['string', 'null']
      base.enum = [...(f.enum || []), null]
    } else if (f.type === 'int') {
      base.type = ['integer', 'null']
    } else if (f.type === 'number') {
      base.type = ['number', 'null']
    } else {
      base.type = ['string', 'null']
      if (f.type === 'date') base.description += ' Formato YYYY-MM-DD.'
      if (f.type === 'time') base.description += ' Formato HH:MM.'
    }
    fieldProps[f.key] = base
  }
  const confidenceProps: Record<string, unknown> = {}
  const evidenceProps: Record<string, unknown> = {}
  for (const f of schema) {
    confidenceProps[f.key] = { type: 'number', description: '0..1' }
    evidenceProps[f.key] = { type: 'string', description: 'Fragmento literal del correo o adjunto del que sale el valor. Vacío si el campo es null.' }
  }
  return {
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: ['shipment_request', 'other'],
        description: 'shipment_request si el correo pide, confirma o modifica un envío/recogida/entrega. other para facturas, notificaciones automáticas, publicidad, conversación sin encargo.',
      },
      summary: { type: 'string', description: 'Una frase en español: qué se pide (o qué es el correo si es other).' },
      original_sender: { type: 'string', description: 'Quién originó la petición si el correo es un reenvío (nombre y/o email de las cabeceras citadas). Vacío si no consta.' },
      urgency: { type: 'integer', minimum: 1, maximum: 5, description: '1 = sin prisa, 3 = normal, 5 = urgente/inmediato. Usa las palabras del correo ("urgente", "hoy", "ya") y la proximidad de la hora de recogida.' },
      fields: { type: 'object', properties: fieldProps, required: schema.map((f) => f.key), additionalProperties: false },
      confidence: { type: 'object', properties: confidenceProps, additionalProperties: false },
      evidence: { type: 'object', properties: evidenceProps, additionalProperties: false },
      notes: { type: 'string', description: 'Observaciones operativas que no caben en los campos (instrucciones de acceso, horario del almacén, contacto alternativo…).' },
    },
    required: ['kind', 'summary', 'urgency', 'fields', 'confidence', 'evidence'],
  }
}

// ── Coerción de valores (la salida de la IA y las ediciones manuales pasan por aquí) ──

const TIME_RE = /^([01]?\d|2[0-3])[:.h]([0-5]\d)?$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Normaliza un valor al tipo del campo. Inválido → null (nunca un valor "aproximado"). */
export function coerceFieldValue(def: FieldDef, raw: unknown): FieldValue {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'string' && raw.trim() === '') return null
  switch (def.type) {
    case 'text': return typeof raw === 'string' ? raw.trim().slice(0, 500) : String(raw).slice(0, 500)
    case 'enum': {
      const v = String(raw).trim().toLowerCase()
      return def.enum && (def.enum as readonly string[]).includes(v) ? v : null
    }
    case 'int': {
      const n = typeof raw === 'number' ? raw : parseInt(String(raw).replace(/[^\d-]/g, ''), 10)
      return Number.isFinite(n) ? Math.round(n) : null
    }
    case 'number': {
      const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.').replace(/[^\d.-]/g, ''))
      return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
    }
    case 'date': {
      const s = String(raw).trim()
      const m = s.match(DATE_RE)
      if (!m) {
        // dd/mm/yyyy tolerado
        const m2 = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
        if (!m2) return null
        return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`
      }
      const d = new Date(`${s}T00:00:00Z`)
      return Number.isNaN(d.getTime()) ? null : s
    }
    case 'time': {
      const s = String(raw).trim().toLowerCase()
      const m = s.match(TIME_RE)
      if (!m) return null
      return `${m[1].padStart(2, '0')}:${m[2] || '00'}`
    }
  }
}

export function coerceFields(schema: readonly FieldDef[], raw: Record<string, unknown> | null | undefined): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {}
  for (const f of schema) out[f.key] = coerceFieldValue(f, raw?.[f.key])
  return out
}

export function fieldLabel(def: FieldDef, locale: 'es' | 'en'): string {
  return def.labels[locale] || def.labels.en
}
