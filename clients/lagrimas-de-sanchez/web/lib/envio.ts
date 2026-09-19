import type { Producto } from "@/lib/catalogo";

/**
 * Tarifas de envío.
 *
 * LIMITACIÓN CONOCIDA de Stripe Checkout: las opciones de envío se muestran
 * TODAS al comprador, no se pueden filtrar por el país que acaba de escribir.
 * Así que si un pedido internacional elige la tarifa peninsular, el cobro se
 * queda corto. El webhook registra la tarifa elegida junto con la dirección
 * justamente para poder detectarlo: si el país no es España y la tarifa es la
 * peninsular, ese pedido hay que revisarlo a mano antes de enviarlo.
 *
 * La solución definitiva es un checkout propio que calcule el porte después de
 * conocer el país. No merece la pena antes de saber cuántos pedidos
 * internacionales hay de verdad.
 */

export type Tarifa = {
  id: string;
  nombre: string;
  /** Céntimos. */
  importe: number;
  diasMin: number;
  diasMax: number;
};

/**
 * ⚠️ ESTAS TARIFAS SON DE CUANDO LA BOTELLA ERA DE 750 ML (19-sep-2026).
 *
 * La botella definitiva es una magnum: 1,4 kg la vacía con embalaje, 4,1 kg el
 * estuche y 8,2 kg el pack de tres. Un paquete de 8,2 kg no se envía por 4,90 €
 * en ninguna mensajería española, así que el pack de tres pierde dinero en
 * cada envío antes de contar el producto.
 *
 * Son tarifas planas por zona a propósito (Stripe Checkout no filtra por país),
 * pero el importe es una decisión comercial: no se toca sin que lo decida el
 * dueño. Va junto al replanteamiento de precios de `producto/costes.md`.
 */
export const TARIFAS: Tarifa[] = [
  { id: "es", nombre: "España peninsular y Baleares", importe: 490, diasMin: 3, diasMax: 5 },
  { id: "eu", nombre: "Unión Europea", importe: 1490, diasMin: 5, diasMax: 8 },
  { id: "int", nombre: "Resto del mundo", importe: 2990, diasMin: 8, diasMax: 15 },
];

/** El vino solo sale de España, así que su único porte es el peninsular. */
export function tarifasPara(producto: Producto): Tarifa[] {
  return producto.alcohol ? TARIFAS.filter((t) => t.id === "es") : TARIFAS;
}
