// Prompts del Centro de Documentos — 4 tipos de documento generados con Brand Brain.
// Cada prompt devuelve JSON con el shape que consumen las plantillas de lib/export/templates.

import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getFeedbackBlock } from '@/lib/feedback'
import { retrieveAgentContext } from '@/lib/agent-context'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { REPORT_VOICE_CONTRACT } from '@/lib/grounding/report-voice-contract'
import { EDITORIAL_CONTRACT } from '@/lib/grounding/editorial-contract'
import { JUDGMENT_CONTRACT } from '@/lib/grounding/judgment-contract'

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

  // El Cerebro entra ENTERO (formatBrandBrainForPrompt: ~27 campos con
  // vocabulario, frases prohibidas, golden rule, oferta, what_flopped…).
  // Antes se recortaba a mano a 5 campos — el mismo bug que ya se corrigió en
  // Quick Actions (PROMPTS_AUDIT_2026_07) y que aquí seguía vivo: los
  // documentos, las piezas más caras del sistema, eran las que menos marca
  // recibían.
  const brandContext = brandBrain ? formatBrandBrainForPrompt(brandBrain) : ''

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
  const input = `\nUSER BRIEF:\n${JSON.stringify(inputData, null, 2)}\n${fullContext}${researchContext}\n\n${GROUNDING_CONTRACT}\n\n${JUDGMENT_CONTRACT}\n\n${EDITORIAL_CONTRACT}\n\n${REPORT_VOICE_CONTRACT}${scopeCheck}`

  switch (docType) {
    case 'doc-playbook':
      return `You are a senior consultant who writes premium operating playbooks. Produce a complete, actionable playbook specific to this brand (nothing generic). ${languageRule}
${input}

METHOD — work in this order. The order is the value; a playbook assembled section by section reads like a template.

1. DIAGNOSIS BEFORE PRESCRIPTION. Open from where this brand actually IS today, using the context — what they sell, to whom, with what team and rhythm. A playbook that starts prescribing without naming the current state is advice for a generic company. If the context does not say, write what you would need to know instead of assuming it.

2. THE "ANY BRAND" TEST ON EVERY SECTION. Ask of each section: would this read identically for a direct competitor? If yes, it is filler — rewrite it with this brand's specifics or delete it. Sections that survive only by naming the brand in the first line still fail.

3. STEPS ARE INSTRUCTIONS, NOT TOPICS. Every step says what to do, who does it, and how you know it is done. "Define the content strategy" is a topic; "Pick the three formats you can sustain weekly and drop the rest" is a step.

4. NUMBERS CARRY A BASELINE. A metric without a starting point cannot be managed. Each metric gets today's value and a target; when the context has no baseline, say plainly that measuring it is step one instead of inventing a figure.

5. SEQUENCE BY DEPENDENCY, NOT BY IMPORTANCE. Order the execution sections so each one is possible once the previous is done. If two things can run in parallel, say so.

6. NAME WHAT NOT TO DO. Close with what this brand should stop, avoid or postpone. A playbook that only adds work is a wish list — the hard, useful judgement is what comes off the table.

Return ONLY this JSON (the keys stay exactly as written; the example values below are placeholders — write all content in the output language):
{
  "title": "Playbook title (short and punchy)",
  "subtitle": "One-line subtitle",
  "sections": [
    {
      "title": "Section name",
      "body": "2-4 paragraphs of simple HTML (<p>, <strong>)",
      "stats": [{"value": "", "label": ""}],
      "tips": ["Actionable tip 1", "Tip 2"],
      "steps": [{"title": "Step 1: ...", "body": "How to execute it"}],
      "table": {"headers": [], "rows": []},
      "tiers": [{"name": "Plan/tier", "price": "€X/month", "includes": ["What it includes 1", "What it includes 2"]}],
      "funnel": [{"stage": "Stage name", "description": "What happens at this stage"}],
      "timeline": [{"period": "Week 1 / Month 1 / Q1", "items": ["What happens in this period"]}],
      "checklist": [{"item": "Task to verify", "note": "Optional detail"}],
      "statusTable": {"headers": ["Column 1", "Column 2"], "rows": [{"cells": ["value 1", "value 2"], "status": "good"}]}
    }
  ]
}
Include 6-9 sections: context/diagnosis, strategy, 3-5 execution sections with steps and tips, success metrics with stats, and a closing with next steps. Use each block ONLY where the content fits naturally (omit unused keys per section):
- "tiers" para presupuesto o planes por tramo (nunca inventes precios que no estén en el brief/contexto — usa '[MISSING: real data]' si falta el precio).
- "funnel" para un proceso de conversión con etapas secuenciales (awareness → consideración → conversión, o similar).
- "timeline" para un cronograma/calendario de ejecución con periodos.
- "checklist" para requisitos o tareas que se marcan como hechas/pendientes (distinto de "tips", que son consejos, no tareas).
- "statusTable" en vez de "table" cuando cada fila tiene un estado claro (bien/en riesgo/mal) — status debe ser "good", "warning" o "critical".`

    case 'doc-deck':
      return `You are an executive presentation consultant. Produce a 16:9 deck for this brand, ready to present to clients or investors. ${languageRule}
${input}

METHOD — work in this order. A deck built slide by slide becomes a document with page breaks; the order below is what makes it a presentation.

1. THE ARC BEFORE THE SLIDES. Decide the narrative first: situation → tension (what is at stake, what breaks if nothing changes) → resolution → the ask. Then place slides along it. A deck that is a list of topics has no arc and loses the room by slide four.

2. EVERY TITLE IS AN ASSERTION. Slide titles state the message, not the subject: "Orders collapse on Tuesdays", not "Order analysis". If a title could head any slide in any deck, it is a label — rewrite it.

3. ONE IDEA PER SLIDE. If stating the point needs two sentences, it is two slides or the wrong point. Bullets are the evidence for the title's claim, never a second list of topics.

4. EVIDENCE ON THE SLIDE THAT CLAIMS. A "stats" slide carries real figures from the brief or context, with their source implicit in the label. If there are no real figures, do not manufacture a stats slide — make the point with a comparison or a quote instead.

5. THE ASK IS EXPLICIT. The closing says exactly what you want from this audience — decision, budget, signature, next meeting — not "thank you" or a vague "let's talk".

Return ONLY this JSON (the keys stay exactly as written; the example values below are placeholders — write all content in the output language):
{
  "title": "Presentation title",
  "subtitle": "Subtitle",
  "slides": [
    {"layout": "cover", "title": "", "subtitle": "", "image_prompt": "visual description for the cover background image (scene/concept, no text)"},
    {"layout": "agenda", "title": "Agenda", "items": ["Item 1", "Item 2", "Item 3"]},
    {"layout": "section", "title": "Block name", "subtitle": "What it covers"},
    {"layout": "content", "title": "", "body": "Short paragraph in simple HTML", "bullets": ["bullet 1", "bullet 2"]},
    {"layout": "stats", "title": "", "stats": [{"value": "", "label": ""}]},
    {"layout": "timeline", "title": "Roadmap", "items": [{"label": "Q1", "title": "Milestone", "body": "1 sentence"}]},
    {"layout": "comparison", "title": "Before vs. After", "left": {"title": "Option A", "bullets": ["..."]}, "right": {"title": "Option B", "bullets": ["..."]}},
    {"layout": "quote", "title": "", "quote": "Striking 1-2 sentence quote", "author": "Name, role"},
    {"layout": "image", "title": "", "body": "Short paragraph", "bullets": ["..."], "wants_image": true, "image_prompt": "visual description of the image (scene/concept, no text)"},
    {"layout": "chart", "title": "", "subtitle": "", "chart": {"type": "bar", "labels": ["Jan", "Feb"], "data": [10, 20]}},
    {"layout": "closing", "title": "Closing / CTA", "subtitle": ""}
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
- "image": image on one side + text on the other. Set "wants_image": true and write "image_prompt" (visual description consistent with the brand).
- "chart": a chart — "chart" with "type" (bar|line|doughnut), "labels" (strings) and "data" (números). Úsalo solo si tienes cifras reales o del brief.

Genera 10-16 slides: cover, agenda, 3-4 bloques de sección con sus slides de contenido, al menos 2 slides de stats con cifras concretas, y closing con llamada a la acción. VARIEDAD OBLIGATORIA: incluye al menos 1 slide "timeline" o "comparison", y al menos 1 "quote" cuando el contenido lo permita. Máximo 4 bullets por slide, frases cortas de presentación (no párrafos largos).`

    case 'doc-results':
      return `You are an analyst who writes periodic results reports. Produce a clear, honest report of the period for this brand, built on the data the user provides. ${languageRule}
${input}

METHOD — work in this order. A results report that describes instead of judging is a dashboard printed on paper.

1. A FIGURE ALONE MEANS NOTHING. Every number goes next to what it is being measured against — the target, the previous period, or the baseline. "1,200 visits" is data; "1,200 visits against a target of 2,000, up from 900" is a result. If there is nothing to compare against, say so in that line.

2. THE HONEST HEADLINE. The executive summary opens with one sentence saying whether the period went well or badly, and why. A summary that lists activity without a verdict forces the reader to do the judging — which is the job you were given.

3. CAUSES, NOT ADJECTIVES. "What did not work" explains WHY it did not: what was tried, what the mechanism was, what the evidence says. "Engagement was low" is a restatement; "the two posts without a product shot took 70% fewer saves" is a cause you can act on.

4. MISSING MEASUREMENT IS ITSELF A FINDING. Where a figure should exist and does not, write '[MISSING: real data]' in the value AND name in the narrative what is not being measured and what it costs to keep flying blind. Never invent a number, and never quietly drop the line.

5. THE PLAN INHERITS FROM THE LEARNINGS. Every item in the next period's plan traces back to something in "what worked", "what did not" or "learnings". A plan that ignores the period it follows is a new plan, not a conclusion.

6. BAD NEWS FIRST AND PLAINLY. If the period went badly, the report says so in the first section. Softening it costs the client the one thing a results report is for.

Return ONLY this JSON (the keys stay exactly as written; the section titles below are placeholders — write them in the output language):
{
  "title": "Results report — [period]",
  "subtitle": "Period covered",
  "sections": [
    {"title": "Executive summary", "body": "<p>...</p>", "stats": [{"value": "", "label": ""}]},
    {"title": "Results by area", "statusTable": {"headers": ["Area", "Target", "Result"], "rows": [{"cells": ["", "", ""], "status": "good"}]}},
    {"title": "What worked", "tips": []},
    {"title": "What did not work", "tips": []},
    {"title": "Learnings", "body": ""},
    {"title": "Next period's plan", "timeline": [{"period": "", "items": []}]}
  ]
}
Adjust the sections to the real content available and add "stats" wherever there are figures. Use "status": "good" when the area met or beat its target, "warning" when it came close, "critical" when it fell well short — never leave it blank when there is a result and a target to compare.`

    case 'doc-onepager':
      return `You are a commercial strategist. Produce a ONE-page sales one-pager for this brand: dense with value, zero filler. ${languageRule}
${input}

METHOD — work in this order. One page is a brutal constraint: it is won by cutting, not by summarising.

1. THE PROBLEM IN THE BUYER'S WORDS. Open with the pain as the customer would describe it out loud — not as the category describes it. "Nobody picks up the phone at 8pm and the order is lost" beats "suboptimal customer service coverage". Take the phrasing from the brand's own vocabulary in the context.

2. ONE PROMISE, NOT FIVE. The solution makes a single claim the reader can repeat to a colleague from memory. Five benefits of equal weight mean the reader remembers none. Pick the one this brand wins on and let the bullets support it.

3. PROOF BEATS CLAIM. Every assertion that could be doubted carries evidence: a figure, a named reference, a guarantee, a mechanism. Where there is no proof in the brief or context, do NOT invent one — write '[MISSING: real data]' and, in the brief, say which proof would close the sale.

4. EVERY WORD PAYS RENT. Delete adjectives that survive without changing the meaning ("innovative", "leading", "comprehensive"). If a sentence would still sell with three fewer words, it has three too many.

5. ONE NEXT STEP, NOT A MENU. Close with a single action and how to take it. Offering three ways to get in touch is offering none.

Return ONLY this JSON (the keys stay exactly as written; the section titles below are placeholders — write them in the output language):
{
  "title": "Brand / offer name",
  "subtitle": "Value proposition in one sentence",
  "sections": [
    {"title": "The problem", "body": "<p>2-3 sentences</p>"},
    {"title": "The solution", "body": "<p>2-3 sentences</p>", "tips": ["Benefit 1", "Benefit 2", "Benefit 3"]},
    {"title": "Key numbers", "stats": [{"value": "", "label": ""}]},
    {"title": "Services / Plans", "tiers": [{"name": "", "price": "", "includes": []}]},
    {"title": "Next step", "body": "<p>Clear CTA with contact details</p>"}
  ]
}
Five sections maximum, short copy: everything must fit on one printed page. Use "tiers" for Services/Plans when there are prices or differentiated packages; when there are none, use "table" instead. Never invent a price that is not in the brief — use '[MISSING: real data]'.`

    default:
      return null
  }
}
