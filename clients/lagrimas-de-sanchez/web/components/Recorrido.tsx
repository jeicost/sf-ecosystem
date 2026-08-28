"use client";

import { useEffect, useRef, useState } from "react";
import { Botella } from "@/components/Botella";

/**
 * El recorrido: la botella se queda quieta y la luz viaja.
 *
 * El activo único de esta web es que el estampado es texto real, no una foto —
 * así que la botella puede CONTARSE por tramos. La izquierda queda fija
 * (sticky) con un velo oscuro que abre una ventana de luz; al avanzar por los
 * capítulos de la derecha, la ventana baja con la lectura.
 *
 * El foco ilumina ZONAS, no piezas: acoplarlo a una pieza concreta exigiría
 * fijar coordenadas internas de la botella, que se maquetan solas — un foco
 * por franjas es indestructible ante cualquier cambio del estampado.
 *
 * Con prefers-reduced-motion el velo desaparece y la botella se ve entera:
 * el recorrido sigue funcionando como texto.
 */

type Capitulo = {
  /** Centro de la ventana de luz, en fracción del alto de la botella. */
  foco: number;
  /** Alto de la ventana, en fracción. */
  ancho: number;
  clave: string;
  titulo: string;
  cuerpo: string;
};

const CAPITULOS: Capitulo[] = [
  {
    foco: 0.2, ancho: 0.2, clave: "El hombro",
    titulo: "Arriba, poco.",
    cuerpo:
      "El hombro es cónico y la serigrafía resbala: solo aguantan las piezas pequeñas. El cuello va desnudo a propósito — en el vino lo tapa la cápsula, y en la botella vacía el ámbar limpio con el tapón encima queda mejor que cualquier tinta.",
  },
  {
    foco: 0.37, ancho: 0.18, clave: "El nombre",
    titulo: "El único momento de calma.",
    cuerpo:
      "En medio de cincuenta y siete barbaridades, el nombre con quince milímetros de aire alrededor donde no entra ninguna pieza. La A es una lágrima. Ese contraste — un bloque sereno rodeado de ruido — es el diseño entero.",
  },
  {
    foco: 0.47, ancho: 0.13, clave: "El ancla",
    titulo: "Una frase enorme por cara.",
    cuerpo:
      "Cada cara visible de la botella lleva una frase que la cruza entera y el resto se calla alrededor. Sin ese contraste de escala, cincuenta y siete piezas serían una sopa de letras. Con él, se leen como un periódico.",
  },
  {
    foco: 0.66, ancho: 0.3, clave: "El lagrimómetro",
    titulo: "El instrumento está roto.",
    cuerpo:
      "La columna que parte el cuerpo en dos: seis marcas, de OJO SECO a DESEMBALSE. La aguja va clavada arriba del todo — un medidor que solo sabe dar una lectura. Es la pieza que la gente fotografía.",
  },
  {
    foco: 0.78, ancho: 0.26, clave: "Las piezas",
    titulo: "Texto dentro del dibujo.",
    cuerpo:
      "Doce bandas justificadas de lado a lado, con la palabra integrada en cada pictograma: arqueada sobre la chepa, en banda cruzando la chirimoya, bajo la boca. Ni una sola cara: todo lo dice el texto, que es más difícil y más gracioso.",
  },
  {
    foco: 0.94, ancho: 0.14, clave: "El número",
    titulo: "Se termina a mano.",
    cuerpo:
      "Abajo del todo, un hueco sin tinta: EDICIÓN Nº ____. Cada botella de la tirada de mil se numera a mano antes de salir. No es una serie limitada de mentira — es que la última pieza del estampado la escribe una persona.",
  },
];

export function Recorrido() {
  const [activo, setActivo] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            const i = refs.current.indexOf(e.target as HTMLElement);
            if (i >= 0) setActivo(i);
          }
        }
      },
      // La franja central del viewport decide el capítulo activo.
      { rootMargin: "-42% 0px -42% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const cap = CAPITULOS[activo];
  const ventanaTop = (cap.foco - cap.ancho / 2) * 100;
  const ventanaFin = (cap.foco + cap.ancho / 2) * 100;

  return (
    <section className="s-dark border-b-2 border-ink">
      <div className="mx-auto grid max-w-[86rem] px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        {/* La botella fija con su velo. En móvil no hay sitio para el sticky
            doble: se enseña una vez arriba y el texto sigue solo. */}
        <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
          <div className="relative mx-auto py-10 lg:py-0">
            <div className="flex h-[380px] items-end overflow-hidden sm:h-[480px] lg:h-[640px]">
              <div className="origin-bottom scale-[0.56] sm:scale-[0.72] lg:scale-100">
                <Botella alto={640} />
              </div>
            </div>
            {/* El velo con la ventana de luz. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden transition-all duration-700 ease-out motion-reduce:hidden! lg:block"
              style={{
                background: `linear-gradient(to bottom,
                  rgba(12,10,7,0.82) 0%,
                  rgba(12,10,7,0.82) ${ventanaTop}%,
                  transparent ${ventanaTop + 4}%,
                  transparent ${ventanaFin - 4}%,
                  rgba(12,10,7,0.82) ${ventanaFin}%,
                  rgba(12,10,7,0.82) 100%)`,
              }}
            />
          </div>
        </div>

        {/* Los capítulos. */}
        <div className="flex flex-col pb-16 lg:pb-0">
          <div className="flex flex-col gap-3 pt-14 lg:min-h-[46vh] lg:justify-end lg:pb-6">
            <span className="u-eyebrow">El recorrido</span>
            <h2 className="u-display text-[2.3rem] sm:text-[2.9rem]">
              La botella, <span className="text-yellow">tramo a tramo.</span>
            </h2>
          </div>

          {CAPITULOS.map((c, i) => (
            <article
              key={c.clave}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={`flex flex-col gap-4 border-t border-line py-14 transition-opacity duration-500 lg:min-h-[52vh] lg:justify-center ${
                i === activo ? "opacity-100" : "lg:opacity-35"
              }`}
            >
              <span className="u-mono text-[0.66rem] uppercase tracking-[0.2em] text-yellow">
                {String(i + 1).padStart(2, "0")} · {c.clave}
              </span>
              <h3 className="u-display text-[1.8rem] sm:text-[2.2rem]">{c.titulo}</h3>
              <p className="max-w-[52ch] text-[1.02rem] leading-relaxed text-muted">{c.cuerpo}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
