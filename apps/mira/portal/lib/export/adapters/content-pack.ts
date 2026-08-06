// Adapter: content-pack → editorial Section[]
// Input contract: content_pillars[], blog_content_hub[], social_media_strategy,
// email_sequences[], video_content_briefs[], content_repurposing,
// distribution_amplification, content_governance, seasonal_campaigns,
// analytics_measurement, brand_aligned_checklist, ugc_strategy, content_calendar,
// pillar_alignment, dependencies, brand_briefing_id.

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
  sectionForValue,
  statusBadge,
  toTable,
  valueToHtml,
} from './generic'

function overviewSection(r: Record<string, any>): Section {
  const stats: StatItem[] = []
  const pillars = asArr(r.content_pillars)
  const blog = asArr(r.blog_content_hub)
  const emails = asArr(r.email_sequences)
  const videos = asArr(r.video_content_briefs)
  if (pillars.length) stats.push({ value: String(pillars.length), label: 'Content pillars' })
  if (blog.length) stats.push({ value: String(blog.length), label: 'Blog articles' })
  if (emails.length) stats.push({ value: String(emails.length), label: 'Email sequences' })
  if (videos.length) stats.push({ value: String(videos.length), label: 'Video briefs' })

  const alignment = asStr(r.pillar_alignment)
  const section: Section = {
    title: 'Content Pack Summary',
    navLabel: 'Summary',
    subtitle: 'Content strategy aligned with the Brand Briefing',
    stats: stats.length ? stats : undefined,
  }
  if (alignment) {
    const map: Record<string, string> = {
      exact_match: 'Exact match with the Brand Briefing pillars',
      mismatch: 'WARNING: pillars do not match the Brand Briefing',
      warning: 'Caution: review alignment with the Brand Briefing',
    }
    section.content = `<p>${statusBadge(alignment)} ${esc(map[alignment] || '')}</p>`
  }
  return section
}

function pillarsSection(r: Record<string, any>): Section | null {
  const pillars = asArr(r.content_pillars).filter(isPlainObject)
  if (!pillars.length) return null
  return {
    title: 'Content Pillars',
    navLabel: 'Pillars',
    cards: pillars.map((p) => ({
      title: asStr(p.name) || 'Pillar',
      body:
        (asStr(p.description) ? `<p>${esc(asStr(p.description))}</p>` : '') +
        (asArr(p.content_types).length
          ? `<p style="margin-top:8px;"><strong>Formats:</strong></p>${valueToHtml(p.content_types)}`
          : '') +
        (asStr(p.monthly_volume)
          ? `<p style="margin-top:8px;"><strong>Monthly volume:</strong> ${esc(asStr(p.monthly_volume))}</p>`
          : ''),
    })),
  }
}

function blogSection(r: Record<string, any>): Section | null {
  const posts = asArr(r.blog_content_hub).filter(isPlainObject)
  if (!posts.length) return null
  return {
    title: 'Blog Content Hub',
    navLabel: 'Blog',
    subtitle: 'Planned articles with an SEO focus',
    table: {
      headers: ['Title', 'Outline', 'SEO Keywords', 'Audience', 'Word Count'],
      rows: posts.map((p) => [
        `<strong>${esc(asStr(p.title))}</strong>`,
        valueToHtml(p.outline),
        valueToHtml(p.seo_keywords),
        valueToHtml(p.target_audience),
        valueToHtml(p.word_count),
      ]),
    },
  }
}

function socialSection(r: Record<string, any>): Section | null {
  const social = asObj(r.social_media_strategy)
  if (!Object.keys(social).length) return null
  const cards = Object.entries(social)
    .map(([platform, content]) => ({ title: humanize(platform), body: valueToHtml(content) }))
    .filter((c) => c.body)
  if (!cards.length) return null
  return {
    title: 'Social Media Strategy',
    navLabel: 'Social',
    subtitle: 'Content by platform',
    cards,
  }
}

