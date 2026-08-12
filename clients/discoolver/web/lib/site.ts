export const site = {
  name: "Discoolver",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://discoolver-landing.vercel.app",
  locale: "es_ES",
  description:
    "Guías de viaje que curan lo mejor del año en cada ciudad: recomendaciones de creadores editadas por humanos, en digital y papel, con IA para recorrer la ciudad.",
  ogImage: "/og-default.jpg",
  twitter: "@discoolver",
  organization: {
    name: "Discoolver",
    legalName: "Discoolver",
    logo: "/assets/logo.png",
    sameAs: [] as string[],
  },
} as const;
