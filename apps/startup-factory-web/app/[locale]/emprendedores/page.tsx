import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";
import { PagePixels, loadPagePixels } from "@/components/PagePixels";

const site = "https://startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Para Emprendedores | Lanzar startup, MVP, diagnóstico 1:1 — Startup Factory", description: "Si estás lanzando algo y te faltan piezas, montamos el equipo mínimo viable para avanzar rápido. Diagnóstico 1:1, plan 30/60/90 y ejecución real." },
  en: { title: "For Entrepreneurs | Launch startup, MVP, 1:1 diagnosis — Startup Factory", description: "If you're launching something and need the pieces, we build the minimum viable team to move fast. 1:1 diagnosis, 30/60/90 plan and real execution." },
  th: { title: "สำหรับผู้ประกอบการ | เปิดตัว startup, MVP, วินิจฉัย 1:1 — Startup Factory", description: "ถ้าคุณกำลังเปิดตัวบางอย่างและขาดชิ้นส่วน เราสร้างทีมขั้นต่ำที่เป็นไปได้เพื่อก้าวหน้าอย่างรวดเร็ว วินิจฉัย 1:1, แผน 30/60/90 และการดำเนินงานจริง" },
};

const stepsDict: Record<Locale, Array<{ n: string; title: string; desc: string }>> = {
  es: [
    { n: "01", title: "Diagnóstico 1:1", desc: "Sesión de 60 minutos para entender tu idea, fase y lo que necesitas para avanzar." },
    { n: "02", title: "Plan 30/60/90", desc: "Roadmap accionable con prioridades, hitos y KPIs para los próximos 3 meses." },
    { n: "03", title: "Squad mínimo viable", desc: "Montamos el equipo mínimo: los roles que realmente necesitas para lanzar." },
    { n: "04", title: "Ejecución y validación", desc: "Sprints de ejecución con entregables reales. Validamos con datos, no con opiniones." },
  ],
  en: [
    { n: "01", title: "1:1 Diagnosis", desc: "60-minute session to understand your idea, stage and what you need to move forward." },
    { n: "02", title: "30/60/90 Plan", desc: "Actionable roadmap with priorities, milestones and KPIs for the next 3 months." },
    { n: "03", title: "Minimum viable squad", desc: "We build the minimum team: the roles you really need to launch." },
    { n: "04", title: "Execution and validation", desc: "Execution sprints with real deliverables. We validate with data, not opinions." },
  ],
  th: [
    { n: "01", title: "วินิจฉัย 1:1", desc: "เซสชั่น 60 นาทีเพื่อเข้าใจไอเดีย ระยะ และสิ่งที่คุณต้องการเพื่อก้าวหน้า" },
    { n: "02", title: "แผน 30/60/90", desc: "Roadmap ที่ปฏิบัติได้จริงพร้อมลำดับความสำคัญ หมุดหมาย และ KPIs สำหรับ 3 เดือนข้างหน้า" },
    { n: "03", title: "ทีมขั้นต่ำที่เป็นไปได้", desc: "เราสร้างทีมขั้นต่ำ: บทบาทที่คุณต้องการจริงๆ เพื่อเปิดตัว" },
    { n: "04", title: "การดำเนินงานและการยืนยัน", desc: "Sprint การดำเนินงานพร้อมผลลัพธ์จริง เรายืนยันด้วยข้อมูล ไม่ใช่ความคิดเห็น" },
  ],
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string;
  ctaPrimary: string; ctaSecondary: string;
  processEyebrow: string; processH2: string;
  ctaH2: string; ctaDesc: string; ctaCta: string;
}> = {
  es: {
    eyebrow: "Para emprendedores", h1: "Lanzas algo y", h1Accent: "te faltan piezas",
    subtitle: "Montamos el equipo mínimo para avanzar rápido: desde la idea hasta el MVP con validación real. Sin atajos. Sin promesas vacías.",
    ctaPrimary: "Reservar diagnóstico 1:1", ctaSecondary: "Hablemos",
    processEyebrow: "Proceso", processH2: "Tu camino de idea a MVP",
    ctaH2: "¿En qué fase estás?", ctaDesc: "Idea, pre-MVP, MVP en validación... sea cual sea tu momento, empezamos con un diagnóstico gratuito.",
    ctaCta: "Diagnóstico 1:1 gratuito",
  },
  en: {
    eyebrow: "For entrepreneurs", h1: "You're launching something and", h1Accent: "need the pieces",
    subtitle: "We build the minimum team to move fast: from idea to MVP with real validation. No shortcuts. No empty promises.",
    ctaPrimary: "Book 1:1 diagnosis", ctaSecondary: "Let's talk",
    processEyebrow: "Process", processH2: "Your journey from idea to MVP",
    ctaH2: "What stage are you at?", ctaDesc: "Idea, pre-MVP, MVP in validation... whatever your moment, we start with a free diagnosis.",
    ctaCta: "Free 1:1 diagnosis",
  },
  th: {
    eyebrow: "สำหรับผู้ประกอบการ", h1: "คุณกำลังเปิดตัวบางอย่างและ", h1Accent: "ขาดชิ้นส่วน",
    subtitle: "เราสร้างทีมขั้นต่ำเพื่อก้าวหน้าอย่างรวดเร็ว: จากไอเดียสู่ MVP พร้อมการยืนยันจริง ไม่มีทางลัด ไม่มีคำสัญญาลมๆ แล้งๆ",
    ctaPrimary: "จองวินิจฉัย 1:1", ctaSecondary: "ติดต่อเรา",
    processEyebrow: "กระบวนการ", processH2: "เส้นทางของคุณจากไอเดียสู่ MVP",
    ctaH2: "คุณอยู่ในระยะไหน?", ctaDesc: "ไอเดีย, ก่อน MVP, MVP ในการยืนยัน... ไม่ว่าจะเป็นช่วงเวลาไหน เราเริ่มต้นด้วยการวินิจฉัยฟรี",
    ctaCta: "วินิจฉัย 1:1 ฟรี",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/emprendedores`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/emprendedores`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const painPointsDict: Record<Locale, Array<{ title: string; desc: string; tag: string }>> = {
  es: [
    { title: "Tienes la idea, falta el equipo", desc: "Sabes lo que quieres construir pero no tienes el equipo técnico, de producto o de diseño para hacerlo realidad. No quieres contratar en plantilla todavía.", tag: "Fase: Idea / Pre-MVP" },
    { title: "Tienes equipo parcial, faltan roles clave", desc: "Tu equipo tiene fortalezas claras pero le faltan piezas. Puede que tengas tech pero no growth, o producto pero no ventas. El squad completo no puede esperar.", tag: "Fase: MVP / Validación" },
    { title: "Tienes MVP, necesitas crecer", desc: "El producto funciona y tienes primeros usuarios. El reto ahora es adquisición, retención y escalado. Necesitas capacidad de ejecución, no solo consejo.", tag: "Fase: Growth" },
  ],
  en: [
    { title: "You have the idea, but no team", desc: "You know what you want to build but don't have the technical, product or design team to make it happen. You don't want to hire full-time yet.", tag: "Stage: Idea / Pre-MVP" },
    { title: "Partial team, missing key roles", desc: "Your team has clear strengths but is missing pieces. You may have tech but no growth, or product but no sales. The complete squad can't wait.", tag: "Stage: MVP / Validation" },
    { title: "You have an MVP, you need to grow", desc: "The product works and you have first users. The challenge now is acquisition, retention and scaling. You need execution capacity, not just advice.", tag: "Stage: Growth" },
  ],
  th: [
    { title: "มีไอเดีย แต่ขาดทีม", desc: "คุณรู้ว่าต้องการสร้างอะไร แต่ไม่มีทีมเทคนิค ผลิตภัณฑ์ หรือดีไซน์เพื่อทำให้เป็นจริง และยังไม่ต้องการจ้างพนักงานประจำ", tag: "ระยะ: ไอเดีย / Pre-MVP" },
    { title: "ทีมไม่ครบ ขาด roles สำคัญ", desc: "ทีมมีจุดแข็งที่ชัดเจน แต่ขาดชิ้นส่วน อาจมีด้าน tech แต่ขาด growth หรือมีผลิตภัณฑ์แต่ขาดการขาย ทีมที่สมบูรณ์ไม่สามารถรอได้", tag: "ระยะ: MVP / การยืนยัน" },
    { title: "มี MVP แล้ว ต้องการเติบโต", desc: "ผลิตภัณฑ์ทำงานได้และมีผู้ใช้แรก ความท้าทายตอนนี้คือการ acquisition, retention และการขยาย คุณต้องการความสามารถในการดำเนินงาน ไม่ใช่แค่คำแนะนำ", tag: "ระยะ: Growth" },
  ],
};

const processStepsDict: Record<Locale, Array<{ n: string; title: string; desc: string; detail: string }>> = {
  es: [
    { n: "01", title: "Diagnóstico 1:1", desc: "Sesión de 30-60 min para entender tu idea, fase, equipo actual y objetivo a 90 días. Sin formularios. Conversación directa.", detail: "Gratis · Sin compromiso" },
    { n: "02", title: "Propuesta de squad", desc: "En 48 horas te proponemos qué roles activar, con qué dedicación y a qué coste. Sólo los roles que realmente necesitas.", detail: "48 horas · Propuesta clara" },
    { n: "03", title: "Sprint 1", desc: "Arrancamos con el primer sprint de 2 semanas. Objetivos concretos, entregables definidos y primera validación con datos reales.", detail: "2 semanas · Resultados medibles" },
    { n: "04", title: "Expansión", desc: "Según los resultados del Sprint 1, decidimos juntos cómo continuar: más roles, más intensidad, más duración — o un pivot del plan.", detail: "Revisión mensual · Adaptable" },
  ],
  en: [
    { n: "01", title: "1:1 Diagnosis", desc: "30-60 min session to understand your idea, stage, current team and 90-day goal. No forms. Direct conversation.", detail: "Free · No commitment" },
    { n: "02", title: "Squad proposal", desc: "Within 48 hours we propose which roles to activate, with what dedication and at what cost. Only the roles you really need.", detail: "48 hours · Clear proposal" },
    { n: "03", title: "Sprint 1", desc: "We start the first 2-week sprint. Concrete goals, defined deliverables and first validation with real data.", detail: "2 weeks · Measurable results" },
    { n: "04", title: "Expansion", desc: "Based on Sprint 1 results, we decide together how to continue: more roles, more intensity, more duration — or a plan pivot.", detail: "Monthly review · Adaptable" },
  ],
  th: [
    { n: "01", title: "วินิจฉัย 1:1", desc: "เซสชัน 30-60 นาทีเพื่อเข้าใจไอเดีย ระยะ ทีมปัจจุบัน และเป้าหมาย 90 วัน ไม่มีแบบฟอร์ม สนทนาโดยตรง", detail: "ฟรี · ไม่มีความผูกมัด" },
    { n: "02", title: "ข้อเสนอทีม", desc: "ภายใน 48 ชั่วโมงเราเสนอ roles ที่จะเปิดใช้งาน ด้วยความทุ่มเทใดและค่าใช้จ่ายเท่าไหร่ เฉพาะ roles ที่คุณต้องการจริงๆ", detail: "48 ชั่วโมง · ข้อเสนอที่ชัดเจน" },
    { n: "03", title: "Sprint 1", desc: "เราเริ่ม sprint แรก 2 สัปดาห์ เป้าหมายที่เป็นรูปธรรม ผลลัพธ์ที่กำหนด และการยืนยันครั้งแรกด้วยข้อมูลจริง", detail: "2 สัปดาห์ · ผลลัพธ์ที่วัดได้" },
    { n: "04", title: "การขยาย", desc: "ตามผลลัพธ์ของ Sprint 1 เราตัดสินใจร่วมกันว่าจะดำเนินการต่ออย่างไร: บทบาทเพิ่มเติม ความเข้มข้นมากขึ้น ระยะเวลานานขึ้น — หรือ pivot แผน", detail: "ทบทวนรายเดือน · ปรับได้" },
  ],
};

const deliverablesDict: Record<Locale, Array<{ title: string; desc: string }>> = {
  es: [
    { title: "Roadmap validado", desc: "Plan 30/60/90 días con prioridades, hitos y KPIs. Construido contigo, no para ti." },
    { title: "MVP / POC", desc: "Producto mínimo funcional. Suficiente para validar hipótesis clave con usuarios reales." },
    { title: "Primeros usuarios", desc: "No solo el producto — ayudamos a conseguir los primeros 10, 50 o 200 usuarios según el objetivo." },
    { title: "Estrategia de ronda", desc: "Si aplica: deck, modelo financiero y preparación de conversaciones con inversores." },
  ],
  en: [
    { title: "Validated roadmap", desc: "30/60/90 day plan with priorities, milestones and KPIs. Built with you, not for you." },
    { title: "MVP / POC", desc: "Minimum functional product. Enough to validate key hypotheses with real users." },
    { title: "First users", desc: "Not just the product — we help acquire the first 10, 50 or 200 users depending on the goal." },
    { title: "Round strategy", desc: "If applicable: deck, financial model and preparation for investor conversations." },
  ],
  th: [
    { title: "Roadmap ที่ยืนยันแล้ว", desc: "แผน 30/60/90 วันพร้อมลำดับความสำคัญ หมุดหมาย และ KPIs สร้างขึ้นพร้อมคุณ ไม่ใช่เพื่อคุณ" },
    { title: "MVP / POC", desc: "ผลิตภัณฑ์ขั้นต่ำที่ใช้งานได้จริง เพียงพอที่จะยืนยัน hypotheses สำคัญกับผู้ใช้จริง" },
    { title: "ผู้ใช้แรก", desc: "ไม่ใช่แค่ผลิตภัณฑ์ — เราช่วยหาผู้ใช้ 10, 50 หรือ 200 คนแรกตามเป้าหมาย" },
    { title: "กลยุทธ์การระดมทุน", desc: "ถ้าเหมาะสม: deck, financial model และการเตรียมสนทนากับนักลงทุน" },
  ],
};

const heroDict: Record<Locale, { eyebrow: string; h1: string; h1Accent: string; subtitle: string; ctaPrimary: string; ctaSecondary: string; situationEyebrow: string; situationH2: string; processH2: string; deliverablesEyebrow: string; deliverablesH2: string; ctaFinalH2: string; ctaFinalDesc: string }> = {
  es: {
    eyebrow: "Para emprendedores",
    h1: "De la idea al MVP.", h1Accent: "Con el equipo exacto.",
    subtitle: "Montamos el squad mínimo viable para que avances rápido — desde la primera validación hasta los primeros usuarios pagando.",
    ctaPrimary: "Aplica ahora — es gratis", ctaSecondary: "Ver cómo funciona",
    situationEyebrow: "Tu situación", situationH2: "¿Cuál de estos eres tú?",
    processH2: "Cómo te ayudamos",
    deliverablesEyebrow: "Entregables", deliverablesH2: "Qué incluye trabajar con nosotros",
    ctaFinalH2: "Aplica y cuéntanos tu proyecto",
    ctaFinalDesc: "30-60 minutos para entender tu proyecto y ver si hay fit. Sin compromiso. Sin coste.",
  },
  en: {
    eyebrow: "For entrepreneurs",
    h1: "From idea to MVP.", h1Accent: "With the exact team.",
    subtitle: "We build the minimum viable squad to move fast — from first validation to first paying users.",
    ctaPrimary: "Apply now — it's free", ctaSecondary: "See how it works",
    situationEyebrow: "Your situation", situationH2: "Which one are you?",
    processH2: "How we help you",
    deliverablesEyebrow: "Deliverables", deliverablesH2: "What working with us includes",
    ctaFinalH2: "Apply and tell us about your project",
    ctaFinalDesc: "30-60 minutes to understand your project and see if there's a fit. No commitment. No cost.",
  },
  th: {
    eyebrow: "สำหรับผู้ประกอบการ",
    h1: "จากไอเดียสู่ MVP.", h1Accent: "ด้วยทีมที่แน่นอน.",
    subtitle: "เราสร้าง squad ขั้นต่ำที่เป็นไปได้เพื่อก้าวหน้าอย่างรวดเร็ว — จากการยืนยันครั้งแรกสู่ผู้ใช้ที่จ่ายเงินคนแรก",
    ctaPrimary: "สมัครเลย — ฟรี", ctaSecondary: "ดูวิธีการทำงาน",
    situationEyebrow: "สถานการณ์ของคุณ", situationH2: "คุณเป็นแบบไหน?",
    processH2: "เราช่วยคุณอย่างไร",
    deliverablesEyebrow: "ผลลัพธ์", deliverablesH2: "สิ่งที่การทำงานร่วมกับเรารวมอยู่",
    ctaFinalH2: "สมัครและบอกเล่าโปรเจกต์ของคุณ",
    ctaFinalDesc: "30-60 นาทีเพื่อเข้าใจโปรเจกต์ของคุณและดูว่ามี fit หรือไม่ ไม่มีความผูกมัด ไม่มีค่าใช้จ่าย",
  },
};

export default async function EmprendedoresPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("emprendedores")["content"]?.data, l);
  const steps = stepsDict[l] ?? stepsDict.es;
  const h = heroDict[l] ?? heroDict.es;
  const painPoints = painPointsDict[l] ?? painPointsDict.es;
  const processSteps = processStepsDict[l] ?? processStepsDict.es;
  const deliverables = deliverablesDict[l] ?? deliverablesDict.es;

  return (
    <>
      <PagePixels pixels={loadPagePixels("emprendedores")} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-black min-h-[55vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[700px] h-[500px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[300px] h-[300px] rounded-full opacity-20" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{h.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-6 max-w-4xl">
            {h.h1}{" "}<span className="gradient-text">{h.h1Accent}</span>
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-10">
            {h.subtitle}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full">
              {h.ctaPrimary}
            </Link>
            <Link href={`/${locale}/aplica#como-funciona`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.06] transition-all duration-200">
              {h.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Tu situación — pain points */}
      <section className="relative bg-black py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{h.situationEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em]">{h.situationH2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {painPoints.map((p) => (
              <div key={p.title} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full mb-5">
                  {p.tag}
                </span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-3">{p.title}</h3>
                <p className="text-white/55 leading-relaxed text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="relative py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.processEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em]">{h.processH2}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {processSteps.map((s) => (
              <div key={s.n} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-5xl gradient-text opacity-30 leading-none mb-5">{s.n}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-2">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-4">{s.desc}</p>
                <span className="text-xs text-[#A855F7] font-semibold">{s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entregables */}
      <section className="relative bg-black py-24">
        <div className="orb-magenta absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{h.deliverablesEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em]">{h.deliverablesH2}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {deliverables.map((d) => (
              <div key={d.title} className="card-dark rounded-2xl p-8 flex items-start gap-5 hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3D2FFF]/20 to-[#A855F7]/10 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#3D2FFF] to-[#A855F7]" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-2">{d.title}</h3>
                  <p className="text-white/55 leading-relaxed text-sm">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-25" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white mb-4 tracking-[-0.02em]">{h.ctaFinalH2}</h2>
          <p className="text-white/55 text-lg mb-10 max-w-lg mx-auto">{h.ctaFinalDesc}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
              {h.ctaPrimary}
            </Link>
            <Link href={`/${locale}/aplica#como-funciona`} className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-10 py-5 rounded-full text-lg hover:bg-white/[0.05] transition-all duration-200 inline-block">
              {h.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
