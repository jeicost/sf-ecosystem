import type { Metadata } from "next";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import ContactForm from "@/components/ContactForm";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";
import { PagePixels, loadPagePixels } from "@/components/PagePixels";

const FORMSPREE_ID = "xnjwnydg";
const CALENDLY_URL = "https://calendly.com/jacostech";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Hablemos | Primera sesión de diagnóstico — Startup Factory", description: "En 60 minutos analizamos tu situación real y te presentamos la fórmula exacta: el plan y el squad diseñados para tu caso específico. Sin compromiso." },
  en: { title: "Let's talk | First diagnosis session — Startup Factory", description: "In 60 minutes we analyze your real situation and present the exact formula: the plan and squad designed for your specific case. No commitment." },
  th: { title: "คุยกัน | เซสชันวินิจฉัยครั้งแรก — Startup Factory", description: "ใน 60 นาทีเราวิเคราะห์สถานการณ์จริงของคุณและนำเสนอสูตรที่แน่นอน: แผนและทีมที่ออกแบบมาสำหรับกรณีเฉพาะของคุณ ไม่มีความผูกมัด" },
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string; subtitleNote: string;
  form: {
    formH2: string; formDesc: string;
    nameLabel: string; namePlaceholder: string;
    emailLabel: string;
    tipoLabel: string;
    tipoOptions: Array<{ value: string; label: string }>;
    messageLabel: string; messagePlaceholder: string;
    submitBtn: string; sendingBtn: string;
    successTitle: string; successDesc: string; errorMsg: string;
    bookTitle: string; bookDesc: string; bookBtn: string;
  };
  stepsTitle: string;
  steps: Array<{ n: string; title: string; desc: string }>;
  quote: string;
  quoteAuthor: string;
  emailLabel: string;
}> = {
  es: {
    eyebrow: "La primera sesión lo cambia todo",
    h1: "Cuéntanos quién eres",
    h1Accent: "y qué quieres conseguir",
    subtitle: "Analizamos tu situación real — modelo, fase, recursos y mercado — y te presentamos la fórmula exacta para tu caso específico.",
    subtitleNote: "Respondemos en 24h. La sesión de diagnóstico es gratuita y sin compromiso.",
    form: {
      formH2: "Cuéntanos tu proyecto",
      formDesc: "Cuanto más contexto nos das, mejor preparamos la sesión.",
      nameLabel: "Nombre", namePlaceholder: "Tu nombre",
      emailLabel: "Email",
      tipoLabel: "¿Qué necesitas?",
      tipoOptions: [
        { value: "diagnostico", label: "Sesión de diagnóstico 1:1 (gratis)" },
        { value: "growth", label: "Growth & Marketing para mi startup" },
        { value: "ia", label: "IA & Automatización" },
        { value: "squad", label: "Montar un squad completo" },
        { value: "venture", label: "Venture (cash + equity)" },
        { value: "corporate", label: "Innovación corporativa" },
        { value: "equipo", label: "Unirme al equipo" },
      ],
      messageLabel: "Tu proyecto y objetivo en 90 días",
      messagePlaceholder: "Cuéntanos en qué fase estás, cuál es el reto y qué quieres conseguir en los próximos 90 días. Cuanto más concreto, mejor preparamos la sesión.",
      submitBtn: "Quiero mi sesión de diagnóstico →",
      sendingBtn: "Enviando...",
      successTitle: "¡Mensaje enviado!",
      successDesc: "Te respondemos en 24 horas con una propuesta de sesión.",
      errorMsg: "Error al enviar. Inténtalo de nuevo o escríbenos directamente.",
      bookTitle: "Reserva una reunión",
      bookDesc: "Elige un hueco en nuestra agenda y hablamos directamente. 30 minutos, sin compromiso.",
      bookBtn: "Ver disponibilidad",
    },
    stepsTitle: "Qué pasa después",
    steps: [
      { n: "01", title: "Te respondemos en 24h", desc: "Revisamos tu contexto y preparamos la sesión con conocimiento previo de tu proyecto. No llegamos en blanco." },
      { n: "02", title: "Sesión de diagnóstico 1:1 — 60 min", desc: "La sesión donde todo cambia. Entendemos tu modelo, tu fase, tu mercado y tus retos reales. Salís con claridad total sobre los próximos pasos." },
      { n: "03", title: "Tu fórmula personalizada", desc: "Plan 30/60/90 + el squad exacto que necesitas + primer entregable. Diseñado para tu caso específico, no una propuesta de plantilla." },
    ],
    quote: "El peor caso es que sales de la sesión con claridad sobre qué hacer a continuación. En 60 minutos ya sabrás si hay fit y cuál es el siguiente paso real.",
    quoteAuthor: "— Equipo Startup Factory",
    emailLabel: "Email directo",
  },
  en: {
    eyebrow: "The first session changes everything",
    h1: "Tell us who you are",
    h1Accent: "and what you want to achieve",
    subtitle: "We analyze your real situation — model, stage, resources and market — and present the exact formula for your case.",
    subtitleNote: "We respond in 24h. The diagnosis session is free and with no commitment.",
    form: {
      formH2: "Tell us about your project",
      formDesc: "The more context you give us, the better we prepare the session.",
      nameLabel: "Name", namePlaceholder: "Your name",
      emailLabel: "Email",
      tipoLabel: "What do you need?",
      tipoOptions: [
        { value: "diagnostico", label: "1:1 Diagnosis session (free)" },
        { value: "growth", label: "Growth & Marketing for my startup" },
        { value: "ia", label: "AI & Automation" },
        { value: "squad", label: "Build a complete squad" },
        { value: "venture", label: "Venture (cash + equity)" },
        { value: "corporate", label: "Corporate innovation" },
        { value: "equipo", label: "Join the team" },
      ],
      messageLabel: "Your project and 90-day goal",
      messagePlaceholder: "Tell us what stage you're at, what the challenge is and what you want to achieve in the next 90 days. The more specific, the better we prepare the session.",
      submitBtn: "I want my diagnosis session →",
      sendingBtn: "Sending...",
      successTitle: "Message sent!",
      successDesc: "We'll respond within 24 hours with a session proposal.",
      errorMsg: "Error sending. Please try again or email us directly.",
      bookTitle: "Book a meeting",
      bookDesc: "Pick a slot in our calendar and let's talk directly. 30 minutes, no commitment.",
      bookBtn: "See availability",
    },
    stepsTitle: "What happens next",
    steps: [
      { n: "01", title: "We respond within 24h", desc: "We review your context and prepare the session with prior knowledge of your project. We don't arrive blank." },
      { n: "02", title: "1:1 diagnosis session — 60 min", desc: "The session where everything changes. We understand your model, stage, market and real challenges. You leave with total clarity on next steps." },
      { n: "03", title: "Your personalized formula", desc: "30/60/90 plan + the exact squad you need + first deliverable. Designed for your specific case, not a template proposal." },
    ],
    quote: "We don't come to sell you a service. We come to understand your project and offer you the formula that makes sense for your case.",
    quoteAuthor: "— Startup Factory",
    emailLabel: "Direct email",
  },
  th: {
    eyebrow: "เซสชันแรกเปลี่ยนทุกอย่าง",
    h1: "บอกเราว่าคุณเป็นใคร",
    h1Accent: "และต้องการบรรลุอะไร",
    subtitle: "เราวิเคราะห์สถานการณ์จริงของคุณ — model, ระยะ, ทรัพยากร และตลาด — และนำเสนอสูตรที่แน่นอนสำหรับกรณีของคุณ",
    subtitleNote: "เราตอบกลับใน 24 ชม. เซสชันวินิจฉัยฟรีและไม่มีความผูกมัด",
    form: {
      formH2: "บอกเราเกี่ยวกับโปรเจกต์ของคุณ",
      formDesc: "ยิ่งให้ context มากเท่าไหร่ เราก็ยิ่งเตรียมเซสชันได้ดีขึ้นเท่านั้น",
      nameLabel: "ชื่อ", namePlaceholder: "ชื่อของคุณ",
      emailLabel: "อีเมล",
      tipoLabel: "คุณต้องการอะไร?",
      tipoOptions: [
        { value: "diagnostico", label: "เซสชันวินิจฉัย 1:1 (ฟรี)" },
        { value: "growth", label: "Growth & Marketing สำหรับ startup ของฉัน" },
        { value: "ia", label: "AI & Automation" },
        { value: "squad", label: "สร้าง squad ที่สมบูรณ์" },
        { value: "venture", label: "Venture (cash + equity)" },
        { value: "corporate", label: "นวัตกรรมองค์กร" },
        { value: "equipo", label: "เข้าร่วมทีม" },
      ],
      messageLabel: "โปรเจกต์และเป้าหมาย 90 วันของคุณ",
      messagePlaceholder: "บอกเล่าว่าคุณอยู่ในระยะไหน ความท้าทายคืออะไร และต้องการบรรลุอะไรใน 90 วันข้างหน้า ยิ่งเฉพาะเจาะจงมากเท่าไหร่ เราก็ยิ่งเตรียมเซสชันได้ดีขึ้น",
      submitBtn: "ต้องการเซสชันวินิจฉัยของฉัน →",
      sendingBtn: "กำลังส่ง...",
      successTitle: "ส่งข้อความแล้ว!",
      successDesc: "เราจะตอบกลับภายใน 24 ชั่วโมงพร้อมข้อเสนอเซสชัน",
      errorMsg: "เกิดข้อผิดพลาดในการส่ง กรุณาลองใหม่หรือส่งอีเมลโดยตรง",
      bookTitle: "จองการประชุม",
      bookDesc: "เลือกเวลาในปฏิทินของเราและคุยโดยตรง 30 นาที ไม่มีความผูกมัด",
      bookBtn: "ดูเวลาที่ว่าง",
    },
    stepsTitle: "สิ่งที่เกิดขึ้นต่อไป",
    steps: [
      { n: "01", title: "เราตอบกลับภายใน 24 ชม.", desc: "เราทบทวน context ของคุณและเตรียมเซสชันพร้อมความรู้ก่อนหน้าเกี่ยวกับโปรเจกต์ของคุณ เราไม่ไปแบบ blank" },
      { n: "02", title: "เซสชันวินิจฉัย 1:1 — 60 นาที", desc: "เซสชันที่ทุกอย่างเปลี่ยน เราเข้าใจ model, ระยะ, ตลาด และความท้าทายจริงของคุณ คุณออกไปพร้อมความชัดเจนเต็มรูปแบบเกี่ยวกับขั้นตอนต่อไป" },
      { n: "03", title: "สูตรเฉพาะของคุณ", desc: "แผน 30/60/90 + ทีมที่แน่นอนที่คุณต้องการ + ผลลัพธ์แรก ออกแบบสำหรับกรณีเฉพาะของคุณ ไม่ใช่ข้อเสนอแบบเทมเพลต" },
    ],
    quote: "เราไม่ได้มาขายบริการให้คุณ เรามาเพื่อเข้าใจโปรเจกต์ของคุณและเสนอสูตรที่เหมาะสมสำหรับกรณีของคุณ",
    quoteAuthor: "— Startup Factory",
    emailLabel: "อีเมลโดยตรง",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/contacto`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/contacto`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ContactoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("contacto")["content"]?.data, l);

  return (
    <>
      <PagePixels pixels={loadPagePixels("contacto")} />
      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black pt-24 pb-14">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[400px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[15%] right-[5%] w-[300px] h-[300px] rounded-full opacity-30" />
        <div className="absolute top-20 left-[8%] w-28 h-28 rounded-full border border-white/[0.04]" />

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-white/[0.03] backdrop-blur-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.15em]">{t.eyebrow}</span>
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5.5vw,72px)] text-white leading-[0.95] tracking-[-0.03em] mb-6">
            {t.h1}{" "}
            <span className="gradient-text">{t.h1Accent}</span>
          </h1>
          <p className="text-xl text-white/50 leading-relaxed mb-3">{t.subtitle}</p>
          <p className="text-sm text-white/30">{t.subtitleNote}</p>
        </div>
      </section>

      {/* ─── FORM + INFO ───────────────────────────────────────────── */}
      <section className="relative bg-black pb-32 overflow-hidden">
        <div className="orb-purple absolute right-0 bottom-1/4 w-[300px] h-[300px] opacity-15" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-2xl text-white mb-2">{t.form.formH2}</h2>
              <p className="text-sm text-white/40 mb-8">{t.form.formDesc}</p>
              <ContactForm formId={FORMSPREE_ID} calendlyUrl={CALENDLY_URL} labels={t.form} />
            </div>

            {/* Info lateral */}
            <div className="space-y-10">
              <div>
                <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold text-2xl text-white mb-8">{t.stepsTitle}</h2>
                <div className="space-y-8">
                  {t.steps.map((s) => (
                    <div key={s.n} className="flex gap-4">
                      <span className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl gradient-text leading-none mt-0.5 min-w-[2.5rem] opacity-50">{s.n}</span>
                      <div>
                        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-1">{s.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="card-dark rounded-2xl p-6">
                <p className="text-white/80 font-semibold leading-relaxed mb-3 italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs text-white/30">{t.quoteAuthor}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
