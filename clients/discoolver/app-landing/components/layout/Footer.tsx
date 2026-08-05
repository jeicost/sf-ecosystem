import Image from "next/image";
import Link from "next/link";

export function Footer({
  brandDesc = "La plataforma para descubrir tu ciudad como nunca antes lo habías hecho.",
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
          <nav className="foot__col" aria-label="Producto">
            <h4>Producto</h4>
            <ul>
              <li>
                <Link href="/#categorias">Categorías</Link>
              </li>
              <li>
                <Link href="/#mapa">Mapa</Link>
              </li>
              <li>
                <Link href="/influencers">Para empresas</Link>
              </li>
              <li>
                <Link href="/#creators">Curators</Link>
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
                <Link href="/">Blog</Link>
              </li>
              <li>
                <Link href="/">Guías</Link>
              </li>
              <li>
                <Link href="/">Soporte</Link>
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
