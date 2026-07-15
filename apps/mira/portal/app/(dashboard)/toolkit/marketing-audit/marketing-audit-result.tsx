'use client'

export function MarketingAuditResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>

  const brandColor = data?.brandColor || '#8B5CF6'

  return (
    <div className="w-full bg-gradient-to-b from-gray-950 via-black to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">MARKETING AUDIT</h1>
        <p className="text-gray-400 max-w-2xl text-sm leading-relaxed mb-6">Comprehensive marketing health check: brand, funnel, social, content, retention, budget allocation, and attribution</p>
        {data.coherence_check && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.3)', borderWidth: '1px', color: '#00e676'}}>
            <span>✓</span> Brand Briefing alignment verified
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="border-b border-white/5 p-6 md:p-8">
        {data.statCards && data.statCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.statCards.map((card: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border transition-all backdrop-blur-sm" style={{
                borderColor: card.status === 'critical' ? 'rgba(255,61,87,0.4)' : card.status === 'warning' ? 'rgba(255,215,64,0.4)' : 'rgba(255,255,255,0.1)',
                backgroundColor: card.status === 'critical' ? 'rgba(255,61,87,0.08)' : card.status === 'warning' ? 'rgba(255,215,64,0.08)' : 'rgba(255,255,255,0.05)'
              }}>
                <div className="text-2xl font-black mb-2" style={{color: card.status === 'critical' ? '#ff5a72' : card.status === 'warning' ? '#ffd740' : '#4d7cff'}}>{card.value}</div>
                <div className="text-xs text-gray-400 font-medium leading-tight">{card.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Sections */}
      <div className="p-6 md:p-8 space-y-8">
        {data.sections && data.sections.map((section: any, idx: number) => (
          <section key={idx}>
            <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-tight" style={{textShadow: `0 2px 8px ${brandColor}20`}}>{section.title}</h2>
            {section.type === 'cards' && section.cards && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.cards.map((card: any, cidx: number) => (
                  <div key={cidx} className="border-l-4 bg-white/5 p-4 rounded-r" style={{borderColor: card.color_border === 'teal' ? '#4dd9c4' : card.color_border === 'red' ? '#ff5a72' : '#ff5a1f'}}>
                    <h3 className="font-bold text-white mb-2">+ {card.title}</h3>
                    <p className="text-sm text-gray-400">{card.content}</p>
                  </div>
                ))}
              </div>
            )}
            {section.type === 'eeat_matrix' && section.dimensions && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {section.dimensions.map((dim: any, didx: number) => (
                  <div key={didx} className="border border-white/10 bg-white/5 p-4 rounded text-center">
                    <div className="text-lg font-bold mb-2" style={{color: '#4dd9c4'}}>{dim.status}</div>
                    <div className="text-sm font-semibold text-white mb-2">{dim.name}</div>
                    {dim.content && <div className="text-xs text-gray-500">{dim.content}</div>}
                  </div>
                ))}
              </div>
            )}
            {section.type === 'findings' && section.findings && (
              <div className="space-y-3">
                {section.findings.map((finding: any, fidx: number) => (
                  <div key={fidx} className="border-l-2 bg-white/5 p-4 rounded-r" style={{borderColor: '#ffd740'}}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="font-bold text-white">{finding.title}</div>
                      <span className="text-xs font-semibold px-2 py-1 rounded whitespace-nowrap" style={{
                        backgroundColor: finding.severity === 'critical' ? 'rgba(255,61,87,0.2)' : 'rgba(255,90,31,0.2)',
                        color: finding.severity === 'critical' ? '#ff5a72' : '#ff5a1f'
                      }}>
                        {finding.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{finding.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Quick Wins */}
        {data.quickWins && data.quickWins.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-6">⚡ Quick Wins</h2>
            <div className="space-y-3">
              {data.quickWins.map((action: any, idx: number) => (
                <div key={idx} className="border-l-2 bg-white/5 p-4 rounded-lg" style={{borderColor: '#ffd740'}}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="font-bold text-white">{idx + 1}. {action.title}</div>
                      {action.description && <p className="text-sm text-gray-400 mt-1">{action.description}</p>}
                    </div>
                    {action.effort_tag && <span className="text-xs font-semibold px-2 py-1 rounded whitespace-nowrap" style={{backgroundColor: 'rgba(0,230,118,0.2)', color: '#00e676'}}>{action.effort_tag}</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    {action.impact && <div>💰 {action.impact}</div>}
                    {action.effort_hours && <div>⏱️ {action.effort_hours}h</div>}
                    {action.roi_score && <div>ROI: {action.roi_score}/10</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 p-6 md:p-8 text-center text-xs text-gray-500">
        {data?.generatedAt && <div>Generated {data.generatedAt}</div>}
      </div>
    </div>
  )
}
