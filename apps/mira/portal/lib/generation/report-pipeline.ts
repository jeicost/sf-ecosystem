// lib/generation/report-pipeline.ts
//
// ARQUITECTURA DE INFORMES — tres papeles, no uno.
//
// Hasta el 28-ago-2026 un informe era UNA llamada a Opus y directo a
// producción. Nadie releía el borrador. El resultado medido (plan de acción de
// Adrian Grooves): honesto, sin una sola invención... y sin una sola idea que
// no se le hubiera ocurrido a cualquiera. Ese es el techo estructural de una
// sola pasada: el modelo no tiene ningún incentivo dentro del prompt para ser
// no-obvio, y nada después que se lo exija.
//
// Aquí hay tres papeles, cada uno con un trabajo que el anterior no puede
// hacerse a sí mismo:
//
//   REDACTOR  — produce el borrador con el prompt de la herramienta.
//   CRÍTICO   — lee el borrador SIN cariño de autor y busca tres cosas:
//               lo genérico, el número que no se calculó y la decisión que se
//               esquivó. Devuelve hallazgos estructurados, no prosa.
//   REVISOR   — reescribe atendiendo a los hallazgos, conservando
//               explícitamente lo que el crítico marcó como bueno.
//
// PRINCIPIO DE SEGURIDAD: el pipeline NUNCA puede empeorar el resultado. Si el
// crítico falla, se entrega el borrador. Si el revisor devuelve algo que no
// parsea o que se ha quedado más pobre que el borrador, se entrega el borrador.
// Un informe mediocre entregado vale infinitamente más que un fallo.

import { generateJsonReport } from '@/lib/generation/robust-json'
import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson } from '@/lib/generation/extract-json'

/** Informes donde la crítica paga el sobrecoste: los que el cliente presenta o ejecuta. */
export const PIPELINE_TOOLS = new Set([
  'action-plan',
  'investor-deck',
  'marketing-audit',
  'brand-briefing',
  'competitive-analysis',
  'marketing-campaign-generator',
  'content-pack',
  'community-growth-blueprint',
  // El monthly NO pasa por runReportPipeline (su rama del route llama a
  // generateMonthlySystem directo): monthly-generate.ts invoca
  // critiqueAndRevise SOLO sobre la fase 2 (producción) — es donde vive lo
  // que el cliente ve. Añadido 31-ago-2026: el informe de julio de Salsa
  // (d7c8e889) entregó 10/18 captions con [COMPLETAR:] y 0 líneas thai sin
  // que nadie lo releyera.
  'monthly-content-system',
])

export interface CritiqueFinding {
  severity: 'high' | 'medium' | 'low'
  kind: 'generic' | 'uncomputed' | 'dodged' | 'unsupported' | 'inconsistent' | 'missing' | 'unpublishable'
  where: string
  problem: string
  fix: string
}

export interface PipelineResult {
  data: Record<string, unknown>
  /** Cuántas pasadas se completaron: 1 = solo borrador, 3 = borrador+crítica+revisión. */
  stages: number
  findings: CritiqueFinding[]
  /** Por qué se paró antes de tiempo, si se paró. */
  degradedReason?: string
}

