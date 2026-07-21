import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Equipo para Startups | Squad de growth, IA y tech — Startup Factory", description: "Squad modular de growth, IA y tech que entra en tu startup y ejecuta desde el primer sprint. Sin contratar fijo, sin agencias, con entregables reales cada semana." },
  en: { title: "Startup Team | Growth, AI and tech squad — Startup Factory", description: "Modular growth, AI and tech squad that joins your startup and executes from day one. No full-time hiring, no agencies, real deliverables every week." },
  th: { title: "ทีมสำหรับสตาร์ทอัพ | Squad growth, AI และ tech — Startup Factory", description: "Squad แบบ modular ด้าน growth, AI และ tech ที่เข้ามาใน startup และดำเนินงานตั้งแต่ sprint แรก ไม่ต้องจ้างประจำ ไม่ต้องใช้เอเจนซี่" },
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string; subtitleNote: string;
  ctaPrimary: string; ctaSecondary: string;
  servicesEyebrow: string; servicesH2: string; servicesDesc: string;
  services: Array<{ tag: string; title: string; desc: string }>;
  scenariosEyebrow: string; scenariosH2: string;
  scenarios: Array<{ tag: string; title: string; desc: string }>;
  rolesEyebrow: string; rolesH2: string; rolesDesc: string;
  roles: Array<{ title: string; desc: string }>;
  iaEyebrow: string; iaH2: string; iaDesc: string; iaCta: string;
  metrics: Array<{ n: string; label: string }>;
  ctaEyebrow: string; ctaH2: string; ctaAccent: string; ctaDesc: string; ctaCta: string; ctaAlt: string;
}> = {
  es: {
    eyebrow: "Para Startups",
    h1: "Escala tu startup",
    h1Accent: "sin contratar fijo, sin agencias.",
    subtitle: "Squad modular de growth, IA y tech que entra en tu startup y ejecuta desde el primer sprint. Sin proceso de selección, sin curva de aprendizaje.",
    subtitleNote: "No somos una agencia que manda informes. Somos el equipo que entra en las trincheras, asume el ownership de tus resultados y rinde cuentas cada semana.",
    ctaPrimary: "Hablemos de tu startup",
    ctaSecondary: "Sesión de diagnóstico gratis",
    servicesEyebrow: "Lo que ejecutamos",
    servicesH2: "El cuello de botella de tu startup, resuelto.",
    servicesDesc: "Cada sprint empieza con un objetivo concreto y termina con un entregable medible. Sin decks de 60 páginas.",
    services: [
      { tag: "Growth", title: "Growth & Marketing Sprint", desc: "Construimos el motor de adquisición que te falta: paid, orgánico, SEO y funnel optimization. Experimentamos rápido, escalamos lo que funciona y cortamos lo que no. Métricas reales, no vanity metrics." },
      { tag: "IA", title: "IA & Automatización", desc: "Tu competencia ya usa IA para captar, nutrir y convertir leads. Implementamos captación automatizada, lead scoring y workflows que multiplican tu output sin añadir headcount. En 4 semanas, resultados medibles." },
      { tag: "Fundraising", title: "Deck & Fundraising", desc: "Narrativa, deck, modelo financiero y estrategia de outreach. Preparamos cada conversación con inversores y estamos en la sala cuando importa. No hacemos el deck y desaparecemos." },
      { tag: "Tech", title: "Tech & Producto", desc: "CTO fractional, arquitectura escalable y liderazgo técnico. El refuerzo que tu startup necesita sin los riesgos — ni los 6 meses — de una contratación urgente en plantilla." },
    ],
    scenariosEyebrow: "¿Te suena esto?",
    scenariosH2: "¿En qué punto está tu startup?",
    scenarios: [
      { tag: "Post-PMF", title: "Tienes PMF. La adquisición todavía no es predecible.", desc: "El producto funciona y los primeros clientes están. Pero el crecimiento depende demasiado de ti o de un canal frágil. Es el momento de construir el motor de crecimiento real." },
      { tag: "Preparando ronda", title: "Los inversores preguntan. Las métricas tienen que aguantar.", desc: "Necesitas narrativa sólida, modelo financiero riguroso y métricas que cuenten la historia correcta. Y seguir ejecutando mientras preparas la ronda." },
      { tag: "Equipo al límite", title: "El negocio crece más rápido que el equipo.", desc: "Hay más trabajo del que el equipo puede absorber. Roles específicos activados en días, no en meses. Sin ciclos interminables de selección ni el riesgo de una mala contratación." },
    ],
    rolesEyebrow: "Squad modular",
    rolesH2: "Los roles exactos. Cuando los necesitas.",
    rolesDesc: "Activamos solo los perfiles que tu startup necesita en este momento. Con dedicación real, no parcheada.",
    roles: [
      { title: "Growth / CMO Fractional", desc: "Adquisición, paid, orgánico, SEO y funnel. El motor de crecimiento que no tienes." },
      { title: "IA & Automatización", desc: "Sistemas de captación y nurturing con IA que escalan sin escalar el equipo." },
      { title: "CTO / Tech Lead", desc: "Arquitectura escalable, velocidad técnica y liderazgo sin el riesgo de contratar fijo." },
      { title: "Product Manager", desc: "Roadmap, priorización y coordinación entre negocio y tech. Claridad en cada sprint." },
      { title: "Data & Analytics", desc: "Dashboards, cohortes y North Star Metric. Decisiones basadas en datos, no en intuición." },
      { title: "Diseño UX/UI", desc: "De wireframe a entregable. UX, brand y comunicación visual con criterio de producto." },
    ],
    iaEyebrow: "Ventaja competitiva real",
    iaH2: "Las startups que ganan en 2026 tienen IA en su core de operaciones.",
    iaDesc: "No como experimento. Como sistema. Captación automatizada, nurturing inteligente, lead scoring y content engines que generan output sin añadir personas. Lo implementamos en sprints de 4 semanas con métricas claras desde el día 1.",
    iaCta: "Ver cómo lo hacemos →",
    metrics: [
      { n: "4–8", label: "semanas por sprint" },
      { n: "90", label: "días para ver tracción real" },
      { n: "0", label: "PowerPoints vacíos" },
    ],
    ctaEyebrow: "Próximo paso",
    ctaH2: "¿Cuál es tu siguiente hito en",
    ctaAccent: "90 días",
    ctaDesc: "En 60 minutos mapeamos tu situación, identificamos el cuello de botella y te presentamos el squad y el plan exactos para desbloquearlo. Sin compromiso ni letra pequeña.",
    ctaCta: "Sesión de diagnóstico gratis",
    ctaAlt: "Hablemos directamente",
  },
  en: {
    eyebrow: "For Startups",
    h1: "Scale faster than",
    h1Accent: "you can hire.",
    subtitle: "Modular growth, AI and tech squad that joins your startup and executes from the first sprint. No hiring process, no learning curve.",
    subtitleNote: "We're not an agency that sends reports. We're the team that takes ownership of your results and is accountable every week.",
    ctaPrimary: "Tell us your challenge",
    ctaSecondary: "Free diagnosis session",
    servicesEyebrow: "What we execute",
    servicesH2: "Your startup's bottleneck, solved.",
    servicesDesc: "Each sprint starts with a concrete goal and ends with a measurable deliverable. No 60-page decks.",
    services: [
      { tag: "Growth", title: "Predictable acquisition in 8 weeks.", desc: "We build the acquisition engine you're missing: paid, organic, SEO and funnel optimization. We experiment fast, scale what works and cut what doesn't. Real metrics, not vanity metrics." },
      { tag: "AI", title: "Your competition uses AI. You can too.", desc: "Automated acquisition, AI lead nurturing, lead scoring and workflows that multiply your team's output without adding headcount. We implement in 4 weeks, with measurable results from week one." },
      { tag: "Fundraising", title: "The round doesn't close itself.", desc: "Narrative, deck, financial model and outreach strategy. We prepare every investor conversation and we're in the room when it matters. We don't make the deck and disappear." },
      { tag: "Tech", title: "Technical speed without hiring blind.", desc: "Fractional CTO, scalable architecture, technical leadership and product capabilities. The technical reinforcement your startup needs without the risks — or the 6 months — of an urgent full-time hire." },
    ],
    scenariosEyebrow: "Does this sound familiar?",
    scenariosH2: "Tell us where you are.",
    scenarios: [
      { tag: "Post-PMF", title: "You have PMF. Acquisition isn't predictable yet.", desc: "The product works and early customers are in. But growth depends too much on you or a fragile channel. Time to build the real growth engine." },
      { tag: "Raising round", title: "Investors are asking. Metrics have to hold.", desc: "You need a solid narrative, rigorous financial model and metrics that tell the right story. And keep executing while you prepare the round." },
      { tag: "Team at limit", title: "Business grows faster than the team.", desc: "There's more work than the team can absorb. Specific roles activated in days, not months. No endless hiring cycles, no risk of a bad hire." },
    ],
    rolesEyebrow: "Modular squad",
    rolesH2: "The exact roles. When you need them.",
    rolesDesc: "We activate only the profiles your startup needs right now. With real dedication, not patched together.",
    roles: [
      { title: "Growth / Fractional CMO", desc: "Acquisition, paid, organic, SEO and funnel. The growth engine you don't have." },
      { title: "AI & Automation", desc: "AI-powered acquisition and nurturing systems that scale without scaling the team." },
      { title: "CTO / Tech Lead", desc: "Scalable architecture, technical speed and leadership without the risk of a full-time hire." },
      { title: "Product Manager", desc: "Roadmap, prioritization and tech-business coordination. Clarity in every sprint." },
      { title: "Data & Analytics", desc: "Dashboards, cohorts and North Star Metric. Data-driven decisions, not gut feelings." },
      { title: "UX/UI Design", desc: "From wireframe to deliverable. UX, brand and visual communication with product judgment." },
    ],
    iaEyebrow: "Real competitive advantage",
    iaH2: "Startups that win in 2026 have AI at the core of their operations.",
    iaDesc: "Not as an experiment. As a system. Automated acquisition, intelligent nurturing, lead scoring and content engines that generate output without adding people. We implement in 4-week sprints with clear metrics from day 1.",
    iaCta: "See how we do it →",
    metrics: [
      { n: "4–8", label: "weeks per sprint" },
      { n: "90", label: "days to real traction" },
      { n: "0", label: "empty PowerPoints" },
    ],
    ctaEyebrow: "Next step",
    ctaH2: "What's your next milestone in",
    ctaAccent: "90 days",
    ctaDesc: "In 60 minutes we map your situation, identify the bottleneck and present the exact squad and plan to unblock it. No commitment, no fine print.",
    ctaCta: "Free diagnosis session",
    ctaAlt: "Let's talk directly",
  },
  th: {
    eyebrow: "สำหรับสตาร์ทอัพ",
    h1: "เติบโต เตรียมรอบ",
    h1Accent: "หรือใช้ AI ก่อนคู่แข่ง",
    subtitle: "ทีมที่มุ่งเน้นตัวชี้วัด: growth, AI marketing, automation และ fundraising ดำเนินงานร่วมกับคุณ ไม่ใช่แทนคุณ",
    subtitleNote: "เราไม่ใช่เอเจนซี่ที่ส่งรายงาน เราคือทีมที่เข้าสู่ trenches และรับ ownership ของผลลัพธ์ของคุณ",
    ctaPrimary: "คุยเรื่อง startup ของคุณ",
    ctaSecondary: "วินิจฉัยฟรี",
    servicesEyebrow: "บริการ",
    servicesH2: "คุณต้องการดำเนินงานอะไร?",
    servicesDesc: "แต่ละ sprint มีเป้าหมายที่ชัดเจน ผลลัพธ์ที่เป็นรูปธรรม และตัวชี้วัดแบบ real-time",
    services: [
      { tag: "การได้ลูกค้า", title: "Growth & Marketing Sprint", desc: "4-8 สัปดาห์ของการทดลองการได้ลูกค้า, funnel optimization, creative testing และ performance marketing ผลลัพธ์ที่วัดได้ก่อน sprint จบ" },
      { tag: "AI", title: "AI & Automation", desc: "ระบบ acquisition อัตโนมัติ, AI nurturing, lead scoring และ workflows ที่ขยาย startup โดยไม่ต้องขยายทีม คู่แข่งของคุณทำอยู่แล้ว" },
      { tag: "Fundraising", title: "Deck & Fundraising", desc: "การเตรียม pitch deck, financial model และกลยุทธ์การหานักลงทุน เราไปด้วยกันจนปิดรอบ — ไม่ใช่แค่ทำ deck" },
      { tag: "การขยาย", title: "Tech & Product", desc: "ทีมเทคนิคเพื่อขยาย architecture, performance และความสามารถของผลิตภัณฑ์ ความเร็วมากขึ้นโดยไม่มีความเสี่ยงจากการจ้างพนักงานรีบร้อน" },
    ],
    scenariosEyebrow: "ช่วงเวลาของคุณ",
    scenariosH2: "startup ของคุณอยู่ที่ไหน?",
    scenarios: [
      { tag: "Post-PMF", title: "มี PMF แล้ว ต้องการขยาย", desc: "ผลิตภัณฑ์ทำงานได้ ตอนนี้ความท้าทายคือ acquisition ที่คาดเดาได้, retention และการขยาย revenue โดยไม่พุ่งสูงเกินไป" },
      { tag: "เตรียมรอบ", title: "รอบการระดมทุนใกล้เข้ามา", desc: "คุณต้องการตัวชี้วัดที่สะอาด, deck ที่แข็งแกร่ง และ narrative ที่น่าเชื่อถือ และยังคงดำเนินงานอยู่ด้วย" },
      { tag: "ขยาย ops", title: "ทีมไม่พอรับมือ", desc: "ธุรกิจเติบโต แต่ทีมมีความจุจำกัด roles เฉพาะที่เปิดใช้งานได้รวดเร็ว โดยไม่มีวงจรการจ้างงานแบบดั้งเดิม" },
    ],
    rolesEyebrow: "Squad modular",
    rolesH2: "Roles ที่เราเปิดใช้งาน",
    rolesDesc: "เฉพาะที่คุณต้องการ ด้วยความทุ่มเทที่แน่นอน โดยไม่ต้องจ้างพนักงานประจำ",
    roles: [
      { title: "Growth / CMO", desc: "กลยุทธ์ acquisition, paid, organic และ funnel" },
      { title: "AI & Automation", desc: "ระบบ acquisition และ nurturing อัตโนมัติด้วย AI" },
      { title: "CTO / Tech Lead", desc: "สถาปัตยกรรมที่ขยายได้และการนำทีมเทคนิค" },
      { title: "Product Manager", desc: "Roadmap, การจัดลำดับความสำคัญ และการประสานงาน tech-ธุรกิจ" },
      { title: "Data & Analytics", desc: "Dashboards, cohorts และการตัดสินใจจากข้อมูล" },
      { title: "UX/UI Design", desc: "UX/UI, brand และการสื่อสารด้วยภาพ จาก wireframe ถึงผลลัพธ์" },
    ],
    iaEyebrow: "AI & Automation",
    iaH2: "90% ของ startups ยังทำงานแบบ manual",
    iaDesc: "Acquisition อัตโนมัติ, AI lead nurturing, content engines และการวิเคราะห์เชิงพยากรณ์ เราใช้งานใน sprints 4 สัปดาห์พร้อมผลลัพธ์ที่วัดได้ตั้งแต่เดือนแรก",
    iaCta: "สำรวจตัวเลือก AI →",
    metrics: [
      { n: "4–8", label: "สัปดาห์ต่อ sprint" },
      { n: "90", label: "วันเพื่อเห็น traction จริง" },
      { n: "100%", label: "ownership ผลลัพธ์" },
    ],
    ctaEyebrow: "ขั้นตอนต่อไป",
    ctaH2: "หมุดหมายต่อไปของคุณใน",
    ctaAccent: "90 วัน",
    ctaDesc: "บอกเล่าตัวชี้วัดปัจจุบันและเป้าหมายที่เฉพาะเจาะจง ในเซสชันแรกเราแมปสถานการณ์ของคุณและนำเสนอแผนและทีมที่แน่นอนเพื่อไปถึงเป้าหมาย",
    ctaCta: "เซสชันวินิจฉัยฟรี",
    ctaAlt: "คุยโดยตรง",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/startups`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/startups`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function StartupsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("startups")["content"]?.data, l);

  return (
    <>
      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black pt-24 pb-32">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[700px] h-[500px] rounded-full opacity-35" />
        <div className="orb-magenta absolute top-[15%] right-[8%] w-[300px] h-[300px] rounded-full opacity-35" />
        <div className="absolute top-24 left-[6%] w-32 h-32 rounded-full border border-white/[0.04]" />
        <div className="absolute bottom-16 right-[12%] w-20 h-20 rounded-full border border-white/[0.03]" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{t.eyebrow}</span>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5.5vw,76px)] text-white leading-[0.95] tracking-[-0.03em] mb-6 max-w-4xl">
            {t.h1}{" "}
            <span className="gradient-text">{t.h1Accent}</span>
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-3">{t.subtitle}</p>
          <p className="max-w-xl text-sm text-white/30 leading-relaxed mb-10">{t.subtitleNote}</p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link href={`/${locale}/contacto`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full">
              {t.ctaPrimary}
            </Link>
            <Link href={`/${locale}/contacto?tipo=diagnostico`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200">
              {t.ctaSecondary}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 max-w-xl gap-px rounded-2xl overflow-hidden border border-white/[0.06]">
            {t.metrics.map((m) => (
              <div key={m.label} className="bg-white/[0.03] backdrop-blur-sm px-6 py-6 text-center">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl md:text-3xl gradient-text">{m.n}</div>
                <div className="text-xs text-white/40 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICIOS ─────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute -left-40 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.servicesEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em] mb-4">{t.servicesH2}</h2>
            <p className="text-white/40 max-w-lg mx-auto">{t.servicesDesc}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {t.services.map((s) => (
              <div key={s.title} className="card-dark rounded-2xl p-8">
                <span className="inline-flex items-center gap-2 bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full mb-5">
                  {s.tag}
                </span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-3">{s.title}</h3>
                <p className="text-white/45 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ESCENARIOS ────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: '#05050D' }}>
        <div className="orb-magenta absolute right-0 top-1/4 w-[350px] h-[350px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.scenariosEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em]">{t.scenariosH2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.scenarios.map((s) => (
              <div key={s.title} className="card-dark rounded-2xl p-8">
                <span className="inline-flex items-center gap-2 bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full mb-5">
                  {s.tag}
                </span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-3 leading-snug">{s.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ─────────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[200px] opacity-15" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.rolesEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em] mb-4">{t.rolesH2}</h2>
            <p className="text-white/40 max-w-lg mx-auto">{t.rolesDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.roles.map((r) => (
              <div key={r.title} className="card-dark rounded-2xl p-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3D2FFF]/20 to-[#A855F7]/10 border border-white/10 flex items-center justify-center mb-4">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#3D2FFF] to-[#A855F7]" />
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{r.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── IA CALLOUT ────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden" style={{ background: '#05050D' }}>
        <div className="orb-magenta absolute left-1/4 top-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-20" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="card-dark rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1">
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.iaEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(24px,3vw,40px)] text-white leading-tight tracking-[-0.02em] mb-4">{t.iaH2}</h2>
              <p className="text-white/45 leading-relaxed">{t.iaDesc}</p>
            </div>
            <div className="shrink-0">
              <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full whitespace-nowrap block text-center">
                {t.iaCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="relative bg-black overflow-hidden py-16 md:py-24">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-30" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-15" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-8 block">{t.ctaEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5vw,64px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {t.ctaH2}{" "}<span className="gradient-text">{t.ctaAccent}</span>?
          </h2>
          <p className="text-white/45 text-lg mb-12 max-w-xl mx-auto leading-relaxed">{t.ctaDesc}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg">
              {t.ctaCta}
            </Link>
            <Link href={`/${locale}/contacto`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-5 rounded-full hover:bg-white/[0.05] hover:border-white/25 transition-all duration-200">
              {t.ctaAlt}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
