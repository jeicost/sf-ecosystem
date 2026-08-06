// Adapter: investor-deck → editorial Section[]
// Input contract: title_slide, executive_summary, the_problem, the_solution,
// go_to_market, business_model, unit_economics, market_and_competition,
// traction_and_validation, customer_testimonials[], team[], board_and_advisors[],
// financials, risks_and_mitigation[], product_roadmap, the_ask,
// contact_and_next_steps, narrative_coherence, conflicts[] (+ source *_id refs).

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
  toCards,
  toTable,
  valueToHtml,
} from './generic'

function overviewSection(r: Record<string, any>): Section {
  const title = asObj(r.title_slide)
  const summary = asObj(r.executive_summary)
  const ask = asObj(r.the_ask)
  const traction = asObj(r.traction_and_validation)

  const stats: StatItem[] = []
  if (asStr(ask.amount)) stats.push({ value: asStr(ask.amount), label: 'Round requested' })
  if (asStr(ask.valuation)) stats.push({ value: asStr(ask.valuation), label: 'Valuation' })
  if (asStr(traction.customers_count)) stats.push({ value: asStr(traction.customers_count), label: 'Customers' })
  if (asStr(traction.revenue_mrr_arr)) stats.push({ value: asStr(traction.revenue_mrr_arr), label: 'Revenue (MRR/ARR)' })

  const parts: string[] = []
  if (asStr(title.tagline)) parts.push(`<p><strong>${esc(asStr(title.tagline))}</strong></p>`)
  if (asStr(title.mission)) parts.push(`<p>${esc(asStr(title.mission))}</p>`)
  if (asStr(summary.problem_solution_market)) parts.push(`<p>${esc(asStr(summary.problem_solution_market))}</p>`)
  if (asStr(summary.why_now)) parts.push(`<p><strong>Why now:</strong> ${esc(asStr(summary.why_now))}</p>`)

  return {
    title: 'Executive Summary',
    navLabel: 'Summary',
    subtitle: asStr(title.company) ? `Investment narrative for ${asStr(title.company)}` : 'Investment narrative',
    stats: stats.length ? stats : undefined,
    content: parts.length ? parts.join('') : undefined,
  }
}

function objectCardsSection(
  title: string,
  obj: any,
  labels: Record<string, string>,
  navLabel?: string,
  subtitle?: string
): Section | null {
  const o = asObj(obj)
  if (!Object.keys(o).length) return null
  const cards = Object.entries(labels)
    .map(([k, label]) => ({ title: label, body: valueToHtml(o[k]) }))
    .filter((c) => c.body)
  for (const [k, v] of Object.entries(o)) {
    if (!(k in labels)) {
      const body = valueToHtml(v)
      if (body) cards.push({ title: k.replace(/_/g, ' '), body })
    }
  }
  if (!cards.length) return null
  return { title, navLabel, subtitle, cards }
}

function unitEconomicsSection(r: Record<string, any>): Section | null {
  const u = asObj(r.unit_economics)
  if (!Object.keys(u).length) return null
  const stats: StatItem[] = [
    { value: asStr(u.cac), label: 'CAC' },
    { value: asStr(u.ltv), label: 'LTV' },
    { value: asStr(u.payback_period), label: 'Payback' },
    { value: asStr(u.gross_margin), label: 'Gross Margin' },
  ].filter((s) => s.value)
  if (!stats.length) {
    const cards = toCards(u)
    return cards.length ? { title: 'Unit Economics', cards } : null
  }
  return { title: 'Unit Economics', navLabel: 'Unit Economics', stats }
}

