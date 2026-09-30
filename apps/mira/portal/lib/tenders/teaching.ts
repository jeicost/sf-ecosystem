import { adminClient } from '@/lib/supabase'

// Lo que la persona ENSEÑA a MIRA para las licitaciones de su marca.
//
// Usoa (30-sep, WhatsApp): «tengo que tener la libertad de explicar a MIRA todo
// lo que me pasa por la cabeza antes de liarse a hacer una memoria» y «MIRA
// está demasiado encasillado, cerrado». Hasta ahora el generador solo leía
// pliego + criterios + corpus + doctrina de precios: no había por dónde
// hablarle. Aquí viven las tres vías, y el bloque de prompt que las junta:
//
//   · instrucciones por expediente (tenders.instructions) — máxima prioridad
//   · guía de redacción de la empresa (tender_settings.guide) — cómo escribimos
//   · lecciones (tender_lessons) — frases cortas que MIRA aplica SIEMPRE
//
// La regla de fondo no cambia: las instrucciones mandan sobre el estilo y el
// enfoque, pero NUNCA autorizan a inventar datos de la empresa. Lo que no esté
// en el corpus va como [FALTA: …]. El modelo marca; TypeScript corta.

/** Lo máximo que se guarda de instrucciones por expediente y de guía (BD). */
export const INSTRUCTIONS_STORE_CAP = 20000
export const GUIDE_STORE_CAP = 20000
/**
 * Topes del bloque. Exportados para testearlos en evals/licitaciones/check.ts.
 * Las instrucciones entran ENTERAS en el prompt: se guardaban 20.000 y el
 * prompt leía 8.000, así que la pantalla enseñaba en verde «aplicadas» unas
 * instrucciones cuya segunda mitad el modelo nunca vio.
 */
export const INSTRUCTIONS_CAP = INSTRUCTIONS_STORE_CAP
export const GUIDE_CAP = 8000
export const LESSONS_CAP = 6000
export const LESSONS_MAX = 200
/** Longitud de una lección, como el check de la tabla. */
export const LESSON_MIN = 3
export const LESSON_MAX = 1000
export const LESSON_SOURCES = ['manual', 'improve', 'feedback'] as const
export type LessonSource = (typeof LESSON_SOURCES)[number]

export interface Lesson {
  id: string
  text: string
  source: LessonSource | string
  created_at: string
}

export interface Teaching {
  guide: string | null
  lessons: Lesson[]
}

/** La guía de la marca y sus lecciones activas (más recientes primero). */
export async function loadTeaching(clientId: string): Promise<Teaching> {
  const db = adminClient()
  const [settings, lessons] = await Promise.all([
    db.from('tender_settings').select('guide').eq('client_id', clientId).maybeSingle(),
    db.from('tender_lessons').select('id,text,source,created_at')
      .eq('client_id', clientId).eq('active', true)
      .order('created_at', { ascending: false }).limit(LESSONS_MAX),
  ])
  if (settings.error) throw settings.error
  if (lessons.error) throw lessons.error
  const guide = typeof settings.data?.guide === 'string' && settings.data.guide.trim() ? settings.data.guide : null
  return { guide, lessons: (lessons.data || []) as Lesson[] }
}

/** Guarda la guía de redacción (y/o el playbook) de la marca. Parcial: solo lo que viene. */
export async function saveTeachingSettings(clientId: string, patch: { guide?: string; playbook?: string }): Promise<void> {
  const row: { client_id: string; updated_at: string; guide?: string; playbook?: string } = {
    client_id: clientId, updated_at: new Date().toISOString(),
  }
  if (typeof patch.guide === 'string') row.guide = patch.guide.slice(0, GUIDE_STORE_CAP)
  if (typeof patch.playbook === 'string') row.playbook = patch.playbook.slice(0, 12000)
  // upsert solo escribe las columnas que van en la fila: un guardado de la guía
  // no toca el playbook, y al revés.
  const { error } = await adminClient().from('tender_settings').upsert(row, { onConflict: 'client_id' })
  if (error) throw error
}

/**
 * Recorta y DEVUELVE el aviso por separado: el modelo lee la marca dentro del
 * texto, pero la persona solo se entera si el aviso llega a data_gaps/avisos.
 */
const recorte = (texto: string, cap: number, que: string): { texto: string; aviso: string | null } => {
  if (texto.length <= cap) return { texto, aviso: null }
  const leidos = cap.toLocaleString('es-ES')
  const total = texto.length.toLocaleString('es-ES')
  return {
    texto: `${texto.slice(0, cap)}\n[… ${que} recortadas: se han leído ${leidos} de ${total} caracteres]`,
    aviso: `De ${que === 'guía' ? 'la guía de redacción' : 'las instrucciones del expediente'} solo se han leído ${leidos} de ${total} caracteres: el resto no ha llegado al modelo.`,
  }
}

