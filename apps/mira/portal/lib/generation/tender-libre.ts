import { createMessageForClient } from '@/lib/anthropic-client'
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
// Misma regla que la memoria: los hechos salen del corpus o se marcan [FALTA].
// Y una más, propia de este camino: si el encargo pide TARIFAS, no se inventa
// ni una cifra. Se deja la estructura de lo que hay que tarificar y el precio lo
// pone el equipo comercial.

const MODEL = 'claude-opus-4-8'

export interface DocumentoLibre {
  titulo: string
  secciones: DocSection[]
  avisos: string[]
}

export async function generarDesdeBrief(opts: {
  clientId: string
  brief: string
  filename?: string | null
}): Promise<DocumentoLibre> {
  const { clientId } = opts
  const brief = opts.brief.trim().slice(0, 40_000)

  const [brain, knowledge, examples] = await Promise.all([
    fetchBrandBrain(clientId),
    getKnowledgeContext(clientId, {
      query: `${brief.slice(0, 1200)} servicios medios flota equipo certificaciones calidad KPIs incidencias trazabilidad puesta en marcha`,
      charBudget: 6000,
      documentBudget: 26000,
      fetchLimit: 2000,
    }),
    loadMemoriaExamples(clientId, null),
  ])
  const brainBlock = brain ? `BRAND CONTEXT (the company's own facts, voice and document_system):\n${formatBrandBrainForPrompt(brain)}` : ''
  const pideTarifas = /tarifa|precio|presupuesto|coste|importe|€/i.test(brief)

  const prompt = `Eres quien redacta la documentación técnica y comercial de esta empresa de transporte y mensajería.

Te llega un ENCARGO en texto libre (no hay pliego). Tienes que producir el documento que pide, listo para que el responsable lo revise y lo entregue en Word.

ENCARGO${opts.filename ? ` (fichero: ${opts.filename})` : ''}:
"""
${brief}
"""

CÓMO HACERLO
- Primero decide qué documento pide el encargo (memoria técnica de la empresa, propuesta de servicios, respuesta a una petición de oferta…) y ponle un título real.
- Estructúralo con el esqueleto que la empresa usa en sus memorias presentadas (abajo): quiénes somos, servicios, medios humanos y materiales, procedimiento operativo, calidad y KPIs, gestión de incidencias, puesta en marcha, RSC, propuesta de valor — quedándote con lo que el encargo necesita y en el orden que pide.
- Personalízalo al destinatario del encargo: nómbralo y responde a lo que pide, no a un pliego genérico.
- Cada sección con sustancia: cifras, plazos, medios y compromisos REALES de la empresa.

REGLAS INNEGOCIABLES
- Todo hecho (flota, plantilla, certificaciones, KPIs, plazos, sedes, sistemas) sale del CLIENT KNOWLEDGE o del BRAND CONTEXT. Lo que no consta se escribe como [FALTA: qué dato exacto] y se añade a "nota" de la sección. Un dato inventado en una oferta descalifica.
${pideTarifas ? '- El encargo pide TARIFAS o precios. NO escribas ninguna cifra de precio. Deja una sección "Tarifas" con la estructura de servicios y tramos que hay que tarificar y [FALTA: tarifa] en cada uno, y di en la nota que las fija el equipo comercial.' : ''}
- Las PAST SUBMITTED MEMORIAS son modelo de ESTRUCTURA y TONO, nunca fuente de cifras: sus números son de otros contratos y otros años. No copies ninguno. Sus órganos aparecen como [ÓRGANO ANTERIOR]; no nombres a ningún cliente anterior.
- Si dos fuentes dan cifras distintas, usa la más reciente y márcalo en la nota.
- Registro institucional, en español, sin humor.

Devuelve SOLO este JSON:
{
  "titulo": "título real del documento",
  "secciones": [{ "titulo": "…", "contenido": "texto en párrafos, con saltos de línea", "nota": "lo que el responsable debe confirmar o completar, o cadena vacía" }],
  "avisos": ["lo que faltaba en el corpus, lo que se ha asumido, lo que hay que revisar antes de entregar"]
}

${examples.text ? `PAST SUBMITTED MEMORIAS (STRUCTURE AND TONE ONLY):\n${examples.text}\n` : ''}
${brainBlock}

${knowledge ? `CLIENT KNOWLEDGE (real corpus):\n${knowledge}` : ''}

${GROUNDING_CONTRACT}`

  const msg = await createMessageForClient(clientId, 'tender/libre', {
    model: MODEL, max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  if (msg.stop_reason === 'max_tokens') throw new Error('El documento se ha cortado a medias por su longitud: vuelve a generarlo')
  const parsed = extractJson(text) as { titulo?: string; secciones?: DocSection[]; avisos?: string[] } | null
  const secciones = parsed && Array.isArray(parsed.secciones) ? parsed.secciones : null
  if (!parsed || !secciones?.length || !secciones.every((s) => typeof s.titulo === 'string' && typeof s.contenido === 'string')) {
    throw new Error('El documento generado no tiene una estructura válida: vuelve a generarlo')
  }
  const avisos: string[] = Array.isArray(parsed.avisos) ? parsed.avisos.map(String).slice(0, 12) : []
  // TS comprueba lo que se le pidió al modelo: ni órganos anteriores ni precios si se pidieron tarifas.
  const colados = organosColados(parsed, examples.organos, brief)
  if (colados.length) avisos.push(`El documento menciona ${colados.map((o) => `«${o}»`).join(', ')}, que es el cliente de una memoria anterior usada como ejemplo: revísalo.`)
  if (pideTarifas && secciones.some((s) => /\d+[,.]\d{2}\s*€|\b\d+\s*€/.test(s.contenido))) {
    avisos.push('Aparece alguna cifra con € en el texto: el encargo pedía tarifas y MIRA no debe fijarlas. Compruébalo con el equipo comercial.')
  }
  return {
    titulo: (parsed.titulo || 'Documento').slice(0, 200),
    secciones: secciones.map((s) => ({ titulo: s.titulo.slice(0, 200), contenido: s.contenido, ...(s.nota ? { nota: String(s.nota).slice(0, 1000) } : {}) })),
    avisos,
  }
}
