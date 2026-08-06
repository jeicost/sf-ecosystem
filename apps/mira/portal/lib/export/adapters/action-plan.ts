// Adapter: action-plan → editorial Section[]
// Input contract: executive_summary, quarterly_okrs[], 30_day_sprint, 60_day_push,
// 90_day_vision, success_definition, resource_requirements, team_capacity,
// budget_breakdown, kpis[], learning_loops, stakeholder_communication,
// risk_mitigation[], escalation_procedures, mission_alignment, dependencies (+ ids).

import type { Section, StatItem, PhaseItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asNum,
  asObj,
  asStr,
  esc,
  genericSections,
  humanize,
  isPlainObject,
  sectionForValue,
  valueToHtml,
} from './generic'

const HORIZONS: Array<[string, string]> = [
  ['30_day_sprint', '30-Day Sprint'],
  ['60_day_push', '60-Day Push'],
  ['90_day_vision', '90-Day Vision'],
]

function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  let totalActions = 0
  for (const [key] of HORIZONS) {
    totalActions += asArr(asObj(r[key]).actions).length
  }
  if (totalActions) stats.push({ value: String(totalActions), label: 'Planned actions' })
  const okrs = asArr(r.quarterly_okrs)
  if (okrs.length) stats.push({ value: String(okrs.length), label: 'Quarters with OKRs' })
  const kpis = asArr(r.kpis)
  if (kpis.length) stats.push({ value: String(kpis.length), label: 'Tracked KPIs' })
  const risks = asArr(r.risk_mitigation)
  if (risks.length) stats.push({ value: String(risks.length), label: 'Identified risks' })

  const section: Section = {
    title: 'Executive Summary',
    navLabel: 'Summary',
    subtitle: '30/60/90-day execution plan aligned with the brand mission',
    stats: stats.length ? stats : undefined,
  }
  if (asStr(r.executive_summary)) {
    section.content = asStr(r.executive_summary)
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p)}</p>`)
      .join('')
  }
  return section
}

function okrsSection(r: Record<string, any>): Section | null {
  const okrs = asArr(r.quarterly_okrs).filter(isPlainObject)
  if (!okrs.length) return null
  return {
    title: 'Quarterly OKRs',
    navLabel: 'OKRs',
    phases: okrs.map((o, i) => ({
      title: `Q${asStr(o.q) || String(i + 1)}`,
      body: valueToHtml(o.objectives) || valueToHtml(o),
    })),
  }
}

function horizonPhase(key: string, title: string, r: Record<string, any>): PhaseItem | null {
  const h = asObj(r[key])
  if (!Object.keys(h).length) return null
  const parts: string[] = []
  if (asStr(h.focus)) parts.push(`<p><strong>Focus:</strong> ${esc(asStr(h.focus))}</p>`)
  const milestones = asArr(h.weekly_milestones)
  if (milestones.length) {
    parts.push(`<p style="margin-top:8px;"><strong>Weekly milestones:</strong></p>${valueToHtml(milestones)}`)
  }
  const actions = asArr(h.actions)
  if (actions.length) {
    const items = actions
      .map((a) => {
        if (!isPlainObject(a)) return valueToHtml(a)
        const meta = [
          asStr(a.owner) ? `Owner: ${esc(asStr(a.owner))}` : '',
          asStr(a.effort) ? `Effort: ${esc(asStr(a.effort))}` : '',
          asStr(a.metric) ? `Metric: ${esc(asStr(a.metric))}` : '',
        ]
          .filter(Boolean)
          .join(' · ')
        return `<strong>${esc(asStr(a.title) || 'Action')}</strong>${meta ? ` — ${meta}` : ''}`
      })
      .filter(Boolean)
      .map((li) => `<li>${li}</li>`)
      .join('')
    if (items) parts.push(`<p style="margin-top:8px;"><strong>Actions:</strong></p><ul>${items}</ul>`)
  }
  if (!parts.length) {
    const body = valueToHtml(h)
    if (!body) return null
    return { title, body }
  }
  return { title, body: parts.join('') }
}

function roadmapSection(r: Record<string, any>): Section | null {
  const phases = HORIZONS.map(([key, title]) => horizonPhase(key, title, r)).filter(
    (p): p is PhaseItem => p !== null
  )
  if (!phases.length) return null
  return {
    title: '30 / 60 / 90-Day Plan',
    navLabel: '30/60/90',
    subtitle: 'Execution roadmap by time horizon',
    phases,
  }
}

function budgetSection(r: Record<string, any>): Section | null {
  const rr = asObj(r.resource_requirements)
  const bb = asObj(r.budget_breakdown)
  if (!Object.keys(rr).length && !Object.keys(bb).length) return null

  const section: Section = {
    title: 'Resources & Budget',
    navLabel: 'Resources',
  }
  const cards = [
    { title: 'Team', body: valueToHtml(rr.team) },
    { title: 'Budget', body: valueToHtml(rr.budget) },
    { title: 'Tools', body: valueToHtml(rr.tools) },
  ].filter((c) => c.body)
  if (Object.keys(bb).length) {
    // Doughnut chart if the budget breakdown values parse to numbers
    const labels: string[] = []
    const data: number[] = []
    for (const [k, v] of Object.entries(bb)) {
      const n = asNum(v)
      if (n !== null && n > 0) {
        labels.push(humanize(k))
        data.push(n)
      }
    }
    if (labels.length >= 2) {
      section.chart = { type: 'doughnut', labels, data, label: 'Budget breakdown' }
    } else {
      const body = valueToHtml(bb)
      if (body) cards.push({ title: 'Budget Breakdown', body })
    }
  }
  if (cards.length) section.cards = cards
  if (!section.cards && !section.chart) return null
  return section
}

function kpisSection(r: Record<string, any>): Section | null {
  const kpis = asArr(r.kpis).filter(isPlainObject)
  if (!kpis.length) return null
  return {
    title: 'KPIs & Tracking',
    navLabel: 'KPIs',
    table: {
      headers: ['Metric', 'Target', 'Tracking'],
      rows: kpis.map((k) => [
        `<strong>${esc(asStr(k.metric) || asStr(k.name) || 'KPI')}</strong>`,
        valueToHtml(k.target),
        valueToHtml(k.tracking),
      ]),
    },
  }
}

function risksSection(r: Record<string, any>): Section | null {
  const risks = asArr(r.risk_mitigation).filter(isPlainObject)
  if (!risks.length) return null
  return {
    title: 'Risks & Mitigation',
    navLabel: 'Risks',
    table: {
      headers: ['Risk', 'Probability', 'Impact', 'Mitigation'],
      rows: risks.map((k) => [
        `<strong>${esc(asStr(k.risk))}</strong>`,
        valueToHtml(k.probability),
        valueToHtml(k.impact),
        valueToHtml(k.mitigation),
      ]),
    },
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'brand_briefing_id',
      'marketing_audit_id',
      'content_pack_id',
      'dependencies',
      'mission_alignment',
      'executive_summary',
      'quarterly_okrs',
      '30_day_sprint',
      '60_day_push',
      '90_day_vision',
      'resource_requirements',
      'budget_breakdown',
      'kpis',
      'risk_mitigation',
    ])

    sections.push(overviewSection(r))
    const parts = [okrsSection(r), roadmapSection(r), budgetSection(r), kpisSection(r), risksSection(r)]
    for (const s of parts) if (s) sections.push(s)

    const mapped: Array<[string, string]> = [
      ['success_definition', 'Definition of Success'],
      ['team_capacity', 'Team Capacity'],
      ['learning_loops', 'Learning Loops'],
      ['stakeholder_communication', 'Stakeholder Communication'],
      ['escalation_procedures', 'Escalation Procedures'],
    ]
    for (const [key, title] of mapped) {
      used.add(key)
      const s = sectionForValue(key, r[key])
      if (s) sections.push({ ...s, title })
    }

    // Mission alignment warnings, only if something is off
    const alignment = asObj(r.mission_alignment)
    const misaligned = Object.entries(alignment).filter(([, v]) => asStr(v) && asStr(v) !== 'aligned')
    if (misaligned.length) {
      sections.push({
        title: 'Mission Alignment',
        subtitle: 'OKRs that need review against the brand mission',
        listItems: misaligned.map(
          ([k, v]) => `<strong>${esc(humanize(k))}:</strong> ${esc(asStr(v))}`
        ),
      })
    }

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
