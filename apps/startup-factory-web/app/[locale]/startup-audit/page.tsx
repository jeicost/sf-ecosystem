import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://startupsfactory.es";
const FORMSPREE_ID = "xnjwnydg";

const contentDict: Record<Locale, {
  title: string; description: string;
  eyebrow: string; h1: string; h1Accent: string; subtitle: string; subtitleNote: string;
  ctaPrimary: string; ctaSecondary: string;
  receivesEyebrow: string; receivesH2: string;
  methodEyebrow: string; methodH2: string; methodDesc: string;
  downloadEyebrow: string; downloadH2: string; downloadAccent: string; downloadDesc: string;
  bridgeEyebrow: string; bridgeH2: string; bridgeAccent: string; bridgeDesc: string;
  bridgeCta1: string; bridgeCta2: string;
  stats: Array<{ n: string; label: string }>;
  namePlaceholder: string; emailPlaceholder: string; startupPlaceholder: string; submitBtn: string; submitNote: string;
}> = {
  es: {
    title: "Startup Audit | Analiza tu startup en 7 días con IA — Startup Factory",
    description: "El Startup Audit es la metodología con la que SF analiza un proyecto en 7 días: modelo, mercado, equipo y métricas. Cuéntanos el tuyo y lo hacemos contigo.",
    eyebrow: "Startup Audit · Metodología SF",
    h1: "Saber dónde está roto\ntu startup\n", h1Accent: "antes de seguir construyendo.",
    subtitle: "El Startup Audit es la metodología que usamos en SF para analizar proyectos en 7 días. 7 áreas. Respuestas honestas. Un plan de acción real.",
    subtitleNote: "El audit es gratuito. Lo hacemos contigo, no te dejamos una plantilla y suerte.",
    ctaPrimary: "Pedir mi audit", ctaSecondary: "Ver la metodología",
    receivesEyebrow: "Qué recibes", receivesH2: "No es un PDF genérico.\nEs el análisis que hacemos nosotros.",
    methodEyebrow: "La metodología", methodH2: "Las 7 áreas que analizamos", methodDesc: "Cada área tiene preguntas concretas y un criterio de evaluación. Sin ambigüedad.",
    downloadEyebrow: "Sin coste", downloadH2: "Empieza tu audit\n", downloadAccent: "esta semana.",
    downloadDesc: "Cuéntanos qué estás construyendo. Te escribimos en 48 horas y hacemos el audit contigo — las 7 áreas, con contexto real de mercado.",
    bridgeEyebrow: "¿Quieres que lo hagamos nosotros?", bridgeH2: "El audit propio tiene un límite.\n", bridgeAccent: "El de SF, no.",
    bridgeDesc: "El audit te dice dónde está roto. Aplicar a SF es el paso siguiente: que lo arreglemos juntos, con conexiones y un plan que ejecutamos contigo.",
    bridgeCta1: "Aplica a SF — es gratis", bridgeCta2: "Solo quiero el audit",
    stats: [{ n: "7", label: "áreas de análisis" }, { n: "7 días", label: "de principio a fin" }, { n: "48h", label: "para contestarte" }],
    namePlaceholder: "Tu nombre", emailPlaceholder: "tu@email.com", startupPlaceholder: "¿Cómo se llama tu startup / proyecto?",
    submitBtn: "Quiero mi audit →", submitNote: "Gratis · Sin spam · Sin compromiso",
  },
  en: {
    title: "Startup Audit | Analyze your startup in 7 days with AI — Startup Factory",
    description: "The Startup Audit is how SF analyses a project in 7 days: model, market, team and metrics. Tell us about yours and we do it with you.",
    eyebrow: "Startup Audit · SF Methodology",
    h1: "Know where your startup\nis broken\n", h1Accent: "before you keep building.",
    subtitle: "The Startup Audit is the methodology we use at SF to analyze projects in 7 days. 7 areas. Honest answers. A real action plan.",
    subtitleNote: "The audit is free. We do it with you — not a template and good luck.",
    ctaPrimary: "Request my audit", ctaSecondary: "See the methodology",
    receivesEyebrow: "What you get", receivesH2: "Not a generic PDF.\nThe analysis we actually run.",
    methodEyebrow: "The methodology", methodH2: "The 7 areas we analyze", methodDesc: "Each area has concrete questions and an evaluation criterion. No ambiguity.",
    downloadEyebrow: "No cost", downloadH2: "Start your audit\n", downloadAccent: "this week.",
    downloadDesc: "Tell us what you're building. We reply within 48 hours and run the audit with you — all 7 areas, with real market context.",
    bridgeEyebrow: "Want us to do it with you?", bridgeH2: "The self-audit has its limits.\n", bridgeAccent: "The SF audit doesn't.",
    bridgeDesc: "The audit tells you where it's broken. Applying to SF is the next step: fixing it together, with connections and a plan we execute with you.",
    bridgeCta1: "Apply to SF — it's free", bridgeCta2: "Just the audit for now",
    stats: [{ n: "7", label: "analysis areas" }, { n: "7 days", label: "start to finish" }, { n: "48h", label: "to hear back" }],
    namePlaceholder: "Your name", emailPlaceholder: "your@email.com", startupPlaceholder: "What is your startup / project called?",
    submitBtn: "Request my audit →", submitNote: "Free · No spam · No commitment",
  },
  th: {
    title: "Startup Audit | วิเคราะห์ startup ของคุณใน 7 วันด้วย AI — Startup Factory",
    description: "Startup Audit คือวิธีที่ SF วิเคราะห์โปรเจกต์ใน 7 วัน: model ตลาด ทีม และ metrics เล่าเรื่องโปรเจกต์ของคุณให้เราฟัง แล้วเราจะทำไปด้วยกัน",
    eyebrow: "Startup Audit · วิธีการ SF",
    h1: "รู้ว่า startup ของคุณ\nเสียที่ไหน\n", h1Accent: "ก่อนที่จะสร้างต่อ",
    subtitle: "Startup Audit คือวิธีการที่เราใช้ใน SF เพื่อวิเคราะห์โปรเจกต์ใน 7 วัน 7 พื้นที่ คำตอบที่ซื่อสัตย์ แผนปฏิบัติการจริง",
    subtitleNote: "Audit ฟรี เราทำไปด้วยกันกับคุณ ไม่ใช่ส่ง template แล้วปล่อยให้คุณทำเอง",
    ctaPrimary: "ขอ audit ของฉัน", ctaSecondary: "ดูวิธีการ",
    receivesEyebrow: "สิ่งที่คุณได้รับ", receivesH2: "ไม่ใช่ PDF ทั่วไป\nแต่คือการวิเคราะห์ที่เราทำจริง",
    methodEyebrow: "วิธีการ", methodH2: "7 พื้นที่ที่เราวิเคราะห์", methodDesc: "แต่ละพื้นที่มีคำถามที่เป็นรูปธรรมและเกณฑ์การประเมิน ไม่มีความคลุมเครือ",
    downloadEyebrow: "ไม่มีค่าใช้จ่าย", downloadH2: "เริ่ม audit ของคุณ\n", downloadAccent: "สัปดาห์นี้",
    downloadDesc: "เล่าให้เราฟังว่าคุณกำลังสร้างอะไร เราจะตอบกลับภายใน 48 ชั่วโมง และทำ audit ไปด้วยกัน ครบทั้ง 7 พื้นที่ พร้อม context ตลาดจริง",
    bridgeEyebrow: "ต้องการให้เราทำด้วยกันไหม?", bridgeH2: "การ audit เองมีข้อจำกัด\n", bridgeAccent: "ของ SF ไม่มี",
    bridgeDesc: "Audit บอกคุณว่าอะไรเสีย การสมัครที่ SF คือขั้นตอนถัดไป: แก้ไขไปด้วยกัน พร้อมการเชื่อมต่อและแผนที่เราลงมือทำกับคุณ",
    bridgeCta1: "สมัครที่ SF — ฟรี", bridgeCta2: "ตอนนี้ขอแค่ audit",
    stats: [{ n: "7", label: "พื้นที่การวิเคราะห์" }, { n: "7 วัน", label: "ตั้งแต่ต้นจนจบ" }, { n: "48 ชม.", label: "เราตอบกลับ" }],
    namePlaceholder: "ชื่อของคุณ", emailPlaceholder: "your@email.com", startupPlaceholder: "startup / โปรเจกต์ของคุณชื่ออะไร?",
    submitBtn: "ขอ audit ของฉัน →", submitNote: "ฟรี · ไม่มี spam · ไม่มีความผูกมัด",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const c = contentDict[l] ?? contentDict.es;
  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: `${site}/${locale}/startup-audit`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/startup-audit`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const auditAreasDict: Record<Locale, Array<{ n: string; area: string; q: string; color: string }>> = {
  es: [
    { n: "01", area: "Problema / Oportunidad", q: "¿Resuelves un dolor real o una comodidad?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "02", area: "Modelo de negocio", q: "¿Cómo ganas dinero y por qué te lo van a dar?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "03", area: "Mercado y competencia", q: "¿Cuánto vale el mercado y dónde estás tú?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "04", area: "Producto y MVP", q: "¿Tienes algo que testear o solo una idea?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "05", area: "Equipo", q: "¿Tienes las personas para ejecutar esto?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "06", area: "Tracción y métricas", q: "¿Qué números te dicen que vas en la dirección correcta?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "07", area: "Estrategia de crecimiento", q: "¿Cómo pasas de 10 clientes a 1.000?", color: "from-[#3D2FFF]/20 to-transparent" },
  ],
  en: [
    { n: "01", area: "Problem / Opportunity", q: "Are you solving a real pain or a convenience?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "02", area: "Business model", q: "How do you make money and why will people pay?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "03", area: "Market & competition", q: "How large is the market and where do you stand?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "04", area: "Product & MVP", q: "Do you have something to test or just an idea?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "05", area: "Team", q: "Do you have the people to execute this?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "06", area: "Traction & metrics", q: "What numbers tell you you're going in the right direction?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "07", area: "Growth strategy", q: "How do you go from 10 customers to 1,000?", color: "from-[#3D2FFF]/20 to-transparent" },
  ],
  th: [
    { n: "01", area: "ปัญหา / โอกาส", q: "คุณแก้ปัญหาจริงหรือความสะดวก?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "02", area: "Business model", q: "คุณสร้างรายได้อย่างไรและทำไมคนถึงจ่าย?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "03", area: "ตลาดและการแข่งขัน", q: "ตลาดมีมูลค่าเท่าไหร่และคุณอยู่ที่ไหน?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "04", area: "ผลิตภัณฑ์และ MVP", q: "คุณมีบางอย่างที่จะ test หรือแค่ไอเดีย?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "05", area: "ทีม", q: "คุณมีคนเพื่อดำเนินการสิ่งนี้หรือเปล่า?", color: "from-[#3D2FFF]/20 to-transparent" },
    { n: "06", area: "Traction และ metrics", q: "ตัวเลขอะไรบอกคุณว่ากำลังไปในทิศทางที่ถูกต้อง?", color: "from-[#A855F7]/20 to-transparent" },
    { n: "07", area: "กลยุทธ์การเติบโต", q: "คุณไปจาก 10 ลูกค้าสู่ 1,000 ได้อย่างไร?", color: "from-[#3D2FFF]/20 to-transparent" },
  ],
};

const whatYouGetDict: Record<Locale, Array<{ icon: string; title: string; desc: string }>> = {
  es: [
    { icon: "📋", title: "Plantilla Notion / PDF", desc: "El mismo framework que usamos en SF para evaluar startups. Con instrucciones y ejemplos reales." },
    { icon: "🤖", title: "Agente IA de análisis", desc: "Un GPT personalizado que analiza tus respuestas y te devuelve un diagnóstico por cada área." },
    { icon: "📊", title: "Scorecard de viabilidad", desc: "Una puntuación por área con las señales de alerta que más vemos en proyectos similares al tuyo." },
    { icon: "🎯", title: "Plan de acción prioritizado", desc: "Los 3 movimientos más importantes para tu fase, ordenados por impacto y urgencia." },
  ],
  en: [
    { icon: "📋", title: "Notion / PDF Template", desc: "The same framework we use at SF to evaluate startups. With instructions and real examples." },
    { icon: "🤖", title: "AI analysis agent", desc: "A custom GPT that analyzes your answers and returns a diagnosis for each area." },
    { icon: "📊", title: "Viability scorecard", desc: "A score per area with the warning signals we most frequently see in projects similar to yours." },
    { icon: "🎯", title: "Prioritized action plan", desc: "The 3 most important moves for your stage, ordered by impact and urgency." },
  ],
  th: [
    { icon: "📋", title: "Template Notion / PDF", desc: "Framework เดียวกับที่เราใช้ใน SF เพื่อประเมิน startup พร้อมคำแนะนำและตัวอย่างจริง" },
    { icon: "🤖", title: "AI analysis agent", desc: "GPT ที่ปรับแต่งเองที่วิเคราะห์คำตอบของคุณและส่งคืนการวินิจฉัยสำหรับแต่ละพื้นที่" },
    { icon: "📊", title: "Viability scorecard", desc: "คะแนนต่อพื้นที่พร้อมสัญญาณเตือนที่เราเห็นบ่อยที่สุดในโปรเจกต์คล้ายกับของคุณ" },
    { icon: "🎯", title: "แผนปฏิบัติการที่จัดลำดับความสำคัญ", desc: "การเคลื่อนไหว 3 อย่างที่สำคัญที่สุดสำหรับระยะของคุณ เรียงลำดับตามผลกระทบและความเร่งด่วน" },
  ],
};

export default async function StartupAuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const d = contentDict[l] ?? contentDict.es;
  const auditAreas = auditAreasDict[l] ?? auditAreasDict.es;
  const whatYouGet = whatYouGetDict[l] ?? whatYouGetDict.es;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-black min-h-[88vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[800px] h-[600px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[400px] h-[400px] rounded-full opacity-25" />
        <div className="absolute top-20 left-[5%] w-36 h-36 rounded-full border border-white/[0.04]" />
        <div className="absolute bottom-20 right-[12%] w-20 h-20 rounded-full border border-white/[0.03]" />

        <div className="relative w-full max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-10 animate-fade-rise delay-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{d.eyebrow}</span>
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-8 animate-fade-rise delay-200">
            {d.h1}<span className="gradient-text">{d.h1Accent}</span>
          </h1>

          <p className="text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-5 animate-fade-rise delay-400">
            {d.subtitle}
          </p>
          <p className="text-sm text-white/30 mb-14 animate-fade-rise delay-400">
            {d.subtitleNote}
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-fade-rise delay-600">
            <a href="#descarga" className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg">
              {d.ctaPrimary}
            </a>
            <a href="#metodologia" className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-5 rounded-full hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200">
              {d.ctaSecondary}
            </a>
          </div>

          <div className="grid grid-cols-3 max-w-lg mx-auto mt-20 gap-px rounded-2xl overflow-hidden border border-white/[0.06]">
            {d.stats.map((s) => (
              <div key={s.label} className="bg-white/[0.03] backdrop-blur-sm px-4 py-6 text-center">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl gradient-text">{s.n}</div>
                <div className="text-xs text-white/40 mt-1.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUÉ INCLUYE */}
      <section className="relative py-16 md:py-20 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute -right-20 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{d.receivesEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">
              {d.receivesH2}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {whatYouGet.map((item) => (
              <div key={item.title} className="card-dark rounded-2xl p-8 flex gap-5 hover:border-[#A855F7]/60 transition-all duration-200">
                <span className="text-3xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LAS 7 ÁREAS */}
      <section id="metodologia" className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-magenta absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{d.methodEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em] mb-4">
              {d.methodH2}
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              {d.methodDesc}
            </p>
          </div>
          <div className="space-y-4">
            {auditAreas.map((a) => (
              <div key={a.n} className={`card-dark rounded-2xl p-6 flex items-center gap-6 bg-gradient-to-r ${a.color}`}>
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl gradient-text opacity-40 min-w-[3rem]">{a.n}</div>
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-1">{a.area}</h3>
                  <p className="text-sm text-white/55 italic">{a.q}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULARIO DESCARGA */}
      <section id="descarga" className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] opacity-25" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] opacity-15" />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-8 block">{d.downloadEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,5vw,60px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {d.downloadH2}<span className="gradient-text">{d.downloadAccent}</span>
          </h2>
          <p className="text-white/45 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            {d.downloadDesc}
          </p>
          <div className="card-dark rounded-3xl p-8 md:p-10">
            <form action={`https://formspree.io/f/${FORMSPREE_ID}`} method="POST" className="space-y-4">
              <input type="hidden" name="_subject" value="Startup Audit — Nueva descarga" />
              <input type="hidden" name="tipo" value="startup-audit" />
              <input
                type="text" name="nombre" required placeholder={d.namePlaceholder}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors text-lg"
              />
              <input
                type="email" name="email" required placeholder={d.emailPlaceholder}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors text-lg"
              />
              <input
                type="text" name="startup" required placeholder={d.startupPlaceholder}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors"
              />
              <button type="submit" className="w-full btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-5 rounded-full text-lg mt-2">
                {d.submitBtn}
              </button>
              <p className="text-xs text-white/25 pt-2">{d.submitNote}</p>
            </form>
          </div>
        </div>
      </section>

      {/* BRIDGE A APLICA */}
      <section className="relative bg-black py-24 overflow-hidden">
        <div className="orb-purple absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="card-dark rounded-3xl p-10 md:p-14 text-center">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{d.bridgeEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,44px)] text-white tracking-[-0.02em] mb-5">
              {d.bridgeH2}<span className="gradient-text">{d.bridgeAccent}</span>
            </h2>
            <p className="text-white/55 max-w-xl mx-auto leading-relaxed mb-10">
              {d.bridgeDesc}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-4 rounded-full">
                {d.bridgeCta1}
              </Link>
              <a href="#descarga" className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.06] transition-all duration-200">
                {d.bridgeCta2}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
