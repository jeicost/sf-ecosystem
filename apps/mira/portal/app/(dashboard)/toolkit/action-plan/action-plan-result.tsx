'use client'

export function ActionPlanResult({ data }: { data?: any }) {
  if (!data) return <div className="text-gray-400">No data</div>

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-black border-b border-white/10 p-6 md:p-8">
        <h1 className="text-5xl font-black text-white mb-2">ACTION PLAN</h1>
        <p className="text-gray-400 max-w-2xl">90-day execution strategy: 30/60/90 sprints, OKRs, resources, KPIs, and risk mitigation</p>
      </div>

      {/* Main Content */}
      <div className="bg-black p-6 md:p-8 space-y-8">

        {/* EXECUTIVE SUMMARY */}
        {data.executive_summary && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Executive Summary</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              <p className="text-gray-300 text-sm">{data.executive_summary}</p>
            </div>
          </section>
        )}

        {/* QUARTERLY OKRS */}
        {data.quarterly_okrs && data.quarterly_okrs.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Quarterly OKRs</h2>
            <div className="space-y-4">
              {data.quarterly_okrs.map((q: any, qidx: number) => (
                <div key={qidx} className="border p-4 rounded" style={{borderColor: 'rgba(77,124,255,0.3)', backgroundColor: 'rgba(77,124,255,0.05)'}}>
                  <div className="text-xs font-bold mb-2" style={{color: '#4d7cff'}}>Q{q.q}</div>
                  {q.objectives && (
                    <ul className="text-sm text-gray-300 space-y-1">
                      {q.objectives.map((obj: string, oidx: number) => (
                        <li key={oidx}>• {obj}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 30-DAY SPRINT */}
        {data['30_day_sprint'] && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">30-Day Sprint</h2>
            <div className="space-y-4">
              {data['30_day_sprint'].focus && (
                <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#00e676', backgroundColor: 'rgba(0,230,118,0.05)'}}>
                  <div className="text-xs font-bold mb-1" style={{color: '#00e676'}}>FOCUS</div>
                  <p className="text-sm text-gray-300">{data['30_day_sprint'].focus}</p>
                </div>
              )}
              {data['30_day_sprint'].weekly_milestones && data['30_day_sprint'].weekly_milestones.length > 0 && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">WEEKLY MILESTONES</div>
                  {data['30_day_sprint'].weekly_milestones.map((m: string, idx: number) => (
                    <div key={idx} className="text-xs text-gray-300 mb-1">Week {idx + 1}: {m}</div>
                  ))}
                </div>
              )}
              {data['30_day_sprint'].actions && data['30_day_sprint'].actions.length > 0 && (
                <div className="space-y-2">
                  {data['30_day_sprint'].actions.slice(0, 5).map((action: any, idx: number) => (
                    <div key={idx} className="border border-white/10 bg-white/5 p-3 rounded">
                      <div className="font-bold text-white text-sm mb-1">{idx + 1}. {action.title}</div>
                      <div className="flex gap-2 text-xs text-gray-400">
                        {action.owner && <div>Owner: {action.owner}</div>}
                        {action.effort && <div>Effort: {action.effort}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 60-DAY PUSH */}
        {data['60_day_push'] && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">60-Day Push</h2>
            <div className="space-y-4">
              {data['60_day_push'].focus && (
                <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#ffd740', backgroundColor: 'rgba(255,215,64,0.05)'}}>
                  <div className="text-xs font-bold mb-1" style={{color: '#ffd740'}}>FOCUS</div>
                  <p className="text-sm text-gray-300">{data['60_day_push'].focus}</p>
                </div>
              )}
              {data['60_day_push'].actions && data['60_day_push'].actions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data['60_day_push'].actions.slice(0, 4).map((action: any, idx: number) => (
                    <div key={idx} className="border border-white/10 bg-white/5 p-3 rounded">
                      <div className="font-bold text-white text-sm mb-1">{action.title}</div>
                      <div className="text-xs text-gray-400">{action.metric}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 90-DAY VISION */}
        {data['90_day_vision'] && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">90-Day Vision</h2>
            <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#4d7cff', backgroundColor: 'rgba(77,124,255,0.05)'}}>
              <p className="text-gray-300 text-sm">{data['90_day_vision'].focus}</p>
              {data['90_day_vision'].actions && data['90_day_vision'].actions.length > 0 && (
                <ul className="mt-3 text-sm text-gray-300 space-y-1">
                  {data['90_day_vision'].actions.map((a: string, idx: number) => (
                    <li key={idx}>• {a}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* RESOURCE REQUIREMENTS */}
        {data.resource_requirements && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Resource Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.resource_requirements.team && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">TEAM</div>
                  {Array.isArray(data.resource_requirements.team) ? (
                    <ul className="text-xs text-gray-300 space-y-1">
                      {data.resource_requirements.team.map((t: string, idx: number) => (
                        <li key={idx}>• {t}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-300">{data.resource_requirements.team}</p>
                  )}
                </div>
              )}
              {data.resource_requirements.budget && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 font-bold mb-2">BUDGET</div>
                  <p className="text-sm font-bold" style={{color: '#00e676'}}>{data.resource_requirements.budget}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* KPIS & TRACKING */}
        {data.kpis && data.kpis.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">KPIs & Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.kpis.map((kpi: any, idx: number) => (
                <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="font-bold text-white text-sm mb-1">{kpi.metric}</div>
                  <div className="text-xs" style={{color: '#00e676'}}>Target: {kpi.target}</div>
                  <div className="text-xs text-gray-400 mt-1">Tracking: {kpi.tracking}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RISK MITIGATION */}
        {data.risk_mitigation && data.risk_mitigation.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Risk Mitigation</h2>
            <div className="space-y-3">
              {data.risk_mitigation.slice(0, 5).map((risk: any, idx: number) => (
                <div key={idx} className="border-l-4 p-4 rounded-r" style={{borderColor: '#ff5a72', backgroundColor: 'rgba(255,61,87,0.05)'}}>
                  <div className="font-bold text-white text-sm mb-1">{risk.risk}</div>
                  <div className="text-xs text-gray-400 mb-1">Probability: {risk.probability} | Impact: {risk.impact}</div>
                  <div className="text-xs" style={{color: '#00e676'}}>Mitigation: {risk.mitigation}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MISSION ALIGNMENT */}
        {data.mission_alignment && (
          <div className="border-l-4 p-4 rounded-r mt-8" style={{borderColor: '#4dd9c4', backgroundColor: 'rgba(77,217,196,0.05)'}}>
            <div className="text-xs font-bold" style={{color: '#4dd9c4'}}>✓ MISSION ALIGNMENT</div>
            <div className="text-xs text-gray-400 mt-1">
              OKRs verified against Brand Briefing mission
            </div>
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
