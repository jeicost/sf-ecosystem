// Deck HTML template — 16:9 presentation/dossier language ported from the
// Python deck renderer: gradient cover with badge strip, dark section slides
// with a giant faded number, accent-titled light content slides, stats grid
// with huge figures, corner accent circle, top accent stripe, subtle radial glow.
// Fully brand-parametrized (nothing hardcoded from any client).
//
// Output is a standalone HTML presentation: one slide visible at a time,
// arrow-key / click-zone navigation, "n / total" counter, F or double-click
// for fullscreen. Printing yields one landscape page per slide.

import type { PlaybookBrand } from './playbook-template'
import { resolveBrandFonts, googleFontsHrefs, type BrandFonts, type BrandTypographyInput } from '../brand-typography'

/**
 * Marca del deck = la del playbook + la tipografía del Cerebro. Va aquí y no
 * en PlaybookBrand porque el color de marca ya llega por `brand.primaryColor`
 * y la letra tiene que viajar por el MISMO camino (ruta → brand → theme):
 * el llamador mete `typography: brand_data.visual_identity.typography` tal
 * cual (objeto o texto, lo que haya) y resolveBrandFonts se encarga.
 * Opcional: sin ella el deck sale en Inter, como siempre.
 */
export interface DeckBrand extends PlaybookBrand {
  typography?: BrandTypographyInput
}

export interface DeckTimelineItem {
  label: string // e.g. "Q1", "Fase 1", "2026"
  title: string
  body?: string
}

export interface DeckComparisonSide {
  title: string
  bullets: string[]
}

export interface DeckChart {
  type: 'bar' | 'line' | 'doughnut'
  labels: string[]
  data: number[]
}

export interface DeckSlide {
  layout:
    | 'cover'
    | 'section'
    | 'content'
    | 'stats'
    | 'closing'
    | 'timeline'
    | 'comparison'
    | 'quote'
    | 'image'
    | 'chart'
    | 'agenda'
  title: string
  subtitle?: string
  body?: string // HTML — inserted as-is
  bullets?: string[]
  stats?: { value: string; label: string }[]
  // timeline → DeckTimelineItem[] · agenda → string[]
  items?: (DeckTimelineItem | string)[]
  left?: DeckComparisonSide // comparison
  right?: DeckComparisonSide // comparison
  quote?: string // quote
  author?: string // quote
  imageUrl?: string // image layout · cover background (signed URL — may be expired or, in broken historical rows, a non-string)
  image_path?: string // storage path in generated-assets — preferred over imageUrl (never expires)
  chart?: DeckChart // chart layout (Chart.js, loaded only when present)
  // AI-image generation hints (set by the model, consumed at generation time)
  wants_image?: boolean
  image_prompt?: string
}

