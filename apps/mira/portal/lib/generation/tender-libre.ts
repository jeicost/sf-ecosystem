import { createMessageForClient } from '@/lib/anthropic-client'
import { TENDER_MODEL, ajustesModelo, techoSalida } from '@/lib/ai/models'
import { bloqueDisenadasPrompt, loadDisenadas, normalizarMarcadores, type Disenada } from '@/lib/tenders/disenadas'
import { adminClient } from '@/lib/supabase'
import { extractJson } from '@/lib/generation/extract-json'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getKnowledgeContext } from '@/lib/knowledge'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { loadMemoriaExamples, organosColados } from '@/lib/generation/tender-memoria'
import type { DocSection } from '@/lib/generation/tender-documento'

// Documento a partir de un ENCARGO libre, sin pliego.
//
// Usoa (30-sep-2026): «debería haber un apartado libre donde subir mi documento
// y que MIRA, leyendo todo lo que tiene, genere lo que le pido en Word». Su caso
// real: una empresa de Facility Services que va a una licitación le pide a GTD,
// como subcontrata, tarifas y una memoria técnica de la empresa. No hay pliego
// que subir porque no existe; el módulo solo sabía arrancar desde uno.
//
// 01-oct: el apartado admitía solo texto pegado y ella quería SUBIR su fichero.
// Ahora el encargo puede venir como brief, como fichero adjunto o las dos
// cosas. El adjunto puede ser dos cosas distintas y se tratan distinto:
//   - la PETICIÓN tal como llegó (el correo/PDF del cliente): sus apartados o
//     preguntas son las secciones del documento;
//   - NUESTRO BORRADOR a reescribir (su Word a medias): su estructura se
//     conserva y el contenido se rehace con el corpus.
// El modelo clasifica (campo `origen`) y TypeScript decide: aquí la doctrina
// es «el modelo marca, TS computa».
//
// Misma regla que la memoria: los hechos salen del corpus o se marcan [FALTA].
// Y una más, propia de este camino: si el encargo pide TARIFAS, no se inventa
// ni una cifra. Se deja la estructura de lo que hay que tarificar y el precio lo
// pone el equipo comercial. En una OFERTA esto no es aviso: TS sustituye
// cualquier importe que se cuele por [FALTA: tarifa].

const MODEL = TENDER_MODEL

/** Tipos de documento que se pueden pedir. `carta` no existe en la BD (CHECK de
 *  tender_documents.kind): se guarda como `anexo` y solo vive en prompt y UI. */
export type KindLibre = 'memoria' | 'oferta' | 'anexo' | 'carta'
export const KINDS_LIBRE: KindLibre[] = ['memoria', 'oferta', 'anexo', 'carta']
export type KindBD = 'memoria' | 'oferta' | 'anexo'
export function kindParaBD(kind: KindLibre): KindBD {
  return kind === 'carta' ? 'anexo' : kind
}
export function esKindLibre(v: unknown): v is KindLibre {
  return typeof v === 'string' && (KINDS_LIBRE as string[]).includes(v)
}

export type OrigenAdjunto = 'peticion' | 'borrador' | 'otro'

export interface AdjuntoLibre {
  filename: string
  texto: string
}

export interface DocumentoLibre {
  titulo: string
  secciones: DocSection[]
  avisos: string[]
  /** Cómo ha tratado el modelo el adjunto (null si no había). */
  origen: OrigenAdjunto | null
}

/** Límites por tipo, que TS comprueba después de que el modelo escriba. */
const LIMITES: Record<KindLibre, { minSecciones: number; maxSecciones: number; maxPalabras: number | null }> = {
  memoria: { minSecciones: 3, maxSecciones: 20, maxPalabras: null },
  oferta: { minSecciones: 3, maxSecciones: 12, maxPalabras: null },
  anexo: { minSecciones: 2, maxSecciones: 5, maxPalabras: null },
  carta: { minSecciones: 1, maxSecciones: 3, maxPalabras: 600 },
}

const ADJUNTO_MAX = 150_000

