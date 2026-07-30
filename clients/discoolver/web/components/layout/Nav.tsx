import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  { href: "/#descubre", label: "Descubre" },
  { href: "/#planes", label: "Planes" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/#mapa", label: "Mapa" },
  { href: "/influencers", label: "Para empresas" },
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
