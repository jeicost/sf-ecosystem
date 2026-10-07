// Regresiones del asistente de licitaciones en modo conversación. Sin red, sin
// BD, gratis:
//   npx tsx evals/licitaciones/chat-check.ts
//
// Lo que se comprueba es lo que no puede fallar en silencio: que el modelo no
// pueda colar entradas mal formadas, que el historial guardado no crezca sin
// tope ni rompa la API al retomarlo, y la FRONTERA DE MARCA: las herramientas
// corren contra una BD falsa en memoria con filas de dos marcas, y se verifica
// que toda consulta lleva client_id = la marca del servidor.
import type Anthropic from '@anthropic-ai/sdk'
import {
  validateToolInput, chunkAttachment, capAttachment, compactForStorage, buildHistory, normalizeHistory,
  validateChatPost, autoTitle, nextAttachmentId, userContentForModel, stripInternal, sse,
  ATTACHMENT_CAP, CHUNK_DEFAULT, CHUNK_MAX, TOOL_RESULT_SAVE_CAP, MAX_TURNS, MAX_TOKENS_TURN, TOOL_DEFS,
  type ChatAttachment, type ChatMessage,
} from '../../lib/tenders/chat-core'
import { executeTool, sanearOferta, buildSystemPrompt, REGLAS_DESTILADAS, pliegoDeAdjuntos, type ChatContext, type ChatDeps } from '../../lib/tenders/chat'

let pass = 0, fail = 0
const check = (name: string, ok: boolean, detail?: unknown) => {
  if (ok) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 300)) }
}

const CLIENT = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

console.log('\nEntradas de las herramientas: lo mal formado vuelve como error, no se «arregla»')
check('leer_adjunto exige id aN', !validateToolInput('leer_adjunto', { id: 'pliego.pdf' }).ok)
check('leer_adjunto válido', validateToolInput('leer_adjunto', { id: 'a2', desde: 100 }).ok)
check('leer_adjunto: desde negativo se ignora', (() => { const r = validateToolInput('leer_adjunto', { id: 'a1', desde: -5 }); return r.ok && (r.value as { desde?: number }).desde === undefined })())
check('crear_documento sin secciones', !validateToolInput('crear_documento', { titulo: 'X', tipo: 'memoria', secciones: [] }).ok)
check('crear_documento con tipo inventado', !validateToolInput('crear_documento', { titulo: 'X', tipo: 'subido', secciones: [{ titulo: 'a', contenido: 'b' }] }).ok)
check('crear_documento con sección sin contenido', !validateToolInput('crear_documento', { titulo: 'X', tipo: 'anexo', secciones: [{ titulo: 'a' }] }).ok)
check('crear_documento con sección enorme', !validateToolInput('crear_documento', { titulo: 'X', tipo: 'anexo', secciones: [{ titulo: 'a', contenido: 'x'.repeat(40_001) }] }).ok)
check('crear_documento válido', validateToolInput('crear_documento', { titulo: 'X', tipo: 'oferta', secciones: [{ titulo: 'a', contenido: 'b', nota: 'n' }] }).ok)
check('editar_seccion: document_id no uuid', !validateToolInput('editar_seccion', { document_id: '123', indice: 0, contenido: 'x' }).ok)
check('editar_seccion: índice negativo', !validateToolInput('editar_seccion', { document_id: uuid(1), indice: -1, contenido: 'x' }).ok)
check('editar_seccion: índice decimal', !validateToolInput('editar_seccion', { document_id: uuid(1), indice: 1.5, contenido: 'x' }).ok)
check('editar_seccion: añadir sin título', !validateToolInput('editar_seccion', { document_id: uuid(1), indice: null, contenido: 'x' }).ok)
check('editar_seccion: añadir con título', validateToolInput('editar_seccion', { document_id: uuid(1), indice: null, titulo: 'Nueva', contenido: 'x' }).ok)
check('extraer_criterios: ids raros', !validateToolInput('extraer_criterios', { adjunto_ids: ['a1', '../x'] }).ok)
check('extraer_criterios: lista vacía', !validateToolInput('extraer_criterios', { adjunto_ids: [] }).ok)
check('extraer_criterios: duplicados fuera', (() => { const r = validateToolInput('extraer_criterios', { adjunto_ids: ['a1', 'a1', 'a2'] }); return r.ok && (r.value as { adjunto_ids: string[] }).adjunto_ids.length === 2 })())
check('generar_memoria_completa: base no uuid', !validateToolInput('generar_memoria_completa', { adjunto_ids: ['a1'], base_tender_id: 'UAM' }).ok)
check('recordar_leccion > 1000 se rechaza (no se trunca)', !validateToolInput('recordar_leccion', { texto: 'x '.repeat(600) }).ok)
check('asociar_expediente: null sin título', !validateToolInput('asociar_expediente', { tender_id: null }).ok)
check('asociar_expediente: null con título', validateToolInput('asociar_expediente', { tender_id: null, titulo: 'Exp nuevo' }).ok)
check('herramienta desconocida', !validateToolInput('borrar_todo', {}).ok)
check('toda herramienta definida tiene validador', TOOL_DEFS.every((t) => !String((validateToolInput(t.name, {}) as { error?: string }).error || '').startsWith('Herramienta desconocida')))
check('límites del bucle: 8 vueltas, ≤ 12000 tokens', MAX_TURNS === 8 && MAX_TOKENS_TURN <= 12000)

