import type { Metadata } from "next";
import { Botella } from "@/components/Botella";

/**
 * MESA DE RENDERS — herramienta interna, no es una página del sitio.
 *
 * Existe para que `diseno/renders/generar.mjs` capture la botella a alta
 * resolución desde el MISMO componente que ve el visitante. Así el render y la
 * web no pueden divergir: si cambia una pieza del estampado, se regenera y
 * los PNG vuelven a ser ciertos. Un PNG dibujado aparte se queda viejo el día
 * que alguien toca el inventario, y nadie se entera.
 *
 * `noindex` + fuera del sitemap: no es contenido, es utillaje.
 */
export const metadata: Metadata = {
  title: "Mesa de renders",
  robots: { index: false, follow: false },
};

/** Cada escena se captura por su id. Ver diseno/renders/generar.mjs. */
function Escena({
  id,
  ancho,
  alto,
  children,
}: {
  id: string;
  ancho: number;
  alto: number;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="relative flex items-end justify-center overflow-hidden"
      style={{
        width: ancho,
        height: alto,
        background: "#141512",
      }}
    >
      {/* CONTRALUZ. Un vidrio antico es casi negro: sobre fondo negro no tiene
          silueta, se deshace por el culo. Lo que lo recorta en una foto real
          es una luz DETRÁS, no delante — este halo hace de fondo iluminado y
          es lo que devuelve el perfil de la botella. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(42% 52% at 50% 62%, rgba(214,216,176,0.30), rgba(120,124,88,0.10) 55%, transparent 76%)",
        }}
      />
      {/* La viñeta: cierra las esquinas y deja el peso en el centro. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(74% 74% at 50% 50%, transparent 40%, rgba(6,7,5,0.72))",
        }}
      />
      {/* El suelo: una banda algo más clara para que la botella apoye en algo. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%]"
        style={{
          background:
            "linear-gradient(to top, rgba(206,212,168,0.13), transparent)",
        }}
      />
      <div className="relative flex items-end justify-center gap-10 pb-[7%]">
        {children}
      </div>
    </div>
  );
}

export default function MesaDeRenders() {
  return (
    <main className="flex flex-col gap-10 bg-[#1B1A16] p-10">
      {/* La cabecera va pegada arriba (sticky) y el pie cierra la página:
          las dos se cuelan ENCIMA de la escena y salen dentro del PNG. Aquí
          no hay sitio web, hay plató, así que se apagan. */}
      <style>{`body > header, body > footer { display: none !important; }`}</style>
      <p className="u-mono text-[0.7rem] text-[#96907F]">
        Mesa de renders — herramienta interna. Se captura con
        diseno/renders/generar.py
      </p>

      <Escena id="r-vino" ancho={1200} alto={1500}>
        <Botella alto={1150} capsula />
      </Escena>

      <Escena id="r-vacia" ancho={1200} alto={1500}>
        <Botella alto={1150} capsula={false} />
      </Escena>

      {/* El estuche: la misma botella en sus dos vidas, que es el argumento
          entero del producto puesto en una imagen. */}
      <Escena id="r-estuche" ancho={1600} alto={1400}>
        <Botella alto={1080} capsula />
        <Botella alto={1080} capsula={false} />
      </Escena>

      <Escena id="r-pack-tres" ancho={1800} alto={1400}>
        <Botella alto={1010} capsula />
        <Botella alto={1080} capsula />
        <Botella alto={1010} capsula />
      </Escena>

      {/* Cuadrada para redes y para la ficha de catálogo. */}
      <Escena id="r-cuadrada" ancho={1200} alto={1200}>
        <Botella alto={980} capsula={false} />
      </Escena>
    </main>
  );
}
