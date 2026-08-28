import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { retrieveAgentContext } from '@/lib/agent-context'
import { fenceUntrusted } from '@/lib/grounding/untrusted'
import { getClientMemoryContext } from '@/lib/client-memory'
import { adminClient } from '@/lib/supabase'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { getFeedbackBlock, getSelfCritiqueBlock } from '@/lib/feedback'
import { REPORT_VOICE_CONTRACT } from '@/lib/grounding/report-voice-contract'
import { JUDGMENT_CONTRACT } from '@/lib/grounding/judgment-contract'
import { DERIVED_ECONOMICS_CONTRACT } from '@/lib/grounding/economics-contract'

/**
 * Feedback del cliente sobre informes anteriores de ESTE tool (B4): las
 * últimas 3 notas negativas se reinyectan para que la siguiente generación
 * las corrija — mismo patrón que agent_interactions en el chat de agentes.
 * Tolerante a que la tabla no exista aún (pre-migración 0050).
 */
// P3: delega en el helper único de lib/feedback (mismo contrato de bloque)
export async function getDocumentFeedbackBlock(clientId: string, toolSlug: string): Promise<string> {
  return getFeedbackBlock(clientId, toolSlug)
}

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
  /** Proyecto activo — la memoria inyectada prioriza este proyecto */
  projectId?: string | null
  /** Texto extraído de los adjuntos del usuario (PDF/texto) — fuente primaria */
  attachmentText?: string
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
  'brand-book': ['brand_briefing', 'marketing_audit', 'competitive_analysis'],
  'investor-deck': ['brand_briefing', 'action_plan', 'traction_data'],
}

// Fetch toolkit-specific dependencies from project_memory.
// Fix P2 (2026-07-29): las tags se buscan en AMBAS convenciones (guion bajo
// del mapa Y guion del auto-log — antes NUNCA matcheaban las filas del
// auto-log), se excluyen memorias archivadas y se prioriza el proyecto activo.
async function getToolkitDependencies(
  clientId: string,
  toolSlug: string,
  projectId: string | null = null
): Promise<Record<string, any>> {
  const tags = TOOLKIT_MEMORY_QUERIES[toolSlug] || []
  if (tags.length === 0) return {}

  const admin = adminClient()
  const dependencies: Record<string, any> = {}

  // One query per tag ran sequentially before (2-3 round trips per Business
  // Report generation, inside the same request path that already risks the
  // maxDuration ceiling) -- now fired concurrently. Each tag keeps its own
  // failure isolated (a bad tag doesn't drop tags that already succeeded,
  // unlike the old single outer try/catch around the whole loop).
  const results = await Promise.all(
    tags.map(async (tag) => {
      try {
        const variants = [tag, tag.replace(/_/g, '-')]
        const { data } = await admin
          .from('project_memory')
          .select('id, title, full_content, project_id')
          .eq('client_id', clientId)
          .overlaps('tags', variants)
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
          .limit(4)
        return { tag, data }
      } catch (error) {
        console.warn(`Could not load dependency "${tag}" for ${toolSlug}:`, error)
        return { tag, data: null }
      }
    })
  )

  for (const { tag, data } of results) {
    if (data?.length) {
      const best = (projectId && data.find((d) => d.project_id === projectId)) || data[0]
      dependencies[tag] = {
        id: best.id,
        data: best.full_content,
        title: best.title,
      }
    }
  }

  return dependencies
}