export interface DeckOptions {
  mode?: 'light' | 'dark'
  brand: DeckBrand
  title: string
  subtitle?: string
  slides: DeckSlide[]
  /** Código BCP-47 para <html lang>. El deck se generaba siempre con lang="es"
   *  aunque el contenido saliera en otro idioma (lectores de pantalla y
   *  traductores se lo creen). Por defecto 'en', que es el idioma por defecto
   *  de los entregables. */
  lang?: string
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Resolve the image URL for a slide. Prefers image_path (served via the
 * authenticated /api/assets proxy — never expires) over the stored signed URL.
 * Historical rows where imageUrl was written as an object are treated as no image.
 */
function slideImageUrl(s: DeckSlide): string | undefined {
  if (typeof s.image_path === 'string' && s.image_path.trim()) {
    return '/api/assets?path=' + encodeURIComponent(s.image_path)
  }
  if (typeof s.imageUrl === 'string' && s.imageUrl.trim()) {
    return s.imageUrl
  }
  return undefined
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface RGB {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): RGB {
  const raw = hex.trim().replace(/^#/, '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return { r: 17, g: 24, b: 39 }
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(ca.r, cb.r)}${ch(ca.g, cb.g)}${ch(ca.b, cb.b)}`
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

export interface DeckTheme {
  primary: string
  accent: string
  accentDark: string
  ink: string // text on light slides
  accentInk: string // text on accent backgrounds
  primaryInk: string // text on primary backgrounds
  gradient: string // cover / closing background
  contentBg: string // superficie de las slides de contenido (P3: claro/oscuro)
  contentInk: string // texto sobre contentBg
  /** Tipografía resuelta del Cerebro (o Inter/Inter si no hay): la consumen
   *  el CSS del deck HTML y el fontFace del deck PPTX. */
  fonts: BrandFonts
}

// Lo que el deck llevaba a fuego antes de leer el Cerebro: sin tipografía de
// marca, el resultado es byte a byte el de siempre.
const DECK_DEFAULT_FONTS = { heading: 'Inter', body: 'Inter' }

export function buildDeckTheme(brand: DeckBrand, mode: 'light' | 'dark' = 'light'): DeckTheme {
  const primary = brand.primaryColor
  const accent = brand.accentColor ?? mix(primary, '#FFFFFF', 0.55)
  const darkBase = luminance(primary) < 0.55 ? primary : mix(primary, '#000000', 0.65)
  const g0 = mix(darkBase, '#000000', 0.45)
  const g1 = mix(darkBase, accent, 0.12)
  const g2 = mix(darkBase, accent, 0.28)
  const accentInkDark = luminance(primary) < 0.55 ? primary : '#1F2430'
  return {
    primary,
    accent,
    accentDark: mix(accent, '#000000', 0.35),
    ink: luminance(primary) < 0.55 ? primary : mix(primary, '#000000', 0.6),
    accentInk: luminance(accent) < 0.5 ? '#FFFFFF' : accentInkDark,
    primaryInk: luminance(primary) < 0.5 ? '#FFFFFF' : accentInkDark,
    gradient: `linear-gradient(150deg, ${g0} 0%, ${darkBase} 35%, ${g1} 65%, ${g2} 100%)`,
    // P3: en oscuro, las slides de contenido pasan a superficie oscura con
    // tinta clara; en claro, el look de siempre (blanco + ink de marca).
    contentBg: mode === 'dark' ? '#15151A' : '#FFFFFF',
    contentInk: mode === 'dark' ? '#F5F0E8' : (luminance(primary) < 0.55 ? primary : mix(primary, '#000000', 0.6)),
    fonts: resolveBrandFonts(brand.typography, DECK_DEFAULT_FONTS),
  }
}

// ─────────────────────────────────────────────────────────────
// Decorative elements (ported, accent-tinted)
// ─────────────────────────────────────────────────────────────

function accentCircle(t: DeckTheme, sizeEm: number): string {
  return `<div class="deco" style="bottom:-${sizeEm / 2}em;right:-${sizeEm / 2}em;width:${sizeEm}em;height:${sizeEm}em;border-radius:50%;background:${t.accent};opacity:0.9"></div>`
}

function accentStripeTop(t: DeckTheme): string {
  return `<div class="deco" style="top:0;left:0;right:0;height:0.45em;background:${t.accent};z-index:5"></div>`
}

function glowOverlay(t: DeckTheme): string {
  return `<div class="deco" style="top:-15%;left:10%;width:80%;height:80%;background:radial-gradient(ellipse, ${rgba(
    t.accent,
    0.16
  )} 0%, ${rgba(t.accent, 0.04)} 45%, transparent 68%)"></div>`
}

function ringsDecoration(t: DeckTheme): string {
  const ring = rgba(t.accent, 0.12)
  const circle = (size: number) =>
    `<div class="deco" style="top:50%;left:50%;transform:translate(-50%,-50%);width:${size}em;height:${size}em;border-radius:50%;border:1px solid ${ring}"></div>`
  return circle(22) + circle(30) + circle(38)
}

