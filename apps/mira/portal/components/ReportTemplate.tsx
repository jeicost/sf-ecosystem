'use client'

import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  color: string
}

interface Finding {
  id: number
  title: string
  severity: 'critical' | 'warning' | 'ok'
  description: string
  impact?: string
}

interface ActionItem {
  id: number
  title: string
  priority: 'high' | 'medium' | 'low'
  impact: string
  effort: string
  owner?: string
}

interface ReportSection {
  title: string
  findings?: Finding[]
  content?: string
}

interface ReportTemplateProps {
  title: string
  subtitle: string
  score: number
  maxScore?: number
  scoreLabel?: string
  statCards: StatCard[]
  sections: ReportSection[]
  actions: ActionItem[]
  accentColor?: string
  generatedAt?: string
}

const severityConfig = {
  critical: { icon: AlertCircle, bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', textColor: 'text-red-400', label: 'Critical' },
  warning: { icon: AlertTriangle, bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-400', label: 'Warning' },
  ok: { icon: CheckCircle, bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', textColor: 'text-green-400', label: 'OK' },
}

const priorityConfig = {
  high: { color: 'text-red-400', bgColor: 'bg-red-500/10' },
  medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  low: { color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
}

export default function ReportTemplate({
  title,
  subtitle,
  score,
  maxScore = 100,
  scoreLabel = 'Overall Score',
  statCards,
  sections,
  actions,
  accentColor = '#8B5CF6',
  generatedAt,
}: ReportTemplateProps) {
  const scorePercentage = (score / maxScore) * 100
  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="bg-card border border-line text-ink p-8 rounded-2xl space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-ink-secondary">{subtitle}</p>
        {generatedAt && <p className="text-xs text-ink-tertiary">Generated {generatedAt}</p>}
      </div>

      {/* Score Circle + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Circle */}
        <div className="flex flex-col items-center justify-center p-8 bg-surface border border-line rounded-2xl">
          <div className="relative w-32 h-32 mb-4">
            <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="65" fill="none" stroke="var(--border)" strokeWidth="4" />
              <circle
                cx="70"
                cy="70"
                r="65"
                fill="none"
                stroke={scoreColor}
                strokeWidth="4"
                strokeDasharray={`${scorePercentage * 4.08} 408`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{score}</span>
              <span className="text-xs text-ink-secondary">{scoreLabel}</span>
            </div>
          </div>
          <div className="w-full h-1 bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full transition-all"
              style={{ width: `${scorePercentage}%`, backgroundColor: scoreColor }}
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-surface border border-line rounded-lg p-4">
              <p className="text-xs text-ink-secondary mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sections with Findings */}
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${accentColor}25`, color: accentColor }}>
              {sectionIdx + 1}
            </span>
            <h2 className="text-xl font-semibold">{section.title}</h2>
          </div>

          {section.findings && section.findings.length > 0 && (
            <div className="space-y-2">
              {section.findings.map((finding) => {
                const config = severityConfig[finding.severity]
                const Icon = config.icon
                return (
                  <div key={finding.id} className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor} border`}>
                    <div className="flex items-start gap-3">
                      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${config.textColor}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-ink">{finding.title}</p>
                          <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
                        </div>
                        <p className="text-sm text-ink-secondary">{finding.description}</p>
                        {finding.impact && (
                          <p className="text-xs text-ink-secondary mt-2">
                            <strong>Impact:</strong> {finding.impact}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {section.content && (
            <div className="bg-surface border border-line rounded-lg p-4 text-sm text-ink-secondary whitespace-pre-wrap">
              {section.content}
            </div>
          )}
        </div>
      ))}

      {/* Action Plan */}
      {actions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} style={{ color: accentColor }} />
            <h2 className="text-xl font-semibold">Action Plan</h2>
          </div>

          <div className="space-y-2">
            {actions.map((action) => {
              const priorityStyle = priorityConfig[action.priority]
              return (
                <div key={action.id} className={`border border-line rounded-lg p-4 ${priorityStyle.bgColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-ink">{action.title}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${priorityStyle.color}`}>
                      {action.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-ink-secondary">
                    <div>
                      <p className="font-medium">Impact</p>
                      <p>{action.impact}</p>
                    </div>
                    <div>
                      <p className="font-medium">Effort</p>
                      <p>{action.effort}</p>
                    </div>
                  </div>
                  {action.owner && (
                    <p className="text-xs text-ink-secondary mt-2">
                      <strong>Owner:</strong> {action.owner}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-line pt-4 text-center text-xs text-ink-tertiary">
        <p>This report was generated by MIRA AI Agency System</p>
      </div>
    </div>
  )
}
