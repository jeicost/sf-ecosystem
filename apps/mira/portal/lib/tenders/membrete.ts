import JSZip from 'jszip'

// Membrete oficial de la marca: la «hoja» .docx con la que la empresa escribe
// (cabecera con logo y sellos, pie con la línea legal, márgenes, tipografía).
//
// Carlos (6-oct-2026) dejó el «MODELO HOJA GTD 2026.docx»: la cabecera lleva el
// logo de GTD y tres sellos (huella de carbono MITECO, ENS, DEKRA ISO) como
// imágenes ANCLADAS con posiciones medidas por su diseñador, y el pie va en
// Trebuchet MS con el correo como hipervínculo. Reproducir eso con la librería
// docx sería una imitación; copiar las piezas tal cual es la reproducción. Por
// eso el Word se construye con docx (cuerpo, portada, índice) y DESPUÉS se le
// trasplantan la cabecera y el pie de la hoja: sus XML, sus imágenes, sus
// relaciones y los estilos que usan. Si la empresa cambia de hoja, sube la
// nueva y todo lo que se exporte a partir de ahí la lleva.
//
// Todo con expresiones regulares sobre el XML: las piezas que se tocan tienen
// forma fija (sectPr, Relationships, w:style) y así no entra una dependencia
// nueva. Lo que no se reconoce se deja como está.

export interface RelacionMembrete { id: string; type: string; target: string; mode?: string }
export interface ParteMembrete { xml: string; rels: RelacionMembrete[] }
/** Márgenes de página en DXA (1/20 pt), como los guarda Word. */
export interface MargenesMembrete { top: number; right: number; bottom: number; left: number; header: number; footer: number }

export interface Membrete {
  header: ParteMembrete | null
  footer: ParteMembrete | null
  /** target de la relación (relativo a word/) → bytes de la imagen. */
  media: Record<string, Buffer>
  /** Bloques <w:style> que usan la cabecera y el pie, para que no pierdan su formato en el Word generado. */
  styles: string[]
  margenes: MargenesMembrete | null
  /** Tipografía del cuerpo de la hoja (Aptos en la de GTD). */
  bodyFont: string | null
}

/** Lo que se le cuenta a la persona al subir la hoja, y lo que se guarda en la plantilla para no releerla. */
export interface ResumenMembrete {
  header: boolean
  footer: boolean
  imagenes: number
  margenes: MargenesMembrete | null
  bodyFont: string | null
}

/** Marcas que el constructor pone en su cabecera y pie provisionales para saber qué partes sustituir. */
export const MARCA_CABECERA = '⟦MEMBRETE-CABECERA⟧'
export const MARCA_PIE = '⟦MEMBRETE-PIE⟧'

/** Un .docx no puede pasar de aquí: el de GTD pesa 280 KB; 10 MB es una hoja con fotos sin comprimir. */
export const MAX_MEMBRETE_BYTES = 10 * 1024 * 1024

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', emf: 'image/x-emf', wmf: 'image/x-wmf', svg: 'image/svg+xml', tif: 'image/tiff', tiff: 'image/tiff',
}

async function texto(zip: JSZip, ruta: string): Promise<string | null> {
  const f = zip.file(ruta)
  return f ? f.async('string') : null
}

function parseRels(xml: string | null): RelacionMembrete[] {
  if (!xml) return []
  const out: RelacionMembrete[] = []
  for (const m of xml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const a = m[1]
    const id = /\bId="([^"]+)"/.exec(a)?.[1]
    const type = /\bType="([^"]+)"/.exec(a)?.[1]
    const target = /\bTarget="([^"]+)"/.exec(a)?.[1]
    const mode = /\bTargetMode="([^"]+)"/.exec(a)?.[1]
    if (id && type && target) out.push({ id, type, target, ...(mode ? { mode } : {}) })
  }
  return out
}

/** «media/image1.png», «/word/media/image1.png» o «../media/x.png» → «media/x.png». */
function normalizarTarget(t: string): string {
  return t.replace(/^\/?word\//, '').replace(/^(\.\.\/)+/, '')
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Fuente ascii del primer <w:rFonts> de un XML, si la hay. */
function fuenteDe(xml: string | null | undefined): string | null {
  if (!xml) return null
  const m = /<w:rFonts\b[^>]*\bw:ascii="([^"]+)"/.exec(xml)
  return m ? m[1] : null
}

