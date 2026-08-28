import Link from "next/link";
import { Marca } from "@/components/Marca";

export function Pie() {
  return (
    <footer className="s-dark border-t-2 border-ink">
      <div className="mx-auto flex max-w-[86rem] flex-col gap-12 px-5 py-16 sm:px-8">
        <p className="u-display text-[1.9rem] leading-[0.92] sm:text-[2.5rem] lg:text-[3rem]">
          La botella no se recicla.
          <br />
          <span className="text-yellow">Se guarda.</span>
        </p>

        <div className="grid gap-10 border-t border-line pt-10 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Marca tam={20} className="self-start" />
            <p className="max-w-[28ch] text-[0.92rem] leading-relaxed text-muted">
              Cincuenta y siete piezas horneadas en el vidrio a 600 grados. Aranjuez, Madrid.
            </p>
          </div>

          <ul className="flex flex-col gap-0.5">
            {[
              ["/botella", "La botella"],
              ["/vino", "El vino"],
              ["/estampado", "El estampado"],
              ["/envios", "Envíos y devoluciones"],
            ].map(([href, txt]) => (
              <li key={href}>
                <Link href={href} className="u-cond inline-block py-2 text-[0.92rem] text-muted transition-colors hover:text-yellow">
                  {txt}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-0.5">
            <Link href="/legal" className="u-cond inline-block py-2 text-[0.92rem] text-muted transition-colors hover:text-yellow">
              Aviso legal y privacidad
            </Link>
            <a
              href="mailto:hola@lagrimasdesanchez.com"
              className="u-mono inline-block py-2 text-[0.78rem] text-muted transition-colors hover:text-yellow"
            >
              hola@lagrimasdesanchez.com
            </a>
          </div>
        </div>

        <p className="u-mono border-t border-line pt-6 text-[0.66rem] leading-relaxed text-muted">
          Consumo responsable. Venta de bebidas alcohólicas solo a mayores de 18 años.
          <br />
          Sátira. Ninguna de las piezas reproduce la imagen de persona alguna.
        </p>
      </div>
    </footer>
  );
}