function brandMark(brand: PlaybookBrand, heightEm: number, color: string): string {
  if (brand.logoUrl) {
    return `<img src="${esc(brand.logoUrl)}" alt="${esc(
      brand.clientName
    )}" style="height:${heightEm}em;width:auto;display:inline-block;vertical-align:middle"/>`
  }
  return `<span style="font-weight:800;letter-spacing:-0.03em;font-size:${heightEm * 0.72}em;color:${color}">${esc(
    brand.clientName
  )}</span>`
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

function buildCss(t: DeckTheme): string {
  // Tipografía de marca (Cerebro → DeckTheme.fonts): el cuerpo hereda la de
  // cuerpo desde <body>; los titulares, cifras grandes, cabeceras de
  // comparación y la cita llevan la de títulos. La pila trae la de marca
  // primero y detrás la de siempre, así que si el navegador no la consigue el
  // deck se ve como antes, no roto.
  const headingFont = `font-family: ${t.fonts.headingStack};`
  return `
/* La fuente se carga con <link rel="preconnect"> + <link rel="stylesheet"> en
   el <head> (ver generateDeckHTML): un @import aquí dentro obliga al navegador
   a bajar primero este CSS, descubrir el import y solo entonces pedir la
   fuente -- dos viajes en serie que bloquean el render del deck. */

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body { height: 100%; }
body {
  font-family: ${t.fonts.bodyStack};
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  background: #0A0C10;
  overflow: hidden;
}

.deco { position: absolute; pointer-events: none; }

/* ── STAGE + SLIDE BASE (screen) ───────────────────────────── */
.stage {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.slide {
  position: absolute;
  width: min(100vw, 177.7778vh);
  aspect-ratio: 16 / 9;
  /* 1em = slide-width / 96 — every internal size scales with the slide */
  font-size: calc(min(100vw, 177.7778vh) / 96);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.35s ease;
}
.slide.active { opacity: 1; visibility: visible; }

.slide-dark     { background: ${t.primary}; color: ${t.primaryInk}; }
.slide-light    { background: ${t.contentBg}; color: ${t.contentInk}; }
.slide-gradient { background: ${t.gradient}; color: #FFFFFF; }

/* ── LOGO / EYEBROW ────────────────────────────────────────── */
.logo-bar { position: absolute; top: 1.6em; left: 2.2em; z-index: 10; }
.eyebrow {
  font-size: 1.1em; font-weight: 700; letter-spacing: 0.25em;
  text-transform: uppercase; color: ${t.accent};
  margin-bottom: 1em; display: flex; align-items: center; gap: 0.7em;
}
.eyebrow::before {
  content: ''; display: inline-block; width: 1.6em; height: 0.18em;
  background: ${t.accent}; border-radius: 1px; flex-shrink: 0;
}

/* ── TYPOGRAPHY ────────────────────────────────────────────── */
.slide-title {
  ${headingFont}
  font-size: 4.6em; font-weight: 900; line-height: 1.08;
  letter-spacing: -0.02em; margin-bottom: 0.4em; color: ${t.accentDark};
}
.slide-title-onDark { color: #FFFFFF; }
.slide-title-xl {
  ${headingFont}
  font-size: 6.2em; font-weight: 900; line-height: 1.05;
  letter-spacing: -0.025em; margin-bottom: 0.35em; color: #FFFFFF;
}
.slide-subtitle { font-size: 1.9em; font-weight: 700; line-height: 1.4; margin-bottom: 0.9em; color: ${t.ink}; }
.slide-subtitle-muted { font-weight: 400; color: rgba(255,255,255,0.58); }
.slide-body { font-size: 1.7em; line-height: 1.65; color: ${rgba(t.ink, 0.75)}; margin-bottom: 0.7em; max-width: 46em; }
.slide-body p { margin-bottom: 0.6em; }
.slide-body strong { color: ${t.ink}; }
.on-dark .slide-body { color: rgba(255,255,255,0.68); }
.on-dark .slide-body strong { color: #FFFFFF; }

/* ── BULLETS ───────────────────────────────────────────────── */
.bullet-list { list-style: none; margin-top: 0.6em; }
.bullet-list li {
  display: flex; align-items: flex-start; gap: 0.7em;
  font-size: 1.7em; line-height: 1.55; color: ${rgba(t.ink, 0.8)};
  margin-bottom: 0.55em; max-width: 42em;
}
.bullet-list li::before {
  content: ''; flex-shrink: 0;
  width: 0.55em; height: 0.55em; border-radius: 50%;
  background: ${t.accent}; margin-top: 0.5em;
}
.on-dark .bullet-list li { color: rgba(255,255,255,0.72); }

/* ── SECTION NUMBER ────────────────────────────────────────── */
.section-num {
  ${headingFont}
  position: absolute; top: 0.02em; right: 0.25em;
  font-size: 24em; font-weight: 900; line-height: 1;
  letter-spacing: -0.04em; color: ${t.accent}; opacity: 0.16;
  pointer-events: none;
}

/* ── STATS ─────────────────────────────────────────────────── */
.stats-row { display: flex; width: 100%; }
.stat-cell {
  flex: 1; padding: 0 1.6em; text-align: center;
  border-right: 1px solid rgba(255,255,255,0.09);
}
.stat-cell:last-child { border-right: none; }
.stat-value {
  ${headingFont}
  font-size: 6.4em; font-weight: 900; color: ${t.accent};
  line-height: 1; letter-spacing: -0.03em;
}
.stat-label { font-size: 1.5em; color: rgba(255,255,255,0.6); line-height: 1.4; margin-top: 0.5em; }

/* Inline mini-stats on light content slides */
.stat-inline-row { display: flex; gap: 1em; margin-top: 1.4em; }
.stat-inline {
  flex: 1; background: ${t.primary}; border-radius: 0.8em;
  padding: 1.3em 1em; text-align: center;
}
.stat-inline .stat-value { font-size: 3.4em; }
.stat-inline .stat-label { font-size: 1.2em; color: rgba(255,255,255,0.75); }

/* ── COVER BADGE STRIP ─────────────────────────────────────── */
.cover-strip {
  background: ${t.accent}; padding: 1.1em 3em;
  position: relative; z-index: 3; flex-shrink: 0;
  text-align: center;
}
.cover-strip span {
  font-size: 1.4em; font-weight: 700; color: ${t.accentInk}; letter-spacing: 0.03em;
}

/* ── TIMELINE ──────────────────────────────────────────────── */
.timeline-row { display: flex; gap: 1.8em; margin-top: 2.2em; position: relative; }
.timeline-row::before {
  content: ''; position: absolute; top: 0.5em; left: 0.55em; right: 3em;
  height: 0.18em; background: ${rgba(t.accent, 0.35)}; border-radius: 1px;
}
.timeline-item { flex: 1; position: relative; padding-top: 1.8em; min-width: 0; }
.timeline-item::before {
  content: ''; position: absolute; top: 0; left: 0;
  width: 1.1em; height: 1.1em; border-radius: 50%;
  background: ${t.accent}; border: 0.22em solid #FFFFFF;
  box-shadow: 0 0 0 1px ${rgba(t.accent, 0.4)};
}
.timeline-label {
  font-size: 1.05em; font-weight: 800; letter-spacing: 0.16em;
  text-transform: uppercase; color: ${t.accentDark}; margin-bottom: 0.5em;
}
.timeline-title { font-size: 1.6em; font-weight: 800; color: ${t.ink}; margin-bottom: 0.35em; line-height: 1.25; }
.timeline-body { font-size: 1.25em; line-height: 1.55; color: ${rgba(t.ink, 0.7)}; }

/* ── COMPARISON ────────────────────────────────────────────── */
.compare-row { display: flex; gap: 2em; margin-top: 1.8em; }
.compare-col {
  flex: 1; border-radius: 1em; overflow: hidden;
  background: ${rgba(t.primary, 0.04)}; border: 1px solid ${rgba(t.primary, 0.1)};
}
.compare-head { ${headingFont} padding: 1.1em 1.4em; font-size: 1.6em; font-weight: 800; letter-spacing: -0.01em; }
.compare-col.col-a .compare-head { background: ${t.primary}; color: ${t.primaryInk}; }
.compare-col.col-b .compare-head { background: ${t.accent}; color: ${t.accentInk}; }
.compare-col .bullet-list { margin: 0; padding: 1.2em 1.4em 1.4em; }
.compare-col .bullet-list li { font-size: 1.45em; }

/* ── QUOTE ─────────────────────────────────────────────────── */
.quote-mark {
  font-size: 14em; line-height: 0.55; font-weight: 900;
  color: ${t.accent}; opacity: 0.55; font-family: Georgia, serif;
}
.quote-text {
  ${headingFont}
  font-size: 3.1em; font-weight: 700; line-height: 1.38;
  color: #FFFFFF; max-width: 22em; letter-spacing: -0.015em;
}
.quote-author { margin-top: 1.6em; font-size: 1.5em; color: rgba(255,255,255,0.6); font-weight: 600; }
.quote-author::before { content: '— '; color: ${t.accent}; }

/* ── IMAGE SPLIT ───────────────────────────────────────────── */
.image-split { flex: 1; display: flex; position: relative; z-index: 2; min-height: 0; }
.image-half {
  width: 44%; flex-shrink: 0;
  background-size: cover; background-position: center;
  background-color: ${rgba(t.primary, 0.08)};
}
.image-content {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  padding: 5em 5em 4em; min-width: 0;
}

/* ── CHART ─────────────────────────────────────────────────── */
.chart-box { flex: 1; position: relative; margin-top: 1.5em; min-height: 0; }
.chart-box canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }

/* ── AGENDA ────────────────────────────────────────────────── */
.agenda-list { margin-top: 1.4em; display: flex; flex-direction: column; max-width: 54em; }
.agenda-item {
  display: flex; align-items: center; gap: 1.4em;
  border-bottom: 1px solid ${rgba(t.primary, 0.1)};
  padding: 0.9em 0;
}
.agenda-item:last-child { border-bottom: none; }
.agenda-num {
  font-size: 3.2em; font-weight: 900; color: ${t.accent};
  line-height: 1; min-width: 1.65em; letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}
.agenda-text { font-size: 1.9em; font-weight: 700; color: ${t.ink}; line-height: 1.3; }

/* ── COVER IMAGE OVERLAY ───────────────────────────────────── */
.cover-image-bg {
  position: absolute; inset: 0; background-size: cover; background-position: center;
}
.cover-image-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(160deg, rgba(6,8,14,0.82) 0%, rgba(6,8,14,0.55) 55%, rgba(6,8,14,0.78) 100%);
}

/* ── NAV UI (screen only) ──────────────────────────────────── */
.deck-ui { position: fixed; z-index: 50; }
#deck-counter {
  right: 1.6rem; bottom: 1.2rem;
  font-size: 0.85rem; font-weight: 600; letter-spacing: 0.08em;
  color: rgba(255,255,255,0.55);
  font-variant-numeric: tabular-nums;
  user-select: none; pointer-events: none;
}
#deck-hint {
  left: 1.6rem; bottom: 1.2rem;
  font-size: 0.72rem; color: rgba(255,255,255,0.3);
  user-select: none; pointer-events: none;
}
.deck-zone { top: 0; bottom: 0; width: 20%; cursor: pointer; }
#deck-zone-left { left: 0; }
#deck-zone-right { right: 0; }

/* ── PRINT: one landscape page per slide ───────────────────── */
@page { size: 297mm 167mm; margin: 0; }
@media print {
  html, body { height: auto; background: ${t.contentBg}; overflow: visible; }
  .stage { position: static; display: block; }
  .slide {
    position: relative;
    width: 297mm; height: 167mm;
    aspect-ratio: auto;
    font-size: 3.09375mm; /* 297mm / 96 — same proportions as on screen */
    opacity: 1 !important;
    visibility: visible !important;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
    transition: none;
  }
  .deck-ui { display: none !important; }
  * { animation: none !important; transition: none !important; }
}
`
}

// ─────────────────────────────────────────────────────────────
// Slide renderers
// ─────────────────────────────────────────────────────────────

function renderCoverSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  // La banda inferior de la portada es un segundo mensaje, no un eco del que
  // ya está en el centro. La cadena anterior (`s.subtitle ?? o.subtitle ??
  // o.title`) empezaba justo por el subtítulo de la slide, que es el que se
  // acaba de pintar arriba — así que en el caso normal (portada CON subtítulo)
  // el mismo texto salía dos veces en la misma pantalla. Ahora se elige el
  // primer candidato que aporte algo distinto, y si no hay ninguno la banda
  // simplemente no se pinta.
  const shownSubtitle = (s.subtitle ?? '').trim()
  const strip =
    [o.subtitle, o.title, s.subtitle]
      .map((c) => (c ?? '').trim())
      .find((c) => c.length > 0 && c !== shownSubtitle) ?? ''
  const coverImage = slideImageUrl(s)
  const imageBg = coverImage
    ? `<div class="cover-image-bg deco" style="background-image:url('${esc(coverImage)}')"></div><div class="cover-image-overlay deco"></div>`
    : ''
  return `
<section class="slide slide-gradient on-dark">
  ${imageBg}
  ${glowOverlay(t)}
  ${coverImage ? '' : accentCircle(t, 12)}
  <div class="logo-bar">${brandMark(o.brand, 2.4, '#FFFFFF')}</div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4em 8em 1.5em;position:relative;z-index:2">
    <div class="eyebrow" style="justify-content:center">${esc(o.brand.clientName)}</div>
    <div class="slide-title-xl" style="max-width:13em">${esc(s.title)}</div>
    ${
      s.subtitle
        ? `<div class="slide-subtitle-muted" style="font-size:1.9em;max-width:24em;line-height:1.6">${esc(s.subtitle)}</div>`
        : ''
    }
  </div>
  ${strip ? `<div class="cover-strip"><span>${esc(strip)}</span></div>` : ''}
</section>`
}

