import { adminClient } from '@/lib/supabase'
import { toJson } from '@/lib/db-json'

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
export const LESSONS_CAP = 14000 // 6.000 dejaba fuera 2 de las 43 lecciones de GTD (7-oct); con las 10 del feedback de Usoa (9-oct) GTD tiene 54 activas y 9.000 dejaba fuera las más antiguas
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

/**
 * Sección FIJA de la casa (Carlos, 7-oct-2026): «quiénes somos, equipo humano y
 * qué ofreceremos son casi siempre iguales». Texto institucional aprobado que
 * toda memoria reproduce tal cual, adaptando solo la referencia al órgano.
 */
export interface StandardSection {
  id: string
  title: string
  content: string
  enabled: boolean
}

export interface Teaching {
  guide: string | null
  lessons: Lesson[]
  /** Secciones fijas de la casa (todas, activas o no; el bloque del prompt filtra). */
  standardSections: StandardSection[]
  /** Títulos que toda memoria lleva (esqueleto de la casa); «Plan de contingencia» va siempre además. */
  requiredSections: string[]
}

/** Carlos (7-oct): «Plan de contingencia incluir siempre y ellos verán si lo mantienen». Para todas las marcas. */
export const SECCIONES_SIEMPRE = ['Plan de contingencia']
export const REQUIRED_SECTIONS_MAX = 30

/** JSON guardado → títulos limpios, sin repetidos. Puro. */
export function parseRequiredSections(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const x of raw) {
    if (typeof x !== 'string') continue
    const t = x.replace(/\s+/g, ' ').trim().slice(0, STANDARD_TITLE_MAX)
    if (t && !out.some((y) => tituloCoincide(y, t))) out.push(t)
  }
  return out.slice(0, REQUIRED_SECTIONS_MAX)
}

/** Lo requerido por la marca + lo que va siempre, sin repetir y sin lo que ya es sección fija. */
export function seccionesRequeridas(required: string[], fijas: StandardSection[] = []): string[] {
  const out: string[] = []
  for (const t of [...required, ...SECCIONES_SIEMPRE]) {
    if (!out.some((y) => tituloCoincide(y, t)) && !fijas.some((f) => f.enabled && tituloCoincide(f.title, t))) out.push(t)
  }
  return out
}

/** Títulos requeridos que la memoria no trae. Puro. */
export function requeridasQueFaltan(secciones: SeccionGenerada[], requeridas: string[]): string[] {
  // Un título del esqueleto cuenta como cubierto si es una sección O un
  // subapartado («## Circuito operativo…») dentro de otra. Feedback de Usoa
  // (9-oct-2026): el redactor puso «Circuito operativo», «Tipología de
  // servicios», «Soluciones IT»… como subapartados del punto 4 y del 7, aquí
  // no se reconocían, y «completar» los volvía a redactar como secciones al
  // final: la misma memoria con cinco temas repetidos.
  const titulos = secciones.flatMap((s) => [s.titulo || '', ...subtitulosDe(s.contenido || '')])
  return requeridas.filter((r) => !titulos.some((t) => tituloCoincide(t, r)))
}

/** Subapartados de una sección: líneas «## Título» y rótulos cortos en mayúsculas. */
export function subtitulosDe(contenido: string): string[] {
  const out: string[] = []
  for (const linea of contenido.split('\n')) {
    const l = linea.trim()
    const h = /^#{1,3}\s+(.+)$/.exec(l)
    if (h) { out.push(h[1].trim()); continue }
    if (l.length >= 6 && l.length <= 90 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{3}/.test(l) && !/[.:;]$/.test(l)) out.push(l)
  }
  return out
}

// ─── Lote objetivo, mejoras y servicios no pedidos (feedback de Usoa, 9-oct-2026) ───
//
// La memoria de RTVE mezcló servicios de otros lotes (una valija entre sedes
// que el lote 2 no pide), aplicó lecciones de otros servicios y propuso una
// «mejora» de plazos que la responsable no había decidido. El pliego de un
// expediente suele cubrir varios lotes: hay que decir cuál es el objetivo y
// cortar todo lo demás.

