import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://startupsfactory.es";
const DISCOOLVER_PINK = "#F01A8C";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Bangkok Founder Trip | Startup Factory × Discoolver", description: "Un viaje diseñado para founders. Networking real, proyectos compartidos y el auténtico Bangkok de la mano del equipo de Startup Factory y Discoolver." },
  en: { title: "Bangkok Founder Trip | Startup Factory × Discoolver", description: "A trip designed for founders. Real networking, shared projects and authentic Bangkok with the Startup Factory and Discoolver team." },
  th: { title: "Bangkok Founder Trip | Startup Factory × Discoolver", description: "ทริปที่ออกแบบสำหรับ founders networking จริง โปรเจกต์ที่แชร์กัน และ Bangkok แท้จริงกับทีม Startup Factory และ Discoolver" },
};

const ctaDict: Record<Locale, {
  bookCta: string; viewDiscoolver: string; bookFinalCta: string; bookNote: string;
  heroBody1: string; heroBody2: string;
  whatEyebrow: string; whatH2: string; whatH2Accent: string;
  whatBody1: string; whatBody2: string;
  sfLabel: string; sfDesc: string; discoolverLabel: string; discoolverDesc: string; youLabel: string; youDesc: string;
  scheduleEyebrow: string; scheduleH2: string; scheduleNote: string;
  includedH2: string;
  forWhomEyebrow: string; forWhomH2: string; forWhomDesc: string;
  quoteLine: string; quoteAuthor: string; quoteNote: string;
  finalEyebrow: string; finalH2: string; finalH2Accent: string; finalBody: string;
  heroStats: Array<{ n: string; label: string }>;
  experience: Array<{ day: string; title: string; desc: string }>;
  included: Array<{ icon: string; label: string; desc: string }>;
  forWhom: string[];
}> = {
  es: {
    bookCta: "Quiero ir — reserva tu plaza", viewDiscoolver: "Ver Discoolver →",
    bookFinalCta: "Reserva tu plaza →", bookNote: "Grupos de máximo 12 personas · Selección por fit",
    heroBody1: "Un viaje diseñado para founders. No un viaje de empresa. No un evento de networking genérico.",
    heroBody2: "Cinco días en Bangkok con un grupo reducido de emprendedores. Proyectos reales, feedback honesto, experiencias auténticas y conexiones que duran más que el viaje.",
    whatEyebrow: "No es turismo. Es construcción.",
    whatH2: "El viaje que querías hacer.", whatH2Accent: "Con la gente correcta.",
    whatBody1: "Hemos diseñado este viaje para que sea simultáneamente el mejor viaje de tu vida y el evento de networking más valioso al que hayas ido. No son cosas opuestas.",
    whatBody2: "El equipo de SF facilita las sesiones de trabajo y el feedback sobre proyectos. Discoolver diseña las experiencias en la ciudad. Tú solo tienes que estar presente.",
    sfLabel: "Startup Factory pone", sfDesc: "Selección del grupo · Talleres de estrategia · Review de proyectos · Feedback honesto · Conexiones del ecosistema",
    discoolverLabel: "Discoolver pone", discoolverDesc: "Bangkok auténtico · Experiencias off-the-beaten-path · Gastronomía local · Espacios de trabajo curados · Guías creadores locales",
    youLabel: "Tú pones", youDesc: "Tu proyecto · Tu energía · Ganas de construir, compartir y descubrir",
    scheduleEyebrow: "5 días · Bangkok", scheduleH2: "El programa",
    scheduleNote: "Estructurado para que el trabajo y la experiencia se potencien, no compitan.",
    includedH2: "Qué incluye",
    forWhomEyebrow: "Plazas limitadas a 12",
    forWhomH2: "Este viaje es para ti si…",
    forWhomDesc: "Seleccionamos los perfiles con cuidado para que el grupo sea complementario y las conexiones tengan sentido real.",
    quoteLine: "Bangkok no se visita. Bangkok se experimenta. Y cuando lo haces con otros founders, deja de ser un viaje y se convierte en un punto de inflexión.",
    quoteAuthor: "Equipo Startup Factory", quoteNote: "Operando desde Bangkok desde 2022",
    finalEyebrow: "Plazas limitadas", finalH2: "¿Vienes a", finalH2Accent: "Bangkok?",
    finalBody: "Déjanos tus datos y cuéntanos brevemente tu proyecto. Seleccionamos el grupo con cuidado para que cada plaza valga la pena.",
    heroStats: [
      { n: "5", label: "días en Bangkok" },
      { n: "12", label: "founders máximo" },
      { n: "100%", label: "experiencias curadas" },
      { n: "1", label: "ciudad que lo cambia todo" },
    ],
    experience: [
      { day: "Día 1", title: "Llegada y onboarding del ecosistema", desc: "Primer contacto con Bangkok real. Welcome dinner con el equipo SF, briefing del programa y primera ronda de presentaciones entre founders." },
      { day: "Día 2–3", title: "Talleres, co-working y proyectos", desc: "Sesiones de trabajo en espacios curados por Discoolver. Workshop de estrategia con el equipo SF. Cada founder presenta su proyecto — feedback honesto del grupo." },
      { day: "Día 4", title: "Bangkok auténtico con Discoolver", desc: "La ciudad que no aparece en las guías. Mercados locales, rooftops, experiencias gastronómicas y culturales seleccionadas por los curadores de Discoolver." },
      { day: "Día 5", title: "Networking, templetes y despedida", desc: "Mañana libre para conectar y explorar. Tarde de cierre: retrospectiva del grupo, siguientes pasos de cada proyecto y cena de despedida." },
    ],
    included: [
      { icon: "🏠", label: "Alojamiento", desc: "Apartamentos o boutique hotel en barrio curado por Discoolver" },
      { icon: "🍜", label: "Experiencias gastronómicas", desc: "Mercados, restaurantes locales y cenas de networking" },
      { icon: "🧠", label: "Talleres SF", desc: "Sesiones de estrategia, growth e IA aplicada a tu proyecto" },
      { icon: "🤝", label: "Networking founders", desc: "Grupo reducido de máximo 12 personas seleccionadas" },
      { icon: "🌆", label: "Guía Discoolver", desc: "Bangkok auténtico: off-the-beaten-path curado por creadores locales" },
      { icon: "📋", label: "Review de proyecto", desc: "Sesión 1:1 con el equipo SF para analizar tu proyecto en profundidad" },
    ],
    forWhom: [
      "Eres founder, emprendedor o nómada digital con un proyecto activo",
      "Quieres conocer a otros builders de verdad, no en un evento de networking genérico",
      "Te interesa Bangkok como base de operaciones o simplemente quieres conocerla por dentro",
      "Buscas feedback real sobre tu proyecto de gente que también está en el proceso",
      "Quieres vivir Tailandia como un local, no como un turista",
    ],
  },
  en: {
    bookCta: "I want to go — book your spot", viewDiscoolver: "See Discoolver →",
    bookFinalCta: "Book your spot →", bookNote: "Groups of up to 12 people · Selection by fit",
    heroBody1: "A trip designed for founders. Not a company trip. Not a generic networking event.",
    heroBody2: "Five days in Bangkok with a small group of entrepreneurs. Real projects, honest feedback, authentic experiences and connections that last beyond the trip.",
    whatEyebrow: "Not tourism. It's construction.",
    whatH2: "The trip you wanted to take.", whatH2Accent: "With the right people.",
    whatBody1: "We've designed this trip to be simultaneously the best trip of your life and the most valuable networking event you've been to. They're not opposites.",
    whatBody2: "The SF team facilitates the work sessions and project feedback. Discoolver designs the city experiences. You just have to be present.",
    sfLabel: "Startup Factory brings", sfDesc: "Group selection · Strategy workshops · Project reviews · Honest feedback · Ecosystem connections",
    discoolverLabel: "Discoolver brings", discoolverDesc: "Authentic Bangkok · Off-the-beaten-path experiences · Local gastronomy · Curated co-working spaces · Local creator guides",
    youLabel: "You bring", youDesc: "Your project · Your energy · Drive to build, share and discover",
    scheduleEyebrow: "5 days · Bangkok", scheduleH2: "The programme",
    scheduleNote: "Structured so work and experience amplify each other, not compete.",
    includedH2: "What's included",
    forWhomEyebrow: "Limited to 12 spots",
    forWhomH2: "This trip is for you if…",
    forWhomDesc: "We select profiles carefully so the group is complementary and connections make real sense.",
    quoteLine: "Bangkok isn't visited. Bangkok is experienced. And when you do it with other founders, it stops being a trip and becomes an inflection point.",
    quoteAuthor: "Startup Factory Team", quoteNote: "Operating from Bangkok since 2022",
    finalEyebrow: "Limited spots", finalH2: "Coming to", finalH2Accent: "Bangkok?",
    finalBody: "Leave your details and tell us briefly about your project. We select the group carefully so every spot is worth it.",
    heroStats: [
      { n: "5", label: "days in Bangkok" },
      { n: "12", label: "founders max" },
      { n: "100%", label: "curated experiences" },
      { n: "1", label: "city that changes everything" },
    ],
    experience: [
      { day: "Day 1", title: "Arrival and ecosystem onboarding", desc: "First real contact with Bangkok. Welcome dinner with the SF team, programme briefing and first round of founder introductions." },
      { day: "Days 2–3", title: "Workshops, co-working and projects", desc: "Working sessions in spaces curated by Discoolver. Strategy workshop with the SF team. Each founder presents their project — honest group feedback." },
      { day: "Day 4", title: "Authentic Bangkok with Discoolver", desc: "The city that doesn't appear in guidebooks. Local markets, rooftops, gastronomic and cultural experiences selected by Discoolver curators." },
      { day: "Day 5", title: "Networking, temples and farewell", desc: "Free morning to connect and explore. Closing afternoon: group retrospective, next steps for each project and farewell dinner." },
    ],
    included: [
      { icon: "🏠", label: "Accommodation", desc: "Apartments or boutique hotel in a neighbourhood curated by Discoolver" },
      { icon: "🍜", label: "Gastronomic experiences", desc: "Markets, local restaurants and networking dinners" },
      { icon: "🧠", label: "SF Workshops", desc: "Strategy, growth and AI sessions applied to your project" },
      { icon: "🤝", label: "Founder networking", desc: "Small group of up to 12 selected founders" },
      { icon: "🌆", label: "Discoolver guide", desc: "Authentic Bangkok: off-the-beaten-path curated by local creators" },
      { icon: "📋", label: "Project review", desc: "1:1 session with the SF team to analyse your project in depth" },
    ],
    forWhom: [
      "You're a founder, entrepreneur or digital nomad with an active project",
      "You want to meet real builders, not at a generic networking event",
      "You're interested in Bangkok as an operations base or just want to experience it from the inside",
      "You're looking for real feedback on your project from people who are also in the process",
      "You want to experience Thailand like a local, not a tourist",
    ],
  },
  th: {
    bookCta: "ต้องการไป — จองที่นั่งของคุณ", viewDiscoolver: "ดู Discoolver →",
    bookFinalCta: "จองที่นั่งของคุณ →", bookNote: "กลุ่มสูงสุด 12 คน · การคัดเลือกตาม fit",
    heroBody1: "ทริปที่ออกแบบสำหรับ founders ไม่ใช่ทริปของบริษัท ไม่ใช่กิจกรรม networking ทั่วไป",
    heroBody2: "ห้าวันใน Bangkok กับกลุ่มผู้ประกอบการขนาดเล็ก โปรเจกต์จริง feedback ที่ซื่อสัตย์ ประสบการณ์แท้จริง และการเชื่อมต่อที่อยู่นานกว่าทริป",
    whatEyebrow: "ไม่ใช่การท่องเที่ยว แต่คือการสร้าง",
    whatH2: "ทริปที่คุณอยากไป", whatH2Accent: "กับคนที่ใช่",
    whatBody1: "เราออกแบบทริปนี้ให้เป็นทั้งทริปที่ดีที่สุดในชีวิตของคุณและกิจกรรม networking ที่มีคุณค่ามากที่สุดที่คุณเคยไป ทั้งสองสิ่งนี้ไม่ขัดแย้งกัน",
    whatBody2: "ทีม SF อำนวยการเซสชันงานและ feedback เกี่ยวกับโปรเจกต์ Discoolver ออกแบบประสบการณ์ในเมือง คุณแค่ต้องอยู่ที่นั่น",
    sfLabel: "Startup Factory มอบ", sfDesc: "การคัดเลือกกลุ่ม · Workshop กลยุทธ์ · Review โปรเจกต์ · Feedback ที่ซื่อสัตย์ · การเชื่อมต่อ ecosystem",
    discoolverLabel: "Discoolver มอบ", discoolverDesc: "Bangkok แท้จริง · ประสบการณ์ off-the-beaten-path · อาหารท้องถิ่น · พื้นที่ทำงานที่คัดสรร · ไกด์ผู้สร้างท้องถิ่น",
    youLabel: "คุณมอบ", youDesc: "โปรเจกต์ของคุณ · พลังงานของคุณ · ความตั้งใจที่จะสร้าง แชร์ และค้นพบ",
    scheduleEyebrow: "5 วัน · Bangkok", scheduleH2: "โปรแกรม",
    scheduleNote: "มีโครงสร้างเพื่อให้งานและประสบการณ์เสริมกัน ไม่ใช่แข่งขัน",
    includedH2: "สิ่งที่รวมอยู่",
    forWhomEyebrow: "จำกัด 12 ที่นั่ง",
    forWhomH2: "ทริปนี้เหมาะสำหรับคุณถ้า…",
    forWhomDesc: "เราคัดเลือกโปรไฟล์อย่างระมัดระวังเพื่อให้กลุ่มเป็นส่วนเสริมกันและการเชื่อมต่อมีความหมายจริง",
    quoteLine: "Bangkok ไม่ใช่สถานที่ที่ไปเยือน แต่คือสถานที่ที่ได้สัมผัส และเมื่อคุณทำกับ founders คนอื่น มันหยุดเป็นแค่ทริปและกลายเป็นจุดเปลี่ยน",
    quoteAuthor: "ทีม Startup Factory", quoteNote: "ดำเนินงานจาก Bangkok ตั้งแต่ปี 2022",
    finalEyebrow: "ที่นั่งจำกัด", finalH2: "มาที่", finalH2Accent: "Bangkok ไหม?",
    finalBody: "ทิ้งข้อมูลของคุณไว้และบอกเล่าโปรเจกต์ของคุณสั้นๆ เราคัดเลือกกลุ่มอย่างระมัดระวังเพื่อให้ทุกที่นั่งคุ้มค่า",
    heroStats: [
      { n: "5", label: "วันใน Bangkok" },
      { n: "12", label: "founders สูงสุด" },
      { n: "100%", label: "ประสบการณ์ที่คัดสรร" },
      { n: "1", label: "เมืองที่เปลี่ยนทุกอย่าง" },
    ],
    experience: [
      { day: "วันที่ 1", title: "มาถึงและ onboarding ecosystem", desc: "สัมผัส Bangkok จริงครั้งแรก Welcome dinner กับทีม SF briefing โปรแกรม และรอบแรกของการแนะนำตัวระหว่าง founders" },
      { day: "วันที่ 2–3", title: "Workshop, co-working และโปรเจกต์", desc: "เซสชันงานในพื้นที่ที่ Discoolver คัดสรร Workshop กลยุทธ์กับทีม SF แต่ละ founder นำเสนอโปรเจกต์ — feedback ที่ซื่อสัตย์จากกลุ่ม" },
      { day: "วันที่ 4", title: "Bangkok แท้จริงกับ Discoolver", desc: "เมืองที่ไม่ปรากฏในคู่มือท่องเที่ยว ตลาดท้องถิ่น rooftops ประสบการณ์อาหารและวัฒนธรรมที่คัดโดย curators ของ Discoolver" },
      { day: "วันที่ 5", title: "Networking, วัด และอำลา", desc: "เช้าอิสระเพื่อเชื่อมต่อและสำรวจ บ่ายปิด: retrospective กลุ่ม ขั้นตอนต่อไปของแต่ละโปรเจกต์ และอาหารค่ำอำลา" },
    ],
    included: [
      { icon: "🏠", label: "ที่พัก", desc: "อพาร์ตเมนต์หรือ boutique hotel ในย่านที่ Discoolver คัดสรร" },
      { icon: "🍜", label: "ประสบการณ์อาหาร", desc: "ตลาด ร้านอาหารท้องถิ่น และ networking dinner" },
      { icon: "🧠", label: "Workshop SF", desc: "เซสชันกลยุทธ์ growth และ AI ที่นำไปใช้กับโปรเจกต์ของคุณ" },
      { icon: "🤝", label: "Networking founders", desc: "กลุ่มเล็กสูงสุด 12 คนที่คัดเลือก" },
      { icon: "🌆", label: "ไกด์ Discoolver", desc: "Bangkok แท้จริง: off-the-beaten-path คัดโดยผู้สร้างท้องถิ่น" },
      { icon: "📋", label: "Review โปรเจกต์", desc: "เซสชัน 1:1 กับทีม SF เพื่อวิเคราะห์โปรเจกต์ของคุณอย่างลึก" },
    ],
    forWhom: [
      "คุณเป็น founder ผู้ประกอบการ หรือ digital nomad ที่มีโปรเจกต์ที่ active",
      "คุณต้องการพบ builders จริงๆ ไม่ใช่ในกิจกรรม networking ทั่วไป",
      "คุณสนใจ Bangkok เป็นฐานปฏิบัติการหรือแค่ต้องการสัมผัสจากข้างใน",
      "คุณกำลังมองหา feedback จริงเกี่ยวกับโปรเจกต์จากคนที่ก็อยู่ในกระบวนการ",
      "คุณต้องการสัมผัสประเทศไทยแบบ local ไม่ใช่นักท่องเที่ยว",
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
    alternates: {
      canonical: `${site}/${locale}/bangkok-trip`,
      languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/bangkok-trip`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const experience = [
  {
    day: "Día 1",
    title: "Llegada y onboarding del ecosistema",
    desc: "Primer contacto con Bangkok real. Welcome dinner con el equipo SF, briefing del programa y primera ronda de presentaciones entre founders.",
  },
  {
    day: "Día 2–3",
    title: "Talleres, co-working y proyectos",
    desc: "Sesiones de trabajo en espacios curados por Discoolver. Workshop de estrategia con el equipo SF. Cada founder presenta su proyecto — feedback honesto del grupo.",
  },
  {
    day: "Día 4",
    title: "Bangkok auténtico con Discoolver",
    desc: "La ciudad que no aparece en las guías. Mercados locales, rooftops, experiencias gastronómicas y culturales seleccionadas por los curadores de Discoolver.",
  },
  {
    day: "Día 5",
    title: "Networking, templetes y despedida",
    desc: "Mañana libre para conectar y explorar. Tarde de cierre: retrospectiva del grupo, siguientes pasos de cada proyecto y cena de despedida.",
  },
];

const forWhom = [
  "Eres founder, emprendedor o nómada digital con un proyecto activo",
  "Quieres conocer a otros builders de verdad, no en un evento de networking genérico",
  "Te interesa Bangkok como base de operaciones o simplemente quieres conocerla por dentro",
  "Buscas feedback real sobre tu proyecto de gente que también está en el proceso",
  "Quieres vivir Tailandia como un local, no como un turista",
];

const included = [
  { icon: "🏠", label: "Alojamiento", desc: "Apartamentos o boutique hotel en barrio curado por Discoolver" },
  { icon: "🍜", label: "Experiencias gastronómicas", desc: "Mercados, restaurantes locales y cenas de networking" },
  { icon: "🧠", label: "Talleres SF", desc: "Sesiones de estrategia, growth e IA aplicada a tu proyecto" },
  { icon: "🤝", label: "Networking founders", desc: "Grupo reducido de máximo 12 personas seleccionadas" },
  { icon: "🌆", label: "Guía Discoolver", desc: "Bangkok auténtico: off-the-beaten-path curado por creadores locales" },
  { icon: "📋", label: "Review de proyecto", desc: "Sesión 1:1 con el equipo SF para analizar tu proyecto en profundidad" },
];

export default async function BangkokTripPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = ctaDict[l] ?? ctaDict.es;

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-black min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-black/70" />
        <div className="orb-purple absolute top-1/2 left-1/3 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-25 blur-3xl" style={{ background: `radial-gradient(circle, ${DISCOOLVER_PINK}44 0%, transparent 70%)` }} />
        <div className="absolute bottom-[15%] left-[5%] w-[300px] h-[300px] rounded-full opacity-15 blur-3xl" style={{ background: `radial-gradient(circle, ${DISCOOLVER_PINK}33 0%, transparent 70%)` }} />

        <div className="relative w-full max-w-7xl mx-auto px-6 pt-28 pb-24">
          <div className="flex mb-10">
            <span className="inline-flex items-center gap-3 border rounded-full px-5 py-2 backdrop-blur-sm" style={{ borderColor: `${DISCOOLVER_PINK}40`, background: `${DISCOOLVER_PINK}0D` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: DISCOOLVER_PINK }} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: DISCOOLVER_PINK }}>
                Startup Factory × Discoolver
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="text-xs font-semibold text-white/50 uppercase tracking-[0.15em]">Bangkok · Thailand</span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-[family-name:var(--font-space-grotesk)] font-black leading-[0.88] tracking-[-0.03em] mb-8">
                <span className="block text-[clamp(56px,8vw,104px)]" style={{ color: DISCOOLVER_PINK }}>BANGKOK</span>
                <span className="block text-[clamp(40px,6vw,80px)] text-white">FOUNDER</span>
                <span className="block text-[clamp(40px,6vw,80px)] text-white">TRIP.</span>
              </h1>
              <p className="text-xl text-white/60 leading-relaxed mb-4 max-w-lg">{t.heroBody1}</p>
              <p className="text-white/40 leading-relaxed mb-10 max-w-lg">{t.heroBody2}</p>
              <div className="flex flex-wrap gap-4">
                <Link href={`/${locale}/aplica`} className="font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full text-base"
                  style={{ background: DISCOOLVER_PINK, color: 'white' }}>
                  {t.bookCta}
                </Link>
                <a href="https://discoolver.com" target="_blank" rel="noopener noreferrer"
                  className="border border-white/15 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:bg-white/[0.06] transition-all duration-200">
                  {t.viewDiscoolver}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {t.heroStats.map((s) => (
                <div key={s.label} className="card-dark rounded-2xl p-6 text-center">
                  <div className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl mb-2" style={{ color: DISCOOLVER_PINK }}>{s.n}</div>
                  <div className="text-xs text-white/40 uppercase tracking-wide leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUÉ ES ───────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: '#05050D' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${DISCOOLVER_PINK}40, transparent)` }} />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-5 block" style={{ color: DISCOOLVER_PINK }}>{t.whatEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em] leading-tight mb-6">
                {t.whatH2}<br /><span className="gradient-text">{t.whatH2Accent}</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-6">{t.whatBody1}</p>
              <p className="text-white/35 leading-relaxed">{t.whatBody2}</p>
            </div>
            <div className="space-y-4">
              <div className="card-dark rounded-2xl p-6 border-l-2 border-[#A855F7]">
                <p className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3">{t.sfLabel}</p>
                <p className="text-white/70 text-sm leading-relaxed">{t.sfDesc}</p>
              </div>
              <div className="card-dark rounded-2xl p-6 border-l-2" style={{ borderLeftColor: DISCOOLVER_PINK }}>
                <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: DISCOOLVER_PINK }}>{t.discoolverLabel}</p>
                <p className="text-white/70 text-sm leading-relaxed">{t.discoolverDesc}</p>
              </div>
              <div className="card-dark rounded-2xl p-6">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.15em] mb-3">{t.youLabel}</p>
                <p className="text-white/70 text-sm leading-relaxed">{t.youDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROGRAMA ────────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-15" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] mb-5 block" style={{ color: DISCOOLVER_PINK }}>{t.scheduleEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em]">{t.scheduleH2}</h2>
            <p className="mt-4 text-white/40 max-w-lg mx-auto">{t.scheduleNote}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {t.experience.map((e) => (
              <div key={e.day} className="card-dark rounded-2xl p-8 hover:border-white/10 transition-colors duration-200">
                <span className="text-xs font-bold uppercase tracking-[0.15em] mb-3 block" style={{ color: DISCOOLVER_PINK }}>{e.day}</span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-3 leading-snug">{e.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUÉ INCLUYE ─────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24" style={{ background: '#05050D' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em]">{t.includedH2}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.included.map((item) => (
              <div key={item.label} className="card-dark rounded-2xl p-7">
                <span className="text-3xl block mb-4">{item.icon}</span>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{item.label}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARA QUIÉN ──────────────────────────────────────────────── */}
      <section className="relative bg-black py-16 md:py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-5 block" style={{ color: DISCOOLVER_PINK }}>{t.forWhomEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em] leading-tight mb-6">
                {t.forWhomH2}
              </h2>
              <p className="text-white/40 leading-relaxed">{t.forWhomDesc}</p>
            </div>
            <ul className="space-y-4">
              {t.forWhom.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${DISCOOLVER_PINK}20`, border: `1px solid ${DISCOOLVER_PINK}40` }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: DISCOOLVER_PINK }} />
                  </span>
                  <span className="text-white/70 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── QUOTE ───────────────────────────────────────────────────── */}
      <section className="relative py-16 overflow-hidden" style={{ background: '#05050D' }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${DISCOOLVER_PINK}08 0%, transparent 70%)` }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="font-[family-name:var(--font-space-grotesk)] font-black text-5xl leading-none block mb-6" style={{ color: DISCOOLVER_PINK }}>"</span>
          <blockquote className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(22px,3vw,38px)] text-white leading-tight mb-6 tracking-[-0.02em]">
            {t.quoteLine}
          </blockquote>
          <p className="text-white/40 text-sm font-semibold mb-1">{t.quoteAuthor}</p>
          <p className="text-white/25 text-xs uppercase tracking-[0.15em]">{t.quoteNote}</p>
        </div>
      </section>

      {/* ─── CTA FINAL ───────────────────────────────────────────────── */}
      <section className="relative bg-black overflow-hidden py-16 md:py-24">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-15" style={{ background: DISCOOLVER_PINK }} />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] mb-6 block" style={{ color: DISCOOLVER_PINK }}>{t.finalEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(36px,5vw,64px)] text-white mb-6 tracking-[-0.03em] leading-tight">
            {t.finalH2}<br /><span style={{ color: DISCOOLVER_PINK }}>{t.finalH2Accent}</span>
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto leading-relaxed">{t.finalBody}</p>
          <Link href={`/${locale}/aplica`} className="font-[family-name:var(--font-space-grotesk)] font-bold px-12 py-5 rounded-full text-lg inline-block text-white"
            style={{ background: DISCOOLVER_PINK, boxShadow: `0 0 40px ${DISCOOLVER_PINK}40` }}>
            {t.bookFinalCta}
          </Link>
          <p className="mt-6 text-white/25 text-xs">{t.bookNote}</p>
        </div>
      </section>
    </>
  );
}
