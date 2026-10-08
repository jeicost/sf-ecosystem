import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.generated'
import { getClaudeForClient, logUsage } from '@/lib/anthropic-client'
import { getKnowledgeContext } from '@/lib/knowledge'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { toJson, writable } from '@/lib/db-json'
import { estructurarDocumento } from '@/lib/generation/tender-documento'
import {
  extractTenderCriteria, generateTenderMemoria, maskOrganos, maskPalabras, palabrasAEnmascarar,
  type TenderCriteria,
} from '@/lib/generation/tender-memoria'
import { sanearImportes, sanearPorcentajes } from '@/lib/generation/tender-libre'
import { addLesson, loadTenderTeaching } from '@/lib/tenders/teaching'
import { ajustesModelo, CACHE_1H } from '@/lib/ai/models'
import { bloqueDisenadasPrompt, normalizarMarcadores, type Disenada } from '@/lib/tenders/disenadas'
import {
  CHAT_MODEL, MAX_TURNS, MAX_TOKENS_TURN, TOOL_DEFS, CHUNK_MAX, SECTION_CONTENT_MAX,
  chunkAttachment, compactForStorage, toolLabel, validateToolInput,
  type ChatAttachment, type DocTouch, type ToolInput, type ToolTrace,
} from '@/lib/tenders/chat-core'

// Licitaciones en modo conversación — el agente.
//
// «Le dices lo que quieres y te va ayudando a conseguirlo, todo lo que hacía
// antes pero conversando.» Lo que antes eran pasos fijos (subir pliego →
// criterios → memoria → reescribir sección → Word) son aquí HERRAMIENTAS que el
// modelo llama cuando la conversación lo pide. Los motores son los mismos
// (tender-memoria, tender-libre, teaching): no se duplica ni una regla.
//
// La frontera de marca la pone el servidor: toda consulta lleva
// .eq('client_id', ctx.clientId), y ctx.clientId sale de requireTool, nunca del
// navegador ni del modelo. Un id de documento o expediente que el modelo
// «recuerde» de otra marca simplemente no existe para esta.

type DB = SupabaseClient<Database>

/** Lo que el agente necesita del exterior. Inyectable para probar sin red (evals/licitaciones/chat-check.ts). */
export interface ChatDeps {
  knowledge: typeof getKnowledgeContext
  extractCriteria: typeof extractTenderCriteria
  generateMemoria: typeof generateTenderMemoria
  loadTenderTeaching: typeof loadTenderTeaching
  addLesson: typeof addLesson
  estructurar?: typeof estructurarDocumento
}
export const defaultDeps = (): ChatDeps => ({
  knowledge: getKnowledgeContext,
  extractCriteria: extractTenderCriteria,
  generateMemoria: generateTenderMemoria,
  loadTenderTeaching,
  addLesson,
  estructurar: estructurarDocumento,
})

export type Emit = (event: string, data: unknown) => void

export interface ChatContext {
  clientId: string
  userId: string | null
  chatId: string
  chatTitle: string
  tenderId: string | null
  attachments: ChatAttachment[]
  brandName: string | null
  /** Páginas con diseño propio de la marca: el modelo las marca ([[DISEÑO:id]]), aquí se validan. */
  disenadas: Disenada[]
  /** Documentos de los que ya se guardó la versión anterior en ESTA conversación. */
  backedUp: Set<string>
  /** Documentos creados en esta misma petición: nadie ha podido editarlos a mano, no necesitan copia. */
  createdNow: Set<string>
  /** Momento de inicio de la petición: la ruta muere a los 300 s. */
  startedAt: number
  emit: Emit
  db: DB
  deps: ChatDeps
}

export interface ToolOutcome {
  content: string
  isError: boolean
  summary: string
  doc?: DocTouch
}

const out = (data: unknown, summary: string, doc?: DocTouch): ToolOutcome =>
  ({ content: JSON.stringify(data), isError: false, summary, doc })
const fail = (error: string, summary = 'No se ha podido'): ToolOutcome =>
  ({ content: JSON.stringify({ error }), isError: true, summary: `${summary}: ${error}`.slice(0, 200) })

/** Si ya ha pasado esto, la memoria completa (5-8 min) no cabe en los 300 s de la ruta. */
const MEMORIA_COMPLETA_MAX_ELAPSED_MS = 240_000 // la memoria completa tarda 6-7 min (medido 7-oct) y la ruta admite 800 s

/** Texto del pliego a partir de varios adjuntos, con su nombre delante para que el modelo sepa qué es PCAP y qué PPT. */
export function pliegoDeAdjuntos(ctx: Pick<ChatContext, 'attachments'>, ids: string[]): { texto: string; faltan: string[] } {
  const faltan = ids.filter((id) => !ctx.attachments.some((a) => a.id === id))
  const texto = ids.flatMap((id) => ctx.attachments.filter((a) => a.id === id))
    .map((a) => `=== ${a.filename} ===\n${a.text}`).join('\n\n')
  return { texto, faltan }
}

interface SeccionDoc { titulo: string; contenido: string; criterio?: string; puntos_objetivo?: number | null; nota?: string }

const seccionesDe = (raw: unknown): SeccionDoc[] =>
  (Array.isArray(raw) ? raw : []).filter((s) => s && typeof s === 'object').map((s) => {
    const o = s as Record<string, unknown>
    return {
      titulo: typeof o.titulo === 'string' ? o.titulo : 'Sección',
      contenido: typeof o.contenido === 'string' ? o.contenido : '',
      ...(typeof o.criterio === 'string' ? { criterio: o.criterio } : {}),
      ...(typeof o.puntos_objetivo === 'number' ? { puntos_objetivo: o.puntos_objetivo } : {}),
      ...(typeof o.nota === 'string' ? { nota: o.nota } : {}),
    }
  })

