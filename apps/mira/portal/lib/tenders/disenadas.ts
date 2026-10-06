import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'
import { medirImagen, type LogoWord } from '@/lib/tenders/word-imagen'

// Secciones con diseño propio de la empresa (Carlos, 6-oct-2026): «debes tomar
// las secciones que vengan con diseño propio de la empresa e incluirlas cuando
// corresponda en las memorias técnicas».
//
// Son páginas ya maquetadas por su diseñador (certificaciones, flota, red de
// agencias, organigrama) guardadas como imágenes. El redactor decide dónde van
// y lo MARCA con una línea [[DISEÑO:id]]; TypeScript valida que el id exista,
// normaliza la marca y el Word la convierte en páginas a sangre completa o en
// una figura. Las de always_include entran siempre, como anexo, aunque nadie
// las marque. El modelo marca, TS inserta: ni una imagen la elige el modelo.

export type Colocacion = 'page' | 'figure'
export const COLOCACIONES: Colocacion[] = ['page', 'figure']

export interface PaginaDisenada { path: string; w: number; h: number; type: 'png' | 'jpg' }

export interface Disenada {
  id: string
  title: string
  keywords: string
  placement: Colocacion
  always_include: boolean
  pages: PaginaDisenada[]
  source_filename: string | null
  active: boolean
}

/** La misma, con las imágenes ya descargadas: lo que consume el constructor del Word. */
export interface DisenadaResuelta extends Disenada { imagenes: LogoWord[] }

export const DISENADAS_MAX = 40
export const PAGINAS_POR_DISENADA_MAX = 30
export const TITULO_MAX = 200
export const KEYWORDS_MAX = 500

/** Marca en el texto: [[DISEÑO:id]] (también sin eñe y con espacios). */
export const MARCADOR_RE = /\[\[\s*DISE[ÑN]O\s*:\s*([^\]]+?)\s*\]\]/gi
export const marcador = (id: string) => `[[DISEÑO:${id}]]`

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Lo que una referencia de marcador señala: por id, o por título (el modelo a veces escribe el nombre). */
export function resolverReferencia(ref: string, lista: Disenada[]): Disenada | null {
  const r = ref.trim()
  if (UUID_RE.test(r)) return lista.find((d) => d.id.toLowerCase() === r.toLowerCase()) || null
  const n = normalizar(r)
  if (!n) return null
  return lista.find((d) => normalizar(d.title) === n) || null
}

export interface MarcadoresNormalizados {
  texto: string
  /** ids colocados, en orden de aparición y sin repetir. */
  usadas: string[]
  /** referencias que no corresponden a ninguna página: se quitan del texto y se avisa. */
  desconocidas: string[]
}

/**
 * Deja cada marcador en su forma canónica y en una línea propia, quita los que
 * no existen (un id inventado no puede llegar al Word) y dice cuáles eran.
 */
export function normalizarMarcadores(texto: string, lista: Disenada[]): MarcadoresNormalizados {
  const usadas: string[] = []
  const desconocidas: string[] = []
  const out = String(texto || '').replace(MARCADOR_RE, (_m, ref: string) => {
    const d = resolverReferencia(ref, lista)
    if (!d) { desconocidas.push(ref.trim()); return '' }
    if (!usadas.includes(d.id)) usadas.push(d.id)
    return `\n${marcador(d.id)}\n`
  })
  return { texto: out.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, (m, off) => (off === 0 ? '' : m)), usadas, desconocidas }
}

/** ids de los marcadores de un texto, en orden y sin repetir (ya normalizado o no). */
export function marcadoresEn(texto: string, lista: Disenada[]): string[] {
  const ids: string[] = []
  for (const m of String(texto || '').matchAll(MARCADOR_RE)) {
    const d = resolverReferencia(m[1], lista)
    if (d && !ids.includes(d.id)) ids.push(d.id)
  }
  return ids
}

/** Las de «siempre» que ningún marcador ha colocado: van como anexos. */
export function anexosObligatorios(lista: Disenada[], usadas: Iterable<string>): Disenada[] {
  const u = new Set(usadas)
  return lista.filter((d) => d.always_include && d.active && d.pages.length && !u.has(d.id))
}

