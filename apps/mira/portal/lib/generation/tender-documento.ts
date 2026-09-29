import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson } from '@/lib/generation/extract-json'
import { getKnowledgeContext } from '@/lib/knowledge'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { limpiarMaquetacion, trocearPorPaginas, cortarPorAnclas } from '@/lib/tenders/secciones'

// Trabajar SOBRE un documento, no solo generarlo desde cero.
//
// Dos operaciones, y las dos con la misma regla de fondo que la memoria: en una
// oferta pública un dato inventado descalifica, así que el modelo puede
// reescribir, ordenar y afinar lo que ya hay, pero no puede AÑADIR hechos que
// no estén ni en el documento ni en el corpus de la empresa. Lo que falte se
// marca, no se rellena.
//
//   estructurarDocumento  un Word/PDF suelto → título + secciones editables
//   reescribirSeccion     una sección + una instrucción → esa sección, mejor

const MODEL = 'claude-opus-4-8'

export interface DocSection {
  titulo: string
  contenido: string
  criterio?: string
  puntos_objetivo?: number | null
  nota?: string
}

/**
 * El texto crudo de un documento subido, convertido en secciones editables.
 *
 * El modelo NO reescribe el documento: solo dice dónde empieza cada sección,
 * copiando sus primeras palabras, y TypeScript corta el texto ORIGINAL por ahí.
 * La primera versión le pedía devolver el documento entero en el JSON: con una
 * memoria de 60.000 caracteres la respuesta superaba el máximo de salida, se
 * cortaba, y el plan B se quedaba con los primeros 20.000 — dos tercios del
 * documento perdidos sin avisar. Así la respuesta mide unas pocas líneas sea
 * cual sea el documento, y el texto sale entero y literal.
 *
 * Si el modelo falla o sus anclas no se encuentran, el troceado por páginas
 * (sin modelo) hace el trabajo. Nunca se devuelve un documento recortado.
 */
