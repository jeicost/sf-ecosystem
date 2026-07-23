import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://startupsfactory.es";
const CALENDLY_URL = "https://calendly.com/jacostech";

const dicts: Record<Locale, {
  metaTitle: string; metaDesc: string;
  badge: string; h1: string; h1Accent: string;
  sub: string; sub2: string;
  step1Title: string; step1Desc: string; step1Time: string;
  step2Title: string; step2Desc: string; step2Time: string;
  step3Title: string; step3Desc: string; step3Time: string;
  ctaLabel: string; ctaNote: string;
  resourcesLabel: string;
  res1Label: string; res1Desc: string;
  res2Label: string; res2Desc: string;
  res3Label: string; res3Desc: string;
}> = {
  es: {
    metaTitle: 'Has pasado | Bienvenido a Startup Factory',
    metaDesc: 'Felicidades. Tu proyecto ha pasado el filtro de SF. Estos son los próximos pasos.',
    badge: 'Has pasado el filtro',
    h1: 'Bienvenido', h1Accent: 'a Startup Factory.',
    sub: 'Tu proyecto ha llamado la atención del equipo. Formas parte del menos del 10% que avanza en el proceso de selección.',
    sub2: 'El equipo de SF ha revisado tu caso y ha visto potencial real. Ahora viene lo importante.',
    step1Title: 'El equipo estudia tu informe', step1Desc: 'En las próximas 48 horas, el equipo de SF revisa el informe completo de tu sesión de diagnóstico. Lo leen entero. Lo analizan con criterio.', step1Time: '48 horas',
    step2Title: 'Preparamos tu propuesta', step2Desc: 'Diseñamos el plan 30/60/90 + el squad exacto + el presupuesto específico para tu proyecto. No es una plantilla — es tuya.', step2Time: '2-3 días',
    step3Title: 'Primera sesión con SF', step3Desc: 'Te contactamos para agendar una primera sesión con el equipo. Te presentamos la propuesta y resolvemos cualquier duda.', step3Time: 'Esta semana',
    ctaLabel: 'Agendar primera sesión con SF →', ctaNote: 'También nos ponemos en contacto contigo en menos de 48h',
    resourcesLabel: 'Mientras tanto, explora',
    res1Label: 'Kit AI for Founders', res1Desc: 'Recursos de IA para founders. Empieza a aplicarlo hoy.',
    res2Label: 'Startup Audit', res2Desc: 'Las 7 áreas clave que todo proyecto necesita revisar.',
    res3Label: 'SF Community', res3Desc: 'El hub de fundadores, recursos y conexiones de SF.',
  },
  en: {
    metaTitle: 'You passed | Welcome to Startup Factory',
    metaDesc: 'Congratulations. Your project passed the SF filter. Here are the next steps.',
    badge: 'You passed the filter',
    h1: 'Welcome', h1Accent: 'to Startup Factory.',
    sub: 'Your project caught the team\'s attention. You\'re part of the less than 10% that advances in the selection process.',
    sub2: 'The SF team has reviewed your case and seen real potential. Now comes the important part.',
    step1Title: 'The team reviews your report', step1Desc: 'In the next 48 hours, the SF team reviews the full report from your diagnostic session. They read it entirely. They analyze it with judgment.', step1Time: '48 hours',
    step2Title: 'We prepare your proposal', step2Desc: 'We design the 30/60/90-day plan + the exact squad + the specific budget for your project. It\'s not a template — it\'s yours.', step2Time: '2-3 days',
    step3Title: 'First session with SF', step3Desc: 'We contact you to schedule a first session with the team. We present the proposal and resolve any questions.', step3Time: 'This week',
    ctaLabel: 'Schedule first session with SF →', ctaNote: 'We\'ll also reach out to you within 48h',
    resourcesLabel: 'Meanwhile, explore',
    res1Label: 'AI for Founders Kit', res1Desc: 'AI resources for founders. Start applying it today.',
    res2Label: 'Startup Audit', res2Desc: 'The 7 key areas every project needs to review.',
    res3Label: 'SF Community', res3Desc: 'The hub for founders, resources and SF connections.',
  },
  th: {
    metaTitle: 'คุณผ่านแล้ว | ยินดีต้อนรับสู่ Startup Factory',
    metaDesc: 'ขอแสดงความยินดี โครงการของคุณผ่านตัวกรอง SF แล้ว นี่คือขั้นตอนต่อไป',
    badge: 'คุณผ่านตัวกรองแล้ว',
    h1: 'ยินดีต้อนรับ', h1Accent: 'สู่ Startup Factory',
    sub: 'โครงการของคุณได้รับความสนใจจากทีม คุณเป็นส่วนหนึ่งของน้อยกว่า 10% ที่ก้าวหน้าในกระบวนการคัดเลือก',
    sub2: 'ทีม SF ได้ตรวจสอบกรณีของคุณและเห็นศักยภาพจริง ตอนนี้คือสิ่งสำคัญ',
    step1Title: 'ทีมศึกษารายงานของคุณ', step1Desc: 'ใน 48 ชั่วโมงข้างหน้า ทีม SF จะตรวจสอบรายงานทั้งหมดจากเซสชั่นการวินิจฉัยของคุณ', step1Time: '48 ชั่วโมง',
    step2Title: 'เราเตรียมข้อเสนอของคุณ', step2Desc: 'เราออกแบบแผน 30/60/90 วัน + ทีมที่แน่นอน + งบประมาณสำหรับโครงการของคุณ', step2Time: '2-3 วัน',
    step3Title: 'เซสชั่นแรกกับ SF', step3Desc: 'เราติดต่อคุณเพื่อนัดหมายเซสชั่นแรกกับทีม เราจะนำเสนอข้อเสนอและตอบคำถาม', step3Time: 'สัปดาห์นี้',
    ctaLabel: 'นัดหมายเซสชั่นแรกกับ SF →', ctaNote: 'เราจะติดต่อคุณภายใน 48 ชั่วโมง',
    resourcesLabel: 'ในระหว่างนี้ สำรวจ',
    res1Label: 'AI for Founders Kit', res1Desc: 'ทรัพยากร AI สำหรับ founders เริ่มใช้งานได้เลย',
    res2Label: 'Startup Audit', res2Desc: '7 พื้นที่หลักที่ทุกโครงการต้องตรวจสอบ',
    res3Label: 'SF Community', res3Desc: 'ฮับสำหรับ founders ทรัพยากรและการเชื่อมต่อ SF',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = dicts[locale as Locale] ?? dicts.es;
  return {
    title: d.metaTitle,
    description: d.metaDesc,
    alternates: { canonical: `${site}/${locale}/bienvenido`, languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/bienvenido`])) },
    robots: { index: false },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}


export default async function BienvenidoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = dicts[locale as Locale] ?? dicts.es;
  const steps = [
    { n: "01", title: t.step1Title, desc: t.step1Desc, timeline: t.step1Time },
    { n: "02", title: t.step2Title, desc: t.step2Desc, timeline: t.step2Time },
    { n: "03", title: t.step3Title, desc: t.step3Desc, timeline: t.step3Time },
  ];
  const resources = [
    { href: "/ai-for-founders", label: t.res1Label, desc: t.res1Desc },
    { href: "/startup-audit",   label: t.res2Label, desc: t.res2Desc },
    { href: "/comunidad",       label: t.res3Label, desc: t.res3Desc },
  ];
  return (
    <>
      <section className="relative overflow-hidden bg-black min-h-screen flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full opacity-35" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[500px] h-[400px] rounded-full opacity-25" />
        <div className="absolute top-20 left-[6%] w-40 h-40 rounded-full border border-white/[0.04]" />
        <div className="absolute bottom-20 right-[10%] w-28 h-28 rounded-full border border-white/[0.03]" />

        <div className="relative w-full max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#3D2FFF]/20 to-[#A855F7]/10 border border-[#A855F7]/30 rounded-full px-6 py-2.5 mb-10 animate-fade-rise delay-0">
            <span className="w-2 h-2 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-sm font-semibold text-[#A855F7] tracking-wide">{t.badge}</span>
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(48px,8vw,96px)] text-white leading-[0.92] tracking-[-0.03em] mb-8 animate-fade-rise delay-200">
            {t.h1}<br />
            <span className="gradient-text">{t.h1Accent}</span>
          </h1>

          <p className="text-xl text-white/60 leading-relaxed max-w-2xl mx-auto mb-6 animate-fade-rise delay-400">
            {t.sub}
          </p>
          <p className="text-white/40 max-w-xl mx-auto mb-16 animate-fade-rise delay-400">{t.sub2}</p>

          {/* Pasos */}
          <div className="text-left space-y-4 mb-12">
            {steps.map((s, i) => (
              <div key={s.n} className={`card-dark rounded-2xl p-7 flex gap-6 items-start ${i === 0 ? "border-[#A855F7]/25" : ""}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] flex items-center justify-center shrink-0">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black text-sm text-white">{s.n}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white">{s.title}</h3>
                    <span className="text-xs font-semibold text-[#A855F7] bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 px-3 py-1 rounded-full">{s.timeline}</span>
                  </div>
                  <p className="text-white/45 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA principal */}
          <div className="card-dark rounded-3xl p-8 mb-10 text-center">
            <p className="text-white/60 text-sm mb-4">¿Prefieres agendar tú directamente la primera sesión con el equipo?</p>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
              className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-4 rounded-full text-base inline-block">
              {t.ctaLabel}
            </a>
            <p className="text-xs text-white/25 mt-3">{t.ctaNote}</p>
          </div>

          {/* Recursos mientras esperas */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.12em] mb-5">{t.resourcesLabel}</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {resources.map((r) => (
                <Link
                  key={r.href}
                  href={`/${locale}${r.href}`}
                  className="card-dark rounded-xl p-5 text-left hover:border-[#A855F7]/30 transition-colors"
                >
                  <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm text-white mb-1">{r.label}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{r.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
