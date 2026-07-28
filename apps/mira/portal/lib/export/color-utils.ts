// Conversión determinista hex → RGB/CMYK para paletas de brand book.
// El modelo NUNCA escribe rgb/cmyk (los inventa mal — hallazgo del audit de
// consistencia C.1 del método del CEO): aquí se calculan post-parse en TS.

export interface PaletteEntryEnriched {
  rgb?: { r: number; g: number; b: number }
  rgb_css?: string
  cmyk?: { c: number; m: number; y: number; k: number }
  cmyk_label?: string
  [key: string]: unknown
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

/** Fórmula estándar RGB→CMYK (porcentajes enteros 0-100). */
export function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 }
  const c = (1 - rn - k) / (1 - k)
  const m = (1 - gn - k) / (1 - k)
  const y = (1 - bn - k) / (1 - k)
  const pct = (v: number) => Math.round(v * 100)
  return { c: pct(c), m: pct(m), y: pct(y), k: pct(k) }
}

/**
 * Recorre una paleta [{name, hex, ...}] y añade rgb/cmyk deterministas a cada
 * entrada con hex válido. Borra cualquier rgb/cmyk que el modelo hubiera
 * escrito (no son de fiar). Tolerante: entradas sin hex quedan intactas.
 */
export function enrichPaletteCmyk<T extends Record<string, any>>(palette: T[]): (T & PaletteEntryEnriched)[] {
  if (!Array.isArray(palette)) return palette as any
  return palette.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry
    const { rgb: _r, cmyk: _c, rgb_css: _rc, cmyk_label: _cl, ...rest } = entry as Record<string, any>
    const hex = typeof rest.hex === 'string' ? rest.hex : ''
    const rgb = hex ? hexToRgb(hex) : null
    if (!rgb) return rest as T
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    return {
      ...(rest as T),
      rgb,
      rgb_css: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      cmyk,
      cmyk_label: `C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}`,
    }
  })
}
