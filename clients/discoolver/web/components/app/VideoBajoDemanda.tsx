"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Vídeo que en el teléfono no descarga ni un byte.
 *
 * Los dos vídeos de la home pesaban 13,7 MB y 13,0 MB y se reproducían solos en
 * todos los anchos: 25,9 MB en la primera carga móvil (medido el 19-ago-2026).
 * Recomprimirlos bajó el par a 6,9 MB, pero seguir sirviéndolos a un teléfono
 * para decorar sigue siendo caro, así que por debajo de 880 px se enseña solo
 * el póster —una imagen de ~100 KB— y el <video> ni se monta.
 *
 * Se decide en cliente con matchMedia y no con CSS porque un `display:none` no
 * evita la descarga: el navegador se trae el vídeo igual. También respeta
 * `prefers-reduced-motion`.
 */
export function VideoBajoDemanda({
  src,
  poster,
  ancho,
  alto,
  etiqueta,
}: {
  src: string;
  poster: string;
  ancho: number;
  alto: number;
  etiqueta: string;
}) {
  const [reproducir, setReproducir] = useState(false);

  useEffect(() => {
    const grande = window.matchMedia("(min-width: 881px)");
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decidir = () => setReproducir(grande.matches && !quieto.matches);
    decidir();
    grande.addEventListener("change", decidir);
    quieto.addEventListener("change", decidir);
    return () => {
      grande.removeEventListener("change", decidir);
      quieto.removeEventListener("change", decidir);
    };
  }, []);

  if (!reproducir) {
    return <Image src={poster} alt={etiqueta} width={ancho} height={alto} priority />;
  }
  return <video src={src} poster={poster} autoPlay muted loop playsInline preload="none" aria-label={etiqueta} />;
}
