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
      outputType: 'json',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="client_name"
            placeholder="Company name"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="text"
            name="industry"
            placeholder="Industry"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="number"
            name="target_count"
            placeholder="Number of leads"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            defaultValue="10"
            required
          />
        </div>
      ),
    },
    {
      id: 'generar_icp',
      title: t('actions.comercial.generar_icp', locale),
      description: t('actions.comercial.generar_icp.desc', locale),
      actionType: 'generar_icp',
      outputType: 'json',
      form: (
        <div className="space-y-3">
          <textarea
            name="lead_data"
            placeholder="Lead information (JSON or text)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-20"
            required
          />
          <textarea
            name="company_info"
            placeholder="Your company info"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
    {
      id: 'crear_propuesta',
      title: t('actions.comercial.crear_propuesta', locale),
      description: t('actions.comercial.crear_propuesta.desc', locale),
      actionType: 'crear_propuesta',
      outputType: 'document',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="prospect_name"
            placeholder="Prospect name"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <textarea
            name="call_brief"
            placeholder="Call notes or discovery brief"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
            required
          />
          <input
            type="number"
            name="budget_estimate"
            placeholder="Budget estimate"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
    {
      id: 'calificar_reply',
      title: t('actions.comercial.calificar_reply', locale),
      description: t('actions.comercial.calificar_reply.desc', locale),
      actionType: 'calificar_reply',
      outputType: 'json',
      form: (
        <div className="space-y-3">
          <textarea
            name="prospect_reply"
            placeholder="Prospect's email reply"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-20"
            required
          />
          <input
            type="text"
            name="context"
            placeholder="Context (what you sent)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('actions.quick-actions', locale)}</h3>
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
