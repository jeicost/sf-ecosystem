import Image from "next/image";

/**
 * Fotografía de apoyo de /guias.
 *
 * La página vendía un objeto de 29 € sin enseñar el objeto: ninguna de sus
 * nueve secciones tenía una sola imagen, solo las portadas 3D en CSS. Esto es
 * el marco común para las tres fotos de producto, para que entren con el mismo
 * tratamiento en vez de cada una a su aire.
 */
export function GuiaFoto({ src, alt, alto = 420 }: { src: string; alt: string; alto?: number }) {
  return (
    <figure className="guia-foto" style={{ ["--alto" as string]: `${alto}px` }}>
      <Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 1100px" quality={80} />
    </figure>
  );
}
