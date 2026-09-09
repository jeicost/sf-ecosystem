/**
 * Mockups del producto para las páginas 360: la plataforma real capturada en
 * marca blanca (tenants ficticios «Vilamar», «Hotel Cala Bruna» y «Rumbo
 * Norte» — nunca clientes reales). Marco de navegador + teléfono en CSS,
 * imágenes webp en public/assets/360/producto/.
 */

const BASE = "/assets/360/producto";

export function MarcoNavegador({
  src,
  alt,
  url,
}: {
  src: string;
  alt: string;
  url?: string;
}) {
  return (
    <figure className="prod-browser">
      <div className="prod-browser__bar" aria-hidden>
        <span className="prod-dot" />
        <span className="prod-dot" />
        <span className="prod-dot" />
        {url && <span className="prod-url">{url}</span>}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BASE}/${src}`} alt={alt} loading="lazy" />
    </figure>
  );
}

export function MarcoTelefono({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="prod-phone">
      <span className="prod-phone__notch" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BASE}/${src}`} alt={alt} loading="lazy" />
    </figure>
  );
}

/** Escenario principal: consola en marco de navegador + app solapada. */
export function EscenarioProducto({
  consola,
  telefono,
  url,
}: {
  consola: { src: string; alt: string };
  telefono?: { src: string; alt: string };
  url?: string;
}) {
  return (
    <div className={`prod-stage${telefono ? " prod-stage--con-phone" : ""}`}>
      <MarcoNavegador src={consola.src} alt={consola.alt} url={url} />
      {telefono && (
        <div className="prod-stage__phone">
          <MarcoTelefono src={telefono.src} alt={telefono.alt} />
        </div>
      )}
    </div>
  );
}

/** Fila de capturas secundarias con pie. */
export function GaleriaProducto({
  items,
  columnas,
}: {
  items: { src: string; alt: string; caption: string; tipo?: "phone" | "browser" }[];
  columnas?: string;
}) {
  return (
    <div className="prod-galeria" style={columnas ? { gridTemplateColumns: columnas } : undefined}>
      {items.map((it) => (
        <figure className="prod-mini" key={it.src}>
          {it.tipo === "phone" ? (
            <MarcoTelefono src={it.src} alt={it.alt} />
          ) : (
            <MarcoNavegador src={it.src} alt={it.alt} />
          )}
          <figcaption className="prod-caption">{it.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
