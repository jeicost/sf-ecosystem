/**
 * Direcline / DL-Nexus (Ideasys): volcado de partes de Email Ops al programa
 * operativo por su web service SOAP «WsUtilidades» (13-oct-2026).
 *
 * Documentación: «Documentacion WebServiceUtilidades.pdf» v1.2 (22-01-2026).
 *   · ValidarUsuario(Nombre, Password) → GUID de sesión (XML).
 *   · GuardarExpedicion(Valor) / GrabarExpedicionSolicitud(Valor): el XML
 *     entero va como texto en el parámetro Valor (CDATA), con el GUID dentro.
 *   · ObtenerEstructuraXML(NombreMetodo): la estructura que espera un método.
 *   · ObtenerExpedicionPorNumero(GUID, Numero): estado de una expedición.
 *   · Errores: <Metodo><ERROR><CODIGO/><MENSAJE/></ERROR></Metodo>.
 *
 * Lo que se graba sale del PARTE (fields del esquema de Email Ops) y de la
 * configuración de la marca (códigos del programa: tipo de servicio, contenido
 * del bulto, cliente, mensajero, vía). MIRA no se inventa códigos: si falta uno,
 * la pantalla lo pide antes de enviar. Por defecto la expedición se deja
 * «pendiente de validar» (ForzarPendienteValidar) para que la oficina la revise.
 *
 * Las funciones puras (dirección, XML, parseo) se prueban en evals/tms/pure.ts.
 */

import { createHash } from 'node:crypto'
import type { FieldValue } from '@/lib/email-ops/schema'

// ─── Configuración por marca ──────────────────────────────────────

export interface DireclineConfig {
  /** Código de cliente en el programa (el que factura). */
  codigo_cliente: string
  departamento_cliente?: string
  /** Código de tipo de servicio por tipo de entrega del parte (local/nacional/internacional) y, opcionalmente, por vehículo. */
  tipo_servicio: Record<string, string>
  /** Contenido de bulto por defecto (código del programa). */
  contenido_bulto: string
  pais: string
  codigo_mensajero_recogida?: string
  codigo_mensajero_entrega?: string
  /** Método: 'solicitud' (GrabarExpedicionSolicitud) o 'expedicion' (GuardarExpedicion). */
  metodo: 'solicitud' | 'expedicion'
  /** Dejar la expedición pendiente de validar en el programa (recomendado al empezar). */
  forzar_pendiente_validar: boolean
  no_transmitir_via: boolean
  /** Hora de recogida por defecto cuando el parte no la trae. */
  hora_inicio_defecto: string
  hora_fin_defecto: string
  /** Aviso por email al destinatario (suma lógica de estados). 0 = ninguno. */
  entrega_aviso_email: number
}

export const CONFIG_DEFECTO: DireclineConfig = {
  codigo_cliente: '',
  departamento_cliente: '',
  tipo_servicio: { local: '', nacional: '', internacional: '' },
  contenido_bulto: '',
  pais: 'ESPAÑA',
  codigo_mensajero_recogida: '',
  codigo_mensajero_entrega: '',
  metodo: 'solicitud',
  forzar_pendiente_validar: true,
  no_transmitir_via: false,
  hora_inicio_defecto: '09:00',
  hora_fin_defecto: '18:00',
  entrega_aviso_email: 0,
}

