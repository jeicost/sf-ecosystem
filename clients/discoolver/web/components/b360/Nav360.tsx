import Link from "next/link";
import { Logo360 } from "@/components/b360/Logo360";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { withLocale, UI, type Locale } from "@/lib/i18n";

export function Nav360({ locale = "es" }: { locale?: Locale }) {
  const t = UI[locale].nav360;
  const base = locale === "en" ? "/en/360" : "/360";
  return (
    <header className="b360-nav">
      <div className="b360-nav__in">
        <Logo360 size={28} href={base} locale={locale} />
        <nav className="b360-nav__links" aria-label={locale === "en" ? "discoolver 360 navigation" : "Navegación de discoolver 360"}>
          <Link href={withLocale("/360/destinos", locale)}>{t.destinos}</Link>
          <Link href={withLocale("/360/alojamientos", locale)}>{t.alojamientos}</Link>
          <Link href={`${base}#modulos`}>{t.modulos}</Link>
          <LangSwitch style={{ fontFamily: "var(--b-mono)", letterSpacing: "0.08em" }} />
          <Link href={withLocale("/360/demo", locale)} className="btn btn-1">
            {t.demo}
          </Link>
        </nav>
      </div>
    </header>
  );
}