/**
 * Pista para el modelo sobre qué es el adjunto, sacada de su cabecera. No
 * decide: el modelo devuelve `origen` con todo el texto delante. Pero cuando la
 * cabecera es inequívoca («MEMORIA TÉCNICA» de la propia empresa) el prompt lo
 * dice y evita que un borrador se trate como si fuera una petición.
 */
export function pistaOrigen(texto: string, brandName?: string | null): OrigenAdjunto | null {
  const cab = texto.slice(0, 3000).toUpperCase()
  const pidenAlgo = /SOLICIT|NOS ENV[IÍ]|ROGAMOS|NECESITAMOS|ADJUNT[AE]N|REQUEST|PLEASE SEND|FECHA L[IÍ]MITE|PETICI[ÓO]N DE OFERTA|RFQ|RFP/.test(cab)
  const pareceNuestro = /MEMORIA\s*T[ÉE]CNICA|PROPUESTA\s*T[ÉE]CNICA|OFERTA\s*T[ÉE]CNICA|QUI[ÉE]NES SOMOS|NUESTRA EMPRESA|NUESTROS SERVICIOS/.test(cab)
    || (!!brandName && brandName.length >= 3 && cab.includes(brandName.toUpperCase()))
  if (pidenAlgo && !pareceNuestro) return 'peticion'
  if (pareceNuestro && !pidenAlgo) return 'borrador'
  return null
}

/** Cabeceras aparentes del adjunto (líneas cortas, en mayúsculas o numeradas). */
export function cabecerasDe(texto: string, max = 40): string[] {
  const out: string[] = []
  for (const raw of texto.split('\n')) {
    const l = raw.trim()
    if (l.length < 4 || l.length > 90) continue
    const numerada = /^(\d+(\.\d+)*[.)]?|[IVX]+[.)]|[A-Z][.)])\s+\S/.test(l)
    const mayus = l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{3}/.test(l) && !/[.:;]$/.test(l)
    if (numerada || mayus) out.push(l)
    if (out.length >= max) break
  }
  return out
}

/**
 * Importes en euros: «1.250,00 €», «1250 €», «12500 EUR», «€ 30», «30 euros».
 * No pilla «24 horas», «15 repartidores», «ISO 9001» ni «año 2026». El
 * \d{1,3} de antes dejaba restos («1250 €» → «1[FALTA: tarifa]»): ahora la
 * cifra se toma entera desde su primer dígito (lookbehind sin dígito delante).
 */
export const IMPORTE_RE = /(?:€\s*\d+(?:[.\s]\d{3})*(?:,\d+)?|(?<!\d)\d+(?:[.\s]\d{3})*(?:,\d+)?\s*(?:€|euros?\b|EUR\b))/gi
/** Porcentajes: «15 %», «12,5%». Solo se sustituyen en una OFERTA y solo si hablan de precio (ver sanearPorcentajes). */
export const PORCENTAJE_RE = /(?<!\d)\d+(?:,\d+)?\s*%/g
/** Palabras que, cerca de un %, lo hacen descuento y no KPI («99,5 % de entregas a tiempo» es legítimo). */
const CONTEXTO_DESCUENTO_RE = /descuento|dto\.?|rebaja|\bbaja\b|bonificaci|tarifa|precio|importe|coste|€|euros?/i
// Copia sin /g para preguntar: un regex global guarda lastIndex entre .test() y
// da falsos negativos en un .some().
const tieneImporte = (t: string) => new RegExp(IMPORTE_RE.source, 'i').test(t)

/** Sustituye todo importe por [FALTA: tarifa]. Puro, para regresiones. */
export function sanearImportes(texto: string): { texto: string; n: number } {
  let n = 0
  return { texto: texto.replace(IMPORTE_RE, () => { n++; return '[FALTA: tarifa]' }), n }
}

/**
 * Sustituye por [FALTA: descuento] los porcentajes que hablan de precio (a ≤80
 * caracteres de «descuento», «tarifa», «precio»…). Los demás porcentajes se
 * dejan pero se cuentan (`dudosos`) para avisar: TS no adivina si «95 %» es un
 * KPI o una rebaja, así que no lo borra, lo señala.
 */
