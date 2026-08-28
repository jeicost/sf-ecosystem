'use client'

import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

/**
 * Bullet lists in these reports are declared as bare `[]` in the prompt, so the
 * model returns strings in one run and objects in the next. Never hand a raw
 * object to JSX — that is React #31 and it blanks the entire report.
 */
function asText(v: any): string {
  if (v == null) return ''
  if (typeof v !== 'object') return String(v)
  const pick = v.title ?? v.name ?? v.objective ?? v.role ?? v.text ?? v.description
  return pick != null ? String(pick) : JSON.stringify(v)
}

/**
 * An OKR objective arrives either as a plain string or as an object. The prompt
 * only declares `"objectives": []` while asking the model to flag mission
 * alignment, so it legitimately returns
 * `{objective, key_results[], alignment, alignment_note}`. Rendering that object
 * straight into JSX threw React #31 and blanked the whole report, so this
 * narrows the shape instead of assuming a string.
 */
function Objective({ obj }: { obj: any }) {
  if (obj == null) return null

  if (typeof obj !== 'object') {
    return <span>• {String(obj)}</span>
  }

  const title = obj.objective ?? obj.title ?? obj.name
  const keyResults: any[] = Array.isArray(obj.key_results) ? obj.key_results : []
  const alignment = typeof obj.alignment === 'string' ? obj.alignment : null
  const note = typeof obj.alignment_note === 'string' ? obj.alignment_note : null

  // Unknown object shape: show it rather than dropping it silently.
  if (title == null && !keyResults.length && !alignment && !note) {
    return <span className="text-ink-tertiary">• {JSON.stringify(obj)}</span>
  }

  const warn = alignment === 'warning'

  return (
    <div>
      <div className="flex items-start gap-2">
        <span>•</span>
        <div className="flex-1">
          {title != null && <span className="text-ink">{String(title)}</span>}
          {alignment && (
            <span
              className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded align-middle"
              style={{
                color: warn ? '#ffb300' : '#00e676',
                backgroundColor: warn ? 'rgba(255,179,0,0.12)' : 'rgba(0,230,118,0.12)',
              }}
            >
              {alignment}
            </span>
          )}
        </div>
      </div>
      {keyResults.length > 0 && (
        <ul className="mt-1 ml-5 space-y-0.5 text-xs text-ink-tertiary">
          {keyResults.map((kr: any, i: number) => (
            <li key={i}>– {typeof kr === 'object' ? JSON.stringify(kr) : String(kr)}</li>
          ))}
        </ul>
      )}
      {note && <div className="mt-1 ml-5 text-xs italic text-ink-tertiary">{note}</div>}
    </div>
  )
}

