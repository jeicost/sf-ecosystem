'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'

export function StrategyQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)

  const actions = [
    {
      id: 'generar_reporte',
      title: 'Generar Reporte',
      description: 'Generate performance report with KPIs',
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
      title: 'Analizar Competencia',
      description: 'Competitive analysis matrix & opportunities',
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
      title: 'Brainstorm Ideas',
      description: 'Generate 100 ideas with top 5 recommendations',
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
      title: 'Proyectar Revenue',
      description: 'Generate revenue projections with scenarios',
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
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
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
          outputType="json"
        />
      )}
    </div>
  )
}
