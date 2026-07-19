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
  ['month_1_foundation', 'Mes 1 — Fundación'],
  ['month_2_growth', 'Mes 2 — Crecimiento'],
  ['month_3_retention', 'Mes 3 — Retención'],
]

function overviewSection(r: Record<string, any>): Section {
  const metrics = asObj(r.metrics)
  const stats: StatItem[] = []
  if (asStr(metrics.target_members)) stats.push({ value: asStr(metrics.target_members), label: 'Miembros objetivo' })
  if (asStr(metrics.monthly_active)) stats.push({ value: asStr(metrics.monthly_active), label: 'Activos mensuales' })
  if (metrics.engagement_rate !== undefined) stats.push({ value: asPct(metrics.engagement_rate), label: 'Engagement' })
  if (metrics.retention_rate !== undefined) stats.push({ value: asPct(metrics.retention_rate), label: 'Retención' })

  const section: Section = {
    title: 'Resumen de Estrategia',
    navLabel: 'Resumen',
    subtitle: 'Blueprint de crecimiento de comunidad a 90 días',
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
    if (asStr(m.focus)) parts.push(`<p><strong>Foco:</strong> ${esc(asStr(m.focus))}</p>`)
    const initiatives = asArr(m.key_initiatives)
    if (initiatives.length) {
      parts.push(`<p style="margin-top:8px;"><strong>Iniciativas clave:</strong></p>${valueToHtml(initiatives)}`)
    } else if (asStr(m.key_initiatives)) {
      parts.push(`<p style="margin-top:8px;"><strong>Iniciativas clave:</strong> ${esc(asStr(m.key_initiatives))}</p>`)
    }
    if (asStr(m.expected_growth)) {
      parts.push(`<p style="margin-top:8px;"><strong>Crecimiento esperado:</strong> ${esc(asStr(m.expected_growth))}</p>`)
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
    title: 'Roadmap 90 Días',
    navLabel: 'Roadmap',
    subtitle: 'Fundación, crecimiento y retención mes a mes',
    phases,
  }
}

function playbookSection(r: Record<string, any>): Section | null {
  const p = asObj(r.engagement_playbook)
  if (!Object.keys(p).length) return null
  const labels: Record<string, string> = {
    daily_check_ins: 'Check-ins Diarios',
    weekly_ama: 'AMA Semanal',
    monthly_workshop: 'Workshop Mensual',
    quarterly_event: 'Evento Trimestral',
  }
  const cards = Object.entries(p)
    .map(([k, v]) => ({ title: labels[k] || humanize(k), body: valueToHtml(v) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Playbook de Engagement',
    navLabel: 'Engagement',
    subtitle: 'Rituales de comunidad por cadencia',
    cards,
  }
}

function influencerSection(r: Record<string, any>): Section | null {
  const inf = asObj(r.influencer_sourcing)
  if (!Object.keys(inf).length) return null
  const labels: Record<string, string> = {
    tier_1_micro: 'Tier 1 — Micro-influencers',
    tier_2_power_users: 'Tier 2 — Power Users',
    tier_3_experts: 'Tier 3 — Expertos',
  }
  const cards = Object.entries(inf)
    .map(([k, v]) => ({ title: labels[k] || humanize(k), body: valueToHtml(v) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Sourcing de Influencers',
    navLabel: 'Influencers',
    cards,
  }
}

function metricsSection(r: Record<string, any>): Section | null {
  const metrics = asObj(r.metrics)
  if (!Object.keys(metrics).length) return null

  const section: Section = {
    title: 'Métricas Objetivo',
    navLabel: 'Métricas',
    subtitle: 'Tasas objetivo de salud de la comunidad',
  }

  // Bar chart with the comparable rates (as percentages)
  const rateKeys: Array<[string, string]> = [
    ['engagement_rate', 'Engagement'],
    ['retention_rate', 'Retención'],
    ['referral_rate', 'Referidos'],
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
    section.chart = { type: 'bar', labels, data, label: 'Tasas objetivo (%)' }
  }

  const rows = Object.entries(metrics)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const isRate = k.includes('rate')
      return [`<strong>${esc(humanize(k))}</strong>`, isRate ? esc(asPct(v)) : valueToHtml(v)]
    })
  if (rows.length) {
    section.table = { headers: ['Métrica', 'Objetivo'], rows }
  }
  if (!section.chart && !section.table) return null
  return section
}

function risksSection(r: Record<string, any>): Section | null {
  const risks = asArr(r.risks_and_mitigations)
  if (!risks.length) {
    const body = valueToHtml(r.risks_and_mitigations)
    return body ? { title: 'Riesgos y Mitigaciones', content: body } : null
  }
  return {
    title: 'Riesgos y Mitigaciones',
    navLabel: 'Riesgos',
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
