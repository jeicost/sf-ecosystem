/**
 * El catálogo vive en código, no en el dashboard de Stripe.
 *
 * Son tres SKU. Sincronizar precios contra un panel externo para tres
 * productos añade un sitio donde equivocarse y ninguna ventaja: aquí el
 * precio se lee, se revisa en el diff y viaja con el despliegue.
 *
 * `precio` va en CÉNTIMOS porque es lo que espera Stripe. Escribirlo en euros
 * y multiplicar en algún sitio intermedio es cómo se cobran 2.200 € por una
 * botella.
 */

export type Sku = "botella" | "estuche" | "pack-tres";

export type Producto = {
  sku: Sku;
  nombre: string;
  /** Una línea. Es lo que se ve en la tarjeta y en el propio Checkout. */
  reclamo: string;
  descripcion: string;
  /** Céntimos de euro, IVA incluido. */
  precio: number;
  /** Peso en gramos con embalaje — decide la tarifa de envío. */
  peso: number;
  /** true si lleva alcohol: cambia países permitidos y exige verificar edad. */
  alcohol: boolean;
  /** Unidades del primer lote reservadas a este SKU. */
  stock: number;
};

/**
 * Países a los que se envía.
 *
 * La botella VACÍA es mercancía general y viaja a donde llegue el transportista.
 * El VINO no: fuera de la UE necesita importador con licencia (en EE. UU. es
 * directamente ilegal enviarlo al consumidor), y dentro de la UE hay países con
 * impuesto especial sobre el vino que exigen representante fiscal antes de la
 * primera venta. Por eso el vino arranca solo en España y se amplía cuando el
 * alta fiscal de cada destino esté hecha, no antes.
 */
export const PAISES_SIN_ALCOHOL = [
  "ES", "PT", "FR", "IT", "DE", "NL", "BE", "AT", "IE", "DK", "SE", "FI",
  "PL", "CZ", "GR", "LU", "GB", "CH", "NO", "US", "CA", "MX", "AR", "CL", "AU",
] as const;

export const PAISES_CON_ALCOHOL = ["ES"] as const;

export const CATALOGO: Record<Sku, Producto> = {
  botella: {
    sku: "botella",
    nombre: "La botella",
    reclamo: "Vacía, rellenable y numerada a mano.",
    descripcion:
      "Botella de 750 ml en vidrio ámbar con 57 piezas horneadas en el cristal a 600 grados. Viene vacía a propósito. Apta para lavavajillas.",
    precio: 2200,
    peso: 900,
    alcohol: false,
    stock: 400,
  },
  estuche: {
    sku: "estuche",
    nombre: "El estuche completo",
    reclamo: "Una vacía y una con vino. La misma botella, sus dos vidas.",
    descripcion:
      "Dos botellas idénticas: una llena de tinto de la DO Vinos de Madrid y otra vacía para que la rellenes. En su estuche.",
    precio: 3900,
    peso: 2600,
    alcohol: true,
    stock: 150,
  },
  "pack-tres": {
    sku: "pack-tres",
    nombre: "Tres vinos",
    reclamo: "Tinto de Madrid. El chiste va por fuera.",
    descripcion:
      "Tres botellas de tinto de la DO Vinos de Madrid, subzona de Arganda, en su estuche. Numeradas a mano.",
    precio: 6900,
    peso: 4200,
    alcohol: true,
    stock: 100,
  },
};

export const SKUS = Object.keys(CATALOGO) as Sku[];

export function esSku(v: unknown): v is Sku {
  return typeof v === "string" && v in CATALOGO;
}

/** Euros con coma decimal y sin céntimos cuando son cero: "22 €", "39,50 €". */
export function precioES(centimos: number): string {
  const euros = centimos / 100;
  return `${euros % 1 === 0 ? euros : euros.toFixed(2).replace(".", ",")} €`;
}
