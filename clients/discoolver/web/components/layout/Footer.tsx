import Image from "next/image";
import Link from "next/link";
import { withLocale, type Locale } from "@/lib/i18n";

const T = {
  es: {
    aria: "Pie de página",
    home: "Discoolver — inicio",
    brandDesc:
      "Lo mejor que los creadores cuentan de cada ciudad, editado en guías que se guardan. Digital y papel, con IA para recorrer la ciudad.",
    copyright: "Discoolver · Hecho con ♥ desde España",
    col1: "Las guías",
    col1Links: [
      ["/#guias", "La colección"],
      ["/#curacion", "Cómo curamos"],
      ["/#objeto", "Digital y papel"],
      ["/#ia", "IA para callejear"],
    ],
    col2: "Descubrir",
    col2Links: [
      ["/#guias", "Las guías"],
      ["/#curacion", "Cómo curamos"],
      ["/#ia", "La IA de tu guía"],
    ],
    prensa: "Prensa",
    col3: "Recursos",
    col3Links: [
      ["/#faq", "FAQ"],
      ["/#waitlist", "Pide tu ciudad"],
      ["/influencers", "Publica tu guía"],
      ["/360", "discoolver 360 · para empresas"],
    ],
    contacto: "Contacto",
    privacidad: "Privacidad",
  },
  en: {
    aria: "Footer",
    home: "Discoolver — home",
    brandDesc:
      "The best of what creators say about every city, edited into guides you keep. Digital and print, with AI to walk the city.",
    copyright: "Discoolver · Made with ♥ in Spain",
    col1: "The guides",
    col1Links: [
      ["/#guias", "The collection"],
      ["/#curacion", "How we curate"],
      ["/#objeto", "Digital & print"],
      ["/#ia", "AI for the streets"],
    ],
    col2: "Discover",
    col2Links: [
      ["/#guias", "The guides"],
      ["/#curacion", "How we curate"],
      ["/#ia", "Your guide's AI"],
    ],
    prensa: "Press",
    col3: "Resources",
    col3Links: [
      ["/#faq", "FAQ"],
      ["/#waitlist", "Request your city"],
      ["/influencers", "Publish your guide"],
      ["/360", "discoolver 360 · for business"],
    ],
    contacto: "Contact",
    privacidad: "Privacy",
  },
} as const;

export function Footer({
  locale = "es",
  brandDesc,
  copyright,
}: {
  locale?: Locale;
  brandDesc?: string;
  copyright?: string;
}) {
  const t = T[locale];
  return (
    <footer className="foot" aria-label={t.aria}>
      <div className="container">
        <div className="foot__grid">
          <div className="foot__col foot__brand">
            <Link aria-label={t.home} href={locale === "en" ? "/en" : "/"}>
              <Image src="/assets/logo-white.png" alt="" width={968} height={174} className="foot__logo" />
            </Link>
            <p>{brandDesc ?? t.brandDesc}</p>
          </div>
          <nav className="foot__col" aria-label={t.col1}>
            <h4>{t.col1}</h4>
            <ul>
              {t.col1Links.map(([href, label]) => (
                <li key={label}>
                  <Link href={withLocale(href, locale)}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="foot__col" aria-label={t.col2}>
            <h4>{t.col2}</h4>
            <ul>
              {t.col2Links.map(([href, label]) => (
                <li key={label}>
                  <Link href={withLocale(href, locale)}>{label}</Link>
                </li>
              ))}
              <li>
                <a href="mailto:hola@discoolver.com?subject=Prensa">{t.prensa}</a>
              </li>
            </ul>
          </nav>
          <nav className="foot__col" aria-label={t.col3}>
            <h4>{t.col3}</h4>
            <ul>
              {t.col3Links.map(([href, label]) => (
                <li key={label}>
                  <Link href={withLocale(href, locale)}>{label}</Link>
                </li>
              ))}
              <li>
                <a href="mailto:hola@discoolver.com">{t.contacto}</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="foot__bottom">
          <span>
            © {new Date().getFullYear()} {copyright ?? t.copyright}
          </span>
          <span>
            <Link style={{ color: "var(--ink-2)" }} href="/privacidad">
              {t.privacidad}
            </Link>{" "}
            ·{" "}
            <a style={{ color: "var(--ink-2)" }} href="mailto:hola@discoolver.com">
              {t.contacto}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
