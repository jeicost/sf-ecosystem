import './ListingCard.css';

/**
 * ListingCard — tarjeta de recomendado reutilizable para todas las categorías.
 * Encaja en grids de 3 o 4 columnas.
 *
 * @param {string} name          - Nombre del lugar
 * @param {string} tagline       - Subtítulo/tipo (ej. "Restaurante de alta cocina")
 * @param {string} description   - Texto descriptivo (3-4 líneas)
 * @param {string} photo         - URL de la foto
 * @param {string} web           - URL web (sin https://)
 * @param {string} address       - Dirección física
 * @param {string} subcategory   - Badge de subcategoría (opcional)
 * @param {string} city          - Ciudad para slug discoolver.com (opcional)
 * @param {string} slug          - Slug en discoolver.com (opcional)
 */
export default function ListingCard({
  name,
  tagline,
  description,
  photo,
  web,
  address,
  subcategory,
  city,
  slug,
}) {
  return (
    <div className="dv-listing-card">
      {subcategory && (
        <span className="dv-lc-subcategory">{subcategory}</span>
      )}
      <p className="dv-lc-name">{name}</p>
      {tagline && <p className="dv-lc-tagline">{tagline}</p>}
      {description && <p className="dv-lc-desc">{description}</p>}
      {web && (
        <p className="dv-lc-meta">
          <span className="dv-lc-label">Web:</span> {web}
        </p>
      )}
      {address && (
        <p className="dv-lc-meta">
          <span className="dv-lc-label">Dirección:</span> {address}
        </p>
      )}
      {photo && (
        <div className="dv-lc-photo">
          <img src={photo} alt={name} loading="lazy" />
        </div>
      )}
    </div>
  );
}
