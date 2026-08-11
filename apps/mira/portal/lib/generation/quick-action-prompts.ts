import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { retrieveAgentContext } from '@/lib/agent-context'
import { getClientMemoryContext } from '@/lib/client-memory'
import { getFeedbackBlock } from '@/lib/feedback'
import { getApprovedExamplesBlock } from '@/lib/generation/approved-examples'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'


// B4: los ❤ del cliente por fin se usan — los últimos outputs que marcó como
// favoritos entran al prompt como señal de estilo ("más como esto").
async function getLikedOutputsBlock(clientId: string): Promise<string> {
  try {
    const { adminClient } = await import('@/lib/supabase')
    const admin = adminClient()
    const { data, error } = await admin
      .from('quick_actions_results')
      .select('action_type, output_data')
      .eq('client_id', clientId)
      .eq('liked_by_user', true)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(3)
    if (error || !data?.length) return ''
    const samples = data
      .map((r) => {
        const out = (r.output_data ?? {}) as Record<string, any>
        const snippet = String(out.copy ?? out.subject ?? out.body ?? '').slice(0, 150)
        return snippet ? `- [${r.action_type}] "${snippet}"` : null
      })
      .filter(Boolean)
    if (!samples.length) return ''
    return `\n\nOUTPUTS THE CLIENT MARKED AS FAVOURITES (match this style and level):\n${samples.join('\n')}`
  } catch {
    return ''
  }
}

export interface QuickActionPromptParams {
  clientId: string
  inputData: Record<string, any>
  /** Texto extraído de los adjuntos del usuario (PDF/texto) — ver lib/attachments.ts */
  attachmentText?: string
  /** Contexto del lead seleccionado (acciones comerciales con lead_picker) */
  leadContext?: string
  /** Proyecto activo — la memoria inyectada prioriza este proyecto */
  projectId?: string | null
}

