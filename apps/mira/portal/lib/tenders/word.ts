import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'
import { jsonObject } from '@/lib/db-json'
import { aplicarMembrete, leerMembrete, MARCA_CABECERA, MARCA_PIE, MAX_MEMBRETE_BYTES, type MargenesMembrete, type Membrete } from '@/lib/tenders/membrete'
import { encajar, medirImagen, px, type LogoWord } from '@/lib/tenders/word-imagen'
import { resolverReferencia, type DisenadaResuelta } from '@/lib/tenders/disenadas'

export { medirImagen, type LogoWord }

// Word con membrete de marca para Licitaciones.
//
// Hasta el 1-oct-2026 /api/tender/export sacaba un .docx plano (Arial negro,
// sin portada, sin cabecera ni pie, sin índice) y Usoa lo maquetaba entero a
// mano. Las memorias REALES de GTD (medidas en PDF) llevan portada a todo
// color, un índice, títulos de sección en mayúsculas con el azul de la marca y
// un pie con la línea legal. Desde el 6-oct, además:
//   · si la marca ha subido su HOJA oficial (.docx), la cabecera y el pie se
//     trasplantan tal cual (lib/tenders/membrete.ts) y mandan sus márgenes y
//     su tipografía;
//   · el texto se maqueta: subtítulos, negritas, listas numeradas y tablas
//     escritas en el texto se convierten en elementos reales de Word, y los
//     [FALTA: …] salen resaltados para que no se cuelen en lo que se presenta;
//   · las PÁGINAS CON DISEÑO PROPIO (lib/tenders/disenadas.ts) entran donde el
//     redactor las marcó, a sangre completa en su propia sección sin membrete,
//     o como figura dentro del texto; las de «siempre» van como anexo.
// Un solo constructor para las tres fuentes (memoria, oferta, documento) y
// para la muestra de la plantilla.
//
// Reglas de la librería docx (^9.8) que ya nos han mordido: el PageBreak va
// DENTRO de un Paragraph; ImageRun exige `type`; un '\n' dentro de un TextRun
// no salta de línea; el sombreado es ShadingType.CLEAR; los anchos van en DXA
// (nada de WidthType.PERCENTAGE) y los colores SIN '#'.

// ---------------------------------------------------------------------------
// Plantilla
// ---------------------------------------------------------------------------

/** Plantilla ya resuelta: colores hex SIN '#', textos (pueden ir vacíos), logo y hoja si se pudieron descargar. */
export interface PlantillaWord {
  cover_color: string
  accent_color: string
  company_name: string
  brand_name: string
  tagline: string
  footer_line: string
  logo: LogoWord | null
  /** Tipografía del cuerpo: la de la plantilla, si no la de la hoja, si no Arial. */
  body_font: string
  /** La hoja oficial (cabecera, pie, márgenes). null → membrete generado (logo + línea legal). */
  membrete: Membrete | null
  margenes: MargenesMembrete
}

/** Claves de tender_settings.template que existen. Cualquier otra se descarta al guardar. */
export const CLAVES_PLANTILLA = ['cover_color', 'accent_color', 'company_name', 'brand_name', 'tagline', 'footer_line', 'logo_path', 'letterhead_path', 'letterhead_name', 'body_font'] as const
export type ClavePlantilla = (typeof CLAVES_PLANTILLA)[number]

