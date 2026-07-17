'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function StrategyQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const { locale } = useLocaleContext()

  const actions = [
    {
      id: 'generar_reporte',
      title: t('actions.strategy.generar_reporte', locale),
      description: t('actions.strategy.generar_reporte.desc', locale),
      actionType: 'generar_reporte',
      form: (
        <div className="space-y-3">
          <select
            name="period"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Metrics to include:</p>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" name="metrics" value="revenue" defaultChecked />
              Revenue
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" name="metrics" value="mrr" defaultChecked />
              MRR
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" name="metrics" value="churn" defaultChecked />
              Churn
            </label>
          </div>
        </div>
      ),
    },
    {
      id: 'analizar_competencia',
      title: t('actions.strategy.analizar_competencia', locale),
      description: t('actions.strategy.analizar_competencia.desc', locale),
      actionType: 'analizar_competencia',
      form: (
        <div className="space-y-3">
          <textarea
            name="competitors"
            placeholder="Competitors (comma-separated)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
            required
          />
          <select
            name="focus"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            required
          >
            <option value="pricing">Pricing</option>
            <option value="features">Features</option>
            <option value="positioning">Positioning</option>
          </select>
        </div>
      ),
    },
    {
      id: 'brainstorm_ideas',
      title: t('actions.strategy.brainstorm_ideas', locale),
      description: t('actions.strategy.brainstorm_ideas.desc', locale),
      actionType: 'brainstorm_ideas',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="topic"
            placeholder="Topic to brainstorm"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <textarea
            name="constraints"
            placeholder="Constraints or requirements"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm h-16"
          />
        </div>
      ),
    },
    {
      id: 'proyectar_revenue',
      title: t('actions.strategy.proyectar_revenue', locale),
      description: t('actions.strategy.proyectar_revenue.desc', locale),
      actionType: 'proyectar_revenue',
      form: (
        <div className="space-y-3">
          <input
            type="number"
            name="current_mrr"
            placeholder="Current MRR (USD)"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="number"
            name="growth_rate"
            placeholder="Monthly growth rate (%)"
            step="0.1"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            required
          />
          <input
            type="number"
            name="months"
            placeholder="Number of months"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm"
            defaultValue="12"
          />
        </div>
      ),
    },
    // Innovation actions (merged from innovacion section)
    {
      id: 'tendencias_analisis',
      title: t('actions.strategy.tendencias_analisis', locale),
      description: t('actions.strategy.tendencias_analisis.desc', locale),
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
      title: t('actions.strategy.innovation_audit', locale),
      description: t('actions.strategy.innovation_audit.desc', locale),
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
      title: t('actions.strategy.innovation_roadmap', locale),
      description: t('actions.strategy.innovation_roadmap.desc', locale),
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              actionType={action.actionType}
              department="strategy"
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
          department="strategy"
        />
      )}
    </div>
  )
}
