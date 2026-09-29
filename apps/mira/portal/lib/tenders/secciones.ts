// Trocear el texto de un documento de licitación en secciones, sin modelo.
//
// Es la red de seguridad del estructurado con IA y también la herramienta de
// las cargas masivas. Estos documentos casi siempre son PRESENTACIONES
// exportadas a PDF: una diapositiva por página, con su marca "-- n of m --", una
// fila de migas repetida arriba y el rótulo del apartado en MAYÚSCULAS o
// numerado. La unidad natural es la página, no un epígrafe.

export interface Seccion { titulo: string; contenido: string }

const PAGINA = /^--\s*\d+\s+of\s+\d+\s*--$/
const ENLACE = /^(de|del|la|el|los|las|en|y|e|o|a|al|con|para|por|que|un|una|su|sus|se|lo|como|sobre|entre|desde|hasta)$/i

/** Migas de pan de una plantilla: la misma fila de apartados en cada página. */
export const esMiga = (l: string) => l.split(/\t|\s{3,}/).filter((x) => x.trim()).length >= 4

/**
 * Quita lo que no es contenido: marcas de página, migas y las líneas que se
 * repiten en muchas páginas (cabeceras y pies). Conserva los saltos de página
 * como una línea vacía doble para que el troceado por página siga siendo posible.
 */
export function limpiarMaquetacion(texto: string): string {
  const lineas = texto.split('\n')
  const cuenta = new Map<string, number>()
  for (const l of lineas) {
    const k = l.trim()
    if (k.length >= 3 && k.length <= 120) cuenta.set(k, (cuenta.get(k) || 0) + 1)
  }
  const paginas = lineas.filter((l) => PAGINA.test(l.trim())).length
  // Una línea que aparece en más de un tercio de las páginas es plantilla.
  const umbral = Math.max(3, Math.floor(paginas / 3))
  return lineas
    .map((l) => (PAGINA.test(l.trim()) ? '\f' : l))
    .filter((l) => l === '\f' || !(esMiga(l) || (cuenta.get(l.trim()) || 0) >= umbral))
    .join('\n')
}

/** El rótulo de una página: numerado o en MAYÚSCULAS antes que una frase. */
export function rotulo(lineas: string[]): string | null {
  const cands = lineas.slice(0, 8)
    .map((l) => l.replace(/\s+/g, ' ').replace(/^[,.;:\s]+|[,;:\s]+$/g, '').trim())
    .filter((l) => l.length >= 4 && l.length <= 80)
  const palabras = (l: string) => l.split(/\s+/).filter(Boolean)
  const letras = (l: string) => l.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, '')
  const mayus = (l: string) => { const x = letras(l); return x.length >= 4 && x === x.toUpperCase() }
  const numerado = (l: string) => /^[A-Z]?\d{1,2}(\.\d{1,2}){0,2}[.)\-–]?\s+[A-ZÁÉÍÓÚÑ]/.test(l)
  const frase = (l: string) => {
    const w = palabras(l)
    return /^[a-záéíóúñ]/.test(l) || /[.;:,]$/.test(l) || ENLACE.test(w[w.length - 1] || '') || /^\d+\s*[-–.]\s/.test(l)
  }
  return cands.find((l) => numerado(l) && !frase(l) && palabras(l).length <= 10)
    || cands.find((l) => mayus(l) && !frase(l) && palabras(l).length <= 10)
    || cands.find((l) => !frase(l) && palabras(l).length <= 6)
    || null
}

const titular = (t: string) => {
  const x = t.replace(/\s+/g, ' ').trim()
  return x === x.toUpperCase() ? x.charAt(0) + x.slice(1).toLowerCase() : x
}

/** Troceado por página; las que no tienen rótulo propio se unen a la anterior. */
export function trocearPorPaginas(texto: string): Seccion[] {
  const paginas = limpiarMaquetacion(texto).split('\f').map((p) => p.split('\n').filter((l) => l.trim()))
  const out: Seccion[] = []
  for (const utiles of paginas) {
    const cuerpo = utiles.join('\n').trim()
    if (cuerpo.length < 180) continue
    const r = rotulo(utiles)
    const titulo = r ? titular(r) : null
    const contenido = r ? utiles.filter((l) => l.replace(/\s+/g, ' ').trim() !== r).join('\n').trim() : cuerpo
    const ultimo = out[out.length - 1]
    if (ultimo && (!titulo || titulo === ultimo.titulo || ultimo.contenido.length < 1200)) {
      ultimo.contenido = `${ultimo.contenido}\n${titulo && titulo !== ultimo.titulo ? titulo + '\n' : ''}${contenido}`
    } else {
      out.push({ titulo: titulo || 'Documento', contenido })
    }
  }
  return out
}

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

/**
 * Corta el texto por las "anclas" que devuelve el modelo: las primeras palabras
 * de cada sección, copiadas literalmente. Se buscan EN ORDEN y sobre el texto
 * normalizado (espacios y acentos), así que un salto de línea en medio no las
 * rompe. Lo que no se encuentra no se inventa: esa sección se omite y su texto
 * queda dentro de la anterior. El texto de cada sección sale del ORIGINAL, no
 * de lo que el modelo haya reescrito.
 */
export function cortarPorAnclas(texto: string, anclas: { titulo: string; empieza: string }[]): Seccion[] {
  // Mapa de posiciones: índice en el texto normalizado → índice en el original.
  const orig = texto
  let norm = ''
  const mapa: number[] = []
  let prevEsp = true
  for (let i = 0; i < orig.length; i++) {
    const c = orig[i].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const esEsp = /\s/.test(orig[i])
    if (esEsp) { if (!prevEsp) { norm += ' '; mapa.push(i) } prevEsp = true; continue }
    for (const ch of c) { norm += ch; mapa.push(i) }
    prevEsp = false
  }
  const puntos: { pos: number; titulo: string }[] = []
  let desde = 0
  for (const a of anclas) {
    const clave = normalizar(a.empieza || '').split(' ').slice(0, 10).join(' ')
    if (clave.length < 12) continue
    const idx = norm.indexOf(clave, desde)
    if (idx < 0) continue
    puntos.push({ pos: mapa[idx], titulo: (a.titulo || 'Sección').trim().slice(0, 200) })
    desde = idx + clave.length
  }
  return puntos.map((p, i) => ({
    titulo: p.titulo,
    contenido: orig.slice(p.pos, i + 1 < puntos.length ? puntos[i + 1].pos : orig.length).replace(/\f/g, '\n').trim(),
  })).filter((s) => s.contenido.length >= 40)
}