/** Luminancia relativa (0-1, WCAG) de un hex sin '#'. */
function luminancia(hex: string): number {
  const n = parseInt(hex.slice(0, 6), 16)
  if (!Number.isFinite(n)) return 0
  const c = [16, 8, 0].map((d) => { const v = ((n >> d) & 255) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
/** Texto que se lee ENCIMA de un fondo de marca: blanco sobre oscuro (GTD azul), casi negro sobre claro (Albasanz y GLS son amarillas). */
export function contrasteSobre(fondo: string): string { return luminancia(fondo) > 0.45 ? '1A1A1A' : 'FFFFFF' }
/** El acento usado como COLOR DE TEXTO sobre página blanca: si es demasiado claro para leerse, gris oscuro. */
export function acentoLegible(acento: string): string { return luminancia(acento) > 0.55 ? '333333' : acento }

const HEX = /^#?([0-9A-Fa-f]{6})$/
const GRIS_NEUTRO = '333333'

/** «#0033A1» → «0033A1». Si no es un hex de 6 dígitos, devuelve el valor de reserva: no se inventa un color. */
export function hexDocx(v: unknown, reserva: string): string {
  const m = typeof v === 'string' ? HEX.exec(v.trim()) : null
  return m ? m[1].toUpperCase() : reserva
}

/**
 * El logo del Word solo puede venir del bucket del propio cliente: o es
 * logos/<clientId>.<ext> (el logo de marca) o cuelga de <clientId>/… (un
 * adjunto suyo). Cualquier otra ruta se ignora: un cliente no puede colar el
 * logo de otro poniéndolo a mano en su plantilla.
 */
export function rutaLogoPermitida(path: unknown, clientId: string): path is string {
  if (typeof path !== 'string' || !path || path.includes('..') || path.includes('\\') || path.startsWith('/')) return false
  return new RegExp(`^logos/${clientId}\\.[A-Za-z0-9]{2,5}$`).test(path) || path.startsWith(`${clientId}/`)
}

/** Lo mismo para cualquier fichero de la marca, incluidos los subidos por Licitaciones (tenders/<clientId>/…). */
export function rutaFicheroPermitida(path: unknown, clientId: string): path is string {
  return rutaLogoPermitida(path, clientId) || (typeof path === 'string' && !path.includes('..') && path.startsWith(`tenders/${clientId}/`))
}

const A4 = { width: 11906, height: 16838 }
const MARGEN = 1134
/** Ancho útil A4 con márgenes de 2 cm, en DXA (el de la plantilla sin hoja). */
export const ANCHO_UTIL = A4.width - 2 * MARGEN // 9638
const MARGENES_DEFECTO: MargenesMembrete = { top: MARGEN, right: MARGEN, bottom: MARGEN, left: MARGEN, header: 567, footer: 567 }

/** Nombre de fuente aceptable: letras, dígitos, espacios y guiones; ≤ 60. Lo demás se descarta. */
export function fuenteValida(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return /^[\p{L}\p{N} .\-]{2,60}$/u.test(s) ? s : null
}

/**
 * Lee tender_settings.template + clients y descarga el logo y la hoja. Todo
 * cae con elegancia: sin fila → clients.logo_url y clients.primary_color; sin
 * eso → gris neutro y sin logo. Si el logo o la hoja fallan al bajar, el Word
 * sale SIN ellos pero sale: nunca un 500 por el membrete.
 */
export async function resolverPlantilla(db: SupabaseClient<Database>, clientId: string): Promise<PlantillaWord> {
  const [{ data: ajustes }, { data: cliente }] = await Promise.all([
    db.from('tender_settings').select('template').eq('client_id', clientId).maybeSingle(),
    db.from('clients').select('name,logo_url,primary_color').eq('id', clientId).maybeSingle(),
  ])
  const t = jsonObject(ajustes?.template)
  const str = (k: ClavePlantilla) => (typeof t[k] === 'string' ? (t[k] as string).trim() : '')

  const colorMarca = hexDocx(cliente?.primary_color, GRIS_NEUTRO)
  const plantilla: PlantillaWord = {
    cover_color: hexDocx(t.cover_color, colorMarca),
    accent_color: hexDocx(t.accent_color, colorMarca),
    company_name: str('company_name') || cliente?.name || '',
    brand_name: str('brand_name') || cliente?.name || '',
    tagline: str('tagline'),
    footer_line: str('footer_line'),
    logo: null,
    body_font: 'Arial',
    membrete: null,
    margenes: { ...MARGENES_DEFECTO },
  }

  // Ruta del logo: la de la plantilla si es del propio cliente; si no, la que
  // hay detrás de clients.logo_url ("/api/brand-assets?path=logos/<id>.png").
  let path: string | null = rutaLogoPermitida(t.logo_path, clientId) ? t.logo_path : null
  if (!path && cliente?.logo_url) {
    const m = /[?&]path=([^&]+)/.exec(cliente.logo_url)
    const p = m ? decodeURIComponent(m[1]) : null
    if (rutaLogoPermitida(p, clientId)) path = p
  }
  const bajar = async (ruta: string): Promise<Buffer | null> => {
    const { data, error } = await db.storage.from('brand-assets').download(ruta)
    return !error && data ? Buffer.from(await data.arrayBuffer()) : null
  }
  if (path) {
    try {
      const buf = await bajar(path)
      const dims = buf && medirImagen(buf)
      if (buf && dims) plantilla.logo = { data: buf, ...dims }
    } catch (e) {
      console.warn('tenders/word: logo no disponible, el Word sale sin él:', e instanceof Error ? e.message : e)
    }
  }
  // La hoja oficial: solo si es un fichero de la marca y se lee como .docx.
  if (rutaFicheroPermitida(t.letterhead_path, clientId)) {
    try {
      const buf = await bajar(t.letterhead_path)
      if (buf && buf.length <= MAX_MEMBRETE_BYTES) {
        const m = await leerMembrete(buf)
        if (m && (m.header || m.footer)) {
          plantilla.membrete = m
          if (m.margenes) plantilla.margenes = { ...m.margenes }
        }
      }
    } catch (e) {
      console.warn('tenders/word: hoja no disponible, el Word sale con el membrete generado:', e instanceof Error ? e.message : e)
    }
  }
  plantilla.body_font = fuenteValida(t.body_font) || fuenteValida(plantilla.membrete?.bodyFont) || 'Arial'
  return plantilla
}

// ---------------------------------------------------------------------------
// Utilidades de texto (las usa también el route)
// ---------------------------------------------------------------------------

/**
 * XML no admite caracteres de control: uno solo dentro de un párrafo produce un
 * .docx que Word se niega a abrir, y la API lo devolvía con un 200 como si todo
 * hubiera ido bien. Los PDF de origen (sobre todo los firmados) los traen. Se
 * limpia TODO el texto de una vez, antes de construir nada. Los Buffer se
 * respetan (un logo no es un objeto que recorrer).
 */
export function sanear<T>(v: T): T {
  if (typeof v === 'string') return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '') as T
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return v
  if (Array.isArray(v)) return v.map(sanear) as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sanear(x)])) as T
  return v
}

