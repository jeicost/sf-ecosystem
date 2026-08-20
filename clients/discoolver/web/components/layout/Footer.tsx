import Image from "next/image";
import Link from "next/link";
import { withLocale, type Locale } from "@/lib/i18n";
import { SOCIAL, WHATSAPP, waHref } from "@/lib/site";

const T = {
  es: {
    aria: "Pie de página",
    home: "Discoolver — inicio",
    brandDesc:
      "Lo mejor que los creadores cuentan de cada ciudad, editado en guías que se guardan. Digital y papel, con IA para recorrer la ciudad.",
    copyright: "Discoolver · Hecho con ♥ desde España",
    col1: "Las guías",
    col1Links: [
      ["/guias#guias", "La colección"],
      ["/guias#como-se-elige", "Cómo se elige"],
      ["/guias#objeto", "Digital y papel"],
      ["/guias#ia", "IA para callejear"],
    ],
    col2: "Descubrir",
    col2Links: [
      ["/guias#guias", "Las guías"],
      ["/guias#como-se-elige", "Cómo se elige"],
      ["/guias#ia", "La IA de tu guía"],
    ],
    prensa: "Prensa",
    col3: "Recursos",
    col3Links: [
      ["/guias#faq", "FAQ"],
      ["/guias#waitlist", "Pide tu ciudad"],
      ["/blog", "Blog"],
      ["/influencers", "Publica tu guía"],
      ["/360", "discoolver 360 · para empresas"],
    ],
    contacto: "Contacto",
    privacidad: "Privacidad",
    avisoLegal: "Aviso legal",
    terminos: "Términos",
    cookies: "Cookies",
    siguenos: "Síguenos",
    whatsapp: "Consultas por WhatsApp",
  },
  en: {
    aria: "Footer",
    home: "Discoolver — home",
    brandDesc:
      "The best of what creators say about every city, edited into guides you keep. Digital and print, with AI to walk the city.",
    copyright: "Discoolver · Made with ♥ in Spain",
    col1: "The guides",
    col1Links: [
      ["/guias#guias", "The collection"],
      ["/guias#como-se-elige", "How we choose"],
      ["/guias#objeto", "Digital & print"],
      ["/guias#ia", "AI for the streets"],
    ],
    col2: "Discover",
    col2Links: [
      ["/guias#guias", "The guides"],
      ["/guias#como-se-elige", "How we choose"],
      ["/guias#ia", "Your guide's AI"],
    ],
    prensa: "Press",
    col3: "Resources",
    col3Links: [
      ["/guias#faq", "FAQ"],
      ["/guias#waitlist", "Request your city"],
      ["/influencers", "Publish your guide"],
      ["/360", "discoolver 360 · for business"],
    ],
    contacto: "Contact",
    privacidad: "Privacy",
    avisoLegal: "Legal notice",
    terminos: "Terms",
    cookies: "Cookies",
    siguenos: "Follow us",
    whatsapp: "Questions on WhatsApp",
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
            <ul className="foot__social" aria-label={t.siguenos}>
              {SOCIAL.map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer me">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
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
                <a href="mailto:hello@discoolver.com?subject=Prensa">{t.prensa}</a>
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
                <a href="mailto:hello@discoolver.com">{t.contacto}</a>
              </li>
              <li>
                <a
                  href={waHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={WHATSAPP.display}
                >
                  {t.whatsapp}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="foot__bottom">
          <span>
            © {new Date().getFullYear()} {copyright ?? t.copyright}
          </span>
          <span className="foot__legal">
            {(
              [
                ["/aviso-legal", t.avisoLegal],
                ["/terminos", t.terminos],
                ["/privacidad", t.privacidad],
                ["/cookies", t.cookies],
              ] as const
            ).map(([href, label], i) => (
              <span key={href}>
                {i > 0 && " · "}
                <Link style={{ color: "var(--ink-2)" }} href={withLocale(href, locale)}>
                  {label}
                </Link>
              </span>
            ))}
            {" · "}
            <a style={{ color: "var(--ink-2)" }} href="mailto:hello@discoolver.com">
              {t.contacto}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
