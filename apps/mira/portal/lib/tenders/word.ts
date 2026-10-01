import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'
import { jsonObject } from '@/lib/db-json'

// Word con membrete de marca para Licitaciones.
//
// Hasta el 1-oct-2026 /api/tender/export sacaba un .docx plano (Arial negro,
// sin portada, sin cabecera ni pie, sin índice) y Usoa lo maquetaba entero a
// mano. Las memorias REALES de GTD (medidas en PDF) llevan portada a todo
// color con el logo, un índice, títulos de sección en mayúsculas con el azul
// de la marca y un pie con la línea legal. No se puede reproducir Canva, pero
// sí un Word digno con esa identidad, y construido UNA sola vez para las tres
// fuentes (memoria, oferta, documento) y para la muestra de la plantilla.
//
// Reglas de la librería docx (^9.8) que ya nos han mordido: el PageBreak va
// DENTRO de un Paragraph; ImageRun exige `type`; un '\n' dentro de un TextRun
// no salta de línea; el sombreado es ShadingType.CLEAR; los anchos van en DXA
// (nada de WidthType.PERCENTAGE) y los colores SIN '#'.

// ---------------------------------------------------------------------------
// Plantilla
// ---------------------------------------------------------------------------

export interface LogoWord { data: Buffer; type: 'png' | 'jpg'; w: number; h: number }

/** Plantilla ya resuelta: colores hex SIN '#', textos (pueden ir vacíos) y logo si se pudo descargar. */
export interface PlantillaWord {
  cover_color: string
  accent_color: string
  company_name: string
  brand_name: string
  tagline: string
  footer_line: string
  logo: LogoWord | null
}

/** Claves de tender_settings.template que existen. Cualquier otra se descarta al guardar. */
export const CLAVES_PLANTILLA = ['cover_color', 'accent_color', 'company_name', 'brand_name', 'tagline', 'footer_line', 'logo_path'] as const
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

/**
 * Lee tender_settings.template + clients y descarga el logo. Todo cae con
 * elegancia: sin fila → clients.logo_url y clients.primary_color; sin eso →
 * gris neutro y sin logo. Si el logo falla al bajar, el Word sale SIN logo
 * pero sale: nunca un 500 por el logo.
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
  }

  // Ruta del logo: la de la plantilla si es del propio cliente; si no, la que
  // hay detrás de clients.logo_url ("/api/brand-assets?path=logos/<id>.png").
  let path: string | null = rutaLogoPermitida(t.logo_path, clientId) ? t.logo_path : null
  if (!path && cliente?.logo_url) {
    const m = /[?&]path=([^&]+)/.exec(cliente.logo_url)
    const p = m ? decodeURIComponent(m[1]) : null
    if (rutaLogoPermitida(p, clientId)) path = p
  }
  if (path) {
    try {
      const { data, error } = await db.storage.from('brand-assets').download(path)
      if (!error && data) {
        const buf = Buffer.from(await data.arrayBuffer())
        const dims = medirImagen(buf)
        if (dims) plantilla.logo = { data: buf, ...dims }
      }
    } catch (e) {
      console.warn('tenders/word: logo no disponible, el Word sale sin él:', e instanceof Error ? e.message : e)
    }
  }
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
// Constructor
// ---------------------------------------------------------------------------

export interface SeccionWord { titulo: string; contenido: string; puntos?: number | null; porConfirmar?: string[] }
export interface TablaWord {
  cabecera: string[]
  filas: string[][]
  /** Índices de columnas numéricas (alineadas a la derecha). */
  alinearDerecha?: number[]
  /** Anchos en DXA; si no vienen, la primera columna se lleva un tercio y el resto se reparte. */
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
}

const A4 = { width: 11906, height: 16838 }
const MARGEN = 1134
/** Ancho útil A4 con márgenes de 2 cm, en DXA. */
export const ANCHO_UTIL = A4.width - 2 * MARGEN // 9638

const GRIS = '545454'
const GRIS_CLARO = '8A8A8A'
const AMBAR = '946200'
const AMBAR_BORDE = 'E5B800'

/** pt → px (docx mide las imágenes en píxeles a 96 dpi). */
const px = (pt: number) => Math.round((pt * 96) / 72)

