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
                <Link href="/#planes">Planes</Link>
              </li>
              <li>
                <Link href="/#mapa">Mapa</Link>
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
                <a href="mailto:info@discoolver.com">Para empresas</a>
              </li>
              <li>
                <a href="mailto:hola@discoolver.com?subject=Prensa">Prensa</a>
              </li>
              <li>
                <a href="mailto:hola@discoolver.com">Contacto</a>
              </li>
            </ul>
          </nav>
          <nav className="foot__col" aria-label="Recursos">
            <h4>Recursos</h4>
            <ul>
              <li>
                <Link href="/#faq">Preguntas frecuentes</Link>
              </li>
              <li>
                <a href="https://app.discoolver.com">Entrar en la plataforma</a>
              </li>
              <li>
                <Link href="/influencers">Creators</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="foot__bottom">
          <span>© {new Date().getFullYear()} {copyright}</span>
          {/* Solo se enlaza lo que existe: Términos y Cookies apuntaban a "/"
              y se retiran hasta que haya páginas reales que enlazar. */}
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
