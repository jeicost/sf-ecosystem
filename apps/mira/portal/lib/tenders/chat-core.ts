import type Anthropic from '@anthropic-ai/sdk'
import { isUuid } from '@/lib/tenders/teaching'

// Licitaciones en modo conversación — la parte PURA del motor.
//
// Carlos (5-oct): «que la licitación sea un chatbot donde se le empieza a decir
// lo que queremos y nos va ayudando». Usoa ya trabajaba así con ChatGPT: pega
// el pliego, pide sección a sección, corrige, vuelve días después. Aquí vive
// todo lo que NO toca red ni BD (validación de las herramientas, recortes,
// troceo de adjuntos, reconstrucción del historial), separado para poder
// probarlo gratis en evals/licitaciones/chat-check.ts. El bucle con el modelo
// y las consultas están en lib/tenders/chat.ts.

/** Modelo de los motores de licitaciones (tender-memoria, tender-documento…). */
export const CHAT_MODEL = 'claude-opus-4-8'
/** Vueltas de herramientas por mensaje: suficiente para leer, buscar y guardar; acota el coste de un bucle tonto. */
export const MAX_TURNS = 8
/** Salida por vuelta. Una sección larga cabe; por encima de ~21k el SDK exige streaming y aquí ya lo es, pero el coste manda. */
export const MAX_TOKENS_TURN = 8000
/** Lo que se guarda de cada resultado de herramienta para retomar la conversación otro día. */
export const TOOL_RESULT_SAVE_CAP = 2000
/** Lo mismo para los textos largos que el modelo puso en la ENTRADA de una herramienta (una sección entera en crear_documento). */
export const TOOL_INPUT_SAVE_CAP = 2000
/** Texto de un adjunto que se guarda. Un PCAP+PPT real ronda los 150k; 200k deja margen y acota la fila. */
export const ATTACHMENT_CAP = 200_000
/** Adjuntos por mensaje y por conversación. */
export const ATTACHMENTS_PER_MESSAGE = 8
export const ATTACHMENTS_PER_CHAT = 30
/** Trozo de adjunto que se devuelve por defecto, y el máximo que se puede pedir de una vez. */
export const CHUNK_DEFAULT = 30_000
export const CHUNK_MAX = 60_000
/** Historial que se reenvía al modelo. Por encima se olvidan los intercambios más antiguos (los documentos guardados siguen ahí). */
export const HISTORY_CHAR_BUDGET = 120_000
/** Mensaje de la persona. */
export const MESSAGE_MAX = 20_000

export type DocKind = 'memoria' | 'oferta' | 'anexo'
export const DOC_KINDS: DocKind[] = ['memoria', 'oferta', 'anexo']

/** Un adjunto de la conversación tal como se guarda en tender_chats.attachments. */
export interface ChatAttachment {
  id: string
  filename: string
  mime: string
  chars: number
  text: string
  /** Caracteres originales si se recortó a ATTACHMENT_CAP. */
  original_chars?: number
}

export interface ToolTrace { name: string; summary: string; ok: boolean }
export interface DocTouch { id: string; titulo: string; accion: 'creado' | 'editado' | 'generado'; copia_id?: string | null }

/**
 * Un mensaje de tender_chats.messages. Lo que la pantalla pinta va arriba;
 * `_model` es el historial que necesita el modelo para retomar (con tool_use y
 * tool_result ya compactados) y la API lo quita antes de mandarlo al navegador.
 */
export interface ChatMessage {
  id: string
  /** Posición (1, 2…). La lista de conversaciones la lee con messages->-1->n para contar sin bajarse los mensajes. */
  n?: number
  role: 'user' | 'assistant'
  content: string
  at: string
  adjuntos?: Array<{ id: string; filename: string; chars: number }>
  tools?: ToolTrace[]
  documentos?: DocTouch[]
  error?: string
  _model?: Anthropic.MessageParam[]
}

export type PublicChatMessage = Omit<ChatMessage, '_model'>

export const stripInternal = (m: ChatMessage): PublicChatMessage => {
  const { _model: _ignored, ...rest } = m
  void _ignored
  return rest
}