function tractionSection(r: Record<string, any>): Section | null {
  const t = asObj(r.traction_and_validation)
  if (!Object.keys(t).length) return null
  const section: Section = {
    title: 'Traction & Validation',
    navLabel: 'Traction',
  }
  let has = false

  const metrics = asArr(t.key_metrics)
  if (metrics.length) {
    if (metrics.every(isPlainObject)) {
      const table = toTable(metrics)
      if (table) {
        section.table = table
        has = true
      }
    } else {
      section.listItems = metrics.map((m) => valueToHtml(m)).filter(Boolean)
      has = true
    }
  }

  const parts: string[] = []
  if (asStr(t.growth_trajectory)) parts.push(`<p><strong>Growth trajectory:</strong> ${esc(asStr(t.growth_trajectory))}</p>`)
  if (asStr(t.awards_partnerships)) parts.push(`<p><strong>Awards & partnerships:</strong> ${esc(asStr(t.awards_partnerships))}</p>`)
  if (parts.length) {
    section.content = parts.join('')
    has = true
  }
  return has ? section : null
}

function testimonialsSection(r: Record<string, any>): Section | null {
  const items = asArr(r.customer_testimonials).filter(isPlainObject)
  if (!items.length) return null
  return {
    title: 'Customer Testimonials',
    cards: items.map((t) => ({
      title: [asStr(t.customer), asStr(t.company)].filter(Boolean).join(' — ') || 'Customer',
      body: `<p>&ldquo;${esc(asStr(t.quote))}&rdquo;</p>`,
    })),
  }
}

function teamSection(r: Record<string, any>): Section | null {
  const team = asArr(r.team).filter(isPlainObject)
  const advisors = asArr(r.board_and_advisors).filter(isPlainObject)
  if (!team.length && !advisors.length) return null
  const section: Section = { title: 'Team', navLabel: 'Team' }
  if (team.length) {
    section.table = {
      headers: ['Name', 'Role', 'Background', 'Wins'],
      rows: team.map((m) => [
        `<strong>${esc(asStr(m.name))}</strong>`,
        valueToHtml(m.role),
        valueToHtml(m.background),
        valueToHtml(m.wins),
      ]),
    }
  }
  if (advisors.length) {
    section.cards = advisors.map((a) => ({
      title: asStr(a.name) || 'Advisor',
      body: valueToHtml(a.background) || '<p>—</p>',
    }))
    if (!section.subtitle) section.subtitle = 'Founding team, board and advisors'
  }
  return section
}

function risksSection(r: Record<string, any>): Section | null {
  const risks = asArr(r.risks_and_mitigation).filter(isPlainObject)
  if (!risks.length) return null
  return {
    title: 'Risks & Mitigation',
    navLabel: 'Risks',
    table: {
      headers: ['Risk', 'Probability', 'Mitigation'],
      rows: risks.map((k) => [
        `<strong>${esc(asStr(k.risk))}</strong>`,
        valueToHtml(k.probability),
        valueToHtml(k.mitigation),
      ]),
    },
  }
}

function roadmapSection(r: Record<string, any>): Section | null {
  const roadmap = asObj(r.product_roadmap)
  if (!Object.keys(roadmap).length) return null
  const milestones = asArr(roadmap.next_12_months).filter(isPlainObject)
  const section: Section = { title: 'Product Roadmap', navLabel: 'Roadmap' }
  let has = false
  if (milestones.length) {
    section.phases = milestones.map((m, i) => ({
      title: asStr(m.q) || `Milestone ${i + 1}`,
      body: valueToHtml(m.milestone) || valueToHtml(m),
    }))
    has = true
  }
  if (asStr(roadmap.how_funding_accelerates)) {
    section.content = `<p><strong>How the funding accelerates:</strong> ${esc(asStr(roadmap.how_funding_accelerates))}</p>`
    has = true
  }
  return has ? section : null
}

