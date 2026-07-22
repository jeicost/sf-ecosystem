'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function AdminQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  // Acción clicada, guardada en el momento del click (activeActionId es el UUID
  // del servidor y nunca coincide con los ids locales de `actions`).
  const [activeAction, setActiveAction] = useState<{ title: string; outputType: string } | null>(null)
  const { locale } = useLocaleContext()

  const actions = [
    {
      id: 'responder_ticket',
      title: t('actions.admin.responder_ticket', locale),
      description: t('actions.admin.responder_ticket.desc', locale),
      actionType: 'responder_ticket',
      outputType: 'text',
      form: (
        <div className="space-y-3">
          <textarea
            name="issue"
            placeholder="Customer issue or question"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm h-16"
            required
          />
          <select
            name="customer_type"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
            required
          >
            <option value="enterprise">Enterprise</option>
            <option value="startup">Startup</option>
            <option value="individual">Individual</option>
          </select>
        </div>
      ),
    },
    {
      id: 'crear_faq',
      title: t('actions.admin.crear_faq', locale),
      description: t('actions.admin.crear_faq.desc', locale),
      actionType: 'crear_faq',
      outputType: 'document',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="topic"
            placeholder="FAQ topic"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            required
          />
          <input
            type="text"
            name="product_area"
            placeholder="Product area or feature"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            required
          />
        </div>
      ),
    },
    {
      id: 'crear_tutorial',
      title: t('actions.admin.crear_tutorial', locale),
      description: t('actions.admin.crear_tutorial.desc', locale),
      actionType: 'crear_tutorial',
      outputType: 'document',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="feature"
            placeholder="Feature to explain"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            required
          />
          <select
            name="skill_level"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
            required
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
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
              department="admin"
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
          department="admin"
        />
      )}
    </div>
  )
}
