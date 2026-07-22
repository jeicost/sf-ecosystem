'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'

const TOOL_CONFIG: ToolConfig = {
  slug: 'brand-briefing',
  icon: '💭',
  title: 'Brand Briefing',
  subtitle: 'Complete brand strategy',
  timing: '20-30 min',
  brandBrainNote: 'Brand Brain cargado — estrategia compilada',
  submitButtonColor: '#A78BFA',
  submitButtonText: 'Generar Brand Briefing',
  fields: [
    {
      name: 'nombre_cliente',
      label: 'NOMBRE DEL CLIENTE',
      type: 'text',
      placeholder: 'Ej: Salsa Burgers',
      required: true,
    },
    {
      name: 'website_url',
      label: 'URL SITIO WEB',
      type: 'text',
      placeholder: 'https://www.salsaburgers.com',
      required: true,
    },
    {
      name: 'sector_industria',
      label: 'SECTOR / INDUSTRIA',
      type: 'text',
      placeholder: 'Ej: F&B Delivery, Premium Burgers',
      required: true,
    },
  ],
}

export default function BrandBriefingPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'brand-briefing',
        input_data: formData,
        project_id: getStoredProjectId(),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }

    return await res.json()
  }

  return (
    <ToolRunnerPage
      config={TOOL_CONFIG}
      onGenerate={handleGenerate}
      resultComponent={BrandBriefingResult}
    />
  )
}