function renderSectionSlide(s: DeckSlide, num: number, o: DeckOptions, t: DeckTheme): string {
  return `
<section class="slide slide-dark on-dark">
  ${accentCircle(t, 9)}
  <div class="section-num">${String(num).padStart(2, '0')}</div>
  <div class="logo-bar">${brandMark(o.brand, 2.2, t.primaryInk)}</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:4em 6em 6em;position:relative;z-index:2">
    <div class="eyebrow">${esc(s.subtitle ?? `Section ${String(num).padStart(2, '0')}`)}</div>
    <div class="slide-title-xl" style="max-width:12em;margin-bottom:0">${esc(s.title)}</div>
  </div>
</section>`
}

function renderContentSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  const bullets =
    s.bullets && s.bullets.length > 0
      ? `<ul class="bullet-list">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
      : ''
  const stats =
    s.stats && s.stats.length > 0
      ? `<div class="stat-inline-row">${s.stats
          .map(
            (st) => `
        <div class="stat-inline">
          <div class="stat-value">${esc(st.value)}</div>
          <div class="stat-label">${esc(st.label)}</div>
        </div>`
          )
          .join('')}</div>`
      : ''
  return `
<section class="slide slide-light">
  ${accentStripeTop(t)}
  ${accentCircle(t, 7)}
  <div class="logo-bar">${brandMark(o.brand, 2.2, t.ink)}</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:6em 6em 4em;position:relative;z-index:2">
    <div class="slide-title">${esc(s.title)}</div>
    ${s.subtitle ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>` : ''}
    ${s.body ? `<div class="slide-body">${s.body}</div>` : ''}
    ${bullets}
    ${stats}
  </div>
</section>`
}

function renderStatsSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  const stats = s.stats ?? []
  const cells = stats
    .map(
      (st) => `
    <div class="stat-cell">
      <div class="stat-value">${esc(st.value)}</div>
      <div class="stat-label">${esc(st.label)}</div>
    </div>`
    )
    .join('')
  return `
<section class="slide slide-dark on-dark">
  ${accentCircle(t, 8)}
  <div style="padding:3em 3em 0;position:relative;z-index:2;flex-shrink:0">
    <div style="margin-bottom:1.2em">${brandMark(o.brand, 2.2, t.primaryInk)}</div>
    ${s.subtitle ? `<div class="eyebrow">${esc(s.subtitle)}</div>` : ''}
    <div class="slide-title slide-title-onDark" style="font-size:3.6em;margin-bottom:0.2em">${esc(s.title)}</div>
    ${s.body ? `<div class="slide-body" style="font-size:1.5em">${s.body}</div>` : ''}
  </div>
  <div style="flex:1;display:flex;align-items:center;position:relative;z-index:2;padding:0 2em">
    <div class="stats-row">${cells}</div>
  </div>
</section>`
}

function renderClosingSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  return `
<section class="slide slide-gradient on-dark">
  ${glowOverlay(t)}
  ${accentCircle(t, 12)}
  <div class="deco" style="top:0;left:0;right:0;height:0.45em;background:${t.accent};z-index:5"></div>
  <div class="deco" style="bottom:0;left:0;right:0;height:0.45em;background:${t.accent};z-index:5"></div>
  <div class="logo-bar">${brandMark(o.brand, 2.4, '#FFFFFF')}</div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4em 8em;position:relative;z-index:2">
    <div class="slide-title-xl" style="font-size:5.4em;max-width:14em">${esc(s.title)}</div>
    ${
      s.subtitle
        ? `<div class="slide-subtitle-muted" style="font-size:1.8em;max-width:26em;line-height:1.65;margin-bottom:1em">${esc(s.subtitle)}</div>`
        : ''
    }
    ${s.body ? `<div class="slide-body on-dark" style="color:rgba(255,255,255,0.68)">${s.body}</div>` : ''}
    <div style="margin-top:1.5em;font-size:1.4em;color:rgba(255,255,255,0.45);font-weight:600">${esc(
      o.brand.clientName
    )}</div>
  </div>
</section>`
}

