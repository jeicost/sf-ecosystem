import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Equipo Fractional y por Horas | Roles senior sin contratar fijo — Startup Factory", description: "Accede a talento C-level — CEO, CMO, CTO, PM — solo cuando lo necesitas. Sin contratos largos, sin costes fijos, con accountability real en cada sprint." },
  en: { title: "Fractional Team by Hours | Senior roles without full-time hiring — Startup Factory", description: "Access C-level talent — CEO, CMO, CTO, PM — only when you need it. No long contracts, no fixed costs, with real accountability in every sprint." },
  th: { title: "ทีม Fractional รายชั่วโมง | บทบาท senior โดยไม่ต้องจ้างประจำ — Startup Factory", description: "เข้าถึงความสามารถระดับ C-level เฉพาะเมื่อต้องการ ไม่มีสัญญาระยะยาว ไม่มีต้นทุนคงที่" },
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string; subtitleNote: string;
  ctaPrimary: string; ctaSecondary: string;
  scenariosEyebrow: string; scenariosH2: string;
  scenarios: Array<{ tag: string; title: string; desc: string }>;
  rolesEyebrow: string; rolesH2: string; rolesDesc: string;
  processEyebrow: string; processH2: string;
  howItWorks: Array<{ n: string; title: string; desc: string }>;
  ctaH2: string; ctaDesc: string; ctaCta: string; ctaNote: string;
}> = {
  es: {
    eyebrow: "Equipo fractional",
    h1: "Talento C-level cuando lo necesitas.", h1Accent: "Sin contratar fijo.",
    subtitle: "Fractional CEO, CMO, CTO, PM, diseño y dev. Los roles exactos, las horas exactas, con accountability real en cada sprint.",
    subtitleNote: "Sin contratos largos. Sin costes de estructura. Sin riesgo de una mala contratación.",
    ctaPrimary: "Solicitar equipo fractional", ctaSecondary: "Ver roles disponibles",
    scenariosEyebrow: "¿Te suena?", scenariosH2: "Cuándo tiene sentido un equipo fractional",
    scenarios: [
      { tag: "Startup pre-financiación", title: "Necesitas seniority, no puedes pagarlo fijo todavía.", desc: "Un CMO o CTO fractional te da el nivel de decisión que necesitas sin el coste de un ejecutivo a tiempo completo. Cuando cierres ronda, conviertes el rol — o no." },
      { tag: "Empresa en crecimiento", title: "El equipo no da abasto. Necesitas refuerzo ya.", desc: "Sin los 3-6 meses de un proceso de selección. Activamos el rol en días, con accountability desde el primer sprint. Si no encaja, lo ajustamos." },
      { tag: "Proyecto acotado", title: "Un objetivo concreto. Un experto para conseguirlo.", desc: "Lanzamiento de producto, apertura de mercado, rediseño de marca. Un perfil senior dedicado durante el tiempo exacto que dura el proyecto." },
    ],
    rolesEyebrow: "Squad modular", rolesH2: "Roles disponibles", rolesDesc: "Elige los que necesitas. Combinamos varios en el mismo squad. Solo pagas lo que usas.",
    processEyebrow: "El proceso", processH2: "De necesidad a equipo activo en días",
    howItWorks: [
      { n: "01", title: "Cuéntanos lo que necesitas", desc: "Tu fase, el rol, las horas aproximadas y el objetivo concreto. En 24h tenemos una propuesta de perfil y precio." },
      { n: "02", title: "Activamos el perfil en días", desc: "Sin procesos de selección largos. Elegimos el perfil de nuestro equipo que mejor encaja y empieza en el primer sprint." },
      { n: "03", title: "Sprint a sprint, con entregables reales", desc: "Cada semana hay algo concreto que mostrar. Si algo no funciona, lo ajustamos. Sin contratos que te aten." },
    ],
    ctaH2: "¿Cuántas horas necesitas?", ctaDesc: "Cuéntanos tu fase y el rol que necesitas. En 24h tenemos una propuesta de squad modular con horas y precio estimado. Sin compromiso.", ctaCta: "Solicitar diagnóstico gratuito", ctaNote: "Respuesta en 24h · Sin contratos mínimos",
  },
  en: {
    eyebrow: "Fractional team",
    h1: "C-level talent when you need it.", h1Accent: "Without hiring full-time.",
    subtitle: "Fractional CEO, CMO, CTO, PM, design and dev. The exact roles, exact hours, with real accountability in every sprint.",
    subtitleNote: "No long contracts. No fixed overhead costs. No risk of a bad hire.",
    ctaPrimary: "Request fractional team", ctaSecondary: "See available roles",
    scenariosEyebrow: "Does this sound familiar?", scenariosH2: "When a fractional team makes sense",
    scenarios: [
      { tag: "Pre-funding startup", title: "You need seniority but can't afford it full-time yet.", desc: "A fractional CMO or CTO gives you the decision-making level you need without the cost of a full-time executive. When you close your round, you convert the role — or not." },
      { tag: "Growing company", title: "The team can't keep up. You need reinforcement now.", desc: "Without 3-6 months of a hiring process. We activate the role in days, with accountability from the first sprint. If it doesn't fit, we adjust." },
      { tag: "Scoped project", title: "A concrete goal. An expert to achieve it.", desc: "Product launch, market entry, brand redesign. A dedicated senior profile for exactly as long as the project lasts." },
    ],
    rolesEyebrow: "Modular squad", rolesH2: "Available roles", rolesDesc: "Choose what you need. We combine several in the same squad. You only pay for what you use.",
    processEyebrow: "The process", processH2: "From need to active team in days",
    howItWorks: [
      { n: "01", title: "Tell us what you need", desc: "Your stage, the role, approximate hours and concrete goal. Within 24h we have a profile and price proposal." },
      { n: "02", title: "We activate the profile in days", desc: "No lengthy hiring processes. We choose the best-fit profile from our team and they start in the first sprint." },
      { n: "03", title: "Sprint by sprint, with real deliverables", desc: "Every week there's something concrete to show. If something isn't working, we adjust. No contracts tying you down." },
    ],
    ctaH2: "How many hours do you need?", ctaDesc: "Tell us your stage and the role you need. Within 24h we have a modular squad proposal with hours and estimated price. No commitment.", ctaCta: "Request free diagnosis", ctaNote: "Response in 24h · No minimum contracts",
  },
  th: {
    eyebrow: "ทีม Fractional",
    h1: "ความสามารถระดับ C-level เมื่อต้องการ.", h1Accent: "โดยไม่ต้องจ้างประจำ.",
    subtitle: "Fractional CEO, CMO, CTO, PM, ดีไซน์ และ dev. Roles ที่แน่นอน ชั่วโมงที่แน่นอน พร้อม accountability จริงในทุก sprint",
    subtitleNote: "ไม่มีสัญญาระยะยาว ไม่มีต้นทุนโครงสร้างคงที่ ไม่มีความเสี่ยงจากการจ้างผิดคน",
    ctaPrimary: "ขอทีม Fractional", ctaSecondary: "ดู roles ที่มีอยู่",
    scenariosEyebrow: "คุ้นเคยไหม?", scenariosH2: "เมื่อใดที่ทีม Fractional มีความหมาย",
    scenarios: [
      { tag: "Startup ก่อนระดมทุน", title: "ต้องการ seniority แต่ยังไม่สามารถจ้างประจำได้", desc: "Fractional CMO หรือ CTO ให้ระดับการตัดสินใจที่คุณต้องการโดยไม่มีค่าใช้จ่ายของผู้บริหารเต็มเวลา เมื่อปิดรอบแล้ว คุณแปลง role — หรือไม่ก็ได้" },
      { tag: "บริษัทที่กำลังเติบโต", title: "ทีมไม่พอรับมือ ต้องการกำลังเสริมทันที", desc: "ไม่ต้องใช้เวลา 3-6 เดือนในกระบวนการจ้างงาน เราเปิดใช้งาน role ในไม่กี่วันพร้อม accountability ตั้งแต่ sprint แรก ถ้าไม่เหมาะ เราปรับ" },
      { tag: "โปรเจกต์เฉพาะ", title: "เป้าหมายที่เป็นรูปธรรม ผู้เชี่ยวชาญเพื่อบรรลุเป้า", desc: "การเปิดตัวผลิตภัณฑ์ การเข้าสู่ตลาด การรีดีไซน์แบรนด์ โปรไฟล์ senior เฉพาะตลอดระยะเวลาที่โปรเจกต์ดำเนินการ" },
    ],
    rolesEyebrow: "Squad modular", rolesH2: "Roles ที่มีอยู่", rolesDesc: "เลือกสิ่งที่คุณต้องการ เราผสมหลาย roles ในทีมเดียวกัน คุณจ่ายเฉพาะสิ่งที่ใช้",
    processEyebrow: "กระบวนการ", processH2: "จากความต้องการสู่ทีมที่ active ในไม่กี่วัน",
    howItWorks: [
      { n: "01", title: "บอกเราว่าคุณต้องการอะไร", desc: "ระยะของคุณ role ชั่วโมงโดยประมาณ และเป้าหมายที่เป็นรูปธรรม ภายใน 24 ชม. เรามีข้อเสนอโปรไฟล์และราคา" },
      { n: "02", title: "เราเปิดใช้งานโปรไฟล์ในไม่กี่วัน", desc: "ไม่มีกระบวนการจ้างงานที่ยาวนาน เราเลือกโปรไฟล์ที่เหมาะสมที่สุดจากทีมของเราและเริ่มใน sprint แรก" },
      { n: "03", title: "Sprint ต่อ sprint พร้อมผลลัพธ์จริง", desc: "ทุกสัปดาห์มีสิ่งที่เป็นรูปธรรมให้แสดง ถ้าบางอย่างไม่ได้ผล เราปรับ ไม่มีสัญญาที่ผูกมัด" },
    ],
    ctaH2: "คุณต้องการกี่ชั่วโมง?", ctaDesc: "บอกระยะของคุณและ role ที่ต้องการ ภายใน 24 ชม. เรามีข้อเสนอ squad modular พร้อมชั่วโมงและราคาโดยประมาณ ไม่มีความผูกมัด", ctaCta: "ขอวินิจฉัยฟรี", ctaNote: "ตอบกลับใน 24 ชม. · ไม่มีสัญญาขั้นต่ำ",
  },
};

