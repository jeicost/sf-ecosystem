import Link from "next/link";
import { BotonComprar } from "@/components/BotonComprar";
import { FotoProducto } from "@/components/FotoProducto";
import { CATALOGO, precioES, type Sku } from "@/lib/catalogo";

/**
 * La página de producto, compartida por la botella y el vino.
 *
 * Misma anatomía para los dos porque son el mismo objeto: cambia lo que lleva
 * dentro, el cierre y a cuántos países viaja. Un diseño distinto por producto
 * sugeriría dos productos distintos, y el argumento de venta es justo el
 * contrario.
 */

type Props = {
  sku: Sku;
  /** false = botella vacía: corcho con cabeza de zamak en el dibujo. */
  capsula?: boolean;
  eyebrow: string;
  titular: string;
  entradilla: React.ReactNode;
  foto: string;
  ficha: [string, string][];
  cierre?: React.ReactNode;
};

export function FichaProducto({ sku, capsula = true, eyebrow, titular, entradilla, foto, ficha, cierre }: Props) {
  const p = CATALOGO[sku];

  return (
    <section className="u-grain relative border-b-2 border-ink">
      <div className="mx-auto grid max-w-[86rem] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <FotoProducto descripcion={foto} ratio="3/4" capsula={capsula} className="lg:sticky lg:top-24" />

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="u-eyebrow">{eyebrow}</span>
            <h1 className="u-display text-[2.5rem] leading-[0.95] sm:text-[3.25rem]">
              {titular}
            </h1>
            <div className="max-w-[46ch] text-[1.08rem] leading-relaxed tracking-normal text-muted">
              {entradilla}
            </div>
          </div>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-end justify-between gap-4 border-2 border-ink bg-yellow px-5 py-4">
              <span className="u-display text-[2.5rem] leading-none text-ink">
                {precioES(p.precio)}
              </span>
              <span className="u-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink/70">
                IVA incluido
              </span>
            </div>
            <BotonComprar sku={sku}>Comprar</BotonComprar>
            <p className="u-mono text-[0.66rem] leading-relaxed text-muted">
              {p.alcohol
                ? "Contiene alcohol · solo mayores de 18 años · envío a España peninsular"
                : "Sin alcohol · envío a 25 países · llega en 3-5 días laborables"}
            </p>
            {/* La objeción del vidrio se responde donde se decide la compra. */}
            <Link
              href="/envios"
              className="u-mono inline-block py-1 text-[0.66rem] leading-relaxed text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            >
              Si llega rota, te mandamos otra · 14 días de devolución
            </Link>
          </div>

          <dl className="grid grid-cols-1 border-t border-line">
            {ficha.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 border-b border-line py-3">
                <dt className="u-mono text-[0.66rem] uppercase text-muted">{k}</dt>
                <dd className="u-mono text-[0.82rem] tracking-normal">{v}</dd>
              </div>
            ))}
          </dl>

          {cierre}
        </div>
      </div>
    </section>
  );
}