// ─────────────────────────────────────────────────────────────
// New layout renderers (timeline, comparison, quote, image,
// chart, agenda) — same brand-parametrized visual language
// ─────────────────────────────────────────────────────────────

function normalizeTimelineItems(items: DeckSlide['items']): DeckTimelineItem[] {
  if (!items) return []
  return items.map((it) =>
    typeof it === 'string' ? { label: '', title: it } : { label: it.label ?? '', title: it.title ?? '', body: it.body }
  )
}

function renderTimelineSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  const items = normalizeTimelineItems(s.items).slice(0, 6)
  const cells = items
    .map(
      (it) => `
    <div class="timeline-item">
      ${it.label ? `<div class="timeline-label">${esc(it.label)}</div>` : ''}
      <div class="timeline-title">${esc(it.title)}</div>
      ${it.body ? `<div class="timeline-body">${esc(it.body)}</div>` : ''}
    </div>`
    )
    .join('')
  return `
<section class="slide slide-light">
  ${accentStripeTop(t)}
  <div class="logo-bar">${brandMark(o.brand, 2.2, t.ink)}</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:6em 6em 4em;position:relative;z-index:2">
    <div class="slide-title">${esc(s.title)}</div>
    ${s.subtitle ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>` : ''}
    ${s.body ? `<div class="slide-body">${s.body}</div>` : ''}
    <div class="timeline-row">${cells}</div>
  </div>
</section>`
}

function renderComparisonSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  const col = (side: DeckComparisonSide | undefined, cls: string) => {
    if (!side) return ''
    const bullets = (side.bullets ?? [])
      .map((b) => `<li>${esc(b)}</li>`)
      .join('')
    return `
    <div class="compare-col ${cls}">
      <div class="compare-head">${esc(side.title)}</div>
      <ul class="bullet-list">${bullets}</ul>
    </div>`
  }
  return `
<section class="slide slide-light">
  ${accentStripeTop(t)}
  <div class="logo-bar">${brandMark(o.brand, 2.2, t.ink)}</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:6em 6em 4em;position:relative;z-index:2">
    <div class="slide-title">${esc(s.title)}</div>
    ${s.subtitle ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>` : ''}
    <div class="compare-row">${col(s.left, 'col-a')}${col(s.right, 'col-b')}</div>
  </div>
</section>`
}

function renderQuoteSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  const quote = s.quote ?? s.title
  return `
<section class="slide slide-gradient on-dark">
  ${glowOverlay(t)}
  ${ringsDecoration(t)}
  <div class="logo-bar">${brandMark(o.brand, 2.2, '#FFFFFF')}</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:4em 9em;position:relative;z-index:2">
    <div class="quote-mark">&ldquo;</div>
    <div class="quote-text">${esc(quote)}</div>
    ${s.author ? `<div class="quote-author">${esc(s.author)}</div>` : ''}
  </div>
</section>`
}

function renderImageSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  // Without an image URL, degrade gracefully to a content slide
  const imageSrc = slideImageUrl(s)
  if (!imageSrc) return renderContentSlide(s, o, t)
  const bullets =
    s.bullets && s.bullets.length > 0
      ? `<ul class="bullet-list">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
      : ''
  return `
<section class="slide slide-light">
  ${accentStripeTop(t)}
  <div class="image-split">
    <div class="image-half" style="background-image:url('${esc(imageSrc)}')"></div>
    <div class="image-content">
      <div style="margin-bottom:1.6em">${brandMark(o.brand, 2.2, t.ink)}</div>
      <div class="slide-title" style="font-size:3.8em">${esc(s.title)}</div>
      ${s.subtitle ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>` : ''}
      ${s.body ? `<div class="slide-body">${s.body}</div>` : ''}
      ${bullets}
    </div>
  </div>
</section>`
}

function renderChartSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme, chartId: string): string {
  return `
<section class="slide slide-light">
  ${accentStripeTop(t)}
  <div class="logo-bar">${brandMark(o.brand, 2.2, t.ink)}</div>
  <div style="flex:1;display:flex;flex-direction:column;padding:6em 6em 4em;position:relative;z-index:2;min-height:0">
    <div class="slide-title" style="font-size:3.8em">${esc(s.title)}</div>
    ${s.subtitle ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>` : ''}
    ${s.body ? `<div class="slide-body">${s.body}</div>` : ''}
    <div class="chart-box"><canvas id="${chartId}"></canvas></div>
  </div>
</section>`
}

function renderAgendaSlide(s: DeckSlide, o: DeckOptions, t: DeckTheme): string {
  const items = (s.items ?? [])
    .map((it) => (typeof it === 'string' ? it : it.title))
    .filter(Boolean)
    .slice(0, 8)
  const rows = items
    .map(
      (text, i) => `
    <div class="agenda-item">
      <div class="agenda-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="agenda-text">${esc(text)}</div>
    </div>`
    )
    .join('')
  return `
<section class="slide slide-light">
  ${accentStripeTop(t)}
  ${accentCircle(t, 7)}
  <div class="logo-bar">${brandMark(o.brand, 2.2, t.ink)}</div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:6em 6em 4em;position:relative;z-index:2">
    <div class="slide-title">${esc(s.title)}</div>
    ${s.subtitle ? `<div class="slide-subtitle">${esc(s.subtitle)}</div>` : ''}
    <div class="agenda-list">${rows}</div>
  </div>
</section>`
}

// ─────────────────────────────────────────────────────────────
// Chart.js wiring — CDN loaded only when the deck has charts
// ─────────────────────────────────────────────────────────────

interface DeckChartInstance {
  id: string
  chart: DeckChart
}

function buildChartConfig(chart: DeckChart, t: DeckTheme): Record<string, unknown> {
  const type = ['bar', 'line', 'doughnut'].includes(chart.type) ? chart.type : 'bar'
  const labels = (chart.labels ?? []).map(String)
  const data = (chart.data ?? []).map(Number)
  const doughnutPalette = labels.map((_, i) => mix(t.primary, t.accent, labels.length > 1 ? i / (labels.length - 1) : 0))
  const dataset =
    type === 'doughnut'
      ? { data, backgroundColor: doughnutPalette, borderColor: '#FFFFFF', borderWidth: 2 }
      : type === 'line'
        ? {
            data,
            borderColor: t.accentDark,
            backgroundColor: rgba(t.accent, 0.15),
            fill: true,
            tension: 0.35,
            pointBackgroundColor: t.accentDark,
            pointRadius: 4,
            borderWidth: 3,
          }
        : { data, backgroundColor: rgba(t.accent, 0.85), hoverBackgroundColor: t.accent, borderRadius: 6 }
  const scales =
    type === 'doughnut'
      ? undefined
      : {
          x: { grid: { display: false }, ticks: { color: rgba(t.ink, 0.65), font: { family: 'Inter', weight: 600 } } },
          y: {
            grid: { color: rgba(t.ink, 0.08) },
            border: { display: false },
            ticks: { color: rgba(t.ink, 0.5), font: { family: 'Inter' } },
          },
        }
  return {
    type,
    data: { labels, datasets: [dataset] },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend:
          type === 'doughnut'
            ? { position: 'right', labels: { color: rgba(t.ink, 0.75), font: { family: 'Inter', weight: 600 } } }
            : { display: false },
      },
      ...(scales ? { scales } : {}),
    },
  }
}

function buildChartScript(instances: DeckChartInstance[], t: DeckTheme): string {
  if (instances.length === 0) return ''
  const configs = instances.map((inst) => ({ id: inst.id, config: buildChartConfig(inst.chart, t) }))
  const json = JSON.stringify(configs).replace(/<\/script/gi, '<\\/script')
  return `
