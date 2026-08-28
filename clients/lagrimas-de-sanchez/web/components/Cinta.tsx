import { PIEZAS } from "@/lib/piezas";

/**
 * La cinta de piezas.
 *
 * Es la pieza más honesta de la página: el producto son cincuenta y siete
 * palabras, así que enseñarlas desfilando no es decoración, es el catálogo.
 *
 * El bucle se hace duplicando el contenido en el marcado y desplazando
 * exactamente la mitad. La duración se calcula desde el número de piezas, no
 * es un número mágico: si mañana entra la 68, la velocidad no cambia.
 */
export function Cinta({ oscura = false }: { oscura?: boolean }) {
  const textos = PIEZAS.map((p) => p.texto);
  const segundos = textos.length * 2.4;

  return (
    <div
      className={`relative overflow-hidden border-y-2 py-4 ${
        oscura ? "s-dark border-ink" : "border-ink bg-yellow"
      }`}
      aria-label={`Las ${textos.length} piezas del estampado`}
    >
      <div className="u-cinta flex" style={{ animationDuration: `${segundos}s` }}>
        {[0, 1].map((vuelta) => (
          <ul key={vuelta} className="flex shrink-0" aria-hidden={vuelta === 1}>
            {textos.map((t) => (
              <li key={t} className="flex items-center">
                <span className="u-cond px-5 text-[1.15rem] whitespace-nowrap sm:text-[1.45rem]">
                  {t}
                </span>
                <span className="u-mono text-[0.7rem] opacity-50">✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