const rolesDict: Record<Locale, Array<{ role: string; hours: string; focus: string; icon: string; when: string }>> = {
  es: [
    { role: "Fractional CEO", hours: "4–20h/sem", focus: "Estrategia, roadmap, ejecución y coordinación del equipo", icon: "◎", when: "Cuando necesitas liderazgo senior sin el coste de un CEO a tiempo completo" },
    { role: "Fractional CMO / Growth", hours: "4–20h/sem", focus: "Adquisición, funnel, performance y estrategia de canales", icon: "↑", when: "Para construir el motor de crecimiento sin contratar un CMO en plantilla" },
    { role: "Fractional CTO / Tech Lead", hours: "4–20h/sem", focus: "Arquitectura, decisiones técnicas y liderazgo del equipo dev", icon: "</>", when: "Cuando el equipo técnico necesita dirección senior sin el riesgo de una contratación urgente" },
    { role: "Product Manager / PO", hours: "4–16h/sem", focus: "Discovery, backlog, priorización y coordinación tech-negocio", icon: "◈", when: "Para proyectos que necesitan estructura de producto sin un PM dedicado a tiempo completo" },
    { role: "Brand / UX / UI Designer", hours: "4–20h/sem", focus: "Identidad de marca, sistema de diseño y experiencia de usuario", icon: "◑", when: "Cuando necesitas diseño de criterio sin el coste de un diseñador senior fijo" },
    { role: "Dev Front / Back / No-code", hours: "4–40h/sem", focus: "MVPs, integraciones, automatizaciones y desarrollo de producto", icon: "⌥", when: "Capacidad técnica a demanda para sprints específicos o proyectos acotados" },
    { role: "Data & Analytics", hours: "4–16h/sem", focus: "Dashboards, instrumentación y decisiones basadas en datos", icon: "∑", when: "Para equipos que necesitan visibilidad de métricas sin contratar un data analyst fijo" },
    { role: "Sales / Partnerships", hours: "4–20h/sem", focus: "Estrategia comercial, canales de adquisición y desarrollo de alianzas", icon: "⟳", when: "Cuando necesitas tracción comercial sin un Head of Sales a tiempo completo" },
  ],
  en: [
    { role: "Fractional CEO", hours: "4–20h/wk", focus: "Strategy, roadmap, execution and team coordination", icon: "◎", when: "When you need senior leadership without the cost of a full-time CEO" },
    { role: "Fractional CMO / Growth", hours: "4–20h/wk", focus: "Acquisition, funnel, performance and channel strategy", icon: "↑", when: "To build the growth engine without hiring a full-time CMO" },
    { role: "Fractional CTO / Tech Lead", hours: "4–20h/wk", focus: "Architecture, technical decisions and dev team leadership", icon: "</>", when: "When the tech team needs senior direction without the risk of an urgent hire" },
    { role: "Product Manager / PO", hours: "4–16h/wk", focus: "Discovery, backlog, prioritization and tech-business coordination", icon: "◈", when: "For projects that need product structure without a dedicated full-time PM" },
    { role: "Brand / UX / UI Designer", hours: "4–20h/wk", focus: "Brand identity, design system and user experience", icon: "◑", when: "When you need opinionated design without the cost of a full-time senior designer" },
    { role: "Dev Front / Back / No-code", hours: "4–40h/wk", focus: "MVPs, integrations, automations and product development", icon: "⌥", when: "On-demand technical capacity for specific sprints or scoped projects" },
    { role: "Data & Analytics", hours: "4–16h/wk", focus: "Dashboards, instrumentation and data-driven decisions", icon: "∑", when: "For teams that need metrics visibility without hiring a full-time data analyst" },
    { role: "Sales / Partnerships", hours: "4–20h/wk", focus: "Commercial strategy, acquisition channels and alliance development", icon: "⟳", when: "When you need commercial traction without a full-time Head of Sales" },
  ],
  th: [
    { role: "Fractional CEO", hours: "4–20 ชม./สัปดาห์", focus: "กลยุทธ์, roadmap, การดำเนินงาน และการประสานงานทีม", icon: "◎", when: "เมื่อคุณต้องการการนำทีมระดับ senior โดยไม่มีค่าใช้จ่ายของ CEO เต็มเวลา" },
    { role: "Fractional CMO / Growth", hours: "4–20 ชม./สัปดาห์", focus: "Acquisition, funnel, performance และกลยุทธ์ช่องทาง", icon: "↑", when: "เพื่อสร้าง growth engine โดยไม่จ้าง CMO ประจำ" },
    { role: "Fractional CTO / Tech Lead", hours: "4–20 ชม./สัปดาห์", focus: "สถาปัตยกรรม, การตัดสินใจทางเทคนิค และการนำทีม dev", icon: "</>", when: "เมื่อทีมเทคนิคต้องการทิศทางจาก senior โดยไม่มีความเสี่ยงจากการจ้างงานด่วน" },
    { role: "Product Manager / PO", hours: "4–16 ชม./สัปดาห์", focus: "Discovery, backlog, การจัดลำดับความสำคัญ และการประสานงาน tech-ธุรกิจ", icon: "◈", when: "สำหรับโปรเจกต์ที่ต้องการโครงสร้างผลิตภัณฑ์โดยไม่มี PM เต็มเวลา" },
    { role: "Brand / UX / UI Designer", hours: "4–20 ชม./สัปดาห์", focus: "อัตลักษณ์แบรนด์, design system และ user experience", icon: "◑", when: "เมื่อคุณต้องการดีไซน์ที่มีมาตรฐานโดยไม่มีค่าใช้จ่ายของ senior designer ประจำ" },
    { role: "Dev Front / Back / No-code", hours: "4–40 ชม./สัปดาห์", focus: "MVPs, integrations, automations และการพัฒนาผลิตภัณฑ์", icon: "⌥", when: "ความสามารถทางเทคนิค on-demand สำหรับ sprint เฉพาะหรือโปรเจกต์เฉพาะเจาะจง" },
    { role: "Data & Analytics", hours: "4–16 ชม./สัปดาห์", focus: "Dashboards, การวัดผล และการตัดสินใจจากข้อมูล", icon: "∑", when: "สำหรับทีมที่ต้องการ metrics visibility โดยไม่จ้าง data analyst ประจำ" },
    { role: "Sales / Partnerships", hours: "4–20 ชม./สัปดาห์", focus: "กลยุทธ์เชิงพาณิชย์, acquisition channels และการพัฒนาพันธมิตร", icon: "⟳", when: "เมื่อคุณต้องการ traction เชิงพาณิชย์โดยไม่มี Head of Sales เต็มเวลา" },
  ],
};


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/equipo-por-horas`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/equipo-por-horas`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function EquipoPorHorasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = contentDict[l] ?? contentDict.es;
  const roles = rolesDict[l] ?? rolesDict.es;

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-[60vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/3 -translate-y-1/2 w-[700px] h-[500px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[15%] right-[8%] w-[350px] h-[350px] rounded-full opacity-25" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{t.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(40px,6vw,80px)] text-white leading-[0.92] tracking-[-0.03em] mb-6 max-w-4xl">
            {t.h1}<br />
            <span className="gradient-text">{t.h1Accent}</span>
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-4">
            {t.subtitle}
          </p>
          <p className="max-w-xl text-sm text-white/30 mb-10">
            {t.subtitleNote}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full">
              {t.ctaPrimary}
            </Link>
            <Link href="#roles" className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.05] transition-all duration-200">
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CUÁNDO TIENE SENTIDO ─────────────────────────────────────── */}
      <section className="relative py-16 md:py-24" style={{ background: '#05050D' }}>
        <div className="orb-magenta absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.scenariosEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">{t.scenariosH2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.scenarios.map((s) => (
              <div key={s.tag} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full mb-5">{s.tag}</span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3 leading-snug">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ───────────────────────────────────────────────────── */}
      <section id="roles" className="relative bg-black py-16 md:py-24">
        <div className="orb-purple absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.rolesEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">{t.rolesH2}</h2>
            <p className="mt-4 text-white/40 max-w-lg mx-auto">{t.rolesDesc}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <div key={r.role} className="card-dark rounded-2xl p-7 hover:border-[#A855F7]/20 transition-colors duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl text-[#3D2FFF]/40 leading-none block mb-1">{r.icon}</span>
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white">{r.role}</h3>
                  </div>
                  <span className="text-xs font-bold text-[#A855F7] bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 px-3 py-1 rounded-full shrink-0">{r.hours}</span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-3">{r.focus}</p>
                <p className="text-white/25 text-xs leading-relaxed italic">{r.when}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ───────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24" style={{ background: '#05050D' }}>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.processEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">{t.processH2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.howItWorks.map((s) => (
              <div key={s.n} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-5xl text-[#A855F7]/20 leading-none mb-4">{s.n}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-black overflow-hidden py-16 md:py-24">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-25" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-15" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,56px)] text-white mb-6 tracking-[-0.02em]">
            {t.ctaH2}
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {t.ctaDesc}
          </p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
            {t.ctaCta}
          </Link>
          <p className="mt-4 text-white/25 text-sm">{t.ctaNote}</p>
        </div>
      </section>
    </>
  );
}
