import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Venture | Cash + Equity — Startup Factory Venture Studio", description: "Cuando hay fit claro, entramos como partners: aportamos equipo, ejecución y capital. Venture builder y venture studio con implicación real." },
  en: { title: "Venture | Cash + Equity — Startup Factory Venture Studio", description: "When there is clear fit, we enter as partners: we bring team, execution and capital. Venture builder and venture studio with real involvement." },
  th: { title: "เวนเจอร์ | Cash + Equity — Startup Factory Venture Studio", description: "เมื่อมี fit ที่ชัดเจน เราเข้าเป็นพาร์ทเนอร์: เรานำทีม การดำเนินงาน และทุน Venture builder และ venture studio พร้อมการมีส่วนร่วมจริง" },
};

const criteriaDict: Record<Locale, string[]> = {
  es: ["Mercado con TAM relevante y tractable", "Fundador/a con foco y capacidad de ejecución", "Posibilidad de construir ventaja competitiva rápida", "Fit con las capacidades del equipo de Startup Factory", "Apertura real a partnership de largo plazo"],
  en: ["Market with relevant and tractable TAM", "Founder with focus and execution capability", "Possibility of building fast competitive advantage", "Fit with Startup Factory team capabilities", "Real openness to long-term partnership"],
  th: ["ตลาดที่มี TAM ที่เกี่ยวข้องและเข้าถึงได้", "ผู้ก่อตั้งที่มีโฟกัสและความสามารถในการดำเนินงาน", "ความเป็นไปได้ในการสร้างความได้เปรียบในการแข่งขันอย่างรวดเร็ว", "Fit กับความสามารถของทีม Startup Factory", "ความเปิดกว้างจริงต่อ partnership ระยะยาว"],
};

