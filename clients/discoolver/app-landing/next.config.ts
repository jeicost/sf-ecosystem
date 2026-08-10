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
      // 2026-08-10: la captación de creators se unifica en la web de guías. La
      // versión local de /influencers estaba 100% en inglés, con tres handles
      // sin verificar y "guías descargables" que no descargaban — todo material
      // prohibido por el repaso de negocio. La página y sus componentes siguen
      // en el repo por historial, pero ya no se sirven.
      {
        source: "/influencers",
        destination: "https://discoolver-landing.vercel.app/influencers",
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
