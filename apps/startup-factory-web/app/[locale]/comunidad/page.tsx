import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://startupsfactory.es";
const FORMSPREE_ID = "xnjwnydg";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "SF Community | El hub de emprendedores de Startup Factory", description: "Emprendedores, startups, CTOs, inversores y corporates en un mismo espacio. Conexiones reales para hacer avanzar proyectos reales." },
  en: { title: "SF Community | The Startup Factory entrepreneur hub", description: "Entrepreneurs, startups, CTOs, investors and corporates in one space. Real connections to advance real projects." },
  th: { title: "SF Community | ศูนย์รวมผู้ประกอบการของ Startup Factory", description: "ผู้ประกอบการ startup CTO นักลงทุน และองค์กรในพื้นที่เดียว การเชื่อมต่อจริงเพื่อก้าวหน้าโปรเจกต์จริง" },
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string; subtitleNote: string;
  ctaPrimary: string; ctaSecondary: string;
  whoEyebrow: string; whoH2: string;
  processEyebrow: string; processH2: string; processDesc: string;
  formEyebrow: string; formH2: string; formAccent: string; formDesc: string;
  formNote: string; joinBtn: string;
  bridgeP1: string; bridgeP2: string; bridgeCta: string;
  stats: Array<{ n: string; label: string }>;
  whoIsHere: Array<{ role: string; icon: string; desc: string }>;
  howItWorks: Array<{ n: string; title: string; desc: string }>;
}> = {
  es: {
    eyebrow: "SF Community · Hub de emprendedores",
    h1: "El emprendedor correcto.\n", h1Accent: "En el momento correcto.",
    subtitle: "Emprendedores, fundadores, CTOs, expertos en IA y corporates en un mismo ecosistema. Conexiones reales, con criterio. No es un directorio — es matching activo.",
    subtitleNote: "Gestionado por el equipo de SF. +5.000 personas en la comunidad.",
    ctaPrimary: "Unirme a la comunidad", ctaSecondary: "Tengo un proyecto → Aplica",
    whoEyebrow: "La red", whoH2: "¿Quién está dentro?",
    processEyebrow: "El proceso", processH2: "No es una red social.\nEs matching activo.", processDesc: "SF no conecta a cualquiera con cualquiera. Cuando vemos una conexión con sentido, hacemos la intro nosotros.",
    formEyebrow: "Únete", formH2: "Empieza a conectar\n", formAccent: "con quien importa.",
    formDesc: "Deja tu email y cuéntanos en dos palabras qué buscas o qué puedes aportar. El equipo de SF lo revisará.",
    formNote: "El equipo de SF revisa cada solicitud. Respondemos en 48h.",
    joinBtn: "Solicitar acceso a la comunidad →",
    bridgeP1: "¿Tienes un proyecto concreto y buscas equipo de ejecución?", bridgeP2: "La comunidad es el primer paso. Aplica si quieres que SF trabaje contigo de verdad.",
    bridgeCta: "Aplica a Startup Factory →",
    stats: [{ n: "+5.000", label: "personas en la red" }, { n: "6", label: "tipos de perfil" }, { n: "activo", label: "matching por SF" }],
    whoIsHere: [
      { role: "Emprendedores", icon: "🚀", desc: "Con una idea o en fase early. Buscando validación, equipo o su primer cliente." },
      { role: "Fundadores de startup", icon: "⚡", desc: "Con producto y tracción. Buscando crecer, captar o escalar sin contratar." },
      { role: "CTOs y tech leads", icon: "💻", desc: "Disponibles para proyectos part-time o como co-founders técnicos." },
      { role: "Expertos en Growth / IA", icon: "📈", desc: "Especialistas en adquisición, automatización y marketing que colaboran con proyectos." },
      { role: "Inversores y angels", icon: "💰", desc: "Conectados al ecosistema de SF. Invierten en proyectos con fit real." },
      { role: "Corporates con retos", icon: "🏢", desc: "Empresas que buscan startups para resolver problemas reales. Innovación abierta." },
    ],
    howItWorks: [
      { n: "01", title: "Te unes a la comunidad", desc: "Dejas tu email y tu perfil. Contamos quién eres y qué necesitas o puedes aportar." },
      { n: "02", title: "SF analiza el fit", desc: "El equipo revisa perfiles activamente para hacer conexiones con sentido. No es un directorio — es matching real." },
      { n: "03", title: "Conexión directa", desc: "Te presentamos a quien puede complementarte. Una intro, un contexto, una razón concreta para conectar." },
    ],
  },
  en: {
    eyebrow: "SF Community · Entrepreneur hub",
    h1: "The right entrepreneur.\n", h1Accent: "At the right time.",
    subtitle: "Entrepreneurs, founders, CTOs, AI experts and corporates in one ecosystem. Real connections, with criteria. Not a directory — active matching.",
    subtitleNote: "Managed by the SF team. 5,000+ people in the community.",
    ctaPrimary: "Join the community", ctaSecondary: "I have a project → Apply",
    whoEyebrow: "The network", whoH2: "Who is inside?",
    processEyebrow: "The process", processH2: "Not a social network.\nActive matching.", processDesc: "SF doesn't connect just anyone with anyone. When we see a connection that makes sense, we make the intro ourselves.",
    formEyebrow: "Join", formH2: "Start connecting\n", formAccent: "with who matters.",
    formDesc: "Leave your email and tell us briefly what you're looking for or what you can contribute. The SF team will review it.",
    formNote: "The SF team reviews each request. We respond in 48h.",
    joinBtn: "Request community access →",
    bridgeP1: "Do you have a concrete project and are looking for an execution team?", bridgeP2: "The community is the first step. Apply if you want SF to really work with you.",
    bridgeCta: "Apply to Startup Factory →",
    stats: [{ n: "+5,000", label: "people in the network" }, { n: "6", label: "profile types" }, { n: "active", label: "matching by SF" }],
    whoIsHere: [
      { role: "Entrepreneurs", icon: "🚀", desc: "With an idea or in early stage. Looking for validation, a team or their first client." },
      { role: "Startup founders", icon: "⚡", desc: "With product and traction. Looking to grow, raise or scale without hiring." },
      { role: "CTOs and tech leads", icon: "💻", desc: "Available for part-time projects or as technical co-founders." },
      { role: "Growth / AI experts", icon: "📈", desc: "Specialists in acquisition, automation and marketing who collaborate with projects." },
      { role: "Investors and angels", icon: "💰", desc: "Connected to the SF ecosystem. They invest in projects with real fit." },
      { role: "Corporates with challenges", icon: "🏢", desc: "Companies looking for startups to solve real problems. Open innovation." },
    ],
    howItWorks: [
      { n: "01", title: "You join the community", desc: "You leave your email and profile. We note who you are and what you need or can contribute." },
      { n: "02", title: "SF analyzes fit", desc: "The team actively reviews profiles to make meaningful connections. Not a directory — real matching." },
      { n: "03", title: "Direct connection", desc: "We introduce you to who can complement you. An intro, context, a concrete reason to connect." },
    ],
  },
  th: {
    eyebrow: "SF Community · ศูนย์รวมผู้ประกอบการ",
    h1: "ผู้ประกอบการที่ถูกต้อง\n", h1Accent: "ในเวลาที่ถูกต้อง",
    subtitle: "ผู้ประกอบการ founders CTOs ผู้เชี่ยวชาญ AI และองค์กรในระบบนิเวศเดียว การเชื่อมต่อจริงพร้อมเกณฑ์ ไม่ใช่ directory แต่คือ matching ที่ active",
    subtitleNote: "จัดการโดยทีม SF มากกว่า 5,000 คนในชุมชน",
    ctaPrimary: "เข้าร่วมชุมชน", ctaSecondary: "มีโปรเจกต์ → สมัคร",
    whoEyebrow: "เครือข่าย", whoH2: "ใครอยู่ข้างใน?",
    processEyebrow: "กระบวนการ", processH2: "ไม่ใช่เครือข่ายสังคม\nแต่คือ matching ที่ active", processDesc: "SF ไม่เชื่อมต่อใครก็ได้กับใครก็ได้ เมื่อเราเห็นการเชื่อมต่อที่มีความหมาย เราทำการแนะนำเอง",
    formEyebrow: "เข้าร่วม", formH2: "เริ่มเชื่อมต่อ\n", formAccent: "กับคนที่สำคัญ",
    formDesc: "ทิ้ง email ของคุณและบอกเล่าสั้นๆ ว่าคุณกำลังมองหาอะไรหรือสามารถมีส่วนร่วมอะไรได้บ้าง ทีม SF จะตรวจสอบ",
    formNote: "ทีม SF ตรวจสอบแต่ละคำขอ เราตอบกลับใน 48 ชม.",
    joinBtn: "ขอเข้าถึงชุมชน →",
    bridgeP1: "คุณมีโปรเจกต์ที่เป็นรูปธรรมและกำลังมองหาทีมดำเนินงานหรือ?", bridgeP2: "ชุมชนคือก้าวแรก สมัครถ้าคุณต้องการให้ SF ทำงานกับคุณจริงๆ",
    bridgeCta: "สมัครที่ Startup Factory →",
    stats: [{ n: "+5,000", label: "คนในเครือข่าย" }, { n: "6", label: "ประเภทโปรไฟล์" }, { n: "active", label: "matching โดย SF" }],
    whoIsHere: [
      { role: "ผู้ประกอบการ", icon: "🚀", desc: "มีไอเดียหรืออยู่ในระยะ early กำลังมองหาการยืนยัน ทีม หรือลูกค้าแรก" },
      { role: "Founders ของ startup", icon: "⚡", desc: "มีผลิตภัณฑ์และ traction กำลังมองหาการเติบโต การระดมทุน หรือการขยายโดยไม่จ้างงาน" },
      { role: "CTOs และ tech leads", icon: "💻", desc: "พร้อมสำหรับโปรเจกต์ part-time หรือในฐานะ co-founders ด้านเทคนิค" },
      { role: "ผู้เชี่ยวชาญ Growth / AI", icon: "📈", desc: "ผู้เชี่ยวชาญด้าน acquisition, automation และ marketing ที่ร่วมมือกับโปรเจกต์" },
      { role: "นักลงทุนและ angels", icon: "💰", desc: "เชื่อมต่อกับ ecosystem ของ SF ลงทุนในโปรเจกต์ที่มี fit จริง" },
      { role: "องค์กรที่มีความท้าทาย", icon: "🏢", desc: "บริษัทที่มองหา startup เพื่อแก้ปัญหาจริง นวัตกรรมแบบเปิด" },
    ],
    howItWorks: [
      { n: "01", title: "คุณเข้าร่วมชุมชน", desc: "คุณทิ้ง email และโปรไฟล์ เราบันทึกว่าคุณเป็นใครและต้องการหรือสามารถมีส่วนร่วมอะไรได้บ้าง" },
      { n: "02", title: "SF วิเคราะห์ fit", desc: "ทีมตรวจสอบโปรไฟล์อย่าง active เพื่อสร้างการเชื่อมต่อที่มีความหมาย ไม่ใช่ directory แต่คือ matching จริง" },
      { n: "03", title: "การเชื่อมต่อโดยตรง", desc: "เราแนะนำคุณกับผู้ที่สามารถเสริมได้ การแนะนำ บริบท เหตุผลที่เป็นรูปธรรมเพื่อเชื่อมต่อ" },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: `${site}/${locale}/comunidad`, languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/comunidad`])) },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ComunidadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = contentDict[l] ?? contentDict.es;
  const whoIsHere = t.whoIsHere;
  const howItWorks = t.howItWorks;
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-black min-h-[88vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[900px] h-[700px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[18%] right-[4%] w-[450px] h-[350px] rounded-full opacity-25" />
        <div className="absolute top-20 left-[5%] w-40 h-40 rounded-full border border-white/[0.04]" />
        <div className="absolute bottom-16 right-[12%] w-24 h-24 rounded-full border border-white/[0.03]" />

        <div className="relative w-full max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-10 animate-fade-rise delay-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{t.eyebrow}</span>
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-8 animate-fade-rise delay-200">
            {t.h1}<span className="gradient-text">{t.h1Accent}</span>
          </h1>

          <p className="text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-5 animate-fade-rise delay-400">
            {t.subtitle}
          </p>
          <p className="text-sm text-white/30 mb-14 animate-fade-rise delay-400">
            {t.subtitleNote}
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-fade-rise delay-600">
            <a href="#unete" className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg">
              {t.ctaPrimary}
            </a>
            <Link href={`/${locale}/aplica`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-5 rounded-full hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200">
              {t.ctaSecondary}
            </Link>
          </div>

          <div className="grid grid-cols-3 max-w-lg mx-auto mt-20 gap-px rounded-2xl overflow-hidden border border-white/[0.06]">
            {t.stats.map((s) => (
              <div key={s.label} className="bg-white/[0.03] backdrop-blur-sm px-4 py-6 text-center">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl gradient-text">{s.n}</div>
                <div className="text-xs text-white/40 mt-1.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUIÉN ESTÁ */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute -left-20 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.whoEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">
              {t.whoH2}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whoIsHere.map((p) => (
              <div key={p.role} className="card-dark rounded-2xl p-7 hover:border-[#A855F7]/60 transition-all duration-200">
                <span className="text-3xl mb-4 block">{p.icon}</span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{p.role}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA EL MATCHING */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-magenta absolute right-0 bottom-1/4 w-[350px] h-[350px] opacity-15" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.processEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em] mb-4">
              {t.processH2}
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">
              {t.processDesc}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {howItWorks.map((s) => (
              <div key={s.n} className="card-dark rounded-2xl p-8 text-center hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-5xl gradient-text opacity-25 leading-none mb-5">{s.n}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULARIO */}
      <section id="unete" className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-25" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-8 block">{t.formEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,5vw,60px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {t.formH2}<span className="gradient-text">{t.formAccent}</span>
          </h2>
          <p className="text-white/45 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            {t.formDesc}
          </p>
          <div className="card-dark rounded-3xl p-8 md:p-10">
            <form action={`https://formspree.io/f/${FORMSPREE_ID}`} method="POST" className="space-y-4">
              <input type="hidden" name="_subject" value="SF Community — Nueva solicitud de acceso" />
              <input type="hidden" name="tipo" value="comunidad" />
              <input type="hidden" name="_next" value={`https://startupsfactory.es/${locale}/bienvenido`} />
              <div className="grid sm:grid-cols-2 gap-4">
                <input type="text" name="nombre" required placeholder="Tu nombre"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors" />
                <input type="email" name="email" required placeholder="tu@email.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors" />
              </div>
              <select name="perfil" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white/70 focus:outline-none focus:border-[#A855F7]/50 transition-colors">
                <option value="" disabled className="bg-[#0D0D14]">{l === 'en' ? 'What is your profile?' : l === 'th' ? 'โปรไฟล์ของคุณคืออะไร?' : '¿Cuál es tu perfil?'}</option>
                {t.whoIsHere.map((p) => (
                  <option key={p.role} value={p.role} className="bg-[#0D0D14]">{p.role}</option>
                ))}
              </select>
              <textarea name="busco" rows={3} placeholder={l === 'en' ? 'What are you looking for or what can you contribute? (2-3 sentences)' : l === 'th' ? 'คุณกำลังมองหาอะไรหรือสามารถมีส่วนร่วมอะไรได้บ้าง? (2-3 ประโยค)' : '¿Qué buscas o qué puedes aportar? (2-3 frases)'}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-[#A855F7]/50 transition-colors resize-none" />
              <button type="submit" className="w-full btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-4 rounded-full text-base">
                {t.joinBtn}
              </button>
              <p className="text-xs text-white/25 pt-1">{t.formNote}</p>
            </form>
          </div>
        </div>
      </section>

      {/* BRIDGE APLICA */}
      <section className="relative bg-black py-24 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <p className="text-white/40 mb-2 text-sm">{t.bridgeP1}</p>
          <p className="text-white/25 mb-6 text-xs">{t.bridgeP2}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full inline-block">
            {t.bridgeCta}
          </Link>
        </div>
      </section>
    </>
  );
}