/** Mensajes guardados → lista tipada, descartando lo que no tenga forma de mensaje. */
export function parseMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((m): m is ChatMessage =>
    !!m && typeof m === 'object' && ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') && typeof (m as ChatMessage).content === 'string')
}

export function parseAttachments(raw: unknown): ChatAttachment[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((a): a is ChatAttachment =>
    !!a && typeof a === 'object' && typeof (a as ChatAttachment).id === 'string' && typeof (a as ChatAttachment).text === 'string')
}

/** Siguiente id corto de adjunto (a1, a2…): el modelo lo cita y la persona lo ve; un uuid le costaría tokens y errores de copia. */
export function nextAttachmentId(existing: ChatAttachment[]): string {
  const max = existing.reduce((m, a) => Math.max(m, Number(/^a(\d+)$/.exec(a.id)?.[1] || 0)), 0)
  return `a${max + 1}`
}

/** Recorta el texto extraído de un adjunto y devuelve el aviso por separado (la persona tiene que saberlo, no solo el modelo). */
export function capAttachment(text: string, filename: string): { text: string; aviso: string | null; original: number } {
  if (text.length <= ATTACHMENT_CAP) return { text, aviso: null, original: text.length }
  return {
    text: text.slice(0, ATTACHMENT_CAP),
    original: text.length,
    aviso: `De «${filename}» solo se han guardado ${ATTACHMENT_CAP.toLocaleString('es-ES')} de ${text.length.toLocaleString('es-ES')} caracteres: lo que venga después no lo puede leer MIRA. Si los criterios están al final, súbelo por partes.`,
  }
}

/**
 * Un trozo de un adjunto. Paginado por caracteres porque un pliego de 150k no
 * cabe en una vuelta junto a todo lo demás; `siguiente` le dice al modelo por
 * dónde seguir, y TypeScript (no el modelo) dice si ha llegado al final.
 */
export function chunkAttachment(a: ChatAttachment, desde?: number, hasta?: number) {
  const total = a.text.length
  const ini = Math.max(0, Math.min(Number.isFinite(desde) ? Math.floor(desde as number) : 0, total))
  const finPedido = Number.isFinite(hasta) ? Math.floor(hasta as number) : ini + CHUNK_DEFAULT
  const fin = Math.max(ini, Math.min(finPedido, ini + CHUNK_MAX, total))
  return {
    id: a.id, filename: a.filename, total, desde: ini, hasta: fin,
    siguiente: fin < total ? fin : null,
    recortado_al_subir: a.original_chars && a.original_chars > a.chars ? a.original_chars : undefined,
    texto: a.text.slice(ini, fin),
  }
}

// ─── Validación de las entradas de las herramientas ───────────────────────────
// El modelo puede mandar cualquier cosa: tipos cambiados, ids de otra marca,
// textos enormes. Cada herramienta valida aquí antes de tocar nada; lo que no
// encaja vuelve como error al modelo (que lo corrige), no se «arregla».

export type Valid<T> = { ok: true; value: T } | { ok: false; error: string }

const str = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
const idsAdjunto = (v: unknown): string[] | null => {
  if (!Array.isArray(v) || v.length === 0 || v.length > ATTACHMENTS_PER_CHAT) return null
  const ids = v.filter((x): x is string => typeof x === 'string' && /^a\d{1,3}$/.test(x))
  return ids.length === v.length ? [...new Set(ids)] : null
}

export interface SeccionIn { titulo: string; contenido: string; nota?: string }

export type ToolInput =
  | { name: 'leer_adjunto'; id: string; desde?: number; hasta?: number }
  | { name: 'buscar_en_material'; consulta: string }
  | { name: 'listar_memorias_pasadas' }
  | { name: 'listar_expedientes'; consulta?: string }
  | { name: 'leer_memoria_pasada'; tender_id: string; seccion?: number | string }
  | { name: 'extraer_criterios'; adjunto_ids: string[] }
  | { name: 'crear_documento'; titulo: string; tipo: DocKind; secciones: SeccionIn[] }
  | { name: 'leer_documento'; document_id: string }
  | { name: 'editar_seccion'; document_id: string; indice: number | null; titulo?: string; contenido: string }
  | { name: 'generar_memoria_completa'; adjunto_ids: string[]; instrucciones?: string; base_tender_id?: string }
  | { name: 'exportar_word'; document_id: string }
  | { name: 'recordar_leccion'; texto: string }
  | { name: 'asociar_expediente'; tender_id: string | null; titulo?: string }

