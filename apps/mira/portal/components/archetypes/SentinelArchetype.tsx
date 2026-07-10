'use client'
import { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Zap, TrendingUp, Eye } from 'lucide-react'
import { clsx } from 'clsx'

type AlertLevel = 'critical' | 'warning' | 'info' | 'success'

interface Alert {
  id: string
  level: AlertLevel
  title: string
  message: string
  timestamp: string
  context?: string
  action?: string
}

interface DashboardMetric {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  trendPercent?: number
  alert?: boolean
}

interface SentinelArchetypeProps {
  agentColor: string
  agentEmoji: string
  agentName: string
  alerts?: Alert[]
  metrics?: DashboardMetric[]
  onAcknowledgeAlert?: (alertId: string) => void
  onDismissAlert?: (alertId: string) => void
  isMonitoring?: boolean
}

const DEFAULT_ALERTS: Alert[] = [
  {
    id: '1',
    level: 'critical',
    title: 'Approval Queue Backlog',
    message: '23 posts pending review — oldest from 2 hours ago',
    timestamp: '2 min ago',
    context: 'Marketing department',
    action: 'Review now',
  },
  {
    id: '2',
    level: 'warning',
    title: 'Engagement Drop',
    message: 'LinkedIn posts down 32% vs last week average',
    timestamp: '15 min ago',
    context: 'Performance anomaly',
  },
  {
    id: '3',
    level: 'warning',
    title: 'API Response Time',
    message: 'Claude API latency above 4s (normal: <1s)',
    timestamp: '1 hour ago',
    context: 'System health',
  },
  {
    id: '4',
    level: 'info',
    title: 'New Lead Batch',
    message: '47 hot leads added from Rex discovery',
    timestamp: '2 hours ago',
    context: 'Sales pipeline',
  },
  {
    id: '5',
    level: 'success',
    title: 'Monthly Goal Achieved',
    message: 'Content calendar 104% complete for May',
    timestamp: '3 hours ago',
    context: 'Goal tracking',
  },
]

const DEFAULT_METRICS: DashboardMetric[] = [
  {
    label: 'Approval Queue',
    value: 23,
    trend: 'up',
    trendPercent: 8,
    alert: true,
  },
  {
    label: 'Healthy Agents',
    value: '28/30',
    trend: 'stable',
  },
  {
    label: 'Daily Costs',
    value: '$247',
    trend: 'down',
    trendPercent: 12,
  },
  {
    label: 'Success Rate',
    value: '97.4%',
    trend: 'up',
    trendPercent: 2,
  },
]

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

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  if (trend === 'up') return '📈'
  if (trend === 'down') return '📉'
  return '➡️'
}

