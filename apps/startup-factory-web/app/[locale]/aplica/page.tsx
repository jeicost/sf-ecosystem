import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";
const CALENDLY_URL = "https://calendly.com/jacostech";
const FORMSPREE_ID = "xnjwnydg";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Aplica a Startup Factory | Menos del 10% pasan",
    description: "Cuéntanos tu proyecto. Escuchamos a todos. Aceptamos a menos del 10%. Si vemos fit, diseñamos una propuesta a tu medida con el equipo.",
    alternates: {
      canonical: `${site}/${locale}/aplica`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/aplica`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const dicts: Record<Locale, {
  badge: string; h1: string; h1Accent: string; sub: string;
  trust1: string; trust2: string; trust3: string;
  stat1n: string; stat1l: string; stat2n: string; stat2l: string; stat3n: string; stat3l: string;
  quoteText: string; quoteAuthor: string;
  formTitle: string; formEyebrow: string; formSubtitle: string;
  labelName: string; labelEmail: string; labelProject: string; labelPhase: string;
  phase1: string; phase2: string; phase3: string; phase4: string;
  submit: string; submitNote: string; calendlyAlt: string; calendlyBtn: string;
  forWhomTitle: string; notForWhomTitle: string;
  forWhom: string[]; notForWhom: string[]; notForWhomNote: string;
  faqTitle: string;
  faqs: Array<{ q: string; a: string }>;
  finalH2: string; finalAccent: string; finalDesc: string; finalCta: string; finalAlt: string;
}> = {
  es: {
    badge: 'Evaluando proyectos · Plazas limitadas',
    h1: 'La sesión que puede', h1Accent: 'cambiarlo todo.',
    sub: '30 minutos con el equipo SF. Sin filtros. Escuchamos a todos y avanzamos con los que de verdad tienen potencial.',
    trust1: 'Gratuita y sin compromiso', trust2: 'Respondemos en 24h para confirmar', trust3: 'Si no hay fit, sales con feedback accionable',
    stat1n: '<10%', stat1l: 'son aceptados', stat2n: '30 min', stat2l: 'sesión inicial', stat3n: '24h', stat3l: 'confirmación',
    quoteText: '"Llegó como parte del equipo. En meses pasamos de la idea a resultados reales."',
    quoteAuthor: 'Natalia Aldea · Directora de Marketing, Dadybox',
    formEyebrow: 'Aplica ahora — es gratis', formTitle: 'Cuéntanos tu proyecto',
    formSubtitle: '2 minutos. Nuestro equipo lo leerá antes de la llamada.',
    labelName: 'Nombre', labelEmail: 'Email', labelProject: '¿Cuál es tu proyecto o idea?', labelPhase: '¿En qué fase estás?',
    phase1: 'Idea, aún no he empezado', phase2: 'MVP / producto inicial', phase3: 'Tengo clientes, quiero escalar', phase4: 'Startup buscando equipo',
    submit: 'Enviar y agendar sesión →', submitNote: 'Sin compromiso · Respondemos en 24h',
    calendlyAlt: '¿Prefieres agendar directo?', calendlyBtn: 'Calendly →',
    forWhomTitle: 'Aplica si', notForWhomTitle: 'No apliques si',
    forWhom: ['Tienes una idea clara y no sabes con qué equipo avanzar', 'Llevas tiempo construyendo solo y necesitas un equipo real', 'Tu startup tiene tracción pero el crecimiento no es predecible', 'Buscas conexiones: CTO, inversor, socio estratégico', 'Quieres integrar IA en tu operativa', 'Estás dispuesto a escuchar feedback directo'],
    notForWhom: ['Buscas validación fácil o alguien que diga sí a todo', 'No tienes tiempo real para comprometerte con el proceso', 'Esperas resultados sin meter el trabajo que hay que meter', 'Ya tienes todo decidido y solo buscas ejecución sin criterio'],
    notForWhomNote: '"Si tienes dudas de si encajas, aplica igualmente. Te lo decimos con honestidad."',
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      { q: '¿La sesión tiene coste?', a: 'No. Es completamente gratuita. Ni tú ni nosotros queremos perder el tiempo en algo que no tiene sentido.' },
      { q: '¿Qué pasa si no paso?', a: 'Te lo decimos con criterio y honestidad: qué falta, qué mejorar y cuándo volver. El no nunca es un portazo — muchos proyectos que trabajan hoy con SF empezaron con un no.' },
      { q: '¿Por qué solo el 10%?', a: 'Porque lo que ofrecemos es tiempo real de Carlos y del equipo en proyectos en los que creemos de verdad. No podemos hacerlo para todo el mundo.' },
      { q: '¿Qué tipo de proyectos tienen más fit?', a: 'Emprendedores con idea clara, startups en crecimiento con tracción real y proyectos de innovación corporativa. España, LATAM y Asia. Duda → aplica igualmente.' },
      { q: '¿Qué incluye la propuesta si hay fit?', a: 'Plan 30/60/90 días con el squad exacto, entregables concretos y presupuesto real. Diseñado por Carlos para tu caso — no una plantilla adaptada.' },
    ],
    finalH2: 'Si tienes un proyecto,', finalAccent: 'cuéntanoslo.',
    finalDesc: 'El peor caso: sales con feedback honesto. El mejor: construimos algo juntos.',
    finalCta: 'Aplica ahora — es gratis', finalAlt: 'Tengo una pregunta',
  },
  en: {
    badge: 'Reviewing projects · Limited spots',
    h1: 'The session that can', h1Accent: 'change everything.',
    sub: '30 minutes with the SF team. No filters. We listen to everyone and move forward with those who truly have potential.',
    trust1: 'Free and no commitment', trust2: 'We reply within 24h to confirm', trust3: 'If no fit, you leave with actionable feedback',
    stat1n: '<10%', stat1l: 'are accepted', stat2n: '30 min', stat2l: 'initial session', stat3n: '24h', stat3l: 'confirmation',
    quoteText: '"They joined as part of the team. In months we went from idea to real results."',
    quoteAuthor: 'Natalia Aldea · Marketing Director, Dadybox',
    formEyebrow: 'Apply now — it\'s free', formTitle: 'Tell us about your project',
    formSubtitle: '2 minutes. Our team will read it before the call.',
    labelName: 'Name', labelEmail: 'Email', labelProject: 'What is your project or idea?', labelPhase: 'What stage are you at?',
    phase1: 'Idea, haven\'t started yet', phase2: 'MVP / initial product', phase3: 'I have customers, want to scale', phase4: 'Startup looking for a team',
    submit: 'Submit and schedule session →', submitNote: 'No commitment · We reply within 24h',
    calendlyAlt: 'Prefer to schedule directly?', calendlyBtn: 'Calendly →',
    forWhomTitle: 'Apply if', notForWhomTitle: 'Don\'t apply if',
    forWhom: ['You have a clear idea and don\'t know which team to move forward with', 'You\'ve been building alone and need a real team to execute with you', 'Your startup has traction but growth isn\'t predictable yet', 'You\'re looking for connections: CTO, investor, strategic partner', 'You want to integrate AI into your operations', 'You\'re willing to hear direct feedback'],
    notForWhom: ['You\'re looking for easy validation or someone to say yes to everything', 'You don\'t have real time to commit to the process', 'You expect results without putting in the work required', 'You\'ve already decided everything and just want execution without judgment'],
    notForWhomNote: '"If you\'re unsure whether you fit, apply anyway. We\'ll tell you honestly."',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Does the session have a cost?', a: 'No. It\'s completely free. Neither you nor we want to waste time on something that doesn\'t make sense.' },
      { q: 'What happens if I don\'t pass?', a: 'We tell you with judgment and honesty: what\'s missing, what to improve and when to come back. A no is never a door slam — many projects working with SF today started with a no.' },
      { q: 'Why only 10%?', a: 'Because what we offer is real time from Carlos and the team on projects we truly believe in. We can\'t do it for everyone.' },
      { q: 'What type of projects have the best fit?', a: 'Entrepreneurs with a clear idea, startups with real traction and corporate innovation projects. Spain, LATAM and Asia. Doubt → apply anyway.' },
      { q: 'What does the proposal include if there\'s a fit?', a: '30/60/90-day plan with the exact squad, concrete deliverables and real budget. Designed by Carlos for your case — not an adapted template.' },
    ],
    finalH2: 'If you have a project,', finalAccent: 'tell us about it.',
    finalDesc: 'Worst case: you leave with honest feedback. Best case: we build something together.',
    finalCta: 'Apply now — it\'s free', finalAlt: 'I have a question first',
  },
  th: {
    badge: 'กำลังพิจารณาโครงการ · จำนวนจำกัด',
    h1: 'เซสชั่นที่สามารถ', h1Accent: 'เปลี่ยนทุกอย่างได้',
    sub: '30 นาทีกับทีม SF เราฟังทุกคนและก้าวไปข้างหน้ากับผู้ที่มีศักยภาพจริง',
    trust1: 'ฟรีและไม่มีข้อผูกมัด', trust2: 'ตอบกลับภายใน 24 ชั่วโมง', trust3: 'หากไม่เหมาะ คุณจะได้รับ feedback ที่นำไปปฏิบัติได้',
    stat1n: '<10%', stat1l: 'ได้รับการยอมรับ', stat2n: '30 นาที', stat2l: 'เซสชั่นแรก', stat3n: '24 ชม.', stat3l: 'การยืนยัน',
    quoteText: '"เข้ามาเป็นส่วนหนึ่งของทีม ในไม่กี่เดือนเราไปจากไอเดียสู่ผลลัพธ์จริง"',
    quoteAuthor: 'Natalia Aldea · ผู้อำนวยการฝ่ายการตลาด, Dadybox',
    formEyebrow: 'สมัครเลย — ฟรี', formTitle: 'เล่าให้เราฟังเกี่ยวกับโครงการของคุณ',
    formSubtitle: '2 นาที ทีมของเราจะอ่านก่อนโทรศัพท์',
    labelName: 'ชื่อ', labelEmail: 'อีเมล', labelProject: 'โครงการหรือไอเดียของคุณคืออะไร?', labelPhase: 'คุณอยู่ในขั้นตอนไหน?',
    phase1: 'ไอเดีย ยังไม่ได้เริ่ม', phase2: 'MVP / ผลิตภัณฑ์เริ่มต้น', phase3: 'มีลูกค้าแล้ว ต้องการขยาย', phase4: 'Startup กำลังหาทีม',
    submit: 'ส่งและนัดหมายเซสชั่น →', submitNote: 'ไม่มีข้อผูกมัด · ตอบกลับภายใน 24 ชั่วโมง',
    calendlyAlt: 'ต้องการนัดหมายโดยตรง?', calendlyBtn: 'Calendly →',
    forWhomTitle: 'สมัครหาก', notForWhomTitle: 'ไม่ต้องสมัครหาก',
    forWhom: ['คุณมีไอเดียชัดเจนแต่ไม่รู้จะก้าวไปกับทีมไหน', 'คุณสร้างคนเดียวมานานและต้องการทีมจริง', 'Startup ของคุณมี traction แต่การเติบโตยังไม่แน่นอน', 'คุณกำลังมองหาการเชื่อมต่อ: CTO, นักลงทุน, หุ้นส่วนเชิงกลยุทธ์', 'คุณต้องการผสาน AI เข้ากับการดำเนินงาน', 'คุณพร้อมรับ feedback ตรงๆ'],
    notForWhom: ['คุณกำลังมองหาการยืนยันง่ายๆ', 'คุณไม่มีเวลาจริงๆ ที่จะมุ่งมั่นกับกระบวนการ', 'คุณคาดหวังผลลัพธ์โดยไม่ลงแรง', 'คุณตัดสินใจทุกอย่างแล้วและต้องการแค่การปฏิบัติ'],
    notForWhomNote: '"หากไม่แน่ใจว่าเหมาะหรือไม่ ลองสมัครดู เราจะบอกตรงๆ"',
    faqTitle: 'คำถามที่พบบ่อย',
    faqs: [
      { q: 'เซสชั่นมีค่าใช้จ่ายไหม?', a: 'ไม่ ฟรีทั้งหมด เราไม่ต้องการเสียเวลากับสิ่งที่ไม่มีความหมาย' },
      { q: 'ถ้าไม่ผ่านจะเกิดอะไรขึ้น?', a: 'เราจะบอกอย่างตรงไปตรงมา: ขาดอะไร ต้องปรับปรุงอะไร และควรกลับมาเมื่อไหร่ คำว่าไม่ ไม่ใช่การปิดประตูตลอดกาล' },
      { q: 'ทำไมแค่ 10%?', a: 'เพราะสิ่งที่เรานำเสนอคือเวลาจริงของ Carlos และทีมในโครงการที่เราเชื่อจริงๆ' },
      { q: 'โครงการแบบไหนที่เหมาะสมที่สุด?', a: 'ผู้ประกอบการที่มีไอเดียชัดเจน, startup ที่มี traction จริง และโครงการนวัตกรรมองค์กร สเปน LATAM และเอเชีย' },
      { q: 'ข้อเสนอรวมอะไรบ้างหากมี fit?', a: 'แผน 30/60/90 วันพร้อมทีมที่แน่นอน, deliverables ที่ชัดเจน และงบประมาณจริง ออกแบบโดย Carlos สำหรับกรณีของคุณ' },
    ],
    finalH2: 'หากคุณมีโครงการ', finalAccent: 'เล่าให้เราฟัง',
    finalDesc: 'กรณีที่แย่ที่สุด: คุณได้รับ feedback ที่ซื่อสัตย์ กรณีที่ดีที่สุด: เราสร้างสิ่งต่างๆ ร่วมกัน',
    finalCta: 'สมัครเลย — ฟรี', finalAlt: 'มีคำถามก่อน',
  },
};

export default async function AplicaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = dicts[locale as Locale] ?? dicts.es;

  return (
    <>
      {/* ─── HERO + FORMULARIO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-screen flex items-center">
        {/* Orbs */}
        <div className="orb-purple absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] rounded-full opacity-40" />
        <div className="orb-magenta absolute top-[15%] right-[5%] w-[350px] h-[350px] rounded-full opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

        <div className="relative w-full max-w-7xl mx-auto px-6 py-24 md:py-20">
          <div className="grid md:grid-cols-[1fr_480px] gap-12 md:gap-16 items-center">

            {/* ── IZQUIERDA — Copy ── */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 border border-emerald-500/20 rounded-full px-4 py-2 bg-emerald-500/[0.05] mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-xs font-semibold text-emerald-400/80 uppercase tracking-[0.12em]">{t.badge}</span>
              </div>

              <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(40px,5.5vw,72px)] text-white leading-[0.93] tracking-[-0.03em] mb-6">
                {t.h1}<br />
                <span className="gradient-text">{t.h1Accent}</span>
              </h1>

              <p className="text-lg text-white/55 leading-relaxed mb-8 max-w-md">{t.sub}</p>

              {/* Trust signals */}
              <div className="space-y-3 mb-10">
                {[t.trust1, t.trust2, t.trust3].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 3L9 1" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/60">{text}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/[0.06] max-w-sm">
                {[
                  { n: t.stat1n, label: t.stat1l },
                  { n: t.stat2n, label: t.stat2l },
                  { n: t.stat3n, label: t.stat3l },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] px-4 py-4 text-center">
                    <div className="font-[family-name:var(--font-space-grotesk)] font-black text-lg gradient-text leading-none mb-1">{s.n}</div>
                    <div className="text-[10px] text-white/35 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Testimonio mini */}
              <div className="mt-8 flex items-start gap-3 max-w-sm">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3D2FFF]/40 to-[#A855F7]/30 border border-[#A855F7]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black text-sm gradient-text">N</span>
                </div>
                <div>
                  <p className="text-xs text-white/50 leading-relaxed italic">{t.quoteText}</p>
                  <p className="text-[10px] text-[#A855F7] font-semibold mt-1">{t.quoteAuthor}</p>
                </div>
              </div>
            </div>

            {/* ── DERECHA — Formulario ── */}
            <div id="aplica">
              <div className="card-dark rounded-3xl p-7 md:p-8 border border-white/[0.08]">
                <div className="mb-6">
                  <p className="text-xs font-bold text-[#A855F7] uppercase tracking-[0.15em] mb-2">{t.formEyebrow}</p>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl text-white leading-tight">
                    {t.formTitle}
                  </h2>
                  <p className="text-white/40 text-sm mt-1.5">{t.formSubtitle}</p>
                </div>

                <form
                  action={`https://formspree.io/f/${FORMSPREE_ID}`}
                  method="POST"
                  className="space-y-4"
                >
                  <input type="hidden" name="_subject" value="Nueva aplicación SF — Aplica" />
                  <input type="hidden" name="_next" value={`https://www.startupsfactory.es/${locale}/bienvenido`} />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">{t.labelName}</label>
                      <input type="text" name="nombre" required placeholder={t.labelName}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">{t.labelEmail}</label>
                      <input type="email" name="email" required placeholder="email@..."
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">{t.labelProject}</label>
                    <textarea name="proyecto" required rows={3}
                      placeholder="3-5 frases: qué es, para quién y en qué fase está."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 transition-colors resize-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">{t.labelPhase}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[t.phase1, t.phase2, t.phase3, t.phase4].map((fase) => (
                        <label key={fase} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 cursor-pointer hover:border-[#A855F7]/30 transition-colors">
                          <input type="radio" name="fase" value={fase} className="accent-[#A855F7] shrink-0" />
                          <span className="text-xs text-white/60 leading-tight">{fase}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold py-4 rounded-full text-base">
                    {t.submit}
                  </button>

                  <p className="text-[11px] text-white/20 text-center">{t.submitNote}</p>
                </form>

                {/* Calendly alternativa */}
                <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between gap-4">
                  <p className="text-xs text-white/35">{t.calendlyAlt}</p>
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 border border-white/15 text-white/70 text-xs font-semibold px-4 py-2 rounded-full hover:bg-white/[0.06] hover:text-white transition-all duration-200 whitespace-nowrap">
                    {t.calendlyBtn}
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF — clientes ───────────────────────────────────────── */}
      <section className="relative py-10 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="text-center text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-6">Han confiado en Carlos</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {["BarLab · Mahou", "Airbus", "Siemens Gamesa", "Amadeus", "Playtomic", "Woonivers"].map((name) => (
              <span key={name} className="text-sm font-semibold text-white/20">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARA QUIÉN + NO PARA QUIÉN ────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-20 overflow-hidden">
        <div className="orb-magenta absolute -left-20 top-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-15" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">¿Encajas?</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,44px)] text-white tracking-[-0.02em]">
              Este programa es para ti si...
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-[#A855F7] uppercase tracking-[0.2em] mb-4">{t.forWhomTitle}</p>
              <div className="space-y-2.5">
                {t.forWhom.map((item) => (
                  <div key={item} className="flex items-start gap-3 card-dark rounded-xl px-4 py-3">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.2em] mb-4">{t.notForWhomTitle}</p>
              <div className="space-y-2.5">
                {t.notForWhom.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl px-4 py-3 border border-white/[0.05]">
                    <span className="w-4 h-4 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/30">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-white/40 text-xs leading-relaxed italic">{t.notForWhomNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-20 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute right-0 top-1/3 w-[300px] h-[300px] opacity-10" />
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">FAQ</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,40px)] text-white tracking-[-0.02em]">
              {t.faqTitle}
            </h2>
          </div>
          <div>
            {t.faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/[0.06] py-6">
                <div className="flex items-start gap-4">
                  <span className="font-[family-name:var(--font-space-grotesk)] font-black gradient-text text-base leading-none mt-0.5 min-w-[2rem] opacity-40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-base text-white mb-1.5">{faq.q}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MINI CTA FINAL ────────────────────────────────────────────────── */}
      <section className="relative bg-black py-14 overflow-hidden">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20" />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,4vw,48px)] text-white leading-tight tracking-[-0.02em] mb-4">
            {t.finalH2}<br />
            <span className="gradient-text">{t.finalAccent}</span>
          </h2>
          <p className="text-white/35 mb-8 max-w-md mx-auto text-sm leading-relaxed">{t.finalDesc}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#aplica" className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-9 py-4 rounded-full">
              {t.finalCta}
            </a>
            <Link
              href={`/${locale}/contacto`}
              className="border border-white/15 text-white/70 font-[family-name:var(--font-space-grotesk)] font-semibold px-7 py-4 rounded-full hover:bg-white/[0.05] hover:text-white transition-all duration-200"
            >
              {t.finalAlt}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
