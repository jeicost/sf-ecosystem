import Link from "next/link";

export function Nav360() {
  return (
    <header className="b360-nav">
      <div className="b360-nav__in">
        <Link href="/360" className="b360-logo">
          discoolver <span>360</span>
        </Link>
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
