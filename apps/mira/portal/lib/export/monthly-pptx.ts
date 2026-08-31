// Monthly Content System → PPTX real (F4), fiel al OUTPUT_SPEC del método
// Brand_Content_System del CEO (ref. deck mensual de Salsa):
//   16:9 (13.33×7.5), regla del footer en y=7.06, Arial (QA-safe),
//   componentes chip / tile con plate #111 / feedback-row / dividers PART 1..6,
//   calendario 7 columnas computado en TS, cierre con open items.
// Gates de geometría como asserts: si algo no cabe, se RECORTA — nunca desborda.
// La convención "PART N —" en los dividers es la que verifica verify-deck.ts.

import { resolveBrandFonts, type BrandTypographyInput } from './brand-typography'
import PptxGenJS from 'pptxgenjs'

const W = 13.33
const H = 7.5
const MARGIN = 0.55
const FOOTER_Y = 7.06 // regla del spec: nada de contenido por debajo
const CONTENT_W = W - MARGIN * 2
// Antes `const FONT = 'Arial'` a fuego. Ahora sale de la tipografía del
// Cerebro (opts.typography) con Arial de fallback — mismo camino que el
// color de marca. Se fija al arrancar la generación; los helpers leen la
// variable de módulo (un hilo por petición, sin carrera).
let FONT = 'Arial'
let FONT_HEADING = 'Arial'
const PLATE = '111111'
const INK_SOFT = '555555'
const PAPER = 'FFFFFF'

export interface MonthlyDeckOptions {
  brandName: string
  primaryColor: string
  /** Tipografía del Cerebro (brand_data.visual_identity.typography), tal cual. Opcional. */
  typography?: BrandTypographyInput
  logoDataUri?: string | null
  result: Record<string, any>
}

function hex(c: unknown): string {
  const m = /^#?([a-f\d]{6})$/i.exec(String(c ?? '').trim())
  return m ? m[1].toUpperCase() : '22D3EE'
}

function s(v: unknown, max = 300): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function arr(v: unknown): any[] {
  return Array.isArray(v) ? v : []
}

function gate(y: number, h: number, what: string): void {
  if (y + h > FOOTER_Y + 0.001) {
    throw new Error(`monthly-pptx geometry: "${what}" cruza el footer (y=${y.toFixed(2)} h=${h.toFixed(2)})`)
  }
}

type Slide = PptxGenJS.Slide

function footer(slide: Slide, brand: string, label: string) {
  slide.addText(`${brand} · ${label}`, {
    x: MARGIN, y: FOOTER_Y + 0.06, w: CONTENT_W, h: 0.3,
    fontFace: FONT, fontSize: 8, color: 'AAAAAA', align: 'right', valign: 'middle',
  })
}

function chip(slide: Slide, x: number, y: number, text: string, color: string, opts?: { light?: boolean; w?: number }) {
  const w = opts?.w ?? Math.min(0.36 + text.length * 0.085, 2.6)
  slide.addShape('roundRect', {
    x, y, w, h: 0.3,
    fill: { color: opts?.light ? 'F1F1F1' : color },
    line: { color: opts?.light ? 'DDDDDD' : color, width: 0.5 },
    rectRadius: 0.15,
  })
  slide.addText(text.toUpperCase(), {
    x, y, w, h: 0.3,
    fontFace: FONT, fontSize: 8.5, bold: true,
    color: opts?.light ? '333333' : 'FFFFFF',
    align: 'center', valign: 'middle', charSpacing: 1,
  })
  return w
}

/** Fila de feedback del spec: el cliente marca cada pieza sin salir del deck. */
function feedbackRow(slide: Slide, y: number) {
  gate(y, 0.42, 'feedback row')
  const labels: Array<[string, string]> = [['✅ APPROVE', '1B7F4B'], ['✏️ EDIT', 'B8860B'], ['❌ PASS', 'B3261E']]
  let x = MARGIN
  slide.addText('FEEDBACK →', {
    x, y, w: 1.15, h: 0.42, fontFace: FONT, fontSize: 8.5, bold: true, color: '888888', valign: 'middle',
  })
  x += 1.25
  for (const [label, color] of labels) {
    slide.addShape('roundRect', {
      x, y: y + 0.03, w: 1.5, h: 0.36,
      fill: { color: 'FFFFFF' }, line: { color, width: 1 }, rectRadius: 0.08,
    })
    slide.addText(label, {
      x, y: y + 0.03, w: 1.5, h: 0.36,
      fontFace: FONT, fontSize: 9.5, bold: true, color, align: 'center', valign: 'middle',
    })
    x += 1.66
  }
}

