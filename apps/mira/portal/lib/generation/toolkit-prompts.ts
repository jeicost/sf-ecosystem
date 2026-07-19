import { fetchBrandBrain } from '@/lib/brand-brain'
import { retrieveAgentContext } from '@/lib/agent-context'
import { getClientMemoryContext } from '@/lib/client-memory'
import { adminClient } from '@/lib/supabase'

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
  const { clientId, inputData } = params

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

  // Build dependency context for toolkits that reference previous outputs
  const dependencyContext = Object.entries(toolkitDeps)
    .map(([tag, dep]: [string, any]) => {
      return `\n[DEPENDENCY: ${tag}] (${dep.title})\nID: ${dep.id}\nData: ${JSON.stringify(dep.data).slice(0, 500)}...`
    })
    .join('\n')

  const allContext = [docText, brandContext, dependencyContext, memoryContext]
    .filter(Boolean)
    .join('\n\n')

  const fullContext = allContext ? `\n\nCLIENT DOCUMENTATION & DEPENDENCIES:\n${allContext}` : ''

  // Prompts específicos por herramienta
  switch (toolSlug) {
    case 'brand-briefing':
      return `You are a brand strategist creating the SOURCE OF TRUTH for this brand.

⚠️ CRITICAL: This is TIER 1. You are defining canonical brand data that will be referenced by ALL other toolkits.
- Brand pillars you define here MUST be used exactly by Content Pack, Marketing Audit, and Brandbook.
- Brand voice you define here will be the standard for all content.
- Do NOT generate duplicate or conflicting data. Ensure internal consistency.
- Include warnings if any data seems contradictory (e.g., "premium brand but budget messaging").

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
      return `You are an SEO expert validating technical execution of brand strategy through organic search.

⚠️ TIER 5: TECHNICAL VALIDATION TOOLKIT
- CRITICAL: Load Content Pack topics and keywords, Competitive Analysis keyword rankings
- VALIDATE that target keywords align with Content Pack content pillars/topics
- FLAG if keyword strategy contradicts content strategy (e.g., "targeting 'cheap' when brand says premium")
- Include keyword_alignment field with status: aligned|misaligned
- Competitive benchmark should show if we're winning, losing, or missing keywords vs top competitors

CRITICAL REQUIREMENTS:
- Score: 0-100 scale (typical range 60-80 for food brands) with trend (+X points in 90 days)
- 4 stat cards MUST be: Style Chars (vs ideal <60), Images Alt Text (X/Y), Schema Types Active (count), Hreflang Tags (count/language)
- Sections MUST follow this structure:
  * On-Page SEO (10 elements table: Title tag, Meta description, H1, H2/Structure, Images/Alt, URL structure, Canonical, Current ranking, Technical status, etc.)
  * SEO Técnico (10+ checks: HTTPS/SSL, Sitemap.xml, Robots.txt, Mobile/Viewport, GTM+GA4, Hreflang EN/TH, Schema Restaurant, Page Speed, Core Web Vitals, Preload críticos)
  * Schema Markup (6 schemas: Restaurant, AggregateRating, OpeningHours, Geo+PostalAddress, FAQPage, Article/BlogPosting with status active/missing)
  * Keywords Target (6 keywords with volume, intent, priority)
  * Blog & Contenido (4 assessment rows: Blog active, Frecuencia, Article schema, Internal linking)
- Each finding MUST have: title, status (OK/LARGO/FALTA/DESACTUALIZADO), current value, recommendation, analysis
- Action plan: 6 prioritized actions with severity tags, specific impact, exact effort estimate

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate SEO audit JSON (EXACT STRUCTURE):
{
  "overall_score": number (60-80),
  "overall_trend": "string like '+8 points in 90 days'",
  "scoreLabel": "SEO Health Score",
  "statCards": [
    {"label": "Style Chars (Ideal <60)", "value": "69", "status": "warning", "description": "Title tag truncates in SERPs..."},
    {"label": "Imágenes con Alt Text", "value": "20/20", "status": "perfect", "description": "All images properly described..."},
    {"label": "Schema Types Activos", "value": "5", "status": "good", "description": "Restaurant, AggregateRating, etc..."},
    {"label": "Hreflang Tags EN/TH", "value": "0", "status": "critical", "description": "No hreflang declarations..."}
  ],
  "sections": [
    {
      "title": "On-Page SEO",
      "description": "On-page elements, meta tags, heading structure",
      "type": "table",
      "elements": [
        {
          "element": "Title tag",
          "status": "warning|ok|critical|falta",
          "current": "actual title text",
          "recommendation": "suggested title",
          "analysis": "Detailed explanation: X chars, truncates at Y, loses Z keywords. FIX: recommendation."
        },
        {
          "element": "Meta description",
          "status": "ok",
          "current": "current meta",
          "recommendation": "improved meta",
          "analysis": "..."
        },
        {
          "element": "H1",
          "status": "critical",
          "current": "current H1",
          "recommendation": "new H1",
          "analysis": "Zero keywords, no relevance signal. FIX: merge brand + keyword..."
        },
        {
          "element": "H2 / Estructura",
          "status": "aceptable|ok",
          "analysis": "..."
        },
        {
          "element": "Imágenes / Alt text",
          "status": "perfect|ok",
          "analysis": "..."
        },
        {
          "element": "URL estructura",
          "status": "ok",
          "analysis": "..."
        },
        {
          "element": "Canonical",
          "status": "ok",
          "analysis": "..."
        },
        {
          "element": "Hreflang EN/TH",
          "status": "falta|ok",
          "analysis": "..."
        },
        {
          "element": "Visually hidden H1",
          "status": "aceptable|falta",
          "analysis": "Option: CSS-only H1 with SEO keywords..."
        },
        {
          "element": "Content freshness",
          "status": "ok|warning",
          "analysis": "..."
        }
      ]
    },
    {
      "title": "SEO Técnico",
      "description": "Technical infrastructure, crawlability, performance",
      "type": "table",
      "checks": [
        {
          "check": "HTTPS / SSL",
          "status": "ok|critical",
          "description": "Active certificate, automatic redirect to HTTPS, Vercel CDN global..."
        },
        {
          "check": "Sitemap.xml",
          "status": "ok|missing",
          "count": 7,
          "description": "7 indexed URLs with changefreq, priority, lastmod. Referenced in robots.txt..."
        },
        {
          "check": "Robots.txt",
          "status": "ok|warning",
          "description": "Allow: /*, no critical resources blocked. Sitemap declared correctly..."
        },
        {
          "check": "Mobile / Viewport",
          "status": "ok|critical",
          "description": "Viewport meta present, fully responsive, FCP mobile ~900ms with video optimization..."
        },
        {
          "check": "GTM + GA4",
          "status": "ok|missing",
          "description": "Google Tag Manager active, GA4 configured, conversion tracking available..."
        },
        {
          "check": "Hreflang EN/TH",
          "status": "falta|ok",
          "description": "CRÍTICO: Multilingual site but no hreflang declarations. FIX: Add hreflang-en, hreflang-th in head..."
        },
        {
          "check": "Schema Restaurant",
          "status": "ok|missing",
          "description": "Restaurant + AggregateRating + OpeningHours + Geo + PostalAddress implemented..."
        },
        {
          "check": "Page Speed",
          "status": "mejorable|ok",
          "description": "Desktop FCP 900ms ok, mobile FCP 1.8s (CDN cold). Hero 3.6MB total..."
        },
        {
          "check": "Core Web Vitals",
          "status": "needs_work|ok",
          "description": "LCP, FID, CLS - mobile metrics need optimization..."
        },
        {
          "check": "Preload críticos",
          "status": "missing|ok",
          "description": "Fonts, hero images should use preload/prefetch directives..."
        }
      ]
    },
    {
      "title": "Schema Markup",
      "description": "Structured data for rich snippets",
      "type": "schema_cards",
      "schemas": [
        {"name": "Restaurant", "status": "active", "color": "green", "impact": "Rich snippets en SERPs locales"},
        {"name": "AggregateRating", "status": "active", "color": "green", "impact": "Star ratings en search results"},
        {"name": "OpeningHoursSpecification", "status": "active", "color": "green", "impact": "Store hours en SERPs"},
        {"name": "GeoCoordinates + PostalAddress", "status": "active", "color": "green", "impact": "Location rich snippets"},
        {"name": "FAQPage", "status": "missing", "color": "red", "opportunity": "If 6 common Q&A: FAQ rich snippets high CTR..."},
        {"name": "Article / BlogPosting", "status": "missing", "color": "red", "opportunity": "Blog posts without schema: no editorial rich snippets..."}
      ]
    },
    {
      "title": "Keywords Target",
      "description": "Keyword landscape y opportunities",
      "type": "table",
      "keywords": [
        {
          "keyword": "burger delivery bangkok",
          "volume": "Alto",
          "intent": "Transaccional",
          "priority": "#1",
          "current_rank": "not ranking|position X"
        },
        {
          "keyword": "wagyu burger bangkok",
          "volume": "Medio",
          "intent": "Comercial",
          "priority": "#1"
        },
        {
          "keyword": "best burger bangkok",
          "volume": "Alto",
          "intent": "Comercial",
          "priority": "#2"
        },
        {
          "keyword": "grab food burger bangkok",
          "volume": "Medio",
          "intent": "Transaccional",
          "priority": "Quick win"
        },
        {
          "keyword": "artisan burger sauce bangkok",
          "volume": "Long-tail",
          "intent": "Informacional",
          "priority": "Blog topic"
        },
        {
          "keyword": "salsa burgers",
          "volume": "Branded",
          "intent": "Branded",
          "priority": "Already ranking"
        }
      ]
    },
    {
      "title": "Blog & Contenido",
      "description": "Blog content strategy y opportunities",
      "type": "table",
      "assessment": [
        {
          "element": "Blog activo",
          "status": "ok|missing",
          "count": 4,
          "description": "4 posts published with relevant topics: delivery, Grab, sauces, Wagyu. Basic SEO structure present..."
        },
        {
          "element": "Frecuencia",
          "status": "desactualizado|ok",
          "last_post": "Marzo 2025",
          "days_ago": 65,
          "description": "~2 months without activity. Google interprets as negative freshness signal for food sites..."
        },
        {
          "element": "Article schema",
          "status": "falta|ok",
          "impact": "No BlogPosting/Article schema = no editorial rich snippets in SERPs. Missing CTR opportunity...",
          "recommendation": "Add BlogPosting schema to all blog posts with datePublished, author, headline..."
        },
        {
          "element": "Internal linking",
          "status": "mejorable|ok",
          "description": "Posts don't link to each other or menu/delivery pages. Missing link equity opportunities..."
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
      "severity_tag": "warning|critical|info",
      "impact": "+X% traffic (e.g., '+20-35% impressions')",
      "effort": "X hours or Y days exact estimate",
      "owner": "team role",
      "expected_roi": "number/10"
    }
  ],
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

CRITICAL REQUIREMENTS:
- Overall score: 0-100 (typical range 50-80) with trend (+X points in 90 days)
- 6 category scores: Brand Identity, Conversion Funnel, Social Media, Content Marketing, Lead Capture, Local Marketing
- Sections MUST follow this structure (4 color-coded cards per section):
  * Brand & Posicionamiento (4 cards: USP clarity, Visual Identity, Hero Product, Google Business Link)
  * Conversion Funnel (4 cards: ORDER NOW visibility, GRAB/LINE MAN integration, WhatsApp Business, Email Capture gaps)
  * Social Media & Contenido (4 cards: Social proof, Instagram feed, Blog frequency, Reviews section)
  * Trust & Autoridad (E-E-A-T matrix with 4 dimensions: Experience, Expertise, Authority, Trust)
- Quick Wins: 5 actions with effort_tag (Fácil/Medio), ROI estimate, specific hours/timeframe
- Each card MUST have: title, status (strong/present/missing/warning), color_border (teal/red/orange/green), detailed content

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate marketing audit JSON (EXACT STRUCTURE):
{
  "overall_score": number (50-80),
  "overall_trend": "string like '+8 points in 90 days'",
  "scoreLabel": "Marketing Health Score",
  "statCards": [
    {"label": "Brand Identity", "value": "number/100", "description": "short desc"},
    {"label": "Conversion Funnel", "value": "number/100", "description": "short desc"},
    {"label": "Social Media", "value": "number/100", "description": "short desc", "status": "critical"},
    {"label": "Content Marketing", "value": "number/100", "description": "short desc", "status": "critical"},
    {"label": "Lead Capture", "value": "number/100", "description": "short desc", "status": "warning"},
    {"label": "Local Marketing", "value": "number/100", "description": "short desc"}
  ],
  "sections": [
    {
      "title": "Brand & Posicionamiento",
      "description": "Identidad visual, propuesta de valor y consistencia de marca",
      "type": "cards",
      "cards": [
        {
          "title": "USP Muy Claro",
          "status": "strong",
          "color_border": "teal",
          "content": "Brief content explaining brand's unique selling proposition..."
        },
        {
          "title": "Identidad Visual Fuerte",
          "status": "strong|present|missing",
          "color_border": "red|teal|orange",
          "content": "..."
        },
        {
          "title": "Producto Hero Bien Destacado",
          "status": "strong|present|missing",
          "color_border": "teal",
          "content": "..."
        },
        {
          "title": "Google My Business Link",
          "status": "strong|missing",
          "color_border": "orange",
          "content": "..."
        }
      ]
    },
    {
      "title": "Conversion Funnel",
      "description": "CTA clarity, order flow y friction points",
      "type": "cards",
      "icon": "funnel",
      "cards": [
        {"title": "ORDER NOW Siempre Visible", "status": "strong", "color_border": "teal", "content": "..."},
        {"title": "GRAB + LINE MAN Integrados", "status": "strong", "color_border": "teal", "content": "..."},
        {"title": "WhatsApp Business Activo", "status": "strong|present", "color_border": "teal", "content": "..."},
        {"title": "Sin Captación de Email", "status": "missing", "color_border": "orange", "content": "..."}
      ]
    },
    {
      "title": "Social Media & Contenido",
      "description": "Presencia, engagement y estrategia de contenido",
      "type": "cards",
      "cards": [
        {"title": "Redes Sociales: Links sin Proof", "status": "warning", "color_border": "orange", "content": "..."},
        {"title": "Sin Feed de Instagram en Web", "status": "missing", "color_border": "orange", "content": "..."},
        {"title": "Blog sin Actualizar", "status": "warning", "color_border": "orange", "content": "..."},
        {"title": "Sección de Reviews Activa", "status": "strong", "color_border": "teal", "content": "..."}
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
      "impact": "+X% metric (e.g., '+20-35% GMB impressions')",
      "roi_score": "8/10"
    }
  ],
  "coherence_check": {
    "brand_briefing_id": "uuid or 'not_loaded'",
    "pillars_aligned": true,
    "voice_aligned": true,
    "positioning_aligned": true,
    "conflicts": []
  },
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
  "content_calendar": {"12_month_rolling": []}
}`

    case 'action-plan':
      return `You are a strategy consultant orchestrating 30/60/90 day execution aligned with Brand Briefing mission.

⚠️ TIER 4: OPERATIONAL PLANNING TOOLKIT
- CRITICAL: Load Brand Briefing mission/vision, Marketing Audit gaps, Content Pack calendar
- OKRs MUST align with Brand Briefing success_metrics
- Actions MUST address Marketing Audit gaps and Content Pack deliverables
- If OKRs contradict brand mission (e.g., "scale cheaply" vs "premium positioning"), FAIL
- Include dependencies section with all toolkit IDs and alignment status

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
  "escalation_procedures": {"decision_framework": "", "approval_levels": []}
}`

    case 'investor-deck':
      return `You are a fundraising expert synthesizing all brand + market + operations data into coherent investor narrative.

⚠️ TIER 7: EXTERNAL STAKEHOLDER TOOLKIT
- CRITICAL: Load Brand Briefing mission, Competitive Analysis market data, Action Plan OKRs, Marketing Audit traction
- Synthesize into single coherent investor story (no contradictions allowed)
- FAIL if Brand Briefing says "premium" but Action Plan budgets "discount growth"
- Cite all claims back to source (verifiable to original toolkit)
- Narrative coherence is paramount: investors will spot inconsistencies

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
  "contact_and_next_steps": {"contact_email": "", "process_timeline": "", "links": []}
}`

    case 'competitive-analysis':
      return `You are a competitive strategist analyzing market landscape and competitive positioning.

MARKET INTELLIGENCE TOOLKIT
Analyze competitive landscape based on user input and generate actionable competitive intelligence.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate COMPETITIVE ANALYSIS JSON with these core sections:
{
  "positioning_validation": "verified|at_risk|needs_adjustment",
  "recommended_adjustments": ["adjustment 1", "adjustment 2"],
  "executive_summary": "2-3 paragraph overview of competitive landscape and positioning",
  "market_landscape": {
    "size": "market size estimate",
    "growth_rate": "growth percentage and trends",
    "segments": ["segment 1", "segment 2"],
    "trends": ["trend 1", "trend 2"]
  },
  "competitive_matrix": [
    {
      "name": "competitor name",
      "positioning": "how they position themselves",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "pricing_model": "their pricing approach",
      "target_customer": "their target segment"
    }
  ],
  "pricing_comparison": [
    {"company": "company name", "price_range": "$X-Y", "value_prop": "their value proposition"}
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
  }
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
  "living_document_notes": {"review_cadence": "quarterly", "last_audit": "", "next_scheduled_review": ""}
}`

    case 'marketing-campaign-generator':
      return `You are a marketing strategist. Generate a comprehensive 30-day marketing campaign for this brand.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Use the brand context above (pillars, tone of voice, audiences) to make every activity brand-specific — no generic filler.

Provide the campaign in this exact JSON format:
{
  "campaign_overview": "1-2 sentence summary",
  "week_1": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_2": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_3": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_4": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "channel_distribution": {
    "LinkedIn": {"percentage": 35, "focus": "..."},
    "Email": {"percentage": 25, "focus": "..."},
    "Content+SEO": {"percentage": 20, "focus": "..."},
    "Events+Community": {"percentage": 20, "focus": "..."}
  },
  "kpis": {
    "reach_target": 50000,
    "engagement_rate": 0.05,
    "ctr_target": 0.02,
    "conversion_rate": 0.005,
    "cac_target": 60
  },
  "success_metrics": ["...", "...", "..."]
}`

    case 'community-growth-blueprint':
      return `You are a community strategist. Generate a comprehensive 90-day community growth blueprint for this brand.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Use the brand context above (pillars, tone of voice, audiences) so initiatives fit this specific community — no generic filler.

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
    "engagement_rate": 0.50,
    "retention_rate": 0.80,
    "referral_rate": 0.30,
    "monthly_active": "..."
  },
  "risks_and_mitigations": ["Risk: ...", "Mitigation: ..."]
}`

    default:
      return null
  }
}
