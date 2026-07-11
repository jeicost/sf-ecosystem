import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";
const FORMSPREE_ID = "xnjwnydg";

const contentDict: Record<Locale, {
  title: string; description: string;
  eyebrow: string; h1: string; h1Accent: string; subtitle: string; subtitleNote: string;
  ctaPrimary: string; ctaNote: string;
  kitEyebrow: string; kitH2: string; kitDesc: string; kitCta: string;
  whyEyebrow: string; whyH2: string; whyP1: string; whyP2: string;
  formEyebrow: string; formH2: string; formAccent: string; formDesc: string;
  profilePlaceholder: string; profiles: string[]; submitBtn: string; privacyNote: string;
  proof: string[]; nextLevelEyebrow: string; nextLevelH2: string; nextLevelAccent: string;
  nextLevelDesc: string; nextLevelItems: string[]; nextLevelCta: string;
  finalH2: string; finalAccent: string; finalDesc: string; finalCta: string;
  stats: Array<{ n: string; label: string }>;
}> = {
  es: {
    title: "AI for Founders | Kit gratuito de IA para emprendedores — Startup Factory",
    description: "Plantillas, agentes y guías de IA para emprendedores hispanohablantes. Sin cursos de 80 horas. Solo lo que funciona. Descarga gratis.",
    eyebrow: "AI for Founders · Startup Factory",
    h1: "La IA que nadie\nen español\n", h1Accent: "te está enseñando.",
    subtitle: "Plantillas, agentes y guías para emprendedores que quieren usar IA para avanzar más rápido — sin cursos de 80 horas ni teoría vacía.",
    subtitleNote: "Gratis. En español. Actualizado constantemente.",
    ctaPrimary: "Quiero el kit gratis →", ctaNote: "Sin tarjeta. Sin trampa. Solo tu email.",
    kitEyebrow: "El kit", kitH2: "6 recursos que puedes usar mañana",
    kitDesc: "Nada de teoría. Cada recurso tiene un objetivo concreto y puedes implementarlo en menos de una hora.",
    kitCta: "Descargar el kit — gratis",
    whyEyebrow: "Por qué de SF", whyH2: "Construido por emprendedores", whyP1: "En Startup Factory llevamos dos años usando IA en proyectos reales — desde validar ideas hasta escalar operaciones con corporates como Mahou o Airbus.", whyP2: "Este kit es lo que usaríamos nosotros si empezáramos desde cero hoy. Sin las herramientas que no funcionan, sin la teoría que no convierte.",
    formEyebrow: "Acceso gratis", formH2: "Empieza a usar IA\n", formAccent: "esta semana.",
    formDesc: "Deja tu email y te mandamos el kit completo. También te avisaremos cuando publiquemos nuevos recursos — sin spam, solo cuando valga la pena.",
    profilePlaceholder: "¿Cuál describe mejor tu situación?",
    profiles: ["Tengo una idea y estoy empezando", "Tengo un proyecto en marcha", "Soy parte de una startup", "Trabajo en innovación en una empresa", "Soy consultor / freelance"],
    submitBtn: "Enviarme el kit gratis →", privacyNote: "Sin spam. Puedes darte de baja cuando quieras. Nos tomamos tu privacidad en serio.",
    proof: ["✓ Gratis para siempre", "✓ Sin tarjeta de crédito", "✓ Comunidad de +5.000 emprendedores"],
    nextLevelEyebrow: "Para quienes quieren más", nextLevelH2: "¿Tienes un proyecto\n", nextLevelAccent: "que construir?",
    nextLevelDesc: "El kit es el primer paso. Si tienes un proyecto concreto en el que necesitas equipo, estrategia o conexiones — cuéntanoslo. Escuchamos a todos. Elegimos a menos del 10%.",
    nextLevelItems: ["Diagnóstico de 30 min gratuito", "Propuesta personalizada si hay fit", "Conexión con el hub de emprendedores SF"],
    nextLevelCta: "Aplica a Startup Factory →",
    finalH2: "Tu competencia ya\n", finalAccent: "está usando IA.", finalDesc: "La diferencia entre los que escalan y los que se quedan atrás no es el presupuesto. Es saber qué herramientas usar y cómo usarlas. El kit es el punto de partida.",
    finalCta: "Quiero el kit gratis →",
    stats: [{ n: "6", label: "recursos en el kit" }, { n: "100%", label: "gratis para siempre" }, { n: "5.000+", label: "emprendedores en la comunidad" }],
  },
  en: {
    title: "AI for Founders | Free AI kit for entrepreneurs — Startup Factory",
    description: "Templates, agents and AI guides for entrepreneurs. No 80-hour courses. Only what works. Free download.",
    eyebrow: "AI for Founders · Startup Factory",
    h1: "The AI nobody\nin English\n", h1Accent: "is teaching you.",
    subtitle: "Templates, agents and guides for entrepreneurs who want to use AI to move faster — without 80-hour courses or empty theory.",
    subtitleNote: "Free. Updated constantly.",
    ctaPrimary: "I want the free kit →", ctaNote: "No card. No tricks. Just your email.",
    kitEyebrow: "The kit", kitH2: "6 resources you can use tomorrow",
    kitDesc: "No theory. Each resource has a concrete goal and you can implement it in under an hour.",
    kitCta: "Download the kit — free",
    whyEyebrow: "Why from SF", whyH2: "Built by entrepreneurs", whyP1: "At Startup Factory we've spent two years using AI in real projects — from validating ideas to scaling operations with corporates like Mahou or Airbus.", whyP2: "This kit is what we would use if we were starting from scratch today. Without the tools that don't work, without the theory that doesn't convert.",
    formEyebrow: "Free access", formH2: "Start using AI\n", formAccent: "this week.",
    formDesc: "Leave your email and we'll send you the complete kit. We'll also notify you when we publish new resources — no spam, only when it's worth it.",
    profilePlaceholder: "Which best describes your situation?",
    profiles: ["I have an idea and I'm starting", "I have a project underway", "I'm part of a startup", "I work in innovation at a company", "I'm a consultant / freelancer"],
    submitBtn: "Send me the free kit →", privacyNote: "No spam. You can unsubscribe whenever you want. We take your privacy seriously.",
    proof: ["✓ Free forever", "✓ No credit card", "✓ Community of 5,000+ entrepreneurs"],
    nextLevelEyebrow: "For those who want more", nextLevelH2: "Do you have a project\n", nextLevelAccent: "to build?",
    nextLevelDesc: "The kit is the first step. If you have a concrete project where you need a team, strategy or connections — tell us. We listen to everyone. We choose less than 10%.",
    nextLevelItems: ["Free 30-min diagnosis", "Personalized proposal if there's fit", "Connection to the SF entrepreneur hub"],
    nextLevelCta: "Apply to Startup Factory →",
    finalH2: "Your competition is already\n", finalAccent: "using AI.", finalDesc: "The difference between those who scale and those who fall behind isn't budget. It's knowing which tools to use and how. The kit is the starting point.",
    finalCta: "I want the free kit →",
    stats: [{ n: "6", label: "resources in the kit" }, { n: "100%", label: "free forever" }, { n: "5,000+", label: "entrepreneurs in the community" }],
  },
  th: {
    title: "AI for Founders | ชุด AI ฟรีสำหรับผู้ประกอบการ — Startup Factory",
    description: "Templates, agents และคู่มือ AI สำหรับผู้ประกอบการ ไม่มีคอร์ส 80 ชั่วโมง เฉพาะสิ่งที่ได้ผล ดาวน์โหลดฟรี",
    eyebrow: "AI for Founders · Startup Factory",
    h1: "AI ที่ไม่มีใคร\n", h1Accent: "กำลังสอนคุณ",
    subtitle: "Templates, agents และคู่มือสำหรับผู้ประกอบการที่ต้องการใช้ AI เพื่อก้าวหน้าเร็วขึ้น — ไม่มีคอร์ส 80 ชั่วโมงหรือทฤษฎีเปล่า",
    subtitleNote: "ฟรี อัปเดตต่อเนื่อง",
    ctaPrimary: "ต้องการชุด kit ฟรี →", ctaNote: "ไม่ต้องใช้บัตร ไม่มีเล่ห์เหลี่ยม แค่ email ของคุณ",
    kitEyebrow: "ชุด kit", kitH2: "6 ทรัพยากรที่คุณสามารถใช้ได้พรุ่งนี้",
    kitDesc: "ไม่มีทฤษฎี ทรัพยากรแต่ละชิ้นมีเป้าหมายที่เป็นรูปธรรมและคุณสามารถนำไปใช้ได้ในเวลาไม่ถึงหนึ่งชั่วโมง",
    kitCta: "ดาวน์โหลด kit — ฟรี",
    whyEyebrow: "ทำไมจาก SF", whyH2: "สร้างโดยผู้ประกอบการ", whyP1: "ที่ Startup Factory เราใช้ AI ในโปรเจกต์จริงมาสองปีแล้ว — ตั้งแต่การยืนยันไอเดียไปจนถึงการขยายการดำเนินงานกับองค์กรอย่าง Mahou หรือ Airbus", whyP2: "ชุด kit นี้คือสิ่งที่เราจะใช้ถ้าเริ่มจากศูนย์วันนี้ ไม่มีเครื่องมือที่ไม่ได้ผล ไม่มีทฤษฎีที่ไม่แปลงเป็นผล",
    formEyebrow: "เข้าถึงฟรี", formH2: "เริ่มใช้ AI\n", formAccent: "สัปดาห์นี้",
    formDesc: "ทิ้ง email ของคุณไว้และเราจะส่ง kit ครบชุดให้คุณ เราจะแจ้งเตือนเมื่อเผยแพร่ทรัพยากรใหม่ — ไม่มี spam เฉพาะเมื่อคุ้มค่า",
    profilePlaceholder: "สิ่งใดที่อธิบายสถานการณ์ของคุณได้ดีที่สุด?",
    profiles: ["มีไอเดียและกำลังเริ่มต้น", "มีโปรเจกต์ที่กำลังดำเนินการ", "เป็นส่วนหนึ่งของ startup", "ทำงานด้านนวัตกรรมในบริษัท", "เป็นที่ปรึกษา / freelancer"],
    submitBtn: "ส่ง kit ฟรีให้ฉัน →", privacyNote: "ไม่มี spam คุณสามารถยกเลิกการสมัครได้ตลอดเวลา เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ",
    proof: ["✓ ฟรีตลอดไป", "✓ ไม่ต้องใช้บัตรเครดิต", "✓ ชุมชนผู้ประกอบการ 5,000+ คน"],
    nextLevelEyebrow: "สำหรับผู้ที่ต้องการมากกว่า", nextLevelH2: "คุณมีโปรเจกต์\n", nextLevelAccent: "ที่ต้องการสร้างหรือ?",
    nextLevelDesc: "ชุด kit คือก้าวแรก ถ้าคุณมีโปรเจกต์ที่เป็นรูปธรรมที่ต้องการทีม กลยุทธ์ หรือการเชื่อมต่อ — บอกเราสิ เราฟังทุกคน เราเลือกน้อยกว่า 10%",
    nextLevelItems: ["วินิจฉัยฟรี 30 นาที", "ข้อเสนอเฉพาะบุคคลถ้ามี fit", "การเชื่อมต่อกับ SF entrepreneur hub"],
    nextLevelCta: "สมัครที่ Startup Factory →",
    finalH2: "คู่แข่งของคุณกำลัง\n", finalAccent: "ใช้ AI อยู่แล้ว", finalDesc: "ความแตกต่างระหว่างผู้ที่ขยายและผู้ที่ตามหลังไม่ใช่งบประมาณ แต่คือการรู้ว่าจะใช้เครื่องมือใดและอย่างไร ชุด kit คือจุดเริ่มต้น",
    finalCta: "ต้องการชุด kit ฟรี →",
    stats: [{ n: "6", label: "ทรัพยากรใน kit" }, { n: "100%", label: "ฟรีตลอดไป" }, { n: "5,000+", label: "ผู้ประกอบการในชุมชน" }],
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
      canonical: `${site}/${locale}/ai-for-founders`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/ai-for-founders`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const kitItems = [
  {
    icon: "⚡",
    title: "Agente de validación de ideas",
    desc: "Un agente IA que analiza tu idea de negocio, detecta los riesgos principales y te devuelve un informe de viabilidad en minutos.",
    tag: "Agente IA",
  },
  {
    icon: "📋",
    title: "Plantilla: Startup Audit con IA",
    desc: "La misma metodología que usamos en SF para auditar proyectos. Adaptada para que cualquier emprendedor la aplique solo.",
    tag: "Plantilla Notion",
  },
  {
    icon: "🎯",
    title: "Guía: Encuentra tu ICP en 24h con IA",
    desc: "Cómo usar IA para identificar a tu cliente ideal, entender su dolor real y construir el mensaje que convierte.",
    tag: "Guía PDF",
  },
  {
    icon: "🤖",
    title: "Agente de generación de contenido",
    desc: "Crea posts, emails y copies en tu voz — sin sonar a robot. Entrenado con los patrones de comunicación que funcionan en español.",
    tag: "Agente IA",
  },
  {
    icon: "📊",
    title: "Dashboard de métricas para early-stage",
    desc: "Conecta tus datos y visualiza lo que importa en cada fase. Sin análisis infinito, sin parálisis por datos.",
    tag: "Template",
  },
  {
    icon: "🔄",
    title: "Sistema de automatización de captación",
    desc: "El flujo completo para captar leads, cualificarlos y nutrirlos con IA — sin contratar a nadie extra.",
    tag: "Workflow",
  },
];

const reasons = [
  {
    n: "01",
    title: "Construido desde la trinchera",
    desc: "No son recursos teóricos. Los usamos en proyectos reales con startups, corporates y emprendedores. Primero funcionan, luego los compartimos.",
  },
  {
    n: "02",
    title: "En español, sin relleno",
    desc: "El 90% del contenido de IA está en inglés y lleno de teoría. Aquí todo es directo, accionable y pensado para el emprendedor hispanohablante.",
  },
  {
    n: "03",
    title: "Actualizados constantemente",
    desc: "La IA cambia cada semana. Lo que funciona hoy puede ser obsoleto en tres meses. Los miembros reciben las actualizaciones automáticamente.",
  },
];

const testimonialQuote =
  "Startup Factory no llegó como un proveedor más — llegó como parte del equipo. En meses diseñamos y ejecutamos una línea de negocio completa.";

export default async function AIforFoundersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const d = contentDict[l] ?? contentDict.es;

  return (
    <>
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-[90vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[900px] h-[700px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[15%] right-[5%] w-[500px] h-[400px] rounded-full opacity-25" />
        <div className="absolute top-20 left-[6%] w-40 h-40 rounded-full border border-white/[0.04]" />
        <div className="absolute bottom-24 right-[10%] w-28 h-28 rounded-full border border-white/[0.03]" />
        <div className="absolute top-[40%] left-[2%] w-16 h-16 rounded-full border border-white/[0.04]" />

        <div className="relative w-full max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-10 animate-fade-rise delay-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{d.eyebrow}</span>
          </div>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-8 animate-fade-rise delay-200">
            {d.h1}<span className="gradient-text">{d.h1Accent}</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-5 animate-fade-rise delay-400">
            {d.subtitle}
          </p>
          <p className="text-sm text-white/30 mb-14 animate-fade-rise delay-400">
            {d.subtitleNote}
          </p>

          {/* CTA principal */}
          <div className="animate-fade-rise delay-600">
            <a
              href="#kit"
              className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block"
            >
              {d.ctaPrimary}
            </a>
            <p className="text-xs text-white/25 mt-4">
              {d.ctaNote}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 max-w-lg mx-auto mt-20 gap-px rounded-2xl overflow-hidden border border-white/[0.06]">
            {d.stats.map((s) => (
              <div key={s.label} className="bg-white/[0.03] backdrop-blur-sm px-4 py-6 text-center">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl md:text-3xl gradient-text">{s.n}</div>
                <div className="text-xs text-white/40 mt-1.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUÉ INCLUYE EL KIT ────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute -left-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{d.kitEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em] mb-4">
              {d.kitH2}
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              {d.kitDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kitItems.map((item) => (
              <div key={item.title} className="card-dark rounded-2xl p-8 flex flex-col hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="flex items-start justify-between mb-5">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-xs font-semibold text-[#A855F7] bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 px-3 py-1 rounded-full">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-white/55 leading-relaxed flex-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA inline */}
          <div className="mt-14 text-center">
            <a href="#kit" className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-4 rounded-full text-base inline-block">
              {d.kitCta}
            </a>
          </div>
        </div>
      </section>

      {/* ─── POR QUÉ DE SF ─────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-magenta absolute right-0 top-1/3 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{d.whyEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white leading-tight tracking-[-0.02em] mb-6">
                {d.whyH2}
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-6">
                {d.whyP1}
              </p>
              <p className="text-white/40 leading-relaxed mb-8">
                {d.whyP2}
              </p>
              <div className="card-dark rounded-2xl p-6">
                <p className="text-white/80 font-semibold text-sm italic leading-relaxed mb-3">
                  &ldquo;{testimonialQuote}&rdquo;
                </p>
                <p className="text-xs text-[#A855F7] font-semibold">Natalia Aldea · Directora de Marketing, Dadybox</p>
              </div>
            </div>
            <div className="space-y-5">
              {reasons.map((r) => (
                <div key={r.n} className="card-dark rounded-2xl p-7 hover:border-[#A855F7]/60 transition-all duration-200">
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl gradient-text leading-none mb-4 opacity-30">
                    {r.n}
                  </div>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-2">{r.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FORMULARIO DE DESCARGA ────────────────────────────────────────── */}
      <section id="kit" className="relative overflow-hidden py-16 md:py-24 bg-black">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] opacity-30" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] opacity-15" />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-8 block">{d.formEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5vw,64px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {d.formH2}<span className="gradient-text">{d.formAccent}</span>
          </h2>
          <p className="text-white/45 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            {d.formDesc}
          </p>

          <div className="card-dark rounded-3xl p-8 md:p-10">
            <form
              action={`https://formspree.io/f/${FORMSPREE_ID}`}
              method="POST"
              className="space-y-4"
            >
              <input type="hidden" name="_subject" value="Kit AI for Founders — Nueva descarga" />
              <input type="hidden" name="tipo" value="ai-for-founders" />

              <div>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Tu nombre"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors text-lg"
                />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors text-lg"
                />
              </div>
              <div>
                <select
                  name="perfil"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white/70 focus:outline-none focus:border-[#A855F7]/50 transition-colors"
                >
                  <option value="" disabled className="bg-[#0D0D14]">{d.profilePlaceholder}</option>
                  {d.profiles.map((p) => (
                    <option key={p} value={p} className="bg-[#0D0D14]">{p}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-5 rounded-full text-lg mt-2"
              >
                {d.submitBtn}
              </button>

              <p className="text-xs text-white/25 pt-2">
                {d.privacyNote}
              </p>
            </form>
          </div>

          {/* Social proof bajo el form */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/30">
            {d.proof.map((p) => <span key={p}>{p}</span>)}
          </div>
        </div>
      </section>

      {/* ─── PRÓXIMO NIVEL: APLICA A SF ────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute -right-20 top-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="card-dark rounded-3xl p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 border border-[#A855F7]/20 bg-[#3D2FFF]/10 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                  <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em]">{d.nextLevelEyebrow}</span>
                </div>
                <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,44px)] text-white leading-tight tracking-[-0.02em] mb-5">
                  {d.nextLevelH2}<span className="gradient-text">{d.nextLevelAccent}</span>
                </h2>
                <p className="text-white/50 leading-relaxed mb-6">
                  {d.nextLevelDesc}
                </p>
                <ul className="space-y-2 mb-8">
                  {d.nextLevelItems.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/aplica`}
                  className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full inline-block"
                >
                  {d.nextLevelCta}
                </Link>
              </div>
              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl gradient-text mb-1">&lt;10%</div>
                  <p className="text-sm text-white/40">de proyectos aceptados — los que sí pasan, construyen algo real</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl gradient-text mb-1">30 min</div>
                  <p className="text-sm text-white/40">de diagnóstico real — no un pitch comercial</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl gradient-text mb-1">100%</div>
                  <p className="text-sm text-white/40">hecho a medida — ninguna propuesta es igual</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative bg-black overflow-hidden py-16 md:py-24">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-25" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4.5vw,60px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {d.finalH2}<span className="gradient-text">{d.finalAccent}</span>
          </h2>
          <p className="text-white/50 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            {d.finalDesc}
          </p>
          <a
            href="#kit"
            className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block"
          >
            {d.finalCta}
          </a>
        </div>
      </section>
    </>
  );
}
