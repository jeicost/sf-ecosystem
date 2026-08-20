/**
 * EN copy for /360/alojamientos — discoolver 360 brand.
 *
 * English translation of lib/content/b360/alojamientos.ts (2026-08-11), following
 * lib/content/en/GLOSARIO.md. Flat-fields model, same as the rest of the ecosystem:
 * one "content" section per page in SF-CMS. CMS slug: 360-alojamientos-en.
 *
 * These values are the FALLBACK; once the page is seeded in the CMS, mergeContent
 * overrides them. Same caveat as web/CLAUDE.md: mergeContent only walks the keys of
 * the fallback, so a field deleted from here goes inert in the CMS.
 *
 * Keys and order are identical to the Spanish file — do not add, remove or reorder.
 * Values starting with [PENDIENTE: ...] stay in Spanish on purpose: they are internal
 * notes, not copy (this page currently has none).
 */
export const defaultAlojamientos360Content = {
  hero_eyebrow: "Hotels · Hostels · Apartment networks",
  hero_title: "Your digital concierge. And a revenue line.",
  hero_sub:
    "discoolver plugs into the check-in you already run, answers your guest at any hour, and gives you back a share of what they book outside the property.",
  hero_cta_primary: "Book a demo",
  hero_cta_secondary: "See modules and pricing",  // href corregido en page.tsx: #modulos, no #comision
  hero_reassurance:
    "A 30-minute demo, no strings attached. No development on your side. No app your guest is forced to install.",
  problema_eyebrow: "The starting point",
  problema_title: "Your guest asks, and Google answers",
  problema_intro:
    "Where do I eat tonight, what do I do tomorrow if it rains, how do I get to the viewpoint. Same questions, every single day. Today they get answered by a search engine, a TripAdvisor review, or whichever front desk shift happens to have a spare minute. Your guest ends up booking something your property never chose, on a platform that gives you nothing back.",
  problema_1_titulo: "The front desk answers the same thing a hundred times",
  problema_1_texto:
    "Your recommendations live in your team's heads, on a laminated sheet, or in a drawer full of leaflets. They change with every shift, they go out of date, and at two in the morning they don't exist at all.",
  problema_2_titulo: "Someone else writes the story of your area",
  problema_2_texto:
    "When your guest searches on their own, they see whatever the generic platforms rank: the most crowded spots, not what fits them and not what you want them to take away from the area.",
  problema_3_titulo: "The sale closes elsewhere, and nothing comes back",
  problema_3_texto:
    "Every dinner, ticket or day trip your guest books is money that moves because of your property. Today it doesn't go through you, you never see it, and it leaves you neither revenue nor data.",
  concierge_eyebrow: "Discovery tools",
  concierge_title: "Turn your property into the soul of the trip",
  concierge_lead:
    "Four tools that work together, and that your guest opens straight from the browser with nothing to download.",
  concierge_1_nombre: "local voice assistant",
  concierge_1_texto:
    "An AI assistant trained on your property's content and on the area around it, so it becomes your 24/7 guest service. It answers complex questions, builds personalized routes, and updates what it knows in real time.",
  concierge_1_precio: "€250/month",
  concierge_2_nombre: "Plan My Trip",
  concierge_2_texto:
    "Your guest says who they are traveling with, how much time they have and what they are into. Plan My Trip builds them a downloadable, bookable, shareable route in seconds. Hospitality Award 2021 at the Digital Enterprise Show.",
  concierge_2_precio: "€150/month",
  concierge_3_nombre: "Local calendar and map",
  concierge_3_texto:
    "The events calendar for the area, with ticket sales built in, and a clean map of the districts and the standout spots. Your guest sees what is on this week ten minutes from your door.",
  concierge_3_precio: "€100/month",
  concierge_4_nombre: "QR codes and kiosks",
  concierge_4_texto:
    "The physical ways in: a QR code in the room, on the key card, in the elevator or at the desk, and an interactive kiosk in the lobby. Your guest scans, and they are in.",
  concierge_4_precio: "€100/month",
  checkin_eyebrow: "Check-in system",
  checkin_title: "Discovery starts at check-in, not on your guest's phone",
  checkin_intro:
    "We don't add another step to your operation. discoolver attaches to the flow you already run: the moment your guest completes check-in, they get access to their concierge. At the front desk, at the kiosk, or in the link you send before they arrive.",
  checkin_paso_1_momento: "Before arrival",
  checkin_paso_1_accion:
    "The concierge link travels in the confirmation email or in the online check-in. Your guest starts planning the stay before they unpack.",
  checkin_paso_2_momento: "At the front desk",
  checkin_paso_2_accion:
    "Reception hands over the key with its QR code. One scan and your guest has the house recommendations, the map and the week's agenda in front of them.",
  checkin_paso_3_momento: "During the stay",
  checkin_paso_3_accion:
    "The QR code in the room and the kiosk in the lobby keep the door open. The assistant answers at any hour, including when there is nobody at the front desk.",
  checkin_integracion:
    "No PMS change and no development on your side: we attach to the check-in system you have today, we don't replace it.",
  comision_eyebrow: "Commission on sales",
  comision_title: "Stop being a cost and become a revenue line",
  comision_intro:
    "Every booking your guest makes from your concierge (a ticket, a tasting, a day trip, a table) closes inside the discoolver marketplace. There is a commission on that sale, and part of that commission comes back to your property. You don't get paid for recommending: you get paid for what gets booked.",
  comision_flujo_1:
    "Your guest opens the concierge and finds a recommendation that fits them.",
  comision_flujo_2: "They book and pay inside the platform, without detouring to a search engine.",
  comision_flujo_3: "The sale is recorded and your property collects its share.",
  comision_dato_plataforma_valor: "10-15%",
  comision_dato_plataforma_label: "discoolver's commission on marketplace sales",
  comision_dato_alojamiento_valor: "Your share",
  comision_dato_alojamiento_label:
    "Set in the contract, on every completed sale from your concierge, and settled on a regular cycle",
  comision_nota:
    "We tell you your percentage on the first call, with your volume in front of us: it moves with the modules you take and with whether you are a single property or a group. It is not a brochure figure, because we don't apply the same terms to a twenty-bed hostel as to a nine-hotel chain. Settlement is monthly.",
  comision_cierre:
    "Traveler spend keeps shifting toward what they do in the destination — activities, tables, experiences — and away from the bed. Today that spend walks right past your front desk and leaves you nothing.",
  caso_eyebrow: "Live deployment",
  caso_title:
    "Ronda: the platform deployed across an entire destination, with cross-selling through hotels",
  caso_texto:
    "In Ronda, discoolver has run as the destination platform since 2022: more than 200 local businesses and offerings integrated, interactive kiosks, QR signage at key points and eight points of sale. Properties enter that ecosystem through cross-selling: they recommend inside the platform and the booking closes there.",
  caso_dato_1_valor: "200+",
  caso_dato_1_label: "Local businesses and offerings integrated",
  caso_dato_2_valor: "8",
  caso_dato_2_label: "Points of sale deployed",
  caso_dato_3_valor: "2022",
  caso_dato_3_label: "Year of deployment, a paying client ever since",
  caso_dato_4_valor: "QR",
  caso_dato_4_label: "Signage and interactive kiosks across the destination",
  segmentos_eyebrow: "Three different ways to use it",
  segmentos_title: "We design the setup around how your house actually runs",
  segmento_1_nombre: "Hotel chains and groups",
  segmento_1_compra: "Standardization",
  segmento_1_texto:
    "The same concierge in every property, with different local content in each market. The same check-in flow, the same recommendation criteria and the same dashboard for all of them. You stop depending on each general manager having their own list of places and get a brand standard that rolls out the same way in Málaga as in Bilbao.",
  segmento_1_cierre:
    "One way of recommending across the whole chain, and one read on what your guest books.",
  segmento_2_nombre: "Hostels and small hotels",
  segmento_2_compra: "Differentiation without the overhead",
  segmento_2_texto:
    "A young crowd, high turnover and a short-staffed team that can't explain the city fifteen times a day. The assistant answers for you at any hour and your recommendations stop being a laminated sheet on the desk. No new hires and no building work: a QR code and one active module are enough to deliver a service that until now belonged to the big hotels.",
  segmento_2_cierre:
    "The service that sets you apart costs the price of a module, not the price of a payroll.",
  segmento_3_nombre: "Apartment networks and property managers",
  segmento_3_compra: "Guest service without a front desk",
  segmento_3_texto:
    "With no desk, your guest arrives and has nobody to ask. The QR code they get at check-in opens a concierge that answers at eleven at night and at seven in the morning. We build dedicated setups for apartment networks, so that every one of your units delivers the same level of service without multiplying your calls and messages.",
  segmento_3_cierre:
    "Front desk service in apartments that have no front desk, and the same standard in every one.",
  modulos_eyebrow: "Modules and pricing",
  modulos_title: "Every module works on its own. Together they are the full concierge.",
  modulos_lead:
    "Every module is taken on subscription and either plugs into the website you already have or deploys as a new platform. No development on your side.",
  modulo_1_nombre: "Local voice assistant",
  modulo_1_desc:
    "An AI chatbot trained on your property's content and its surroundings. 24/7 guest service.",
  modulo_1_para: "Your guest, at any hour",
  modulo_1_precio: "€250/month",
  modulo_2_nombre: "Plan My Trip",
  modulo_2_desc:
    "A route planner personalized by traveler type, trip length and budget. Hospitality Award 2021.",
  modulo_2_para: "Guests who arrive without a plan",
  modulo_2_precio: "€150/month",
  modulo_3_nombre: "Smart Calendar",
  modulo_3_desc:
    "The culture and events calendar for the area, with ticket sales built in.",
  modulo_3_para: "Weekend stays and repeat guests",
  modulo_3_precio: "€100/month",
  modulo_4_nombre: "Signage and kiosks",
  modulo_4_desc:
    "Interactive kiosks and a QR system in the room, the lobby and the places guests pass through.",
  modulo_4_para: "Properties with a physical entry point",
  modulo_4_precio: "€100/month maintenance",
  modulo_5_nombre: "Marketplace",
  modulo_5_desc:
    "Sells tourism services of your own and your partners'. This is the module that turns your recommendations into bookings you get paid for.",
  modulo_5_para: "Properties that want to earn from recommending",
  modulo_5_precio: "€750/month + 10-15% commission on sales",
  modulo_6_nombre: "Business Intelligence",
  modulo_6_desc:
    "Dashboard and reports on what your guest looks up, plans and books.",
  modulo_6_para: "Management and revenue",
  modulo_6_precio: "Included with the modules",
  modulo_7_nombre: "Point of Sale (POS) software",
  modulo_7_desc:
    "Takes payment at the physical point you already have: the front desk, the hotel shop or the excursions counter. Same catalog as the concierge, and the day's cash-up in the same place.",
  modulo_7_para: "Optional, for properties with their own point of sale",
  modulo_7_precio: "€495/month + €50 per point",
  modulos_stack: "The full stack of all seven modules comes to €1,845/month at list price.",
  arranque_eyebrow: "Getting started",
  arranque_title: "What you need to get going",
  arranque_paso_1_titulo: "Your current recommendations",
  arranque_paso_1_texto:
    "Whatever your team recommends today: the list, the leaflet, or what is in the front desk manager's head. We load it ourselves and round it out with the destination's local content.",
  arranque_paso_2_titulo: "A connection to your check-in",
  arranque_paso_2_texto:
    "We attach concierge access to the flow you already use: a link in the confirmation email, a QR code on the key card or at the kiosk. You don't change systems.",
  arranque_paso_3_titulo: "Physical entry points",
  arranque_paso_3_texto:
    "We put the QR codes in the room, the lobby and the elevator, and the kiosk if you take it. No building work and no complex hardware.",
  arranque_paso_4_titulo: "One session with your team",
  arranque_paso_4_texto:
    "The front desk doesn't manage the platform: it consults it and hands it over. Showing them how to hand out the QR code and how to read the dashboard is enough.",
  arranque_requisito_integracion:
    "Integration: we attach to your check-in system. No development on your side and no app your guest is forced to install.",
  arranque_requisito_tiempo:
    "Time: launch depends on how much of your own content you hand us and on your check-in system. We commit to a firm date in the proposal, not before.",
  arranque_requisito_personal:
    "People: one point of contact to sign off the content. No new hire at the front desk.",
  faq_eyebrow: "The usual objections",
  faq_title: "What management asks us before signing",
  faq_1_pregunta: "Doesn't this send my guest out of the property?",
  faq_1_respuesta:
    "Your guest is going out either way. The question is whether they go out with your house's recommendation or a search engine's, and whether that trip out earns you anything. With the concierge, they leave with what you approved and the booking goes through you.",
  faq_2_pregunta: "Do I have to change my PMS or my check-in system?",
  faq_2_respuesta:
    "No, and there is nothing to change: the concierge runs alongside your system, with no PMS integration at all. It is handed over as a QR code or a link at check-in — it doesn't touch your operation, it needs no development, and it makes no difference which software you run.",
  faq_3_pregunta: "Does the guest have to download an app?",
  faq_3_respuesta:
    "It is never required. They scan the QR code and go in from the browser. The app exists for anyone who wants it, but it is never a requirement to use the concierge.",
  faq_4_pregunta: "Who keeps the content up to date?",
  faq_4_respuesta:
    "discoolver maintains the destination content inside the platform, and the assistant refreshes what it knows in real time. Your own recommendations are yours to decide and approve.",
  faq_5_pregunta: "Can I choose who I recommend?",
  faq_5_respuesta:
    "Yes. You approve what goes into your property's recommendations. Visibility inside your concierge is not for sale: you decide it.",
  faq_6_pregunta: "Who owns my guest data?",
  faq_6_respuesta:
    "You do. You get a dashboard and reports on what your guests look up, plan and book, included when you take the modules.",
  faq_7_pregunta: "How long until it is up and running?",
  faq_7_respuesta:
    "The point of sale is integrated in 15 days; the rest depends on your content and your check-in, and comes with a firm date in the proposal. No months of development and no complex hardware.",
  faq_8_pregunta: "How and when do I get paid the commission?",
  faq_8_respuesta:
    "On every completed sale in the marketplace from your concierge. discoolver charges a 10-15% commission on those sales and your share is set in the contract according to your volume, with monthly settlement.",
  faq_9_pregunta: "I have several properties. Do I sign up one at a time?",
  faq_9_respuesta:
    "List pricing applies per property, and a rollout across several properties shares one standard and one dashboard. For groups and chains we size a single joint agreement in the proposal, with volume terms.",
  cta_title: "Want to try the concierge in your property?",
  cta_sub:
    "Half an hour of demo with your case on the table: your type of property, your check-in flow and what your guest would actually book in your area.",
  cta_boton: "Book a demo",
  cta_reassurance:
    "A 30-minute demo, no strings attached. Get in touch and someone from the team will answer your questions.",
  cta_contacto:
    "info@discoolver.com · Questions on WhatsApp · (+66) 83 829 1723 · C/ María de Molina 39, 28006 Madrid",
} as const;

export type Alojamientos360Content = { -readonly [K in keyof typeof defaultAlojamientos360Content]: string };
