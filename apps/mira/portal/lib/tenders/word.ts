import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'
import { jsonObject } from '@/lib/db-json'
import { aplicarMembrete, leerMembrete, MARCA_CABECERA, MARCA_PIE, MAX_MEMBRETE_BYTES, type MargenesMembrete, type Membrete } from '@/lib/tenders/membrete'
import { encajar, medirImagen, px, type LogoWord } from '@/lib/tenders/word-imagen'
import { resolverReferencia, type DisenadaResuelta } from '@/lib/tenders/disenadas'
import { paleta, contrasteSobre, luminancia, TIPO, ESPACIO, INTERLINEADO, iconoParaTitulo, iconoPng, ICONO_INDICE, ICONO_NOTAS, ICONO_ANEXOS } from '@/lib/tenders/word-estilo'

export { medirImagen, type LogoWord }
export { contrasteSobre, paleta }

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
// Desde el 7-oct el aspecto sale de un SISTEMA DE DISEÑO (word-estilo.ts):
// de los dos colores de la plantilla se deriva la paleta (acento, acento como
// texto, tinta al 7 %, filetes, grises con sesgo), y las escalas de tipografía
// y espacio son fijas para que todas las marcas se vean de la misma casa.
//   · Títulos de sección: una «banda» (tabla de una fila) con el número en una
//     caja del acento, el título en mayúsculas con estilo Heading 1 y una
//     loseta con un icono elegido por las palabras del título (Lucide, PNG
//     monocromos en lib/tenders/iconos/, incrustados en base64: en Vercel no
//     hay fs fiable). Sin número (índice, anexos, bloques) el icono va en la caja.
//   · Tablas: cabecera con el acento y versales, cebra con la tinta, solo
//     filetes horizontales, numéricas a la derecha, filas que no se parten y
//     cabecera que se repite; el cierre es un filete más grueso del acento oscuro.
//   · Portada: logo sobre blanco (nunca dentro del bloque: un PNG con fondo
//     salía como una tarjeta), bloque de color con rótulo, regla corta y
//     título, y debajo la rejilla de datos. Cabe en una página por presupuesto
//     de altura, no por fe.
//   · Avisos (por confirmar, [FALTA], notas internas) en ámbar fijo.
//
// Reglas de la librería docx (^9.8) que ya nos han mordido: el PageBreak va
// DENTRO de un Paragraph; ImageRun exige `type`; un '\n' dentro de un TextRun
// no salta de línea; el sombreado es ShadingType.CLEAR; los anchos van en DXA
// (nada de WidthType.PERCENTAGE) y los colores SIN '#'. Una tabla no tiene
// espaciado propio: el aire antes y después lo pone un párrafo «Espaciador»
// (estilo de 4 pt; un párrafo vacío normal mide una línea entera). El borde de
// párrafo respeta las sangrías (así se hace una regla corta). El `keepNext` de
// los párrafos de una fila mantiene la banda con lo que sigue en Word;
// LibreOffice no lo honra en tablas y puede dejar un título a pie de página.

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

/** El acento usado como COLOR DE TEXTO sobre página blanca: si es demasiado claro para leerse, gris oscuro. (La paleta completa está en word-estilo.ts.) */
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

/**
 * Título de sección limpio para numerarlo nosotros: fuera el «1.» / «2.3» / «B)»
 * que ya traía (un Word subido vuelve con sus números y salía «1. 1. OBJETO»)
 * y fuera el «(20 puntos)» del final, que pasa al run gris de puntos.
 */
export function limpiarTituloSeccion(titulo: string): { titulo: string; puntos: number | null } {
  let t = String(titulo || '').replace(/\s+/g, ' ').trim()
  let puntos: number | null = null
  const m = /\(\s*(\d+(?:[.,]\d+)?)\s*puntos?\s*\)\s*$/i.exec(t)
  if (m) { puntos = Number(m[1].replace(',', '.')); t = t.slice(0, m.index).trim() }
  t = t.replace(/^(?:[A-Z]|\d{1,2})?(?:\d{1,2})?(?:\.\d{1,2}){0,2}[.)\-–]\s+(?=\S)/, '').replace(/^(?:\d{1,2}(?:\.\d{1,2}){0,2})\s+(?=[A-ZÁÉÍÓÚÑ])/, '').trim()
  return { titulo: t || 'Sección', puntos }
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