export const SECTION_TITLE_MAX = 200
export const SECTION_CONTENT_MAX = 40_000
export const SECTIONS_MAX = 60

export function validateToolInput(name: string, raw: unknown): Valid<ToolInput> {
  const i = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  const bad = (error: string): Valid<ToolInput> => ({ ok: false, error })
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined)
  switch (name) {
    case 'leer_adjunto': {
      const id = typeof i.id === 'string' && /^a\d{1,3}$/.test(i.id) ? i.id : null
      if (!id) return bad('id de adjunto no válido: usa el id que aparece en la lista de adjuntos (a1, a2…).')
      return { ok: true, value: { name, id, desde: num(i.desde), hasta: num(i.hasta) } }
    }
    case 'buscar_en_material': {
      const consulta = str(i.consulta, 1500)
      if (!consulta) return bad('Falta la consulta.')
      return { ok: true, value: { name, consulta } }
    }
    case 'listar_memorias_pasadas':
      return { ok: true, value: { name } }
    case 'listar_expedientes':
      return { ok: true, value: { name, consulta: str(i.consulta, 200) || undefined } }
    case 'leer_memoria_pasada': {
      if (!isUuid(i.tender_id)) return bad('tender_id no válido: usa uno de listar_memorias_pasadas.')
      const seccion = typeof i.seccion === 'number' && Number.isInteger(i.seccion) && i.seccion >= 0 ? i.seccion
        : str(i.seccion, 200) || undefined
      return { ok: true, value: { name, tender_id: i.tender_id, seccion } }
    }
    case 'extraer_criterios': {
      const ids = idsAdjunto(i.adjunto_ids)
      if (!ids) return bad('adjunto_ids debe ser una lista de ids de adjuntos (a1, a2…).')
      return { ok: true, value: { name, adjunto_ids: ids } }
    }
    case 'crear_documento': {
      const titulo = str(i.titulo, SECTION_TITLE_MAX)
      if (!titulo) return bad('Falta el título del documento.')
      if (typeof i.tipo !== 'string' || !(DOC_KINDS as string[]).includes(i.tipo)) return bad('tipo debe ser memoria, oferta o anexo.')
      if (!Array.isArray(i.secciones) || i.secciones.length === 0) return bad('El documento necesita al menos una sección.')
      if (i.secciones.length > SECTIONS_MAX) return bad(`Máximo ${SECTIONS_MAX} secciones por documento.`)
      const secciones: SeccionIn[] = []
      for (const [n, s] of i.secciones.entries()) {
        const o = (s && typeof s === 'object' ? s : {}) as Record<string, unknown>
        const t = str(o.titulo, SECTION_TITLE_MAX)
        if (!t || typeof o.contenido !== 'string') return bad(`La sección ${n} necesita titulo y contenido (texto).`)
        if (o.contenido.length > SECTION_CONTENT_MAX) return bad(`La sección ${n} pasa de ${SECTION_CONTENT_MAX} caracteres: divídela.`)
        const nota = str(o.nota, 1000)
        secciones.push({ titulo: t, contenido: o.contenido, ...(nota ? { nota } : {}) })
      }
      return { ok: true, value: { name, titulo, tipo: i.tipo as DocKind, secciones } }
    }
    case 'leer_documento':
    case 'exportar_word': {
      if (!isUuid(i.document_id)) return bad('document_id no válido.')
      return { ok: true, value: { name, document_id: i.document_id } }
    }
    case 'editar_seccion': {
      if (!isUuid(i.document_id)) return bad('document_id no válido.')
      const indice = i.indice === null || i.indice === undefined ? null
        : typeof i.indice === 'number' && Number.isInteger(i.indice) && i.indice >= 0 ? i.indice : -1
      if (indice === -1) return bad('indice debe ser un entero ≥ 0, o null para añadir una sección al final.')
      if (typeof i.contenido !== 'string') return bad('Falta el contenido de la sección.')
      if (i.contenido.length > SECTION_CONTENT_MAX) return bad(`El contenido pasa de ${SECTION_CONTENT_MAX} caracteres: divídelo en dos secciones.`)
      const titulo = str(i.titulo, SECTION_TITLE_MAX) || undefined
      if (indice === null && !titulo) return bad('Para añadir una sección nueva hace falta su titulo.')
      return { ok: true, value: { name, document_id: i.document_id, indice, titulo, contenido: i.contenido } }
    }
    case 'generar_memoria_completa': {
      const ids = idsAdjunto(i.adjunto_ids)
      if (!ids) return bad('adjunto_ids debe ser una lista de ids de adjuntos con el pliego (a1, a2…).')
      if (i.base_tender_id !== undefined && i.base_tender_id !== null && !isUuid(i.base_tender_id)) return bad('base_tender_id no válido.')
      return { ok: true, value: { name, adjunto_ids: ids, instrucciones: str(i.instrucciones, 20000) || undefined, base_tender_id: isUuid(i.base_tender_id) ? i.base_tender_id : undefined } }
    }
    case 'recordar_leccion': {
      if (typeof i.texto !== 'string') return bad('Falta el texto de la lección.')
      const texto = i.texto.replace(/\s+/g, ' ').trim()
      if (texto.length < 3) return bad('La lección es demasiado corta.')
      if (texto.length > 1000) return bad('Una lección no puede pasar de 1.000 caracteres: resúmela en una regla corta.')
      return { ok: true, value: { name, texto } }
    }
    case 'asociar_expediente': {
      const titulo = str(i.titulo, 200) || undefined
      if (i.tender_id === null || i.tender_id === undefined) {
        if (!titulo) return bad('Para crear un expediente nuevo hace falta un titulo (o pasa el tender_id de uno existente).')
        return { ok: true, value: { name, tender_id: null, titulo } }
      }
      if (!isUuid(i.tender_id)) return bad('tender_id no válido: usa listar_expedientes.')
      return { ok: true, value: { name, tender_id: i.tender_id, titulo } }
    }
    default:
      return bad(`Herramienta desconocida: ${name}`)
  }
}