export function sanearPorcentajes(texto: string): { texto: string; n: number; dudosos: number } {
  let n = 0
  let dudosos = 0
  const out = texto.replace(PORCENTAJE_RE, (m, offset: number) => {
    const ventana = texto.slice(Math.max(0, offset - 80), offset + m.length + 80)
    if (CONTEXTO_DESCUENTO_RE.test(ventana)) { n++; return '[FALTA: descuento]' }
    dudosos++
    return m
  })
  return { texto: out, n, dudosos }
}

function guiaPorKind(kind: KindLibre): string {
  switch (kind) {
    case 'memoria':
      return `TIPO DE DOCUMENTO: MEMORIA TÉCNICA de la empresa.
- Estructúrala con el esqueleto que la empresa usa en sus memorias presentadas (abajo): quiénes somos, servicios, medios humanos y materiales, procedimiento operativo, calidad y KPIs, gestión de incidencias, puesta en marcha, RSC, propuesta de valor — quedándote con lo que el encargo necesita y en el orden que pide.
- Una sección por servicio o criterio que pidan; cada una con sustancia: cifras, plazos, medios y compromisos REALES de la empresa.`
    case 'oferta':
      return `TIPO DE DOCUMENTO: PROPUESTA COMERCIAL / OFERTA SIN PRECIOS.
- Estructura: presentación breve → alcance del servicio (qué se cubre y qué no) → niveles de servicio y compromisos (plazos, horarios, cobertura, trazabilidad, KPIs) → medios que se aportan → condiciones (vigencia, facturación, revisión, exclusiones) → TARIFAS → siguientes pasos.
- La sección "Tarifas" lleva la estructura de servicios y tramos a tarificar, con [FALTA: tarifa] en cada línea. NUNCA escribas un precio, ni orientativo, ni un rango, ni un descuento en %: los fija el equipo comercial y así se dice en la nota.`
    case 'anexo':
      return `TIPO DE DOCUMENTO: ANEXO sobre UN solo tema (el que pide el encargo: plan de calidad, medios, protocolo de incidencias, certificaciones…).
- Entre 2 y 5 secciones, todas del mismo tema. Nada de presentación general de la empresa salvo que el tema lo exija.`
    case 'carta':
      return `TIPO DE DOCUMENTO: CARTA o RESPUESTA BREVE.
- Entre 1 y 3 secciones: saludo y motivo, cuerpo (lo que se responde o se aporta), cierre y firma. Máximo 600 palabras en total.
- Registro de carta comercial: directa, sin listas largas, sin repetir lo que ya sabe el destinatario.`
  }
}

function guiaAdjunto(adjunto: AdjuntoLibre | undefined, pista: OrigenAdjunto | null): string {
  if (!adjunto) return ''
  const cabeceras = cabecerasDe(adjunto.texto)
  return `
SOBRE EL ADJUNTO
Antes de escribir, clasifica el adjunto en el campo "origen":
- "peticion": es lo que nos ha llegado del cliente (correo, PDF, hoja de requisitos). Entonces los apartados, preguntas o requisitos que pide son las secciones del documento, en su orden y con sus nombres; responde a cada uno.
- "borrador": es NUESTRO documento a medias o de otro año. Entonces su estructura de apartados es la estructura del documento (conserva títulos y orden${cabeceras.length ? `; los que se detectan: ${cabeceras.slice(0, 25).map((c) => `«${c}»`).join(', ')}` : ''}) y reescribes el contenido con los hechos del CLIENT KNOWLEDGE. Lo que el borrador afirma y el corpus no respalda va como [FALTA: dato] y a la nota, no se copia.
- "otro": ni una cosa ni la otra (un pliego ajeno, un documento de referencia). Úsalo como contexto y sigue el brief.
${pista ? `Por la cabecera parece "${pista}"; confírmalo o corrígelo leyendo el texto completo.` : ''}
Si el brief y el adjunto se contradicen sobre qué documento hay que producir, manda el brief.`
}

