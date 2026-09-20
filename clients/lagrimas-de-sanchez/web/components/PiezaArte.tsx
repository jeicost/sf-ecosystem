import { rutaIcono } from "@/lib/iconos";

/**
 * Pinta el arte de una pieza del estampado.
 *
 * Todas las piezas van por <img>, sin excepción.
 *
 * Antes las de texto se incrustaban en línea porque un SVG cargado con <img>
 * es un documento aislado que no hereda las fuentes de la página, y su texto
 * caía a una condensada de sistema más ancha. Eso dejó de ser verdad el
 * 20-sep: los iconos llevan el texto VECTORIZADO (`diseno/iconos/vectorizar.mjs`),
 * son trazados puros y no dependen de ninguna fuente.
 *
 * Lo que costaba mantener aquella solución, medido: los 24 SVG de texto suman
 * 432 KB y se incrustaban en el HTML, así que /estampado servía **1.045 KB de
 * documento** y tardaba 3,1 s solo en recibirlo con 4G lenta. Y los pagaba dos
 * veces, porque la botella de esa misma página los descarga otra vez como
 * ficheros. Por <img> se cachean una vez y se comparten.
 */
export function PiezaArte({
  n,
  texto,
  className = "",
}: {
  n: number;
  texto: string;
  className?: string;
}) {
  const ruta = rutaIcono(n);
  if (!ruta) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ruta} alt={texto} className={className} loading="lazy" decoding="async" />
  );
}
