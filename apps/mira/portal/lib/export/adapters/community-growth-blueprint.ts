// Adapter: community-growth-blueprint → editorial Section[]
// Input contract: strategy_summary, month_1_foundation / month_2_growth /
// month_3_retention {theme, focus, key_initiatives, expected_growth},
// engagement_playbook, influencer_sourcing, metrics {target_members,
// engagement_rate, retention_rate, referral_rate, monthly_active},
// risks_and_mitigations[].

import type { Section, StatItem, PhaseItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asNum,
  asObj,
  asPct,
  asStr,
  esc,
  genericSections,
  humanize,
  valueToHtml,
} from './generic'

const MONTHS: Array<[string, string]> = [
  ['month_1_foundation', 'Month 1 — Foundation'],
  ['month_2_growth', 'Month 2 — Growth'],
  ['month_3_retention', 'Month 3 — Retention'],
]

function overviewSection(r: Record<string, any>): Section {
  const metrics = asObj(r.metrics)
  const stats: StatItem[] = []
  if (asStr(metrics.target_members)) stats.push({ value: asStr(metrics.target_members), label: 'Target members' })
  if (asStr(metrics.monthly_active)) stats.push({ value: asStr(metrics.monthly_active), label: 'Monthly active' })
  if (metrics.engagement_rate !== undefined) stats.push({ value: asPct(metrics.engagement_rate), label: 'Engagement' })
  if (metrics.retention_rate !== undefined) stats.push({ value: asPct(metrics.retention_rate), label: 'Retention' })

  const section: Section = {
    title: 'Strategy Summary',
    navLabel: 'Summary',
    subtitle: '90-day community growth blueprint',
    stats: stats.length ? stats : undefined,
  }
  if (asStr(r.strategy_summary)) {
    section.content = `<p>${esc(asStr(r.strategy_summary))}</p>`
  } else {
    const body = valueToHtml(r.strategy_summary)
    if (body) section.content = body
  }
  return section
}

function roadmapSection(r: Record<string, any>): Section | null {
  const phases: PhaseItem[] = []
  for (const [key, fallbackLabel] of MONTHS) {
    const m = asObj(r[key])
    if (!Object.keys(m).length) {
      const body = valueToHtml(r[key])
      if (body) phases.push({ title: fallbackLabel, body })
      continue
    }
    const parts: string[] = []
    if (asStr(m.focus)) parts.push(`<p><strong>Focus:</strong> ${esc(asStr(m.focus))}</p>`)
    const initiatives = asArr(m.key_initiatives)
    if (initiatives.length) {
      parts.push(`<p style="margin-top:8px;"><strong>Key initiatives:</strong></p>${valueToHtml(initiatives)}`)
    } else if (asStr(m.key_initiatives)) {
      parts.push(`<p style="margin-top:8px;"><strong>Key initiatives:</strong> ${esc(asStr(m.key_initiatives))}</p>`)
    }
    if (asStr(m.expected_growth)) {
      parts.push(`<p style="margin-top:8px;"><strong>Expected growth:</strong> ${esc(asStr(m.expected_growth))}</p>`)
    }
    const body = parts.join('') || valueToHtml(m)
    if (body) {
      const theme = asStr(m.theme)
      const monthNum = fallbackLabel.split(' — ')[0]
      phases.push({ title: theme ? `${monthNum} — ${theme}` : fallbackLabel, body })
    }
  }
  if (!phases.length) return null
  return {
    title: '90-Day Roadmap',
    navLabel: 'Roadmap',
    subtitle: 'Foundation, growth and retention month by month',
    phases,
  }
}

function playbookSection(r: Record<string, any>): Section | null {
  const p = asObj(r.engagement_playbook)
  if (!Object.keys(p).length) return null
  const labels: Record<string, string> = {
    daily_check_ins: 'Daily Check-ins',
    weekly_ama: 'Weekly AMA',
    monthly_workshop: 'Monthly Workshop',
    quarterly_event: 'Quarterly Event',
  }
  const cards = Object.entries(p)
    .map(([k, v]) => ({ title: labels[k] || humanize(k), body: valueToHtml(v) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Engagement Playbook',
    navLabel: 'Engagement',
    subtitle: 'Community rituals by cadence',
    cards,
  }
}

function influencerSection(r: Record<string, any>): Section | null {
  const inf = asObj(r.influencer_sourcing)
  if (!Object.keys(inf).length) return null
  const labels: Record<string, string> = {
    tier_1_micro: 'Tier 1 — Micro-influencers',
    tier_2_power_users: 'Tier 2 — Power Users',
    tier_3_experts: 'Tier 3 — Experts',
  }
  const cards = Object.entries(inf)
    .map(([k, v]) => ({ title: labels[k] || humanize(k), body: valueToHtml(v) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Influencer Sourcing',
    navLabel: 'Influencers',
    cards,
  }
}

function metricsSection(r: Record<string, any>): Section | null {
  const metrics = asObj(r.metrics)
  if (!Object.keys(metrics).length) return null

  const section: Section = {
    title: 'Target Metrics',
    navLabel: 'Metrics',
    subtitle: 'Target community health rates',
  }

  // Bar chart with the comparable rates (as percentages)
  const rateKeys: Array<[string, string]> = [
    ['engagement_rate', 'Engagement'],
    ['retention_rate', 'Retention'],
    ['referral_rate', 'Referrals'],
  ]
  const labels: string[] = []
  const data: number[] = []
  for (const [key, label] of rateKeys) {
    const n = asNum(metrics[key])
    if (n !== null) {
      labels.push(label)
      data.push(n > 0 && n <= 1 ? Math.round(n * 100) : n)
    }
  }
  if (labels.length >= 2) {
    section.chart = { type: 'bar', labels, data, label: 'Target rates (%)' }
  }

  const rows = Object.entries(metrics)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const isRate = k.includes('rate')
      return [`<strong>${esc(humanize(k))}</strong>`, isRate ? esc(asPct(v)) : valueToHtml(v)]
    })
  if (rows.length) {
    section.table = { headers: ['Metric', 'Target'], rows }
  }
  if (!section.chart && !section.table) return null
  return section
}

function risksSection(r: Record<string, any>): Section | null {
  const risks = asArr(r.risks_and_mitigations)
  if (!risks.length) {
    const body = valueToHtml(r.risks_and_mitigations)
    return body ? { title: 'Risks & Mitigations', content: body } : null
  }
  return {
    title: 'Risks & Mitigations',
    navLabel: 'Risks',
    listItems: risks.map((item) => valueToHtml(item)).filter(Boolean),
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'strategy_summary',
      'month_1_foundation',
      'month_2_growth',
      'month_3_retention',
      'engagement_playbook',
      'influencer_sourcing',
      'metrics',
      'risks_and_mitigations',
    ])

    sections.push(overviewSection(r))
    const parts = [roadmapSection(r), playbookSection(r), influencerSection(r), metricsSection(r), risksSection(r)]
    for (const s of parts) if (s) sections.push(s)

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
