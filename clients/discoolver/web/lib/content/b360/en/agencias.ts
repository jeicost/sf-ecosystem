/**
 * Copy EN de /360/agencias — marca discoolver 360.
 *
 * Traducción de lib/content/b360/agencias.ts (ES). Slug en SF-CMS: 360-agencias-en.
 * Mismo modelo flat-fields y MISMAS CLAVES que el original: mergeContent solo recorre
 * las claves del fallback, así que las dos versiones deben mantenerse en paralelo —
 * un campo nuevo en el ES hay que añadirlo aquí o queda inerte en la página EN.
 *
 * Los valores con [PENDIENTE: ...] se quedan EN ESPAÑOL a propósito: son notas internas
 * para producto y dirección, no copy publicable, y la UI los pinta como aviso.
 */
export const defaultAgencias360Content = {
  hero_label: "discoolver 360 · agencies, DMCs and inbound operators",
  hero_title: "The local catalog you can't sell today",
  hero_sub:
    "The destination's experience product is scattered across two hundred businesses with no listing, no published price and no way to book them. We digitize it and hand you the storefront and the point of sale to bring it to market.",
  hero_cta_1: "Let's talk about your catalog",
  hero_cta_1_url: "/360/demo?v=agencia",
  hero_cta_2: "See modules and pricing",
  hero_cta_2_url: "#modulos",
  hero_honestidad:
    "The modules have been running in destinations for years, with real deployments taking money on the street. In Ronda the catalogue is already connected with agencies and selling to wholesalers through our own software. What changes with you is the scope, and that comes out of the first conversation, not out of this page.",
  perfiles_label: "Who it's for",
  perfiles_title: "If you sell a destination, local product is your inventory",
  perfiles_lead:
    "We talk to management and to product leads. Three different profiles, the same bottleneck: the local catalog is scattered, onboarding it costs more than it returns, and the margin goes into handling it manually.",
  perfil_1_nombre: "DMC",
  perfil_1_texto:
    "You build tailor-made programs and close experience product by phone, by email or over WhatsApp. Every new supplier is manual work that doesn't scale and that gets lost the moment the person handling it moves on.",
  perfil_2_nombre: "Inbound tour operator",
  perfil_2_texto:
    "You have volume, and contracting is solved for accommodation and transport. On local product you keep going back to the same ten suppliers, because onboarding a small business costs more than it adds to the margin.",
  perfil_3_nombre: "Inbound and excursions agency",
  perfil_3_texto:
    "You sell over the counter, at hotel reception and at physical points. You need to take payment on the spot, with the same catalog and the same prices across every channel, and to know at the end of the day what sold and where.",
  no_encaje_titulo: "When we're not your supplier",
  no_encaje_texto:
    "If what you need is a flight booking engine, an accounting back office or a connector to your ERP, that isn't us. discoolver 360 brings the digitized local catalog, the place to sell it and the point where you take payment. Everything else stays where it is.",
  encaje_integracion:
    "What we do make sure of is that the catalogue doesn't stay locked inside our platform: it can be consumed from your own systems and sold under your brand, so your customer buys without leaving your site. The exact scope of the integration is agreed in the demo, with your system in front of us.",
  que_damos_label: "What we bring",
  que_damos_title: "The part nobody wants to do, already done",
  que_damos_lead:
    "We're not selling you one more channel. We're selling you local inventory turned into sellable product, the storefront to put it in and the checkout to get paid for it.",
  bloque_1_titulo: "Digitized local catalog",
  bloque_1_texto:
    "Businesses, products, activities and events across the destination turned into listings with content, photography and structured data. It's the slow, thankless work without which there is nothing to sell, and it's what we have been doing in destinations for years.",
  bloque_2_titulo: "Marketplace",
  bloque_2_texto:
    "A sales system carrying your products and your partners'. It plugs into the website you already have, or ships as a new platform. No development on your side, and nobody has to download an app.",
  bloque_3_titulo: "Physical point of sale",
  bloque_3_texto:
    "Take payment at the counter, in the office, in a hotel or at a monument, with the same catalog as the online channel. Connected in fifteen days, no complex hardware and no months of development.",
  bloque_4_titulo: "Data on what gets searched and what gets sold",
  bloque_4_texto:
    "Dashboard and reports covering every bit of activity in the ecosystem: what the traveler looks up, what they book and what they leave unbought. The data is yours, and it works for negotiating with suppliers and deciding which product is worth contracting. The Business Intelligence module comes included with the modules you contract.",
  comision_texto:
    "For the trade channel, the model is net rates: you buy local product net and build your margin on top of it — no commission on your sales. The 10-15% commission applies to the destination marketplace, not to the agency channel. Modules are contracted separately, always on subscription.",
  encaje_label: "How it fits",
  encaje_title: "It doesn't replace what you already sell, it fills the gap next to it",
  paso_1_titulo: "What's yours stays yours",
  paso_1_texto:
    "Accommodation, transport, guiding and your own programs go untouched. discoolver 360 goes into the layer you have empty today, or patched by hand: the destination's local product.",
  paso_2_titulo: "The catalog gets digitized once",
  paso_2_texto:
    "Every business becomes a listing with content, price and terms. From there it stops being a contact book and becomes inventory you can query, update and sell.",
  paso_3_titulo: "It sells through your channels",
  paso_3_texto:
    "Marketplace on your website, point of sale at the counter, interactive kiosks and QR codes across the destination, route planner for the end customer. The same catalog feeding every channel.",
  paso_4_titulo: "It gets measured and renegotiated",
  paso_4_texto:
    "With the data on what gets searched and what gets bought, you come to the contracting table with arguments, and you decide which local product you scale and which you let go.",
  encaje_pendiente:
    "",
  caso_label: "What's already deployed",
  caso_title: "Ronda",
  caso_texto:
    "In Ronda, more than two hundred local businesses and offerings are integrated into the platform, along with eight points of sale, interactive kiosks and QR signage spread across the city. It's a paying client, with the tourist office selling from the point of sale and cross-selling with hotels. The project is also part of SEGITTUR and the DTI network, and went through the Costa del Sol Tourism Hub accelerator.",
  caso_stat_1_valor: "200+",
  caso_stat_1_label: "Local businesses integrated",
  caso_stat_2_valor: "8",
  caso_stat_2_label: "Points of sale in the destination",
  caso_stat_3_valor: "4 years",
  caso_stat_3_label: "Of contract running in Ronda",
  caso_honestidad:
    "Ronda started out as a destination, but it is where the thing an agency cares about is already proven: the local catalogue is connected with agencies and sold to wholesalers through our own software. The hard part isn't in a slide deck — it is digitised, on sale and taking money.",
  caso_pendiente:
    "",
  modulos_label: "Applicable modules",
  modulos_title: "Contracted separately, on subscription",
  modulos_lead:
    "These are list prices. For an agency the core is the first two; the rest come in depending on how and where you sell.",
  modulo_1_nombre: "Marketplace",
  modulo_1_precio: "€750/month",
  modulo_1_para_que:
    "Selling your services and your partners': accommodation, products, activities and events. It's the storefront where the catalog lives.",
  modulo_2_nombre: "Point of sale software (POS)",
  modulo_2_precio: "€495/month + €50 per point",
  modulo_2_para_que:
    "Take payment at the counter, in an office, a hotel or a monument. Integrated in fifteen days, no complex hardware.",
  modulo_3_nombre: "Plan My Trip",
  modulo_3_precio: "€150/month",
  modulo_3_para_que:
    "Route planner by traveler type, trip length and budget. Turns a loose enquiry into a bookable itinerary. Hospitality Award 2021 at the Digital Enterprise Show.",
  modulo_4_nombre: "Local voice assistant",
  modulo_4_precio: "€250/month",
  modulo_4_para_que:
    "Chatbot trained on the destination's content. Handles traveler questions twenty-four hours a day without adding headcount.",
  modulo_5_nombre: "Smart Calendar",
  modulo_5_precio: "€100/month",
  modulo_5_para_que:
    "The destination's cultural and events calendar with ticketing built in. Seasonal product that slips past you today.",
  modulo_6_nombre: "Signage and interactive kiosks",
  modulo_6_precio: "€100/month",
  modulo_6_para_que:
    "Interactive kiosks and QR codes at physical points. Selling away from the counter, where the traveler already is.",
  modulo_7_nombre: "Business Intelligence",
  modulo_7_precio: "Included",
  modulo_7_para_que:
    "Dashboard and reports with all the ecosystem's data. Included with the modules you contract.",
  modulos_stack:
    "The full stack of all seven modules comes to €1,845/month. A commission of 10-15% applies on marketplace sales.",
  modulos_agencia:
    "These prices are the reference rate. With an agency the set of modules is adapted to your problem — you don't all need the same things, or in the same order — so the scope and the final figure come out of the proposal, not out of this table.",
  modulos_pendiente:
    "",
  cta_label: "Next step",
  cta_title: "A conversation, not a generic demo",
  cta_texto:
    "Tell us which destination you operate in, what local product you sell today and how you take payment for it. You come out of that call with a concrete answer: which modules fit you, at what price, and what's still to be defined on our side.",
  cta_boton: "Let's talk about your catalog",
  cta_boton_url: "/360/demo?v=agencia",
  cta_contacto_email: "info@discoolver.com",
  cta_contacto_telefono: "Questions on WhatsApp · (+66) 83 829 1723",
  cta_contacto_direccion: "C/ María de Molina 39, 28006 Madrid",
} as const;

export type Agencias360Content = { -readonly [K in keyof typeof defaultAgencias360Content]: string };
