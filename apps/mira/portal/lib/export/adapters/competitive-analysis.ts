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
  if (matrix.length) stats.push({ value: String(matrix.length), label: 'Competidores analizados' })
  const validation = asStr(r.positioning_validation)
  if (validation) {
    const map: Record<string, string> = {
      verified: 'Verificado',
      at_risk: 'En riesgo',
      needs_adjustment: 'Requiere ajuste',
    }
    stats.push({ value: map[validation] || validation, label: 'Posicionamiento' })
  }
  const opportunities = asArr(asObj(r.key_takeaways).top_3_opportunities)
  if (opportunities.length) stats.push({ value: String(opportunities.length), label: 'Oportunidades clave' })

  const section: Section = {
    title: 'Resumen Ejecutivo',
    navLabel: 'Resumen',
    subtitle: 'Panorama competitivo y validación de posicionamiento',
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
    { title: 'Tamaño de Mercado', body: valueToHtml(m.size) },
    { title: 'Crecimiento', body: valueToHtml(m.growth_rate) },
    { title: 'Segmentos', body: valueToHtml(m.segments) },
    { title: 'Tendencias', body: valueToHtml(m.trends) },
  ].filter((c) => c.body)
  // extra keys
  for (const [k, v] of Object.entries(m)) {
    if (!['size', 'growth_rate', 'segments', 'trends'].includes(k)) {
      const body = valueToHtml(v)
      if (body) cards.push({ title: k.replace(/_/g, ' '), body })
    }
  }
  if (!cards.length) return null
  return { title: 'Panorama de Mercado', navLabel: 'Mercado', cards }
}

function matrixSection(r: Record<string, any>): Section | null {
  const matrix = asArr(r.competitive_matrix).filter(isPlainObject)
  if (!matrix.length) return null
  return {
    title: 'Matriz Competitiva',
    navLabel: 'Competidores',
    subtitle: 'Fortalezas, debilidades y posicionamiento de cada competidor',
    table: {
      headers: ['Competidor', 'Posicionamiento', 'Fortalezas', 'Debilidades', 'Pricing', 'Cliente Objetivo'],
      rows: matrix.map((c) => [
        `<strong>${esc(asStr(c.name) || 'Competidor')}</strong>`,
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
    title: 'Comparativa de Precios',
    navLabel: 'Precios',
    table: {
      headers: ['Empresa', 'Rango de Precio', 'Propuesta de Valor'],
      rows: pricing.map((p) => [
        `<strong>${esc(asStr(p.company) || asStr(p.name) || 'Empresa')}</strong>`,
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
    strengths: 'Fortalezas',
    weaknesses: 'Debilidades',
    opportunities: 'Oportunidades',
    threats: 'Amenazas',
  }
  const cards = Object.entries(labels)
    .map(([k, label]) => ({ title: label, body: valueToHtml(swot[k]) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Análisis SWOT',
    navLabel: 'SWOT',
    subtitle: 'Tu posición frente a los competidores del mercado',
    cards,
  }
}

function strategySection(r: Record<string, any>): Section | null {
  const w = asObj(r.winning_strategy)
  if (!Object.keys(w).length) return null
  const cards = [
    { title: 'Diferenciación', body: valueToHtml(w.differentiation) },
    { title: 'Estrategia Go-To-Market', body: valueToHtml(w.gtm_strategy) },
    { title: 'Ángulos de Marketing', body: valueToHtml(w.marketing_angles) },
  ].filter((c) => c.body)
  if (!cards.length) {
    const fallback = toCards(w)
    if (!fallback.length) return null
    return { title: 'Estrategia Ganadora', cards: fallback }
  }
  return { title: 'Estrategia Ganadora', navLabel: 'Estrategia', cards }
}

function takeawaysSection(r: Record<string, any>): Section | null {
  const t = asObj(r.key_takeaways)
  if (!Object.keys(t).length) return null
  const cards = [
    { title: 'Top 3 Competidores', body: valueToHtml(t.top_3_competitors) },
    { title: 'Top 3 Diferenciadores', body: valueToHtml(t.top_3_differentiation) },
    { title: 'Top 3 Oportunidades', body: valueToHtml(t.top_3_opportunities) },
  ].filter((c) => c.body)
  if (!cards.length) {
    const fallback = toCards(t)
    if (!fallback.length) return null
    return { title: 'Conclusiones Clave', cards: fallback }
  }
  return { title: 'Conclusiones Clave', navLabel: 'Conclusiones', cards }
}

function adjustmentsSection(r: Record<string, any>): Section | null {
  const adjustments = asArrOrWrap(r.recommended_adjustments)
  if (!adjustments.length) return null
  const validation = asStr(r.positioning_validation)
  return {
    title: 'Ajustes Recomendados',
    subtitle: validation ? undefined : 'Recomendaciones para reforzar el posicionamiento',
    content: validation
      ? `<p><strong>Estado del posicionamiento:</strong> ${statusBadge(validation)}</p>`
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
