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
      // devuelve al artículo.
      //
      // 308 y no 307 (12-ago-2026): con el temporal, Google trataba /en/blog
      // como URL propia en vez de consolidar la señal en /blog, que es lo que
      // dice el canonical y lo que queremos. El día que se traduzca de verdad
      // hay que contar con que el 308 está cacheado en los navegadores: la ruta
      // nueva tendrá que servirse desde otro sitio o esperar a que caduque.
      { source: "/en/blog", destination: "/blog", permanent: true },
      { source: "/en/blog/:slug", destination: "/blog/:slug", permanent: true },

      // El blog viejo publicó tres artículos DOS VECES, con distinto slug. Al
      // rescatarlo salieron duplicados, que es contenido duplicado y Google lo
      // penaliza. Se despublicó el más corto de cada par y su URL —que estuvo
      // indexada años— redirige al gemelo que sí se queda, para no tirar sus
      // enlaces a un 404.
      { source: "/blog/monday-clubbing-madrid", destination: "/blog/mondays-where-to-go-out-in-madrid", permanent: true },
      { source: "/blog/cerveza-artesanal-madrid", destination: "/blog/mejores-cervezas-artesanales-madrid", permanent: true },
      { source: "/blog/reduce-plastico-maleta", destination: "/blog/reduce-el-plastico-de-tu-maleta", permanent: true },

      // ── blog.discoolver.com ──────────────────────────────────────────────
      // El subdominio del blog viejo apunta ahora aquí. Sus URLs no se tiran a
      // la papelera: cada una aterriza en SU artículo. El blog usó dos formatos
      // a lo largo de los años —plano y con fecha— y los dos siguen indexados.

      // Las categorías del WordPress viejo. Eran 19 y estaban en la barra
      // lateral de cada artículo, así que el rescate arrastra ~900 enlaces a
      // ellas y Google las tiene indexadas desde 2016. Hoy mueren en un 404:
      // caen en el catch-all de más abajo y acaban en /blog/category/…, que no
      // existe. Aquí no hay páginas de categoría —el índice del blog las lista,
      // pero no filtra—, así que el destino honesto es el índice.
      // Las dos reglas van ANTES que el resto del bloque, y la del subdominio
      // antes que la general, porque Next aplica la primera que casa y así se
      // resuelve en un salto en vez de encadenar dos.
      {
        source: "/category/:path*",
        has: [{ type: "host", value: "blog.discoolver.com" }],
        destination: "https://discoolver.com/blog",
        permanent: true,
      },
      { source: "/category/:path*", destination: "/blog", permanent: true },
      {
        source: "/blog/:y(\\d{4})/:m(\\d{2})/:d(\\d{2})/:slug",
        has: [{ type: "host", value: "blog.discoolver.com" }],
        destination: "https://discoolver.com/blog/:slug",
        permanent: true,
      },
      {
        source: "/:slug((?!blog$|blog/).*)",
        has: [{ type: "host", value: "blog.discoolver.com" }],
        destination: "https://discoolver.com/blog/:slug",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "blog.discoolver.com" }],
        destination: "https://discoolver.com/blog",
        permanent: true,
      },

      // ── Fichas de la plataforma vieja ────────────────────────────────────
      // Van al final, DESPUÉS del bloque de blog.discoolver.com: son reglas sin
      // `has`, así que puestas arriba se comerían URLs del subdominio que sí
      // tienen artículo detrás (el blog publicó alguna entrada bajo /madrid/).
      //
      // /en/madrid/… es el espejo inglés de la plataforma, que no se rescató:
      // 31 enlaces dentro de los artículos y lo que Google tenga indexado dan
      // hoy 404 seco. No vale un catch-all /en/:path* como el de /es —se
      // comería /en/guias, /en/influencers y /en/360/*, que son páginas
      // reales—, así que la regla va acotada al prefijo de ciudad.
      { source: "/en/madrid/:path*", destination: "/en", permanent: true },
      // Las mismas fichas se publicaron también sin prefijo de idioma y así se
      // compartieron en redes: los enlaces del blog todavía arrastran su
      // utm_campaign de 2018-2019.
      { source: "/madrid/:path*", destination: "/", permanent: true },
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
