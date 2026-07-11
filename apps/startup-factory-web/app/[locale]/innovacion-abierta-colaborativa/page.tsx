import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Innovación Abierta Colaborativa | Para Corporates — Startup Factory", description: "De reto corporativo a piloto ejecutado. Diseñamos y ejecutamos innovación abierta colaborativa: diagnóstico, diseño del reto, selección de startups y validación." },
  en: { title: "Open Collaborative Innovation | For Corporates — Startup Factory", description: "From corporate challenge to executed pilot. We design and execute open collaborative innovation: diagnosis, challenge design, startup selection and validation." },
  th: { title: "นวัตกรรมแบบเปิดร่วมกัน | สำหรับองค์กร — Startup Factory", description: "จากความท้าทายองค์กรสู่ pilot ที่ดำเนินงาน เราออกแบบและดำเนินการนวัตกรรมแบบเปิดร่วมกัน: การวินิจฉัย การออกแบบความท้าทาย การเลือก startup และการยืนยัน" },
};

const phasesDict: Record<Locale, Array<{ num: string; title: string; desc: string }>> = {
  es: [
    { num: "01", title: "Diagnóstico del reto", desc: "No empezamos con el catálogo de startups. Empezamos entendiendo tu problema de negocio, los KPIs que importan y los constraints corporativos. Un reto bien definido es el 50% del éxito." },
    { num: "02", title: "Diseño del programa", desc: "Diseñamos el proceso a medida para tu reto: challenge abierto, co-innovación dirigida o piloto fast-track. La startup tiene que encajar en tu empresa — no al revés." },
    { num: "03", title: "Scouting y matching real", desc: "Screening de startups con criterio: madurez, compliance, capacidad técnica y cultura de trabajo verificadas antes de hacer la primera intro. Shortlist de 5-8 con justificación." },
    { num: "04", title: "Piloto + decisión de escalado", desc: "Ejecutamos el piloto con KPIs acordados, sprints cortos y reporting semanal. Al final: continuar, escalar o pivotar. Decisión informada, no opinión." },
  ],
  en: [
    { num: "01", title: "Challenge diagnosis", desc: "We define the real business challenge: problem, success KPIs, key stakeholders." },
    { num: "02", title: "Program design", desc: "We design the format: internal challenge, co-innovation with startups, or fast-track pilot." },
    { num: "03", title: "Selection and matching", desc: "We find and qualify the most relevant startups or tech partners for the challenge." },
    { num: "04", title: "Executed pilot", desc: "We accompany the pilot execution with agile methodology: sprints, deliverables and scale decision." },
  ],
  th: [
    { num: "01", title: "วินิจฉัยความท้าทาย", desc: "เรากำหนดความท้าทายธุรกิจที่แท้จริง: ปัญหา KPIs ของความสำเร็จ stakeholders หลัก" },
    { num: "02", title: "ออกแบบโปรแกรม", desc: "เราออกแบบรูปแบบ: challenge ภายใน, co-innovation กับ startup, หรือ pilot fast-track" },
    { num: "03", title: "การเลือกและจับคู่", desc: "เราค้นหาและคัดกรอง startup หรือพาร์ทเนอร์เทคโนโลยีที่เกี่ยวข้องมากที่สุดสำหรับความท้าทาย" },
    { num: "04", title: "Pilot ที่ดำเนินงาน", desc: "เราดูแลการดำเนินงาน pilot ด้วยวิธีการแบบ agile: sprints, ผลลัพธ์ และการตัดสินใจขยาย" },
  ],
};