export function normalizarConfig(raw: unknown): DireclineConfig {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const str = (v: unknown, d = '') => (typeof v === 'string' ? v.trim() : d)
  const ts = (r.tipo_servicio && typeof r.tipo_servicio === 'object' ? r.tipo_servicio : {}) as Record<string, unknown>
  return {
    codigo_cliente: str(r.codigo_cliente),
    departamento_cliente: str(r.departamento_cliente),
    tipo_servicio: Object.fromEntries(Object.entries({ ...CONFIG_DEFECTO.tipo_servicio, ...ts }).map(([k, v]) => [k.toLowerCase(), str(v)])),
    contenido_bulto: str(r.contenido_bulto),
    pais: str(r.pais, CONFIG_DEFECTO.pais) || CONFIG_DEFECTO.pais,
    codigo_mensajero_recogida: str(r.codigo_mensajero_recogida),
    codigo_mensajero_entrega: str(r.codigo_mensajero_entrega),
    metodo: r.metodo === 'expedicion' ? 'expedicion' : 'solicitud',
    forzar_pendiente_validar: r.forzar_pendiente_validar !== false,
    no_transmitir_via: r.no_transmitir_via === true,
    hora_inicio_defecto: /^\d{2}:\d{2}$/.test(str(r.hora_inicio_defecto)) ? str(r.hora_inicio_defecto) : CONFIG_DEFECTO.hora_inicio_defecto,
    hora_fin_defecto: /^\d{2}:\d{2}$/.test(str(r.hora_fin_defecto)) ? str(r.hora_fin_defecto) : CONFIG_DEFECTO.hora_fin_defecto,
    entrega_aviso_email: Number.isFinite(Number(r.entrega_aviso_email)) ? Number(r.entrega_aviso_email) : 0,
  }
}

// ─── Direcciones (puro) ───────────────────────────────────────────

export interface DireccionPartes {
  tipo: string
  direccion: string
  numero: string
  piso: string
  cp: string
  poblacion: string
  /** Lo que no se ha sabido colocar (nombre de edificio, empresa…), para «más datos». */
  resto: string
}

const TIPOS_VIA: Array<[RegExp, string]> = [
  // Alternativas largas primero y con límite: «Pl.» no puede comerse «Plaza» ni «Av.» a «Avenida».
  [/^(?:calle\b|c\/|c\.(?=\s))\s*/i, 'c/'],
  [/^(?:avenida\b|avda\.?(?=\s)|avd\.?(?=\s)|av\.?(?=\s))\s*/i, 'Avd.'],
  [/^(?:plaza\b|pza\.?(?=\s)|pl\.?(?=\s))\s*/i, 'Pl.'],
  [/^(?:paseo\b|p[ºo]\.?(?=\s))\s*/i, 'Pº'],
  [/^(?:carretera\b|ctra\.?(?=\s))\s*/i, 'Ctra.'],
  [/^(?:camino\b|cmno\.?(?=\s))\s*/i, 'Cmno.'],
  [/^(?:ronda\b|rda\.?(?=\s))\s*/i, 'Rda.'],
  [/^(?:glorieta\b|gta\.?(?=\s))\s*/i, 'Gta.'],
  [/^(?:traves[ií]a\b|trav\.?(?=\s))\s*/i, 'Trav.'],
  [/^(?:pol[ií]gono\b|pol\.?(?=\s)|p\.i\.(?=\s))\s*/i, 'Pol.'],
  [/^(?:urbanizaci[oó]n\b|urb\.?(?=\s))\s*/i, 'Urb.'],
]

/**
 * Parte una dirección escrita como la trae el parte («Museoteca, c/ José
 * Echegaray 12, Nave 2-3, PAE Casa Blanca, 28100 Alcobendas (Madrid)») en los
 * campos que pide el programa. Heurístico y conservador: lo que no reconoce
 * va a «resto» para que la persona lo coloque.
 */