/**
 * Tipografía del cuerpo: la del primer párrafo del cuerpo si la declara; si no,
 * la del estilo Normal; si no, la de los valores por defecto; y si todo apunta
 * al tema, la fuente «minor» del tema. Nunca se inventa: null si no se sabe.
 */
async function tipografiaCuerpo(zip: JSZip, documentXml: string, stylesXml: string | null): Promise<string | null> {
  const body = /<w:body>([\s\S]*?)<w:sectPr\b/.exec(documentXml)?.[1] || ''
  const enCuerpo = fuenteDe(body)
  if (enCuerpo) return enCuerpo
  if (stylesXml) {
    const normal = /<w:style\b[^>]*w:type="paragraph"[^>]*w:default="1"[^>]*>[\s\S]*?<\/w:style>/.exec(stylesXml)?.[0]
      || /<w:style\b[^>]*w:default="1"[^>]*w:type="paragraph"[^>]*>[\s\S]*?<\/w:style>/.exec(stylesXml)?.[0]
    const enNormal = fuenteDe(normal)
    if (enNormal) return enNormal
    const defaults = /<w:rPrDefault>[\s\S]*?<\/w:rPrDefault>/.exec(stylesXml)?.[0]
    const enDefaults = fuenteDe(defaults)
    if (enDefaults) return enDefaults
    if (defaults && /w:asciiTheme="minor/.test(defaults)) {
      const theme = await texto(zip, 'word/theme/theme1.xml')
      const minor = theme && /<a:minorFont>[\s\S]*?<a:latin\b[^>]*\btypeface="([^"]+)"/.exec(theme)?.[1]
      if (minor) return minor
    }
  }
  return null
}

/**
 * Los estilos que nombran la cabecera y el pie (pStyle, rStyle, tblStyle), con
 * su cadena basedOn/link, sacados del styles.xml de la hoja. Sin ellos el pie
 * perdería el azul subrayado del hipervínculo y la cabecera su espaciado.
 */
function estilosUsados(partes: string[], stylesXml: string | null): string[] {
  if (!stylesXml) return []
  const pendientes = new Set<string>()
  for (const xml of partes) for (const m of xml.matchAll(/<w:(?:pStyle|rStyle|tblStyle)\b[^>]*\bw:val="([^"]+)"/g)) pendientes.add(m[1])
  const vistos = new Set<string>()
  const bloques: string[] = []
  let vueltas = 0
  while (pendientes.size && vueltas++ < 6) {
    for (const id of [...pendientes]) {
      pendientes.delete(id)
      if (vistos.has(id)) continue
      vistos.add(id)
      const bloque = new RegExp(`<w:style\\b[^>]*\\bw:styleId="${esc(id)}"[^>]*>[\\s\\S]*?<\\/w:style>`).exec(stylesXml)?.[0]
      if (!bloque) continue
      bloques.push(bloque)
      for (const m of bloque.matchAll(/<w:(?:basedOn|link|next)\b[^>]*\bw:val="([^"]+)"/g)) if (!vistos.has(m[1])) pendientes.add(m[1])
    }
  }
  return bloques
}

/**
 * Lee la hoja. Devuelve null si no es un .docx (sin word/document.xml). Una
 * hoja sin cabecera ni pie se lee igual (quizá solo aporta márgenes y fuente),
 * pero el resumen lo dice para que la persona lo vea.
 */
