'use client'

export function SeoAuditResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>

  const statCards = data?.statCards || [
    { label: 'Style Chars (Ideal <60)', value: '69', status: 'warning' },
    { label: 'Imágenes con Alt Text', value: '20/20', status: 'perfect' },
    { label: 'Schema Types Activos', value: '5', status: 'good' },
    { label: 'Hreflang Tags EN/TH', value: '0', status: 'critical' },
  ]

  // Brand color mapping (from Brand Brain)
  const brandColor = data?.brandColor || '#8B5CF6'
  const scoreColor = data?.overall_score >= 80 ? '#10b981' : data?.overall_score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="w-full bg-gradient-to-b from-gray-950 via-black to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 p-6 md:p-8 md:pb-12">
        <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight">SEO AUDIT</h1>
        <p className="text-gray-400 max-w-2xl text-sm leading-relaxed mb-8">Comprehensive SEO analysis: on-page, technical, local, content gaps, backlinks, and prioritized action plan</p>
        <div className="flex items-baseline gap-3">
          <div className="text-7xl font-black" style={{color: scoreColor}}>{data?.overall_score || 62}</div>
          <div className="text-sm font-semibold text-gray-400">{data?.scoreLabel || 'Overall Score'}</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="border-b border-white/5 p-6 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card: any, idx: number) => (
            <div key={idx} className={`p-4 rounded-xl border transition-all backdrop-blur-sm ${card.status === 'critical' ? 'border-red-500/40 bg-red-500/8' : card.status === 'perfect' ? 'border-green-500/40 bg-green-500/8' : card.status === 'warning' ? 'border-amber-500/40 bg-amber-500/8' : 'border-white/10 bg-white/5'}`}>
              <div className={`text-3xl font-black mb-2 ${card.status === 'critical' ? 'text-red-400' : card.status === 'perfect' ? 'text-green-400' : card.status === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>{card.value}</div>
              <div className="text-xs text-gray-400 font-medium leading-tight">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Sections */}
      <div className="p-6 md:p-8 space-y-8">
        {data?.sections && data.sections.map((section: any, idx: number) => (
          <section key={idx}>
            <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-tight" style={{textShadow: `0 2px 8px ${brandColor}20`}}>{section.title}</h2>
            {section.type === 'table' && section.elements && (
              <div className="border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-4 px-4 text-white font-semibold">Element</th>
                      <th className="text-left py-4 px-4 text-white font-semibold">Status</th>
                      <th className="text-left py-4 px-4 text-white font-semibold">Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.elements.map((elem: any, eidx: number) => (
                      <tr key={eidx} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-4 px-4 text-white">{elem.element}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${elem.status === 'critical' ? 'bg-red-500/20 text-red-300' : elem.status === 'perfect' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {elem.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-400 text-xs">{elem.analysis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.type === 'schema_cards' && section.schemas && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {section.schemas.map((schema: any, sidx: number) => (
                  <div key={sidx} className={`p-4 rounded-xl border backdrop-blur-sm ${schema.status === 'active' ? 'border-green-500/30 bg-green-500/8' : 'border-red-500/30 bg-red-500/8'}`}>
                    <div className={`font-bold mb-2 text-sm ${schema.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>● {schema.name}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{schema.impact || schema.opportunity}</div>
                  </div>
                ))}
              </div>
            )}
            {section.type === 'table' && section.keywords && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.keywords.map((kw: any, kidx: number) => (
                  <div key={kidx} className="border border-white/10 bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                    <div className="font-semibold text-white mb-3">{kw.keyword}</div>
                    <div className="text-xs text-gray-400 space-y-2">
                      {kw.volume && <div>Volume: <span className="text-amber-400 font-semibold">{kw.volume}</span></div>}
                      {kw.intent && <div>Intent: <span className="text-blue-400 font-semibold">{kw.intent}</span></div>}
                      {kw.priority && <div>Priority: <span className="text-green-400 font-semibold">{kw.priority}</span></div>}
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
            <h2 className="text-2xl font-black text-white uppercase mb-6 tracking-tight" style={{textShadow: `0 2px 8px ${brandColor}20`}}>Plan de Acción</h2>
            <div className="space-y-3">
              {data.actions.map((action: any, aidx: number) => (
                <div key={aidx} className="border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-4 rounded-xl backdrop-blur-sm hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="font-semibold text-white">{aidx + 1}. {action.title}</div>
                    {action.priority && <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${action.priority === 'CRÍTICO' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>{action.priority}</span>}
                  </div>
                  {action.description && <p className="text-sm text-gray-400 mb-3">{action.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    {action.impact && <div>📊 {action.impact}</div>}
                    {action.effort && <div>⏱️ {action.effort}</div>}
                    {action.expected_roi && <div>ROI: {action.expected_roi}/10</div>}
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
