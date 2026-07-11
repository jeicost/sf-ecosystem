"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";

const navDicts: Record<Locale, {
  services: string;
  teamAsAService: string;
  equipoPorHoras: string;
  growthPartner: string;
  innovacionAbierta: string;
  para: string;
  emprendedores: string;
  startups: string;
  corporates: string;
  venture: string;
  casos: string;
  equipo: string;
  faq: string;
  bangkok: string;
  bangkokTrip: string;
  hablemos: string;
  menu: string;
}> = {
  es: {
    services: 'Servicios',
    teamAsAService: 'Team as a Service',
    equipoPorHoras: 'Equipo por horas',
    growthPartner: 'Growth Partner',
    innovacionAbierta: 'Innovación Abierta Colaborativa',
    para: 'Para',
    emprendedores: 'Emprendedores',
    startups: 'Startups',
    corporates: 'Corporates',
    venture: 'Venture',
    casos: 'Casos',
    equipo: 'Equipo',
    faq: 'FAQ',
    bangkok: 'Cambia de ciudad (Bangkok)',
    bangkokTrip: 'Founder Trip',
    hablemos: 'Aplica',
    menu: 'Menú',
  },
  en: {
    services: 'Services',
    teamAsAService: 'Team as a Service',
    equipoPorHoras: 'Modular team',
    growthPartner: 'Growth Partner',
    innovacionAbierta: 'Open Collaborative Innovation',
    para: 'For',
    emprendedores: 'Entrepreneurs',
    startups: 'Startups',
    corporates: 'Corporates',
    venture: 'Venture',
    casos: 'Cases',
    equipo: 'Team',
    faq: 'FAQ',
    bangkok: 'Cambia de ciudad (Bangkok)',
    bangkokTrip: 'Founder Trip',
    hablemos: 'Apply',
    menu: 'Menu',
  },
  th: {
    services: 'บริการ',
    teamAsAService: 'Team as a Service',
    equipoPorHoras: 'ทีมแบบโมดูล',
    growthPartner: 'Growth Partner',
    innovacionAbierta: 'นวัตกรรมแบบเปิดร่วมกัน',
    para: 'สำหรับ',
    emprendedores: 'ผู้ประกอบการ',
    startups: 'สตาร์ทอัพ',
    corporates: 'องค์กร',
    venture: 'เวนเจอร์',
    casos: 'กรณีศึกษา',
    equipo: 'ทีม',
    faq: 'FAQ',
    bangkok: 'กรุงเทพฯ',
    bangkokTrip: 'Founder Trip',
    hablemos: 'สมัคร',
    menu: 'เมนู',
  },
};

export default function Navbar({ locale }: { locale: Locale }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const t = navDicts[locale] ?? navDicts.es;

  // Extract current path without the locale prefix
  const localePrefix = `/${locale}`;
  const currentPath = pathname.startsWith(localePrefix)
    ? pathname.slice(localePrefix.length) || ''
    : '';

  const navLinks: Array<{ label: string; href: string; children?: Array<{ label: string; href: string }>; special?: boolean; color?: string }> = [
    {
      label: t.services,
      href: '#',
      children: [
        { label: t.teamAsAService, href: `/${locale}/team-as-a-service` },
        { label: t.equipoPorHoras, href: `/${locale}/equipo-por-horas` },
        { label: t.growthPartner, href: `/${locale}/growth-partner` },
        { label: t.innovacionAbierta, href: `/${locale}/corporates` },
      ],
    },
    {
      label: t.para,
      href: '#',
      children: [
        { label: t.emprendedores, href: `/${locale}/emprendedores` },
        { label: t.startups, href: `/${locale}/startups` },
        { label: t.corporates, href: `/${locale}/corporates` },
      ],
    },
    { label: t.venture, href: `/${locale}/venture` },
    { label: t.casos, href: `/${locale}/casos` },
    { label: t.equipo, href: `/${locale}/equipo` },
    { label: t.faq, href: `/${locale}/faq` },
    { label: t.bangkok, href: `/${locale}/relocacion`, special: true },
    { label: t.bangkokTrip, href: `/${locale}/bangkok-trip`, special: true, color: '#F01A8C' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center">
          <Image
            src="/logo-white.svg"
            alt="Startups Factory"
            width={160}
            height={52}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.children ? (
              <li
                key={link.label}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="text-sm font-medium text-[#F5F0E8]/80 hover:text-[#F5F0E8] transition-colors duration-150 flex items-center gap-1">
                  {link.label}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
                {openDropdown === link.label && (
                  <div className="absolute top-full left-0 pt-2 w-64">
                    <div className="bg-black/95 border border-white/[0.08] rounded-xl py-2 shadow-2xl backdrop-blur-md">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors duration-150 rounded-lg mx-1"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ) : link.special ? (
              <li key={link.label}>
                <Link
                  href={link.href!}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border transition-all duration-200"
                  style={{ color: link.color ?? '#D4FF47', borderColor: `${link.color ?? '#D4FF47'}40`, background: `${link.color ?? '#D4FF47'}0F` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: link.color ?? '#D4FF47' }} />
                  {link.label}
                </Link>
              </li>
            ) : (
              <li key={link.label}>
                <Link
                  href={link.href!}
                  className="text-sm font-medium text-[#F5F0E8]/80 hover:text-[#F5F0E8] transition-colors duration-150"
                >
                  {link.label}
                </Link>
              </li>
            )
          )}
        </ul>

        {/* CTA + Language Switcher */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex items-center gap-1 border border-white/10 rounded-full px-2 py-1">
            {(['es', 'en', 'th'] as Locale[]).map((l) => (
              <Link
                key={l}
                href={`/${l}${currentPath}`}
                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                  l === locale ? 'text-[#3D2FFF]' : 'text-[#888880] hover:text-[#F5F0E8]'
                }`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>

          <Link
            href={`/${locale}/aplica`}
            className="btn-gradient text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200"
          >
            {t.hablemos}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[#F5F0E8]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t.menu}
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/[0.06] backdrop-blur-md px-6 py-4">
          {navLinks.map((link) => (
            <div key={link.label} className="py-2">
              {link.children ? (
                <>
                  <span className="block text-xs font-semibold text-white/30 mb-2 uppercase tracking-[0.12em]">{link.label}</span>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block pl-4 py-1.5 text-sm text-white/60 hover:text-white transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </>
              ) : link.special ? (
                <Link
                  href={link.href!}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border"
                  style={{ color: link.color ?? '#D4FF47', borderColor: `${link.color ?? '#D4FF47'}40`, background: `${link.color ?? '#D4FF47'}0F` }}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: link.color ?? '#D4FF47' }} />
                  {link.label}
                </Link>
              ) : (
                <Link
                  href={link.href!}
                  className="block text-sm font-medium text-[#F5F0E8]/80 hover:text-[#3D2FFF]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}

          {/* Mobile language switcher */}
          <div className="flex items-center gap-2 mt-4 mb-2">
            {(['es', 'en', 'th'] as Locale[]).map((l) => (
              <Link
                key={l}
                href={`/${l}${currentPath}`}
                className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${
                  l === locale
                    ? 'text-[#3D2FFF] border-[#3D2FFF]/30'
                    : 'text-[#888880] border-[#2A2A2A] hover:text-[#F5F0E8]'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>

          <Link
            href={`/${locale}/aplica`}
            className="mt-2 block text-center btn-gradient text-white font-semibold text-sm px-5 py-3 rounded-full"
            onClick={() => setMobileOpen(false)}
          >
            {t.hablemos}
          </Link>
        </div>
      )}
    </header>
  );
}
