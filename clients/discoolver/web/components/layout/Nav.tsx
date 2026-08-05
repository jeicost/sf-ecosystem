import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  { href: "/#guias", label: "Guías" },
  { href: "/#curacion", label: "Cómo curamos" },
  { href: "/#ia", label: "IA" },
  { href: "/#faq", label: "FAQ" },
  { href: "/influencers", label: "Creators" },
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
          <Link href="/#waitlist" className="btn btn-ghost" style={{ padding: "10px 18px" }}>
            Avísame
          </Link>
          <Link href="/#guias" className="btn btn-primary" style={{ padding: "10px 18px" }}>
            Ver las guías <Icon name="arrow-up-right" size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
