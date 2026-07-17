'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function InnovacionQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const { locale } = useLocaleContext()

  const actions = [
    {
      id: 'tendencias_analisis',
      title: t('actions.innovacion.tendencias_analisis', locale),
      description: t('actions.innovacion.tendencias_analisis.desc', locale),
      actionType: 'analizar_tendencias',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="sector"
            placeholder="Industry sector"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <select
            name="region"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="españa">España</option>
            <option value="europa">Europa</option>
            <option value="global">Global</option>
          </select>
        </div>
      ),
    },
    {
      id: 'innovation_audit',
      title: t('actions.innovacion.innovation_audit', locale),
      description: t('actions.innovacion.innovation_audit.desc', locale),
      actionType: 'auditar_innovacion',
      form: (
        <div className="space-y-3">
          <textarea
            name="current_state"
            placeholder="Describe current innovation efforts"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm resize-none h-20"
            required
          />
          <select
            name="focus"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="product">Producto</option>
            <option value="process">Proceso</option>
            <option value="business">Modelo de Negocio</option>
          </select>
        </div>
      ),
    },
    {
      id: 'innovation_roadmap',
      title: t('actions.innovacion.innovation_roadmap', locale),
      description: t('actions.innovacion.innovation_roadmap.desc', locale),
      actionType: 'roadmap_innovacion',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="strategic_goal"
            placeholder="Main innovation goal"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <select
            name="timeline"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="3">3 meses</option>
            <option value="6">6 meses</option>
            <option value="12">12 meses</option>
          </select>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('actions.quick-actions', locale)}</h3>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              actionType={action.actionType}
              department="innovacion"
              inputForm={action.form}
              onActionComplete={(actionId) => setActiveActionId(actionId)}
            />
          ))}
        </div>
      </div>

      {activeActionId && (
        <QuickActionResult
          actionId={activeActionId}
          resourceName={actions.find((a) => a.id === activeActionId)?.title || 'Resource'}
          department="innovacion"
        />
      )}
    </div>
  )
}
