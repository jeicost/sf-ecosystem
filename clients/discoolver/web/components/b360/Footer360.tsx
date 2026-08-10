import Link from "next/link";
import { Logo360 } from "@/components/b360/Logo360";

/**
 * Footer de 360. Regla heredada de la auditoría: NINGÚN enlace a "#".
 * La web antigua tenía el footer entero apuntando a "#" (Press, Affiliates,
 * Ambassadors…). Aquí solo se lista lo que existe y tiene destino real.
 */
export function Footer360() {
  return (
    <footer className="b360-foot">
      <div className="wrap">
        <div className="b360-foot__grid">
          <div>
            <Logo360 size={38} />
            <p className="small" style={{ marginTop: 14, maxWidth: "34ch" }}>
              La plataforma que convierte el tráfico turístico de un destino en ingreso para su
              tejido local.
            </p>
          </div>
          <div>
            <h5>Verticales</h5>
            <ul>
              <li><Link href="/360/destinos">Destinos</Link></li>
              <li><Link href="/360/alojamientos">Alojamientos</Link></li>
              <li><Link href="/360/agencias">Agencias y DMC</Link></li>
            </ul>
          </div>
          <div>
            <h5>Plataforma</h5>
            <ul>
              <li><Link href="/360#modulos">Los 7 módulos</Link></li>
              <li><Link href="/360#ronda">Caso Ronda</Link></li>
              <li><Link href="/360/demo">Pedir demo</Link></li>
            </ul>
          </div>
          <div>
            <h5>discoolver</h5>
            <ul>
              <li><Link href="/">La marca de viajero</Link></li>
              <li>
                <a href="https://app.discoolver.com" target="_blank" rel="noopener noreferrer">
                  La app
                </a>
              </li>
              <li><Link href="/privacidad">Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="b360-foot__bar">
          <span>© {new Date().getFullYear()} discoolver</span>
          <a href="mailto:hola@discoolver.com">hola@discoolver.com</a>
        </div>
      </div>
    </footer>
  );
}
