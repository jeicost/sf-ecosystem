/**
 * English copy — mirrors lib/content/influencers.ts key-for-key.
 * CMS page slug: influencers-en.
 *
 * Same hard rule as the Spanish source (CEO, 2026-08-06): NO revenue-share
 * figure goes on the web — no percentages, no fractions ("half"), no amounts
 * the creator takes home. The copy says WHAT is paid (every sale from their
 * channels + every booking from their pages) and FOR HOW LONG, and points to
 * the call and the written terms before signing. Public product PRICES
 * (digital from €14, print from €29) are fine: that is sale price, not split.
 */
export const defaultInfluencersContent = {
  // Hero
  hero_kicker: "Creator program · Applications open",
  hero_line_1: "A reel lasts 48 hours.",
  hero_line_2: "Your guide lasts all year.",
  hero_line_3: "",
  hero_sub_a: "We're looking for people who actually know their city. 500,000 followers or none at all — if you know a place and can tell it well, there's a way in. Pick yours:",
  hero_sub_b: "",
  // Track picker (two cards, right under the hero)
  picker_a_kicker: "You have an audience",
  picker_a_title: "I want my guide",
  picker_a_text: "We edit your city's guide with you. It goes out under your name and you earn on every sale and every booking.",
  picker_a_cta: "From 10,000 followers in one city",
  picker_b_kicker: "You have the places",
  picker_b_title: "Monetise my recommendations",
  picker_b_text: "Send us your videos. If your judgement fits, you come in as a recommender and earn on what your places generate.",
  picker_b_cta: "No minimum following",
  // Track TOP — creators with audience
  top_eyebrow: "You have an audience",
  top_title_1: "We edit it.",
  top_title_em: "You sign it and get paid.",
  top_lead:
    "You've spent years telling your city on social. We edit it with you and turn it into an object people buy, keep, and that goes on selling all year.",
  top_step_1_label: "We import your places",
  top_step_1_text: "Straight from your own posts. The AI does the dirty work: pulls them out, sorts them, puts them on the map.",
  top_step_2_label: "We edit it with you",
  top_step_2_text: "Our editors build the guide alongside you: your name, your eye, our format.",
  top_step_3_label: "You sell it and get paid",
  top_step_3_text:
    "Digital from €14 and print from €29, to your audience. You earn on every sale that goes out through your channels and on every booking that comes in from your pages. Two streams, and both keep running for as long as the guide is alive. The numbers, in writing, before you sign.",
  top_quote: "",
  top_note: "Your likes don't interest us. Knowing where people really eat does.",
  top_mock_city: "Your city",
  top_mock_sub: "according to you",
  top_mock_caption: "Your name on the cover · 2026 Edition",
  top_cta: "I want my guide",

  // Track MICRO — starting out
  micro_eyebrow: "You have the places",
  micro_title_1: "Get paid for what",
  micro_title_em: "you already recommend.",
  micro_lead: "Send us your videos. If your judgement fits, you come in as a discoolver recommender: your places get published under your name and you earn on what they generate. No minimum following.",
  micro_step_1_label: "Send your recommendations",
  micro_step_1_text: "Just as you already film them: one place, why it's worth it, no posing. Reel, TikTok or YouTube — the format doesn't matter to us.",
  micro_step_2_label: "An editor reviews them",
  micro_step_2_text: "If your judgement fits, you're in. And if not, we tell you why: you can come back with other places.",
  micro_step_3_label: "You publish and get paid",
  micro_step_3_text: "Your places go live on discoolver signed by you, and you earn commission on every booking they generate. As long as the place stays published, it keeps counting.",
  micro_criteria_title: "What the editors look for",
  micro_criteria_1: "One specific place, with a name and a neighborhood",
  micro_criteria_2: "A real opinion — yours",
  micro_criteria_3: "Zero hidden ads",
  micro_ladder: "The recommenders who do best are the first ones we call to edit a guide of their own.",
  micro_cta: "Send my videos",
  // Proof block. The figures are NOT copy: the page fills them from the API.
  dentro_eyebrow: "Who's already in",
  dentro_titulo: "This is what's published today.",
  dentro_lead:
    "No filler testimonials: the catalogue's numbers exactly as they stand right now. When creators are signing with name and face, they'll be here.",
  dentro_sitios: "places published",
  dentro_creadores: "creators signing",
  dentro_ciudades: "cities open",
  dentro_pagadas: "paid recommendations",

  // FAQ
  faq_eyebrow: "Frequently asked questions",
  faq_title_1: "The questions",
  faq_title_highlight: "everyone asks.",
  faq_lead_pre: "Still missing something? Write to us at",
  faq_lead_email: "hello@discoolver.com",
  faq_lead_post: " and a person will answer.",
  faq_q1: "Who owns my content?",
  faq_a1:
    "You do, always. You authorize us to edit it and publish it inside the guide; neither the ownership nor what you do with it on your own channels changes. If one day you walk away, your content goes with you.",
  faq_q2: "How much do I earn, and when?",
  faq_a2:
    "With your own guide you earn two ways: every sale that goes out through your channels and every booking that comes in from your pages. Both keep running for as long as the guide is on sale, not just launch week. If you send videos, you earn on the sales and the bookings your recommendation generates. The exact split and the payment date we go through on the call, with the numbers in front of you, and they go in writing before you sign anything. There is no small print that shows up later.",
  faq_q3: "Is there any exclusivity?",
  faq_a3:
    "No. You keep posting wherever you want and with whoever you want. Your guide is one more piece of your brand, not a contract that ties you down.",
  faq_q4: "What happens when the next edition comes out?",
  faq_a4:
    "The city changes, so every season we review the guide with you: what's new comes in and what no longer measures up goes out. The previous edition closes and stays as a collector's piece.",
  faq_q5: "Can I move from sending videos to having my own guide?",
  faq_a5:
    "Yes, that's how this works. The names that perform best in each edition are the first ones we call to edit a guide of their own.",

  faq_q6: "How does the commission work?",
  faq_a6:
    "Nobody pays to appear on discoolver: places get in because an editor approves them, not because someone bought the slot. The commission is generated afterwards, when somebody books through your recommendation, via our attribution system. Publishing is free and editorial; getting paid depends on what people do with what you recommend.",

  // Application forms
  forms_eyebrow: "Applications open",
  forms_title_1: "Your guide. Your name.",
  forms_title_em: "Your cut.",
  forms_lead: "Two forms, two routes. Pick yours; there's no need to fill in both.",
  form_top_title: "I want my guide",
  form_top_sub: "For creators with an audience in one city.",
  form_top_name: "Name",
  form_top_email: "Email",
  form_top_handle: "Main @handle",
  form_top_city: "The city of your guide",
  form_top_link: "Show us your best city content (link)",
  form_top_submit: "I want my guide",
  form_top_note: "We reply within 48 hours. A person, not a bot.",
  form_micro_title: "I'll send my video",
  form_micro_sub: "For anyone starting out with one good recommendation.",
  form_micro_name: "Name",
  form_micro_email: "Email",
  form_micro_handle: "@handle",
  form_micro_city: "City",
  form_micro_link: "Link to your video (Reel, TikTok or YouTube)",
  form_micro_submit: "Send my video",
  form_micro_note: "If you're in, we'll write. If not, we'll write too — and tell you why.",
  forms_fine_print: "Your content stays yours. No exclusivity, no small print.",
  form_success: "Got it. We'll write to the email you left us.",
  form_error: "Couldn't send. Try again in a few minutes.",
} as const;

export type InfluencersContent = { -readonly [K in keyof typeof defaultInfluencersContent]: string };
