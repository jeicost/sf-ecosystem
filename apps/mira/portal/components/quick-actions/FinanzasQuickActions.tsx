'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function FinanzasQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const { locale } = useLocaleContext()

  const actions = [
    {
      id: 'proyeccion_financiera',
      title: t('actions.finanzas.proyeccion_financiera', locale),
      description: t('actions.finanzas.proyeccion_financiera.desc', locale),
      actionType: 'proyeccion_financiera',
      form: (
        <div className="space-y-3">
          <input
            type="number"
            name="current_revenue"
            placeholder="Current monthly revenue (€)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="number"
            name="growth_rate"
            placeholder="Expected growth rate (%)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <select
            name="scenario"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="conservative">Conservative</option>
            <option value="realistic">Realistic</option>
            <option value="optimistic">Optimistic</option>
          </select>
        </div>
      ),
    },
    {
      id: 'analisis_cash_flow',
      title: t('actions.finanzas.analisis_cash_flow', locale),
      description: t('actions.finanzas.analisis_cash_flow.desc', locale),
      actionType: 'analisis_cashflow',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="period"
            placeholder="Analysis period (e.g., Q3 2026)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <textarea
            name="expenses"
            placeholder="List main expenses categories"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm resize-none h-20"
            required
          />
        </div>
      ),
    },
    {
      id: 'optimizacion_costos',
      title: t('actions.finanzas.optimizacion_costos', locale),
      description: t('actions.finanzas.optimizacion_costos.desc', locale),
      actionType: 'optimizar_costos',
      form: (
        <div className="space-y-3">
          <textarea
            name="current_expenses"
            placeholder="Describe current spending structure"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm resize-none h-20"
            required
          />
          <input
            type="number"
            name="target_savings"
            placeholder="Target savings goal (%)"
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
              department="finanzas"
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
          department="finanzas"
        />
      )}
    </div>
  )
}
