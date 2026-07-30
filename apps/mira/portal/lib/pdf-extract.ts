// Extracción de texto de PDF compartida (drive-sync, attachments, upload-document
// de brand-brain y de agente). Antes duplicada 4 veces con el mismo código.
//
// pdfjs-dist (dependencia de pdf-parse v2) intenta cargar @napi-rs/canvas
// para rellenar DOMMatrix/Path2D/ImageData en Node. El binario nativo existe
// en local (darwin-arm64) pero no se resuelve en el runtime serverless de
// Vercel (linux) -- pdfjs-dist entonces intenta usar DOMMatrix real para las
// matrices de transformación de texto (las usa incluso solo para getText(),
// no solo para renderizar píxeles), y la extracción de CUALQUIER PDF falla
// con "ReferenceError: DOMMatrix is not defined" (confirmado en logs reales
// de producción, 2026-07-30 -- problema conocido y sin fix oficial en
// pdfjs-dist/pdf-parse a esta fecha, mismo síntoma reportado por otros
// proyectos como n8n). Polyfill mínimo pero funcional (matriz afín 2D real).

function ensureDOMMatrixPolyfill(): void {
  if (typeof (globalThis as any).DOMMatrix !== 'undefined') return

  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    is2D = true
    isIdentity = true

    constructor(init?: number[] | string) {
      if (Array.isArray(init) && init.length >= 6) {
        ;[this.a, this.b, this.c, this.d, this.e, this.f] = init
        this.isIdentity = this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0
      }
    }

    multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
      return new DOMMatrixPolyfill([
        this.a * other.a + this.c * other.b,
        this.b * other.a + this.d * other.b,
        this.a * other.c + this.c * other.d,
        this.b * other.c + this.d * other.d,
        this.a * other.e + this.c * other.f + this.e,
        this.b * other.e + this.d * other.f + this.f,
      ])
    }

    translate(tx = 0, ty = 0): DOMMatrixPolyfill {
      return this.multiply(new DOMMatrixPolyfill([1, 0, 0, 1, tx, ty]))
    }

    scale(sx = 1, sy = sx): DOMMatrixPolyfill {
      return this.multiply(new DOMMatrixPolyfill([sx, 0, 0, sy, 0, 0]))
    }

    inverse(): DOMMatrixPolyfill {
      const det = this.a * this.d - this.b * this.c
      if (!det) return new DOMMatrixPolyfill()
      return new DOMMatrixPolyfill([
        this.d / det,
        -this.b / det,
        -this.c / det,
        this.a / det,
        (this.c * this.f - this.d * this.e) / det,
        (this.b * this.e - this.a * this.f) / det,
      ])
    }

    transformPoint(point: { x: number; y: number }): { x: number; y: number } {
      return { x: this.a * point.x + this.c * point.y + this.e, y: this.b * point.x + this.d * point.y + this.f }
    }
  }

  ;(globalThis as any).DOMMatrix = DOMMatrixPolyfill
  // Path2D/ImageData: pdfjs-dist solo los referencia en rutas de renderizado
  // a canvas real, que getText() nunca ejercita -- stubs vacíos bastan para
  // que la referencia no lance ReferenceError.
  if (typeof (globalThis as any).Path2D === 'undefined') {
    ;(globalThis as any).Path2D = class Path2DPolyfill {}
  }
  if (typeof (globalThis as any).ImageData === 'undefined') {
    ;(globalThis as any).ImageData = class ImageDataPolyfill {}
  }
}

/** Extrae el texto de un PDF. Lanza si pdf-parse falla -- el caller decide el fallback. */
export async function extractPdfText(data: Buffer | Uint8Array): Promise<string> {
  ensureDOMMatrixPolyfill()
  // Lazy dynamic import: un require('pdf-parse') a nivel de módulo rompía
  // TODOS los exports del fichero que lo importara, incluso peticiones que
  // nunca tocan un PDF (ver DEBT.md nn). pdfjs-dist resuelve su "fake worker"
  // (pdf.worker.mjs) de forma dinámica -- se fuerza su inclusión en el
  // bundle vía outputFileTracingIncludes (next.config.ts) en vez de
  // resolverlo aquí a mano (un intento con createRequire/import.meta.url
  // falló en el runtime bundleado de Vercel, "TypeError: t is not a
  // function" en logs reales, 2026-07-30).
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data })
  try {
    const result = await parser.getText()
    return result?.text ?? ''
  } finally {
    await parser.destroy().catch(() => {})
  }
}
