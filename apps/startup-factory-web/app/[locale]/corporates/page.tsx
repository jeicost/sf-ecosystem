import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";
import { PagePixels, loadPagePixels } from "@/components/PagePixels";

const site = "https://startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: {
    title: "Innovación Abierta | Beneficios y resultados reales para tu empresa — Startup Factory",
    description: "Programas de innovación abierta con startups cualificadas que generan valor de negocio medible. De la definición del reto al piloto ejecutado y la decisión de escalado.",
  },
  en: {
    title: "Open Innovation | Real benefits and results for your company — Startup Factory",
    description: "Open innovation programs with qualified startups that generate measurable business value. From challenge definition to executed pilot and scaling decision.",
  },
  th: {
    title: "นวัตกรรมแบบเปิด | ผลประโยชน์และผลลัพธ์จริงสำหรับบริษัทของคุณ — Startup Factory",
    description: "โปรแกรมนวัตกรรมแบบเปิดกับ startups ที่คัดแล้ว ที่สร้างมูลค่าทางธุรกิจที่วัดได้",
  },
};

const contentDict: Record<Locale, {
  heroEyebrow: string; h1: string; h1Accent: string; h1End: string;
  heroSubtitle: string; heroSubNote: string; heroCta1: string; heroCta2: string;
  realityEyebrow: string; realityQuote: string; realityDesc: string;
  realityStats: Array<{ stat: string; label: string; sub: string }>;
  referencesLabel: string;
  references: Array<{ company: string; tag: string; desc: string }>;
  processEyebrow: string; processH2: string; processDesc: string;
  howWeWork: Array<{ icon: string; title: string; desc: string; detail: string }>;
  whyEyebrow: string; whyH2: string;
  differentiators: Array<{ vs: string; sf: string; desc: string }>;
  guaranteesEyebrow: string; guaranteesH2: string; guaranteesH2Accent: string; guaranteesDesc: string;
  guarantees: string[];
  testimonial: string; testimonialAuthor: string; testimonialRole: string;
  ctaH2: string; ctaH2Accent: string; ctaDesc: string; ctaNote: string; ctaCta: string;
}> = {
  es: {
    heroEyebrow: "Innovación Abierta Colaborativa · Para Directores de Innovación",
    h1: "Innovación que genera", h1Accent: "beneficios y resultados", h1End: "para tu empresa.",
    heroSubtitle: "Diseñamos y ejecutamos programas de innovación abierta con startups cualificadas que producen valor de negocio medible — no presentaciones, no catálogos, no aprendizajes sin aplicación.",
    heroSubNote: "De la definición del reto al piloto ejecutado y la decisión de escalado con datos.",
    heroCta1: "Cuéntanos tu reto", heroCta2: "Cómo lo hacemos",
    realityEyebrow: "Lo que sabemos que pasa",
    realityQuote: "\"Muchos programas de innovación producen eventos, catálogos y aprendizajes. Pocos producen valor de negocio real.\"",
    realityDesc: "La diferencia no está en la calidad de las startups ni en el presupuesto del programa. Está en si el proceso está diseñado para llegar a un resultado de negocio o para cumplir con una agenda de innovación.",
    realityStats: [
      { stat: "La mayoría", label: "de pilotos corporativos no escalan", sub: "No por falta de tecnología — por falta de gestión del proceso" },
      { stat: "El reto", label: "no es encontrar startups", sub: "Es que la colaboración llegue a producción" },
      { stat: "El resultado", label: "que justifica el presupuesto", sub: "Es valor de negocio medible, no aprendizajes" },
    ],
    referencesLabel: "Empresas con las que hemos ejecutado programas de innovación",
    references: [
      { company: "Mahou · BarLab Ventures", tag: "Innovación Corporativa", desc: "Selección, validación y ejecución de pilotos con startups." },
      { company: "Airbus", tag: "Venture Building", desc: "Nuevas capacidades con metodología startup." },
      { company: "Siemens Gamesa", tag: "Innovación Abierta", desc: "Co-innovación con startups del sector energético." },
      { company: "Amadeus", tag: "Ecosistema Startup", desc: "Programa de conexión con el ecosistema startup." },
    ],
    processEyebrow: "El proceso", processH2: "Diseñado para producir resultados,\nno para cumplir etapas", processDesc: "Cada fase tiene un output concreto. Ninguna es un fin en sí misma.",
    howWeWork: [
      { icon: "◎", title: "Definimos el reto que realmente tiene valor", desc: "Antes de buscar startups, trabajamos con vuestro equipo para identificar el problema de negocio que — si se resuelve — impacta directamente en resultados. No todos los retos de innovación tienen el mismo ROI potencial. Empezamos por el que lo tiene.", detail: "Workshop de diagnóstico · 1-2 semanas" },
      { icon: "◈", title: "Encontramos la startup que puede resolverlo", desc: "No hacemos scouting genérico. Verificamos qué startups pueden operar en vuestro entorno corporativo — compliance, madurez, equipo, tiempos — y cuáles tienen una solución que encaja con vuestro reto específico. Shortlist de 5-8 con justificación real.", detail: "Scouting cualificado · 3-4 semanas" },
      { icon: "⟳", title: "Ejecutamos el piloto hasta el resultado", desc: "KPIs acordados antes de empezar. Gestión de la relación empresa-startup durante todo el proceso. Reporting semanal. Resolvemos los bloqueos antes de que se conviertan en problemas. Cuando termina el piloto hay datos, no impresiones.", detail: "Piloto estructurado · 6-12 semanas" },
      { icon: "↑", title: "Tomamos la decisión de escalado con datos", desc: "El objetivo de un piloto no es aprender — es decidir. Con los datos del piloto analizamos conjuntamente si tiene sentido escalar, ajustar o no continuar. Plan concreto con presupuesto, timeline y responsables. Sin 'hay que seguir estudiándolo'.", detail: "Decisión informada · Semana 8-16" },
    ],
    whyEyebrow: "Por qué funciona", whyH2: "La diferencia está en el criterio\ncon el que medimos el éxito",
    differentiators: [
      { vs: "Consultoras de innovación", sf: "Medimos el éxito en impacto de negocio, no en entregables", desc: "Las consultoras entregan informes, catálogos y presentaciones. Nosotros nos medimos por si el piloto produjo valor real para vuestro negocio. Esa diferencia de criterio cambia todo lo que hacemos durante el proceso." },
      { vs: "Aceleradoras corporativas", sf: "El programa se construye para vuestro reto, no al revés", desc: "Las aceleradoras tienen un programa estándar con demo day final. Vosotros encajáis en él. Nosotros diseñamos el proceso desde el reto de negocio concreto que tiene potencial de impacto real en vuestra empresa." },
      { vs: "Demo days y eventos", sf: "Startups cualificadas para operar con vosotros, no para presentar", desc: "Antes de hacer la primera introducción verificamos si la startup puede realmente colaborar en vuestro entorno: compliance, capacidad operativa, equipo suficiente, tiempos corporativos. Las que no pueden, no llegan a vuestra mesa." },
    ],
    guaranteesEyebrow: "Lo que el proceso garantiza", guaranteesH2: "Un proceso que protege", guaranteesH2Accent: "a las dos partes.",
    guaranteesDesc: "La empresa tiene visibilidad total sobre el avance. La startup tiene claridad sobre las condiciones. Cuando hay un bloqueo, lo resolvemos antes de que se convierta en un problema que mata el piloto.",
    guarantees: [
      "Los KPIs de éxito del piloto se acuerdan antes de empezar — no al final",
      "Las startups se verifican para entornos corporativos antes de la primera intro",
      "El equipo que diseña el programa es el mismo que gestiona el piloto",
      "La decisión de escalado se basa en datos del piloto, no en valoraciones subjetivas",
      "Tanto la empresa como la startup saben en todo momento dónde están y qué se espera",
    ],
    testimonial: "Startup Factory no llegó como un proveedor más — llegó como parte del equipo. En meses diseñamos y ejecutamos una línea de negocio completa: desde la estrategia hasta las herramientas. La diferencia real es que se mojan, entregan y se responsabilizan del resultado.",
    testimonialAuthor: "Natalia Aldea", testimonialRole: "Directora de Marketing · Dadybox",
    ctaH2: "¿Cuál es el reto que puede", ctaH2Accent: "generar más valor para tu empresa?",
    ctaDesc: "Primera sesión sin coste. En 60 minutos analizamos el reto, definimos qué tipo de innovación tiene más potencial de impacto y si tiene sentido trabajar juntos.",
    ctaNote: "Sin presentaciones de venta. Solo la conversación que os ayuda a decidir.",
    ctaCta: "Hablemos del reto",
  },
  en: {
    heroEyebrow: "Open Collaborative Innovation · For Innovation Directors",
    h1: "Innovation that generates", h1Accent: "real benefits and results", h1End: "for your company.",
    heroSubtitle: "We design and execute open innovation programs with qualified startups that produce measurable business value — no presentations, no catalogues, no learnings without application.",
    heroSubNote: "From challenge definition to executed pilot and scaling decision based on data.",
    heroCta1: "Tell us your challenge", heroCta2: "How we do it",
    realityEyebrow: "What we know happens",
    realityQuote: "\"Many innovation programs produce events, catalogues and learnings. Few produce real business value.\"",
    realityDesc: "The difference is not in startup quality or program budget. It is whether the process is designed to reach a business outcome or to fulfil an innovation agenda.",
    realityStats: [
      { stat: "Most", label: "corporate pilots don't scale", sub: "Not for lack of technology — for lack of process management" },
      { stat: "The challenge", label: "is not finding startups", sub: "It's getting the collaboration to production" },
      { stat: "The result", label: "that justifies the budget", sub: "Is measurable business value, not learnings" },
    ],
    referencesLabel: "Companies with whom we have executed innovation programs",
    references: [
      { company: "Mahou · BarLab Ventures", tag: "Corporate Innovation", desc: "Selection, validation and pilot execution with startups." },
      { company: "Airbus", tag: "Venture Building", desc: "New capabilities with startup methodology." },
      { company: "Siemens Gamesa", tag: "Open Innovation", desc: "Co-innovation with energy sector startups." },
      { company: "Amadeus", tag: "Startup Ecosystem", desc: "Connection program with the startup ecosystem." },
    ],
    processEyebrow: "The process", processH2: "Designed to produce results,\nnot to complete stages", processDesc: "Each phase has a concrete output. None is an end in itself.",
    howWeWork: [
      { icon: "◎", title: "We define the challenge that really has value", desc: "Before looking for startups, we work with your team to identify the business problem that — if solved — directly impacts results. Not all innovation challenges have the same potential ROI. We start with the one that does.", detail: "Diagnosis workshop · 1-2 weeks" },
      { icon: "◈", title: "We find the startup that can solve it", desc: "We don't do generic scouting. We verify which startups can operate in your corporate environment — compliance, maturity, team, timelines — and which have a solution that fits your specific challenge. Shortlist of 5-8 with real justification.", detail: "Qualified scouting · 3-4 weeks" },
      { icon: "⟳", title: "We execute the pilot to the result", desc: "KPIs agreed before starting. Management of the company-startup relationship throughout the process. Weekly reporting. We resolve blockers before they become problems. When the pilot ends there is data, not impressions.", detail: "Structured pilot · 6-12 weeks" },
      { icon: "↑", title: "We make the scaling decision with data", desc: "The goal of a pilot is not to learn — it is to decide. With the pilot data we jointly analyze whether it makes sense to scale, adjust or not continue. Concrete plan with budget, timeline and accountability. No 'we need to keep studying it'.", detail: "Informed decision · Week 8-16" },
    ],
    whyEyebrow: "Why it works", whyH2: "The difference is in the criteria\nwith which we measure success",
    differentiators: [
      { vs: "Innovation consultancies", sf: "We measure success in business impact, not deliverables", desc: "Consultancies deliver reports, catalogues and presentations. We are measured by whether the pilot produced real value for your business. That difference in criteria changes everything we do during the process." },
      { vs: "Corporate accelerators", sf: "The program is built for your challenge, not the other way around", desc: "Accelerators have a standard program with a final demo day. You fit into it. We design the process from the concrete business challenge that has real impact potential for your company." },
      { vs: "Demo days and events", sf: "Startups qualified to operate with you, not to present", desc: "Before making the first introduction we verify if the startup can really collaborate in your environment: compliance, operational capacity, sufficient team, corporate timelines. Those that can't don't reach your table." },
    ],
    guaranteesEyebrow: "What the process guarantees", guaranteesH2: "A process that protects", guaranteesH2Accent: "both sides.",
    guaranteesDesc: "The company has full visibility of progress. The startup has clarity on conditions. When there is a blocker, we resolve it before it becomes a problem that kills the pilot.",
    guarantees: [
      "Pilot success KPIs are agreed before starting — not at the end",
      "Startups are verified for corporate environments before the first introduction",
      "The team that designs the program is the same that manages the pilot",
      "The scaling decision is based on pilot data, not subjective assessments",
      "Both the company and the startup always know where they stand and what is expected",
    ],
    testimonial: "Startup Factory didn't arrive as just another supplier — they arrived as part of the team. In months we designed and executed a complete business line: from strategy to tools. The real difference is that they get their hands dirty, deliver and take responsibility for the result.",
    testimonialAuthor: "Natalia Aldea", testimonialRole: "Marketing Director · Dadybox",
    ctaH2: "What is the challenge that can", ctaH2Accent: "generate the most value for your company?",
    ctaDesc: "First session at no cost. In 60 minutes we analyze the challenge, define what type of innovation has the most impact potential and whether it makes sense to work together.",
    ctaNote: "No sales presentations. Just the conversation that helps you decide.",
    ctaCta: "Let's talk about the challenge",
  },
  th: {
    heroEyebrow: "นวัตกรรมแบบเปิดร่วมกัน · สำหรับผู้อำนวยการด้านนวัตกรรม",
    h1: "นวัตกรรมที่สร้าง", h1Accent: "ผลประโยชน์และผลลัพธ์จริง", h1End: "สำหรับบริษัทของคุณ",
    heroSubtitle: "เราออกแบบและดำเนินการโปรแกรมนวัตกรรมแบบเปิดกับ startup ที่ผ่านการคัดกรองที่สร้างมูลค่าทางธุรกิจที่วัดได้ — ไม่มีการนำเสนอ ไม่มีแคตตาล็อก ไม่มีการเรียนรู้โดยไม่มีการนำไปใช้",
    heroSubNote: "จากการกำหนดความท้าทายสู่ pilot ที่ดำเนินงานและการตัดสินใจขยายตามข้อมูล",
    heroCta1: "บอกเราความท้าทายของคุณ", heroCta2: "วิธีที่เราทำ",
    realityEyebrow: "สิ่งที่เรารู้ว่าเกิดขึ้น",
    realityQuote: "\"โปรแกรมนวัตกรรมจำนวนมากสร้างกิจกรรม แคตตาล็อก และการเรียนรู้ มีน้อยมากที่สร้างมูลค่าทางธุรกิจจริง\"",
    realityDesc: "ความแตกต่างไม่ได้อยู่ที่คุณภาพของ startup หรืองบประมาณโปรแกรม แต่อยู่ที่ว่ากระบวนการได้รับการออกแบบเพื่อให้ได้ผลลัพธ์ทางธุรกิจหรือเพื่อปฏิบัติตามวาระนวัตกรรม",
    realityStats: [
      { stat: "ส่วนใหญ่", label: "ของ pilot องค์กรไม่ขยาย", sub: "ไม่ใช่เพราะขาดเทคโนโลยี แต่เพราะขาดการจัดการกระบวนการ" },
      { stat: "ความท้าทาย", label: "ไม่ใช่การหา startup", sub: "แต่คือการทำให้ความร่วมมือถึงการผลิต" },
      { stat: "ผลลัพธ์", label: "ที่ทำให้งบประมาณคุ้มค่า", sub: "คือมูลค่าทางธุรกิจที่วัดได้ ไม่ใช่การเรียนรู้" },
    ],
    referencesLabel: "บริษัทที่เราได้ดำเนินการโปรแกรมนวัตกรรมด้วย",
    references: [
      { company: "Mahou · BarLab Ventures", tag: "นวัตกรรมองค์กร", desc: "การคัดเลือก การยืนยัน และการดำเนินการ pilot กับ startup" },
      { company: "Airbus", tag: "Venture Building", desc: "ความสามารถใหม่ด้วยวิธีการ startup" },
      { company: "Siemens Gamesa", tag: "นวัตกรรมแบบเปิด", desc: "Co-innovation กับ startup ในภาคพลังงาน" },
      { company: "Amadeus", tag: "Startup Ecosystem", desc: "โปรแกรมการเชื่อมต่อกับ startup ecosystem" },
    ],
    processEyebrow: "กระบวนการ", processH2: "ออกแบบเพื่อสร้างผลลัพธ์\nไม่ใช่เพื่อผ่านขั้นตอน", processDesc: "แต่ละขั้นตอนมี output ที่เป็นรูปธรรม ไม่มีขั้นตอนใดที่เป็นจุดหมายในตัวเอง",
    howWeWork: [
      { icon: "◎", title: "เรากำหนดความท้าทายที่มีคุณค่าจริง", desc: "ก่อนหา startup เราทำงานกับทีมของคุณเพื่อระบุปัญหาทางธุรกิจที่ — ถ้าแก้ได้ — ส่งผลโดยตรงต่อผลลัพธ์ ความท้าทายด้านนวัตกรรมไม่ได้มี ROI ที่มีศักยภาพเท่ากันทั้งหมด เราเริ่มด้วยสิ่งที่มี", detail: "Workshop วินิจฉัย · 1-2 สัปดาห์" },
      { icon: "◈", title: "เราหา startup ที่สามารถแก้ปัญหาได้", desc: "เราไม่ทำ scouting ทั่วไป เราตรวจสอบว่า startup ใดสามารถทำงานในสภาพแวดล้อมองค์กรของคุณได้ — compliance, ความสมบูรณ์, ทีม, ระยะเวลา — และมีโซลูชันที่เหมาะกับความท้าทายเฉพาะของคุณ Shortlist 5-8 พร้อมเหตุผลจริง", detail: "Scouting ที่ผ่านการคัดกรอง · 3-4 สัปดาห์" },
      { icon: "⟳", title: "เราดำเนินการ pilot จนถึงผลลัพธ์", desc: "KPIs ตกลงก่อนเริ่ม การจัดการความสัมพันธ์บริษัท-startup ตลอดกระบวนการ รายงานรายสัปดาห์ เราแก้ไขอุปสรรคก่อนที่จะกลายเป็นปัญหา เมื่อ pilot จบมีข้อมูล ไม่ใช่ความรู้สึก", detail: "Pilot ที่มีโครงสร้าง · 6-12 สัปดาห์" },
      { icon: "↑", title: "เราตัดสินใจขยายด้วยข้อมูล", desc: "เป้าหมายของ pilot ไม่ใช่การเรียนรู้ แต่คือการตัดสินใจ ด้วยข้อมูล pilot เราวิเคราะห์ร่วมกันว่ามีความหมายที่จะขยาย ปรับ หรือไม่ดำเนินการต่อ แผนที่เป็นรูปธรรมพร้อมงบประมาณ timeline และผู้รับผิดชอบ", detail: "การตัดสินใจที่มีข้อมูล · สัปดาห์ 8-16" },
    ],
    whyEyebrow: "ทำไมถึงได้ผล", whyH2: "ความแตกต่างอยู่ที่เกณฑ์\nที่เราใช้วัดความสำเร็จ",
    differentiators: [
      { vs: "บริษัทที่ปรึกษาด้านนวัตกรรม", sf: "เราวัดความสำเร็จด้วยผลกระทบทางธุรกิจ ไม่ใช่ผลลัพธ์", desc: "บริษัทที่ปรึกษาส่งมอบรายงาน แคตตาล็อก และการนำเสนอ เรามีเกณฑ์ว่า pilot สร้างคุณค่าจริงให้ธุรกิจของคุณหรือไม่ ความแตกต่างของเกณฑ์นี้เปลี่ยนทุกอย่างที่เราทำระหว่างกระบวนการ" },
      { vs: "Corporate accelerators", sf: "โปรแกรมสร้างขึ้นสำหรับความท้าทายของคุณ ไม่ใช่ในทางกลับกัน", desc: "Accelerators มีโปรแกรมมาตรฐานพร้อม demo day สุดท้าย คุณเข้าไปในนั้น เราออกแบบกระบวนการจากความท้าทายทางธุรกิจที่เป็นรูปธรรมที่มีศักยภาพผลกระทบจริงสำหรับบริษัทของคุณ" },
      { vs: "Demo days และกิจกรรม", sf: "Startup ที่ผ่านการคัดกรองเพื่อทำงานกับคุณ ไม่ใช่เพื่อนำเสนอ", desc: "ก่อนทำการแนะนำครั้งแรกเราตรวจสอบว่า startup สามารถร่วมมือกันในสภาพแวดล้อมของคุณได้จริงหรือไม่: compliance, ความสามารถในการดำเนินงาน, ทีมที่เพียงพอ, ระยะเวลาองค์กร ที่ทำไม่ได้ไม่มาถึงโต๊ะของคุณ" },
    ],
    guaranteesEyebrow: "สิ่งที่กระบวนการรับประกัน", guaranteesH2: "กระบวนการที่ปกป้อง", guaranteesH2Accent: "ทั้งสองฝ่าย",
    guaranteesDesc: "บริษัทมีการมองเห็นความคืบหน้าทั้งหมด startup มีความชัดเจนเกี่ยวกับเงื่อนไข เมื่อมีอุปสรรค เราแก้ไขก่อนที่จะกลายเป็นปัญหาที่ทำให้ pilot ล้มเหลว",
    guarantees: [
      "KPIs ความสำเร็จของ pilot ตกลงก่อนเริ่ม — ไม่ใช่ตอนสุดท้าย",
      "Startup ได้รับการตรวจสอบสำหรับสภาพแวดล้อมองค์กรก่อนการแนะนำครั้งแรก",
      "ทีมที่ออกแบบโปรแกรมเป็นทีมเดียวกับที่จัดการ pilot",
      "การตัดสินใจขยายอิงจากข้อมูล pilot ไม่ใช่การประเมินเชิงอัตวิสัย",
      "ทั้งบริษัทและ startup รู้ว่าอยู่ที่ไหนและคาดหวังอะไรตลอดเวลา",
    ],
    testimonial: "Startup Factory ไม่ได้มาในฐานะผู้จัดจำหน่ายทั่วไป — มาในฐานะส่วนหนึ่งของทีม ในไม่กี่เดือนเราออกแบบและดำเนินการ business line ที่สมบูรณ์: จากกลยุทธ์ถึงเครื่องมือ ความแตกต่างจริงคือพวกเขาลงมือทำ ส่งมอบ และรับผิดชอบผลลัพธ์",
    testimonialAuthor: "Natalia Aldea", testimonialRole: "ผู้อำนวยการฝ่ายการตลาด · Dadybox",
    ctaH2: "ความท้าทายที่สามารถ", ctaH2Accent: "สร้างคุณค่ามากที่สุดสำหรับบริษัทของคุณคืออะไร?",
    ctaDesc: "เซสชันแรกไม่มีค่าใช้จ่าย ใน 60 นาทีเราวิเคราะห์ความท้าทาย กำหนดประเภทนวัตกรรมที่มีศักยภาพผลกระทบมากที่สุด และว่ามีความหมายที่จะทำงานด้วยกันหรือไม่",
    ctaNote: "ไม่มีการนำเสนอขาย เพียงแค่การสนทนาที่ช่วยให้คุณตัดสินใจ",
    ctaCta: "คุยเรื่องความท้าทาย",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/corporates`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/corporates`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CorporatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("corporates")["content"]?.data, l);
  const { howWeWork, differentiators, references, guarantees } = t;

  return (
    <>
      <PagePixels pixels={loadPagePixels("corporates")} />
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-[65vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-25" />
        <div className="orb-magenta absolute top-[15%] right-[5%] w-[400px] h-[400px] rounded-full opacity-20" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{t.heroEyebrow}</span>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,6.5vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-8 max-w-5xl">
            {t.h1}<br />
            <span className="gradient-text">{t.h1Accent}</span><br />
            {t.h1End}
          </h1>
          <p className="max-w-2xl text-xl text-white/55 leading-relaxed mb-4">
            {t.heroSubtitle}
          </p>
          <p className="max-w-xl text-sm text-white/30 mb-10">
            {t.heroSubNote}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full text-base">
              {t.heroCta1}
            </Link>
            <Link href="#como-trabajamos" className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.05] hover:border-white/25 transition-all duration-200">
              {t.heroCta2}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── LA REALIDAD DEL SECTOR ───────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-dark rounded-2xl p-8 col-span-1 md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{t.realityEyebrow}</span>
                <blockquote className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl md:text-3xl text-white leading-snug mb-6">
                  {t.realityQuote}
                </blockquote>
              </div>
              <p className="text-white/50 leading-relaxed">
                {t.realityDesc}
              </p>
            </div>
            <div className="space-y-4">
              {t.realityStats.map((s) => (
                <div key={s.stat} className="card-dark rounded-xl p-5">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black text-xl gradient-text block mb-1">{s.stat}</span>
                  <span className="text-white font-semibold text-sm block">{s.label}</span>
                  <span className="text-white/35 text-xs">{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CON QUIÉN HEMOS TRABAJADO ────────────────────────────── */}
      <section className="relative py-10" style={{ background: '#05050D' }}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-[0.15em] mb-6 text-center">{t.referencesLabel}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {references.map((r) => (
              <div key={r.company} className="card-dark rounded-xl px-6 py-5">
                <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-sm mb-1">{r.company}</p>
                <p className="text-xs text-[#A855F7] font-semibold mb-2">{r.tag}</p>
                <p className="text-xs text-white/35 leading-snug">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CÓMO TRABAJAMOS ──────────────────────────────────────── */}
      <section id="como-trabajamos" className="relative py-16 md:py-24" style={{ background: '#05050D' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.processEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">
              {t.processH2}
            </h2>
            <p className="mt-4 text-white/40 max-w-lg mx-auto">{t.processDesc}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howWeWork.map((s, i) => (
              <div key={s.title} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/20 transition-colors duration-200 flex flex-col">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-5xl text-[#A855F7]/15 leading-none mb-4">0{i + 1}</div>
                <div className="w-8 h-8 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center mb-4">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black text-sm gradient-text">{s.icon}</span>
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-3 leading-snug flex-1">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-4">{s.desc}</p>
                <span className="text-xs text-[#A855F7] font-semibold">{s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LO QUE NOS DIFERENCIA ────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.whyEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">
              {t.whyH2}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {differentiators.map((d) => (
              <div key={d.vs} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/20 transition-colors duration-200">
                <div className="flex flex-col gap-2 mb-6">
                  <span className="text-xs text-white/25 line-through tracking-wide">{d.vs}</span>
                  <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg gradient-text leading-snug">{d.sf}</span>
                </div>
                <p className="text-white/55 text-sm leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GARANTÍAS ────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-20" style={{ background: '#05050D' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.guaranteesEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,44px)] text-white tracking-[-0.02em] leading-tight mb-6">
                {t.guaranteesH2}<br />
                <span className="gradient-text">{t.guaranteesH2Accent}</span>
              </h2>
              <p className="text-white/55 leading-relaxed">
                {t.guaranteesDesc}
              </p>
            </div>
            <div className="space-y-3">
              {guarantees.map((g) => (
                <div key={g} className="flex items-start gap-3 card-dark rounded-xl px-5 py-4">
                  <span className="w-5 h-5 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                  </span>
                  <span className="text-white/65 text-sm leading-relaxed">{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIO ───────────────────────────────────────────── */}
      <section className="relative bg-black py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="card-dark rounded-3xl p-10 md:p-14">
            <span className="gradient-text font-[family-name:var(--font-space-grotesk)] font-black text-5xl leading-none block mb-6">"</span>
            <blockquote className="font-[family-name:var(--font-space-grotesk)] font-semibold text-xl md:text-2xl text-white leading-relaxed mb-8">
              {t.testimonial}
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-1 h-10 rounded-full" style={{ background: 'linear-gradient(to bottom, #3D2FFF, #A855F7)' }} />
              <div>
                <p className="text-white font-semibold">{t.testimonialAuthor}</p>
                <p className="text-[#A855F7] text-sm font-semibold">{t.testimonialRole}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: '#05050D' }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-25" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-15" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,56px)] text-white mb-4 tracking-[-0.02em] leading-tight">
            {t.ctaH2}<br />
            <span className="gradient-text">{t.ctaH2Accent}</span>
          </h2>
          <p className="text-white/50 text-lg mb-4 max-w-xl mx-auto leading-relaxed">
            {t.ctaDesc}
          </p>
          <p className="text-white/25 text-sm mb-10">{t.ctaNote}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
            {t.ctaCta}
          </Link>
        </div>
      </section>
    </>
  );
}