/** En una oferta no entra ni un importe: TS lo sustituye aunque el modelo lo escriba (misma regla que tender-libre). */
export function sanearOferta(texto: string): { texto: string; importes: number; descuentos: number } {
  const a = sanearImportes(texto)
  const b = sanearPorcentajes(a.texto)
  return { texto: b.texto, importes: a.n, descuentos: b.n }
}

const fechaCorta = () => new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })

/** Ejecuta UNA herramienta. Nunca lanza: un fallo vuelve al modelo como error para que lo explique. */
export async function executeTool(ctx: ChatContext, name: string, rawInput: unknown): Promise<ToolOutcome> {
  const v = validateToolInput(name, rawInput)
  if (!v.ok) return fail(v.error, toolLabel(name))
  try {
    return await run(ctx, v.value)
  } catch (err) {
    console.error(`[tender/chat] herramienta ${name} falló`, err)
    return fail(err instanceof Error ? err.message : 'error inesperado', toolLabel(name))
  }
}

async function run(ctx: ChatContext, t: ToolInput): Promise<ToolOutcome> {
  const { db, clientId } = ctx
  switch (t.name) {
    case 'leer_adjunto': {
      const a = ctx.attachments.find((x) => x.id === t.id)
      if (!a) return fail(`No hay ningún adjunto ${t.id} en esta conversación.`, 'Leyendo adjunto')
      const c = chunkAttachment(a, t.desde, t.hasta)
      return out(c, `Leído «${a.filename}» (${c.desde.toLocaleString('es-ES')}–${c.hasta.toLocaleString('es-ES')} de ${c.total.toLocaleString('es-ES')})`)
    }

    case 'buscar_en_material': {
      // Presupuesto contenido: esto vuelve a cada vuelta del bucle y se suma al pliego.
      const k = await ctx.deps.knowledge(clientId, { query: t.consulta, charBudget: 3000, documentBudget: 12000, fetchLimit: 2000 })
      if (k === null) return fail('El material de la empresa no está disponible ahora mismo.', 'Buscando en el material')
      if (!k) return out({ resultado: 'Nada en el material de la empresa casa con esa consulta. Lo que haga falta va como [FALTA: …].' }, 'Sin resultados en el material')
      return out({ resultado: k }, `Buscado en el material: «${t.consulta.slice(0, 60)}»`)
    }

    case 'listar_memorias_pasadas': {
      const { data, error } = await db.from('tenders').select('id,title,status,organo,updated_at,memoria')
        .eq('client_id', clientId).in('status', ['presentada', 'ganada', 'perdida']).not('memoria', 'is', null)
        .order('updated_at', { ascending: false }).limit(80)
      if (error) throw error
      const lista = (data || []).filter((r) => r.id !== ctx.tenderId).map((r) => ({
        tender_id: r.id, titulo: r.title, resultado: r.status, anio: String(r.updated_at || '').slice(0, 4),
        secciones: seccionesDe((r.memoria as { secciones?: unknown } | null)?.secciones).length,
      }))
      return out({ memorias: lista, nota: 'Son de OTROS órganos: modelo de estructura y tono, nunca fuente de cifras ni de nombres.' }, `${lista.length} memorias presentadas`)
    }

    case 'listar_expedientes': {
      let q = db.from('tenders').select('id,title,organo,expediente,status,updated_at,memoria')
        .eq('client_id', clientId).order('updated_at', { ascending: false }).limit(50)
      // El texto viene del modelo: fuera los comodines y separadores de PostgREST.
      const filtro = (t.consulta || '').replace(/[%_,()*\\]/g, ' ').trim()
      if (filtro) q = q.ilike('title', `%${filtro}%`)
      const { data, error } = await q
      if (error) throw error
      const lista = (data || []).map((r) => ({ tender_id: r.id, titulo: r.title, organo: r.organo, expediente: r.expediente, estado: r.status, con_memoria: !!r.memoria }))
      return out({ expedientes: lista, actual: ctx.tenderId }, `${lista.length} expedientes`)
    }

    case 'leer_memoria_pasada': {
      const { data, error } = await db.from('tenders').select('id,title,organo,status,updated_at,memoria')
        .eq('id', t.tender_id).eq('client_id', clientId).not('memoria', 'is', null).maybeSingle()
      if (error) throw error
      if (!data) return fail('Esa memoria no existe o no es de esta marca.', 'Leyendo memoria')
      const m = (data.memoria || {}) as { titulo?: string; secciones?: unknown }
      const secs = seccionesDe(m.secciones)
      // Mismo enmascarado que loadMemoriaExamples: el órgano anterior no puede
      // acabar en la memoria nueva. Lo que aparece en los adjuntos de ESTA
      // conversación o en la marca es legítimo y no se tapa. La memoria del
      // propio expediente de la conversación no se enmascara: es de este órgano.
      const propio = data.id === ctx.tenderId
      const legitimo = [ctx.brandName || '', ...ctx.attachments.map((a) => a.text.slice(0, 200_000))].join('\n')
      const organos = [String(data.organo || '').trim()].filter((o) => o.length >= 3)
      const palabras = propio ? [] : palabrasAEnmascarar([data.title, m.titulo], legitimo)
      const mask = (s: string) => (propio ? s : maskPalabras(maskOrganos(s, organos), palabras))
      const cabecera = { tender_id: data.id, titulo: mask(m.titulo || data.title || ''), resultado: data.status, anio: String(data.updated_at || '').slice(0, 4) }
      if (t.seccion === undefined) {
        return out({ ...cabecera, indice: secs.map((s, n) => ({ indice: n, titulo: mask(s.titulo), caracteres: s.contenido.length, inicio: mask(s.contenido.slice(0, 300)) })) },
          `Índice de una memoria presentada (${secs.length} secciones)`)
      }
      const n = typeof t.seccion === 'number' ? t.seccion
        : secs.findIndex((s) => s.titulo.toLowerCase().includes(String(t.seccion).toLowerCase()))
      const s = secs[n]
      if (!s) return fail(`No hay sección «${t.seccion}» en esa memoria; pide el índice sin "seccion".`, 'Leyendo memoria')
      return out({ ...cabecera, indice: n, seccion: { titulo: mask(s.titulo), contenido: mask(s.contenido.slice(0, 20_000)) } }, `Leída la sección «${mask(s.titulo).slice(0, 60)}» de una memoria presentada`)
    }

    case 'extraer_criterios': {
      const { texto, faltan } = pliegoDeAdjuntos(ctx, t.adjunto_ids)
      if (faltan.length) return fail(`No existen los adjuntos ${faltan.join(', ')}.`, 'Extrayendo criterios')
      const criteria = await ctx.deps.extractCriteria(clientId, texto)
      let guardado = false
      if (ctx.tenderId) {
        const { data } = await db.from('tenders').select('pliego_text,expediente').eq('id', ctx.tenderId).eq('client_id', clientId).maybeSingle()
        if (data) {
          const patch: Record<string, unknown> = { criteria: toJson(criteria), updated_at: new Date().toISOString() }
          // El pliego del expediente solo se rellena si estaba vacío: no se pisa lo que subió la persona por la pantalla.
          if (!data.pliego_text) patch.pliego_text = texto
          if (!data.expediente && criteria.expediente) patch.expediente = String(criteria.expediente).slice(0, 200)
          const { error } = await db.from('tenders').update(writable(patch)).eq('id', ctx.tenderId).eq('client_id', clientId)
          if (error) throw error
          guardado = true
        }
      }
      return out({ ...criteria, guardado_en_expediente: guardado }, `${criteria.criteria.length} criterios extraídos${guardado ? ' y guardados en el expediente' : ''}`)
    }

    case 'crear_documento': {
      let importes = 0, descuentos = 0
      const marcasRaras: string[] = []
      const secciones = t.secciones.map((s) => {
        // Las marcas de páginas diseñadas se validan: una inventada no llega al documento.
        const m = normalizarMarcadores(s.contenido, ctx.disenadas)
        marcasRaras.push(...m.desconocidas)
        let contenido = m.texto
        if (t.tipo === 'oferta') {
          const c = sanearOferta(contenido)
          importes += c.importes; descuentos += c.descuentos
          contenido = c.texto
        }
        return { ...s, contenido }
      })
      const { data, error } = await db.from('tender_documents').insert(writable({
        client_id: clientId, tender_id: ctx.tenderId, kind: t.tipo, title: t.titulo, status: 'borrador',
        sections: toJson(secciones), created_by: ctx.userId, updated_by: ctx.userId,
      })).select('id,title').single()
      if (error) throw error
      ctx.createdNow.add(data.id)
      ctx.emit('document', { id: data.id, title: data.title })
      const avisos = [
        ...(importes ? [`${importes} importe(s) sustituidos por [FALTA: tarifa]: en una oferta los precios los pone el equipo comercial.`] : []),
        ...(descuentos ? [`${descuentos} descuento(s) sustituidos por [FALTA: descuento].`] : []),
        ...(marcasRaras.length ? [`Marcas de páginas diseñadas que no existen y se han quitado: ${marcasRaras.map((x) => `«${x}»`).join(', ')}. Usa solo las del estado.`] : []),
      ]
      return out({ document_id: data.id, titulo: data.title, secciones: secciones.length, avisos },
        `Guardado «${data.title}» (${secciones.length} secciones)`, { id: data.id, titulo: data.title, accion: 'creado' })
    }

    case 'leer_documento': {
      const { data, error } = await db.from('tender_documents').select('id,title,kind,status,tender_id,sections,updated_at')
        .eq('id', t.document_id).eq('client_id', clientId).maybeSingle()
      if (error) throw error
      if (!data) return fail('Ese documento no existe o no es de esta marca.', 'Leyendo documento')
      const secs = seccionesDe(data.sections)
      let usado = 0
      const secciones = secs.map((s, n) => {
        const cupo = Math.max(0, Math.min(15_000, CHUNK_MAX - usado))
        const contenido = s.contenido.length > cupo ? `${s.contenido.slice(0, cupo)} [… ${s.contenido.length} caracteres; pide leer_documento de nuevo tras editar otras secciones si necesitas el resto]` : s.contenido
        usado += Math.min(s.contenido.length, cupo)
        return { indice: n, titulo: s.titulo, contenido, ...(s.nota ? { nota: s.nota } : {}), ...(s.criterio ? { criterio: s.criterio } : {}) }
      })
      return out({ document_id: data.id, titulo: data.title, tipo: data.kind, estado: data.status, secciones }, `Leído «${data.title}»`)
    }

    case 'editar_seccion': {
      const { data, error } = await db.from('tender_documents').select('id,title,kind,status,tender_id,sections')
        .eq('id', t.document_id).eq('client_id', clientId).maybeSingle()
      if (error) throw error
      if (!data) return fail('Ese documento no existe o no es de esta marca.', 'Editando sección')
      const secs = seccionesDe(data.sections)
      if (t.indice !== null && t.indice >= secs.length) return fail(`El documento tiene ${secs.length} secciones (índices 0–${secs.length - 1}).`, 'Editando sección')
      // La versión anterior se guarda ANTES de tocar nada, una vez por
      // conversación y documento (el patrón de la pantalla: «— previous
      // version»). Si la copia falla, no se sobrescribe: horas de ajuste a mano
      // no pueden depender de que el modelo acierte.
      let copiaId: string | null = null
      if (!ctx.backedUp.has(data.id) && !ctx.createdNow.has(data.id)) {
        const { data: copia, error: e2 } = await db.from('tender_documents').insert(writable({
          client_id: clientId, tender_id: data.tender_id, kind: data.kind, status: 'borrador',
          title: `${data.title} — previous version (${fechaCorta()})`.slice(0, 200),
          sections: toJson(secs), created_by: ctx.userId, updated_by: ctx.userId,
        })).select('id').single()
        if (e2 || !copia) return fail('No se ha podido guardar una copia de la versión anterior, así que no se ha tocado el documento.', 'Editando sección')
        copiaId = copia.id
      }
      let contenido = t.contenido.slice(0, SECTION_CONTENT_MAX)
      const avisos: string[] = []
      const marc = normalizarMarcadores(contenido, ctx.disenadas)
      contenido = marc.texto
      if (marc.desconocidas.length) avisos.push(`Marcas de páginas diseñadas que no existen y se han quitado: ${marc.desconocidas.map((x) => `«${x}»`).join(', ')}.`)
      if (data.kind === 'oferta') {
        const c = sanearOferta(contenido)
        contenido = c.texto
        if (c.importes) avisos.push(`${c.importes} importe(s) sustituidos por [FALTA: tarifa].`)
        if (c.descuentos) avisos.push(`${c.descuentos} descuento(s) sustituidos por [FALTA: descuento].`)
      }
      if (data.status === 'final') avisos.push('El documento estaba marcado como FINAL: díselo a la persona.')
      const nuevas = [...secs]
      const indice = t.indice === null ? nuevas.length : t.indice
      if (t.indice === null) nuevas.push({ titulo: t.titulo || 'Sección', contenido })
      else nuevas[indice] = { ...nuevas[indice], ...(t.titulo ? { titulo: t.titulo } : {}), contenido }
      const { error: e3 } = await db.from('tender_documents').update(writable({
        sections: toJson(nuevas), updated_by: ctx.userId, updated_at: new Date().toISOString(),
      })).eq('id', data.id).eq('client_id', clientId)
      if (e3) throw e3
      ctx.backedUp.add(data.id)
      ctx.emit('document', { id: data.id, title: data.title })
      return out({ ok: true, document_id: data.id, indice, titulo: nuevas[indice].titulo, accion: t.indice === null ? 'añadida' : 'sustituida', copia_version_anterior: copiaId, avisos },
        `${t.indice === null ? 'Añadida' : 'Editada'} la sección «${nuevas[indice].titulo.slice(0, 60)}» de «${data.title}»`,
        { id: data.id, titulo: data.title, accion: 'editado', copia_id: copiaId })
    }

    case 'generar_memoria_completa': {
      if (Date.now() - ctx.startedAt > MEMORIA_COMPLETA_MAX_ELAPSED_MS) {
        return fail('No queda tiempo en este mensaje para generar la memoria completa (tarda 5-8 min). Pide a la persona que escriba «genera la memoria» en un mensaje nuevo y llámala la primera.', 'Generando memoria')
      }
      const { texto, faltan } = pliegoDeAdjuntos(ctx, t.adjunto_ids)
      if (faltan.length) return fail(`No existen los adjuntos ${faltan.join(', ')}.`, 'Generando memoria')
      if (texto.length < 500) return fail('Esos adjuntos casi no tienen texto: no hay pliego contra el que escribir.', 'Generando memoria')
      // Lo guardado en el expediente (instrucciones, memoria de partida) + lo
      // que la persona ha dicho en la conversación, por ese orden.
      const saved = await ctx.deps.loadTenderTeaching(clientId, ctx.tenderId)
      const instructions = [saved.instructions, t.instrucciones].filter(Boolean).join('\n\n') || null
      const baseTenderId = t.base_tender_id || saved.baseTenderId
      // Criterios: los del expediente si se sacaron de ESTE mismo texto; si no, se extraen.
      let criteria: TenderCriteria | null = null
      let tenderRow: { memoria: unknown } | null = null
      if (ctx.tenderId) {
        const { data } = await db.from('tenders').select('criteria,pliego_text,memoria').eq('id', ctx.tenderId).eq('client_id', clientId).maybeSingle()
        tenderRow = data ? { memoria: data.memoria } : null
        const c = data?.criteria as TenderCriteria | null | undefined
        if (data && data.pliego_text === texto && c && Array.isArray(c.criteria) && c.criteria.length) criteria = c
      }
      if (!criteria) criteria = await ctx.deps.extractCriteria(clientId, texto)
      if (!criteria.criteria.length) return fail('El texto de esos adjuntos no contiene criterios de adjudicación: si es un borrador propio, trabájalo por secciones; si es una licitación, falta el PCAP.', 'Generando memoria')
      const memoria = await ctx.deps.generateMemoria({ clientId, pliegoText: texto, criteria, tenderId: ctx.tenderId, instructions, baseTenderId })
      const secciones = (Array.isArray(memoria.secciones) ? memoria.secciones as Array<Record<string, unknown>> : []).map((s) => ({
        titulo: String(s.titulo || 'Sección').slice(0, 200),
        contenido: String(s.contenido || ''),
        ...(typeof s.criterio === 'string' ? { criterio: s.criterio } : {}),
        ...(typeof s.puntos_objetivo === 'number' ? { puntos_objetivo: s.puntos_objetivo } : {}),
        ...(Array.isArray(s.datos_a_confirmar) && s.datos_a_confirmar.length ? { nota: `Por confirmar: ${(s.datos_a_confirmar as unknown[]).map(String).join('; ')}`.slice(0, 1000) } : {}),
      }))
      const titulo = String(memoria.titulo || 'Memoria técnica').slice(0, 200)
      const { data: doc, error } = await db.from('tender_documents').insert(writable({
        client_id: clientId, tender_id: ctx.tenderId, kind: 'memoria', title: titulo, status: 'borrador',
        sections: toJson(secciones), instruction: instructions?.slice(0, 2000) || null, created_by: ctx.userId, updated_by: ctx.userId,
      })).select('id,title').single()
      if (error) throw error
      ctx.createdNow.add(doc.id)
      // Si el expediente aún no tenía memoria, se le pone esta: así la vista de
      // expediente y el Word «de la memoria» la encuentran. Nunca se pisa una existente.
      if (ctx.tenderId && tenderRow && !tenderRow.memoria) {
        await db.from('tenders').update(writable({ memoria: toJson(memoria), criteria: toJson(criteria), updated_at: new Date().toISOString() }))
          .eq('id', ctx.tenderId).eq('client_id', clientId)
      }
      ctx.emit('document', { id: doc.id, title: doc.title })
      const gaps = Array.isArray(memoria.data_gaps) ? (memoria.data_gaps as unknown[]).map(String) : []
      return out({
        document_id: doc.id, titulo: doc.title, secciones: secciones.map((s, n) => `${n}. ${s.titulo}`),
        avisos: gaps.slice(0, 15), instrucciones_no_aplicadas: memoria.instrucciones_no_aplicadas ?? [],
      }, `Memoria completa guardada (${secciones.length} secciones)`, { id: doc.id, titulo: doc.title, accion: 'generado' })
    }

    case 'exportar_word': {
      const { data, error } = await db.from('tender_documents').select('id,title').eq('id', t.document_id).eq('client_id', clientId).maybeSingle()
      if (error) throw error
      if (!data) return fail('Ese documento no existe o no es de esta marca.', 'Preparando Word')
      // El fichero no se genera aquí: la pantalla hace POST /api/tender/export
      // con documentId, que ya sabe montar el Word con membrete.
      ctx.emit('download', { documentId: data.id, title: data.title })
      return out({ action: 'download', documentId: data.id }, `Word listo para descargar: «${data.title}»`)
    }

    case 'recordar_leccion': {
      const l = await ctx.deps.addLesson({ clientId, text: t.texto, source: 'feedback', tenderId: ctx.tenderId, createdBy: ctx.userId })
      if (!l) return fail('La lección es demasiado corta.', 'Guardando lección')
      return out({ ok: true, leccion: l.text }, `Lección guardada: «${l.text.slice(0, 80)}»`)
    }

    case 'guardar_version_final': {
      // Carlos (5-oct): «que se le pueda subir al chat y le indiquemos que lo guarde
      // en MIRA y aprenda de ello». Lo que enseña a MIRA son las memorias de los
      // expedientes presentados/ganados/perdidos (loadMemoriaExamples): por eso la
      // versión final se escribe en tenders.memoria y el expediente cambia de estado.
      let secciones: SeccionDoc[] = []
      let titulo = t.titulo || ''
      let docId: string | null = null
      if (t.adjunto_id) {
        const { texto, faltan } = pliegoDeAdjuntos(ctx, [t.adjunto_id])
        if (faltan.length) return fail(`No existe el adjunto ${t.adjunto_id}.`, toolLabel('guardar_version_final'))
        if (texto.length < 800) return fail('Ese adjunto casi no tiene texto (¿PDF escaneado?): no se puede aprender de él.', toolLabel('guardar_version_final'))
        const adj = ctx.attachments.find((a) => a.id === t.adjunto_id)!
        const est = await (ctx.deps.estructurar ?? estructurarDocumento)({ clientId, texto: adj.text, filename: adj.filename })
        secciones = est.secciones.map((s) => ({ titulo: String(s.titulo).slice(0, 200), contenido: String(s.contenido) }))
        titulo = titulo || est.titulo || adj.filename.replace(/\.[a-z0-9]+$/i, '')
      } else {
        const { data, error } = await db.from('tender_documents').select('id,title,sections').eq('id', t.document_id!).eq('client_id', clientId).maybeSingle()
        if (error) throw error
        if (!data) return fail('Ese documento no existe o no es de esta marca.', toolLabel('guardar_version_final'))
        secciones = seccionesDe(data.sections).map((s) => ({ titulo: s.titulo, contenido: s.contenido }))
        titulo = titulo || data.title
        docId = data.id
      }
      secciones = secciones.filter((s) => s.contenido.trim().length > 0)
      if (secciones.length < 2) return fail('No se han podido separar apartados en ese documento: revisa que sea la memoria completa.', toolLabel('guardar_version_final'))

      // Expediente: el de la conversación o uno nuevo con el título del documento.
      let tenderId = ctx.tenderId
      if (!tenderId) {
        const { data, error } = await db.from('tenders').insert({ client_id: clientId, title: titulo.slice(0, 200), status: t.estado, created_by: ctx.userId })
          .select('id,title').single()
        if (error) throw error
        tenderId = data.id
        await db.from('tender_chats').update({ tender_id: tenderId, updated_at: new Date().toISOString() }).eq('id', ctx.chatId).eq('client_id', clientId)
        ctx.tenderId = tenderId
        ctx.emit('chat', { chatId: ctx.chatId, title: ctx.chatTitle, tenderId, tenderTitle: data.title })
      }
      const { data: prev, error: e1 } = await db.from('tenders').select('title,memoria').eq('id', tenderId).eq('client_id', clientId).maybeSingle()
      if (e1) throw e1
      if (!prev) return fail('El expediente de esta conversación ya no existe.', toolLabel('guardar_version_final'))
      // La memoria que hubiera se conserva como documento antes de sustituirla.
      const prevSecs = Array.isArray((prev.memoria as { secciones?: unknown[] } | null)?.secciones) ? seccionesDe((prev.memoria as { secciones: unknown[] }).secciones) : []
      if (prevSecs.length) {
        const { error } = await db.from('tender_documents').insert(writable({
          client_id: clientId, tender_id: tenderId, kind: 'memoria', status: 'borrador',
          title: `${(prev.memoria as { titulo?: string }).titulo || prev.title} — previous version (${fechaCorta()})`,
          sections: toJson(prevSecs), created_by: ctx.userId, updated_by: ctx.userId,
        }))
        if (error) throw error
      }
      const memoria = { titulo, secciones: secciones.map((s) => ({ titulo: s.titulo, contenido: s.contenido })), fuente: 'version_final', guardada: new Date().toISOString() }
      const { error: e2 } = await db.from('tenders').update(writable({ memoria: toJson(memoria), status: t.estado, updated_at: new Date().toISOString() }))
        .eq('id', tenderId).eq('client_id', clientId)
      if (e2) throw e2
      // El documento queda en Documents como «final».
      if (docId) {
        const { error } = await db.from('tender_documents').update(writable({ status: 'final', tender_id: tenderId, updated_at: new Date().toISOString(), updated_by: ctx.userId }))
          .eq('id', docId).eq('client_id', clientId)
        if (error) throw error
      } else {
        const { data, error } = await db.from('tender_documents').insert(writable({
          client_id: clientId, tender_id: tenderId, kind: 'memoria', status: 'final', title: titulo.slice(0, 200),
          sections: toJson(secciones), created_by: ctx.userId, updated_by: ctx.userId,
        })).select('id').single()
        if (error) throw error
        docId = data.id
        ctx.createdNow.add(data.id)
      }
      ctx.emit('document', { id: docId, title: titulo })
      return out({ ok: true, tender_id: tenderId, estado: t.estado, secciones: secciones.length, copia_anterior: prevSecs.length > 0 },
        `Versión final guardada (${secciones.length} apartados) y expediente marcado como ${t.estado}: MIRA la usará de referencia`,
        { id: docId!, titulo, accion: 'creado' })
    }

    case 'asociar_expediente': {
      let tender: { id: string; title: string }
      if (t.tender_id) {
        const { data, error } = await db.from('tenders').select('id,title').eq('id', t.tender_id).eq('client_id', clientId).maybeSingle()
        if (error) throw error
        if (!data) return fail('Ese expediente no existe o no es de esta marca.', 'Asociando expediente')
        tender = data
      } else {
        const { data, error } = await db.from('tenders').insert({ client_id: clientId, title: t.titulo!, status: 'borrador', created_by: ctx.userId })
          .select('id,title').single()
        if (error) throw error
        tender = data
      }
      const { error } = await db.from('tender_chats').update({ tender_id: tender.id, updated_at: new Date().toISOString() })
        .eq('id', ctx.chatId).eq('client_id', clientId)
      if (error) throw error
      ctx.tenderId = tender.id
      ctx.emit('chat', { chatId: ctx.chatId, title: ctx.chatTitle, tenderId: tender.id, tenderTitle: tender.title })
      return out({ ok: true, tender_id: tender.id, titulo: tender.title, creado: !t.tender_id }, `${t.tender_id ? 'Asociado al' : 'Creado el'} expediente «${tender.title}»`)
    }
  }
}

