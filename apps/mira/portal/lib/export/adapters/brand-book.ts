// Adapter: brand-book → editorial Section[]
// Input contract (F3 Business Reports): meta, written_summary_md, story,
// mission_vision_promise, tone_of_voice, logo, colors (palette con rgb/cmyk
// deterministas post-parse), typography, imagery, applications,
// voice_series_governance, consistency_findings, voice_guide_onepager,
// open_items, data_gaps. Modo audit: solo meta/summary/findings/open/gaps.
// Defensivo siempre: nunca lanza.

import type { Section, StatItem, CardItem, TableData } from '../editorial-template'
import type { ToolAdapter } from './types'
import { asArr, asObj, asStr, esc, genericSections, valueToHtml } from './generic'

const SEVERITY_ORDER: Record<string, number> = { alta: 0, media: 1, baja: 2 }

function ruleLine(rule: string, why: string): string {
  return `<strong>${esc(rule)}</strong>${why ? ` <span style="opacity:.75">— ${esc(why)}</span>` : ''}`
}

function statusTag(status: string): string {
  if (status === 'ALREADY_RUNNING') return ' <em>(already running)</em>'
  if (status === 'PROPOSED') return ' <em>(proposed)</em>'
  return ''
}

function overviewSection(r: Record<string, any>): Section {
  const meta = asObj(r.meta)
  const stats: StatItem[] = []
  if (asStr(meta.version)) stats.push({ value: asStr(meta.version), label: 'Version' })
  const findings = asArr(r.consistency_findings)
  stats.push({ value: String(findings.length), label: 'Consistency findings' })
  const open = asArr(r.open_items)
  stats.push({ value: String(open.length), label: 'Open items' })
  const palette = asArr(asObj(r.colors).palette)
  if (palette.length) stats.push({ value: String(palette.length), label: 'Colors in palette' })

  const section: Section = {
    title: asStr(meta.brand) ? `Brand Book — ${asStr(meta.brand)}` : 'Brand Book',
    navLabel: 'Summary',
    subtitle: asStr(meta.one_line_essence) || undefined,
    stats,
  }
  const md = asStr(r.written_summary_md)
  if (md) {
    section.content = md
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`)
      .join('')
  }
  return section
}

function storySection(r: Record<string, any>): Section | null {
  const s = asObj(r.story)
  const mvp = asObj(r.mission_vision_promise)
  const cards: CardItem[] = []
  if (asStr(s.origin)) cards.push({ title: 'Origin', body: esc(asStr(s.origin)) })
  if (asStr(s.why_exists)) cards.push({ title: 'Why it exists', body: esc(asStr(s.why_exists)) })
  if (asStr(s.signature_ritual)) cards.push({ title: 'Signature ritual', body: esc(asStr(s.signature_ritual)) })
  if (asStr(mvp.mission)) cards.push({ title: 'Mission', body: esc(asStr(mvp.mission)) })
  if (asStr(mvp.vision)) cards.push({ title: 'Vision', body: esc(asStr(mvp.vision)) })
  if (asStr(mvp.promise)) cards.push({ title: 'Promise', body: esc(asStr(mvp.promise)) })
  if (!cards.length) return null
  return { title: 'Story & Promise', navLabel: 'Story', cards }
}

function voiceSection(r: Record<string, any>): Section | null {
  const v = asObj(r.tone_of_voice)
  const items: string[] = []
  for (const p of asArr(v.principles)) {
    const o = asObj(p)
    if (!asStr(o.principle)) continue
    let line = ruleLine(asStr(o.principle), asStr(o.why))
    if (asStr(o.avoid)) line += `<br/><span style="opacity:.6">Avoid: ${esc(asStr(o.avoid))}</span>`
    items.push(line)
  }
  if (!items.length && !asStr(v.golden_rule)) return null
  const section: Section = {
    title: 'Tone of Voice',
    navLabel: 'Voice',
    subtitle: asStr(v.golden_rule) ? `Golden rule: ${asStr(v.golden_rule)}` : undefined,
    listItems: items,
  }
  const extra: string[] = []
  if (asStr(v.sound_like)) extra.push(`<p><strong>We sound like:</strong> ${esc(asStr(v.sound_like))}</p>`)
  if (asStr(v.never_sound_like)) extra.push(`<p><strong>We never sound like:</strong> ${esc(asStr(v.never_sound_like))}</p>`)
  if (extra.length) section.content = extra.join('')
  return section
}

function voiceGuideSection(r: Record<string, any>): Section | null {
  const g = asObj(r.voice_guide_onepager)
  const dos = asArr(g.dos).filter((d) => asStr(asObj(d).phrase))
  const donts = asArr(g.donts).filter((d) => asStr(asObj(d).phrase))
  if (!dos.length && !donts.length) return null
  const cards: CardItem[] = []
  if (dos.length) {
    cards.push({
      title: '✅ We say',
      body: dos.map((d) => ruleLine(asStr(asObj(d).phrase), asStr(asObj(d).why))).join('<br/>'),
    })
  }
  if (donts.length) {
    cards.push({
      title: '🚫 We never say',
      body: donts.map((d) => ruleLine(asStr(asObj(d).phrase), asStr(asObj(d).why))).join('<br/>'),
    })
  }
  const rw = asObj(g.example_rewrite)
  if (asStr(rw.before) && asStr(rw.after)) {
    cards.push({
      title: '✍️ Example rewrite',
      body: `<p><span style="opacity:.6">Before:</span> ${esc(asStr(rw.before))}</p><p><strong>After:</strong> ${esc(asStr(rw.after))}</p>${asStr(rw.why) ? `<p style="opacity:.75">${esc(asStr(rw.why))}</p>` : ''}`,
    })
  }
  return {
    title: 'Voice Guide — One Pager',
    navLabel: 'Voice Guide',
    subtitle: asStr(g.golden_rule) || undefined,
    cards,
  }
}

function colorsSection(r: Record<string, any>): Section | null {
  const c = asObj(r.colors)
  const palette = asArr(c.palette).filter((p) => asStr(asObj(p).name) || asStr(asObj(p).hex))
  if (!palette.length) return null
  const table: TableData = {
    headers: ['', 'Color', 'HEX', 'RGB', 'CMYK', 'Role', 'Usage'],
    rows: palette.map((p) => {
      const o = asObj(p)
      const hex = asStr(o.hex)
      const swatch = hex
        ? `<span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:${esc(hex)};border:1px solid rgba(128,128,128,.4)"></span>`
        : ''
      return [
        swatch,
        `${esc(asStr(o.name))}${statusTag(asStr(o.status))}`,
        esc(hex),
        esc(asStr(o.rgb_css)),
        esc(asStr(o.cmyk_label)),
        esc(asStr(o.role)),
        esc([asStr(o.usage), asStr(o.prevents) ? `Avoid: ${asStr(o.prevents)}` : ''].filter(Boolean).join(' · ')),
      ]
    }),
  }
  const section: Section = { title: 'Color', navLabel: 'Color', table }
  const avoid = asArr(c.combinations_to_avoid).map((x) => esc(asStr(x) || JSON.stringify(x))).filter(Boolean)
  if (avoid.length) section.content = `<p><strong>Combinations to avoid:</strong> ${avoid.join(' · ')}</p>`
  return section
}

