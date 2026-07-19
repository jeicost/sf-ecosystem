// Adapter: brand-briefing → editorial Section[]
// Input contract: brand_story, brand_identity, brand_promise, competitive_positioning,
// target_audience, brand_pillars[], brand_voice, visual_identity, content_strategy,
// customer_journey_touchpoints, brand_values_in_practice[], brand_evolution,
// success_metrics, data_coherence.

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
  sectionForValue,
  toCards,
  toTable,
  valueToHtml,
} from './generic'

function identitySection(r: Record<string, any>): Section | null {
  const id = asObj(r.brand_identity)
  const stats: StatItem[] = []
  const pillars = asArr(r.brand_pillars)
  const values = asArrOrWrap(id.values)
  const personality = asArrOrWrap(id.personality)
  if (pillars.length) stats.push({ value: String(pillars.length), label: 'Pilares de marca' })
  if (values.length) stats.push({ value: String(values.length), label: 'Valores' })
  if (personality.length) stats.push({ value: String(personality.length), label: 'Rasgos de personalidad' })

  const cards = [
    { title: 'Misión', body: valueToHtml(id.mission) },
    { title: 'Visión', body: valueToHtml(id.vision) },
    { title: 'Valores', body: valueToHtml(id.values) },
    { title: 'Personalidad', body: valueToHtml(id.personality) },
  ].filter((c) => c.body)

  if (!stats.length && !cards.length) return null
  return {
    title: 'Identidad de Marca',
    navLabel: 'Identidad',
    subtitle: asStr(id.name) ? `Fuente de verdad de la marca ${asStr(id.name)}` : 'Fuente de verdad de la marca',
    stats: stats.length ? stats : undefined,
    cards: cards.length ? cards : undefined,
  }
}

function simpleCardsSection(title: string, obj: any, labels: Record<string, string>): Section | null {
  const o = asObj(obj)
  const cards = Object.entries(labels)
    .map(([key, label]) => ({ title: label, body: valueToHtml(o[key]) }))
    .filter((c) => c.body)
  // include any extra keys not mapped
  for (const [k, v] of Object.entries(o)) {
    if (!(k in labels)) {
      const body = valueToHtml(v)
      if (body) cards.push({ title: k.replace(/_/g, ' '), body })
    }
  }
  if (!cards.length) return null
  return { title, cards }
}

function audienceSection(r: Record<string, any>): Section | null {
  const ta = asObj(r.target_audience)
  const section: Section = {
    title: 'Audiencia Objetivo',
    navLabel: 'Audiencia',
  }
  let has = false
  if (asStr(ta.description)) {
    section.content = `<p>${esc(asStr(ta.description))}</p>`
    has = true
  }
  const personas = asArr(ta.personas).filter(isPlainObject)
  if (personas.length) {
    section.table = {
      headers: ['Persona', 'Comportamiento', 'Pain Points'],
      rows: personas.map((p) => [
        `<strong>${esc(asStr(p.name) || 'Persona')}</strong>`,
        valueToHtml(p.behavior),
        valueToHtml(p.pain_points),
      ]),
    }
    has = true
  } else if (isPlainObject(ta) && Object.keys(ta).length && !has) {
    const cards = toCards(ta)
    if (cards.length) {
      section.cards = cards
      has = true
    }
  }
  return has ? section : null
}

function pillarsSection(r: Record<string, any>): Section | null {
  const pillars = asArr(r.brand_pillars).filter(isPlainObject)
  if (!pillars.length) {
    const s = sectionForValue('brand_pillars', r.brand_pillars)
    return s ? { ...s, title: 'Pilares de Marca' } : null
  }
  return {
    title: 'Pilares de Marca',
    navLabel: 'Pilares',
    subtitle: 'Los pilares canónicos que usarán todos los demás toolkits',
    cards: pillars.map((p) => ({
      title: asStr(p.name) || 'Pilar',
      body:
        (asStr(p.description) ? `<p>${esc(asStr(p.description))}</p>` : '') +
        (asArr(p.examples).length
          ? `<p style="margin-top:8px;"><strong>Ejemplos:</strong></p>${valueToHtml(p.examples)}`
          : ''),
    })),
  }
}

function voiceSection(r: Record<string, any>): Section | null {
  const v = asObj(r.brand_voice)
  if (!Object.keys(v).length) return null
  const cards = [
    { title: 'Tono', body: valueToHtml(v.tone) },
    { title: 'Rasgos', body: valueToHtml(v.traits) },
    { title: 'Mensajes Clave', body: valueToHtml(v.messaging) },
    {
      title: 'Sí Decir',
      body: asArrOrWrap(v.do_examples).length ? valueToHtml(v.do_examples) : '',
    },
    {
      title: 'No Decir',
      body: asArrOrWrap(v.dont_examples).length ? valueToHtml(v.dont_examples) : '',
    },
  ].filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Voz de Marca',
    navLabel: 'Voz',
    subtitle: 'Estándar de tono y mensajería para todo el contenido',
    cards,
  }
}

