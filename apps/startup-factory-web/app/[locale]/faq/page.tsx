import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";

const site = "https://www.startupsfactory.es";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "FAQ · Preguntas frecuentes | Startup Factory",
    description: "Resolvemos las dudas más habituales sobre cómo trabajamos, el modelo Team as a Service, el proceso de selección y el modelo Venture.",
    alternates: {
      canonical: `${site}/${locale}/faq`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/faq`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const dict = await getDictionary(l);
  const t = dict.home;

  const extraFaqsDict: Record<Locale, Array<{ q: string; a: string }>> = {
    es: [
      { q: "¿En cuánto tiempo empezamos a trabajar juntos?", a: "En menos de una semana desde que hay acuerdo. El diagnóstico tarda entre 30 y 60 minutos. Si hay fit, la propuesta llega en 48h y el squad puede estar operativo en 5–7 días." },
      { q: "¿Qué pasa si el proyecto cambia de dirección?", a: "El squad se adapta. Esa es exactamente la ventaja del modelo modular — no hay contratos rígidos ni estructuras fijas. Ajustamos roles, dedicación y foco en cada sprint." },
      { q: "¿Podéis trabajar con nuestro equipo interno?", a: "Sí, es lo habitual. Actuamos como extensión o refuerzo del equipo existente, no como sustitutos. Definimos interfaces de trabajo claras desde el primer día." },
      { q: "¿Dónde operáis?", a: "Principalmente en España y Bangkok, pero trabajamos en remoto con proyectos de cualquier país. Tenemos experiencia con equipos distribuidos en múltiples zonas horarias." },
      { q: "¿Qué métricas reportáis?", a: "Depende del proyecto, pero siempre con KPIs definidos desde el diagnóstico. Reporting semanal con avances, bloqueos y decisiones. Sin filtros — lo bueno y lo malo." },
      { q: "¿Cómo funciona el modelo cash + equity?", a: "Solo cuando hay fit claro: potencial real, equipo comprometido y ventaja construible rápido. Lo evaluamos en el diagnóstico. No es la norma — es la excepción para proyectos con los que queremos co-construir." },
    ],
    en: [
      { q: "How quickly do we start working together?", a: "In less than a week from agreement. The diagnosis takes 30 to 60 minutes. If there is fit, the proposal arrives in 48h and the squad can be operational in 5–7 days." },
      { q: "What happens if the project changes direction?", a: "The squad adapts. That is exactly the advantage of the modular model — no rigid contracts, no fixed structures. We adjust roles, dedication and focus in each sprint." },
      { q: "Can you work with our internal team?", a: "Yes, that is the usual approach. We act as an extension or reinforcement of the existing team, not a replacement. We define clear working interfaces from day one." },
      { q: "Where do you operate?", a: "Primarily in Spain and Bangkok, but we work remotely with projects from any country. We have experience with distributed teams across multiple time zones." },
      { q: "What metrics do you report?", a: "It depends on the project, but always with KPIs defined from the diagnosis. Weekly reporting with progress, blockers and decisions. No filters — the good and the bad." },
      { q: "How does the cash + equity model work?", a: "Only when there is clear fit: real potential, committed team and a competitive advantage that can be built fast. We evaluate this in the diagnosis. It is not the norm — it is the exception for projects we want to co-build." },
    ],
    th: [
      { q: "เราเริ่มทำงานด้วยกันได้เร็วแค่ไหน?", a: "ภายในหนึ่งสัปดาห์จากการตกลง การวินิจฉัยใช้เวลา 30 ถึง 60 นาที ถ้ามี fit ข้อเสนอจะมาใน 48 ชม. และ squad สามารถ active ได้ใน 5–7 วัน" },
      { q: "จะเกิดอะไรขึ้นถ้าโปรเจกต์เปลี่ยนทิศทาง?", a: "Squad จะปรับตัว นั่นคือข้อได้เปรียบของโมเดล modular — ไม่มีสัญญาที่เข้มงวด ไม่มีโครงสร้างคงที่ เราปรับ roles ความทุ่มเท และโฟกัสในแต่ละ sprint" },
      { q: "คุณสามารถทำงานกับทีมภายในของเราได้ไหม?", a: "ได้ นั่นคือวิธีการปกติ เราทำหน้าที่เป็นส่วนขยายหรือกำลังเสริมของทีมที่มีอยู่ ไม่ใช่การทดแทน เรากำหนด interfaces การทำงานที่ชัดเจนตั้งแต่วันแรก" },
      { q: "คุณดำเนินงานที่ไหน?", a: "หลักๆ ในสเปนและ Bangkok แต่เราทำงานจากระยะไกลกับโปรเจกต์จากทุกประเทศ เรามีประสบการณ์กับทีมที่กระจายตัวในหลาย time zones" },
      { q: "คุณรายงาน metrics อะไรบ้าง?", a: "ขึ้นอยู่กับโปรเจกต์ แต่เสมอพร้อม KPIs ที่กำหนดตั้งแต่การวินิจฉัย รายงานรายสัปดาห์พร้อมความคืบหน้า อุปสรรค และการตัดสินใจ ไม่มีการกรอง — ดีและแย่" },
      { q: "โมเดล cash + equity ทำงานอย่างไร?", a: "เฉพาะเมื่อมี fit ที่ชัดเจน: ศักยภาพจริง ทีมที่มุ่งมั่น และความได้เปรียบในการแข่งขันที่สร้างได้เร็ว เราประเมินสิ่งนี้ในการวินิจฉัย ไม่ใช่มาตรฐาน — เป็นข้อยกเว้นสำหรับโปรเจกต์ที่เราต้องการร่วมสร้าง" },
    ],
  };

  const faqCtaDict: Record<Locale, { notFound: string; tellUs: string; cta1: string; cta2: string }> = {
    es: { notFound: "¿No encuentras respuesta a tu pregunta?", tellUs: "Cuéntanos tu caso directamente", cta1: "Solicitar sesión gratuita", cta2: "Escribirnos" },
    en: { notFound: "Can't find an answer to your question?", tellUs: "Tell us your case directly", cta1: "Request free session", cta2: "Write to us" },
    th: { notFound: "หาคำตอบสำหรับคำถามของคุณไม่เจอ?", tellUs: "บอกเล่ากรณีของคุณโดยตรง", cta1: "ขอเซสชันฟรี", cta2: "ส่งข้อความถึงเรา" },
  };

  const faqHeroDict: Record<Locale, { eyebrow: string; h1: string; h1Accent: string; desc: string }> = {
    es: { eyebrow: "FAQ", h1: "Preguntas\n", h1Accent: "frecuentes", desc: "Todo lo que necesitas saber antes de dar el paso. Si no encuentras tu respuesta, escríbenos directamente." },
    en: { eyebrow: "FAQ", h1: "Frequently\n", h1Accent: "asked questions", desc: "Everything you need to know before taking the step. If you can't find your answer, write to us directly." },
    th: { eyebrow: "FAQ", h1: "คำถาม\n", h1Accent: "ที่พบบ่อย", desc: "ทุกสิ่งที่คุณต้องรู้ก่อนก้าวต่อไป ถ้าหาคำตอบไม่เจอ ส่งข้อความถึงเราโดยตรง" },
  };

  const cms = loadCmsSections("faq");
  const fh = mergeCms(faqHeroDict[l] ?? faqHeroDict.es, cms["hero"]?.data, l);
  const fc = mergeCms(faqCtaDict[l] ?? faqCtaDict.es, cms["cta"]?.data, l);
  const extraFaqs = (cms["extra-faqs"]?.data?.[`items_${l}`] ??
    cms["extra-faqs"]?.data?.["items_en"] ??
    (extraFaqsDict[l] ?? extraFaqsDict.es)) as Array<{ q: string; a: string }>;
  const faqItems = (cms["faq"]?.data?.[`items_${l}`] ??
    cms["faq"]?.data?.["items_en"] ??
    t.faq.items) as typeof t.faq.items;

  const allFaqs = [...faqItems, ...extraFaqs];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.a },
    })),
  };

  const categories = [
    { label: "Modelo y proceso", ids: [0, 1, 2] },
    { label: "Equipo y operativa", ids: [3, 4, 5, 6] },
    { label: "Venture y modelo financiero", ids: [7, 8] },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="relative bg-black pt-24 pb-16 overflow-hidden">
        <div className="orb-purple absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[400px] opacity-15" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.2em] mb-5 block">{fh.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(40px,5vw,64px)] text-white leading-[0.95] tracking-[-0.03em] mb-5">
            {fh.h1}<span className="gradient-text">{fh.h1Accent}</span>
          </h1>
          <p className="text-white/45 text-lg leading-relaxed max-w-xl mx-auto">
            {fh.desc}
          </p>
        </div>
      </section>

      {/* FAQ items */}
      <section className="relative bg-black pb-24 overflow-hidden" style={{background: '#05050D'}}>
        <div className="orb-magenta absolute right-0 top-1/3 w-[400px] h-[400px] opacity-10" />
        <div className="relative max-w-3xl mx-auto px-6">

          <div className="divide-y divide-white/[0.06]">
            {allFaqs.map((faq, i) => (
              <div key={i} className="py-8 group">
                <div className="flex items-start gap-5">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black gradient-text text-lg leading-none mt-1 min-w-[2rem] opacity-40 group-hover:opacity-80 transition-opacity">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3 leading-snug">
                      {faq.q}
                    </h2>
                    <p className="text-white/55 leading-relaxed text-sm md:text-base">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div className="mt-16 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
            <p className="text-white/50 text-sm mb-2">{fc.notFound}</p>
            <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-xl mb-6">
              {fc.tellUs}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/${locale}/aplica`}
                className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-7 py-3.5 rounded-full text-sm"
              >
                {fc.cta1}
              </Link>
              <Link
                href={`/${locale}/contacto`}
                className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-white/[0.05] transition-all"
              >
                {fc.cta2}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
