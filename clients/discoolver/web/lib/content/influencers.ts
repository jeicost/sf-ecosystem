/**
 * Hardcoded fallback copy for /influencers — mirrors the SF-CMS flat-fields
 * shape (project: discoolver, page slug: influencers, section id: "content").
 * See lib/content/home.ts for the full pattern explanation.
 */
export const defaultInfluencersContent = {
  // Hero
  hero_eyebrow: "Welcome to the Cool Club",
  hero_title_1: "Not a Tourist.",
  hero_title_2: "Not a",
  hero_title_2_highlight: "Follower.",
  hero_title_3: "An",
  hero_title_3_highlight: "Explorer.",
  hero_sub_1: "Where creators don't just post content —",
  hero_sub_2: "they shape how the world travels.",
  hero_cta_primary: "Apply as Creator",
  hero_cta_secondary: "See the tools",
  hero_stat_1_label: "Monetizable",
  hero_stat_2_label: "Geolocated",
  hero_stat_3_label: "Customized",

  // Value props
  value_props_badge: "● Creator · invite-only",
  value_props_badge_line: "Show the world in a different way.",
  value_props_eyebrow: "Start creating with Discoolver",
  value_props_title: "Transform your travels into",
  value_props_title_highlight: "inspiring stories.",
  value_props_lead: "Discoolver turns your content into personalized recommendations for travelers around the world.",
  value_prop_1_title: "Earn from every sale",
  value_prop_1_desc: "Scale your business and start generating sustainable long-term income with tracked links to your content.",
  value_prop_2_title: "Offer new tools to your users",
  value_prop_2_desc: "Maps, calendars and interactive guides with your content. Your followers don't just see you — they literally follow you.",
  value_prop_3_title: "Expand your community",
  value_prop_3_desc: "Connect with new audiences, grow your base and access travelers in different markets around the world. Get discovered for what you share, not just how you look.",
  value_props_cta: "Start monetizing",

  // Tools
  tools_eyebrow: "Feed your community with gold",
  tools_title: "Discoolver is not another promo tool.",
  tools_title_2: "It's an",
  tools_title_highlight: "ecosystem for creators.",
  tools_lead: "Designed for quality content and real impact on travel.",
  tools_cta: "Create your travel guides",
  tool_1_title: "Trip Guides",
  tool_1_desc: "Create your own trip guides to offer your followers.",
  tool_2_title: "Smart Calendar",
  tool_2_desc: "Make sure your audience know the events you are attending and help promote them.",
  tool_3_title: "Cool Map",
  tool_3_desc: "We design a view with all your recommendations to share with your community.",

  // Criteria
  criteria_eyebrow: "Creators With Criteria",
  criteria_title: "We don't f*ck with",
  criteria_title_highlight: "bad recommendations.",
  criteria_lead: "Only creators who move culture get in. Micro or macro — if your content brings value, you're in.",
  criteria_1_title: "Authentic Voice",
  criteria_1_desc: "You've got a niche, a voice, and a mission. Not just for likes, but for meaning.",
  criteria_2_title: "Authentic Curators",
  criteria_2_desc: "This isn't a platform for influencers. It's for curators of real experience.",
  criteria_cta: "Apply as Creator",

  // Territory
  territory_eyebrow: "Design your territory",
  territory_title: "Claim your map & guides.",
  territory_title_highlight: "Build your legacy.",
  territory_lead: "Give your audience something more than pretty pictures.",
  territory_1: "Unlock explorer badges for each zone or theme",
  territory_2: "Share interactive maps your audience can follow, save & use",
  territory_3: "Mark territories with your unique picks, stories & content",
  territory_cta: "Create Your account",
  territory_badge: "🛠 SYSTEM FEATURES",

  // Testimonials
  testimonials_eyebrow: "Proven by the People Who Matter",
  testimonials_title: "We curate the best",
  testimonials_title_highlight: "local creators.",
  testimonial_1_quote: "Discoolver helped me tell the untold story of the city.",
  testimonial_1_handle: "@viajeraautentica",
  testimonial_2_quote: "I gained real connections and unexpected collabs.",
  testimonial_2_handle: "@exploradorurbano",
  testimonial_3_quote: "From content to community: finally a platform that gets it.",
  testimonial_3_handle: "@aventurera_creativa",

  // Movement
  movement_eyebrow: "Not an Agency. Not a Marketplace.",
  movement_title_highlight: "Movement.",
  movement_desc: "We don't sell creators to brands. We partner with explorers to craft moments that matter. You bring the insight. We bring the tools, the missions, and the map.",
  movement_cta: "Apply as Creator",

  // Apply form
  apply_eyebrow: "Apply as Creator",
  apply_title: "Request Your",
  apply_title_highlight: "Creator Key.",
  apply_content_focus_label: "🔽 Content Focus",
  apply_region_label: "🌍 Main region where you create content",
  apply_socials_label: "🔗 Social Network Links",
  apply_message_label: "✉️ Why do you want to be part of Discoolver?",
  apply_message_placeholder: "Tell us about your content, your community and what moves you...",
  apply_email_label: "📧 Your main contact",
  apply_submit: "Apply as Creator",

  // Downloadables
  downloadables_eyebrow: "Downloadables",
  downloadables_title: "Exclusive guides created by our",
  downloadables_title_highlight: "explorers.",
  guide_1_emoji: "📍",
  guide_1_duration: "3 days",
  guide_1_city: "Madrid",
  guide_1_subtitle: "Culture, tapas and rooftops",
  guide_1_desc: "Discover the best-kept secrets of the Spanish capital with this complete 3-day guide.",
  guide_1_tag_1: "🎭 Local culture",
  guide_1_tag_2: "🍷 Authentic tapas",
  guide_1_tag_3: "🌆 Exclusive rooftops",
  guide_2_emoji: "🍜",
  guide_2_duration: "2 days",
  guide_2_city: "Bangkok",
  guide_2_subtitle: "Street food, night markets and temples",
  guide_2_desc: "Immerse yourself in the vibrant Thai culture with this intensive 2-day guide.",
  guide_2_tag_1: "🍜 Street food",
  guide_2_tag_2: "🌙 Night markets",
  guide_2_tag_3: "🏛️ Sacred temples",
  guide_3_emoji: "🇪🇸",
  guide_3_duration: "7 days",
  guide_3_city: "Spain",
  guide_3_subtitle: "Flexible route between cities and local experiences",
  guide_3_desc: "Explore Spanish diversity with this flexible 7-day route through multiple cities.",
  guide_3_tag_1: "🏙️ Multiple cities",
  guide_3_tag_2: "🎯 Local experiences",
  guide_3_tag_3: "🚄 Flexible route",
  guide_cta: "Download Guide",
} as const;

export type InfluencersContent = { -readonly [K in keyof typeof defaultInfluencersContent]: string };
