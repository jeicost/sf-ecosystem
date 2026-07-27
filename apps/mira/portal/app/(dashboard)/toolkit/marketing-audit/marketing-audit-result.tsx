'use client'

import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function MarketingAuditResult({ data }: { data?: any }) {
  const { locale } = useLocaleContext()
  if (!data) return <div className="text-ink-secondary">{t('toolkit.results.no-data', locale)}</div>

  const brandColor = data?.brandColor || '#8B5CF6'

  return (
    <div className="w-full bg-page">
      {/* Header */}
      <div className="border-b border-line-subtle p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-ink mb-3 tracking-tight">{t('toolkit.marketing-audit.result-title', locale)}</h1>
        <p className="text-ink-secondary max-w-2xl text-sm leading-relaxed mb-6">{t('toolkit.marketing-audit.result-desc', locale)}</p>
        {data.coherence_check && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.3)', borderWidth: '1px', color: '#00e676'}}>
            <span>✓</span> {t('toolkit.marketing-audit.alignment-verified', locale)}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="border-b border-line-subtle p-6 md:p-8">
        {data.statCards && data.statCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.statCards.map((card: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border transition-all backdrop-blur-sm" style={{
                borderColor: card.status === 'critical' ? 'rgba(255,61,87,0.4)' : card.status === 'warning' ? 'rgba(255,215,64,0.4)' : 'var(--border)',
                backgroundColor: card.status === 'critical' ? 'rgba(255,61,87,0.08)' : card.status === 'warning' ? 'rgba(255,215,64,0.08)' : 'var(--bg-surface)'
              }}>
                <div className="text-2xl font-black mb-2" style={{color: card.status === 'critical' ? '#ff5a72' : card.status === 'warning' ? '#ffd740' : '#4d7cff'}}>{card.value}</div>
                <div className="text-xs text-ink-secondary font-medium leading-tight">{card.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Sections */}
      <div className="p-6 md:p-8 space-y-8">
        {data.sections && data.sections.map((section: any, idx: number) => (
          <section key={idx}>
            <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight" style={{textShadow: `0 2px 8px ${brandColor}20`}}>{section.title}</h2>
            {section.type === 'cards' && section.cards && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.cards.map((card: any, cidx: number) => (
                  <div key={cidx} className="border-l-4 bg-surface p-4 rounded-r" style={{borderColor: card.color_border === 'teal' ? '#4dd9c4' : card.color_border === 'red' ? '#ff5a72' : '#ff5a1f'}}>
                    <h3 className="font-bold text-ink mb-2">+ {card.title}</h3>
                    <p className="text-sm text-ink-secondary">{card.content}</p>
                  </div>
                ))}
              </div>
            )}
            {section.type === 'eeat_matrix' && section.dimensions && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {section.dimensions.map((dim: any, didx: number) => (
                  <div key={didx} className="border border-line bg-surface p-4 rounded text-center">
                    <div className="text-lg font-bold mb-2" style={{color: '#4dd9c4'}}>{dim.status}</div>
                    <div className="text-sm font-semibold text-ink mb-2">{dim.name}</div>
                    {dim.content && <div className="text-xs text-ink-tertiary">{dim.content}</div>}
                  </div>
                ))}
              </div>
            )}
            {section.type === 'findings' && section.findings && (
              <div className="space-y-3">
                {section.findings.map((finding: any, fidx: number) => (
                  <div key={fidx} className="border-l-2 bg-surface p-4 rounded-r" style={{borderColor: '#ffd740'}}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="font-bold text-ink">{finding.title}</div>
                      <span className="text-xs font-semibold px-2 py-1 rounded whitespace-nowrap" style={{
                        backgroundColor: finding.severity === 'critical' ? 'rgba(255,61,87,0.2)' : 'rgba(255,90,31,0.2)',
                        color: finding.severity === 'critical' ? '#ff5a72' : '#ff5a1f'
                      }}>
                        {finding.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-ink-secondary">{finding.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Quick Wins */}
        {data.quickWins && data.quickWins.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-6">⚡ {t('toolkit.marketing-audit.quick-wins', locale)}</h2>
            <div className="space-y-3">
              {data.quickWins.map((action: any, idx: number) => (
                <div key={idx} className="border-l-2 bg-surface p-4 rounded-lg" style={{borderColor: '#ffd740'}}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="font-bold text-ink">{idx + 1}. {action.title}</div>
                      {action.description && <p className="text-sm text-ink-secondary mt-1">{action.description}</p>}
                    </div>
                    {action.effort_tag && <span className="text-xs font-semibold px-2 py-1 rounded whitespace-nowrap" style={{backgroundColor: 'rgba(0,230,118,0.2)', color: '#00e676'}}>{action.effort_tag}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-ink-secondary">
                    {action.impact && <div>💰 {action.impact}</div>}
                    {action.effort_hours && <div>⏱️ {action.effort_hours}h</div>}
                    {action.roi_score && <div>{t('toolkit.results.roi', locale)}: {action.roi_score}/10</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-line-subtle p-6 md:p-8 text-center text-xs text-ink-tertiary">
        {data?.generatedAt && <div>{t('toolkit.results.generated', locale).replace('{date}', data.generatedAt)}</div>}
      </div>
    </div>
  )
}