/** Número de lote que piden el título o las instrucciones del expediente («Lote 2», «lote II»). */
export function detectarLote(...textos: Array<string | null | undefined>): number | null {
  const romanos: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 }
  for (const t of textos) {
    if (!t) continue
    const m = /\blote\s*(?:n[ºo.]?\s*)?(\d{1,2}|[ivx]{1,4})\b/i.exec(t)
    if (!m) continue
    const v = m[1].toLowerCase()
    const n = /^\d+$/.test(v) ? Number(v) : romanos[v]
    if (n) return n
  }
  return null
}

/**
 * Estructura por lotes de un pliego (PCAP + PPT concatenados): qué cláusula de
 * primer nivel pertenece a cada lote y el texto de cada tramo. Nació el
 * 14-oct-2026: la memoria de RTVE lote 2 citaba «el apartado 4.4 del PPT»
 * (condiciones obligatorias del LOTE 3, internacional: material aduanero,
 * hardware sin coste…) como si fueran del lote 2, que no las tiene. La regla
 * de prompt no bastó; esto se comprueba en TS.
 */
export interface MapaLotes {
  /** cláusula de primer nivel («3») → lote (2) */
  clausulas: Record<string, number>
  /** texto del tramo de cada lote */
  tramos: Record<number, string>
  /** lo que no cuelga de ningún lote (introducción, oferta técnica, medios…) */
  comun: string
}

// «3. SERVICIO … – LOTE 2», «LOTE 2 – PAQUETERÍA NACIONAL», «LOTE 1: SERVICIO POSTAL»; no «TOTAL OFERTADO ANUAL LOTE 1» (fila de tabla).
const CABECERA_LOTE = /^\s*(?:(\d{1,2})\.?\s+)?(?:LOTE\s*(\d{1,2})\s*[-–:]|.*[-–:]\s*LOTE\s*(\d{1,2})\b)/
const CABECERA_NUMERADA = /^\s*(\d{1,2})\.?\s+[A-ZÁÉÍÓÚÑ]/
/** Un rótulo: corto, en mayúsculas y sin importes (las filas de tabla del PCAP también dicen «LOTE 2», pero llevan €). */
function esCabecera(s: string): boolean {
  if (s.length < 6 || s.length > 90 || /€/.test(s)) return false
  const letras = s.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, '')
  return letras.length >= 6 && letras === letras.toUpperCase()
}

export function mapaDeLotes(pliego: string): MapaLotes | null {
  const clausulas: Record<string, number> = {}
  const conflicto = new Set<string>()
  const tramos: Record<number, string[]> = {}
  const comun: string[] = []
  let actual: number | null = null
  let clausulaActual: string | null = null
  // Un tramo de lote se cierra en la siguiente cláusula de primer nivel que no sea la suya, o en un
  // ANEXO / CLÁUSULA / SOBRE: si no, la tabla de precios del lote 3 en el PCAP arrastraba detrás todo
  // el texto legal del pliego y «Real Decreto» salía como sede del lote 3.
  const CIERRE = /^(?:ANEXO\b|CL[ÁA]USULA\b|SOBRE\b|CAP[ÍI]TULO\b|T[ÍI]TULO\b)/
  for (const linea of pliego.split('\n')) {
    // El PPT separa número y título con tabulador («3. \tSERVICIO … – LOTE 2»).
    const s = linea.replace(/\t+/g, ' ').trim()
    if (esCabecera(s)) {
      const m = CABECERA_LOTE.exec(s)
      if (m) {
        const lote = Number(m[2] ?? m[3])
        actual = lote
        clausulaActual = m[1] ?? null
        ;(tramos[lote] ??= []).push(s)
        if (m[1]) {
          // PCAP y PPT van concatenados: si la misma cláusula apunta a dos lotes, no se fía de ella.
          if (clausulas[m[1]] !== undefined && clausulas[m[1]] !== lote) conflicto.add(m[1])
          else clausulas[m[1]] = lote
        }
        continue
      }
      const num = CABECERA_NUMERADA.exec(s)
      if ((num && num[1] !== clausulaActual) || CIERRE.test(s)) { actual = null; clausulaActual = null }
    }
    ;(actual ? (tramos[actual] ??= []) : comun).push(s)
  }
  for (const c of conflicto) delete clausulas[c]
  const lotes = Object.keys(tramos).map(Number)
  if (!lotes.length) return null
  return { clausulas, tramos: Object.fromEntries(lotes.map((n) => [n, tramos[n].join('\n')])), comun: comun.join('\n') }
}

