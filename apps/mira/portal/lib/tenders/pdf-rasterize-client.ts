'use client'

// Un PDF → una imagen JPEG por página, EN EL NAVEGADOR (pdf.js).
//
// Las páginas con diseño propio de la empresa llegan casi siempre en PDF (lo
// exporta su diseñador). El Word solo sabe incrustar PNG/JPG, y rasterizar en
// el servidor de Vercel exigiría un canvas nativo que no está. El navegador ya
// tiene canvas: aquí se pinta cada página a ~150 ppp (A4 → 1240×1754 px) y se
// sube como JPEG (una página diseñada en PNG pesa 2-4 MB; en JPEG al 90 %,
// 300-500 KB, y el Word final no se dispara).

export const DPI_PAGINA = 150
export const CALIDAD_JPEG = 0.9

export interface PaginaRasterizada { blob: Blob; w: number; h: number; n: number }

export async function rasterizarPdf(file: File, opts: { maxPaginas?: number; onProgress?: (n: number, total: number) => void } = {}): Promise<PaginaRasterizada[]> {
  const pdfjs = await import('pdfjs-dist')
  // El worker se sirve desde el propio bundle (import.meta.url): sin red externa ni CDN.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const total = Math.min(pdf.numPages, opts.maxPaginas ?? 30)
  const out: PaginaRasterizada[] = []
  for (let n = 1; n <= total; n++) {
    const page = await pdf.getPage(n)
    const viewport = page.getViewport({ scale: DPI_PAGINA / 72 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('El navegador no permite dibujar la página')
    // Fondo blanco: un PDF con transparencia saldría negro en JPEG.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport, canvas }).promise
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG))
    if (!blob) throw new Error(`No se ha podido convertir la página ${n}`)
    out.push({ blob, w: canvas.width, h: canvas.height, n })
    opts.onProgress?.(n, total)
    page.cleanup()
  }
  await pdf.destroy()
  return out
}
