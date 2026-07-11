import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import AnimatedLogo from "@/components/AnimatedLogo";

const footerDicts: Record<Locale, {
  ctaTagline: string;
  ctaPrimary: string;
  services: string;
  teamAsAService: string;
  equipoPorHoras: string;
  growthPartner: string;
  innovacionAbierta: string;
  paraQuien: string;
  emprendedores: string;
  startups: string;
  corporates: string;
  venture: string;
  casosExito: string;
  contacto: string;
  rights: string;
}> = {
  es: {
    ctaTagline: '¿Tu proyecto tiene potencial? Descúbrelo en 30 minutos, gratis.',
    ctaPrimary: 'Aplica ahora',
    services: 'Servicios',
    teamAsAService: 'Team as a Service',
    equipoPorHoras: 'Equipo por horas',
    growthPartner: 'Growth Partner',
    innovacionAbierta: 'Innovación Abierta',
    paraQuien: 'Para quién',
    emprendedores: 'Emprendedores',
    startups: 'Startups',
    corporates: 'Corporates',
    venture: 'Venture',
    casosExito: 'Casos de éxito',
    contacto: 'Contacto',
    rights: 'Todos los derechos reservados.',
  },
  en: {
    ctaTagline: 'Does your project have potential? Find out in 30 minutes, for free.',
    ctaPrimary: 'Apply now',
    services: 'Services',
    teamAsAService: 'Team as a Service',
    equipoPorHoras: 'Modular team',
    growthPartner: 'Growth Partner',
    innovacionAbierta: 'Open Innovation',
    paraQuien: 'Who is it for?',
    emprendedores: 'Entrepreneurs',
    startups: 'Startups',
    corporates: 'Corporates',
    venture: 'Venture',
    casosExito: 'Success cases',
    contacto: 'Contact',
    rights: 'All rights reserved.',
  },
  th: {
    ctaTagline: 'โครงการของคุณมีศักยภาพไหม? ค้นหาใน 30 นาที ฟรี',
    ctaPrimary: 'สมัครเลย',
    services: 'บริการ',
    teamAsAService: 'Team as a Service',
    equipoPorHoras: 'ทีมแบบโมดูล',
    growthPartner: 'Growth Partner',
    innovacionAbierta: 'นวัตกรรมแบบเปิด',
    paraQuien: 'สำหรับใคร',
    emprendedores: 'ผู้ประกอบการ',
    startups: 'สตาร์ทอัพ',
    corporates: 'องค์กร',
    venture: 'เวนเจอร์',
    casosExito: 'กรณีความสำเร็จ',
    contacto: 'ติดต่อ',
    rights: 'สงวนลิขสิทธิ์ทุกประการ',
  },
};

export default function Footer({ locale }: { locale: Locale }) {
  const t = footerDicts[locale] ?? footerDicts.es;

  return (
    <footer className="bg-black border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6">

        {/* ── CTA strip ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 py-8 border-b border-white/[0.08]">
          <p className="text-sm text-white/60 text-center sm:text-left leading-relaxed">
            {t.ctaTagline}
          </p>
          <Link
            href={`/${locale}/aplica`}
            className="shrink-0 btn-gradient text-white font-[family-name:var(--font-space-grotesk)] font-semibold px-7 py-3 rounded-full text-sm whitespace-nowrap"
          >
            {t.ctaPrimary} →
          </Link>
        </div>

        {/* ── NAV GRID ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 py-14">

          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href={`/${locale}`} className="inline-block mb-6">
              <Image
                src="/logo-white.svg"
                alt="Startups Factory"
                width={130}
                height={43}
                className="h-9 w-auto opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-[260px]">
              Venture builder hispanohablante.<br />
              Fábrica de equipos para proyectos reales.
            </p>
            <p className="mt-4 text-xs text-white/35">Bangkok · España · LATAM</p>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xs text-white/60 mb-5 uppercase tracking-[0.14em]">
              {t.services}
            </h3>
            <ul className="space-y-3">
              {[
                { label: t.teamAsAService, href: `/${locale}/team-as-a-service` },
                { label: t.equipoPorHoras, href: `/${locale}/equipo-por-horas` },
                { label: t.growthPartner, href: `/${locale}/growth-partner` },
                { label: t.innovacionAbierta, href: `/${locale}/corporates` },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Para quién */}
          <div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xs text-white/60 mb-5 uppercase tracking-[0.14em]">
              {t.paraQuien}
            </h3>
            <ul className="space-y-3">
              {[
                { label: t.emprendedores, href: `/${locale}/emprendedores` },
                { label: t.startups, href: `/${locale}/startups` },
                { label: t.corporates, href: `/${locale}/corporates` },
                { label: t.venture, href: `/${locale}/venture` },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-xs text-white/60 mb-5 uppercase tracking-[0.14em]">
              Recursos
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Aplica a SF', href: `/${locale}/aplica` },
                { label: 'Programa de selección', href: `/${locale}/programa` },
                { label: 'AI for Founders', href: `/${locale}/ai-for-founders` },
                { label: 'Startup Audit', href: `/${locale}/startup-audit` },
                { label: t.casosExito, href: `/${locale}/casos` },
                { label: 'Blog', href: `/${locale}/blog` },
                { label: 'FAQ', href: `/${locale}/faq` },
                { label: t.contacto, href: `/${locale}/contacto` },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── BOTTOM BAR ───────────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] py-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <AnimatedLogo />
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Startup Factory. {t.rights}
            </p>
          </div>
          <p className="text-xs text-white/30 text-center md:text-right">
            <span className="gradient-text font-semibold">startupsfactory.es</span>
            {" · "}
            <span>Team as a Service</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
