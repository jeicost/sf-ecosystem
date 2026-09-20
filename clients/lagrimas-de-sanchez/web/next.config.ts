import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      {
        // Los 66 iconos del estampado se servían con `max-age=0`, que es el
        // valor por defecto de Next para `public/`. Con ETag eso significa que
        // el navegador REVALIDA los 66 en cada visita y en cada navegación
        // interna: 66 peticiones condicionales que a 150 ms de latencia se
        // notan aunque devuelvan 304.
        //
        // Son arte final: cambian cuando cambia una pieza, y entonces cambia
        // también el nombre del fichero. `immutable` es lo correcto.
        source: "/iconos/:ruta*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
