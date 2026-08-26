import Image from "next/image";
import Link from "next/link";
import { withLocale, type Locale, pick } from "@/lib/i18n";
import { SOCIAL, WHATSAPP, waHref } from "@/lib/site";

/**
 * El pie del dominio. Tres arreglos del 12-ago-2026:
 *
 *  · **No enlazaba ni las guías, ni el blog, ni /360.** "Para empresas" era un
 *    `mailto:` en vez de la página de la marca B2B, así que el pie de la home
 *    no llevaba a ninguno de los tres productos.
 *  · **De legales solo tenía privacidad.** Había un comentario diciendo que
 *    términos y cookies se retiraban "hasta que haya páginas reales que
 *    enlazar": ya las hay.
 *  · **No era bilingüe.** La home en inglés servía este pie en español.
 */
const T = {
  es: {
    aria: "Pie de página",
    home: "Discoolver — inicio",
    brandDesc: "La plataforma para descubrir tu ciudad como nunca antes lo habías hecho.",
    copyright: "Discoolver · Hecho con ♥ desde España",
    producto: "Producto",
    productoLinks: [
      ["/guias", "Las guías"],
      ["/#categorias", "Categorías"],
      ["/#mapa", "Mapa"],
      ["/#planes", "Planes"],
    ],
    descubrir: "Descubrir",
    descubrirLinks: [
      ["/blog", "Blog"],
      ["/influencers", "Creators"],
      ["/#faq", "Preguntas frecuentes"],
    ],
    empresa: "Empresa",
    empresa360: "discoolver 360 · para empresas",
    plataforma: "Entrar en la plataforma",
    prensa: "Prensa",
    contacto: "Contacto",
    whatsapp: "Consultas por WhatsApp",
    siguenos: "Síguenos",
    avisoLegal: "Aviso legal",
    terminos: "Términos",
    privacidad: "Privacidad",
    cookies: "Cookies",
  },
  en: {
    aria: "Footer",
    home: "Discoolver — home",
    brandDesc: "The platform to discover your city like you never have before.",
    copyright: "Discoolver · Made with ♥ in Spain",
    producto: "Product",
    productoLinks: [
      ["/guias", "The guides"],
      ["/#categorias", "Categories"],
      ["/#mapa", "Map"],
      ["/#planes", "Plans"],
    ],
    descubrir: "Discover",
    descubrirLinks: [
      ["/blog", "Blog"],
      ["/influencers", "Creators"],
      ["/#faq", "FAQ"],
    ],
    empresa: "Company",
    empresa360: "discoolver 360 · for business",
    plataforma: "Enter the platform",
    prensa: "Press",
    contacto: "Contact",
    whatsapp: "Questions on WhatsApp",
    siguenos: "Follow us",
    avisoLegal: "Legal notice",
    terminos: "Terms",
    privacidad: "Privacy",
    cookies: "Cookies",
  },
} as const;

export function Footer({
  locale,
  brandDesc,
  copyright,
}: {
  locale: Locale;
  brandDesc?: string;
  copyright?: string;
}) {
  const t = pick(T, locale);
  const legales = [
    ["/aviso-legal", t.avisoLegal],
    ["/terminos", t.terminos],
    ["/privacidad", t.privacidad],
    ["/cookies", t.cookies],
  ] as const;

  return (
    <footer className="foot" aria-label={t.aria}>
      <div className="container">
        <div className="foot__grid">
          <div className="foot__col foot__brand">
            <Link aria-label={t.home} href={locale === "en" ? "/en" : "/"}>
              <Image
                src="/assets/logo-white.png"
                alt="Discoolver"
                width={139}
                height={25}
                style={{ height: 25, width: "auto" }}
              />
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

          <nav className="foot__col" aria-label={t.producto}>
            <h4>{t.producto}</h4>
            <ul>
              {t.productoLinks.map(([href, label]) => (
                <li key={label}>
                  <Link href={withLocale(href, locale)}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="foot__col" aria-label={t.descubrir}>
            <h4>{t.descubrir}</h4>
            <ul>
              {t.descubrirLinks.map(([href, label]) => (
                <li key={label}>
                  {/* El blog es solo español: no se le pone prefijo de idioma. */}
                  <Link href={href === "/blog" ? "/blog" : withLocale(href, locale)}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="foot__col" aria-label={t.empresa}>
            <h4>{t.empresa}</h4>
            <ul>
              <li>
                <Link href={withLocale("/360", locale)}>{t.empresa360}</Link>
              </li>
              <li>
                <a href="https://app.discoolver.com" target="_blank" rel="noopener noreferrer">
                  {t.plataforma}
                </a>
              </li>
              <li>
                <a href="mailto:hello@discoolver.com?subject=Prensa">{t.prensa}</a>
              </li>
              <li>
                <a href="mailto:hello@discoolver.com">{t.contacto}</a>
              </li>
              <li>
                <a href={waHref()} target="_blank" rel="noopener noreferrer" title={WHATSAPP.display}>
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
            {legales.map(([href, label], i) => (
              <span key={href}>
                {i > 0 && " · "}
                <Link style={{ color: "var(--ink-2)" }} href={withLocale(href, locale)}>
                  {label}
                </Link>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