/** Bloque del prompt: el lote objetivo manda sobre todo el pliego. Con el mapa, además, la numeración que puede citar. */
export function bloqueLote(lote: number, mapa?: MapaLotes | null): string {
  const base = `LOTE OBJETIVO: LOTE ${lote}. El pliego puede cubrir varios lotes; esta memoria responde SOLO al lote ${lote} y a las cláusulas comunes a todos. Los servicios, rutas, sedes, trayectos, plazos y requisitos de otros lotes NO existen para esta memoria, aunque la empresa pudiera prestarlos: ni se describen ni se ofrecen. Cada plazo o requisito que cites tiene que ser el del lote ${lote} (indica la cláusula).`
  const pares = Object.entries(mapa?.clausulas ?? {})
  if (!pares.length) return base
  const propias = pares.filter(([, l]) => l === lote).map(([c]) => `${c}.x`)
  const ajenas = pares.filter(([, l]) => l !== lote).map(([c, l]) => `${c}.x (lote ${l})`)
  return `${base} NUMERACIÓN DEL PLIEGO: las cláusulas del lote ${lote} son ${propias.length ? propias.join(', ') : 'las que el pliego titula con este lote'}; ${ajenas.length ? `las ${ajenas.join(', ')} son de OTRO lote: no las cites ni apliques sus obligaciones, aunque se parezcan.` : ''} Si una obligación solo existe en la cláusula de otro lote, para este lote NO existe.`
}

/** Cláusulas citadas en la memoria («apartado 4.4 del PPT») que el mapa atribuye a otro lote. */
export function clausulasDeOtroLote(memoria: unknown, mapa: MapaLotes | null, lote: number | null): Array<{ cita: string; lote: number }> {
  if (!mapa || !lote || !Object.keys(mapa.clausulas).length) return []
  const texto = JSON.stringify(memoria || '')
  const vistas = new Map<string, number>()
  for (const m of texto.matchAll(/\b(\d{1,2})\.(\d{1,2})(?:\.\d{1,2})?\b/g)) {
    const antes = texto.slice(Math.max(0, (m.index ?? 0) - 24), m.index)
    const despues = texto.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 18)
    const esCita = /(apartados?|cl[aá]usulas?|puntos?|ep[ií]grafes?)\s*(\d{1,2}(\.\d{1,2})*\s*(,|y)\s*)*$/i.test(antes) || /^\s*(del|de la|de el)\s+(PPT|PCAP|pliego)/i.test(despues)
    if (!esCita) continue
    const de = mapa.clausulas[m[1]]
    if (de !== undefined && de !== lote) vistas.set(`${m[1]}.${m[2]}`, de)
  }
  return [...vistas].map(([cita, l]) => ({ cita, lote: l }))
}

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Nombres propios (sedes, lugares) que la memoria cita y el pliego solo menciona en el tramo de OTRO lote. */
export function lugaresDeOtroLote(memoria: unknown, mapa: MapaLotes | null, lote: number | null): string[] {
  if (!mapa || !lote) return []
  const texto = JSON.stringify(memoria || '').replace(/\\n/g, ' ')
  const propio = normalizar(`${mapa.tramos[lote] || ''}\n${mapa.comun}`)
  const ajenos = Object.entries(mapa.tramos).filter(([k]) => Number(k) !== lote).map(([, t]) => normalizar(t))
  if (!ajenos.length) return []
  const sinAcentos = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const ajenosConMayusculas = Object.entries(mapa.tramos).filter(([k]) => Number(k) !== lote).map(([, t]) => sinAcentos(t))
  const cands = new Map<string, boolean>() // nombre → ¿es de una sola palabra?
  // Nombres de varias palabras («Sant Cugat del Vallés») y, además, una sola palabra tras preposición de
  // lugar («en Torrespaña»): las sedes suelen ser una palabra. Las de una palabra tienen que aparecer
  // también con mayúscula en el otro lote (nombre propio), no como palabra común de un texto legal.
  for (const m of texto.matchAll(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:(?:\s+(?:de|del|de la|de las|de los|la|las|los|el|y)\s+|\s+)[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}){1,3})\b/g)) cands.set(m[1], false)
  for (const m of texto.matchAll(/(?<=\b(?:en|desde|hasta|hacia|a|de|del)\s)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{4,})\b/g)) if (!cands.has(m[1])) cands.set(m[1], true)
  return [...cands].filter(([c, sola]) => {
    const n = normalizar(c)
    if (propio.includes(n)) return false
    return sola ? ajenosConMayusculas.some((t) => t.includes(sinAcentos(c))) : ajenos.some((t) => t.includes(n))
  }).map(([c]) => c).slice(0, 10)
}