function emailSection(r: Record<string, any>): Section | null {
  const emails = asArr(r.email_sequences).filter(isPlainObject)
  if (!emails.length) return null
  return {
    title: 'Email Sequences',
    navLabel: 'Email',
    table: {
      headers: ['Sequence', 'Subject', 'Content', 'CTA', 'Timing'],
      rows: emails.map((e) => [
        `<strong>${esc(asStr(e.name))}</strong>`,
        valueToHtml(e.subject),
        valueToHtml(e.body_outline),
        valueToHtml(e.cta),
        valueToHtml(e.send_timing),
      ]),
    },
  }
}

function videoSection(r: Record<string, any>): Section | null {
  const videos = asArr(r.video_content_briefs).filter(isPlainObject)
  if (!videos.length) return null
  return {
    title: 'Video Briefs',
    cards: videos.map((v, i) => ({
      title: asStr(v.type) || `Video ${i + 1}`,
      body:
        (asStr(v.script_outline) ? `<p><strong>Script:</strong> ${esc(asStr(v.script_outline))}</p>` : valueToHtml(v.script_outline)) +
        (asStr(v.visuals) ? `<p style="margin-top:8px;"><strong>Visuals:</strong> ${esc(asStr(v.visuals))}</p>` : ''),
    })),
  }
}

function seasonalSection(r: Record<string, any>): Section | null {
  const seasonal = asObj(r.seasonal_campaigns)
  if (!Object.keys(seasonal).length) return null
  const labels: Record<string, string> = { q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' }
  const phases = Object.entries(seasonal)
    .map(([q, v]) => ({ title: labels[q] || humanize(q), body: valueToHtml(v) }))
    .filter((p) => p.body)
  if (!phases.length) return null
  return {
    title: 'Seasonal Campaigns',
    navLabel: 'Seasonal',
    phases,
  }
}

function calendarSection(r: Record<string, any>): Section | null {
  const cal = asObj(r.content_calendar)
  const rolling = asArr(cal['12_month_rolling'] ?? r.content_calendar)
  if (!rolling.length) {
    const s = sectionForValue('content_calendar', r.content_calendar)
    return s ? { ...s, title: 'Content Calendar' } : null
  }
  if (rolling.every(isPlainObject)) {
    const table = toTable(rolling)
    if (table) return { title: 'Content Calendar', navLabel: 'Calendar', table }
  }
  return {
    title: 'Content Calendar',
    navLabel: 'Calendar',
    listItems: rolling.map((m) => valueToHtml(m)).filter(Boolean),
  }
}

export const adapter: ToolAdapter = (result) => {
  try {
    const r = asObj(result)
    const sections: Section[] = []
    const used = new Set<string>([
      'brand_briefing_id',
      'pillar_alignment',
      'dependencies',
      'content_pillars',
      'blog_content_hub',
      'social_media_strategy',
      'email_sequences',
      'video_content_briefs',
      'seasonal_campaigns',
      'content_calendar',
    ])

    sections.push(overviewSection(r))
    const parts = [
      pillarsSection(r),
      blogSection(r),
      socialSection(r),
      emailSection(r),
      videoSection(r),
      seasonalSection(r),
    ]
    for (const s of parts) if (s) sections.push(s)

    const mapped: Array<[string, string]> = [
      ['content_repurposing', 'Content Repurposing'],
      ['distribution_amplification', 'Distribution & Amplification'],
      ['content_governance', 'Content Governance'],
      ['analytics_measurement', 'Analytics & Measurement'],
      ['brand_aligned_checklist', 'Brand Alignment Checklist'],
      ['ugc_strategy', 'UGC Strategy'],
    ]
    for (const [key, title] of mapped) {
      used.add(key)
      const s = sectionForValue(key, r[key])
      if (s) sections.push({ ...s, title })
    }

    const cal = calendarSection(r)
    if (cal) sections.push(cal)

    sections.push(...genericSections(r, used))
    return sections
  } catch {
    return genericSections(result)
  }
}
