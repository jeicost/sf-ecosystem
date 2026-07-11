import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms, cmsVal } from "@/lib/cms-pages";

const site = "https://www.startupsfactory.es";

// ─── Page-level content dict (sections not covered by global dictionaries) ────
const pc: Record<Locale, {
  commitment: { eyebrow: string; l1: string; l2: string; l3: string };
  forWhomSub: string;
  bullets: { emp: string[]; startup: string[]; corp: string[] };
  how: {
    eyebrow: string; h2: string; sub: string;
    empTrack: string; startupTrack: string;
    s01: { title: string; desc: string; badge: string };
    s02: { title: string; desc: string; badge: string };
    s03: { title: string; desc: string; fit: string; free: string; accept: string; proposal: string };
    noFit: { indicator: string; title: string; desc: string; note: string };
    ss: Array<{ title: string; desc: string; badge: string; tag: string }>;
  };
  teamSec: { eyebrow: string; h2: string; cta: string };
  manifesto: { eyebrow: string; h2a: string; h2b: string; desc: string; cta: string; items: Array<{ title: string; desc: string }> };
  testimonial: { label: string; tag: string; cta: string; quote: string; role: string; stats: Array<{ n: string; label: string }> };
  clients: { eyebrow: string; h2a: string; h2b: string; cta: string; descs: Record<string, string> };
  eco: { eyebrow: string; h2a: string; h2b: string; ventures: string; partners: string; inDev: string; descs: Record<string, string>; locs: Record<string, string> };
  vc: { vtag: string; vh2: string; vdesc: string; vcta: string; ctag: string; ch2: string; cdesc: string; ccta: string };
  retos: { eyebrow: string; h2: string; sub: string; items: Array<{ quote: string; who: string }> };
}> = {
  es: {
    commitment: { eyebrow: "Nuestro compromiso", l1: "Sin agencias.", l2: "Sin consultoras.", l3: "Con entregables reales." },
    forWhomSub: "Elige tu itinerario. Cada perfil tiene su propio proceso y squad.",
    bullets: {
      emp:     ["Validación de idea rápida", "MVP con growth desde el sprint 1", "Equipo mínimo para avanzar ya"],
      startup: ["Plan 30/60/90 orientado a métricas", "Squad de growth, marketing e IA", "Fundraising y partnerships reales"],
      corp:    ["De reto corporativo a piloto real", "Innovación abierta con startups", "Escalado con velocidad de startup"],
    },
    how: {
      eyebrow: "Proceso", h2: "Cómo funciona", sub: "Dos itinerarios. Un mismo principio: siempre saldrás con algo valioso.",
      empTrack: "Itinerario para", startupTrack: "Itinerario para",
      s01: { title: "Preséntanos tu proyecto", desc: "Formulario en 2 min. Sin filtros previos — escuchamos a todos. Cuanto más concreto, mejor preparamos la sesión.", badge: "Organiza tus ideas" },
      s02: { title: "Sesión de diagnóstico · 30 min", desc: "Una conversación real con metodología propia. Analizamos idea, fase y potencial. No es un pitch — es un diagnóstico honesto.", badge: "Te asesoramos" },
      s03: { title: "Sesión 1:1 con Carlos", desc: "Tu proyecto se evalúa directamente con Carlos. Sin intermediarios, con criterio real. Respuesta en 48h, clara y directa.", fit: "Si hay fit", free: "Siempre gratuita", accept: "Menos del 10% son aceptados", proposal: "Definimos una propuesta concreta: squad, timeline y pricing. Si existe alineación estratégica, también podemos co-construir." },
      noFit: { indicator: "Si no hay fit ahora", title: "Feedback honesto + accionables", desc: "Qué mejorar, en qué plazos y cómo volver. Muchos proyectos que trabajan con SF hoy empezaron con un NO.", note: "Potencialmente, te conectamos con fundadores, proyectos y oportunidades de la red SF. Saldrás con activables concretos para avanzar — en esa primera sesión, no en la de Carlos." },
      ss: [
        { title: "Diagnóstico y plan 30/60/90", desc: "Analizamos tu situación real: modelo, fase, recursos y mercado. Salimos con un roadmap accionable y el squad exacto que necesitas.", badge: "Roadmap accionable", tag: "Semana 1" },
        { title: "Montamos tu squad", desc: "Roles exactos con dedicación óptima. Sin perfiles de relleno. Configuramos rituales de trabajo desde el primer sprint.", badge: "Squad a medida", tag: "Semanas 1–2" },
        { title: "Ejecutamos, medimos y escalamos", desc: "Sprints con entregables, reporting semanal, decisiones rápidas. Ajustamos el squad según resultados reales.", badge: "Métricas reales", tag: "Sprint a sprint" },
      ],
    },
    teamSec: { eyebrow: "El equipo", h2: "El equipo SF", cta: "Ver equipo completo" },
    manifesto: {
      eyebrow: "Nuestra filosofía", h2a: "Cómo", h2b: "trabajamos",
      desc: "No somos una consultora que entrega documentos. Somos tu equipo — montamos el squad, ejecutamos en sprints y te acompañamos hasta el resultado.",
      cta: "Aplica ahora",
      items: [
        { title: "Tu equipo, tu propiedad", desc: "Todo lo que construimos es tuyo. Código, diseño, estrategia, datos — sin lock-in ni dependencias." },
        { title: "Ejecución sobre recomendación", desc: "No damos consejos desde fuera. Nos ponemos dentro y hacemos el trabajo. Entregables reales cada sprint." },
        { title: "El squad exacto que necesitas", desc: "Solo los roles que requiere tu fase. Ni más ni menos. Modular, flexible, sin estructura fija." },
        { title: "Reporting honesto cada semana", desc: "Métricas, decisiones y bloqueos documentados. Sin sorpresas. Sin filtros. Lo bueno y lo malo." },
        { title: "Modelo que se adapta a ti", desc: "Fee por servicio, retainer mensual o cash + equity si hay fit de venture. Lo que mejor encaje." },
      ],
    },
    testimonial: {
      label: "Caso real · Dadybox", tag: "Caso real", cta: "Ver caso completo",
      quote: "Startup Factory no llegó como un proveedor — llegó como parte del equipo. Lanzamos juntos una línea de negocio completamente nueva desde cero, y además automatizaron toda la operativa y procesos de la empresa. En meses pasamos de la idea a resultados reales. La diferencia es que se mojan, entregan y se responsabilizan.",
      role: "Directora de Marketing",
      stats: [{ n: '1', label: 'Línea de negocio lanzada' }, { n: '100%', label: 'Procesos automatizados' }, { n: '0→1', label: 'Idea a ejecución' }],
    },
    clients: {
      eyebrow: "Track record", h2a: "Marcas que ya han", h2b: "confiado en nosotros", cta: "Ver todos los casos",
      descs: {
        "Playtomic": "Diseño e implementación de un sistema de Business Intelligence para centralizar datos operativos y acelerar la toma de decisiones.",
        "BarLab Ventures": "Gestión integral de proyectos de innovación corporativa: selección, validación y ejecución de pilotos con startups.",
        "Turismo de Ronda": "Implementación y gestión de plataforma turística digital con foco en experiencia de usuario y operativa de destino.",
        "Souji": "Estrategia de open innovation y expansión internacional con identificación de mercados y desarrollo de alianzas clave.",
        "Woonivers": "Desarrollo de negocio y arquitectura de Business Intelligence para fortalecer el modelo de monetización y los canales de crecimiento.",
        "StepOne Ventures": "Lanzamiento de nuevas líneas de negocio desde cero: validación de hipótesis, go-to-market y desarrollo comercial.",
        "The Padel Society": "Growth partner estratégico: definición de canales de adquisición y optimización del funnel de ventas.",
        "Albasanz Express": "Automatización de procesos e implementación de sistemas de IA aplicada para optimizar operaciones y reducir fricción operativa.",
      },
    },
    eco: {
      eyebrow: "Ecosistema", h2a: "Ventures propios", h2b: "y alianzas reales",
      ventures: "Ventures · Equity propio", partners: "Partners estratégicos", inDev: "En desarrollo",
      descs: {
        "Discoolver": "Plataforma de gestión de destinos turísticos. Tecnología para ciudades y territorios.",
        "Dadybox": "Solución de logística ecommerce para pymes españolas. 300+ clientes, 400K envíos/año.",
        "Salsa Burgers": "Restaurante de burgers de wagyu con identidad única. Primer cliente del Brand Brain.",
      },
      locs: { "España · Bangkok": "España · Bangkok", "España": "España", "Bangkok": "Bangkok" },
    },
    vc: {
      vtag: "Venture", vh2: "Cash + Equity. Cuando hay fit.",
      vdesc: "Para proyectos con alto potencial: aportamos equipo y ejecución a cambio de participación. Sin inversión financiera — inversión en talento.",
      vcta: "Ver modelo Venture",
      ctag: "Casos de éxito", ch2: "Proyectos reales. Resultados medibles.",
      cdesc: "Reto → qué hicimos → entregables → impacto. Así documentamos cada proyecto para que sepas exactamente qué puedes esperar.",
      ccta: "Ver casos de éxito",
    },
    retos: {
      eyebrow: "¿Te suena esto?", h2: "Retos que resolvemos", sub: "Si alguna de estas frases resuena contigo, podemos ayudarte.",
      items: [
        { quote: '"Tengo la idea pero no el equipo para ejecutarla"', who: "Emprendedor" },
        { quote: '"Necesito crecer pero no puedo hacer contrataciones fijas"', who: "Startup" },
        { quote: '"Tenemos iniciativas pero no capacidad interna de ejecución"', who: "Corporate" },
        { quote: '"Busco un CTO/CMO pero no quiero uno a tiempo completo todavía"', who: "Fundador" },
        { quote: '"Quiero un partner que se moje, no que solo recomiende"', who: "Proyecto con tracción" },
        { quote: '"Necesito un equipo que pueda escalar o reducirse según el proyecto"', who: "Cualquier fase" },
      ],
    },
  },
  en: {
    commitment: { eyebrow: "Our commitment", l1: "No agencies.", l2: "No consultancies.", l3: "Real deliverables." },
    forWhomSub: "Choose your path. Each profile has its own process and squad.",
    bullets: {
      emp:     ["Quick idea validation", "MVP with growth from sprint 1", "Minimum team to move now"],
      startup: ["Metrics-oriented 30/60/90 plan", "Growth, marketing and AI squad", "Real fundraising and partnerships"],
      corp:    ["From corporate challenge to real pilot", "Open innovation with startups", "Scaling at startup speed"],
    },
    how: {
      eyebrow: "Process", h2: "How it works", sub: "Two paths. One principle: you'll always leave with something valuable.",
      empTrack: "Path for", startupTrack: "Path for",
      s01: { title: "Tell us about your project", desc: "2-min form. No prior filters — we listen to everyone. The more specific, the better we prepare the session.", badge: "Organise your ideas" },
      s02: { title: "Diagnosis session · 30 min", desc: "A real conversation with our own methodology. We analyse idea, stage and potential. Not a pitch — an honest diagnosis.", badge: "We advise you" },
      s03: { title: "1:1 session with Carlos", desc: "Your project is evaluated directly with Carlos. No intermediaries, real criteria. Answer in 48h, clear and direct.", fit: "If there's a fit", free: "Always free", accept: "Less than 10% accepted", proposal: "We define a concrete proposal: squad, timeline and pricing. If there is strategic alignment, we can also co-build." },
      noFit: { indicator: "If there's no fit now", title: "Honest feedback + action items", desc: "What to improve, in what timeframes and how to return. Many projects working with SF today started with a NO.", note: "Potentially, we connect you with founders, projects and opportunities in the SF network. You'll leave with concrete actions from that first session." },
      ss: [
        { title: "Diagnosis and 30/60/90 plan", desc: "We analyse your real situation: model, stage, resources and market. We leave with an actionable roadmap and the exact squad you need.", badge: "Actionable roadmap", tag: "Week 1" },
        { title: "We build your squad", desc: "Exact roles with optimal dedication. No filler profiles. We set up working rituals from the first sprint.", badge: "Custom squad", tag: "Weeks 1–2" },
        { title: "We execute, measure and scale", desc: "Sprints with deliverables, weekly reporting, fast decisions. We adjust the squad based on real results.", badge: "Real metrics", tag: "Sprint by sprint" },
      ],
    },
    teamSec: { eyebrow: "The team", h2: "The SF team", cta: "See full team" },
    manifesto: {
      eyebrow: "Our philosophy", h2a: "How we", h2b: "work",
      desc: "We're not a consultancy that delivers documents. We are your team — we build the squad, execute in sprints and accompany you to the result.",
      cta: "Apply now",
      items: [
        { title: "Your team, your property", desc: "Everything we build is yours. Code, design, strategy, data — no lock-in or dependencies." },
        { title: "Execution over recommendation", desc: "We don't advise from the outside. We get inside and do the work. Real deliverables every sprint." },
        { title: "The exact squad you need", desc: "Only the roles your stage requires. Neither more nor less. Modular, flexible, no fixed structure." },
        { title: "Honest weekly reporting", desc: "Metrics, decisions and blockers documented. No surprises. No filters. The good and the bad." },
        { title: "A model that adapts to you", desc: "Service fee, monthly retainer or cash + equity if there is venture fit. Whatever works best." },
      ],
    },
    testimonial: {
      label: "Real case · Dadybox", tag: "Real case", cta: "See full case",
      quote: "Startup Factory didn't arrive as a vendor — it arrived as part of the team. We launched a completely new line of business together from scratch, and they also automated all the company's operations and processes. In months we went from idea to real results. The difference is they get involved, deliver and take responsibility.",
      role: "Marketing Director",
      stats: [{ n: '1', label: 'Business line launched' }, { n: '100%', label: 'Processes automated' }, { n: '0→1', label: 'Idea to execution' }],
    },
    clients: {
      eyebrow: "Track record", h2a: "Brands that have already", h2b: "trusted us", cta: "See all cases",
      descs: {
        "Playtomic": "Design and implementation of a Business Intelligence system to centralise operational data and accelerate decision-making.",
        "BarLab Ventures": "Comprehensive management of corporate innovation projects: selection, validation and execution of pilots with startups.",
        "Turismo de Ronda": "Implementation and management of digital tourism platform focused on user experience and destination operations.",
        "Souji": "Open innovation and international expansion strategy with market identification and development of key alliances.",
        "Woonivers": "B2B business development and Business Intelligence architecture to strengthen the monetisation model and growth channels.",
        "StepOne Ventures": "Launch of new business lines from scratch: hypothesis validation, go-to-market and commercial development.",
        "The Padel Society": "Strategic growth partner: defining acquisition channels and optimising the sales funnel.",
        "Albasanz Express": "Process automation and AI systems implementation to optimise operations and reduce operational friction.",
      },
    },
    eco: {
      eyebrow: "Ecosystem", h2a: "Own ventures", h2b: "and real alliances",
      ventures: "Ventures · Own equity", partners: "Strategic partners", inDev: "In development",
      descs: {
        "Discoolver": "Tourism destination management platform. Technology for cities and territories.",
        "Dadybox": "E-commerce logistics solution for Spanish SMEs. 300+ clients, 400K shipments/year.",
        "Salsa Burgers": "Wagyu burger restaurant with a unique identity. First Brand Brain client.",
      },
      locs: { "España · Bangkok": "Spain · Bangkok", "España": "Spain", "Bangkok": "Bangkok" },
    },
    vc: {
      vtag: "Venture", vh2: "Cash + Equity. When there's fit.",
      vdesc: "For high-potential projects: we contribute team and execution in exchange for equity. No financial investment — talent investment.",
      vcta: "See Venture model",
      ctag: "Success cases", ch2: "Real projects. Measurable results.",
      cdesc: "Challenge → what we did → deliverables → impact. That's how we document each project so you know exactly what to expect.",
      ccta: "See success cases",
    },
    retos: {
      eyebrow: "Does this sound familiar?", h2: "Challenges we solve", sub: "If any of these phrases resonate with you, we can help.",
      items: [
        { quote: '"I have the idea but not the team to execute it"', who: "Entrepreneur" },
        { quote: '"I need to grow but can\'t make fixed hires"', who: "Startup" },
        { quote: '"We have initiatives but no internal execution capacity"', who: "Corporate" },
        { quote: '"I\'m looking for a CTO/CMO but don\'t want a full-time one yet"', who: "Founder" },
        { quote: '"I want a partner who gets involved, not one who just recommends"', who: "Traction project" },
        { quote: '"I need a team that can scale up or down depending on the project"', who: "Any stage" },
      ],
    },
  },
  th: {
    commitment: { eyebrow: "ความมุ่งมั่นของเรา", l1: "ไม่ใช้เอเจนซี่.", l2: "ไม่ใช้ที่ปรึกษา.", l3: "ผลงานที่จับต้องได้จริง." },
    forWhomSub: "เลือกเส้นทางของคุณ แต่ละโปรไฟล์มีกระบวนการและทีมของตัวเอง",
    bullets: {
      emp:     ["ตรวจสอบไอเดียอย่างรวดเร็ว", "MVP พร้อม growth ตั้งแต่ sprint แรก", "ทีมขั้นต่ำเพื่อก้าวหน้าทันที"],
      startup: ["แผน 30/60/90 วันที่เน้นตัวชี้วัด", "ทีม growth, marketing และ AI", "fundraising และ partnerships จริง"],
      corp:    ["จากความท้าทายขององค์กรสู่ pilot จริง", "นวัตกรรมแบบเปิดร่วมกับ startups", "ขยายด้วยความเร็วของ startup"],
    },
    how: {
      eyebrow: "กระบวนการ", h2: "วิธีการทำงาน", sub: "สองเส้นทาง หลักการเดียว: คุณจะได้บางสิ่งที่มีคุณค่าเสมอ",
      empTrack: "เส้นทางสำหรับ", startupTrack: "เส้นทางสำหรับ",
      s01: { title: "บอกเราเกี่ยวกับโปรเจกต์ของคุณ", desc: "แบบฟอร์ม 2 นาที ไม่มีการกรองล่วงหน้า — เราฟังทุกคน ยิ่งเฉพาะเจาะจงมากเท่าไหร่ เราก็เตรียมตัวได้ดีขึ้นเท่านั้น", badge: "จัดระเบียบความคิด" },
      s02: { title: "เซสชันวินิจฉัย · 30 นาที", desc: "การสนทนาจริงด้วยวิธีการของเราเอง เราวิเคราะห์ไอเดีย ระยะ และศักยภาพ ไม่ใช่การพิตช์ — แต่เป็นการวินิจฉัยที่ซื่อสัตย์", badge: "เราให้คำปรึกษา" },
      s03: { title: "เซสชัน 1:1 กับ Carlos", desc: "โปรเจกต์ของคุณจะได้รับการประเมินโดยตรงกับ Carlos ไม่มีตัวกลาง เกณฑ์จริง ตอบภายใน 48 ชั่วโมง ชัดเจนและตรงประเด็น", fit: "ถ้ามี fit", free: "ฟรีเสมอ", accept: "น้อยกว่า 10% ได้รับการยอมรับ", proposal: "เราจะกำหนดข้อเสนอที่ชัดเจน: squad, timeline และราคา หากมีการจัดวางเชิงกลยุทธ์ เราสามารถร่วมสร้างได้เช่นกัน" },
      noFit: { indicator: "ถ้าไม่มี fit ตอนนี้", title: "Feedback ที่ซื่อสัตย์ + สิ่งที่ต้องทำ", desc: "สิ่งที่ต้องปรับปรุง ระยะเวลาเท่าไหร่ และวิธีการกลับมา หลายโปรเจกต์ที่ทำงานกับ SF ในวันนี้เริ่มต้นด้วยคำว่า NO", note: "เราอาจเชื่อมต่อคุณกับ founders โปรเจกต์ และโอกาสในเครือข่าย SF คุณจะออกไปพร้อมสิ่งที่ต้องทำจากเซสชันแรก" },
      ss: [
        { title: "วินิจฉัยและแผน 30/60/90 วัน", desc: "เราวิเคราะห์สถานการณ์จริงของคุณ: โมเดล ระยะ ทรัพยากร และตลาด เราออกไปพร้อม roadmap ที่ปฏิบัติได้และ squad ที่แน่นอนที่คุณต้องการ", badge: "Roadmap ที่ปฏิบัติได้", tag: "สัปดาห์ที่ 1" },
        { title: "เราสร้าง squad ของคุณ", desc: "บทบาทที่แน่นอนพร้อมการทุ่มเทที่เหมาะสม ไม่มีโปรไฟล์ที่ไม่จำเป็น เราตั้งค่าพิธีกรรมการทำงานตั้งแต่ sprint แรก", badge: "Squad ที่ปรับแต่งได้", tag: "สัปดาห์ที่ 1–2" },
        { title: "เราดำเนินการ วัดผล และขยาย", desc: "Sprints พร้อมผลงาน รายงานรายสัปดาห์ การตัดสินใจรวดเร็ว เราปรับ squad ตามผลลัพธ์จริง", badge: "ตัวชี้วัดจริง", tag: "Sprint ต่อ Sprint" },
      ],
    },
    teamSec: { eyebrow: "ทีมงาน", h2: "ทีม SF", cta: "ดูทีมทั้งหมด" },
    manifesto: {
      eyebrow: "ปรัชญาของเรา", h2a: "วิธีที่เรา", h2b: "ทำงาน",
      desc: "เราไม่ใช่ที่ปรึกษาที่ส่งมอบเอกสาร เราคือทีมของคุณ — เราสร้าง squad ดำเนินการใน sprints และร่วมเดินทางกับคุณสู่ผลลัพธ์",
      cta: "สมัครตอนนี้",
      items: [
        { title: "ทีมของคุณ ทรัพย์สินของคุณ", desc: "ทุกอย่างที่เราสร้างเป็นของคุณ โค้ด ดีไซน์ กลยุทธ์ ข้อมูล — ไม่มี lock-in หรือการพึ่งพา" },
        { title: "การดำเนินงานเหนือคำแนะนำ", desc: "เราไม่ให้คำแนะนำจากภายนอก เราเข้าไปข้างในและทำงาน ผลงานจริงทุก sprint" },
        { title: "Squad ที่แน่นอนที่คุณต้องการ", desc: "เฉพาะบทบาทที่ระยะของคุณต้องการ ไม่มากไม่น้อย Modular ยืดหยุ่น ไม่มีโครงสร้างตายตัว" },
        { title: "รายงานที่ซื่อสัตย์ทุกสัปดาห์", desc: "ตัวชี้วัด การตัดสินใจ และอุปสรรคที่บันทึกไว้ ไม่มีเซอร์ไพรส์ ไม่มีตัวกรอง ทั้งดีและไม่ดี" },
        { title: "โมเดลที่ปรับตัวตามคุณ", desc: "ค่าบริการ retainer รายเดือน หรือ cash + equity หากมี venture fit อะไรก็ตามที่เหมาะสมที่สุด" },
      ],
    },
    testimonial: {
      label: "กรณีจริง · Dadybox", tag: "กรณีจริง", cta: "ดูกรณีเต็ม",
      quote: "Startup Factory ไม่ได้มาในฐานะผู้ขาย — แต่มาในฐานะส่วนหนึ่งของทีม เราเปิดตัวสายธุรกิจใหม่ร่วมกันตั้งแต่ต้น และยังทำให้การดำเนินงานทั้งหมดของบริษัทเป็นอัตโนมัติ ในไม่กี่เดือนเราก้าวจากไอเดียสู่ผลลัพธ์จริง ความแตกต่างคือพวกเขาเข้าร่วม ส่งมอบ และรับผิดชอบ",
      role: "ผู้อำนวยการฝ่ายการตลาด",
      stats: [{ n: '1', label: 'สายธุรกิจที่เปิดตัว' }, { n: '100%', label: 'กระบวนการที่ทำให้เป็นอัตโนมัติ' }, { n: '0→1', label: 'ไอเดียสู่การดำเนินงาน' }],
    },
    clients: {
      eyebrow: "ผลงานที่ผ่านมา", h2a: "แบรนด์ที่ไว้วางใจ", h2b: "เราแล้ว", cta: "ดูทุกกรณี",
      descs: {
        "Playtomic": "Design and implementation of a Business Intelligence system to centralise operational data and accelerate decision-making.",
        "BarLab Ventures": "Comprehensive management of corporate innovation projects: selection, validation and execution of pilots with startups.",
        "Turismo de Ronda": "Implementation and management of digital tourism platform focused on user experience and destination operations.",
        "Souji": "Open innovation and international expansion strategy with market identification and development of key alliances.",
        "Woonivers": "B2B business development and Business Intelligence architecture to strengthen the monetisation model and growth channels.",
        "StepOne Ventures": "Launch of new business lines from scratch: hypothesis validation, go-to-market and commercial development.",
        "The Padel Society": "Strategic growth partner: defining acquisition channels and optimising the sales funnel.",
        "Albasanz Express": "Process automation and AI systems implementation to optimise operations and reduce operational friction.",
      },
    },
    eco: {
      eyebrow: "ระบบนิเวศ", h2a: "Ventures ของเราเอง", h2b: "และพันธมิตรจริง",
      ventures: "Ventures · Equity ของเราเอง", partners: "พันธมิตรเชิงกลยุทธ์", inDev: "กำลังพัฒนา",
      descs: {
        "Discoolver": "Tourism destination management platform. Technology for cities and territories.",
        "Dadybox": "E-commerce logistics solution for Spanish SMEs. 300+ clients, 400K shipments/year.",
        "Salsa Burgers": "Wagyu burger restaurant with a unique identity. First Brand Brain client.",
      },
      locs: { "España · Bangkok": "Spain · Bangkok", "España": "Spain", "Bangkok": "Bangkok" },
    },
    vc: {
      vtag: "Venture", vh2: "Cash + Equity. เมื่อมี fit.",
      vdesc: "สำหรับโปรเจกต์ที่มีศักยภาพสูง: เราสนับสนุนทีมและการดำเนินงานแลกกับ equity ไม่ใช่การลงทุนทางการเงิน — แต่เป็นการลงทุนในความสามารถ",
      vcta: "ดูโมเดล Venture",
      ctag: "กรณีความสำเร็จ", ch2: "โปรเจกต์จริง. ผลลัพธ์วัดได้.",
      cdesc: "ความท้าทาย → สิ่งที่เราทำ → ผลงาน → ผลกระทบ นั่นคือวิธีที่เราบันทึกแต่ละโปรเจกต์",
      ccta: "ดูกรณีความสำเร็จ",
    },
    retos: {
      eyebrow: "นี่คุ้นไหม?", h2: "ความท้าทายที่เราแก้ได้", sub: "ถ้าประโยคใดใดนี้โดนใจคุณ เราช่วยได้",
      items: [
        { quote: '"มีไอเดียแต่ไม่มีทีมในการดำเนินงาน"', who: "ผู้ประกอบการ" },
        { quote: '"ต้องการเติบโตแต่ไม่สามารถจ้างพนักงานประจำได้"', who: "Startup" },
        { quote: '"มีโครงการริเริ่มแต่ขาดความสามารถในการดำเนินงานภายใน"', who: "Corporate" },
        { quote: '"กำลังหา CTO/CMO แต่ยังไม่ต้องการแบบเต็มเวลา"', who: "ผู้ก่อตั้ง" },
        { quote: '"ต้องการพาร์ทเนอร์ที่ลงมือทำ ไม่ใช่แค่แนะนำ"', who: "โปรเจกต์ที่มีแรงฉุด" },
        { quote: '"ต้องการทีมที่สามารถขยายหรือลดขนาดตามโปรเจกต์"', who: "ทุกระยะ" },
      ],
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const cmsSections = loadCmsSections('home')
  const seoData = cmsSections['seo']?.data
  const title       = (seoData ? cmsVal(seoData, 'seo_title', locale) as string : '') || dict.home.metadata.title
  const description = (seoData ? cmsVal(seoData, 'seo_description', locale) as string : '') || dict.home.metadata.description

  return {
    title,
    description,
    alternates: {
      canonical: `${site}/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}`])),
    },
    openGraph: {
      title,
      description,
      url: `${site}/${locale}`,
      locale: locale === "es" ? "es_ES" : locale === "en" ? "en_US" : "th_TH",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Startup Factory" }],
    },
    twitter: { card: "summary_large_image" as const, title, description, images: ["/og-image.jpg"] },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const dict = await getDictionary(l);
  const rawT = dict.home;

  // Merge CMS overrides — CMS content wins over dictionary when present
  const cms = loadCmsSections('home')
  const t = {
    ...rawT,
    hero:       mergeCms(rawT.hero,       cms['hero']?.data,         l),
    stats:      (cms['stats']?.data?.[`items_${l}`] ?? cms['stats']?.data?.['items_en'] ?? rawT.stats) as typeof rawT.stats,
    whatWeDo:   mergeCms(rawT.whatWeDo,   cms['what-we-do']?.data,   l),
    howItWorks: mergeCms(rawT.howItWorks, cms['how-it-works']?.data, l),
    team:       mergeCms(rawT.team,       cms['team-modules']?.data, l),
    forWhom:    mergeCms(rawT.forWhom,    cms['for-whom']?.data,     l),
    faq:        mergeCms(rawT.faq,        cms['faq']?.data,          l),
    finalCta:   mergeCms(rawT.finalCta,   cms['final-cta']?.data,    l),
  }
  const p = pc[l];

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-[100dvh] flex items-center">
        {/* Orbs posicionados al lado izquierdo para el split */}
        <div className="orb-purple absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-80" />
        <div className="orb-magenta absolute top-[10%] right-[15%] w-[350px] h-[350px] rounded-full opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

        <div className="relative w-full max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-[1fr_400px] gap-12 md:gap-16 items-center">

            {/* ── LEFT — Copy ── */}
            <div className="text-center md:text-left">

              {/* LIVE badge — mobile */}
              <div className="flex justify-center md:hidden mb-8">
                <span className="inline-flex items-center gap-2.5 border border-emerald-500/20 rounded-full px-4 py-2 bg-emerald-500/[0.05]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-xs font-semibold text-emerald-400/80 uppercase tracking-[0.12em]">
                    Evaluando proyectos
                  </span>
                </span>
              </div>

              {/* Eyebrow — desktop */}
              <div className="hidden md:flex mb-8">
                <span className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">
                    {t.hero.eyebrow}
                  </span>
                </span>
              </div>

              {/* H1 */}
              <h1 className="font-[family-name:var(--font-space-grotesk)] font-black leading-[0.93] tracking-[-0.03em] mb-8">
                <span className="block text-[clamp(44px,6.5vw,92px)] text-white">
                  {t.hero.h1Line1}
                </span>
                <span className="block text-[clamp(44px,6.5vw,92px)] text-white">
                  {t.hero.h1Line2}
                </span>
                <span className="block text-[clamp(36px,5vw,76px)] gradient-text mt-2">
                  {t.hero.h1Accent}
                </span>
              </h1>

              {/* Stats separador — mobile */}
              <div className="md:hidden flex items-center justify-center gap-2 mb-8 text-sm">
                <span className="flex-1 h-px bg-white/[0.08]" />
                {t.stats.map((s, i) => (
                  <span key={s.n} className="contents">
                    <span className="font-[family-name:var(--font-space-grotesk)] font-black text-white/80">{s.n}</span>
                    {i < t.stats.length - 1 && <span className="text-white/20">·</span>}
                  </span>
                ))}
                <span className="flex-1 h-px bg-white/[0.08]" />
              </div>

              {/* CTA + stats inline — desktop */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-6">
                <Link
                  href={`/${locale}/aplica`}
                  className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full text-base w-full md:w-auto text-center"
                >
                  {t.hero.ctaPrimary}
                </Link>
                <div className="hidden md:flex items-center gap-4 self-center">
                  <span className="w-px h-8 bg-white/[0.08]" />
                  {t.stats.slice(1).map((s) => (
                    <div key={s.n}>
                      <p className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl gradient-text leading-none">{s.n}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Microcopy */}
              <p className="text-sm text-white/30">
                {t.hero.microcopy}
              </p>
            </div>

            {/* ── RIGHT — Team cards (desktop) ── */}
            <div className="hidden md:flex flex-col gap-3">

              {/* LIVE badge desktop */}
              <div className="flex justify-end mb-2">
                <span className="inline-flex items-center gap-2 border border-emerald-500/20 rounded-full px-3 py-1.5 bg-emerald-500/[0.05]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-[0.12em]">
                    Evaluando proyectos
                  </span>
                </span>
              </div>

              {[
                { name: "Carlos Jacoste", role: "Co-founder & CEO", img: "/team/carlos.jpg" },
                { name: "Diego Docavo", role: "Business Development", img: "/team/diego.jpg" },
                { name: "Nacho Sánchez", role: "Marketing Manager", img: "/team/nacho.jpg" },
              ].map((member) => (
                <div key={member.name} className="flex items-center gap-4 card-dark rounded-2xl p-4 group">
                  <img
                    src={member.img}
                    alt={member.name}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover grayscale flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-space-grotesk)] font-semibold text-white/90 text-sm truncate">{member.name}</p>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{member.role}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}

              <p className="text-center text-xs text-white/25 mt-1">
                y 3 especialistas más en tu squad
              </p>

              {/* Stats mini grid */}
              <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-white/[0.06] mt-2">
                {t.stats.map((s) => (
                  <div key={s.label} className="bg-white/[0.03] px-3 py-4 text-center">
                    <div className="font-[family-name:var(--font-space-grotesk)] font-black text-sm gradient-text leading-tight">{s.n}</div>
                    <div className="text-[10px] text-white/35 mt-1">{s.label.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── QUÉ HACEMOS ──────────────────────────────────────────────────── */}
      <section className="relative bg-black py-20 md:py-28 overflow-hidden">
        <div className="orb-purple absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-15" />
        <div className="orb-magenta absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-08" />

        <div className="relative max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.2em] mb-6 block">
              {t.whatWeDo.eyebrow}
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5vw,72px)] text-white leading-[0.95] tracking-[-0.03em] mb-6">
              El antídoto para startups<br />
              y emprendedores que no quieren<br />
              <span className="gradient-text">agencias ni consultoras</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              {t.whatWeDo.desc}
            </p>
          </div>

          {/* 3 columnas */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {t.whatWeDo.items.map((item, idx) => (
              <div key={item.num} className="relative group card-dark rounded-2xl p-8 md:p-10 overflow-hidden border-l-2 border-l-transparent hover:border-l-[#A855F7] transition-all duration-300">
                {/* Número watermark grande */}
                <span
                  className="absolute -bottom-4 -right-2 font-[family-name:var(--font-space-grotesk)] font-black text-[140px] leading-none select-none pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(61,47,255,0.18) 0%, rgba(168,85,247,0.10) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {item.num}
                </span>
                {/* Eyebrow num */}
                <span className="font-[family-name:var(--font-space-grotesk)] font-black text-xs gradient-text mb-4 block tracking-[0.2em]">
                  {item.num}
                </span>
                {/* Divider expandable */}
                <div className="w-10 h-[2px] bg-gradient-to-r from-[#3D2FFF] to-[#A855F7] mb-7 group-hover:w-20 transition-all duration-500" />
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl text-white mb-4 leading-snug relative z-10">
                  {item.title}
                </h3>
                <p className="text-white/55 text-sm leading-relaxed relative z-10">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Imagen panorámica — más alta y más impactante */}
          <div className="relative rounded-2xl overflow-hidden h-72 md:h-96 border border-white/[0.08]">
            <img src="/sf-interior.jpg" alt="Startups Factory" loading="lazy" className="w-full h-full object-cover object-center scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-10 md:px-14 max-w-2xl">
                <span className="text-xs font-bold text-[#A855F7] uppercase tracking-[0.2em] mb-4 block">{p.commitment.eyebrow}</span>
                <p className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(24px,3.5vw,48px)] text-white leading-tight tracking-[-0.02em]">
                  {p.commitment.l1}<br />
                  {p.commitment.l2}<br />
                  <span className="gradient-text">{p.commitment.l3}</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── PARA QUIÉN ───────────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-magenta absolute -right-40 top-1/3 w-[500px] h-[500px] opacity-15" />
        <div className="orb-purple absolute -left-40 bottom-0 w-[400px] h-[400px] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-6">

          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">
              {t.forWhom.eyebrow}
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,4vw,56px)] text-white tracking-[-0.02em]">
              {t.forWhom.h2}
            </h2>
            <p className="mt-4 text-white/35 text-lg max-w-lg mx-auto">{p.forWhomSub}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {([
              { ...t.forWhom.audiences[0], num: '01', bullets: p.bullets.emp },
              { ...t.forWhom.audiences[1], num: '02', bullets: p.bullets.startup },
              { ...t.forWhom.audiences[2], num: '03', bullets: p.bullets.corp },
            ] as Array<typeof t.forWhom.audiences[0] & { num: string; bullets: string[] }>).map((a) => (
              <Link
                key={a.tag}
                href={`/${locale}${a.href}`}
                className="group relative card-dark rounded-2xl flex flex-col overflow-hidden hover:border-[#A855F7]/70 hover:scale-[1.02] transition-all duration-200"
              >
                {/* Número watermark */}
                <span className="absolute top-4 right-5 font-[family-name:var(--font-space-grotesk)] font-black text-[80px] leading-none text-white/[0.04] select-none pointer-events-none">
                  {a.num}
                </span>

                {/* Selector indicator */}
                <div className="absolute top-5 left-5 w-6 h-6 rounded-full border-2 border-white/15 group-hover:border-[#A855F7] group-hover:bg-[#A855F7]/20 transition-all duration-200 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>

                <div className="p-8 pt-14 flex flex-col flex-1">
                  {/* Tag */}
                  <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-bold px-3 py-1 rounded-full mb-5 self-start uppercase tracking-wide">
                    {a.tag}
                  </span>

                  {/* Title */}
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl text-white mb-3 leading-snug">{a.title}</h3>

                  {/* Desc */}
                  <p className="text-white/40 text-sm leading-relaxed mb-6 flex-1">{a.desc}</p>

                  {/* Bullets */}
                  <ul className="space-y-2 mb-7">
                    {a.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-sm text-white/60">
                        <span className="w-4 h-4 rounded-full bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center shrink-0">
                          <svg width="6" height="5" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
                    <span className="text-sm font-bold text-[#A855F7] group-hover:text-white transition-colors">
                      {a.cta}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/25 flex items-center justify-center group-hover:bg-[#A855F7] group-hover:border-[#A855F7] transition-all duration-200">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#A855F7] group-hover:text-white"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{background: 'linear-gradient(180deg, #000000 0%, #07070F 50%, #000000 100%)'}}>
        <div className="orb-magenta absolute right-0 top-1/3 w-[600px] h-[600px] opacity-30" />
        <div className="orb-purple absolute -left-20 bottom-1/4 w-[500px] h-[500px] opacity-20" />
        <img src="/sf-aerial.jpg" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-[0.04] mix-blend-luminosity" />

        <div className="relative max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.2em] mb-5 block">{p.how.eyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,5.5vw,72px)] text-white tracking-[-0.03em] leading-[0.95]">
              {p.how.h2}
            </h2>
            <p className="mt-5 text-white/40 max-w-lg mx-auto text-xl leading-relaxed">{p.how.sub}</p>
          </div>

          {/* ── ITINERARIO EMPRENDEDORES ── */}
          <div className="mb-14">
            <div className="flex items-center gap-5 mb-10">
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl md:text-2xl text-white whitespace-nowrap">
                {p.how.empTrack} <span className="gradient-text">{l === 'es' ? 'Emprendedores' : l === 'th' ? 'ผู้ประกอบการ' : 'Entrepreneurs'}</span>
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-[#A855F7]/40 to-transparent" />
            </div>

            {/* Steps + Fork — grid unificado 3 cols, 2 rows */}
            <div className="grid md:grid-cols-3 gap-5">

              {/* ── ROW 1: los 3 pasos ── */}

              {/* Paso 01 */}
              <div className="relative">
                <div className="card-dark rounded-3xl h-full flex flex-col overflow-hidden">
                  <div className="relative h-40 flex-shrink-0 overflow-hidden">
                    <img src="/sf-interior.jpg" alt="" loading="lazy" className="w-full h-full object-cover grayscale" style={{objectPosition:'center'}} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0D0D14]" />
                    <span className="absolute bottom-3 left-5 font-[family-name:var(--font-space-grotesk)] font-black text-[64px] leading-none gradient-text opacity-50 select-none">01</span>
                  </div>
                  <div className="p-7 flex flex-col flex-1">
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl text-white mb-3 leading-snug">{p.how.s01.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-5 flex-1">{p.how.s01.desc}</p>
                    <span className="self-start text-xs font-bold px-3 py-1.5 rounded-full text-emerald-400 bg-emerald-400/10 border border-emerald-400/25">{p.how.s01.badge}</span>
                  </div>
                </div>
                {/* Flecha → paso 02 */}
                <div className="hidden md:flex absolute -right-3 top-[40%] z-10 w-7 h-7 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              {/* Paso 02 — con flecha hacia abajo al feedback */}
              <div className="relative">
                <div className="card-dark rounded-3xl h-full flex flex-col overflow-hidden">
                  <div className="relative h-40 flex-shrink-0 overflow-hidden">
                    <img src="/sf-aerial.jpg" alt="" loading="lazy" className="w-full h-full object-cover grayscale" style={{objectPosition:'center'}} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0D0D14]" />
                    <span className="absolute bottom-3 left-5 font-[family-name:var(--font-space-grotesk)] font-black text-[64px] leading-none gradient-text opacity-50 select-none">02</span>
                  </div>
                  <div className="p-7 flex flex-col flex-1">
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl text-white mb-3 leading-snug">{p.how.s02.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-5 flex-1">{p.how.s02.desc}</p>
                    <span className="self-start text-xs font-bold px-3 py-1.5 rounded-full text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/25">{p.how.s02.badge}</span>
                  </div>
                </div>
                {/* Flecha → paso 03 */}
                <div className="hidden md:flex absolute -right-3 top-[40%] z-10 w-7 h-7 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 items-center justify-center shadow-lg shadow-purple-500/20">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {/* Flecha ↓ hacia el feedback */}
                <div className="hidden md:flex absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 flex-col items-center">
                  <div className="w-px h-3 bg-white/20" />
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/15 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
                  </div>
                </div>
              </div>

              {/* Paso 03 — Sesión 1:1 con Carlos */}
              <div className="relative">
                <div className="card-dark rounded-3xl h-full flex flex-col overflow-hidden">

                  {/* Foto Carlos + Si hay fit badge overlay */}
                  <div className="relative h-40 flex-shrink-0 overflow-hidden">
                    <img src="/team/team-group.jpg" alt="" loading="lazy" className="w-full h-full object-cover grayscale" style={{objectPosition:'center top'}} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0D0D14]" />
                    <span className="absolute bottom-3 left-5 font-[family-name:var(--font-space-grotesk)] font-black text-[64px] leading-none gradient-text opacity-50 select-none">03</span>
                    {/* Si hay fit — badge sobre la foto */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-[#A855F7]/50 rounded-full px-3 py-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#A855F7]/30 border border-[#A855F7]/50 flex items-center justify-center shrink-0">
                        <svg width="7" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3L9 1" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span className="text-[10px] font-bold text-[#A855F7] uppercase tracking-[0.15em]">{p.how.s03.fit}</span>
                    </div>
                  </div>

                  <div className="p-7 flex flex-col flex-1">
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl text-white mb-3 leading-snug">{p.how.s03.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-5 flex-1">{p.how.s03.desc}</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full text-emerald-400 bg-emerald-400/10 border border-emerald-400/25">{p.how.s03.free}</span>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full text-amber-400 bg-amber-400/10 border border-amber-400/25">{p.how.s03.accept}</span>
                    </div>
                    <div className="pt-4 border-t border-[#A855F7]/15">
                      <p className="text-white/45 text-xs leading-relaxed">{p.how.s03.proposal}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── ROW 2: solo col 2 — Feedback + refresh ── */}
              <div className="hidden md:block" /> {/* Col 1 vacía */}

              {/* Col 2 — Si no hay fit */}
              <div className="relative md:mt-2">
                <div className="card-dark rounded-3xl overflow-hidden">

                  {/* SI NO HAY FIT — TOP indicator (mismo estilo que Si hay fit) */}
                  <div className="flex items-center gap-3 px-7 pt-6 pb-4 border-b border-[#A855F7]/15">
                    <span className="w-7 h-7 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.31"/>
                      </svg>
                    </span>
                    <span className="text-xs font-bold text-[#A855F7] uppercase tracking-[0.15em]">{p.how.noFit.indicator}</span>
                  </div>

                  <div className="p-7 flex flex-col flex-1">
                    <h4 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-xl mb-3 leading-snug">{p.how.noFit.title}</h4>
                    <p className="text-white/50 text-sm leading-relaxed mb-5 flex-1">{p.how.noFit.desc}</p>
                    <div className="pt-4 border-t border-white/[0.07]">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center shrink-0 mt-0.5">
                          <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><circle cx="6" cy="5" r="2" stroke="#A855F7" strokeWidth="1.4"/><circle cx="13" cy="13" r="2" stroke="#A855F7" strokeWidth="1.4"/><circle cx="13" cy="5" r="2" stroke="#A855F7" strokeWidth="1.4"/><path d="M8 5h3M8 13h-2M13 7v4" stroke="#A855F7" strokeWidth="1.4" strokeLinecap="round"/></svg>
                        </span>
                        <p className="text-white/55 text-xs leading-relaxed">{p.how.noFit.note}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:block" /> {/* Col 3 vacía */}

            </div>
          </div>

          {/* ── ITINERARIO STARTUPS ── */}
          <div>
            <div className="flex items-center gap-5 mb-10">
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl md:text-2xl text-white whitespace-nowrap">
                {p.how.startupTrack} <span className="gradient-text">Startups</span>
              </h3>
              <div className="h-px flex-1 bg-white/[0.10]" />
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                { n: "01", ...p.how.ss[0], badgeColor: "emerald", img: "/factory-sq1.webp", imgPos: "center" },
                { n: "02", ...p.how.ss[1], badgeColor: "purple", img: "/sf-interior.jpg", imgPos: "center center" },
                { n: "03", ...p.how.ss[2], badgeColor: "amber", img: "/sf-hero.jpg", imgPos: "center" },
              ].map((s, i) => (
                <div key={s.n} className="relative">
                  <div className="card-dark rounded-3xl h-full flex flex-col overflow-hidden">
                    {/* Header foto */}
                    <div className="relative h-40 flex-shrink-0 overflow-hidden">
                      <img
                        src={s.img}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover grayscale"
                        style={{objectPosition: s.imgPos}}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0D0D14]" />
                      <span className="absolute bottom-3 left-5 font-[family-name:var(--font-space-grotesk)] font-black text-[64px] leading-none text-white/20 select-none">
                        {s.n}
                      </span>
                    </div>
                    {/* Contenido */}
                    <div className="p-7 flex flex-col flex-1">
                      <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl text-white mb-3 leading-snug">{s.title}</h3>
                      <p className="text-white/45 text-sm leading-relaxed mb-5 flex-1">{s.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`self-start text-xs font-bold px-3 py-1.5 rounded-full ${
                          s.badgeColor === 'emerald' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/25' :
                          s.badgeColor === 'purple'  ? 'text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/25' :
                          'text-amber-400 bg-amber-400/10 border border-amber-400/25'
                        }`}>{s.badge}</span>
                        <span className="self-start text-xs font-bold text-white/30 bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-full">{s.tag}</span>
                      </div>
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/10 border border-white/20 items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── EQUIPO POR MÓDULOS ───────────────────────────────────────────── */}
      <section className="relative bg-black pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="orb-purple absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[300px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">
              {t.team.eyebrow}
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,4vw,56px)] text-white tracking-[-0.02em]">
              {t.team.h2}
            </h2>
            <p className="mt-4 text-white/45 max-w-xl mx-auto">{t.team.desc}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.team.modules.map((m) => {
              const icons: Record<string, React.ReactNode> = {
                'Fractional CEO':          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>,
                'Growth & Marketing':      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
                'IA & Automatización':     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
                'Fractional CTO / Tech Lead': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
                'Producto (PM/PO)':        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
                'Diseño (Brand/UX/UI)':    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
                'Dev (Front/Back/No-code)': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
                'Data & Analytics':        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
              };
              return (
                <div key={m.role} className="card-dark rounded-2xl p-6">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3D2FFF]/20 to-[#A855F7]/10 border border-white/10 flex items-center justify-center mb-4">
                    {icons[m.role] ?? <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#3D2FFF] to-[#A855F7]" />}
                  </div>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{m.role}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href={`/${locale}/equipo-por-horas`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#A855F7] hover:text-white transition-colors">
              {t.team.cta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>




      {/* ─── EQUIPO PREVIEW ───────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-20 overflow-hidden" style={{background: '#05050D'}}>
        <div className="relative max-w-7xl mx-auto px-6">

          {/* Foto grupal — banner full-width */}
          <div className="relative rounded-3xl overflow-hidden mb-14 h-[340px] md:h-[460px]">
            <img
              src="/team/team-group-new.JPG"
              alt="Equipo Startup Factory"
              className="absolute inset-0 w-full h-full object-cover object-[70%_10%]"
            />
            {/* Gradientes */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            {/* Contenido overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 flex items-end justify-between">
              <div>
                <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3 block">{p.teamSec.eyebrow}</span>
                <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em] leading-tight">
                  {p.teamSec.h2}
                </h2>
              </div>
              <Link href={`/${locale}/equipo`} className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-[#A855F7] transition-colors border border-white/20 hover:border-[#A855F7]/40 px-5 py-2.5 rounded-full backdrop-blur-sm">
                {p.teamSec.cta}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="md:hidden mb-4 flex items-center justify-between">
            <Link href={`/${locale}/equipo`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#A855F7] hover:text-white transition-colors">
              {p.teamSec.cta}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* ── Core Team ── */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.18em]">Core Team</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { photo: "/team/carlos.jpg", name: "Carlos Jacoste", role: "Co-founder & CEO",     linkedin: "https://www.linkedin.com/in/carlosjacoste/" },
                { photo: "/team/diego.jpg",  name: "Diego Docavo",   role: "Business Development", linkedin: "https://www.linkedin.com/in/diegodocavo/" },
                { photo: "/team/nacho.jpg",  name: "Nacho Sánchez",  role: "Marketing Manager",    linkedin: "https://www.linkedin.com/in/nachosanchezjurado/" },
              ].map((m) => (
                <div key={m.name} className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[#A855F7]/60 transition-all duration-300">
                  <div className="relative aspect-square bg-[#1a1a1a]">
                    <Image src={m.photo} alt={m.name} fill className="object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                    <div>
                      <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-sm">{m.name}</p>
                      <p className="text-[#A855F7] text-xs font-semibold mt-0.5">{m.role}</p>
                    </div>
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${m.name}`} className="text-white/30 hover:text-[#A855F7] transition-colors shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── AI Squad ── */}
          <div>
            <div className="flex items-center gap-4 mb-5">
              <span className="text-[11px] font-bold text-[#A855F7]/50 uppercase tracking-[0.18em]">AI Squad</span>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { photo: "/team/alessandro.jpg", name: "Alessandro Valobra", role: "Dir. Marketing IA",  linkedin: "https://www.linkedin.com/in/alessandro-davide-valobra-268217257/" },
                { photo: "/team/josue.jpg",       name: "Josue Pacheco",      role: "Dir. Software & IA", linkedin: "https://www.linkedin.com/in/alexander-josue-pacheco/" },
                { photo: "/team/javier.jpg",      name: "Javier Rodríguez",   role: "Webmaster AI",       linkedin: "https://www.linkedin.com/in/javier-r-4b284b232/" },
              ].map((m) => (
                <div key={m.name} className="group flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:border-[#A855F7]/30 hover:bg-white/[0.04] transition-all duration-300 p-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#1a1a1a]">
                    <Image src={m.photo} alt={m.name} fill className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-white/80 text-sm truncate">{m.name}</p>
                    <p className="text-[#A855F7]/70 text-xs font-semibold mt-0.5 truncate">{m.role}</p>
                  </div>
                  <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${m.name}`} className="text-white/20 hover:text-[#A855F7] transition-colors shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MANIFIESTO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Foto de fondo con overlay */}
        <img src="/sf-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.18]" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
        <div className="relative py-20 md:py-28 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="sticky top-32">
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{p.manifesto.eyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(48px,6vw,80px)] text-white leading-[0.92] tracking-[-0.03em] mb-8">
                {p.manifesto.h2a}<br /><span className="gradient-text">{p.manifesto.h2b}</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-xs">{p.manifesto.desc}</p>
              <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-7 py-3.5 rounded-full text-sm inline-block">
                {p.manifesto.cta}
              </Link>
            </div>
            <div className="space-y-2.5">
              {p.manifesto.items.map((item, idx) => ({ ...item, n: String(idx + 1).padStart(2, '0') })).map((item) => (
                <div key={item.n} className="group card-dark flex gap-5 p-6 rounded-2xl hover:border-[#A855F7]/60 hover:bg-[#A855F7]/[0.04] transition-all duration-200 border-l-2 border-l-transparent hover:border-l-[#A855F7]/50">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black text-xl gradient-text leading-none mt-0.5 min-w-[2rem] opacity-60 group-hover:opacity-100 transition-opacity">{item.n}</span>
                  <div>
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white/90 mb-2 text-base leading-snug">{item.title}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIO ───────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden" style={{background: '#05050D'}}>
        <div className="orb-magenta absolute right-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="orb-purple absolute left-0 bottom-0 w-[300px] h-[300px] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-6">

          {/* Label */}
          <div className="flex items-center justify-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.2em]">{p.testimonial.label}</span>
          </div>

          <div className="card-dark rounded-3xl overflow-hidden">

            {/* Brand bar — Dadybox + caso real */}
            <div className="flex items-center gap-4 px-10 pt-8 pb-6 border-b border-white/[0.06]">
              <img
                src="/logos/dadybox.svg"
                alt="Dadybox"
                className="h-6 w-auto"
                style={{filter: 'brightness(0) invert(1)', opacity: 0.65}}
              />
              <span className="text-white/20">·</span>
              <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.2em]">{p.testimonial.tag}</span>
              <div className="flex-1" />
              <Link href={`/${locale}/casos`} className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7]/70 hover:text-[#A855F7] transition-colors">
                {p.testimonial.cta}
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>

            {/* Cita */}
            <div className="p-10 md:p-14">
              <span className="gradient-text text-[80px] font-black leading-none block mb-2" style={{fontFamily: 'Georgia, serif', lineHeight: '0.8'}}>&ldquo;</span>
              <blockquote className="text-white text-xl md:text-2xl font-[family-name:var(--font-space-grotesk)] font-medium leading-relaxed mb-10 max-w-2xl">
                {p.testimonial.quote}
              </blockquote>

              {/* Autor + stats */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-8 border-t border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-[#A855F7]/30 shrink-0">
                    <img src="/team/natalia.jpg" alt="Natalia Aldea" className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">Natalia Aldea</p>
                    <p className="text-white/40 text-sm mt-0.5">{p.testimonial.role} · <span className="text-[#A855F7] font-semibold">Dadybox</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-6 md:gap-10">
                  {p.testimonial.stats.map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="font-[family-name:var(--font-space-grotesk)] font-black text-xl gradient-text leading-none mb-1">{m.n}</div>
                      <div className="text-[10px] text-white/30 leading-tight max-w-[80px]">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Link href={`/${locale}/casos`} className="md:hidden mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#A855F7] hover:text-white transition-colors border border-[#A855F7]/25 hover:border-[#A855F7]/70 px-4 py-2 rounded-full">
                {p.testimonial.cta}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CLIENTES / PROYECTOS EJECUTADOS ─────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{background: '#05050D'}}>
        <div className="orb-purple absolute right-0 bottom-0 w-[500px] h-[500px] opacity-15" />
        <div className="relative max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{p.clients.eyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,4vw,56px)] text-white tracking-[-0.02em]">
                {p.clients.h2a}<br /><span className="gradient-text">{p.clients.h2b}</span>
              </h2>
            </div>
            <Link href={`/${locale}/casos`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#A855F7] hover:text-white transition-colors">
              {p.clients.cta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Grid de fichas */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {([
              { logo: "/logos/playtomic.png", name: "Playtomic",          tag: "BI · Analytics",                colored: true  },
              { logo: "/logos/barlab.png",    name: "BarLab Ventures",    tag: "Innovación Corporativa",        colored: false },
              { logo: "/logos/turismo-ronda.png", name: "Turismo de Ronda", tag: "TravelTech · Plataforma",    colored: false },
              { logo: "/logos/souji.svg",     name: "Souji",              tag: "Open Innovation · Internacional", colored: false },
              { logo: "/logos/woonivers.png", name: "Woonivers",          tag: "BizDev · BI",                   colored: false },
              { logo: "/logos/stepone.png",   name: "StepOne Ventures",   tag: "Launch · BizDev",               colored: false },
              { logo: "/logos/padel-society.png", name: "The Padel Society", tag: "Growth Partner",            colored: false },
              { logo: "/logos/albasanz.png",  name: "Albasanz Express",   tag: "IA · Automatización",           colored: false, logoFilter: "brightness(0.55) contrast(1.4)" },
            ] as Array<{ logo: string; name: string; tag: string; colored: boolean; logoFilter?: string }>).map((c) => ({
              ...c, desc: p.clients.descs[c.name] ?? '',
            })).map((c) => (
              <div key={c.name} className="group card-dark rounded-2xl overflow-hidden hover:border-[#A855F7]/60 transition-all duration-300 flex flex-col">
                {/* Logo area */}
                <div className="relative h-40 bg-[#f6f6f8] flex items-center justify-center px-6">
                  <img
                    src={c.logo}
                    alt={c.name}
                    className="h-20 w-auto max-w-[220px] object-contain group-hover:scale-105 transition-transform duration-300"
                    style={(c as typeof c & { logoFilter?: string }).logoFilter ? { filter: (c as typeof c & { logoFilter?: string }).logoFilter } : undefined}
                  />
                </div>
                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-[10px] font-semibold px-2.5 py-1 rounded-full mb-3 self-start leading-none">
                    {c.tag}
                  </span>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-sm mb-2 leading-snug">
                    {c.name}
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed flex-1">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── ECOSISTEMA ───────────────────────────────────────────────────── */}
      <section className="relative py-12 md:py-16 overflow-hidden bg-black">
        <div className="orb-purple absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-[0.08]" />
        <div className="relative max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="mb-12">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{p.eco.eyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,4vw,56px)] text-white tracking-[-0.02em] leading-tight max-w-2xl">
              {p.eco.h2a}<br />{l === 'es' ? 'y ' : ''}<span className="gradient-text">{p.eco.h2b}</span>
            </h2>
          </div>

          {/* ── VENTURES — las más importantes, tarjetas grandes ── */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-xs font-bold text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/25 px-4 py-1.5 rounded-full uppercase tracking-[0.15em] whitespace-nowrap">{p.eco.ventures}</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {([
                { logo: "/logos/discoolver.png",  name: "Discoolver",    tag: "SaaS · Turismo",         location: "España · Bangkok", status: "Live", logoFilter: "brightness(0) invert(1) opacity(0.85)" },
                { logo: "/logos/dadybox.svg",     name: "Dadybox",       tag: "Logística · eCommerce",  location: "España",           status: "Live", logoFilter: undefined },
                { logo: "/logos/salsa-burgers.png", name: "Salsa Burgers", tag: "F&B · Restaurant",    location: "Bangkok",          status: "Live", logoFilter: "brightness(0) invert(1) opacity(0.85)" },
              ] as Array<{ logo: string; name: string; tag: string; location: string; status: string; logoFilter?: string }>).map((v) => ({
                ...v, desc: p.eco.descs[v.name] ?? '', location: p.eco.locs[v.location] ?? v.location,
              })).map((v) => (
                <div key={v.name} className="group card-dark rounded-2xl overflow-hidden hover:border-[#A855F7]/60 transition-all duration-300">
                  {/* Logo area */}
                  <div className="relative h-44 bg-[#f6f6f8] flex items-center justify-center px-8">
                    <img src={v.logo} alt={v.name} className="relative h-28 w-auto max-w-[260px] object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  {/* Content */}
                  <div className="p-7">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/20 px-2.5 py-1 rounded-full">{v.tag}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {v.status}
                      </span>
                    </div>
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl text-white mb-2">{v.name}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">{v.desc}</p>
                    <span className="text-xs text-white/25 font-medium">{v.location}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Dos ventures con logo */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {[
                { logo: "/logos/mr-traack.png", name: "Mr Traack",    tag: "Música · Eventos" },
                { logo: "/logos/the-10-club.png",     name: "The 10 Club",  tag: "Club · Lifestyle" },
              ].map((v) => (
                <div key={v.name} className="group card-dark rounded-2xl overflow-hidden hover:border-[#A855F7]/55 transition-all duration-300">
                  {/* Logo area */}
                  <div className="h-32 bg-[#f6f6f8] flex items-center justify-center px-8">
                    <img src={v.logo} alt={v.name} className="h-16 w-auto max-w-[160px] object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  {/* Content */}
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div>
                      <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-white/80 text-sm">{v.name}</p>
                      <p className="text-xs text-white/35 mt-0.5">{v.tag}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-white/30 whitespace-nowrap border border-white/10 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/25" />{p.eco.inDev}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PARTNERS — grid equilibrado ── */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-xs font-bold text-white/50 bg-white/[0.05] border border-white/10 px-4 py-1.5 rounded-full uppercase tracking-[0.15em] whitespace-nowrap">{p.eco.partners}</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { logo: "/logos/makeat.png",           name: "Makeat",          filter: undefined },
                { logo: "/logos/nc-global.png",        name: "NC Global Assets", filter: "invert(1) brightness(0.85)" },
                { logo: "/logos/kmzero.png",           name: "KM Zero",          filter: "brightness(0)" },
                { logo: "/logos/spanish-startups.png", name: "Spanish Startups", filter: undefined },
                { logo: "/logos/cero-agency.png",      name: "Cero Agency",      filter: "invert(1) brightness(0.8)" },
                { logo: "/logos/truyol.png",           name: "Truyol Digital",   filter: "invert(1) brightness(0.55) contrast(1.2)" },
              ].map((item) => (
                <div key={item.name} className="group rounded-xl h-28 flex items-center justify-center px-5 bg-[#f6f6f8] hover:bg-white transition-all duration-200 cursor-default border border-black/[0.06] hover:border-black/10">
                  <img
                    src={item.logo}
                    alt={item.name}
                    style={item.filter ? { filter: item.filter } : undefined}
                    className="h-12 w-auto max-w-[130px] object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── VENTURE + CASOS ──────────────────────────────────────────────── */}
      <section className="relative py-10 md:py-14 overflow-hidden" style={{background: '#05050D'}}>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card-dark relative rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#3D2FFF]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-10">
                <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full mb-6">{p.vc.vtag}</span>
                <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl md:text-4xl text-white leading-tight mb-4 tracking-[-0.02em]">
                  {p.vc.vh2}
                </h2>
                <p className="text-white/40 leading-relaxed mb-8">{p.vc.vdesc}</p>
                <Link href={`/${locale}/venture`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#A855F7] hover:text-white transition-colors">
                  {p.vc.vcta}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="card-dark relative rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-10">
                <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full mb-6">{p.vc.ctag}</span>
                <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl md:text-4xl text-white leading-tight mb-4 tracking-[-0.02em]">
                  {p.vc.ch2}
                </h2>
                <p className="text-white/40 leading-relaxed mb-8">{p.vc.cdesc}</p>
                <Link href={`/${locale}/casos`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#A855F7] hover:text-white transition-colors">
                  {p.vc.ccta}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RETOS QUE RESOLVEMOS ────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute right-1/3 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{p.retos.eyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,4vw,56px)] text-white tracking-[-0.02em]">
              {p.retos.h2}
            </h2>
            <p className="mt-4 text-white/40 max-w-xl mx-auto">{p.retos.sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {p.retos.items.map((item, i) => ({
              ...item, href: ["/emprendedores","/startups","/corporates","/equipo-por-horas","/growth-partner","/team-as-a-service"][i],
            })).map((item) => (
              <Link key={item.quote} href={`/${locale}${item.href}`} className="group relative card-dark rounded-2xl p-7 flex flex-col hover:border-[#A855F7]/60 hover:bg-[#A855F7]/[0.03] transition-all duration-200 border-l-2 border-l-transparent hover:border-l-[#A855F7]/60">
                <span className="text-[#A855F7]/25 font-black text-5xl leading-none mb-3 font-serif group-hover:text-[#A855F7]/40 transition-colors">&ldquo;</span>
                <p className="text-white/80 font-[family-name:var(--font-space-grotesk)] font-medium text-base leading-snug flex-1 mb-6">
                  {item.quote.replace(/^"|"$/g, '')}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <span className="text-[10px] font-bold text-[#A855F7] uppercase tracking-[0.15em]">{item.who}</span>
                  <span className="w-7 h-7 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center group-hover:bg-[#A855F7] group-hover:border-[#A855F7] transition-all duration-200">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-[#A855F7] group-hover:text-white transition-colors">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


    </>
  );
}
