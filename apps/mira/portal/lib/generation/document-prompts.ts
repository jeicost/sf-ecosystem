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
}

export async function getDocumentPrompt(
  docType: string,
  params: DocPromptParams
): Promise<string | null> {
  const { clientId, inputData, projectId } = params

  const [brandBrain, memoryContext, docContext, feedbackBlock] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId, projectId ?? null),
    retrieveAgentContext({ client_id: clientId, context_type: 'all', limit: 3, project_id: projectId ?? null }),
    getFeedbackBlock(clientId, docType),
  ])

  const brandContext = brandBrain
    ? `
BRAND CONTEXT (source of truth — usa esto en todo el documento):
- Nombre: ${brandBrain.brandName}
- Misión: ${brandBrain.mission}
- Pilares: ${brandBrain.pillars.map((p) => `${p.name} (${p.description})`).join('; ')}
- Tono de voz: ${formatTone(brandBrain.toneOfVoice)}
- Audiencias: ${brandBrain.audiences ? JSON.stringify(brandBrain.audiences) : 'No definidas'}
`
    : ''

  const docText = docContext?.documents?.map((d: { excerpt?: string }) => d.excerpt).join('\n') || ''
  const allContext = [docText, brandContext, memoryContext, feedbackBlock].filter(Boolean).join('\n\n')
  const fullContext = allContext ? `\n\nCONTEXTO DEL CLIENTE:\n${allContext}` : ''

  // Contexto común de los 4 tipos de documento: brief + contexto de cliente + contratos de calidad (veracidad + redacción).
  const input = `\nBRIEF DEL USUARIO:\n${JSON.stringify(inputData, null, 2)}\n${fullContext}\n\n${GROUNDING_CONTRACT}\n\n${EDITORIAL_CONTRACT}`

  switch (docType) {
    case 'doc-playbook':
      return `Eres un consultor senior que escribe playbooks operativos premium. Genera un playbook completo, accionable y específico para esta marca (nada genérico). Todo el contenido en ESPAÑOL.
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
- "tiers" para presupuesto o planes por tramo (nunca inventes precios que no estén en el brief/contexto — usa '[COMPLETAR: dato real]' si falta el precio).
- "funnel" para un proceso de conversión con etapas secuenciales (awareness → consideración → conversión, o similar).
- "timeline" para un cronograma/calendario de ejecución con periodos.
- "checklist" para requisitos o tareas que se marcan como hechas/pendientes (distinto de "tips", que son consejos, no tareas).
- "statusTable" en vez de "table" cuando cada fila tiene un estado claro (bien/en riesgo/mal) — status debe ser "good", "warning" o "critical".`

    case 'doc-deck':
      return `Eres un consultor de presentaciones ejecutivas. Genera un dossier/presentación 16:9 para esta marca, listo para presentar a clientes o inversores. Todo en ESPAÑOL.
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
      return `Eres un analista que redacta informes de resultados periódicos. Genera un informe de resultados claro y honesto para esta marca con los datos que aporte el usuario (si faltan datos, deja los valores como "—" y céntrate en la estructura narrativa). Todo en ESPAÑOL.
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
      return `Eres un estratega comercial. Genera un one-pager de ventas de UNA sola página para esta marca: denso en valor, cero relleno. Todo en ESPAÑOL.
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
Máximo 5 secciones, textos cortos: todo debe caber en una página impresa. Usa "tiers" para Servicios/Planes cuando haya precios o paquetes diferenciados; si no los hay, usa "table" en su lugar. Nunca inventes un precio que no esté en el brief — usa '[COMPLETAR: dato real]'.`

    default:
      return null
  }
}
