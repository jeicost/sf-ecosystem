export const site = {
  name: "Discoolver",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://discoolver-landing.vercel.app",
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

/** Las mismas cuentas, para pintarlas en los footers. */
export const SOCIAL = [
  { name: "Instagram", href: "https://www.instagram.com/discoolver_mad/" },
  { name: "Twitter", href: "https://twitter.com/discoolver_mad" },
  { name: "Facebook", href: "https://www.facebook.com/discoolvermad/" },
] as const;