console.log('\nAdjuntos: troceo por caracteres y recorte avisado')
const big: ChatAttachment = { id: 'a1', filename: 'pcap.pdf', mime: 'application/pdf', chars: 150_000, text: 'x'.repeat(150_000) }
const c0 = chunkAttachment(big)
check('primer trozo por defecto', c0.desde === 0 && c0.hasta === CHUNK_DEFAULT && c0.siguiente === CHUNK_DEFAULT)
const cMax = chunkAttachment(big, 0, 1_000_000)
check('no se puede pedir más de CHUNK_MAX', cMax.hasta === CHUNK_MAX)
const cEnd = chunkAttachment(big, 140_000)
check('último trozo: siguiente = null', cEnd.hasta === 150_000 && cEnd.siguiente === null)
const cOver = chunkAttachment(big, 999_999)
check('desde fuera de rango no revienta', cOver.desde === 150_000 && cOver.texto === '' && cOver.siguiente === null)
const cInv = chunkAttachment(big, 5000, 100)
check('hasta < desde → trozo vacío, no al revés', cInv.desde === 5000 && cInv.hasta === 5000)
const cap = capAttachment('y'.repeat(ATTACHMENT_CAP + 10), 'enorme.pdf')
check('recorte a 200k con aviso para la persona', cap.text.length === ATTACHMENT_CAP && !!cap.aviso && cap.original === ATTACHMENT_CAP + 10)
check('sin recorte no hay aviso', capAttachment('corto', 'a.pdf').aviso === null)
check('ids de adjunto correlativos', nextAttachmentId([{ ...big, id: 'a1' }, { ...big, id: 'a7' }]) === 'a8' && nextAttachmentId([]) === 'a1')
const uc = userContentForModel('Hazme la sección 3', [big], [{ filename: 'roto.pdf', motivo: 'escaneo' }])
check('el modelo sabe qué adjunto no se pudo leer', uc.includes('a1') && uc.includes('roto.pdf') && uc.includes('No hagas como si lo tuvieras'))

console.log('\nHistorial guardado: tool_results a 2.000 y nada que rompa la API al retomar')
const largo = 'p'.repeat(30_000)
const turno: Anthropic.MessageParam[] = [
  { role: 'assistant', content: [{ type: 'text', text: 'Leo el pliego.' }, { type: 'tool_use', id: 't1', name: 'leer_adjunto', input: { id: 'a1' } }] },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: largo }] },
  { role: 'assistant', content: [{ type: 'text', text: '' }, { type: 'tool_use', id: 't2', name: 'crear_documento', input: { titulo: 'M', tipo: 'memoria', secciones: [{ titulo: 's', contenido: largo }] } }] },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't2', content: '{"ok":true}' }] },
  { role: 'assistant', content: [{ type: 'text', text: 'Hecho.' }] },
]
const comp = compactForStorage(turno)
const tr = (comp[1].content as Anthropic.ToolResultBlockParam[])[0]
check('tool_result recortado a ~2.000', typeof tr.content === 'string' && tr.content.length < TOOL_RESULT_SAVE_CAP + 200 && tr.content.includes('recortado al guardar'))
const tu2 = (comp[2].content as Anthropic.ContentBlockParam[]).find((b) => b.type === 'tool_use') as Anthropic.ToolUseBlockParam
check('entrada larga de herramienta recortada', JSON.stringify(tu2.input).length < 3000)
check('bloque de texto vacío eliminado', (comp[2].content as Anthropic.ContentBlockParam[]).every((b) => b.type !== 'text'))
check('el guardado pesa < 10 KB (antes ~60 KB)', JSON.stringify(comp).length < 10_000, JSON.stringify(comp).length)

