"use client";

import Image from "next/image";
import { withLocale, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { PLATFORM } from "@/lib/platform";

// El email B2B canónico es info@ (decisión 2026-08-10); empresas@ se retira.
const LINKS = {
  es: [
    { href: "/#descubre", label: "Descubre" },
    { href: "/#planes", label: "Planes" },
    { href: "/#categorias", label: "Categorías" },
    { href: "/#mapa", label: "Mapa" },
    { href: "/influencers", label: "Creators" },
    { href: "mailto:info@discoolver.com", label: "Para empresas" },
  ],
  en: [
    { href: "/#descubre", label: "Discover" },
    { href: "/#planes", label: "Plans" },
    { href: "/#categorias", label: "Categories" },
    { href: "/#mapa", label: "Map" },
    { href: "/influencers", label: "Creators" },
    { href: "mailto:info@discoolver.com", label: "For business" },
  ],
} as const;

export function Nav({ locale: localeProp }: { locale?: Locale } = {}) {
  const pathname = usePathname();
  const locale: Locale = localeProp ?? (pathname === "/en" || pathname?.startsWith("/en/") ? "en" : "es");
  const links = LINKS[locale];
  return (
    <nav className="nav" role="navigation" aria-label={locale === "en" ? "Main navigation" : "Navegación principal"}>
      <div className="container nav__inner">
        <Link aria-label={locale === "en" ? "Discoolver — home" : "Discoolver — inicio"} href={locale === "en" ? "/en" : "/"}>
          <Image src="/assets/logo-white.png" alt="Discoolver" width={122} height={22} priority style={{ height: 22, width: "auto" }} />
        </Link>
        <div className="nav__links" aria-label={locale === "en" ? "Navigation links" : "Links de navegación"}>
          {links.map((link) => (
            <Link key={link.href} href={withLocale(link.href, locale)}>
              {link.label}
            </Link>
          ))}
          <Link
            href={locale === "en" ? (pathname?.startsWith("/en") ? pathname.slice(3) || "/" : "/") : `/en${pathname === "/" ? "" : pathname ?? ""}`}
            aria-label={locale === "en" ? "Leer en español" : "Read in English"}
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
          >
            {locale === "en" ? "ES" : "EN"}
          </Link>
        </div>
        <div className="nav__cta">
          {/* Antes: un <button> muerto que decía "Tengo código". La puerta real
              existe — la plataforma está viva — así que el CTA principal entra. */}
          <Link href={withLocale("/#hero-email", locale)} className="btn btn-ghost" style={{ padding: "10px 18px" }}>
            {locale === "en" ? "Notify me about my city" : "Avísame de mi ciudad"}
          </Link>
          <a href={PLATFORM.home} className="btn btn-primary" style={{ padding: "10px 18px" }}>
            {locale === "en" ? "Enter" : "Entrar"} <Icon name="arrow-up-right" size={14} />
          </a>
        </div>
      </div>
    </nav>
  );
}