// ─── Definición de las herramientas para el modelo ───────────────────────────

export const TOOL_DEFS: Anthropic.Tool[] = [
  {
    name: 'leer_adjunto',
    description: 'Lee un trozo del texto de un adjunto de esta conversación (pliegos, memorias, correos). Paginado por caracteres: si la respuesta trae "siguiente", llama otra vez con desde=siguiente para seguir. Lee lo que necesites antes de afirmar qué dice el pliego.',
    input_schema: { type: 'object', properties: {
      id: { type: 'string', description: 'Id del adjunto (a1, a2…)' },
      desde: { type: 'integer', description: 'Carácter inicial (por defecto 0)' },
      hasta: { type: 'integer', description: `Carácter final (por defecto desde+${CHUNK_DEFAULT}; máx. desde+${CHUNK_MAX})` },
    }, required: ['id'] },
  },
  {
    name: 'buscar_en_material',
    description: 'Busca en el material de la empresa (corpus: memorias presentadas troceadas por secciones, certificaciones, documentos de la marca). Es la ÚNICA fuente de hechos de la empresa además del brand brain.',
    input_schema: { type: 'object', properties: { consulta: { type: 'string', description: 'Qué buscar, con palabras del tema (p. ej. "flota eléctrica certificaciones ISO 14001")' } }, required: ['consulta'] },
  },
  {
    name: 'listar_memorias_pasadas',
    description: 'Lista las memorias técnicas que la empresa ya presentó (con su resultado) para usarlas como modelo de estructura y tono.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'listar_expedientes',
    description: 'Lista los expedientes de licitación de la marca (con o sin memoria), para asociar esta conversación a uno.',
    input_schema: { type: 'object', properties: { consulta: { type: 'string', description: 'Texto opcional para filtrar por título u órgano' } } },
  },
  {
    name: 'leer_memoria_pasada',
    description: 'Lee una memoria presentada. Sin "seccion" devuelve su índice; con "seccion" (número de índice o parte del título) devuelve esa sección entera. Los nombres del órgano anterior llegan enmascarados como [ÓRGANO ANTERIOR]: sirve de modelo de ESTRUCTURA y TONO, nunca de fuente de cifras.',
    input_schema: { type: 'object', properties: {
      tender_id: { type: 'string' },
      seccion: { description: 'Índice (0, 1…) o parte del título de la sección', anyOf: [{ type: 'integer' }, { type: 'string' }] },
    }, required: ['tender_id'] },
  },
  {
    name: 'extraer_criterios',
    description: 'Extrae la estructura de puntuación (criterios, puntos, qué hay que demostrar) del pliego que está en esos adjuntos. Si la conversación tiene expediente, los guarda en él. Tarda ~30-60 s.',
    input_schema: { type: 'object', properties: { adjunto_ids: { type: 'array', items: { type: 'string' } } }, required: ['adjunto_ids'] },
  },
  {
    name: 'crear_documento',
    description: 'Guarda lo que has redactado como documento nuevo (borrador) en Documentos, para que la persona lo vea, lo edite y lo exporte a Word. Úsalo cuando redactes algo que la persona vaya a querer conservar (una sección, una memoria, un anexo). En una oferta los importes se sustituyen por [FALTA: tarifa].',
    input_schema: { type: 'object', properties: {
      titulo: { type: 'string' },
      tipo: { type: 'string', enum: ['memoria', 'oferta', 'anexo'] },
      secciones: { type: 'array', items: { type: 'object', properties: {
        titulo: { type: 'string' }, contenido: { type: 'string' }, nota: { type: 'string', description: 'Nota interna: datos a confirmar, huecos' },
      }, required: ['titulo', 'contenido'] } },
    }, required: ['titulo', 'tipo', 'secciones'] },
  },
  {
    name: 'leer_documento',
    description: 'Lee un documento guardado (título y secciones con su índice).',
    input_schema: { type: 'object', properties: { document_id: { type: 'string' } }, required: ['document_id'] },
  },
  {
    name: 'editar_seccion',
    description: 'Sustituye el contenido de una sección de un documento guardado (indice) o añade una al final (indice=null, con titulo). La primera vez que tocas un documento en esta conversación se guarda una copia de la versión anterior. Di siempre a la persona qué has cambiado.',
    input_schema: { type: 'object', properties: {
      document_id: { type: 'string' },
      indice: { type: ['integer', 'null'], description: 'Índice de la sección (0, 1…) o null para añadir' },
      titulo: { type: 'string', description: 'Nuevo título (opcional al editar, obligatorio al añadir)' },
      contenido: { type: 'string', description: 'El texto COMPLETO de la sección tal como debe quedar' },
    }, required: ['document_id', 'indice', 'contenido'] },
  },
  {
    name: 'generar_memoria_completa',
    description: 'Genera de una vez la memoria técnica entera contra el pliego de esos adjuntos (criterio a criterio + secciones de servicio) y la guarda como documento. Es LENTA (2-4 minutos) y cara: úsala solo cuando la persona pida la memoria completa; no la combines con otras herramientas en la misma vuelta.',
    input_schema: { type: 'object', properties: {
      adjunto_ids: { type: 'array', items: { type: 'string' } },
      instrucciones: { type: 'string', description: 'Lo que la persona ha pedido para esta memoria (enfoque, límites, términos)' },
      base_tender_id: { type: 'string', description: 'Memoria pasada de la que partir, si la persona la eligió' },
    }, required: ['adjunto_ids'] },
  },
  {
    name: 'exportar_word',
    description: 'Ofrece a la persona descargar un documento guardado como Word con el membrete de la marca.',
    input_schema: { type: 'object', properties: { document_id: { type: 'string' } }, required: ['document_id'] },
  },
  {
    name: 'recordar_leccion',
    description: 'Guarda una lección permanente de la marca («siempre…», «nunca…»). Úsala SOLO cuando la persona diga que algo se haga siempre o que lo recuerdes; no para preferencias de un solo documento.',
    input_schema: { type: 'object', properties: { texto: { type: 'string', description: 'La regla, en una frase corta e imperativa' } }, required: ['texto'] },
  },
  {
    name: 'asociar_expediente',
    description: 'Liga esta conversación a un expediente existente (tender_id) o crea uno nuevo (tender_id=null y titulo). Los documentos que guardes después colgarán de él.',
    input_schema: { type: 'object', properties: {
      tender_id: { type: ['string', 'null'] },
      titulo: { type: 'string' },
    }, required: ['tender_id'] },
  },
]