function logoSection(r: Record<string, any>): Section | null {
  const l = asObj(r.logo)
  const items = asArr(l.usage_rules)
    .map((u) => asObj(u))
    .filter((u) => asStr(u.rule))
    .map((u) => ruleLine(asStr(u.rule), asStr(u.prevents) ? `avoids: ${asStr(u.prevents)}` : ''))
  const misuse = asArr(l.misuse).map((m) => asStr(m)).filter(Boolean)
  if (!items.length && !misuse.length) return null
  const section: Section = { title: 'Logo', navLabel: 'Logo', listItems: items }
  const extra: string[] = []
  if (asStr(l.clearspace)) extra.push(`<p><strong>Clearspace:</strong> ${esc(asStr(l.clearspace))}</p>`)
  if (asStr(l.min_size)) extra.push(`<p><strong>Minimum size:</strong> ${esc(asStr(l.min_size))}</p>`)
  if (asStr(l.background_rules)) extra.push(`<p><strong>Backgrounds:</strong> ${esc(asStr(l.background_rules))}</p>`)
  if (misuse.length) extra.push(`<p><strong>Misuse:</strong> ${misuse.map(esc).join(' · ')}</p>`)
  if (extra.length) section.content = extra.join('')
  return section
}

function typographySection(r: Record<string, any>): Section | null {
  const t = asObj(r.typography)
  const cards: CardItem[] = []
  for (const key of ['primary', 'secondary'] as const) {
    const f = asObj(t[key])
    if (!asStr(f.family)) continue
    cards.push({
      title: key === 'primary' ? 'Primary typeface' : 'Secondary typeface',
      body: `<strong>${esc(asStr(f.family))}</strong>${statusTag(asStr(f.status))}${asStr(f.usage) ? `<br/>${esc(asStr(f.usage))}` : ''}`,
    })
  }
  if (asStr(t.qa_safe_fallback)) {
    cards.push({ title: 'QA-safe fallback', body: esc(asStr(t.qa_safe_fallback)) })
  }
  const hierarchy = asArr(t.hierarchy)
    .map((h) => asObj(h))
    .filter((h) => asStr(h.level))
  const section: Section = { title: 'Typography', navLabel: 'Typography', cards }
  if (hierarchy.length) {
    section.table = {
      headers: ['Level', 'Specification'],
      rows: hierarchy.map((h) => [esc(asStr(h.level)), esc(asStr(h.spec))]),
    }
  }
  if (!cards.length && !hierarchy.length) return null
  return section
}

