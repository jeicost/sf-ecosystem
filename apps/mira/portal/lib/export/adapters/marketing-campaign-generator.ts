// Adapter: marketing-campaign-generator → editorial Section[]
// Input contract: campaign_overview, week_1..week_4 {focus, activities, budget_allocation},
// channel_distribution {canal: {percentage, focus}}, kpis {reach_target, engagement_rate,
// ctr_target, conversion_rate, cac_target}, success_metrics[].

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
  isPlainObject,
  valueToHtml,
} from './generic'

const WEEKS: Array<[string, string]> = [
  ['week_1', 'Semana 1'],
  ['week_2', 'Semana 2'],
  ['week_3', 'Semana 3'],
  ['week_4', 'Semana 4'],
]

function kpiStats(kpis: Record<string, any>): StatItem[] {
  const stats: StatItem[] = []
  const push = (key: string, label: string, pct: boolean) => {
    if (kpis[key] === undefined || kpis[key] === null || kpis[key] === '') return
    const value = pct ? asPct(kpis[key]) : asStr(kpis[key]) || String(asNum(kpis[key]) ?? '')
    if (value) stats.push({ value, label })
  }
  push('reach_target', 'Alcance objetivo', false)
  push('engagement_rate', 'Engagement rate', true)
  push('ctr_target', 'CTR objetivo', true)
  push('conversion_rate', 'Conversión', true)
  push('cac_target', 'CAC objetivo', false)
  // any extra KPI keys
  for (const [k, v] of Object.entries(kpis)) {
    if (['reach_target', 'engagement_rate', 'ctr_target', 'conversion_rate', 'cac_target'].includes(k)) continue
    const value = asStr(v)
    if (value) stats.push({ value, label: humanize(k) })
  }
  return stats
}

function overviewSection(r: Record<string, any>): Section {
  const section: Section = {
    title: 'Resumen de Campaña',
    navLabel: 'Resumen',
    subtitle: 'Campaña de marketing a 30 días',
  }
  if (asStr(r.campaign_overview)) {
    section.content = `<p>${esc(asStr(r.campaign_overview))}</p>`
  } else if (r.campaign_overview !== undefined) {
    const body = valueToHtml(r.campaign_overview)
    if (body) section.content = body
  }
  const stats = kpiStats(asObj(r.kpis))
  if (stats.length) section.stats = stats
  return section
}

function weeklyPlanSection(r: Record<string, any>): Section | null {
  const phases: PhaseItem[] = []
  for (const [key, label] of WEEKS) {
    const w = asObj(r[key])
    if (!Object.keys(w).length) {
      // tolerate a plain string week
      const body = valueToHtml(r[key])
      if (body) phases.push({ title: label, body })
      continue
    }
    const parts: string[] = []
    if (asStr(w.focus)) parts.push(`<p><strong>Foco:</strong> ${esc(asStr(w.focus))}</p>`)
    const activities = asArr(w.activities)
    if (activities.length) {
      parts.push(`<p style="margin-top:8px;"><strong>Actividades:</strong></p>${valueToHtml(activities)}`)
    } else if (asStr(w.activities)) {
      parts.push(`<p style="margin-top:8px;"><strong>Actividades:</strong> ${esc(asStr(w.activities))}</p>`)
    }
    if (asStr(w.budget_allocation)) {
      parts.push(`<p style="margin-top:8px;"><strong>Presupuesto:</strong> ${esc(asStr(w.budget_allocation))}</p>`)
    }
    const body = parts.join('') || valueToHtml(w)
    if (body) {
      phases.push({ title: asStr(w.focus) ? `${label} — ${asStr(w.focus)}` : label, body })
    }
  }
  if (!phases.length) return null
  return {
    title: 'Plan Semanal',
    navLabel: 'Plan 30 días',
    subtitle: 'Ejecución semana a semana durante los 30 días de campaña',
    phases,
  }
}

function channelsSection(r: Record<string, any>): Section | null {
  const dist = asObj(r.channel_distribution)
  const entries = Object.entries(dist)
  if (!entries.length) return null

  const section: Section = {
    title: 'Distribución de Canales',
    navLabel: 'Canales',
    subtitle: 'Reparto de inversión y foco por canal',
  }

  const labels: string[] = []
  const data: number[] = []
  const cards: Array<{ title: string; body: string }> = []
  for (const [channel, raw] of entries) {
    const c = isPlainObject(raw) ? raw : {}
    const pct = asNum(isPlainObject(raw) ? c.percentage : raw)
    if (pct !== null) {
      labels.push(channel)
      data.push(pct)
    }
    const focus = asStr(c.focus) || (typeof raw === 'string' ? raw : '')
    const body =
      (pct !== null ? `<p><strong>${esc(String(pct))}%</strong> del presupuesto</p>` : '') +
      (focus ? `<p style="margin-top:8px;">${esc(focus)}</p>` : '') ||
      valueToHtml(raw)
    if (body) cards.push({ title: channel, body })
  }
  if (labels.length >= 2) {
    section.chart = { type: 'doughnut', labels, data, label: 'Distribución de canales (%)' }
  }
  if (cards.length) section.cards = cards
  if (!section.chart && !section.cards) return null
  return section
}

function successSection(r: Record<string, any>): Section | null {
  const metrics = asArr(r.success_metrics)
  if (!metrics.length) {
    const body = valueToHtml(r.success_metrics)
    return body ? { title: 'Métricas de Éxito', content: body } : null
  }
  return {
    title: 'Métricas de Éxito',
    navLabel: 'Métricas',
    subtitle: 'Cómo mediremos el éxito de la campaña',
    listItems: metrics.map((m) => valueToHtml(m)).filter(Boolean),
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'campaign_overview',
      'kpis',
      'week_1',
      'week_2',
      'week_3',
      'week_4',
      'channel_distribution',
      'success_metrics',
    ])

    sections.push(overviewSection(r))
    const parts = [weeklyPlanSection(r), channelsSection(r), successSection(r)]
    for (const s of parts) if (s) sections.push(s)

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