/**
 * Construye el prompt sin tocar red ni modelo: así se puede imprimir y leer con
 * un brief de ejemplo antes de gastar una llamada.
 */
export function construirPromptLibre(opts: {
  brief: string
  kind: KindLibre
  adjunto?: AdjuntoLibre
  pista: OrigenAdjunto | null
  pideTarifas: boolean
  examplesText: string
  brainBlock: string
  knowledge: string
  /** Bloque de páginas con diseño propio (bloqueDisenadasPrompt), o vacío. */
  disenadas?: string
}): string {
  const { brief, kind, adjunto, pista, pideTarifas, examplesText, brainBlock, knowledge, disenadas } = opts
  const lim = LIMITES[kind]
  return `Eres quien redacta la documentación técnica y comercial de esta empresa de transporte y mensajería.

Te llega un ENCARGO (no hay pliego)${adjunto ? ', con un fichero adjunto' : ''}. Tienes que producir el documento que pide, listo para que el responsable lo revise y lo entregue en Word.

${brief ? `BRIEF DEL RESPONSABLE (quién pide, qué servicio, qué esperan):
"""
${brief}
"""` : 'BRIEF DEL RESPONSABLE: no ha escrito nada; todo lo que hay que saber está en el adjunto.'}
${adjunto ? `
ADJUNTO (fichero: ${adjunto.filename}):
"""
${adjunto.texto}
"""` : ''}

${guiaPorKind(kind)}
${guiaAdjunto(adjunto, pista)}

CÓMO HACERLO
- Ponle un título real al documento, con el nombre del destinatario si consta.
- Personalízalo al destinatario: nómbralo y responde a lo que pide, no a un pliego genérico.
- Entre ${lim.minSecciones} y ${lim.maxSecciones} secciones${lim.maxPalabras ? `, ${lim.maxPalabras} palabras como máximo en total` : ''}. Ninguna sección vacía ni de relleno: si no hay nada real que decir en una, no la escribas.

${disenadas ? `${disenadas}\n\n` : ''}REGLAS INNEGOCIABLES
- Todo hecho (flota, plantilla, certificaciones, KPIs, plazos, sedes, sistemas) sale del CLIENT KNOWLEDGE o del BRAND CONTEXT. Lo que no consta se escribe como [FALTA: qué dato exacto] y se añade a "nota" de la sección. Un dato inventado en una oferta descalifica.
${pideTarifas ? '- El encargo pide TARIFAS o precios. NO escribas ninguna cifra de precio. Deja la estructura de servicios y tramos que hay que tarificar y [FALTA: tarifa] en cada uno, y di en la nota que las fija el equipo comercial.' : ''}
- Las PAST SUBMITTED MEMORIAS son modelo de ESTRUCTURA y TONO, nunca fuente de cifras: sus números son de otros contratos y otros años. No copies ninguno. Sus órganos aparecen como [ÓRGANO ANTERIOR]; no nombres a ningún cliente anterior.
- Escribe SOLO en nombre de esta empresa (BRAND CONTEXT). Si el corpus menciona otras empresas del mismo grupo, no las presentes como la nuestra ni mezcles sus medios con los nuestros.
- Si dos fuentes dan cifras distintas, usa la más reciente y márcalo en la nota.
- Registro institucional, en español, sin humor.

Devuelve SOLO este JSON:
{
  "origen": ${adjunto ? '"peticion" | "borrador" | "otro"' : 'null'},
  "titulo": "título real del documento",
  "secciones": [{ "titulo": "…", "contenido": "texto en párrafos, con saltos de línea", "nota": "lo que el responsable debe confirmar o completar, o cadena vacía" }],
  "avisos": ["lo que faltaba en el corpus, lo que se ha asumido, lo que hay que revisar antes de entregar"]
}

${examplesText ? `PAST SUBMITTED MEMORIAS (STRUCTURE AND TONE ONLY):\n${examplesText}\n` : ''}
${brainBlock}

${knowledge ? `CLIENT KNOWLEDGE (real corpus):\n${knowledge}` : ''}

${GROUNDING_CONTRACT}`
}

