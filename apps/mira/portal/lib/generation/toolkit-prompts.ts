import { fetchBrandBrain } from '@/lib/brand-brain'
import { retrieveAgentContext } from '@/lib/agent-context'
import { getClientMemoryContext } from '@/lib/client-memory'

export interface ToolPromptParams {
  clientId: string
  inputData: Record<string, any>
}

export async function getToolkitPrompt(
  toolSlug: string,
  params: ToolPromptParams
): Promise<string | null> {
  const { clientId, inputData } = params

  const [brandBrain, memoryContext, docContext] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId),
    retrieveAgentContext({
      client_id: clientId,
      context_type: 'all',
      limit: 3,
    }),
  ])

  const brandContext = brandBrain
    ? `
BRAND CONTEXT:
- Name: ${brandBrain.brandName}
- Mission: ${brandBrain.mission}
- Tone: ${Object.entries(brandBrain.toneOfVoice).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Pillars: ${brandBrain.pillars.map(p => `${p.name} (${p.description})`).join('; ')}
`
    : ''

  const docText = docContext?.documents
    ?.map((d: any) => d.excerpt)
    .join('\n') || ''

  const allContext = [docText, brandContext, memoryContext]
    .filter(Boolean)
    .join('\n\n')

  const fullContext = allContext ? `\n\nCLIENT DOCUMENTATION:\n${allContext}` : ''

  // Prompts específicos por herramienta
  switch (toolSlug) {
    case 'brand-briefing':
      return `You are a brand strategist. Generate a comprehensive brand briefing document with JSON structure.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a brand briefing JSON with these exact sections:
{
  "brand_identity": {"name": "", "mission": "", "proposition": ""},
  "target_audience": {"description": "", "personas": [], "pain_points": []},
  "brand_pillars": [{"name": "", "description": "", "examples": []}],
  "content_strategy": {"pillars": [], "content_types": [], "calendar": []},
  "brand_voice": {"tone": "", "personality": [], "messaging": []},
  "visual_identity": {"colors": [], "typography": "", "imagery": ""},
  "success_metrics": {"kpis": [], "tracking": []}
}`

    case 'seo-audit':
      return `You are an SEO expert. Generate a comprehensive SEO audit report.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate an SEO audit JSON with this structure:
{
  "overall_score": 0,
  "sections": [
    {"section_number": "01", "title": "", "score": 0, "findings": [], "status": []},
    {"section_number": "02", "title": "", "score": 0, "findings": [], "status": []}
  ],
  "quick_wins": ["...", "..."],
  "critical_issues": [],
  "long_term_opportunities": [],
  "action_plan": [
    {"priority": "CRÍTICO", "action": "", "impact": "", "timeline": ""},
    {"priority": "ALTO", "action": "", "impact": "", "timeline": ""}
  ]
}`

    case 'marketing-audit':
      return `You are a marketing auditor. Generate a comprehensive marketing audit report.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a marketing audit JSON with this structure:
{
  "overall_score": 0,
  "categories": [
    {"name": "Content Strategy", "score": 0, "findings": [], "recommendations": []},
    {"name": "Social Media", "score": 0, "findings": [], "recommendations": []},
    {"name": "Paid Media", "score": 0, "findings": [], "recommendations": []},
    {"name": "SEO", "score": 0, "findings": [], "recommendations": []},
    {"name": "Email Marketing", "score": 0, "findings": [], "recommendations": []},
    {"name": "Conversion", "score": 0, "findings": [], "recommendations": []}
  ],
  "quick_wins": ["...", "..."],
  "strategic_opportunities": [],
  "6_month_roadmap": [{"quarter": "", "focus": "", "actions": []}]
}`

    case 'content-pack':
      return `You are a content strategist. Generate a comprehensive content pack.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a content pack JSON with this structure:
{
  "blog_posts": [{"title": "", "outline": [], "seo_keywords": [], "cta": ""}],
  "social_content": {"reels": [{"topic": "", "script": ""}], "posts": [{"format": "", "copy": ""}]},
  "email_sequences": [{"subject": "", "angle": "", "body_outline": []}],
  "video_briefs": [{"type": "", "topic": "", "length": "", "script_outline": []}],
  "strategy": {"pillars": [], "calendar": [], "metrics": []}
}`

    case 'action-plan':
      return `You are a strategy consultant. Generate a 30/60/90 day action plan.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate an action plan JSON with this structure:
{
  "30_day_sprint": {"focus": "", "actions": [{"action": "", "owner": "", "metric": ""}]},
  "60_day_push": {"focus": "", "actions": [{"action": "", "owner": "", "metric": ""}]},
  "90_day_vision": {"focus": "", "actions": [{"action": "", "owner": "", "metric": ""}]},
  "kpis": [{"metric": "", "target": "", "tracking": ""}],
  "resources_needed": []
}`

    case 'investor-deck':
      return `You are a fundraising expert. Generate an investor pitch deck outline.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate an investor deck JSON with this structure:
{
  "title_slide": {"company": "", "tagline": "", "founder": ""},
  "problem": {"description": "", "market_size": "", "pain_points": []},
  "solution": {"description": "", "unique_value": "", "market_fit": ""},
  "market": {"tam": "", "sam": "", "som": "", "trend": ""},
  "business_model": {"revenue_streams": [], "pricing": "", "unit_economics": {}},
  "traction": {"metrics": [], "customers": [], "growth_rate": ""},
  "team": [{"name": "", "role": "", "background": ""}],
  "financials": {"revenue": "", "cac": "", "ltv": "", "burn_rate": ""},
  "ask": {"amount": "", "use_of_funds": [], "valuation": ""},
  "closing": {"cta": ""}
}`

    case 'competitive-analysis':
      return `You are a competitive strategist. Generate a competitive analysis report.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a competitive analysis JSON with this structure:
{
  "competitors": [
    {
      "name": "",
      "positioning": "",
      "strengths": [],
      "weaknesses": [],
      "pricing": "",
      "go_to_market": "",
      "market_share": ""
    }
  ],
  "landscape": {"trends": [], "gaps": [], "opportunities": []},
  "positioning_recommendation": {"differentiation": "", "messaging": "", "target": ""},
  "action_plan": [{"priority": "", "action": "", "timeline": ""}]
}`

    case 'brandbook-content-system':
      return `You are a brand strategist. Generate a comprehensive brandbook and content system.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a brandbook JSON with this structure:
{
  "brand_identity": {"logo_guidelines": "", "color_palette": [], "typography": ""},
  "tone_of_voice": {"voice": "", "personality": [], "do_dont": {"do": [], "dont": []}},
  "content_pillars": [{"name": "", "themes": [], "content_types": []}],
  "content_templates": [{"type": "", "structure": "", "example": ""}],
  "editorial_calendar": [{"month": "", "theme": "", "content_plan": []}],
  "channel_playbooks": [{"channel": "", "format": "", "frequency": "", "best_practices": []}]
}`

    default:
      return null
  }
}
