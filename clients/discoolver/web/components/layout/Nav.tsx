"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const LINKS = [
  { href: "/#guias", label: "Guías" },
  { href: "/#curacion", label: "Cómo curamos" },
  { href: "/#ia", label: "IA" },
  { href: "/#faq", label: "FAQ" },
  { href: "/influencers", label: "Creators" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isCreators = pathname?.startsWith("/influencers");

  // El menú se cierra al cambiar de página y con Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="nav" role="navigation" aria-label="Navegación principal">
      <div className="container nav__inner">
        <Link aria-label="Discoolver — inicio" href="/">
          <Image src="/assets/logo-white.png" alt="" width={1280} height={1024} priority className="nav__logo" />
        </Link>

        <div className={`nav__links${open ? " is-open" : ""}`} id="nav-links">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav__cta">
          {/* En /influencers los CTAs apuntan a la candidatura del creator,
              no a la tienda: es la página destino de los anuncios. */}
          {isCreators ? (
            <>
              <Link href="/#guias" className="btn btn-ghost" style={{ padding: "10px 18px" }}>
                Ver las guías
              </Link>
              <Link href="#form-guia" className="btn btn-primary" style={{ padding: "10px 18px" }}>
                Quiero mi guía <Icon name="arrow-up-right" size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/#waitlist" className="btn btn-ghost" style={{ padding: "10px 18px" }}>
                Avísame
              </Link>
              <Link href="/#guias" className="btn btn-primary" style={{ padding: "10px 18px" }}>
                Ver las guías <Icon name="arrow-up-right" size={14} />
              </Link>
            </>
          )}
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-links"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