// ─── Compactado del historial ─────────────────────────────────────────────────

export function capText(s: string, cap: number): string {
  if (s.length <= cap) return s
  return `${s.slice(0, cap)}\n[… recortado al guardar: ${s.length.toLocaleString('es-ES')} caracteres en total; si lo necesitas, vuelve a llamar a la herramienta]`
}

/** Recorta en profundidad los textos largos de una entrada de herramienta (las secciones de crear_documento). */
export function compactInput(v: unknown, cap = TOOL_INPUT_SAVE_CAP): unknown {
  if (typeof v === 'string') return v.length > cap ? `${v.slice(0, cap)} [… ${v.length.toLocaleString('es-ES')} caracteres; el texto completo está en el documento guardado]` : v
  if (Array.isArray(v)) return v.map((x) => compactInput(x, cap))
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, compactInput(x, cap)]))
  return v
}

/**
 * Lo que se guarda de un turno del modelo para retomarlo otro día: los
 * tool_result largos (un trozo de pliego de 30k) y las entradas largas (una
 * sección entera) se recortan a 2.000. Sin esto, diez vueltas leyendo el
 * pliego dejan una fila de megas que además se reenvía entera en cada mensaje.
 * Los bloques de texto vacíos se quitan: la API los rechaza.
 */
export function compactForStorage(msgs: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  return msgs.map((m) => {
    if (typeof m.content === 'string') return m
    const content = m.content.flatMap((b): Anthropic.ContentBlockParam[] => {
      if (b.type === 'text') return b.text.trim() ? [{ type: 'text', text: b.text }] : []
      if (b.type === 'tool_use') return [{ type: 'tool_use', id: b.id, name: b.name, input: compactInput(b.input) }]
      if (b.type === 'tool_result') {
        const text = typeof b.content === 'string' ? b.content
          : Array.isArray(b.content) ? b.content.map((c) => (c.type === 'text' ? c.text : '')).join('') : ''
        return [{ type: 'tool_result', tool_use_id: b.tool_use_id, content: capText(text, TOOL_RESULT_SAVE_CAP), ...(b.is_error ? { is_error: true } : {}) }]
      }
      return [b as Anthropic.ContentBlockParam]
    })
    return { role: m.role, content }
  }).filter((m) => typeof m.content === 'string' ? m.content.trim() : m.content.length > 0)
}

