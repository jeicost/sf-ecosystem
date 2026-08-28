'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { getStoredClientId } from '@/lib/client-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

const getToolConfig = (locale: Locale): ToolConfig => ({
  slug: 'brand-briefing',
  icon: '💭',
  title: t('toolkit.brand-briefing.title', locale),
  timing: t('toolkit.brand-briefing.timing', locale),
  brandBrainNote: t('toolkit.brand-briefing.brand-brain-note', locale),
  submitButtonColor: '#A78BFA',
  submitButtonText: t('toolkit.brand-briefing.submit', locale),
  fields: [
    {
      name: 'url_sitio',
      label: t('toolkit.brand-briefing.field.url-sitio.label', locale),
      type: 'text',
      placeholder: t('toolkit.brand-briefing.field.url-sitio.placeholder', locale),
      hint: t('toolkit.brand-briefing.field.url-sitio.hint', locale),
      required: false,
    },
  ],
})

export default function BrandBriefingPage() {
  const { locale } = useLocaleContext()
  const toolConfig = getToolConfig(locale)

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'brand-briefing',
        input_data: formData,
        attachments,
        project_id: getStoredProjectId(),
        clientId: getStoredClientId(),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || t('toolkit.report.generate-error-fallback', locale))
    }

    return await res.json()
  }

  return (
    <ToolRunnerPage
      config={toolConfig}
      onGenerate={handleGenerate}
      resultComponent={BrandBriefingResult}
    />
  )
}

