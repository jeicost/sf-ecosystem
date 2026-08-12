import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Rutas de la web ANTIGUA de discoolver.com → sus equivalentes nuevas.
  // Hoy son inofensivas (nadie llega con estas rutas a este proyecto);
  // el día del corte de dominio son las que salvan el SEO acumulado.
  async redirects() {
    return [
      { source: "/es", destination: "/", permanent: true },
      { source: "/es/destinos", destination: "/360/destinos", permanent: true },
      { source: "/es/alojamientos", destination: "/360/alojamientos", permanent: true },
      { source: "/es/influencers", destination: "/influencers", permanent: true },
      { source: "/es/:path*", destination: "/", permanent: true },
      { source: "/en/destinos", destination: "/en/360/destinos", permanent: true },
      { source: "/en/alojamientos", destination: "/en/360/alojamientos", permanent: true },
      // El blog es el rescate del blog viejo de discoolver.com y está ENTERO en
      // español. No hay espejo inglés porque no existe el contenido: montarlo
      // con los textos en español sería fingir una traducción. El selector de
      // idioma del nav genera /en/blog igualmente, así que en vez de un 404 se
      // devuelve al artículo. Si algún día se traduce, esto se quita.
      { source: "/en/blog", destination: "/blog", permanent: false },
      { source: "/en/blog/:slug", destination: "/blog/:slug", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
