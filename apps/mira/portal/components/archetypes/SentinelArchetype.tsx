'use client'
import { useState } from 'react'
import { CheckCircle2, Zap, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { SentinelAlert, SentinelData, AlertLevel } from '@/lib/sentinel-data'

interface SentinelArchetypeProps {
  agentColor: string
  status?: 'loading' | 'ready' | 'empty' | 'error'
  errorMessage?: string
  data?: SentinelData
}

const getAlertColor = (level: AlertLevel) => {
  switch (level) {
    case 'critical':
      return { bg: '#DC262630', border: '#EF4444', icon: '#EF4444', emoji: '🔴' }
    case 'warning':
      return { bg: '#F59E0B30', border: '#F59E0B', icon: '#F59E0B', emoji: '🟠' }
    case 'info':
      return { bg: '#3B82F630', border: '#3B82F6', icon: '#3B82F6', emoji: '🔵' }
    case 'success':
      return { bg: '#10B98130', border: '#10B981', icon: '#10B981', emoji: '🟢' }
  }
}

export default function SentinelArchetype({ agentColor, status = 'ready', errorMessage, data }: SentinelArchetypeProps) {
  const { locale } = useLocaleContext()
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set())
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)

  if (status === 'loading') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 rounded-lg bg-surface" />
        <div className="h-32 rounded-lg bg-surface" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <div className="text-sm text-ink font-medium">{t('agent.workspace.error-title', locale)}</div>
        <div className="text-xs text-ink-tertiary mt-1">{errorMessage || t('agent.workspace.error-desc', locale)}</div>
      </div>
    )
  }

  const alerts = data?.alerts ?? []
  const metrics = data?.metrics ?? []
  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))
  const criticalAlerts = visibleAlerts.filter((a) => a.level === 'critical')

  return (
    <div className="space-y-8">
      <div className="card p-4 border-l-4 flex items-center justify-between" style={{ borderLeftColor: '#10B981' }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#10B981' }} />
          <div>
            <div className="text-sm font-semibold text-ink">🟢 {t('archetype.sentinel.monitoring-active', locale)}</div>
            <div className="text-xs text-ink-tertiary">
              {visibleAlerts.length} {t('archetype.sentinel.active-alerts', locale)} • {criticalAlerts.length} críticas
            </div>
          </div>
        </div>
        <Eye size={18} style={{ color: agentColor }} />
      </div>

      {metrics.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
            📊 {t('archetype.sentinel.dashboard', locale)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.map((metric, idx) => (
              <div key={idx} className={clsx('card p-4', metric.alert && 'border border-[#EF4444]')}>
                <div className="text-xs font-semibold text-ink-secondary uppercase mb-2">
                  {metric.label.startsWith('archetype.') ? t(metric.label, locale) : metric.label}
                </div>
                <div className="text-2xl font-bold text-ink">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          🚨 {t('archetype.sentinel.alerts-feed', locale)}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visibleAlerts.length === 0 ? (
            <div className="card p-6 text-center">
              <CheckCircle2 size={32} className="mx-auto text-[#10B981] mb-2" />
              <div className="text-sm text-ink font-medium">{t('archetype.sentinel.all-clear', locale)}</div>
              <div className="text-xs text-ink-tertiary mt-1">{t('archetype.sentinel.all-clear-desc', locale)}</div>
            </div>
          ) : (
            visibleAlerts.map((alert: SentinelAlert) => {
              const color = getAlertColor(alert.level)
              const isSelected = selectedAlertId === alert.id
              const isAcknowledged = acknowledgedAlerts.has(alert.id)

              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlertId(isSelected ? null : alert.id)}
                  className={clsx(
                    'w-full card p-3 text-left transition-all border',
                    isSelected ? 'border-line bg-surface-hover' : 'border-transparent hover:bg-surface'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
                      >
                        {color.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-ink text-sm">{alert.title}</div>
                        <div className="text-xs text-ink-secondary mt-0.5">{alert.message}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="border-t border-line pt-3 space-y-3 mt-3">
                        {alert.context && (
                          <div className="p-2 bg-surface rounded text-xs text-ink-secondary">
                            <span className="text-ink-tertiary">📍 {t('archetype.sentinel.context', locale)}:</span> {alert.context}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {!isAcknowledged ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setAcknowledgedAlerts((prev) => new Set([...prev, alert.id]))
                              }}
                              className="px-3 py-1.5 text-xs rounded font-medium transition-all flex items-center gap-1"
                              style={{ backgroundColor: `${color.icon}20`, color: color.icon, border: `1px solid ${color.icon}40` }}
                            >
                              <CheckCircle2 size={12} />
                              OK
                            </button>
                          ) : (
                            <button disabled className="px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1" style={{ backgroundColor: `${color.icon}30`, color: color.icon }}>
                              <CheckCircle2 size={12} />
                              OK ✓
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDismissedAlerts((prev) => new Set([...prev, alert.id]))
                            }}
                            className="px-3 py-1.5 text-xs rounded text-ink-tertiary hover:text-ink transition-colors"
                          >
                            {t('archetype.sentinel.dismiss', locale)}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="p-4 rounded bg-surface border border-line space-y-2">
        <div className="flex gap-2 items-start text-xs text-ink-secondary">
          <Zap size={14} className="flex-shrink-0 mt-0.5" style={{ color: agentColor }} />
          <div>
            <div className="font-medium text-ink mb-1">{t('archetype.sentinel.legend-title', locale)}</div>
            <ul className="space-y-1 text-ink-secondary">
              <li>🔴 {t('archetype.sentinel.legend-critical', locale)}</li>
              <li>🟠 {t('archetype.sentinel.legend-warning', locale)}</li>
              <li>🔵 {t('archetype.sentinel.legend-info', locale)}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