const sizeOf = (m: Anthropic.MessageParam) => (typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length)

/**
 * Historial para el modelo a partir de los mensajes guardados. Se olvidan
 * intercambios enteros por el principio si no cabe (nunca medio intercambio:
 * un tool_result sin su tool_use es un 400 de la API). Los mensajes seguidos
 * del mismo rol se funden, y un tool_use sin su resultado (una caída a mitad)
 * se descarta.
 */
export function buildHistory(messages: ChatMessage[], budget = HISTORY_CHAR_BUDGET): { history: Anthropic.MessageParam[]; olvidados: number } {
  // Agrupa en intercambios que empiezan por un mensaje de la persona.
  const grupos: Anthropic.MessageParam[][] = []
  for (const m of messages) {
    const turn = Array.isArray(m._model) && m._model.length ? m._model
      : m.content.trim() ? [{ role: m.role, content: m.content } as Anthropic.MessageParam] : []
    if (!turn.length) continue
    if (m.role === 'user' || grupos.length === 0) grupos.push([...turn])
    else grupos[grupos.length - 1].push(...turn)
  }
  let total = grupos.reduce((a, g) => a + g.reduce((b, m) => b + sizeOf(m), 0), 0)
  let olvidados = 0
  // Siempre se conserva el último intercambio (es la pregunta en curso).
  while (grupos.length > 1 && total > budget) {
    total -= grupos[0].reduce((b, m) => b + sizeOf(m), 0)
    grupos.shift()
    olvidados++
  }
  return { history: normalizeHistory(grupos.flat()), olvidados }
}

