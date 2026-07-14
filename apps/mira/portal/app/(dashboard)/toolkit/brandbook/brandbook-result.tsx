'use client'

export function BrandbookResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-black border-b border-white/10 p-6 md:p-8">
        <h1 className="text-5xl font-black text-white mb-2">BRANDBOOK</h1>
        <p className="text-gray-400 max-w-2xl">Living operational manual: unified brand definition, voice, visual, content, and channel strategy</p>

        {/* Reconciliation Status */}
        {data.reconciliation && (
          <div className="mt-4 p-3 border-l-4 border-green-500 bg-green-500/5 rounded-r">
            <div className="text-xs text-green-400 font-bold">✓ DATA RECONCILIATION</div>
            <div className="text-xs text-gray-400 mt-1">
              {data.reconciliation.verified ? '✓ All sources verified & aligned' : '⚠️ Conflicts detected'}
            </div>
            {data.reconciliation.conflicts && data.reconciliation.conflicts.length > 0 && (
              <div className="text-xs text-red-400 mt-1">
                Conflicts: {data.reconciliation.conflicts.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-black p-6 md:p-8 space-y-8">

        {/* BRAND STORY */}
        {data.brand_story && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Brand Story</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
              {data.brand_story.source_id && <span className="text-gray-600"> (ID: {data.brand_story.source_id.slice(0, 8)}...)</span>}
            </div>
            <div className="space-y-3">
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
        {data.brand_identity && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Brand Identity</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
              {data.brand_identity.source_id && <span className="text-gray-600"> (ID: {data.brand_identity.source_id.slice(0, 8)}...)</span>}
            </div>
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
              <div className="mt-4 flex flex-wrap gap-2">
                {data.brand_identity.values.map((val: string, idx: number) => (
                  <div key={idx} className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded">{val}</div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* BRAND PROMISE */}
        {data.brand_promise && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Brand Promise</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
            </div>
            <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded">
              <div className="text-sm text-gray-300">{data.brand_promise.covenant || data.brand_promise}</div>
            </div>
          </section>
        )}

        {/* COMPETITIVE POSITIONING */}
        {data.competitive_positioning && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Competitive Positioning</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-teal-400">competitive_analysis</span>
              {data.competitive_positioning.source_id && <span className="text-gray-600"> (ID: {data.competitive_positioning.source_id.slice(0, 8)}...)</span>}
            </div>
            <div className="border border-teal-500/30 bg-teal-500/5 p-4 rounded">
              <p className="text-sm text-gray-300">{data.competitive_positioning.how_differentiate || data.competitive_positioning}</p>
            </div>
          </section>
        )}

        {/* TARGET AUDIENCE */}
        {data.target_audience && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Target Audience</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              <p className="text-gray-300 text-sm">{data.target_audience.description || data.target_audience}</p>
            </div>
          </section>
        )}

        {/* BRAND PILLARS */}
        {data.brand_pillars && data.brand_pillars.pillars && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Brand Pillars</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span> (CANONICAL - do not modify)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.brand_pillars.pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="border-l-4 border-purple-500 bg-white/5 p-4 rounded-r">
                  <div className="font-bold text-white mb-2">{idx + 1}. {pillar.name}</div>
                  <p className="text-sm text-gray-400">{pillar.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BRAND VOICE */}
        {data.brand_voice && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Brand Voice</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
            </div>
            <div className="space-y-3">
              {data.brand_voice.tone && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-1">TONE</div>
                  <p className="text-sm text-gray-300">{data.brand_voice.tone}</p>
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
        {data.visual_identity && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Visual Identity</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
            </div>
            {data.visual_identity.colors && data.visual_identity.colors.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {data.visual_identity.colors.map((color: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded border border-white/20 mb-2" style={{ backgroundColor: color.hex || '#000' }}></div>
                    <div className="text-xs text-gray-400">{color.name}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CONTENT TEMPLATES */}
        {data.content_templates && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Content Templates</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-yellow-400">content_pack</span>
            </div>
            {typeof data.content_templates === 'object' && Object.keys(data.content_templates).length > 0 && (
              <div className="space-y-3">
                {Object.entries(data.content_templates).map(([key, template]: [string, any]) => (
                  <div key={key} className="border border-white/10 bg-white/5 p-4 rounded">
                    <div className="font-bold text-white capitalize mb-1">{key}</div>
                    <p className="text-xs text-gray-400">{typeof template === 'string' ? template : JSON.stringify(template).slice(0, 100)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CHANNEL PLAYBOOKS */}
        {data.channel_playbooks && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Channel Playbooks</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-yellow-400">content_pack</span> + <span className="text-blue-400">marketing_audit</span>
            </div>
            {typeof data.channel_playbooks === 'object' && Object.keys(data.channel_playbooks).length > 0 && (
              <div className="space-y-3">
                {Object.entries(data.channel_playbooks).map(([channel, playbook]: [string, any]) => (
                  <div key={channel} className="border border-white/10 bg-white/5 p-4 rounded">
                    <div className="font-bold text-white capitalize mb-1">{channel}</div>
                    <p className="text-xs text-gray-400">{typeof playbook === 'string' ? playbook : JSON.stringify(playbook).slice(0, 100)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* BRAND EVOLUTION */}
        {data.brand_evolution && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Brand Evolution Strategy</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
            </div>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              <p className="text-sm text-gray-300">{data.brand_evolution['2_year_roadmap'] || data.brand_evolution}</p>
            </div>
          </section>
        )}

        {/* GUIDELINES DO'S & DON'TS */}
        {data.guidelines_dos_donts && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-2">Brand Guidelines</h2>
            <div className="text-xs text-gray-500 mb-3">
              Source: <span className="text-blue-400">brand_briefing</span>
            </div>
            <div className="space-y-3">
              {data.guidelines_dos_donts.do && data.guidelines_dos_donts.do.length > 0 && (
                <div className="border-l-4 border-green-500 bg-green-500/5 p-4 rounded-r">
                  <div className="text-xs text-green-400 font-bold mb-2">✓ DO</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {data.guidelines_dos_donts.do.map((item: string, idx: number) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.guidelines_dos_donts.dont && data.guidelines_dos_donts.dont.length > 0 && (
                <div className="border-l-4 border-red-500 bg-red-500/5 p-4 rounded-r">
                  <div className="text-xs text-red-400 font-bold mb-2">✗ DON'T</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {data.guidelines_dos_donts.dont.map((item: string, idx: number) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* DATA SOURCES */}
        {data.brand_briefing_id || data.content_pack_id || data.marketing_audit_id && (
          <section className="border-t border-white/10 pt-8">
            <h2 className="text-2xl font-black text-white uppercase mb-4">Data Sources & Dependencies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {data.brand_briefing_id && (
                <div className="border border-blue-500/30 bg-blue-500/5 p-3 rounded">
                  <div className="text-blue-400 font-bold">Brand Briefing</div>
                  <div className="text-gray-500">ID: {data.brand_briefing_id.slice(0, 16)}...</div>
                </div>
              )}
              {data.content_pack_id && (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-3 rounded">
                  <div className="text-yellow-400 font-bold">Content Pack</div>
                  <div className="text-gray-500">ID: {data.content_pack_id.slice(0, 16)}...</div>
                </div>
              )}
              {data.marketing_audit_id && (
                <div className="border border-pink-500/30 bg-pink-500/5 p-3 rounded">
                  <div className="text-pink-400 font-bold">Marketing Audit</div>
                  <div className="text-gray-500">ID: {data.marketing_audit_id.slice(0, 16)}...</div>
                </div>
              )}
              {data.competitive_analysis_id && (
                <div className="border border-teal-500/30 bg-teal-500/5 p-3 rounded">
                  <div className="text-teal-400 font-bold">Competitive Analysis</div>
                  <div className="text-gray-500">ID: {data.competitive_analysis_id.slice(0, 16)}...</div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black border-t border-white/10 p-6 md:p-8 text-center text-xs text-gray-500">
        <div>This is a living document — verify sources and conflicts before making decisions</div>
        {data?.generatedAt && <div className="mt-2">{data.generatedAt}</div>}
      </div>
    </div>
  )
}
