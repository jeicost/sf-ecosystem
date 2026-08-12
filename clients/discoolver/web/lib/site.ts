export const site = {
  name: "Discoolver",
  // El fallback es el dominio real desde el corte del 12-ago-2026. Antes era la
  // URL de .vercel.app, y si algún día faltara la variable de entorno la web
  // habría empezado a emitir canonical y OG hacia el dominio viejo sin avisar.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://discoolver.com",
  locale: "es_ES",
  description:
    "Guías de viaje que curan lo mejor del año en cada ciudad: recomendaciones de creadores editadas por humanos, en digital y papel, con IA para recorrer la ciudad.",
  ogImage: "/og-default.jpg",
  twitter: "@discoolver_mad",
  organization: {
    name: "Discoolver",
    legalName: "Discoolverworld S.L.",
    logo: "/assets/logo.png",
    // Las cuentas reales, recuperadas de la web antigua antes del corte de
    // dominio. Ojo: el handle lleva "_mad" de Madrid, de cuando discoolver era
    // solo Madrid. Si la marca abre más ciudades habrá que decidir si se
    // renombran o se abren cuentas por destino.
    sameAs: [
      "https://www.instagram.com/discoolver_mad/",
      "https://twitter.com/discoolver_mad",
      "https://www.facebook.com/discoolvermad/",
    ] as string[],
  },
} as const;

/**
 * El teléfono de contacto, uno solo para las dos marcas. Es un número
 * tailandés y el comprador de 360 es español, así que NO se enlaza con `tel:`
 * —una llamada internacional no la hace nadie— sino por WhatsApp, que es
 * gratis y es como se va a usar de verdad. Decisión de Carlos, 12-ago-2026.
 *
 * El texto visible vive en los ficheros de contenido (que tienen gemelo en
 * inglés y se editan desde el CMS); aquí solo el destino del enlace.
 */
export const WHATSAPP = {
  display: "(+66) 83 829 1723",
  href: "https://wa.me/66838291723",
} as const;

/** Enlace a WhatsApp, opcionalmente con el mensaje ya escrito. */
export function waHref(texto?: string): string {
  return texto ? `${WHATSAPP.href}?text=${encodeURIComponent(texto)}` : WHATSAPP.href;
}

/** Las mismas cuentas, para pintarlas en los footers. */
export const SOCIAL = [
  { name: "Instagram", href: "https://www.instagram.com/discoolver_mad/" },
  { name: "Twitter", href: "https://twitter.com/discoolver_mad" },
  { name: "Facebook", href: "https://www.facebook.com/discoolvermad/" },
] as const;
