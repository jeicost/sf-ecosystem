import './SloganBlock.css';

/**
 * SloganBlock — titular oversize para aperturas de sección.
 * Patrón: "ESTAS SON LAS SELECCIONES MÁS COOL DE / [CITY GIGANTE] / PARA 2●21"
 *
 * @param {string} prefix       - Línea pequeña sobre el nombre (ej. "ESTAS SON LAS SELECCIONES MÁS COOL DE")
 * @param {string} city         - Nombre de ciudad/destino en Bebas gigante
 * @param {string} yearSuffix   - Sufijo año (ej. "PARA 2●21"), renderea el isotipo automáticamente
 * @param {ReactNode} isotipo   - Componente isotipo a inyectar en el año (pass-through)
 * @param {string} align        - 'left' | 'right' | 'center'
 */
export default function SloganBlock({ prefix, city, yearSuffix, align = 'left', children }) {
  return (
    <div className={`dv-slogan-block dv-slogan--${align}`}>
      {prefix && <p className="dv-slogan-prefix">{prefix}</p>}
      {city   && <p className="dv-slogan-city">{city}</p>}
      {yearSuffix && <p className="dv-slogan-year">{yearSuffix}</p>}
      {children}
    </div>
  );
}

/**
 * CategoryBadge — el bloque magenta de subcategoría que aparece bajo el header.
 * Patrón: primera letra grande + resto italic + descripción
 *
 * @param {string} name         - Nombre de subcategoría (ej. "Exclusivo")
 * @param {string} description  - Descripción corta de la subcategoría
 */
export function CategoryBadge({ name, description }) {
  const first = name.charAt(0).toUpperCase();
  const rest  = name.slice(1);

  return (
    <div className="dv-cat-badge">
      <p className="dv-cat-name">
        <span className="dv-cat-initial">{first}</span>
        <em className="dv-cat-rest">{rest}</em>
      </p>
      {description && (
        <p className="dv-cat-desc">{description}</p>
      )}
    </div>
  );
}