const AMBAR = '8A5A00'
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
    Table, TableRow, TableCell, WidthType, ShadingType, HeightRule, VerticalAlignTable, LevelFormat, TableLayoutType, LeaderType,
    Header, Footer, PageNumber, TabStopType, Tab, SectionType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,
  } = await import('docx')

  type Parrafo = InstanceType<typeof Paragraph>
  type Tabla = InstanceType<typeof Table>
  type Hijo = Parrafo | Tabla
  type Run = InstanceType<typeof TextRun> | InstanceType<typeof ImageRun>

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
  const E = paleta(p.cover_color, p.accent_color)

  const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const sinBordes = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde }
  const sinBordesTabla = { ...sinBordes, insideHorizontal: sinBorde, insideVertical: sinBorde }
  const filete = (color = E.linea, size = 4) => ({ style: BorderStyle.SINGLE, size, color })
  const sombra = (fill: string) => ({ type: ShadingType.CLEAR, fill, color: 'auto' })
  const altText = (nombre: string) => ({ name: nombre, description: nombre, title: nombre })

  // ----- Piezas ------------------------------------------------------------
  const runs = (texto: string, base: { color?: string; size?: number; bold?: boolean; italics?: boolean } = {}): Run[] =>
    trozosInline(texto).map((tr) => new TextRun({
      text: tr.texto,
      bold: tr.aviso || tr.negrita || base.bold || undefined,
      italics: base.italics,
      size: base.size,
      color: tr.aviso ? E.ambar.texto : base.color,
      // El [FALTA: …] va resaltado en ámbar: tiene que verse para que no se cuele en lo que se presenta.
      ...(tr.aviso ? { shading: sombra(E.ambar.resalte) } : {}),
    }))

  let instanciaLista = 0
  const parrafo = (texto: string, opts: { color?: string; justificar?: boolean } = {}) =>
    new Paragraph({ alignment: opts.justificar === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED, spacing: { after: ESPACIO.parrafo }, widowControl: true, children: runs(texto, { color: opts.color }) })
  const vineta = (t: string, color?: string) =>
    new Paragraph({ numbering: { reference: color === AMBAR ? 'vinetas-ambar' : 'vinetas', level: 0 }, spacing: { after: ESPACIO.item }, children: runs(t, { color: color === AMBAR ? E.ambar.texto : color }) })
  const numerado = (t: string, instance: number) =>
    new Paragraph({ numbering: { reference: 'numeros', level: 0, instance }, spacing: { after: ESPACIO.item }, children: runs(t) })
  /** Párrafo mínimo (4 pt) para dar aire antes o después de una tabla, que no admite espaciado propio. */
  const espacio = (o: { before?: number; after?: number; keepNext?: boolean; pageBreakBefore?: boolean } = {}) =>
    new Paragraph({ style: 'Espaciador', spacing: { before: o.before ?? 0, after: o.after ?? 0, line: 240 }, keepNext: o.keepNext, pageBreakBefore: o.pageBreakBefore, children: [] })
  const salto = () => new Paragraph({ children: [new PageBreak()] })
  /** Rótulo pequeño en versales espaciadas (etiquetas de portada, cabeceras de tabla). */
  const versales = (texto: string, o: { color: string; size: number; bold?: boolean }) =>
    new TextRun({ text: texto.toUpperCase(), bold: o.bold ?? true, size: o.size, color: o.color, characterSpacing: 12 })

  // El subapartado («## Ámbito» → 1.1 Ámbito): número en el margen, título alineado con el de la sección.
  const sangriaTitulo = ESPACIO.cajaTitulo + ESPACIO.huecoTitulo
  const subtitulo = (t: string, numero?: string) => new Paragraph({
    heading: 'Heading2',
    ...(numero ? { indent: { left: sangriaTitulo, hanging: sangriaTitulo }, tabStops: [{ type: TabStopType.LEFT, position: sangriaTitulo }] } : {}),
    children: [
      ...(numero ? [new TextRun({ children: [numero, new Tab()], bold: false, color: E.acentoTexto })] : []),
      ...runs(t.replace(/\*\*/g, ''), { color: E.acentoTexto, bold: true }),
    ],
  })

  /** Icono Lucide en PNG, al tamaño en puntos; null si no existe. */
  const icono = (nombre: string, variante: 'oscuro' | 'blanco', pt: number): Run | null => {
    const data = iconoPng(nombre, variante)
    return data ? new ImageRun({ type: 'png', data, transformation: { width: px(pt), height: px(pt) }, altText: altText(nombre) }) : null
  }

  /**
   * La pieza de marca de los títulos: una caja con el acento (el número de la
   * sección, o un icono cuando no hay número), el título en mayúsculas y, si
   * la sección va numerada, una loseta suave a la derecha con el icono que le
   * corresponde por sus palabras. Es una tabla de una fila: el párrafo del
   * título lleva el estilo Heading 1 (navegación de Word) y todos los párrafos
   * de la fila llevan keepNext para que la fila viaje con lo que la sigue.
   */
  const banda = (o: { titulo: string; numero?: number; puntos?: number | null; icono?: string; heading?: boolean; fill?: string; sobreFill?: string; color?: string }): Hijo[] => {
    const fill = o.fill || E.acento
    const sobreFill = o.sobreFill || contrasteSobre(fill)
    const color = o.color || E.acentoTexto
    const caja = ESPACIO.cajaTitulo
    const variante = sobreFill === 'FFFFFF' ? 'blanco' : 'oscuro'
    const numerada = typeof o.numero === 'number'
    const enCaja: Run = numerada
      ? new TextRun({ text: String(o.numero), bold: true, size: TIPO.h1Numero, color: sobreFill })
      : (o.icono && icono(o.icono, variante, 17)) || new TextRun({ text: '—', bold: true, size: TIPO.h1Numero, color: sobreFill })
    const loseta = numerada && o.icono ? icono(o.icono, 'oscuro', 17) : null
    const anchoTitulo = anchoUtil - caja - (loseta ? caja : 0)
    const celdaCaja = (relleno: string, hijo: Run) => new TableCell({
      borders: sinBordes, width: { size: caja, type: WidthType.DXA }, shading: sombra(relleno), verticalAlign: VerticalAlignTable.CENTER,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 240 }, keepNext: true, children: [hijo] })],
    })
    const fila = new TableRow({
      cantSplit: true, height: { value: caja, rule: HeightRule.ATLEAST },
      children: [
        celdaCaja(fill, enCaja),
        new TableCell({
          borders: { ...sinBordes, bottom: filete(E.linea, 6) }, width: { size: anchoTitulo, type: WidthType.DXA }, verticalAlign: VerticalAlignTable.CENTER,
          margins: { top: 40, bottom: 40, left: ESPACIO.huecoTitulo, right: 120 },
          children: [new Paragraph({
            ...(o.heading === false ? {} : { heading: 'Heading1' }),
            keepNext: true, keepLines: true, spacing: { before: 0, after: 0, line: 240 },
            children: [
              new TextRun({ text: o.titulo.toUpperCase(), bold: true, size: TIPO.h1, color }),
              ...(typeof o.puntos === 'number' && Number.isFinite(o.puntos) ? [new TextRun({ text: `   ${o.puntos} puntos`, bold: false, size: TIPO.nota, color: E.textoMudo })] : []),
            ],
          })],
        }),
        ...(loseta ? [celdaCaja(E.tinta, loseta)] : []),
      ],
    })
    return [
      espacio({ before: ESPACIO.antesH1, keepNext: true }),
      new Table({ width: { size: anchoUtil, type: WidthType.DXA }, columnWidths: loseta ? [caja, anchoTitulo, caja] : [caja, anchoTitulo], layout: TableLayoutType.FIXED, borders: sinBordesTabla, rows: [fila] }),
      espacio({ after: ESPACIO.despuesH1, keepNext: true }),
    ]
  }

  /**
   * Tabla de datos: cabecera con el acento, cebra con la tinta, solo filetes
   * horizontales, numéricas a la derecha, filas que no se parten y cabecera
   * que se repite al cambiar de página.
   */
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
    const densa = n > 4 || t.filas.length > 12
    const tam = densa ? TIPO.tablaDensa : TIPO.tabla
    const ultima = t.filas.length - 1
    const celda = (texto: string, i: number, o: { cabecera?: boolean; fila?: number }) => new TableCell({
      borders: {
        top: o.cabecera ? sinBorde : filete(),
        bottom: o.cabecera ? sinBorde : o.fila === ultima ? filete(E.acentoOscuro, 8) : filete(),
        left: sinBorde, right: sinBorde,
      },
      width: { size: anchos[i], type: WidthType.DXA },
      shading: sombra(o.cabecera ? E.acento : (o.fila ?? 0) % 2 ? E.tinta : 'FFFFFF'),
      verticalAlign: VerticalAlignTable.CENTER,
      margins: { top: ESPACIO.celdaV, bottom: ESPACIO.celdaV, left: ESPACIO.celdaH, right: ESPACIO.celdaH },
      children: [new Paragraph({
        alignment: derecha.has(i) ? AlignmentType.RIGHT : AlignmentType.LEFT,
        spacing: { before: 0, after: 0, line: 240 },
        children: o.cabecera
          ? [versales(texto, { color: E.sobreAcento, size: TIPO.tablaCabecera })]
          : runs(texto, { size: tam, color: E.texto }),
      })],
    })
    return new Table({
      width: { size: anchoUtil, type: WidthType.DXA }, columnWidths: anchos, layout: TableLayoutType.FIXED, borders: sinBordesTabla,
      rows: [
        new TableRow({ tableHeader: true, cantSplit: true, height: { value: ESPACIO.cabeceraMin, rule: HeightRule.ATLEAST }, children: t.cabecera.map((x, i) => celda(x, i, { cabecera: true })) }),
        ...t.filas.map((fila, r) => new TableRow({
          cantSplit: true, height: { value: ESPACIO.filaMin, rule: HeightRule.ATLEAST },
          children: Array.from({ length: n }, (_, i) => celda(String(fila[i] ?? ''), i, { fila: r })),
        })),
      ],
    })
  }
  /** Tabla + su pie opcional + el aire de después, que la tabla no sabe darse. */
  const tablaCompleta = (t: TablaWord): Hijo[] => [
    espacio({ before: ESPACIO.antesTabla, keepNext: true }),
    tablaDocx(t),
    ...(t.pie ? [new Paragraph({ spacing: { before: 120, after: 0 }, alignment: AlignmentType.LEFT, children: [new TextRun({ text: t.pie, bold: true, size: TIPO.pieTabla, color: E.acentoTexto })] })] : []),
    espacio({ after: ESPACIO.despuesTabla }),
  ]
  const tablaDeTexto = (filas: string[][]): Hijo[] => {
    const n = Math.max(...filas.map((f) => f.length))
    const cabecera = Array.from({ length: n }, (_, i) => filas[0][i] ?? '')
    const cuerpo = filas.slice(1).map((f) => Array.from({ length: n }, (_, i) => f[i] ?? ''))
    const alinearDerecha = Array.from({ length: n }, (_, i) => i).filter((i) => i > 0 && columnaNumerica(cuerpo, i))
    const anchos = n >= 3 ? [Math.round(anchoUtil * 0.34), ...Array.from({ length: n - 1 }, () => Math.floor((anchoUtil * 0.66) / (n - 1)))] : undefined
    return tablaCompleta({ cabecera, filas: cuerpo, alinearDerecha, anchos })
  }

  /** Aviso editorial: bloque ámbar con banda a la izquierda. Una celda, para que el fondo abrace todas las líneas. */
  const porConfirmar = (items: string[]): Hijo[] => [
    espacio({ before: ESPACIO.antesAviso, keepNext: true }),
    new Table({
      width: { size: anchoUtil, type: WidthType.DXA }, columnWidths: [anchoUtil], layout: TableLayoutType.FIXED, borders: sinBordesTabla,
      rows: [new TableRow({ cantSplit: true, children: [new TableCell({
        borders: { ...sinBordes, left: { style: BorderStyle.SINGLE, size: 24, color: E.ambar.borde } },
        width: { size: anchoUtil, type: WidthType.DXA }, shading: sombra(E.ambar.fondo),
        margins: { top: 140, bottom: 100, left: 240, right: 200 },
        children: [
          new Paragraph({ spacing: { before: 0, after: 80 }, keepNext: true, children: [versales('Por confirmar antes de presentar', { color: E.ambar.texto, size: TIPO.tablaCabecera })] }),
          ...items.filter((d) => d && d.trim()).map((d) => vineta(d, AMBAR)),
        ],
      })] })],
    }),
    espacio({ after: ESPACIO.despuesAviso }),
  ]

  /** Figura dentro del texto: imagen al ancho útil (como mucho el 55 % del alto) y su pie. */
  const figuras = (d: DisenadaResuelta): Hijo[] => d.imagenes.flatMap((img, i) => [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 240, after: 80 }, keepNext: true,
      children: [new ImageRun({ type: img.type, data: img.data, transformation: encajar(img, anchoUtil / 20, (altoUtil / 20) * 0.55), altText: altText(d.title) })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 280 },
      children: [new TextRun({ text: d.imagenes.length > 1 ? `${d.title} (${i + 1}/${d.imagenes.length})` : d.title, italics: true, size: TIPO.pieFigura, color: E.textoSuave })],
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
  const renderTexto = (texto: string, color?: string, numeroSeccion?: number) => {
    let j = 0
    for (const b of parseBloques(texto)) {
      if (b.t === 'p') add(parrafo(b.texto, { color }))
      else if (b.t === 'h') add(subtitulo(b.texto, typeof numeroSeccion === 'number' ? `${numeroSeccion}.${++j}` : undefined))
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
  // Logo sobre papel blanco (un PNG con fondo blanco dentro del bloque de
  // color salía como una tarjeta pegada), bloque de color de ~55 % de la
  // página con el rótulo grande y el título, y debajo la razón social, el
  // tagline y una rejilla de datos (expediente, órgano, fecha). Con hoja
  // oficial el logo ya va en la cabecera y la portada no lo repite.
  const anchoBloqueInterior = anchoUtil - 2 * 680
  const anchoEtiqueta = 3100
  const datosPortada: [string, string][] = [
    ...(expediente ? [['Expediente', expediente] as [string, string]] : []),
    ...(organo ? [['Órgano de contratación', organo] as [string, string]] : []),
    ['Lugar y fecha', fechaPortada(ciudad)],
  ]
  // La portada tiene que caber en UNA página: el bloque se lleva la mitad del
  // alto útil, salvo que lo que va encima (logo) y debajo (razón social,
  // tagline, rejilla de datos) no le dejen; entonces cede él, con una reserva
  // para un título de tres líneas y las diferencias entre Word y LibreOffice.
  const altoLogo = conHoja ? 240 : (p.logo ? Math.round(encajar(p.logo, 190, 56).height * 15) : 720) + 280
  const altoDebajo = 360 + 600 + (p.tagline ? 480 : 0) + 400 + datosPortada.length * 500
  const altoBloque = Math.min(Math.round(altoUtil * 0.5), altoUtil - altoLogo - altoDebajo - 900)
  const altoEtiqueta = Math.round(altoBloque * 0.3)
  const filaPortada = (alto: number, valign: (typeof VerticalAlignTable)[keyof typeof VerticalAlignTable], hijos: Parrafo[]) =>
    new TableRow({
      height: { value: alto, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        borders: sinBordes, verticalAlign: valign,
        width: { size: anchoUtil, type: WidthType.DXA },
        shading: sombra(E.portada),
        margins: { top: 560, bottom: 620, left: 680, right: 680 },
        children: hijos,
      })],
    })
  if (!conHoja) {
    add(p.logo
      ? new Paragraph({ spacing: { before: 0, after: 280, line: 240 }, children: [new ImageRun({ type: p.logo.type, data: p.logo.data, transformation: encajar(p.logo, 190, 56), altText: altText(p.brand_name || 'Logo') })] })
      : new Paragraph({ spacing: { before: 0, after: 280, line: 240 }, children: [new TextRun({ text: p.brand_name, bold: true, size: 36, color: E.acentoTexto })] }))
  } else {
    add(espacio({ after: 240 }))
  }
  add(new Table({
    width: { size: anchoUtil, type: WidthType.DXA }, columnWidths: [anchoUtil], layout: TableLayoutType.FIXED, borders: sinBordesTabla,
    rows: [
      filaPortada(altoEtiqueta, VerticalAlignTable.TOP, [
        new Paragraph({ spacing: { after: 0 }, children: [versales(p.brand_name || p.company_name, { color: E.sobrePortada, size: TIPO.portadaEtiqueta })] }),
      ]),
      filaPortada(altoBloque - altoEtiqueta, VerticalAlignTable.BOTTOM, [
        new Paragraph({ spacing: { after: 160, line: 240 }, children: [new TextRun({ text: rotulo.toUpperCase(), bold: true, color: E.sobrePortada, size: TIPO.portadaRotulo })] }),
        // Una regla corta (3 cm): el borde de párrafo respeta las sangrías, así que se acorta por la derecha.
        new Paragraph({ style: 'Espaciador', indent: { right: Math.max(0, anchoBloqueInterior - 1700) }, spacing: { before: 0, after: 300, line: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: E.sobrePortada, space: 1 } }, children: [] }),
        new Paragraph({ spacing: { after: 0, line: 300 }, children: [new TextRun({ text: titulo.toUpperCase(), color: E.sobrePortada, size: TIPO.portadaTitulo })] }),
      ]),
    ],
  }))
  add(new Paragraph({ spacing: { before: 360, after: 40, line: 240 }, children: [new TextRun({ text: p.company_name || p.brand_name, bold: true, size: TIPO.portadaEmpresa, color: E.texto })] }))
  if (p.tagline) add(new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: p.tagline, italics: true, size: TIPO.portadaMeta, color: E.textoSuave })] }))
  add(
    espacio({ before: 280, after: 120 }),
    new Table({
      width: { size: anchoUtil, type: WidthType.DXA }, columnWidths: [anchoEtiqueta, anchoUtil - anchoEtiqueta], layout: TableLayoutType.FIXED, borders: sinBordesTabla,
      rows: datosPortada.map(([k, v], i) => new TableRow({ cantSplit: true, children: [
        new TableCell({
          borders: { ...sinBordes, top: filete(E.linea, i === 0 ? 8 : 4) }, width: { size: anchoEtiqueta, type: WidthType.DXA }, verticalAlign: VerticalAlignTable.CENTER,
          margins: { top: 100, bottom: 100, left: 0, right: 120 },
          children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: [versales(k, { color: E.textoMudo, size: TIPO.tablaCabecera })] })],
        }),
        new TableCell({
          borders: { ...sinBordes, top: filete(E.linea, i === 0 ? 8 : 4) }, width: { size: anchoUtil - anchoEtiqueta, type: WidthType.DXA }, verticalAlign: VerticalAlignTable.CENTER,
          margins: { top: 100, bottom: 100, left: 120, right: 0 },
          children: [new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: v, size: TIPO.portadaMeta, color: E.texto })] })],
        }),
      ] })),
    }),
  )
  add(salto())

  // ----- ÍNDICE ------------------------------------------------------------
  // Manual, sin campo TOC: el campo pide «actualizar» al abrir y confunde. Los
  // números salen del numbering (DECIMAL), nunca escritos a mano, y coinciden
  // con los de las secciones porque estas se numeran en el mismo orden. Dos
  // niveles (Carlos, 7-oct): «en el índice debe aparecer el desglose de los
  // servicios específicos para que el licitador encuentre todo de forma muy
  // fácil». Los subapartados salen de los «## » del texto, numerados igual que
  // en el cuerpo (1.1, 1.2…). Si las secciones traen puntuación, va a la
  // derecha con puntos de guía: el evaluador ve de un vistazo dónde está el peso.
  add(...banda({ titulo: 'Índice', icono: ICONO_INDICE, heading: false }))
  const puntosDe = (s: SeccionWord) => { const l = limpiarTituloSeccion(s.titulo || 'Sección'); return typeof s.puntos === 'number' ? s.puntos : l.puntos }
  const hayPuntos = secciones.some((s) => typeof puntosDe(s) === 'number' && Number.isFinite(puntosDe(s) as number))
  const tabIndice = hayPuntos ? [{ type: TabStopType.RIGHT, position: anchoUtil, leader: LeaderType.DOT }] : []
  const entradaIndiceSinNumero = (t: string, color = E.texto) => new Paragraph({
    indent: { left: sangriaTitulo }, spacing: { before: 140, after: 60 }, keepNext: true,
    border: { top: filete(E.linea, 4) },
    children: [new TextRun({ text: t.toUpperCase(), bold: true, size: TIPO.indice, color })],
  })
  secciones.forEach((s, i) => {
    const limpio = limpiarTituloSeccion(s.titulo || 'Sección')
    const puntos = puntosDe(s)
    const subs = parseBloques(s.contenido || '').filter((b): b is Extract<Bloque, { t: 'h' }> => b.t === 'h')
    add(new Paragraph({
      numbering: { reference: 'indice', level: 0 }, spacing: { before: i ? 140 : 0, after: subs.length ? 40 : 60 }, keepNext: true, tabStops: tabIndice,
      ...(i ? { border: { top: filete(E.linea, 4) } } : {}),
      children: [
        new TextRun({ text: limpio.titulo.toUpperCase(), bold: true, size: TIPO.indice, color: E.texto }),
        ...(typeof puntos === 'number' && Number.isFinite(puntos) ? [new TextRun({ children: [new Tab(), `${puntos} puntos`], size: TIPO.nota, color: E.textoSuave })] : []),
      ],
    }))
    subs.forEach((b, j) => add(new Paragraph({
      indent: { left: sangriaTitulo + 720, hanging: 720 }, tabStops: [{ type: TabStopType.LEFT, position: sangriaTitulo + 720 }], spacing: { after: 30 },
      children: [new TextRun({ children: [`${i + 1}.${j + 1}`, new Tab()], size: TIPO.indiceSub, color: E.acentoTexto }), new TextRun({ text: b.texto.replace(/\*\*/g, ''), size: TIPO.indiceSub, color: E.textoSuave })],
    })))
  })
  bloques.forEach((b) => add(entradaIndiceSinNumero(b.titulo || '')))
  if (tabla && !secciones.length && !bloques.length) add(entradaIndiceSinNumero('Desglose de precios'))
  if (anexos.length) {
    add(entradaIndiceSinNumero('Anexos'))
    anexos.forEach((a) => add(new Paragraph({ indent: { left: sangriaTitulo + 720 }, spacing: { after: 30 }, children: [new TextRun({ text: a.title, size: TIPO.indiceSub, color: E.textoSuave })] })))
  }
  add(salto())

  // ----- SECCIONES ---------------------------------------------------------
  secciones.forEach((s, i) => {
    const limpio = limpiarTituloSeccion(s.titulo || 'Sección')
    add(...banda({ titulo: limpio.titulo, numero: i + 1, puntos: puntosDe(s), icono: iconoParaTitulo(limpio.titulo) }))
    renderTexto(s.contenido || '', undefined, i + 1)
    if (s.porConfirmar?.length) add(...porConfirmar(s.porConfirmar))
  })

  // ----- TABLA (oferta) ----------------------------------------------------
  if (tabla && tabla.cabecera.length) add(...tablaCompleta(tabla))

  // ----- BLOQUES (secciones sin número) ------------------------------------
  for (const b of bloques) {
    add(...banda({ titulo: b.titulo || '', icono: iconoParaTitulo(b.titulo || '') }))
    for (const t of b.parrafos || []) renderTexto(t)
  }
  if (pendientes.length) add(...porConfirmar(pendientes))

  // ----- ANEXOS: páginas diseñadas de «siempre» que el texto no colocó -----
  const anexosPendientes = anexos.filter((a) => !usadas.has(a.id))
  if (anexosPendientes.length) {
    add(...banda({ titulo: 'Anexos', icono: ICONO_ANEXOS }))
    add(parrafo('Se incluyen a continuación los siguientes documentos de la empresa:', { justificar: false }))
    add(...anexosPendientes.map((a) => vineta(a.title)))
    for (const a of anexosPendientes) insertarDisenada(a)
  }

  // ----- NOTAS INTERNAS ----------------------------------------------------
  // Sin estilo de encabezado a propósito: iban con Heading 1 y entraban en la
  // navegación y en el índice, y se presentaban a la administración.
  if (internas.length) {
    add(espacio({ pageBreakBefore: true }))
    add(...banda({ titulo: 'Notas internas — eliminar antes de presentar', icono: ICONO_NOTAS, heading: false, fill: E.ambar.texto, sobreFill: 'FFFFFF', color: E.ambar.texto }))
    add(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'Esta página es de trabajo y no forma parte de la memoria que se presenta.', italics: true, size: TIPO.nota, color: E.textoSuave })] }))
    for (const nnota of internas) add(vineta(nnota, AMBAR))
  }

  // ----- CABECERA Y PIE ----------------------------------------------------
  // Con hoja: marcas que membrete.ts sustituye por la cabecera y el pie reales.
  // Sin hoja: logo + rótulo arriba sobre un filete del acento, línea legal a
  // la izquierda y «Página X de Y» a la derecha abajo, y la portada limpia
  // (titlePage + first vacíos).
  const tituloCorto = titulo.length > 70 ? `${titulo.slice(0, 69).trimEnd()}…` : titulo
  const vacio = () => ({ children: [new Paragraph({ children: [] })] })
  const cabecera = () => conHoja
    ? new Header({ children: [new Paragraph({ children: [new TextRun({ text: MARCA_CABECERA, size: 2, color: 'FFFFFF' })] })] })
    : new Header({
      children: [new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: anchoUtil }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: E.acento, space: 6 } },
        spacing: { after: 0, line: 240 },
        children: [
          ...(p.logo
            ? [new ImageRun({ type: p.logo.type, data: p.logo.data, transformation: encajar(p.logo, 150, 44), altText: altText(p.brand_name || 'Logo') })]
            : [new TextRun({ text: p.brand_name, bold: true, size: TIPO.cabecera, color: E.acentoTexto })]),
          // Tab REAL (<w:tab/>), no el carácter: dentro de <w:t> es texto y no obedece al tab stop.
          new TextRun({ children: [new Tab(), rotulo], bold: true, size: TIPO.cabecera, color: E.acentoTexto }),
          new TextRun({ text: `  ·  ${tituloCorto}`, size: TIPO.cabecera, color: E.textoSuave }),
        ],
      })],
    })
  const pie = () => conHoja
    ? new Footer({ children: [new Paragraph({ children: [new TextRun({ text: MARCA_PIE, size: 2, color: 'FFFFFF' })] })] })
    : new Footer({
      children: [new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: anchoUtil }],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: E.linea, space: 6 } },
        spacing: { before: 0, after: 0, line: 240 },
        children: [
          new TextRun({ text: p.footer_line || p.company_name || p.brand_name, size: TIPO.pieDoc, color: E.textoSuave }),
          new TextRun({ children: [new Tab(), 'Página '], size: TIPO.pieDoc, color: E.textoMudo }),
          new TextRun({ children: [PageNumber.CURRENT], size: TIPO.pieDoc, bold: true, color: E.textoSuave }),
          new TextRun({ text: ' de ', size: TIPO.pieDoc, color: E.textoMudo }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: TIPO.pieDoc, bold: true, color: E.textoSuave }),
        ],
      })],
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
          run: { font: p.body_font, size: TIPO.cuerpo, color: E.texto },
          paragraph: { spacing: { line: INTERLINEADO, after: ESPACIO.parrafo } },
        },
      },
      paragraphStyles: [
        // El Heading 1 vive dentro de la banda (tabla): sin espaciado propio, que lo pone la banda.
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: TIPO.h1, bold: true, font: p.body_font, color: E.acentoTexto },
          paragraph: { spacing: { before: 0, after: 0, line: 240 }, outlineLevel: 0, keepNext: true, keepLines: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: TIPO.h2, bold: true, font: p.body_font, color: E.acentoTexto },
          paragraph: { spacing: { before: ESPACIO.antesH2, after: ESPACIO.despuesH2, line: 240 }, outlineLevel: 1, keepNext: true, keepLines: true } },
        { id: 'Espaciador', name: 'Espaciador', basedOn: 'Normal', next: 'Normal',
          run: { size: 8, font: p.body_font },
          paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
      ],
    },
    numbering: {
      config: [
        { reference: 'indice', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: sangriaTitulo, hanging: sangriaTitulo } }, run: { bold: true, size: TIPO.indice, color: E.acentoTexto } } }] },
        { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 567, hanging: 283 } }, run: { color: E.acentoTexto } } }] },
        { reference: 'vinetas-ambar', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 567, hanging: 283 } }, run: { color: E.ambar.texto } } }] },
        { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 567, hanging: 360 } }, run: { color: E.acentoTexto } } }] },
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
