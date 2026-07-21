import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { loadCmsSections, mergeCms } from "@/lib/cms-pages";
import { PagePixels, loadPagePixels } from "@/components/PagePixels";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Casos de éxito | Portfolio — Startup Factory", description: "Proyectos reales ejecutados con Startup Factory. Emprendedores, startups y corporates que han avanzado con nuestro modelo Team as a Service." },
  en: { title: "Success cases | Portfolio — Startup Factory", description: "Real projects executed with Startup Factory. Entrepreneurs, startups and corporates that have advanced with our Team as a Service model." },
  th: { title: "กรณีความสำเร็จ | Portfolio — Startup Factory", description: "โปรเจกต์จริงที่ดำเนินงานกับ Startup Factory ผู้ประกอบการ สตาร์ทอัพ และองค์กรที่ก้าวหน้าด้วยโมเดล Team as a Service ของเรา" },
};

const casesDict: Record<Locale, Array<{ tag: string; title: string; outcome: string; desc: string }>> = {
  es: [
    { tag: "Startup · Growth", title: "De 0 a 50k MRR en 6 meses", outcome: "Squad: CMO Fractional + Dev + Data", desc: "Diseñamos e implementamos la estrategia de adquisición completa, optimizamos el funnel y escalamos a paid." },
    { tag: "Emprendedor · MVP", title: "MVP validado en 8 semanas", outcome: "Squad: PM + UX/UI + Dev No-code", desc: "Desde la idea al producto funcional con primeros usuarios pagando. Roadmap 30/60/90 + ejecución." },
    { tag: "Corporate · Innovación", title: "Piloto de innovación abierta", outcome: "3 startups cualificadas, 1 piloto ejecutado", desc: "Definimos el reto, diseñamos el programa, seleccionamos startups y ejecutamos un piloto validado." },
    { tag: "Startup · Ronda", title: "Ronda pre-seed cerrada", outcome: "Squad: CEO Fractional + Fundraising", desc: "Deck, financial model, estrategia y acompañamiento en el proceso de captación de inversores." },
  ],
  en: [
    { tag: "Startup · Growth", title: "From 0 to 50k MRR in 6 months", outcome: "Squad: Fractional CMO + Dev + Data", desc: "We designed and implemented the full acquisition strategy, optimized the funnel and scaled to paid." },
    { tag: "Entrepreneur · MVP", title: "MVP validated in 8 weeks", outcome: "Squad: PM + UX/UI + No-code Dev", desc: "From idea to functional product with first paying users. 30/60/90 roadmap + execution." },
    { tag: "Corporate · Innovation", title: "Open innovation pilot", outcome: "3 qualified startups, 1 executed pilot", desc: "We defined the challenge, designed the program, selected startups and executed a validated pilot." },
    { tag: "Startup · Round", title: "Pre-seed round closed", outcome: "Squad: Fractional CEO + Fundraising", desc: "Deck, financial model, strategy and accompaniment in the investor acquisition process." },
  ],
  th: [
    { tag: "สตาร์ทอัพ · Growth", title: "จาก 0 ถึง 50k MRR ใน 6 เดือน", outcome: "ทีม: Fractional CMO + Dev + Data", desc: "เราออกแบบและนำกลยุทธ์การได้ลูกค้าแบบเต็มไปใช้ ปรับปรุง funnel และขยายสู่ paid" },
    { tag: "ผู้ประกอบการ · MVP", title: "MVP ที่ยืนยันแล้วใน 8 สัปดาห์", outcome: "ทีม: PM + UX/UI + No-code Dev", desc: "จากไอเดียสู่ผลิตภัณฑ์ที่ใช้งานได้พร้อมผู้ใช้ที่จ่ายเงินคนแรก Roadmap 30/60/90 + การดำเนินงาน" },
    { tag: "องค์กร · นวัตกรรม", title: "Pilot นวัตกรรมแบบเปิด", outcome: "3 startup ที่ผ่านการคัดกรอง, 1 pilot ที่ดำเนินงาน", desc: "เรากำหนดความท้าทาย ออกแบบโปรแกรม เลือก startup และดำเนินการ pilot ที่ยืนยันแล้ว" },
    { tag: "สตาร์ทอัพ · รอบการระดมทุน", title: "ปิดรอบ pre-seed แล้ว", outcome: "ทีม: Fractional CEO + Fundraising", desc: "Deck, financial model, กลยุทธ์ และการดูแลในกระบวนการหานักลงทุน" },
  ],
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string;
  ctaH2: string; ctaCta: string;
}> = {
  es: {
    eyebrow: "Casos reales", h1: "Reto → lo que hicimos", h1Accent: "→ impacto medible.",
    subtitle: "Así documentamos cada proyecto: el problema real, lo que ejecutamos y el resultado concreto. Para que sepas exactamente qué puedes esperar cuando trabajas con SF.",
    ctaH2: "¿Quieres ser el próximo caso?", ctaCta: "Hablemos de tu proyecto",
  },
  en: {
    eyebrow: "Portfolio", h1: "Real projects,", h1Accent: "real results",
    subtitle: "Entrepreneurs, startups and corporates that have advanced with our model. No invented case studies.",
    ctaH2: "Do you want to be the next case?", ctaCta: "Let's talk about your project",
  },
  th: {
    eyebrow: "Portfolio", h1: "โปรเจกต์จริง,", h1Accent: "ผลลัพธ์จริง",
    subtitle: "ผู้ประกอบการ สตาร์ทอัพ และองค์กรที่ก้าวหน้าด้วยโมเดลของเรา ไม่มีกรณีศึกษาที่ประดิษฐ์ขึ้น",
    ctaH2: "ต้องการเป็นกรณีต่อไปหรือ?", ctaCta: "คุยเรื่องโปรเจกต์ของคุณ",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/casos`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/casos`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CasosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = mergeCms(contentDict[l] ?? contentDict.es, loadCmsSections("casos")["content"]?.data, l);
  const cases = casesDict[l] ?? casesDict.es;

  const casesLabelsDict: Record<Locale, { reto: string; hicimos: string; impacto: string; ctaH2: string; ctaDesc: string; ctaCta: string; portfolioEyebrow: string; }> = {
    es: { reto: "Reto", hicimos: "Qué hicimos", impacto: "Impacto", ctaH2: "¿Tienes un proyecto con potencial real?", ctaDesc: "Cuéntanoslo. El peor caso: sales con feedback honesto y una dirección clara.", ctaCta: "Aplica ahora — es gratis", portfolioEyebrow: "Portfolio" },
    en: { reto: "Challenge", hicimos: "What we did", impacto: "Impact", ctaH2: "Do you have a project with real potential?", ctaDesc: "Tell us about it. Worst case: you leave with honest feedback and a clear direction.", ctaCta: "Apply now — it's free", portfolioEyebrow: "Portfolio" },
    th: { reto: "ความท้าทาย", hicimos: "สิ่งที่เราทำ", impacto: "ผลกระทบ", ctaH2: "คุณมีโปรเจกต์ที่มีศักยภาพจริงหรือ?", ctaDesc: "บอกเล่าให้เราฟัง กรณีที่แย่ที่สุด: คุณออกไปพร้อม feedback ที่ซื่อสัตย์และทิศทางที่ชัดเจน", ctaCta: "สมัครเลย — ฟรี", portfolioEyebrow: "Portfolio" },
  };
  const cl = casesLabelsDict[l] ?? casesLabelsDict.es;

  type CaseDetail = {
    tag: string; title: string; metric: string; client: string | null; clientRole: string | null;
    logo?: string; reto: string; hicimos: string; impacto: string; quote: string | null; confidential?: boolean;
  };

  const casesDetailedDict: Record<Locale, CaseDetail[]> = {
    es: [
      { tag: "Ecommerce · Venture", title: "Dadybox — Nueva línea de negocio construida desde cero", metric: "Venture live", client: "Dadybox", clientRole: "Natalia Aldea, Directora de Marketing", logo: "/logos/dadybox.svg", reto: "Dadybox necesitaba construir una línea de negocio B2B especializada en logística ecommerce para España. Tenían el know-how del sector pero no la estructura ni las herramientas para escalarla.", hicimos: "Modelo de negocio + posicionamiento. Desarrollo de herramientas propias con IA para generación de playbooks logísticos. Estrategia de marketing y primer ciclo de ventas. Ejecución completa como venture partner.", impacto: "Línea de negocio live con producto propio, más de 300 clientes activos y 400K envíos al año. Herramientas de IA propietarias y proceso repetible sin dependencia del equipo fundador.", quote: "Startup Factory no llegó como un proveedor más — llegó como parte del equipo. En meses diseñamos y ejecutamos una línea de negocio completa: desde la estrategia hasta las herramientas. La diferencia real es que se mojan, entregan y se responsabilizan del resultado." },
      { tag: "SaaS · TravelTech · Venture", title: "Discoolver — Plataforma de gestión de destinos turísticos", metric: "Live · España · Bangkok", client: "Discoolver", clientRole: null, logo: "/logos/discoolver.png", reto: "El turismo de destino seguía gestionándose con herramientas genéricas que no capturaban la riqueza cultural y experiencial de cada lugar. Había una oportunidad clara en crear tecnología específica para gestores de destino.", hicimos: "Definición del modelo de negocio SaaS para gestores de destino. Desarrollo del producto digital con curadores locales y IA. Estrategia de entrada al mercado con primeros clientes municipales. Estructura como venture propio de SF.", impacto: "Plataforma live operando en destinos de España y Bangkok. Clientes institucionales activos. Tecnología propia con curadores humanos potenciados por IA.", quote: null },
      { tag: "F&B · Restaurant · Venture", title: "Salsa Burgers — Identidad y marketing de un restaurante de wagyu en Bangkok", metric: "Live · Bangkok", client: "Salsa Burgers", clientRole: null, logo: "/logos/salsa-burgers.png", reto: "Abrir un restaurante con identidad propia y diferencial en Bangkok — mercado exigente y saturado — con una propuesta de wagyu burger que pudiera competir con marcas internacionales.", hicimos: "Construcción completa de Brand Brain con SF Agency. Identidad de marca, tono de voz y estrategia de contenido. Presencia en Google Business, redes sociales y plataformas de delivery (Grab, LINE MAN). Sistema de marketing con IA integrada.", impacto: "Restaurante operativo con rating 5.0 en Google, identidad de marca consolidada y sistema de marketing autónomo con IA. Primer cliente piloto del modelo de agencia de SF.", quote: null },
      { tag: "Música · Eventos · Venture", title: "Mr Traack — Plataforma de descubrimiento musical y eventos", metric: "En desarrollo", client: "Mr Traack", clientRole: null, logo: "/logos/mr-traack.png", reto: "El ecosistema de música independiente y eventos locales carecía de una plataforma que conectara artistas emergentes con audiencias y promotores de forma inteligente.", hicimos: "Definición de modelo de negocio y propuesta de valor. Estrategia de go-to-market para artistas y promotores. Estructura del producto digital. Acompañamiento como venture partner de SF.", impacto: "Proyecto en fase de desarrollo activo. Primeros artistas y promotores validando el modelo.", quote: null },
      { tag: "Club · Lifestyle · Venture", title: "The 10 Club — Club privado para founders y nómadas digitales", metric: "En desarrollo", client: "The 10 Club", clientRole: null, logo: "/logos/the-10-club.png", reto: "Crear un espacio exclusivo de comunidad y lifestyle para founders y nómadas digitales de alto perfil, con acceso a experiencias, conexiones y recursos que no existen en los hubs tradicionales.", hicimos: "Concepto y posicionamiento del club. Definición de propuesta de membresía y estructura de beneficios. Estrategia de adquisición de primeros miembros. Acompañamiento como venture partner.", impacto: "Concepto validado con primeros miembros fundadores. Modelo de membresía definido y en fase de escalado.", quote: null },
      { tag: "Startup · Growth", title: "De 0 a 3× MRR en 6 meses como Growth Partner", metric: "3× MRR", client: "Cliente confidencial", clientRole: null, confidential: true, reto: "Startup con producto validado atascada en su MRR. Equipo interno sin capacidad de escalar canales de adquisición ni optimizar funnel.", hicimos: "Auditoría completa de canales y funnel. Ejecución de growth sprints semanales con experimentos medibles. Optimización de CAC y LTV.", impacto: "Triple de ingresos recurrentes en 6 meses. CAC reducido un 40%. Canales paid y orgánico diversificados.", quote: null },
      { tag: "Emprendedor · MVP", title: "De idea a MVP validado en 8 semanas", metric: "8 semanas", client: "Cliente confidencial", clientRole: null, confidential: true, reto: "Fundador con validación de mercado pero sin equipo técnico. Necesitaba pasar de pitch a producto sin contratar en plantilla.", hicimos: "Squad PM + dev + diseño. Roadmap 30/60/90 con hitos validados. MVP iterativo con usuarios reales desde la semana 3.", impacto: "MVP live con arquitectura escalable. Primeros usuarios pagando. Ronda seed en proceso.", quote: null },
    ],
    en: [
      { tag: "Ecommerce · Venture", title: "Dadybox — New business line built from scratch", metric: "Venture live", client: "Dadybox", clientRole: "Natalia Aldea, Marketing Director", logo: "/logos/dadybox.svg", reto: "Dadybox needed to build a B2B business line specializing in ecommerce logistics for Spain. They had the industry know-how but not the structure or tools to scale it.", hicimos: "Business model + positioning. Development of proprietary AI tools for logistics playbook generation. Marketing strategy and first sales cycle. Full execution as venture partner.", impacto: "Live business line with own product, more than 300 active clients and 400K shipments per year. Proprietary AI tools and repeatable process without founder team dependency.", quote: "Startup Factory didn't arrive as just another supplier — they arrived as part of the team. In months we designed and executed a complete business line: from strategy to tools. The real difference is that they get their hands dirty, deliver and take responsibility for the result." },
      { tag: "SaaS · TravelTech · Venture", title: "Discoolver — Tourism destination management platform", metric: "Live · Spain · Bangkok", client: "Discoolver", clientRole: null, logo: "/logos/discoolver.png", reto: "Destination tourism was still being managed with generic tools that didn't capture the cultural and experiential richness of each place. There was a clear opportunity to create specific technology for destination managers.", hicimos: "SaaS business model definition for destination managers. Digital product development with local curators and AI. Market entry strategy with first municipal clients. Structure as SF's own venture.", impacto: "Live platform operating in destinations in Spain and Bangkok. Active institutional clients. Proprietary technology with human curators powered by AI.", quote: null },
      { tag: "F&B · Restaurant · Venture", title: "Salsa Burgers — Brand identity and marketing for a wagyu restaurant in Bangkok", metric: "Live · Bangkok", client: "Salsa Burgers", clientRole: null, logo: "/logos/salsa-burgers.png", reto: "Opening a restaurant with its own identity and differentiator in Bangkok — a demanding and saturated market — with a wagyu burger proposition that could compete with international brands.", hicimos: "Complete Brand Brain construction with SF Agency. Brand identity, tone of voice and content strategy. Presence on Google Business, social media and delivery platforms (Grab, LINE MAN). Marketing system with integrated AI.", impacto: "Operating restaurant with a 5.0 Google rating, consolidated brand identity and autonomous marketing system with AI. First pilot client of the SF agency model.", quote: null },
      { tag: "Music · Events · Venture", title: "Mr Traack — Music discovery and events platform", metric: "In development", client: "Mr Traack", clientRole: null, logo: "/logos/mr-traack.png", reto: "The independent music and local events ecosystem lacked a platform that intelligently connected emerging artists with audiences and promoters.", hicimos: "Business model and value proposition definition. Go-to-market strategy for artists and promoters. Digital product structure. Accompaniment as SF venture partner.", impacto: "Project in active development phase. First artists and promoters validating the model.", quote: null },
      { tag: "Club · Lifestyle · Venture", title: "The 10 Club — Private club for founders and digital nomads", metric: "In development", client: "The 10 Club", clientRole: null, logo: "/logos/the-10-club.png", reto: "Creating an exclusive community and lifestyle space for high-profile founders and digital nomads, with access to experiences, connections and resources that don't exist in traditional hubs.", hicimos: "Club concept and positioning. Membership proposition and benefits structure definition. First member acquisition strategy. Accompaniment as venture partner.", impacto: "Concept validated with first founding members. Membership model defined and in scaling phase.", quote: null },
      { tag: "Startup · Growth", title: "From 0 to 3× MRR in 6 months as Growth Partner", metric: "3× MRR", client: "Confidential client", clientRole: null, confidential: true, reto: "Startup with validated product stuck at its MRR. Internal team without capacity to scale acquisition channels or optimize funnel.", hicimos: "Full channel and funnel audit. Weekly growth sprint execution with measurable experiments. CAC and LTV optimization.", impacto: "Triple recurring revenue in 6 months. CAC reduced 40%. Paid and organic channels diversified.", quote: null },
      { tag: "Entrepreneur · MVP", title: "From idea to validated MVP in 8 weeks", metric: "8 weeks", client: "Confidential client", clientRole: null, confidential: true, reto: "Founder with market validation but no technical team. Needed to go from pitch to product without hiring full-time.", hicimos: "PM + dev + design squad. 30/60/90 roadmap with validated milestones. Iterative MVP with real users from week 3.", impacto: "Live MVP with scalable architecture. First paying users. Seed round in process.", quote: null },
    ],
    th: [
      { tag: "Ecommerce · Venture", title: "Dadybox — Business line ใหม่สร้างจากศูนย์", metric: "Venture live", client: "Dadybox", clientRole: "Natalia Aldea, ผู้อำนวยการฝ่ายการตลาด", logo: "/logos/dadybox.svg", reto: "Dadybox ต้องการสร้าง business line B2B เฉพาะด้าน ecommerce logistics สำหรับสเปน มี know-how ของอุตสาหกรรมแต่ไม่มีโครงสร้างหรือเครื่องมือในการขยาย", hicimos: "Business model + positioning การพัฒนาเครื่องมือ AI ของตัวเองสำหรับการสร้าง logistics playbooks กลยุทธ์การตลาดและวงจรการขายแรก การดำเนินงานเต็มรูปแบบในฐานะ venture partner", impacto: "Business line ที่ live พร้อมผลิตภัณฑ์ของตัวเอง ลูกค้าที่ active มากกว่า 300 ราย และ 400K การจัดส่งต่อปี เครื่องมือ AI ที่เป็นเจ้าของและกระบวนการที่ทำซ้ำได้โดยไม่พึ่งทีมผู้ก่อตั้ง", quote: "Startup Factory ไม่ได้มาในฐานะผู้จัดจำหน่ายทั่วไป — มาในฐานะส่วนหนึ่งของทีม ในไม่กี่เดือนเราออกแบบและดำเนินการ business line ที่สมบูรณ์: จากกลยุทธ์ถึงเครื่องมือ ความแตกต่างจริงคือพวกเขาลงมือทำ ส่งมอบ และรับผิดชอบผลลัพธ์" },
      { tag: "SaaS · TravelTech · Venture", title: "Discoolver — แพลตฟอร์มการจัดการจุดหมายปลายทางการท่องเที่ยว", metric: "Live · สเปน · Bangkok", client: "Discoolver", clientRole: null, logo: "/logos/discoolver.png", reto: "การท่องเที่ยวจุดหมายปลายทางยังคงถูกจัดการด้วยเครื่องมือทั่วไปที่ไม่ได้จับความรู้สึกทางวัฒนธรรมและประสบการณ์ของแต่ละสถานที่ มีโอกาสที่ชัดเจนในการสร้างเทคโนโลยีเฉพาะสำหรับผู้จัดการจุดหมายปลายทาง", hicimos: "การกำหนด business model SaaS สำหรับผู้จัดการจุดหมายปลายทาง การพัฒนาผลิตภัณฑ์ดิจิทัลกับ curators ท้องถิ่นและ AI กลยุทธ์การเข้าสู่ตลาดกับลูกค้าเทศบาลแรก โครงสร้างในฐานะ venture ของ SF เอง", impacto: "แพลตฟอร์มที่ live ดำเนินการในจุดหมายปลายทางในสเปนและ Bangkok ลูกค้าสถาบันที่ active เทคโนโลยีของตัวเองพร้อม human curators ที่ขับเคลื่อนด้วย AI", quote: null },
      { tag: "F&B · Restaurant · Venture", title: "Salsa Burgers — Brand identity และการตลาดสำหรับร้านอาหาร wagyu ใน Bangkok", metric: "Live · Bangkok", client: "Salsa Burgers", clientRole: null, logo: "/logos/salsa-burgers.png", reto: "การเปิดร้านอาหารที่มี identity และจุดต่างของตัวเองใน Bangkok — ตลาดที่เข้มงวดและอิ่มตัว — ด้วยข้อเสนอ wagyu burger ที่สามารถแข่งกับแบรนด์ระดับนานาชาติ", hicimos: "การสร้าง Brand Brain ที่สมบูรณ์ด้วย SF Agency Brand identity, tone of voice และกลยุทธ์เนื้อหา การมีตัวตนบน Google Business, social media และแพลตฟอร์ม delivery (Grab, LINE MAN) ระบบการตลาดพร้อม AI ในตัว", impacto: "ร้านอาหารที่ดำเนินการพร้อม rating 5.0 บน Google, brand identity ที่แข็งแกร่ง และระบบการตลาดอัตโนมัติด้วย AI ลูกค้า pilot แรกของโมเดลเอเจนซี่ของ SF", quote: null },
      { tag: "ดนตรี · กิจกรรม · Venture", title: "Mr Traack — แพลตฟอร์มค้นพบดนตรีและกิจกรรม", metric: "กำลังพัฒนา", client: "Mr Traack", clientRole: null, logo: "/logos/mr-traack.png", reto: "ระบบนิเวศดนตรีอิสระและกิจกรรมท้องถิ่นขาดแพลตฟอร์มที่เชื่อมต่อศิลปินเกิดใหม่กับผู้ชมและผู้จัดงานอย่างชาญฉลาด", hicimos: "การกำหนด business model และ value proposition กลยุทธ์ go-to-market สำหรับศิลปินและผู้จัดงาน โครงสร้างผลิตภัณฑ์ดิจิทัล การดูแลในฐานะ venture partner ของ SF", impacto: "โปรเจกต์ในระยะพัฒนาที่ active ศิลปินและผู้จัดงานแรกกำลังยืนยัน model", quote: null },
      { tag: "Club · Lifestyle · Venture", title: "The 10 Club — Club ส่วนตัวสำหรับ founders และ digital nomads", metric: "กำลังพัฒนา", client: "The 10 Club", clientRole: null, logo: "/logos/the-10-club.png", reto: "การสร้างพื้นที่ community และ lifestyle พิเศษสำหรับ founders และ digital nomads ระดับสูง พร้อมการเข้าถึงประสบการณ์ การเชื่อมต่อ และทรัพยากรที่ไม่มีใน hubs ดั้งเดิม", hicimos: "แนวคิดและการวางตำแหน่ง club การกำหนด membership proposition และโครงสร้างผลประโยชน์ กลยุทธ์การได้สมาชิกแรก การดูแลในฐานะ venture partner", impacto: "แนวคิดที่ยืนยันแล้วกับสมาชิกผู้ก่อตั้งแรก Membership model ที่กำหนดและอยู่ในระยะขยาย", quote: null },
      { tag: "Startup · Growth", title: "จาก 0 ถึง 3× MRR ใน 6 เดือนในฐานะ Growth Partner", metric: "3× MRR", client: "ลูกค้าที่เป็นความลับ", clientRole: null, confidential: true, reto: "Startup ที่มีผลิตภัณฑ์ที่ยืนยันแล้วแต่ติดอยู่ที่ MRR ทีมภายในไม่มีความสามารถในการขยาย acquisition channels หรือปรับ funnel", hicimos: "การ audit ช่องทางและ funnel แบบเต็ม การดำเนินการ growth sprints รายสัปดาห์พร้อมการทดลองที่วัดได้ การปรับ CAC และ LTV", impacto: "รายได้ recurring สามเท่าใน 6 เดือน CAC ลดลง 40% ช่องทาง paid และ organic ที่หลากหลาย", quote: null },
      { tag: "ผู้ประกอบการ · MVP", title: "จากไอเดียสู่ MVP ที่ยืนยันแล้วใน 8 สัปดาห์", metric: "8 สัปดาห์", client: "ลูกค้าที่เป็นความลับ", clientRole: null, confidential: true, reto: "Founder ที่มีการยืนยันตลาดแต่ไม่มีทีมเทคนิค ต้องการเปลี่ยนจาก pitch เป็นผลิตภัณฑ์โดยไม่จ้างประจำ", hicimos: "ทีม PM + dev + design Roadmap 30/60/90 พร้อม milestones ที่ยืนยัน MVP แบบ iterative กับผู้ใช้จริงตั้งแต่สัปดาห์ที่ 3", impacto: "MVP ที่ live พร้อมสถาปัตยกรรมที่ขยายได้ ผู้ใช้ที่จ่ายเงินคนแรก รอบ seed ในกระบวนการ", quote: null },
    ],
  };

  const casesDetailed: Array<{
    tag: string; title: string; metric: string; client: string | null; clientRole: string | null;
    logo?: string; reto: string; hicimos: string; impacto: string; quote: string | null; confidential?: boolean;
  }> = [
    ...(casesDetailedDict[l] ?? casesDetailedDict.es),
  ];

  return (
    <>
      <PagePixels pixels={loadPagePixels("casos")} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-black min-h-[50vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-30" />
        <div className="orb-magenta absolute top-[20%] right-[5%] w-[300px] h-[300px] rounded-full opacity-20" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block animate-fade-rise delay-0">{t.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-6 animate-fade-rise delay-200">
            {t.h1}{" "}<span className="gradient-text">{t.h1Accent}</span>
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed animate-fade-rise delay-400">{t.subtitle}</p>
        </div>
      </section>

      {/* Case studies */}
      <section className="relative bg-black py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {casesDetailed.map((c) => (
            <div key={c.title} className="card-dark rounded-2xl p-8 md:p-12 hover:border-[#A855F7]/20 transition-colors duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  {c.logo && (
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                      <img src={c.logo} alt={c.client ?? ''} className="w-full h-full object-contain" />
                    </div>
                  )}
                  {c.confidential && (
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-white/30 text-xs font-bold">NDA</span>
                    </div>
                  )}
                  <span className="inline-block bg-[#3D2FFF]/10 border border-[#3D2FFF]/20 text-[#A855F7] text-xs font-semibold px-3 py-1 rounded-full">
                    {c.tag}
                  </span>
                </div>
                <span className="font-[family-name:var(--font-space-grotesk)] font-black text-3xl gradient-text">{c.metric}</span>
              </div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl md:text-3xl text-white mb-10">{c.title}</h2>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div>
                  <p className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3">{cl.reto}</p>
                  <p className="text-white/55 leading-relaxed text-sm">{c.reto}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3">{cl.hicimos}</p>
                  <p className="text-white/55 leading-relaxed text-sm">{c.hicimos}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-3">{cl.impacto}</p>
                  <p className="text-white font-medium leading-relaxed text-sm">{c.impacto}</p>
                </div>
              </div>
              {c.quote && (
                <div className="border-t border-white/[0.06] pt-8">
                  <blockquote className="text-white text-lg italic leading-relaxed mb-4">
                    &ldquo;{c.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full" style={{ background: "linear-gradient(to bottom, #3D2FFF, #A855F7)" }} />
                    <div>
                      <p className="text-white font-semibold text-sm">{c.clientRole}</p>
                      <p className="text-[#A855F7] text-xs font-bold uppercase tracking-wider">{c.client}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white mb-4 tracking-[-0.02em]">{cl.ctaH2}</h2>
          <p className="text-white/55 text-lg mb-10 max-w-lg mx-auto">{cl.ctaDesc}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
            {cl.ctaCta}
          </Link>
        </div>
      </section>
    </>
  );
}
