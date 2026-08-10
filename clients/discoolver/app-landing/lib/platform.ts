/**
 * La plataforma real. La landing es el escaparate; esto es la puerta.
 *
 * Cada sección de la landing enlaza a su contrapartida viva en
 * app.discoolver.com (decisión del CEO, 2026-08-10: "la plataforma estará viva
 * desde el principio"). Rutas verificadas contra el router de la SPA en
 * producción — si la plataforma renombra una ruta, este es el único fichero
 * que hay que tocar.
 */
export const PLATFORM_URL = "https://app.discoolver.com";

export const PLATFORM = {
  home: PLATFORM_URL,
  coolMap: `${PLATFORM_URL}/map`,
  planMyTrip: `${PLATFORM_URL}/plan-my-trip`,
  smartCalendar: `${PLATFORM_URL}/calendar`,
  search: `${PLATFORM_URL}/search`,
  collections: `${PLATFORM_URL}/wishlist`,
} as const;
