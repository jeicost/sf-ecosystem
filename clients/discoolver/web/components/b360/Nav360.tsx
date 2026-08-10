import Link from "next/link";
import { Logo360 } from "@/components/b360/Logo360";

export function Nav360() {
  return (
    <header className="b360-nav">
      <div className="b360-nav__in">
        <Logo360 size={36} />
        <nav className="b360-nav__links" aria-label="Navegación de discoolver 360">
          <Link href="/360/destinos">Destinos</Link>
          <Link href="/360/alojamientos">Alojamientos</Link>
          <Link href="/360/agencias">Agencias</Link>
          <Link href="/360#modulos">Módulos</Link>
          <Link href="/360/demo" className="btn btn-1">
            Pedir demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