const msgs = (extra: Partial<ChatMessage>[] = []): ChatMessage[] => extra.map((e, n) => ({ id: String(n), role: 'user', content: '', at: '', ...e }) as ChatMessage)
const conv = msgs([
  { role: 'user', content: 'hola', _model: [{ role: 'user', content: 'hola' }] },
  { role: 'assistant', content: 'Leo el pliego.', _model: comp },
  { role: 'user', content: 'sigue', _model: [{ role: 'user', content: 'sigue' }] },
])
const { history } = buildHistory(conv)
check('el historial empieza por la persona y alterna roles', history[0].role === 'user' && history.every((m, k) => k === 0 || m.role !== history[k - 1].role))
check('el historial conserva los pares tool_use/tool_result', JSON.stringify(history).includes('"t1"') && JSON.stringify(history).includes('"tool_use_id":"t1"'))
// Caída a mitad: assistant con tool_use sin resultado, y luego otro mensaje de la persona.
const caido = normalizeHistory([
  { role: 'user', content: 'genera' },
  { role: 'assistant', content: [{ type: 'text', text: 'Voy.' }, { type: 'tool_use', id: 'zz', name: 'generar_memoria_completa', input: {} }] },
  { role: 'user', content: '¿sigues?' },
])
check('tool_use huérfano eliminado (la API daría 400)', !JSON.stringify(caido).includes('"zz"') && caido.length === 3)
const huerfanoResult = normalizeHistory([
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'perdido', content: 'x' }] },
  { role: 'user', content: 'hola' },
])
check('tool_result sin su tool_use eliminado', !JSON.stringify(huerfanoResult).includes('perdido') && huerfanoResult.length === 1)
const dosUsuarios = normalizeHistory([{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }])
check('dos mensajes seguidos de la persona se funden', dosUsuarios.length === 1)
const muchos = msgs(Array.from({ length: 40 }, (_, k) => ({ role: (k % 2 ? 'assistant' : 'user') as 'user' | 'assistant', content: 'z'.repeat(10_000) })))
const recortado = buildHistory(muchos, 50_000)
check('historial por encima del presupuesto olvida lo más antiguo', recortado.olvidados > 0 && recortado.history[0].role === 'user' && JSON.stringify(recortado.history).length < 70_000)
check('stripInternal quita _model', !('_model' in stripInternal(conv[1])))
check('SSE bien formado', sse('delta', { text: 'a' }) === 'event: delta\ndata: {"text":"a"}\n\n')

console.log('\nCuerpo del POST')
check('sin mensaje ni adjuntos → 400', !validateChatPost({}).ok)
check('chatId no uuid → 400', !validateChatPost({ chatId: 'x', message: 'hola' }).ok)
check('adjunto sin path → 400', !validateChatPost({ message: 'hola', attachments: [{ filename: 'a.pdf' }] }).ok)
check('9 adjuntos → 400', !validateChatPost({ message: 'h', attachments: Array.from({ length: 9 }, () => ({ path: 'p' })) }).ok)
check('solo adjunto, sin texto, vale', validateChatPost({ attachments: [{ path: `tenders/${CLIENT}/x.pdf`, filename: 'x.pdf' }] }).ok)
check('título automático corto', autoTitle('Necesito la memoria técnica para el contrato de mensajería del Ayuntamiento con lotes') .length <= 62)
check('título desde el adjunto si no hay texto', autoTitle('', ['PCAP mensajería.pdf']) === 'PCAP mensajería')

console.log('\nOferta: ni un importe')
const so = sanearOferta(`Tarifa urgente 1.250,00 € por envío, descuento del 15 %.\n${'Servicio con cobertura nacional y seguimiento en tiempo real. '.repeat(3)}Compromiso de calidad: 99,5 % de entregas a tiempo.`)
check('importe sustituido', so.texto.includes('[FALTA: tarifa]') && !so.texto.includes('1.250'))
check('descuento sustituido, KPI no', so.texto.includes('[FALTA: descuento]') && so.texto.includes('99,5 %'))