function divider(pptx: PptxGenJS, accent: string, brand: string, n: number, title: string, subtitle: string) {
  const slide = pptx.addSlide()
  slide.background = { color: PLATE }
  slide.addText(`PART ${n}`, {
    x: MARGIN, y: 2.2, w: CONTENT_W, h: 0.5,
    fontFace: FONT, fontSize: 15, bold: true, color: accent, charSpacing: 6,
  })
  slide.addText(title, {
    x: MARGIN, y: 2.75, w: CONTENT_W, h: 1.0,
    fontFace: FONT_HEADING, fontSize: 40, bold: true, color: 'FFFFFF',
  })
  slide.addText(subtitle, {
    x: MARGIN, y: 3.85, w: CONTENT_W - 2, h: 0.8,
    fontFace: FONT, fontSize: 13, color: 'CCCCCC', lineSpacingMultiple: 1.2,
  })
  slide.addText(`PART ${n} — ${title}`, {
    x: MARGIN, y: FOOTER_Y + 0.06, w: CONTENT_W, h: 0.3,
    fontFace: FONT, fontSize: 8, color: '777777', align: 'right',
  })
  return slide
}

function titleBar(slide: Slide, accent: string, eyebrow: string, title: string): number {
  slide.addText(eyebrow.toUpperCase(), {
    x: MARGIN, y: 0.42, w: CONTENT_W, h: 0.3,
    fontFace: FONT, fontSize: 9.5, bold: true, color: accent, charSpacing: 3,
  })
  slide.addText(title, {
    x: MARGIN, y: 0.72, w: CONTENT_W, h: 0.55,
    fontFace: FONT, fontSize: 22, bold: true, color: PLATE,
  })
  slide.addShape('rect', { x: MARGIN, y: 1.36, w: 0.9, h: 0.035, fill: { color: accent }, line: { color: accent } })
  return 1.6 // y donde empieza el contenido
}

function tableOn(slide: Slide, y: number, maxH: number, headers: string[], rows: string[][], widths: number[], what: string, fontSize = 9.5) {
  gate(y, maxH, what)
  const tableRows: PptxGenJS.TableRow[] = [
    headers.map((h) => ({
      text: h.toUpperCase(),
      options: { fontFace: FONT, fontSize: 8, bold: true, color: 'FFFFFF', fill: { color: PLATE }, valign: 'middle' as const },
    })),
    ...rows.map((r, i) =>
      r.map((cell) => ({
        text: cell,
        options: {
          fontFace: FONT, fontSize, color: '222222', valign: 'top' as const,
          fill: { color: i % 2 ? 'F7F7F7' : 'FFFFFF' },
        },
      }))
    ),
  ]
  slide.addTable(tableRows, {
    x: MARGIN, y, w: CONTENT_W, colW: widths,
    border: { type: 'solid', color: 'E3E3E3', pt: 0.5 },
    autoPage: false,
  })
}

// ── Builders por parte ──────────────────────────────────────────────

function coverSlide(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  const r = o.result
  const slide = pptx.addSlide()
  slide.background = { color: PAPER }
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.18, fill: { color: accent }, line: { color: accent } })
  if (o.logoDataUri) {
    try { slide.addImage({ data: o.logoDataUri, x: MARGIN, y: 0.7, w: 0.9, h: 0.9 }) } catch { /* logo opcional */ }
  }
  slide.addText(o.brandName.toUpperCase(), {
    x: MARGIN, y: 2.1, w: CONTENT_W, h: 0.4,
    fontFace: FONT, fontSize: 14, bold: true, color: INK_SOFT, charSpacing: 4,
  })
  slide.addText('Content System', {
    x: MARGIN, y: 2.5, w: CONTENT_W, h: 1.0,
    fontFace: FONT_HEADING, fontSize: 44, bold: true, color: PLATE,
  })
  slide.addText(s(r.month_label || r.month, 40), {
    x: MARGIN, y: 3.55, w: CONTENT_W, h: 0.6,
    fontFace: FONT, fontSize: 24, color: accent, bold: true,
  })
  let x = MARGIN
  const pillars = arr(r.pillars)
  const captions = arr(r.captions)
  const stats: string[] = [
    `${pillars.length} pillars`,
    `${captions.length} ready pieces`,
    `${arr(r.hero_briefs).length} hero briefs`,
  ]
  const promo = r.promo_ratio
  if (promo && typeof promo === 'object' && promo.content_pct) {
    stats.push(`${promo.content_pct}/${promo.promo_pct} content·promo`)
  }
  for (const st of stats) x += chip(slide, x, 4.5, st, accent) + 0.15
  slide.addText('How to use it: review the board, mark APPROVE / EDIT / PASS on every piece — nothing gets produced until it is green.', {
    x: MARGIN, y: 5.3, w: CONTENT_W - 3, h: 0.7,
    fontFace: FONT, fontSize: 11.5, color: INK_SOFT, italic: true, lineSpacingMultiple: 1.2,
  })
  footer(slide, o.brandName, 'Monthly content system')
}