const toBlocks = (c: Anthropic.MessageParam['content']): Anthropic.ContentBlockParam[] =>
  typeof c === 'string' ? (c.trim() ? [{ type: 'text', text: c }] : []) : c

/** Funde roles repetidos, quita tool_use huérfanos y garantiza que empieza por la persona. */
export function normalizeHistory(msgs: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = []
  for (const m of msgs) {
    const blocks = toBlocks(m.content)
    if (!blocks.length) continue
    const last = out[out.length - 1]
    if (last && last.role === m.role) last.content = [...toBlocks(last.content), ...blocks]
    else out.push({ role: m.role, content: blocks })
  }
  // tool_use sin tool_result en el mensaje siguiente → fuera ese tool_use.
  for (let k = 0; k < out.length; k++) {
    const m = out[k]
    if (m.role !== 'assistant' || typeof m.content === 'string') continue
    const next = out[k + 1]
    const resueltos = new Set(next && typeof next.content !== 'string'
      ? next.content.filter((b) => b.type === 'tool_result').map((b) => (b as Anthropic.ToolResultBlockParam).tool_use_id) : [])
    m.content = m.content.filter((b) => b.type !== 'tool_use' || resueltos.has((b as Anthropic.ToolUseBlockParam).id))
  }
  // tool_result cuyo tool_use ya no está (porque se olvidó o se quitó) → fuera.
  for (let k = 0; k < out.length; k++) {
    const m = out[k]
    if (m.role !== 'user' || typeof m.content === 'string') continue
    const prev = out[k - 1]
    const usados = new Set(prev && typeof prev.content !== 'string'
      ? prev.content.filter((b) => b.type === 'tool_use').map((b) => (b as Anthropic.ToolUseBlockParam).id) : [])
    m.content = m.content.filter((b) => b.type !== 'tool_result' || usados.has((b as Anthropic.ToolResultBlockParam).tool_use_id))
  }
  const limpio = out.filter((m) => typeof m.content === 'string' ? m.content.trim() : m.content.length > 0)
  // Tras quitar bloques pueden quedar roles seguidos otra vez: segunda pasada de fusión.
  const fundido: Anthropic.MessageParam[] = []
  for (const m of limpio) {
    const last = fundido[fundido.length - 1]
    if (last && last.role === m.role) last.content = [...toBlocks(last.content), ...toBlocks(m.content)]
    else fundido.push(m)
  }
  while (fundido.length && fundido[0].role !== 'user') fundido.shift()
  return fundido
}

/** Título automático: las primeras palabras del primer mensaje. */
export function autoTitle(message: string, filenames: string[] = []): string {
  const palabras = message.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  let t = ''
  for (const p of palabras) {
    if ((t ? `${t} ${p}` : p).length > 60) break
    t = t ? `${t} ${p}` : p
    if (t.split(' ').length >= 8) break
  }
  if (!t && filenames[0]) t = filenames[0].replace(/\.(pdf|docx|txt|md)$/i, '').slice(0, 60)
  if (t && palabras.join(' ').length > t.length) t = `${t}…`
  return t || 'New conversation'
}

