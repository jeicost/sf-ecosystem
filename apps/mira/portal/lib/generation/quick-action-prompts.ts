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
    return `Task: Create a marketing campaign strategy based on provided input.

Input: ${JSON.stringify(inputData, null, 2)}

Output ONLY valid JSON (no markdown, no text before/after):
{"campaign_name":"Campaign Name","target_segment":"Audience description","messaging":["Message 1","Message 2"],"channels":["Channel 1","Channel 2"],"timeline":["Period 1: Action","Period 2: Action"],"success_metrics":["Metric 1","Metric 2"]}`
  }

  if (actionType === 'generar_icp') {
    return `Task: Generate an Ideal Customer Profile (ICP) analysis.

Input: ${JSON.stringify(inputData, null, 2)}

Output ONLY valid JSON (no markdown, no text):
{"company_profile":{"size":"Size range","revenue":"Revenue range","industry":"Industry"},"decision_makers":[{"role":"Title","priorities":["Priority"],"pain_points":["Pain"]}],"buying_process":{"timeline":"Timeline","budget":"Budget","stakeholders":["Stakeholder"]},"fit_indicators":["Fit1","Fit2"]}`
  }

  if (actionType === 'crear_propuesta') {
    return `You are a professional proposal writer. Create a business proposal outline for a potential client.

Input:
${JSON.stringify(inputData, null, 2)}
${contextBlock}

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
${contextBlock}

Return ONLY valid JSON (no markdown):
{
  "qualification_score": 7,
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