/** Salvedades que perjudican la oferta y que nadie ha decidido (Usoa, 9 y 14-oct: «las zonas 1 y 2 siguen apareciendo»). */
const SALVEDADES: Array<[RegExp, RegExp | null]> = [
  [/zonas?\s*(?:GLS\s*)?[12]\s*(?:y|e|-|–)\s*[12]\b/i, /10H|afectad|retras|kilom|plazo/i],
  [/puede(?:n)?\s+verse\s+afectad/i, null],
  [/retrasos?\s+admitid/i, null],
  [/hasta\s+las\s+14:00/i, /retras|demor|posterior/i],
]
export function salvedadesColadas(memoria: unknown): string[] {
  const texto = JSON.stringify(memoria || '').replace(/\\n/g, ' ')
  const out: string[] = []
  for (const frase of texto.split(/(?<=[.!?])\s+/)) {
    if (SALVEDADES.some(([a, b]) => a.test(frase) && (!b || b.test(frase)))) out.push(frase.replace(/^["\[\]{}]+|["\[\]{}]+$/g, '').trim().slice(0, 160))
  }
  return [...new Set(out)].slice(0, 6)
}

export const REGLA_SIN_INVENTAR_SERVICIOS = 'Solo se describen los servicios, rutas, sedes y trayectos que el pliego del lote objetivo pide o describe. Una lección, una memoria anterior, el material de la marca o un ejemplo NO autorizan a añadir un servicio (una valija entre dos sedes, una recogida fuera de las sedes, una gestión documental) que ESTE pliego no pida.'

export const REGLA_MEJORAS = 'Las MEJORAS y los compromisos cuantificados (plazos reducidos, franjas horarias extra, penalizaciones aceptadas, retrasos admitidos) los decide la responsable al elaborar la memoria: no propongas ninguno concreto ni lo des por hecho. Si un criterio exige una mejora, describe la operativa que la sostendría y deja la cifra como [FALTA: mejora decidida por la responsable]. Tampoco añadas salvedades que perjudiquen (p. ej. «puede retrasarse hasta las 14:00» o «en las zonas GLS 1 y 2 la modalidad 10H puede verse afectada») si el pliego no las pide: aunque una memoria anterior del corpus las diga, aquí NO van.'

export const REGLA_SIN_DUPLICAR = 'Cada tema se trata UNA vez: si ya va como subapartado «## » dentro de una sección, no vuelve a aparecer como sección aparte ni se repite en otra (la red de agencias, el circuito, la herramienta IT se cuentan en un solo sitio). Usa un único término para cada concepto en toda la memoria («modalidades de servicio» o «tipología», no ambos).'

/** Menciones de OTROS lotes en la memoria generada: señal de que se ha colado contenido ajeno al lote objetivo. */
export function lotesColados(memoria: unknown, lote: number | null): number[] {
  if (!lote) return []
  const texto = JSON.stringify(memoria || '').toLowerCase()
  const otros = new Set<number>()
  for (const m of texto.matchAll(/\blote\s*(?:n[ºo.]?\s*)?(\d{1,2})\b/g)) {
    const n = Number(m[1])
    if (n && n !== lote) otros.add(n)
  }
  return [...otros].sort((a, b) => a - b)
}

/**
 * «Equipo material» va justo después de «Equipo humano» (Usoa, 9-oct: «añadiría
 * en este mismo apartado EQUIPO MATERIAL»): los activos de la empresa, juntos.
 */