function askSection(r: Record<string, any>): Section | null {
  const ask = asObj(r.the_ask)
  if (!Object.keys(ask).length) return null
  const section: Section = {
    title: 'The Ask',
    navLabel: 'The Ask',
    subtitle: 'Round, valuation and use of funds',
  }
  const stats: StatItem[] = [
    { value: asStr(ask.amount), label: 'Amount' },
    { value: asStr(ask.valuation), label: 'Valuation' },
    { value: asStr(ask.post_money), label: 'Post-Money' },
  ].filter((s) => s.value)
  if (stats.length) section.stats = stats

  // Doughnut chart with use of funds percentages
  const funds = asArr(ask.use_of_funds_breakdown).filter(isPlainObject)
  const labels: string[] = []
  const data: number[] = []
  for (const f of funds) {
    const pct = asNum(f.percentage)
    if (pct !== null && asStr(f.category)) {
      labels.push(asStr(f.category))
      data.push(pct)
    }
  }
  if (labels.length >= 2) {
    section.chart = { type: 'doughnut', labels, data, label: 'Use of funds (%)' }
  } else if (funds.length) {
    const table = toTable(funds)
    if (table) section.table = table
  }

  const milestones = asArr(ask.expected_milestones)
  if (milestones.length) {
    section.listItems = milestones.map((m) => valueToHtml(m)).filter(Boolean)
  }
  return section
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'brand_briefing_id',
      'competitive_analysis_id',
      'action_plan_id',
      'marketing_audit_id',
      'seo_audit_id',
      'narrative_coherence',
      'conflicts',
      'title_slide',
      'executive_summary',
      'unit_economics',
      'traction_and_validation',
      'customer_testimonials',
      'team',
      'board_and_advisors',
      'risks_and_mitigation',
      'product_roadmap',
      'the_ask',
    ])

    sections.push(overviewSection(r))

    const push = (key: string | null, s: Section | null) => {
      if (key) used.add(key)
      if (s) sections.push(s)
    }

    push(
      'the_problem',
      objectCardsSection('The Problem', r.the_problem, {
        tam: 'TAM',
        market_segments: 'Market Segments',
        pain_points: 'Pain Points',
        incumbent_solutions: 'Incumbent Solutions',
      }, 'Problem')
    )
    push(
      'the_solution',
      objectCardsSection('The Solution', r.the_solution, {
        description: 'Description',
        how_it_works: 'How It Works',
        unique_value_prop: 'Unique Value Proposition',
        defensibility: 'Defensibility',
      }, 'Solution')
    )
    push(
      'go_to_market',
      objectCardsSection('Go-To-Market', r.go_to_market, {
        acquisition_channels: 'Acquisition Channels',
        partnerships: 'Partnerships',
        sales_process: 'Sales Process',
      }, 'GTM')
    )
    push(
      'business_model',
      objectCardsSection('Business Model', r.business_model, {
        revenue_streams: 'Revenue Streams',
        pricing_strategy: 'Pricing Strategy',
        pricing_tiers: 'Pricing Tiers',
      }, 'Model')
    )
    push(null, unitEconomicsSection(r))
    push(
      'market_and_competition',
      objectCardsSection('Market & Competition', r.market_and_competition, {
        market_size: 'Market Size',
        growth_rate: 'Growth',
        competitive_landscape: 'Competitive Landscape',
        differentiation: 'Differentiation',
      }, 'Market')
    )
    push(null, tractionSection(r))
    push(null, testimonialsSection(r))
    push(null, teamSection(r))
    push(
      'financials',
      objectCardsSection('Financials', r.financials, {
        funding_history: 'Funding History',
        monthly_burn: 'Monthly Burn',
        '24mo_revenue_projection': '24-Month Revenue Projection',
      }, 'Financials')
    )
    push(null, risksSection(r))
    push(null, roadmapSection(r))
    push(null, askSection(r))
    push(
      'contact_and_next_steps',
      objectCardsSection('Contact & Next Steps', r.contact_and_next_steps, {
        contact_email: 'Contact Email',
        process_timeline: 'Process Timeline',
        links: 'Links',
      }, 'Contact')
    )

    // Coherence warnings (only when conflicts were found)
    const conflicts = asArr(r.conflicts)
    if (conflicts.length) {
      sections.push({
        title: 'Narrative Coherence',
        subtitle: 'Conflicts detected across the deck sources',
        listItems: conflicts.map((c) => valueToHtml(c)).filter(Boolean),
      })
    }

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