export default function SentinelArchetype({
  agentColor,
  agentEmoji,
  agentName,
  alerts = DEFAULT_ALERTS,
  metrics = DEFAULT_METRICS,
  onAcknowledgeAlert,
  onDismissAlert,
  isMonitoring = true,
}: SentinelArchetypeProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set())
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id))
  const criticalAlerts = visibleAlerts.filter(a => a.level === 'critical')

  const handleAcknowledge = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]))
    onAcknowledgeAlert?.(alertId)
  }

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
    onDismissAlert?.(alertId)
  }

  return (
    <div className="space-y-8">
      {/* Monitoring Status */}
      <div
        className="card p-4 border-l-4 flex items-center justify-between"
        style={{ borderLeftColor: isMonitoring ? '#10B981' : '#EF4444' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: isMonitoring ? '#10B981' : '#EF4444' }}
          />
          <div>
            <div className="text-sm font-semibold text-white">
              {isMonitoring ? '🟢 Monitoring Active' : '🔴 Monitoring Paused'}
            </div>
            <div className="text-xs text-[#666]">
              {visibleAlerts.length} active alert{visibleAlerts.length !== 1 ? 's' : ''} •{' '}
              {criticalAlerts.length} critical
            </div>
          </div>
        </div>
        <Eye size={18} style={{ color: agentColor }} />
      </div>

      {/* Dashboard Metrics */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          📊 Dashboard
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className={clsx(
                'card p-4',
                metric.alert ? 'border border-[#EF4444]' : 'border border-[#1E1E1E]'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs font-semibold text-[#999] uppercase">{metric.label}</div>
                {metric.alert && <AlertCircle size={14} className="text-[#EF4444]" />}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-white">{metric.value}</div>
                {metric.trend && (
                  <div className="text-xs text-[#999]">
                    {getTrendIcon(metric.trend)}
                    {metric.trendPercent && <span className="ml-1">{metric.trendPercent}%</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: agentColor }}>
          🚨 Alerts Feed
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visibleAlerts.length === 0 ? (
            <div className="card p-6 text-center">
              <CheckCircle2 size={32} className="mx-auto text-[#10B981] mb-2" />
              <div className="text-sm text-white font-medium">All Clear</div>
              <div className="text-xs text-[#666] mt-1">No active alerts — everything is running smoothly</div>
            </div>
          ) : (
            visibleAlerts.map(alert => {
              const color = getAlertColor(alert.level)
              const isSelected = selectedAlertId === alert.id
              const isAcknowledged = acknowledgedAlerts.has(alert.id)

              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlertId(isSelected ? null : alert.id)}
                  className={clsx(
                    'w-full card p-3 text-left transition-all border',
                    isSelected
                      ? `border-[#1E1E1E] bg-[#1E1E1E]`
                      : `border-transparent hover:bg-[#0D0D0D]`
                  )}
                  style={{
                    ...(isSelected && { borderColor: color.border }),
                  }}
                >
                  <div className="space-y-2">
                    {/* Alert Header */}
                    <div className="flex items-start gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
                      >
                        {color.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">{alert.title}</div>
                        <div className="text-xs text-[#999] mt-0.5">{alert.message}</div>
                      </div>
                      <div className="text-xs text-[#666] flex-shrink-0 ml-2">
                        <Clock size={12} className="inline mr-1" />
                        {alert.timestamp}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="border-t border-[#1E1E1E] pt-3 space-y-3 mt-3">
                        {alert.context && (
                          <div className="p-2 bg-[#0D0D0D] rounded text-xs text-[#999]">
                            <span className="text-[#666]">📍 Context:</span> {alert.context}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {!isAcknowledged && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleAcknowledge(alert.id)
                              }}
                              className="px-3 py-1.5 text-xs rounded font-medium transition-all flex items-center gap-1"
                              style={{
                                backgroundColor: `${color.icon}20`,
                                color: color.icon,
                                border: `1px solid ${color.icon}40`,
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Acknowledge
                            </button>
                          )}
                          {isAcknowledged && (
                            <button
                              disabled
                              className="px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1"
                              style={{
                                backgroundColor: `${color.icon}30`,
                                color: color.icon,
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Acknowledged
                            </button>
                          )}

                          {alert.action && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                              }}
                              className="px-3 py-1.5 text-xs rounded font-medium text-white"
                              style={{ backgroundColor: agentColor }}
                            >
                              {alert.action}
                            </button>
                          )}

                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleDismiss(alert.id)
                            }}
                            className="px-3 py-1.5 text-xs rounded text-[#666] hover:text-white transition-colors"
                          >
                            Dismiss
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

      {/* Help */}
      <div className="p-4 rounded bg-[#0D0D0D] border border-[#1E1E1E] space-y-2">
        <div className="flex gap-2 items-start text-xs text-[#999]">
          <Zap size={14} className="flex-shrink-0 mt-0.5" style={{ color: agentColor }} />
          <div>
            <div className="font-medium text-white mb-1">How to use alerts</div>
            <ul className="space-y-1 text-[#999]">
              <li>🔴 <strong>Critical:</strong> Requires immediate action</li>
              <li>🟠 <strong>Warning:</strong> Attention recommended</li>
              <li>🔵 <strong>Info:</strong> FYI updates</li>
              <li>🟢 <strong>Success:</strong> Milestone achieved</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