export function partirDireccion(texto: string | null | undefined): DireccionPartes {
  const out: DireccionPartes = { tipo: '', direccion: '', numero: '', piso: '', cp: '', poblacion: '', resto: '' }
  let s = String(texto || '').replace(/\s+/g, ' ').trim()
  if (!s) return out
  // Código postal + población: «28100 Alcobendas (Madrid)» / «28037 Madrid» / «Madrid 28037»
  const cpPob = /\b(\d{5})\s*[,-]?\s*([A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-zÁÉÍÓÚÑáéíóúñ .'-]{1,40}?)(?:\s*\(([^)]+)\))?\s*$/.exec(s)
  if (cpPob) {
    out.cp = cpPob[1]; out.poblacion = cpPob[2].trim().replace(/[,.]+$/, '')
    s = s.slice(0, cpPob.index).trim().replace(/[,;]+$/, '')
  } else {
    const pobCp = /^(.*?)[,;]\s*([A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-zÁÉÍÓÚÑáéíóúñ .'-]{1,40}?)\s+(\d{5})\s*$/.exec(s)
    if (pobCp) { out.cp = pobCp[3]; out.poblacion = pobCp[2].trim(); s = pobCp[1].trim() }
    else {
      const soloCp = /\b(\d{5})\b/.exec(s)
      if (soloCp) { out.cp = soloCp[1]; s = (s.slice(0, soloCp.index) + s.slice(soloCp.index + 5)).replace(/\s+/g, ' ').replace(/[,;]\s*[,;]/g, ',').trim().replace(/[,;]+$/, '') }
    }
  }
  // Trozos separados por comas. «Bravo Murillo, 38 3ºB»: el número va en su
  // propio trozo; se pega al trozo anterior (texto sin dígitos) para no tomar
  // «38 3ºB» por el nombre de la calle.
  const crudos = s.split(/\s*[,;]\s*/).filter(Boolean)
  const trozos: string[] = []
  for (const t of crudos) {
    const prev = trozos[trozos.length - 1]
    if (prev && /^\d{1,4}\b/.test(t) && !/\d/.test(prev) && !/^(nave|planta|piso|local|puerta|esc\.?|escalera|bajo)/i.test(prev)) trozos[trozos.length - 1] = `${prev} ${t}`
    else trozos.push(t)
  }
  let idxVia = trozos.findIndex((t) => TIPOS_VIA.some(([re]) => re.test(t)))
  if (idxVia < 0) idxVia = trozos.findIndex((t) => /\d/.test(t))
  if (idxVia < 0) idxVia = 0
  let via = trozos[idxVia] || ''
  const resto: string[] = trozos.filter((_, i) => i !== idxVia)
  for (const [re, tipo] of TIPOS_VIA) { if (re.test(via)) { out.tipo = tipo; via = via.replace(re, '').trim(); break } }
  // «José Echegaray 12» / «Bravo Murillo, 38 3ºB» / «Gran Vía 28 - 2º» → número y piso
  const num = /^(.*?)[\s,]+(?:n[ºo.]?\s*)?(\d{1,4}\s?(?:bis|[A-Z])?)\b\s*[-,]?\s*(.*)$/i.exec(via)
  if (num && num[1].trim()) { out.direccion = num[1].trim(); out.numero = num[2].trim(); if (num[3].trim()) out.piso = num[3].trim() }
  else out.direccion = via.trim()
  // Piso/puerta en el resto («Nave 2-3», «3º izda», «Planta 2»)
  const pisoIdx = resto.findIndex((t) => /^(nave|planta|piso|local|puerta|esc\.?|escalera|bajo|\d+\s*[ºo°ª])/i.test(t))
  if (pisoIdx >= 0 && !out.piso) { out.piso = resto[pisoIdx]; resto.splice(pisoIdx, 1) }
  out.resto = resto.join(', ')
  return out
}

// ─── Mapeo del parte → expedición ─────────────────────────────────

export interface TicketParaTms {
  id: string
  subject?: string | null
  summary?: string | null
  from_address?: string | null
  original_sender?: string | null
  fields: Record<string, FieldValue>
}

export interface Expedicion {
  referenciaEntrega: string
  recogidaReferencia: string
  remitente: string
  recogida: DireccionPartes & { telefono: string; email: string; observacion: string }
  destinatario: string
  entrega: DireccionPartes & { telefono: string; email: string; observacion: string }
  tipoServicio: string
  fecha: string          // YYYY-MM-DD
  horaInicial: string    // HH:MM:SS
  horaFinal: string
  bultos: number
  pesoKg: number
  contenido: string
  observaciones: string
  retorno: boolean
  codigoCliente: string
  departamentoCliente: string
  mensajeroRecogida: string
  mensajeroEntrega: string
  forzarPendienteValidar: boolean
  noTransmitirVia: boolean
  entregaAvisoEmail: number
}

const s = (v: FieldValue | undefined | null) => (v === null || v === undefined ? '' : String(v).trim())
const hhmmss = (v: string, defecto: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(v.trim())
  const h = m ? `${m[1].padStart(2, '0')}:${m[2]}` : defecto
  return `${h}:00`
}

/** Código de tipo de servicio: primero por vehículo (si hay mapeo), luego por tipo de entrega. */
export function tipoServicioPara(fields: Record<string, FieldValue>, config: DireclineConfig): string {
  const veh = s(fields.tipo_vehiculo).toLowerCase()
  const entrega = s(fields.tipo_entrega).toLowerCase()
  const serv = s(fields.servicio).toLowerCase()
  for (const k of [serv, veh, `${entrega}:${veh}`, entrega]) {
    if (k && config.tipo_servicio[k]) return config.tipo_servicio[k]
  }
  return ''
}

/** Del parte a la expedición, con la configuración de la marca y lo que la persona corrija (overrides). */
export function expedicionDesdeParte(ticket: TicketParaTms, config: DireclineConfig, overrides: Partial<Expedicion> = {}): Expedicion {
  const f = ticket.fields || {}
  const rec = partirDireccion(s(f.recogida_direccion))
  const ent = partirDireccion(s(f.entrega_direccion))
  const emailRemitente = (ticket.original_sender && /[^\s<]+@[^\s>]+/.exec(ticket.original_sender)?.[0]) || ticket.from_address || ''
  const observaciones = [s(f.observaciones), s(f.medidas) ? `Medidas: ${s(f.medidas)}` : '', s(f.portes) ? `Portes ${s(f.portes)}` : '']
    .filter(Boolean).join(' · ').slice(0, 180)
  const base: Expedicion = {
    referenciaEntrega: '',
    recogidaReferencia: `MIRA-${ticket.id.slice(0, 8)}`,
    remitente: s(f.remitente).slice(0, 50),
    recogida: { ...rec, telefono: '', email: emailRemitente.slice(0, 120), observacion: '' },
    destinatario: s(f.destinatario).slice(0, 50),
    entrega: { ...ent, telefono: '', email: '', observacion: '' },
    tipoServicio: tipoServicioPara(f, config),
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(s(f.fecha)) ? s(f.fecha) : '',
    horaInicial: hhmmss(s(f.recogida_hora_inicio), config.hora_inicio_defecto),
    horaFinal: hhmmss(s(f.recogida_hora_fin), config.hora_fin_defecto),
    bultos: Math.max(1, Math.round(Number(f.bultos) || 1)),
    pesoKg: Number(f.peso_kg) > 0 ? Number(f.peso_kg) : 0,
    contenido: config.contenido_bulto,
    observaciones,
    retorno: false,
    codigoCliente: config.codigo_cliente,
    departamentoCliente: config.departamento_cliente || '',
    mensajeroRecogida: config.codigo_mensajero_recogida || '',
    mensajeroEntrega: config.codigo_mensajero_entrega || '',
    forzarPendienteValidar: config.forzar_pendiente_validar,
    noTransmitirVia: config.no_transmitir_via,
    entregaAvisoEmail: config.entrega_aviso_email,
  }
  return { ...base, ...overrides, recogida: { ...base.recogida, ...(overrides.recogida || {}) }, entrega: { ...base.entrega, ...(overrides.entrega || {}) } }
}

/** Campos sin los que el programa rechaza la expedición, con etiqueta legible. */
export function faltanParaGrabar(e: Expedicion): Array<{ campo: string; etiqueta: string }> {
  const out: Array<{ campo: string; etiqueta: string }> = []
  const req: Array<[boolean, string, string]> = [
    [!e.codigoCliente, 'codigoCliente', 'Código de cliente en el programa'],
    [!e.tipoServicio, 'tipoServicio', 'Código de tipo de servicio'],
    [!e.contenido, 'contenido', 'Código de contenido del bulto'],
    [!e.remitente, 'remitente', 'Remitente'],
    [!e.recogida.direccion, 'recogida.direccion', 'Dirección de recogida'],
    [!e.recogida.cp, 'recogida.cp', 'Código postal de recogida'],
    [!e.recogida.poblacion, 'recogida.poblacion', 'Población de recogida'],
    [!e.destinatario, 'destinatario', 'Destinatario'],
    [!e.entrega.direccion, 'entrega.direccion', 'Dirección de entrega'],
    [!e.entrega.cp, 'entrega.cp', 'Código postal de entrega'],
    [!e.entrega.poblacion, 'entrega.poblacion', 'Población de entrega'],
    [!e.fecha, 'fecha', 'Fecha de recogida'],
    [!(e.bultos >= 1), 'bultos', 'Número de bultos'],
  ]
  for (const [falta, campo, etiqueta] of req) if (falta) out.push({ campo, etiqueta })
  return out
}

// ─── XML (puro) ───────────────────────────────────────────────────

export function xmlEscape(v: string | number | boolean): string {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
const n = (tag: string, v: string | number | boolean) => `<${tag}>${xmlEscape(v)}</${tag}>`

/**
 * XML del método GrabarExpedicionSolicitud (opción 1 u 2 según la oficina)
 * o GuardarExpedicion. Todos los nodos van, vacíos si no aplican, como exige
 * el servicio. El GUID se añade al enviar (no se guarda en la auditoría).
 */
export function construirXmlExpedicion(e: Expedicion, metodo: DireclineConfig['metodo'], guid = '{GUID}'): string {
  // Direcline (13-oct-2026): el país acepta el nombre o el código de dos letras
  // («ESPAÑA» y «ES» valen). Los envíos internacionales no pasan por aquí: el
  // tipo de servicio no tiene mapeo y la persona los graba a mano.
  const pais = 'ESPAÑA'
  const bulto = `<bulto>${n('numero', 1)}${n('alto', 0)}${n('ancho', 0)}${n('largo', 0)}${n('peso', e.pesoKg)}${n('codigoContenido', e.contenido)}${n('observacion', '')}${n('referencia', '')}</bulto>`
  const comunes = [
    n('remitente', e.remitente), n('recogidaReferencia', e.recogidaReferencia),
    n('recogidaDireccion', e.recogida.direccion), n('recogidaTipoDireccion', e.recogida.tipo), n('recogidaNumeroDireccion', e.recogida.numero),
    n('recogidaCodigoPostal', e.recogida.cp), n('recogidaPais', pais), n('recogidaPoblacion', e.recogida.poblacion), n('recogidaPisoDireccion', e.recogida.piso),
    n('recogidaNombre2', ''), n('recogidaMasDatos', e.recogida.resto.slice(0, 50)), n('recogidaTelefono', e.recogida.telefono), n('recogidaEmail', e.recogida.email),
    n('recogidaObservacion', e.recogida.observacion.slice(0, 180)), n('recogidaMovil', ''), n('recogidaNif', ''),
    n('recogidaAvisoEmail', 0), n('recogidaAvisoSms', 0), n('recogidaCodigoTipoServicio', e.tipoServicio), n('recogidaGestion', false),
    n('recogidaFecha', e.fecha), n('recogidaHoraInicial', e.horaInicial), n('recogidaHoraFinal', e.horaFinal), n('recogerCliente', false),
    n('destinatario', e.destinatario),
    n('entregaDireccion', e.entrega.direccion), n('entregaTipoDireccion', e.entrega.tipo), n('entregaNumeroDireccion', e.entrega.numero),
    n('entregaCodigoPostal', e.entrega.cp), n('entregaPais', pais), n('entregaPoblacion', e.entrega.poblacion), n('entregaPisoDireccion', e.entrega.piso),
    n('entregaNombre2', ''), n('entregaMasDatos', e.entrega.resto.slice(0, 50)), n('entregaTelefono', e.entrega.telefono), n('entregaEmail', e.entrega.email),
    n('entregaObservacion', (e.entrega.observacion || e.observaciones).slice(0, 180)), n('entregaMovil', ''), n('entregaNif', ''),
    n('entregaAvisoEmail', e.entregaAvisoEmail), n('entregaAvisoSms', 0),
  ]
  if (metodo === 'expedicion') {
    return `<?xml version="1.0" encoding="iso-8859-1"?><RAIZ>${n('GUID', guid)}<expedicion>${n('referenciaEntrega', e.referenciaEntrega)}${comunes.join('')}${n('entregaLatitud', 0)}${n('entregaLongitud', 0)}${n('entregaCodigoTipoServicio', e.tipoServicio)}${n('entregaGestion', false)}${n('entregaFecha', e.fecha)}${n('retorno', e.retorno)}${n('acuseRecibo', false)}${n('importeValor', 0)}${n('importeReembolso', 0)}${n('importeCobroACuenta', 0)}${n('importeDebido', 0)}${n('bultoTotal', e.bultos)}${bulto}${n('referencia', e.recogidaReferencia)}${n('entregaSabado', false)}${n('recogidaAvisoRecogidaEmail', 0)}${n('recogidaAvisoRecogidaSms', 0)}${n('entregaAvisoRecogidaEmail', 0)}${n('entregaAvisoRecogidaSms', 0)}${n('codigoFranja', '')}${n('referenciaVia', '')}${n('codigoRuta', '')}${n('codigoCliente', e.codigoCliente)}${n('departamentoCliente', e.departamentoCliente)}${n('recogidaCodigoMensajero', e.mensajeroRecogida)}${n('entregaCodigoMensajero', e.mensajeroEntrega)}${n('recogidaCodigoVia', '')}${n('entregaCodigoVia', '')}${n('fechaPOD', '')}${n('DNIPOD', '')}${n('recogidaHoraInicial2', e.horaInicial)}${n('recogidaHoraFinal2', e.horaFinal)}${n('direccionesMensajero', 0)}${n('kmCliente', 0)}${n('kmMensajero', 0)}${n('tiempoEsperaCliente', 0)}${n('tiempoEsperaMensajero', 0)}${n('codigoMensajeroAuxiliar', '')}${n('horasMozo', 0)}${n('DireccionesCliente', 0)}${n('recogidaReferencia2', '')}</expedicion></RAIZ>`
  }
  // GrabarExpedicionSolicitud: nodos al nivel de RAIZ (según el ejemplo de la p. 68).
  return `<?xml version="1.0" encoding="iso-8859-1"?><RAIZ>${n('GUID', guid)}${n('codigoCliente', e.codigoCliente)}${n('departamentoCliente', e.departamentoCliente)}${n('referenciaEntrega', e.referenciaEntrega)}${comunes.slice(0, 1).join('')}${n('recogidaReferencia', e.recogidaReferencia)}${n('recogidaCodigoDomicilioHabitual', '')}${comunes.slice(2, 16).join('')}${n('recogidaPointer', '')}${comunes.slice(16).filter((x) => !x.startsWith('<recogidaReferencia>')).join('')}${n('entregaCodigoDomicilioHabitual', '')}${n('entregaPointer', '')}${n('acuseRecibo', false)}${n('entregaGestion', false)}${n('entregaFecha', e.fecha)}${n('retorno', e.retorno)}${n('importeValor', 0)}${n('importeReembolso', 0)}${n('importeCobroACuenta', 0)}${n('importeDebido', 0)}${n('importeAdelanto', 0)}${n('bultoTotal', e.bultos)}${bulto}${n('referencia', e.recogidaReferencia)}${n('entregaSabado', false)}${n('recogidaCodigoMensajero', e.mensajeroRecogida)}${n('entregaCodigoMensajero', e.mensajeroEntrega)}${n('recogidaCodigoVia', '')}${n('entregaCodigoVia', '')}${n('forzarPendienteValidar', e.forzarPendienteValidar)}${n('noTransmitirVia', e.noTransmitirVia)}${n('recogidaAvisoRecogidaEmail', 0)}${n('recogidaAvisoRecogidaSms', 0)}${n('entregaAvisoRecogidaEmail', 0)}${n('entregaAvisoRecogidaSms', 0)}${n('codigoFranja', '')}${n('referenciaVia', '')}${n('recogidaHoraInicial2', e.horaInicial)}${n('recogidaHoraFinal2', e.horaFinal)}${n('tipoValorAsegurado', '')}${n('crearExpedicionRetorno', false)}${n('crearOrdenSinExpedicion', false)}${n('fechaPOD', '')}${n('DNIPOD', '')}${n('direccionesMensajero', 0)}${n('kmCliente', 0)}${n('kmMensajero', 0)}${n('tiempoEsperaCliente', 0)}${n('tiempoEsperaMensajero', 0)}${n('codigoMensajeroAuxiliar', '')}${n('horasMozo', 0)}${n('DireccionesCliente', 0)}${n('recogidaReferencia2', '')}</RAIZ>`
}

export const METODO_SOAP: Record<DireclineConfig['metodo'], string> = { solicitud: 'GrabarExpedicionSolicitud', expedicion: 'GuardarExpedicion' }

export function hashXml(xml: string): string {
  return createHash('sha256').update(xml.replace(/<GUID>[^<]*<\/GUID>/, '')).digest('hex').slice(0, 16)
}

// ─── Parseo de respuestas (puro) ──────────────────────────────────

const unescapeXml = (t: string) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')

/**
 * Un .asmx devuelve <MetodoResponse><MetodoResult>…XML escapado…</MetodoResult>.
 * Devuelve el XML interno ya desescapado (o el cuerpo si no hay envoltorio).
 */
export function extraerResultado(soapBody: string, metodo: string): string {
  const m = new RegExp(`<(?:\\w+:)?${metodo}Result[^>]*>([\\s\\S]*?)</(?:\\w+:)?${metodo}Result>`, 'i').exec(soapBody)
  if (m) {
    const inner = m[1].trim()
    return inner.startsWith('<![CDATA[') ? inner.slice(9, -3) : unescapeXml(inner)
  }
  const fault = /<faultstring>([\s\S]*?)<\/faultstring>/i.exec(soapBody)
  if (fault) return `<SOAPFAULT><ERROR><CODIGO>FAULT</CODIGO><MENSAJE>${fault[1].trim()}</MENSAJE></ERROR></SOAPFAULT>`
  return soapBody
}

const tagText = (xml: string, tag: string): string | null => {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(xml)
  return m ? unescapeXml(m[1].trim()) : null
}

export interface ErrorPrograma { codigo: string; mensaje: string }

export function errorDe(xml: string): ErrorPrograma | null {
  if (!/<ERROR\b/i.test(xml)) return null
  return { codigo: tagText(xml, 'CODIGO') || '?', mensaje: tagText(xml, 'MENSAJE') || 'Error sin mensaje' }
}

export function parseGuid(xml: string): string | null {
  return tagText(xml, 'GUID')
}

export interface ResultadoGrabacion {
  ordenServicio: string | null
  ordenPedido: string | null
  expedicion: string | null
  referenciaEntrega: string | null
  via: string | null
  expedicionRetorno: string | null
}

export function parseGrabacion(xml: string): ResultadoGrabacion {
  const os = /<ORDENSERVICIO>([\s\S]*?)<\/ORDENSERVICIO>/i.exec(xml)?.[1] || ''
  const ex = /<EXPEDICION>([\s\S]*?)<\/EXPEDICION>/i.exec(xml)?.[1] || xml
  return {
    ordenServicio: tagText(os, 'ID'),
    ordenPedido: tagText(os, 'ORDENPEDIDO'),
    expedicion: tagText(ex, 'NUMERO'),
    referenciaEntrega: tagText(ex, 'REFERENCIAENTREGA'),
    via: tagText(ex, 'VIA'),
    expedicionRetorno: tagText(xml, 'EXPEDICIONRETORNO'),
  }
}

export interface EstadoExpedicion { estado: string | null; fecha: string | null; hora: string | null; firma: string | null; dni: string | null; mensajero: string | null; incidencia: string | null }

export function parseEstado(xml: string): EstadoExpedicion {
  return { estado: tagText(xml, 'ESTADO'), fecha: tagText(xml, 'FECHA'), hora: tagText(xml, 'HORA'), firma: tagText(xml, 'FIRMA'), dni: tagText(xml, 'DNI'), mensajero: tagText(xml, 'CODIGOMENSAJERO'), incidencia: tagText(xml, 'TEXTOINCIDENCIA') }
}

/** targetNamespace del WSDL (el prefijo «dir:» de la documentación). Si no, el de ASMX por defecto. */
export function namespaceDeWsdl(wsdl: string): string {
  const m = /targetNamespace="([^"]+)"/.exec(wsdl)
  return m ? m[1] : 'http://tempuri.org/'
}

// ─── Cliente SOAP ─────────────────────────────────────────────────

export interface ConexionDirecline { baseUrl: string; username: string; password: string; culture: string; namespace: string | null }

export class DireclineError extends Error {
  constructor(public codigo: string, mensaje: string) { super(`[${codigo}] ${mensaje}`); this.name = 'DireclineError' }
}

function envelope(ns: string, metodo: string, params: Record<string, string>): string {
  const body = Object.entries(params).map(([k, v]) => `<dir:${k}>${v.startsWith('<![CDATA[') ? v : xmlEscape(v)}</dir:${k}>`).join('')
  return `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dir="${ns}"><soapenv:Header/><soapenv:Body><dir:${metodo}>${body}</dir:${metodo}></soapenv:Body></soapenv:Envelope>`
}

export async function llamarSoap(conn: ConexionDirecline, metodo: string, params: Record<string, string>, timeoutMs = 30_000): Promise<string> {
  const ns = conn.namespace || 'http://tempuri.org/'
  const action = ns.endsWith('/') ? `${ns}${metodo}` : `${ns}/${metodo}`
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(conn.baseUrl, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `"${action}"` },
      body: envelope(ns, metodo, params),
    })
    const text = await res.text()
    if (!res.ok && !/<faultstring>/i.test(text)) throw new DireclineError(`HTTP_${res.status}`, text.slice(0, 300))
    const inner = extraerResultado(text, metodo)
    const err = errorDe(inner)
    if (err) throw new DireclineError(err.codigo, err.mensaje)
    return inner
  } finally { clearTimeout(t) }
}