export function ordenarActivos<T extends { titulo?: string }>(secciones: T[]): T[] {
  const esHumano = (t: string) => /equipo humano|medios humanos|recursos humanos/i.test(t)
  const esMaterial = (t: string) => /equipo material|medios materiales|medios t[eé]cnicos/i.test(t)
  const iHumano = secciones.findIndex((x) => esHumano(x.titulo || ''))
  const iMaterial = secciones.findIndex((x) => esMaterial(x.titulo || ''))
  if (iHumano < 0 || iMaterial < 0 || iMaterial === iHumano + 1) return secciones
  const out = secciones.slice()
  const [mat] = out.splice(iMaterial, 1)
  const destino = out.findIndex((x) => esHumano(x.titulo || '')) + 1
  out.splice(destino, 0, mat)
  return out
}

/** Bloque del prompt: el esqueleto mínimo. Puro. */
export function bloqueSeccionesRequeridas(requeridas: string[]): string {
  if (!requeridas.length) return ''
  return `ESQUELETO MÍNIMO — la memoria se entrega LO MÁS COMPLETA POSIBLE: además de las secciones que puntúan, incluye SIEMPRE una sección para cada uno de estos títulos (con el contenido real de la empresa aplicado a este contrato; si el pliego no dice nada del tema, se describe la práctica habitual de la empresa). La responsable eliminará después lo que no considere necesario; quitar una de estas secciones no es decisión tuya.
${requeridas.map((t) => `- ${t}`).join('\n')}`
}

export async function saveRequiredSections(clientId: string, list: string[]): Promise<void> {
  const { error } = await adminClient().from('tender_settings')
    .upsert({ client_id: clientId, required_sections: toJson(list), updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
  if (error) throw error
}

export const STANDARD_SECTIONS_MAX = 8
export const STANDARD_TITLE_MAX = 120
export const STANDARD_CONTENT_CAP = 6000

/** JSON guardado → lista tipada; lo que no tenga forma se descarta. Puro. */
export function parseStandardSections(raw: unknown): StandardSection[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((s): s is StandardSection => !!s && typeof s === 'object' && typeof (s as StandardSection).title === 'string' && typeof (s as StandardSection).content === 'string')
    .map((s) => ({ id: typeof s.id === 'string' && s.id ? s.id : `s${Math.random().toString(36).slice(2, 8)}`, title: s.title.replace(/\s+/g, ' ').trim().slice(0, STANDARD_TITLE_MAX), content: s.content.trim().slice(0, STANDARD_CONTENT_CAP), enabled: s.enabled !== false }))
    .filter((s) => s.title && s.content)
    .slice(0, STANDARD_SECTIONS_MAX)
}

export async function saveStandardSections(clientId: string, list: StandardSection[]): Promise<void> {
  const { error } = await adminClient().from('tender_settings')
    .upsert({ client_id: clientId, standard_sections: toJson(list), updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
  if (error) throw error
}

const normalizarTitulo = (t: string) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^\d+(\.\d+)*[.)]?\s*/, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
const palabras = (t: string) => new Set(String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2))

/** ¿Es esta sección de la memoria la sección fija? Título igual (sin número) o que la contenga, o 2/3 de sus palabras. */
export function tituloCoincide(titulo: string, fija: string): boolean {
  const a = normalizarTitulo(titulo), b = normalizarTitulo(fija)
  if (!a || !b) return false
  if (a === b || a.includes(b) || b.includes(a)) return true
  const pa = palabras(a), pb = palabras(b)
  if (!pb.size) return false
  let comunes = 0
  for (const w of pb) if (pa.has(w)) comunes++
  return comunes / pb.size >= 0.66
}

/** Parecido del texto generado con el fijo: palabras del fijo que siguen ahí (0-1). */
export function coincidenciaTexto(generado: string, fijo: string): number {
  const pf = palabras(fijo), pg = palabras(generado)
  if (!pf.size) return 1
  let comunes = 0
  for (const w of pf) if (pg.has(w)) comunes++
  return comunes / pf.size
}

export interface SeccionGenerada { titulo?: string; contenido?: string }
export interface ComprobacionFijas { faltan: StandardSection[]; reescritas: Array<{ title: string; coincidencia: number }> }

/** Qué secciones fijas faltan en la memoria y cuáles están pero reescritas (< 60 % de sus palabras). Puro. */
export function comprobarSeccionesFijas(secciones: SeccionGenerada[], fijas: StandardSection[]): ComprobacionFijas {
  const faltan: StandardSection[] = []
  const reescritas: Array<{ title: string; coincidencia: number }> = []
  for (const f of fijas.filter((x) => x.enabled)) {
    const hit = secciones.find((s) => tituloCoincide(s.titulo || '', f.title))
    if (!hit) { faltan.push(f); continue }
    const c = coincidenciaTexto(hit.contenido || '', f.content)
    if (c < 0.6) reescritas.push({ title: f.title, coincidencia: Math.round(c * 100) })
  }
  return { faltan, reescritas }
}

/**
 * Inserta las fijas que faltan al principio, en su orden, con su texto tal cual.
 * El modelo recibió la orden de incluirlas; TypeScript garantiza que están.
 */
export function insertarSeccionesFijas<T extends SeccionGenerada>(secciones: T[], faltan: StandardSection[]): T[] {
  if (!faltan.length) return secciones
  const nuevas = faltan.map((f) => ({ titulo: f.title, contenido: f.content, criterio: null, puntos_objetivo: null, datos_a_confirmar: ['Sección fija insertada tal cual: revisa la referencia al órgano de esta licitación.'] }) as unknown as T)
  return [...nuevas, ...secciones]
}

/** Bloque del prompt con las secciones fijas activas. Vacío si no hay. Puro. */
export function bloqueSeccionesFijas(fijas: StandardSection[]): string {
  const activas = fijas.filter((f) => f.enabled && f.content.trim())
  if (!activas.length) return ''
  return `SECCIONES FIJAS DE LA CASA — texto institucional aprobado por la responsable. La memoria DEBE incluir cada una de estas secciones, con ESTE título y ESTE texto reproducido tal cual: solo se adapta la referencia al órgano o al contrato de ESTE pliego y se añade lo que el pliego pida expresamente. No las resumas, no las reescribas, no las fusiones con otras ni cambies sus cifras. Van donde la estructura habitual de la empresa las lleva (normalmente al principio).
${activas.map((f) => `<seccion_fija titulo="${f.title.replace(/"/g, "'")}">
${f.content}
</seccion_fija>`).join('\n')}`
}

