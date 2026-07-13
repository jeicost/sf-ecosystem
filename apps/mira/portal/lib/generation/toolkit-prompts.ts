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
      return `You are an SEO expert. Generate a DETAILED SEO audit report matching production quality (reference: Salsa Burgers SEO audit at sf-reports.vercel.app).

CRITICAL REQUIREMENTS:
- Score: 0-100 scale (typical range 60-80 for food brands)
- 3-4 detailed sections: Technical SEO, On-page SEO, Content Strategy, Competitive Analysis
- Each finding MUST have: title, severity (CRÍTICO/ALTO/MEDIO/OK), specific problem, impact estimate, exact fix
- Action plan: 5-7 prioritized actions with effort estimates (hours/days), owner role, expected ROI
- Be specific with real metrics, not generic advice
- Include actual site data from input

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate SEO audit JSON:
{
  "overall_score": number,
  "scoreLabel": "SEO Health Score",
  "sections": [
    {
      "title": "Technical SEO",
      "findings": [
        {
          "id": number,
          "title": "specific issue name",
          "severity": "CRÍTICO|ALTO|MEDIO|OK",
          "description": "detailed problem explanation",
          "impact": "estimated business impact with number (e.g. -15% mobile traffic)"
        }
      ]
    },
    {
      "title": "On-page SEO",
      "findings": [...]
    }
  ],
  "statCards": [
    {"label": "Pages Indexed", "value": "number or range"},
    {"label": "Core Web Vitals", "value": "status"},
    {"label": "Ranking Keywords", "value": "count"},
    {"label": "Backlink Profile", "value": "count"}
  ],
  "actions": [
    {
      "id": number,
      "title": "specific action",
      "priority": "CRÍTICO|ALTO|MEDIO",
      "impact": "+X% traffic estimate",
      "effort": "X hours or Y days",
      "owner": "team role"
    }
  ],
  "generatedAt": "just now"
}`

    case 'marketing-audit':
      return `You are a marketing auditor. Generate a DETAILED marketing audit matching production quality (reference: Salsa Burgers marketing audit at sf-reports.vercel.app).

CRITICAL REQUIREMENTS:
- Overall score: 0-100 (typical range 50-80)
- 6 category scores with detailed findings (not generic, use brand data)
- Brand & Positioning section (identity strength, consistency, positioning vs competitors)
- Conversion Funnel section (CTA clarity, order flow, friction points)
- Trust & Authority section (social proof, reviews, credentials)
- Quick Wins: 5 high-impact, low-effort actions (tagged by area, estimated ROI)
- Each finding MUST have severity, impact estimate, specific fix

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate marketing audit JSON:
{
  "overall_score": number,
  "scoreLabel": "Marketing Health Score",
  "statCards": [
    {"label": "Brand Identity Score", "value": "number/100"},
    {"label": "Conversion Funnel", "value": "score/100"},
    {"label": "Social Media", "value": "score/100"},
    {"label": "Local Marketing", "value": "score/100"}
  ],
  "sections": [
    {
      "title": "Brand & Positioning",
      "findings": [
        {
          "id": number,
          "title": "specific issue",
          "severity": "CRÍTICO|ALTO|MEDIO|OK",
          "description": "problem + impact"
        }
      ]
    },
    {
      "title": "Conversion Funnel",
      "findings": [...]
    },
    {
      "title": "Trust & Authority (E-E-A-T)",
      "findings": [...]
    }
  ],
  "quickWins": [
    {
      "id": number,
      "title": "action",
      "priority": "ALTO",
      "impact": "+X% conversions or revenue",
      "effort": "Easy",
      "owner": "Role"
    }
  ],
  "generatedAt": "just now"
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
