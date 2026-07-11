import { fetchBrandBrain } from '@/lib/brand-brain'
import { retrieveAgentContext } from '@/lib/agent-context'

export interface QuickActionPromptParams {
  clientId: string
  inputData: Record<string, any>
}

export async function getQuickActionPrompt(
  actionType: string,
  params: QuickActionPromptParams
): Promise<string | null> {
  const { clientId, inputData } = params

  const brandBrain = await fetchBrandBrain(clientId)
  const brandContext = brandBrain
    ? `
BRAND CONTEXT:
- Name: ${brandBrain.brandName}
- Mission: ${brandBrain.mission}
- Tone: ${Object.entries(brandBrain.toneOfVoice).map(([k, v]) => `${k}: ${v}`).join(', ')}
`
    : ''

  const docContext = await retrieveAgentContext({
    client_id: clientId,
    context_type: 'all',
    limit: 2,
  })

  const docText = docContext?.documents
    ?.map((d: any) => d.excerpt)
    .join('\n') || ''

  const contextBlock = docText || brandContext ? `\n\nCONTEXT:\n${docText || 'No documents available'}\n${brandContext}` : ''

  // Prompts específicos por acción
  // ADMIN
  if (actionType === 'responder_ticket') {
    return `You are a support specialist. Generate a professional support response.

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

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
${contextBlock}

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
${contextBlock}

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
    return `You are a sales strategist. Generate a sales campaign strategy.

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

Generate campaign JSON:
{
  "campaign_name": "",
  "target_segment": "",
  "messaging": [],
  "channels": [],
  "timeline": [],
  "success_metrics": []
}`
  }

  if (actionType === 'generar_icp') {
    return `You are a market analyst. Generate an ICP (Ideal Customer Profile).

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

Generate ICP JSON:
{
  "company_profile": {"size": "", "revenue": "", "industry": ""},
  "decision_makers": [{"role": "", "priorities": [], "pain_points": []}],
  "buying_process": {"timeline": "", "budget": "", "stakeholders": []},
  "fit_indicators": []
}`
  }

  if (actionType === 'crear_propuesta') {
    return `You are a proposal writer. Generate a sales proposal outline.

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

Generate proposal JSON:
{
  "executive_summary": "",
  "problem_statement": "",
  "proposed_solution": "",
  "pricing": {"tiers": []},
  "timeline": "",
  "next_steps": []
}`
  }

  if (actionType === 'calificar_reply') {
    return `You are a sales qualification expert. Analyze and score a reply.

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

Generate analysis JSON:
{
  "qualification_score": 0,
  "sentiment": "",
  "interest_level": "",
  "next_action": "",
  "suggested_response": ""
}`
  }

  // MARKETING
  if (actionType === 'crear_post') {
    return `You are a social media strategist. Generate social media content.

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

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
${contextBlock}

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
${contextBlock}

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
${contextBlock}

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
${contextBlock}

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
${contextBlock}

Generate report JSON:
{
  "title": "",
  "executive_summary": "",
  "findings": [],
  "analysis": "",
  "recommendations": [],
  "implementation_roadmap": []
}`
  }

  if (actionType === 'analizar_competencia') {
    return `You are a competitive analyst. Analyze competitors.

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

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
${contextBlock}

Generate ideas JSON:
{
  "theme": "",
  "ideas": [
    {"title": "", "description": "", "potential": "", "implementation": ""}
  ],
  "voting_results": {},
  "next_steps": []
}`
  }

  if (actionType === 'proyectar_revenue') {
    return `You are a financial planner. Project revenue.

INPUT:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

Generate projection JSON:
{
  "current_state": {},
  "assumptions": [],
  "monthly_forecast": [{"month": "", "revenue": "", "growth": ""}],
  "drivers": [],
  "risks": []
}`
  }

  return null
}