function pillarSlides(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  divider(pptx, accent, o.brandName, 1, 'The System', 'This month\'s pillars: what each one promises, who it speaks to and the rules that keep it alive.')
  for (const p of arr(o.result.pillars).slice(0, 8)) {
    const slide = pptx.addSlide()
    slide.background = { color: PAPER }
    let y = titleBar(slide, accent, 'Part 1 · Pillar', s(p.name, 60) || 'Pillar')
    let x = MARGIN
    x += chip(slide, x, y, s(p.status, 20) === 'ALREADY_RUNNING' ? 'Running' : 'Proposed', accent) + 0.12
    if (s(p.funnel_role)) x += chip(slide, x, y, s(p.funnel_role, 8), accent, { light: true }) + 0.12
    if (s(p.cadence)) chip(slide, x, y, s(p.cadence, 16), accent, { light: true })
    y += 0.48

    gate(y, 0.8, 'promesa pilar')
    slide.addText([
      { text: 'PROMISE  ', options: { fontSize: 9, bold: true, color: accent, charSpacing: 2 } },
      { text: s(p.promise, 220), options: { fontSize: 13, color: '222222' } },
    ], { x: MARGIN, y, w: CONTENT_W, h: 0.8, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.15 })
    y += 0.85

    // Tiles DO / DON'T sobre plate oscuro (componente tile+plate del spec)
    const tileH = 1.15
    gate(y, tileH, 'tiles do/dont')
    const tileW = (CONTENT_W - 0.3) / 2
    const tiles: Array<[string, string, string]> = [
      ['RULE #1', s(p.do, 160), '1B7F4B'],
      ['WHAT KILLS IT', s(p.dont, 160), 'B3261E'],
    ]
    tiles.forEach(([label, text, color], i) => {
      const tx = MARGIN + i * (tileW + 0.3)
      slide.addShape('roundRect', { x: tx, y, w: tileW, h: tileH, fill: { color: PLATE }, line: { color: PLATE }, rectRadius: 0.05 })
      slide.addText([
        { text: `${label}\n`, options: { fontSize: 8.5, bold: true, color, charSpacing: 2 } },
        { text, options: { fontSize: 10.5, color: 'FFFFFF' } },
      ], { x: tx + 0.18, y: y + 0.1, w: tileW - 0.36, h: tileH - 0.2, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.15 })
    })
    y += tileH + 0.25

    const seeds = arr(p.idea_seeds).slice(0, 5).map((x2: unknown) => s(x2, 90)).filter(Boolean)
    if (seeds.length) {
      const seedsH = Math.min(0.34 * seeds.length + 0.3, FOOTER_Y - y)
      gate(y, seedsH, 'semillas')
      slide.addText([
        { text: 'SEEDS OF THE MONTH\n', options: { fontSize: 9, bold: true, color: accent, charSpacing: 2 } },
        ...seeds.map((seed) => ({ text: `•  ${seed}\n`, options: { fontSize: 10.5, color: '333333' } })),
      ], { x: MARGIN, y, w: CONTENT_W, h: seedsH, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.1 })
    }
    if (s(p.audience)) {
      slide.addText(`Speaks to: ${s(p.audience, 100)}`, {
        x: MARGIN, y: FOOTER_Y - 0.32, w: CONTENT_W, h: 0.3,
        fontFace: FONT, fontSize: 9, italic: true, color: '888888',
      })
    }
    footer(slide, o.brandName, `Pillar · ${s(p.name, 40)}`)
  }
}

