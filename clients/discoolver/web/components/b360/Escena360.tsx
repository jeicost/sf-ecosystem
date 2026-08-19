import Image from "next/image";

/**
 * Fotografía de fondo para las secciones de discoolver 360.
 *
 * La marca B2B no tenía **una sola imagen** en sus cinco páginas: todo era
 * tipografía sobre fondo casi negro. Funcionaba, pero no se parecía a lo que
 * vende —experiencias en destinos reales— y a nadie le pareció una agencia.
 *
 * Dos modos, según lo que pida la sección:
 *
 *  · `fondo` — la imagen va detrás del contenido, a sangre, con un velo doble:
 *    uno vertical que asienta el texto y otro de marca para que la foto
 *    pertenezca a 360 y no parezca una foto de banco pegada encima.
 *  · `marco` — la imagen es la protagonista dentro de su caja redondeada.
 *
 * El velo NO es decorativo: sin él el texto blanco sobre cielo claro se cae al
 * mínimo contraste, que es como se rompen estas secciones.
 */
export function FondoEscena({
  src,
  alt = "",
  prioridad = false,
  intensidad = "media",
}: {
  src: string;
  alt?: string;
  prioridad?: boolean;
  /** Cuánto tapa el velo. `alta` para secciones con mucho texto encima. */
  intensidad?: "media" | "alta";
}) {
  return (
    <>
      <Image
        className="b360-escena__img"
        src={src}
        alt={alt}
        fill
        priority={prioridad}
        sizes="100vw"
        quality={80}
      />
      <span className={`b360-escena__velo b360-escena__velo--${intensidad}`} aria-hidden="true" />
    </>
  );
}

export function MarcoEscena({
  src,
  alt,
  alto = 460,
  className,
}: {
  src: string;
  alt: string;
  alto?: number;
  className?: string;
}) {
  return (
    <div className={`b360-marco ${className ?? ""}`.trim()} style={{ ["--alto" as string]: `${alto}px` }}>
      <Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 50vw" quality={80} style={{ objectFit: "cover" }} />
    </div>
  );
}
