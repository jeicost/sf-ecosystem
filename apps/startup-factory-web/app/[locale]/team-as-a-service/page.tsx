import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: {
    title: "Team as a Service | Equipo por horas para ejecutar proyectos",
    description: "Squad modular con Fractional CEO/CMO/CTO, producto, diseño y dev. Sprints con entregables y métricas. Contratación por horas, por sprint o retainer.",
  },
  en: {
    title: "Team as a Service | Modular team to execute projects",
    description: "Modular squad with Fractional CEO/CMO/CTO, product, design and dev. Sprints with deliverables and metrics. Hire by hours, sprint or retainer.",
  },
  th: {
    title: "Team as a Service | ทีมแบบโมดูลสำหรับดำเนินโปรเจกต์",
    description: "ทีมแบบโมดูลพร้อม Fractional CEO/CMO/CTO, ผลิตภัณฑ์, ดีไซน์ และ dev. Sprints พร้อมผลลัพธ์และตัวชี้วัด จ้างรายชั่วโมง sprint หรือ retainer",
  },
};

const formatsDict: Record<Locale, Array<{ name: string; tag: string; desc: string; details: string[]; highlight?: boolean }>> = {
  es: [
    { name: "Por horas", tag: "Puntual", desc: "Necesidades específicas o acompañamiento experto. Pagas exactamente lo que usas.", details: ["Mínimo 4h/semana por rol", "Arranque en 48-72h", "Sin permanencia"] },
    { name: "Por sprint", tag: "4–8 semanas", desc: "MVP, POC, growth sprint, lanzamiento. Objetivo claro → entregable concreto.", details: ["Duración: 4 a 8 semanas", "Entregable definido al inicio", "Revisión semanal"], highlight: true },
    { name: "Retainer mensual", tag: "Growth Partner", desc: "Continuidad, escalado y mejora sostenida. El squad crece contigo.", details: ["Mínimo 3 meses", "Roles ajustables cada mes", "Reporting y OKRs"] },
    { name: "Cash + equity", tag: "Venture", desc: "Si hay fit y queremos entrar como partners. Co-construimos y co-invertimos.", details: ["Análisis previo de fit", "Acuerdo de equity participativo", "Full commitment"] },
  ],
  en: [
    { name: "By hours", tag: "Punctual", desc: "Specific needs or expert accompaniment. You pay exactly what you use.", details: ["Minimum 4h/week per role", "Start in 48-72h", "No lock-in"] },
    { name: "By sprint", tag: "4–8 weeks", desc: "MVP, POC, growth sprint, launch. Clear objective → concrete deliverable.", details: ["Duration: 4 to 8 weeks", "Deliverable defined upfront", "Weekly review"], highlight: true },
    { name: "Monthly retainer", tag: "Growth Partner", desc: "Continuity, scaling and sustained improvement. The squad grows with you.", details: ["Minimum 3 months", "Adjustable roles each month", "Reporting and OKRs"] },
    { name: "Cash + equity", tag: "Venture", desc: "If there is fit and we want to enter as partners. We co-build and co-invest.", details: ["Prior fit analysis", "Participatory equity agreement", "Full commitment"] },
  ],
  th: [
    { name: "รายชั่วโมง", tag: "เฉพาะกิจ", desc: "ความต้องการเฉพาะหรือผู้เชี่ยวชาญ คุณจ่ายเฉพาะสิ่งที่ใช้", details: ["ขั้นต่ำ 4 ชม./สัปดาห์ต่อบทบาท", "เริ่มใน 48-72 ชม.", "ไม่มีสัญญาระยะยาว"] },
    { name: "ต่อ Sprint", tag: "4–8 สัปดาห์", desc: "MVP, POC, growth sprint, เปิดตัว เป้าหมายชัดเจน → ผลลัพธ์ที่เป็นรูปธรรม", details: ["ระยะเวลา: 4 ถึง 8 สัปดาห์", "ผลลัพธ์กำหนดตั้งแต่ต้น", "ทบทวนรายสัปดาห์"], highlight: true },
    { name: "Retainer รายเดือน", tag: "Growth Partner", desc: "ความต่อเนื่อง การขยาย และการพัฒนาที่ยั่งยืน ทีมเติบโตพร้อมคุณ", details: ["ขั้นต่ำ 3 เดือน", "ปรับบทบาทได้ทุกเดือน", "รายงานและ OKRs"] },
    { name: "Cash + equity", tag: "Venture", desc: "ถ้ามี fit และต้องการเข้าเป็นพาร์ทเนอร์ เราร่วมสร้างและร่วมลงทุน", details: ["วิเคราะห์ fit ก่อน", "ข้อตกลง equity แบบมีส่วนร่วม", "Full commitment"] },
  ],
};