function weeklyBoardSlides(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  divider(pptx, accent, o.brandName, 2, 'Weekly Board', 'The working view: what gets produced each week, in what format and what for.')
  for (const w of arr(o.result.weekly_board).slice(0, 6)) {
    const slide = pptx.addSlide()
    slide.background = { color: PAPER }
    const theme = s(w.theme, 80)
    const y = titleBar(slide, accent, 'Part 2 · Board', `Week ${s(w.week, 4) || '?'}${theme ? ` — ${theme}` : ''}`)
    const rows = arr(w.rows).slice(0, 8).map((row: any) => [
      s(row.pillar, 28) || '—',
      s(row.format, 16) || '—',
      s(row.platform, 14) || '—',
      s(row.working_title, 80) || '—',
      s(row.goal, 60) || '—',
    ])
    if (rows.length) {
      tableOn(slide, y + 0.1, FOOTER_Y - y - 0.2, ['Pillar', 'Format', 'Channel', 'Piece', 'Goal'], rows,
        [2.0, 1.3, 1.3, 4.6, 3.03], `tablero semana ${w.week}`)
    } else {
      slide.addText('No pieces assigned for this week.', { x: MARGIN, y: y + 0.3, w: CONTENT_W, h: 0.4, fontFace: FONT, fontSize: 11, color: INK_SOFT })
    }
    footer(slide, o.brandName, `Board · Week ${s(w.week, 4)}`)
  }
}

function prioritySlide(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  divider(pptx, accent, o.brandName, 3, 'Priorities', 'If only 7 pieces get produced this month, these are the ones. In order.')
  const slide = pptx.addSlide()
  slide.background = { color: PAPER }
  const y = titleBar(slide, accent, 'Part 3 · Priorities', 'The 7 of the month')
  const items = arr(o.result.priority_board).slice(0, 7)
  const rowH = Math.min(0.72, (FOOTER_Y - y - 0.2) / Math.max(items.length, 1))
  items.forEach((it: any, i: number) => {
    const iy = y + 0.1 + i * rowH
    gate(iy, rowH - 0.06, `prioridad ${i + 1}`)
    slide.addShape('roundRect', {
      x: MARGIN, y: iy, w: 0.5, h: rowH - 0.1, fill: { color: PLATE }, line: { color: PLATE }, rectRadius: 0.05,
    })
    slide.addText(String(it.n ?? i + 1), {
      x: MARGIN, y: iy, w: 0.5, h: rowH - 0.1,
      fontFace: FONT, fontSize: 15, bold: true, color: accent, align: 'center', valign: 'middle',
    })
    slide.addText([
      { text: s(it.title, 90), options: { fontSize: 12, bold: true, color: '111111' } },
      { text: `   ${s(it.pillar, 30)}${it.why_priority ? ` — ${s(it.why_priority, 110)}` : ''}`, options: { fontSize: 9.5, color: INK_SOFT } },
    ], { x: MARGIN + 0.65, y: iy, w: CONTENT_W - 0.65, h: rowH - 0.06, fontFace: FONT, valign: 'middle' })
  })
  footer(slide, o.brandName, 'Priorities of the month')
}

