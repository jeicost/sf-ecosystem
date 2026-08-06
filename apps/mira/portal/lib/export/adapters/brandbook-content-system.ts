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
  return src ? `Source: ${humanize(src)}` : undefined
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
  if (asStr(r.version)) stats.push({ value: asStr(r.version), label: 'Brandbook version' })
  const rec = asObj(r.reconciliation)
  const conflicts = asArr(rec.conflicts)
  stats.push({ value: String(conflicts.length), label: 'Conflicts between sources' })
  if (rec.verified === true || rec.verified === false) {
    stats.push({ value: rec.verified ? 'Verified' : 'Pending', label: 'Reconciliation status' })
  }
  const pillars = asArr(asObj(r.brand_pillars).pillars ?? r.brand_pillars)
  if (pillars.length) stats.push({ value: String(pillars.length), label: 'Brand pillars' })

  const section: Section = {
    title: 'Brandbook Summary',
    navLabel: 'Summary',
    subtitle: 'Living operating manual for the brand — consolidates every source',
    stats,
  }
  if (conflicts.length) {
    section.listItems = conflicts.map((c) => `<strong>Conflict:</strong> ${valueToHtml(c)}`)
  }
  return section
}

function pillarsSection(r: Record<string, any>): Section | null {
  const block = asObj(r.brand_pillars)
  const pillars = asArr(block.pillars ?? r.brand_pillars).filter(isPlainObject)
  if (!pillars.length) return blockSection('Brand Pillars', r.brand_pillars, 'Pillars')
  return {
    title: 'Brand Pillars',
    navLabel: 'Pillars',
    subtitle: sourceNote(block),
    cards: pillars.map((p) => ({
      title: asStr(p.name) || 'Pillar',
      body: valueToHtml(p.description) || valueToHtml(p) || '<p>—</p>',
    })),
  }
}

function voiceSection(r: Record<string, any>): Section | null {
  const v = withoutSource(r.brand_voice)
  if (!Object.keys(v).length) return null
  const cards = [
    { title: 'Tone', body: valueToHtml(v.tone) },
    { title: 'Traits', body: valueToHtml(v.traits) },
    { title: 'Real Copy Examples', body: valueToHtml(v.real_copy_examples) },
    { title: 'Say This', body: valueToHtml(v.do_examples) },
    { title: 'Never Say This', body: valueToHtml(v.dont_examples) },
  ].filter((c) => c.body)
  if (!cards.length) return null
  return { title: 'Brand Voice', navLabel: 'Voice', subtitle: sourceNote(r.brand_voice), cards }
}

function calendarSection(r: Record<string, any>): Section | null {
  const cal = asObj(r.editorial_calendar)
  const rolling = asArr(cal['12_month_rolling'] ?? r.editorial_calendar)
  if (!rolling.length) return null
  if (rolling.every(isPlainObject)) {
    const table = toTable(rolling)
    if (table) {
      return { title: 'Editorial Calendar', navLabel: 'Calendar', subtitle: sourceNote(cal), table }
    }
  }
  return {
    title: 'Editorial Calendar',
    navLabel: 'Calendar',
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
    { title: 'Do', body: valueToHtml(dos) },
    { title: "Don't", body: valueToHtml(donts) },
  ].filter((c) => c.body)
  return { title: "Guidelines: Do's & Don'ts", navLabel: "Do's & Don'ts", cards }
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

    push('brand_story', blockSection('Brand Story', r.brand_story))
    push('brand_identity', blockSection('Brand Identity', r.brand_identity, 'Identity'))
    push('brand_promise', blockSection('Brand Promise', r.brand_promise))
    push('competitive_positioning', blockSection('Competitive Positioning', r.competitive_positioning, 'Positioning'))
    push('target_audience', blockSection('Target Audience', r.target_audience, 'Audience'))
    push(null, pillarsSection(r))
    push(null, voiceSection(r))
    push('visual_identity', blockSection('Visual Identity', r.visual_identity, 'Visual'))
    push('content_templates', blockSection('Content Templates', r.content_templates, 'Templates'))
    push(null, calendarSection(r))
    push('channel_playbooks', blockSection('Channel Playbooks', r.channel_playbooks, 'Playbooks'))
    push('packaging_collateral', blockSection('Collateral & Packaging', r.packaging_collateral))
    push('crisis_communication', blockSection('Crisis Communication', r.crisis_communication, 'Crisis'))
    push('employee_brand', blockSection('Employer Brand', r.employee_brand))
    push('brand_evolution', blockSection('Brand Evolution', r.brand_evolution, 'Evolution'))
    push(null, dosDontsSection(r))
    push('living_document_notes', blockSection('Living Document', r.living_document_notes))

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