// ─── El prompt ────────────────────────────────────────────────────────────────

// REGLAS_DESTILADAS — 12 reglas iniciales. Otro trabajo las sustituirá por las
// destiladas de las conversaciones reales de Usoa; mantener el marcador.
export const REGLAS_DESTILADAS: string[] = [
  // Destiladas el 5-oct de 10 conversaciones reales de una responsable de licitaciones con un chat genérico.
  'Antes de recomendar quitar, mantener o añadir un apartado, búscalo en el pliego vigente (PPT/PCAP) con leer_adjunto y cita punto y página. Si no lo encuentras, dilo como duda, no como hecho.',
  'El licitador es la marca activa salvo que el expediente diga otra razón social. Nunca presentes como licitador a una red, matriz o marca hermana.',
  'Trabaja apartado a apartado cuando te lo pidan: propones, esperas su corrección y reescribes solo ese apartado.',
  'Usa los datos operativos que la persona aporta tal cual y comprueba antes de entregar que no se te ha caído ninguno. No inventes procesos, cifras, reuniones ni compromisos: si falta un dato, pregúntalo o márcalo [FALTA: …].',
  'Describe cómo trabaja la empresa (su operativa real, paso a paso). No parafrasees el pliego: repetir lo que pide el órgano no puntúa.',
  'Cada apartado trata solo su tema; lo que pertenece a otro punto del índice ni se repite ni se adelanta.',
  'Escribe breve: sin introducciones genéricas ni párrafos de cierre. Ten presente el límite de páginas; cuando pidan reducir, reduce de verdad.',
  'Entrega textos listos para pegar, completos, y di exactamente dónde van (apartado y después de qué frase). Por defecto encájalos en un párrafo existente, sin abrir epígrafe nuevo.',
  'Si piden «solo lo que añado», devuelve solo ese bloque; si piden «solo incoherencias» o «lo estrictamente necesario», una lista corta con cita, sin mejoras opcionales.',
  'No vuelvas a matizar un texto que ya aplicaron siguiendo tu sugerencia; en segundas vueltas solo erratas o incumplimientos del pliego.',
  'Comprueba la separación de sobres: nada evaluable por fórmula (sobre automático: precio, mejoras puntuables, compromisos cuantificados) puede aparecer en la memoria de juicio de valor.',
  'Estructura la memoria con apartados que coincidan literalmente con los criterios puntuables, para que el evaluador no tenga que buscar.',
  'Al reutilizar una memoria anterior, lista lo específico del otro cliente que hay que quitar y marca los hechos fechados (reuniones, personas, cifras, herramientas) para que se confirmen.',
  'Distingue memoria de referencia de estilo (no copies su contenido de servicio) de memoria base para adaptar (conserva su redacción).',
  'No quites cifras de capacidad (vehículos, delegaciones, personal) que haya puesto la persona; si dudas de su vigencia, pregunta.',
  'Separa lo que hace el órgano contratante de lo que hace la empresa; no atribuyas a la empresa funciones del organismo.',
  'Mantén el plan de trabajo acordado (p. ej. «páginas 10, 13 y 15») y síguelo en orden hasta cerrarlo.',
  'Antes de decir que falta un documento o un dato, busca en todos los adjuntos y en el material; si no puedes verificar algo, di que no puedes comprobarlo.',
  'Las traducciones van completas y fieles; si el texto es largo, divídelo en tramos numerados y avisa de cuántos quedan.',
  'Nunca escribas precios, tarifas, importes ni descuentos, ni orientativos: los pone el equipo comercial ([FALTA: tarifa]).',
  'Respeta los términos exactos que usa la persona y el vocabulario del pliego; registro institucional, español de España salvo que pidan otro idioma.',
  'Guarda con crear_documento lo que la persona vaya a querer conservar, y cuando cambies un documento guardado di qué sección y qué cambió.',
  'La sección de medios o equipo material se dimensiona a lo que pide ESTE pliego: no es una sección estándar ni se copia de otra memoria, y no se ofrece ningún medio, servicio ni mejora que el pliego no pida expresamente.',
  'Dentro de cada sección, cada servicio específico del pliego y cada subapartado con entidad propia lleva su subtítulo en una línea que empieza por «## » (van al índice del Word, para que el evaluador encuentre cada servicio); listas con «- », pasos con «1. », tablas con barras.',
  'Las memorias se entregan lo más completas posible: todo el esqueleto habitual de la casa y SIEMPRE un plan de contingencia, aunque el pliego no lo puntúe; la persona quitará después lo que no necesite, no tú.',
  'Si hay SECCIONES FIJAS DE LA CASA en estas instrucciones (quiénes somos, equipo humano, qué ofrecemos…), toda memoria las lleva con su texto tal cual, adaptando solo la referencia al órgano; nunca las resumas ni las reescribas.',
  'Cuando la persona diga que un documento es la versión final, la presentada o la ganada, y que MIRA aprenda de él, usa guardar_version_final (deduce el estado de sus palabras —«la presentamos», «la ganamos»— y pregunta solo si no hay forma de saberlo). Así entra en las referencias de las memorias siguientes.',
]

