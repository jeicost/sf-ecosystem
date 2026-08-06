import type Anthropic from '@anthropic-ai/sdk'
import { t, type Locale } from '@/lib/i18n'
import type { QuickActionDef, QAField } from '@/lib/quick-actions/registry'

// Tools del modo guiado de quick actions. El entrevistador captura campos con
// set_fields (validados contra la def del registry), elige lead con
// select_lead (solo si la acción lo declara) y dispara la generación con
// submit_action. El molde de ejecución (bucle + is_error) es el del onboarding.

export function buildGuidedTools(def: QuickActionDef): Anthropic.Tool[] {
  const fieldNames = def.fields.filter((f) => f.type !== 'lead_picker').map((f) => f.name)

  const tools: Anthropic.Tool[] = [
    {
      name: 'set_fields',
      description: `Save one or more form fields as soon as the user (or an attachment) provides their value. Valid fields: ${fieldNames.join(', ')}. Call it incrementally — don't wait until you have them all.`,
      input_schema: {
        type: 'object' as const,
        properties: {
          fields: {
            type: 'object' as const,
            description: 'Field→value pairs to save (merged on top of what has already been captured)',
          },
        },
        required: ['fields'],
      },
    },
    {
      name: 'submit_action',
      description:
        'Launch the generation with the captured fields. Call it ONLY after summarizing what was captured and after the user has explicitly confirmed.',
      input_schema: { type: 'object' as const, properties: {} },
    },
  ]

  if (def.fields.some((f) => f.type === 'lead_picker')) {
    tools.splice(1, 0, {
      name: 'select_lead',
      description:
        'Attach a pipeline lead to this action (or run it without a lead if the user prefers not to). Use the exact id from the lead list in the context.',
      input_schema: {
        type: 'object' as const,
        properties: {
          lead_id: { type: 'string' as const, description: 'id of the chosen lead' },
        },
        required: ['lead_id'],
      },
    })
  }

  return tools
}

export interface SetFieldsResult {
  merged: Record<string, unknown>
  chips: string[]
  errors: string[]
}

function coerceValue(field: QAField, value: unknown): { value: unknown; error?: string } {
  switch (field.type) {
    case 'toggle': {
      const v = value === true || value === 'true' || value === 'sí' || value === 'si' || value === 'yes'
      return { value: v }
    }
    case 'number': {
      const n = Number(value)
      if (!Number.isFinite(n)) return { value, error: `"${field.name}" must be a number` }
      if (field.min != null && n < field.min) return { value: field.min }
      if (field.max != null && n > field.max) return { value: field.max }
      return { value: n }
    }
    case 'select': {
      const allowed = (field.options ?? []).map((o) => o.value)
      if (typeof value === 'string' && allowed.includes(value)) return { value }
      // tolerar mayúsculas/espacios antes de rechazar
      const normalized = String(value).trim().toLowerCase()
      const match = allowed.find((a) => a.toLowerCase() === normalized)
      if (match) return { value: match }
      return { value, error: `"${field.name}" must be one of: ${allowed.filter(Boolean).join(', ')}` }
    }
    case 'checkbox_group': {
      const allowed = (field.options ?? []).map((o) => o.value)
      const arr = Array.isArray(value) ? value : [value]
      const valid = arr.map(String).filter((v) => allowed.includes(v))
      return { value: valid }
    }
    default:
      return { value: value == null ? '' : String(value) }
  }
}

export function applySetFields(
  def: QuickActionDef,
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
  locale: Locale
): SetFieldsResult {
  const merged = { ...current }
  const chips: string[] = []
  const errors: string[] = []

  for (const [name, rawValue] of Object.entries(incoming ?? {})) {
    const field = def.fields.find((f) => f.name === name && f.type !== 'lead_picker')
    if (!field) {
      errors.push(`Unknown field: "${name}"`)
      continue
    }
    if (rawValue == null || rawValue === '') {
      merged[name] = null // saltado explícitamente
      continue
    }
    const { value, error } = coerceValue(field, rawValue)
    if (error) {
      errors.push(error)
      continue
    }
    merged[name] = value
    const label = t(field.labelKey, locale)
    const display = Array.isArray(value) ? value.join(', ') : String(value)
    chips.push(`${label}: ${display.slice(0, 60)}`)
  }

  return { merged, chips, errors }
}

export function missingRequiredFields(
  def: QuickActionDef,
  fields: Record<string, unknown>,
  locale: Locale
): string[] {
  return def.fields
    .filter((f) => {
      if (!f.required || f.type === 'lead_picker') return false
      // Campos condicionales ocultos no cuentan como requeridos
      if (f.visibleWhen && fields[f.visibleWhen.field] !== f.visibleWhen.equals) return false
      const v = fields[f.name]
      return v == null || v === '' || (Array.isArray(v) && v.length === 0)
    })
    .map((f) => t(f.labelKey, locale))
}
