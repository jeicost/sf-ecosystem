// Adapter: seo-audit → editorial Section[]
// Input contract (toolkit-prompts.ts): overall_score, overall_trend, scoreLabel,
// statCards[], sections[] (elements | checks | schemas | keywords | assessment),
// actions[], generatedAt.

import type { Section, StatItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asNum,
  asObj,
  asStr,
  esc,
  genericSections,
  isPlainObject,
  sectionForValue,
  statusBadge,
  toCards,
  valueToHtml,
} from './generic'

function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  const score = asNum(r.overall_score)
  if (score !== null) {
    stats.push({ value: `${score}/100`, label: asStr(r.scoreLabel) || 'SEO Health Score' })
  }
  if (asStr(r.overall_trend)) {
    stats.push({ value: asStr(r.overall_trend), label: '90-Day Trend' })
  }

  const statCards = asArr(r.statCards).filter(isPlainObject)
  for (const c of statCards.slice(0, 4)) {
    const value = asStr(c.value)
    const label = asStr(c.label)
    if (value && label) stats.push({ value, label })
  }

  const section: Section = {
    title: 'Executive Summary',
    navLabel: 'Summary',
    subtitle: 'Overall SEO health of the site',
    stats: stats.length ? stats : undefined,
  }

  // Bar chart of the stat card numeric values when comparable
  const chartLabels: string[] = []
  const chartData: number[] = []
  for (const c of statCards) {
    const n = asNum(c.value)
    if (n !== null && asStr(c.label)) {
      chartLabels.push(asStr(c.label))
      chartData.push(n)
    }
  }
  if (chartLabels.length >= 2) {
    section.chart = { type: 'bar', labels: chartLabels, data: chartData, label: 'Key Indicators' }
  }

  // Descriptions as cards below the stats
  const cards = statCards
    .filter((c) => asStr(c.description))
    .map((c) => ({
      title: asStr(c.label) || 'Indicator',
      body: `${statusBadge(c.status)}<p style="margin-top:8px;">${esc(asStr(c.description))}</p>`,
    }))
  if (cards.length) section.cards = cards

  return section
}

function auditSubSection(sec: Record<string, any>): Section | null {
  const title = asStr(sec.title) || 'Section'
  const subtitle = asStr(sec.description) || undefined

  const elements = asArr(sec.elements).filter(isPlainObject)
  if (elements.length) {
    return {
      title,
      subtitle,
      table: {
        headers: ['Element', 'Status', 'Current', 'Recommendation', 'Analysis'],
        rows: elements.map((e) => [
          `<strong>${esc(asStr(e.element) || asStr(e.title))}</strong>`,
          statusBadge(e.status),
          esc(asStr(e.current)),
          esc(asStr(e.recommendation)),
          esc(asStr(e.analysis) || asStr(e.description)),
        ]),
      },
    }
  }

  const checks = asArr(sec.checks).filter(isPlainObject)
  if (checks.length) {
    return {
      title,
      subtitle,
      table: {
        headers: ['Check', 'Status', 'Detail'],
        rows: checks.map((c) => [
          `<strong>${esc(asStr(c.check) || asStr(c.element) || asStr(c.title))}</strong>`,
          statusBadge(c.status),
          esc(asStr(c.description) || asStr(c.analysis)),
        ]),
      },
    }
  }

  const schemas = asArr(sec.schemas).filter(isPlainObject)
  if (schemas.length) {
    return {
      title,
      subtitle,
      cards: schemas.map((s) => ({
        title: asStr(s.name) || 'Schema',
        body:
          statusBadge(s.status) +
          (asStr(s.impact) ? `<p style="margin-top:8px;"><strong>Impact:</strong> ${esc(asStr(s.impact))}</p>` : '') +
          (asStr(s.opportunity)
            ? `<p style="margin-top:8px;"><strong>Opportunity:</strong> ${esc(asStr(s.opportunity))}</p>`
            : ''),
      })),
    }
  }

  const keywords = asArr(sec.keywords).filter(isPlainObject)
  if (keywords.length) {
    return {
      title,
      subtitle,
      table: {
        headers: ['Keyword', 'Volume', 'Intent', 'Priority', 'Current Ranking'],
        rows: keywords.map((k) => [
          `<strong>${esc(asStr(k.keyword))}</strong>`,
          esc(asStr(k.volume)),
          esc(asStr(k.intent)),
          esc(asStr(k.priority)),
          esc(asStr(k.current_rank) || '—'),
        ]),
      },
    }
  }

  const assessment = asArr(sec.assessment).filter(isPlainObject)
  if (assessment.length) {
    return {
      title,
      subtitle,
      table: {
        headers: ['Element', 'Status', 'Detail', 'Recommendation'],
        rows: assessment.map((a) => [
          `<strong>${esc(asStr(a.element) || asStr(a.check))}</strong>`,
          statusBadge(a.status),
          esc(asStr(a.description) || asStr(a.impact)),
          esc(asStr(a.recommendation)),
        ]),
      },
    }
  }

  // Unknown shape — degrade gracefully to cards / generic
  const rest: Record<string, any> = {}
  for (const [k, v] of Object.entries(sec)) {
    if (k !== 'title' && k !== 'description' && k !== 'type' && k !== 'icon') rest[k] = v
  }
  const cards = toCards(rest)
  if (cards.length) return { title, subtitle, cards }
  return null
}

function actionsSection(actions: any[]): Section | null {
  const items = actions.filter(isPlainObject)
  if (!items.length) return null
  return {
    title: 'Action Plan',
    navLabel: 'Actions',
    subtitle: 'Actions prioritized by impact and effort',
    phases: items.map((a, i) => {
      const num = asStr(a.number) || asStr(a.id) || String(i + 1)
      const priority = asStr(a.priority)
      const parts: string[] = []
      if (asStr(a.description)) parts.push(`<p>${esc(asStr(a.description))}</p>`)
      const meta: string[] = []
      if (asStr(a.impact)) meta.push(`<strong>Impact:</strong> ${esc(asStr(a.impact))}`)
      if (asStr(a.effort)) meta.push(`<strong>Effort:</strong> ${esc(asStr(a.effort))}`)
      if (asStr(a.owner)) meta.push(`<strong>Owner:</strong> ${esc(asStr(a.owner))}`)
      if (asStr(a.expected_roi)) meta.push(`<strong>Expected ROI:</strong> ${esc(asStr(a.expected_roi))}`)
      if (meta.length) parts.push(`<p>${meta.join(' · ')}</p>`)
      return {
        title: `${num}. ${asStr(a.title) || 'Action'}${priority ? ` — ${priority}` : ''}`,
        body: parts.join('') || valueToHtml(a),
      }
    }),
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>(['overall_score', 'overall_trend', 'scoreLabel', 'statCards', 'generatedAt'])

    sections.push(overviewSection(r))

    if (Array.isArray(r.sections)) {
      used.add('sections')
      for (const sec of r.sections) {
        if (!isPlainObject(sec)) continue
        try {
          const s = auditSubSection(sec)
          if (s) sections.push(s)
        } catch {
          // skip malformed section
        }
      }
    }

    if (Array.isArray(r.actions)) {
      used.add('actions')
      const s = actionsSection(r.actions)
      if (s) sections.push(s)
    } else if (r.actions !== undefined) {
      used.add('actions')
      const s = sectionForValue('plan_de_accion', r.actions)
      if (s) sections.push({ ...s, title: 'Action Plan' })
    }

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