/**
 * Nombres de las otras marcas del mismo grupo (mismo grupo de facturación o
 * mismo propietario). El corpus de una marca hermana puede colarse en el prompt
 * vía memorias compartidas y el modelo firmar la oferta como la otra empresa:
 * se comprueba a la salida, con datos de la BD y no con nombres en el código.
 */
async function marcasHermanas(clientId: string): Promise<string[]> {
  try {
    const db = adminClient()
    const { data: me } = await db.from('clients').select('id,name,billing_group_id,owner_email').eq('id', clientId).maybeSingle()
    if (!me) return []
    let q = db.from('clients').select('id,name').neq('id', clientId)
    if (me.billing_group_id) q = q.eq('billing_group_id', me.billing_group_id)
    else if (me.owner_email) q = q.eq('owner_email', me.owner_email)
    else return []
    const { data } = await q.limit(20)
    return (data || []).map((c) => String(c.name || '').trim()).filter((n) => n.length >= 3)
  } catch {
    return []
  }
}

export async function generarDesdeBrief(opts: {
  clientId: string
  brief: string
  kind?: KindLibre
  adjunto?: AdjuntoLibre
}): Promise<DocumentoLibre> {
  const { clientId } = opts
  const kind: KindLibre = opts.kind && esKindLibre(opts.kind) ? opts.kind : 'memoria'
  const brief = opts.brief.trim().slice(0, 40_000)
  const adjunto: AdjuntoLibre | undefined = opts.adjunto && opts.adjunto.texto.trim()
    ? { filename: String(opts.adjunto.filename || 'adjunto').slice(0, 200), texto: opts.adjunto.texto.trim().slice(0, ADJUNTO_MAX) }
    : undefined
  if (!brief && !adjunto) throw new Error('Hace falta un brief o un fichero adjunto')

  const textoEncargo = `${brief}\n${adjunto?.texto || ''}`
  // El brain va primero: su brandName es texto LEGÍTIMO para el enmascarado de
  // las memorias de ejemplo (la propia marca no es un «órgano anterior»).
  const brain = await fetchBrandBrain(clientId)
  const [knowledge, examples, hermanas, disenadas] = await Promise.all([
    getKnowledgeContext(clientId, {
      query: `${brief.slice(0, 1200)} ${adjunto ? adjunto.texto.slice(0, 800) : ''} servicios medios flota equipo certificaciones calidad KPIs incidencias trazabilidad puesta en marcha`,
      charBudget: 6000,
      documentBudget: 26000,
      fetchLimit: 2000,
    }),
    loadMemoriaExamples(clientId, null, null, { pliegoActual: textoEncargo, legitimos: [brain?.brandName] }),
    marcasHermanas(clientId),
    loadDisenadas(adminClient(), clientId).catch((): Disenada[] => []),
  ])
  const brainBlock = brain ? `BRAND CONTEXT (the company's own facts, voice and document_system):\n${formatBrandBrainForPrompt(brain)}` : ''
  // En una oferta siempre se aplica la regla de tarifas: es su razón de ser.
  const pideTarifas = kind === 'oferta' || /tarifa|precio|presupuesto|coste|importe|€/i.test(textoEncargo)
  const pista = adjunto ? pistaOrigen(adjunto.texto, brain?.brandName) : null

  const prompt = construirPromptLibre({ brief, kind, adjunto, pista, pideTarifas, examplesText: examples.text, brainBlock, knowledge: knowledge ?? '', disenadas: bloqueDisenadasPrompt(disenadas) })

  const msg = await createMessageForClient(clientId, 'tender/libre', {
    model: MODEL, max_tokens: techoSalida(MODEL, 16000), ...ajustesModelo(MODEL),
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  if (msg.stop_reason === 'max_tokens') throw new Error('El documento se ha cortado a medias por su longitud: vuelve a generarlo')
  const parsed = extractJson(text) as { origen?: unknown; titulo?: string; secciones?: DocSection[]; avisos?: string[] } | null
  const crudas = parsed && Array.isArray(parsed.secciones) ? parsed.secciones : null
  if (!parsed || !crudas?.length || !crudas.every((s) => s && typeof s.titulo === 'string' && typeof s.contenido === 'string')) {
    throw new Error('El documento generado no tiene una estructura válida: vuelve a generarlo')
  }
  // Los avisos del modelo y los de TS van SEPARADOS: los de TS (importes
  // sustituidos, marca cruzada, órgano colado) son comprobaciones y no se
  // recortan nunca; con un solo array y slice(0,16) al final, doce avisos del
  // modelo dejaban fuera precisamente esos.
  const avisosModelo: string[] = Array.isArray(parsed.avisos) ? parsed.avisos.map(String).slice(0, 12) : []
  const avisos: string[] = [...examples.avisos]
  // Marcas de páginas diseñadas: el modelo marca, TS valida.
  const marcasRaras: string[] = []
  for (const sec of crudas) {
    const m = normalizarMarcadores(sec.contenido, disenadas)
    sec.contenido = m.texto
    marcasRaras.push(...m.desconocidas)
  }
  if (marcasRaras.length) avisos.push(`El redactor citó páginas diseñadas que no existen (${marcasRaras.slice(0, 3).map((x) => `«${x}»`).join(', ')}): se han quitado.`)

  // --- Lo que TS comprueba de lo que se le pidió al modelo ---

  // 0) Origen del adjunto: lo marca el modelo; TS lo valida y lo cuenta.
  let origen: OrigenAdjunto | null = null
  if (adjunto) {
    origen = parsed.origen === 'peticion' || parsed.origen === 'borrador' || parsed.origen === 'otro' ? parsed.origen : (pista ?? 'otro')
    if (origen === 'borrador') {
      // Estructura base = el borrador. Si el modelo ha dejado por el camino la
      // mayoría de las cabeceras detectadas, no la ha conservado: se avisa.
      const cabs = cabecerasDe(adjunto.texto)
      if (cabs.length >= 3) {
        const titulos = crudas.map((s) => s.titulo.toLowerCase())
        const conservadas = cabs.filter((c) => {
          const clave = c.replace(/^(\d+(\.\d+)*[.)]?|[IVX]+[.)]|[A-Z][.)])\s+/, '').toLowerCase().slice(0, 30)
          return clave.length >= 4 && titulos.some((t) => t.includes(clave.slice(0, 18)))
        })
        if (conservadas.length < Math.ceil(cabs.length / 2)) {
          avisos.push(`El adjunto se ha tratado como vuestro borrador, pero el documento no sigue su estructura (${conservadas.length} de ${cabs.length} apartados reconocidos): compara los apartados antes de entregar.`)
        }
      }
      avisos.unshift(`«${adjunto.filename}» se ha tratado como VUESTRO BORRADOR: se conserva su estructura y el contenido se ha rehecho con el corpus.`)
    } else if (origen === 'peticion') {
      avisos.unshift(`«${adjunto.filename}» se ha tratado como LA PETICIÓN del cliente: sus apartados son las secciones del documento.`)
    } else {
      avisos.unshift(`«${adjunto.filename}» no parecía ni la petición ni un borrador vuestro: se ha usado como contexto y se ha seguido el brief.`)
    }
  }

  // 1) Secciones sin contenido: fuera, y se dice cuáles.
  const vacias = crudas.filter((s) => s.contenido.trim().length < 20)
  let secciones = crudas.filter((s) => s.contenido.trim().length >= 20)
  if (vacias.length) avisos.push(`Se han quitado ${vacias.length} sección(es) sin contenido: ${vacias.map((s) => `«${s.titulo.slice(0, 60)}»`).join(', ')}.`)
  if (!secciones.length) throw new Error('El documento generado no tiene ninguna sección con contenido: vuelve a generarlo')

  // 2) Límites por tipo (número de secciones, palabras en una carta).
  const lim = LIMITES[kind]
  if (secciones.length > lim.maxSecciones) {
    avisos.push(`Un documento de tipo «${kind}» debería tener como máximo ${lim.maxSecciones} secciones y este tiene ${secciones.length}: se han conservado las ${lim.maxSecciones} primeras.`)
    secciones = secciones.slice(0, lim.maxSecciones)
  }
  if (lim.maxPalabras) {
    const palabras = secciones.reduce((n, s) => n + s.contenido.split(/\s+/).filter(Boolean).length, 0)
    if (palabras > lim.maxPalabras) avisos.push(`La carta tiene ${palabras} palabras y debería quedarse en ${lim.maxPalabras} como máximo: recórtala antes de enviarla.`)
  }

  // 3) Órganos de memorias anteriores que se hayan colado.
  const colados = organosColados({ titulo: parsed.titulo, secciones }, examples.organos, textoEncargo)
  if (colados.length) avisos.push(`El documento menciona ${colados.map((o) => `«${o}»`).join(', ')}, que es el cliente de una memoria anterior usada como ejemplo: revísalo.`)

  // 4) Precios. En una OFERTA se corta: cualquier importe pasa a [FALTA: tarifa]
  //    y cualquier % de descuento a [FALTA: descuento], en título, contenido y
  //    nota (antes solo en el contenido, y la nota y el título llegan al Word
  //    igual). En el resto, si se pidieron tarifas, se avisa.
  let tituloDoc = String(parsed.titulo || 'Documento')
  if (kind === 'oferta') {
    let sustituidos = 0
    let descuentos = 0
    let dudosos = 0
    const sanear = (t: string): string => {
      const imp = sanearImportes(t)
      const pct = sanearPorcentajes(imp.texto)
      sustituidos += imp.n; descuentos += pct.n; dudosos += pct.dudosos
      return pct.texto
    }
    tituloDoc = sanear(tituloDoc)
    secciones = secciones.map((s) => ({ ...s, contenido: sanear(s.contenido), ...(s.nota ? { nota: sanear(String(s.nota)) } : {}) }))
    if (sustituidos) avisos.push(`Se han sustituido ${sustituidos} importe(s) por [FALTA: tarifa]: MIRA no fija precios en una oferta; los pone el equipo comercial.`)
    if (descuentos) avisos.push(`Se han sustituido ${descuentos} porcentaje(s) de descuento por [FALTA: descuento]: los descuentos los fija el equipo comercial.`)
    if (dudosos) avisos.push(`El documento contiene ${dudosos} porcentaje(s) que no parecen descuentos (KPIs, niveles de servicio): comprueba que ninguno sea una rebaja de precio.`)
  } else if (pideTarifas && secciones.some((s) => tieneImporte(`${s.titulo} ${s.contenido} ${s.nota || ''}`))) {
    avisos.push('Aparece alguna cifra con € en el texto: el encargo pedía tarifas y MIRA no debe fijarlas. Compruébalo con el equipo comercial.')
  }

  // 5) Marca cruzada: el documento habla de una empresa hermana del grupo que
  //    el encargo no nombraba.
  const salida = JSON.stringify({ titulo: tituloDoc, secciones }).toLowerCase()
  const encargoLower = textoEncargo.toLowerCase()
  const propia = (brain?.brandName || '').toLowerCase()
  const cruzadas = hermanas.filter((h) => {
    const k = h.toLowerCase()
    // Si un nombre contiene al otro (la marca y su delegación) no es cruce.
    const solapa = !!propia && (propia.includes(k) || k.includes(propia))
    return !solapa && salida.includes(k) && !encargoLower.includes(k)
  })
  if (cruzadas.length) avisos.push(`El documento nombra a ${cruzadas.map((h) => `«${h}»`).join(', ')}, otra empresa del grupo que el encargo no mencionaba: comprueba que no se han mezclado medios o datos de otra marca.`)

  return {
    titulo: tituloDoc.slice(0, 200),
    secciones: secciones.map((s) => ({ titulo: s.titulo.slice(0, 200), contenido: s.contenido, ...(s.nota ? { nota: String(s.nota).slice(0, 1000) } : {}) })),
    // Los de TS primero y enteros; el recorte solo alcanza a los del modelo.
    avisos: [...avisos, ...avisosModelo].slice(0, Math.max(20, avisos.length)),
    origen,
  }
}
