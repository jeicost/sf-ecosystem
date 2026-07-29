// Sistema de tema único de documentos (P3 Fase 2, 2026-07-29).
// Un modo claro/oscuro × color de marca que alimenta los motores de render.
// REGLA DE ORO: sin parámetro, cada motor conserva EXACTAMENTE su look actual
// (dark = paleta editorial de siempre; light = paleta del monthly/voice guide)
// — ningún export existente cambia si nadie elige nada.

export type DocMode = 'light' | 'dark'

export function normalizeDocMode(v: unknown): DocMode | null {
  return v === 'light' || v === 'dark' ? v : null
}

// ── Matemática de color compartida (consolida las copias de deck/playbook) ──

export function hexToRgbSafe(hex: string): { r: number; g: number; b: number } {
  const raw = String(hex ?? '').trim().replace(/^#/, '')
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return { r: 17, g: 24, b: 39 }
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbaOf(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgbSafe(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgbSafe(a)
  const cb = hexToRgbSafe(b)
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${ch(ca.r, cb.r)}${ch(ca.g, cb.g)}${ch(ca.b, cb.b)}`
}

export function luminanceOf(hex: string): number {
  const { r, g, b } = hexToRgbSafe(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

// ── Paleta del motor editorial (HTML de informes) ──

export interface EditorialPalette {
  bg: string // fondo de página (var --black histórica)
  ink: string // texto principal (var --cream histórica)
  footerBg: string
}

const EDITORIAL: Record<DocMode, EditorialPalette> = {
  // El look de siempre — intacto por defecto
  dark: { bg: '#1A1A1A', ink: '#F5F0E8', footerBg: '#0f0f0f' },
  // Papel cálido para imprimir/compartir en claro
  light: { bg: '#FAF9F7', ink: '#1A1A1A', footerBg: '#F1EFEA' },
}

export function editorialPalette(mode: DocMode = 'dark'): EditorialPalette {
  return EDITORIAL[mode] ?? EDITORIAL.dark
}

// ── Tokens de los decks PPTX (monthly / voice guide) — hex SIN '#' (pptxgenjs) ──

export interface PptxTokens {
  mode: DocMode
  paper: string // fondo de slide
  plate: string // tiles/plates de contraste
  inkStrong: string // titulares sobre paper
  ink: string // cuerpo sobre paper
  inkSoft: string
  inkMuted: string
  onPlate: string // texto sobre plate
  onPlateMuted: string
  surface: string // paneles suaves (cajas laterales, chips light)
  surfaceLine: string
  tableAlt: string // fila alterna de tablas
  tableLine: string
}

const PPTX: Record<DocMode, PptxTokens> = {
  // El look actual del monthly/voice guide — intacto por defecto
  light: {
    mode: 'light',
    paper: 'FFFFFF', plate: '111111',
    inkStrong: '111111', ink: '222222', inkSoft: '555555', inkMuted: '888888',
    onPlate: 'FFFFFF', onPlateMuted: 'CCCCCC',
    surface: 'F4F4F4', surfaceLine: 'DDDDDD',
    tableAlt: 'F7F7F7', tableLine: 'E3E3E3',
  },
  dark: {
    mode: 'dark',
    paper: '15151A', plate: 'F5F0E8',
    inkStrong: 'F5F0E8', ink: 'E4E0D8', inkSoft: 'B8B4AC', inkMuted: '8A8781',
    onPlate: '15151A', onPlateMuted: '4A4740',
    surface: '202026', surfaceLine: '33333B',
    tableAlt: '1C1C22', tableLine: '2E2E36',
  },
}

export function pptxTokens(mode: DocMode = 'light'): PptxTokens {
  return PPTX[mode] ?? PPTX.light
}
