// Prompts del Centro de Documentos — 4 tipos de documento generados con Brand Brain.
// Cada prompt devuelve JSON con el shape que consumen las plantillas de lib/export/templates.

import { fetchBrandBrain } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { retrieveAgentContext } from '@/lib/agent-context'

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
}

export async function getDocumentPrompt(
  docType: string,
  params: DocPromptParams
): Promise<string | null> {
  const { clientId, inputData } = params

  const [brandBrain, memoryContext, docContext] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId),
    retrieveAgentContext({ client_id: clientId, context_type: 'all', limit: 3 }),
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
  const allContext = [docText, brandContext, memoryContext].filter(Boolean).join('\n\n')
  const fullContext = allContext ? `\n\nCONTEXTO DEL CLIENTE:\n${allContext}` : ''

  const input = `\nBRIEF DEL USUARIO:\n${JSON.stringify(inputData, null, 2)}\n${fullContext}`

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
      "table": {"headers": [], "rows": []}
    }
  ]
}
Incluye 6-9 secciones: contexto/diagnóstico, estrategia, 3-5 secciones de ejecución con steps y tips, métricas de éxito con stats, y cierre con próximos pasos. Usa stats/tips/steps/table solo donde aporten (omite las keys que no uses en cada sección).`

    case 'doc-deck':
      return `Eres un consultor de presentaciones ejecutivas. Genera un dossier/presentación 16:9 para esta marca, listo para presentar a clientes o inversores. Todo en ESPAÑOL.
${input}

Devuelve SOLO este JSON:
{
  "title": "Título de la presentación",
  "subtitle": "Subtítulo",
  "slides": [
    {"layout": "cover", "title": "", "subtitle": ""},
    {"layout": "section", "title": "Nombre del bloque", "subtitle": "Qué cubre"},
    {"layout": "content", "title": "", "body": "Párrafo breve en HTML simple", "bullets": ["punto 1", "punto 2"]},
    {"layout": "stats", "title": "", "stats": [{"value": "", "label": ""}]},
    {"layout": "closing", "title": "Cierre / CTA", "subtitle": ""}
  ]
}
Genera 10-16 slides: cover, 3-4 bloques de sección con sus slides de contenido, al menos 2 slides de stats con cifras concretas, y closing con llamada a la acción. Máximo 4 bullets por slide, frases cortas de presentación (no párrafos largos).`

    case 'doc-results':
      return `Eres un analista que redacta informes de resultados periódicos. Genera un informe de resultados claro y honesto para esta marca con los datos que aporte el usuario (si faltan datos, deja los valores como "—" y céntrate en la estructura narrativa). Todo en ESPAÑOL.
${input}

Devuelve SOLO este JSON:
{
  "title": "Informe de Resultados — [periodo]",
  "subtitle": "Periodo cubierto",
  "sections": [
    {"title": "Resumen Ejecutivo", "body": "<p>...</p>", "stats": [{"value": "", "label": ""}]},
    {"title": "Resultados por Área", "table": {"headers": ["Área", "Objetivo", "Resultado", "Estado"], "rows": []}},
    {"title": "Lo que funcionó", "tips": []},
    {"title": "Lo que no funcionó", "tips": []},
    {"title": "Aprendizajes", "body": ""},
    {"title": "Plan del próximo periodo", "steps": [{"title": "", "body": ""}]}
  ]
}
Ajusta secciones al contenido real disponible; añade stats donde haya cifras.`

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
    {"title": "Servicios / Planes", "table": {"headers": [], "rows": []}},
    {"title": "Siguiente paso", "body": "<p>CTA claro con contacto</p>"}
  ]
}
Máximo 5 secciones, textos cortos: todo debe caber en una página impresa.`

    default:
      return null
  }
}
