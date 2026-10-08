/**
 * Un único lector de ficheros para todo el conocimiento del portal.
 *
 * Hasta el 8-oct-2026 la extracción vivía dentro de lib/drive-sync.ts, atada
 * a las URL de la API de Google. El conector de Microsoft 365 necesita leer
 * los MISMOS formatos desde Graph, así que lo que no depende del proveedor
 * (buffer → texto) se saca aquí y los dos syncs lo comparten: PDF, texto,
 * CSV, XLSX, DOCX, PPTX, correos .eml e imágenes (por visión).
 */

import { extractPdfText } from '@/lib/pdf-extract'
import { extractDocxText, extractPptxText, DOCX_MIME, PPTX_MIME } from '@/lib/attachments'
import { describeImage, isVisionReadableImage } from '@/lib/vision'

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const EML_MIME = 'message/rfc822'
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

/** Formatos cuyo contenido sabemos convertir en texto (sin contar los nativos de Google). */
export const READABLE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  XLSX_MIME,
  DOCX_MIME,
  PPTX_MIME,
  EML_MIME,
  ...IMAGE_MIME_TYPES,
]

// Tope de filas por hoja al convertir a texto. Una hoja de 10.000 filas
// llenaría ella sola el presupuesto de contexto de todos los prompts; con las
// primeras 300 se captura la estructura y los datos representativos, y se
// deja constancia explícita de cuántas filas se omitieron para que el modelo
// no dé por hecho que está viendo el fichero entero.
export const MAX_SPREADSHEET_ROWS = 300

/** Tope del texto extraído por fichero (caracteres). */
export const MAX_EXTRACTED_CHARS = 1_000_000

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  xlsx: XLSX_MIME,
  xlsm: XLSX_MIME,
  docx: DOCX_MIME,
  pptx: PPTX_MIME,
  eml: EML_MIME,
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  // Formatos antiguos de Office y Outlook: se reconocen para CONTARLOS en el
  // inventario, pero no se leen (ver READABLE_MIME_TYPES).
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  msg: 'application/vnd.ms-outlook',
}

export function extensionOf(fileName: string): string {
  const m = /\.([a-z0-9]{1,8})$/i.exec(fileName.trim())
  return m ? m[1].toLowerCase() : ''
}

/**
 * MIME a partir del nombre cuando el proveedor no lo da o da uno genérico
 * (SharePoint devuelve a veces application/octet-stream para .docx).
 */
export function mimeFromFileName(fileName: string, declared?: string | null): string {
  const byExt = EXT_TO_MIME[extensionOf(fileName)]
  const d = (declared || '').trim().toLowerCase()
  if (byExt) {
    // Si lo declarado es genérico o contradice una extensión conocida, manda la extensión.
    if (!d || d === 'application/octet-stream' || d === 'binary/octet-stream' || d !== byExt) return byExt
    return d
  }
  return d
}

export function isReadableMime(mime: string, fileName = ''): boolean {
  if (!READABLE_MIME_TYPES.includes(mime)) return false
  if (IMAGE_MIME_TYPES.includes(mime)) return isVisionReadableImage(mime, fileName)
  return true
}

// ─── Hojas de cálculo ─────────────────────────────────────────────

/**
 * Parser de CSV mínimo pero correcto: respeta campos entrecomillados con
 * comas o saltos de línea dentro, y comillas escapadas (""). Un `split(',')`
 * ingenuo parte un precio como "1,290 THB" en dos columnas y desalinea toda
 * la fila, que es justo el dato que interesa de una tarifa.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += char
      continue
    }

    if (char === '"') { inQuotes = true }
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n' || char === '\r') {
      // \r\n cuenta como un solo salto
      if (char === '\r' && input[i + 1] === '\n') i++
      row.push(field); field = ''
      rows.push(row); row = []
    } else field += char
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}

/** Filas de una hoja → texto etiquetado por cabecera, con tope de filas. */
export function rowsToLabelledText(rows: string[][], sheetName?: string): string {
  if (rows.length === 0) return ''

  const header = rows[0].map((h) => h.trim())
  const body = rows.slice(1, 1 + MAX_SPREADSHEET_ROWS)
  const omitted = Math.max(0, rows.length - 1 - body.length)

  const lines = body.map((cells) =>
    cells
      .map((cell, i) => {
        const value = cell.trim()
        if (!value) return null
        const label = header[i]?.trim()
        return label ? `${label}: ${value}` : value
      })
      .filter(Boolean)
      .join(' | ')
  ).filter(Boolean)

  const parts: string[] = []
  if (sheetName) parts.push(`## Sheet: ${sheetName}`)
  parts.push(`Columns: ${header.filter(Boolean).join(', ')}`)
  parts.push(`Rows: ${rows.length - 1}${omitted > 0 ? ` (showing the first ${body.length}; ${omitted} not shown)` : ''}`)
  parts.push('', ...lines)
  return parts.join('\n')
}

export function formatCsvForPrompt(raw: string): string {
  return rowsToLabelledText(parseCsv(raw))
}

