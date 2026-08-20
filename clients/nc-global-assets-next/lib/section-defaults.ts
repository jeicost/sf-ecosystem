/**
 * Valores por defecto de cada sección — módulo PLANO a propósito.
 *
 * Vivían dentro de los componentes, que llevan 'use client'. Cuando una página
 * de servidor importa un valor de un módulo cliente NO recibe el objeto: recibe
 * una referencia opaca. `mergeCms` hacía `{...defaults}` y le salía `{}`,
 * recorría cero claves y devolvía un objeto vacío — ni defaults ni CMS. El
 * componente hacía `.map()` sobre `undefined` y tumbaba el prerender de la
 * página ENTERA (hay 21 `.map()` así en components/sections).
 *
 * No se veía porque, sin páginas publicadas en el CMS, `mergeCms` salía por la
 * rama `if (!cmsData) return defaults` y devolvía la referencia tal cual, que
 * Next resuelve ya en cliente. Publicar las cuatro páginas el 20-ago-2026 la
 * mandó por la otra rama y rompió el build de producción.
 *
 * REGLA: los defaults que lea una página de servidor viven AQUÍ, nunca dentro
 * de un componente 'use client'.
 */

export const HERO_DEFAULTS = {
  eyebrow: 'Bangkok · Local Operating Partner',
  headline_line1: 'Enter Thailand.',
  headline_line2: 'Skip the ',
  headline_line2_gold: 'hard part.',
  headline_line3_gold: 'Your brand live in weeks.',
  hidden_heading: 'Premium Real Estate & Investment Management in Bangkok',
  body: 'We give international brands the infrastructure, the local team and the operational base to enter Thailand. No setup from scratch. Real revenue from day one.',
  spaces_label: "What's ready for your brand",
  spaces: [
    { icon: '◈', label: 'Showroom', desc: 'Present your brand to buyers & partners' },
    { icon: '⬡', label: 'Offices', desc: 'Local team base & brand management' },
    { icon: '◎', label: 'Cloud Kitchen', desc: 'Production-ready, live on delivery apps' },
  ],
}

export const TEAM_DEFAULTS = {
  eyebrow: 'The Team',
  headline_top: 'Led by operators entrepreneurs and ',
  headline_gold: 'market builders',
  team: [
    {
      name: "Carlos Jacoste",
      role: "Founder & Operating Partner",
      bio: "Entrepreneur and founder of Startups Factory — 15+ years in startups, open innovation, digital growth and international expansion. Worked with ICEX, Playtomic and other innovation-driven ventures.",
      img: "/assets/carlos-dark.jpg",
      linkedin: "https://th.linkedin.com/in/carlosjacoste",
    },
    {
      name: "Nirada Kritsanaseranee",
      role: "Director of Marketing",
      bio: "Digital marketing director with 6+ years of experience leading paid media, brand activation and go-to-market strategies for companies entering new markets. Deep understanding of the Thai consumer — connecting strategy, content and local execution.",
      img: "/assets/nirada-dark.jpg",
      linkedin: "https://th.linkedin.com/in/nirada-k",
    },
  ],
  closing_pre: 'Together, the team combines international business vision with ',
  closing_gold: 'local execution capacity',
  closing_suffix: ' in Thailand.',
}

export const MARKET_STATS_DEFAULTS = {
  sup: 'Why Thailand · Why now',
  headline_top: 'The numbers that make ',
  headline_gold: 'Bangkok the move',
  stats: [
    { num: "80M+", label: "Consumers in Southeast Asia's growth corridor" },
    { num: "#1", label: "Bangkok ranked for F&B delivery density in Southeast Asia" },
    { num: "20%+", label: "Annual growth rate in Thailand's consumer market" },
    { num: "4–8", label: "Weeks to your first market test using our infrastructure" },
  ],
}

export const WHY_THAILAND_DEFAULTS = {
  eyebrow: 'Why Thailand',
  headline_top: 'Bangkok first',
  headline_accent: 'Southeast Asia',
  headline_suffix: ' next',
  lede: 'Bangkok offers a unique combination of scale, creativity and openness to international concepts — the ideal testing ground before expanding across the region.',
  subheading_pre: 'A market built for brands that know how to ',
  subheading_accent: 'show up well',
  subheading_suffix: '.',
  bullets: [
    "One of SEA's fastest-growing F&B and lifestyle markets",
    "Strong delivery ecosystem and digital adoption",
    "High concentration of international consumers and tourism",
    "Strategic gateway to the rest of Southeast Asia",
    "A market genuinely open to new concepts and experiences",
  ],
}