const deliverablesDict: Record<Locale, string[]> = {
  es: ["Roadmap 30/60/90 + KPIs", "MVP / POC funcional", "Growth experiments", "Dashboards de negocio", "Deck para ronda", "Pilotos corporates", "Estrategia de partnerships", "Arquitectura técnica"],
  en: ["30/60/90 Roadmap + KPIs", "Functional MVP / POC", "Growth experiments", "Business dashboards", "Fundraising deck", "Corporate pilots", "Partnership strategy", "Technical architecture"],
  th: ["Roadmap 30/60/90 + KPIs", "MVP / POC ที่ใช้งานได้", "การทดลอง Growth", "Dashboards ธุรกิจ", "Deck สำหรับการระดมทุน", "Pilots องค์กร", "กลยุทธ์ partnerships", "สถาปัตยกรรมเทคนิค"],
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; h1End: string; subtitle: string;
  ctaPrimary: string; ctaSecondary: string; processEyebrow: string; processH2: string;
  steps: Array<{ n: string; title: string; desc: string }>;
  formatsEyebrow: string; formatsH2: string; formatsSubtitle: string;
  outputEyebrow: string; outputH2: string; outputDesc: string; outputCta: string;
  faqH2: string; faqQ: string; faqA: string;
  ctaFinalH2: string; ctaFinalDesc: string; ctaFinal: string;
}> = {
  es: {
    eyebrow: "Team as a Service",
    h1: "El equipo que necesitas,",
    h1Accent: "listo para ejecutar",
    h1End: "desde el primer sprint.",
    subtitle: "Tienes el proyecto. Sabes lo que quieres conseguir. Lo que te falta es el equipo que lo haga realidad — sin esperar meses a contratarlo, sin gestionar freelancers dispersos, sin renunciar a la velocidad.",
    ctaPrimary: "Solicitar squad", ctaSecondary: "Diagnóstico gratuito",
    processEyebrow: "Así funciona", processH2: "Empezamos a ejecutar en días, no en meses",
    steps: [
      { n: "01", title: "Entendemos tu proyecto a fondo", desc: "Una sesión de diagnóstico real. Tu objetivo, tu fase, tus constraints. Salimos con el roadmap 30/60/90, los KPIs que importan y el squad exacto para llegar — sin roles de relleno." },
      { n: "02", title: "Activamos el squad en días", desc: "Los perfiles correctos con la dedicación exacta. Nada de procesos de selección que duran meses. El primer sprint empieza cuando tú quieres." },
      { n: "03", title: "Cada semana, algo concreto", desc: "Reporting semanal con decisiones, no con datos vacíos. Lo que funciona se escala. Lo que no, se ajusta. El squad evoluciona según los resultados reales — no según un contrato fijo." },
    ],
    formatsEyebrow: "¿Cómo quieres trabajar?", formatsH2: "El formato que encaja con tu momento", formatsSubtitle: "Desde un sprint de 4 semanas para validar hasta un partnership de largo recorrido.",
    outputEyebrow: "Lo que producimos juntos", outputH2: "Entregables que el lunes siguiente ya se usan",
    outputDesc: "No análisis que se archivan. Cosas concretas que tu negocio puede poner en marcha desde el primer día: MVPs que se pueden testear, decks que convencen, sistemas que captan. Trabajo real, medible.",
    outputCta: "Solicitar propuesta",
    faqH2: "¿No es lo mismo que staff augmentation?", faqQ: "", faqA: "No. El staff augmentation manda perfiles — tú los gestionas, tú asumes el riesgo. Nosotros diseñamos el squad, marcamos los objetivos, dirigimos la ejecución y respondemos por los resultados. No es subcontratación: es tu equipo externo con accountability real.",
    ctaFinalH2: "¿Cuándo quieres empezar?", ctaFinalDesc: "Cuéntanos el proyecto. En 48h tienes propuesta de squad, formato y plan de ejecución. La semana que viene podemos estar en el primer sprint.",
    ctaFinal: "Hablemos de tu proyecto",
  },
  en: {
    eyebrow: "Main service", h1: "Team as a Service:", h1Accent: "your team", h1End: "modular, to execute projects",
    subtitle: "We build the squad you need and get it working with clear deliverables. No filler profiles. No bureaucracy.",
    ctaPrimary: "Request squad", ctaSecondary: "Free diagnosis",
    processEyebrow: "Process", processH2: "How we work",
    steps: [
      { n: "01", title: "Diagnosis and 30/60/90 plan", desc: "We define objective, KPIs, scope and priorities. We leave with an actionable roadmap." },
      { n: "02", title: "Modular squad", desc: "We select the exact roles with optimal dedication. We set up working rituals." },
      { n: "03", title: "Sprints + deliverables + reporting", desc: "We execute, measure and make fast decisions. Total transparency every week." },
    ],
    formatsEyebrow: "Formats", formatsH2: "Collaboration formats", formatsSubtitle: "Choose the model that fits your stage and need.",
    outputEyebrow: "Output", outputH2: "Typical deliverables",
    outputDesc: "Not endless documents. Concrete, measurable and actionable deliverables that take your project to the next level.",
    outputCta: "Request proposal",
    faqH2: "Is this staff augmentation?", faqQ: "", faqA: "We don't 'send profiles'. We design the squad, direct it toward concrete deliverables and metrics, and we are responsible for the result — not just the hours. The difference is total.",
    ctaFinalH2: "Ready to build your squad?", ctaFinalDesc: "Tell us about your project. In 48h we present a squad and plan proposal.",
    ctaFinal: "Let's talk about your project",
  },
  th: {
    eyebrow: "บริการหลัก", h1: "Team as a Service:", h1Accent: "ทีมของคุณ", h1End: "แบบโมดูลสำหรับดำเนินโปรเจกต์",
    subtitle: "เราสร้างทีมที่คุณต้องการและทำให้มันทำงานพร้อมผลลัพธ์ที่ชัดเจน ไม่มีบทบาทที่ไม่จำเป็น ไม่มีระบบราชการ",
    ctaPrimary: "ขอทีม", ctaSecondary: "วินิจฉัยฟรี",
    processEyebrow: "กระบวนการ", processH2: "วิธีการทำงาน",
    steps: [
      { n: "01", title: "วินิจฉัยและแผน 30/60/90", desc: "เรากำหนดเป้าหมาย KPIs ขอบเขต และลำดับความสำคัญ ออกมาพร้อม roadmap ที่ปฏิบัติได้จริง" },
      { n: "02", title: "ทีมแบบโมดูล", desc: "เราเลือกบทบาทที่แน่ชัดพร้อมความทุ่มเทที่เหมาะสม ตั้งค่าพิธีกรรมการทำงาน" },
      { n: "03", title: "Sprints + ผลลัพธ์ + รายงาน", desc: "เราดำเนินการ วัดผล และตัดสินใจรวดเร็ว ความโปร่งใสทั้งหมดทุกสัปดาห์" },
    ],
    formatsEyebrow: "รูปแบบ", formatsH2: "รูปแบบการร่วมมือ", formatsSubtitle: "เลือกรูปแบบที่เหมาะกับระยะและความต้องการของคุณ",
    outputEyebrow: "ผลลัพธ์", outputH2: "ผลลัพธ์ทั่วไป",
    outputDesc: "ไม่ใช่เอกสารไม่สิ้นสุด ผลลัพธ์ที่เป็นรูปธรรม วัดได้ และปฏิบัติได้ที่นำโปรเจกต์ของคุณไปสู่ระดับต่อไป",
    outputCta: "ขอข้อเสนอ",
    faqH2: "นี่คือ staff augmentation หรือเปล่า?", faqQ: "", faqA: "เราไม่ 'ส่งโปรไฟล์' เราออกแบบทีม นำทีมไปสู่ผลลัพธ์และตัวชี้วัดที่เป็นรูปธรรม และเราต้องรับผิดชอบต่อผลลัพธ์ — ไม่ใช่แค่ชั่วโมง ความแตกต่างคือทั้งหมด",
    ctaFinalH2: "พร้อมที่จะสร้างทีมของคุณแล้วหรือ?", ctaFinalDesc: "บอกเล่าโปรเจกต์ของคุณ ใน 48 ชม. เราจะนำเสนอข้อเสนอทีมและแผน",
    ctaFinal: "คุยเรื่องโปรเจกต์ของคุณ",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `${site}/${locale}/team-as-a-service`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/team-as-a-service`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function TeamAsAServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("team-as-a-service")["content"]?.data, l);
  const formats = formatsDict[l] ?? formatsDict.es;
  const deliverables = deliverablesDict[l] ?? deliverablesDict.es;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-black min-h-[50vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[300px] h-[300px] rounded-full opacity-20" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">
            {t.eyebrow}
          </span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-6 max-w-4xl">
            {t.h1}{" "}
            <span className="gradient-text">{t.h1Accent}</span>{" "}
            {t.h1End}
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-10">
            {t.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full hover:scale-[1.02] transition-transform">
              {t.ctaPrimary}
            </Link>
            <Link href={`/${locale}/aplica`} className="border border-white/10 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:border-white/30 transition-colors duration-150">
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="relative bg-black py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">
              {t.processEyebrow}
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl text-white">
              {t.processH2}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.steps.map((s) => (
              <div key={s.n} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/20 hover:scale-[1.02] transition-all duration-150">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-6xl text-[#A855F7]/20 leading-none mb-4">{s.n}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-3">{s.title}</h3>
                <p className="text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMATOS */}
      <section className="relative py-24" style={{ background: "#05050D" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">
              {t.formatsEyebrow}
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl text-white">
              {t.formatsH2}
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">{t.formatsSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {formats.map((f) => (
              <div
                key={f.name}
                className={`rounded-2xl p-8 flex flex-col transition-all duration-150 ${f.highlight ? "bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] border border-[#A855F7]/30" : "card-dark hover:border-[#A855F7]/20"}`}
              >
                <span className={`text-xs font-semibold px-3 py-1 rounded-full self-start mb-6 ${f.highlight ? "bg-white/20 text-white" : "bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7]"}`}>
                  {f.tag}
                </span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-black text-xl mb-3 text-white">{f.name}</h3>
                <p className={`text-sm leading-relaxed flex-1 mb-6 ${f.highlight ? "text-white/80" : "text-white/50"}`}>{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.details.map((d) => (
                    <li key={d} className={`text-xs flex items-center gap-2 ${f.highlight ? "text-white/70" : "text-white/50"}`}>
                      <span className={`w-1 h-1 rounded-full shrink-0 ${f.highlight ? "bg-white/50" : "bg-[#A855F7]"}`} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENTREGABLES */}
      <section className="relative bg-black py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.outputEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl text-white leading-tight mb-6">{t.outputH2}</h2>
              <p className="text-white/50 leading-relaxed mb-8">{t.outputDesc}</p>
              <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full inline-block">
                {t.outputCta}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {deliverables.map((d) => (
                <div key={d} className="flex items-center gap-3 card-dark rounded-xl p-4">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7] shrink-0" />
                  <span className="text-sm text-white">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24" style={{ background: "#05050D" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl text-white">{t.faqH2}</h2>
          </div>
          <div className="card-dark rounded-2xl p-8">
            <p className="text-white text-lg font-semibold mb-3">{locale === 'es' ? 'No.' : locale === 'en' ? 'No.' : 'ไม่'}</p>
            <p className="text-white/50 leading-relaxed">{t.faqA}</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white mb-6 tracking-[-0.02em]">{t.ctaFinalH2}</h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">{t.ctaFinalDesc}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
            {t.ctaFinal}
          </Link>
        </div>
      </section>
    </>
  );
}