export function buildSystemPrompt(parts: {
  brandName: string | null
  brainBlock: string
  teachingText: string
  /** Secciones fijas de la casa (bloqueSeccionesFijas), o vacío. */
  fijasText?: string
}): string {
  return `Eres el asistente de licitaciones de ${parts.brandName || 'la empresa'} dentro de MIRA. Ayudas a la responsable de licitaciones a preparar memorias técnicas, ofertas (sin precios) y anexos para concursos públicos, conversando: ella te dice lo que quiere y tú la ayudas a conseguirlo usando tus herramientas.

CÓMO TRABAJAS
- Los pliegos y documentos que adjunta están en la conversación como adjuntos (a1, a2…): léelos con leer_adjunto antes de afirmar qué piden.
- Los hechos de la empresa salen SOLO del brand brain de abajo y de buscar_en_material. Las memorias pasadas (listar_memorias_pasadas / leer_memoria_pasada) son modelo de estructura y tono, nunca fuente de cifras ni de nombres de órganos; [ÓRGANO ANTERIOR] jamás puede acabar en un texto.
- Lo que redactes para conservar, guárdalo con crear_documento; para cambiar un documento guardado, léelo y usa editar_seccion. Para el Word, exportar_word.
- generar_memoria_completa es lenta (5-8 min) y cara: solo cuando pida la memoria entera; avisa antes de lanzarla y no hagas nada más en esa vuelta.
- recordar_leccion solo cuando diga que algo se haga SIEMPRE (o «acuérdate de…»).
- Si una herramienta devuelve error, explícalo en una frase y propone qué hacer; no finjas que salió bien.
- Contesta en texto plano con saltos de línea (la pantalla no pinta tablas complejas); usa guiones para listas cortas.

REGLAS
${REGLAS_DESTILADAS.map((r, n) => `${n + 1}. ${r}`).join('\n')}

${parts.fijasText ? `${parts.fijasText}\n\n` : ''}${parts.teachingText ? `${parts.teachingText}\n\n` : ''}${parts.brainBlock}

${GROUNDING_CONTRACT}`
}

