"use client";

import Image from "next/image";
import { localeFromPath, withLocale, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { PLATFORM } from "@/lib/platform";

/**
 * El menú principal del dominio.
 *
 * Dos arreglos del 12-ago-2026, los dos de negocio, no de estilo:
 *
 *  · **Las guías estaban fuera del menú.** El producto que se vende se enlazaba
 *    nueve veces desde el cuerpo de la home, pero quien llegaba y miraba el
 *    menú no veía que existiera.
 *  · **"Para empresas" apuntaba a discoolver-landing.vercel.app/360**, la URL
 *    anterior al corte de dominio. Funcionaba por un redirect, pero cada carga
 *    salía del dominio y volvía.
 *
 * El email B2B canónico es info@ (decisión 2026-08-10); empresas@ se retira.
 */
const LINKS = {
  es: [
    { href: "/#descubre", label: "Descubre" },
    { href: "/guias", label: "Guías" },
    { href: "/#mapa", label: "Mapa" },
    { href: "/blog", label: "Blog" },
    { href: "/influencers", label: "Creators" },
    { href: "/360", label: "Para empresas" },
  ],
  en: [
    { href: "/#descubre", label: "Discover" },
    { href: "/guias", label: "Guides" },
    { href: "/#mapa", label: "Map" },
    { href: "/blog", label: "Blog" },
    { href: "/influencers", label: "Creators" },
    { href: "/360", label: "For business" },
  ],
} as const;

export function Nav({ locale: localeProp }: { locale?: Locale } = {}) {
  const pathname = usePathname();
  const locale: Locale = localeProp ?? localeFromPath(pathname);
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
          <LangSwitch style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }} />
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
