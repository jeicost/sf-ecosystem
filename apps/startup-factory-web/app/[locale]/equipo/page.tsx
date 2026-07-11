import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://www.startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "El equipo | Quiénes somos — Startup Factory", description: "Conoce al equipo de Startup Factory. Perfiles senior con experiencia real en ejecución, growth, producto, tecnología y venture." },
  en: { title: "The team | Who we are — Startup Factory", description: "Meet the Startup Factory team. Senior profiles with real experience in execution, growth, product, technology and venture." },
  th: { title: "ทีม | เราคือใคร — Startup Factory", description: "พบกับทีม Startup Factory โปรไฟล์ senior พร้อมประสบการณ์จริงในการดำเนินงาน growth ผลิตภัณฑ์ เทคโนโลยี และ venture" },
};

const valuesDict: Record<Locale, Array<{ title: string; desc: string }>> = {
  es: [
    { title: "Ejecución sobre consultoría", desc: "Cada miembro entrega algo concreto cada semana. No informes — trabajo real." },
    { title: "Resultados, no horas", desc: "Medimos el éxito en impacto real, no en tiempo facturado." },
    { title: "Honestidad sin filtros", desc: "Si algo no funciona, lo decimos. Si hay una forma mejor, la proponemos." },
    { title: "El perfil exacto para cada fase", desc: "Nadie sobra. Nadie falta. El squad se diseña para el momento concreto." },
  ],
  en: [
    { title: "Execution over consultancy", desc: "We don't give advice. We execute." },
    { title: "Real ownership", desc: "We care about the result, not the hours." },
    { title: "Total transparency", desc: "Honest reporting, fast decisions." },
    { title: "Modular team", desc: "The best profiles for each stage." },
  ],
  th: [
    { title: "การดำเนินงานเหนือที่ปรึกษา", desc: "เราไม่ให้คำแนะนำ เราดำเนินงาน" },
    { title: "Ownership จริง", desc: "เราสนใจผลลัพธ์ ไม่ใช่ชั่วโมง" },
    { title: "ความโปร่งใสทั้งหมด", desc: "รายงานที่ซื่อสัตย์ การตัดสินใจรวดเร็ว" },
    { title: "ทีมแบบโมดูล", desc: "โปรไฟล์ที่ดีที่สุดสำหรับแต่ละระยะ" },
  ],
};

