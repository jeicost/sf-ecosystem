"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Botella } from "@/components/Botella";

/**
 * El hueco de la fotografía de producto.
 *
 * Todavía no hay fotos: no las habrá hasta que el palé esté en el garaje. En
 * vez de un rectángulo gris que parezca un error, el hueco se diseña: reserva
 * la proporción exacta, dice qué foto va ahí y enseña la botella dibujada como
 * sustituta. El día que llegue la sesión, se cambia por la imagen y la
 * maquetación no se mueve.
 *
 * La botella se dimensiona MIDIENDO la caja (93 % de su alto) en vez de con un
 * número a ojo: con alturas fijas quedaba flotando a un cuarto del marco, que
 * era el principal "esto está vacío" de toda la web.
 */
export function FotoProducto({
  descripcion,
  ratio = "3/4",
  capsula = true,
  className = "",
}: {
  /** Qué tiene que enseñar la foto cuando exista. Documentación del encargo:
      no se muestra al visitante, que no necesita saber el encuadre previsto. */
  descripcion: string;
  ratio?: "3/4" | "1/1" | "4/5";
  /** false = la botella vacía, con su tapón de corcho y cabeza de zamak. */
  capsula?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [alto, setAlto] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAlto(Math.round(el.clientHeight * 0.93)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  void descripcion;
  return (
    <figure
      ref={ref}
      title={descripcion}
      className={`group relative flex items-end justify-center overflow-hidden border-2 border-ink bg-[#111110] ${className}`}
      style={{ aspectRatio: ratio.replace("/", " / ") }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(62% 48% at 50% 78%, rgba(192,139,62,0.30), transparent 72%)",
        }}
      />
      {alto > 0 && <Botella alto={alto} capsula={capsula} />}

      <figcaption className="absolute left-4 top-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 bg-yellow" />
        <span className="u-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#96907F]">
          Las fotos, con el primer lote
        </span>
      </figcaption>
    </figure>
  );
}
