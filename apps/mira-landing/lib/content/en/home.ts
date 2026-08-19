import type { HomeContent } from "../home";

/**
 * Copy de la home de MIRA — inglés. Espejo clave por clave de lib/content/home.ts.
 * Página en SF-CMS: slug 'home-en'.
 *
 * El tipo es `Record<keyof HomeContent, string>` a propósito: si alguien añade un
 * campo al castellano y se olvida de traducirlo, esto no compila. Es la única
 * defensa real contra el fallo silencioso —una clave ausente no rompe la página,
 * simplemente deja ese trozo en blanco en /en y nadie se entera hasta que un
 * cliente lo ve.
 *
 * Los importes son los mismos que en castellano; solo cambia la convención de
 * escritura (€99 en vez de 99 €, coma de millares). Si cambia un precio, cambia
 * el modelo de precios primero y luego los DOS ficheros.
 */
export const defaultHomeContent: Record<keyof HomeContent, string> = {
  // ── Meta ──────────────────────────────────────────────────────────────────
  meta_title: "MIRA — The AI marketing team trained on your brand",
  meta_description:
    "A team of AI agents that really know your brand: your voice, your rules, your documents. Content, reports and tenders ready to approve. From €99/month.",

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero_eyebrow: "AI marketing platform",
  hero_title: "The marketing team you don't have to hire",
  hero_title_accent: "and that actually knows your brand",
  hero_sub:
    "Most AI tools write like anyone. MIRA learns your brand — your voice, your rules, your documents, the things you would never say — and produces work you can approve and publish as it is.",
  hero_cta_primary: "Start at €99/month",
  hero_cta_secondary: "See how it works",
  hero_note: "No lock-in. Self-serve onboarding costs nothing.",

  // ── El problema ───────────────────────────────────────────────────────────
  problem_eyebrow: "Why generic AI doesn't work for you",
  problem_title: "You ask for a post and get something that could belong to anyone",
  problem_lead:
    "The problem isn't the model: it knows nothing about you. Not your prices, not your certifications, not the phrase your business partner banned last year. So it makes things up. And what it makes up has to be rewritten from scratch.",
  problem_1_title: "It invents what it doesn't know",
  problem_1_text:
    "Figures that don't exist, processes you don't run, awards nobody gave you. In a public bid that disqualifies you; on social it just makes you look sloppy.",
  problem_2_title: "It doesn't sound like you",
  problem_2_text:
    "Empty superlatives and brochure enthusiasm. Your brand has a specific voice and a list of things it would never say, and none of that fits in a prompt.",
  problem_3_title: "You start from zero every time",
  problem_3_text:
    "Every conversation opens blank. You explain again who you are, what you sell and who you sell it to, over and over.",

  // ── La solución: el Cerebro ───────────────────────────────────────────────
  brain_eyebrow: "The difference",
  brain_title: "It all starts with your Brand Brain",
  brain_lead:
    "Before MIRA writes a single line, it learns your brand: identity, voice, audience, offer, and — this is the part that matters — your hard rules. What is never said, the figures that stay private, the phrases that are off limits.",
  brain_1_title: "Your voice, written down",
  brain_1_text: "How you speak, which words you use and which you don't, with real examples of your own.",
  brain_2_title: "Your documents inside",
  brain_2_text:
    "Past submissions, rate cards, certificates, reports. They get indexed, and the team cites them instead of imagining them.",
  brain_3_title: "Your rules, enforced",
  brain_3_text:
    "They're checked automatically before a piece reaches your inbox. If your brand says 3-5 hashtags, you get 3-5.",
  brain_proof:
    "This isn't a promise: every factual claim has to be backed by your own material, or it comes flagged as pending confirmation. An invented figure is a failure of the system, not an oversight.",

  // ── Cómo funciona ─────────────────────────────────────────────────────────
  how_eyebrow: "How it works",
  how_title: "From your brand to approved work",
  how_1_step: "Train your brand",
  how_1_text:
    "You answer a few questions and upload what you already have. MIRA proposes the rest and you confirm it. On Starter you do it yourself; on Enterprise we do it with you.",
  how_2_step: "The team produces",
  how_2_text:
    "Pillar-based content, business reports, images in your visual identity, technical proposals for tenders. In your voice, with your data.",
  how_3_step: "You approve",
  how_3_text:
    "Everything lands in one inbox. You approve, edit or reject. Nothing goes out without someone saying yes.",
  how_4_step: "It gets measured",
  how_4_text:
    "Approved work goes to the calendar and to Results: what was produced, what was published and what it saved you.",

  // ── El equipo ─────────────────────────────────────────────────────────────
  team_eyebrow: "Your team",
  team_title: "Three areas, one Brand Brain",
  team_lead:
    "These aren't loose chats: they share the same knowledge of your brand and the same project history.",
  team_1_name: "Marketing",
  team_1_text:
    "Pillar-based content, calendar, brand images, campaigns and community.",
  team_2_name: "Sales",
  team_2_text:
    "Customer discovery, qualification, icebreakers, proposals and follow-up.",
  team_3_name: "Leadership",
  team_3_text:
    "Strategic plan, competitive analysis, innovation and investor reports.",

  // ── Herramientas ──────────────────────────────────────────────────────────
  tools_eyebrow: "What's inside",
  tools_title: "One standard tool, plus the modules your business runs on",
  tools_lead:
    "Every brand starts with the same three tools, included in the fee. On top of that we build the modules your way of working actually needs.",

  tools_included_label: "Always included",
  tools_1_title: "Business reports",
  tools_1_text:
    "Brand briefing, marketing audit, competitive analysis, SEO audit, action plan, brand book, investor deck and monthly content system. Plus 19 quick actions for the day-to-day.",
  tools_2_title: "Documents",
  tools_2_text:
    "Decks, playbooks and one-pagers written from your brand, with your document library inside: whatever you upload, every agent reads.",
  tools_3_title: "Visual Studio",
  tools_3_text:
    "Images in your brand's identity: your colors, your typefaces, your style. With the monthly images your plan includes, counted in plain sight.",

  tools_modules_label: "Modules for how you operate",
  tools_4_title: "Tenders",
  tools_4_text:
    "From the tender spec to the technical proposal, criterion by criterion, using your real corpus. Plus a radar watching the public contracts that fit you.",
  tools_5_title: "Email Ops",
  tools_5_text:
    "Orders that arrive by email turn themselves into operational tickets, with their dates, addresses and parcel counts. No more copying them into the Excel by hand.",

  tools_custom_title: "And if your business needs something else?",
  tools_custom_text:
    "We build the module your business model needs: logistics, operations management, staff scheduling, whatever it takes. Tell us how you work and we build it inside MIRA, with your Brand Brain behind it. Scoped and priced case by case.",

  // ── Licitaciones (destacado) ──────────────────────────────────────────────
  tender_eyebrow: "The vertical that pays for itself",
  tender_title: "Tenders",
  tender_lead:
    "You paste the tender spec. MIRA extracts the real scoring structure — criteria, sub-criteria and points — and writes the technical proposal, answering every criterion with your material: your certifications, your past submissions, your document backbone.",
  tender_1: "Flags, in each section, the data you have to confirm before you submit",
  tender_2: "Never invents a certification, a figure or a process",
  tender_3: "The file is saved: you can close it and carry on tomorrow",
  tender_4: "A daily radar on the Spanish public procurement platform, filtered by your line of work",
  tender_cta: "See Tenders",

  // ── Precios ───────────────────────────────────────────────────────────────
  pricing_eyebrow: "Pricing",
  pricing_title: "Two ways to start",
  pricing_lead:
    "The difference isn't the features: it's who trains your brand. Prices exclude VAT.",

  price_1_name: "Starter",
  price_1_for: "Personal brands, founders and startups",
  price_1_amount: "€99",
  price_1_period: "/month",
  price_1_usd: "$108",
  price_1_setup: "Self-serve onboarding free · €390 if you'd rather we train it for you",
  price_1_f1: "1 brand · 2 people",
  price_1_f2: "Agent team, inbox and calendar",
  price_1_f3: "8 reports and 19 quick actions",
  price_1_f4: "30 images a month",
  price_1_f5: "Google Drive connected",
  price_1_cta: "Start now",

  price_2_name: "Starter Multi",
  price_2_for: "Several projects at once",
  price_2_amount: "€179",
  price_2_period: "/month",
  price_2_usd: "$195",
  price_2_setup: "3 brands for less than two on their own",
  price_2_f1: "3 brands · 3 people",
  price_2_f2: "Everything in Starter, per brand",
  price_2_f3: "60 images a month",
  price_2_f4: "A separate Brand Brain for each project",
  price_2_f5: "One single invoice",
  price_2_cta: "Start now",

  price_3_name: "Brand",
  price_3_for: "Small companies with one brand and a team",
  price_3_amount: "€690",
  price_3_period: "/month",
  price_3_usd: "$752",
  price_3_setup: "€1,200 onboarding — we train your Brand Brain with you",
  price_3_f1: "1 brand · 4 people",
  price_3_f2: "Pillar-based content engine",
  price_3_f3: "150 images a month",
  price_3_f4: "Performance reports",
  price_3_f5: "1 hour of advisory time a month",
  price_3_cta: "Let's talk",
  price_3_featured: "true",

  price_4_name: "Growth",
  price_4_for: "You publish daily and produce at volume",
  price_4_amount: "€1,290",
  price_4_period: "/month",
  price_4_usd: "$1,406",
  price_4_setup: "€1,200 onboarding",
  price_4_f1: "1 brand · 8 people",
  price_4_f2: "350 images a month",
  price_4_f3: "Signed-off deliverables every quarter",
  price_4_f4: "2 hours of advisory time a month",
  price_4_f5: "Priority support",
  price_4_cta: "Let's talk",

  price_5_name: "Brand House",
  price_5_for: "Groups running several brands",
  price_5_amount: "€2,490",
  price_5_period: "/month",
  price_5_usd: "$2,714",
  price_5_setup: "€1,200 onboarding per brand",
  price_5_f1: "3 brands · 14 people",
  price_5_f2: "750 images in a shared pool",
  price_5_f3: "One invoice for the whole group",
  price_5_f4: "4 hours of advisory time a month",
  price_5_f5: "Each brand with its own voice and its own rules",
  price_5_cta: "Let's talk",

  addons_title: "Add-ons",
  addon_1: "Extra person — €75/month",
  addon_2: "Tenders — €190/month, 8 proposals and the radar",
  addon_3: "Extra brand — €490/month",
  addon_4: "100 more images — €79",
  addon_5: "Brand Diagnostic — €490, credited against onboarding",

  // ── Preguntas ─────────────────────────────────────────────────────────────
  faq_title: "What people usually ask",
  faq_1_q: "Can I use my own AI account?",
  faq_1_a:
    "Yes, on Enterprise plans and on request. It's meant for companies whose internal policy requires it. For everyone else it doesn't pay off: you lose control over which model runs each task and the saving is marginal.",
  faq_2_q: "What happens if I go over the limits?",
  faq_2_a:
    "Nothing abrupt. We tell you when you reach the limit and the service keeps working as normal. If you're over it consistently, we talk and adjust the plan. You'll never find the tool throttled or a charge you didn't agree to.",
  faq_3_q: "Do you keep my documents?",
  faq_3_a:
    "Your material is yours, and it's isolated from every other client's. You can export it, or ask us to delete it, whenever you want.",
  faq_4_q: "How long until it's ready?",
  faq_4_a:
    "On Starter, self-serve onboarding takes a few minutes and you can get to work. On Enterprise, training the Brand Brain takes a few days, because it includes indexing your material and defining the pillars with you.",
  faq_5_q: "Do I need to know about AI?",
  faq_5_a:
    "No. You ask for things the way you'd ask someone on your team. The technical part — which model, how much context, how it's checked — is the platform's job.",
  faq_6_q: "What if I don't like the content?",
  faq_6_a:
    "You edit it or reject it in the inbox: nothing publishes on its own. And what you correct feeds back into the system, so the next round is closer to what you wanted.",

  // ── Cierre ────────────────────────────────────────────────────────────────
  cta_title: "Start with your brand",
  cta_lead:
    "Train your Brand Brain in a few minutes and see what it produces. If it doesn't convince you, you stop there.",
  cta_button: "Start at €99/month",
  cta_secondary: "Talk to us",
  cta_note: "Not sure which plan? Write to us and we'll tell you which one fits — including if none of them does.",

  footer_tagline: "MIRA is a Startup Factory product.",
};
