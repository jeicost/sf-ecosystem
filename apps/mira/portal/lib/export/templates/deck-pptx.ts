// Real PowerPoint (.pptx) export for deck documents — mirrors the visual
// language of deck-template.ts (brand-parametrized: primary bands, accent
// stripes, giant faded section numbers, big stat figures) using pptxgenjs.
// Server-side only: returns a Buffer ready to stream as a download.

import PptxGenJS from 'pptxgenjs'
import { adminClient } from '@/lib/supabase'
import type { PlaybookBrand } from './playbook-template'
import {
  buildDeckTheme,
  mix,
  type DeckOptions,
  type DeckSlide,
  type DeckTheme,
  type DeckTimelineItem,
  type DeckComparisonSide,
} from './deck-template'

// 16:9 wide layout dimensions (inches)
const W = 13.33
const H = 7.5

const FONT = 'Inter'

/** pptxgenjs wants hex without the leading '#' */
function c(hex: string): string {
  return hex.replace(/^#/, '').toUpperCase()
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Fetch a remote image and return a pptxgenjs data URI, or null on any failure. */
async function fetchImageData(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/png'
    const mime = contentType.split(';')[0].trim() || 'image/png'
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0) return null
    return `${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

const ASSETS_BUCKET = 'generated-assets'

/**
 * Resolve a slide's image to a pptxgenjs data URI. Runs server-side, so the
 * relative '/api/assets' proxy is unusable — instead, prefer image_path with a
 * fresh signed URL from storage; fall back to a string imageUrl (historical
 * rows where imageUrl is an object are treated as no image). Null on failure.
 */
async function resolveSlideImageData(s: DeckSlide): Promise<string | null> {
  if (typeof s.image_path === 'string' && s.image_path.trim()) {
    try {
      const { data } = await adminClient()
        .storage.from(ASSETS_BUCKET)
        .createSignedUrl(s.image_path, 600)
      if (data?.signedUrl) {
        const img = await fetchImageData(data.signedUrl)
        if (img) return img
      }
    } catch {
      /* fall through to imageUrl */
    }
  }
  if (typeof s.imageUrl === 'string' && s.imageUrl.trim()) {
    return fetchImageData(s.imageUrl)
  }
  return null
}

function normalizeTimeline(items: DeckSlide['items']): DeckTimelineItem[] {
  if (!items) return []
  return items.map((it) =>
    typeof it === 'string' ? { label: '', title: it } : { label: it.label ?? '', title: it.title ?? '', body: it.body }
  )
}

function agendaStrings(items: DeckSlide['items']): string[] {
  return (items ?? []).map((it) => (typeof it === 'string' ? it : it.title)).filter(Boolean)
}

// ─────────────────────────────────────────────────────────────
// Per-layout slide builders
// ─────────────────────────────────────────────────────────────

type Pptx = InstanceType<typeof PptxGenJS>
type PptxSlide = ReturnType<Pptx['addSlide']>

function accentBar(slide: PptxSlide, t: DeckTheme): void {
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.09, fill: { color: c(t.accent) } })
}

function brandLabel(slide: PptxSlide, brand: PlaybookBrand, color: string): void {
  slide.addText(brand.clientName, {
    x: 0.35,
    y: 0.18,
    w: 5,
    h: 0.4,
    fontFace: FONT,
    fontSize: 13,
    bold: true,
    color,
    align: 'left',
  })
}

function addBullets(slide: PptxSlide, bullets: string[], t: DeckTheme, box: { x: number; y: number; w: number; h: number }, fontSize = 15): void {
  if (bullets.length === 0) return
  slide.addText(
    bullets.map((b) => ({
      text: stripHtml(b),
      options: {
        bullet: { code: '2022', indent: 14 },
        color: c(mix(t.ink, '#FFFFFF', 0.12)),
        breakLine: true,
        paraSpaceAfter: 8,
      },
    })),
    { ...box, fontFace: FONT, fontSize, align: 'left', valign: 'top' }
  )
}

function buildCover(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme, imageData: string | null): void {
  const slide = pptx.addSlide()
  slide.background = { color: c(mix(t.primary, '#000000', 0.35)) }
  if (imageData) {
    slide.addImage({ data: imageData, x: 0, y: 0, w: W, h: H, sizing: { type: 'cover', w: W, h: H } })
    // dark overlay for legibility
    slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: '06080E', transparency: 35 } })
  }
  slide.addText(o.brand.clientName.toUpperCase(), {
    x: 1,
    y: 2.1,
    w: W - 2,
    h: 0.5,
    fontFace: FONT,
    fontSize: 14,
    bold: true,
    charSpacing: 5,
    color: c(t.accent),
    align: 'center',
  })
  slide.addText(s.title, {
    x: 0.8,
    y: 2.6,
    w: W - 1.6,
    h: 1.9,
    fontFace: FONT,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
  })
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 1.8,
      y: 4.55,
      w: W - 3.6,
      h: 0.9,
      fontFace: FONT,
      fontSize: 17,
      color: 'E8E8E8',
      align: 'center',
      valign: 'top',
    })
  }
  // bottom accent strip
  slide.addShape('rect', { x: 0, y: H - 0.62, w: W, h: 0.62, fill: { color: c(t.accent) } })
  slide.addText(s.subtitle ?? o.subtitle ?? o.title, {
    x: 0,
    y: H - 0.62,
    w: W,
    h: 0.62,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: c(t.accentInk),
    align: 'center',
    valign: 'middle',
  })
}

function buildSection(pptx: Pptx, s: DeckSlide, num: number, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: c(t.primary) }
  brandLabel(slide, o.brand, c(t.primaryInk))
  // giant faded number
  slide.addText(String(num).padStart(2, '0'), {
    x: W - 6.4,
    y: -0.5,
    w: 6.2,
    h: 4.2,
    fontFace: FONT,
    fontSize: 190,
    bold: true,
    color: c(mix(t.primary, t.accent, 0.28)),
    align: 'right',
  })
  slide.addText((s.subtitle ?? `Sección ${String(num).padStart(2, '0')}`).toUpperCase(), {
    x: 0.85,
    y: 4.7,
    w: W - 2,
    h: 0.45,
    fontFace: FONT,
    fontSize: 13,
    bold: true,
    charSpacing: 4,
    color: c(t.accent),
    align: 'left',
  })
  slide.addText(s.title, {
    x: 0.8,
    y: 5.1,
    w: W - 2,
    h: 1.7,
    fontFace: FONT,
    fontSize: 40,
    bold: true,
    color: c(t.primaryInk),
    align: 'left',
    valign: 'top',
  })
}

function buildContent(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  accentBar(slide, t)
  brandLabel(slide, o.brand, c(t.ink))
  slide.addText(s.title, {
    x: 0.85,
    y: 0.95,
    w: W - 1.7,
    h: 1.1,
    fontFace: FONT,
    fontSize: 30,
    bold: true,
    color: c(t.accentDark),
    align: 'left',
    valign: 'top',
  })
  let y = 2.1
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.85, y, w: W - 1.7, h: 0.55,
      fontFace: FONT, fontSize: 17, bold: true, color: c(t.ink), align: 'left',
    })
    y += 0.65
  }
  if (s.body) {
    slide.addText(stripHtml(s.body), {
      x: 0.85, y, w: W - 1.7, h: 1.3,
      fontFace: FONT, fontSize: 14.5, color: c(mix(t.ink, '#FFFFFF', 0.15)), align: 'left', valign: 'top',
    })
    y += 1.4
  }
  if (s.bullets?.length) {
    addBullets(slide, s.bullets, t, { x: 0.85, y, w: W - 1.7, h: H - y - 1.3 })
    y += Math.min(s.bullets.length * 0.45 + 0.2, H - y - 1.3)
  }
  if (s.stats?.length) {
    const stats = s.stats.slice(0, 4)
    const gap = 0.25
    const boxW = (W - 1.7 - gap * (stats.length - 1)) / stats.length
    const boxY = Math.max(y + 0.15, H - 1.95)
    stats.forEach((st, i) => {
      const x = 0.85 + i * (boxW + gap)
      slide.addShape('roundRect', { x, y: boxY, w: boxW, h: 1.5, rectRadius: 0.09, fill: { color: c(t.primary) } })
      slide.addText(st.value, {
        x, y: boxY + 0.12, w: boxW, h: 0.75,
        fontFace: FONT, fontSize: 26, bold: true, color: c(t.accent), align: 'center',
      })
      slide.addText(st.label, {
        x: x + 0.1, y: boxY + 0.85, w: boxW - 0.2, h: 0.55,
        fontFace: FONT, fontSize: 10.5, color: 'E8E8E8', align: 'center', valign: 'top',
      })
    })
  }
}

function buildStats(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: c(t.primary) }
  brandLabel(slide, o.brand, c(t.primaryInk))
  if (s.subtitle) {
    slide.addText(s.subtitle.toUpperCase(), {
      x: 0.85, y: 0.95, w: W - 1.7, h: 0.4,
      fontFace: FONT, fontSize: 12, bold: true, charSpacing: 4, color: c(t.accent), align: 'left',
    })
  }
  slide.addText(s.title, {
    x: 0.85, y: 1.35, w: W - 1.7, h: 1,
    fontFace: FONT, fontSize: 30, bold: true, color: c(t.primaryInk), align: 'left', valign: 'top',
  })
  if (s.body) {
    slide.addText(stripHtml(s.body), {
      x: 0.85, y: 2.35, w: W - 1.7, h: 0.8,
      fontFace: FONT, fontSize: 13, color: 'D8D8D8', align: 'left', valign: 'top',
    })
  }
  const stats = (s.stats ?? []).slice(0, 5)
  if (stats.length > 0) {
    const cellW = (W - 1.4) / stats.length
    stats.forEach((st, i) => {
      const x = 0.7 + i * cellW
      slide.addText(st.value, {
        x, y: 3.6, w: cellW, h: 1.5,
        fontFace: FONT, fontSize: 48, bold: true, color: c(t.accent), align: 'center', valign: 'middle',
      })
      slide.addText(st.label, {
        x: x + 0.15, y: 5.15, w: cellW - 0.3, h: 1,
        fontFace: FONT, fontSize: 12.5, color: 'CFCFCF', align: 'center', valign: 'top',
      })
      if (i < stats.length - 1) {
        slide.addShape('line', {
          x: x + cellW, y: 3.7, w: 0, h: 2.2,
          line: { color: c(mix(t.primary, '#FFFFFF', 0.18)), width: 1 },
        })
      }
    })
  }
}

function buildTimeline(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  accentBar(slide, t)
  brandLabel(slide, o.brand, c(t.ink))
  slide.addText(s.title, {
    x: 0.85, y: 0.95, w: W - 1.7, h: 1,
    fontFace: FONT, fontSize: 30, bold: true, color: c(t.accentDark), align: 'left', valign: 'top',
  })
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.85, y: 1.95, w: W - 1.7, h: 0.5,
      fontFace: FONT, fontSize: 15, color: c(mix(t.ink, '#FFFFFF', 0.2)), align: 'left',
    })
  }
  const items = normalizeTimeline(s.items).slice(0, 6)
  if (items.length === 0) return
  const startY = 3.1
  const colW = (W - 1.7) / items.length
  // horizontal line
  slide.addShape('line', {
    x: 0.95, y: startY, w: W - 2.1, h: 0,
    line: { color: c(mix(t.accent, '#FFFFFF', 0.35)), width: 2.5 },
  })
  items.forEach((it, i) => {
    const x = 0.85 + i * colW
    slide.addShape('ellipse', {
      x: x + 0.02, y: startY - 0.11, w: 0.22, h: 0.22,
      fill: { color: c(t.accent) }, line: { color: 'FFFFFF', width: 1.5 },
    })
    if (it.label) {
      slide.addText(it.label.toUpperCase(), {
        x, y: startY + 0.25, w: colW - 0.25, h: 0.35,
        fontFace: FONT, fontSize: 11, bold: true, charSpacing: 2, color: c(t.accentDark), align: 'left',
      })
    }
    slide.addText(it.title, {
      x, y: startY + 0.62, w: colW - 0.25, h: 0.85,
      fontFace: FONT, fontSize: 15, bold: true, color: c(t.ink), align: 'left', valign: 'top',
    })
    if (it.body) {
      slide.addText(it.body, {
        x, y: startY + 1.5, w: colW - 0.25, h: 2,
        fontFace: FONT, fontSize: 11.5, color: c(mix(t.ink, '#FFFFFF', 0.25)), align: 'left', valign: 'top',
      })
    }
  })
}

function buildComparison(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  accentBar(slide, t)
  brandLabel(slide, o.brand, c(t.ink))
  slide.addText(s.title, {
    x: 0.85, y: 0.95, w: W - 1.7, h: 1,
    fontFace: FONT, fontSize: 30, bold: true, color: c(t.accentDark), align: 'left', valign: 'top',
  })
  const colY = 2.2
  const colH = H - colY - 0.7
  const colW = (W - 1.7 - 0.5) / 2
  const sides: { side: DeckComparisonSide | undefined; headFill: string; headInk: string; x: number }[] = [
    { side: s.left, headFill: c(t.primary), headInk: c(t.primaryInk), x: 0.85 },
    { side: s.right, headFill: c(t.accent), headInk: c(t.accentInk), x: 0.85 + colW + 0.5 },
  ]
  for (const { side, headFill, headInk, x } of sides) {
    if (!side) continue
    slide.addShape('roundRect', {
      x, y: colY, w: colW, h: colH, rectRadius: 0.1,
      fill: { color: 'F7F7F9' }, line: { color: 'E3E3E8', width: 1 },
    })
    slide.addShape('roundRect', {
      x, y: colY, w: colW, h: 0.75, rectRadius: 0.1, fill: { color: headFill },
    })
    slide.addText(side.title, {
      x: x + 0.25, y: colY, w: colW - 0.5, h: 0.75,
      fontFace: FONT, fontSize: 17, bold: true, color: headInk, align: 'left', valign: 'middle',
    })
    addBullets(slide, side.bullets ?? [], t, { x: x + 0.3, y: colY + 0.95, w: colW - 0.6, h: colH - 1.15 }, 13.5)
  }
}

function buildQuote(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: c(mix(t.primary, '#000000', 0.25)) }
  brandLabel(slide, o.brand, 'FFFFFF')
  slide.addText('“', {
    x: 0.9, y: 0.8, w: 2.4, h: 1.9,
    fontFace: 'Georgia', fontSize: 120, bold: true, color: c(t.accent), align: 'left',
  })
  slide.addText(s.quote ?? s.title, {
    x: 1.15, y: 2.5, w: W - 2.6, h: 2.6,
    fontFace: FONT, fontSize: 26, bold: true, italic: false, color: 'FFFFFF', align: 'left', valign: 'middle',
  })
  if (s.author) {
    slide.addText([
      { text: '— ', options: { color: c(t.accent), bold: true } },
      { text: s.author, options: { color: 'CFCFCF' } },
    ], {
      x: 1.15, y: 5.3, w: W - 2.6, h: 0.6,
      fontFace: FONT, fontSize: 15, bold: true, align: 'left',
    })
  }
}

function buildImageSlide(
  pptx: Pptx,
  s: DeckSlide,
  o: DeckOptions,
  t: DeckTheme,
  imageData: string | null
): void {
  if (!imageData) {
    buildContent(pptx, s, o, t)
    return
  }
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  accentBar(slide, t)
  const imgW = W * 0.44
  slide.addImage({ data: imageData, x: 0, y: 0.09, w: imgW, h: H - 0.09, sizing: { type: 'cover', w: imgW, h: H - 0.09 } })
  const tx = imgW + 0.6
  const tw = W - tx - 0.7
  brandLabel(slide, o.brand, c(t.ink))
  slide.addText(s.title, {
    x: tx, y: 1.2, w: tw, h: 1.4,
    fontFace: FONT, fontSize: 27, bold: true, color: c(t.accentDark), align: 'left', valign: 'top',
  })
  let y = 2.7
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: tx, y, w: tw, h: 0.55,
      fontFace: FONT, fontSize: 15.5, bold: true, color: c(t.ink), align: 'left',
    })
    y += 0.65
  }
  if (s.body) {
    slide.addText(stripHtml(s.body), {
      x: tx, y, w: tw, h: 1.6,
      fontFace: FONT, fontSize: 13.5, color: c(mix(t.ink, '#FFFFFF', 0.15)), align: 'left', valign: 'top',
    })
    y += 1.7
  }
  if (s.bullets?.length) {
    addBullets(slide, s.bullets, t, { x: tx, y, w: tw, h: H - y - 0.5 }, 13.5)
  }
}

function buildChartSlide(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  accentBar(slide, t)
  brandLabel(slide, o.brand, c(t.ink))
  slide.addText(s.title, {
    x: 0.85, y: 0.95, w: W - 1.7, h: 0.9,
    fontFace: FONT, fontSize: 28, bold: true, color: c(t.accentDark), align: 'left', valign: 'top',
  })
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 0.85, y: 1.85, w: W - 1.7, h: 0.5,
      fontFace: FONT, fontSize: 14, color: c(mix(t.ink, '#FFFFFF', 0.2)), align: 'left',
    })
  }
  const chart = s.chart
  if (!chart || !Array.isArray(chart.labels) || !Array.isArray(chart.data)) return
  const labels = chart.labels.map(String)
  const values = chart.data.map(Number)
  const typeMap = { bar: pptx.ChartType.bar, line: pptx.ChartType.line, doughnut: pptx.ChartType.doughnut } as const
  const chartType = typeMap[chart.type] ?? pptx.ChartType.bar
  const doughnutPalette = labels.map((_, i) =>
    c(mix(t.primary, t.accent, labels.length > 1 ? i / (labels.length - 1) : 0))
  )
  slide.addChart(chartType, [{ name: s.title || 'Serie', labels, values }], {
    x: 0.85,
    y: 2.5,
    w: W - 1.7,
    h: H - 3.2,
    chartColors: chart.type === 'doughnut' ? doughnutPalette : [c(t.accent)],
    showLegend: chart.type === 'doughnut',
    legendPos: 'r',
    legendFontSize: 11,
    showValue: chart.type !== 'line',
    dataLabelColor: c(t.ink),
    dataLabelFontSize: 10,
    catAxisLabelColor: c(mix(t.ink, '#FFFFFF', 0.2)),
    valAxisLabelColor: c(mix(t.ink, '#FFFFFF', 0.35)),
    catAxisLabelFontFace: FONT,
    valAxisLabelFontFace: FONT,
    lineSize: chart.type === 'line' ? 3 : undefined,
    valGridLine: { color: 'E6E6EA', style: 'solid', size: 1 },
    catGridLine: { style: 'none' },
    holeSize: chart.type === 'doughnut' ? 60 : undefined,
  })
}

function buildAgenda(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }
  accentBar(slide, t)
  brandLabel(slide, o.brand, c(t.ink))
  slide.addText(s.title, {
    x: 0.85, y: 0.95, w: W - 1.7, h: 1,
    fontFace: FONT, fontSize: 30, bold: true, color: c(t.accentDark), align: 'left', valign: 'top',
  })
  const items = agendaStrings(s.items).slice(0, 8)
  const startY = 2.15
  const rowH = Math.min(0.72, (H - startY - 0.5) / Math.max(items.length, 1))
  items.forEach((text, i) => {
    const y = startY + i * rowH
    slide.addText(String(i + 1).padStart(2, '0'), {
      x: 0.85, y, w: 1.1, h: rowH,
      fontFace: FONT, fontSize: 24, bold: true, color: c(t.accent), align: 'left', valign: 'middle',
    })
    slide.addText(text, {
      x: 2.05, y, w: W - 3, h: rowH,
      fontFace: FONT, fontSize: 17, bold: true, color: c(t.ink), align: 'left', valign: 'middle',
    })
    if (i < items.length - 1) {
      slide.addShape('line', {
        x: 0.85, y: y + rowH, w: W - 2.4, h: 0,
        line: { color: 'E8E8EC', width: 0.75 },
      })
    }
  })
}

function buildClosing(pptx: Pptx, s: DeckSlide, o: DeckOptions, t: DeckTheme): void {
  const slide = pptx.addSlide()
  slide.background = { color: c(mix(t.primary, '#000000', 0.25)) }
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.09, fill: { color: c(t.accent) } })
  slide.addShape('rect', { x: 0, y: H - 0.09, w: W, h: 0.09, fill: { color: c(t.accent) } })
  slide.addText(s.title, {
    x: 0.8, y: 2.3, w: W - 1.6, h: 1.6,
    fontFace: FONT, fontSize: 38, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle',
  })
  if (s.subtitle) {
    slide.addText(s.subtitle, {
      x: 1.8, y: 4, w: W - 3.6, h: 0.9,
      fontFace: FONT, fontSize: 16, color: 'D8D8D8', align: 'center', valign: 'top',
    })
  }
  if (s.body) {
    slide.addText(stripHtml(s.body), {
      x: 1.8, y: 4.9, w: W - 3.6, h: 0.8,
      fontFace: FONT, fontSize: 13, color: 'C0C0C0', align: 'center', valign: 'top',
    })
  }
  slide.addText(o.brand.clientName, {
    x: 0.8, y: H - 1.05, w: W - 1.6, h: 0.5,
    fontFace: FONT, fontSize: 13, bold: true, color: c(t.accent), align: 'center',
  })
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export async function generateDeckPptx(options: DeckOptions): Promise<Buffer> {
  const t = buildDeckTheme(options.brand)
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'WIDE', width: W, height: H })
  pptx.layout = 'WIDE'
  pptx.title = options.title
  pptx.author = options.brand.clientName

  // Pre-fetch every slide image in parallel (failures → null → graceful fallback)
  const imageDataBySlide = new Map<DeckSlide, string | null>()
  await Promise.all(
    options.slides
      .filter(
        (s) =>
          (typeof s.image_path === 'string' && s.image_path.trim()) ||
          (typeof s.imageUrl === 'string' && s.imageUrl.trim())
      )
      .map(async (s) => {
        imageDataBySlide.set(s, await resolveSlideImageData(s))
      })
  )

  let sectionCount = 0
  for (const slide of options.slides) {
    switch (slide.layout) {
      case 'cover':
        buildCover(pptx, slide, options, t, imageDataBySlide.get(slide) ?? null)
        break
      case 'section':
        sectionCount += 1
        buildSection(pptx, slide, sectionCount, options, t)
        break
      case 'stats':
        buildStats(pptx, slide, options, t)
        break
      case 'timeline':
        buildTimeline(pptx, slide, options, t)
        break
      case 'comparison':
        buildComparison(pptx, slide, options, t)
        break
      case 'quote':
        buildQuote(pptx, slide, options, t)
        break
      case 'image':
        buildImageSlide(pptx, slide, options, t, imageDataBySlide.get(slide) ?? null)
        break
      case 'chart':
        if (slide.chart) buildChartSlide(pptx, slide, options, t)
        else buildContent(pptx, slide, options, t)
        break
      case 'agenda':
        buildAgenda(pptx, slide, options, t)
        break
      case 'closing':
        buildClosing(pptx, slide, options, t)
        break
      case 'content':
      default:
        buildContent(pptx, slide, options, t)
        break
    }
  }

  const out = await pptx.write({ outputType: 'nodebuffer' })
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer)
}
