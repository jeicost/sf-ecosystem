/**
 * Qué piezas tienen ya su arte real generado, y dónde vive.
 *
 * Los ficheros son re-trazados ligeros (3-30 KB) de las generaciones aprobadas,
 * en blanco sobre transparente: sobre ámbar van tal cual, y sobre claro se
 * entintan con `filter: brightness(0)`. La numeración coincide con el
 * inventario de lib/piezas.ts (las 13 primeras de la cola van 1:1).
 */
export const ICONO_DE: Record<number, string> = {
  1: "01-galgo-de-paiporta",
  2: "02-chepas",
  3: "03-chirimoyas",
  4: "04-chiqui",
  5: "05-pili-juerga",
  6: "06-la-nina-de-la-curva",
  7: "07-catedratica",
  8: "08-gracita-bolanos",
  9: "09-el-portero",
  10: "10-cejas",
  11: "11-la-cajera",
  12: "12-tucan",
  13: "13-charo",
};

export const rutaIcono = (n: number): string | null =>
  ICONO_DE[n] ? `/iconos/${ICONO_DE[n]}.svg` : null;