export async function estructurarDocumento(opts: {
  clientId: string
  texto: string
  filename?: string
}): Promise<{ titulo: string; secciones: DocSection[] }> {
  const { clientId, filename } = opts
  const limpio = limpiarMaquetacion(opts.texto)
  const plano = limpio.replace(/\f/g, '\n')
  const porPaginas = () => {
    const secs = trocearPorPaginas(opts.texto)
    return secs.length ? secs : [{ titulo: filename || 'Documento', contenido: plano }]
  }

  const prompt = `Eres quien prepara la documentación técnica de licitaciones de esta empresa.

Te doy el texto de un documento (${filename || 'sin nombre'}), ya limpio de marcas de página. Necesito saber cómo se divide en SECCIONES de trabajo.

NO reescribas nada. Para cada sección, dime su título y copia LITERALMENTE sus primeras 8-12 palabras tal como aparecen en el texto (para poder localizarla). Respeta el orden del documento.

- Usa las secciones que el propio documento tiene; no inventes estructura.
- Salta portada, índice y páginas de solo rótulos: no son secciones de trabajo.
- Si una sección ocupa varias páginas, es UNA sección.

Devuelve SOLO este JSON:
{
  "titulo": "título real del documento",
  "secciones": [{ "titulo": "…", "empieza": "primeras palabras copiadas literalmente" }]
}

TEXTO:
${plano.slice(0, 150_000)}`

  try {
    const msg = await createMessageForClient(clientId, 'tender/estructurar', {
      model: MODEL, max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
    const parsed = extractJson(text) as { titulo?: string; secciones?: { titulo: string; empieza: string }[] } | null
    const anclas = Array.isArray(parsed?.secciones) ? parsed!.secciones : []
    const secciones = cortarPorAnclas(plano, anclas)
    // Si las anclas cubren poco del documento, algo ha ido mal: mejor el
    // troceado por páginas, que no pierde nada.
    const cubierto = secciones.reduce((a, s) => a + s.contenido.length, 0)
    if (secciones.length >= 2 && cubierto >= plano.length * 0.6) {
      return { titulo: parsed?.titulo || filename || 'Documento', secciones }
    }
  } catch (err) {
    console.error('[tender/estructurar] el modelo falló, troceo por páginas', err)
  }
  return { titulo: filename?.replace(/\.(pdf|docx|txt|md)$/i, '') || 'Documento', secciones: porPaginas() }
}

/**
 * Reescribe UNA sección siguiendo una instrucción del operador.
 *
 * Recibe el contexto que hace que la reescritura sirva de algo: el criterio del
 * pliego al que responde esa sección (si lo hay), las demás secciones del
 * documento —para no repetir ni contradecirse— y el corpus real de la empresa,
 * que es de donde puede sacar datos. Si la instrucción pide un dato que no está
 * en ninguna parte, el contrato obliga a marcarlo, no a inventarlo.
 */
export async function reescribirSeccion(opts: {
  clientId: string
  seccion: DocSection
  instruccion: string
  tituloDocumento?: string
  otrasSecciones?: { titulo: string }[]
  criterioTexto?: string | null
}): Promise<{ contenido: string; avisos: string[] }> {
  const { clientId, seccion, instruccion, tituloDocumento, otrasSecciones, criterioTexto } = opts

  const knowledge = await getKnowledgeContext(clientId, {
    // La búsqueda combina el tema de la sección, lo que se pide y el criterio:
    // así "añade los KPIs" encuentra las secciones de KPIs del corpus.
    query: `${seccion.titulo} ${instruccion} ${criterioTexto || ''} ${seccion.contenido.slice(0, 400)}`.slice(0, 1500),
    charBudget: 4000,
    documentBudget: 18000,
    fetchLimit: 2000,
  })

  const prompt = `Eres quien redacta las memorias técnicas de licitación de esta empresa.

Reescribe UNA sección siguiendo la instrucción del responsable. No toques nada más.

DOCUMENTO: ${tituloDocumento || '(sin título)'}
${otrasSecciones?.length ? `OTRAS SECCIONES (para no repetir ni contradecir): ${otrasSecciones.map((s) => s.titulo).join(' · ')}` : ''}
${criterioTexto ? `CRITERIO DEL PLIEGO AL QUE RESPONDE ESTA SECCIÓN:\n${criterioTexto}` : ''}

SECCIÓN ACTUAL — "${seccion.titulo}":
${seccion.contenido}

INSTRUCCIÓN DEL RESPONSABLE:
${instruccion}

REGLAS INNEGOCIABLES
- Todo hecho concreto (cifras, certificaciones, flota, plazos, KPIs, nombres) tiene que salir del texto actual o del conocimiento de la empresa que te doy abajo. Si la instrucción pide algo que no consta, escribe [FALTA: qué dato exacto hace falta] en su sitio y avísalo. Un dato inventado descalifica la oferta entera.
- Mantén el registro institucional del documento. Nada de humor ni de marketing.
- No cambies el idioma ni el tratamiento.
- Si la instrucción es imposible de cumplir con lo que hay, hazlo lo mejor que puedas y dilo en "avisos".

Devuelve SOLO este JSON:
{
  "contenido": "la sección reescrita, en texto plano con saltos de línea",
  "avisos": ["lo que ha faltado o lo que el responsable debe revisar"]
}

${knowledge ? `CONOCIMIENTO REAL DE LA EMPRESA:\n${knowledge}` : ''}

${GROUNDING_CONTRACT}`

  const msg = await createMessageForClient(clientId, 'tender/reescribir', {
    model: MODEL, max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  const parsed = extractJson(text) as { contenido?: string; avisos?: string[] } | null
  if (!parsed?.contenido || typeof parsed.contenido !== 'string') {
    throw new Error('La reescritura no ha devuelto texto utilizable')
  }
  return { contenido: parsed.contenido, avisos: Array.isArray(parsed.avisos) ? parsed.avisos.slice(0, 8) : [] }
}
