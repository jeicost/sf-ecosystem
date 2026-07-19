// Adapter: brandbook-content-system → editorial Section[]
// Input contract: version, reconciliation, brand_story, brand_identity, brand_promise,
// competitive_positioning, target_audience, brand_pillars, brand_voice, visual_identity,
// content_templates, editorial_calendar, channel_playbooks, packaging_collateral,
// crisis_communication, employee_brand, brand_evolution, guidelines_dos_donts,
// living_document_notes (+ source *_id refs). Every block carries a "source" citation.

import type { Section, StatItem } from '../editorial-template'
import type { ToolAdapter } from './types'
import {
  asArr,
  asObj,
  asStr,
  esc,
  genericSections,
  humanize,
  isPlainObject,
  toTable,
  valueToHtml,
} from './generic'

/** Strip citation keys before rendering a block. */
function withoutSource(obj: any): Record<string, any> {
  const o = asObj(obj)
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(o)) {
    if (k === 'source' && typeof v === 'string') continue
    if (k === 'source_id') continue
    out[k] = v
  }
  return out
}

function sourceNote(obj: any): string | undefined {
  const src = asStr(asObj(obj).source)
  return src ? `Fuente: ${humanize(src)}` : undefined
}

function blockSection(title: string, obj: any, navLabel?: string): Section | null {
  const data = withoutSource(obj)
  if (!Object.keys(data).length) return null
  const cards = Object.entries(data)
    .map(([k, v]) => ({ title: humanize(k), body: valueToHtml(v) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return { title, navLabel, subtitle: sourceNote(obj), cards }
}

function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  if (asStr(r.version)) stats.push({ value: asStr(r.version), label: 'Versión del brandbook' })
  const rec = asObj(r.reconciliation)
  const conflicts = asArr(rec.conflicts)
  stats.push({ value: String(conflicts.length), label: 'Conflictos entre fuentes' })
  if (rec.verified === true || rec.verified === false) {
    stats.push({ value: rec.verified ? 'Verificado' : 'Pendiente', label: 'Estado de reconciliación' })
  }
  const pillars = asArr(asObj(r.brand_pillars).pillars ?? r.brand_pillars)
  if (pillars.length) stats.push({ value: String(pillars.length), label: 'Pilares de marca' })

  const section: Section = {
    title: 'Resumen del Brandbook',
    navLabel: 'Resumen',
    subtitle: 'Manual operativo vivo de la marca — consolida todas las fuentes',
    stats,
  }
  if (conflicts.length) {
    section.listItems = conflicts.map((c) => `<strong>Conflicto:</strong> ${valueToHtml(c)}`)
  }
  return section
}

function pillarsSection(r: Record<string, any>): Section | null {
  const block = asObj(r.brand_pillars)
  const pillars = asArr(block.pillars ?? r.brand_pillars).filter(isPlainObject)
  if (!pillars.length) return blockSection('Pilares de Marca', r.brand_pillars, 'Pilares')
  return {
    title: 'Pilares de Marca',
    navLabel: 'Pilares',
    subtitle: sourceNote(block),
    cards: pillars.map((p) => ({
      title: asStr(p.name) || 'Pilar',
      body: valueToHtml(p.description) || valueToHtml(p) || '<p>—</p>',
    })),
  }
}

function voiceSection(r: Record<string, any>): Section | null {
  const v = withoutSource(r.brand_voice)
  if (!Object.keys(v).length) return null
  const cards = [
    { title: 'Tono', body: valueToHtml(v.tone) },
    { title: 'Rasgos', body: valueToHtml(v.traits) },
    { title: 'Ejemplos de Copy Real', body: valueToHtml(v.real_copy_examples) },
    { title: 'Sí Decir', body: valueToHtml(v.do_examples) },
    { title: 'No Decir', body: valueToHtml(v.dont_examples) },
  ].filter((c) => c.body)
  if (!cards.length) return null
  return { title: 'Voz de Marca', navLabel: 'Voz', subtitle: sourceNote(r.brand_voice), cards }
}

function calendarSection(r: Record<string, any>): Section | null {
  const cal = asObj(r.editorial_calendar)
  const rolling = asArr(cal['12_month_rolling'] ?? r.editorial_calendar)
  if (!rolling.length) return null
  if (rolling.every(isPlainObject)) {
    const table = toTable(rolling)
    if (table) {
      return { title: 'Calendario Editorial', navLabel: 'Calendario', subtitle: sourceNote(cal), table }
    }
  }
  return {
    title: 'Calendario Editorial',
    navLabel: 'Calendario',
    subtitle: sourceNote(cal),
    listItems: rolling.map((m) => valueToHtml(m)).filter(Boolean),
  }
}

function dosDontsSection(r: Record<string, any>): Section | null {
  const g = asObj(r.guidelines_dos_donts)
  const dos = asArr(g.do)
  const donts = asArr(g.dont)
  if (!dos.length && !donts.length) return null
  const cards = [
    { title: 'Hacer', body: valueToHtml(dos) },
    { title: 'No Hacer', body: valueToHtml(donts) },
  ].filter((c) => c.body)
  return { title: 'Guías: Qué Hacer y Qué No', navLabel: "Do's & Don'ts", cards }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'brand_briefing_id',
      'content_pack_id',
      'marketing_audit_id',
      'competitive_analysis_id',
      'seo_audit_id',
      'reconciliation',
      'version',
      'brand_pillars',
      'brand_voice',
      'editorial_calendar',
      'guidelines_dos_donts',
    ])

    sections.push(overviewSection(r))

    const push = (key: string | null, s: Section | null) => {
      if (key) used.add(key)
      if (s) sections.push(s)
    }

    push('brand_story', blockSection('Historia de Marca', r.brand_story))
    push('brand_identity', blockSection('Identidad de Marca', r.brand_identity, 'Identidad'))
    push('brand_promise', blockSection('Promesa de Marca', r.brand_promise))
    push('competitive_positioning', blockSection('Posicionamiento Competitivo', r.competitive_positioning, 'Posicionamiento'))
    push('target_audience', blockSection('Audiencia Objetivo', r.target_audience, 'Audiencia'))
    push(null, pillarsSection(r))
    push(null, voiceSection(r))
    push('visual_identity', blockSection('Identidad Visual', r.visual_identity, 'Visual'))
    push('content_templates', blockSection('Plantillas de Contenido', r.content_templates, 'Plantillas'))
    push(null, calendarSection(r))
    push('channel_playbooks', blockSection('Playbooks por Canal', r.channel_playbooks, 'Playbooks'))
    push('packaging_collateral', blockSection('Colaterales y Packaging', r.packaging_collateral))
    push('crisis_communication', blockSection('Comunicación de Crisis', r.crisis_communication, 'Crisis'))
    push('employee_brand', blockSection('Marca Empleadora', r.employee_brand))
    push('brand_evolution', blockSection('Evolución de Marca', r.brand_evolution, 'Evolución'))
    push(null, dosDontsSection(r))
    push('living_document_notes', blockSection('Documento Vivo', r.living_document_notes))

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