/** Una celda de exceljs puede ser fecha, fórmula, texto enriquecido o hipervínculo. */
export function cellToString(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.text === 'string') return v.text
    if ('result' in v) return String(v.result ?? '')
    if (Array.isArray(v.richText)) {
      return v.richText.map((r) => String((r as { text?: string }).text ?? '')).join('')
    }
    if (typeof v.hyperlink === 'string') return v.hyperlink
    return ''
  }
  return String(value)
}

/**
 * Lee un .xlsx real con exceljs. Se eligió exceljs sobre SheetJS (`xlsx` en
 * npm) a propósito: la edición community de SheetJS publicada en npm arrastra
 * avisos de prototype pollution y ReDoS sin parchear.
 */
export async function extractXlsxText(buffer: Buffer): Promise<string> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

  const sheets: string[] = []
  workbook.eachSheet((worksheet) => {
    const rows: string[][] = []
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values = row.values as unknown[]
      // exceljs indexa las columnas desde 1: values[0] siempre es undefined
      rows.push(values.slice(1).map((v) => cellToString(v)))
    })
    const text = rowsToLabelledText(rows, worksheet.name)
    if (text) sheets.push(text)
  })

  return sheets.join('\n\n')
}

/** Un correo guardado (.eml): cabeceras útiles + cuerpo en texto. */
export async function extractEmlText(buffer: Buffer): Promise<string> {
  const { simpleParser } = await import('mailparser')
  const parsed = await simpleParser(buffer)
  const addr = (v: unknown): string => {
    if (!v) return ''
    const list = Array.isArray(v) ? v : [v]
    return list
      .flatMap((a) => ((a as { value?: Array<{ name?: string; address?: string }> }).value || []).map((x) => (x.name ? `${x.name} <${x.address}>` : x.address || '')))
      .filter(Boolean)
      .join(', ')
  }
  const head = [
    `From: ${addr(parsed.from)}`,
    `To: ${addr(parsed.to)}`,
    parsed.cc ? `Cc: ${addr(parsed.cc)}` : '',
    `Date: ${parsed.date ? parsed.date.toISOString() : ''}`,
    `Subject: ${parsed.subject || ''}`,
  ].filter(Boolean)
  const body = parsed.text || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]+>/g, ' ') : '')
  const atts = (parsed.attachments || []).map((a) => a.filename).filter(Boolean)
  return [...head, atts.length ? `Attachments: ${atts.join(', ')}` : '', '', body].filter((l, i) => i >= head.length || l).join('\n')
}

// ─── Lector único ─────────────────────────────────────────────────

export interface ExtractInput {
  buffer: Buffer
  mimeType: string
  fileName?: string
  /** Solo para imágenes (visión): marca que paga y texto de contexto. */
  clientId?: string
  context?: string
  route?: string
}

export type ExtractResult = { success: true; text: string } | { success: false; error: string }

/**
 * Convierte el contenido de un fichero en texto. Devuelve error (no lanza)
 * para los formatos que no se leen, para que el llamador los cuente.
 */
export async function extractTextFromBuffer(input: ExtractInput): Promise<ExtractResult> {
  const { buffer, mimeType } = input
  const fileName = input.fileName || ''
  try {
    let text = ''
    if (mimeType === 'application/pdf') {
      text = await extractPdfText(buffer)
    } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      text = buffer.toString('utf8')
    } else if (mimeType === 'text/csv') {
      // Un CSV crudo ya es texto, pero se pasa por el mismo formateador que el
      // resto de hojas para que el modelo reciba filas etiquetadas con su
      // cabecera ("Producto: Wagyu Burger | Precio: 390") en vez de una pared
      // de comas, que es donde los LLM pierden la correspondencia columna→valor.
      text = formatCsvForPrompt(buffer.toString('utf8'))
    } else if (mimeType === XLSX_MIME) {
      text = await extractXlsxText(buffer)
    } else if (mimeType === DOCX_MIME) {
      text = await extractDocxText(buffer)
    } else if (mimeType === PPTX_MIME) {
      text = await extractPptxText(buffer)
    } else if (mimeType === EML_MIME) {
      text = await extractEmlText(buffer)
    } else if (IMAGE_MIME_TYPES.includes(mimeType) && isVisionReadableImage(mimeType, fileName)) {
      if (!input.clientId) return { success: false, error: 'Missing clientId for image description' }
      const description = await describeImage({
        clientId: input.clientId,
        buffer,
        mimeType,
        fileName,
        context: input.context,
        route: input.route || 'extract-text:image',
      })
      if (!description) return { success: false, error: 'Could not describe image' }
      text = `[IMAGE] ${fileName}\n\n${description}`
    } else {
      return { success: false, error: `Unsupported MIME type for extraction: ${mimeType}` }
    }

    if (text.trim().length === 0) return { success: false, error: 'No text content extracted from file' }
    return { success: true, text: text.substring(0, MAX_EXTRACTED_CHARS) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Extraction failed' }
  }
}

/** Una hoja de cálculo convertida a texto se reconoce por su cabecera. */
export function isTabularText(text: string): boolean {
  return text.startsWith('## Sheet:') || text.startsWith('Columns:')
}