function visualSection(r: Record<string, any>): Section | null {
  const vi = asObj(r.visual_identity)
  if (!Object.keys(vi).length) return null
  const section: Section = { title: 'Identidad Visual', navLabel: 'Visual' }
  let has = false

  const colors = asArr(vi.colors).filter(isPlainObject)
  if (colors.length) {
    section.table = {
      headers: ['Color', 'Hex', 'Uso'],
      rows: colors.map((c) => {
        const hex = asStr(c.hex)
        const swatch = /^#?[0-9a-fA-F]{3,8}$/.test(hex.replace('#', ''))
          ? `<span style="display:inline-block;width:12px;height:12px;background:${esc(hex.startsWith('#') ? hex : `#${hex}`)};margin-right:8px;vertical-align:middle;"></span>`
          : ''
        return [`<strong>${esc(asStr(c.name) || 'Color')}</strong>`, `${swatch}${esc(hex)}`, valueToHtml(c.usage)]
      }),
    }
    has = true
  }

  const cards = [
    { title: 'Tipografía', body: valueToHtml(vi.typography) },
    { title: 'Estilo de Imagen', body: valueToHtml(vi.imagery_style) },
  ].filter((c) => c.body)
  if (cards.length) {
    section.cards = cards
    has = true
  }
  return has ? section : null
}

function journeySection(r: Record<string, any>): Section | null {
  const cj = asObj(r.customer_journey_touchpoints)
  const labels: Record<string, string> = {
    awareness: 'Awareness',
    consideration: 'Consideración',
    decision: 'Decisión',
    loyalty: 'Fidelización',
  }
  const cards = Object.entries(cj)
    .map(([k, v]) => ({ title: labels[k] || k.replace(/_/g, ' '), body: valueToHtml(v) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Customer Journey',
    navLabel: 'Journey',
    subtitle: 'Touchpoints por etapa del recorrido del cliente',
    cards,
  }
}

function metricsSection(r: Record<string, any>): Section | null {
  const sm = asObj(r.success_metrics)
  if (!Object.keys(sm).length) return null
  const section: Section = { title: 'Métricas de Éxito', navLabel: 'Métricas' }
  let has = false
  const kpis = asArr(sm.kpis).filter(isPlainObject)
  if (kpis.length) {
    section.table = {
      headers: ['KPI', 'Objetivo', 'Tracking'],
      rows: kpis.map((k) => [
        `<strong>${esc(asStr(k.name) || asStr(k.metric) || 'KPI')}</strong>`,
        valueToHtml(k.target),
        valueToHtml(k.tracking),
      ]),
    }
    has = true
  }
  if (asStr(sm.health_dashboard)) {
    section.content = `<p><strong>Dashboard de salud:</strong> ${esc(asStr(sm.health_dashboard))}</p>`
    has = true
  }
  return has ? section : null
}

function coherenceSection(r: Record<string, any>): Section | null {
  const dc = asObj(r.data_coherence)
  const warnings = asArr(dc.warnings)
  if (!Object.keys(dc).length) return null
  if (!warnings.length && dc.conflicts_detected !== true) return null
  return {
    title: 'Coherencia de Datos',
    subtitle: 'Advertencias detectadas durante la generación del briefing',
    listItems: warnings.length
      ? warnings.map((w) => valueToHtml(w)).filter(Boolean)
      : ['<strong>Atención:</strong> se han detectado posibles conflictos en los datos de marca.'],
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>()

    const push = (key: string | string[], s: Section | null) => {
      const keys = Array.isArray(key) ? key : [key]
      keys.forEach((k) => used.add(k))
      if (s) sections.push(s)
    }

    push(['brand_identity', 'brand_pillars'], identitySection(r))
    push(
      'brand_story',
      simpleCardsSection('Historia de Marca', r.brand_story, {
        founding: 'Fundación',
        origin_narrative: 'Narrativa de Origen',
        why_exists: 'Por Qué Existe',
      })
    )
    push(
      'brand_promise',
      simpleCardsSection('Promesa de Marca', r.brand_promise, {
        covenant: 'Compromiso',
        customer_expectation: 'Expectativa del Cliente',
        guarantee: 'Garantía',
      })
    )
    push(
      'competitive_positioning',
      simpleCardsSection('Posicionamiento Competitivo', r.competitive_positioning, {
        vs_alternatives: 'Frente a Alternativas',
        unique_advantage: 'Ventaja Única',
      })
    )
    push('target_audience', audienceSection(r))
    push('brand_pillars', pillarsSection(r))
    push('brand_voice', voiceSection(r))
    push('visual_identity', visualSection(r))
    push('content_strategy', (() => {
      const s = sectionForValue('content_strategy', r.content_strategy)
      return s ? { ...s, title: 'Estrategia de Contenido' } : null
    })())
    push('customer_journey_touchpoints', journeySection(r))
    push('brand_values_in_practice', (() => {
      const items = asArr(r.brand_values_in_practice).filter(isPlainObject)
      if (!items.length) return null
      const table = toTable(items)
      return table ? { title: 'Valores en Práctica', table } : null
    })())
    push(
      'brand_evolution',
      simpleCardsSection('Evolución de Marca', r.brand_evolution, {
        '2_year_roadmap': 'Roadmap a 2 Años',
        potential_expansions: 'Expansiones Potenciales',
      })
    )
    push('success_metrics', metricsSection(r))
    push('data_coherence', coherenceSection(r))

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