export const WHO_WE_WORK_WITH_DEFAULTS = {
  eyebrow: 'Who We Work With',
  headline_top: 'Selected brands with ',
  headline_gold: 'real potential',
  lede: 'We work with a curated number of brands at a time — ensuring each partnership gets real attention, local expertise and hands-on execution.',
  items: [
    { idx: "01", ttl: "F&B Thailand", sub: "Concepts with a distinct product and a real story to tell in Thailand." },
    { idx: "02", ttl: "Proven Operators", sub: "Teams with track record ready to scale their model internationally." },
    { idx: "03", ttl: "Ambitious Founders", sub: "Builders committed to a thoughtful, long-term regional expansion." },
    { idx: "04", ttl: "Strategic Projects", sub: "Ventures aligned with Thailand's lifestyle and innovation landscape." },
  ],
}

export const LEAD_MAGNET_DEFAULTS = {
  eyebrow: 'Free Resource',
  headline_line1: 'The Bangkok',
  headline_gold: 'Brand Entry',
  headline_line3: 'Checklist.',
  lede: 'Everything you need to validate, plan and launch your brand in Thailand — in a single practical guide. Used internally by every brand we onboard.',
  points: [
    'Market validation checklist before you commit',
    'The 5 setup mistakes foreign brands make in Bangkok',
    'Platform activation guide: GrabFood, Foodpanda & Lineman',
    'Local partner evaluation framework',
    '90-day launch timeline template',
  ],
  form_label: 'Get the free checklist',
  success_title: "You're on the list.",
  success_sub: "Check your inbox — we'll send the checklist shortly. Or download it directly below.",
}

export const FINAL_CTA_DEFAULTS = {
  ready_eyebrow: 'Next Step',
  ready_headline_line1: 'Your brand',
  ready_headline_line2: 'Bangkok',
  ready_headline_gold: "Let's build it",
  ready_lede: "Book a call with our team. We'll assess your brand and outline exactly how to enter Thailand — infrastructure, timeline and commercial model included.",
  ready_note1: 'Limited spots per quarter',
  ready_note2: 'Transparent model · Pricing shared in the first call',
  notready_eyebrow: 'Still exploring?',
  notready_headline_top: "Let's talk",
  notready_headline_gold: 'before you decide',
  notready_lede: "Not sure if Thailand is the right move yet? No pressure. We're happy to have an honest conversation about your brand, your goals and what market entry could realistically look like.",
  notready_footer: 'We reply from Bangkok within 24 hours.',
}

export const COMPARE_DEFAULTS = {
  eyebrow: 'How We Compare',
  headline_top: 'Four ways to enter',
  headline_gold: 'Thailand',
  lede: 'Most paths to Thailand require years of groundwork, legal setup and local trial-and-error. NC Global is the only model where your brand is operational from week one.',
  footer_note: 'We onboard a limited number of brands per quarter.',
}

export const OPERATING_PARTNER_DEFAULTS = {
  eyebrow: 'Our Base',
  headline_top: 'Our Bangkok building',
  headline_gold: 'Your operational base',
  lede: 'We operate from our own building in Bangkok — a dedicated space built for international brands entering Thailand. No rental risk. No setup delays. Everything is already running.',
  body: 'Under one roof: a fully equipped cloud kitchen, working offices and a branded showroom. Your brand gets a real operational home in Bangkok from the moment we start working together.',
  spaces: [
    { label: "Cloud Kitchen", desc: "Fully equipped production kitchen for F&B brands — ready to operate from day one." },
    { label: "Offices", desc: "Working space for brand management, local team coordination and partner meetings." },
    { label: "Showroom", desc: "Presentation space to showcase your brand to retail buyers, distributors and local partners." },
  ],
  pullquote_pre: 'Built for ',
  pullquote_accent: 'execution',
  pullquote_post: 'not theory',
}

export const WHAT_WE_DO_DEFAULTS = {
  eyebrow: 'How It Works',
  headline_top: 'From market test to ',
  headline_gold: 'full operation',
  lede: 'Three phases. One local partner. From your first product test in Bangkok to a fully operating brand across Southeast Asia — we manage the entire journey with you.',
  cards: [
    {
      idx: "01",
      title: "Test the Market",
      body: "Validate real demand in Bangkok before committing — pilot your product, collect customer feedback and confirm product-market fit using our infrastructure.",
    },
    {
      idx: "02",
      title: "Build the Launch",
      body: "Adapt your brand for the Thai market, design your go-to-market strategy and activate the right local channels, partners and platforms from day one.",
    },
    {
      idx: "03",
      title: "Operate & Scale",
      body: "Run daily operations from our Bangkok base and grow your footprint across Thailand and Southeast Asia with a local team directly invested in your results.",
    },
  ],
}

export const ECOSYSTEM_DEFAULTS = {
  eyebrow: 'Ecosystem',
  headline_pre: 'A ',
  headline_accent: 'trusted',
  headline_suffix: ' local ecosystem',
  lede: 'We collaborate with selected partners across food innovation, entrepreneurship, marketing, business development and international expansion.',
}

