// Adapter: competitive-analysis → editorial Section[]
// Input contract: positioning_validation, recommended_adjustments[], executive_summary,
// market_landscape, competitive_matrix[], pricing_comparison[], swot_vs_competitors,
// winning_strategy, key_takeaways.

import type { Section, StatItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asArrOrWrap,
  asObj,
  asStr,
  esc,
  genericSections,
  isPlainObject,
  statusBadge,
  toCards,
  valueToHtml,
} from './generic'

function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  const matrix = asArr(r.competitive_matrix).filter(isPlainObject)
  if (matrix.length) stats.push({ value: String(matrix.length), label: 'Competitors analyzed' })
  const validation = asStr(r.positioning_validation)
  if (validation) {
    const map: Record<string, string> = {
      verified: 'Verified',
      at_risk: 'At risk',
      needs_adjustment: 'Needs adjustment',
    }
    stats.push({ value: map[validation] || validation, label: 'Positioning' })
  }
  const opportunities = asArr(asObj(r.key_takeaways).top_3_opportunities)
  if (opportunities.length) stats.push({ value: String(opportunities.length), label: 'Key opportunities' })

  const section: Section = {
    title: 'Executive Summary',
    navLabel: 'Summary',
    subtitle: 'Competitive landscape and positioning validation',
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

function marketSection(r: Record<string, any>): Section | null {
  const m = asObj(r.market_landscape)
  if (!Object.keys(m).length) return null
  const cards = [
    { title: 'Market Size', body: valueToHtml(m.size) },
    { title: 'Growth', body: valueToHtml(m.growth_rate) },
    { title: 'Segments', body: valueToHtml(m.segments) },
    { title: 'Trends', body: valueToHtml(m.trends) },
  ].filter((c) => c.body)
  // extra keys
  for (const [k, v] of Object.entries(m)) {
    if (!['size', 'growth_rate', 'segments', 'trends'].includes(k)) {
      const body = valueToHtml(v)
      if (body) cards.push({ title: k.replace(/_/g, ' '), body })
    }
  }
  if (!cards.length) return null
  return { title: 'Market Landscape', navLabel: 'Market', cards }
}

function matrixSection(r: Record<string, any>): Section | null {
  const matrix = asArr(r.competitive_matrix).filter(isPlainObject)
  if (!matrix.length) return null
  return {
    title: 'Competitive Matrix',
    navLabel: 'Competitors',
    subtitle: 'Strengths, weaknesses and positioning of each competitor',
    table: {
      headers: ['Competitor', 'Positioning', 'Strengths', 'Weaknesses', 'Pricing', 'Target Customer'],
      rows: matrix.map((c) => [
        `<strong>${esc(asStr(c.name) || 'Competitor')}</strong>`,
        valueToHtml(c.positioning),
        valueToHtml(c.strengths),
        valueToHtml(c.weaknesses),
        valueToHtml(c.pricing_model),
        valueToHtml(c.target_customer),
      ]),
    },
  }
}

function pricingSection(r: Record<string, any>): Section | null {
  const pricing = asArr(r.pricing_comparison).filter(isPlainObject)
  if (!pricing.length) return null
  return {
    title: 'Pricing Comparison',
    navLabel: 'Pricing',
    table: {
      headers: ['Company', 'Price Range', 'Value Proposition'],
      rows: pricing.map((p) => [
        `<strong>${esc(asStr(p.company) || asStr(p.name) || 'Company')}</strong>`,
        valueToHtml(p.price_range),
        valueToHtml(p.value_prop),
      ]),
    },
  }
}

function swotSection(r: Record<string, any>): Section | null {
  const swot = asObj(r.swot_vs_competitors)
  if (!Object.keys(swot).length) return null
  const labels: Record<string, string> = {
    strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    opportunities: 'Opportunities',
    threats: 'Threats',
  }
  const cards = Object.entries(labels)
    .map(([k, label]) => ({ title: label, body: valueToHtml(swot[k]) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'SWOT Analysis',
    navLabel: 'SWOT',
    subtitle: 'Your position against the competitors in the market',
    cards,
  }
}

function strategySection(r: Record<string, any>): Section | null {
  const w = asObj(r.winning_strategy)
  if (!Object.keys(w).length) return null
  const cards = [
    { title: 'Differentiation', body: valueToHtml(w.differentiation) },
    { title: 'Go-To-Market Strategy', body: valueToHtml(w.gtm_strategy) },
    { title: 'Marketing Angles', body: valueToHtml(w.marketing_angles) },
  ].filter((c) => c.body)
  if (!cards.length) {
    const fallback = toCards(w)
    if (!fallback.length) return null
    return { title: 'Winning Strategy', cards: fallback }
  }
  return { title: 'Winning Strategy', navLabel: 'Strategy', cards }
}

function takeawaysSection(r: Record<string, any>): Section | null {
  const t = asObj(r.key_takeaways)
  if (!Object.keys(t).length) return null
  const cards = [
    { title: 'Top 3 Competitors', body: valueToHtml(t.top_3_competitors) },
    { title: 'Top 3 Differentiators', body: valueToHtml(t.top_3_differentiation) },
    { title: 'Top 3 Opportunities', body: valueToHtml(t.top_3_opportunities) },
  ].filter((c) => c.body)
  if (!cards.length) {
    const fallback = toCards(t)
    if (!fallback.length) return null
    return { title: 'Key Takeaways', cards: fallback }
  }
  return { title: 'Key Takeaways', navLabel: 'Takeaways', cards }
}

function adjustmentsSection(r: Record<string, any>): Section | null {
  const adjustments = asArrOrWrap(r.recommended_adjustments)
  if (!adjustments.length) return null
  const validation = asStr(r.positioning_validation)
  return {
    title: 'Recommended Adjustments',
    subtitle: validation ? undefined : 'Recommendations to reinforce the positioning',
    content: validation
      ? `<p><strong>Positioning status:</strong> ${statusBadge(validation)}</p>`
      : undefined,
    listItems: adjustments.map((a) => valueToHtml(a)).filter(Boolean),
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'positioning_validation',
      'recommended_adjustments',
      'executive_summary',
      'market_landscape',
      'competitive_matrix',
      'pricing_comparison',
      'swot_vs_competitors',
      'winning_strategy',
      'key_takeaways',
    ])

    sections.push(overviewSection(r))
    const parts = [
      marketSection(r),
      matrixSection(r),
      pricingSection(r),
      swotSection(r),
      strategySection(r),
      takeawaysSection(r),
      adjustmentsSection(r),
    ]
    for (const s of parts) if (s) sections.push(s)

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