function heroBriefSlides(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  divider(pptx, accent, o.brandName, 4, 'Hero Briefs', 'The hero pieces, ready to shoot: shot by shot, with timings and on-screen text.')
  for (const h of arr(o.result.hero_briefs).slice(0, 4)) {
    const slide = pptx.addSlide()
    slide.background = { color: PAPER }
    let y = titleBar(slide, accent, 'Part 4 · Hero brief', s(h.title, 70) || 'Hero')
    let x = MARGIN
    if (s(h.pillar)) x += chip(slide, x, y, s(h.pillar, 24), accent, { light: true }) + 0.12
    if (s(h.platform)) x += chip(slide, x, y, s(h.platform, 14), accent) + 0.12
    y += 0.44
    gate(y, 0.55, 'hook hero')
    slide.addText([
      { text: 'HOOK  ', options: { fontSize: 9, bold: true, color: accent, charSpacing: 2 } },
      { text: s(h.hook || h.objective, 160), options: { fontSize: 12.5, bold: true, color: '111111' } },
    ], { x: MARGIN, y, w: CONTENT_W, h: 0.55, fontFace: FONT, valign: 'top' })
    y += 0.62
    const flow = arr(h.shot_flow).slice(0, 8).map((sc: any) => [
      s(sc.time, 10) || '—', s(sc.shot, 34) || '—', s(sc.action, 90) || '—', s(sc.text_overlay, 50) || '—',
    ])
    if (flow.length) {
      tableOn(slide, y, FOOTER_Y - y - 0.55, ['Time', 'Shot', 'Action', 'On-screen text'], flow,
        [1.0, 2.4, 5.4, 3.43], 'shot flow', 9)
    }
    slide.addText(`CTA: ${s(h.cta, 80) || '—'}    ·    Success = ${s(h.success_metric, 90) || '—'}`, {
      x: MARGIN, y: FOOTER_Y - 0.4, w: CONTENT_W, h: 0.35,
      fontFace: FONT, fontSize: 10, bold: true, color: '333333',
    })
    footer(slide, o.brandName, `Hero · ${s(h.title, 40)}`)
  }
}

function captionSlides(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  divider(pptx, accent, o.brandName, 5, 'Ready to Publish', 'Every piece with its final copy. Mark APPROVE / EDIT / PASS — nothing gets produced until it is green.')
  for (const c of arr(o.result.captions).slice(0, 30)) {
    const slide = pptx.addSlide()
    slide.background = { color: PAPER }
    let y = titleBar(slide, accent, 'Part 5 · Piece', s(c.hook, 75) || 'Piece')
    let x = MARGIN
    if (s(c.platform)) x += chip(slide, x, y, s(c.platform, 14), accent) + 0.12
    if (s(c.pillar_name)) x += chip(slide, x, y, s(c.pillar_name, 26), accent, { light: true }) + 0.12
    if (c.suggested_day) chip(slide, x, y, `day ${s(c.suggested_day, 4)}`, accent, { light: true })
    y += 0.46

    const colW = (CONTENT_W - 0.3) * 0.62
    const rightX = MARGIN + colW + 0.3
    const rightW = CONTENT_W - colW - 0.3
    const bodyH = FOOTER_Y - y - 0.55
    gate(y, bodyH, 'cuerpo caption')

    slide.addText([
      { text: 'COPY\n', options: { fontSize: 8.5, bold: true, color: accent, charSpacing: 2 } },
      { text: s(c.copy, 900), options: { fontSize: 9.5, color: '222222' } },
      { text: `\n\nCAPTION  `, options: { fontSize: 8.5, bold: true, color: accent, charSpacing: 2 } },
      { text: s(c.caption, 240), options: { fontSize: 9.5, italic: true, color: '333333' } },
    ], { x: MARGIN, y, w: colW, h: bodyH, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.1 })

    const rightRuns: PptxGenJS.TextProps[] = []
    const tags = arr(c.hashtags).slice(0, 10).map((t: unknown) => s(t, 24)).filter(Boolean)
    if (tags.length) rightRuns.push({ text: `HASHTAGS\n`, options: { fontSize: 8.5, bold: true, color: accent, charSpacing: 2 } }, { text: `${tags.join(' ')}\n\n`, options: { fontSize: 8.5, color: '4477AA' } })
    if (s(c.visual_direction)) rightRuns.push({ text: `VISUAL\n`, options: { fontSize: 8.5, bold: true, color: accent, charSpacing: 2 } }, { text: `${s(c.visual_direction, 220)}\n\n`, options: { fontSize: 9, color: '333333' } })
    const scenes = arr(c.reel_script?.scenes).slice(0, 6)
    if (scenes.length) {
      rightRuns.push({ text: `🎬 REEL${c.reel_script?.duration ? ` (${s(c.reel_script.duration, 8)})` : ''}\n`, options: { fontSize: 8.5, bold: true, color: accent, charSpacing: 2 } })
      for (const sc of scenes) {
        rightRuns.push({ text: `${s(sc.time, 8)} — ${s(sc.action, 70)}${sc.text_overlay ? ` · "${s(sc.text_overlay, 40)}"` : ''}\n`, options: { fontSize: 8.5, color: '333333' } })
      }
    }
    if (rightRuns.length) {
      slide.addShape('roundRect', { x: rightX, y, w: rightW, h: bodyH, fill: { color: 'F7F7F7' }, line: { color: 'E3E3E3', width: 0.5 }, rectRadius: 0.05 })
      slide.addText(rightRuns, { x: rightX + 0.15, y: y + 0.12, w: rightW - 0.3, h: bodyH - 0.24, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.12 })
    }

    feedbackRow(slide, FOOTER_Y - 0.48)
    footer(slide, o.brandName, `Ready to Publish`)
  }
}