/** Bloque dinámico (cambia de un mensaje a otro): expediente y adjuntos. Va fuera de la caché. */
export function buildStatePrompt(ctx: Pick<ChatContext, 'tenderId' | 'attachments'>, tenderTitle: string | null, olvidados: number, disenadas: Disenada[] = []): string {
  const bloqueDisenadas = bloqueDisenadasPrompt(disenadas)
  const adj = ctx.attachments.length
    ? ctx.attachments.map((a) => `- ${a.id}: «${a.filename}» (${a.chars.toLocaleString('es-ES')} caracteres${a.original_chars && a.original_chars > a.chars ? `, RECORTADO al subir: tenía ${a.original_chars.toLocaleString('es-ES')}` : ''})`).join('\n')
    : '- (ninguno)'
  return `ESTADO DE ESTA CONVERSACIÓN
Expediente asociado: ${ctx.tenderId ? `«${tenderTitle || ''}» (${ctx.tenderId})` : 'ninguno (puedes asociar uno con asociar_expediente si la persona lo quiere)'}
Adjuntos:
${adj}${olvidados ? `\nNota: los ${olvidados} primeros intercambios de esta conversación ya no caben en tu memoria; los documentos guardados siguen disponibles con leer_documento.` : ''}
Fecha de hoy: ${new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' })}.${bloqueDisenadas ? `\n\n${bloqueDisenadas}` : ''}`
}

