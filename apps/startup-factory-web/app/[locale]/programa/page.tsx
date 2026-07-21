import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";
import { PagePixels, loadPagePixels } from "@/components/PagePixels";

const site = "https://www.startupsfactory.es";
const CALENDLY_URL = "https://calendly.com/jacostech";

const contentDict: Record<Locale, {
  title: string; description: string;
  badge: string; h1: string; h1Accent: string;
  h2sub: string; h2subAccent: string;
  body: string; subnote: string;
  ctaPrimary: string; ctaSecondary: string;
  stat1n: string; stat1l: string; stat2n: string; stat2l: string; stat3n: string; stat3l: string;
  whoEyebrow: string; whoH2: string; whoBody1: string; whoBody2: string;
  logos: Array<{ name: string; detail: string }>;
  testimonial: string; testimonialAuthor: string;
  fitEyebrow: string; fitH2: string;
  applyLabel: string; notApplyLabel: string;
  applyItems: string[]; notApplyItems: string[];
  notApplyNote: string;
  processEyebrow: string; processH2: string;
  steps: Array<{ n: string; title: string; desc: string; detail: string }>;
  barrierLabel: string;
  outcomesEyebrow: string; outcomesH2: string;
  fitCard: { badge: string; title: string; items: string[] };
  noFitCard: { badge: string; title: string; items: string[] };
  ctaEyebrow: string; ctaH2: string; ctaH2Accent: string; ctaBody: string;
  ctaApply: string; ctaSchedule: string; ctaNote: string;
  faqEyebrow: string; faqH2: string;
  faqs: Array<{ q: string; a: string }>;
  finalEyebrow: string; finalH2: string; finalH2Accent: string; finalBody: string;
  finalCta: string; finalAlt: string;
}> = {
  es: {
    title: "Programa de selección | Startup Factory",
    description: "Cuéntanos tu proyecto. Escuchamos a todos. Aceptamos a menos del 10%. Si vemos fit, diseñamos una propuesta a tu medida con el equipo.",
    badge: "Startup Factory · Programa de selección",
    h1: "Llevamos tu proyecto", h1Accent: "al siguiente nivel.",
    h2sub: "Convertimos tu idea en el proyecto", h2subAccent: "que los clientes necesitan.",
    body: "Cuéntanos el tuyo. Escuchamos a todos. Avanzamos con los que de verdad tienen potencial — y cuando lo hacemos, lo apostamos todo.",
    subnote: "Si no hay fit, te lo decimos con criterio y con honestidad. Saldrás con algo igualmente valioso.",
    ctaPrimary: "Aplica ahora — es gratis", ctaSecondary: "Ver cómo funciona",
    stat1n: "100%", stat1l: "dedicación cuando hay fit",
    stat2n: "30 min", stat2l: "sesión de diagnóstico",
    stat3n: "24h", stat3l: "respondemos siempre",
    whoEyebrow: "Quién decide", whoH2: "No es un algoritmo. Es Carlos quien revisa tu proyecto.",
    whoBody1: "Fundador de Startup Factory. Emprendedor nómada digital operando desde Tailandia. Ha construido y escalado proyectos de innovación con empresas como Mahou, Airbus, Siemens Gamesa y Amadeus.",
    whoBody2: "Cada informe pasa por sus manos. Cada decisión la toma él. Por eso el programa es limitado — y por eso vale la pena estar en él.",
    logos: [
      { name: "BarLab Ventures · Mahou", detail: "Innovación abierta" },
      { name: "Airbus", detail: "Venture building" },
      { name: "Siemens Gamesa", detail: "Innovación abierta" },
      { name: "Amadeus", detail: "Ecosistema startup" },
    ],
    testimonial: "Startup Factory no llegó como un proveedor más — llegó como parte del equipo.",
    testimonialAuthor: "Natalia Aldea · Directora de Marketing, Dadybox",
    fitEyebrow: "¿Encajas?", fitH2: "Este programa es para ti si...",
    applyLabel: "Aplica si", notApplyLabel: "No apliques si",
    applyItems: [
      "Tienes una idea clara y no sabes con qué equipo o estructura avanzar",
      "Llevas tiempo construyendo solo y necesitas un equipo real que ejecute contigo",
      "Tu startup tiene tracción pero el crecimiento no es predecible todavía",
      "Buscas conexiones específicas: un CTO, un inversor, un socio estratégico",
      "Quieres integrar IA en tu operativa pero no sabes por dónde empezar",
      "Estás dispuesto a escuchar feedback directo aunque no sea lo que esperabas",
    ],
    notApplyItems: [
      "Buscas validación fácil o alguien que diga sí a todo",
      "No tienes tiempo real para comprometerte con el proceso",
      "Esperas resultados sin meter tú el trabajo que hay que meter",
      "Ya tienes todo decidido y solo buscas manos que ejecuten sin criterio propio",
    ],
    notApplyNote: "\"Si tienes dudas de si encajas, aplica igualmente. Nosotros te lo decimos con honestidad — y en cualquier caso te aportamos algo.\"",
    processEyebrow: "El proceso", processH2: "Cómo funciona",
    steps: [
      { n: "01", title: "Cuéntanos tu proyecto", desc: "Rellena el formulario en 2 minutos. Sin filtros previos — escuchamos a todos. Cuanto más concreto seas, mejor preparamos la sesión.", detail: "Confirmamos la llamada en menos de 24h." },
      { n: "02", title: "Sesión de diagnóstico — 30 min", desc: "Una conversación real con el equipo. Sin pitch deck, sin presentaciones. Analizamos tu idea, tu fase, tu potencial y lo que necesitas para avanzar.", detail: "Honestidad total desde el minuto uno." },
      { n: "03", title: "Carlos decide personalmente", desc: "Cada caso pasa por sus manos. Carlos lee el informe completo y decide si hay fit real para trabajar juntos. No hay comité, no hay algoritmo.", detail: "Menos del 10% llegan a esta fase." },
      { n: "04", title: "Plan concreto o feedback accionable", desc: "Si hay fit: plan 30/60/90 días con el squad exacto y presupuesto real. Si no: feedback honesto con lo que cambiar y cuándo volver. En los dos casos, sales con algo valioso.", detail: "Sin rodeos, sin letra pequeña." },
    ],
    barrierLabel: "La barrera que lo hace especial",
    outcomesEyebrow: "Los dos caminos", outcomesH2: "En ambos casos, sales ganando",
    fitCard: {
      badge: "Si hay fit",
      title: "Reunión con Carlos + propuesta a medida",
      items: [
        "Plan 30/60/90 días diseñado para tu caso",
        "Squad exacto con los roles que necesitas",
        "Presupuesto concreto preparado por Carlos",
        "Acceso al hub de conexiones de SF",
        "Recursos de IA para escalar tu proyecto",
      ],
    },
    noFitCard: {
      badge: "Si no hay fit (de momento)",
      title: "Feedback honesto + hoja de ruta para volver",
      items: [
        "Diagnóstico claro de qué mejorar y cómo",
        "Plazo estimado para volver a aplicar",
        "Acceso a recursos de IA gratuitos",
        "Posibilidad de conectarte con personas del hub",
        "Seguiremos en contacto — nadie se queda solo",
      ],
    },
    ctaEyebrow: "¿Listo para el siguiente paso?",
    ctaH2: "Aplica ahora.", ctaH2Accent: "Tarda 2 minutos.",
    ctaBody: "Cuéntanos tu proyecto. El equipo lo leerá antes de la llamada para que no empieces desde cero.",
    ctaApply: "Aplica ahora — es gratis →", ctaSchedule: "Agendar directamente",
    ctaNote: "Gratuito · Sin compromiso · Respondemos en 24h",
    faqEyebrow: "FAQ", faqH2: "Preguntas frecuentes",
    faqs: [
      { q: "¿La sesión de diagnóstico tiene coste?", a: "No, es completamente gratuita. Nosotros también necesitamos conocerte antes de proponer nada. Ni tú ni nosotros queremos perder el tiempo en algo que no tiene sentido." },
      { q: "¿Qué pasa si no paso?", a: "Te lo decimos con criterio y con honestidad: qué falta, qué mejorar y cuándo tendría sentido volver. Muchos proyectos que trabajan hoy con SF empezaron con un no. El no nunca es un portazo." },
      { q: "¿Por qué solo el 10%?", a: "Porque lo que ofrecemos no es un producto de catálogo — es tiempo real de Carlos y del equipo en proyectos en los que creemos de verdad. No podemos hacerlo para todo el mundo y no queremos intentarlo." },
      { q: "¿Qué tipo de proyectos tienen más fit?", a: "Emprendedores con idea clara y capacidad de ejecución, startups en crecimiento con tracción real y proyectos de innovación con reto concreto. Geografía: España, LATAM y Asia. Duda → aplica igual." },
      { q: "¿Qué incluye la propuesta si hay fit?", a: "Un plan 30/60/90 días con el squad exacto, entregables concretos y presupuesto real. Diseñado por Carlos para tu caso — no una plantilla adaptada." },
      { q: "¿Puedo conectar con la comunidad aunque no pase?", a: "Sí. SF funciona como hub de conexiones. Si el equipo ve potencial, te conectamos con quien tenga sentido para ti — inversor, CTO, socio o cliente. Aunque no trabajemos juntos directamente." },
    ],
    finalEyebrow: "¿Listo?",
    finalH2: "Si tienes un proyecto,", finalH2Accent: "cuéntanoslo.",
    finalBody: "El peor caso es que salgas con feedback honesto y conexiones útiles. El mejor, que construyamos algo juntos.",
    finalCta: "Aplica ahora — es gratis", finalAlt: "Tengo una pregunta primero",
  },
  en: {
    title: "Selection programme | Startup Factory",
    description: "Tell us about your project. We listen to everyone. We accept less than 10%. If we see a fit, we design a tailored proposal with the team.",
    badge: "Startup Factory · Selection programme",
    h1: "We take your project", h1Accent: "to the next level.",
    h2sub: "We turn your idea into the project", h2subAccent: "that customers actually need.",
    body: "Tell us about yours. We listen to everyone. We move forward with those who truly have potential — and when we do, we go all in.",
    subnote: "If there's no fit, we tell you with judgment and honesty. You'll leave with something valuable either way.",
    ctaPrimary: "Apply now — it's free", ctaSecondary: "See how it works",
    stat1n: "100%", stat1l: "commitment when there's fit",
    stat2n: "30 min", stat2l: "diagnosis session",
    stat3n: "24h", stat3l: "we always respond",
    whoEyebrow: "Who decides", whoH2: "It's not an algorithm. Carlos reviews your project personally.",
    whoBody1: "Founder of Startup Factory. Digital nomad entrepreneur operating from Thailand. Has built and scaled innovation projects with companies like Mahou, Airbus, Siemens Gamesa and Amadeus.",
    whoBody2: "Every case goes through his hands. Every decision is his. That's why the programme is limited — and why it's worth being in it.",
    logos: [
      { name: "BarLab Ventures · Mahou", detail: "Open innovation" },
      { name: "Airbus", detail: "Venture building" },
      { name: "Siemens Gamesa", detail: "Open innovation" },
      { name: "Amadeus", detail: "Startup ecosystem" },
    ],
    testimonial: "Startup Factory didn't arrive as just another supplier — they arrived as part of the team.",
    testimonialAuthor: "Natalia Aldea · Marketing Director, Dadybox",
    fitEyebrow: "Do you fit?", fitH2: "This programme is for you if...",
    applyLabel: "Apply if", notApplyLabel: "Don't apply if",
    applyItems: [
      "You have a clear idea and don't know which team or structure to move forward with",
      "You've been building alone and need a real team to execute with you",
      "Your startup has traction but growth isn't predictable yet",
      "You're looking for specific connections: a CTO, investor, or strategic partner",
      "You want to integrate AI into your operations but don't know where to start",
      "You're willing to hear direct feedback even if it's not what you expected",
    ],
    notApplyItems: [
      "You're looking for easy validation or someone to say yes to everything",
      "You don't have real time to commit to the process",
      "You expect results without putting in the work required",
      "You've already decided everything and just want execution without judgment",
    ],
    notApplyNote: "\"If you're unsure whether you fit, apply anyway. We'll tell you honestly — and in any case we'll give you something valuable.\"",
    processEyebrow: "The process", processH2: "How it works",
    steps: [
      { n: "01", title: "Tell us about your project", desc: "Fill in the form in 2 minutes. No prior filters — we listen to everyone. The more specific you are, the better we prepare the session.", detail: "We confirm the call in less than 24h." },
      { n: "02", title: "Diagnosis session — 30 min", desc: "A real conversation with the team. No pitch deck, no presentations. We analyze your idea, stage, potential and what you need to move forward.", detail: "Complete honesty from minute one." },
      { n: "03", title: "Carlos decides personally", desc: "Every case goes through his hands. Carlos reads the full report and decides if there's a real fit to work together. No committee, no algorithm.", detail: "Less than 10% reach this stage." },
      { n: "04", title: "Concrete plan or actionable feedback", desc: "If there's a fit: 30/60/90-day plan with the exact squad and real budget. If not: honest feedback on what to change and when to come back. Either way, you leave with something valuable.", detail: "No beating around the bush." },
    ],
    barrierLabel: "The barrier that makes it special",
    outcomesEyebrow: "Two paths", outcomesH2: "Either way, you come out ahead",
    fitCard: {
      badge: "If there's a fit",
      title: "Meeting with Carlos + tailored proposal",
      items: [
        "30/60/90-day plan designed for your case",
        "Exact squad with the roles you need",
        "Concrete budget prepared by Carlos",
        "Access to the SF connections hub",
        "AI resources to scale your project",
      ],
    },
    noFitCard: {
      badge: "If there's no fit (for now)",
      title: "Honest feedback + roadmap to come back",
      items: [
        "Clear diagnosis of what to improve and how",
        "Estimated timeline to apply again",
        "Access to free AI resources",
        "Possibility of connecting with people in the hub",
        "We'll stay in touch — no one gets left behind",
      ],
    },
    ctaEyebrow: "Ready for the next step?",
    ctaH2: "Apply now.", ctaH2Accent: "Takes 2 minutes.",
    ctaBody: "Tell us about your project. The team will read it before the call so you don't start from zero.",
    ctaApply: "Apply now — it's free →", ctaSchedule: "Schedule directly",
    ctaNote: "Free · No commitment · We respond in 24h",
    faqEyebrow: "FAQ", faqH2: "Frequently asked questions",
    faqs: [
      { q: "Does the diagnosis session have a cost?", a: "No, it's completely free. We also need to get to know you before proposing anything. Neither you nor we want to waste time on something that doesn't make sense." },
      { q: "What happens if I don't pass?", a: "We tell you with judgment and honesty: what's missing, what to improve and when it would make sense to come back. Many projects working with SF today started with a no. A no is never a door slam." },
      { q: "Why only 10%?", a: "Because what we offer is not a catalogue product — it's real time from Carlos and the team on projects we truly believe in. We can't do it for everyone and we don't want to try." },
      { q: "What type of projects have the best fit?", a: "Entrepreneurs with a clear idea and execution capability, growing startups with real traction, and innovation projects with a concrete challenge. Geography: Spain, LATAM and Asia. Not sure → apply anyway." },
      { q: "What does the proposal include if there's a fit?", a: "A 30/60/90-day plan with the exact squad, concrete deliverables and a real budget. Designed by Carlos for your case — not an adapted template." },
      { q: "Can I connect with the community even if I don't pass?", a: "Yes. SF works as a connections hub. If the team sees potential, we connect you with whoever makes sense for you — investor, CTO, partner or client. Even if we don't work together directly." },
    ],
    finalEyebrow: "Ready?",
    finalH2: "If you have a project,", finalH2Accent: "tell us about it.",
    finalBody: "Worst case: you leave with honest feedback and useful connections. Best case: we build something together.",
    finalCta: "Apply now — it's free", finalAlt: "I have a question first",
  },
  th: {
    title: "โปรแกรมการคัดเลือก | Startup Factory",
    description: "บอกเราเกี่ยวกับโปรเจกต์ของคุณ เราฟังทุกคน เรารับน้อยกว่า 10% ถ้าเราเห็น fit เราออกแบบข้อเสนอที่เหมาะสมกับคุณ",
    badge: "Startup Factory · โปรแกรมการคัดเลือก",
    h1: "เราพาโปรเจกต์ของคุณ", h1Accent: "ไปสู่ระดับต่อไป",
    h2sub: "เราเปลี่ยนไอเดียของคุณเป็นโปรเจกต์", h2subAccent: "ที่ลูกค้าต้องการจริงๆ",
    body: "บอกเราเกี่ยวกับของคุณ เราฟังทุกคน เราก้าวหน้ากับผู้ที่มีศักยภาพจริง — และเมื่อเราทำ เราทุ่มสุดตัว",
    subnote: "ถ้าไม่มี fit เราจะบอกคุณอย่างซื่อสัตย์ คุณจะได้สิ่งที่มีคุณค่าไปเสมอ",
    ctaPrimary: "สมัครเลย — ฟรี", ctaSecondary: "ดูวิธีการทำงาน",
    stat1n: "100%", stat1l: "ความมุ่งมั่นเมื่อมี fit",
    stat2n: "30 นาที", stat2l: "เซสชันวินิจฉัย",
    stat3n: "24 ชม.", stat3l: "เราตอบกลับเสมอ",
    whoEyebrow: "ใครเป็นผู้ตัดสินใจ", whoH2: "ไม่ใช่ algorithm แต่ Carlos ตรวจสอบโปรเจกต์ของคุณเป็นการส่วนตัว",
    whoBody1: "ผู้ก่อตั้ง Startup Factory ผู้ประกอบการ digital nomad ที่ดำเนินงานจากประเทศไทย ได้สร้างและขยายโปรเจกต์นวัตกรรมกับบริษัทอย่าง Mahou, Airbus, Siemens Gamesa และ Amadeus",
    whoBody2: "ทุกกรณีผ่านมือของเขา ทุกการตัดสินใจเป็นของเขา นั่นคือเหตุผลที่โปรแกรมมีจำกัด — และนั่นคือเหตุผลที่การอยู่ในนั้นคุ้มค่า",
    logos: [
      { name: "BarLab Ventures · Mahou", detail: "นวัตกรรมแบบเปิด" },
      { name: "Airbus", detail: "Venture building" },
      { name: "Siemens Gamesa", detail: "นวัตกรรมแบบเปิด" },
      { name: "Amadeus", detail: "Startup ecosystem" },
    ],
    testimonial: "Startup Factory ไม่ได้มาในฐานะผู้จัดจำหน่ายทั่วไป — มาในฐานะส่วนหนึ่งของทีม",
    testimonialAuthor: "Natalia Aldea · ผู้อำนวยการฝ่ายการตลาด, Dadybox",
    fitEyebrow: "คุณเหมาะหรือเปล่า?", fitH2: "โปรแกรมนี้เหมาะสำหรับคุณถ้า...",
    applyLabel: "สมัครถ้า", notApplyLabel: "ไม่ต้องสมัครถ้า",
    applyItems: [
      "คุณมีไอเดียที่ชัดเจนและไม่รู้จะก้าวไปกับทีมหรือโครงสร้างไหน",
      "คุณสร้างคนเดียวมานานและต้องการทีมจริงที่ดำเนินงานร่วมกับคุณ",
      "Startup ของคุณมี traction แต่การเติบโตยังไม่แน่นอน",
      "คุณกำลังมองหาการเชื่อมต่อเฉพาะ: CTO, นักลงทุน, หรือหุ้นส่วนเชิงกลยุทธ์",
      "คุณต้องการผสาน AI เข้ากับการดำเนินงานแต่ไม่รู้จะเริ่มจากไหน",
      "คุณพร้อมรับ feedback ตรงๆ แม้จะไม่ใช่สิ่งที่คาดหวัง",
    ],
    notApplyItems: [
      "คุณกำลังมองหาการยืนยันง่ายๆ หรือคนที่จะตอบรับทุกอย่าง",
      "คุณไม่มีเวลาจริงๆ ที่จะมุ่งมั่นกับกระบวนการ",
      "คุณคาดหวังผลลัพธ์โดยไม่ลงแรงที่จำเป็น",
      "คุณตัดสินใจทุกอย่างแล้วและต้องการแค่การปฏิบัติโดยไม่มีเกณฑ์",
    ],
    notApplyNote: "\"ถ้าไม่แน่ใจว่าเหมาะหรือไม่ ลองสมัครดู เราจะบอกตรงๆ — และในกรณีใดก็ตาม เราจะให้สิ่งที่มีคุณค่าแก่คุณ\"",
    processEyebrow: "กระบวนการ", processH2: "วิธีการทำงาน",
    steps: [
      { n: "01", title: "บอกเราเกี่ยวกับโปรเจกต์ของคุณ", desc: "กรอกแบบฟอร์มใน 2 นาที ไม่มีตัวกรองก่อน — เราฟังทุกคน ยิ่งเฉพาะเจาะจงมากเท่าไหร่ เราก็ยิ่งเตรียมเซสชันได้ดีขึ้น", detail: "เรายืนยันการโทรในเวลาน้อยกว่า 24 ชม." },
      { n: "02", title: "เซสชันวินิจฉัย — 30 นาที", desc: "การสนทนาจริงกับทีม ไม่มี pitch deck ไม่มีการนำเสนอ เราวิเคราะห์ไอเดีย ระยะ ศักยภาพ และสิ่งที่คุณต้องการเพื่อก้าวหน้า", detail: "ความซื่อสัตย์ทั้งหมดตั้งแต่นาทีแรก" },
      { n: "03", title: "Carlos ตัดสินใจเป็นการส่วนตัว", desc: "ทุกกรณีผ่านมือของเขา Carlos อ่านรายงานทั้งหมดและตัดสินใจว่ามี fit จริงที่จะทำงานด้วยกันหรือไม่ ไม่มีคณะกรรมการ ไม่มี algorithm", detail: "น้อยกว่า 10% มาถึงขั้นตอนนี้" },
      { n: "04", title: "แผนที่เป็นรูปธรรมหรือ feedback ที่นำไปปฏิบัติได้", desc: "ถ้ามี fit: แผน 30/60/90 วันพร้อมทีมที่แน่นอนและงบประมาณจริง ถ้าไม่: feedback ที่ซื่อสัตย์เกี่ยวกับสิ่งที่ต้องเปลี่ยนและเมื่อใดควรกลับมา ในทั้งสองกรณี คุณออกไปพร้อมสิ่งที่มีคุณค่า", detail: "ไม่อ้อมค้อม ไม่มีตัวพิมพ์เล็ก" },
    ],
    barrierLabel: "อุปสรรคที่ทำให้มันพิเศษ",
    outcomesEyebrow: "สองเส้นทาง", outcomesH2: "ในทั้งสองกรณี คุณได้ประโยชน์",
    fitCard: {
      badge: "ถ้ามี fit",
      title: "การประชุมกับ Carlos + ข้อเสนอที่เหมาะสม",
      items: [
        "แผน 30/60/90 วันที่ออกแบบสำหรับกรณีของคุณ",
        "ทีมที่แน่นอนพร้อม roles ที่คุณต้องการ",
        "งบประมาณที่เป็นรูปธรรมที่ Carlos เตรียม",
        "การเข้าถึง SF connections hub",
        "ทรัพยากร AI เพื่อขยายโปรเจกต์ของคุณ",
      ],
    },
    noFitCard: {
      badge: "ถ้าไม่มี fit (ตอนนี้)",
      title: "Feedback ที่ซื่อสัตย์ + แผนเส้นทางเพื่อกลับมา",
      items: [
        "การวินิจฉัยที่ชัดเจนว่าต้องปรับปรุงอะไรและอย่างไร",
        "ระยะเวลาโดยประมาณเพื่อสมัครอีกครั้ง",
        "การเข้าถึงทรัพยากร AI ฟรี",
        "ความเป็นไปได้ที่จะเชื่อมต่อกับผู้คนใน hub",
        "เราจะยังคงติดต่อ — ไม่มีใครถูกทิ้งไว้คนเดียว",
      ],
    },
    ctaEyebrow: "พร้อมสำหรับขั้นตอนต่อไปหรือ?",
    ctaH2: "สมัครเลย", ctaH2Accent: "ใช้เวลา 2 นาที",
    ctaBody: "บอกเราเกี่ยวกับโปรเจกต์ของคุณ ทีมจะอ่านก่อนโทรศัพท์เพื่อที่คุณจะไม่ต้องเริ่มจากศูนย์",
    ctaApply: "สมัครเลย — ฟรี →", ctaSchedule: "นัดหมายโดยตรง",
    ctaNote: "ฟรี · ไม่มีความผูกมัด · เราตอบกลับใน 24 ชม.",
    faqEyebrow: "FAQ", faqH2: "คำถามที่พบบ่อย",
    faqs: [
      { q: "เซสชันวินิจฉัยมีค่าใช้จ่ายไหม?", a: "ไม่ ฟรีทั้งหมด เราก็ต้องรู้จักคุณก่อนที่จะเสนออะไร ทั้งคุณและเราไม่ต้องการเสียเวลากับสิ่งที่ไม่มีความหมาย" },
      { q: "จะเกิดอะไรขึ้นถ้าไม่ผ่าน?", a: "เราจะบอกอย่างตรงไปตรงมา: ขาดอะไร ต้องปรับปรุงอะไร และควรกลับมาเมื่อใด โปรเจกต์จำนวนมากที่ทำงานกับ SF วันนี้เริ่มต้นด้วย \"ไม่\" คำว่าไม่ไม่ใช่การปิดประตูตลอดกาล" },
      { q: "ทำไมแค่ 10%?", a: "เพราะสิ่งที่เรานำเสนอไม่ใช่ผลิตภัณฑ์แค็ตตาล็อก — แต่คือเวลาจริงของ Carlos และทีมในโปรเจกต์ที่เราเชื่อจริงๆ เราไม่สามารถทำได้สำหรับทุกคนและเราไม่ต้องการพยายาม" },
      { q: "โปรเจกต์แบบไหนที่เหมาะสมที่สุด?", a: "ผู้ประกอบการที่มีไอเดียชัดเจนและความสามารถในการดำเนินงาน, startup ที่กำลังเติบโตพร้อม traction จริง และโปรเจกต์นวัตกรรมที่มีความท้าทายที่เป็นรูปธรรม ภูมิศาสตร์: สเปน, LATAM และเอเชีย ไม่แน่ใจ → สมัครไปก่อน" },
      { q: "ข้อเสนอรวมอะไรบ้างถ้ามี fit?", a: "แผน 30/60/90 วันพร้อมทีมที่แน่นอน deliverables ที่เป็นรูปธรรม และงบประมาณจริง ออกแบบโดย Carlos สำหรับกรณีของคุณ — ไม่ใช่เทมเพลตที่ปรับแต่ง" },
      { q: "ฉันสามารถเชื่อมต่อกับชุมชนได้แม้จะไม่ผ่านหรือ?", a: "ได้ SF ทำงานเป็น hub การเชื่อมต่อ ถ้าทีมเห็นศักยภาพ เราเชื่อมต่อคุณกับใครก็ตามที่เหมาะสม — นักลงทุน, CTO, หุ้นส่วน หรือลูกค้า แม้เราจะไม่ทำงานด้วยกันโดยตรง" },
    ],
    finalEyebrow: "พร้อมหรือยัง?",
    finalH2: "ถ้าคุณมีโปรเจกต์", finalH2Accent: "บอกเราสิ",
    finalBody: "กรณีที่แย่ที่สุด: คุณออกไปพร้อม feedback ที่ซื่อสัตย์และการเชื่อมต่อที่มีประโยชน์ กรณีที่ดีที่สุด: เราสร้างสิ่งต่างๆ ด้วยกัน",
    finalCta: "สมัครเลย — ฟรี", finalAlt: "ฉันมีคำถามก่อน",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const c = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("programa")["content"]?.data, l);
  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: `${site}/${locale}/programa`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/programa`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ProgramaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("programa")["content"]?.data, l);

  return (
    <>
      <PagePixels pixels={loadPagePixels("programa")} />
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-[90vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[800px] h-[600px] rounded-full opacity-35" />
        <div className="orb-magenta absolute top-[20%] right-[8%] w-[400px] h-[400px] rounded-full opacity-30" />
        <div className="absolute top-24 left-[5%] w-40 h-40 rounded-full border border-white/[0.04]" />
        <div className="absolute bottom-20 right-[15%] w-24 h-24 rounded-full border border-white/[0.03]" />

        <div className="relative w-full max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{t.badge}</span>
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(48px,7.5vw,96px)] text-white leading-[0.92] tracking-[-0.03em] mb-6">
            {t.h1}<br />
            <span className="gradient-text">{t.h1Accent}</span>
          </h1>

          <p className="text-2xl md:text-3xl font-[family-name:var(--font-space-grotesk)] font-bold text-white/80 leading-snug max-w-3xl mx-auto mb-8 tracking-[-0.01em]">
            {t.h2sub}<br className="hidden md:block" /> <span className="gradient-text">{t.h2subAccent}</span>
          </p>

          <p className="text-lg text-white/45 leading-relaxed max-w-xl mx-auto mb-4">
            {t.body}
          </p>
          <p className="text-sm text-white/25 mb-14">
            {t.subnote}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="#aplica" className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg">
              {t.ctaPrimary}
            </a>
            <a href="#como-funciona" className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-5 rounded-full hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200">
              {t.ctaSecondary}
            </a>
          </div>

          <div className="grid grid-cols-3 max-w-xl mx-auto mt-16 gap-px rounded-2xl overflow-hidden border border-white/[0.06]">
            {[
              { n: t.stat1n, label: t.stat1l },
              { n: t.stat2n, label: t.stat2l },
              { n: t.stat3n, label: t.stat3l },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.03] backdrop-blur-sm px-4 py-6 text-center">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl md:text-3xl gradient-text">{s.n}</div>
                <div className="text-xs text-white/40 mt-1.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUIÉN ESTÁ DETRÁS ─────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.whoEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white leading-tight tracking-[-0.02em] mb-6">
                {t.whoH2}
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-6">{t.whoBody1}</p>
              <p className="text-white/40 leading-relaxed">{t.whoBody2}</p>
            </div>
            <div className="space-y-3">
              {t.logos.map((l) => (
                <div key={l.name} className="card-dark flex items-center justify-between rounded-xl px-6 py-4">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-sm">{l.name}</span>
                  <span className="text-xs text-[#A855F7] font-semibold">{l.detail}</span>
                </div>
              ))}
              <div className="card-dark rounded-xl px-6 py-4 border-[#A855F7]/20">
                <p className="text-white/80 font-semibold text-sm italic leading-relaxed">
                  &ldquo;{t.testimonial}&rdquo;
                </p>
                <p className="text-xs text-[#A855F7] mt-2 font-semibold">{t.testimonialAuthor}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PARA QUIÉN ES ─────────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-magenta absolute -left-20 top-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-20" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.fitEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em]">
              {t.fitH2}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5">{t.applyLabel}</p>
              <div className="space-y-3">
                {t.applyItems.map((item) => (
                  <div key={item} className="card-dark flex items-start gap-3 rounded-xl px-5 py-4">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/75 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.15em] mb-5">{t.notApplyLabel}</p>
              <div className="space-y-3">
                {t.notApplyItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl px-5 py-4 border border-white/[0.05]">
                    <span className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 3l4 4M7 3l-4 4" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/30 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-white/50 text-sm leading-relaxed italic">
                  {t.notApplyNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute right-1/4 bottom-0 w-[400px] h-[300px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.processEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em]">
              {t.processH2}
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-[28px] top-8 bottom-8 w-px bg-gradient-to-b from-[#3D2FFF]/50 via-[#A855F7]/30 to-transparent hidden md:block" />
            <div className="space-y-6">
              {t.steps.map((s, i) => (
                <div key={s.n} className={`card-dark rounded-2xl p-8 md:ml-16 relative ${i === 2 ? "border-[#A855F7]/20" : ""}`}>
                  <div className="absolute -left-16 top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] items-center justify-center">
                    <span className="font-[family-name:var(--font-space-grotesk)] font-black text-sm text-white">{s.n}</span>
                  </div>
                  <div className="md:hidden font-[family-name:var(--font-space-grotesk)] font-black text-4xl gradient-text opacity-30 leading-none mb-4">{s.n}</div>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12">
                    <div className="flex-1">
                      <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-2">{s.title}</h3>
                      <p className="text-white/50 leading-relaxed">{s.desc}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-semibold text-[#A855F7] bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 px-3 py-1.5 rounded-full">
                        {s.detail}
                      </span>
                    </div>
                  </div>
                  {i === 2 && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                      <span className="text-xs text-[#A855F7] font-semibold">{t.barrierLabel}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LO QUE PASA EN AMBOS CASOS ───────────────────────────────────── */}
      <section className="relative bg-black py-24 overflow-hidden">
        <div className="orb-magenta absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.outcomesEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,44px)] text-white tracking-[-0.02em]">
              {t.outcomesH2}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl p-10 bg-gradient-to-br from-[#3D2FFF]/15 to-[#A855F7]/5 border border-[#3D2FFF]/25">
              <div className="inline-flex items-center gap-2 bg-[#3D2FFF]/20 border border-[#3D2FFF]/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-wider">{t.fitCard.badge}</span>
              </div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl text-white mb-4">{t.fitCard.title}</h3>
              <ul className="space-y-3">
                {t.fitCard.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                    <span className="w-4 h-4 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l1.8 1.8L6.5 2" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-dark rounded-3xl p-10">
              <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{t.noFitCard.badge}</span>
              </div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl text-white mb-4">{t.noFitCard.title}</h3>
              <ul className="space-y-3">
                {t.noFitCard.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/50">
                    <span className="w-4 h-4 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l1.8 1.8L6.5 2" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA APLICAR ───────────────────────────────────────────────────── */}
      <section id="aplica" className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] opacity-30" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-15" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{t.ctaEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5vw,60px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {t.ctaH2}<br />
            <span className="gradient-text">{t.ctaH2Accent}</span>
          </h2>
          <p className="text-white/45 text-lg mb-10 max-w-lg mx-auto leading-relaxed">{t.ctaBody}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg">
              {t.ctaApply}
            </Link>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
              className="border border-white/15 text-white/70 font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-5 rounded-full hover:bg-white/[0.05] hover:text-white transition-all duration-200">
              {t.ctaSchedule}
            </a>
          </div>
          <p className="text-xs text-white/25 mt-6">{t.ctaNote}</p>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute right-0 top-1/3 w-[300px] h-[300px] opacity-15" />
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.faqEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,44px)] text-white tracking-[-0.02em]">
              {t.faqH2}
            </h2>
          </div>
          <div>
            {t.faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/[0.06] py-7">
                <div className="flex items-start gap-4">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black gradient-text text-lg leading-none mt-1 min-w-[2rem] opacity-40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-2">{faq.q}</h3>
                    <p className="text-white/45 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-8 block">{t.finalEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5vw,64px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {t.finalH2}<br />
            <span className="gradient-text">{t.finalH2Accent}</span>
          </h2>
          <p className="text-white/40 text-lg mb-12 max-w-lg mx-auto leading-relaxed">{t.finalBody}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#aplica" className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg">
              {t.finalCta}
            </a>
            <Link href={`/${locale}/contacto`}
              className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-5 rounded-full hover:bg-white/[0.05] hover:border-white/25 transition-all duration-200">
              {t.finalAlt}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