/** Guarda: weekday resoluble (0=domingo…6=sábado); si falta, se computa desde date. */
function weekdayOf(e: any): number | null {
  const w = Number(e?.weekday)
  if (Number.isFinite(w) && w >= 0 && w <= 6) return w
  const d = new Date(`${s(e?.date, 20)}T00:00:00Z`)
  return isNaN(d.getTime()) ? null : d.getUTCDay()
}

function calendarSlide(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  const entries = arr(o.result.calendar_entries)
  if (!entries.length) return
  const slide = pptx.addSlide()
  slide.background = { color: PAPER }
  const y0 = titleBar(slide, accent, 'Content Calendar', s(o.result.month_label || o.result.month, 40))
  // Grid 7 columnas × hasta 6 filas, semana empezando en lunes
  const colW = CONTENT_W / 7
  const headY = y0 + 0.05
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  labels.forEach((l, i) => {
    slide.addText(l.toUpperCase(), {
      x: MARGIN + i * colW, y: headY, w: colW, h: 0.26,
      fontFace: FONT, fontSize: 8.5, bold: true, color: INK_SOFT, align: 'center', charSpacing: 1,
    })
  })
  const gridY = headY + 0.3
  // Antes: `entries[0].weekday` a pelo — si un informe refinado pierde weekday,
  // todo se posicionaba en NaN y el calendario desaparecía en silencio. Ahora se
  // busca el primer día anclable (weekday o date) y sin ancla se omite el grid
  // con una nota honesta en vez de una slide vacía.
  const anchor = entries.find((e: any) => weekdayOf(e) !== null && Number.isFinite(Number(e?.day)))
  if (!anchor) {
    slide.addText('Calendar data is missing weekday/date info — grid omitted for this month.', {
      x: MARGIN, y: gridY + 0.2, w: CONTENT_W, h: 0.5,
      fontFace: FONT, fontSize: 11, italic: true, color: INK_SOFT,
    })
    footer(slide, o.brandName, 'Monthly calendar')
    return
  }
  const anchorDay = Number(anchor.day)
  // Columna (lunes=0) en la que cae el día 1, deducida del día ancla.
  const firstOffset = ((((weekdayOf(anchor) as number) - (anchorDay - 1)) % 7) + 7 + 6) % 7
  // Filas desde el día MÁS ALTO (no desde entries.length): con entradas
  // dispersas, contar longitudes dibujaría celdas por debajo del footer.
  const maxDay = entries.reduce((m: number, e: any) => {
    const d = Number(e?.day)
    return Number.isFinite(d) && d > m && d <= 31 ? d : m
  }, 1)
  const totalCells = firstOffset + maxDay
  const rows = Math.ceil(totalCells / 7)
  const cellH = Math.min(0.84, (FOOTER_Y - gridY - 0.1) / rows)
  gate(gridY, rows * cellH, 'grid calendario')
  entries.forEach((e: any) => {
    const day = Number(e?.day)
    if (!Number.isFinite(day) || day < 1 || day > maxDay) return // sin día válido no hay celda posicionable
    const idx = firstOffset + day - 1
    const cx = MARGIN + (idx % 7) * colW
    const cy = gridY + Math.floor(idx / 7) * cellH
    const items = arr(e.items)
    slide.addShape('rect', {
      x: cx + 0.02, y: cy + 0.02, w: colW - 0.04, h: cellH - 0.04,
      fill: { color: items.length ? 'FFFFFF' : 'FAFAFA' },
      line: { color: items.length ? accent : 'E3E3E3', width: items.length ? 1 : 0.5 },
    })
    const runs: PptxGenJS.TextProps[] = [{ text: `${day}\n`, options: { fontSize: 8, bold: true, color: items.length ? '111111' : 'BBBBBB' } }]
    for (const it of items.slice(0, 2)) {
      runs.push({ text: `${it.is_hero ? '★ ' : ''}${s(it.platform, 2) ? s(it.platform, 12).slice(0, 2).toUpperCase() + ' · ' : ''}${s(it.title, 26)}\n`, options: { fontSize: 6.8, color: '333333' } })
    }
    if (items.length > 2) runs.push({ text: `+${items.length - 2} more`, options: { fontSize: 6.5, italic: true, color: '888888' } })
    slide.addText(runs, {
      x: cx + 0.07, y: cy + 0.05, w: colW - 0.14, h: cellH - 0.1,
      fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.0,
    })
  })
  // verify-deck.ts comprueba que exista una slide de calendario con un regex
  // bilingüe (/calendar(io)?/i), así que este texto ya se puede traducir.
  // del deck para dar por válida la slide de calendario. Este pie es el ancla que
  // hace pasar esa verificación: no traducir sin actualizar verify-deck.ts.
  footer(slide, o.brandName, 'Monthly calendar')
}

