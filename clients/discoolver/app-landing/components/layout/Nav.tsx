import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

// "Para empresas" apuntaba a /influencers, que es la landing de creators — y la
// FAQ 07 remite explícitamente a este ítem del menú para consultas B2B. Ahora
// la etiqueta dice a dónde va, y el contacto de empresas es el que ya usa el
// CTA final de la home.
const LINKS = [
  { href: "/#descubre", label: "Descubre" },
  { href: "/#planes", label: "Planes" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/#mapa", label: "Mapa" },
  { href: "/influencers", label: "Creators" },
  { href: "mailto:empresas@discoolver.com", label: "Para empresas" },
];

export function Nav() {
  return (
    <nav className="nav" role="navigation" aria-label="Navegación principal">
      <div className="container nav__inner">
        <Link aria-label="Discoolver — inicio" href="/">
          <Image src="/assets/logo-white.png" alt="Discoolver" width={140} height={28} priority style={{ height: 28, width: "auto" }} />
        </Link>
        <div className="nav__links" aria-label="Links de navegación">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="nav__cta">
          <button className="btn btn-ghost" style={{ padding: "10px 18px" }}>
            Tengo código
          </button>
          <Link href="/#hero-email" className="btn btn-primary" style={{ padding: "10px 18px" }}>
            Pedir invitación <Icon name="arrow-up-right" size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
