'use client'

import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export function SeoAuditResult({ data }: { data?: any }) {
  const { locale } = useLocaleContext()
  if (!data) return <div className="text-ink-secondary">{t('toolkit.results.no-data', locale)}</div>

  const statCards = data?.statCards || [
    { label: t('toolkit.seo.stat-style-chars', locale), value: '69', status: 'warning' },
    { label: t('toolkit.seo.stat-alt-text', locale), value: '20/20', status: 'perfect' },
    { label: t('toolkit.seo.stat-schema-types', locale), value: '5', status: 'good' },
    { label: t('toolkit.seo.stat-hreflang', locale), value: '0', status: 'critical' },
  ]

  // Brand color mapping (from Brand Brain)
  const brandColor = data?.brandColor || '#8B5CF6'
  const scoreColor = data?.overall_score >= 80 ? '#10b981' : data?.overall_score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="w-full bg-page">
      {/* Header */}
      <div className="border-b border-line-subtle p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-ink mb-3 tracking-tight">{t('toolkit.seo.result-title', locale)}</h1>
        <p className="text-ink-secondary max-w-2xl text-sm leading-relaxed mb-8">{t('toolkit.seo.result-desc', locale)}</p>
        <div className="flex items-baseline gap-3">
          <div className="text-7xl font-black" style={{color: scoreColor}}>{data?.overall_score || 62}</div>
          <div className="text-sm font-semibold text-ink-secondary">{data?.scoreLabel || t('toolkit.seo.overall-score', locale)}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="border-b border-line-subtle p-6 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl border transition-all backdrop-blur-sm" style={{
              borderColor: card.status === 'critical' ? 'rgba(255,61,87,0.4)' : card.status === 'perfect' ? 'rgba(0,230,118,0.4)' : card.status === 'warning' ? 'rgba(255,215,64,0.4)' : 'var(--border)',
              backgroundColor: card.status === 'critical' ? 'rgba(255,61,87,0.08)' : card.status === 'perfect' ? 'rgba(0,230,118,0.08)' : card.status === 'warning' ? 'rgba(255,215,64,0.08)' : 'var(--bg-surface)'
            }}>
              <div className="text-3xl font-black mb-2" style={{color: card.status === 'critical' ? '#ff5a72' : card.status === 'perfect' ? '#00e676' : card.status === 'warning' ? '#ffd740' : '#4d7cff'}}>{card.value}</div>
              <div className="text-xs text-ink-secondary font-medium leading-tight">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Sections */}
      <div className="p-6 md:p-8 space-y-8">
        {data?.sections && data.sections.map((section: any, idx: number) => (
          <section key={idx}>
            <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight" style={{textShadow: `0 2px 8px ${brandColor}20`}}>{section.title}</h2>
            {section.type === 'table' && section.elements && (
              <div className="border border-line rounded-xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface">
                      <th className="text-left py-4 px-4 text-ink font-semibold">{t('toolkit.seo.th-element', locale)}</th>
                      <th className="text-left py-4 px-4 text-ink font-semibold">{t('toolkit.seo.th-status', locale)}</th>
                      <th className="text-left py-4 px-4 text-ink font-semibold">{t('toolkit.seo.th-analysis', locale)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.elements.map((elem: any, eidx: number) => (
                      <tr key={eidx} className="border-b border-line-subtle hover:bg-surface transition-colors">
                        <td className="py-4 px-4 text-ink">{elem.element}</td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{
                            backgroundColor: elem.status === 'critical' ? 'rgba(255,61,87,0.2)' : elem.status === 'perfect' ? 'rgba(0,230,118,0.2)' : 'rgba(77,124,255,0.2)',
                            color: elem.status === 'critical' ? '#ff5a72' : elem.status === 'perfect' ? '#00e676' : '#7a9fff'
                          }}>
                            {elem.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-ink-secondary text-xs">{elem.analysis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.type === 'schema_cards' && section.schemas && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {section.schemas.map((schema: any, sidx: number) => (
                  <div key={sidx} className="p-4 rounded-xl border backdrop-blur-sm" style={{
                    borderColor: schema.status === 'active' ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,87,0.3)',
                    backgroundColor: schema.status === 'active' ? 'rgba(0,230,118,0.08)' : 'rgba(255,61,87,0.08)'
                  }}>
                    <div className="font-bold mb-2 text-sm" style={{color: schema.status === 'active' ? '#00e676' : '#ff5a72'}}>● {schema.name}</div>
                    <div className="text-xs text-ink-secondary leading-relaxed">{schema.impact || schema.opportunity}</div>
                  </div>
                ))}
              </div>
            )}
            {section.type === 'table' && section.keywords && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.keywords.map((kw: any, kidx: number) => (
                  <div key={kidx} className="border border-line bg-surface p-4 rounded-xl backdrop-blur-sm">
                    <div className="font-semibold text-ink mb-3">{kw.keyword}</div>
                    <div className="text-xs text-ink-secondary space-y-2">
                      {kw.volume && <div>{t('toolkit.seo.volume', locale)}: <span className="font-semibold" style={{color: '#ffd740'}}>{kw.volume}</span></div>}
                      {kw.intent && <div>{t('toolkit.seo.intent', locale)}: <span className="font-semibold" style={{color: '#4d7cff'}}>{kw.intent}</span></div>}
                      {kw.priority && <div>{t('toolkit.seo.priority', locale)}: <span className="font-semibold" style={{color: '#00e676'}}>{kw.priority}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Actions */}
        {data?.actions && data.actions.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-6 tracking-tight" style={{textShadow: `0 2px 8px ${brandColor}20`}}>{t('toolkit.seo.action-plan', locale)}</h2>
            <div className="space-y-3">
              {data.actions.map((action: any, aidx: number) => (
                <div key={aidx} className="border border-line bg-surface p-4 rounded-xl backdrop-blur-sm hover:border-line transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="font-semibold text-ink">{aidx + 1}. {action.title}</div>
                    {action.priority && <span className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap" style={{
                      backgroundColor: action.priority === 'CRÍTICO' ? 'rgba(255,61,87,0.2)' : 'rgba(255,215,64,0.2)',
                      color: action.priority === 'CRÍTICO' ? '#ff5a72' : '#ffd740'
                    }}>{action.priority}</span>}
                  </div>
                  {action.description && <p className="text-sm text-ink-secondary mb-3">{action.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-ink-secondary">
                    {action.impact && <div>📊 {action.impact}</div>}
                    {action.effort && <div>⏱️ {action.effort}</div>}
                    {action.expected_roi && <div>{t('toolkit.results.roi', locale)}: {action.expected_roi}/10</div>}
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
