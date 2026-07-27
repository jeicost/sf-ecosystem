'use client'

import { useState } from 'react'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { LeadPicker } from './LeadPicker'
import type { QAField } from '@/lib/quick-actions/registry'
import type { AutofillBundle } from '@/lib/quick-actions/autofill-types'

const INPUT_CLASS =
  'w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm'

interface QuickActionFormProps {
  fields: QAField[]
  autofill?: AutofillBundle | null
  clientId: string | null
}

// Renderiza los campos declarados en el registry. Los `name` de los inputs son
// exactamente `field.name` — el submit por FormData de QuickActionButton no
// cambia, y la paridad con los prompts queda garantizada por construcción.
export function QuickActionForm({ fields, autofill, clientId }: QuickActionFormProps) {
  const { locale } = useLocaleContext()
  // Solo los toggles necesitan estado (controlan visibleWhen); el resto es uncontrolled.
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      fields.filter((f) => f.type === 'toggle').map((f) => [f.name, Boolean(f.defaultValue)])
    )
  )

  const autofillValue = (field: QAField): string | undefined => {
    if (!field.autofill || !autofill) return undefined
    const v = autofill[field.autofill]
    return v ?? undefined
  }

  const isVisible = (field: QAField): boolean => {
    if (!field.visibleWhen) return true
    const controller = fields.find((f) => f.name === field.visibleWhen!.field)
    if (controller?.type === 'toggle') {
      return toggles[field.visibleWhen.field] === field.visibleWhen.equals
    }
    return true
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        if (!isVisible(field)) return null
        const label = t(field.labelKey, locale)
        const placeholder = field.placeholderKey ? t(field.placeholderKey, locale) : label

        switch (field.type) {
          case 'text':
            return (
              <input
                key={field.name}
                type="text"
                name={field.name}
                placeholder={placeholder}
                defaultValue={autofillValue(field) ?? (field.defaultValue as string | undefined)}
                className={INPUT_CLASS}
                required={field.required}
              />
            )
          case 'textarea':
            return (
              <textarea
                key={field.name}
                name={field.name}
                placeholder={placeholder}
                defaultValue={autofillValue(field) ?? (field.defaultValue as string | undefined)}
                className={`${INPUT_CLASS} min-h-[84px]`}
                required={field.required}
              />
            )
          case 'number':
            return (
              <input
                key={field.name}
                type="number"
                name={field.name}
                placeholder={placeholder}
                defaultValue={field.defaultValue as number | undefined}
                min={field.min}
                max={field.max}
                className={INPUT_CLASS}
                required={field.required}
              />
            )
          case 'select':
            return (
              <select
                key={field.name}
                name={field.name}
                className={`${INPUT_CLASS.replace(' placeholder-ink-tertiary', '')}`}
                required={field.required}
                defaultValue={(field.defaultValue as string | undefined) ?? undefined}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelKey
                      ? t(opt.labelKey, locale)
                      : opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}
                  </option>
                ))}
              </select>
            )
          case 'checkbox_group':
            return (
              <div key={field.name} className="space-y-1">
                <p className="text-xs text-ink-secondary">{label}</p>
                <div className="flex flex-wrap gap-3">
                  {field.options?.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 text-sm text-ink">
                      <input type="checkbox" name={field.name} value={opt.value} className="accent-purple-500" />
                      {opt.labelKey ? t(opt.labelKey, locale) : opt.value.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
            )
          case 'toggle':
            return (
              <label key={field.name} className="flex items-center justify-between gap-2 text-sm text-ink cursor-pointer">
                <span>{label}</span>
                <input
                  type="checkbox"
                  name={field.name}
                  value="true"
                  checked={toggles[field.name] ?? false}
                  onChange={(e) => setToggles((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                  className="accent-purple-500 w-4 h-4"
                />
              </label>
            )
          case 'lead_picker':
            return <LeadPicker key={field.name} name={field.name} clientId={clientId} />
          default:
            return null
        }
      })}
    </div>
  )
}