const CRITIC_SYSTEM = `You are the client's most skeptical adviser, reading a draft deliverable
that your own agency produced. You are not being paid to be encouraging. You are being paid to
catch what would embarrass the agency in the meeting.

You look for exactly six failure modes, in this order of importance:

1. GENERIC — sentences that could appear unchanged in a deliverable for a different client in a
   different industry. This is the most common and most damaging failure. "Configurar tracking",
   "crear contenido de calidad", "optimizar la estrategia" are the signature. Quote the offending
   text.

2. UNCOMPUTED — numbers that were available in the input or context and never crossed. If the
   draft mentions a price, a budget and a volume target but never multiplies or divides them, that
   is the single most valuable thing you can catch. Do the arithmetic yourself in the 'fix'.

3. DODGED — judgement fields answered with "unknown", "TBD", "por definir", null, or hedged into
   meaninglessness. Effort, probability, impact, priority and sequencing are the deliverable, not
   missing data. Propose the actual value in the 'fix'.

4. UNSUPPORTED — the opposite failure: a figure or claim stated as fact with nothing in the
   context behind it, and no [ASSUMPTION]/[RECOMMENDATION]/[MISSING: real data] label.

5. INCONSISTENT — two parts of the document that contradict each other, or a recommendation that
   contradicts the brand context.

6. UNPUBLISHABLE — only for deliverables that contain ready-to-publish copy (captions, scripts,
   posts): a piece the client could NOT copy-paste and publish today. Four signatures, all seen
   in real deliverables: (a) a bracketed blank — "[COMPLETAR: …]", "[INSERT …]", "___",
   "add X here"; (b) copy in a language that contradicts the brand context's language rules;
   (c) a mandatory per-piece language line (e.g. "every caption carries a Thai line") that is
   simply absent; (d) a dialect register the brand never uses (voseo, regional slang) when the
   declared tone shows none. For content deliverables this failure mode outranks the five above —
   one unpublishable caption breaks the promise of the whole document, so it is always severity
   high. Quote the piece. The fix is either the publishable version written in full (in the
   right language), or moving the piece to open_items with an owner — never a half-filled blank.

Rules:
- Be specific. "The plan is vague" is useless. Quote the text and name the section.
- Every finding carries a 'fix' concrete enough to apply without further thought.
- Do NOT invent facts to fix things. If the fix requires data nobody has, the fix is to say so
  explicitly in the document, not to make it up.
- Also record what is genuinely GOOD, in 'keep'. The revision must not destroy it. Being harsh
  about weaknesses without protecting strengths produces a worse second draft, not a better one.
- If the draft is genuinely solid, say so: verdict 'ship' with few or no high-severity findings.
  Manufacturing complaints to look thorough is its own failure.

Return ONLY a JSON object:
{
  "verdict": "ship" | "revise",
  "findings": [{"severity":"high|medium|low","kind":"generic|uncomputed|dodged|unsupported|inconsistent|missing|unpublishable","where":"section or json path","problem":"quote the text and say what is wrong","fix":"exactly what to write instead"}],
  "keep": ["the specific things that are good and must survive the rewrite"]
}`

function reviserPrompt(
  originalPrompt: string,
  draft: Record<string, unknown>,
  critique: { findings: CritiqueFinding[]; keep?: string[] }
): string {
  return `${originalPrompt}

────────────────────────────────────────────────────────
YOU ARE REVISING, NOT STARTING OVER.

A first draft exists and an independent reviewer has critiqued it. Your job is to produce the
FINAL version: same JSON schema, every strength preserved, every finding addressed.

DRAFT:
${JSON.stringify(draft, null, 2)}

REVIEWER FINDINGS — address every one:
${critique.findings
  .map(
    (f, i) =>
      `${i + 1}. [${f.severity.toUpperCase()} · ${f.kind}] ${f.where}\n   Problema: ${f.problem}\n   Arreglo: ${f.fix}`
  )
  .join('\n')}

MUST SURVIVE THE REWRITE (the reviewer marked these as good):
${(critique.keep || []).map((k) => `- ${k}`).join('\n') || '- (nothing flagged)'}

RULES FOR THE REVISION:
- Do not fix a "generic" finding by adding adjectives. Fix it by adding specifics from this
  client's actual context, or by deleting the line.
- Do not fix an "unsupported" finding by deleting the useful content — label it correctly instead.
- Never invent data to satisfy a finding. If a fix needs a figure nobody has, write what it depends
  on and add it to data_gaps.
- The revision must be at least as complete as the draft. Do not drop sections to look tidier.

Return ONLY the complete, revised JSON object.`
}

/**
 * Genera un informe con borrador → crítica → revisión.
 *
 * Degrada con gracia: cualquier fallo después del borrador devuelve el borrador
 * con `degradedReason`. Nunca lanza por culpa de las etapas 2 y 3.
 */
export async function runReportPipeline(opts: {
  clientId: string | null | undefined
  toolSlug: string
  prompt: string
  model: string
  maxTokens: number
  userContent: string | any
  /** false = solo borrador (el comportamiento anterior). */
  critique?: boolean
}): Promise<PipelineResult> {
  const { clientId, toolSlug, prompt, model, maxTokens, userContent, critique = true } = opts

  // ── 1. REDACTOR ────────────────────────────────────────────────────────────
  const { data: draft } = await generateJsonReport({
    clientId,
    route: `toolkit/${toolSlug}/draft`,
    model,
    maxTokens,
    userContent,
  })

  return critiqueAndRevise({ clientId, toolSlug, prompt, model, maxTokens, draft, critique })
}

