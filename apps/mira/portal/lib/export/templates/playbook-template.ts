// Playbook HTML template — premium vertical report ("HubSpot Reports" language).
// Ported from the Python playbook renderer: dark primary section bands alternating
// with warm cream content, massive bold typography, corner arc decorations,
// stat boxes, accent tip boxes, numbered steps and clean tables.
// Fully brand-parametrized: every color derives from PlaybookBrand — nothing hardcoded.
// Pure function: options in, standalone HTML string out. Print-ready (A4, margin 0).

export interface PlaybookBrand {
  clientName: string
  primaryColor: string
  accentColor?: string
  logoUrl?: string | null
}

export interface PlaybookSection {
  title: string
  body?: string // HTML — inserted as-is
  stats?: { value: string; label: string }[]
  tips?: string[]
  steps?: { title: string; body: string }[] // step body is HTML — inserted as-is
  table?: { headers: string[]; rows: string[][] }
  /** Presupuesto o planes por tramo — pricing cards. */
  tiers?: { name: string; price: string; includes?: string[] }[]
  /** Embudo de conversión — etapas con ancho visual decreciente. */
  funnel?: { stage: string; description?: string }[]
  /** Calendario/cronograma — columnas por periodo. */
  timeline?: { period: string; items: string[] }[]
  /** Lista marcable — distinta de "tips" (tareas, no consejos). */
  checklist?: { item: string; note?: string }[]
  /** Tabla con estado por fila (bien/en riesgo/mal). */
  statusTable?: { headers: string[]; rows: { cells: string[]; status?: 'good' | 'warning' | 'critical' }[] }
}