export function ActionPlanResult({ data }: { data?: any }) {
  const { locale } = useLocaleContext()
  if (!data) return <div className="text-ink-secondary">{t('toolkit.results.no-data', locale)}</div>

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-page border-b border-line p-6 md:p-8">
        <h1 className="text-5xl font-black text-ink mb-2">{t('toolkit.action-plan.result-title', locale)}</h1>
        <p className="text-ink-secondary max-w-2xl">{t('toolkit.action-plan.result-desc', locale)}</p>
      </div>

      {/* Main Content */}
      <div className="bg-page p-6 md:p-8 space-y-8">

        {/* EXECUTIVE SUMMARY */}
        {data.executive_summary && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.results.executive-summary', locale)}</h2>
            <div className="border border-line bg-surface p-4 rounded">
              <p className="text-ink-secondary text-sm">{data.executive_summary}</p>
            </div>
          </section>
        )}

        {/* QUARTERLY OKRS */}
        {data.quarterly_okrs && data.quarterly_okrs.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.action-plan.quarterly-okrs', locale)}</h2>
            <div className="space-y-4">
              {data.quarterly_okrs.map((q: any, qidx: number) => (
                <div key={qidx} className="border p-4 rounded" style={{borderColor: 'rgba(77,124,255,0.3)', backgroundColor: 'rgba(77,124,255,0.05)'}}>
                  <div className="text-xs font-bold mb-2" style={{color: '#4d7cff'}}>Q{q.q}</div>
                  {Array.isArray(q.objectives) && (
                    <ul className="text-sm text-ink-secondary space-y-3">
                      {q.objectives.map((obj: any, oidx: number) => (
                        <li key={oidx}>
                          <Objective obj={obj} />
                        </li>
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
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.action-plan.sprint-30', locale)}</h2>
            <div className="space-y-4">
              {data['30_day_sprint'].focus && (
                <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#00e676', backgroundColor: 'rgba(0,230,118,0.05)'}}>
                  <div className="text-xs font-bold mb-1" style={{color: '#00e676'}}>{t('toolkit.action-plan.focus', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data['30_day_sprint'].focus}</p>
                </div>
              )}
              {data['30_day_sprint'].weekly_milestones && data['30_day_sprint'].weekly_milestones.length > 0 && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.action-plan.weekly-milestones', locale)}</div>
                  {data['30_day_sprint'].weekly_milestones.map((m: any, idx: number) => (
                    <div key={idx} className="text-xs text-ink-secondary mb-1">{t('toolkit.action-plan.week', locale)} {idx + 1}: {asText(m)}</div>
                  ))}
                </div>
              )}
              {data['30_day_sprint'].actions && data['30_day_sprint'].actions.length > 0 && (
                <div className="space-y-2">
                  {data['30_day_sprint'].actions.slice(0, 5).map((action: any, idx: number) => (
                    <div key={idx} className="border border-line bg-surface p-3 rounded">
                      <div className="font-bold text-ink text-sm mb-1">{idx + 1}. {action.title}</div>
                      <div className="flex gap-2 text-xs text-ink-secondary">
                        {action.owner && <div>{t('toolkit.action-plan.owner', locale)}: {action.owner}</div>}
                        {action.effort && <div>{t('toolkit.action-plan.effort', locale)}: {action.effort}</div>}
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
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.action-plan.push-60', locale)}</h2>
            <div className="space-y-4">
              {data['60_day_push'].focus && (
                <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#ffd740', backgroundColor: 'rgba(255,215,64,0.05)'}}>
                  <div className="text-xs font-bold mb-1" style={{color: '#ffd740'}}>{t('toolkit.action-plan.focus', locale)}</div>
                  <p className="text-sm text-ink-secondary">{data['60_day_push'].focus}</p>
                </div>
              )}
              {data['60_day_push'].actions && data['60_day_push'].actions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data['60_day_push'].actions.slice(0, 4).map((action: any, idx: number) => (
                    <div key={idx} className="border border-line bg-surface p-3 rounded">
                      <div className="font-bold text-ink text-sm mb-1">{action.title}</div>
                      <div className="text-xs text-ink-secondary">{action.metric}</div>
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
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.action-plan.vision-90', locale)}</h2>
            <div className="border-l-4 p-4 rounded-r" style={{borderColor: '#4d7cff', backgroundColor: 'rgba(77,124,255,0.05)'}}>
              <p className="text-ink-secondary text-sm">{data['90_day_vision'].focus}</p>
              {data['90_day_vision'].actions && data['90_day_vision'].actions.length > 0 && (
                <ul className="mt-3 text-sm text-ink-secondary space-y-1">
                  {data['90_day_vision'].actions.map((a: any, idx: number) => (
                    <li key={idx}>
                      • {asText(a)}
                      {a && typeof a === 'object' && a.metric && (
                        <span className="text-xs text-ink-tertiary"> — {asText(a.metric)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* RESOURCE REQUIREMENTS */}
        {data.resource_requirements && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.action-plan.resource-requirements', locale)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.resource_requirements.team && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.action-plan.team', locale)}</div>
                  {Array.isArray(data.resource_requirements.team) ? (
                    <ul className="text-xs text-ink-secondary space-y-1">
                      {data.resource_requirements.team.map((member: any, idx: number) => (
                        <li key={idx}>• {asText(member)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-ink-secondary">{data.resource_requirements.team}</p>
                  )}
                </div>
              )}
              {data.resource_requirements.budget && (
                <div className="border border-line bg-surface p-4 rounded">
                  <div className="text-xs text-ink-secondary font-bold mb-2">{t('toolkit.action-plan.budget', locale)}</div>
                  <p className="text-sm font-bold" style={{color: '#00e676'}}>{data.resource_requirements.budget}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* KPIS & TRACKING */}
        {data.kpis && data.kpis.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.action-plan.kpis-tracking', locale)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.kpis.map((kpi: any, idx: number) => (
                <div key={idx} className="border border-line bg-surface p-4 rounded">
                  <div className="font-bold text-ink text-sm mb-1">{kpi.metric}</div>
                  <div className="text-xs" style={{color: '#00e676'}}>{t('toolkit.results.target', locale)}: {kpi.target}</div>
                  <div className="text-xs text-ink-secondary mt-1">{t('toolkit.results.tracking', locale)}: {kpi.tracking}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RISK MITIGATION */}
        {data.risk_mitigation && data.risk_mitigation.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-ink uppercase mb-4">{t('toolkit.action-plan.risk-mitigation', locale)}</h2>
            <div className="space-y-3">
              {data.risk_mitigation.slice(0, 5).map((risk: any, idx: number) => (
                <div key={idx} className="border-l-4 p-4 rounded-r" style={{borderColor: '#ff5a72', backgroundColor: 'rgba(255,61,87,0.05)'}}>
                  <div className="font-bold text-ink text-sm mb-1">{risk.risk}</div>
                  <div className="text-xs text-ink-secondary mb-1">
                    {t('toolkit.action-plan.risk-probability-impact', locale)
                      .replace('{probability}', String(risk.probability))
                      .replace('{impact}', String(risk.impact))}
                  </div>
                  <div className="text-xs" style={{color: '#00e676'}}>
                    {t('toolkit.action-plan.risk-mitigation-label', locale).replace('{mitigation}', String(risk.mitigation))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MISSION ALIGNMENT */}
        {data.mission_alignment && (
          <div className="border-l-4 p-4 rounded-r mt-8" style={{borderColor: '#4dd9c4', backgroundColor: 'rgba(77,217,196,0.05)'}}>
            <div className="text-xs font-bold" style={{color: '#4dd9c4'}}>{t('toolkit.action-plan.mission-alignment-badge', locale)}</div>
            <div className="text-xs text-ink-secondary mt-1">
              {t('toolkit.action-plan.mission-alignment-desc', locale)}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-page border-t border-line p-6 md:p-8 text-center text-xs text-ink-tertiary">
        {data?.generatedAt && <div>{t('toolkit.results.generated', locale).replace('{date}', String(data.generatedAt))}</div>}
      </div>
    </div>
  )
}