function BrandBriefingResult({ data }: { data?: any }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-black border-b border-white/10 p-6 md:p-8">
        <h1 className="text-5xl font-black text-white mb-2">BRAND BRIEFING</h1>
        <p className="text-gray-400 max-w-2xl">Complete brand strategy: identity, positioning, audience, pillars, voice, visual, content, and evolution roadmap</p>
      </div>

      {/* Main Content */}
      <div className="bg-black p-6 md:p-8 space-y-8">

        {/* BRAND STORY */}
        {data?.brand_story && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Story</h2>
            <div className="space-y-4">
              {data.brand_story.founding && (
                <div className="border-l-4 border-indigo-500 bg-white/5 p-4 rounded-r">
                  <div className="text-xs text-gray-400 mb-2">FOUNDING</div>
                  <p className="text-sm text-gray-300">{data.brand_story.founding}</p>
                </div>
              )}
              {data.brand_story.origin_narrative && (
                <div className="border-l-4 border-indigo-500 bg-white/5 p-4 rounded-r">
                  <div className="text-xs text-gray-400 mb-2">ORIGIN NARRATIVE</div>
                  <p className="text-sm text-gray-300">{data.brand_story.origin_narrative}</p>
                </div>
              )}
              {data.brand_story.why_exists && (
                <div className="border-l-4 border-indigo-500 bg-white/5 p-4 rounded-r">
                  <div className="text-xs text-gray-400 mb-2">WHY WE EXIST</div>
                  <p className="text-sm text-gray-300">{data.brand_story.why_exists}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* BRAND IDENTITY */}
        {data?.brand_identity && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.brand_identity.name && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 mb-2 font-bold">NAME</div>
                  <div className="text-lg font-bold text-white">{data.brand_identity.name}</div>
                </div>
              )}
              {data.brand_identity.mission && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 mb-2 font-bold">MISSION</div>
                  <div className="text-sm text-gray-300">{data.brand_identity.mission}</div>
                </div>
              )}
              {data.brand_identity.vision && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 mb-2 font-bold">VISION</div>
                  <div className="text-sm text-gray-300">{data.brand_identity.vision}</div>
                </div>
              )}
            </div>
            {data.brand_identity.values && data.brand_identity.values.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-400 mb-2 font-bold">VALUES</div>
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
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Promise</h2>
            <div className="space-y-3">
              {data.brand_promise.covenant && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded">
                  <div className="text-xs text-yellow-400 font-bold mb-2">COVENANT</div>
                  <p className="text-sm text-gray-300">{data.brand_promise.covenant}</p>
                </div>
              )}
              {data.brand_promise.customer_expectation && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded">
                  <div className="text-xs text-yellow-400 font-bold mb-2">CUSTOMER EXPECTATION</div>
                  <p className="text-sm text-gray-300">{data.brand_promise.customer_expectation}</p>
                </div>
              )}
              {data.brand_promise.guarantee && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded">
                  <div className="text-xs text-yellow-400 font-bold mb-2">GUARANTEE</div>
                  <p className="text-sm text-gray-300">{data.brand_promise.guarantee}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* COMPETITIVE POSITIONING */}
        {data?.competitive_positioning && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Competitive Positioning</h2>
            <div className="space-y-3">
              {data.competitive_positioning.vs_alternatives && (
                <div className="border border-teal-500/30 bg-teal-500/5 p-4 rounded">
                  <div className="text-xs text-teal-400 font-bold mb-2">VS ALTERNATIVES</div>
                  <p className="text-sm text-gray-300">{data.competitive_positioning.vs_alternatives}</p>
                </div>
              )}
              {data.competitive_positioning.unique_advantage && (
                <div className="border border-teal-500/30 bg-teal-500/5 p-4 rounded">
                  <div className="text-xs text-teal-400 font-bold mb-2">UNIQUE ADVANTAGE</div>
                  <p className="text-sm text-gray-300">{data.competitive_positioning.unique_advantage}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TARGET AUDIENCE */}
        {data?.target_audience && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Target Audience</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded mb-4">
              <p className="text-gray-300 text-sm">{data.target_audience.description}</p>
            </div>
            {data.target_audience.personas && data.target_audience.personas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.target_audience.personas.map((persona: any, idx: number) => (
                  <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                    <div className="font-bold text-white mb-2">{persona.name}</div>
                    <p className="text-xs text-gray-400">{persona.behavior}</p>
                    {persona.pain_points && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Pain points:</div>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
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
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Pillars</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.brand_pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="border-l-4 border-purple-500 bg-white/5 p-4 rounded-r">
                  <div className="font-bold text-white mb-2">{idx + 1}. {pillar.name}</div>
                  <p className="text-sm text-gray-400">{pillar.description}</p>
                  {pillar.examples && pillar.examples.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Examples: {pillar.examples.join(', ')}
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
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Voice</h2>
            <div className="space-y-4">
              {data.brand_voice.tone && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">TONE</div>
                  <p className="text-sm text-gray-300">{data.brand_voice.tone}</p>
                </div>
              )}
              {data.brand_voice.traits && data.brand_voice.traits.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 font-bold mb-2">PERSONALITY TRAITS</div>
                  <div className="flex flex-wrap gap-2">
                    {data.brand_voice.traits.map((trait: string, idx: number) => (
                      <div key={idx} className="bg-pink-500/20 text-pink-400 text-xs px-3 py-1 rounded">{trait}</div>
                    ))}
                  </div>
                </div>
              )}
              {data.brand_voice.do_examples && data.brand_voice.do_examples.length > 0 && (
                <div className="border-l-4 border-green-500 bg-green-500/5 p-4 rounded-r">
                  <div className="text-xs text-green-400 font-bold mb-2">✓ DO</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {data.brand_voice.do_examples.map((ex: string, idx: number) => (
                      <li key={idx}>• {ex}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.brand_voice.dont_examples && data.brand_voice.dont_examples.length > 0 && (
                <div className="border-l-4 border-red-500 bg-red-500/5 p-4 rounded-r">
                  <div className="text-xs text-red-400 font-bold mb-2">✗ DON'T</div>
                  <ul className="text-xs text-gray-300 space-y-1">
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
            <h2 className="text-2xl font-black text-white uppercase mb-4">Visual Identity</h2>
            {data.visual_identity.colors && data.visual_identity.colors.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 font-bold mb-3">COLOR PALETTE</div>
                <div className="flex flex-wrap gap-3">
                  {data.visual_identity.colors.map((color: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded border border-white/20 mb-2" style={{ backgroundColor: color.hex || '#000' }}></div>
                      <div className="text-xs text-gray-400 text-center">{color.name}</div>
                      <div className="text-xs text-gray-600">{color.hex}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.visual_identity.typography && (
              <div className="border border-white/10 bg-white/5 p-4 rounded">
                <div className="text-xs text-gray-400 font-bold mb-2">TYPOGRAPHY</div>
                <p className="text-sm text-gray-300">{data.visual_identity.typography}</p>
              </div>
            )}
          </section>
        )}

        {/* BRAND VALUES IN PRACTICE */}
        {data?.brand_values_in_practice && data.brand_values_in_practice.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Values in Practice</h2>
            <div className="space-y-3">
              {data.brand_values_in_practice.map((item: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="font-bold text-white mb-2">{item.value}</div>
                  <p className="text-sm text-gray-400">{item.example}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CUSTOMER JOURNEY */}
        {data?.customer_journey_touchpoints && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Customer Journey Touchpoints</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['awareness', 'consideration', 'decision', 'loyalty'].map((stage: string) => (
                data.customer_journey_touchpoints[stage] && (
                  <div key={stage} className="border border-white/10 bg-white/5 p-4 rounded">
                    <div className="text-xs text-gray-400 font-bold mb-2 uppercase">{stage}</div>
                    {Array.isArray(data.customer_journey_touchpoints[stage]) ? (
                      <ul className="text-xs text-gray-300 space-y-1">
                        {data.customer_journey_touchpoints[stage].map((tp: string, idx: number) => (
                          <li key={idx}>• {tp}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-300">{data.customer_journey_touchpoints[stage]}</p>
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
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Evolution Strategy</h2>
            <div className="space-y-3">
              {data.brand_evolution['2_year_roadmap'] && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">2-YEAR ROADMAP</div>
                  <p className="text-sm text-gray-300">{data.brand_evolution['2_year_roadmap']}</p>
                </div>
              )}
              {data.brand_evolution.potential_expansions && data.brand_evolution.potential_expansions.length > 0 && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">POTENTIAL EXPANSIONS</div>
                  <ul className="text-xs text-gray-300 space-y-1">
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
            <h2 className="text-2xl font-black text-white uppercase mb-4">Success Metrics</h2>
            {data.success_metrics.kpis && data.success_metrics.kpis.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.success_metrics.kpis.map((kpi: any, idx: number) => (
                  <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                    <div className="font-bold text-white mb-1">{kpi.name}</div>
                    <div className="text-xs text-green-400 mb-2">Target: {kpi.target}</div>
                    <div className="text-xs text-gray-400">Tracking: {kpi.tracking}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black border-t border-white/10 p-6 md:p-8 text-center text-xs text-gray-500">
        {data?.generatedAt && <div>Generated {data.generatedAt}</div>}
      </div>
    </div>
  )
}