/**
 * Cabecera de descarga que no revienta. Una sola letra fuera de Latin-1 en el
 * título (la ligadura «ﬁ» de un PDF, una Ω) tumbaba la respuesta con un 500. Se
 * manda un nombre ASCII de reserva y el nombre real codificado (RFC 5987).
 */
export function disposition(nombre: string): string {
  const base = nombre.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'documento'
  const ascii = base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '_')
  return `attachment; filename="${ascii}.docx"; filename*=UTF-8''${encodeURIComponent(base)}.docx`
}

// ---------------------------------------------------------------------------
// Mini-maquetación del texto (pura, probada en evals/licitaciones/check.ts)
// ---------------------------------------------------------------------------
// El redactor escribe texto plano con las convenciones que ya usaba: líneas
// con guion para viñetas, «1. » para listas, **negrita**, «## Subtítulo» o una
// línea entera en MAYÚSCULAS para un subapartado, y tablas con barras
// («| Servicio | Plazo |»). Aquí se reconocen y el Word las recibe como lo que
// son. Lo que no se reconoce es un párrafo: nunca se pierde texto.

export type Bloque =
  | { t: 'p'; texto: string }
  | { t: 'h'; texto: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'tabla'; filas: string[][] }
  | { t: 'diseno'; ref: string }

const ES_VINETA = /^\s*[-•·*–—]\s+/
const ES_NUMERO = /^\s*\d{1,2}[.)]\s+(?=\S)/
const ES_TABLA = /^\s*\|.*\|\s*$/
const ES_SEPARADOR_TABLA = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/
const ES_MARKDOWN_H = /^\s*#{1,4}\s+(.+?)\s*#*\s*$/
const ES_NEGRITA_SOLA = /^\s*\*\*([^*]{2,120})\*\*:?\s*$/
const ES_MARCADOR_SOLO = /^\s*\[\[\s*DISE[ÑN]O\s*:\s*([^\]]+?)\s*\]\]\s*$/i
const PARTE_MARCADOR = /(\[\[\s*DISE[ÑN]O\s*:\s*[^\]]+?\s*\]\])/i

/** Una línea entera en mayúsculas, corta y sin puntuación final, es un rótulo de subapartado («PLAN DE CONTINGENCIA»). */
export function esRotuloMayusculas(l: string): boolean {
  const t = l.trim()
  if (t.length < 4 || t.length > 90 || /[.;:,]$/.test(t)) return false
  const letras = t.replace(/[^\p{L}]/gu, '')
  if (letras.length < 6) return false
  const mayus = letras.replace(/[^\p{Lu}]/gu, '').length
  return mayus / letras.length >= 0.85 && t.split(/\s+/).length >= 2
}