/** Aviso de las lecciones que no caben en LESSONS_CAP (las más antiguas, porque van ordenadas de reciente a antigua). */
export const avisoLeccionesFuera = (fuera: number, dentro: number): string =>
  `${fuera} ${fuera === 1 ? 'lección no ha cabido' : 'lecciones no han cabido'} en esta generación (${fuera === 1 ? 'la más antigua' : 'las más antiguas'}; se han aplicado ${dentro}): resume o borra lecciones en Teach MIRA.`

/**
 * «Remember» convierte una instrucción de mejora en lección, pero una lección
 * tiene tope (LESSON_MAX): guardar solo el principio y confirmar «Saved as a
 * lesson» es guardar una regla distinta de la que la persona escribió. Si no
 * cabe, no se guarda y se avisa. Devuelve null cuando cabe.
 */
export function avisoLeccionLarga(instruccion: string): string | null {
  const texto = instruccion.replace(/\s+/g, ' ').trim()
  if (texto.length <= LESSON_MAX) return null
  return `La instrucción es demasiado larga para ser una lección (máx. ${LESSON_MAX.toLocaleString('es-ES')} caracteres, tiene ${texto.length.toLocaleString('es-ES')}): resúmela en Teach MIRA.`
}

/**
 * El bloque de enseñanza que va en TODOS los prompts (memoria, oferta, mejora).
 *
 * Precedencia explícita, porque el modelo no la adivina: instrucciones del
 * expediente > guía de la empresa > lecciones. Y una cláusula que se repite a
 * propósito: cumplir una instrucción jamás justifica inventar un dato.
 * Devuelve '' si no hay nada que enseñar, para que el prompt no cargue con
 * cabeceras vacías.
 */
export interface TeachingInput {
  instructions?: string | null
  guide?: string | null
  lessons?: Array<Lesson | { text: string } | string> | null
}

/** El bloque y, aparte, lo que se ha quedado fuera de él (para data_gaps/avisos). */
export interface TeachingBlockDetallado { text: string; recortes: string[] }

/** Compatibilidad: quien solo quiere el texto sigue recibiendo un string. */
export function teachingBlock(input: TeachingInput): string {
  return teachingBlockDetallado(input).text
}

