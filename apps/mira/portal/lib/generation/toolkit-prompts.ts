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
      return `You are a marketing auditor. Generate a DETAILED marketing audit matching production quality (reference: Salsa Burgers marketing audit at sf-reports.vercel.app).

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
