import { fetchBrandBrain } from '@/lib/brand-brain'
import { retrieveAgentContext } from '@/lib/agent-context'
import { getClientMemoryContext } from '@/lib/client-memory'
import { adminClient } from '@/lib/supabase'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

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


export interface ToolPromptParams {
  clientId: string
  inputData: Record<string, any>
  /** Pre-formatted VERIFIED SITE FACTS block (built by the route with formatSnapshotForPrompt). */
  siteFactsBlock?: string
  /** Pre-formatted SOURCES block (built by the route with formatSourcesForPrompt). */
  sourcesBlock?: string
}

// Toolkit-specific memory queries: which tags to load from project_memory
const TOOLKIT_MEMORY_QUERIES: Record<string, string[]> = {
  'brand-briefing': [],
  'marketing-audit': ['brand_briefing', 'marketing_history', 'customer_feedback'],
  'content-pack': ['brand_briefing', 'marketing_audit', 'past_content'],
  'action-plan': ['brand_briefing', 'marketing_audit', 'content_pack', 'team_capacity'],
  'competitive-analysis': [],  // Made independent - doesn't require prior dependencies
  'seo-audit': ['content_pack', 'keyword_tracking', 'seo_history'],
  'brandbook': ['brand_briefing', 'content_pack', 'marketing_audit', 'competitive_analysis', 'seo_audit'],
  'investor-deck': ['brand_briefing', 'action_plan', 'traction_data'],
}

// Fetch toolkit-specific dependencies from project_memory
async function getToolkitDependencies(clientId: string, toolSlug: string): Promise<Record<string, any>> {
  const tags = TOOLKIT_MEMORY_QUERIES[toolSlug] || []
  if (tags.length === 0) return {}

  const admin = adminClient()
  const dependencies: Record<string, any> = {}

  try {
    for (const tag of tags) {
      const { data } = await admin
        .from('project_memory')
        .select('*')
        .eq('client_id', clientId)
        .contains('tags', [tag])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        dependencies[tag] = {
          id: data.id,
          data: data.full_content,
          title: data.title,
        }
      }
    }
  } catch (error) {
    // Silently fail if dependencies not found (optional, not blocking)
    console.warn(`Could not load dependencies for ${toolSlug}:`, error)
  }

  return dependencies
}

