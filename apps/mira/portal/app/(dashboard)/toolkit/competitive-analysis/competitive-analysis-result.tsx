'use client'

import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

export function CompetitiveAnalysisResult({ data }: { data?: any }) {
  const { locale } = useLocaleContext()

  if (!data) return <div className="text-ink-secondary">{t('toolkit.results.no-data', locale)}</div>

  const brandColor = data?.brandColor || '#8B5CF6'

  return (
    <div className="w-full bg-page">
      <div className="border-b border-line-subtle p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-ink mb-3 tracking-tight">{t('toolkit.competitive-analysis.result.title', locale)}</h1>
        <p className="text-ink-secondary max-w-2xl text-sm leading-relaxed">{t('toolkit.competitive-analysis.result.subtitle', locale)}</p>
        {data.positioning_validation && (
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{
            backgroundColor: data.positioning_validation === 'verified' ? 'rgba(0,230,118,0.1)' : 'rgba(255,90,31,0.1)',
            borderColor: data.positioning_validation === 'verified' ? 'rgba(0,230,118,0.3)' : 'rgba(255,90,31,0.3)',
            borderWidth: '1px',
            color: data.positioning_validation === 'verified' ? '#00e676' : '#ff5a1f'
          }}>
            {data.positioning_validation === 'verified' ? '✓' : '⚠'} {t('toolkit.competitive-analysis.result.positioning-label', locale).replace('{value}', data.positioning_validation)}
          </div>
        )}
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Executive Summary */}
        {data.executive_summary && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.competitive-analysis.result.executive-summary', locale)}</h2>
            <div className="border border-line bg-surface p-4 rounded">
              <p className="text-ink-secondary text-sm">{data.executive_summary}</p>
            </div>
          </section>
        )}

        {/* Market Landscape */}
        {data.market_landscape && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.competitive-analysis.result.market-landscape', locale)}</h2>
            <div className="space-y-3">
              {data.market_landscape.size && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-1">{t('toolkit.competitive-analysis.result.market-size', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.market_landscape.size}</p>
                </div>
              )}
              {data.market_landscape.growth_rate && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-1">{t('toolkit.competitive-analysis.result.growth-rate', locale)}</div>
                  <p className="text-sm font-bold" style={{color: '#00e676'}}>{data.market_landscape.growth_rate}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Competitive Matrix */}
        {data.competitive_matrix && data.competitive_matrix.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.competitive-analysis.result.competitive-matrix', locale)}</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.competitive_matrix.slice(0, 8).map((comp: any, idx: number) => (
                <div key={idx} className="border border-line bg-surface p-4 rounded">
                  <div className="font-bold text-ink mb-1">{comp.name}</div>
                  <div className="text-xs text-ink-secondary mb-2">{comp.positioning}</div>
                  <div className="flex gap-4 text-xs text-ink-tertiary">
                    {comp.pricing && <div>{t('toolkit.competitive-analysis.result.price-label', locale).replace('{value}', comp.pricing)}</div>}
                    {comp.product_maturity && <div>{t('toolkit.competitive-analysis.result.maturity-label', locale).replace('{value}', comp.product_maturity)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing Comparison */}
        {data.pricing_comparison && data.pricing_comparison.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.competitive-analysis.result.pricing-strategy', locale)}</h2>
            <div className="space-y-2">
              {data.pricing_comparison.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="border border-line bg-surface p-3 rounded text-sm">
                  <div className="font-bold text-ink">{item.company || item.tier}</div>
                  {item.price && <div className="text-ink-secondary text-xs">{item.price}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SWOT Analysis */}
        {data.swot_vs_competitors && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.competitive-analysis.result.swot-analysis', locale)}</h2>
            <div className="grid grid-cols-2 gap-4">
              {data.swot_vs_competitors.strengths && (
                <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#00e676', backgroundColor: 'rgba(0,230,118,0.05)'}}>
                  <div className="text-xs font-bold mb-2" style={{color: '#00e676'}}>{t('toolkit.competitive-analysis.result.strengths', locale)}</div>
                  <ul className="text-xs text-ink-secondary space-y-1">
                    {data.swot_vs_competitors.strengths.slice(0, 3).map((s: string, i: number) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.swot_vs_competitors.opportunities && (
                <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#4d7cff', backgroundColor: 'rgba(77,124,255,0.05)'}}>
                  <div className="text-xs font-bold mb-2" style={{color: '#4d7cff'}}>{t('toolkit.competitive-analysis.result.opportunities', locale)}</div>
                  <ul className="text-xs text-ink-secondary space-y-1">
                    {data.swot_vs_competitors.opportunities.slice(0, 3).map((o: string, i: number) => (
                      <li key={i}>• {o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Winning Strategy */}
        {data.winning_strategy && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.competitive-analysis.result.winning-strategy', locale)}</h2>
            <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#4d7cff', backgroundColor: 'rgba(77,124,255,0.05)'}}>
              <p className="text-sm text-ink-secondary">{typeof data.winning_strategy === 'string' ? data.winning_strategy : JSON.stringify(data.winning_strategy).slice(0, 300)}</p>
            </div>
          </section>
        )}

        {/* Key Takeaways */}
        {data.key_takeaways && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.competitive-analysis.result.key-takeaways', locale)}</h2>
            <div className="space-y-3">
              {data.key_takeaways.top_3_competitors && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.competitive-analysis.result.top-competitors', locale)}</div>
                  <ul className="text-xs text-ink-secondary space-y-1">
                    {data.key_takeaways.top_3_competitors.map((c: string, i: number) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.key_takeaways.top_3_differentiation && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.competitive-analysis.result.how-to-differentiate', locale)}</div>
                  <ul className="text-xs text-ink-secondary space-y-1">
                    {data.key_takeaways.top_3_differentiation.map((d: string, i: number) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Positioning Validation */}
        {data.positioning_validation && (
          <div className="border-l-4 p-4 rounded-r mt-8" style={{
            borderColor: data.positioning_validation === 'verified' ? '#00e676' : '#ff5a1f',
            backgroundColor: data.positioning_validation === 'verified' ? 'rgba(0,230,118,0.05)' : 'rgba(255,90,31,0.05)'
          }}>
            <div className="text-xs font-bold" style={{color: data.positioning_validation === 'verified' ? '#00e676' : '#ff5a1f'}}>
              {data.positioning_validation === 'verified' ? t('toolkit.competitive-analysis.result.positioning-verified', locale) : t('toolkit.competitive-analysis.result.positioning-at-risk', locale)}
            </div>
            {data.recommended_adjustments && data.recommended_adjustments.length > 0 && (
              <ul className="text-xs text-ink-secondary mt-2 space-y-1">
                {data.recommended_adjustments.map((adj: string, i: number) => (
                  <li key={i}>• {adj}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line-subtle p-6 md:p-8 text-center text-xs text-ink-tertiary">
        {data?.generatedAt && <div>{t('toolkit.results.generated', locale).replace('{date}', data.generatedAt)}</div>}
      </div>
    </div>
  )
}
