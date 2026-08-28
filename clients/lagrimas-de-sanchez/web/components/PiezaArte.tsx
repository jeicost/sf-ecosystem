import { readFileSync } from "node:fs";
import { join } from "node:path";
import { rutaIcono } from "@/lib/iconos";

/**
 * Pinta el arte de una pieza del estampado.
 *
 * Las piezas de TEXTO se incrustan en línea, no con <img>. Un SVG cargado por
 * <img> es un documento aislado: no hereda las fuentes de la página, así que
 * su texto caía a una condensada de sistema más ancha y se salía de la caja.
 * Incrustado, el `font-family` de la clase `u-cond` aplica y sale la Barlow
 * real. Las piezas dibujadas no tienen texto vivo, así que van por <img> y se
 * cachean como cualquier imagen.
 *
 * La lectura de fichero ocurre en el servidor, en build: no llega nada de esto
 * al navegador salvo el marcado ya resuelto.
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

  const esTexto = ruta.includes("/t-");
  if (!esTexto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ruta} alt={texto} className={className} />
    );
  }

  let svg: string;
  try {
    svg = readFileSync(join(process.cwd(), "public", ruta), "utf8");
  } catch {
    return null;
  }
  // La familia se resuelve por CSS heredado, no por atributo de presentación.
  svg = svg
    .replace(/ font-family="[^"]*"/g, "")
    .replace(/<svg /, '<svg class="u-cond" role="img" aria-label="' + texto.replace(/"/g, "") + '" ');

  return <span className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}
