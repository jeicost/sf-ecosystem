export const site = {
  nombre: "Lágrimas de Sánchez",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://lagrimasdesanchez.com").replace(/\/$/, ""),
  email: "hola@lagrimasdesanchez.com",
} as const;