export async function leerMembrete(buf: Buffer): Promise<Membrete | null> {
  let zip: JSZip
  try { zip = await JSZip.loadAsync(buf) } catch { return null }
  const doc = await texto(zip, 'word/document.xml')
  if (!doc) return null
  const docRels = parseRels(await texto(zip, 'word/_rels/document.xml.rels'))
  const stylesXml = await texto(zip, 'word/styles.xml')

  // La sección del cuerpo es la última <w:sectPr> del documento.
  const sectPrs = doc.match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/g) || []
  const sectPr = sectPrs[sectPrs.length - 1] || ''

  const parte = async (kind: 'header' | 'footer'): Promise<ParteMembrete | null> => {
    const refs = [...sectPr.matchAll(new RegExp(`<w:${kind}Reference\\b([^>]*)/>`, 'g'))].map((m) => m[1])
    const con = (tipo: string) => refs.find((a) => new RegExp(`\\bw:type="${tipo}"`).test(a))
    // La «default» es la de todas las páginas; una hoja que solo trae «first» es una hoja de carta: también vale.
    const attrs = con('default') || con('first') || refs[0]
    const rid = attrs ? /\br:id="([^"]+)"/.exec(attrs)?.[1] : null
    const target = rid ? docRels.find((r) => r.id === rid)?.target : null
    if (!target) return null
    const nombre = normalizarTarget(target)
    const xml = await texto(zip, `word/${nombre}`)
    if (!xml) return null
    const base = nombre.split('/').pop()!
    const dir = nombre.includes('/') ? nombre.slice(0, nombre.lastIndexOf('/') + 1) : ''
    const rels = parseRels(await texto(zip, `word/${dir}_rels/${base}.rels`))
    return { xml, rels }
  }
  const header = await parte('header')
  const footer = await parte('footer')

  const media: Record<string, Buffer> = {}
  for (const p of [header, footer]) {
    for (const r of p?.rels || []) {
      if (!/\/image$/.test(r.type) || r.mode === 'External') continue
      const t = normalizarTarget(r.target)
      if (media[t]) continue
      const f = zip.file(`word/${t}`)
      if (f) media[t] = await f.async('nodebuffer')
    }
  }

  const pm = /<w:pgMar\b([^>]*)\/>/.exec(sectPr)?.[1]
  const n = (k: string) => { const v = pm && new RegExp(`\\bw:${k}="(-?\\d+)"`).exec(pm)?.[1]; return v ? Number(v) : NaN }
  const margenes: MargenesMembrete | null = pm && [n('top'), n('right'), n('bottom'), n('left')].every(Number.isFinite)
    ? { top: Math.max(0, n('top')), right: n('right'), bottom: Math.max(0, n('bottom')), left: n('left'), header: Number.isFinite(n('header')) ? n('header') : 708, footer: Number.isFinite(n('footer')) ? n('footer') : 708 }
    : null

  return {
    header, footer, media,
    styles: estilosUsados([header?.xml || '', footer?.xml || ''], stylesXml),
    margenes,
    bodyFont: await tipografiaCuerpo(zip, doc, stylesXml),
  }
}

export function resumenMembrete(m: Membrete): ResumenMembrete {
  return { header: !!m.header, footer: !!m.footer, imagenes: Object.keys(m.media).length, margenes: m.margenes, bodyFont: m.bodyFont }
}

/** Párrafo «Página X de Y», discreto, con la fuente del pie si la declara. */
function parrafoNumeracion(footerXml: string): string {
  const fuente = fuenteDe(footerXml)
  const rPr = `<w:rPr>${fuente ? `<w:rFonts w:ascii="${fuente}" w:hAnsi="${fuente}"/>` : ''}<w:color w:val="8A8A8A"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`
  const run = (t: string) => `<w:r>${rPr}<w:t xml:space="preserve">${t}</w:t></w:r>`
  const campo = (instr: string) => `<w:fldSimple w:instr=" ${instr} ">${run('1')}</w:fldSimple>`
  return `<w:p><w:pPr><w:spacing w:before="40" w:after="0"/><w:jc w:val="center"/></w:pPr>${run('Página ')}${campo('PAGE')}${run(' de ')}${campo('NUMPAGES')}</w:p>`
}

/**
 * Pie de la hoja + numeración. Si la hoja ya numera (campo PAGE) se deja como
 * está. Si su último párrafo está vacío (el de GTD lo está) se usa ese hueco;
 * si no, se añade uno.
 */