const contentDict: Record<Locale, {
  eyebrow: string; h1: string; h1Accent: string; subtitle: string;
  valuesH2: string;
  ctaH2: string; ctaDesc: string; ctaCta: string;
}> = {
  es: {
    eyebrow: "El equipo", h1: "Las personas que", h1Accent: "hacen el trabajo.",
    subtitle: "El equipo de Startup Factory está formado por perfiles senior con experiencia real ejecutando — no asesorando. Cada miembro ha construido, escalado o lanzado algo antes de llegar aquí.",
    valuesH2: "Así trabajamos",
    ctaH2: "¿Tienes un proyecto para el equipo?", ctaDesc: "Cuéntanos qué estás construyendo. Si vemos fit, montamos el squad exacto y empezamos a ejecutar.",
    ctaCta: "Aplica ahora",
  },
  en: {
    eyebrow: "Who we are", h1: "Senior profiles that", h1Accent: "have executed",
    subtitle: "We are not an agency with juniors. The Startup Factory team is made up of profiles with real experience building and scaling projects.",
    valuesH2: "Our values",
    ctaH2: "Do you want to work with us?", ctaDesc: "We are always looking for senior profiles to expand the modular team. Or just tell us about your project.",
    ctaCta: "Contact",
  },
  th: {
    eyebrow: "เราคือใคร", h1: "โปรไฟล์ senior ที่", h1Accent: "ได้ดำเนินงานแล้ว",
    subtitle: "เราไม่ใช่เอเจนซี่ที่มี juniors ทีม Startup Factory ประกอบด้วยโปรไฟล์ที่มีประสบการณ์จริงในการสร้างและขยายโปรเจกต์",
    valuesH2: "ค่านิยมของเรา",
    ctaH2: "ต้องการทำงานกับเราหรือ?", ctaDesc: "เรามองหาโปรไฟล์ senior เสมอเพื่อขยายทีมแบบโมดูล หรือเพียงแค่บอกเล่าโปรเจกต์ของคุณ",
    ctaCta: "ติดต่อ",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title, description: m.description,
    alternates: {
      canonical: `${site}/${locale}/equipo`,
      languages: Object.fromEntries(locales.map((loc) => [loc, `${site}/${loc}/equipo`])),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function EquipoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = contentDict[l] ?? contentDict.es;
  const values = valuesDict[l] ?? valuesDict.es;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-black min-h-[50vh] flex items-center">
        <div className="orb-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[400px] rounded-full opacity-30" />
        <div className="orb-magenta absolute bottom-0 right-[10%] w-[300px] h-[300px] rounded-full opacity-20" />
        <div className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-14">
          <span className="text-xs font-semibold text-[#A855F7] uppercase tracking-[0.15em] mb-6 block">{t.eyebrow}</span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(44px,7vw,88px)] text-white leading-[0.92] tracking-[-0.03em] mb-6 max-w-4xl">
            {t.h1}{" "}<span className="gradient-text">{t.h1Accent}</span>
          </h1>
          <p className="max-w-2xl text-xl text-white/50 leading-relaxed">{t.subtitle}</p>
        </div>
      </section>

      {/* Team members */}
      <section className="relative bg-black py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { photo: "/team/carlos.jpg",    initials: null, name: "Carlos Jacoste",     role: "Co-founder & CEO",                        bio: "15 años en el ecosistema startup. Fundó Spanish Startups (5K+ miembros, 300+ eventos). Ha trabajado con Mahou, Airbus, Siemens y Amadeus. Hoy opera desde Bangkok construyendo SF y sus propios ventures.", linkedin: "https://www.linkedin.com/in/carlosjacoste/" },
              { photo: "/team/diego.jpg",     initials: null, name: "Diego Docavo",        role: "Business Development", bio: "Desarrollo de negocio B2B, relaciones institucionales y construcción de alianzas estratégicas. El perfil que convierte conversaciones en contratos.", linkedin: "https://www.linkedin.com/in/diegodocavo/" },
              { photo: "/team/nacho.jpg",     initials: null, name: "Nacho Sánchez",       role: "Marketing Manager",                       bio: "Estrategia de marketing, gestión de marca y comunicación. El responsable de que SF se vea y se escuche como debe.", linkedin: "https://www.linkedin.com/in/nachosanchezjurado/" },
              { photo: "/team/alessandro.jpg",initials: "AV", name: "Alessandro Valobra", role: "Director de Marketing IA",                bio: "Diseña e implementa sistemas de marketing con IA: captación automatizada, contenido a escala y análisis de rendimiento en tiempo real.", linkedin: "https://www.linkedin.com/in/alessandro-davide-valobra-268217257/" },
              { photo: "/team/josue.jpg",     initials: "JP", name: "Josue Pacheco",       role: "Director de Software & IA",       bio: "Construye el producto digital. Arquitectura, desarrollo y soluciones técnicas con IA aplicada. Del wireframe a producción.", linkedin: "https://www.linkedin.com/in/alexander-josue-pacheco/" },
              { photo: "/team/javier.jpg",    initials: "JR", name: "Javier Rodríguez",   role: "Webmaster & Automatización",                            bio: "Gestión web, automatización de procesos y herramientas digitales. El que hace que todo funcione sin que nadie tenga que pensar en ello.", linkedin: "https://www.linkedin.com/in/javier-r-4b284b232/" },
            ].map((member) => (
              <div key={member.name} className="card-dark rounded-2xl overflow-hidden group hover:border-[#A855F7]/20 transition-all duration-300">
                {member.photo && member.photo !== "#" ? (
                  <div className="relative aspect-square">
                    <Image src={member.photo} alt={member.name} fill className="object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="aspect-square bg-black/60 flex items-center justify-center">
                    <span className="font-[family-name:var(--font-space-grotesk)] font-black text-6xl gradient-text opacity-30">
                      {member.initials}
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xl text-white">{member.name}</h3>
                      <p className="text-[#A855F7] font-semibold text-sm mt-1 mb-3">{member.role}</p>
                    </div>
                    {member.linkedin !== "#" && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${member.name}`} className="shrink-0 mt-1 text-white/20 hover:text-[#A855F7] transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="relative py-24 overflow-hidden" style={{ background: "#05050D" }}>
        <div className="orb-purple absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[200px] opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,48px)] text-white tracking-[-0.02em]">{t.valuesH2}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div key={v.title} className="card-dark rounded-2xl p-8 text-center hover:border-[#A855F7]/60 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D2FFF]/20 to-[#A855F7]/10 border border-white/10 mx-auto mb-4 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-[#3D2FFF] to-[#A855F7]" />
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/50">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-black">
        <div className="orb-magenta absolute right-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[300px] opacity-20" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(32px,4vw,52px)] text-white mb-6 tracking-[-0.02em]">{t.ctaH2}</h2>
          <p className="text-white/55 text-lg mb-10 max-w-lg mx-auto">{t.ctaDesc}</p>
          <Link href={`/${locale}/aplica`} className="btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-bold px-10 py-5 rounded-full text-lg inline-block">
            {t.ctaCta}
          </Link>
        </div>
      </section>
    </>
  );
}