/** Escala manteniendo proporción dentro de una caja de puntos. */
function encajar(logo: LogoWord, maxWpt: number, maxHpt: number): { width: number; height: number } {
  const k = Math.min(maxWpt / logo.w, maxHpt / logo.h, 1e9)
  return { width: Math.max(1, px(logo.w * k)), height: Math.max(1, px(logo.h * k)) }
}

const ES_VINETA = /^\s*[-•·]\s+/

function fechaPortada(ciudad: string): string {
  const f = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date())
  return `${ciudad}, ${f}`
}

export async function construirWord(entrada: EntradaWord): Promise<Buffer> {
  const {
    Document, Packer, Paragraph, TextRun, ImageRun, PageBreak, AlignmentType, PageOrientation, BorderStyle,
    Table, TableRow, TableCell, WidthType, ShadingType, HeightRule, VerticalAlignTable, LevelFormat,
    Header, Footer, PageNumber, TabStopType, Tab,
  } = await import('docx')

  // El texto se sanea aquí, pieza a pieza; la plantilla trae un Buffer y no se toca.
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

  const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const sinBordes = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde }

  // Un \n dentro de un TextRun no salta de línea en Word: cada párrafo, suyo.
  // Si el párrafo empieza por «- », «• » o «· » es una viñeta REAL (numbering),
  // nunca el carácter a mano: así Word la reconoce y Usoa la puede reformatear.
  const parrafos = (texto: string, color?: string) =>
    String(texto || '').split(/\n+/).map((x) => x.trim()).filter(Boolean).map((t) =>
      ES_VINETA.test(t)
        ? new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: t.replace(ES_VINETA, ''), color })] })
        : new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 120 }, children: [new TextRun({ text: t, color })] }),
    )
  const vineta = (t: string, color?: string) =>
    new Paragraph({ numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, color })] })

  const porConfirmar = (items: string[]) => [
    new Paragraph({
      spacing: { before: 200, after: 80 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: AMBAR_BORDE, space: 4 } },
      children: [new TextRun({ text: 'Por confirmar antes de presentar:', bold: true, color: AMBAR })],
    }),
    ...items.filter((d) => d && d.trim()).map((d) => vineta(d, AMBAR)),
  ]

  const salto = () => new Paragraph({ children: [new PageBreak()] })

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = []

  // ----- PORTADA -----------------------------------------------------------
  // Bloque de color: una tabla de dos filas (logo arriba, título abajo) sin
  // bordes y con el mismo relleno, que se ve como un solo bloque de ~60% de la
  // página. Un párrafo sombreado no llega: el sombreado de párrafo no crece
  // a la altura que hace falta.
  const altoUtil = A4.height - 2 * MARGEN
  const altoBloque = Math.round(altoUtil * 0.6)
  const altoLogo = Math.round(altoBloque * 0.38)
  const celdaPortada = (alto: number, valign: (typeof VerticalAlignTable)[keyof typeof VerticalAlignTable], hijos: InstanceType<typeof Paragraph>[]) =>
    new TableRow({
      height: { value: alto, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        borders: sinBordes, verticalAlign: valign,
        width: { size: ANCHO_UTIL, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: p.cover_color, color: 'auto' },
        margins: { top: 500, bottom: 500, left: 600, right: 600 },
        children: hijos,
      })],
    })
  const logoPortada = p.logo
    ? [new Paragraph({ alignment: AlignmentType.LEFT, children: [new ImageRun({ type: p.logo.type, data: p.logo.data, transformation: encajar(p.logo, 260, 110), altText: { name: 'Logo', description: p.brand_name || 'Logo', title: 'Logo' } })] })]
    : [new Paragraph({ children: [new TextRun({ text: p.brand_name.toUpperCase(), bold: true, color: contrasteSobre(p.cover_color), size: 40 })] })]
  children.push(new Table({
    width: { size: ANCHO_UTIL, type: WidthType.DXA }, columnWidths: [ANCHO_UTIL],
    borders: { ...sinBordes, insideHorizontal: sinBorde, insideVertical: sinBorde },
    rows: [
      celdaPortada(altoLogo, VerticalAlignTable.TOP, logoPortada),
      celdaPortada(altoBloque - altoLogo, VerticalAlignTable.BOTTOM, [
        new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: rotulo.toUpperCase(), bold: true, color: contrasteSobre(p.cover_color), size: 84 })] }),
        new Paragraph({ children: [new TextRun({ text: titulo.toUpperCase(), color: contrasteSobre(p.cover_color), size: 28 })] }),
      ]),
    ],
  }))
  children.push(new Paragraph({ spacing: { before: 480, after: 60 }, children: [new TextRun({ text: p.company_name || p.brand_name, bold: true, size: 24, color: GRIS_NEUTRO })] }))
  if (p.tagline) children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: p.tagline, italics: true, size: 22, color: GRIS })] }))
  if (expediente) children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Expediente ${expediente}`, size: 22, color: GRIS_NEUTRO })] }))
  if (organo) children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `Órgano: ${organo}`, size: 22, color: GRIS_NEUTRO })] }))
  children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: fechaPortada(ciudad), size: 22, color: GRIS })] }))
  children.push(salto())

  // ----- ÍNDICE ------------------------------------------------------------
  // Manual, sin campo TOC: el campo pide «actualizar» al abrir y confunde. Los
  // números salen del numbering (DECIMAL), nunca escritos a mano, y coinciden
  // con los de las secciones porque estas se numeran en el mismo orden.
  const bandaIzq = { left: { style: BorderStyle.SINGLE, size: 24, color: p.accent_color, space: 12 } }
  children.push(new Paragraph({
    border: bandaIzq, spacing: { after: 240 }, indent: { left: 240 },
    children: [new TextRun({ text: 'ÍNDICE', bold: true, size: 30, color: acentoLegible(p.accent_color) })],
  }))
  secciones.forEach((s) => children.push(new Paragraph({
    numbering: { reference: 'indice', level: 0 }, spacing: { after: 100 },
    children: [new TextRun({ text: (s.titulo || 'Sección').toUpperCase(), size: 22, color: GRIS_NEUTRO })],
  })))
  bloques.forEach((b) => children.push(new Paragraph({
    indent: { left: 567 }, spacing: { after: 100 },
    children: [new TextRun({ text: (b.titulo || '').toUpperCase(), size: 22, color: GRIS })],
  })))
  if (tabla && !secciones.length && !bloques.length) {
    children.push(new Paragraph({ indent: { left: 567 }, spacing: { after: 100 }, children: [new TextRun({ text: 'DESGLOSE DE PRECIOS', size: 22, color: GRIS })] }))
  }
  children.push(salto())

  // ----- SECCIONES ---------------------------------------------------------
  const encabezado = (texto: string, numero?: number, puntos?: number | null) => new Paragraph({
    heading: 'Heading1',
    children: [
      ...(typeof numero === 'number' ? [new TextRun({ text: `${numero}. `, color: GRIS })] : []),
      new TextRun({ text: texto.toUpperCase(), color: acentoLegible(p.accent_color) }),
      ...(typeof puntos === 'number' && Number.isFinite(puntos) ? [new TextRun({ text: ` (${puntos} puntos)`, bold: false, size: 22, color: GRIS_CLARO })] : []),
    ],
  })
  secciones.forEach((s, i) => {
    children.push(encabezado(s.titulo || 'Sección', i + 1, s.puntos), ...parrafos(s.contenido || ''))
    if (s.porConfirmar?.length) children.push(...porConfirmar(s.porConfirmar))
  })

  // ----- TABLA (oferta) ----------------------------------------------------
  if (tabla && tabla.cabecera.length) {
    const n = tabla.cabecera.length
    let anchos = tabla.anchos && tabla.anchos.length === n ? tabla.anchos.slice() : []
    if (!anchos.length) {
      const primera = Math.round(ANCHO_UTIL / 3)
      const resto = n > 1 ? Math.floor((ANCHO_UTIL - primera) / (n - 1)) : 0
      anchos = [n > 1 ? primera : ANCHO_UTIL, ...Array.from({ length: n - 1 }, () => resto)]
    }
    // Los anchos suman EXACTAMENTE el ancho de la tabla (la diferencia de redondeo va a la última).
    anchos[n - 1] += ANCHO_UTIL - anchos.reduce((a, b) => a + b, 0)
    const derecha = new Set(tabla.alinearDerecha || [])
    const borde = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
    const bordes = { top: borde, bottom: borde, left: borde, right: borde }
    const celda = (t: string, i: number, opts: { cabecera?: boolean; fill?: string }) => new TableCell({
      borders: bordes, width: { size: anchos[i], type: WidthType.DXA },
      ...(opts.fill ? { shading: { type: ShadingType.CLEAR, fill: opts.fill, color: 'auto' } } : {}),
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        alignment: derecha.has(i) ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: t, bold: !!opts.cabecera, size: 20, color: opts.cabecera ? contrasteSobre(p.accent_color) : GRIS_NEUTRO })],
      })],
    })
    children.push(new Table({
      width: { size: ANCHO_UTIL, type: WidthType.DXA }, columnWidths: anchos,
      rows: [
        new TableRow({ tableHeader: true, children: tabla.cabecera.map((t, i) => celda(t, i, { cabecera: true, fill: p.accent_color })) }),
        ...tabla.filas.map((fila, r) => new TableRow({
          children: Array.from({ length: n }, (_, i) => celda(String(fila[i] ?? ''), i, { fill: r % 2 === 0 ? 'FFFFFF' : 'EFEFEF' })),
        })),
      ],
    }))
    if (tabla.pie) children.push(new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: tabla.pie, bold: true })] }))
  }

  // ----- BLOQUES (secciones sin número) ------------------------------------
  for (const b of bloques) {
    children.push(encabezado(b.titulo || ''))
    for (const t of b.parrafos || []) children.push(...parrafos(t))
  }
  if (pendientes.length) children.push(...porConfirmar(pendientes))

  // ----- NOTAS INTERNAS ----------------------------------------------------
  // Sin estilo de encabezado a propósito: iban con Heading 1 y entraban en la
  // navegación y en el índice, y se presentaban a la administración.
  if (internas.length) {
    children.push(new Paragraph({ pageBreakBefore: true, spacing: { after: 200 }, children: [new TextRun({ text: 'NOTAS INTERNAS — ELIMINAR ANTES DE PRESENTAR', bold: true, color: AMBAR, size: 26 })] }))
    for (const nnota of internas) children.push(vineta(nnota, AMBAR))
  }

  // ----- CABECERA Y PIE ----------------------------------------------------
  // titlePage + first vacíos: la portada va limpia, el resto lleva membrete.
  const tituloCorto = titulo.length > 70 ? `${titulo.slice(0, 69).trimEnd()}…` : titulo
  const cabecera = new Header({
    children: [new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: ANCHO_UTIL }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: p.accent_color, space: 4 } },
      spacing: { after: 120 },
      children: [
        ...(p.logo
          ? [new ImageRun({ type: p.logo.type, data: p.logo.data, transformation: encajar(p.logo, 170, 60), altText: { name: 'Logo', description: p.brand_name || 'Logo', title: 'Logo' } })]
          : [new TextRun({ text: p.brand_name, bold: true, size: 16, color: acentoLegible(p.accent_color) })]),
        // Tab REAL (<w:tab/>), no el carácter: dentro de <w:t> es texto y no obedece al tab stop.
        new TextRun({ children: [new Tab(), `${rotulo} — ${tituloCorto}`], size: 16, color: GRIS }),
      ],
    })],
  })
  const pie = new Footer({
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
  const vacio = () => ({ children: [new Paragraph({ children: [] })] })

  const doc = new Document({
    creator: p.company_name || p.brand_name || 'MIRA',
    title: `${rotulo} — ${titulo}`,
    description: p.tagline || undefined,
    styles: {
      default: { document: { run: { font: 'Arial', size: 22, color: GRIS_NEUTRO } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 30, bold: true, font: 'Arial', color: acentoLegible(p.accent_color) },
          paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      ],
    },
    numbering: {
      config: [
        { reference: 'indice', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 567, hanging: 360 } }, run: { bold: true, color: acentoLegible(p.accent_color) } } }] },
        { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 567, hanging: 283 } } } }] },
      ],
    },
    sections: [{
      properties: {
        titlePage: true,
        page: {
          size: { width: A4.width, height: A4.height, orientation: PageOrientation.PORTRAIT },
          margin: { top: MARGEN, right: MARGEN, bottom: MARGEN, left: MARGEN, header: 567, footer: 567 },
        },
      },
      headers: { default: cabecera, first: new Header(vacio()) },
      footers: { default: pie, first: new Footer(vacio()) },
      children,
    }],
  })

  return Packer.toBuffer(doc)
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