export async function leerWsdl(baseUrl: string): Promise<string> {
  const res = await fetch(`${baseUrl}?wsdl`, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new DireclineError(`HTTP_${res.status}`, 'No se pudo leer el WSDL del servicio')
  return res.text()
}

/**
 * Inicia sesión y devuelve el GUID. Direcline (13-oct-2026): si la sesión del
 * usuario ya está abierta, ValidarUsuario devuelve su GUID, así que no hace
 * falta desconectar tras cada operación. El 1401 («sesión abierta») se mantiene
 * como red de seguridad: se cierra y se reintenta una vez.
 */
export async function validarUsuario(conn: ConexionDirecline): Promise<string> {
  const intento = async () => {
    const xml = conn.culture
      ? await llamarSoap(conn, 'ValidarUsuarioCultura', { Nombre: conn.username, Password: conn.password, Cultura: conn.culture })
      : await llamarSoap(conn, 'ValidarUsuario', { Nombre: conn.username, Password: conn.password })
    const guid = parseGuid(xml)
    if (!guid) throw new DireclineError('NO_GUID', 'El servicio no devolvió GUID de sesión')
    return guid
  }
  try { return await intento() } catch (e) {
    if (e instanceof DireclineError && e.codigo === '1401') {
      await llamarSoap(conn, 'DesconectarUsuario', { Nombre: conn.username, Password: conn.password }).catch(() => null)
      return intento()
    }
    throw e
  }
}

export async function desconectarUsuario(conn: ConexionDirecline): Promise<void> {
  await llamarSoap(conn, 'DesconectarUsuario', { Nombre: conn.username, Password: conn.password }).catch(() => null)
}

/** Método XML: el XML completo viaja en el parámetro Valor dentro de CDATA. */
export async function llamarMetodoXml(conn: ConexionDirecline, metodo: string, xml: string): Promise<string> {
  return llamarSoap(conn, metodo, { Valor: `<![CDATA[${xml}]]>` })
}

export async function obtenerEstructuraXml(conn: ConexionDirecline, guid: string, nombreMetodo: string): Promise<string> {
  return llamarSoap(conn, 'ObtenerEstructuraXML', { GUID: guid, NombreMetodo: nombreMetodo })
}

export async function obtenerExpedicionPorNumero(conn: ConexionDirecline, guid: string, numero: string): Promise<EstadoExpedicion> {
  return parseEstado(await llamarSoap(conn, 'ObtenerExpedicionPorNumero', { GUID: guid, Numero: numero }))
}
