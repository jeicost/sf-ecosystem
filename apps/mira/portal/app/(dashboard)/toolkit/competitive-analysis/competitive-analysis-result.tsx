'use client'

export function CompetitiveAnalysisResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>

  const brandColor = data?.brandColor || '#8B5CF6'

  return (
    <div className="w-full bg-gradient-to-b from-gray-950 via-black to-gray-950">
      <div className="border-b border-white/5 p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">COMPETITIVE ANALYSIS</h1>
        <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">Market intelligence: landscape, competitive matrix, positioning, SWOT, pricing, and winning strategy</p>
        {data.positioning_validation && (
          <div className={`mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${data.positioning_validation === 'verified' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-orange-500/10 border border-orange-500/30 text-orange-400'}`}>
            {data.positioning_validation === 'verified' ? '✓' : '⚠'} Positioning: {data.positioning_validation}
          </div>
        )}
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Executive Summary */}
        {data.executive_summary && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Executive Summary</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              <p className="text-gray-300 text-sm">{data.executive_summary}</p>
            </div>
          </section>
        )}

        {/* Market Landscape */}
        {data.market_landscape && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Market Landscape</h2>
            <div className="space-y-3">
              {data.market_landscape.size && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-1">MARKET SIZE</div>
                  <p className="text-sm text-gray-300">{data.market_landscape.size}</p>
                </div>
              )}
              {data.market_landscape.growth_rate && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-1">GROWTH RATE</div>
                  <p className="text-sm text-green-400 font-bold">{data.market_landscape.growth_rate}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Competitive Matrix */}
        {data.competitive_matrix && data.competitive_matrix.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Competitive Matrix</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.competitive_matrix.slice(0, 8).map((comp: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="font-bold text-white mb-1">{comp.name}</div>
                  <div className="text-xs text-gray-400 mb-2">{comp.positioning}</div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    {comp.pricing && <div>Price: {comp.pricing}</div>}
                    {comp.product_maturity && <div>Maturity: {comp.product_maturity}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing Comparison */}
        {data.pricing_comparison && data.pricing_comparison.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Pricing Strategy</h2>
            <div className="space-y-2">
              {data.pricing_comparison.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-3 rounded text-sm">
                  <div className="font-bold text-white">{item.company || item.tier}</div>
                  {item.price && <div className="text-gray-400 text-xs">{item.price}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SWOT Analysis */}
        {data.swot_vs_competitors && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">SWOT Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              {data.swot_vs_competitors.strengths && (
                <div className="border-l-4 border-green-500 bg-green-500/5 p-4 rounded-r">
                  <div className="text-xs text-green-400 font-bold mb-2">STRENGTHS</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {data.swot_vs_competitors.strengths.slice(0, 3).map((s: string, i: number) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.swot_vs_competitors.opportunities && (
                <div className="border-l-4 border-blue-500 bg-blue-500/5 p-4 rounded-r">
                  <div className="text-xs text-blue-400 font-bold mb-2">OPPORTUNITIES</div>
                  <ul className="text-xs text-gray-300 space-y-1">
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
            <h2 className="text-2xl font-black text-white uppercase mb-4">Winning Strategy</h2>
            <div className="border-l-4 border-purple-500 bg-purple-500/5 p-4 rounded-r">
              <p className="text-sm text-gray-300">{typeof data.winning_strategy === 'string' ? data.winning_strategy : JSON.stringify(data.winning_strategy).slice(0, 300)}</p>
            </div>
          </section>
        )}

        {/* Key Takeaways */}
        {data.key_takeaways && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Key Takeaways</h2>
            <div className="space-y-3">
              {data.key_takeaways.top_3_competitors && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">TOP 3 COMPETITORS TO WATCH</div>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {data.key_takeaways.top_3_competitors.map((c: string, i: number) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.key_takeaways.top_3_differentiation && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">HOW TO DIFFERENTIATE</div>
                  <ul className="text-xs text-gray-300 space-y-1">
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
          <div className={`border-l-4 ${data.positioning_validation === 'verified' ? 'border-green-500 bg-green-500/5' : 'border-orange-500 bg-orange-500/5'} p-4 rounded-r mt-8`}>
            <div className={`text-xs font-bold ${data.positioning_validation === 'verified' ? 'text-green-400' : 'text-orange-400'}`}>
              {data.positioning_validation === 'verified' ? '✓ POSITIONING VERIFIED' : '⚠️ POSITIONING AT RISK'}
            </div>
            {data.recommended_adjustments && data.recommended_adjustments.length > 0 && (
              <ul className="text-xs text-gray-300 mt-2 space-y-1">
                {data.recommended_adjustments.map((adj: string, i: number) => (
                  <li key={i}>• {adj}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-6 md:p-8 text-center text-xs text-gray-500">
        {data?.generatedAt && <div>Generated {data.generatedAt}</div>}
      </div>
    </div>
  )
}