console.log('\nPrompt: reglas destiladas presentes')
const sp = buildSystemPrompt({ brandName: 'Marca Ejemplo', brainBlock: 'BRAIN', teachingText: 'LECCIONES — 1. x' })
check('27 reglas destiladas en el prompt', REGLAS_DESTILADAS.length === 27 && sp.includes('27. ') && sp.includes('separación de sobres'))
check('el prompt lleva enseñanza, brain y contrato', sp.includes('LECCIONES') && sp.includes('BRAIN') && sp.includes('GROUNDING'))
check('precios prohibidos en las reglas', REGLAS_DESTILADAS.some((r) => /precios/i.test(r)))

// ─── Frontera de marca con una BD falsa ─────────────────────────────────────

type Row = Record<string, unknown>
interface Call { table: string; op: 'select' | 'insert' | 'update' | 'delete'; eqs: Array<[string, unknown]>; payload?: Row }
const calls: Call[] = []
const store: Record<string, Row[]> = {
  tender_documents: [
    { id: uuid(1), client_id: CLIENT, tender_id: null, kind: 'memoria', title: 'Memoria propia', status: 'borrador', sections: [{ titulo: 'Intro', contenido: 'Texto original' }, { titulo: 'Medios', contenido: 'Medios' }] },
    { id: uuid(2), client_id: OTHER, tender_id: null, kind: 'memoria', title: 'Memoria AJENA', status: 'borrador', sections: [{ titulo: 'Secreto', contenido: 'de otra marca' }] },
    { id: uuid(3), client_id: CLIENT, tender_id: null, kind: 'oferta', title: 'Oferta', status: 'borrador', sections: [{ titulo: 'Tarifas', contenido: '' }] },
  ],
  tenders: [
    { id: uuid(10), client_id: CLIENT, title: 'Memoria Universidad Ejemplar', organo: 'Universidad Ejemplar', status: 'presentada', updated_at: '2025-05-01', memoria: { titulo: 'Memoria Universidad Ejemplar', secciones: [{ titulo: 'Servicio para Ejemplar', contenido: 'La Universidad Ejemplar recibirá…' }] } },
    { id: uuid(11), client_id: OTHER, title: 'Expediente ajeno', organo: 'Otro', status: 'ganada', updated_at: '2025-01-01', memoria: { secciones: [{ titulo: 'x', contenido: 'y' }] } },
  ],
  tender_chats: [{ id: uuid(20), client_id: CLIENT, tender_id: null }],
}
let seq = 100
function fakeDb() {
  const builder = (table: string) => {
    const call: Call = { table, op: 'select', eqs: [] }
    const filters: Array<(r: Row) => boolean> = []
    let single = false
    const exec = () => {
      calls.push(call)
      const rows = store[table] || []
      if (call.op === 'insert') {
        const row = { id: uuid(seq++), ...call.payload }
        rows.push(row)
        return { data: single ? row : [row], error: null }
      }
      const hit = rows.filter((r) => filters.every((f) => f(r)))
      if (call.op === 'update') hit.forEach((r) => Object.assign(r, call.payload))
      if (call.op === 'delete') store[table] = rows.filter((r) => !hit.includes(r))
      return { data: single ? hit[0] ?? null : hit, error: null }
    }
    const b: Record<string, unknown> = {
      select: () => b,
      insert: (p: Row) => { call.op = 'insert'; call.payload = p; return b },
      update: (p: Row) => { call.op = 'update'; call.payload = p; return b },
      delete: () => { call.op = 'delete'; return b },
      eq: (k: string, v: unknown) => { call.eqs.push([k, v]); filters.push((r) => r[k] === v); return b },
      in: (k: string, vs: unknown[]) => { filters.push((r) => vs.includes(r[k])); return b },
      not: (k: string) => { filters.push((r) => r[k] !== null && r[k] !== undefined); return b },
      ilike: () => b, order: () => b, limit: () => b,
      maybeSingle: () => { single = true; return Promise.resolve(exec()) },
      single: () => { single = true; return Promise.resolve(exec()) },
      then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(exec()).then(res, rej),
    }
    return b
  }
  return { from: builder } as never
}

