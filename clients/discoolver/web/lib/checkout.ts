/**
 * Catálogo de venta de la tienda — la fuente de verdad de QUÉ se puede comprar
 * y a qué precio. Decisión CEO 11-ago: el cobro del 1-sept va por Stripe.
 *
 * Los precios van en céntimos y AQUÍ, no en el dashboard de Stripe: el checkout
 * usa `price_data` inline, así que no hay que crear productos a mano ni
 * sincronizar nada. Cambiar un precio = cambiar este fichero y desplegar.
 *
 * La tienda solo enseña el botón de compra cuando NEXT_PUBLIC_CHECKOUT=1 —
 * hasta entonces, las fichas siguen en "Avísame" (lista de lanzamiento). El
 * flip del 1 de septiembre es una variable de entorno en Vercel, no un deploy.
 *
 * IVA: de momento precio final con impuestos incluidos (tax_behavior por
 * defecto). Cuando el gestor confirme el tratamiento (digital 21% / libro 4%),
 * se activa Stripe Tax — está anotado en el checklist de activación.
 */
export type Sku = "madrid-digital" | "madrid-papel";

export interface Producto {
  sku: Sku;
  /** Nombre que ve el comprador en el checkout de Stripe. */
  nombre: { es: string; en: string };
  descripcion: { es: string; en: string };
  /** En céntimos de euro. */
  precio: number;
  /** El papel lleva envío: Stripe pedirá dirección. */
  envio: boolean;
}

export const CATALOGO: Record<Sku, Producto> = {
  "madrid-digital": {
    sku: "madrid-digital",
    nombre: {
      es: "Guía Discoolver Madrid 2026 — Digital",
      en: "Discoolver Madrid 2026 Guide — Digital",
    },
    descripcion: {
      es: "Edición 2026. La llevas en el móvil desde el primer minuto. Precio de lanzamiento.",
      en: "2026 Edition. On your phone from minute one. Launch price.",
    },
    precio: 1400, // 14€ de lanzamiento — después 1900
    envio: false,
  },
  "madrid-papel": {
    sku: "madrid-papel",
    nombre: {
      es: "Guía Discoolver Madrid 2026 — Papel",
      en: "Discoolver Madrid 2026 Guide — Print",
    },
    descripcion: {
      es: "Edición 2026 en papel, con la digital incluida. Impresión bajo demanda, envío en 5-8 días laborables (España).",
      en: "2026 print edition, digital included. Printed on demand, ships in 5-8 working days (Spain).",
    },
    precio: 2900,
    envio: true,
  },
};

/** El flip del lanzamiento: el botón de compra solo existe si está a "1". */
export const CHECKOUT_ABIERTO = process.env.NEXT_PUBLIC_CHECKOUT === "1";
