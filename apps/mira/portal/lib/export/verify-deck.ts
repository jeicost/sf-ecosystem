// Verificación estructural del deck mensual ANTES de subirlo a Drive (F4).
// Abre el .pptx (es un zip) y comprueba lo que el spec promete: nº de slides,
// PART 1..6 presentes y en orden, feedback rows (APPROVE) en las piezas,
// y calendario presente. Si el deck no pasa, NO se sube — mejor fallar aquí
// que entregar al cliente un deck a medias.

import JSZip from 'jszip'

export interface DeckVerification {
  ok: boolean
  slides: number
  approveRows: number
  partsInOrder: boolean
  hasCalendar: boolean
  issues: string[]
}

function textOf(xml: string): string {
  // concatena los runs <a:t> del slide
  return (xml.match(/<a:t>([^<]*)<\/a:t>/g) || [])
    .map((m) => m.replace(/<\/?a:t>/g, ''))
    .join(' ')
}

export async function verifyMonthlyDeck(
  buffer: Buffer,
  expected: { captions: number; pillars: number }
): Promise<DeckVerification> {
  const issues: string[] = []
  const zip = await JSZip.loadAsync(buffer)

  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))

  const texts: string[] = []
  for (const name of slideNames) {
    texts.push(textOf(await zip.files[name].async('string')))
  }

  const slides = slideNames.length
  // mínimo estructural: cover + 6 dividers + ≥1 slide por parte + cierre
  const minExpected = 10 + Math.min(expected.pillars, 8)
  if (slides < minExpected) {
    issues.push(`Solo ${slides} slides (esperaba ≥${minExpected} con ${expected.pillars} pilares)`)
  }

  // PART 1..6 en orden ascendente de slide
  const partIndex: number[] = []
  for (let part = 1; part <= 6; part++) {
    const idx = texts.findIndex((t) => t.includes(`PART ${part} —`) || t.includes(`PART ${part}`))
    if (idx === -1) issues.push(`Falta el divider PART ${part}`)
    partIndex.push(idx)
  }
  const found = partIndex.filter((i) => i !== -1)
  const partsInOrder =
    found.length === 6 && found.every((v, i) => i === 0 || v > found[i - 1])
  if (found.length === 6 && !partsInOrder) issues.push('Los PART 1..6 no están en orden')

  // Feedback rows: una por caption slide
  const approveRows = texts.filter((t) => t.includes('APPROVE')).length
  const expectedApprove = Math.min(expected.captions, 30)
  if (expectedApprove > 0 && approveRows < expectedApprove) {
    issues.push(`${approveRows} feedback rows for ${expectedApprove} captions`)
  }

  // Acepta ambos idiomas: las plantillas se tradujeron a inglés el 2026-08-06
  // y esta comprobación bloqueaba la subida a Drive con un 500 si no encontraba
  // literalmente 'Calendario'. Se conserva el español para los decks ya
  // generados que sigan en circulación.
  const hasCalendar = texts.some((t) => /calendar(io)?/i.test(t))
  if (!hasCalendar) issues.push('No calendar slide found')

  return { ok: issues.length === 0, slides, approveRows, partsInOrder, hasCalendar, issues }
}