function imagerySection(r: Record<string, any>): Section | null {
  const im = asObj(r.imagery)
  const dos = asArr(im.dos).map((d) => asObj(d)).filter((d) => asStr(d.rule))
  const donts = asArr(im.donts).map((d) => asObj(d)).filter((d) => asStr(d.rule))
  if (!asStr(im.style) && !dos.length && !donts.length) return null
  const cards: CardItem[] = []
  if (dos.length) cards.push({ title: '✅ Do', body: dos.map((d) => ruleLine(asStr(d.rule), asStr(d.why))).join('<br/>') })
  if (donts.length) cards.push({ title: "🚫 Don't", body: donts.map((d) => ruleLine(asStr(d.rule), asStr(d.why))).join('<br/>') })
  return { title: 'Imagery & Photography', navLabel: 'Imagery', subtitle: asStr(im.style) || undefined, cards }
}

function applicationsSection(r: Record<string, any>): Section | null {
  const apps = asArr(r.applications).map((a) => asObj(a)).filter((a) => asStr(a.surface))
  if (!apps.length) return null
  return {
    title: 'Applications',
    navLabel: 'Applications',
    cards: apps.map((a) => ({
      title: asStr(a.surface),
      body: asArr(a.rules).map((x) => esc(asStr(x))).filter(Boolean).join('<br/>') || valueToHtml(a.rules),
    })),
  }
}

function governanceSection(r: Record<string, any>): Section | null {
  const g = asObj(r.voice_series_governance)
  const series = asArr(g.series).map((s) => asObj(s)).filter((s) => asStr(s.name))
  if (!series.length && !asStr(g.approval_flow)) return null
  const section: Section = { title: 'Series & Governance', navLabel: 'Governance' }
  if (series.length) {
    section.table = {
      headers: ['Series', 'Status', 'Cadence', 'Owner', 'What it is'],
      rows: series.map((s) => [
        `<strong>${esc(asStr(s.name))}</strong>`,
        asStr(s.status) === 'ALREADY_RUNNING' ? '🟢 Running' : '🔵 Proposed',
        esc(asStr(s.cadence)),
        esc(asStr(s.owner)),
        esc(asStr(s.description)),
      ]),
    }
  }
  if (asStr(g.approval_flow)) section.content = `<p><strong>Approval flow:</strong> ${esc(asStr(g.approval_flow))}</p>`
  return section
}

function findingsSection(r: Record<string, any>): Section | null {
  const findings = asArr(r.consistency_findings).map((f) => asObj(f)).filter((f) => asStr(f.finding))
  if (!findings.length) {
    return {
      title: 'Consistency Audit',
      navLabel: 'Consistency',
      content: '<p>✅ No contradictions detected between Brand Brain, website and documents.</p>',
    }
  }
  const sorted = [...findings].sort(
    (a, b) => (SEVERITY_ORDER[asStr(a.severity)] ?? 9) - (SEVERITY_ORDER[asStr(b.severity)] ?? 9)
  )
  const sevIcon: Record<string, string> = { alta: '🔴', media: '🟡', baja: '🟢' }
  return {
    title: 'Consistency Audit',
    navLabel: 'Consistency',
    subtitle: 'Contradictions detected across sources — with evidence and a proposed resolution. Never silenced.',
    table: {
      headers: ['', 'Finding', 'Evidence', 'Proposed resolution'],
      rows: sorted.map((f) => [
        sevIcon[asStr(f.severity)] || '⚪',
        `<strong>${esc(asStr(f.finding))}</strong>`,
        esc(asStr(f.evidence)),
        esc(asStr(f.resolution)),
      ]),
    },
  }
}

function openItemsSection(r: Record<string, any>): Section | null {
  const items = asArr(r.open_items).map((o) => asObj(o)).filter((o) => asStr(o.item))
  const gaps = asArr(r.data_gaps).map((g) => asStr(g)).filter(Boolean)
  if (!items.length && !gaps.length) return null
  const section: Section = {
    title: 'Open Items',
    navLabel: 'Open Items',
    subtitle: 'Honest gaps: what is missing, who owns it and what it is needed for.',
  }
  if (items.length) {
    section.table = {
      headers: ['#', 'What is missing', 'Owner', 'Needed for'],
      rows: items.map((o, i) => [
        String(o.n ?? i + 1),
        esc(asStr(o.item)),
        esc(asStr(o.owner)),
        esc(asStr(o.needed_for)),
      ]),
    }
  }
  if (gaps.length) section.content = `<p><strong>Data gaps:</strong> ${gaps.map(esc).join(' · ')}</p>`
  return section
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = result ?? {}
    const sections = [
      overviewSection(r),
      findingsSection(r),
      storySection(r),
      voiceSection(r),
      voiceGuideSection(r),
      logoSection(r),
      colorsSection(r),
      typographySection(r),
      imagerySection(r),
      applicationsSection(r),
      governanceSection(r),
      openItemsSection(r),
    ].filter((s): s is Section => s !== null)
    return sections.length ? sections : genericSections(r)
  } catch {
    return genericSections(result ?? {})
  }
}
