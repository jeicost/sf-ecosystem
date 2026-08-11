import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PLATFORM } from "@/lib/platform";

// El email B2B canónico es info@ (decisión 2026-08-10); empresas@ se retira.
const LINKS = [
  { href: "/#descubre", label: "Descubre" },
  { href: "/#planes", label: "Planes" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/#mapa", label: "Mapa" },
  { href: "/influencers", label: "Creators" },
  { href: "mailto:info@discoolver.com", label: "Para empresas" },
];

export function Nav() {
  return (
    <nav className="nav" role="navigation" aria-label="Navegación principal">
      <div className="container nav__inner">
        <Link aria-label="Discoolver — inicio" href="/">
          <Image src="/assets/logo-white.png" alt="Discoolver" width={122} height={22} priority style={{ height: 22, width: "auto" }} />
        </Link>
        <div className="nav__links" aria-label="Links de navegación">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="nav__cta">
          {/* Antes: un <button> muerto que decía "Tengo código". La puerta real
              existe — la plataforma está viva — así que el CTA principal entra. */}
          <Link href="/#hero-email" className="btn btn-ghost" style={{ padding: "10px 18px" }}>
            Avísame de mi ciudad
          </Link>
          <a href={PLATFORM.home} className="btn btn-primary" style={{ padding: "10px 18px" }}>
            Entrar <Icon name="arrow-up-right" size={14} />
          </a>
        </div>
      </div>
    </nav>
  );
}
