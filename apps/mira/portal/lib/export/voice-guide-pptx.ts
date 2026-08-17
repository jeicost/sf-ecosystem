// Voice Guide One-Pager — A4 vertical imprimible (.pptx → convertible a
// Google Slides). Del método Brand_Content_System del CEO: la guía de voz que
// el equipo cuelga en la pared. 4 bloques: regla de oro / decimos-nunca
// decimos con porqués / sonamos-nunca sonamos / reescritura de ejemplo.
// Tipografía Arial (regla QA-safe) y gate de geometría vertical: si el
// contenido no cabe en UNA página A4, se recorta — nunca desborda.

import { resolveBrandFonts, type BrandTypographyInput } from './brand-typography'
import PptxGenJS from 'pptxgenjs'

// A4 portrait en pulgadas
const W = 8.27
const H = 11.69
const MARGIN = 0.45
const CONTENT_W = W - MARGIN * 2
// Antes `const FONT = 'Arial'` a fuego. Ahora sale de la tipografía del
// Cerebro (opts.typography) con Arial de fallback — mismo camino que el
// color de marca. Se fija al arrancar la generación; los helpers leen la
// variable de módulo (un hilo por petición, sin carrera).
let FONT = 'Arial'
let FONT_HEADING = 'Arial'
const MAX_ENTRIES = 7 // dos/donts por columna — límite del spec del one-pager

export interface VoiceGuideEntry {
  phrase: string
  why?: string
}

export interface VoiceGuideData {
  golden_rule?: string
  dos?: VoiceGuideEntry[]
  donts?: VoiceGuideEntry[]
  sound_like?: string
  never_sound_like?: string
  example_rewrite?: { before?: string; after?: string; why?: string }
}

export interface VoiceGuideOptions {
  brandName: string
  primaryColor: string
  /** Tipografía del Cerebro (brand_data.visual_identity.typography), tal cual. Opcional. */
  typography?: BrandTypographyInput
  guide: VoiceGuideData
  versionNote?: string
}

function hex(c: string): string {
  const m = /^#?([a-f\d]{6})$/i.exec(c.trim())
  return m ? m[1].toUpperCase() : '8B5CF6'
}

function clean(s: unknown, max = 220): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Gate de geometría: nada puede pasar del borde inferior imprimible. */
function assertFits(y: number, h: number, what: string): void {
  if (y + h > H - MARGIN + 0.01) {
    throw new Error(`voice-guide geometry: "${what}" desborda la página A4 (y=${y.toFixed(2)} h=${h.toFixed(2)})`)
  }
}

