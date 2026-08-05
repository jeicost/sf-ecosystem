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
              <Image src="/assets/logo-white.png" alt="Discoolver" width={140} height={32} style={{ height: 32, width: "auto" }} />
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
          <nav className="foot__col" aria-label="Empresa">
            <h4>Empresa</h4>
            <ul>
              <li>
                <Link href="/">Sobre nosotros</Link>
              </li>
              <li>
                <Link href="/">Manifiesto</Link>
              </li>
              <li>
                <Link href="/">Prensa</Link>
              </li>
              <li>
                <Link href="/">Trabaja con nosotros</Link>
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
            <Link style={{ color: "var(--ink-2)" }} href="/">
              Privacidad
            </Link>{" "}
            ·{" "}
            <Link style={{ color: "var(--ink-2)" }} href="/">
              Términos
            </Link>{" "}
            ·{" "}
            <Link style={{ color: "var(--ink-2)" }} href="/">
              Cookies
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