<script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<script>
(function () {
  var charts = ${json};
  var drawn = false;
  function draw() {
    // Chart.js va con defer: se ejecuta tras el parseo y antes de
    // DOMContentLoaded. El listener de 'load' es la red de seguridad por si la
    // CDN tarda; el flag evita pintar dos veces.
    if (drawn || typeof Chart === 'undefined') return;
    drawn = true;
    charts.forEach(function (c) {
      var el = document.getElementById(c.id);
      if (el) { try { new Chart(el, c.config); } catch (e) { /* chart failed, deck still works */ } }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', draw);
  } else {
    draw();
  }
  window.addEventListener('load', draw);
})();
</script>`
}

// ─────────────────────────────────────────────────────────────
// Navigation script (no template-literal interpolation inside)
// ─────────────────────────────────────────────────────────────

const NAV_SCRIPT = `
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var counter = document.getElementById('deck-counter');
  var current = 0;
  function show(n) {
    if (n < 0) n = 0;
    if (n > slides.length - 1) n = slides.length - 1;
    current = n;
    for (var k = 0; k < slides.length; k++) {
      slides[k].classList.toggle('active', k === current);
    }
    if (counter) counter.textContent = (current + 1) + ' / ' + slides.length;
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault(); show(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); show(current - 1);
    } else if (e.key === 'Home') {
      show(0);
    } else if (e.key === 'End') {
      show(slides.length - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });
  var zoneLeft = document.getElementById('deck-zone-left');
  var zoneRight = document.getElementById('deck-zone-right');
  if (zoneLeft) zoneLeft.addEventListener('click', function () { show(current - 1); });
  if (zoneRight) zoneRight.addEventListener('click', function () { show(current + 1); });
  document.addEventListener('dblclick', toggleFullscreen);
  show(0);
})();
`

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export function generateDeckHTML(options: DeckOptions): string {
  const t = buildDeckTheme(options.brand, options.mode ?? 'light')
  let sectionCount = 0
  const chartInstances: DeckChartInstance[] = []
  const slidesHtml = options.slides
    .map((slide) => {
      switch (slide.layout) {
        case 'cover':
          return renderCoverSlide(slide, options, t)
        case 'section':
          sectionCount += 1
          return renderSectionSlide(slide, sectionCount, options, t)
        case 'stats':
          return renderStatsSlide(slide, options, t)
        case 'closing':
          return renderClosingSlide(slide, options, t)
        case 'timeline':
          return renderTimelineSlide(slide, options, t)
        case 'comparison':
          return renderComparisonSlide(slide, options, t)
        case 'quote':
          return renderQuoteSlide(slide, options, t)
        case 'image':
          return renderImageSlide(slide, options, t)
        case 'agenda':
          return renderAgendaSlide(slide, options, t)
        case 'chart': {
          if (!slide.chart) return renderContentSlide(slide, options, t)
          const chartId = `deck-chart-${chartInstances.length}`
          chartInstances.push({ id: chartId, chart: slide.chart })
          return renderChartSlide(slide, options, t, chartId)
        }
        case 'content':
        default:
          return renderContentSlide(slide, options, t)
      }
    })
    .join('\n')

  // La primera slide se marca `active` YA en el HTML servido.
  //
  // Antes, NINGUNA slide llevaba la clase `active` en el documento que salía
  // del servidor: `.slide` es `opacity:0; visibility:hidden` y solo
  // `.slide.active` es visible, así que lo único que hacía aparecer la portada
  // era `show(0)` dentro del <script> inline del final. Si ese script no
  // llegaba a ejecutarse — CDN de Chart.js lenta o bloqueada, extensión del
  // navegador, red mala, JS desactivado — el usuario veía un rectángulo
  // completamente en blanco, sin ningún error y sin dejar rastro en logs.
  // Con esto el deck se ve siempre; el JS solo añade la navegación.
  const slidesHtmlWithFirstActive = slidesHtml.replace('class="slide ', 'class="slide active ')

  return `<!DOCTYPE html>
<html lang="${esc(options.lang || 'en')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(options.title)} | ${esc(options.brand.clientName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap">
<style>${buildCss(t)}</style>
</head>
<body>
<div class="stage">
${slidesHtmlWithFirstActive}
</div>
<div class="deck-ui deck-zone" id="deck-zone-left" title="Previous"></div>
<div class="deck-ui deck-zone" id="deck-zone-right" title="Next"></div>
<div class="deck-ui" id="deck-counter">1 / ${options.slides.length}</div>
<div class="deck-ui" id="deck-hint">&larr; &rarr; navigate &middot; F fullscreen</div>
${buildChartScript(chartInstances, t)}
<script>${NAV_SCRIPT}</script>
</body>
</html>`
}
