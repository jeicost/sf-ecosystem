import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    const rootToEs = [
      "/",
      "/casos",
      "/contacto",
      "/corporates",
      "/emprendedores",
      "/equipo",
      "/equipo-por-horas",
      "/growth-partner",
      "/innovacion-abierta-colaborativa",
      "/startups",
      "/team-as-a-service",
      "/venture",
    ];
    return rootToEs.map((path) => ({
      source: path,
      destination: path === "/" ? "/es" : `/es${path}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