const cardsDict: Record<Locale, Array<{ tag: string; title: string; desc: string }>> = {
  es: [
    { tag: "Cash + Equity", title: "Ponemos equipo y capital", desc: "Aportamos el squad de ejecución y, cuando tiene sentido, también capital. No elegimos uno — los dos juntos es donde está el valor real." },
    { tag: "Full commitment", title: "Somos parte del proyecto", desc: "El equipo de SF trabaja en el proyecto como si fuera propio. No damos consejos desde fuera: ejecutamos desde dentro." },
    { tag: "Largo plazo", title: "Construimos para durar", desc: "No buscamos exits rápidos. Diseñamos la participación para que tenga sentido mientras el negocio crece — para los dos." },
  ],
  en: [
    { tag: "Cash + Equity", title: "We bring both", desc: "Not just equity for work. When there is fit, we also bring capital to accelerate." },
    { tag: "Full commitment", title: "Real involvement", desc: "The Startup Factory squad becomes the project team. We are not advisors." },
    { tag: "Long term", title: "Strategic partnership", desc: "We design the structure to grow together and build sustained value." },
  ],
  th: [
    { tag: "Cash + Equity", title: "เรานำทั้งสอง", desc: "ไม่ใช่แค่ equity สำหรับงาน เมื่อมี fit เราก็นำทุนมาด้วยเพื่อเร่งความเร็ว" },
    { tag: "Full commitment", title: "การมีส่วนร่วมจริง", desc: "ทีม Startup Factory กลายเป็นทีมของโปรเจกต์ เราไม่ใช่ที่ปรึกษา" },
    { tag: "ระยะยาว", title: "Partnership เชิงกลยุทธ์", desc: "เราออกแบบโครงสร้างเพื่อเติบโตด้วยกันและสร้างคุณค่าที่ยั่งยืน" },
  ],
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string;
  ctaPrimary: string; ctaSecondary: string;
  criteriaEyebrow: string; criteriaH2: string;
  ctaH2: string; ctaDesc: string; ctaCta: string;
}> = {
  es: {
    eyebrow: "Venture", h1: "Equity a cambio de ejecución.", h1Accent: "Cuando el proyecto lo merece.",
    subtitle: "No somos un fondo. No hacemos cheques y desaparecemos. Cuando creemos en un proyecto y en su fundador, ponemos el equipo, la estrategia y la ejecución — a cambio de una participación real en el negocio.",
    ctaPrimary: "Presentar mi proyecto", ctaSecondary: "Ver criterios de fit",
    criteriaEyebrow: "¿Es tu proyecto?", criteriaH2: "Lo que buscamos antes de entrar",
    ctaH2: "¿Crees que hay fit?", ctaDesc: "Preséntanos el proyecto. Si vemos potencial real, lo analizamos en detalle y te decimos con honestidad si tiene sentido avanzar juntos.",
    ctaCta: "Presentar mi proyecto",
  },
  en: {
    eyebrow: "Venture", h1: "When there is fit,", h1Accent: "we enter as partners",
    subtitle: "Cash + equity. We bring team, execution and capital when we believe in the project and the team. We co-build. We co-invest.",
    ctaPrimary: "Present project", ctaSecondary: "1:1 Diagnosis",
    criteriaEyebrow: "When it makes sense", criteriaH2: "Fit criteria for Venture",
    ctaH2: "Does the Venture model make sense for your project?", ctaDesc: "Start with a diagnosis session. No commitment.",
    ctaCta: "Present Venture project",
  },
  th: {
    eyebrow: "เวนเจอร์", h1: "เมื่อมี fit,", h1Accent: "เราเข้าเป็นพาร์ทเนอร์",
    subtitle: "Cash + equity เรานำทีม การดำเนินงาน และทุนเมื่อเราเชื่อในโปรเจกต์และทีม เราร่วมสร้าง เราร่วมลงทุน",
    ctaPrimary: "นำเสนอโปรเจกต์", ctaSecondary: "วินิจฉัย 1:1",
    criteriaEyebrow: "เมื่อมีความหมาย", criteriaH2: "เกณฑ์ fit สำหรับเวนเจอร์",
    ctaH2: "โมเดล Venture มีความหมายสำหรับโปรเจกต์ของคุณหรือ?", ctaDesc: "เริ่มต้นด้วยเซสชั่นวินิจฉัย ไม่มีความผูกมัด",
    ctaCta: "นำเสนอโปรเจกต์ Venture",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/venture`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/venture`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function VenturePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = contentDict[l] ?? contentDict.es;
  const criteria = criteriaDict[l] ?? criteriaDict.es;
  const cards = cardsDict[l] ?? cardsDict.es;

  const selectionCriteriaDict: Record<Locale, Array<{ label: string; desc: string }>> = {
    es: [
      { label: "Tracción mínima", desc: "Al menos señales de mercado: usuarios, entrevistas, cartas de intención o validación real del problema." },
      { label: "Equipo fundador comprometido", desc: "Founder o co-founders a tiempo completo. No side projects, no 'probando'. Convicción real." },
      { label: "Mercado grande", desc: "TAM suficiente para construir un negocio relevante. Vertical tractable con ruta clara de monetización." },
      { label: "Fit con Startup Factory", desc: "El reto encaja con las capacidades de nuestro equipo. Podemos añadir valor real — no solo dinero." },
    ],
    en: [
      { label: "Minimum traction", desc: "At least market signals: users, interviews, letters of intent or real problem validation." },
      { label: "Committed founding team", desc: "Full-time founder or co-founders. No side projects, no 'testing'. Real conviction." },
      { label: "Large market", desc: "Sufficient TAM to build a relevant business. Tractable vertical with a clear monetization path." },
      { label: "Fit with Startup Factory", desc: "The challenge fits our team's capabilities. We can add real value — not just money." },
    ],
    th: [
      { label: "Traction ขั้นต่ำ", desc: "อย่างน้อยสัญญาณของตลาด: ผู้ใช้ การสัมภาษณ์ letters of intent หรือการยืนยันปัญหาจริง" },
      { label: "ทีมผู้ก่อตั้งที่มุ่งมั่น", desc: "Founder หรือ co-founders เต็มเวลา ไม่มี side projects ไม่ใช่การ 'ทดลอง' ความเชื่อจริง" },
      { label: "ตลาดขนาดใหญ่", desc: "TAM ที่เพียงพอในการสร้างธุรกิจที่เกี่ยวข้อง Vertical ที่เข้าถึงได้พร้อมเส้นทาง monetization ที่ชัดเจน" },
      { label: "Fit กับ Startup Factory", desc: "ความท้าทายเหมาะกับความสามารถของทีมเรา เราสามารถเพิ่มคุณค่าจริง — ไม่ใช่แค่เงิน" },
    ],
  };

  const ventureStepsDict: Record<Locale, Array<{ n: string; title: string; desc: string }>> = {
    es: [
      { n: "01", title: "Discovery", desc: "Sesión de 60-90 minutos para entender el proyecto, la visión, el equipo y los números actuales. Evaluamos fit mutuo sin compromiso." },
      { n: "02", title: "Term Sheet", desc: "Si hay fit, proponemos la estructura: qué aportamos (equipo, tiempo, capital), en qué condiciones, y cómo construimos el acuerdo de partnership." },
      { n: "03", title: "Ejecución", desc: "El squad de Startup Factory entra en el proyecto. Sprints con objetivos claros, reporting semanal y revisión mensual de tracción." },
    ],
    en: [
      { n: "01", title: "Discovery", desc: "60-90 minute session to understand the project, vision, team and current numbers. We evaluate mutual fit with no commitment." },
      { n: "02", title: "Term Sheet", desc: "If there is fit, we propose the structure: what we bring (team, time, capital), under what conditions, and how we build the partnership agreement." },
      { n: "03", title: "Execution", desc: "The Startup Factory squad enters the project. Sprints with clear goals, weekly reporting and monthly traction review." },
    ],
    th: [
      { n: "01", title: "Discovery", desc: "เซสชัน 60-90 นาทีเพื่อเข้าใจโปรเจกต์ วิสัยทัศน์ ทีม และตัวเลขปัจจุบัน เราประเมิน fit ร่วมกันโดยไม่มีความผูกมัด" },
      { n: "02", title: "Term Sheet", desc: "ถ้ามี fit เราเสนอโครงสร้าง: สิ่งที่เรานำมา (ทีม เวลา ทุน) ภายใต้เงื่อนไขใด และวิธีสร้างข้อตกลง partnership" },
      { n: "03", title: "การดำเนินงาน", desc: "Squad ของ Startup Factory เข้าสู่โปรเจกต์ Sprints พร้อมเป้าหมายที่ชัดเจน รายงานรายสัปดาห์ และทบทวน traction รายเดือน" },
    ],
  };

  const portfolioDict: Record<Locale, Array<{ name: string; status: string; desc: string }>> = {
    es: [
      { name: "Proyecto A — Fintech", status: "Activo", desc: "Plataforma de pagos para pymes. Squad: CTO + PM + Dev. En proceso de Series A." },
      { name: "Proyecto B — SaaS", status: "Activo", desc: "Herramienta de automatización B2B. Squad: Growth + Product. 120+ clientes enterprise." },
      { name: "Próximamente", status: "Próximamente", desc: "Nuevo proyecto en evaluación. Vertical: HealthTech." },
    ],
    en: [
      { name: "Project A — Fintech", status: "Active", desc: "Payment platform for SMEs. Squad: CTO + PM + Dev. Series A in process." },
      { name: "Project B — SaaS", status: "Active", desc: "B2B automation tool. Squad: Growth + Product. 120+ enterprise clients." },
      { name: "Coming soon", status: "Coming soon", desc: "New project under evaluation. Vertical: HealthTech." },
    ],
    th: [
      { name: "โปรเจกต์ A — Fintech", status: "กำลังดำเนินการ", desc: "แพลตฟอร์มการชำระเงินสำหรับ SMEs ทีม: CTO + PM + Dev อยู่ในกระบวนการ Series A" },
      { name: "โปรเจกต์ B — SaaS", status: "กำลังดำเนินการ", desc: "เครื่องมือ automation B2B ทีม: Growth + Product ลูกค้า enterprise 120+" },
      { name: "เร็วๆ นี้", status: "เร็วๆ นี้", desc: "โปรเจกต์ใหม่ที่กำลังประเมิน Vertical: HealthTech" },
    ],
  };

  const selectionCriteria = selectionCriteriaDict[l] ?? selectionCriteriaDict.es;
  const ventureSteps = ventureStepsDict[l] ?? ventureStepsDict.es;
  const portfolio = portfolioDict[l] ?? portfolioDict.es;

  const ventureModelDict: Record<Locale, { eyebrow: string; h2: string; p1: string; p2: string; ctaEyebrow: string; ctaH2: string; ctaH2Accent: string; processEyebrow: string; processH2: string; portfolioEyebrow: string; portfolioH2: string; ctaFinalH2: string; ctaFinalDesc: string; ctaFinalCta: string }> = {
    es: {
      eyebrow: "El modelo", h2: "Equipo a cambio de equity — solo cuando hay fit real.",
      p1: "El modelo Venture no es el predeterminado de Startup Factory. Es una opción reservada para los proyectos donde vemos el mayor potencial y donde nuestro equipo puede marcar la diferencia real.",
      p2: "En la práctica: aportamos un squad completo (PM, tech, growth, diseño) durante un periodo acordado, y en algunos casos co-invertimos capital. A cambio, entramos como co-founders o early partners con participación.",
      ctaEyebrow: "Cuándo tiene sentido", ctaH2: "Criterios de selección",
      ctaH2Accent: "", processEyebrow: "Proceso", processH2: "Cómo funciona el modelo Venture",
      portfolioEyebrow: "Portfolio", portfolioH2: "Proyectos en los que participamos",
      ctaFinalH2: "¿Tienes un proyecto para Venture?", ctaFinalDesc: "Aplica y cuéntanoslo. Evaluamos si el modelo tiene sentido. Sin compromiso.",
      ctaFinalCta: "Aplica ahora — es gratis",
    },
    en: {
      eyebrow: "The model", h2: "Team in exchange for equity — only when there is real fit.",
      p1: "The Venture model is not Startup Factory's default. It is an option reserved for projects where we see the greatest potential and where our team can make a real difference.",
      p2: "In practice: we bring a complete squad (PM, tech, growth, design) for an agreed period, and in some cases we co-invest capital. In exchange, we enter as co-founders or early partners with a stake.",
      ctaEyebrow: "When it makes sense", ctaH2: "Selection criteria",
      ctaH2Accent: "", processEyebrow: "Process", processH2: "How the Venture model works",
      portfolioEyebrow: "Portfolio", portfolioH2: "Projects we participate in",
      ctaFinalH2: "Do you have a Venture project?", ctaFinalDesc: "Apply and tell us about it. We evaluate whether the model makes sense. No commitment.",
      ctaFinalCta: "Apply now — it's free",
    },
    th: {
      eyebrow: "โมเดล", h2: "ทีมเพื่อแลก equity — เฉพาะเมื่อมี fit จริง",
      p1: "โมเดล Venture ไม่ใช่ค่าเริ่มต้นของ Startup Factory แต่เป็นตัวเลือกสำหรับโปรเจกต์ที่เราเห็นศักยภาพมากที่สุดและที่ทีมของเราสามารถสร้างความแตกต่างจริง",
      p2: "ในทางปฏิบัติ: เรานำ squad ที่สมบูรณ์ (PM, tech, growth, design) ในช่วงเวลาที่ตกลง และในบางกรณีเราร่วมลงทุนทุน เพื่อแลกกับการเข้าเป็น co-founders หรือ early partners พร้อมส่วนร่วม",
      ctaEyebrow: "เมื่อมีความหมาย", ctaH2: "เกณฑ์การคัดเลือก",
      ctaH2Accent: "", processEyebrow: "กระบวนการ", processH2: "วิธีการทำงานของโมเดล Venture",
      portfolioEyebrow: "Portfolio", portfolioH2: "โปรเจกต์ที่เราเข้าร่วม",
      ctaFinalH2: "คุณมีโปรเจกต์สำหรับ Venture หรือ?", ctaFinalDesc: "สมัครและบอกเล่าให้เราฟัง เราประเมินว่าโมเดลมีความหมายหรือไม่ ไม่มีความผูกมัด",
      ctaFinalCta: "สมัครเลย — ฟรี",
    },
  };

  const vm = ventureModelDict[l] ?? ventureModelDict.es;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-black min-h-[55vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[700px] h-[500px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[350px] h-[350px] rounded-full opacity-25" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{t.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-6 max-w-4xl">
            {t.h1}{" "}<span className="gradient-text">{t.h1Accent}</span>
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-10">
            {t.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full">
              {t.ctaPrimary}
            </Link>
            <Link href={`/${locale}/aplica#como-funciona`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.06] transition-all duration-200">
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* El modelo Venture */}
      <section className="relative bg-black py-24">
        <div className="orb-purple absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{vm.eyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white leading-tight mb-6 tracking-[-0.02em]">
                {vm.h2}
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                {vm.p1}
              </p>
              <p className="text-white/40 leading-relaxed">
                {vm.p2}
              </p>
            </div>
            <div className="space-y-4">
              {cards.map((item) => (
                <div key={item.tag} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                  <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    {item.tag}
                  </span>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-2">{item.title}</h3>
                  <p className="text-white/55 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Criterios */}
      <section className="relative py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-magenta absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{vm.ctaEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em]">{vm.ctaH2}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {selectionCriteria.map((c) => (
              <div key={c.label} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3D2FFF]/20 to-[#A855F7]/10 border border-white/10 flex items-center justify-center mb-5">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#3D2FFF] to-[#A855F7]" />
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3">{c.label}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="relative bg-black py-24">
        <div className="orb-purple absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[200px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{vm.processEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em]">{vm.processH2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {ventureSteps.map((s) => (
              <div key={s.n} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-5xl gradient-text opacity-30 leading-none mb-5">{s.n}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-3">{s.title}</h3>
                <p className="text-white/55 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="relative py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{vm.portfolioEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em]">{vm.portfolioH2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {portfolio.map((p) => (
              <div key={p.name} className={`card-dark rounded-2xl p-8 transition-colors duration-200 ${p.status === "Próximamente" ? "opacity-50" : "hover:border-[#A855F7]/20"}`}>
                <div className="mb-5">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${p.status === "Próximamente" ? "text-white/30 border-white/[0.08]" : "text-[#A855F7] bg-[#3D2FFF]/10 border-[#3D2FFF]/20"}`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3">{p.name}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-black">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-25" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-15" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white mb-4 tracking-[-0.02em]">{vm.ctaFinalH2}</h2>
          <p className="text-white/55 text-lg mb-10 max-w-lg mx-auto">{vm.ctaFinalDesc}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
            {vm.ctaFinalCta}
          </Link>
        </div>
      </section>
    </>
  );
}
