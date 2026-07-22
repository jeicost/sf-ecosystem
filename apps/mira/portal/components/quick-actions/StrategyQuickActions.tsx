'use client'

import { useState } from 'react'
import { QuickActionButton } from '../QuickActionButton'
import { QuickActionResult } from '../QuickActionResult'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function StrategyQuickActions() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  // Acción clicada, guardada en el momento del click (activeActionId es el UUID
  // del servidor y nunca coincide con los ids locales de `actions`).
  const [activeAction, setActiveAction] = useState<{ title: string; outputType: string } | null>(null)
  const { locale } = useLocaleContext()

  const actions = [
    {
      id: 'generar_reporte',
      title: t('actions.strategy.generar_reporte', locale),
      description: t('actions.strategy.generar_reporte.desc', locale),
      actionType: 'generar_reporte',
      outputType: 'document',
      form: (
        <div className="space-y-3">
          <select
            name="period"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
            required
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <div className="space-y-2">
            <p className="text-xs text-ink-secondary">Metrics to include:</p>
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input type="checkbox" name="metrics" value="revenue" defaultChecked />
              Revenue
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input type="checkbox" name="metrics" value="mrr" defaultChecked />
              MRR
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
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
      outputType: 'document',
      form: (
        <div className="space-y-3">
          <textarea
            name="competitors"
            placeholder="Competitors (comma-separated)"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm h-16"
            required
          />
          <select
            name="focus"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
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
      outputType: 'json',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="topic"
            placeholder="Topic to brainstorm"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            required
          />
          <textarea
            name="constraints"
            placeholder="Constraints or requirements"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm h-16"
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
      outputType: 'document',
      form: (
        <div className="space-y-3">
          <input
            type="text"
            name="sector"
            placeholder="Industry sector"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            required
          />
          <select
            name="region"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
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
      id: 'plan_innovacion',
      title: t('actions.strategy.plan_innovacion', locale),
      description: t('actions.strategy.plan_innovacion.desc', locale),
      actionType: 'roadmap_innovacion',
      outputType: 'document',
      form: (
        <div className="space-y-3">
          <textarea
            name="current_state"
            placeholder="Describe current innovation efforts"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm resize-none h-20"
            required
          />
          <input
            type="text"
            name="strategic_goal"
            placeholder="Main innovation goal"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm"
            required
          />
          <select
            name="timeline"
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
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
        <h3 className="text-lg font-semibold text-ink mb-3">{t('actions.quick-actions', locale)}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {actions.map((action) => (
            <QuickActionButton
              key={action.id}
              title={action.title}
              description={action.description}
              actionType={action.actionType}
              department="strategy"
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
          department="strategy"
        />
      )}
    </div>
  )
}