export const TESTIMONIALS_DEFAULTS = {
  eyebrow: 'Founder Perspectives',
  headline_accent: 'Founder',
  headline_suffix: ' perspectives',
  lede: 'From the brands that have been through it — testing, launching and operating in Bangkok with NC Global as their local partner.',
  testimonials: [
    {
      q: "We went from brief to live on GrabFood in under two weeks. NC Global gave us the kitchen, the team and the delivery activation — we focused entirely on the product. Real orders from day one.",
      name: "Carlos Jacoste",
      role: "Founder · Salsa Burgers",
      img: "/assets/carlos-dark.jpg",
    },
    {
      q: "What sets them apart is that they operate, not just advise. We had a local team representing our brand in Bangkok from the first week — that changes the entire dynamic of entering a new market.",
      name: "Founder",
      role: "The Padel Society · Sport & Lifestyle",
      img: null,
    },
    {
      q: "NC Global already had the infrastructure, the platforms and the relationships in place. We walked into a running system instead of building one from zero. That's months of groundwork we didn't have to do.",
      name: "Founder",
      role: "Souji · Food & Wellness",
      img: null,
    },
  ],
}

export const INTRO_DEFAULTS = {
  eyebrow: 'The Opportunity',
  badge_city: 'Bangkok',
  badge_label: "Southeast Asia's fastest-growing market",
  heading: "Thailand is one of Southeast Asia's fastest-growing consumer markets — and most international brands never make it past the planning stage. Not because the opportunity isn't there. Because they try to build everything",
  heading_accent: 'from scratch, alone.',
  lede: "We built the infrastructure so you don't have to. Cloud kitchen. Office. Showroom. Local team. Distribution channels. Everything you need to enter Thailand is already running — waiting for your brand.",
  cta_label: 'See how it works',
}

export const OUR_MODEL_DEFAULTS = {
  eyebrow: 'Our Model',
  headline_top: 'A partnership built around ',
  headline_gold: 'shared growth',
  lede: 'We combine operational capacity with long-term alignment. Our commercial agreements are structured around the specific needs of each brand and project.',
  quote: 'We aim to be the local partner that makes your brand grow in Thailand.',
  blocks: [
    { ttl: "Operational Setup", body: "Local infrastructure, kitchen capacity and channel activation — ready from day one." },
    { ttl: "Local Execution", body: "Hands-on management of operations, sales, brand and customer experience in Bangkok." },
    { ttl: "Shared Growth", body: "Aligned commercial models — fixed structures, performance-based, revenue share or equity." },
  ],
}

export const FAQ_DEFAULTS = {
  eyebrow: 'FAQ',
  headline_top: 'Frequently asked ',
  headline_gold: 'questions',
  lede: 'Everything you need to know about working with NC Global Assets and entering the Thai market.',
  items: [
    { q: "What markets do you focus on?", a: "We focus exclusively on Thailand, with Bangkok as our primary operating base. From Bangkok, brands can build a foundation for a wider Southeast Asian expansion." },
    { q: "Do you only work with F&B brands?", a: "F&B is our strongest vertical, but we work with selected brands across lifestyle, sustainability, sport and digital platforms. The key criterion is whether your brand has a differentiated product and a real ambition to grow in Thailand." },
    { q: "How does the partnership model work?", a: "We work alongside brands as a local operating partner — not an external consultant. Agreements are structured as fixed models, performance-based fees, revenue share or equity participation depending on the project." },
    { q: "Can I test the market before fully committing?", a: "Absolutely. Market validation is one of the first phases we support. We run real sales pilots, gather customer feedback and validate product-market fit in Bangkok before scaling." },
    { q: "How long does it take to launch in Thailand?", a: "A focused market test can be set up in 4–8 weeks using our existing infrastructure. A full market launch typically takes 3–6 months depending on the complexity of your product and model." },
    { q: "How do I get started?", a: "Book a call or send us a brief through the contact form. We will review your brand, understand your goals and come back with a clear view of how we can support your Thailand entry." },
  ],
}

export const BRANDS_PROJECTS_DEFAULTS = {
  eyebrow: 'Brands & Projects',
  headline_top: 'Brands in our ',
  headline_gold: 'network',
  lede: 'A curated portfolio across F&B, sustainability, sport, lifestyle and digital innovation — each with a real story and a real ambition.',
}

export const INFRASTRUCTURE_DEFAULTS = {
  eyebrow: 'Infrastructure',
  headline_top: 'Real infrastructure',
  headline_gold: 'Real',
  headline_suffix: ' market entry',
  lede: 'Our Bangkok-based operating infrastructure lets brands enter the market efficiently — without building everything from scratch on day one.',
  blocks: [
    { num: "01", title: "Production", body: "Local food preparation, product adaptation and operational setup from day one." },
    { num: "02", title: "Sales Channels", body: "Activation across delivery platforms, retail and selected commercial partners." },
    { num: "03", title: "Market Feedback", body: "Real customer insights, sales performance data and continuous product validation." },
    { num: "04", title: "Daily Operations", body: "On-the-ground management, local coordination and growth execution." },
  ],
}