export async function buildVoiceGuidePptx(opts: VoiceGuideOptions): Promise<Buffer> {
  // Cerebro → fuentes. Sin tipografía en el Cerebro sale en Arial, como siempre.
  const fonts = resolveBrandFonts(opts.typography, { heading: 'Arial', body: 'Arial' })
  FONT = fonts.body
  FONT_HEADING = fonts.heading
  const { brandName, guide } = opts
  const accent = hex(opts.primaryColor)

  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'A4P', width: W, height: H })
  pptx.layout = 'A4P'
  const slide = pptx.addSlide()
  slide.background = { color: 'FFFFFF' }

  let y = MARGIN

  // ── Bloque 1: cabecera + regla de oro ──
  slide.addText(brandName.toUpperCase(), {
    x: MARGIN, y, w: CONTENT_W, h: 0.32,
    fontFace: FONT, fontSize: 11, color: '666666', charSpacing: 3, bold: true,
  })
  y += 0.34
  slide.addText('Voice Guide — One Pager', {
    x: MARGIN, y, w: CONTENT_W, h: 0.5,
    fontFace: FONT_HEADING, fontSize: 26, color: '111111', bold: true,
  })
  y += 0.62

  const golden = clean(guide.golden_rule, 200)
  if (golden) {
    const goldenH = golden.length > 110 ? 0.85 : 0.62
    assertFits(y, goldenH, 'regla de oro')
    slide.addShape('roundRect', {
      x: MARGIN, y, w: CONTENT_W, h: goldenH,
      fill: { color: accent }, line: { color: accent }, rectRadius: 0.06,
    })
    slide.addText([
      { text: 'GOLDEN RULE   ', options: { fontSize: 9, bold: true, color: 'FFFFFF', charSpacing: 2 } },
      { text: golden, options: { fontSize: 13, bold: true, color: 'FFFFFF' } },
    ], {
      x: MARGIN + 0.18, y, w: CONTENT_W - 0.36, h: goldenH,
      fontFace: FONT, valign: 'middle',
    })
    y += goldenH + 0.28
  }

  // ── Bloque 2: DECIMOS / NUNCA DECIMOS en dos columnas ──
  const dos = (guide.dos ?? []).filter((d) => clean(d?.phrase)).slice(0, MAX_ENTRIES)
  const donts = (guide.donts ?? []).filter((d) => clean(d?.phrase)).slice(0, MAX_ENTRIES)
  const colW = (CONTENT_W - 0.25) / 2
  const entryH = 0.62
  const headH = 0.34
  const rowCount = Math.max(dos.length, donts.length, 1)
  const blockH = headH + rowCount * entryH
  assertFits(y, blockH, 'columnas decimos/nunca')

  const drawColumn = (x: number, title: string, color: string, entries: VoiceGuideEntry[]) => {
    slide.addText(title, {
      x, y, w: colW, h: headH,
      fontFace: FONT, fontSize: 12, bold: true, color,
    })
    entries.forEach((e, i) => {
      const ey = y + headH + i * entryH
      const runs: PptxGenJS.TextProps[] = [
        { text: `“${clean(e.phrase, 90)}”`, options: { fontSize: 10.5, bold: true, color: '111111' } },
      ]
      const why = clean(e.why, 110)
      if (why) runs.push({ text: `\n${why}`, options: { fontSize: 8.5, color: '555555' } })
      slide.addText(runs, {
        x, y: ey, w: colW, h: entryH,
        fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.05,
      })
    })
  }
  drawColumn(MARGIN, '✓ WE SAY', '1B7F4B', dos)
  drawColumn(MARGIN + colW + 0.25, '✗ WE NEVER SAY', 'B3261E', donts)
  y += blockH + 0.24

  // ── Bloque 3: sonamos a / nunca sonamos a ──
  const sound = clean(guide.sound_like, 160)
  const never = clean(guide.never_sound_like, 160)
  if (sound || never) {
    const soundH = 0.78
    assertFits(y, soundH, 'sonamos a')
    slide.addShape('rect', {
      x: MARGIN, y, w: CONTENT_W, h: soundH,
      fill: { color: 'F4F4F4' }, line: { color: 'DDDDDD', width: 0.5 },
    })
    const runs: PptxGenJS.TextProps[] = []
    if (sound) runs.push({ text: `WE SOUND LIKE: `, options: { fontSize: 9, bold: true, color: '1B7F4B' } }, { text: sound + (never ? '\n' : ''), options: { fontSize: 10, color: '222222' } })
    if (never) runs.push({ text: `WE NEVER SOUND LIKE: `, options: { fontSize: 9, bold: true, color: 'B3261E' } }, { text: never, options: { fontSize: 10, color: '222222' } })
    slide.addText(runs, {
      x: MARGIN + 0.15, y, w: CONTENT_W - 0.3, h: soundH,
      fontFace: FONT, valign: 'middle', lineSpacingMultiple: 1.15,
    })
    y += soundH + 0.24
  }

  // ── Bloque 4: reescritura de ejemplo ──
  const rw = guide.example_rewrite ?? {}
  const before = clean(rw.before, 150)
  const after = clean(rw.after, 150)
  if (before && after) {
    const rwH = 1.35
    assertFits(y, rwH, 'reescritura de ejemplo')
    slide.addShape('rect', {
      x: MARGIN, y, w: 0.05, h: rwH, fill: { color: accent }, line: { color: accent },
    })
    const runs: PptxGenJS.TextProps[] = [
      { text: 'HOW TO REWRITE IT\n', options: { fontSize: 9, bold: true, color: '666666', charSpacing: 2 } },
      { text: `Before: `, options: { fontSize: 9.5, bold: true, color: '999999' } },
      { text: `${before}\n`, options: { fontSize: 9.5, color: '777777', strike: false } },
      { text: `After: `, options: { fontSize: 10.5, bold: true, color: '111111' } },
      { text: `${after}`, options: { fontSize: 10.5, color: '111111' } },
    ]
    const why = clean(rw.why, 140)
    if (why) runs.push({ text: `\n${why}`, options: { fontSize: 8.5, italic: true, color: '555555' } })
    slide.addText(runs, {
      x: MARGIN + 0.2, y, w: CONTENT_W - 0.4, h: rwH,
      fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.15,
    })
    y += rwH
  }

  // ── Pie ──
  slide.addText(opts.versionNote || `Voice Guide · ${brandName} · generated with MIRA`, {
    x: MARGIN, y: H - MARGIN - 0.25, w: CONTENT_W, h: 0.25,
    fontFace: FONT, fontSize: 7.5, color: 'AAAAAA', align: 'right',
  })

  const out = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer
  return out
}