export async function getToolkitPrompt(
  toolSlug: string,
  params: ToolPromptParams
): Promise<string | null> {
  const { clientId, inputData, siteFactsBlock, sourcesBlock, projectId, attachmentText } = params

  const [brandBrain, memoryContext, docContext, toolkitDeps, feedbackBlock, selfCritiqueBlock] = await Promise.all([
    fetchBrandBrain(clientId),
    getClientMemoryContext(clientId, projectId ?? null),
    retrieveAgentContext({
      client_id: clientId,
      context_type: 'all',
      limit: 3,
      project_id: projectId ?? null,
    }),
    getToolkitDependencies(clientId, toolSlug, projectId ?? null),
    getDocumentFeedbackBlock(clientId, toolSlug),
    getSelfCritiqueBlock(clientId, toolSlug),
  ])

  // Brand Brain completo (formato F0: golden rule, vocabulario con porqués,
  // oferta, canales, restricciones, what-flopped, open questions...). Antes se
  // emitía aquí un resumen manual de 9 líneas que dejaba fuera todo lo nuevo.
  const brandContext = brandBrain
    ? `BRAND CONTEXT (Source of Truth):\n${formatBrandBrainForPrompt(brandBrain)}`
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

  // F4: los documentos del cliente vienen de fuera (subidas, Drive) — se vallan
  // como dato. El brand context, las dependencias y la memoria los produce el
  // propio sistema, así que no se tocan.
  const allContext = [fenceUntrusted('CLIENT DOCUMENTS', docText), brandContext, dependencyContext, memoryContext]
    .filter(Boolean)
    .join('\n\n')

  // Grounded tools receive pre-formatted VERIFIED SITE FACTS / SOURCES blocks from the route.
  const GROUNDED_TOOLS = ['seo-audit', 'marketing-audit', 'competitive-analysis', 'investor-deck', 'brand-briefing']
  const groundingBlocks = GROUNDED_TOOLS.includes(toolSlug)
    ? [siteFactsBlock, sourcesBlock].filter(Boolean).join('\n\n')
    : ''

  // Herramientas que manejan cifras de negocio: se les exige cruzar los números
  // antes de redactar. Ver lib/grounding/economics-contract.ts — el plan de
  // acción tenía precio, presupuesto y objetivo delante y no los multiplicó.
  const ECONOMICS_TOOLS = [
    'action-plan',
    'investor-deck',
    'marketing-campaign-generator',
    'community-growth-blueprint',
    'marketing-audit',
    'content-pack',
  ]

  // Shared context for ALL tool prompts: client docs/dependencies, injected grounding
  // blocks (when available for this tool), client feedback on previous reports,
  // and the contracts.
  //
  // Los tres contratos van SIEMPRE y en este orden, que es su orden de
  // precedencia: qué puedes afirmar (grounding) → qué te toca decidir a ti
  // (judgement) → cómo se escribe (voice). Antes el de voz llegaba solo a
  // brand-book y brandbook-content-system: los otros nueve informes se
  // generaban sin la regla que prohíbe el relleno consultor.
  const fullContext = [
    attachmentText
      ? `\n\nUSER ATTACHMENTS (primary source — use their actual content):\n${fenceUntrusted('USER ATTACHMENTS', attachmentText)}`
      : '',
    allContext ? `\n\nCLIENT DOCUMENTATION & DEPENDENCIES:\n${allContext}` : '',
    groundingBlocks ? `\n\n${groundingBlocks}` : '',
    feedbackBlock,
    selfCritiqueBlock,
    `\n\n${GROUNDING_CONTRACT}`,
    `\n\n${JUDGMENT_CONTRACT}`,
    ECONOMICS_TOOLS.includes(toolSlug) ? `\n\n${DERIVED_ECONOMICS_CONTRACT}` : '',
    `\n\n${REPORT_VOICE_CONTRACT}`,
  ].join('')

  // Prompts específicos por herramienta
  switch (toolSlug) {
    case 'brand-briefing':
      return `You are the brand strategist writing the document every other deliverable will be checked against. Everything downstream inherits your precision or your vagueness.

METHOD:

1. THE ENEMY BEFORE THE PROMISE. A positioning that names no enemy positions
   nothing. State what this brand is AGAINST — the default behaviour, the lazy
   alternative, the category convention it refuses. If the context does not
   support one, say so rather than inventing a strawman.

2. SPECIFICITY TEST ON EVERY LINE. For each value, trait and pillar, ask: "would
   a direct competitor in this category claim the opposite?" If no competitor
   would claim the opposite, the line is not positioning, it is wallpaper.
   "Calidad", "cercanía" and "innovación" fail this test almost always. Replace
   or delete.

3. VOICE NEEDS EXAMPLES, NOT ADJECTIVES. Every voice trait carries a real
   sentence this brand would say and one it would not, drawn from the context.
   A trait without an example cannot be applied by anyone.

4. NAME THE TENSIONS. Where the client's own inputs contradict each other
   (premium positioning with discount tactics, mass reach with niche craft),
   surface it in \`tensions\` instead of smoothing it over. The tension is
   usually the most valuable thing in the document.

5. WHAT YOU COULD NOT ESTABLISH is a section, not an omission. It tells the
   client exactly what the next conversation is about.

⚠️ CRITICAL: This is TIER 1. You are defining canonical brand data that will be referenced by ALL other toolkits.
- Brand pillars you define here MUST be used exactly by Content Pack, Marketing Audit, and Brandbook.
- Brand voice you define here will be the standard for all content.
- Do NOT generate duplicate or conflicting data. Ensure internal consistency.
- Include warnings if any data seems contradictory (e.g., "premium brand but budget messaging").

⚠️ GROUNDING (Business Reports 2026-07: the form now only asks for the URL — everything else comes from the Brand Brain):
- BRAND BRAIN below is the PRIMARY SOURCE for mission/vision/values, audiences, personality, tone, vocabulary and pillars. Base those sections directly on it — do not replace brain data with generic alternatives, do not invent a different audience.
- Brand voice do_examples/dont_examples: reuse the brain's vocabulary (we say / we never say) with their stated reasons; only extend with examples consistent with the golden rule.
- visual_identity.colors[0] (primary): take it from the brain's visual identity if a color is stated there; NEVER invent a primary hex. If no color exists anywhere, leave hex empty and add "primary brand color" to data_coherence.warnings.
- If VERIFIED SITE FACTS are present above, ground visual_identity.imagery_style and any competitive_positioning claim in what was actually observed on the site — do not describe a site you have not seen.
- USER ATTACHMENTS / contexto_adicional (if present) override or complement the brain for this run.
- If any needed data is missing or too thin, follow the GROUNDING_CONTRACT below: mark the derived field with '[ASSUMPTION]' instead of inventing it silently, and list it in data_coherence.warnings.

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
- Action plan: 6 prioritized actions with severity tags, qualitative expected impact prefixed '[RECOMMENDATION]' (no invented percentages), effort estimate, owner.

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
          "status": "ok|warning|critical|missing|unknown",
          "current": "exact title from site facts, or 'unknown'",
          "recommendation": "suggested improved title",
          "analysis": "Why it matters and how to fix it, referencing the verified fact you analyzed."
        },
        {
          "element": "Meta description",
          "status": "ok|warning|missing|unknown",
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
          "element": "H2 / Structure",
          "status": "ok|acceptable|warning|unknown",
          "analysis": "Heading hierarchy assessment based on site facts..."
        },
        {
          "element": "Images / Alt text",
          "status": "ok|warning|missing|unknown",
          "current": "alt coverage from site facts, or 'unknown'",
          "analysis": "..."
        },
        {
          "element": "Internal linking",
          "status": "ok|improvable|unknown",
          "analysis": "Based on internal/external link counts in site facts..."
        },
        {
          "element": "Canonical",
          "status": "ok|missing|unknown",
          "analysis": "..."
        },
        {
          "element": "Content / Freshness",
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
      "title": "Target Keywords",
      "description": "Keyword opportunities grounded in brand context and user input",
      "type": "table",
      "keywords": [
        {
          "keyword": "keyword phrase relevant to this business and audience",
          "volume": "unknown unless real data provided",
          "intent": "Transactional|Commercial|Informational|Branded",
          "priority": "#1|#2|Quick win|Blog topic",
          "current_rank": "unknown unless real data provided"
        }
      ]
    },
    {
      "title": "Content & Blog",
      "description": "Editorial content assessment based on verified site facts and dependencies",
      "type": "table",
      "assessment": [
        {
          "element": "Blog / editorial content",
          "status": "ok|missing|unknown",
          "description": "Only what site facts show; otherwise 'unknown'"
        },
        {
          "element": "Article schema",
          "status": "ok|missing|unknown",
          "recommendation": "[RECOMMENDATION] add BlogPosting schema if editorial content exists..."
        },
        {
          "element": "Internal linking",
          "status": "ok|improvable|unknown",
          "description": "Based on link data in site facts..."
        },
        {
          "element": "Alignment with content pillars",
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
      "priority": "CRITICAL|HIGH|MEDIUM",
      "severity_tag": "critical|warning|info",
      "impact": "[RECOMMENDATION] qualitative expected impact — no invented percentages",
      "effort": "estimate in hours or days",
      "owner": "team role",
      "expected_roi": "high|medium|low"
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
- Recommendations and hypotheses MUST be prefixed '[RECOMMENDATION]' or '[ASSUMPTION]'.
- If the VERIFIED SITE FACTS block is absent or marked SITE UNREACHABLE, mark site-dependent cards "unknown".

CRITICAL REQUIREMENTS:
- Overall score: 0-100 only when justified by evidence; otherwise null. No trend unless historical data exists in the context (otherwise null).
- 6 category scores: Brand Identity, Conversion Funnel, Social Media, Content Marketing, Lead Capture, Local Marketing (null when no evidence)
- Sections MUST follow this structure (4 color-coded cards per section, titles adapted to THIS business — never assume a default industry):
  * Brand & Positioning (4 cards: USP clarity, Visual Identity, Hero product/service, Business listings/profiles)
  * Conversion Funnel (4 cards: primary CTA visibility, purchase/booking channels, direct contact channels, email capture)
  * Social Media & Content (4 cards: social proof on site, social presence/links, content freshness, reviews/testimonials)
  * Trust & Authority (E-E-A-T matrix with 4 dimensions: Experience, Expertise, Authority, Trust)
- Quick Wins: 5 actions with effort_tag (Easy/Medium), qualitative ROI, specific hours/timeframe
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
      "title": "Brand & Positioning",
      "description": "Visual identity, value proposition and brand consistency",
      "type": "cards",
      "cards": [
        {
          "title": "USP Clarity",
          "status": "strong|present|missing|warning|unknown",
          "color_border": "teal|red|orange|green",
          "content": "Evidence-based assessment of the unique selling proposition..."
        },
        {
          "title": "Visual Identity",
          "status": "strong|present|missing|unknown",
          "color_border": "teal|red|orange",
          "content": "..."
        },
        {
          "title": "Hero Product/Service",
          "status": "strong|present|missing|unknown",
          "color_border": "teal|orange",
          "content": "..."
        },
        {
          "title": "Business Profiles (listings)",
          "status": "strong|missing|unknown",
          "color_border": "orange|teal",
          "content": "..."
        }
      ]
    },
    {
      "title": "Conversion Funnel",
      "description": "CTA clarity, purchase/booking flow and friction points",
      "type": "cards",
      "icon": "funnel",
      "cards": [
        {"title": "Primary CTA Visibility", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Purchase/Booking Channels", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Direct Contact Channels", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Email Capture", "status": "strong|present|missing|unknown", "color_border": "teal|orange", "content": "..."}
      ]
    },
    {
      "title": "Social Media & Content",
      "description": "Presence, engagement and content strategy",
      "type": "cards",
      "cards": [
        {"title": "Social Proof on the Site", "status": "strong|warning|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Linked Social Presence", "status": "strong|warning|missing|unknown", "color_border": "teal|orange", "content": "..."},
        {"title": "Content Freshness", "status": "strong|warning|unknown", "color_border": "teal|orange", "content": "Only if site facts show it; otherwise 'unknown'..."},
        {"title": "Reviews / Testimonials", "status": "strong|missing|unknown", "color_border": "teal|orange", "content": "..."}
      ]
    },
    {
      "title": "Trust & Authority (E-E-A-T)",
      "description": "Experience, expertise, authority, trust",
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
      "effort_tag": "Easy - High ROI",
      "effort_hours": "number of hours (e.g., 15 min = 0.25)",
      "impact": "[RECOMMENDATION] qualitative expected improvement — no invented percentages",
      "roi_score": "high|medium|low"
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
      return `You are the content lead who has to publish this calendar with the team and budget this brand actually has.

METHOD:

1. CAPACITY BEFORE CALENDAR. Read the brand's real editorial rhythm and team
   from the context. A calendar the client cannot produce is worse than no
   calendar: it guarantees failure and blames them for it. If the volume you are
   proposing exceeds what the context says they sustain, either cut it or say
   plainly what extra resource it needs.

2. EVERY PIECE EARNS ITS PLACE. Each item states which pillar it serves and what
   it is trying to move (reach, trust, consideration, conversion). A piece that
   cannot name its job is filler — delete it and publish fewer, better.

3. FORMAT FOLLOWS THE ASSET THEY HAVE. Do not propose formats that require
   footage, talent or production the context gives no evidence of. Build from
   what they can actually make on a normal week.

4. REPURPOSING IS A PLAN, NOT A NOTE. If one piece becomes three, say which
   three and what changes between them.

5. THE FIRST TWO WEEKS IN DETAIL, the rest as structure. A fully specified
   twelve months is fiction; the client abandons it in week three.

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
      return `You are the operator this brand would hire to run the next 90 days — not a consultant describing what could be done, but the person who has to make it happen with THIS budget, THIS team and THIS calendar.

METHOD — work in this order. The order is the value; a plan assembled section by section reads like a template.

STEP 1 — ECONOMICS FIRST. Do the DERIVED ECONOMICS work below before anything
else. Everything downstream depends on whether the goal is arithmetically
plausible. If it is not, the plan's job is to fix the arithmetic, not to
schedule activity around a target that cannot land.

STEP 2 — CAPACITY. Read \`equipo_roles\` and \`recursos_actuales\` literally.
Name real people from the input as owners — never "Marketing" or "the team".
If a task has no plausible owner in the roster, that is a finding: say so and
put it in data_gaps. Estimate effort with the JUDGEMENT CONTRACT rules: commit
to a value, never "unknown".

STEP 3 — THE BINDING CONSTRAINT. Every plan has ONE thing that, if it slips,
makes everything else pointless. Usually it is in \`desafios_criticos\`. Name it
explicitly in \`binding_constraint\` and sequence the whole plan around it. A
plan where all six actions matter equally is a plan that has not been thought
about.

STEP 4 — SEQUENCE WITH REASONS. For each action say what it unblocks or what
must precede it. Order that reflects real dependency, not calendar tidiness.
If two workstreams compete for the same person, say which one yields.

STEP 5 — THE BET AND THE ROAD NOT TAKEN. State in \`the_bet\` the single
non-obvious call this plan makes, and in \`rejected_alternatives\` at least two
credible options you considered and dropped, each with the reason. A specialist
is recognised by what they chose NOT to do. Generic plans skip this.

STEP 6 — KILL CRITERIA. For each horizon, state what result would mean "stop
and rethink", with the number and the date. Vague exit thresholds are the
easiest place to be useless.

ANTI-GENERIC TEST — before emitting, reread every action and ask: "could this
sentence appear unchanged in a plan for a different client in a different
industry?" If yes, it is filler. Either make it specific to this brand's
context or delete it. "Configurar tracking", "crear contenido de calidad" and
"lanzar campañas" fail this test.

⚠️ TIER 4: OPERATIONAL PLANNING TOOLKIT
- CRITICAL: Load Brand Briefing mission/vision, Marketing Audit gaps, Content Pack calendar
- OKRs MUST align with Brand Briefing success_metrics
- Actions MUST address Marketing Audit gaps and Content Pack deliverables
- If OKRs contradict brand mission (e.g., "scale cheaply" vs "premium positioning"), FAIL
- Include dependencies section with all toolkit IDs and alignment status

⚠️ NEVER INVENT NUMBERS: \`budget_breakdown\` and \`team_capacity.fte\`/\`hiring_plan\` must be derived from \`presupuesto_disponible\` and \`equipo_roles\` in INPUT. If a figure or split is not stated or clearly inferable from those fields, set that value to null (or an empty array) instead of guessing a number — do NOT distribute an invented percentage across engineering/marketing/ops/contingency. Add any missing figure to a \`data_gaps\` array.

⚠️ HORIZON: \`horizonte\` in INPUT is 30, 60 or 90 (days). Detail ONLY up to that horizon with weekly milestones, owners and metrics. Later phases must still appear in the JSON but as a light outlook (2-3 bullets in \`focus\` + empty arrays) — clearly less detailed, never padded to look complete. With horizonte=90 all three phases get full detail.

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
  "executive_summary": "Lead with the economics verdict, then the binding constraint, then the bet. Not a description of the document.",
  "derived_economics": {"figures_used": [], "calculations": [], "verdict": "plausible|tight|implausible", "verdict_reasoning": "", "what_would_change_it": []},
  "binding_constraint": {"what": "the one thing that makes everything else pointless if it slips", "why": "", "how_the_plan_handles_it": ""},
  "the_bet": {"call": "the single non-obvious decision this plan makes", "reasoning": "", "what_makes_it_wrong": "the signal that would prove this call wrong"},
  "rejected_alternatives": [{"option": "", "why_rejected": "", "when_it_would_be_right": ""}],
  "quarterly_okrs": [{"q": 1, "objectives": [{"objective": "", "key_results": ["string, not an object"], "alignment": "aligned|warning", "alignment_note": ""}]}],
  "30_day_sprint": {"focus": "", "weekly_milestones": ["string"], "actions": [{"title": "", "owner": "real person from equipo_roles", "effort": "commit to a value — NEVER unknown", "effort_rationale": "[JUDGEMENT] one line", "unblocks": "what this makes possible", "metric": ""}]},
  "60_day_push": {"focus": "", "weekly_milestones": ["string"], "actions": [{"title": "", "owner": "", "effort": "", "effort_rationale": "", "unblocks": "", "metric": ""}]},
  "90_day_vision": {"focus": "", "actions": [{"title": "", "owner": "", "effort": "", "effort_rationale": "", "unblocks": "", "metric": ""}]},
  "success_definition": {"criteria": ["string"], "exit_thresholds": ["KILL CRITERIA: each one needs a number AND a date — 'si el día 45 hay menos de N, se para X'. A threshold without both is useless."]},
  "resource_requirements": {"team": ["string"], "budget": "", "tools": ["string"]},
  "team_capacity": {"roles": [], "fte": "", "hiring_plan": []},
  "budget_breakdown": {"engineering": "", "marketing": "", "ops": "", "contingency": ""},
  "kpis": [{"metric": "", "target": "", "tracking": ""}],
  "learning_loops": {"weekly_reviews": "", "monthly_retros": "", "iteration_cadence": ""},
  "stakeholder_communication": {"audience": [], "cadence": "", "format": ""},
  "risk_mitigation": [{"risk": "", "probability": "alta|media|baja — JUDGEMENT field, never unknown", "impact": "alto|medio|bajo — never unknown", "mitigation": "", "early_warning": "the signal that tells you this is happening, before it has happened"}],
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
- If a metric is missing, put the literal placeholder '[MISSING: real data]' in its field AND add the metric name to the 'data_gaps' array.
- Market size / growth figures must come from the context or SOURCES (cite the URL); otherwise use '[MISSING: real data]' or prefix the estimate with '[ASSUMPTION]'.
- Testimonials: NEVER invent names, companies, or quotes. Only include testimonials that appear in the context; otherwise return an empty customer_testimonials array and add "customer testimonials" to data_gaps.
- Team, board, and advisor entries only from the context — never fabricate people.
- \`the_ask.valuation\`/\`post_money\` come from \`valuation_terms\` in INPUT if provided; if not, use '[MISSING: real data]', never estimate a valuation.
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
  "data_gaps": ["every metric that required '[MISSING: real data]' plus any other missing data"]
}`

    case 'competitive-analysis': {
      // Fusión con la quick action analizar_competencia (2026-07-28): el input
      // trae focus (pricing|features|positioning|todo), vulnerabilidades del
      // usuario y profundidad (deep|quick). El modo quick usa un schema corto
      // y lo ejecuta sonnet (ver route) — un radar de ~1 min, no un informe.
      const isQuick = inputData.profundidad === 'quick'
      const focusMap: Record<string, string> = {
        pricing: 'PRICING: rates, charging models, promotions and how they communicate value.',
        features: 'PRODUCT: features, range, perceived quality and product gaps.',
        positioning: 'POSITIONING: message, promise, tone, who they speak to and what territory they own.',
      }
      const focusLine = focusMap[inputData.focus as string]
        ? `\nANALYSIS FOCUS — go deepest on ${focusMap[inputData.focus as string]}`
        : ''
      const vulnLine = inputData.vulnerabilidades
        ? `\nVULNERABILITIES THE CLIENT ALREADY KNOWS ABOUT (verify them against SOURCES and build on them — first-hand knowledge of the business):\n${inputData.vulnerabilidades}`
        : ''

      const sharedRules = `GROUNDING RULES:
- Market size, growth rates, and competitor pricing may ONLY come from the SOURCES block above. When you use a source, cite its URL inside the same field (e.g. "€X B (source: https://...)").
- If no source supports a figure, either prefix the whole claim with '[ASSUMPTION]' or output "unknown" — never present an unsourced number as fact.
- Do not attribute positioning, features, or pricing to a named competitor unless supported by SOURCES or user input; otherwise prefix '[ASSUMPTION]'.
- List every missing market/competitor data point in 'data_gaps'.${focusLine}${vulnLine}`

      if (isQuick) {
        return `You are a competitive strategist producing a RAPID competitive radar (not a full report).

${sharedRules}

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate a COMPACT competitive radar JSON — every list capped, no filler:
{
  "executive_summary": "3-4 sentences: the state of the competitive field and the #1 implication for this brand",
  "competitors": [
    {"name": "", "positioning": "1 sentence (from SOURCES/input, otherwise '[ASSUMPTION] ...')", "biggest_strength": "", "exploitable_weakness": "cross-referenced with the client's stated vulnerabilities if given", "recent_moves": "from SOURCES with URL, or 'unknown'"}
  ],
  "market_gaps": ["max 3 market gaps nobody is covering"],
  "strategic_opportunities": ["max 3 concrete moves that are actionable this week/month"],
  "watch_next": ["max 2 signals to watch (and which source to track them with)"],
  "data_gaps": ["every data point that was missing"]
}`
      }

      return `You are a competitive strategist analyzing market landscape and competitive positioning.

MARKET INTELLIGENCE TOOLKIT
Analyze competitive landscape based on user input and generate actionable competitive intelligence.

${sharedRules}

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate COMPETITIVE ANALYSIS JSON with these core sections:
{
  "positioning_validation": "verified|at_risk|needs_adjustment",
  "recommended_adjustments": ["adjustment 1", "adjustment 2"],
  "executive_summary": "2-3 paragraph overview of competitive landscape and positioning",
  "market_landscape": {
    "size": "figure with source URL, or '[ASSUMPTION] ...', or 'unknown'",
    "growth_rate": "figure with source URL, or '[ASSUMPTION] ...', or 'unknown'",
    "segments": ["segment 1", "segment 2"],
    "trends": ["trend 1", "trend 2"]
  },
  "competitive_matrix": [
    {
      "name": "competitor name",
      "positioning": "how they position themselves (from SOURCES/input, else '[ASSUMPTION] ...')",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "pricing_model": "from SOURCES with URL, or '[ASSUMPTION] ...', or 'unknown'",
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
    }

    case 'brand-book': {
      // Brand Book de nivel consultora (F3 Business Reports, ref. estructura
      // Dadybox + método Brand_Content_System del CEO). Dos modos:
      //   full  → manual completo + auditoría de consistencia + Voice Guide A4
      //   audit → SOLO la auditoría de consistencia (barato, para revisiones)
      // rgb/cmyk NUNCA los escribe el modelo — se calculan en TS post-parse.
      const isAudit = inputData.mode === 'audit'
      const auditInstructions = `CONSISTENCY AUDIT (the heart of the document — never silence a contradiction):
Compare ALL available sources (Brand Brain, VERIFIED SITE FACTS, attachments, previous reports in dependencies, user notes) looking for:
- Tone contradictions (the brain says X, the site sounds like Y)
- Colors/typefaces the site uses but the brain does not record (or the other way around)
- Brand promises that execution breaks (e.g. "premium" with generic stock photos)
- Names/claims written differently in different places
- Declared audiences vs who the actual content speaks to
Every finding: what it is, the literal EVIDENCE (quote the specific source), the resolution you propose, and severity alta|media|baja (keep these three values exactly as written — the export pipeline matches on them). If you find no real contradictions, say explicitly that the system is consistent — do not invent filler findings.`

      if (isAudit) {
        return `You are a senior brand consultant running a CONSISTENCY AUDIT of this brand's identity system. You are NOT writing a brand book — only the audit.

${auditInstructions}

INPUT (user notes):
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate the audit JSON:
{
  "meta": {"brand": "", "mode": "audit", "one_line_essence": "the essence of the brand in one sentence"},
  "written_summary_md": "executive summary in markdown, 150-250 words: consistency state of the brand system and the 3 most urgent actions",
  "consistency_findings": [{"finding": "", "evidence": "literal quote + source (brain/site/doc)", "resolution": "", "severity": "alta|media|baja"}],
  "open_items": [{"n": 1, "item": "", "owner": "client|agency", "needed_for": ""}],
  "data_gaps": ["sources that were missing to audit fully"]
}`
      }

      return `You are a senior brand consultant writing the OPERATIONAL BRAND BOOK for this brand — the manual the team actually uses, not a decorative PDF. Reference structure: a professional agency brand manual (story → identity → voice → visual system → applications → governance).

RULES OF CONSTRUCTION:
- The Brand Brain below is the PRIMARY SOURCE. Site facts, attachments and previous reports complete it. User notes (notas_diseno) override style decisions.
- COLORS: only give a hex when you have evidence for it (brain visual identity, site facts, attachments). Mark each palette entry status: "ALREADY_RUNNING" (evidenced) or "PROPOSED" (your proposal derived from the evidenced ones). NEVER write rgb or cmyk values — they are computed deterministically after you.
- TYPOGRAPHY: same evidence rule. qa_safe_fallback is always a universally available font.
- Every rule in logo/colors/typography/imagery carries "prevents": the concrete failure it avoids.
- applications: only surfaces relevant to THIS business (check the brain's channels/offer — a restaurant gets menu/packaging/delivery, a SaaS gets product UI/deck/social).
- voice_series_governance.series: what the brand already runs (status ALREADY_RUNNING, from brain channels/editorial rhythm) vs what you propose (PROPOSED).

${auditInstructions}

VOICE GUIDE ONE-PAGER: a distilled A4 the whole team can pin on the wall. Golden rule, 5-7 dos with why, 5-7 don'ts with why, sound_like/never_sound_like in one line each, and ONE example rewrite (before → after → why). It becomes a printable PPTX — keep every phrase short enough to fit a poster.

INPUT (user notes):
${JSON.stringify(inputData, null, 2)}
${fullContext}

Generate the COMPLETE brand book JSON:
{
  "meta": {"brand": "", "version": "1.0", "mode": "full", "one_line_essence": ""},
  "written_summary_md": "executive summary in markdown, 200-300 words: what defines this brand and the 5 key decisions in this manual",
  "story": {"origin": "", "why_exists": "", "signature_ritual": "from the brain if it exists, otherwise omit"},
  "mission_vision_promise": {"mission": "", "vision": "", "promise": "the promise the customer is entitled to demand"},
  "tone_of_voice": {"golden_rule": "", "principles": [{"principle": "", "why": "", "avoid": "the concrete failure it prevents"}], "sound_like": "", "never_sound_like": ""},
  "logo": {"usage_rules": [{"rule": "", "prevents": ""}], "clearspace": "", "min_size": "", "misuse": ["concrete mistakes to avoid"], "background_rules": ""},
  "colors": {"palette": [{"name": "", "hex": "#RRGGBB only with evidence", "role": "primary|secondary|accent|neutral", "status": "ALREADY_RUNNING|PROPOSED", "usage": "", "prevents": ""}], "combinations_to_avoid": []},
  "typography": {"primary": {"family": "", "usage": "", "status": "ALREADY_RUNNING|PROPOSED"}, "secondary": {"family": "", "usage": "", "status": "ALREADY_RUNNING|PROPOSED"}, "qa_safe_fallback": "", "hierarchy": [{"level": "H1|H2|body|caption", "spec": ""}]},
  "imagery": {"style": "", "dos": [{"rule": "", "why": ""}], "donts": [{"rule": "", "why": ""}]},
  "applications": [{"surface": "", "rules": ["short, actionable rules"]}],
  "voice_series_governance": {"series": [{"name": "", "status": "ALREADY_RUNNING|PROPOSED", "cadence": "", "owner": "", "description": ""}], "approval_flow": "who approves what before publishing"},
  "consistency_findings": [{"finding": "", "evidence": "literal quote + source", "resolution": "", "severity": "alta|media|baja"}],
  "voice_guide_onepager": {"golden_rule": "", "dos": [{"phrase": "", "why": ""}], "donts": [{"phrase": "", "why": ""}], "sound_like": "", "never_sound_like": "", "example_rewrite": {"before": "", "after": "", "why": ""}},
  "open_items": [{"n": 1, "item": "", "owner": "client|agency", "needed_for": ""}],
  "data_gaps": []
}`
    }

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
      return `You are the media buyer and strategist who will personally answer for this campaign's numbers at the end of the 30 days.

METHOD — in this order:

1. ECONOMICS FIRST (see DERIVED ECONOMICS below). Budget ÷ target = what you can
   afford to pay per acquisition. Compare that to the unit price. If the campaign
   cannot pay for itself at the stated target, say so in week 1 and design the
   campaign to FIND that out cheaply rather than to spend the whole budget.

2. ONE JOB. A 30-day campaign that pursues awareness, engagement AND conversion
   does none of them. State \`campaign_job\` as a single sentence: what this
   specific month is for. Everything else serves it.

3. SPEND SHAPE, NOT SPEND SPLIT. Do not distribute the budget evenly across four
   weeks. Real campaigns front-load testing and back-load the winner. State in
   \`spend_logic\` why the money moves the way it does across the weeks.

4. WHAT YOU ARE TESTING. Week 1 is a set of hypotheses, not "activities". Name
   the variables under test (hook, audience, format, offer) and what result would
   settle each one. If the budget is small, say how many meaningful tests it
   actually buys — a budget that funds two tests should not be described as if
   it funds ten.

5. THE KILL RULE. State the number and date at which this campaign gets paused.

ANTI-GENERIC TEST: if an activity could appear unchanged in any other brand's
campaign, it is filler. "Crear contenido atractivo" and "optimizar creatividades"
fail. Use the brand's actual pillars, actual channels and actual audience.

INPUT:
${JSON.stringify(inputData, null, 2)}
${fullContext}

Use the brand context above (pillars, tone of voice, audiences) to make every activity brand-specific — no generic filler.

Choose the channels in channel_distribution based on this brand's actual audience and industry (do not default to any fixed channel mix), and derive the percentages from the input/context; they must sum to 100. Derive every KPI target from figures present in the input or context (current audience size, budget, historical performance). If no data supports a target, set its value to null — NEVER invent a number.

Provide the campaign in this exact JSON format:
{
  "campaign_overview": "1-2 sentence summary",
  "campaign_job": "the ONE thing this month is for, in one sentence",
  "derived_economics": {"figures_used": [], "calculations": [], "verdict": "plausible|tight|implausible", "verdict_reasoning": "", "what_would_change_it": []},
  "spend_logic": "why the money moves the way it does across the four weeks — never an even split by default",
  "hypotheses": [{"variable": "hook|audience|format|offer", "test": "", "settled_by": "the result that decides it", "budget": ""}],
  "tests_the_budget_buys": "[JUDGEMENT] how many meaningful tests this budget actually funds, and the reasoning",
  "kill_rule": {"metric": "", "threshold": "", "date": "", "action": "what gets paused or changed"},
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