function ideaBankSlides(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  const bank = (o.result.idea_bank ?? {}) as Record<string, any>
  divider(pptx, accent, o.brandName, 6, 'Idea Bank', 'Material for the coming months: campaigns, activations, influencers and community — plus the 30/60/90 KPIs.')

  // Slide A: campañas + activaciones
  const a = pptx.addSlide()
  a.background = { color: PAPER }
  let y = titleBar(a, accent, 'Part 6 · Idea bank', 'Campaigns and activations')
  const campaigns = arr(bank.campaign_concepts).slice(0, 4).map((c: any) => [
    s(c.name, 34) || '—', s(c.concept, 110) || '—', s(c.pillar, 24) || '—', s(c.when, 30) || '—',
  ])
  if (campaigns.length) {
    tableOn(a, y + 0.05, 2.4, ['Campaign', 'Concept', 'Pillar', 'When'], campaigns, [2.3, 6.0, 2.0, 1.93], 'campañas')
    y += 0.5 + campaigns.length * 0.52
  }
  const plays = arr(bank.activation_playbook).slice(0, 4).map((p: any) => [
    s(p.play, 40) || '—', s(p.how, 120) || '—', s(p.cost, 12) || '—',
  ])
  if (plays.length) {
    tableOn(a, Math.min(y + 0.15, FOOTER_Y - 0.6 - plays.length * 0.45), plays.length * 0.5 + 0.4,
      ['Activation', 'How', 'Cost'], plays, [2.6, 8.03, 1.6], 'activaciones')
  }
  footer(a, o.brandName, 'Idea Bank · Campaigns')

  // Slide B: influencers + comunidad
  const b = pptx.addSlide()
  b.background = { color: PAPER }
  y = titleBar(b, accent, 'Part 6 · Idea bank', 'Influencers and community')
  const tiers = arr(bank.influencer_system?.tiers).slice(0, 3).map((t: any) => [
    s(t.tier, 12) || '—', s(t.who, 70) || '—', s(t.deal, 60) || '—', s(t.content, 70) || '—',
  ])
  if (tiers.length) {
    tableOn(b, y + 0.05, 2.1, ['Tier', 'Who', 'Deal', 'Content'], tiers, [1.2, 4.0, 3.4, 3.63], 'influencers')
    y += 0.55 + tiers.length * 0.5
  }
  const rituals = arr(bank.community_engine).slice(0, 4).map((rt: any) => [
    s(rt.ritual, 44) || '—', s(rt.cadence, 20) || '—', s(rt.why, 90) || '—',
  ])
  if (rituals.length) {
    tableOn(b, Math.min(y + 0.2, FOOTER_Y - 0.5 - rituals.length * 0.42), rituals.length * 0.46 + 0.4,
      ['Ritual', 'Cadence', 'Why'], rituals, [3.2, 1.8, 7.23], 'comunidad')
  }
  footer(b, o.brandName, 'Idea Bank · Community')

  // Slide C: KPIs 30/60/90 + dormant en tiles oscuros
  const kp = (bank.kpis_30_60_90 ?? {}) as Record<string, any>
  const c = pptx.addSlide()
  c.background = { color: PAPER }
  y = titleBar(c, accent, 'Part 6 · Idea bank', 'KPIs 30 / 60 / 90')
  const cols: Array<[string, any[]]> = [['30 days', arr(kp.d30)], ['60 days', arr(kp.d60)], ['90 days', arr(kp.d90)]]
  const tileW = (CONTENT_W - 0.6) / 3
  const tileH = 3.0
  gate(y, tileH, 'kpis tiles')
  cols.forEach(([label, items], i) => {
    const tx = MARGIN + i * (tileW + 0.3)
    c.addShape('roundRect', { x: tx, y, w: tileW, h: tileH, fill: { color: PLATE }, line: { color: PLATE }, rectRadius: 0.05 })
    c.addText([
      { text: `${label}\n`, options: { fontSize: 12, bold: true, color: accent } },
      ...items.slice(0, 5).map((k: unknown) => ({ text: `•  ${s(k, 80)}\n`, options: { fontSize: 9.5, color: 'FFFFFF' } })),
    ], { x: tx + 0.18, y: y + 0.15, w: tileW - 0.36, h: tileH - 0.3, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.2 })
  })
  const dormant = arr(bank.dormant_pillars).slice(0, 6).map((d: unknown) => s(d, 60)).filter(Boolean)
  if (dormant.length) {
    c.addText([
      { text: 'ON ICE  ', options: { fontSize: 8.5, bold: true, color: accent, charSpacing: 2 } },
      { text: dormant.join('  ·  '), options: { fontSize: 9.5, color: INK_SOFT } },
    ], { x: MARGIN, y: y + tileH + 0.25, w: CONTENT_W, h: 0.5, fontFace: FONT, valign: 'top' })
  }
  footer(c, o.brandName, 'KPIs 30/60/90')
}

