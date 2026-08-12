import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // 2026-08-12: esta landing PASÓ A SER la home de discoolver.com. Su código
      // se fusionó en clients/discoolver/web (componentes en components/app/,
      // contenido en lib/content/app-home.ts) y aquí ya no queda nada que servir
      // que no esté allí: dejarlo vivo era publicar la misma home en dos URLs y
      // competir contra nosotros mismos en Google.
      //
      // El proyecto no se borra —el historial de despliegues y las variables de
      // entorno tienen valor— pero todo redirige al dominio bueno.
      {
        source: "/influencers",
        destination: "https://discoolver.com/influencers",
        permanent: true,
      },
      {
        source: "/en/:path*",
        destination: "https://discoolver.com/en/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        destination: "https://discoolver.com/:path*",
        permanent: true,
      },
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