const contentDict: Record<Locale, {
  eyebrow: string; h1Accent: string; h1End: string; subtitle: string; ctaPrimary: string;
  methodEyebrow: string; methodH2: string;
  ctaH2: string; ctaDesc: string; ctaCta: string;
}> = {
  es: {
    eyebrow: "Servicio · Innovación Abierta",
    h1Accent: "Del reto corporativo",
    h1End: "al piloto que produce resultados.",
    subtitle: "Diseñamos y ejecutamos programas de innovación abierta con startups externas. Desde la definición del reto hasta la decisión de escalado — sin eventos de demostración, sin consultoras de PowerPoint.",
    ctaPrimary: "Presentar tu reto",
    methodEyebrow: "El proceso", methodH2: "De reto a decisión informada en 4 pasos",
    ctaH2: "¿Cuál es tu reto de innovación?", ctaDesc: "Primera sesión sin coste. Analizamos si tiene sentido y cómo lo abordaríamos. En 60 minutos tienes claridad.",
    ctaCta: "Hablar con el equipo",
  },
  en: {
    eyebrow: "For Corporates", h1Accent: "Open innovation", h1End: "collaborative",
    subtitle: "If you have a real challenge, we design and execute the program: from problem definition to validated pilot. No post-it workshops. Measurable results.",
    ctaPrimary: "Present corporate challenge",
    methodEyebrow: "Methodology", methodH2: "From challenge to executed pilot",
    ctaH2: "Do you have a real innovation challenge?", ctaDesc: "Tell us. In a first session we jointly evaluate if it makes sense and how to approach it.",
    ctaCta: "Talk to the team",
  },
  th: {
    eyebrow: "สำหรับองค์กร", h1Accent: "นวัตกรรมแบบเปิด", h1End: "ร่วมกัน",
    subtitle: "ถ้าคุณมีความท้าทายจริง เราออกแบบและดำเนินการโปรแกรม: จากการกำหนดปัญหาสู่ pilot ที่ยืนยันแล้ว ไม่มีเวิร์กช็อปโพสต์อิท ผลลัพธ์ที่วัดได้",
    ctaPrimary: "นำเสนอความท้าทายองค์กร",
    methodEyebrow: "วิธีการ", methodH2: "จากความท้าทายสู่ pilot ที่ดำเนินงาน",
    ctaH2: "คุณมีความท้าทายด้านนวัตกรรมจริงหรือ?", ctaDesc: "บอกเล่าให้เราฟัง ในเซสชั่นแรก เราประเมินร่วมกันว่ามีความหมายหรือไม่และจะจัดการอย่างไร",
    ctaCta: "คุยกับทีม",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/innovacion-abierta-colaborativa`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/innovacion-abierta-colaborativa`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function InnovacionAbiertaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = contentDict[l] ?? contentDict.es;
  const phases = phasesDict[l] ?? phasesDict.es;

  return (
    <>
      <section className="relative overflow-hidden bg-black min-h-[50vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[300px] h-[300px] rounded-full opacity-20" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{t.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-6 max-w-5xl">
            <span className="gradient-text">{t.h1Accent}</span>{" "}{t.h1End}
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-10">{t.subtitle}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full inline-block">
            {t.ctaPrimary}
          </Link>
        </div>
      </section>

      {/* Corporates referencia */}
      <section className="relative py-12 overflow-hidden" style={{ background: '#05050D' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {([
              l === 'es'
                ? [
                    { company: "Mahou · BarLab Ventures", tag: "Innovación abierta", desc: "Gestión integral de proyectos con startups: selección, validación y ejecución de pilotos." },
                    { company: "Airbus", tag: "Venture building", desc: "Construcción de nuevas capacidades con metodología de startup dentro del ecosistema corporativo." },
                    { company: "Siemens Gamesa", tag: "Innovación abierta", desc: "Programa de co-innovación con startups del sector energético para resolver retos técnicos reales." },
                  ]
                : l === 'th'
                ? [
                    { company: "Mahou · BarLab Ventures", tag: "นวัตกรรมแบบเปิด", desc: "การจัดการโปรเจกต์กับ startup อย่างครบวงจร: การคัดเลือก การยืนยัน และการดำเนินการ pilot" },
                    { company: "Airbus", tag: "Venture building", desc: "การสร้างความสามารถใหม่ด้วยวิธีการ startup ภายใน ecosystem องค์กร" },
                    { company: "Siemens Gamesa", tag: "นวัตกรรมแบบเปิด", desc: "โปรแกรม co-innovation กับ startup ในภาคพลังงานเพื่อแก้ความท้าทายทางเทคนิคจริง" },
                  ]
                : [
                    { company: "Mahou · BarLab Ventures", tag: "Open innovation", desc: "Full project management with startups: selection, validation and pilot execution." },
                    { company: "Airbus", tag: "Venture building", desc: "Building new capabilities with startup methodology inside the corporate ecosystem." },
                    { company: "Siemens Gamesa", tag: "Open innovation", desc: "Co-innovation program with energy sector startups to solve real technical challenges." },
                  ]
            ][0]).map((c) => (
              <div key={c.company} className="card-dark rounded-2xl p-7 hover:border-[#A855F7]/60 transition-all duration-200">
                <span className="text-xs font-semibold text-[#A855F7] bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 px-3 py-1 rounded-full inline-block mb-4">{c.tag}</span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{c.company}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-black py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.methodEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,3.5vw,48px)] text-white tracking-[-0.02em]">{t.methodH2}</h2>
            <p className="mt-4 text-white/40 max-w-lg mx-auto">{l === 'th' ? 'โครงสร้างที่ชัดเจนเพื่อให้บริษัทของคุณและ startup รู้ว่าอยู่ที่ไหนในแต่ละช่วงเวลา' : l === 'en' ? 'Clear structure so your company and the startup always know where they stand.' : 'Estructura clara para que tu empresa y la startup sepan dónde están en cada momento.'}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((p) => (
              <div key={p.num} className="card-dark rounded-2xl p-8 hover:border-[#A855F7]/20 hover:scale-[1.02] transition-all duration-150">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-6xl text-[#A855F7]/20 leading-none mb-4">{p.num}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-white mb-3">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white mb-6 tracking-[-0.02em]">{t.ctaH2}</h2>
          <p className="text-white/50 text-lg mb-10">{t.ctaDesc}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
            {t.ctaCta}
          </Link>
        </div>
      </section>
    </>
  );
}
