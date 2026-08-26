"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo360 } from "@/components/b360/Logo360";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { Icon } from "@/components/ui/Icon";
import { withLocale, UI, type Locale, t } from "@/lib/i18n";

/**
 * El menú de discoolver 360.
 *
 * QUÉ ESTABA ROTO (19-ago-2026). No tenía ni una regla responsive: los cinco
 * enlaces más el selector de idioma y el botón de demo iban en una fila fija
 * que a 390 px **se desbordaba 149 px**. «EN» se cortaba por la mitad y
 * «Pedir demo» —la única conversión de la marca B2B, la de ticket más alto del
 * ecosistema— quedaba directamente fuera de la pantalla.
 *
 * Ahora, por debajo de 900 px: los enlaces se pliegan en un panel y en la barra
 * se quedan el logo, el botón de demo y la hamburguesa. El CTA no entra en el
 * menú a propósito — es a lo que viene la página, y esconderlo tras un gesto lo
 * entierra.
 */
export function Nav360({ locale }: { locale: Locale }) {
  const txt = t(locale).nav360;
  const base = locale === "en" ? "/en/360" : "/360";
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <header className="b360-nav">
      <div className="b360-nav__in">
        <Logo360 size={28} href={base} locale={locale} />
        <nav
          id="b360-menu"
          className={`b360-nav__links${abierto ? " is-open" : ""}`}
          aria-label={locale === "en" ? "discoolver 360 navigation" : "Navegación de discoolver 360"}
        >
          <Link href={withLocale("/360/destinos", locale)} onClick={cerrar}>
            {txt.destinos}
          </Link>
          <Link href={withLocale("/360/alojamientos", locale)} onClick={cerrar}>
            {txt.alojamientos}
          </Link>
          <Link href={withLocale("/360/agencias", locale)} onClick={cerrar}>
            {txt.agencias}
          </Link>
          <Link href={`${base}#modulos`} onClick={cerrar}>
            {txt.modulos}
          </Link>
          <LangSwitch style={{ fontFamily: "var(--b-mono)", letterSpacing: "0.08em" }} />
        </nav>
        <div className="b360-nav__acciones">
          <Link href={withLocale("/360/demo", locale)} className="btn btn-1">
            {txt.demo}
          </Link>
          <button
            type="button"
            className="b360-nav__toggle"
            aria-expanded={abierto}
            aria-controls="b360-menu"
            aria-label={
              abierto
                ? locale === "en"
                  ? "Close menu"
                  : "Cerrar menú"
                : locale === "en"
                  ? "Open menu"
                  : "Abrir menú"
            }
            onClick={() => setAbierto((v) => !v)}
          >
            <Icon name={abierto ? "x" : "menu"} size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
