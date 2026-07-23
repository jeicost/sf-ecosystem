import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";
import { PagePixels, loadPagePixels } from "@/components/PagePixels";

const site = "https://startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Growth & Marketing Partner | Tu agencia de growth + IA — Startup Factory", description: "Squad senior de growth y marketing en retainer: paid media, SEO, automatización con IA y conversión. Sin agencias. Con ownership real de tu crecimiento." },
  en: { title: "Growth & Marketing Partner | Your growth + AI agency — Startup Factory", description: "Senior growth and marketing squad on retainer: paid media, SEO, AI automation and conversion. No agencies. Real ownership of your growth." },
  th: { title: "Growth & Marketing Partner | ทีม growth + AI ของคุณ — Startup Factory", description: "ทีม growth และ marketing อาวุโสแบบ retainer: paid media, SEO, AI automation และ conversion ไม่มีเอเจนซี่ ownership จริงของการเติบโตของคุณ" },
};

const includesDict: Record<Locale, string[]> = {
  es: [
    "Squad senior dedicado (CMO + especialistas de growth)",
    "OKRs mensuales acordados y revisados contigo",
    "Paid media: Google, Meta, LinkedIn, TikTok",
    "SEO técnico + contenido + autoridad de dominio",
    "Email marketing y automatización de nurturing",
    "IA integrada: copy, creatividades y lead scoring",
    "Sistemas de captación automatizados",
    "Funnel audit y optimización de conversión continua",
    "Performance creativo: testing de creatividades semanal",
    "Reporting en tiempo real + dashboard de métricas",
  ],
  en: [
    "Dedicated senior squad (CMO + growth specialists)",
    "Monthly OKRs agreed and reviewed with you",
    "Paid media: Google, Meta, LinkedIn, TikTok",
    "Technical SEO + content + domain authority",
    "Email marketing and nurturing automation",
    "AI integrated: copy, creatives and lead scoring",
    "Automated acquisition systems",
    "Continuous funnel audit and conversion optimization",
    "Creative performance: weekly creative testing",
    "Real-time reporting + metrics dashboard",
  ],
  th: [
    "ทีม senior เฉพาะ (CMO + ผู้เชี่ยวชาญ growth)",
    "OKRs รายเดือนที่ตกลงและทบทวนร่วมกับคุณ",
    "Paid media: Google, Meta, LinkedIn, TikTok",
    "SEO เทคนิค + content + domain authority",
    "Email marketing และ nurturing automation",
    "AI บูรณาการ: copy, สื่อสร้างสรรค์ และ lead scoring",
    "ระบบ acquisition อัตโนมัติ",
    "Funnel audit และ conversion optimization อย่างต่อเนื่อง",
    "Creative performance: ทดสอบสื่อสร้างสรรค์รายสัปดาห์",
    "Reporting แบบ real-time + dashboard ตัวชี้วัด",
  ],
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string; subtitleNote: string;
  ctaPrimary: string; ctaSecondary: string;
  whyEyebrow: string; whyH2: string; whyDesc: string;
  differentials: Array<{ n: string; title: string; desc: string }>;
  includesEyebrow: string; includesH2: string; includesDesc: string;
  minLabel: string; minValue: string; minDesc: string; minCta: string;
  iaEyebrow: string; iaH2: string; iaP1: string; iaP2: string; iaCta: string;
  ctaEyebrow: string; ctaH2: string; ctaAccent: string; ctaDesc: string; ctaCta: string; ctaAlt: string;
}> = {
  es: {
    eyebrow: "Growth & Marketing Partner",
    h1: "Tu equipo de growth con IA.",
    h1Accent: "Medido en MRR, no en informes.",
    subtitle: "Un squad senior de growth se integra en tu negocio y trabaja contigo semana a semana. Paid, SEO, contenido, automatización y conversión — todo conectado, todo orientado a un solo número: tu crecimiento.",
    subtitleNote: "Tú pones el proyecto. Nosotros ponemos el equipo, la estrategia y la ejecución.",
    ctaPrimary: "Quiero mi squad de growth",
    ctaSecondary: "Diagnóstico de growth gratis",
    whyEyebrow: "La diferencia",
    whyH2: "El motor de crecimiento que le falta a tu startup",
    whyDesc: "No gestionamos canales. Construimos el sistema que hace crecer tu negocio de forma predecible.",
    differentials: [
      { n: "01", title: "Tus métricas son nuestro trabajo", desc: "No te mandamos informes de actividad. Te presentamos movimiento real en CAC, MRR y conversión. Si el número no sube, lo ponemos todo patas arriba hasta entender por qué." },
      { n: "02", title: "IA que multiplica el output sin multiplicar el equipo", desc: "Captación automatizada, contenido a escala, lead scoring en tiempo real y testing creativo acelerado. Hacemos en días lo que antes tardaba semanas." },
      { n: "03", title: "Empezamos rápido. Escalamos según lo que funciona.", desc: "Activamos los canales con más potencial para tu fase, experimentamos rápido y escalamos lo que demuestra resultados. Sin estructuras fijas, sin canales por inercia." },
    ],
    includesEyebrow: "Qué incluye",
    includesH2: "Un equipo de growth completo, en un solo retainer",
    includesDesc: "Squad senior dedicado con OKRs acordados contigo cada mes. Métricas en tiempo real. Reporting semanal con decisiones, no con datos vacíos.",
    minLabel: "Compromiso mínimo", minValue: "3 meses", minDesc: "El tiempo necesario para construir un motor de crecimiento sostenido",
    minCta: "Ver si hay fit → Diagnóstico gratis",
    iaEyebrow: "IA aplicada al growth",
    iaH2: "Más output. Menor coste por lead. Decisiones más rápidas.",
    iaP1: "Integramos IA en cada etapa del funnel: generamos contenido a escala, automatizamos la captación, cualificamos leads antes de que lleguen a ventas y aceleramos el testing creativo.",
    iaP2: "El resultado concreto: ciclos de aprendizaje más cortos, más experimentos por sprint y campañas que aprenden solas. Un equipo nuestro rinde como tres con las herramientas correctas.",
    iaCta: "Activar Growth + IA",
    ctaEyebrow: "Siguiente paso",
    ctaH2: "¿Cuánto estás dejando de crecer",
    ctaAccent: "cada mes",
    ctaDesc: "En 60 minutos analizamos tus canales, tu funnel y tu potencial real. Saldrás con claridad sobre qué mover primero — y con quién hacerlo.",
    ctaCta: "Reservar diagnóstico de growth",
    ctaAlt: "Hablemos directamente",
  },
  en: {
    eyebrow: "Growth & Marketing Partner",
    h1: "Your marketing department —",
    h1Accent: "with AI included",
    subtitle: "Senior growth and marketing squad on retainer: paid, SEO, automation, AI and conversion. We execute with real ownership.",
    subtitleNote: "No agencies sending reports. No middlemen. No juniors managing your budget.",
    ctaPrimary: "I want my growth squad",
    ctaSecondary: "Free growth diagnosis",
    whyEyebrow: "Why it works",
    whyH2: "Growth as your startup needs it",
    whyDesc: "It's not staff augmentation. It's not an agency. It's your growth team with real ownership.",
    differentials: [
      { n: "01", title: "We're not an agency", desc: "Agencies manage channels and send you a report. We take ownership of your growth: strategy, execution, testing and results — all under one roof." },
      { n: "02", title: "AI integrated in every sprint", desc: "We use AI to accelerate content generation, automate acquisition, qualify leads and analyze data in real time. It's not an add-on. It's how we work." },
      { n: "03", title: "The squad grows with you", desc: "We start with the roles you need now and scale according to results. No fixed structures or costs that don't add value." },
    ],
    includesEyebrow: "What's included",
    includesH2: "Everything you need to grow, in one retainer",
    includesDesc: "We don't subcontract. We don't delegate to juniors. A senior squad works on your project with real ownership, agreed OKRs and metrics you can see every week.",
    minLabel: "Minimum commitment", minValue: "3 months", minDesc: "The real time to see sustained and measurable results",
    minCta: "See if there's a fit → Free diagnosis",
    iaEyebrow: "AI & Automation",
    iaH2: "Your competition already uses AI. You should too.",
    iaP1: "We integrate AI tools into every part of the growth process: automated acquisition, content generation at scale, lead scoring, accelerated creative testing and predictive analysis.",
    iaP2: "The result: more output with the same team, faster learning cycles and a real advantage over competitors still working manually.",
    iaCta: "Activate Growth + AI",
    ctaEyebrow: "Next step",
    ctaH2: "How much growth are you missing",
    ctaAccent: "every month",
    ctaDesc: "In 60 minutes we analyze your situation, your channels and your potential. No commitment. Full clarity on what to do starting Monday.",
    ctaCta: "Book growth diagnosis",
    ctaAlt: "Let's talk directly",
  },
  th: {
    eyebrow: "Growth & Marketing Partner",
    h1: "แผนก marketing ของคุณ —",
    h1Accent: "พร้อม AI ในตัว",
    subtitle: "ทีม growth และ marketing อาวุโสแบบ retainer: paid, SEO, automation, AI และ conversion ดำเนินงานพร้อม ownership จริง",
    subtitleNote: "ไม่มีเอเจนซี่ส่งรายงาน ไม่มีตัวกลาง ไม่มี junior จัดการงบประมาณของคุณ",
    ctaPrimary: "ต้องการทีม growth ของฉัน",
    ctaSecondary: "วินิจฉัย growth ฟรี",
    whyEyebrow: "ทำไมถึงได้ผล",
    whyH2: "Growth แบบที่ startup ของคุณต้องการ",
    whyDesc: "ไม่ใช่ staff augmentation ไม่ใช่เอเจนซี่ คือทีม growth ของคุณพร้อม ownership จริง",
    differentials: [
      { n: "01", title: "เราไม่ใช่เอเจนซี่", desc: "เอเจนซี่จัดการช่องทางและส่งรายงานให้คุณ เรารับ ownership ของการเติบโตของคุณ: กลยุทธ์ การดำเนินการ การทดสอบ และผลลัพธ์ — ทั้งหมดในที่เดียว" },
      { n: "02", title: "AI บูรณาการในทุก sprint", desc: "เราใช้ AI เพื่อเร่งการสร้างเนื้อหา, อัตโนมัติการ acquisition, คัดกรอง leads และวิเคราะห์ข้อมูลแบบ real-time ไม่ใช่ add-on แต่เป็นวิธีที่เราทำงาน" },
      { n: "03", title: "ทีมเติบโตพร้อมคุณ", desc: "เราเริ่มต้นด้วย roles ที่คุณต้องการตอนนี้และขยายตามผลลัพธ์ ไม่มีโครงสร้างคงที่หรือค่าใช้จ่ายที่ไม่เพิ่มคุณค่า" },
    ],
    includesEyebrow: "สิ่งที่รวมอยู่",
    includesH2: "ทุกอย่างที่คุณต้องการเพื่อเติบโต ใน retainer เดียว",
    includesDesc: "เราไม่จ้างช่วง ไม่มอบหมายให้ junior ทีม senior ทำงานในโปรเจกต์ของคุณพร้อม OKRs ที่ตกลงกันและตัวชี้วัดที่คุณเห็นได้ทุกสัปดาห์",
    minLabel: "ความมุ่งมั่นขั้นต่ำ", minValue: "3 เดือน", minDesc: "เวลาจริงเพื่อเห็นผลลัพธ์ที่ยั่งยืนและวัดได้",
    minCta: "ดูว่า fit หรือไม่ → วินิจฉัยฟรี",
    iaEyebrow: "AI & Automation",
    iaH2: "คู่แข่งของคุณใช้ AI แล้ว คุณก็ควรด้วย",
    iaP1: "เราบูรณาการเครื่องมือ AI ในทุกส่วนของกระบวนการ growth: acquisition อัตโนมัติ, การสร้างเนื้อหาในระดับ scale, lead scoring, การทดสอบ creative เร่งด่วน และการวิเคราะห์เชิงพยากรณ์",
    iaP2: "ผลลัพธ์: output มากขึ้นด้วยทีมเดิม, รอบการเรียนรู้เร็วขึ้น และความได้เปรียบจริงเหนือคู่แข่งที่ยังทำงานแบบ manual",
    iaCta: "เปิดใช้ Growth + AI",
    ctaEyebrow: "ขั้นตอนต่อไป",
    ctaH2: "คุณพลาดการเติบโตไปเท่าไหร่",
    ctaAccent: "ทุกเดือน",
    ctaDesc: "ใน 60 นาทีเราวิเคราะห์สถานการณ์ ช่องทาง และศักยภาพของคุณ ไม่มีความผูกมัด ความชัดเจนเต็มรูปแบบเกี่ยวกับสิ่งที่ต้องทำตั้งแต่วันจันทร์",
    ctaCta: "จองการวินิจฉัย growth",
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
      canonical: `${site}/${locale}/growth-partner`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/growth-partner`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function GrowthPartnerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("growth-partner")["content"]?.data, l);
  const includes = includesDict[l] ?? includesDict.es;

  return (
    <>
      <PagePixels pixels={loadPagePixels("growth-partner")} />
      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black pt-24 pb-32">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[700px] h-[500px] rounded-full opacity-40" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[350px] h-[350px] rounded-full opacity-40" />
        <div className="absolute top-20 right-[15%] w-40 h-40 rounded-full border border-white/[0.04]" />
        <div className="absolute bottom-20 left-[8%] w-24 h-24 rounded-full border border-white/[0.03]" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{t.eyebrow}</span>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(40px,6vw,80px)] text-white leading-[0.95] tracking-[-0.03em] mb-6 max-w-5xl">
            {t.h1}{" "}
            <span className="gradient-text">{t.h1Accent}</span>
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-3">{t.subtitle}</p>
          <p className="max-w-xl text-sm text-white/30 leading-relaxed mb-10">{t.subtitleNote}</p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full">
              {t.ctaPrimary}
            </Link>
            <Link href={`/${locale}/aplica`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200">
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── DIFERENCIALES ─────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute -right-40 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.whyEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em] mb-4">{t.whyH2}</h2>
            <p className="text-white/55 max-w-lg mx-auto">{t.whyDesc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.differentials.map((d) => (
              <div key={d.n} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-5xl gradient-text leading-none mb-5 opacity-30">{d.n}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-3">{d.title}</h3>
                <p className="text-white/55 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUÉ INCLUYE ───────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: '#05050D' }}>
        <div className="orb-magenta absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.includesEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white leading-tight tracking-[-0.02em] mb-6">{t.includesH2}</h2>
              <p className="text-white/55 leading-relaxed mb-8">{t.includesDesc}</p>
              <div className="card-dark rounded-2xl p-6 mb-6">
                <p className="text-sm font-semibold text-[#A855F7] mb-2">{t.minLabel}</p>
                <p className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl gradient-text">{t.minValue}</p>
                <p className="text-white/40 text-sm mt-1">{t.minDesc}</p>
              </div>
              <Link href={`/${locale}/aplica`} className="inline-flex items-center gap-2 border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-6 py-3 rounded-full hover:bg-white/[0.06] transition-all duration-200 text-sm">
                {t.minCta}
              </Link>
            </div>
            <div className="space-y-2">
              {includes.map((item) => (
                <div key={item} className="card-dark flex items-center gap-3 rounded-xl px-5 py-4">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] shrink-0" />
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── IA SECTION ────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute right-0 bottom-0 w-[500px] h-[500px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] aspect-video">
              <img src="/sf-interior.jpg" alt="Startup Factory — Growth con IA" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                  <span className="text-xs font-semibold text-white/70 uppercase tracking-[0.12em]">{t.iaEyebrow}</span>
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.iaEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white leading-tight tracking-[-0.02em] mb-6">{t.iaH2}</h2>
              <p className="text-white/55 leading-relaxed mb-5">{t.iaP1}</p>
              <p className="text-white/55 leading-relaxed mb-8">{t.iaP2}</p>
              <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full inline-block">
                {t.iaCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: '#05050D' }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-30" />
        <div className="orb-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-15" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-8 block">{t.ctaEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5vw,64px)] text-white leading-tight tracking-[-0.03em] mb-6">
            {t.ctaH2}{" "}<span className="gradient-text">{t.ctaAccent}</span>?
          </h2>
          <p className="text-white/55 text-lg mb-12 max-w-xl mx-auto leading-relaxed">{t.ctaDesc}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg">
              {t.ctaCta}
            </Link>
            <Link href={`/${locale}/aplica`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-5 rounded-full hover:bg-white/[0.05] hover:border-white/25 transition-all duration-200">
              {t.ctaAlt}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