export function pieConNumeracion(footerXml: string): string {
  if (/\bPAGE\b/.test(footerXml)) return footerXml
  const nuevo = parrafoNumeracion(footerXml)
  const parrafos = [...footerXml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>|<w:p\b[^>]*\/>/g)]
  const ultimo = parrafos[parrafos.length - 1]
  if (ultimo && !/<w:t\b|<w:drawing\b|<w:pict\b|<w:fldSimple\b|<w:instrText\b/.test(ultimo[0])) {
    return footerXml.slice(0, ultimo.index) + nuevo + footerXml.slice(ultimo.index! + ultimo[0].length)
  }
  return footerXml.replace(/<\/w:ftr>\s*$/, `${nuevo}</w:ftr>`)
}

function relsXml(rels: RelacionMembrete[], renombres: Record<string, string>): string {
  const filas = rels.map((r) => {
    const target = r.mode === 'External' ? r.target : (renombres[normalizarTarget(r.target)] ?? r.target)
    return `<Relationship Id="${r.id}" Type="${r.type}" Target="${target}"${r.mode ? ` TargetMode="${r.mode}"` : ''}/>`
  })
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${filas.join('')}</Relationships>`
}

/**
 * Trasplanta la cabecera y el pie de la hoja al .docx generado. Las partes a
 * sustituir son las que llevan las marcas (MARCA_CABECERA / MARCA_PIE): puede
 * haber varias (una por sección con membrete) y todas reciben la misma hoja.
 * Las imágenes entran con nombre propio (media/membrete_N.ext) para no pisar
 * las del cuerpo; los estilos que falten se añaden al styles.xml.
 */
export async function aplicarMembrete(docx: Buffer, m: Membrete, opts: { numerarPaginas?: boolean } = {}): Promise<Buffer> {
  if (!m.header && !m.footer) return docx
  const zip = await JSZip.loadAsync(docx)

  const renombres: Record<string, string> = {}
  let n = 1
  const extensiones = new Set<string>()
  for (const [target, bytes] of Object.entries(m.media)) {
    const ext = (target.split('.').pop() || 'png').toLowerCase()
    const nuevo = `media/membrete_${n++}.${ext}`
    zip.file(`word/${nuevo}`, bytes)
    renombres[target] = nuevo
    extensiones.add(ext)
  }

  const partes = Object.keys(zip.files).filter((f) => /^word\/(header|footer)\d*\.xml$/.test(f))
  let sustituidas = 0
  for (const ruta of partes) {
    const xml = await zip.file(ruta)!.async('string')
    const base = ruta.slice('word/'.length)
    if (m.header && xml.includes(MARCA_CABECERA)) {
      zip.file(ruta, m.header.xml)
      zip.file(`word/_rels/${base}.rels`, relsXml(m.header.rels, renombres))
      sustituidas++
    } else if (m.footer && xml.includes(MARCA_PIE)) {
      zip.file(ruta, opts.numerarPaginas ? pieConNumeracion(m.footer.xml) : m.footer.xml)
      zip.file(`word/_rels/${base}.rels`, relsXml(m.footer.rels, renombres))
      sustituidas++
    }
  }
  if (!sustituidas) return docx

  // Tipos de contenido de las imágenes que entran (Word se niega a abrir un paquete con una extensión sin declarar).
  const ctRuta = '[Content_Types].xml'
  let ct = (await texto(zip, ctRuta)) || ''
  for (const ext of extensiones) {
    if (!new RegExp(`<Default\\b[^>]*\\bExtension="${esc(ext)}"`, 'i').test(ct)) {
      ct = ct.replace('</Types>', `<Default Extension="${ext}" ContentType="${MIME[ext] || 'application/octet-stream'}"/></Types>`)
    }
  }
  zip.file(ctRuta, ct)

  if (m.styles.length) {
    let st = (await texto(zip, 'word/styles.xml')) || ''
    const faltan = m.styles.filter((b) => {
      const id = /\bw:styleId="([^"]+)"/.exec(b)?.[1]
      return id && !new RegExp(`\\bw:styleId="${esc(id)}"`).test(st)
    })
    if (faltan.length && st.includes('</w:styles>')) {
      st = st.replace('</w:styles>', `${faltan.join('')}</w:styles>`)
      zip.file('word/styles.xml', st)
    }
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
