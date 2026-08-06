// Prompts del Centro de Documentos — 4 tipos de documento generados con Brand Brain.
// Cada prompt devuelve JSON con el shape que consumen las plantillas de lib/export/templates.

import { fetchBrandBrain } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getFeedbackBlock } from '@/lib/feedback'
import { retrieveAgentContext } from '@/lib/agent-context'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { EDITORIAL_CONTRACT } from '@/lib/grounding/editorial-contract'

// tone_of_voice may be a plain string or an object — never spread a string into chars
function formatTone(tone: unknown): string {
  if (!tone) return 'Not defined'
  if (typeof tone === 'string') return tone
  if (typeof tone === 'object') {
    return Object.entries(tone as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
  }
  return String(tone)
}


export const DOC_TYPES = ['doc-playbook', 'doc-deck', 'doc-results', 'doc-onepager'] as const
export type DocType = (typeof DOC_TYPES)[number]

export interface DocPromptParams {
  clientId: string
  inputData: Record<string, unknown>
  /** Proyecto activo — la memoria inyectada prioriza este proyecto */
  projectId?: string | null
  /** Resultados de búsqueda web reales sobre el "Tema" del brief (ver app/api/documents/generate/route.ts) — datos externos que ni el Brand Brain ni la memoria de proyecto pueden tener. */
  sourcesBlock?: string
  /**
   * Idioma del ENTREGABLE, en lenguaje natural ('English', 'Spanish',
   * 'Thai'...). Antes los 4 tipos de documento llevaban escrito "Todo el
   * contenido en ESPAÑOL", así que un brief redactado en inglés producía un
   * deck entero en español (caso real: la presentación de food truck de Salsa
   * del 2026-08-05). Por defecto inglés, que es el idioma del portal; el chat
   * de generación lo pregunta y lo pasa aquí.
   */
  outputLanguage?: string
}

export async function getDocumentPrompt(
  docType: string,
  params: DocPromptParams
): Promise<string | null> {
  const { clientId, inputData, projectId, sourcesBlock } = params
  const outputLanguage = (params.outputLanguage || '').trim() || 'English'
  const languageRule = `Write ALL of the document's content in ${outputLanguage}. This applies to every title, body, bullet, label and caption — do not mix languages. The JSON keys stay in English exactly as specified below; only the values are translated.`

  const [brandBrain, memoryContext, docContext, feedbackBlock] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId, projectId ?? null),
    retrieveAgentContext({ client_id: clientId, context_type: 'all', limit: 3, project_id: projectId ?? null }),
    getFeedbackBlock(clientId, docType),
  ])

  const brandContext = brandBrain
    ? `
BRAND CONTEXT (source of truth — use this throughout the document):
- Name: ${brandBrain.brandName}
- Mission: ${brandBrain.mission}
- Pillars: ${brandBrain.pillars.map((p) => `${p.name} (${p.description})`).join('; ')}
- Tone of voice: ${formatTone(brandBrain.toneOfVoice)}
- Audiences: ${brandBrain.audiences ? JSON.stringify(brandBrain.audiences) : 'Not defined'}
`
    : ''

  const docText = docContext?.documents?.map((d: { excerpt?: string }) => d.excerpt).join('\n') || ''
  const allContext = [docText, brandContext, memoryContext, feedbackBlock].filter(Boolean).join('\n\n')
  const fullContext = allContext ? `\n\nCLIENT CONTEXT:\n${allContext}` : ''
  const researchContext = sourcesBlock ? `\n\nREAL RESEARCH ON THE TOPIC (use it for concrete external facts — figures, examples, real trends; never ignore it when the brief needs them):\n${sourcesBlock}` : ''

  // Este Centro de Documentos genera SIEMPRE guías/artefactos internos de
  // negocio (estrategia, presentación, informe, one-pager) — nunca la pieza
  // de contenido final lista para publicar (una newsletter, un post, un
  // artículo). Encontrado un caso real (2026-07-30, Dadybox) donde el "Tema"
  // pedía claramente el contenido de una edición de newsletter y el playbook
  // generó una guía de "cómo escribir esto" en vez de esa edición -- técnicamente
  // correcto para lo que este tipo de documento ES, pero no lo que el usuario
  // esperaba y sin ningún aviso. Esta regla hace el desajuste explícito en vez
  // de silencioso.
  const scopeCheck = `\n\nIMPORTANT — scope of this document: this is ALWAYS an internal business artefact (operating guide, presentation, report or one-pager), NEVER the finished, ready-to-publish content piece. If the "Topic"/brief below clearly describes a specific piece to publish (a newsletter, a post, an article, a script) rather than a business process or strategy, add a short honest notice as the FIRST section of the document: that this is a guide on how to approach that content, not the content itself, and that to generate the ready-to-publish piece they should use Quick Actions (crear_newsletter/crear_post/etc.) in MIRA. Then carry on with the rest of the document anyway (the guide/strategy is still useful).`

  // Contexto común de los 4 tipos de documento: brief + contexto de cliente + contratos de calidad (veracidad + redacción).
  const input = `\nUSER BRIEF:\n${JSON.stringify(inputData, null, 2)}\n${fullContext}${researchContext}\n\n${GROUNDING_CONTRACT}\n\n${EDITORIAL_CONTRACT}${scopeCheck}`

  switch (docType) {
    case 'doc-playbook':
      return `You are a senior consultant who writes premium operating playbooks. Produce a complete, actionable playbook specific to this brand (nothing generic). ${languageRule}
${input}

Devuelve SOLO este JSON:
{
  "title": "Título del playbook (corto y potente)",
  "subtitle": "Subtítulo de una línea",
  "sections": [
    {
      "title": "Nombre de la sección",
      "body": "2-4 párrafos de contenido en HTML simple (<p>, <strong>)",
      "stats": [{"value": "", "label": ""}],
      "tips": ["Consejo accionable 1", "Consejo 2"],
      "steps": [{"title": "Paso 1: ...", "body": "Cómo ejecutarlo"}],
      "table": {"headers": [], "rows": []},
      "tiers": [{"name": "Plan/tramo", "price": "€X/mes", "includes": ["Qué incluye 1", "Qué incluye 2"]}],
      "funnel": [{"stage": "Nombre de la etapa", "description": "Qué pasa en esta etapa"}],
      "timeline": [{"period": "Semana 1 / Mes 1 / Q1", "items": ["Qué ocurre en este periodo"]}],
      "checklist": [{"item": "Tarea a verificar", "note": "Detalle opcional"}],
      "statusTable": {"headers": ["Columna 1", "Columna 2"], "rows": [{"cells": ["valor 1", "valor 2"], "status": "good"}]}
    }
  ]
}
Incluye 6-9 secciones: contexto/diagnóstico, estrategia, 3-5 secciones de ejecución con steps y tips, métricas de éxito con stats, y cierre con próximos pasos. Usa cada bloque SOLO donde el contenido encaje de forma natural (omite las keys que no uses en cada sección):
- "tiers" para presupuesto o planes por tramo (nunca inventes precios que no estén en el brief/contexto — usa '[MISSING: real data]' si falta el precio).
- "funnel" para un proceso de conversión con etapas secuenciales (awareness → consideración → conversión, o similar).
- "timeline" para un cronograma/calendario de ejecución con periodos.
- "checklist" para requisitos o tareas que se marcan como hechas/pendientes (distinto de "tips", que son consejos, no tareas).
- "statusTable" en vez de "table" cuando cada fila tiene un estado claro (bien/en riesgo/mal) — status debe ser "good", "warning" o "critical".`

    case 'doc-deck':
      return `You are an executive presentation consultant. Produce a 16:9 deck for this brand, ready to present to clients or investors. ${languageRule}
${input}

Devuelve SOLO este JSON:
{
  "title": "Título de la presentación",
  "subtitle": "Subtítulo",
  "slides": [
    {"layout": "cover", "title": "", "subtitle": "", "image_prompt": "descripción visual para la imagen de fondo de portada (escena/concepto, sin texto)"},
    {"layout": "agenda", "title": "Agenda", "items": ["Punto 1", "Punto 2", "Punto 3"]},
    {"layout": "section", "title": "Nombre del bloque", "subtitle": "Qué cubre"},
    {"layout": "content", "title": "", "body": "Párrafo breve en HTML simple", "bullets": ["punto 1", "punto 2"]},
    {"layout": "stats", "title": "", "stats": [{"value": "", "label": ""}]},
    {"layout": "timeline", "title": "Roadmap", "items": [{"label": "Q1", "title": "Hito", "body": "1 frase"}]},
    {"layout": "comparison", "title": "Antes vs. Después", "left": {"title": "Opción A", "bullets": ["..."]}, "right": {"title": "Opción B", "bullets": ["..."]}},
    {"layout": "quote", "title": "", "quote": "Cita potente de 1-2 frases", "author": "Nombre, cargo"},
    {"layout": "image", "title": "", "body": "Párrafo breve", "bullets": ["..."], "wants_image": true, "image_prompt": "descripción visual de la imagen (escena/concepto, sin texto)"},
    {"layout": "chart", "title": "", "subtitle": "", "chart": {"type": "bar", "labels": ["Ene", "Feb"], "data": [10, 20]}},
    {"layout": "closing", "title": "Cierre / CTA", "subtitle": ""}
  ]
}
Guía de layouts (usa cada uno con su shape exacto):
- "cover": portada. Incluye SIEMPRE "image_prompt" describiendo una imagen de fondo evocadora (sin texto ni logos).
- "agenda": índice numerado — "items" es un array de strings (3-7 puntos cortos).
- "section": separador de bloque con número gigante.
- "content": título + body/bullets (máx 4 bullets, frases cortas).
- "stats": cifras grandes — 2-4 stats con "value" corto ("+40%", "3x") y "label".
- "timeline": fases/roadmap — 3-5 "items" con {"label", "title", "body"} (label = fase/fecha corta).
- "comparison": dos columnas "left"/"right", cada una {"title", "bullets"} (2-4 bullets por lado).
- "quote": cita destacada — "quote" (1-2 frases) + "author" opcional.
- "image": imagen a un lado + texto al otro. Marca "wants_image": true y escribe "image_prompt" (descripción visual concreta, sin texto en la imagen). MÁXIMO 2 slides con wants_image en todo el deck.
- "chart": un gráfico — "chart" con "type" (bar|line|doughnut), "labels" (strings) y "data" (números). Úsalo solo si tienes cifras reales o del brief.

Genera 10-16 slides: cover, agenda, 3-4 bloques de sección con sus slides de contenido, al menos 2 slides de stats con cifras concretas, y closing con llamada a la acción. VARIEDAD OBLIGATORIA: incluye al menos 1 slide "timeline" o "comparison", y al menos 1 "quote" cuando el contenido lo permita. Máximo 4 bullets por slide, frases cortas de presentación (no párrafos largos).`

    case 'doc-results':
      return `You are an analyst who writes periodic results reports. Produce a clear, honest results report for this brand using the data the user provides (when data is missing, leave the values as "—" and focus on the narrative structure). ${languageRule}
${input}

Devuelve SOLO este JSON:
{
  "title": "Informe de Resultados — [periodo]",
  "subtitle": "Periodo cubierto",
  "sections": [
    {"title": "Resumen Ejecutivo", "body": "<p>...</p>", "stats": [{"value": "", "label": ""}]},
    {"title": "Resultados por Área", "statusTable": {"headers": ["Área", "Objetivo", "Resultado"], "rows": [{"cells": ["", "", ""], "status": "good"}]}},
    {"title": "Lo que funcionó", "tips": []},
    {"title": "Lo que no funcionó", "tips": []},
    {"title": "Aprendizajes", "body": ""},
    {"title": "Plan del próximo periodo", "timeline": [{"period": "", "items": []}]}
  ]
}
Ajusta secciones al contenido real disponible; añade stats donde haya cifras. Usa "status": "good" cuando el área alcanzó o superó el objetivo, "warning" si quedó cerca, "critical" si quedó lejos — nunca lo dejes en blanco si hay un resultado y un objetivo con los que compararlo.`

    case 'doc-onepager':
      return `You are a commercial strategist. Produce a ONE-page sales one-pager for this brand: dense with value, zero filler. ${languageRule}
${input}

Devuelve SOLO este JSON:
{
  "title": "Nombre de la marca / oferta",
  "subtitle": "Propuesta de valor en una frase",
  "sections": [
    {"title": "El problema", "body": "<p>2-3 frases</p>"},
    {"title": "La solución", "body": "<p>2-3 frases</p>", "tips": ["Beneficio 1", "Beneficio 2", "Beneficio 3"]},
    {"title": "Cifras clave", "stats": [{"value": "", "label": ""}]},
    {"title": "Servicios / Planes", "tiers": [{"name": "", "price": "", "includes": []}]},
    {"title": "Siguiente paso", "body": "<p>CTA claro con contacto</p>"}
  ]
}
Máximo 5 secciones, textos cortos: todo debe caber en una página impresa. Usa "tiers" para Servicios/Planes cuando haya precios o paquetes diferenciados; si no los hay, usa "table" en su lugar. Nunca inventes un precio que no esté en el brief — usa '[MISSING: real data]'.`

    default:
      return null
  }
}