/**
 * Etapas 2 y 3 sobre un borrador ya existente. Se expone aparte para que la
 * ruta de lote —que tiene su propio bucle de reintentos— pueda usarlas sin
 * duplicar la etapa de redacción.
 */
export async function critiqueAndRevise(opts: {
  clientId: string | null | undefined
  toolSlug: string
  prompt: string
  model: string
  maxTokens: number
  draft: Record<string, unknown>
  critique?: boolean
}): Promise<PipelineResult> {
  const { clientId, toolSlug, prompt, model, maxTokens, draft, critique = true } = opts

  if (!critique || !PIPELINE_TOOLS.has(toolSlug)) {
    return { data: draft, stages: 1, findings: [] }
  }

  // ── 2. CRÍTICO ─────────────────────────────────────────────────────────────
  let findings: CritiqueFinding[] = []
  let keep: string[] = []
  try {
    const msg = await createMessageForClient(clientId, `toolkit/${toolSlug}/critique`, {
      model,
      // 8000, no 4000: criticando el monthly de Salsa (16 captions bilingües,
      // 31-ago-2026) el JSON del crítico se truncó a media lista de findings
      // y toda la crítica degradó al borrador. El crítico cita texto — con
      // entregables largos 4k no le llega para cerrar el objeto.
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: `${CRITIC_SYSTEM}

The deliverable is a "${toolSlug}". This is the brief and context it was written from:
${
  // 28k y no 20k (31-ago-2026): el prompt de producción del monthly lleva el
  // JSON de la estrategia + el brain entero, y la sección Languages del brain
  // va casi al final — con 20k el crítico podía quedarse sin las reglas de
  // idioma que precisamente tiene que verificar (modo UNPUBLISHABLE).
  prompt.slice(0, 28000)
}

This is the draft to critique:
${JSON.stringify(draft, null, 2)}`,
        },
      ],
    })
    const text = msg.content.map((b: any) => ('text' in b ? b.text : '')).join('\n')
    const parsed = extractJson(text) as any
    findings = Array.isArray(parsed?.findings) ? parsed.findings : []
    keep = Array.isArray(parsed?.keep) ? parsed.keep : []
    // Umbral de revisión. El veredicto del crítico se pondera, no se obedece:
    // en la primera corrida real dijo "ship" con 2 hallazgos medios encima
    // (una inconsistencia entre el resumen ejecutivo y los cálculos, y un
    // margen sin cerrar). Un crítico tiende a ser generoso con un borrador
    // decente; el coste de una revisión es una llamada.
    const high = findings.filter((f) => f.severity === 'high').length
    const medium = findings.filter((f) => f.severity === 'medium').length
    if (high === 0 && medium < 2) {
      return { data: draft, stages: 2, findings }
    }
  } catch (err) {
    return {
      data: draft,
      stages: 1,
      findings: [],
      degradedReason: `critique failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  if (!findings.length) return { data: draft, stages: 2, findings }

  // ── 3. REVISOR ─────────────────────────────────────────────────────────────
  try {
    const { data: revised } = await generateJsonReport({
      clientId,
      route: `toolkit/${toolSlug}/revise`,
      model,
      maxTokens,
      userContent: reviserPrompt(prompt, draft, { findings, keep }),
    })

    // Guardarraíl: una revisión que se queda notablemente más pobre que el
    // borrador es una regresión, no una mejora. Se descarta.
    const draftKeys = Object.keys(draft).length
    const revisedKeys = Object.keys(revised).length
    if (revisedKeys < draftKeys * 0.7) {
      return {
        data: draft,
        stages: 2,
        findings,
        degradedReason: `revision dropped ${draftKeys - revisedKeys} of ${draftKeys} top-level fields — draft kept`,
      }
    }

    return { data: revised, stages: 3, findings }
  } catch (err) {
    return {
      data: draft,
      stages: 2,
      findings,
      degradedReason: `revision failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