/** Regla de la casa para los medios materiales (Carlos, 7-oct): se dimensionan al pliego, nunca una sección estándar. */
export const REGLA_MEDIOS_MATERIALES = 'La sección de MEDIOS / EQUIPO MATERIAL se dimensiona a lo que pide ESTE pliego (tipos de vehículo, equipos, sistemas y materiales que el PPT exige o que la operativa descrita necesita): no es una sección estándar ni se copia de otra memoria. Equipo material son vehículos, medios de carga y manipulación y materiales físicos: los medios humanos van en la sección de equipo humano y el hardware o software de la herramienta de solicitud y seguimiento en la sección del sistema informático, nunca aquí (Usoa, 14-oct). No ofrezcas medios, servicios, mejoras ni compromisos que el pliego no pida expresamente; si la empresa dispone de algo que no se pide, como mucho una mención breve sin convertirlo en oferta.'


/** La guía de la marca y sus lecciones activas (más recientes primero). */
export async function loadTeaching(clientId: string): Promise<Teaching> {
  const db = adminClient()
  const [settings, lessons] = await Promise.all([
    db.from('tender_settings').select('guide,standard_sections,required_sections').eq('client_id', clientId).maybeSingle(),
    db.from('tender_lessons').select('id,text,source,created_at')
      .eq('client_id', clientId).eq('active', true)
      .order('created_at', { ascending: false }).limit(LESSONS_MAX),
  ])
  if (settings.error) throw settings.error
  if (lessons.error) throw lessons.error
  const guide = typeof settings.data?.guide === 'string' && settings.data.guide.trim() ? settings.data.guide : null
  return { guide, lessons: (lessons.data || []) as Lesson[], standardSections: parseStandardSections(settings.data?.standard_sections), requiredSections: parseRequiredSections(settings.data?.required_sections) }
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
      'LECCIONES — cada línea es una regla obligatoria que la responsable ha enseñado; se aplican siempre, salvo que una instrucción del expediente diga otra cosa. Describen CÓMO trabaja la empresa cuando ese servicio o situación existe en ESTE pliego: una lección sobre la valija, el 10H, un partner o una zona NO autoriza a incluir ese servicio o esa salvedad si el pliego del lote objetivo no lo pide.\n'
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
