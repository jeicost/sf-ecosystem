import { randomUUID } from 'crypto'
import { adminClient } from '@/lib/supabase'
import { extractPdfText } from '@/lib/pdf-extract'
import { extractDocxText, officeKindOf } from '@/lib/attachments'

// Ficheros de licitación: pliegos y documentos para trabajar.
//
// Vercel corta el cuerpo de cualquier petición en ~4,5 MB, y 32 de los 67 PDF
// reales de GTD pasan de ahí: subirlos a través de una ruta de la API fallaba
// en la mitad de los casos con un "no se ha podido leer el fichero" que no
// explicaba nada. Por eso el navegador sube DIRECTO al almacenamiento con una
// URL firmada, y el servidor solo recibe la ruta del fichero.
//
// El fichero es transitorio: se lee, se extrae el texto y se borra. Lo que
// queda es el texto, en el expediente o en el documento.

const BUCKET = 'brand-assets'
/** El límite global del proyecto de Supabase es 50 MB por fichero. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

function prefixFor(clientId: string): string {
  return `tenders/${clientId}/`
}

/** URL firmada para que el navegador suba un fichero de ESTA marca. */
export async function createTenderUpload(clientId: string, filename: string) {
  const safe = filename.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'fichero'
  const path = `${prefixFor(clientId)}${randomUUID()}-${safe}`
  const { data, error } = await adminClient().storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) throw new Error(error?.message || 'No se pudo preparar la subida')
  return { path, token: data.token, bucket: BUCKET }
}

/**
 * Lee un fichero subido y lo borra. La ruta TIENE que ser de la marca que pide:
 * sin esta comprobación, pasar la ruta de otra marca bastaría para que el
 * servidor leyera sus documentos.
 */
export async function takeTenderUpload(clientId: string, path: string): Promise<Buffer> {
  if (typeof path !== 'string' || !path.startsWith(prefixFor(clientId)) || path.includes('..')) {
    throw Object.assign(new Error('Ese fichero no pertenece a esta marca'), { status: 403 })
  }
  const store = adminClient().storage.from(BUCKET)
  const { data, error } = await store.download(path)
  if (error || !data) throw Object.assign(new Error('El fichero no ha llegado: vuelve a subirlo'), { status: 404 })
  const buffer = Buffer.from(await data.arrayBuffer())
  // Transitorio: si el borrado falla no se bloquea al usuario, pero se registra.
  const { error: rmErr } = await store.remove([path])
  if (rmErr) console.error('[tenders/upload] no se pudo borrar el fichero temporal', path, rmErr.message)
  return buffer
}

export class UnsupportedFileError extends Error {}

/**
 * Texto de un PDF, Word o texto plano, limpio de lo que Postgres rechaza.
 * Los PDF firmados traen caracteres nulos y de control; un text de Postgres no
 * admite \u0000 y un .docx con ellos no abre en Word.
 */
export async function extractTextFromFile(buffer: Buffer, filename: string, mime = ''): Promise<string> {
  let text: string
  if (mime === 'application/pdf' || /\.pdf$/i.test(filename)) text = await extractPdfText(buffer)
  else if (officeKindOf(mime, filename) === 'docx') text = await extractDocxText(buffer)
  else if (mime.startsWith('text/') || /\.(txt|md)$/i.test(filename)) text = buffer.toString('utf8')
  else throw new UnsupportedFileError('Formato no admitido: sube el documento en PDF, Word (.docx) o texto.')
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}