export function parseBloques(texto: string): Bloque[] {
  const out: Bloque[] = []
  const lineas = String(texto || '').replace(/\r\n?/g, '\n').split('\n')
  let i = 0
  while (i < lineas.length) {
    const l = lineas[i]
    if (!l.trim()) { i++; continue }
    const dis = ES_MARCADOR_SOLO.exec(l)
    if (dis) { out.push({ t: 'diseno', ref: dis[1] }); i++; continue }
    if (ES_TABLA.test(l)) {
      const filas: string[][] = []
      while (i < lineas.length && ES_TABLA.test(lineas[i])) {
        if (!ES_SEPARADOR_TABLA.test(lineas[i])) filas.push(lineas[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
        i++
      }
      if (filas.length) out.push({ t: 'tabla', filas })
      continue
    }
    const h = ES_MARKDOWN_H.exec(l) || ES_NEGRITA_SOLA.exec(l)
    if (h) { out.push({ t: 'h', texto: h[1].trim() }); i++; continue }
    if (esRotuloMayusculas(l)) { out.push({ t: 'h', texto: l.trim() }); i++; continue }
    if (ES_VINETA.test(l)) {
      const items: string[] = []
      while (i < lineas.length && ES_VINETA.test(lineas[i])) { items.push(lineas[i].replace(ES_VINETA, '').trim()); i++ }
      out.push({ t: 'ul', items }); continue
    }
    if (ES_NUMERO.test(l)) {
      const items: string[] = []
      while (i < lineas.length && ES_NUMERO.test(lineas[i])) { items.push(lineas[i].replace(ES_NUMERO, '').trim()); i++ }
      out.push({ t: 'ol', items }); continue
    }
    // Un marcador pegado a texto en la misma línea: se separa en sus trozos.
    if (PARTE_MARCADOR.test(l)) {
      for (const trozo of l.split(PARTE_MARCADOR)) {
        const m = ES_MARCADOR_SOLO.exec(trozo)
        if (m) out.push({ t: 'diseno', ref: m[1] })
        else if (trozo.trim()) out.push({ t: 'p', texto: trozo.trim() })
      }
      i++; continue
    }
    out.push({ t: 'p', texto: l.trim() }); i++
  }
  return out
}

export interface TrozoInline { texto: string; negrita?: boolean; aviso?: boolean }
const INLINE_RE = /(\*\*[^*\n]+\*\*|\[(?:FALTA|MISSING)\b[^\]]*\]|\[[ÓO]RGANO ANTERIOR\])/g

/** **negrita** → negrita; [FALTA: …], [MISSING: …] y [ÓRGANO ANTERIOR] → aviso (ámbar resaltado). El resto, texto. */
export function trozosInline(texto: string): TrozoInline[] {
  const out: TrozoInline[] = []
  for (const parte of String(texto || '').split(INLINE_RE)) {
    if (!parte) continue
    if (/^\*\*[^*\n]+\*\*$/.test(parte)) out.push({ texto: parte.slice(2, -2), negrita: true })
    else if (/^\[(?:FALTA|MISSING)\b/i.test(parte) || /^\[[ÓO]RGANO ANTERIOR\]$/.test(parte)) out.push({ texto: parte, aviso: true })
    else out.push({ texto: parte })
  }
  return out
}

/** ¿Columna numérica? Si ≥ 60 % de las celdas con contenido son cifras (con €, %, puntos y comas). */
export function columnaNumerica(filas: string[][], col: number): boolean {
  const celdas = filas.map((f) => (f[col] || '').trim()).filter(Boolean)
  if (!celdas.length) return false
  const num = celdas.filter((c) => /^[-+]?[\d.,\s]+(\s*(€|%|eur|km|kg|h|min|ud|uds))?\.?$/i.test(c)).length
  return num / celdas.length >= 0.6
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

export interface SeccionWord { titulo: string; contenido: string; puntos?: number | null; porConfirmar?: string[] }
export interface TablaWord {
  cabecera: string[]
  filas: string[][]
  /** Índices de columnas numéricas (alineadas a la derecha). */
  alinearDerecha?: number[]
  /** Anchos en DXA; si no vienen, la primera columna se lleva un tercio y el resto se reparte. Si no suman el ancho útil, se escalan. */
  anchos?: number[]
  /** Línea en negrita bajo la tabla (p. ej. la puntuación ponderada). */
  pie?: string
}
export interface BloqueWord { titulo: string; parrafos: string[] }

export interface EntradaWord {
  plantilla: PlantillaWord
  tipo: 'memoria' | 'oferta' | 'documento'
  /** «MEMORIA TÉCNICA», «OFERTA ECONÓMICA» o el kind del documento. */
  rotulo: string
  titulo: string
  expediente?: string | null
  organo?: string | null
  /** Ciudad de la fecha de portada («Madrid, octubre de 2026»). Las marcas de Aldea son de Madrid. */
  ciudad?: string | null
  secciones: SeccionWord[]
  tabla?: TablaWord
  bloques?: BloqueWord[]
  /** Pendientes globales (oferta): bloque ámbar tras la tabla y los bloques. */
  porConfirmar?: string[]
  /** Notas internas: página aparte, en ámbar, fuera de la navegación. */
  internas?: string[]
  /** Páginas con diseño propio disponibles (ya con sus imágenes): las que el texto marque se insertan. */
  disenadas?: DisenadaResuelta[]
  /** Las de «siempre» que el texto no haya colocado: van como anexos al final. */
  anexos?: DisenadaResuelta[]
}

const GRIS = '545454'
const GRIS_CLARO = '8A8A8A'
const AMBAR = '946200'
const AMBAR_BORDE = 'E5B800'
/** 1 pt = 12700 EMU; 1 px (96 dpi) = 9525 EMU. */
const EMU_PX = 9525
const A4_PT = { w: A4.width / 20, h: A4.height / 20 }

function fechaPortada(ciudad: string): string {
  const f = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date())
  return `${ciudad}, ${f}`
}

export async function construirWord(entrada: EntradaWord): Promise<Buffer> {
  const {
    Document, Packer, Paragraph, TextRun, ImageRun, PageBreak, AlignmentType, PageOrientation, BorderStyle,
    Table, TableRow, TableCell, WidthType, ShadingType, HeightRule, VerticalAlignTable, LevelFormat,
    Header, Footer, PageNumber, TabStopType, Tab, SectionType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,
  } = await import('docx')

  type Parrafo = InstanceType<typeof Paragraph>
  type Tabla = InstanceType<typeof Table>
  type Hijo = Parrafo | Tabla

  // El texto se sanea aquí, pieza a pieza; la plantilla trae Buffers y no se toca.
  const { plantilla: p } = entrada
  const rotulo = sanear(entrada.rotulo || '').trim() || 'DOCUMENTO'
  const titulo = sanear(entrada.titulo || '').trim() || 'Documento'
  const expediente = sanear(entrada.expediente || '')?.trim() || ''
  const organo = sanear(entrada.organo || '')?.trim() || ''
  const secciones = sanear(entrada.secciones || [])
  const tabla = entrada.tabla ? sanear(entrada.tabla) : undefined
  const bloques = sanear(entrada.bloques || [])
  const pendientes = sanear(entrada.porConfirmar || []).filter((x) => x && x.trim())
  const internas = sanear(entrada.internas || []).filter((x) => x && x.trim())
  const ciudad = sanear(entrada.ciudad || '')?.trim() || 'Madrid'
  const disenadas = entrada.disenadas || []
  const anexos = (entrada.anexos || []).filter((a) => a.imagenes.length)
  const conHoja = !!p.membrete
  const margenes = p.margenes
  const anchoUtil = A4.width - margenes.left - margenes.right
  const altoUtil = A4.height - margenes.top - margenes.bottom
  const acento = acentoLegible(p.accent_color)

  const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const sinBordes = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde }

  // ----- Piezas ------------------------------------------------------------
  const runs = (texto: string, base: { color?: string; size?: number; bold?: boolean; italics?: boolean } = {}) =>
    trozosInline(texto).map((tr) => new TextRun({
      text: tr.texto,
      bold: tr.negrita || base.bold || undefined,
      italics: base.italics,
      size: base.size,
      color: tr.aviso ? AMBAR : base.color,
      ...(tr.aviso ? { highlight: 'yellow' as const } : {}),
    }))

  let instanciaLista = 0
  const parrafo = (texto: string, opts: { color?: string; justificar?: boolean } = {}) =>
    new Paragraph({ alignment: opts.justificar === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED, spacing: { after: 120 }, widowControl: true, children: runs(texto, { color: opts.color }) })
  const vineta = (t: string, color?: string) =>
    new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 60 }, children: runs(t, { color }) })
  const numerado = (t: string, instance: number) =>
    new Paragraph({ numbering: { reference: 'numeros', level: 0, instance }, spacing: { after: 60 }, children: runs(t) })
  const subtitulo = (t: string) => new Paragraph({ heading: 'Heading2', children: runs(t.replace(/\*\*/g, ''), { color: acento }) })
  const salto = () => new Paragraph({ children: [new PageBreak()] })

  const tablaDocx = (t: TablaWord): Tabla => {
    const n = t.cabecera.length
    let anchos = t.anchos && t.anchos.length === n ? t.anchos.slice() : []
    if (!anchos.length) {
      const primera = Math.round(anchoUtil / 3)
      const resto = n > 1 ? Math.floor((anchoUtil - primera) / (n - 1)) : 0
      anchos = [n > 1 ? primera : anchoUtil, ...Array.from({ length: n - 1 }, () => resto)]
    }
    // Los anchos suman EXACTAMENTE el ancho útil (se escalan si venían para otro ancho; el redondeo va a la última).
    const total = anchos.reduce((a, b) => a + b, 0)
    if (total !== anchoUtil && total > 0) anchos = anchos.map((a) => Math.round((a * anchoUtil) / total))
    anchos[n - 1] += anchoUtil - anchos.reduce((a, b) => a + b, 0)
    const derecha = new Set(t.alinearDerecha || [])
    const borde = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
    const bordes = { top: borde, bottom: borde, left: borde, right: borde }
    const tam = n > 4 ? 18 : 20
    const celda = (texto: string, i: number, opts: { cabecera?: boolean; fill?: string }) => new TableCell({
      borders: bordes, width: { size: anchos[i], type: WidthType.DXA },
      ...(opts.fill ? { shading: { type: ShadingType.CLEAR, fill: opts.fill, color: 'auto' } } : {}),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: derecha.has(i) ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: runs(texto, { bold: !!opts.cabecera, size: tam, color: opts.cabecera ? contrasteSobre(p.accent_color) : GRIS_NEUTRO }),
      })],
    })
    return new Table({
      width: { size: anchoUtil, type: WidthType.DXA }, columnWidths: anchos,
      rows: [
        new TableRow({ tableHeader: true, cantSplit: true, children: t.cabecera.map((x, i) => celda(x, i, { cabecera: true, fill: p.accent_color })) }),
        ...t.filas.map((fila, r) => new TableRow({
          cantSplit: true,
          children: Array.from({ length: n }, (_, i) => celda(String(fila[i] ?? ''), i, { fill: r % 2 === 0 ? 'FFFFFF' : 'F2F2F2' })),
        })),
      ],
    })
  }
  const tablaDeTexto = (filas: string[][]): Hijo[] => {
    const n = Math.max(...filas.map((f) => f.length))
    const cabecera = Array.from({ length: n }, (_, i) => filas[0][i] ?? '')
    const cuerpo = filas.slice(1).map((f) => Array.from({ length: n }, (_, i) => f[i] ?? ''))
    const alinearDerecha = Array.from({ length: n }, (_, i) => i).filter((i) => i > 0 && columnaNumerica(cuerpo, i))
    const anchos = n >= 3 ? [Math.round(anchoUtil * 0.34), ...Array.from({ length: n - 1 }, () => Math.floor((anchoUtil * 0.66) / (n - 1)))] : undefined
    return [tablaDocx({ cabecera, filas: cuerpo, alinearDerecha, anchos }), new Paragraph({ spacing: { after: 120 }, children: [] })]
  }

  const porConfirmar = (items: string[]): Hijo[] => [
    new Paragraph({
      spacing: { before: 200, after: 80 }, keepNext: true,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: AMBAR_BORDE, space: 4 } },
      children: [new TextRun({ text: 'Por confirmar antes de presentar:', bold: true, color: AMBAR })],
    }),
    ...items.filter((d) => d && d.trim()).map((d) => vineta(d, AMBAR)),
  ]

  const altText = (nombre: string) => ({ name: nombre, description: nombre, title: nombre })

  /** Figura dentro del texto: imagen al ancho útil (como mucho el 55 % del alto) y su pie. */
  const figuras = (d: DisenadaResuelta): Hijo[] => d.imagenes.flatMap((img, i) => [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, keepNext: true,
      children: [new ImageRun({ type: img.type, data: img.data, transformation: encajar(img, anchoUtil / 20, (altoUtil / 20) * 0.55), altText: altText(d.title) })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: d.imagenes.length > 1 ? `${d.title} (${i + 1}/${d.imagenes.length})` : d.title, italics: true, size: 18, color: GRIS })],
    }),
  ])

  // ----- Las partes del documento -----------------------------------------
  // El cuerpo va en secciones con membrete; cada página diseñada a sangre va
  // en una sección propia sin cabecera ni pie y sin márgenes, y después se
  // vuelve a abrir una sección con membrete.
  type ParteCuerpo = { tipo: 'cuerpo'; children: Hijo[] }
  type ParteSangre = { tipo: 'sangre'; d: DisenadaResuelta }
  const partes: (ParteCuerpo | ParteSangre)[] = [{ tipo: 'cuerpo', children: [] }]
  const cuerpo = (): ParteCuerpo => {
    const u = partes[partes.length - 1]
    if (u.tipo === 'cuerpo') return u
    const n: ParteCuerpo = { tipo: 'cuerpo', children: [] }
    partes.push(n)
    return n
  }
  const add = (...h: Hijo[]) => { cuerpo().children.push(...h) }
  const usadas = new Set<string>()
  const insertarDisenada = (d: DisenadaResuelta) => {
    usadas.add(d.id)
    if (d.placement === 'figure') add(...figuras(d))
    else partes.push({ tipo: 'sangre', d })
  }

  /** El texto de una sección, maquetado. */
  const renderTexto = (texto: string, color?: string) => {
    for (const b of parseBloques(texto)) {
      if (b.t === 'p') add(parrafo(b.texto, { color }))
      else if (b.t === 'h') add(subtitulo(b.texto))
      else if (b.t === 'ul') add(...b.items.map((x) => vineta(x, color)))
      else if (b.t === 'ol') { instanciaLista++; add(...b.items.map((x) => numerado(x, instanciaLista))) }
      else if (b.t === 'tabla') add(...tablaDeTexto(b.filas))
      else if (b.t === 'diseno') {
        const d = resolverReferencia(b.ref, disenadas) as DisenadaResuelta | null
        if (d && d.imagenes.length) insertarDisenada(d)
        // Un marcador sin página detrás no deja rastro: ya se avisó al guardar.
      }
    }
  }

  // ----- PORTADA -----------------------------------------------------------
  // Bloque de color: una tabla de dos filas (logo arriba, título abajo) sin
  // bordes y con el mismo relleno, que se ve como un solo bloque de ~55-60 %
  // de la página. Un párrafo sombreado no llega: el sombreado de párrafo no
  // crece a la altura que hace falta. Con hoja oficial el logo ya va en la
  // cabecera de todas las páginas y el bloque no lo repite.
  const altoBloque = Math.round(altoUtil * (conHoja ? 0.52 : 0.6))
  const altoLogo = conHoja ? Math.round(altoBloque * 0.22) : Math.round(altoBloque * 0.38)
  const celdaPortada = (alto: number, valign: (typeof VerticalAlignTable)[keyof typeof VerticalAlignTable], hijos: Parrafo[]) =>
    new TableRow({
      height: { value: alto, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        borders: sinBordes, verticalAlign: valign,
        width: { size: anchoUtil, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: p.cover_color, color: 'auto' },
        margins: { top: 500, bottom: 500, left: 600, right: 600 },
        children: hijos,
      })],
    })
  const textoPortada = contrasteSobre(p.cover_color)
  const logoPortada = conHoja
    ? [new Paragraph({ children: [new TextRun({ text: (p.company_name || p.brand_name).toUpperCase(), bold: true, color: textoPortada, size: 20 })] })]
    : p.logo
      ? [new Paragraph({ alignment: AlignmentType.LEFT, children: [new ImageRun({ type: p.logo.type, data: p.logo.data, transformation: encajar(p.logo, 260, 110), altText: altText(p.brand_name || 'Logo') })] })]
      : [new Paragraph({ children: [new TextRun({ text: p.brand_name.toUpperCase(), bold: true, color: textoPortada, size: 40 })] })]
  add(new Table({
    width: { size: anchoUtil, type: WidthType.DXA }, columnWidths: [anchoUtil],
    borders: { ...sinBordes, insideHorizontal: sinBorde, insideVertical: sinBorde },
    rows: [
      celdaPortada(altoLogo, VerticalAlignTable.TOP, logoPortada),
      celdaPortada(altoBloque - altoLogo, VerticalAlignTable.BOTTOM, [
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: rotulo.toUpperCase(), bold: true, color: textoPortada, size: 76 })] }),
        new Paragraph({ children: [new TextRun({ text: titulo.toUpperCase(), color: textoPortada, size: 28 })] }),
      ]),
    ],
  }))
  add(new Paragraph({ spacing: { before: 480, after: 60 }, children: [new TextRun({ text: p.company_name || p.brand_name, bold: true, size: 24, color: GRIS_NEUTRO })] }))
  if (p.tagline) add(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: p.tagline, italics: true, size: 22, color: GRIS })] }))
  if (expediente) add(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Expediente ${expediente}`, size: 22, color: GRIS_NEUTRO })] }))
  if (organo) add(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Órgano de contratación: ${organo}`, size: 22, color: GRIS_NEUTRO })] }))
  add(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: fechaPortada(ciudad), size: 22, color: GRIS })] }))
  add(salto())

  // ----- ÍNDICE ------------------------------------------------------------
  // Manual, sin campo TOC: el campo pide «actualizar» al abrir y confunde. Los
  // números salen del numbering (DECIMAL), nunca escritos a mano, y coinciden
  // con los de las secciones porque estas se numeran en el mismo orden.
  const bandaIzq = { left: { style: BorderStyle.SINGLE, size: 24, color: p.accent_color, space: 12 } }
  add(new Paragraph({ border: bandaIzq, spacing: { after: 240 }, indent: { left: 240 }, children: [new TextRun({ text: 'ÍNDICE', bold: true, size: 30, color: acento })] }))
  const entradaIndice = (t: string) => new Paragraph({ numbering: { reference: 'indice', level: 0 }, spacing: { after: 100 }, children: [new TextRun({ text: t.toUpperCase(), size: 22, color: GRIS_NEUTRO })] })
  const entradaIndiceSinNumero = (t: string, color = GRIS) => new Paragraph({ indent: { left: 567 }, spacing: { after: 100 }, children: [new TextRun({ text: t.toUpperCase(), size: 22, color })] })
  secciones.forEach((s) => add(entradaIndice(s.titulo || 'Sección')))
  bloques.forEach((b) => add(entradaIndiceSinNumero(b.titulo || '')))
  if (tabla && !secciones.length && !bloques.length) add(entradaIndiceSinNumero('Desglose de precios'))
  if (anexos.length) {
    add(entradaIndiceSinNumero('Anexos', GRIS_NEUTRO))
    anexos.forEach((a) => add(new Paragraph({ indent: { left: 1134 }, spacing: { after: 80 }, children: [new TextRun({ text: a.title, size: 20, color: GRIS })] })))
  }
  add(salto())

  // ----- SECCIONES ---------------------------------------------------------
  const encabezado = (texto: string, numero?: number, puntos?: number | null) => new Paragraph({
    heading: 'Heading1',
    children: [
      ...(typeof numero === 'number' ? [new TextRun({ text: `${numero}. `, color: GRIS })] : []),
      new TextRun({ text: texto.toUpperCase(), color: acento }),
      ...(typeof puntos === 'number' && Number.isFinite(puntos) ? [new TextRun({ text: ` (${puntos} puntos)`, bold: false, size: 22, color: GRIS_CLARO })] : []),
    ],
  })
  secciones.forEach((s, i) => {
    add(encabezado(s.titulo || 'Sección', i + 1, s.puntos))
    renderTexto(s.contenido || '')
    if (s.porConfirmar?.length) add(...porConfirmar(s.porConfirmar))
  })

  // ----- TABLA (oferta) ----------------------------------------------------
  if (tabla && tabla.cabecera.length) {
    add(tablaDocx(tabla))
    if (tabla.pie) add(new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: tabla.pie, bold: true })] }))
  }

  // ----- BLOQUES (secciones sin número) ------------------------------------
  for (const b of bloques) {
    add(encabezado(b.titulo || ''))
    for (const t of b.parrafos || []) renderTexto(t)
  }
  if (pendientes.length) add(...porConfirmar(pendientes))

  // ----- ANEXOS: páginas diseñadas de «siempre» que el texto no colocó -----
  const anexosPendientes = anexos.filter((a) => !usadas.has(a.id))
  if (anexosPendientes.length) {
    add(encabezado('Anexos'))
    add(parrafo('Se incluyen a continuación los siguientes documentos de la empresa:', { justificar: false }))
    add(...anexosPendientes.map((a) => vineta(a.title)))
    for (const a of anexosPendientes) insertarDisenada(a)
  }

  // ----- NOTAS INTERNAS ----------------------------------------------------
  // Sin estilo de encabezado a propósito: iban con Heading 1 y entraban en la
  // navegación y en el índice, y se presentaban a la administración.
  if (internas.length) {
    add(new Paragraph({ pageBreakBefore: true, spacing: { after: 200 }, children: [new TextRun({ text: 'NOTAS INTERNAS — ELIMINAR ANTES DE PRESENTAR', bold: true, color: AMBAR, size: 26 })] }))
    for (const nnota of internas) add(vineta(nnota, AMBAR))
  }

  // ----- CABECERA Y PIE ----------------------------------------------------
  // Con hoja: marcas que membrete.ts sustituye por la cabecera y el pie reales.
  // Sin hoja: logo + rótulo arriba, línea legal + «Página X de Y» abajo, y la
  // portada limpia (titlePage + first vacíos).
  const tituloCorto = titulo.length > 70 ? `${titulo.slice(0, 69).trimEnd()}…` : titulo
  const vacio = () => ({ children: [new Paragraph({ children: [] })] })
  const cabecera = () => conHoja
    ? new Header({ children: [new Paragraph({ children: [new TextRun({ text: MARCA_CABECERA, size: 2, color: 'FFFFFF' })] })] })
    : new Header({
      children: [new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: anchoUtil }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.accent_color, space: 4 } },
        spacing: { after: 120 },
        children: [
          ...(p.logo
            ? [new ImageRun({ type: p.logo.type, data: p.logo.data, transformation: encajar(p.logo, 170, 60), altText: altText(p.brand_name || 'Logo') })]
            : [new TextRun({ text: p.brand_name, bold: true, size: 16, color: acento })]),
          // Tab REAL (<w:tab/>), no el carácter: dentro de <w:t> es texto y no obedece al tab stop.
          new TextRun({ children: [new Tab(), `${rotulo} — ${tituloCorto}`], size: 16, color: GRIS }),
        ],
      })],
    })
  const pie = () => conHoja
    ? new Footer({ children: [new Paragraph({ children: [new TextRun({ text: MARCA_PIE, size: 2, color: 'FFFFFF' })] })] })
    : new Footer({
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.footer_line || p.company_name || p.brand_name, size: 14, color: GRIS })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: 'Página ', size: 14, color: GRIS_CLARO }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, color: GRIS_CLARO }),
          new TextRun({ text: ' de ', size: 14, color: GRIS_CLARO }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: GRIS_CLARO }),
        ] }),
      ],
    })

  const pagina = { size: { width: A4.width, height: A4.height, orientation: PageOrientation.PORTRAIT } }
  const seccionCuerpo = (parte: ParteCuerpo, primera: boolean) => ({
    properties: {
      ...(primera ? {} : { type: SectionType.NEXT_PAGE }),
      titlePage: primera && !conHoja,
      page: { ...pagina, margin: { top: margenes.top, right: margenes.right, bottom: margenes.bottom, left: margenes.left, header: margenes.header, footer: margenes.footer } },
    },
    headers: { default: cabecera(), ...(primera && !conHoja ? { first: new Header(vacio()) } : {}) },
    footers: { default: pie(), ...(primera && !conHoja ? { first: new Footer(vacio()) } : {}) },
    children: parte.children,
  })
  // Página a sangre: la imagen flota anclada a la PÁGINA (como las de la hoja
  // de GTD) y el párrafo que la sostiene es minúsculo, así cabe el salto de
  // sección en la misma página y no aparece una hoja en blanco detrás.
  const seccionSangre = (parte: ParteSangre) => ({
    properties: { type: SectionType.NEXT_PAGE, page: { ...pagina, margin: { top: 57, right: 57, bottom: 57, left: 57, header: 0, footer: 0 } } },
    headers: { default: new Header(vacio()) },
    footers: { default: new Footer(vacio()) },
    children: parte.d.imagenes.map((img, i) => {
      const caja = encajar(img, A4_PT.w, A4_PT.h)
      const offX = Math.round(((px(A4_PT.w) - caja.width) / 2) * EMU_PX)
      const offY = Math.round(((px(A4_PT.h) - caja.height) / 2) * EMU_PX)
      return new Paragraph({
        ...(i ? { pageBreakBefore: true } : {}),
        spacing: { before: 0, after: 0 },
        children: [new ImageRun({
          type: img.type, data: img.data, transformation: caja, altText: altText(parte.d.title),
          floating: {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.max(0, offX) },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.max(0, offY) },
            wrap: { type: TextWrappingType.NONE }, behindDocument: true, allowOverlap: true, lockAnchor: true,
          },
        })],
      })
    }),
  })

  // Una parte de cuerpo vacía (dos páginas a sangre seguidas) no genera sección: sería una hoja en blanco.
  const partesUtiles = partes.filter((x, i) => x.tipo === 'sangre' || x.children.length || i === 0)
  const sections = partesUtiles.map((parte, i) => (parte.tipo === 'cuerpo' ? seccionCuerpo(parte, i === 0) : seccionSangre(parte)))

  const doc = new Document({
    creator: p.company_name || p.brand_name || 'MIRA',
    title: `${rotulo} — ${titulo}`,
    description: p.tagline || undefined,
    styles: {
      default: {
        document: {
          run: { font: p.body_font, size: 22, color: GRIS_NEUTRO },
          paragraph: { spacing: { line: 276, after: 120 } },
        },
      },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 30, bold: true, font: p.body_font, color: acento },
          paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true, keepLines: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: p.body_font, color: acento },
          paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1, keepNext: true, keepLines: true } },
      ],
    },
    numbering: {
      config: [
        { reference: 'indice', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 567, hanging: 360 } }, run: { bold: true, color: acento } } }] },
        { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 567, hanging: 283 } } } }] },
        { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 567, hanging: 360 } } } }] },
      ],
    },
    sections,
  })

  const buffer = await Packer.toBuffer(doc)
  return conHoja ? aplicarMembrete(buffer, p.membrete!, { numerarPaginas: true }) : buffer
}

/** Rótulo de portada según el tipo de documento. El kind desconocido sale tal cual, en mayúsculas. */
export function rotuloPorKind(kind: string | null | undefined): string {
  const k = String(kind || '').toLowerCase()
  if (k === 'memoria') return 'MEMORIA TÉCNICA'
  if (k === 'oferta') return 'OFERTA ECONÓMICA'
  if (k === 'anexo') return 'ANEXO'
  // Lo que sube la persona (kind 'subido') no puede salir rotulado «SUBIDO» en la portada: es su memoria del año pasado.
  if (k === 'subido' || !k) return 'DOCUMENTO'
  return k.replace(/[_-]+/g, ' ').toUpperCase()
}