export async function getToolkitPrompt(
  toolSlug: string,
  params: ToolPromptParams
): Promise<string | null> {
  const { clientId, inputData, siteFactsBlock, sourcesBlock } = params

  const [brandBrain, memoryContext, docContext, toolkitDeps] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId),
    retrieveAgentContext({
      client_id: clientId,
      context_type: 'all',
      limit: 3,
    }),
    getToolkitDependencies(clientId, toolSlug),
  ])

  // Expanded Brand Brain Context with all essential data
  const brandContext = brandBrain
    ? `
BRAND CONTEXT (Source of Truth):
- Name: ${brandBrain.brandName}
- Mission: ${brandBrain.mission}
- Tagline: ${brandBrain.tagline || 'Not defined'}
- Personality: ${brandBrain.brandPersonality?.join(', ') || 'Not defined'}
- Pillars: ${brandBrain.pillars.map(p => `${p.name} (${p.description})`).join('; ')}
- Tone of Voice: ${formatTone(brandBrain.toneOfVoice)}
- Visual Identity Summary: ${brandBrain.visualIdentitySummary || 'Not defined'}
- Target Audiences: ${brandBrain.audiences ? JSON.stringify(brandBrain.audiences) : 'Not defined'}
- Banned Phrases: ${brandBrain.bannedPhrases?.join(', ') || 'None'}
`
    : ''

  const docText = docContext?.documents
    ?.map((d: any) => d.excerpt)
    .join('\n') || ''

  // Build dependency context for toolkits that reference previous outputs.
  // The 2 most relevant dependencies for this tool (first tags in TOOLKIT_MEMORY_QUERIES,
  // which are ordered by relevance) get a larger excerpt; the rest stay short so the
  // context does not explode.
  const priorityTags = (TOOLKIT_MEMORY_QUERIES[toolSlug] || []).slice(0, 2)
  const dependencyContext = Object.entries(toolkitDeps)
    .map(([tag, dep]: [string, any]) => {
      const charLimit = priorityTags.includes(tag) ? 2000 : 500
      const json = JSON.stringify(dep.data)
      const excerpt = json.length > charLimit ? `${json.slice(0, charLimit)}...` : json
      return `\n[DEPENDENCY: ${tag}] (${dep.title})\nID: ${dep.id}\nData: ${excerpt}`
    })
    .join('\n')

  const allContext = [docText, brandContext, dependencyContext, memoryContext]
    .filter(Boolean)
    .join('\n\n')

  // Grounded tools receive pre-formatted VERIFIED SITE FACTS / SOURCES blocks from the route.
  const GROUNDED_TOOLS = ['seo-audit', 'marketing-audit', 'competitive-analysis', 'investor-deck', 'brand-briefing']
  const groundingBlocks = GROUNDED_TOOLS.includes(toolSlug)
    ? [siteFactsBlock, sourcesBlock].filter(Boolean).join('\n\n')
    : ''

  // Shared context for ALL tool prompts: client docs/dependencies, injected grounding
  // blocks (when available for this tool), and the anti-hallucination contract.
  const fullContext = [
    allContext ? `\n\nCLIENT DOCUMENTATION & DEPENDENCIES:\n${allContext}` : '',
    groundingBlocks ? `\n\n${groundingBlocks}` : '',
    `\n\n${GROUNDING_CONTRACT}`,
  ].join('')

  // Prompts específicos por herramienta
  switch (toolSlug) {
    case 'brand-briefing':
      return `You are a brand strategist creating the SOURCE OF TRUTH for this brand.

⚠️ CRITICAL: This is TIER 1. You are defining canonical brand data that will be referenced by ALL other toolkits.
- Brand pillars you define here MUST be used exactly by Content Pack, Marketing Audit, and Brandbook.
- Brand voice you define here will be the standard for all content.
- Do NOT generate duplicate or conflicting data. Ensure internal consistency.
- Include warnings if any data seems contradictory (e.g., "premium brand but budget messaging").

⚠️ INPUT-GROUNDED FIELDS (do not invent these — the user provided them):
- \`mision_valores\` → base directly for brand_identity.mission/vision/values. Do not replace with a generic mission.
- \`audiencia_objetivo\` → base directly for target_audience.description/personas. Expand into personas, but keep the described audience as the anchor — do not invent a different one.
- \`personalidad_tono\` → base directly for brand_voice.tone/traits/do_examples/dont_examples.
- \`colores_marca\` (hex) → use as visual_identity.colors[0] (primary) verbatim. Propose complementary/secondary colors from it, but never invent the primary hex.
- If VERIFIED SITE FACTS are present above, ground visual_identity.imagery_style and any competitive_positioning claim in what was actually observed on the site — do not describe a site you have not seen.
- If any of these fields is missing or too thin to use, follow the GROUNDING_CONTRACT below: mark the derived field with '[SUPUESTO]' instead of inventing it silently.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a COMPREHENSIVE brand briefing JSON with ALL these sections:
{
  "brand_story": {"founding": "", "origin_narrative": "", "why_exists": ""},
  "brand_identity": {"name": "", "mission": "", "vision": "", "values": [], "personality": []},
  "brand_promise": {"covenant": "", "customer_expectation": "", "guarantee": ""},
  "competitive_positioning": {"vs_alternatives": "", "unique_advantage": ""},
  "target_audience": {"description": "", "personas": [{"name": "", "behavior": "", "pain_points": []}]},
  "brand_pillars": [{"name": "", "description": "", "examples": []}],
  "brand_voice": {"tone": "", "traits": [], "messaging": [], "do_examples": [], "dont_examples": []},
  "visual_identity": {"colors": [{"name": "", "hex": "", "usage": ""}], "typography": {"heading": "", "body": ""}, "imagery_style": ""},
  "content_strategy": {"pillars": [], "content_types": [], "calendar_12month": []},
  "customer_journey_touchpoints": {"awareness": [], "consideration": [], "decision": [], "loyalty": []},
  "brand_values_in_practice": [{"value": "", "example": ""}],
  "brand_evolution": {"2_year_roadmap": "", "potential_expansions": []},
  "success_metrics": {"kpis": [{"name": "", "target": "", "tracking": ""}], "health_dashboard": ""},
  "data_coherence": {"conflicts_detected": false, "warnings": []}
}`

    case 'seo-audit':
      return `You are an SEO expert analyzing a website's organic search execution based on VERIFIED SITE FACTS.

⚠️ TIER 5: TECHNICAL VALIDATION TOOLKIT
- If Content Pack topics/keywords appear in dependencies, VALIDATE that target keywords align with content pillars/topics
- FLAG if keyword strategy contradicts content strategy (e.g., targeting bargain terms when the brand positioning is premium)
- Include keyword_alignment field with status: aligned|misaligned|unknown

GROUNDING RULES FOR THIS AUDIT:
- Every observation about the site MUST come from the VERIFIED SITE FACTS block above. If a fact is not there, treat it as "unknown" — never guess.
- Technical checks (HTTPS, sitemap, robots.txt, analytics, schema markup, viewport, canonical, hreflang...) are computed programmatically by the system from the site snapshot. Do NOT fabricate check results or measured values — your job is to ANALYZE the verified facts and RECOMMEND improvements.
- overall_score and statCard values will be computed programmatically; output null for overall_score and an empty statCards array.
- NEVER invent page-speed metrics, Core Web Vitals, rankings, search volumes, traffic numbers, publication dates, or counts. Missing data → "unknown" + entry in data_gaps.
- If the VERIFIED SITE FACTS block is absent or marked SITE UNREACHABLE, mark every site-dependent field "unknown" and say so in data_gaps.

YOUR JOB:
- ANALYZE the verified site facts (title, meta description, headings, images/alt coverage, internal/external links, analytics and schema detected) and produce concrete, client-specific recommendations.
- Propose a keyword strategy grounded in the brand context and user input. Search volumes and rankings are "unknown" unless real data appears in the context.
- Recommend schema markup types relevant to THIS business (choose based on its industry, never assume a default vertical).
- Each on-page finding MUST have: element, status, current value (verbatim from site facts, or "unknown"), recommendation, analysis.
- Action plan: 6 prioritized actions with severity tags, qualitative expected impact prefixed '[RECOMENDACIÓN]' (no invented percentages), effort estimate, owner.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate SEO audit JSON (EXACT STRUCTURE — field examples below are generic placeholders, replace them with analysis specific to this client):
{
  "overall_score": null,
  "overall_trend": null,
  "scoreLabel": "SEO Health Score",
  "statCards": [],
  "keyword_alignment": {"status": "aligned|misaligned|unknown", "notes": "how target keywords relate to content pillars"},
  "sections": [
    {
      "title": "On-Page SEO",
      "description": "On-page elements, meta tags, heading structure — derived from VERIFIED SITE FACTS",
      "type": "table",
      "elements": [
        {
          "element": "Title tag",
          "status": "ok|warning|critical|falta|unknown",
          "current": "exact title from site facts, or 'unknown'",
          "recommendation": "suggested improved title",
          "analysis": "Why it matters and how to fix it, referencing the verified fact you analyzed."
        },
        {
          "element": "Meta description",
          "status": "ok|warning|falta|unknown",
          "current": "exact meta from site facts, or 'unknown'",
          "recommendation": "improved meta",
          "analysis": "..."
        },
        {
          "element": "H1",
          "status": "ok|warning|critical|unknown",
          "current": "exact H1 from site facts, or 'unknown'",
          "recommendation": "improved H1",
          "analysis": "..."
        },
        {
          "element": "H2 / Estructura",
          "status": "ok|aceptable|warning|unknown",
          "analysis": "Heading hierarchy assessment based on site facts..."
        },
        {
          "element": "Imágenes / Alt text",
          "status": "ok|warning|falta|unknown",
          "current": "alt coverage from site facts, or 'unknown'",
          "analysis": "..."
        },
        {
          "element": "Enlazado interno",
          "status": "ok|mejorable|unknown",
          "analysis": "Based on internal/external link counts in site facts..."
        },
        {
          "element": "Canonical",
          "status": "ok|falta|unknown",
          "analysis": "..."
        },
        {
          "element": "Contenido / Frescura",
          "status": "ok|warning|unknown",
          "analysis": "Only what the site facts show; otherwise 'unknown'..."
        }
      ]
    },
    {
      "title": "Schema Markup",
      "description": "Structured data recommendations (detected schema types come from VERIFIED SITE FACTS)",
      "type": "schema_cards",
      "schemas": [
        {"name": "schema type relevant to THIS business", "status": "active|missing|unknown", "color": "green|red|gray", "impact": "which rich snippet it enables", "opportunity": "why it helps this specific client"}
      ]
    },
    {
      "title": "Keywords Target",
      "description": "Keyword opportunities grounded in brand context and user input",
      "type": "table",
      "keywords": [
        {
          "keyword": "keyword phrase relevant to this business and audience",
          "volume": "unknown unless real data provided",
          "intent": "Transaccional|Comercial|Informacional|Branded",
          "priority": "#1|#2|Quick win|Blog topic",
          "current_rank": "unknown unless real data provided"
        }
      ]
    },
    {
      "title": "Contenido & Blog",
      "description": "Editorial content assessment based on verified site facts and dependencies",
      "type": "table",
      "assessment": [
        {
          "element": "Blog / contenido editorial",
          "status": "ok|missing|unknown",
          "description": "Only what site facts show; otherwise 'unknown'"
        },
        {
          "element": "Article schema",
          "status": "ok|falta|unknown",
          "recommendation": "[RECOMENDACIÓN] add BlogPosting schema if editorial content exists..."
        },
        {
          "element": "Internal linking",
          "status": "ok|mejorable|unknown",
          "description": "Based on link data in site facts..."
        },
        {
          "element": "Alineación con content pillars",
          "status": "aligned|misaligned|unknown",
          "description": "Compare against Content Pack dependency if available..."
        }
      ]
    }
  ],
  "actions": [
    {
      "id": 1,
      "number": 1,
      "title": "Specific action title",
      "description": "Detailed description",
      "priority": "CRÍTICO|ALTO|MEDIO",
      "severity_tag": "critical|warning|info",
      "impact": "[RECOMENDACIÓN] qualitative expected impact — no invented percentages",
      "effort": "estimate in hours or days",
      "owner": "team role",
      "expected_roi": "alto|medio|bajo"
    }
  ],
  "data_gaps": ["every data point you needed but could not find in the context"],
  "generatedAt": "just now"
}`

    case 'marketing-audit':
      return `You are a marketing auditor validating that current marketing ALIGNS with Brand Briefing.

⚠️ TIER 2: VALIDATION TOOLKIT
- Load Brand Briefing from dependencies (if available)
- CRITICAL: Validate that current marketing applies the brand correctly
- FLAG contradictions: if brand says "premium" but marketing says "cheapest", FAIL with error
- Include "coherence_check" in output with status: aligned|misaligned|conflicts
- If Brand Briefing exists, compare pillars/voice/positioning against current marketing strategy

GROUNDING RULES:
- Observations about the website MUST come from the VERIFIED SITE FACTS block above. Anything not present there is "unknown" — never guess.
- Do NOT invent follower counts, engagement rates, review counts, traffic numbers, or dates. Missing data → "unknown" + entry in data_gaps.
- Scores must be justified by evidence found in the context. If there is not enough evidence to score a category, output null for that value. NEVER target a predetermined score range.
- Recommendations and hypotheses MUST be prefixed '[RECOMENDACIÓN]' or '[SUPUESTO]'.
- If the VERIFIED SITE FACTS block is absent or marked SITE UNREACHABLE, mark site-dependent cards "unknown".

CRITICAL REQUIREMENTS:
- Overall score: 0-100 only when justified by evidence; otherwise null. No trend unless historical data exists in the context (otherwise null).
- 6 category scores: Brand Identity, Conversion Funnel, Social Media, Content Marketing, Lead Capture, Local Marketing (null when no evidence)
- Sections MUST follow this structure (4 color-coded cards per section, titles adapted to THIS business — never assume a default industry):
  * Brand & Posicionamiento (4 cards: USP clarity, Visual Identity, Hero product/service, Business listings/profiles)
  * Conversion Funnel (4 cards: primary CTA visibility, purchase/booking channels, direct contact channels, email capture)
  * Social Media & Contenido (4 cards: social proof on site, social presence/links, content freshness, reviews/testimonials)
  * Trust & Autoridad (E-E-A-T matrix with 4 dimensions: Experience, Expertise, Authority, Trust)
- Quick Wins: 5 actions with effort_tag (Fácil/Medio), qualitative ROI, specific hours/timeframe
- Each card MUST have: title, status (strong/present/missing/warning/unknown), color_border (teal/red/orange/green), content grounded in site facts or client context

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate marketing audit JSON (EXACT STRUCTURE — card titles below are generic placeholders, adapt them to this client):
{
  "overall_score": number or null,
  "overall_trend": null,
  "scoreLabel": "Marketing Health Score",
  "statCards": [
    {"label": "Brand Identity", "value": "number/100 or null", "description": "short evidence-based desc"},
    {"label": "Conversion Funnel", "value": "number/100 or null", "description": "short desc"},
    {"label": "Social Media", "value": "number/100 or null", "description": "short desc", "status": "critical|warning|good"},
    {"label": "Content Marketing", "value": "number/100 or null", "description": "short desc"},
    {"label": "Lead Capture", "value": "number/100 or null", "description": "short desc"},
    {"label": "Local Marketing", "value": "number/100 or null", "description": "short desc"}
  ],
  "sections": [
    {
      "title": "Brand & Posicionamiento",
      "description": "Identidad visual, propuesta de valor y consistencia de marca",
      "type": "cards",
      "cards": [
        {
          "title": "Claridad del USP",
          "status": "strong|present|missing|warning|unknown",
          "color_border": "teal|red|orange|green",
          "content": "Evidence-based assessment of the unique selling proposition..."
        },
        {
          "title": "Identidad Visual",
          "status": "strong|present|missing|unknown",
          "color_border": "teal|red|orange",
          "content": "..."
        },
        {
          "title": "Producto/Servicio Hero",
          "status": "strong|present|missing|unknown",
          "color_border": "teal|orange",
          "content": "..."
        },
        {
          "title": "Perfiles de Negocio (listings)",
          "status": "strong|missing|unknown",
          "color_border": "orange|teal",
          "content": "..."
        }
      ]
    },
    {
      "title": "Conversion Funnel",
      "description": "CTA clarity, purchase/booking flow y friction points",
      "type": "cards",
      "icon": "funnel",
      "cards": [
        {"title": "Visibilidad del CTA Principal", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Canales de Compra/Contratación", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Canales de Contacto Directo", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Captación de Email", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."}
      ]
    },
    {
      "title": "Social Media & Contenido",
      "description": "Presencia, engagement y estrategia de contenido",
      "type": "cards",
      "cards": [
        {"title": "Social Proof en la Web", "status": "strong|warning|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Presencia Social Enlazada", "status": "strong|warning|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Frescura del Contenido", "status": "strong|warning|unknown", "color_border": "teal|orange", "content": "Only if site facts show it; otherwise 'unknown'..."},
        {"title": "Reviews / Testimonios", "status": "strong|missing|unknown", "color_border": "teal|orange", "content": "..."}
      ]
    },
    {
      "title": "Trust & Autoridad (E-E-A-T)",
      "description": "Experiencia, expertise, autoridad, confianza",
      "type": "eeat_matrix",
      "icon": "star",
      "dimensions": [
        {"name": "Experience", "status": "Strong|Present|Weak", "content": "..."},
        {"name": "Expertise", "status": "Strong|Present|Weak", "content": "..."},
        {"name": "Authority", "status": "Strong|Present|Weak", "content": "..."},
        {"name": "Trust", "status": "Strong|Present|Weak", "content": "..."}
      ]
    }
  ],
  "quickWins": [
    {
      "id": 1,
      "number": 1,
      "title": "Specific action",
      "description": "Detailed description of what to do",
      "effort_tag": "Fácil - Alto ROI",
      "effort_hours": "number of hours (e.g., 15 min = 0.25)",
      "impact": "[RECOMENDACIÓN] qualitative expected improvement — no invented percentages",
      "roi_score": "alto|medio|bajo"
    }
  ],
  "coherence_check": {
    "brand_briefing_id": "uuid or 'not_loaded'",
    "pillars_aligned": true,
    "voice_aligned": true,
    "positioning_aligned": true,
    "conflicts": []
  },
  "data_gaps": ["every data point you needed but could not find in the context"],
  "generatedAt": "just now"
}`

    case 'content-pack':
      return `You are a content strategist building content strategy aligned with Brand Briefing.

⚠️ TIER 3: CONTENT STRATEGY TOOLKIT
- CRITICAL: Load Brand Briefing pillars from dependencies
- content_pillars MUST match Brand Briefing pillars EXACTLY (same names, same order)
- If mismatch detected (different pillar names), FAIL with error: "ERROR: Pillars mismatch. Brand Briefing says [X,Y,Z], cannot generate [A,B,C]"
- Use Brand Voice tone and messaging throughout all content
- Map content to Brand Briefing target audience personas
- Include "dependencies" section with brand_briefing_id and pillar_alignment status

⚠️ NEVER INVENT: \`ugc_strategy\` (hashtags, testimonial_program, community_content) must come from \`activos_ugc_comunidad\` in INPUT. If that field is empty, return \`ugc_strategy\` with empty arrays/strings and add "UGC/community assets" to a \`data_gaps\` array — do not invent hashtags or a testimonial program that doesn't exist. Likewise, \`seasonal_campaigns\` and \`content_governance.sla\` should only contain specifics that are inferable from INPUT/context (e.g. \`frecuencia\`); anything not supported stays as a generic placeholder note, not a fabricated cadence or SLA number.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a COMPREHENSIVE content pack JSON with ALL sections:
{
  "brand_briefing_id": "uuid or 'not_loaded'",
  "pillar_alignment": "exact_match|mismatch|warning",
  "dependencies": {"brand_briefing": "", "marketing_audit": ""},
  "content_pillars": [{"name": "", "description": "", "content_types": [], "monthly_volume": ""}],
  "blog_content_hub": [{"title": "", "outline": [], "seo_keywords": [], "target_audience": "", "word_count": ""}],
  "social_media_strategy": {
    "instagram": [{"type": "", "script": "", "visual_notes": ""}],
    "tiktok": [{"script": "", "duration": "", "audio": ""}],
    "linkedin": [{"angle": "", "copy": ""}]
  },
  "email_sequences": [{"name": "", "subject": "", "body_outline": [], "cta": "", "send_timing": ""}],
  "video_content_briefs": [{"type": "", "script_outline": "", "visuals": ""}],
  "content_repurposing": {"blog_post_to_5_formats": {"source": "", "formats": []}},
  "distribution_amplification": {"channels": [{"platform": "", "cadence": "", "tactics": []}]},
  "content_governance": {"creators": [], "approvers": [], "sla": ""},
  "seasonal_campaigns": {"q1": "", "q2": "", "q3": "", "q4": ""},
  "analytics_measurement": {"kpis_per_type": {}, "dashboards": "", "cadence": ""},
  "brand_aligned_checklist": {"voice_check": "", "visual_check": "", "messaging_check": ""},
  "ugc_strategy": {"hashtags": [], "testimonial_program": "", "community_content": ""},
  "content_calendar": {"12_month_rolling": []},
  "data_gaps": ["UGC/community assets if activos_ugc_comunidad was empty, plus any other unsupported specifics"]
}`

    case 'action-plan':
      return `You are a strategy consultant orchestrating 30/60/90 day execution aligned with Brand Briefing mission.

⚠️ TIER 4: OPERATIONAL PLANNING TOOLKIT
- CRITICAL: Load Brand Briefing mission/vision, Marketing Audit gaps, Content Pack calendar
- OKRs MUST align with Brand Briefing success_metrics
- Actions MUST address Marketing Audit gaps and Content Pack deliverables
- If OKRs contradict brand mission (e.g., "scale cheaply" vs "premium positioning"), FAIL
- Include dependencies section with all toolkit IDs and alignment status

⚠️ NEVER INVENT NUMBERS: \`budget_breakdown\` and \`team_capacity.fte\`/\`hiring_plan\` must be derived from \`presupuesto_disponible\` and \`equipo_roles\` in INPUT. If a figure or split is not stated or clearly inferable from those fields, set that value to null (or an empty array) instead of guessing a number — do NOT distribute an invented percentage across engineering/marketing/ops/contingency. Add any missing figure to a \`data_gaps\` array.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a COMPREHENSIVE action plan JSON:
{
  "brand_briefing_id": "uuid",
  "marketing_audit_id": "uuid",
  "content_pack_id": "uuid",
  "dependencies": {"brand_briefing": "", "marketing_audit": "", "content_pack": ""},
  "mission_alignment": {"okr_1": "aligned|warning", "okr_2": "aligned|warning"},
  "executive_summary": "",
  "quarterly_okrs": [{"q": 1, "objectives": []}],
  "30_day_sprint": {"focus": "", "weekly_milestones": [], "actions": [{"title": "", "owner": "", "effort": "", "metric": ""}]},
  "60_day_push": {"focus": "", "weekly_milestones": [], "actions": []},
  "90_day_vision": {"focus": "", "actions": []},
  "success_definition": {"criteria": [], "exit_thresholds": []},
  "resource_requirements": {"team": [], "budget": "", "tools": []},
  "team_capacity": {"roles": [], "fte": "", "hiring_plan": []},
  "budget_breakdown": {"engineering": "", "marketing": "", "ops": "", "contingency": ""},
  "kpis": [{"metric": "", "target": "", "tracking": ""}],
  "learning_loops": {"weekly_reviews": "", "monthly_retros": "", "iteration_cadence": ""},
  "stakeholder_communication": {"audience": [], "cadence": "", "format": ""},
  "risk_mitigation": [{"risk": "", "probability": "", "impact": "", "mitigation": ""}],
  "escalation_procedures": {"decision_framework": "", "approval_levels": []},
  "data_gaps": ["every budget or headcount figure that was null because it was not provided in presupuesto_disponible/equipo_roles"]
}`

    case 'investor-deck':
      return `You are a fundraising expert synthesizing all brand + market + operations data into coherent investor narrative.

⚠️ TIER 7: EXTERNAL STAKEHOLDER TOOLKIT
- CRITICAL: Load Brand Briefing mission, Competitive Analysis market data, Action Plan OKRs, Marketing Audit traction
- Synthesize into single coherent investor story (no contradictions allowed)
- FAIL if Brand Briefing says "premium" but Action Plan budgets "discount growth"
- Cite all claims back to source (verifiable to original toolkit)
- Narrative coherence is paramount: investors will spot inconsistencies

FINANCIAL DATA RULES (STRICT — investors verify every number):
- Financial and traction metrics (CAC, LTV, MRR, ARR, revenue, customer counts, growth rates, burn, margins) may ONLY be stated if they appear verbatim in the INPUT data or CLIENT CONTEXT below. NEVER estimate or invent them.
- If a metric is missing, put the literal placeholder '[COMPLETAR: dato real]' in its field AND add the metric name to the 'data_gaps' array.
- Market size / growth figures must come from the context or SOURCES (cite the URL); otherwise use '[COMPLETAR: dato real]' or prefix the estimate with '[SUPUESTO]'.
- Testimonials: NEVER invent names, companies, or quotes. Only include testimonials that appear in the context; otherwise return an empty customer_testimonials array and add "customer testimonials" to data_gaps.
- Team, board, and advisor entries only from the context — never fabricate people.
- \`the_ask.valuation\`/\`post_money\` come from \`valuation_terms\` in INPUT if provided; if not, use '[COMPLETAR: dato real]', never estimate a valuation.
- \`board_and_advisors\` comes from \`board_advisors\` in INPUT if provided; if empty, return an empty array — never invent board members.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate COMPREHENSIVE investor deck JSON:
{
  "brand_briefing_id": "uuid",
  "competitive_analysis_id": "uuid",
  "action_plan_id": "uuid",
  "marketing_audit_id": "uuid",
  "seo_audit_id": "uuid",
  "narrative_coherence": "verified|contradictions_found",
  "conflicts": [],
  "title_slide": {"company": "", "tagline": "", "mission": ""},
  "executive_summary": {"problem_solution_market": "", "why_now": ""},
  "the_problem": {"tam": "", "market_segments": "", "pain_points": [], "incumbent_solutions": ""},
  "the_solution": {"description": "", "how_it_works": "", "unique_value_prop": "", "defensibility": ""},
  "go_to_market": {"acquisition_channels": [], "partnerships": "", "sales_process": ""},
  "business_model": {"revenue_streams": [], "pricing_strategy": "", "pricing_tiers": []},
  "unit_economics": {"cac": "", "ltv": "", "payback_period": "", "gross_margin": ""},
  "market_and_competition": {"market_size": "", "growth_rate": "", "competitive_landscape": [], "differentiation": ""},
  "traction_and_validation": {"customers_count": "", "revenue_mrr_arr": "", "key_metrics": [], "growth_trajectory": "", "awards_partnerships": ""},
  "customer_testimonials": [{"quote": "", "customer": "", "company": ""}],
  "team": [{"name": "", "role": "", "background": "", "wins": []}],
  "board_and_advisors": [{"name": "", "background": ""}],
  "financials": {"funding_history": "", "monthly_burn": "", "24mo_revenue_projection": ""},
  "risks_and_mitigation": [{"risk": "", "probability": "", "mitigation": ""}],
  "product_roadmap": {"next_12_months": [{"q": "", "milestone": ""}], "how_funding_accelerates": ""},
  "the_ask": {"amount": "", "valuation": "", "post_money": "", "use_of_funds_breakdown": [{"category": "", "percentage": ""}], "expected_milestones": []},
  "contact_and_next_steps": {"contact_email": "", "process_timeline": "", "links": []},
  "data_gaps": ["every metric that required '[COMPLETAR: dato real]' plus any other missing data"]
}`

    case 'competitive-analysis':
      return `You are a competitive strategist analyzing market landscape and competitive positioning.

MARKET INTELLIGENCE TOOLKIT
Analyze competitive landscape based on user input and generate actionable competitive intelligence.

GROUNDING RULES:
- Market size, growth rates, and competitor pricing may ONLY come from the SOURCES block above. When you use a source, cite its URL inside the same field (e.g. "€X B (fuente: https://...)").
- If no source supports a figure, either prefix the whole claim with '[SUPUESTO]' or output "unknown" — never present an unsourced number as fact.
- Do not attribute positioning, features, or pricing to a named competitor unless supported by SOURCES or user input; otherwise prefix '[SUPUESTO]'.
- List every missing market/competitor data point in 'data_gaps'.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate COMPETITIVE ANALYSIS JSON with these core sections:
{
  "positioning_validation": "verified|at_risk|needs_adjustment",
  "recommended_adjustments": ["adjustment 1", "adjustment 2"],
  "executive_summary": "2-3 paragraph overview of competitive landscape and positioning",
  "market_landscape": {
    "size": "figure with source URL, or '[SUPUESTO] ...', or 'unknown'",
    "growth_rate": "figure with source URL, or '[SUPUESTO] ...', or 'unknown'",
    "segments": ["segment 1", "segment 2"],
    "trends": ["trend 1", "trend 2"]
  },
  "competitive_matrix": [
    {
      "name": "competitor name",
      "positioning": "how they position themselves (from SOURCES/input, else '[SUPUESTO] ...')",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "pricing_model": "from SOURCES with URL, or '[SUPUESTO] ...', or 'unknown'",
      "target_customer": "their target segment"
    }
  ],
  "pricing_comparison": [
    {"company": "company name", "price_range": "from SOURCES with URL, or 'unknown'", "value_prop": "their value proposition"}
  ],
  "swot_vs_competitors": {
    "strengths": ["your strength 1", "your strength 2"],
    "weaknesses": ["weakness vs competitors"],
    "opportunities": ["market opportunity"],
    "threats": ["competitive threat"]
  },
  "winning_strategy": {
    "differentiation": "how to differentiate from competitors",
    "gtm_strategy": "go-to-market strategy",
    "marketing_angles": ["angle 1", "angle 2"]
  },
  "key_takeaways": {
    "top_3_competitors": ["competitor 1", "competitor 2", "competitor 3"],
    "top_3_differentiation": ["diff 1", "diff 2", "diff 3"],
    "top_3_opportunities": ["opp 1", "opp 2", "opp 3"]
  },
  "data_gaps": ["every market/competitor data point you needed but could not source"]
}`

    case 'brandbook-content-system':
      return `You are a brand strategist creating the LIVING OPERATIONAL MANUAL for this brand.

⚠️ TIER 6: MASTER ORCHESTRATOR TOOLKIT
- CRITICAL: Load ALL previous toolkit outputs (Brand Briefing, Content Pack, Marketing Audit, etc.)
- DO NOT re-define Brand Briefing data. PULL it verbatim and cite source.
- DO NOT re-define Content Pack calendar. PULL it and cite source.
- For EVERY section, cite source: {"section": "brand_pillars", "source": "brand_briefing", "source_id": "..."}
- FAIL if contradictions detected between sources
- Include full reconciliation summary and conflict log
- This is the living document that evolves as toolkits are re-run

⚠️ FORM vs. DEPENDENCY PRECEDENCE: if the \`brand_briefing\` dependency is loaded, it is the source of truth for target_audience/brand_mission/tone_personality — use it, not the form fields, so downstream toolkits stay consistent. But if what the user just typed in \`target_audience\`/\`brand_mission\`/\`tone_personality\` meaningfully conflicts with the dependency (not just phrased differently — an actual contradiction), do NOT silently discard the form input: add an entry to \`reconciliation.conflicts\` describing the discrepancy, and default to the dependency. If \`brand_briefing\` is NOT loaded, the form fields ARE the source — mark {"source": "form_input"} instead of "brand_briefing" in that case.

⚠️ NO ORPHAN SECTIONS: \`crisis_communication\` must be built from \`crisis_comms_guidelines\` in INPUT. If that field is empty, do not invent a protocol — return \`crisis_communication\` with a single field \`status: "not_defined"\` and add "crisis communication protocol" to a \`data_gaps\` array instead of fabricating approval chains. Likewise, \`employee_brand\` and \`packaging_collateral\` have no input field or dependency backing them — only fill them in if the brand_briefing/content_pack dependencies contain material that clearly supports them; otherwise return them with \`status: "not_defined"\` and list them in \`data_gaps\` rather than inventing an advocacy program or template list.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate COMPREHENSIVE brandbook JSON that REFERENCES (not re-defines) all sources:
{
  "brand_briefing_id": "uuid",
  "content_pack_id": "uuid",
  "marketing_audit_id": "uuid",
  "competitive_analysis_id": "uuid",
  "seo_audit_id": "uuid",
  "reconciliation": {"conflicts": [], "verified": true, "last_updated": ""},
  "version": "1.0",
  "brand_story": {"source": "brand_briefing", "founding": "", "origin_narrative": "", "why_exists": ""},
  "brand_identity": {"source": "brand_briefing", "name": "", "mission": "", "vision": "", "values": [], "personality": []},
  "brand_promise": {"source": "brand_briefing", "covenant": "", "customer_expectation": "", "guarantee": ""},
  "competitive_positioning": {"source": "competitive_analysis", "how_differentiate": "", "vs_top_3": ""},
  "target_audience": {"source": "brand_briefing", "description": "", "personas": []},
  "brand_pillars": {"source": "brand_briefing", "pillars": [{"name": "", "description": ""}]},
  "brand_voice": {"source": "brand_briefing", "tone": "", "traits": [], "real_copy_examples": [], "do_examples": [], "dont_examples": []},
  "visual_identity": {"source": "brand_briefing", "colors": [], "typography": "", "imagery_style": "", "usage_case_studies": []},
  "content_templates": {"source": "content_pack", "blog": {}, "social": {}, "email": {}, "video": {}},
  "editorial_calendar": {"source": "content_pack", "12_month_rolling": []},
  "channel_playbooks": {"source": "content_pack", "instagram": {}, "tiktok": {}, "email": {}, "blog": {}},
  "packaging_collateral": {"email_signatures": "", "ppt_templates": "", "social_templates": ""},
  "crisis_communication": {"guidelines": "", "tone": "", "approval_chain": ""},
  "employee_brand": {"internal_mission": "", "advocacy_program": "", "guidelines": ""},
  "brand_evolution": {"source": "brand_briefing", "2_year_roadmap": "", "potential_expansions": []},
  "guidelines_dos_donts": {"do": [], "dont": []},
  "living_document_notes": {"review_cadence": "quarterly", "last_audit": "", "next_scheduled_review": ""},
  "data_gaps": ["sections marked status: not_defined because there was no input or dependency to back them"]
}`

    case 'marketing-campaign-generator':
      return `You are a marketing strategist. Generate a comprehensive 30-day marketing campaign for this brand.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Use the brand context above (pillars, tone of voice, audiences) to make every activity brand-specific — no generic filler.

Choose the channels in channel_distribution based on this brand's actual audience and industry (do not default to any fixed channel mix), and derive the percentages from the input/context; they must sum to 100. Derive every KPI target from figures present in the input or context (current audience size, budget, historical performance). If no data supports a target, set its value to null — NEVER invent a number.

Provide the campaign in this exact JSON format:
{
  "campaign_overview": "1-2 sentence summary",
  "week_1": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_2": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_3": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_4": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "channel_distribution": {
    "<channel name>": {"percentage": null, "focus": "..."},
    "<channel name>": {"percentage": null, "focus": "..."}
  },
  "kpis": {
    "reach_target": null,
    "engagement_rate": null,
    "ctr_target": null,
    "conversion_rate": null,
    "cac_target": null
  },
  "success_metrics": ["...", "...", "..."]
}`

    case 'community-growth-blueprint':
      return `You are a community strategist. Generate a comprehensive 90-day community growth blueprint for this brand.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Use the brand context above (pillars, tone of voice, audiences) so initiatives fit this specific community — no generic filler.

Derive every metric target (target_members, engagement_rate, retention_rate, referral_rate, monthly_active) from figures present in the input or context (current community size, historical engagement, budget). If no data supports a target, set its value to null — NEVER invent a number.

Provide the blueprint in this exact JSON format:
{
  "strategy_summary": "2-3 sentence overview of the growth strategy",
  "month_1_foundation": {
    "theme": "Foundation & Activation",
    "focus": "...",
    "key_initiatives": ["...", "...", "..."],
    "expected_growth": "..."
  },
  "month_2_growth": {
    "theme": "Growth & Engagement",
    "focus": "...",
    "key_initiatives": ["...", "...", "..."],
    "expected_growth": "..."
  },
  "month_3_retention": {
    "theme": "Retention & Monetization",
    "focus": "...",
    "key_initiatives": ["...", "...", "..."],
    "expected_growth": "..."
  },
  "engagement_playbook": {
    "daily_check_ins": "...",
    "weekly_ama": "...",
    "monthly_workshop": "...",
    "quarterly_event": "..."
  },
  "influencer_sourcing": {
    "tier_1_micro": "...",
    "tier_2_power_users": "...",
    "tier_3_experts": "..."
  },
  "metrics": {
    "target_members": "...",
    "engagement_rate": null,
    "retention_rate": null,
    "referral_rate": null,
    "monthly_active": "..."
  },
  "risks_and_mitigations": ["Risk: ...", "Mitigation: ..."]
}`

    default:
      return null
  }
}
