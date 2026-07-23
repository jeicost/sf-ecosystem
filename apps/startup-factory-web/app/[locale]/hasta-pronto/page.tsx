import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://startupsfactory.es";

const dicts: Record<Locale, {
  metaTitle: string; metaDesc: string;
  badge: string; h1: string; h1Accent: string; sub: string; sub2: string;
  improvementsLabel: string;
  imp1Area: string; imp1Desc: string;
  imp2Area: string; imp2Desc: string;
  imp3Area: string; imp3Desc: string;
  imp4Area: string; imp4Desc: string;
  resourcesLabel: string;
  res1Label: string; res1Tag: string; res1Desc: string;
  res2Label: string; res2Tag: string; res2Desc: string;
  res3Label: string; res3Tag: string; res3Desc: string;
  whenReadyTitle: string; whenReadyDesc: string; whenReadyNote: string;
  finalNote: string; finalCta: string;
}> = {
  es: {
    metaTitle: 'Hasta pronto | Tu hoja de ruta — Startup Factory',
    metaDesc: 'Tu proyecto no ha pasado el filtro de SF de momento. Aquí tienes el feedback y los pasos para volver cuando estés listo.',
    badge: 'Startup Factory · Feedback del equipo',
    h1: 'Enhorabuena por compartir', h1Accent: 'tu proyecto con el equipo.',
    sub: 'El equipo ha revisado tu caso con atención y valoramos lo que estás construyendo. Ahora mismo no es el momento exacto para avanzar juntos — pero te enviamos el feedback con los puntos concretos en los que trabajar para que lo sea.',
    sub2: 'Cuando hayas trabajado esas áreas, queremos que vuelvas. Las puertas siguen abiertas.',
    improvementsLabel: 'Los puntos en los que trabajar antes de volver',
    imp1Area: 'Claridad del problema', imp1Desc: 'Antes de hablar de solución, asegúrate de que puedes describir el dolor de tu cliente en una frase que ellos mismos reconocerían como suya.',
    imp2Area: 'Validación real', imp2Desc: 'Un MVP no tiene que ser perfecto. Tiene que ser suficiente para que alguien pague o use. Busca tus primeros 10 clientes antes de construir más.',
    imp3Area: 'Métricas y tracción', imp3Desc: 'Los datos mandan. Instrumenta lo básico ahora: cuántas personas entran, cuántas se quedan, cuántas pagan. Sin eso, todo es intuición.',
    imp4Area: 'Equipo o socios', imp4Desc: 'Los proyectos unipersonales son más difíciles de escalar. Piensa quién necesitas a tu lado y empieza a construir esas relaciones.',
    resourcesLabel: 'Lo que SF puede darte ahora',
    res1Label: 'Startup Audit', res1Tag: 'Plantilla gratuita', res1Desc: 'Analiza tu proyecto en 7 días con la metodología que usamos en SF.',
    res2Label: 'AI for Founders', res2Tag: 'Kit gratuito', res2Desc: 'Herramientas de IA para avanzar más rápido con los recursos que tienes.',
    res3Label: 'SF Community', res3Tag: 'Red de contactos', res3Desc: 'Conéctate con otros emprendedores que pueden complementarte.',
    whenReadyTitle: 'Cuando estés listo, vuelve a contactarnos',
    whenReadyDesc: 'No hay plazo fijo. Lo que importa es el avance real. Cuando hayas trabajado los puntos del feedback y tengas algo concreto que mostrar, escríbenos de nuevo. Evaluaremos desde cero, sin prejuicios.',
    whenReadyNote: 'Muchos proyectos que hoy trabajan con SF empezaron exactamente aquí.',
    finalNote: 'Estaremos aquí cuando sea el momento.',
    finalCta: 'Volver a aplicar →',
  },
  en: {
    metaTitle: 'See you soon | Your roadmap — Startup Factory',
    metaDesc: 'Your project didn\'t pass the SF filter for now. Here\'s the feedback and steps to come back when you\'re ready.',
    badge: 'Startup Factory · Team feedback',
    h1: 'Congratulations for sharing', h1Accent: 'your project with the team.',
    sub: 'The team carefully reviewed your case and we value what you\'re building. Right now isn\'t the exact moment to move forward together — but we\'re sending you feedback with the specific points to work on to make it happen.',
    sub2: 'When you\'ve worked on those areas, we want you to come back. The doors remain open.',
    improvementsLabel: 'The points to work on before returning',
    imp1Area: 'Problem clarity', imp1Desc: 'Before talking about solutions, make sure you can describe your customer\'s pain in a sentence they themselves would recognize.',
    imp2Area: 'Real validation', imp2Desc: 'An MVP doesn\'t have to be perfect. It needs to be enough for someone to pay or use. Find your first 10 customers before building more.',
    imp3Area: 'Metrics and traction', imp3Desc: 'Data rules. Instrument the basics now: how many people enter, how many stay, how many pay. Without that, everything is intuition.',
    imp4Area: 'Team or partners', imp4Desc: 'Single-person projects are harder to scale. Think about who you need by your side and start building those relationships.',
    resourcesLabel: 'What SF can give you now',
    res1Label: 'Startup Audit', res1Tag: 'Free template', res1Desc: 'Analyze your project in 7 days with the methodology we use at SF.',
    res2Label: 'AI for Founders', res2Tag: 'Free kit', res2Desc: 'AI tools to move faster with the resources you have.',
    res3Label: 'SF Community', res3Tag: 'Contact network', res3Desc: 'Connect with other entrepreneurs who can complement you.',
    whenReadyTitle: 'When you\'re ready, come back and contact us',
    whenReadyDesc: 'There\'s no fixed deadline. What matters is real progress. When you\'ve worked on the feedback points and have something concrete to show, write to us again. We\'ll evaluate from scratch, without prejudice.',
    whenReadyNote: 'Many projects working with SF today started exactly here.',
    finalNote: 'We\'ll be here when the time comes.',
    finalCta: 'Apply again →',
  },
  th: {
    metaTitle: 'แล้วพบกันใหม่ | แผนการของคุณ — Startup Factory',
    metaDesc: 'โครงการของคุณยังไม่ผ่านตัวกรอง SF ในตอนนี้ นี่คือ feedback และขั้นตอนในการกลับมาเมื่อคุณพร้อม',
    badge: 'Startup Factory · Feedback จากทีม',
    h1: 'ขอบคุณที่แบ่งปัน', h1Accent: 'โครงการของคุณกับทีม',
    sub: 'ทีมได้ตรวจสอบกรณีของคุณอย่างรอบคอบ ขณะนี้ยังไม่ใช่เวลาที่เหมาะสมในการก้าวหน้าร่วมกัน แต่เราส่ง feedback พร้อมจุดที่ต้องทำงาน',
    sub2: 'เมื่อคุณทำงานในพื้นที่เหล่านั้นแล้ว เราอยากให้คุณกลับมา ประตูยังเปิดอยู่',
    improvementsLabel: 'จุดที่ต้องทำงานก่อนกลับมา',
    imp1Area: 'ความชัดเจนของปัญหา', imp1Desc: 'ก่อนพูดถึงวิธีแก้ปัญหา ตรวจสอบให้แน่ใจว่าคุณสามารถอธิบายความเจ็บปวดของลูกค้าในประโยคเดียว',
    imp2Area: 'การตรวจสอบความเป็นจริง', imp2Desc: 'MVP ไม่ต้องสมบูรณ์แบบ แค่ต้องพอให้คนจ่ายเงินหรือใช้งานได้ หาลูกค้า 10 รายแรกก่อนสร้างเพิ่ม',
    imp3Area: 'ตัวชี้วัดและ traction', imp3Desc: 'ข้อมูลคือกุญแจ วัดพื้นฐาน: คนเข้ามากี่คน อยู่กี่คน จ่ายเงินกี่คน',
    imp4Area: 'ทีมหรือหุ้นส่วน', imp4Desc: 'โครงการคนเดียวขยายยากกว่า คิดถึงคนที่คุณต้องการข้างๆ และเริ่มสร้างความสัมพันธ์',
    resourcesLabel: 'สิ่งที่ SF มอบให้คุณตอนนี้',
    res1Label: 'Startup Audit', res1Tag: 'แม่แบบฟรี', res1Desc: 'วิเคราะห์โครงการของคุณใน 7 วันด้วยวิธีการที่เราใช้ใน SF',
    res2Label: 'AI for Founders', res2Tag: 'ชุดเครื่องมือฟรี', res2Desc: 'เครื่องมือ AI เพื่อก้าวหน้าเร็วขึ้นด้วยทรัพยากรที่คุณมี',
    res3Label: 'SF Community', res3Tag: 'เครือข่ายผู้ติดต่อ', res3Desc: 'เชื่อมต่อกับผู้ประกอบการอื่นๆ ที่สามารถเสริมสร้างซึ่งกันและกัน',
    whenReadyTitle: 'เมื่อคุณพร้อม กลับมาติดต่อเรา',
    whenReadyDesc: 'ไม่มีกำหนดเวลาตายตัว สิ่งที่สำคัญคือความก้าวหน้าจริง เมื่อทำงานในจุดที่ได้รับ feedback แล้ว เขียนหาเราอีกครั้ง',
    whenReadyNote: 'หลายโครงการที่ทำงานกับ SF วันนี้เริ่มต้นที่นี่',
    finalNote: 'เราจะอยู่ที่นี่เมื่อถึงเวลา',
    finalCta: 'สมัครอีกครั้ง →',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const d = dicts[locale as Locale] ?? dicts.es;
  return {
    title: d.metaTitle,
    description: d.metaDesc,
    alternates: { canonical: `${site}/${locale}/hasta-pronto`, languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/hasta-pronto`])) },
    robots: { index: false },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}


export default async function HastaProntoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = dicts[locale as Locale] ?? dicts.es;
  const improvements = [
    { area: t.imp1Area, desc: t.imp1Desc },
    { area: t.imp2Area, desc: t.imp2Desc },
    { area: t.imp3Area, desc: t.imp3Desc },
    { area: t.imp4Area, desc: t.imp4Desc },
  ];
  const resources = [
    { href: "/startup-audit",   label: t.res1Label, tag: t.res1Tag, desc: t.res1Desc },
    { href: "/ai-for-founders", label: t.res2Label, tag: t.res2Tag, desc: t.res2Desc },
    { href: "/comunidad",       label: t.res3Label, tag: t.res3Tag, desc: t.res3Desc },
  ];
  return (
    <>
      <section className="relative overflow-hidden bg-black min-h-screen flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-20" />
        <div className="orb-magenta absolute top-[15%] right-[8%] w-[350px] h-[350px] rounded-full opacity-20" />
        <div className="absolute top-20 left-[5%] w-32 h-32 rounded-full border border-white/[0.04]" />

        <div className="relative w-full max-w-4xl mx-auto px-6 pt-24 pb-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#A855F7]/20 rounded-full px-5 py-2 bg-[#A855F7]/[0.05] backdrop-blur-sm mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]/60" />
            <span className="text-xs font-semibold text-[#A855F7]/70 uppercase tracking-[0.15em]">{t.badge}</span>
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5.5vw,72px)] text-white leading-[0.95] tracking-[-0.03em] mb-6">
            {t.h1}<br />
            <span className="gradient-text">{t.h1Accent}</span>
          </h1>

          <p className="text-xl text-white/55 leading-relaxed max-w-2xl mb-5">{t.sub}</p>
          <p className="text-white/35 max-w-xl mb-16 leading-relaxed">{t.sub2}</p>

          {/* Áreas de mejora */}
          <div className="mb-16">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-8 block">{t.improvementsLabel}</span>
            <div className="grid sm:grid-cols-2 gap-4">
              {improvements.map((item) => (
                <div key={item.area} className="card-dark rounded-2xl p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] shrink-0" />
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white">{item.area}</h3>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lo que SF puede darte ahora */}
          <div className="card-dark rounded-3xl p-8 mb-12">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.resourcesLabel}</span>
            <div className="grid sm:grid-cols-3 gap-4">
              {resources.map((r) => (
                <Link
                  key={r.href}
                  href={`/${locale}${r.href}`}
                  className="group rounded-xl p-5 border border-white/[0.06] hover:border-[#A855F7]/30 transition-colors bg-white/[0.02]"
                >
                  <span className="text-xs font-semibold text-[#A855F7] bg-[#3D2FFF]/10 border border-[#3D2FFF]/15 px-2.5 py-1 rounded-full inline-block mb-3">{r.tag}</span>
                  <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-sm text-white mb-1">{r.label}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{r.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Cuándo volver */}
          <div className="border border-[#A855F7]/15 bg-[#A855F7]/[0.03] rounded-2xl p-8 mb-10">
            <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3">{t.whenReadyTitle}</h3>
            <p className="text-white/45 leading-relaxed mb-4">{t.whenReadyDesc}</p>
            <p className="text-white/30 text-sm">{t.whenReadyNote}</p>
          </div>

          {/* CTA final */}
          <div className="text-center">
            <p className="text-white/40 mb-6">{t.finalNote}</p>
            <Link href={`/${locale}/aplica`}
              className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-4 rounded-full inline-block">
              {t.finalCta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
