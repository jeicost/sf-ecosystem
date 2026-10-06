// Imágenes para el Word de Licitaciones: medir y encajar. Separado de word.ts
// para que la biblioteca de páginas diseñadas (disenadas.ts) pueda medir sin
// importar el constructor entero.

export interface LogoWord { data: Buffer; type: 'png' | 'jpg'; w: number; h: number }

/** Ancho y alto de un PNG (IHDR, bytes 16-24 big-endian) o un JPG (marcador SOF). Otro formato → null: ImageRun exige el tipo. */
export function medirImagen(buf: Buffer): { type: 'png' | 'jpg'; w: number; h: number } | null {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20)
    return w > 0 && h > 0 ? { type: 'png', w, h } : null
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
      const len = buf.readUInt16BE(i + 2)
      // SOF0..SOF15 salvo DHT (C4), JPG (C8) y DAC (CC): ahí están las dimensiones.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const h = buf.readUInt16BE(i + 5), w = buf.readUInt16BE(i + 7)
        return w > 0 && h > 0 ? { type: 'jpg', w, h } : null
      }
      i += 2 + len
    }
  }
  return null
}

/** pt → px (docx mide las imágenes en píxeles a 96 dpi). */
export const px = (pt: number) => Math.round((pt * 96) / 72)

/** Escala manteniendo proporción dentro de una caja de puntos. */
export function encajar(img: { w: number; h: number }, maxWpt: number, maxHpt: number): { width: number; height: number } {
  const k = Math.min(maxWpt / img.w, maxHpt / img.h, 1e9)
  return { width: Math.max(1, px(img.w * k)), height: Math.max(1, px(img.h * k)) }
}
