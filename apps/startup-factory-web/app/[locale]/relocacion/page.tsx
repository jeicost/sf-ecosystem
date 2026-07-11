import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: {
    title: "Reubícate en Bangkok como founder | Startup Factory × CERØ",
    description: "Visa 5 años, 0% impuestos sobre renta exterior y base de operaciones en el corazón del SEA. Startup Factory evalúa si tiene sentido para tu negocio. CERØ lo ejecuta.",
  },
  en: {
    title: "Relocate to Bangkok as a founder | Startup Factory × CERØ",
    description: "5-year visa, 0% tax on foreign income and an operations base in the heart of SEA. Startup Factory evaluates if it makes sense for your business. CERØ executes it.",
  },
  th: {
    title: "ย้ายมาบางกอกในฐานะ founder | Startup Factory × CERØ",
    description: "วีซ่า 5 ปี, ภาษี 0% จากรายได้ต่างประเทศ และฐานปฏิบัติการในใจกลาง SEA Startup Factory ประเมินว่าเหมาะกับธุรกิจของคุณหรือไม่ CERØ ดำเนินการ",
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
      canonical: `${site}/${locale}/relocacion`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/relocacion`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const contentDict: Record<Locale, {
  heroCta1: string; heroCta2: string; finalCta: string; finalNote: string;
  forWhomTitle: string; notForWhomTitle: string;
  criteriaEyebrow: string; criteriaH2: string; criteriaDesc: string;
  whyEyebrow: string; whyH2: string; howEyebrow: string; howH2: string;
  heroH1: string; heroH1Accent: string; heroBody: string;
  sfRole: string; sfRoleDesc: string; ceroRole: string; ceroRoleDesc: string;
  quoteNote: string; firstStepEyebrow: string; ctaH2: string; ctaH2Accent: string; ctaBody: string; ctaBody2: string;
  noFitNote: string;
  reasons: Array<{ stat: string; label: string; desc: string }>;
  steps: Array<{ n: string; title: string; desc: string; who: string }>;
  forWhom: string[];
  notForWhom: string[];
  heroStats: Array<{ n: string; label: string }>;
}> = {
  es: {
    heroCta1: "Evalúa tu caso — es gratis", heroCta2: "Ver CERØ Agency →",
    finalCta: "Evalúa tu caso — es gratis", finalNote: "Primera sesión sin coste · Respuesta en 24h",
    forWhomTitle: "Tiene sentido si…", notForWhomTitle: "No tiene sentido si…",
    criteriaEyebrow: "Criterios", criteriaH2: "Honestidad antes que cualquier cosa",
    criteriaDesc: "Como en todo lo que hacemos, primero vemos si tiene sentido. Menos del 10% de los proyectos que analizamos tienen un fit real con SF. Aquí aplicamos el mismo criterio.",
    whyEyebrow: "Por qué Bangkok", whyH2: "Las razones reales, sin romanticismo",
    howEyebrow: "Cómo funciona", howH2: "SF evalúa.\nCERØ ejecuta.",
    heroH1: "Reubícate en Bangkok.", heroH1Accent: "Sin pausar tu negocio.",
    heroBody: "Si tienes un negocio digital y pagas el 40–50% de impuestos en España, Alemania o Francia, Bangkok puede cambiar tu modelo completamente. Visa de 5 años, 0% sobre renta exterior, €1.200/mes de coste de vida. Lo evaluamos juntos — y si hay fit, CERØ lo ejecuta de principio a fin.",
    sfRole: "Startup Factory", sfRoleDesc: "Diagnóstico de negocio · Evaluación de fit · Acompañamiento estratégico pre y post-mudanza · Tu equipo de ejecución en Bangkok",
    ceroRole: "CERØ Agency", ceroRoleDesc: "Visa DTV · Residencia fiscal tailandesa · Alojamiento vetado · Onboarding en destino · Asesoría fiscal y legal · Renovaciones",
    quoteNote: "Llevo años operando desde Bangkok. La parte fiscal es real. Pero lo que nadie te cuenta es lo que pasa con tu cabeza cuando dejas de trabajar con el estado encima.",
    firstStepEyebrow: "Primer paso",
    ctaH2: "Cuánto pagarías en impuestos", ctaH2Accent: "si ya estuvieras aquí.",
    ctaBody: "En 30 minutos estimamos tu ahorro fiscal potencial, evaluamos si tu estructura lo permite y te explicamos exactamente cómo funciona el proceso. Sin compromiso, sin coste.",
    ctaBody2: "Si hay fit, te conectamos con CERØ y lo gestionamos todo contigo.",
    noFitNote: "Si no encaja ahora, te lo decimos en la primera conversación. Sin rodeos.",
    heroStats: [
      { n: "0%", label: "Impuesto renta exterior" },
      { n: "5 años", label: "Visa DTV multi-entrada" },
      { n: "€510/mes", label: "Apartamento Bangkok" },
      { n: "6-10 sem", label: "De decisión a llegada" },
    ],
    reasons: [
      { stat: "0%", label: "Impuestos sobre renta exterior", desc: "Ingresos generados fuera de Tailandia y no remitidos en el mismo año fiscal: tributación cero. No es un rumor de Twitter — es la ley tailandesa. Legal, documentado, validado por despachos fiscales locales." },
      { stat: "5 años", label: "Visa DTV — multi-entrada", desc: "La Destination Thailand Visa da estabilidad real. Sin renovaciones anuales, sin salidas de pánico a países vecinos, sin ansiedad migratoria. Cinco años sobre el papel desde el primer día." },
      { stat: "€510/mes", label: "Apartamento en Bangkok centro", desc: "Alojamiento de calidad europea — piscina, gym, seguridad — en barrios como Ekkamai, Thonglor o Rama 9. Comida, transporte y ocio: ~€300/mes adicionales. Coste total de vida: ~€1.200/mes." },
      { stat: "GMT+7", label: "La zona horaria que nadie espera", desc: "Tu mañana termina antes de que Europa abra. Las tardes son completamente tuyas. Sin el agotamiento del fundador europeo atrapado en reuniones hasta las 7pm. Aquí acabas antes." },
    ],
    steps: [
      { n: "01", title: "Evaluación de fit con SF", desc: "Analizamos tu estructura de negocio, ingresos, clientes y operativa. No tiene sentido para todo el mundo — lo decimos con honestidad antes de que muevas nada.", who: "Startup Factory" },
      { n: "02", title: "Diagnóstico fiscal y legal", desc: "El equipo de CERØ revisa tu situación: tipo de empresa, país de residencia, modelo de ingresos. Calculan cuánto ahorras y cómo estructurarlo correctamente.", who: "CERØ Agency" },
      { n: "03", title: "Solicitud DTV + tax setup", desc: "CERØ gestiona la visa DTV, el certificado de residencia fiscal tailandesa y la documentación necesaria. Timeline medio: 6-10 semanas desde decisión.", who: "CERØ Agency" },
      { n: "04", title: "Alojamiento y llegada", desc: "Selección de apartamento en Bangkok o Chiang Mai según tu perfil y presupuesto. Recepción en destino y onboarding local completo.", who: "CERØ Agency" },
      { n: "05", title: "Tu negocio, sin pausa", desc: "Tus clientes no notan nada. Tus operaciones siguen igual. SF puede seguir siendo tu equipo de ejecución desde Bangkok si lo necesitas.", who: "Startup Factory" },
    ],
    forWhom: [
      "Tienes ingresos digitales de +€30K/año y pagas impuestos en España, Alemania, Francia o Italia",
      "Operas online y tus clientes pueden trabajar contigo desde cualquier lugar",
      "Llevas tiempo pensando en optimizar tu fiscalidad de forma legal y estructurada",
      "Quieres una base estable en Asia sin perder conexión con el ecosistema europeo",
      "Tienes una empresa constituida o trabajas como freelance/autónomo con clientes internacionales",
    ],
    notForWhom: [
      "Tus ingresos dependen de presencia física en un país específico",
      "Buscas algo rápido sin entender bien las implicaciones fiscales y legales",
      "Tienes menos de €30K anuales — el ahorro no compensa los costes de estructura",
    ],
  },
  en: {
    heroCta1: "Evaluate your case — it's free", heroCta2: "See CERØ Agency →",
    finalCta: "Evaluate your case — it's free", finalNote: "First session at no cost · Response in 24h",
    forWhomTitle: "It makes sense if…", notForWhomTitle: "It doesn't make sense if…",
    criteriaEyebrow: "Criteria", criteriaH2: "Honesty before anything else",
    criteriaDesc: "As with everything we do, we first see if it makes sense. Less than 10% of projects we analyze have a real fit with SF. We apply the same criteria here.",
    whyEyebrow: "Why Bangkok", whyH2: "The real reasons, without romanticism",
    howEyebrow: "How it works", howH2: "SF evaluates.\nCERØ executes.",
    heroH1: "Relocate to Bangkok.", heroH1Accent: "Without pausing your business.",
    heroBody: "If you have a digital business and pay 40–50% tax in Spain, Germany or France, Bangkok can completely change your model. 5-year visa, 0% on foreign income, €1,200/month cost of living. We evaluate it together — and if there's fit, CERØ executes it from start to finish.",
    sfRole: "Startup Factory", sfRoleDesc: "Business diagnosis · Fit evaluation · Strategic support pre and post-move · Your execution team in Bangkok",
    ceroRole: "CERØ Agency", ceroRoleDesc: "DTV Visa · Thai tax residency · Vetted accommodation · On-ground onboarding · Tax and legal advice · Renewals",
    quoteNote: "I've been operating from Bangkok for years. The tax side is real. But what nobody tells you is what happens in your head when you stop working with the state breathing down your neck.",
    firstStepEyebrow: "First step",
    ctaH2: "How much tax you'd pay", ctaH2Accent: "if you were already here.",
    ctaBody: "In 30 minutes we estimate your potential tax savings, evaluate if your structure allows it and explain exactly how the process works. No commitment, no cost.",
    ctaBody2: "If there's fit, we connect you with CERØ and manage everything with you.",
    noFitNote: "If it doesn't fit right now, we tell you in the first conversation. No beating around the bush.",
    heroStats: [
      { n: "0%", label: "Tax on foreign income" },
      { n: "5 years", label: "DTV multi-entry visa" },
      { n: "€510/mo", label: "Bangkok city apartment" },
      { n: "6-10 wks", label: "Decision to arrival" },
    ],
    reasons: [
      { stat: "0%", label: "Tax on foreign income", desc: "Income generated outside Thailand and not remitted in the same tax year: zero taxation. It's not a Twitter rumour — it's Thai law. Legal, documented, validated by local tax firms." },
      { stat: "5 years", label: "DTV Visa — multi-entry", desc: "The Destination Thailand Visa provides real stability. No annual renewals, no panic runs to neighbouring countries, no immigration anxiety. Five years on paper from day one." },
      { stat: "€510/mo", label: "Bangkok city-centre apartment", desc: "European-quality accommodation — pool, gym, security — in areas like Ekkamai, Thonglor or Rama 9. Food, transport and leisure: ~€300/month extra. Total cost of living: ~€1,200/month." },
      { stat: "GMT+7", label: "The timezone nobody expects", desc: "Your morning ends before Europe opens. Afternoons are completely yours. None of the exhaustion of the European founder trapped in meetings until 7pm. Here you finish earlier." },
    ],
    steps: [
      { n: "01", title: "Fit evaluation with SF", desc: "We analyze your business structure, income, clients and operations. It doesn't make sense for everyone — we tell you honestly before you move anything.", who: "Startup Factory" },
      { n: "02", title: "Tax and legal diagnosis", desc: "The CERØ team reviews your situation: company type, country of residence, income model. They calculate how much you save and how to structure it correctly.", who: "CERØ Agency" },
      { n: "03", title: "DTV application + tax setup", desc: "CERØ handles the DTV visa, Thai tax residency certificate and all necessary documentation. Average timeline: 6-10 weeks from decision.", who: "CERØ Agency" },
      { n: "04", title: "Accommodation and arrival", desc: "Apartment selection in Bangkok or Chiang Mai based on your profile and budget. On-ground reception and full local onboarding.", who: "CERØ Agency" },
      { n: "05", title: "Your business, uninterrupted", desc: "Your clients notice nothing. Your operations continue as usual. SF can remain your execution team from Bangkok if you need it.", who: "Startup Factory" },
    ],
    forWhom: [
      "You have digital income of +€30K/year and pay taxes in Spain, Germany, France or Italy",
      "You operate online and your clients can work with you from anywhere",
      "You've been thinking about optimising your tax situation legally and structurally",
      "You want a stable base in Asia without losing connection to the European ecosystem",
      "You have a registered company or work as a freelancer with international clients",
    ],
    notForWhom: [
      "Your income depends on physical presence in a specific country",
      "You're looking for something quick without fully understanding the tax and legal implications",
      "You earn less than €30K/year — the savings don't justify the structural costs",
    ],
  },
  th: {
    heroCta1: "ประเมินกรณีของคุณ — ฟรี", heroCta2: "ดู CERØ Agency →",
    finalCta: "ประเมินกรณีของคุณ — ฟรี", finalNote: "เซสชันแรกไม่มีค่าใช้จ่าย · ตอบกลับใน 24 ชม.",
    forWhomTitle: "มีความหมายถ้า…", notForWhomTitle: "ไม่มีความหมายถ้า…",
    criteriaEyebrow: "เกณฑ์", criteriaH2: "ความซื่อสัตย์ก่อนสิ่งอื่นใด",
    criteriaDesc: "เช่นเดียวกับทุกสิ่งที่เราทำ เราเริ่มจากการดูว่ามีความหมายหรือไม่ น้อยกว่า 10% ของโปรเจกต์ที่เราวิเคราะห์มี fit จริงกับ SF เราใช้เกณฑ์เดียวกันที่นี่",
    whyEyebrow: "ทำไม Bangkok", whyH2: "เหตุผลจริง ไม่มีความโรแมนติก",
    howEyebrow: "วิธีการทำงาน", howH2: "SF ประเมิน\nCERØ ดำเนินการ",
    heroH1: "ย้ายมา Bangkok.", heroH1Accent: "โดยไม่หยุดธุรกิจของคุณ.",
    heroBody: "ถ้าคุณมีธุรกิจดิจิทัลและจ่ายภาษี 40–50% ในสเปน เยอรมนี หรือฝรั่งเศส Bangkok สามารถเปลี่ยน model ของคุณได้อย่างสมบูรณ์ วีซ่า 5 ปี ภาษี 0% จากรายได้ต่างประเทศ ค่าครองชีพ €1,200/เดือน เราประเมินร่วมกัน — และถ้ามี fit CERØ ดำเนินการตั้งแต่ต้นจนจบ",
    sfRole: "Startup Factory", sfRoleDesc: "วินิจฉัยธุรกิจ · ประเมิน fit · การสนับสนุนเชิงกลยุทธ์ก่อนและหลังย้าย · ทีมดำเนินงานของคุณใน Bangkok",
    ceroRole: "CERØ Agency", ceroRoleDesc: "วีซ่า DTV · การอยู่อาศัยทางภาษีของไทย · ที่พักที่ผ่านการตรวจสอบ · Onboarding ในสถานที่จริง · คำแนะนำทางภาษีและกฎหมาย · การต่ออายุ",
    quoteNote: "ฉันดำเนินงานจาก Bangkok มาหลายปีแล้ว ด้านภาษีเป็นเรื่องจริง แต่สิ่งที่ไม่มีใครบอกคือสิ่งที่เกิดขึ้นในหัวคุณเมื่อคุณหยุดทำงานโดยมีรัฐบาลกดดัน",
    firstStepEyebrow: "ก้าวแรก",
    ctaH2: "คุณจะจ่ายภาษีเท่าไหร่", ctaH2Accent: "ถ้าคุณอยู่ที่นี่แล้ว",
    ctaBody: "ใน 30 นาทีเราประเมินการประหยัดภาษีที่มีศักยภาพของคุณ ประเมินว่าโครงสร้างของคุณอนุญาตหรือไม่ และอธิบายอย่างชัดเจนว่ากระบวนการทำงานอย่างไร ไม่มีความผูกมัด ไม่มีค่าใช้จ่าย",
    ctaBody2: "ถ้ามี fit เราเชื่อมต่อคุณกับ CERØ และจัดการทุกอย่างร่วมกับคุณ",
    noFitNote: "ถ้าไม่เหมาะตอนนี้ เราจะบอกคุณในการสนทนาครั้งแรก ไม่อ้อมค้อม",
    heroStats: [
      { n: "0%", label: "ภาษีรายได้ต่างประเทศ" },
      { n: "5 ปี", label: "วีซ่า DTV multi-entry" },
      { n: "€510/เดือน", label: "อพาร์ตเมนต์ Bangkok" },
      { n: "6-10 สัปดาห์", label: "จากการตัดสินใจถึงการมาถึง" },
    ],
    reasons: [
      { stat: "0%", label: "ภาษีจากรายได้ต่างประเทศ", desc: "รายได้ที่สร้างนอกประเทศไทยและไม่ส่งกลับในปีภาษีเดียวกัน: ภาษีศูนย์ ไม่ใช่ข่าวลือ Twitter — แต่คือกฎหมายไทย ถูกกฎหมาย มีเอกสาร ผ่านการตรวจสอบโดยบริษัทภาษีท้องถิ่น" },
      { stat: "5 ปี", label: "วีซ่า DTV — multi-entry", desc: "Destination Thailand Visa ให้ความมั่นคงจริงๆ ไม่มีการต่ออายุประจำปี ไม่มีการออกไปประเทศเพื่อนบ้านอย่างตื่นตระหนก ไม่มีความกังวลเรื่องการตรวจคนเข้าเมือง ห้าปีบนกระดาษตั้งแต่วันแรก" },
      { stat: "€510/เดือน", label: "อพาร์ตเมนต์ใจกลาง Bangkok", desc: "ที่พักคุณภาพยุโรป — สระว่ายน้ำ ฟิตเนส รักษาความปลอดภัย — ในย่านอย่าง Ekkamai, Thonglor หรือ Rama 9 อาหาร ขนส่ง และบันเทิง: ~€300/เดือนเพิ่มเติม ค่าครองชีพรวม: ~€1,200/เดือน" },
      { stat: "GMT+7", label: "เขตเวลาที่ไม่มีใครคาดคิด", desc: "เช้าของคุณจบก่อนที่ยุโรปจะเปิด บ่ายเป็นของคุณทั้งหมด ไม่มีความเหนื่อยล้าของ founder ยุโรปที่ติดอยู่ในการประชุมจนถึง 7 โมงเย็น ที่นี่คุณเสร็จเร็วกว่า" },
    ],
    steps: [
      { n: "01", title: "ประเมิน fit กับ SF", desc: "เราวิเคราะห์โครงสร้างธุรกิจ รายได้ ลูกค้า และการดำเนินงานของคุณ ไม่มีความหมายสำหรับทุกคน — เราบอกอย่างซื่อสัตย์ก่อนที่คุณจะเคลื่อนไหวใดๆ", who: "Startup Factory" },
      { n: "02", title: "วินิจฉัยภาษีและกฎหมาย", desc: "ทีม CERØ ตรวจสอบสถานการณ์ของคุณ: ประเภทบริษัท ประเทศที่พำนัก model รายได้ พวกเขาคำนวณว่าคุณประหยัดเท่าไหร่และวิธีจัดโครงสร้างที่ถูกต้อง", who: "CERØ Agency" },
      { n: "03", title: "ยื่นขอ DTV + tax setup", desc: "CERØ ดูแลวีซ่า DTV ใบรับรองการอยู่อาศัยทางภาษีของไทย และเอกสารที่จำเป็น Timeline เฉลี่ย: 6-10 สัปดาห์จากการตัดสินใจ", who: "CERØ Agency" },
      { n: "04", title: "ที่พักและการมาถึง", desc: "การเลือกอพาร์ตเมนต์ใน Bangkok หรือ Chiang Mai ตามโปรไฟล์และงบประมาณของคุณ การรับในสถานที่จริงและ onboarding ท้องถิ่นครบถ้วน", who: "CERØ Agency" },
      { n: "05", title: "ธุรกิจของคุณ ไม่หยุดพัก", desc: "ลูกค้าของคุณไม่สังเกตเห็นอะไร การดำเนินงานของคุณยังคงเหมือนเดิม SF สามารถยังคงเป็นทีมดำเนินงานของคุณจาก Bangkok ถ้าคุณต้องการ", who: "Startup Factory" },
    ],
    forWhom: [
      "คุณมีรายได้ดิจิทัล +€30K/ปี และจ่ายภาษีในสเปน เยอรมนี ฝรั่งเศส หรืออิตาลี",
      "คุณดำเนินงานออนไลน์และลูกค้าของคุณสามารถทำงานกับคุณได้จากทุกที่",
      "คุณคิดมานานแล้วเกี่ยวกับการเพิ่มประสิทธิภาพภาษีของคุณอย่างถูกกฎหมายและมีโครงสร้าง",
      "คุณต้องการฐานที่มั่นคงในเอเชียโดยไม่สูญเสียการเชื่อมต่อกับ ecosystem ยุโรป",
      "คุณมีบริษัทจดทะเบียนหรือทำงานเป็น freelance/อิสระกับลูกค้าต่างประเทศ",
    ],
    notForWhom: [
      "รายได้ของคุณขึ้นอยู่กับการมีตัวตนทางกายภาพในประเทศใดประเทศหนึ่ง",
      "คุณกำลังมองหาอะไรที่รวดเร็วโดยไม่เข้าใจผลกระทบทางภาษีและกฎหมายดีพอ",
      "คุณมีรายได้น้อยกว่า €30K/ปี — การประหยัดไม่คุ้มกับต้นทุนโครงสร้าง",
    ],
  },
};

export default async function RelocacionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = contentDict[l] ?? contentDict.es;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-black min-h-screen flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[700px] h-[700px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[400px] h-[400px] rounded-full opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />

        <div className="relative w-full max-w-7xl mx-auto px-6 pt-28 pb-32">
          <div className="flex mb-10">
            <span className="inline-flex items-center gap-3 border rounded-full px-5 py-2 backdrop-blur-sm" style={{ borderColor: 'rgba(212,255,71,0.25)', background: 'rgba(212,255,71,0.06)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#D4FF47' }} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#D4FF47' }}>
                Startup Factory × CERØ Agency
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="text-xs font-semibold text-white/50 uppercase tracking-[0.15em]">Bangkok · Thailand</span>
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,96px)] text-white leading-[0.92] tracking-[-0.03em] mb-8 max-w-5xl">
            {t.heroH1}<br />
            <span style={{ color: '#D4FF47' }}>{t.heroH1Accent}</span>
          </h1>

          <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-12">{t.heroBody}</p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-8 py-4 rounded-full text-lg">
              {t.heroCta1}
            </Link>
            <a href="https://www.cero.agency/thailand/" target="_blank" rel="noopener noreferrer"
              className="border border-white/10 text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-8 py-4 rounded-full hover:border-white/30 transition-colors">
              {t.heroCta2}
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 max-w-4xl gap-px rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,255,71,0.15)' }}>
            {t.heroStats.map((s) => (
              <div key={s.label} className="backdrop-blur-sm px-6 py-8 text-center" style={{ background: 'rgba(212,255,71,0.04)' }}>
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl md:text-3xl" style={{ color: '#D4FF47' }}>{s.n}</div>
                <div className="text-xs text-white/40 mt-2 tracking-wide leading-snug uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué Bangkok */}
      <section className="relative py-24" style={{ background: "#05050D" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.whyEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em]">{t.whyH2}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.reasons.map((r) => (
              <div key={r.stat} className="card-dark rounded-2xl p-8 transition-colors duration-200 hover:border-[#D4FF47]/20">
                <div className="font-[family-name:var(--font-space-grotesk)] font-black text-4xl mb-3" style={{ color: '#D4FF47' }}>{r.stat}</div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-3 leading-snug">{r.label}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SF × CERØ — cómo trabajamos juntos */}
      <section className="relative bg-black py-24">
        <div className="orb-purple absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-5 block">{t.howEyebrow}</span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em] leading-tight mb-6">
                {t.howH2.split('\n')[0]}<br /><span className="gradient-text">{t.howH2.split('\n')[1]}</span>
              </h2>
              <div className="card-dark rounded-2xl p-6 mb-4 border-l-2 border-[#A855F7]">
                <p className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3">{t.sfRole}</p>
                <p className="text-white/70 text-sm leading-relaxed">{t.sfRoleDesc}</p>
              </div>
              <div className="card-dark rounded-2xl p-6 border-l-2" style={{ borderLeftColor: '#D4FF47' }}>
                <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#D4FF47' }}>{t.ceroRole}</p>
                <p className="text-white/70 text-sm leading-relaxed">{t.ceroRoleDesc}</p>
              </div>
            </div>

            <div className="space-y-4">
              {t.steps.map((s) => (
                <div key={s.n} className="card-dark rounded-2xl p-6 hover:border-[#A855F7]/20 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <span className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl text-[#A855F7]/30 leading-none min-w-[3rem]">{s.n}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white">{s.title}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={s.who === 'CERØ Agency' ? { color: '#D4FF47', border: '1px solid rgba(212,255,71,0.25)', background: 'rgba(212,255,71,0.06)' } : { color: '#A855F7', border: '1px solid rgba(168,85,247,0.2)' }}>{s.who}</span>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Para quién / No para quién */}
      <section className="relative py-24" style={{ background: "#05050D" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-4 block">{t.criteriaEyebrow}</span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white tracking-[-0.02em]">{t.criteriaH2}</h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">{t.criteriaDesc}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-dark rounded-2xl p-8">
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-6">{t.forWhomTitle}</h3>
              <ul className="space-y-4">
                {t.forWhom.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                    </span>
                    <span className="text-white/70 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-dark rounded-2xl p-8">
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white mb-6">{t.notForWhomTitle}</h3>
              <ul className="space-y-4">
                {t.notForWhom.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-2 h-0.5 bg-white/30" />
                    </span>
                    <span className="text-white/40 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-white/30 text-xs leading-relaxed border-t border-white/[0.06] pt-4">
                {t.noFitNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Bangkok */}
      <section className="relative bg-black py-16 md:py-24 overflow-hidden">
        <div className="orb-purple absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-15" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="gradient-text font-[family-name:var(--font-space-grotesk)] text-5xl leading-none block mb-6">"</span>
          <blockquote className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(22px,3vw,40px)] text-white leading-tight mb-6 tracking-[-0.02em]">
            {t.quoteNote}
          </blockquote>
          <p className="text-white/50 text-sm font-semibold mb-1">Carlos Jacoste</p>
          <p className="text-white/30 text-xs uppercase tracking-[0.15em]">Co-founder, Startup Factory · Bangkok</p>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-20" />
        <div className="orb-magenta absolute top-[10%] right-[10%] w-[300px] h-[300px] opacity-15" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{t.firstStepEyebrow}</span>
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,60px)] text-white mb-6 tracking-[-0.02em]">
            {t.ctaH2} <span className="gradient-text">{t.ctaH2Accent}</span>
          </h2>
          <p className="text-white/50 text-xl mb-4 max-w-xl mx-auto leading-relaxed">{t.ctaBody}</p>
          <p className="text-white/30 text-sm mb-12">{t.ctaBody2}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-12 py-5 rounded-full text-lg inline-block">
            {t.finalCta}
          </Link>
          <p className="mt-6 text-white/25 text-xs">{t.finalNote}</p>
        </div>
      </section>
    </>
  );
}
