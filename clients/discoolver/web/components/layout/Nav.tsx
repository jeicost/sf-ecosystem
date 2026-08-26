"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PLATFORM } from "@/lib/platform";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { altPath, localeFromPath, withLocale, type Locale, t } from "@/lib/i18n";

/**
 * El locale se deriva del pathname (cliente), así que la Nav no necesita
 * props: /en/* → inglés, el resto → español. El switcher lleva a la misma
 * página en el otro idioma vía altPath().
 */
export function Nav({ locale: localeProp }: { locale?: Locale } = {}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale: Locale = localeProp ?? localeFromPath(pathname);
  const txt = t(locale);
  const isCreators = pathname?.includes("/influencers");

  // /influencers tenía el menú de la tienda: los cuatro enlaces iban a
  // /guias#… y no había salida ni a la home ni a la plataforma. Un creador que
  // llega desde Instagram no podía ver el producto al que se le pide sumarse.
  const links = isCreators
    ? [
        { href: "#como-funciona", label: txt.nav.comoFunciona },
        { href: withLocale("/guias", locale), label: txt.nav.lasGuias },
        ...(locale === "es" ? [{ href: "/blog", label: txt.nav.blog }] : []),
      ]
    : [
    { href: withLocale("/guias#guias", locale), label: txt.nav.guias },
    { href: withLocale("/guias#como-se-elige", locale), label: txt.nav.curamos },
    { href: withLocale("/guias#ia", locale), label: txt.nav.ia },
    { href: withLocale("/guias#faq", locale), label: txt.nav.faq },
    { href: withLocale("/influencers", locale), label: txt.nav.creators },
    // El blog —50 artículos, la principal puerta de entrada orgánica— solo
    // colgaba de la home de la plataforma: desde /guias, /influencers y /360
    // no se llegaba por ningún sitio, porque conviven dos cabeceras distintas
    // en el mismo dominio. Solo en español: no hay espejo inglés del blog y
    // mandar a un lector inglés a 50 artículos en castellano sin avisar es
    // peor que no ofrecérselo.
    ...(locale === "es" ? [{ href: "/blog", label: txt.nav.blog }] : []),
  ];

  // El menú se cierra al cambiar de página y con Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="nav" role="navigation" aria-label={locale === "en" ? "Main navigation" : "Navegación principal"}>
      <div className="container nav__inner">
        <Link aria-label={locale === "en" ? "Discoolver — home" : "Discoolver — inicio"} href={locale === "en" ? "/en" : "/"}>
          <Image src="/assets/logo-white.png" alt="" width={968} height={174} priority className="nav__logo" />
        </Link>

        <div className={`nav__links${open ? " is-open" : ""}`} id="nav-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {/* Un enlace por idioma distinto del actual. Antes era un ternario
              binario que con un tercer idioma habría mandado al equivocado. */}
          <LangSwitch
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
          />
        </div>

        <div className="nav__cta">
          {/* En /influencers los CTAs apuntan a la candidatura del creator,
              no a la tienda: es la página destino de los anuncios. */}
          {isCreators ? (
            <>
              {/* La salida al producto: sin esto, la página pide sumarse a algo
                  que no se puede ni mirar. */}
              <a href={PLATFORM.home} className="btn btn-ghost" style={{ padding: "10px 18px" }}>
                {txt.nav.verPlataforma}
              </a>
              <Link href="#candidaturas" className="btn btn-primary" style={{ padding: "10px 18px" }}>
                {txt.nav.quieroEntrar} <Icon name="arrow-up-right" size={14} />
              </Link>
            </>
          ) : (
            <>
              {/* Quien descubre discoolver por la tienda no podía ver que hay
                  un producto gratis detrás. */}
              <a href={PLATFORM.home} className="btn btn-ghost" style={{ padding: "10px 18px" }}>
                {txt.nav.verPlataforma}
              </a>
              <Link href={withLocale("/guias#guias", locale)} className="btn btn-primary" style={{ padding: "10px 18px" }}>
                {txt.nav.verGuias} <Icon name="arrow-up-right" size={14} />
              </Link>
            </>
          )}
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-links"
            aria-label={open ? (locale === "en" ? "Close menu" : "Cerrar menú") : locale === "en" ? "Open menu" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
