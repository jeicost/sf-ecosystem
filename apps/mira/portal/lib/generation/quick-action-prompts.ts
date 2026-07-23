import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { retrieveAgentContext } from '@/lib/agent-context'
import { getClientMemoryContext } from '@/lib/client-memory'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'


export interface QuickActionPromptParams {
  clientId: string
  inputData: Record<string, any>
}

export async function getQuickActionPrompt(
  actionType: string,
  params: QuickActionPromptParams
): Promise<string | null> {
  const { clientId, inputData } = params

  const [brandBrain, memoryContext, docContext] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId),
    retrieveAgentContext({
      client_id: clientId,
      context_type: 'all',
      limit: 2,
    }),
  ])

  const brandContext = brandBrain ? formatBrandBrainForPrompt(brandBrain) : ''

  const docText = docContext?.documents
    ?.map((d: any) => d.excerpt)
    .join('\n') || ''

  const allContext = [docText, brandContext, memoryContext]
    .filter(Boolean)
    .join('\n\n')

  const languageRule =
    "\n\nLANGUAGE: Write all prose fields in the same language as the user's input. Keep enum/status values exactly as specified in the schema."

  // Optional form fields left blank must not become gaps or refusals — but the
  // line between "use good judgment" and "invent a fact" has to be explicit,
  // or the model defaults to fabricating numbers with the same confidence as
  // real ones. See docs/DEBT.md punto (t).
  const optionalFieldsRule = `

OPTIONAL FIELDS LEFT BLANK: if a non-required form field arrives empty, do not leave a gap or refuse to generate — use your professional judgment (and the brand/client context above) to fill it in, and prefix that part with '[RECOMENDACIÓN]' so the reader knows it's your call, not the user's input. This applies to creative/strategic choices (tone, angle, channel emphasis, scope). It does NOT apply to concrete figures or facts (prices, budgets, rates, specific business numbers, named competitors) — those, if missing from the input, stay null/'—' per the grounding contract below. Never invent a number to avoid leaving a field empty.`

  const fullContext = (allContext ? `\n\nCONTEXT:\n${allContext}` : '') + languageRule + optionalFieldsRule + `\n\n${GROUNDING_CONTRACT}`

  // Prompts específicos por acción
  // ADMIN
  if (actionType === 'responder_ticket') {
    return `You are a support specialist. Generate a professional support response.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a response JSON:
{
  "subject": "Re: ...",
  "body": "...",
  "tone": "professional",
  "suggested_follow_ups": []
}`
  }

  if (actionType === 'crear_faq') {
    return `You are a knowledge base manager. Generate FAQ entries.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate FAQ JSON:
{
  "faqs": [
    {"question": "", "answer": "", "category": ""},
    {"question": "", "answer": "", "category": ""}
  ],
  "best_practices": []
}`
  }

  if (actionType === 'crear_tutorial') {
    return `You are a technical writer. Generate a tutorial.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate tutorial JSON:
{
  "title": "",
  "steps": [
    {"number": 1, "title": "", "description": "", "tips": []}
  ],
  "script": "",
  "resources_needed": []
}`
  }

  // COMERCIAL/SALES
  if (actionType === 'crear_campaña') {
    return `Task: Create a marketing campaign strategy based on provided input.

Input: ${JSON.stringify(inputData, null, 2)}
${fullContext}

Output ONLY valid JSON (no markdown, no text before/after):
{"campaign_name":"Campaign Name","target_segment":"Audience description","messaging":["Message 1","Message 2"],"channels":["Channel 1","Channel 2"],"timeline":["Period 1: Action","Period 2: Action"],"success_metrics":["Metric 1","Metric 2"]}`
  }

  if (actionType === 'generar_icp') {
    return `Task: Generate an Ideal Customer Profile (ICP) analysis.

Input: ${JSON.stringify(inputData, null, 2)}
${fullContext}

If \`company_info\` is empty, use the brand context above (your own company) instead of inventing one. Derive company_profile.size/revenue and buying_process.budget from lead_data/company_info/context; if none of them support a figure, use "unknown" rather than a plausible-sounding range.

Output ONLY valid JSON (no markdown, no text):
{"company_profile":{"size":"Size range","revenue":"Revenue range","industry":"Industry"},"decision_makers":[{"role":"Title","priorities":["Priority"],"pain_points":["Pain"]}],"buying_process":{"timeline":"Timeline","budget":"Budget","stakeholders":["Stakeholder"]},"fit_indicators":["Fit1","Fit2"]}`
  }

  if (actionType === 'crear_propuesta') {
    return `You are a professional proposal writer. Create a business proposal outline for a potential client.

Input:
${JSON.stringify(inputData, null, 2)}
${fullContext}

pricing.tiers[].price must come from \`budget_estimate\` in the input or from real pricing in the brand/client context. If neither is available, use the literal placeholder '[COMPLETAR: dato real]' instead of inventing a number.

Return ONLY valid JSON (no markdown):
{
  "executive_summary": "Brief overview of proposal",
  "problem_statement": "Client's main challenges",
  "proposed_solution": "How you solve their problems",
  "pricing": {"tiers": [{"name": "Tier name", "price": "$X", "features": ["Feature 1"]}]},
  "timeline": "Implementation timeline",
  "next_steps": ["Step 1", "Step 2"]
}`
  }

  if (actionType === 'calificar_reply') {
    return `You are a sales qualification analyst. Analyze a prospect's reply and provide insights.

Reply to analyze:
${JSON.stringify(inputData, null, 2)}
${fullContext}

qualification_score must be an integer on a 1-10 scale (1 = very poor fit, 10 = excellent fit). Assess it from the reply content — do not default to any particular value.

Return ONLY valid JSON (no markdown):
{
  "qualification_score": 0,
  "sentiment": "positive/neutral/negative",
  "interest_level": "high/medium/low",
  "next_action": "Suggested next step",
  "suggested_response": "Professional response suggestion"
}`
  }

  // MARKETING
  if (actionType === 'crear_post') {
    return `You are a social media strategist. Generate social media content.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate content JSON:
{
  "platform": "",
  "copy": "",
  "hashtags": [],
  "call_to_action": "",
  "media_brief": ""
}`
  }

  if (actionType === 'crear_newsletter') {
    return `You are a newsletter editor. Generate a newsletter issue.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

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
    return `You are a video producer. Generate a video brief.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

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
    return `You are a social content designer. Generate a carousel concept.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate carousel JSON:
{
  "title": "",
  "slides": [
    {"number": 1, "copy": "", "visual_direction": ""}
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

If \`audience\` is empty, derive targeting.audience from the brand context's target audiences instead of leaving it blank or inventing a new one — label it '[RECOMENDACIÓN]'. budget_allocation must split the \`budget\` figure from the input across channels/platforms (percentages or amounts that sum to it) — never invent a total budget that wasn't provided. kpis targets must be null unless derivable from input/context.

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

  if (actionType === 'analizar_competencia') {
    return `You are a competitive analyst. Analyze competitors.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

You have no live research on these competitors — only their names and the focus area from the input. Do not present specific claims about their pricing, features, or market share as verified fact; frame strengths/weaknesses/positioning as informed analysis and prefix genuinely speculative claims with '[SUPUESTO]'. Never invent numbers (market share %, pricing, revenue) for a competitor.

Generate analysis JSON:
{
  "competitors": [
    {"name": "", "strengths": [], "weaknesses": [], "positioning": ""}
  ],
  "market_gaps": [],
  "strategic_opportunities": []
}`
  }

  if (actionType === 'brainstorm_ideas') {
    return `You are an innovation strategist. Generate strategic ideas.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate ideas JSON:
{
  "theme": "",
  "ideas": [
    {"title": "", "description": "", "potential": "", "implementation": ""}
  ],
  "next_steps": []
}`
  }

  // FINANZAS
  if (actionType === 'proyeccion_financiera') {
    return `You are a financial analyst. Build a 12-month financial projection for this business.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

If \`growth_rate\` is empty, do not invent a specific rate — use a conservative, clearly-labeled '[SUPUESTO]' range instead, and say so in \`assumptions\`.

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
Generate cashflow JSON:
{
  "summary": "Current cash position assessment in 2-3 sentences",
  "inflows": [{"source": "", "amount": "", "frequency": "", "reliability": "alta|media|baja"}],
  "outflows": [{"category": "", "amount": "", "frequency": "", "optimizable": true}],
  "runway_months": "",
  "cash_gaps": [{"period": "", "gap": "", "mitigation": ""}],
  "improvement_actions": [{"action": "", "impact": "", "effort": "bajo|medio|alto"}],
  "alerts": ["alert 1"],
  "assumptions": []
}`
  }

  if (actionType === 'optimizar_costos') {
    return `You are a cost optimization consultant. Identify concrete savings opportunities without harming growth.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

If \`target_savings\` is empty, propose a reasonable target yourself from the described spending structure, prefixed '[RECOMENDACIÓN]', instead of leaving it unaddressed — but never invent specific euro amounts for \`current_monthly\`/\`optimized_monthly\` that aren't derivable from \`current_expenses\`.

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
  "trends": [{"name": "", "description": "", "maturity": "emergente|creciendo|consolidada", "relevance": "alta|media|baja", "opportunity": "", "first_move": ""}],
  "threats": [{"threat": "", "timeline": "", "mitigation": ""}],
  "recommended_bets": [{"bet": "", "why_now": "", "investment_level": "bajo|medio|alto"}],
  "watch_list": ["trend to monitor 1", "trend to monitor 2"]
}`
  }

  if (actionType === 'auditar_innovacion') {
    return `You are an innovation consultant. Audit this company's innovation capacity and portfolio.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

All scores ("innovation_score" and each dimension "score") must be numbers on an explicit 0-100 scale (0 = no capacity, 100 = world-class). Derive each score from the evidence in the input and context.

Generate audit JSON:
{
  "innovation_score": 0,
  "summary": "2-3 sentence assessment",
  "dimensions": [{"dimension": "Cultura|Procesos|Portfolio|Tecnología|Talento", "score": 0, "findings": "", "gap": ""}],
  "strengths": ["strength 1"],
  "weaknesses": ["weakness 1"],
  "benchmarks": [{"competitor_or_leader": "", "what_they_do": "", "lesson": ""}],
  "priority_initiatives": [{"initiative": "", "impact": "", "effort": "bajo|medio|alto", "timeline": ""}]
}`
  }

  if (actionType === 'roadmap_innovacion') {
    return `You are an innovation strategist. First diagnose this brand's current innovation capacity (from the current_state input), then build an innovation roadmap for the requested timeline.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

"innovation_score" must be a number on an explicit 0-100 scale (0 = no capacity, 100 = world-class), derived from the current_state input.

Generate roadmap JSON:
{
  "diagnosis": {"innovation_score": 0, "summary": "2-3 sentence assessment of current innovation capacity", "strengths": [""], "gaps": [""]},
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

  // VISUAL GENERATION (NEW — async flow via Visual Production Agent)
  if (actionType === 'crear_post_visual') {
    return `You are a visual content strategist. Generate directives for an AI image generator to create a social media post with integrated visual design.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate visual post spec JSON:
{
  "post_copy": "The exact text/copy that will appear on the post",
  "visual_direction": "Detailed visual direction for AI image generator (color palette, composition, mood, style)",
  "hashtags": ["hashtag1", "hashtag2"],
  "call_to_action": "Main CTA for the post",
  "platform_optimized_for": "instagram|linkedin|twitter",
  "brand_guidelines_applied": "Specific brand elements/colors/fonts to emphasize",
  "image_generation_prompt": "Detailed prompt for image generator (background, subjects, lighting, style, mood)"
}`
  }

  if (actionType === 'crear_carrusel_visual') {
    return `You are a visual storyteller. Generate directives for an AI image generator to create a multi-slide carousel with integrated visuals.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate carousel spec JSON:
{
  "carousel_title": "Overall carousel title/theme",
  "slides": [
    {
      "slide_number": 1,
      "copy": "Text/copy for this slide",
      "visual_direction": "Visual style/composition for this slide",
      "image_generation_prompt": "Specific prompt for image generator for this slide"
    }
  ],
  "overall_visual_theme": "Cohesive visual direction across all slides",
  "brand_guidelines": "Brand colors/fonts/elements to weave throughout",
  "final_cta_slide": "Call-to-action text for last slide",
  "hashtags": ["hashtag1"]
}`
  }

  if (actionType === 'editar_imagen_visual') {
    return `You are a visual refinement specialist. Generate detailed refinement directives for editing an existing AI-generated image.

You cannot see the original image; rely ONLY on the description provided in the input. Do not invent details about the current image that are not described.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate refinement spec JSON:
{
  "refinement_request": "What the user wants changed",
  "specific_changes": [
    {"element": "Name of element to change", "current_state": "How it looks now", "desired_state": "How it should look"}
  ],
  "protected_elements": ["Elements that must NOT be regenerated (e.g., text, logo)"],
  "color_adjustments": "Any specific color changes needed",
  "composition_notes": "Notes on layout/framing adjustments",
  "refinement_prompt": "Detailed prompt for image generator to apply refinements while preserving protected elements"
}`
  }

  return null
}
