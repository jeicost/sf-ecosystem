import Image from "next/image";
import Link from "next/link";

export function Footer({
  brandDesc = "Lo mejor que los creadores cuentan de cada ciudad, editado en guías que se guardan. Digital y papel, con IA para recorrer la ciudad.",
  copyright = "Discoolver · Hecho con ♥ desde España",
}: {
  brandDesc?: string;
  copyright?: string;
}) {
  return (
    <footer className="foot" aria-label="Pie de página">
      <div className="container">
        <div className="foot__grid">
          <div className="foot__col foot__brand">
            <Link aria-label="Discoolver — inicio" href="/">
              <Image src="/assets/logo-white.png" alt="" width={1280} height={1024} className="foot__logo" />
            </Link>
            <p>{brandDesc}</p>
          </div>
          <nav className="foot__col" aria-label="Las guías">
            <h4>Las guías</h4>
            <ul>
              <li>
                <Link href="/#guias">La colección</Link>
              </li>
              <li>
                <Link href="/#curacion">Cómo curamos</Link>
              </li>
              <li>
                <Link href="/#objeto">Digital y papel</Link>
              </li>
              <li>
                <Link href="/#ia">IA para callejear</Link>
              </li>
            </ul>
          </nav>
          <nav className="foot__col" aria-label="Descubrir">
            <h4>Descubrir</h4>
            <ul>
              <li>
                <Link href="/#guias">Las guías</Link>
              </li>
              <li>
                <Link href="/#curacion">Cómo curamos</Link>
              </li>
              <li>
                <Link href="/#ia">La IA de tu guía</Link>
              </li>
              <li>
                <a href="mailto:hola@discoolver.com?subject=Prensa">Prensa</a>
              </li>
            </ul>
          </nav>
          <nav className="foot__col" aria-label="Recursos">
            <h4>Recursos</h4>
            <ul>
              <li>
                <Link href="/#faq">FAQ</Link>
              </li>
              <li>
                <Link href="/#waitlist">Pide tu ciudad</Link>
              </li>
              <li>
                <Link href="/influencers">Publica tu guía</Link>
              </li>
              <li>
                <a href="mailto:hola@discoolver.com">Contacto</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="foot__bottom">
          <span>© {new Date().getFullYear()} {copyright}</span>
          <span>
            <Link style={{ color: "var(--ink-2)" }} href="/privacidad">
              Privacidad
            </Link>{" "}
            ·{" "}
            <a style={{ color: "var(--ink-2)" }} href="mailto:hola@discoolver.com">
              Contacto
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
