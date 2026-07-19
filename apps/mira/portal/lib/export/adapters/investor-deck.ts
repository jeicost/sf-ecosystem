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
  if (asStr(ask.amount)) stats.push({ value: asStr(ask.amount), label: 'Ronda solicitada' })
  if (asStr(ask.valuation)) stats.push({ value: asStr(ask.valuation), label: 'Valoración' })
  if (asStr(traction.customers_count)) stats.push({ value: asStr(traction.customers_count), label: 'Clientes' })
  if (asStr(traction.revenue_mrr_arr)) stats.push({ value: asStr(traction.revenue_mrr_arr), label: 'Ingresos (MRR/ARR)' })

  const parts: string[] = []
  if (asStr(title.tagline)) parts.push(`<p><strong>${esc(asStr(title.tagline))}</strong></p>`)
  if (asStr(title.mission)) parts.push(`<p>${esc(asStr(title.mission))}</p>`)
  if (asStr(summary.problem_solution_market)) parts.push(`<p>${esc(asStr(summary.problem_solution_market))}</p>`)
  if (asStr(summary.why_now)) parts.push(`<p><strong>Por qué ahora:</strong> ${esc(asStr(summary.why_now))}</p>`)

  return {
    title: 'Resumen Ejecutivo',
    navLabel: 'Resumen',
    subtitle: asStr(title.company) ? `Narrativa de inversión de ${asStr(title.company)}` : 'Narrativa de inversión',
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
    { value: asStr(u.gross_margin), label: 'Margen Bruto' },
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
    title: 'Tracción y Validación',
    navLabel: 'Tracción',
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
  if (asStr(t.growth_trajectory)) parts.push(`<p><strong>Trayectoria de crecimiento:</strong> ${esc(asStr(t.growth_trajectory))}</p>`)
  if (asStr(t.awards_partnerships)) parts.push(`<p><strong>Premios y partnerships:</strong> ${esc(asStr(t.awards_partnerships))}</p>`)
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
    title: 'Testimonios de Clientes',
    cards: items.map((t) => ({
      title: [asStr(t.customer), asStr(t.company)].filter(Boolean).join(' — ') || 'Cliente',
      body: `<p>&ldquo;${esc(asStr(t.quote))}&rdquo;</p>`,
    })),
  }
}

function teamSection(r: Record<string, any>): Section | null {
  const team = asArr(r.team).filter(isPlainObject)
  const advisors = asArr(r.board_and_advisors).filter(isPlainObject)
  if (!team.length && !advisors.length) return null
  const section: Section = { title: 'Equipo', navLabel: 'Equipo' }
  if (team.length) {
    section.table = {
      headers: ['Nombre', 'Rol', 'Background', 'Logros'],
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
    if (!section.subtitle) section.subtitle = 'Equipo fundador, board y advisors'
  }
  return section
}

function risksSection(r: Record<string, any>): Section | null {
  const risks = asArr(r.risks_and_mitigation).filter(isPlainObject)
  if (!risks.length) return null
  return {
    title: 'Riesgos y Mitigación',
    navLabel: 'Riesgos',
    table: {
      headers: ['Riesgo', 'Probabilidad', 'Mitigación'],
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
  const section: Section = { title: 'Roadmap de Producto', navLabel: 'Roadmap' }
  let has = false
  if (milestones.length) {
    section.phases = milestones.map((m, i) => ({
      title: asStr(m.q) || `Hito ${i + 1}`,
      body: valueToHtml(m.milestone) || valueToHtml(m),
    }))
    has = true
  }
  if (asStr(roadmap.how_funding_accelerates)) {
    section.content = `<p><strong>Cómo acelera la financiación:</strong> ${esc(asStr(roadmap.how_funding_accelerates))}</p>`
    has = true
  }
  return has ? section : null
}

function askSection(r: Record<string, any>): Section | null {
  const ask = asObj(r.the_ask)
  if (!Object.keys(ask).length) return null
  const section: Section = {
    title: 'La Inversión',
    navLabel: 'The Ask',
    subtitle: 'Ronda, valoración y uso de los fondos',
  }
  const stats: StatItem[] = [
    { value: asStr(ask.amount), label: 'Importe' },
    { value: asStr(ask.valuation), label: 'Valoración' },
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
    section.chart = { type: 'doughnut', labels, data, label: 'Uso de los fondos (%)' }
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
      objectCardsSection('El Problema', r.the_problem, {
        tam: 'TAM',
        market_segments: 'Segmentos de Mercado',
        pain_points: 'Pain Points',
        incumbent_solutions: 'Soluciones Actuales',
      }, 'Problema')
    )
    push(
      'the_solution',
      objectCardsSection('La Solución', r.the_solution, {
        description: 'Descripción',
        how_it_works: 'Cómo Funciona',
        unique_value_prop: 'Propuesta de Valor Única',
        defensibility: 'Defensibilidad',
      }, 'Solución')
    )
    push(
      'go_to_market',
      objectCardsSection('Go-To-Market', r.go_to_market, {
        acquisition_channels: 'Canales de Adquisición',
        partnerships: 'Partnerships',
        sales_process: 'Proceso de Ventas',
      }, 'GTM')
    )
    push(
      'business_model',
      objectCardsSection('Modelo de Negocio', r.business_model, {
        revenue_streams: 'Líneas de Ingreso',
        pricing_strategy: 'Estrategia de Precios',
        pricing_tiers: 'Tiers de Precio',
      }, 'Modelo')
    )
    push(null, unitEconomicsSection(r))
    push(
      'market_and_competition',
      objectCardsSection('Mercado y Competencia', r.market_and_competition, {
        market_size: 'Tamaño de Mercado',
        growth_rate: 'Crecimiento',
        competitive_landscape: 'Panorama Competitivo',
        differentiation: 'Diferenciación',
      }, 'Mercado')
    )
    push(null, tractionSection(r))
    push(null, testimonialsSection(r))
    push(null, teamSection(r))
    push(
      'financials',
      objectCardsSection('Financieros', r.financials, {
        funding_history: 'Historial de Financiación',
        monthly_burn: 'Burn Mensual',
        '24mo_revenue_projection': 'Proyección de Ingresos 24 Meses',
      }, 'Financieros')
    )
    push(null, risksSection(r))
    push(null, roadmapSection(r))
    push(null, askSection(r))
    push(
      'contact_and_next_steps',
      objectCardsSection('Contacto y Próximos Pasos', r.contact_and_next_steps, {
        contact_email: 'Email de Contacto',
        process_timeline: 'Timeline del Proceso',
        links: 'Enlaces',
      }, 'Contacto')
    )

    // Coherence warnings (only when conflicts were found)
    const conflicts = asArr(r.conflicts)
    if (conflicts.length) {
      sections.push({
        title: 'Coherencia Narrativa',
        subtitle: 'Conflictos detectados entre las fuentes del deck',
        listItems: conflicts.map((c) => valueToHtml(c)).filter(Boolean),
      })
    }

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