export function teachingBlockDetallado(input: TeachingInput): TeachingBlockDetallado {
  const partes: string[] = []
  const recortes: string[] = []

  const instrucciones = (input.instructions || '').trim()
  if (instrucciones) {
    const r = recorte(instrucciones, INSTRUCTIONS_CAP, 'instrucciones')
    if (r.aviso) recortes.push(r.aviso)
    partes.push(
      'INSTRUCCIONES DE LA RESPONSABLE PARA ESTE EXPEDIENTE — máxima prioridad: cúmplelas todas; si una contradice el material de la empresa, se cumple la instrucción y lo que falte se marca [FALTA: …]; jamás inventes datos (cifras, certificaciones, clientes, plazos) para cumplirla.\n'
      + r.texto,
    )
  }

  const guia = (input.guide || '').trim()
  if (guia) {
    const r = recorte(guia, GUIDE_CAP, 'guía')
    if (r.aviso) recortes.push(r.aviso)
    partes.push(
      'GUÍA DE REDACCIÓN DE LA EMPRESA — cómo escribe sus memorias; se aplica salvo que una instrucción del expediente diga otra cosa.\n'
      + r.texto,
    )
  }

  const lecciones = (input.lessons || [])
    .map((l) => (typeof l === 'string' ? l : l.text))
    .map((t) => String(t || '').replace(/\s+/g, ' ').trim())
    .filter((t) => t.length >= LESSON_MIN)
  if (lecciones.length) {
    const lineas: string[] = []
    let usado = 0
    let fuera = 0
    lecciones.forEach((t, idx) => {
      const linea = `${idx + 1}. ${t}`
      if (fuera === 0 && usado + linea.length + 1 <= LESSONS_CAP) { lineas.push(linea); usado += linea.length + 1 } else fuera++
    })
    partes.push(
      'LECCIONES — cada línea es una regla obligatoria que la responsable ha enseñado; se aplican siempre, salvo que una instrucción del expediente diga otra cosa.\n'
      + lineas.join('\n')
      + (fuera > 0 ? `\n[… ${fuera} ${fuera === 1 ? 'lección más no cabe' : 'lecciones más no caben'} aquí: se aplican las ${lineas.length} anteriores]` : ''),
    )
    // Las que no caben se descartaban sin que la persona lo supiera.
    if (fuera > 0) recortes.push(avisoLeccionesFuera(fuera, lineas.length))
  }

  if (partes.length === 0) return { text: '', recortes }
  return {
    text: `${partes.join('\n\n')}\n\nNada de lo anterior autoriza a afirmar un hecho de la empresa que no esté en su material: lo que falte va como [FALTA: …].`,
    recortes,
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v)

export interface MemoriaSeccion { titulo?: string; contenido?: string; criterio?: string }
export interface BaseMemoria {
  id: string
  title: string | null
  organo: string | null
  status: string | null
  updated_at: string | null
  memoria: { titulo?: string; secciones?: MemoriaSeccion[] }
}

/**
 * Validación pura de la memoria de partida: es del MISMO cliente, no es el
 * propio expediente y tiene secciones con texto. Separada de la consulta para
 * poder testearla sin BD; la consulta ya filtra por client_id, esto es la
 * segunda cerradura.
 */
export function baseMemoriaValida(
  row: { id: string; client_id: string; title?: string | null; organo?: string | null; status?: string | null; updated_at?: string | null; memoria: unknown } | null | undefined,
  clientId: string,
  baseTenderId: string,
  excludeTenderId?: string | null,
): BaseMemoria | null {
  if (!row || row.client_id !== clientId || row.id !== baseTenderId) return null
  if (excludeTenderId && row.id === excludeTenderId) return null
  const m = row.memoria
  if (!m || typeof m !== 'object' || Array.isArray(m)) return null
  const secciones = (m as { secciones?: unknown }).secciones
  if (!Array.isArray(secciones)) return null
  const conTexto = secciones.filter((s) => s && typeof s === 'object' && typeof (s as MemoriaSeccion).contenido === 'string' && ((s as MemoriaSeccion).contenido as string).trim())
  if (conTexto.length === 0) return null
  return {
    id: row.id, title: row.title ?? null, organo: row.organo ?? null, status: row.status ?? null, updated_at: row.updated_at ?? null,
    memoria: m as BaseMemoria['memoria'],
  }
}

/** La memoria pasada elegida por la persona, o null si no existe / no es suya / no tiene memoria. */
export async function loadBaseMemoria(clientId: string, baseTenderId: string | null | undefined, excludeTenderId?: string | null): Promise<BaseMemoria | null> {
  if (!isUuid(baseTenderId)) return null
  const { data, error } = await adminClient().from('tenders')
    .select('id,client_id,title,organo,status,updated_at,memoria')
    .eq('id', baseTenderId).eq('client_id', clientId).not('memoria', 'is', null).maybeSingle()
  if (error) throw error
  return baseMemoriaValida(data, clientId, baseTenderId, excludeTenderId)
}

/** Las instrucciones y la base guardadas en el expediente, si es del cliente. */
export async function loadTenderTeaching(clientId: string, tenderId: string | null | undefined): Promise<{ instructions: string | null; baseTenderId: string | null }> {
  if (!isUuid(tenderId)) return { instructions: null, baseTenderId: null }
  const { data, error } = await adminClient().from('tenders').select('instructions,base_tender_id')
    .eq('id', tenderId).eq('client_id', clientId).maybeSingle()
  if (error) throw error
  return { instructions: data?.instructions || null, baseTenderId: data?.base_tender_id || null }
}

/**
 * Instrucciones y memoria de partida para una generación. Lo que manda la
 * pantalla gana; si la pantalla NO manda el campo (undefined), se usa lo
 * guardado en el expediente. Mandar '' o null es decir «sin instrucciones» a
 * propósito. Un baseTenderId que no sea uuid se descarta aquí; uno que no sea
 * del cliente lo descarta loadBaseMemoria.
 */
export async function resolveTenderTeaching(clientId: string, body: Record<string, unknown>, tenderId: string | null): Promise<{ instructions: string | null; baseTenderId: string | null }> {
  const saved = ('instructions' in body && 'baseTenderId' in body) || !tenderId
    ? { instructions: null, baseTenderId: null }
    : await loadTenderTeaching(clientId, tenderId)
  const instructions = 'instructions' in body
    ? (typeof body.instructions === 'string' ? body.instructions.trim().slice(0, INSTRUCTIONS_STORE_CAP) || null : null)
    : saved.instructions
  const baseTenderId = 'baseTenderId' in body
    ? (isUuid(body.baseTenderId) ? body.baseTenderId : null)
    : saved.baseTenderId
  return { instructions, baseTenderId }
}

/** Una lección nueva. text recortado a la longitud de la tabla; si es demasiado corta, no se guarda. */
export async function addLesson(input: {
  clientId: string
  text: string
  source: LessonSource
  tenderId?: string | null
  createdBy?: string | null
}): Promise<Lesson | null> {
  const text = input.text.replace(/\s+/g, ' ').trim().slice(0, LESSON_MAX)
  if (text.length < LESSON_MIN) return null
  const db = adminClient()
  // tender_id de OTRO cliente se ignora, no se guarda: la frontera la pone el servidor.
  let tenderId: string | null = null
  if (isUuid(input.tenderId)) {
    const { data } = await db.from('tenders').select('id').eq('id', input.tenderId).eq('client_id', input.clientId).maybeSingle()
    tenderId = data?.id || null
  }
  const { data, error } = await db.from('tender_lessons')
    .insert({ client_id: input.clientId, text, source: input.source, tender_id: tenderId, created_by: input.createdBy || null })
    .select('id,text,source,created_at').single()
  if (error) throw error
  return data as Lesson
}