// ─── El bucle ─────────────────────────────────────────────────────────────────

export interface TurnResult {
  text: string
  /** Lo que se guarda en _model del mensaje de la respuesta (ya compactado). */
  model: Anthropic.MessageParam[]
  tools: ToolTrace[]
  documentos: DocTouch[]
  error?: string
}

/** Pasado este tiempo no se empieza otra vuelta: la ruta muere a los 300 s y se perdería todo. */
const TURN_DEADLINE_MS = 660_000 // la ruta muere a los 800 s (antes 300)

/**
 * Marca la caché sobre el último bloque de la conversación. Sin esto, cada una de
 * las hasta 8 vueltas de herramientas de un mensaje reenviaba TODA la conversación
 * (pliegos leídos incluidos) a precio completo: el 5-oct, 930.000 tokens de entrada
 * sin caché en 50 llamadas. Con la marca, la vuelta siguiente lee ese prefijo de la
 * caché (~10 % del precio). Copia superficial: el historial guardado no se toca.
 */
export function conCacheAlFinal(conv: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  if (!conv.length) return conv
  const out = conv.slice()
  const last = out[out.length - 1]
  const blocks: Anthropic.ContentBlockParam[] = typeof last.content === 'string'
    ? [{ type: 'text', text: last.content }]
    : last.content.slice()
  const i = blocks.length - 1
  if (i < 0) return conv
  const b = blocks[i] as Anthropic.ContentBlockParam & { cache_control?: unknown }
  // Los bloques de pensamiento no admiten marca de caché.
  if (b.type === 'thinking' || b.type === 'redacted_thinking') return conv
  blocks[i] = { ...b, cache_control: CACHE_1H } as Anthropic.ContentBlockParam
  out[out.length - 1] = { ...last, content: blocks }
  return out
}