export interface PlaybookOptions {
  mode?: 'light' | 'dark'
  brand: PlaybookBrand
  docLabel?: string // etiqueta de portada/footer (default "Playbook")
  title: string
  subtitle?: string
  sections: PlaybookSection[]
  // One-pager mode: sin índice ni contraportada, todas las secciones
  // apiladas en UNA sola página con tipografía compacta.
  compact?: boolean
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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

/** Mixes color a towards color b by t (0..1). Returns hex. */
function mix(a: string, b: string, t: number): string {
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

/** Readable ink color for text placed on top of the given background. */
function inkOn(bg: string, darkCandidate: string): string {
  if (luminance(bg) < 0.5) return '#FFFFFF'
  return luminance(darkCandidate) < 0.55 ? darkCandidate : '#1F2430'
}

interface PlaybookTheme {
  primary: string
  accent: string
  accentDark: string
  cream: string
  ink: string
  accentInk: string // text on accent backgrounds
  primaryInk: string // text on primary backgrounds
}

function buildTheme(brand: PlaybookBrand, mode: 'light' | 'dark' = 'light'): PlaybookTheme {
  const primary = brand.primaryColor
  const accent = brand.accentColor ?? mix(primary, '#FFFFFF', 0.55)
  return {
    primary,
    accent,
    accentDark: mix(accent, '#000000', 0.35),
    // P3: en oscuro las páginas cream pasan a superficie oscura con tinta clara
    cream: mode === 'dark' ? '#17171B' : '#F5F2EB',
    // Ink for cream/light pages — guard against light primaries.
    ink: mode === 'dark' ? '#F5F0E8' : (luminance(primary) < 0.55 ? primary : mix(primary, '#000000', 0.6)),
    accentInk: inkOn(accent, primary),
    primaryInk: inkOn(primary, primary),
  }
}

// ─────────────────────────────────────────────────────────────
// Decorative SVG (ported corner arcs, accent-tinted)
// ─────────────────────────────────────────────────────────────

function arcTopRight(t: PlaybookTheme, size = 110): string {
  const w = size
  const c = [t.accent, mix(t.accent, t.primary, 0.35), t.accentDark]
  const arc = (radius: number, color: string) =>
    `<path d="M ${w} ${Math.round(w * radius)} A ${Math.round(w * radius)} ${Math.round(
      w * radius
    )} 0 0 0 ${Math.round(w * (1 - radius))} 0" fill="none" stroke="${color}" stroke-width="8" opacity="0.9"/>`
  return `<svg class="deco" style="top:0;right:0" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" xmlns="http://www.w3.org/2000/svg" overflow="visible">${arc(
    0.55,
    c[0]
  )}${arc(0.75, c[1])}${arc(0.95, c[2])}</svg>`
}

function arcBottomLeft(t: PlaybookTheme, size = 90): string {
  const w = size
  const c = [t.accent, mix(t.accent, t.primary, 0.35), t.accentDark]
  const arc = (radius: number, color: string) =>
    `<path d="M 0 ${Math.round(w * (1 - radius))} A ${Math.round(w * radius)} ${Math.round(
      w * radius
    )} 0 0 1 ${Math.round(w * radius)} ${w}" fill="none" stroke="${color}" stroke-width="8" opacity="0.9"/>`
  return `<svg class="deco" style="bottom:0;left:0" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" xmlns="http://www.w3.org/2000/svg" overflow="visible">${arc(
    0.55,
    c[0]
  )}${arc(0.75, c[1])}${arc(0.95, c[2])}</svg>`
}

function brandMark(brand: PlaybookBrand, height: number, color: string): string {
  if (brand.logoUrl) {
    return `<img src="${esc(brand.logoUrl)}" alt="${esc(
      brand.clientName
    )}" style="height:${height}px;width:auto;display:inline-block;vertical-align:middle"/>`
  }
  return `<span style="font-weight:800;letter-spacing:-0.5px;font-size:${Math.round(
    height * 0.7
  )}px;color:${color}">${esc(brand.clientName)}</span>`
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

function buildCss(t: PlaybookTheme): string {
  return `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

html { background: #E9E7E1; }
body {
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  background: #E9E7E1;
}

.deco { position: absolute; pointer-events: none; }

/* ── PAGE BASE ─────────────────────────────────────────────── */
.page {
  width: 210mm;
  min-height: 297mm;
  position: relative;
  background: ${t.cream};
  color: ${t.ink};
  margin: 0 auto 8mm;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  page-break-after: always;
  break-after: page;
}
.dark-page {
  background: ${t.primary};
  color: ${t.primaryInk};
  display: flex;
  flex-direction: column;
  height: 297mm;
  padding: 15mm 16mm;
  overflow: hidden;
}
.light-page { padding: 0 0 20mm 0; }

/* ── PAGE HEADER / FOOTER (light pages) ────────────────────── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 16mm 8px;
  border-top: 3px solid ${t.accent};
}
.page-header-section {
  font-size: 7pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: 2px; color: ${t.ink}; opacity: 0.55;
}
.page-header-logo { opacity: 0.45; }
.page-body { padding: 0 16mm; }
.page-footer {
  position: absolute;
  bottom: 8mm; left: 16mm; right: 16mm;
  display: flex; justify-content: space-between;
  font-size: 7pt; color: ${t.ink}; opacity: 0.35;
  border-top: 1px solid ${rgba(t.primary, 0.12)};
  padding-top: 5px;
}

/* ── COVER ─────────────────────────────────────────────────── */
.cover-top {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 9mm;
  border-bottom: 1px solid ${rgba('#FFFFFF', 0.08)};
}
.cover-badge {
  background: ${rgba(t.accent, 0.12)};
  border: 1px solid ${rgba(t.accent, 0.28)};
  color: ${t.accent};
  font-size: 7pt; font-weight: 700; padding: 5px 13px;
  border-radius: 20px; letter-spacing: 1.5px; text-transform: uppercase;
}
.cover-hero {
  flex: 1; display: flex; flex-direction: column;
  justify-content: flex-end; padding-bottom: 13mm;
}
.eyebrow {
  font-size: 8pt; font-weight: 700; letter-spacing: 3px;
  text-transform: uppercase; color: ${t.accent};
  margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
}
.eyebrow::before {
  content: ''; display: inline-block; width: 26px; height: 2px;
  background: ${t.accent}; border-radius: 1px;
}
.cover-title {
  font-size: 31pt; font-weight: 900; line-height: 1.08;
  letter-spacing: -1px; margin-bottom: 14px; max-width: 165mm;
}
.cover-subtitle {
  font-size: 11pt; font-weight: 400; color: ${rgba('#FFFFFF', 0.6)};
  line-height: 1.6; max-width: 148mm; margin-bottom: 22px;
}
.cover-divider {
  width: 38px; height: 3px; background: ${t.accent};
  border-radius: 2px; margin-bottom: 6mm;
}
.cover-footer-strip {
  background: ${t.accent};
  margin: 0 -16mm;
  padding: 10px 16mm;
  display: flex; justify-content: space-between; align-items: center;
  margin-top: auto;
}
.cover-footer-strip span { font-size: 8.5pt; font-weight: 700; color: ${t.accentInk}; }

/* ── TOC ───────────────────────────────────────────────────── */
.toc-dark {
  background: ${t.primary};
  padding: 14mm 16mm 12mm;
  display: flex; justify-content: space-between; align-items: flex-end;
  position: relative; overflow: hidden;
}
.toc-dark-title {
  font-size: 26pt; font-weight: 900; color: ${t.primaryInk};
  letter-spacing: -0.8px; line-height: 1;
}
.toc-cream { padding: 10mm 16mm 16mm; }
.toc-entry {
  display: flex; align-items: center;
  padding: 9px 10px; border-radius: 7px;
  color: ${t.ink}; text-decoration: none;
}
.toc-num {
  width: 26px; height: 26px; background: ${t.primary}; color: ${t.primaryInk};
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 8.5pt; font-weight: 800; flex-shrink: 0; margin-right: 11px;
}
.toc-entry.accent-num .toc-num { background: ${t.accent}; color: ${t.accentInk}; }
.toc-section-title { font-size: 10.5pt; font-weight: 600; line-height: 1.25; }
.toc-arrow { color: ${rgba(t.primary, 0.25)}; font-size: 12pt; margin-left: auto; padding-left: 8px; }

/* ── SECTION OPENER BAND ───────────────────────────────────── */
.opener-band {
  background: ${t.primary};
  color: ${t.primaryInk};
  padding: 12mm 16mm 11mm;
  position: relative;
  overflow: hidden;
  margin-bottom: 8mm;
}
.opener-num {
  position: absolute; top: 4mm; right: 12mm;
  font-size: 52pt; font-weight: 900; color: ${t.accent};
  opacity: 0.18; line-height: 1; letter-spacing: -3px;
}
.opener-title {
  font-size: 22pt; font-weight: 900; line-height: 1.12;
  letter-spacing: -0.5px; max-width: 150mm; color: ${t.primaryInk};
}

/* ── CONTENT ───────────────────────────────────────────────── */
.body-text {
  font-size: 10pt; line-height: 1.75;
  color: ${rgba(t.ink, 0.85)}; margin-bottom: 4mm;
}
.body-text p { margin-bottom: 3mm; }
.body-text strong { color: ${t.ink}; }
.body-text ul, .body-text ol { margin: 2mm 0 3mm 6mm; }
.body-text li { margin-bottom: 1.5mm; }
.body-text h3, .body-text h4 {
  font-size: 12.5pt; font-weight: 700; color: ${t.ink};
  margin: 5mm 0 2.5mm; letter-spacing: -0.2px;
}
.body-text a { color: ${t.accentDark}; }

/* ── STAT BOXES ────────────────────────────────────────────── */
.stat-row { display: flex; gap: 10px; margin: 5mm 0; }
.stat-box {
  flex: 1;
  background: ${t.primary};
  border-radius: 10px;
  padding: 16px 18px;
  margin: 0;
  page-break-inside: avoid;
  break-inside: avoid;
  text-align: center;
}
.stat-box.solo { margin: 5mm 0; }
.stat-value {
  font-size: 34pt; font-weight: 900; color: ${t.accent};
  line-height: 1; letter-spacing: -2px; margin-bottom: 7px;
}
.stat-label { font-size: 9.5pt; color: ${rgba('#FFFFFF', 0.82)}; font-weight: 500; line-height: 1.4; }

/* ── TIP BOX ───────────────────────────────────────────────── */
.tip-box {
  background: ${t.primary};
  border-left: 4px solid ${t.accent};
  border-radius: 10px;
  padding: 14px 16px;
  margin: 5mm 0;
  page-break-inside: avoid;
  break-inside: avoid;
}
.tip-box-label {
  font-size: 7.5pt; font-weight: 800; text-transform: uppercase;
  letter-spacing: 1.5px; color: ${t.accent}; margin-bottom: 7px;
  display: flex; align-items: center; gap: 6px;
}
.tip-box-label::before {
  content: ''; display: inline-block; width: 14px; height: 2px; background: ${t.accent};
}
.tip-box-content { font-size: 10pt; color: ${rgba('#FFFFFF', 0.88)}; line-height: 1.65; }

/* ── NUMBERED STEPS ────────────────────────────────────────── */
.step-list { margin: 4mm 0; }
.step-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding-bottom: 12px; margin-bottom: 12px;
  border-bottom: 1px solid ${rgba(t.primary, 0.08)};
  page-break-inside: avoid;
  break-inside: avoid;
}
.step-item:last-child { border-bottom: none; margin-bottom: 0; }
.step-num {
  font-size: 20pt; font-weight: 900; color: ${t.accent};
  line-height: 1; flex-shrink: 0; min-width: 30px;
}
.step-title { font-size: 11pt; font-weight: 700; color: ${t.ink}; margin-bottom: 3px; letter-spacing: -0.2px; }
.step-text { font-size: 10pt; color: ${rgba(t.ink, 0.85)}; line-height: 1.65; }

/* ── TABLE ─────────────────────────────────────────────────── */
.data-table {
  width: 100%; border-collapse: collapse; margin: 5mm 0;
  page-break-inside: avoid; break-inside: avoid;
}
.data-table th {
  background: ${t.primary}; color: ${t.primaryInk};
  padding: 9px 13px; text-align: left; font-size: 8.5pt; font-weight: 700;
}
.data-table th:first-child { border-radius: 7px 0 0 0; }
.data-table th:last-child { border-radius: 0 7px 0 0; }
.data-table td {
  padding: 9px 13px; font-size: 9pt; color: ${t.ink};
  border-bottom: 1px solid ${rgba(t.primary, 0.08)}; line-height: 1.5;
}
.data-table tr:nth-child(even) td { background: ${rgba(t.primary, 0.03)}; }
.data-table tr:last-child td { border-bottom: none; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 7px; vertical-align: middle; }

/* ── TIERS (pricing cards) ─────────────────────────────────── */
.tiers-row { display: flex; gap: 10px; margin: 5mm 0; flex-wrap: wrap; }
.tier-card {
  flex: 1; min-width: 42mm;
  background: ${t.cream}; border: 1px solid ${rgba(t.primary, 0.15)};
  border-radius: 10px; padding: 14px 16px;
  page-break-inside: avoid; break-inside: avoid;
}
.tier-name { font-size: 8.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${t.accentDark}; margin-bottom: 6px; }
.tier-price { font-size: 20pt; font-weight: 900; color: ${t.ink}; letter-spacing: -1px; margin-bottom: 8px; }
.tier-includes { list-style: none; margin: 0; padding: 0; }
.tier-includes li { font-size: 8.5pt; color: ${rgba(t.ink, 0.8)}; padding: 3px 0 3px 14px; position: relative; line-height: 1.45; }
.tier-includes li::before { content: '\\2713'; position: absolute; left: 0; color: ${t.accent}; font-weight: 700; }

/* ── FUNNEL (conversion funnel, decreasing width) ─────────────── */
.funnel { margin: 5mm 0; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.funnel-stage {
  background: ${t.primary}; color: ${t.primaryInk};
  border-radius: 8px; padding: 10px 16px; text-align: center;
  page-break-inside: avoid; break-inside: avoid;
}
.funnel-stage-title { font-size: 9.5pt; font-weight: 800; letter-spacing: 0.3px; }
.funnel-stage-desc { font-size: 8pt; opacity: 0.75; margin-top: 3px; line-height: 1.45; }

/* ── TIMELINE (cronograma en columnas por periodo) ────────────── */
.timeline-row { display: flex; gap: 8px; margin: 5mm 0; flex-wrap: wrap; }
.timeline-col {
  flex: 1; min-width: 34mm;
  border-top: 3px solid ${t.accent};
  padding-top: 8px;
  page-break-inside: avoid; break-inside: avoid;
}
.timeline-period { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${t.accentDark}; margin-bottom: 6px; }
.timeline-items { list-style: none; margin: 0; padding: 0; }
.timeline-items li { font-size: 8.5pt; color: ${rgba(t.ink, 0.85)}; padding: 3px 0; line-height: 1.4; border-bottom: 1px solid ${rgba(t.primary, 0.06)}; }
.timeline-items li:last-child { border-bottom: none; }

/* ── CHECKLIST (tareas marcables, distinto de tips) ───────────── */
.checklist { margin: 4mm 0; }
.checklist-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 6px 0;
  border-bottom: 1px solid ${rgba(t.primary, 0.06)};
  page-break-inside: avoid; break-inside: avoid;
}
.checklist-item:last-child { border-bottom: none; }
.checklist-box { width: 13px; height: 13px; border: 2px solid ${t.accent}; border-radius: 4px; flex-shrink: 0; margin-top: 2px; }
.checklist-text { font-size: 9.5pt; color: ${t.ink}; line-height: 1.5; }
.checklist-note { font-size: 8pt; color: ${rgba(t.ink, 0.6)}; margin-top: 2px; }

/* ── BACK COVER ────────────────────────────────────────────── */
.back-cover-strip { position: absolute; left: 0; right: 0; height: 5px; background: ${t.accent}; }
.back-tagline { font-size: 11pt; color: ${rgba('#FFFFFF', 0.55)}; margin-top: 14px; }

/* ── COMPACT (one-pager) ───────────────────────────────────── */
.compact-hero {
  background: ${t.primary};
  color: ${t.primaryInk};
  padding: 8mm 12mm 7mm;
  position: relative;
  overflow: hidden;
}
.compact-hero .eyebrow { margin-bottom: 6px; }
.compact-title {
  font-size: 19pt; font-weight: 900; line-height: 1.1;
  letter-spacing: -0.6px; color: ${t.primaryInk}; max-width: 165mm;
}
.compact-subtitle {
  font-size: 9.5pt; color: ${rgba('#FFFFFF', 0.65)};
  line-height: 1.5; margin-top: 4px; max-width: 160mm;
}
.compact-body { padding: 6mm 12mm 8mm; }
.compact-section { margin-bottom: 5mm; page-break-inside: avoid; break-inside: avoid; }
.compact-section:last-child { margin-bottom: 0; }
.compact-section-title {
  font-size: 10.5pt; font-weight: 800; color: ${t.ink};
  letter-spacing: -0.2px; margin-bottom: 2mm;
  display: flex; align-items: center; gap: 7px;
}
.compact-section-title::before {
  content: ''; display: inline-block; width: 16px; height: 3px;
  background: ${t.accent}; border-radius: 2px; flex-shrink: 0;
}
.compact-section .body-text { font-size: 8.5pt; line-height: 1.6; margin-bottom: 2mm; }
.compact-section .body-text p { margin-bottom: 1.5mm; }
.compact-section .stat-row { gap: 7px; margin: 2.5mm 0; }
.compact-section .stat-box { padding: 9px 10px; border-radius: 8px; }
.compact-section .stat-box.solo { margin: 2.5mm 0; }
.compact-section .stat-value { font-size: 17pt; letter-spacing: -1px; margin-bottom: 3px; }
.compact-section .stat-label { font-size: 7.5pt; }
.compact-section .tip-box { padding: 8px 11px; margin: 2.5mm 0; border-radius: 8px; }
.compact-section .tip-box-label { font-size: 6.5pt; margin-bottom: 4px; }
.compact-section .tip-box-content { font-size: 8.5pt; line-height: 1.5; }
.compact-section .step-list { margin: 2mm 0; }
.compact-section .step-item { gap: 8px; padding-bottom: 6px; margin-bottom: 6px; }
.compact-section .step-num { font-size: 12pt; min-width: 20px; }
.compact-section .step-title { font-size: 9pt; margin-bottom: 1px; }
.compact-section .step-text { font-size: 8.5pt; line-height: 1.5; }
.compact-section .data-table { margin: 2.5mm 0; }
.compact-section .data-table th { padding: 5px 8px; font-size: 7pt; }
.compact-section .data-table td { padding: 5px 8px; font-size: 7.5pt; }
.compact-section .tiers-row { gap: 6px; margin: 2.5mm 0; }
.compact-section .tier-card { min-width: 34mm; padding: 8px 10px; border-radius: 8px; }
.compact-section .tier-name { font-size: 6.5pt; margin-bottom: 3px; }
.compact-section .tier-price { font-size: 13pt; margin-bottom: 4px; }
.compact-section .tier-includes li { font-size: 7pt; padding: 2px 0 2px 12px; }
.compact-section .funnel { gap: 3px; margin: 2.5mm 0; }
.compact-section .funnel-stage { padding: 6px 10px; border-radius: 6px; }
.compact-section .funnel-stage-title { font-size: 7.5pt; }
.compact-section .funnel-stage-desc { font-size: 6.5pt; margin-top: 2px; }
.compact-section .timeline-row { gap: 5px; margin: 2.5mm 0; }
.compact-section .timeline-col { min-width: 26mm; padding-top: 5px; }
.compact-section .timeline-period { font-size: 6.5pt; margin-bottom: 3px; }
.compact-section .timeline-items li { font-size: 7pt; padding: 2px 0; }
.compact-section .checklist { margin: 2mm 0; }
.compact-section .checklist-item { gap: 7px; padding: 4px 0; }
.compact-section .checklist-box { width: 10px; height: 10px; }
.compact-section .checklist-text { font-size: 7.5pt; }
.compact-section .checklist-note { font-size: 6.5pt; }
.compact-footer-strip {
  background: ${t.accent};
  padding: 6px 12mm;
  display: flex; justify-content: space-between; align-items: center;
  position: absolute; bottom: 0; left: 0; right: 0;
}
.compact-footer-strip span { font-size: 7pt; font-weight: 700; color: ${t.accentInk}; }

/* ── PRINT ─────────────────────────────────────────────────── */
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #fff; }
  .page { margin: 0; box-shadow: none; }
  * { animation: none !important; transition: none !important; }
  .stat-box, .tip-box, .step-item, .data-table, .toc-entry { page-break-inside: avoid; break-inside: avoid; }
  a { text-decoration: none; color: inherit; }
}
`
}

// ─────────────────────────────────────────────────────────────
// Page builders
// ─────────────────────────────────────────────────────────────

function renderCover(o: PlaybookOptions, t: PlaybookTheme): string {
  const b = o.brand
  const docLabel = o.docLabel || 'Playbook'
  return `
<div class="page dark-page">
  ${arcTopRight(t, 130)}
  <div class="cover-top">
    <div>${brandMark(b, 26, t.primaryInk)}</div>
    <div class="cover-badge">${esc(docLabel)}</div>
  </div>
  <div class="cover-hero">
    <div class="eyebrow">${esc(b.clientName)}</div>
    <div class="cover-title">${esc(o.title)}</div>
    ${o.subtitle ? `<div class="cover-subtitle">${esc(o.subtitle)}</div>` : ''}
    <div class="cover-divider"></div>
  </div>
  <div class="cover-footer-strip">
    <span>${esc(b.clientName)}</span>
    <span>${esc(docLabel)}</span>
  </div>
</div>`
}

function renderToc(o: PlaybookOptions, t: PlaybookTheme): string {
  const entries = o.sections
    .map((sec, i) => {
      const num = String(i + 1).padStart(2, '0')
      const accentCls = (i + 1) % 3 === 0 ? ' accent-num' : ''
      return `
      <a class="toc-entry${accentCls}" href="#seccion-${i + 1}">
        <div class="toc-num">${num}</div>
        <div class="toc-section-title">${esc(sec.title)}</div>
        <div class="toc-arrow">&rsaquo;</div>
      </a>`
    })
    .join('')

  return `
<div class="page light-page">
  <div class="toc-dark">
    ${arcTopRight(t, 90)}
    <div>
      <div class="eyebrow" style="margin-bottom:8px">Contents</div>
      <div class="toc-dark-title">Table of Contents</div>
    </div>
    <div style="opacity:0.4">${brandMark(o.brand, 20, t.primaryInk)}</div>
  </div>
  <div class="toc-cream">${entries}</div>
  <div class="page-footer">
    <span>${esc(o.brand.clientName)}</span>
    <span>${esc(o.title)}</span>
  </div>
</div>`
}

function renderStats(stats: { value: string; label: string }[]): string {
  if (stats.length === 0) return ''
  const box = (s: { value: string; label: string }) => `
    <div class="stat-box">
      <div class="stat-value">${esc(s.value)}</div>
      <div class="stat-label">${esc(s.label)}</div>
    </div>`
  if (stats.length === 1) {
    return `<div class="stat-box solo">
      <div class="stat-value">${esc(stats[0].value)}</div>
      <div class="stat-label">${esc(stats[0].label)}</div>
    </div>`
  }
  // Chunk into rows of two; an odd trailing stat spans the full width.
  const rows: string[] = []
  for (let i = 0; i < stats.length; i += 2) {
    const pair = stats.slice(i, i + 2)
    rows.push(`<div class="stat-row">${pair.map(box).join('')}</div>`)
  }
  return rows.join('')
}

function renderTips(tips: string[], clientName: string): string {
  return tips
    .map(
      (tip) => `
    <div class="tip-box">
      <div class="tip-box-label">Tip ${esc(clientName)}</div>
      <div class="tip-box-content">${esc(tip)}</div>
    </div>`
    )
    .join('')
}

function renderSteps(steps: { title: string; body: string }[]): string {
  const items = steps
    .map(
      (step, i) => `
    <div class="step-item">
      <div class="step-num">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <div class="step-title">${esc(step.title)}</div>
        <div class="step-text">${step.body}</div>
      </div>
    </div>`
    )
    .join('')
  return `<div class="step-list">${items}</div>`
}

function renderTable(table: { headers: string[]; rows: string[][] }): string {
  const head = table.headers.map((h) => `<th>${esc(h)}</th>`).join('')
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`)
    .join('')
  return `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function renderTiers(tiers: { name: string; price: string; includes?: string[] }[]): string {
  if (tiers.length === 0) return ''
  const cards = tiers
    .map(
      (tier) => `
    <div class="tier-card">
      <div class="tier-name">${esc(tier.name)}</div>
      <div class="tier-price">${esc(tier.price)}</div>
      ${
        tier.includes && tier.includes.length > 0
          ? `<ul class="tier-includes">${tier.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
          : ''
      }
    </div>`
    )
    .join('')
  return `<div class="tiers-row">${cards}</div>`
}

function renderFunnel(stages: { stage: string; description?: string }[]): string {
  if (stages.length === 0) return ''
  const n = stages.length
  const minWidth = 42
  const items = stages
    .map((s, i) => {
      const width = n <= 1 ? 100 : Math.round(100 - (i * (100 - minWidth)) / (n - 1))
      return `
    <div class="funnel-stage" style="width:${width}%">
      <div class="funnel-stage-title">${esc(s.stage)}</div>
      ${s.description ? `<div class="funnel-stage-desc">${esc(s.description)}</div>` : ''}
    </div>`
    })
    .join('')
  return `<div class="funnel">${items}</div>`
}

function renderTimeline(periods: { period: string; items: string[] }[]): string {
  if (periods.length === 0) return ''
  const cols = periods
    .map(
      (p) => `
    <div class="timeline-col">
      <div class="timeline-period">${esc(p.period)}</div>
      <ul class="timeline-items">${(p.items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>`
    )
    .join('')
  return `<div class="timeline-row">${cols}</div>`
}

function renderChecklist(items: { item: string; note?: string }[]): string {
  if (items.length === 0) return ''
  const rows = items
    .map(
      (it) => `
    <div class="checklist-item">
      <div class="checklist-box"></div>
      <div>
        <div class="checklist-text">${esc(it.item)}</div>
        ${it.note ? `<div class="checklist-note">${esc(it.note)}</div>` : ''}
      </div>
    </div>`
    )
    .join('')
  return `<div class="checklist">${rows}</div>`
}

const STATUS_DOT_COLOR: Record<string, string> = {
  good: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
}

function renderStatusTable(table: {
  headers: string[]
  rows: { cells: string[]; status?: 'good' | 'warning' | 'critical' }[]
}): string {
  const head = table.headers.map((h) => `<th>${esc(h)}</th>`).join('')
  const body = table.rows
    .map((row) => {
      const color = STATUS_DOT_COLOR[row.status ?? ''] ?? '#9CA3AF'
      const cells = row.cells
        .map((cell, i) =>
          i === 0
            ? `<td><span class="status-dot" style="background:${color}"></span>${esc(cell)}</td>`
            : `<td>${esc(cell)}</td>`
        )
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
  return `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function renderSection(sec: PlaybookSection, num: number, o: PlaybookOptions, t: PlaybookTheme): string {
  const label = `Section ${String(num).padStart(2, '0')}`
  return `
<div class="page light-page" id="seccion-${num}">
  <div class="page-header">
    <span class="page-header-section">${label} &mdash; ${esc(sec.title)}</span>
    <span class="page-header-logo">${brandMark(o.brand, 16, t.ink)}</span>
  </div>
  <div class="opener-band">
    ${arcTopRight(t, 80)}
    ${arcBottomLeft(t, 60)}
    <div class="eyebrow" style="margin-bottom:10px">${label}</div>
    <div class="opener-title">${esc(sec.title)}</div>
    <div class="opener-num">${String(num).padStart(2, '0')}</div>
  </div>
  <div class="page-body">
    ${sec.body ? `<div class="body-text">${sec.body}</div>` : ''}
    ${sec.stats ? renderStats(sec.stats) : ''}
    ${sec.tiers && sec.tiers.length > 0 ? renderTiers(sec.tiers) : ''}
    ${sec.funnel && sec.funnel.length > 0 ? renderFunnel(sec.funnel) : ''}
    ${sec.timeline && sec.timeline.length > 0 ? renderTimeline(sec.timeline) : ''}
    ${sec.steps && sec.steps.length > 0 ? renderSteps(sec.steps) : ''}
    ${sec.checklist && sec.checklist.length > 0 ? renderChecklist(sec.checklist) : ''}
    ${sec.table ? renderTable(sec.table) : ''}
    ${sec.statusTable ? renderStatusTable(sec.statusTable) : ''}
    ${sec.tips ? renderTips(sec.tips, o.brand.clientName) : ''}
  </div>
  <div class="page-footer">
    <span>${esc(o.brand.clientName)}</span>
    <span>${esc(o.title)}</span>
  </div>
</div>`
}

function renderBackCover(o: PlaybookOptions, t: PlaybookTheme): string {
  return `
<div class="page dark-page" style="justify-content:center;align-items:center;text-align:center">
  <div class="back-cover-strip" style="top:0"></div>
  ${arcTopRight(t, 90)}
  <div>${brandMark(o.brand, 34, t.primaryInk)}</div>
  <div class="back-tagline">${esc(o.title)}</div>
  <div style="width:40px;height:3px;background:${t.accent};border-radius:2px;margin:18px auto 0"></div>
  <div class="back-cover-strip" style="bottom:0"></div>
</div>`
}

// ─────────────────────────────────────────────────────────────
// Compact one-pager: a single page with all sections stacked
// ─────────────────────────────────────────────────────────────

function renderCompactPage(o: PlaybookOptions, t: PlaybookTheme): string {
  const docLabel = o.docLabel || 'One-Pager'
  const sections = o.sections
    .map(
      (sec) => `
    <div class="compact-section">
      <div class="compact-section-title">${esc(sec.title)}</div>
      ${sec.body ? `<div class="body-text">${sec.body}</div>` : ''}
      ${sec.stats ? renderStats(sec.stats) : ''}
      ${sec.tiers && sec.tiers.length > 0 ? renderTiers(sec.tiers) : ''}
      ${sec.funnel && sec.funnel.length > 0 ? renderFunnel(sec.funnel) : ''}
      ${sec.timeline && sec.timeline.length > 0 ? renderTimeline(sec.timeline) : ''}
      ${sec.steps && sec.steps.length > 0 ? renderSteps(sec.steps) : ''}
      ${sec.checklist && sec.checklist.length > 0 ? renderChecklist(sec.checklist) : ''}
      ${sec.table ? renderTable(sec.table) : ''}
      ${sec.statusTable ? renderStatusTable(sec.statusTable) : ''}
      ${sec.tips ? renderTips(sec.tips, o.brand.clientName) : ''}
    </div>`
    )
    .join('')

  return `
<div class="page light-page" style="padding-bottom:14mm">
  <div class="compact-hero">
    ${arcTopRight(t, 70)}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5mm">
      <div>${brandMark(o.brand, 20, t.primaryInk)}</div>
      <div class="cover-badge">${esc(docLabel)}</div>
    </div>
    <div class="compact-title">${esc(o.title)}</div>
    ${o.subtitle ? `<div class="compact-subtitle">${esc(o.subtitle)}</div>` : ''}
  </div>
  <div class="compact-body">${sections}</div>
  <div class="compact-footer-strip">
    <span>${esc(o.brand.clientName)}</span>
    <span>${esc(docLabel)}</span>
  </div>
</div>`
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export function generatePlaybookHTML(options: PlaybookOptions): string {
  const t = buildTheme(options.brand, options.mode ?? 'light')

  // Compact mode (one-pager): no cover spread, no TOC, no back cover —
  // a single page with the hero band and all sections stacked.
  const bodyHtml = options.compact
    ? renderCompactPage(options, t)
    : `${renderCover(options, t)}
${renderToc(options, t)}
${options.sections.map((sec, i) => renderSection(sec, i + 1, options, t)).join('')}
${renderBackCover(options, t)}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(options.title)} | ${esc(options.brand.clientName)}</title>
<style>${buildCss(t)}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}
