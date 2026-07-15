'use client'

export function ContentPackResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-black border-b border-white/10 p-6 md:p-8">
        <h1 className="text-5xl font-black text-white mb-2">CONTENT PACK</h1>
        <p className="text-gray-400 max-w-2xl">Complete content strategy: pillars, blog, social, email, video, calendar, and distribution plan</p>
      </div>

      {/* Main Content */}
      <div className="bg-black p-6 md:p-8 space-y-8">

        {/* CONTENT PILLARS */}
        {data.content_pillars && data.content_pillars.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Content Pillars</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.content_pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="border-l-4 bg-white/5 p-4 rounded-r" style={{borderColor: '#ffd740'}}>
                  <div className="font-bold text-white mb-2">{idx + 1}. {pillar.name}</div>
                  <p className="text-sm text-gray-400 mb-2">{pillar.description}</p>
                  {pillar.content_types && (
                    <div className="text-xs text-gray-500">
                      Types: {Array.isArray(pillar.content_types) ? pillar.content_types.join(', ') : pillar.content_types}
                    </div>
                  )}
                  {pillar.monthly_volume && (
                    <div className="text-xs text-gray-500">
                      Volume: {pillar.monthly_volume}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BLOG CONTENT HUB */}
        {data.blog_content_hub && data.blog_content_hub.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Blog Content Hub</h2>
            <div className="space-y-3">
              {data.blog_content_hub.map((post: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="font-bold text-white mb-1">{idx + 1}. {post.title}</div>
                  {post.outline && (
                    <div className="text-xs text-gray-400 mb-2">
                      Outline: {Array.isArray(post.outline) ? post.outline.slice(0, 2).join(' → ') + '...' : post.outline}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {post.seo_keywords && post.seo_keywords.slice(0, 3).map((kw: string, kidx: number) => (
                      <div key={kidx} className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'rgba(77,124,255,0.2)', color: '#4d7cff'}}>{kw}</div>
                    ))}
                  </div>
                  {post.target_audience && <div className="text-xs text-gray-500 mt-2">Audience: {post.target_audience}</div>}
                  {post.word_count && <div className="text-xs text-gray-500">Length: {post.word_count}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SOCIAL MEDIA STRATEGY */}
        {data.social_media_strategy && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Social Media Strategy</h2>
            <div className="space-y-4">
              {['instagram', 'tiktok', 'linkedin'].map((platform: string) => (
                data.social_media_strategy[platform] && (
                  <div key={platform} className="border border-white/10 bg-white/5 p-4 rounded">
                    <div className="text-xs text-gray-400 font-bold mb-2 uppercase">{platform}</div>
                    <div className="space-y-2">
                      {data.social_media_strategy[platform].map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-300 border-l border-gray-700 pl-2">
                          {item.type || item.angle}: {item.script ? item.script.slice(0, 100) + '...' : item.copy?.slice(0, 100) + '...'}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* EMAIL SEQUENCES */}
        {data.email_sequences && data.email_sequences.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Email Sequences</h2>
            <div className="space-y-3">
              {data.email_sequences.map((seq: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="font-bold text-white mb-2">{seq.name || `Sequence ${idx + 1}`}</div>
                  <div className="text-xs text-gray-400 mb-2">Subject: {seq.subject}</div>
                  {seq.body_outline && (
                    <div className="text-xs text-gray-500 mb-2">
                      Body: {Array.isArray(seq.body_outline) ? seq.body_outline.join(' → ') : seq.body_outline}
                    </div>
                  )}
                  {seq.cta && <div className="text-xs" style={{color: '#00e676'}}>CTA: {seq.cta}</div>}
                  {seq.send_timing && <div className="text-xs text-gray-500">Timing: {seq.send_timing}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VIDEO CONTENT BRIEFS */}
        {data.video_content_briefs && data.video_content_briefs.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Video Content Briefs</h2>
            <div className="space-y-3">
              {data.video_content_briefs.map((video: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="font-bold text-white mb-2">{video.type}: {video.title || `Video ${idx + 1}`}</div>
                  {video.script_outline && (
                    <div className="text-xs text-gray-400 mb-2">Script: {video.script_outline.slice(0, 150)}...</div>
                  )}
                  {video.visuals && <div className="text-xs text-gray-500">Visuals: {video.visuals}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CONTENT REPURPOSING */}
        {data.content_repurposing && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Content Repurposing Framework</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              {data.content_repurposing.blog_post_to_5_formats && (
                <div>
                  <div className="text-xs text-gray-400 font-bold mb-2">1 BLOG POST → 5 FORMATS</div>
                  <div className="text-xs text-gray-300">
                    Source: {data.content_repurposing.blog_post_to_5_formats.source}
                  </div>
                  {data.content_repurposing.blog_post_to_5_formats.formats && (
                    <ul className="text-xs text-gray-400 mt-2 space-y-1">
                      {data.content_repurposing.blog_post_to_5_formats.formats.map((fmt: string, idx: number) => (
                        <li key={idx}>• {fmt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* DISTRIBUTION & AMPLIFICATION */}
        {data.distribution_amplification && data.distribution_amplification.channels && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Distribution & Amplification</h2>
            <div className="space-y-3">
              {data.distribution_amplification.channels.map((ch: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="font-bold text-white mb-2">{ch.platform}</div>
                  <div className="text-xs text-gray-400 mb-1">Cadence: {ch.cadence}</div>
                  {ch.tactics && (
                    <div className="text-xs text-gray-500">
                      Tactics: {Array.isArray(ch.tactics) ? ch.tactics.join(', ') : ch.tactics}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CONTENT CALENDAR */}
        {data.content_calendar && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">12-Month Content Calendar</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded max-h-96 overflow-y-auto">
              <div className="text-xs text-gray-400">
                {data.content_calendar['12_month_rolling'] ? (
                  typeof data.content_calendar['12_month_rolling'] === 'string' ? (
                    <p>{data.content_calendar['12_month_rolling']}</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2 px-2">Month</th>
                          <th className="text-left py-2 px-2">Theme</th>
                          <th className="text-left py-2 px-2">Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.content_calendar['12_month_rolling'].map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-white/10">
                            <td className="py-2 px-2">{item.month}</td>
                            <td className="py-2 px-2">{item.pillar}</td>
                            <td className="py-2 px-2 text-xs">{item.format}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : (
                  <p>Calendar data pending</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ANALYTICS & MEASUREMENT */}
        {data.analytics_measurement && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Analytics & Measurement</h2>
            <div className="space-y-3">
              {data.analytics_measurement.kpis_per_type && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">KPIS PER CONTENT TYPE</div>
                  <div className="text-xs text-gray-300">
                    {typeof data.analytics_measurement.kpis_per_type === 'string'
                      ? data.analytics_measurement.kpis_per_type
                      : JSON.stringify(data.analytics_measurement.kpis_per_type).slice(0, 200)}
                  </div>
                </div>
              )}
              {data.analytics_measurement.dashboards && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">DASHBOARDS</div>
                  <div className="text-xs text-gray-300">{data.analytics_measurement.dashboards}</div>
                </div>
              )}
              {data.analytics_measurement.cadence && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">REPORTING CADENCE</div>
                  <div className="text-xs text-gray-300">{data.analytics_measurement.cadence}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* UGC STRATEGY */}
        {data.ugc_strategy && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">User-Generated Content Strategy</h2>
            <div className="space-y-3">
              {data.ugc_strategy.hashtags && data.ugc_strategy.hashtags.length > 0 && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">CAMPAIGN HASHTAGS</div>
                  <div className="flex flex-wrap gap-2">
                    {data.ugc_strategy.hashtags.slice(0, 5).map((tag: string, idx: number) => (
                      <div key={idx} className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'rgba(255,61,87,0.2)', color: '#ff5a72'}}>{tag}</div>
                    ))}
                  </div>
                </div>
              )}
              {data.ugc_strategy.testimonial_program && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">TESTIMONIAL PROGRAM</div>
                  <div className="text-xs text-gray-300">{data.ugc_strategy.testimonial_program}</div>
                </div>
              )}
              {data.ugc_strategy.community_content && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">COMMUNITY CONTENT</div>
                  <div className="text-xs text-gray-300">{data.ugc_strategy.community_content}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* COHERENCE CHECK */}
        {data.dependencies && (
          <div className="border-l-4 p-4 rounded-r mt-8" style={{borderColor: '#00e676', backgroundColor: 'rgba(0,230,118,0.05)'}}>
            <div className="text-xs font-bold" style={{color: '#00e676'}}>✓ DATA COHERENCE</div>
            <div className="text-xs text-gray-400 mt-1">
              Brand Briefing ID: {data.brand_briefing_id || 'loaded'}
            </div>
            {data.pillar_alignment && (
              <div className="text-xs text-gray-400 mt-1">
                Pillar Alignment: {data.pillar_alignment}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-black border-t border-white/10 p-6 md:p-8 text-center text-xs text-gray-500">
        {data?.generatedAt && <div>Generated {data.generatedAt}</div>}
      </div>
    </div>
  )
}