/** Un evento SSE. */
export function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/** Resumen corto para la pantalla de lo que ha hecho una herramienta (nunca el contenido). */
export function toolLabel(name: string): string {
  const L: Record<string, string> = {
    leer_adjunto: 'Leyendo adjunto', buscar_en_material: 'Buscando en el material de la empresa',
    listar_memorias_pasadas: 'Revisando memorias presentadas', listar_expedientes: 'Revisando expedientes',
    leer_memoria_pasada: 'Leyendo una memoria presentada', extraer_criterios: 'Extrayendo criterios del pliego',
    crear_documento: 'Guardando documento', leer_documento: 'Leyendo documento', editar_seccion: 'Editando sección',
    generar_memoria_completa: 'Generando la memoria completa (2-4 min)', exportar_word: 'Preparando Word',
    recordar_leccion: 'Guardando lección', asociar_expediente: 'Asociando expediente',
  }
  return L[name] || name
}

// ─── Cuerpo del POST ──────────────────────────────────────────────────────────

export interface PostAttachmentIn { path: string; filename: string; mime: string }
export interface ChatPostIn { tenderId?: string | null; chatId: string | null; message: string; attachments: PostAttachmentIn[] }

/** Valida el cuerpo de POST /api/tender/chat (sin el clientId, que lo resuelve requireTool). */
export function validateChatPost(body: Record<string, unknown>): Valid<ChatPostIn> {
  const chatId = body.chatId === undefined || body.chatId === null || body.chatId === '' ? null : body.chatId
  if (chatId !== null && !isUuid(chatId)) return { ok: false, error: 'chatId no válido' }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (message.length > MESSAGE_MAX) return { ok: false, error: `El mensaje pasa de ${MESSAGE_MAX.toLocaleString('es-ES')} caracteres: adjúntalo como fichero.` }
  const raw = body.attachments === undefined || body.attachments === null ? [] : body.attachments
  if (!Array.isArray(raw)) return { ok: false, error: 'attachments debe ser una lista' }
  if (raw.length > ATTACHMENTS_PER_MESSAGE) return { ok: false, error: `Máximo ${ATTACHMENTS_PER_MESSAGE} ficheros por mensaje.` }
  const attachments: PostAttachmentIn[] = []
  for (const a of raw) {
    const o = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>
    if (typeof o.path !== 'string' || !o.path) return { ok: false, error: 'Cada adjunto necesita su path (el que devuelve uploadTenderFile).' }
    attachments.push({
      path: o.path,
      filename: (typeof o.filename === 'string' && o.filename.trim() ? o.filename.trim() : o.path.split('/').pop() || 'fichero').slice(0, 200),
      mime: typeof o.mime === 'string' ? o.mime.slice(0, 120) : '',
    })
  }
  if (!message && attachments.length === 0) return { ok: false, error: 'Escribe un mensaje o adjunta un fichero.' }
  // Expediente con el que nace la conversación (la pantalla lo manda al empezar desde un expediente). La marca la comprueba la ruta.
  const tenderId = isUuid(body.tenderId) ? (body.tenderId as string) : null
  return { ok: true, value: { chatId: chatId as string | null, message, attachments, tenderId } }
}

/** Lo que el modelo recibe del mensaje de la persona: su texto y una ficha por adjunto nuevo (con un arranque para que sepa qué es). */
export function userContentForModel(message: string, nuevos: ChatAttachment[], fallidos: Array<{ filename: string; motivo: string }>): string {
  const partes = [message || '(sin texto: la persona solo ha adjuntado ficheros)']
  for (const a of nuevos) {
    partes.push(`[Adjunto ${a.id}: «${a.filename}», ${a.chars.toLocaleString('es-ES')} caracteres${a.original_chars && a.original_chars > a.chars ? ` (RECORTADO: tenía ${a.original_chars.toLocaleString('es-ES')})` : ''}. Arranque: «${a.text.slice(0, 600).replace(/\s+/g, ' ')}…» — léelo con leer_adjunto.]`)
  }
  for (const f of fallidos) partes.push(`[No se ha podido leer el adjunto «${f.filename}»: ${f.motivo}. No hagas como si lo tuvieras.]`)
  return partes.join('\n\n')
}