function closingSlide(pptx: PptxGenJS, o: MonthlyDeckOptions, accent: string) {
  const slide = pptx.addSlide()
  slide.background = { color: PLATE }
  slide.addText('Open items', {
    x: MARGIN, y: 0.6, w: CONTENT_W, h: 0.6,
    fontFace: FONT_HEADING, fontSize: 28, bold: true, color: 'FFFFFF',
  })
  slide.addText('Honest gaps — each one with an owner. A system with clear open items is worth more than a "complete" one padded with filler.', {
    x: MARGIN, y: 1.25, w: CONTENT_W - 2, h: 0.5,
    fontFace: FONT, fontSize: 11, color: 'BBBBBB',
  })
  const items = arr(o.result.open_items).slice(0, 9)
  const rowH = Math.min(0.5, 4.6 / Math.max(items.length, 1))
  items.forEach((it: any, i: number) => {
    const iy = 1.95 + i * rowH
    gate(iy, rowH, `open item ${i + 1}`)
    slide.addText([
      { text: `${String(it.n ?? i + 1).padStart(2, '0')}  `, options: { fontSize: 11, bold: true, color: accent } },
      { text: `${s(it.item, 110)}  `, options: { fontSize: 10.5, color: 'FFFFFF' } },
      { text: `→ ${s(it.owner, 14) || '?'}${it.needed_for ? ` · for: ${s(it.needed_for, 60)}` : ''}`, options: { fontSize: 9, color: '999999' } },
    ], { x: MARGIN, y: iy, w: CONTENT_W, h: rowH, fontFace: FONT, valign: 'middle' })
  })
  slide.addText('Nothing gets produced until it is green. ✅', {
    x: MARGIN, y: FOOTER_Y - 0.45, w: CONTENT_W, h: 0.4,
    fontFace: FONT, fontSize: 12, bold: true, color: accent,
  })
}

export async function buildMonthlyDeckPptx(opts: MonthlyDeckOptions): Promise<Buffer> {
  // Cerebro → fuentes. Sin tipografía en el Cerebro sale en Arial, como siempre.
  const fonts = resolveBrandFonts(opts.typography, { heading: 'Arial', body: 'Arial' })
  FONT = fonts.body
  FONT_HEADING = fonts.heading
  const accent = hex(opts.primaryColor)
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'MIRA_WIDE', width: W, height: H })
  pptx.layout = 'MIRA_WIDE'

  coverSlide(pptx, opts, accent)
  pillarSlides(pptx, opts, accent)
  weeklyBoardSlides(pptx, opts, accent)
  prioritySlide(pptx, opts, accent)
  heroBriefSlides(pptx, opts, accent)
  captionSlides(pptx, opts, accent)
  calendarSlide(pptx, opts, accent)
  ideaBankSlides(pptx, opts, accent)
  closingSlide(pptx, opts, accent)

  return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer
}