export async function getQuickActionPrompt(
  actionType: string,
  params: QuickActionPromptParams
): Promise<string | null> {
  const { clientId, inputData, attachmentText, leadContext, projectId } = params

  const [brandBrain, memoryContext, docContext, likedBlock, approvedBlock, feedbackBlock] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId, projectId ?? null),
    retrieveAgentContext({
      client_id: clientId,
      context_type: 'all',
      limit: 2,
      project_id: projectId ?? null,
    }),
    getLikedOutputsBlock(clientId),
    getApprovedExamplesBlock(clientId), // few-shot: piezas aprobadas sin editar
    getFeedbackBlock(clientId, actionType),
  ])

  const brandContext = brandBrain ? formatBrandBrainForPrompt(brandBrain) : ''

  // Identidad visual DURA para generación de imágenes: los hex y tipografía
  // exactos como requisito, no como prosa blanda que el modelo puede ignorar.
  const visualIdentityHard = brandBrain?.visualIdentitySummary
    ? `\nBRAND VISUAL IDENTITY — MANDATORY: the image_generation_prompt MUST explicitly include these exact values (hex colors as the palette, typography style if text appears): ${brandBrain.visualIdentitySummary}`
    : ''

  const docText = docContext?.documents
    ?.map((d: any) => d.excerpt)
    .join('\n') || ''

  const allContext = [docText, brandContext, memoryContext, feedbackBlock]
    .filter(Boolean)
    .join('\n\n')

  const languageRule =
    "\n\nLANGUAGE: Write all prose fields in the same language as the user's input. Keep enum/status values exactly as specified in the schema."

  // Optional form fields left blank must not become gaps or refusals — but the
  // line between "use good judgment" and "invent a fact" has to be explicit,
  // or the model defaults to fabricating numbers with the same confidence as
  // real ones. See docs/DEBT.md punto (t).
  const optionalFieldsRule = `

OPTIONAL FIELDS LEFT BLANK: if a non-required form field arrives empty, do not leave a gap or refuse to generate — use your professional judgment (and the brand/client context above) to fill it in, and prefix that part with '[RECOMMENDATION]' so the reader knows it's your call, not the user's input. This applies to creative/strategic choices (tone, angle, channel emphasis, scope). It does NOT apply to concrete figures or facts (prices, budgets, rates, specific business numbers, named competitors) — those, if missing from the input, stay null/'—' per the grounding contract below. Never invent a number to avoid leaving a field empty.`

  // Adjuntos del usuario y lead seleccionado: datos de PRIMERA MANO — van antes
  // que el contexto general y el modelo debe preferirlos sobre cualquier supuesto.
  const attachmentBlock = attachmentText
    ? `\n\nUSER ATTACHMENTS (primary source — use their actual content):\n${attachmentText}`
    : ''
  const leadBlock = leadContext
    ? `\n\nSELECTED LEAD (real pipeline data — the output must be specific to this lead):\n${leadContext}`
    : ''

  const fullContext =
    attachmentBlock +
    leadBlock +
    (allContext ? `\n\nCONTEXT:\n${allContext}` : '') +
    likedBlock +
    (approvedBlock ? `\n\n${approvedBlock}` : '') +
    languageRule +
    optionalFieldsRule +
    `\n\n${GROUNDING_CONTRACT}`

  // Prompts específicos por acción
  // ADMIN
  if (actionType === 'responder_ticket') {
    return `You are a support specialist writing on behalf of the brand below. Resolve the customer's issue, don't just acknowledge it.

Ticket:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: open by naming the SPECIFIC issue (never "thanks for reaching out" as an opener) — the customer needs to feel heard before anything else. Give a concrete resolution or next step, not just sympathy. Match the brand's tone (never generic corporate boilerplate). If the ticket implies a policy/refund/technical decision you cannot make with the info given, say in \`suggested_follow_ups\` what a human needs to confirm, instead of promising something you can't guarantee. Keep it as short as the issue allows — don't pad.

Return ONLY valid JSON (no markdown):
{
  "subject": "Re: ...",
  "body": "The response, ready to send",
  "tone": "the tone actually used (e.g. empathetic-direct, formal, warm)",
  "suggested_follow_ups": ["Optional proactive follow-up, or what a human should confirm before this goes out"]
}`
  }

  if (actionType === 'crear_faq') {
    return `You are a knowledge base manager. Write FAQ entries a real customer would search for, not the questions a company wishes people asked.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: phrase each question the way a customer actually types it (casual, specific, sometimes the "real" worry behind a polite question — e.g. "can I cancel and get my money back?" not "What is the cancellation policy?"). Answers must be direct in the first sentence, no throat-clearing ("Great question!"), then the necessary detail. No jargon the customer wouldn't use themselves. Group related questions under the same category so the FAQ reads as organized, not a random list.

Generate FAQ JSON:
{
  "faqs": [
    {"question": "", "answer": "", "category": ""}
  ],
  "best_practices": ["A concrete suggestion for where/how to surface these FAQs"]
}`
  }

  if (actionType === 'crear_tutorial') {
    return `You are a technical writer. Write a tutorial someone can follow without asking a single clarifying question.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: each step describes ONE concrete action (a click, an input, a decision) — never bundle 3 actions into one step or write vague guidance like "configure the settings appropriately." Assume the reader's stated skill level from the input; don't explain basics they said they already know, and don't skip steps for things they said they don't. Tips are for the non-obvious gotcha at that specific step, not generic advice — omit the tips array entry for a step if there's nothing specific to add.

Generate tutorial JSON:
{
  "title": "",
  "steps": [
    {"number": 1, "title": "", "description": "", "tips": []}
  ],
  "script": "Optional voiceover/presenter script if this tutorial is meant to be recorded, else empty string",
  "resources_needed": ["Concrete tool/account/access needed to follow along"]
}`
  }

  // COMERCIAL/SALES
  // (generar_icp / crear_propuesta / calificar_reply eliminados 2026-07-27:
  //  eran prompts huérfanos sin botón — las funciones reales viven en las
  //  páginas Comercial con sus APIs dedicadas /api/comercial/*.)
  if (actionType === 'crear_campaña') {
    return `Task: Create an outbound acquisition campaign strategy for the brand below, ready to execute in MIRA's Prospecting (lead discovery) tool.

Input: ${JSON.stringify(inputData, null, 2)}
${fullContext}

The "discovery_search" object is what MIRA's Prospecting tool will use to actually find the leads for this campaign — fill it with the concrete search that best matches the strategy: industry (target industry of the LEADS to find, not the brand's own), geography (city/country scope), keywords (2-5 search terms describing the target companies), limit (target_count from input, default 10).

Output ONLY valid JSON (no markdown, no text before/after):
{"campaign_name":"Campaign Name","target_segment":"Audience description","messaging":["Message 1","Message 2"],"channels":["Channel 1","Channel 2"],"timeline":["Period 1: Action","Period 2: Action"],"success_metrics":["Metric 1","Metric 2"],"discovery_search":{"industry":"","geography":"","keywords":"","limit":10}}`
  }

  if (actionType === 'responder_objecion') {
    return `You are a senior sales closer writing on behalf of the brand below. The prospect raised an objection — craft the response that keeps the deal alive.

Objection and context:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: address the SPECIFIC objection (price, timing, competitor, trust...) — never a generic template. Use the brand's tone of voice. If a lead is provided, make it personal to them. Acknowledge → reframe with value → concrete next step. Short enough to actually send (under 150 words for the main response).

Return ONLY valid JSON (no markdown):
{
  "objection_type": "price/timing/competitor/authority/need/trust/other",
  "subject": "Reply subject line if email",
  "body": "The main response, ready to send",
  "variant_softer": "A softer, lower-pressure variant",
  "variant_direct": "A more direct, assumptive variant",
  "next_step": "What to do after sending (wait X days, call, send case study...)"
}`
  }

  if (actionType === 'email_seguimiento') {
    return `You are a sales follow-up specialist writing on behalf of the brand below. Write a follow-up email that gets a reply without sounding like spam or desperation.

Context (what was sent, how long ago, previous replies):
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: NO "just checking in" / "in case you missed my last email". Add NEW value in every follow-up (an insight, a resource, a relevant hook). Use the brand's tone. If a lead is provided, personalize to their company and situation. Keep it under 120 words.

Return ONLY valid JSON (no markdown):
{
  "subject": "Subject line that gets opened",
  "body": "The follow-up email, ready to send",
  "timing_advice": "When to send it and why (e.g. 'wait until Tuesday morning')",
  "variant_breakup": "A polite 'last attempt' variant for when this is the final follow-up",
  "next_step": "What to do if there's still no reply"
}`
  }

  if (actionType === 'preparar_llamada') {
    return `You are a sales coach preparing the user for a call. Build a pre-call brief they can scan in 2 minutes.

Call goal and lead:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: everything must be specific to this lead (if provided) and this brand — no generic sales advice. Discovery questions must be open-ended and ordered from context-building to commitment. Objections must be the ones THIS lead is most likely to raise, each with a ready answer in the brand's tone.

Return ONLY valid JSON (no markdown):
{
  "lead_summary": "Who they are, why they matter, current pipeline state (3-4 lines)",
  "call_objective": "The single outcome to walk away with",
  "discovery_questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"],
  "likely_objections": [{"objection": "", "answer": ""}],
  "talking_points": ["Point 1", "Point 2"],
  "proposed_next_step": "The concrete commitment to ask for at the end"
}`
  }

  // MARKETING
  if (actionType === 'crear_post') {
    // with_image (toggle del formulario): añade el prompt de generación de
    // imagen al schema — generate.ts lo convierte en imagen real vía OpenAI.
    const withImage = Boolean(inputData.with_image)
    return `You are a social media strategist. Generate social media content.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}
${withImage ? `
The user wants an AI-generated image for this post. "image_generation_prompt" must be a detailed, self-contained English prompt for an image model: subject, composition, style${inputData.style ? ` (user's requested style: ${JSON.stringify(inputData.style)})` : ''}, lighting, no text overlays unless essential.${visualIdentityHard}` : ''}

Generate content JSON:
{
  "platform": "",
  "copy": "",
  "hashtags": [],
  "call_to_action": "",
  "media_brief": ""${withImage ? `,
  "image_generation_prompt": ""` : ''}
}`
  }

  if (actionType === 'crear_newsletter') {
    return `You are a newsletter editor writing on behalf of the brand below. Write an issue people actually open and read to the end, not a corporate update nobody asked for.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: the subject line must earn the open — specific and a little intriguing, never "[Month] newsletter" or "News from [brand]". preview_text extends the subject's hook, it never just repeats it. Each section leads with why the reader should care, not a headline that describes the topic. Every section needs exactly one clear cta — if a section has nothing worth a call-to-action, question whether it belongs in this issue at all. Match the brand's tone throughout; a newsletter should sound like it's from a person, not a marketing department.

Generate newsletter JSON:
{
  "subject": "",
  "preview_text": "",
  "sections": [
    {"title": "", "content": "", "cta": ""}
  ],
  "footer": ""
}`
  }

  if (actionType === 'crear_video_brief') {
    return `You are a video producer writing a brief someone can shoot from without asking follow-up questions.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Rules: the first scene is the hook — assume 3 seconds to stop someone scrolling, so it must open on the payoff or a question, never a slow establishing shot or logo intro. Each scene_breakdown entry describes what's actually ON SCREEN (shot type, action, on-screen text if any) — not the marketing idea behind it ("show the product in use" is not a scene; "close-up of hands opening the packaging, text overlay: 'in 3 steps'" is). technical_specs.duration must match the platform's actual best-practice length for this format (e.g. under 30s for a Reel/TikTok hook-driven video, longer for a tutorial) — don't default to a generic "60 seconds" regardless of format. The script (if provided) must match the scene timing, not run long.

Generate brief JSON:
{
  "title": "",
  "objective": "",
  "script": "",
  "scene_breakdown": [{"scene": "", "description": ""}],
  "technical_specs": {"duration": "", "format": ""},
  "call_to_action": ""
}`
  }

  if (actionType === 'crear_carousel') {
    const withImage = Boolean(inputData.with_image)
    return `You are a social content designer. Generate a carousel concept.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}
${withImage ? `
The user wants an AI-generated cover image. Each slide gets an "image_generation_prompt": a detailed, self-contained English prompt (subject, composition${inputData.style ? `, user's requested style: ${JSON.stringify(inputData.style)}` : ''}). Only the first slide's image is generated for now — make it the strongest.${visualIdentityHard}` : ''}

Generate carousel JSON:
{
  "title": "",
  "slides": [
    {"number": 1, "copy": "", "visual_direction": ""${withImage ? `, "image_generation_prompt": ""` : ''}}
  ],
  "cta_slide": "",
  "hashtags": []
}`
  }

  if (actionType === 'crear_campaña_ads') {
    return `You are a performance marketer. Generate a paid ad campaign.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

If \`audience\` is empty, derive targeting.audience from the brand context's target audiences instead of leaving it blank or inventing a new one — label it '[RECOMMENDATION]'. budget_allocation must split the \`budget\` figure from the input across channels/platforms (percentages or amounts that sum to it) — never invent a total budget that wasn't provided. kpis targets must be null unless derivable from input/context.

Generate campaign JSON:
{
  "campaign_name": "",
  "platforms": [],
  "ad_variants": [
    {"headline": "", "copy": "", "cta": ""}
  ],
  "targeting": {"audience": "", "interests": []},
  "budget_allocation": {},
  "kpis": []
}`
  }

  // STRATEGY
  if (actionType === 'generar_reporte') {
    return `You are a business analyst. Generate a strategic report.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

The \`metrics\` field only lists WHICH topics to cover — it carries no figures. Use real numbers ONLY if they appear in \`datos_reales\` or the context above. If no real figures are available for a selected metric, keep \`findings\`/\`analysis\` qualitative and structural (what to track, how, and why) instead of inventing revenue/MRR/churn numbers to sound complete — and add that metric to a \`data_gaps\` array.

Generate report JSON:
{
  "title": "",
  "executive_summary": "",
  "findings": [],
  "analysis": "",
  "recommendations": [],
  "implementation_roadmap": [],
  "data_gaps": []
}`
  }

  // (analizar_competencia eliminada 2026-07-28: fusionada en el report
  //  competitive-analysis con grounding Tavily real — este prompt ciego ya no
  //  se usa; el radar rápido vive en toolkit-prompts con profundidad='quick'.)

  // (brainstorm_ideas eliminado 2026-07-27: era un prompt de chat con forma
  //  de quick action — el agente Blueprint lo cubre mejor conversacionalmente.)

  // FINANZAS
  if (actionType === 'proyeccion_financiera') {
    return `You are a financial analyst. Build a 12-month financial projection for this business.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

If \`growth_rate\` is empty, do not invent a specific rate — use a conservative, clearly-labeled '[ASSUMPTION]' range instead, and say so in \`assumptions\`.

Generate projection JSON:
{
  "executive_summary": "2-3 sentence summary of the financial outlook",
  "assumptions": ["assumption 1", "assumption 2"],
  "monthly_projection": [{"month": "", "revenue": "", "costs": "", "profit": ""}],
  "break_even_analysis": {"break_even_month": "", "monthly_fixed_costs": "", "notes": ""},
  "scenarios": {"conservative": "", "base": "", "optimistic": ""},
  "key_risks": ["risk 1", "risk 2"],
  "recommendations": ["rec 1", "rec 2"]
}`
  }

  if (actionType === 'analisis_cashflow') {
    return `You are a treasury specialist. Analyze cash flow health and produce an actionable cash flow analysis.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Only use figures for \`amount\`/\`runway_months\`/\`gap\` that are derivable from the input's real income/expense data — if the input doesn't give you enough to compute a number, leave it as '—' and explain the gap in \`assumptions\` instead of estimating a plausible-looking figure.

Generate cashflow JSON:
{
  "summary": "Current cash position assessment in 2-3 sentences",
  "inflows": [{"source": "", "amount": "", "frequency": "", "reliability": "high|medium|low"}],
  "outflows": [{"category": "", "amount": "", "frequency": "", "optimizable": true}],
  "runway_months": "",
  "cash_gaps": [{"period": "", "gap": "", "mitigation": ""}],
  "improvement_actions": [{"action": "", "impact": "", "effort": "low|medium|high"}],
  "alerts": ["alert 1"],
  "assumptions": []
}`
  }

  if (actionType === 'optimizar_costos') {
    return `You are a cost optimization consultant. Identify concrete savings opportunities without harming growth.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

If \`target_savings\` is empty, propose a reasonable target yourself from the described spending structure, prefixed '[RECOMMENDATION]', instead of leaving it unaddressed — but never invent specific euro amounts for \`current_monthly\`/\`optimized_monthly\` that aren't derivable from \`current_expenses\`.

Generate optimization JSON:
{
  "summary": "2-3 sentence overview of savings potential",
  "cost_categories": [{"category": "", "current_monthly": "", "optimized_monthly": "", "savings": "", "how": ""}],
  "quick_wins": [{"action": "", "monthly_savings": "", "implementation_time": ""}],
  "structural_changes": [{"change": "", "annual_impact": "", "risk": ""}],
  "do_not_cut": ["Investment that must be protected and why"],
  "total_potential_savings": {"monthly": "", "annual": ""},
  "assumptions": []
}`
  }

  // STRATEGY / INNOVACIÓN
  if (actionType === 'analizar_tendencias') {
    return `You are a trends analyst. Identify and analyze the most relevant market trends for this brand's industry.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

You have no live research — this is expert-informed analysis based on general knowledge of the sector, not verified current data. Treat every trend/threat as a professional judgment call: no invented statistics, dates, or named sources. If a claim needs a specific number to land (market size, growth %), omit the number rather than inventing one.

Generate trends JSON:
{
  "industry_context": "2-3 sentence context of where the industry is heading",
  "trends": [{"name": "", "description": "", "maturity": "emerging|growing|established", "relevance": "high|medium|low", "opportunity": "", "first_move": ""}],
  "threats": [{"threat": "", "timeline": "", "mitigation": ""}],
  "recommended_bets": [{"bet": "", "why_now": "", "investment_level": "low|medium|high"}],
  "watch_list": ["trend to monitor 1", "trend to monitor 2"]
}`
  }

  // (auditar_innovacion eliminado 2026-07-27: fusionado en roadmap_innovacion —
  //  ambos pedían current_state y el roadmap ya diagnostica; sus 5 dimensiones
  //  puntuadas viven ahora en diagnosis.dimensions.)

  if (actionType === 'roadmap_innovacion') {
    return `You are an innovation strategist. First AUDIT this brand's current innovation capacity (from the current_state input) across five dimensions, then build an innovation roadmap for the requested timeline.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

All scores ("innovation_score" and each dimension "score") must be numbers on an explicit 0-100 scale (0 = no capacity, 100 = world-class), derived from the evidence in current_state and context — never a default.

Generate roadmap JSON:
{
  "diagnosis": {"innovation_score": 0, "summary": "2-3 sentence assessment of current innovation capacity", "dimensions": [{"dimension": "Culture|Processes|Portfolio|Technology|Talent", "score": 0, "findings": "", "gap": ""}], "strengths": [""], "gaps": [""]},
  "vision": "Where innovation takes this brand in the requested timeline",
  "horizons": {
    "h1_core": {"focus": "Optimize the core business", "initiatives": [{"name": "", "quarter": "Q1|Q2|Q3|Q4", "outcome": ""}]},
    "h2_adjacent": {"focus": "Adjacent opportunities", "initiatives": [{"name": "", "quarter": "", "outcome": ""}]},
    "h3_transformational": {"focus": "Transformational bets", "initiatives": [{"name": "", "quarter": "", "outcome": ""}]}
  },
  "quarterly_milestones": [{"quarter": "", "milestone": "", "success_metric": ""}],
  "resources_needed": [{"resource": "", "for_what": "", "when": ""}],
  "kill_criteria": ["Condition under which an initiative should be stopped"]
}`
  }

  // (crear_post_visual y crear_carrusel_visual eliminados 2026-07-27:
  //  fusionados en crear_post / crear_carousel vía el toggle with_image —
  //  tener "Post" y "Post Visual" como cards separadas confundía.)

  if (actionType === 'editar_imagen_visual') {
    // Desde 2026-07-27 la imagen origen llega ADJUNTA (bloque de visión en el
    // mensaje) — el modelo la VE de verdad; ya no describe a ciegas.
    return `You are a visual refinement specialist. The user attached the original image — it is included in this message, look at it carefully. Generate refinement directives for an image generator to recreate it with the requested changes.

Describe the original faithfully from what you SEE (composition, subjects, colors, text, style) — the refinement_prompt must reconstruct everything that should stay the same, then apply the requested changes. Note: the image will be REGENERATED from your prompt, not edited pixel by pixel — the closer your description of the original, the more faithful the result.
${visualIdentityHard}

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate refinement spec JSON:
{
  "refinement_request": "What the user wants changed",
  "original_description": "Faithful description of the attached image as you see it",
  "specific_changes": [
    {"element": "Name of element to change", "current_state": "How it looks now (from the image)", "desired_state": "How it should look"}
  ],
  "protected_elements": ["Elements that must NOT change (e.g., text, logo)"],
  "refinement_prompt": "Complete self-contained prompt for the image generator: reconstructs the original (from original_description) with the changes applied and protected elements preserved"
}`
  }

  return null
}