/** Bloque para el prompt del redactor. Vacío si la marca no tiene páginas. */
export function bloqueDisenadasPrompt(lista: Disenada[]): string {
  const activas = lista.filter((d) => d.active && d.pages.length)
  if (!activas.length) return ''
  const filas = activas.map((d) =>
    `- ${marcador(d.id)} · «${d.title}» · ${d.placement === 'page' ? `${d.pages.length} página(s) completa(s)` : 'figura dentro del texto'}${d.always_include ? ' · entra siempre (si no la colocas, irá como anexo)' : ''}${d.keywords ? ` · temas: ${d.keywords}` : ''}`)
  return `PÁGINAS CON DISEÑO PROPIO DE LA EMPRESA (ya maquetadas por su diseñador; el Word las inserta tal cual):
${filas.join('\n')}
Cuando una sección trate del tema de una de estas páginas, escribe en su contenido UNA LÍNEA SOLA con su marca exacta (p. ej. ${marcador(activas[0].id)}) en el punto donde debe ir, normalmente tras el párrafo que la presenta («Se adjunta la relación de certificaciones vigentes.»). No describas su contenido como si fuera texto tuyo, no la coloques donde no corresponde y no inventes marcas: solo estas.`
}

/** Fila de la tabla → objeto tipado, descartando lo que no tenga forma. */
export function parseDisenada(row: Record<string, unknown>): Disenada | null {
  if (typeof row.id !== 'string' || typeof row.title !== 'string') return null
  const pages = Array.isArray(row.pages)
    ? (row.pages as unknown[]).filter((p): p is PaginaDisenada =>
      !!p && typeof p === 'object' && typeof (p as PaginaDisenada).path === 'string' && ((p as PaginaDisenada).type === 'png' || (p as PaginaDisenada).type === 'jpg')
        && Number.isFinite((p as PaginaDisenada).w) && Number.isFinite((p as PaginaDisenada).h))
    : []
  return {
    id: row.id, title: row.title,
    keywords: typeof row.keywords === 'string' ? row.keywords : '',
    placement: row.placement === 'figure' ? 'figure' : 'page',
    always_include: row.always_include === true,
    pages,
    source_filename: typeof row.source_filename === 'string' ? row.source_filename : null,
    active: row.active !== false,
  }
}

export async function loadDisenadas(db: SupabaseClient<Database>, clientId: string, opts: { incluirInactivas?: boolean } = {}): Promise<Disenada[]> {
  let q = db.from('tender_brand_sections').select('id,title,keywords,placement,always_include,pages,source_filename,active').eq('client_id', clientId).order('created_at', { ascending: true })
  if (!opts.incluirInactivas) q = q.eq('active', true)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map((r) => parseDisenada(r as unknown as Record<string, unknown>)).filter((d): d is Disenada => !!d)
}

/**
 * Descarga las imágenes de las páginas que se van a insertar. Una imagen que
 * no baja o no se reconoce se omite y se avisa: el Word sale igual, sin ella.
 */
export async function resolverDisenadas(db: SupabaseClient<Database>, clientId: string, lista: Disenada[]): Promise<{ resueltas: DisenadaResuelta[]; avisos: string[] }> {
  const avisos: string[] = []
  const resueltas: DisenadaResuelta[] = []
  for (const d of lista) {
    const imagenes: LogoWord[] = []
    for (const p of d.pages) {
      if (!p.path.startsWith(`tenders/${clientId}/`)) { avisos.push(`La página «${d.title}» apunta a un fichero que no es de esta marca y no se ha incluido.`); continue }
      try {
        const { data, error } = await db.storage.from('brand-assets').download(p.path)
        if (error || !data) throw new Error(error?.message || 'sin datos')
        const buf = Buffer.from(await data.arrayBuffer())
        const dims = medirImagen(buf)
        if (!dims) throw new Error('formato no reconocido')
        imagenes.push({ data: buf, ...dims })
      } catch (e) {
        avisos.push(`Una página de «${d.title}» no se ha podido incluir (${e instanceof Error ? e.message : 'error'}).`)
      }
    }
    if (imagenes.length) resueltas.push({ ...d, imagenes })
  }
  return { resueltas, avisos }
}