function BrandBriefingResult({ data }: { data?: any }) {
  const { locale } = useLocaleContext()
  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-page border-b border-line p-6 md:p-8">
        <h1 className="text-5xl font-black text-ink mb-2">{t('toolkit.brand-briefing.result.title', locale)}</h1>
        <p className="text-ink-secondary max-w-2xl">{t('toolkit.brand-briefing.result.subtitle', locale)}</p>
      </div>

      {/* Main Content */}
      <div className="bg-page p-6 md:p-8 space-y-8">

        {/* BRAND STORY */}
        {data?.brand_story && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.brand-story', locale)}</h2>
            <div className="space-y-4">
              {data.brand_story.founding && (
                <div className="border-l-4 border-indigo-500 bg-surface p-4 rounded-r">
                  <div className="text-xs text-ink-secondary mb-2">{t('toolkit.brand-briefing.result.founding', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_story.founding}</p>
                </div>
              )}
              {data.brand_story.origin_narrative && (
                <div className="border-l-4 border-indigo-500 bg-surface p-4 rounded-r">
                  <div className="text-xs text-ink-secondary mb-2">{t('toolkit.brand-briefing.result.origin-narrative', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_story.origin_narrative}</p>
                </div>
              )}
              {data.brand_story.why_exists && (
                <div className="border-l-4 border-indigo-500 bg-surface p-4 rounded-r">
                  <div className="text-xs text-ink-secondary mb-2">{t('toolkit.brand-briefing.result.why-exists', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_story.why_exists}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* BRAND IDENTITY */}
        {data?.brand_identity && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.brand-identity', locale)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.brand_identity.name && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary mb-2 font-bold">{t('toolkit.brand-briefing.result.name', locale)}</div>
                  <div className="text-lg font-bold text-ink">{data.brand_identity.name}</div>
                </div>
              )}
              {data.brand_identity.mission && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary mb-2 font-bold">{t('toolkit.brand-briefing.result.mission', locale)}</div>
                  <div className="text-sm text-ink-secondary">{data.brand_identity.mission}</div>
                </div>
              )}
              {data.brand_identity.vision && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary mb-2 font-bold">{t('toolkit.brand-briefing.result.vision', locale)}</div>
                  <div className="text-sm text-ink-secondary">{data.brand_identity.vision}</div>
                </div>
              )}
            </div>
            {data.brand_identity.values && data.brand_identity.values.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-ink-secondary mb-2 font-bold">{t('toolkit.brand-briefing.result.values', locale)}</div>
                <div className="flex flex-wrap gap-2">
                  {data.brand_identity.values.map((val: string, idx: number) => (
                    <div key={idx} className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded">{val}</div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* BRAND PROMISE */}
        {data?.brand_promise && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.brand-promise', locale)}</h2>
            <div className="space-y-3">
              {data.brand_promise.covenant && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded">
                  <div className="text-xs text-yellow-400 font-bold mb-2">{t('toolkit.brand-briefing.result.covenant', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_promise.covenant}</p>
                </div>
              )}
              {data.brand_promise.customer_expectation && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded">
                  <div className="text-xs text-yellow-400 font-bold mb-2">{t('toolkit.brand-briefing.result.customer-expectation', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_promise.customer_expectation}</p>
                </div>
              )}
              {data.brand_promise.guarantee && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded">
                  <div className="text-xs text-yellow-400 font-bold mb-2">{t('toolkit.brand-briefing.result.guarantee', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_promise.guarantee}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* COMPETITIVE POSITIONING */}
        {data?.competitive_positioning && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.competitive-positioning', locale)}</h2>
            <div className="space-y-3">
              {data.competitive_positioning.vs_alternatives && (
                <div className="border border-teal-500/30 bg-teal-500/5 p-4 rounded">
                  <div className="text-xs text-teal-400 font-bold mb-2">{t('toolkit.brand-briefing.result.vs-alternatives', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.competitive_positioning.vs_alternatives}</p>
                </div>
              )}
              {data.competitive_positioning.unique_advantage && (
                <div className="border border-teal-500/30 bg-teal-500/5 p-4 rounded">
                  <div className="text-xs text-teal-400 font-bold mb-2">{t('toolkit.brand-briefing.result.unique-advantage', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.competitive_positioning.unique_advantage}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TARGET AUDIENCE */}
        {data?.target_audience && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.target-audience', locale)}</h2>
            <div className="border border-line bg-surface p-4 rounded mb-4">
              <p className="text-ink-secondary text-sm">{data.target_audience.description}</p>
            </div>
            {data.target_audience.personas && data.target_audience.personas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.target_audience.personas.map((persona: any, idx: number) => (
                  <div key={idx} className="border border-line bg-surface p-4 rounded">
                    <div className="font-bold text-ink mb-2">{persona.name}</div>
                    <p className="text-xs text-ink-secondary">{persona.behavior}</p>
                    {persona.pain_points && (
                      <div className="mt-2">
                        <div className="text-xs text-ink-tertiary mb-1">{t('toolkit.brand-briefing.result.pain-points', locale)}</div>
                        <ul className="text-xs text-ink-secondary list-disc list-inside">
                          {persona.pain_points.map((pp: string, pidx: number) => (
                            <li key={pidx}>{pp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* BRAND PILLARS */}
        {data?.brand_pillars && data.brand_pillars.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.brand-pillars', locale)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.brand_pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="border-l-4 border-purple-500 bg-surface p-4 rounded-r">
                  <div className="font-bold text-ink mb-2">{idx + 1}. {pillar.name}</div>
                  <p className="text-sm text-ink-secondary">{pillar.description}</p>
                  {pillar.examples && pillar.examples.length > 0 && (
                    <div className="mt-2 text-xs text-ink-tertiary">
                      {t('toolkit.brand-briefing.result.examples', locale).replace('{list}', pillar.examples.join(', '))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BRAND VOICE */}
        {data?.brand_voice && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.brand-voice', locale)}</h2>
            <div className="space-y-4">
              {data.brand_voice.tone && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.brand-briefing.result.tone', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_voice.tone}</p>
                </div>
              )}
              {data.brand_voice.traits && data.brand_voice.traits.length > 0 && (
                <div>
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.brand-briefing.result.personality-traits', locale)}</div>
                  <div className="flex flex-wrap gap-2">
                    {data.brand_voice.traits.map((trait: string, idx: number) => (
                      <div key={idx} className="bg-pink-500/20 text-pink-400 text-xs px-3 py-1 rounded">{trait}</div>
                    ))}
                  </div>
                </div>
              )}
              {data.brand_voice.do_examples && data.brand_voice.do_examples.length > 0 && (
                <div className="border-l-4 border-green-500 bg-green-500/5 p-4 rounded-r">
                  <div className="text-xs text-green-400 font-bold mb-2">{t('toolkit.brand-briefing.result.do', locale)}</div>
                  <ul className="text-xs text-ink-secondary space-y-1">
                    {data.brand_voice.do_examples.map((ex: string, idx: number) => (
                      <li key={idx}>• {ex}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.brand_voice.dont_examples && data.brand_voice.dont_examples.length > 0 && (
                <div className="border-l-4 border-red-500 bg-red-500/5 p-4 rounded-r">
                  <div className="text-xs text-red-400 font-bold mb-2">{t('toolkit.brand-briefing.result.dont', locale)}</div>
                  <ul className="text-xs text-ink-secondary space-y-1">
                    {data.brand_voice.dont_examples.map((ex: string, idx: number) => (
                      <li key={idx}>• {ex}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* VISUAL IDENTITY */}
        {data?.visual_identity && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.visual-identity', locale)}</h2>
            {data.visual_identity.colors && data.visual_identity.colors.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-ink-secondary font-bold mb-3">{t('toolkit.brand-briefing.result.color-palette', locale)}</div>
                <div className="flex flex-wrap gap-3">
                  {data.visual_identity.colors.map((color: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded border border-line mb-2" style={{ backgroundColor: color.hex || '#000' }}></div>
                      <div className="text-xs text-ink-secondary text-center">{color.name}</div>
                      <div className="text-xs text-ink-tertiary">{color.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.visual_identity.typography && (
              <div className="border border-line bg-surface p-4 rounded">
                <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.brand-briefing.result.typography', locale)}</div>
                {typeof data.visual_identity.typography === 'string' ? (
                  <p className="text-sm text-ink-secondary">{data.visual_identity.typography}</p>
                ) : (
                  <div className="space-y-1">
                    {data.visual_identity.typography.heading && (
                      <p className="text-sm text-ink-secondary"><span className="font-bold">{t('toolkit.brand-briefing.result.heading-label', locale)}</span> {data.visual_identity.typography.heading}</p>
                    )}
                    {data.visual_identity.typography.body && (
                      <p className="text-sm text-ink-secondary"><span className="font-bold">{t('toolkit.brand-briefing.result.body-label', locale)}</span> {data.visual_identity.typography.body}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* BRAND VALUES IN PRACTICE */}
        {data?.brand_values_in_practice && data.brand_values_in_practice.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.values-in-practice', locale)}</h2>
            <div className="space-y-3">
              {data.brand_values_in_practice.map((item: any, idx: number) => (
                <div key={idx} className="border border-line bg-surface p-4 rounded">
                  <div className="font-bold text-ink mb-2">{item.value}</div>
                  <p className="text-sm text-ink-secondary">{item.example}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CUSTOMER JOURNEY */}
        {data?.customer_journey_touchpoints && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.customer-journey', locale)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['awareness', 'consideration', 'decision', 'loyalty'] as const).map((stage) => (
                data.customer_journey_touchpoints[stage] && (
                  <div key={stage} className="border border-line bg-surface p-4 rounded">
                    <div className="text-xs text-ink-secondary font-bold mb-2 uppercase">{t(`toolkit.brand-briefing.result.stage-${stage}`, locale)}</div>
                    {Array.isArray(data.customer_journey_touchpoints[stage]) ? (
                      <ul className="text-xs text-ink-secondary space-y-1">
                        {data.customer_journey_touchpoints[stage].map((tp: string, idx: number) => (
                          <li key={idx}>• {tp}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-ink-secondary">{data.customer_journey_touchpoints[stage]}</p>
                    )}
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* BRAND EVOLUTION */}
        {data?.brand_evolution && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.brand-evolution', locale)}</h2>
            <div className="space-y-3">
              {data.brand_evolution['2_year_roadmap'] && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.brand-briefing.result.roadmap-2y', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data.brand_evolution['2_year_roadmap']}</p>
                </div>
              )}
              {data.brand_evolution.potential_expansions && data.brand_evolution.potential_expansions.length > 0 && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.brand-briefing.result.potential-expansions', locale)}</div>
                  <ul className="text-xs text-ink-secondary space-y-1">
                    {data.brand_evolution.potential_expansions.map((exp: string, idx: number) => (
                      <li key={idx}>• {exp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SUCCESS METRICS */}
        {data?.success_metrics && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.brand-briefing.result.success-metrics', locale)}</h2>
            {data.success_metrics.kpis && data.success_metrics.kpis.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.success_metrics.kpis.map((kpi: any, idx: number) => (
                  <div key={idx} className="border border-line bg-surface p-4 rounded">
                    <div className="font-bold text-ink mb-1">{kpi.name}</div>
                    <div className="text-xs text-green-400 mb-2">{t('toolkit.brand-briefing.result.target-label', locale).replace('{value}', String(kpi.target))}</div>
                    <div className="text-xs text-ink-secondary">{t('toolkit.brand-briefing.result.tracking-label', locale).replace('{value}', String(kpi.tracking))}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="bg-page border-t border-line p-6 md:p-8 text-center text-xs text-ink-tertiary">
        {data?.generatedAt && <div>{t('toolkit.results.generated', locale).replace('{date}', data.generatedAt)}</div>}
      </div>
    </div>
  )
}
