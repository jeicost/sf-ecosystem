import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const site = "https://startupsfactory.es";

const metaDict: Record<Locale, { title: string; description: string }> = {
  es: { title: "Startup Factory | Links", description: "Todo lo de Startup Factory en un solo lugar." },
  en: { title: "Startup Factory | Links", description: "Everything from Startup Factory in one place." },
  th: { title: "Startup Factory | Links", description: "ทุกอย่างของ Startup Factory ในที่เดียว" },
};

const bioDict: Record<Locale, { tagline: string; location: string }> = {
  es: { tagline: "Llevamos tu proyecto al siguiente nivel", location: "🌏 Desde Bangkok · Para emprendedores hispanohablantes" },
  en: { tagline: "We take your project to the next level", location: "🌏 From Bangkok · For entrepreneurs worldwide" },
  th: { tagline: "เราพาโปรเจกต์ของคุณไปสู่ระดับต่อไป", location: "🌏 จาก Bangkok · สำหรับผู้ประกอบการทั่วโลก" },
};

const linksDict: Record<Locale, typeof links> = {
  es: [
    { href: "/aplica", label: "🎯 Aplica a Startup Factory", desc: "Cuéntanos tu proyecto. Gratis. Elegimos a menos del 10%.", featured: true },
    { href: "/bangkok-trip", label: "🌏 Bangkok Founder Trip", desc: "Viaje para founders con networking real y Tailandia auténtica.", featured: false },
    { href: "/relocacion", label: "🏙️ Cambia de ciudad — Bangkok", desc: "Visa 5 años · 0% impuestos renta exterior · €510/mes.", featured: false },
    { href: "/ai-for-founders", label: "🤖 Kit AI for Founders", desc: "Plantillas y agentes IA gratuitos para emprendedores.", featured: false },
    { href: "/startup-audit", label: "📋 Startup Audit gratis", desc: "Analiza tu startup en 7 días con nuestra metodología.", featured: false },
    { href: "/comunidad", label: "🌐 Únete a SF Community", desc: "Hub de emprendedores, startups, CTOs e inversores.", featured: false },
    { href: "/", label: "🏭 Sobre Startup Factory", desc: "Team as a Service · Growth · IA · Venture Building.", featured: false },
  ],
  en: [
    { href: "/aplica", label: "🎯 Apply to Startup Factory", desc: "Tell us about your project. Free. We choose less than 10%.", featured: true },
    { href: "/bangkok-trip", label: "🌏 Bangkok Founder Trip", desc: "Trip for founders with real networking and authentic Thailand.", featured: false },
    { href: "/relocacion", label: "🏙️ Relocate to Bangkok", desc: "5-year visa · 0% tax on foreign income · €510/month.", featured: false },
    { href: "/ai-for-founders", label: "🤖 AI for Founders Kit", desc: "Free AI templates and agents for entrepreneurs.", featured: false },
    { href: "/startup-audit", label: "📋 Free Startup Audit", desc: "Analyze your startup in 7 days with our methodology.", featured: false },
    { href: "/comunidad", label: "🌐 Join SF Community", desc: "Hub of entrepreneurs, startups, CTOs and investors.", featured: false },
    { href: "/", label: "🏭 About Startup Factory", desc: "Team as a Service · Growth · AI · Venture Building.", featured: false },
  ],
  th: [
    { href: "/aplica", label: "🎯 สมัครที่ Startup Factory", desc: "บอกเล่าโปรเจกต์ของคุณ ฟรี เราเลือกน้อยกว่า 10%", featured: true },
    { href: "/bangkok-trip", label: "🌏 Bangkok Founder Trip", desc: "ทริปสำหรับ founders พร้อม networking จริงและ Thailand แท้จริง", featured: false },
    { href: "/relocacion", label: "🏙️ ย้ายมา Bangkok", desc: "วีซ่า 5 ปี · ภาษี 0% จากรายได้ต่างประเทศ · €510/เดือน", featured: false },
    { href: "/ai-for-founders", label: "🤖 AI for Founders Kit", desc: "Templates และ AI agents ฟรีสำหรับผู้ประกอบการ", featured: false },
    { href: "/startup-audit", label: "📋 Startup Audit ฟรี", desc: "วิเคราะห์ startup ของคุณใน 7 วันด้วยวิธีการของเรา", featured: false },
    { href: "/comunidad", label: "🌐 เข้าร่วม SF Community", desc: "ศูนย์รวมผู้ประกอบการ startup CTOs และนักลงทุน", featured: false },
    { href: "/", label: "🏭 เกี่ยวกับ Startup Factory", desc: "Team as a Service · Growth · AI · Venture Building", featured: false },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = locale as Locale;
  const m = metaDict[l] ?? metaDict.es;
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: `${site}/${locale}/bio`, languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}/bio`])) },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const links = [
  {
    href: "/aplica",
    label: "🎯 Aplica a Startup Factory",
    desc: "Cuéntanos tu proyecto. Gratis. Elegimos a menos del 10%.",
    featured: true,
  },
  {
    href: "/bangkok-trip",
    label: "🌏 Bangkok Founder Trip",
    desc: "Viaje para founders con networking real y Tailandia auténtica.",
    featured: false,
  },
  {
    href: "/relocacion",
    label: "🏙️ Cambia de ciudad — Bangkok",
    desc: "Visa 5 años · 0% impuestos renta exterior · €510/mes.",
    featured: false,
  },
  {
    href: "/ai-for-founders",
    label: "🤖 Kit AI for Founders",
    desc: "Plantillas y agentes IA gratuitos para emprendedores.",
    featured: false,
  },
  {
    href: "/startup-audit",
    label: "📋 Startup Audit gratis",
    desc: "Analiza tu startup en 7 días con nuestra metodología.",
    featured: false,
  },
  {
    href: "/comunidad",
    label: "🌐 Únete a SF Community",
    desc: "Hub de emprendedores, startups, CTOs e inversores.",
    featured: false,
  },
  {
    href: "/",
    label: "🏭 Sobre Startup Factory",
    desc: "Team as a Service · Growth · IA · Venture Building.",
    featured: false,
  },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/_startupsfactory", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  )},
  { label: "LinkedIn", href: "https://linkedin.com/company/startupsfactory", icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  )},
];

export default async function BioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = locale as Locale;
  const bio = bioDict[l] ?? bioDict.es;
  const localizedLinks = linksDict[l] ?? linksDict.es;
  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-16 px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb-purple absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-25 pointer-events-none" />
      <div className="orb-magenta absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto">
        {/* Profile */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3D2FFF] to-[#A855F7] flex items-center justify-center mx-auto mb-4 border-2 border-white/10">
            <Image src="/logo-white.svg" alt="Startup Factory" width={48} height={48} className="w-10 h-10 object-contain" />
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] font-black text-2xl text-white mb-1">Startup Factory</h1>
          <p className="text-white/45 text-sm">{bio.tagline}</p>
          <p className="text-white/25 text-xs mt-1">{bio.location}</p>

          {/* Social */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {socialLinks.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all duration-200">
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3">
          {localizedLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              className={`block w-full rounded-2xl px-6 py-4 text-center transition-all duration-200 ${
                link.featured
                  ? "btn-gradient text-white hover:scale-[1.02]"
                  : "card-dark text-white hover:border-white/15 hover:scale-[1.01]"
              }`}
            >
              <p className={`font-[family-name:var(--font-space-grotesk)] font-bold text-base ${link.featured ? "text-white" : "text-white"}`}>
                {link.label}
              </p>
              <p className={`text-xs mt-0.5 ${link.featured ? "text-white/70" : "text-white/35"}`}>{link.desc}</p>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Startup Factory · startupsfactory.es</p>
        </div>
      </div>
    </div>
  );
}