const events: Array<[string, unknown]> = []
const deps: ChatDeps = {
  knowledge: async () => 'CORPUS',
  extractCriteria: async () => ({ total_points: 100, criteria: [{ group: 'juicio_valor', name: 'Plan', points: 40 }], data_gaps: [] }),
  generateMemoria: async () => ({ titulo: 'Memoria nueva', secciones: [{ titulo: 'Plan', contenido: 'texto', datos_a_confirmar: ['flota'] }], data_gaps: [] }),
  loadTenderTeaching: async () => ({ instructions: null, baseTenderId: null }),
  addLesson: async (i) => ({ id: 'l1', text: i.text, source: i.source, created_at: '' }),
}
const ctx: ChatContext = {
  clientId: CLIENT, userId: uuid(99), chatId: uuid(20), chatTitle: 'Chat', tenderId: null,
  attachments: [{ id: 'a1', filename: 'pcap.pdf', mime: 'application/pdf', chars: 1000, text: 'Pliego del Ayuntamiento de Prueba. '.repeat(30) }],
  brandName: 'Marca Ejemplo', disenadas: [], backedUp: new Set(), createdNow: new Set(), startedAt: Date.now(),
  emit: (e, d) => events.push([e, d]), db: fakeDb(), deps,
}

async function frontera() {
  console.log('\nFrontera de marca: herramientas contra una BD con dos marcas')
  const ajeno = await executeTool(ctx, 'leer_documento', { document_id: uuid(2) })
  check('leer un documento de OTRA marca → no existe', ajeno.isError && !ajeno.content.includes('Secreto'))
  const propio = await executeTool(ctx, 'leer_documento', { document_id: uuid(1) })
  check('leer uno propio funciona', !propio.isError && propio.content.includes('Texto original'))

  const ed1 = await executeTool(ctx, 'editar_seccion', { document_id: uuid(1), indice: 0, contenido: 'Texto nuevo' })
  const copias = store.tender_documents.filter((d) => String(d.title).includes('previous version'))
  check('primera edición: copia «— previous version» antes de tocar', !ed1.isError && copias.length === 1 && JSON.stringify(copias[0].sections).includes('Texto original'))
  check('la copia es de la marca del servidor', copias[0]?.client_id === CLIENT)
  await executeTool(ctx, 'editar_seccion', { document_id: uuid(1), indice: 1, contenido: 'Medios nuevos' })
  check('segunda edición en la misma conversación: sin otra copia', store.tender_documents.filter((d) => String(d.title).includes('previous version')).length === 1)
  check('el documento queda editado', JSON.stringify(store.tender_documents[0].sections).includes('Texto nuevo'))
  const fuera = await executeTool(ctx, 'editar_seccion', { document_id: uuid(1), indice: 9, contenido: 'x' })
  check('índice fuera de rango → error', fuera.isError)
  const edAjeno = await executeTool(ctx, 'editar_seccion', { document_id: uuid(2), indice: 0, contenido: 'pisado' })
  check('editar un documento ajeno → no existe y no se toca', edAjeno.isError && JSON.stringify(store.tender_documents[1].sections).includes('de otra marca'))
  await executeTool(ctx, 'editar_seccion', { document_id: uuid(3), indice: 0, contenido: 'Envío urgente: 12,50 € por bulto' })
  check('editar una oferta sanea importes', JSON.stringify(store.tender_documents[2].sections).includes('[FALTA: tarifa]'))

  const cr = await executeTool(ctx, 'crear_documento', { titulo: 'Propuesta', tipo: 'oferta', secciones: [{ titulo: 'Tarifas', contenido: 'Paquete 5 kg: 7 euros' }] })
  const nuevo = store.tender_documents[store.tender_documents.length - 1]
  check('crear_documento: client_id del servidor y borrador', !cr.isError && nuevo.client_id === CLIENT && nuevo.status === 'borrador' && nuevo.kind === 'oferta')
  check('crear_documento oferta: sin importes', !JSON.stringify(nuevo.sections).includes('7 euros'))
  check('evento document para la pantalla', events.some(([e, d]) => e === 'document' && (d as { id: string }).id === nuevo.id))
  const ed3 = await executeTool(ctx, 'editar_seccion', { document_id: String(nuevo.id), indice: 0, contenido: 'otra' })
  check('editar lo recién creado en esta petición no duplica copia', !ed3.isError && !JSON.stringify(ed3.content).includes('"copia_version_anterior":"0'))

  const mp = await executeTool(ctx, 'leer_memoria_pasada', { tender_id: uuid(10), seccion: 0 })
  check('memoria pasada: órgano anterior enmascarado', !mp.isError && !mp.content.includes('Ejemplar') && mp.content.includes('ÓRGANO ANTERIOR'))
  const mpAjena = await executeTool(ctx, 'leer_memoria_pasada', { tender_id: uuid(11) })
  check('memoria pasada de OTRA marca → no existe', mpAjena.isError)
  const lista = await executeTool(ctx, 'listar_memorias_pasadas', {})
  check('la lista no trae memorias de otra marca', !lista.content.includes(uuid(11)) && lista.content.includes(uuid(10)))

  const asocAjeno = await executeTool(ctx, 'asociar_expediente', { tender_id: uuid(11) })
  check('asociar un expediente ajeno → no existe', asocAjeno.isError && ctx.tenderId === null)
  const asocNuevo = await executeTool(ctx, 'asociar_expediente', { tender_id: null, titulo: 'Mensajería Ayuntamiento de Prueba' })
  const creado = store.tenders[store.tenders.length - 1]
  check('crear expediente: de esta marca y ligado al chat', !asocNuevo.isError && creado.client_id === CLIENT && ctx.tenderId === creado.id && store.tender_chats[0].tender_id === creado.id)

  const crit = await executeTool(ctx, 'extraer_criterios', { adjunto_ids: ['a1'] })
  check('criterios guardados en el expediente asociado', !crit.isError && !!creado.criteria && typeof creado.pliego_text === 'string')
  const critMal = await executeTool(ctx, 'extraer_criterios', { adjunto_ids: ['a9'] })
  check('criterios de un adjunto inexistente → error', critMal.isError)

  const wd = await executeTool(ctx, 'exportar_word', { document_id: uuid(1) })
  check('exportar_word devuelve la acción y emite download', wd.content.includes('"action":"download"') && events.some(([e]) => e === 'download'))
  const wdAjeno = await executeTool(ctx, 'exportar_word', { document_id: uuid(2) })
  check('exportar_word de otra marca → error, sin download', wdAjeno.isError && events.filter(([e]) => e === 'download').length === 1)

  const gm = await executeTool(ctx, 'generar_memoria_completa', { adjunto_ids: ['a1'] })
  const docMem = store.tender_documents[store.tender_documents.length - 1]
  check('memoria completa: documento creado con la nota de datos a confirmar', !gm.isError && docMem.kind === 'memoria' && JSON.stringify(docMem.sections).includes('Por confirmar: flota'))
  check('memoria completa: se guarda en el expediente sin memoria', !!creado.memoria)
  const tarde = await executeTool({ ...ctx, startedAt: Date.now() - 120_000 }, 'generar_memoria_completa', { adjunto_ids: ['a1'] })
  check('memoria completa con poco tiempo restante → se rechaza antes de empezar', tarde.isError)

  const lec = await executeTool(ctx, 'recordar_leccion', { texto: 'Nunca prometas reuniones mensuales.' })
  check('lección guardada', !lec.isError)

  // La comprobación de fondo: TODA consulta a tablas de la marca lleva el
  // client_id del servidor, y ninguna lleva otro; toda inserción, también.
  const marcadas = calls.filter((c) => ['tenders', 'tender_documents', 'tender_chats'].includes(c.table))
  const sinFrontera = marcadas.filter((c) => c.op === 'insert' ? c.payload?.client_id !== CLIENT : !c.eqs.some(([k, v]) => k === 'client_id' && v === CLIENT))
  check(`toda consulta lleva client_id del servidor (${marcadas.length} consultas)`, sinFrontera.length === 0, sinFrontera)
  check('ninguna consulta usa otra marca', !calls.some((c) => c.eqs.some(([k, v]) => k === 'client_id' && v !== CLIENT)))
  check('pliegoDeAdjuntos señala los que faltan', pliegoDeAdjuntos(ctx, ['a1', 'a5']).faltan.join() === 'a5')
}

frontera().then(() => {
  console.log(`\n${pass} ok · ${fail} fallos\n`)
  process.exit(fail ? 1 : 0)
})
