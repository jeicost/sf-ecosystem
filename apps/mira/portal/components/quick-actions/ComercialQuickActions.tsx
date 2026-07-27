'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function ComercialQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  // Acción clicada, guardada en el momento del click (activeActionId es el UUID
  // del servidor y nunca coincide con los ids locales de `actions`).
  const [activeAction, setActiveAction] = useState<{ title: string; outputType: string } | null>(null)
  const { locale } = useLocaleContext()

  const actions = [
    {
      id: 'crear_campaña',
      title: t('actions.comercial.crear_campaña', locale),
      description: t('actions.comercial.crear_campaña.desc', locale),
      actionType: 'crear_campaña',
      outputType: 'structured',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="client_name"
            placeholder="Company name"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            required
          />
          <input
            type="text"
            name="industry"
            placeholder="Industry (optional)"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
          />
          <input
            type="number"
            name="target_count"
            placeholder="Number of leads"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            defaultValue="10"
            required
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-ink mb-3">{t('actions.quick-actions', locale)}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              actionType={action.actionType}
              department="comercial"
              inputForm={action.form}
              onActionComplete={(actionId) => {
                setActiveAction({ title: action.title, outputType: action.outputType })
                setActiveActionId(actionId)
              }}
            />
          ))}
        </div>
      </div>

      {activeActionId && (
        <QuickActionResult
          actionId={activeActionId}
          resourceName={activeAction?.title || 'Resource'}
          outputType={activeAction?.outputType}
          department="comercial"
        />
      )}
    </div>
  )
}