export async function runTenderChat(opts: {
  ctx: ChatContext
  history: Anthropic.MessageParam[]
  system: string
  state: string
}): Promise<TurnResult> {
  const { ctx, system, state } = opts
  const conversation: Anthropic.MessageParam[] = [...opts.history]
  const nuevos: Anthropic.MessageParam[] = []
  const tools: ToolTrace[] = []
  const documentos: DocTouch[] = []
  let text = ''
  const say = (s: string) => {
    if (!s) return
    text += s
    ctx.emit('delta', { text: s })
  }

  // Caché de 1 HORA: el system (brain + enseñanza + reglas) y las herramientas son
  // iguales en las 8 vueltas de un mensaje Y entre mensajes; el bloque de estado
  // cambia y va aparte. Con 5 min, cada pausa de Usoa para leer o escribir
  // reescribía todo el prefijo (medido el 7-oct: 3 × 60k tokens en una mañana).
  const systemBlocks: Anthropic.TextBlockParam[] = [
    { type: 'text', text: system, cache_control: CACHE_1H },
    { type: 'text', text: state },
  ]
  const toolDefs: Anthropic.Tool[] = TOOL_DEFS.map((t, n) => (n === TOOL_DEFS.length - 1 ? { ...t, cache_control: CACHE_1H } : t))

  try {
    // 'tender/chat' activa el freno de gasto diario (lib/ai/budget.ts).
    const { client, usedClientKey } = await getClaudeForClient(ctx.clientId, 'tender/chat')
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      if (turn > 0 && Date.now() - ctx.startedAt > TURN_DEADLINE_MS) {
        say(`${text ? '\n\n' : ''}(Me he quedado sin tiempo en este mensaje. Escríbeme «sigue» y continúo donde lo he dejado.)`)
        break
      }
      let first = true
      // output_config (esfuerzo del pensamiento) no está en los tipos del SDK 0.39; el cuerpo lo lleva igual.
      const stream = client.messages.stream({
        model: CHAT_MODEL, max_tokens: MAX_TOKENS_TURN, system: systemBlocks, tools: toolDefs, messages: conCacheAlFinal(conversation),
        ...ajustesModelo(CHAT_MODEL),
      } as Anthropic.MessageStreamParams)
      stream.on('text', (t) => {
        // Entre vueltas, un salto: si no, «Voy a leer el pliego.» y «El pliego pide…» salen pegados.
        if (first && text && !/\n\s*$/.test(text)) say('\n\n')
        first = false
        say(t)
      })
      const msg = await stream.finalMessage()
      await logUsage({ clientId: ctx.clientId, route: 'tender/chat', model: CHAT_MODEL, usage: msg.usage, usedClientKey })
      // Los 5.x pueden declinar (stop_reason 'refusal', no tipado en el SDK 0.39): se dice y se para.
      if ((msg.stop_reason as string) === 'refusal') {
        say(`${text ? '\n\n' : ''}(No puedo ayudar con esa petición tal como está planteada. Reformúlala o pídeme otra cosa.)`)
        break
      }

      const toolUses = msg.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      if (msg.stop_reason === 'max_tokens') {
        // Una herramienta cortada a medias trae una entrada incompleta: no se ejecuta.
        const soloTexto = msg.content.filter((b) => b.type === 'text') as Anthropic.TextBlockParam[]
        if (soloTexto.length) nuevos.push({ role: 'assistant', content: soloTexto })
        say(`${text ? '\n\n' : ''}(La respuesta se ha cortado por su longitud. Dime «sigue» o pídemelo por partes.)`)
        break
      }
      const assistant: Anthropic.MessageParam = { role: 'assistant', content: msg.content as Anthropic.ContentBlockParam[] }
      conversation.push(assistant)
      nuevos.push(assistant)
      if (msg.stop_reason !== 'tool_use' || !toolUses.length) break

      const results: Anthropic.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        ctx.emit('tool', { name: tu.name, status: 'start', summary: toolLabel(tu.name) })
        const r = await executeTool(ctx, tu.name, tu.input)
        ctx.emit('tool', { name: tu.name, status: 'done', summary: r.summary, ok: !r.isError })
        tools.push({ name: tu.name, summary: r.summary, ok: !r.isError })
        if (r.doc) {
          const prev = documentos.find((d) => d.id === r.doc!.id)
          if (prev) Object.assign(prev, { titulo: r.doc.titulo, copia_id: prev.copia_id || r.doc.copia_id })
          else documentos.push(r.doc)
        }
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: r.content, ...(r.isError ? { is_error: true } : {}) })
      }
      const userTurn: Anthropic.MessageParam = { role: 'user', content: results }
      conversation.push(userTurn)
      nuevos.push(userTurn)
      if (turn === MAX_TURNS - 1) {
        say(`${text ? '\n\n' : ''}(He llegado al máximo de pasos por mensaje. Escríbeme «sigue» y continúo.)`)
      }
    }
    return { text, model: compactForStorage(nuevos), tools, documentos }
  } catch (err) {
    console.error('[tender/chat] el bucle falló', err)
    return { text, model: compactForStorage(nuevos), tools, documentos, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

