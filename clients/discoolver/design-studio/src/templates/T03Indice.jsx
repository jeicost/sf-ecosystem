import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T03Indice.css';

/** Flecha SVG reutilizable */
function ArrowRight({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M2 5H8M8 5L5.5 2.5M8 5L5.5 7.5"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Un item normal del grid (col izquierda o derecha) */
function IndexItem({ pageNum, label, sublabel, href, side = 'left' }) {
  return (
    <div className={`dv-indice__item dv-indice__item--${side}`}>
      <div className="dv-indice__num">P.{pageNum}</div>
      <div className="dv-indice__content">
        <div className="dv-indice__label">{label}</div>
        {sublabel && <div className="dv-indice__sublabel">{sublabel}</div>}
        {href && <a href={href} className="dv-indice__link">Abrir <ArrowRight /></a>}
      </div>
    </div>
  );
}

/** Item destacado ancho completo (Persona del año / Influencers) */
function FeaturedItem({ pageNum, photo, photoAlt, label, sublabel, href, labelSize = 22 }) {
  return (
    <div className="dv-indice__featured">
      <div className="dv-indice__featured-num">P.{pageNum}</div>
      {photo
        ? <img className="dv-indice__featured-img" src={photo} alt={photoAlt || label} />
        : <div className="dv-indice__featured-placeholder">🌟</div>
      }
      <div className="dv-indice__content">
        <div className="dv-indice__label" style={{ fontSize: labelSize }}>{label}</div>
        {sublabel && <div className="dv-indice__sublabel" style={{ fontSize: 9.5 }}>{sublabel}</div>}
        {href && <a href={href} className="dv-indice__link">Abrir reportaje <ArrowRight /></a>}
      </div>
    </div>
  );
}

/**
 * T03Indice — Tabla de contenidos de la guía.
 * Template 3/17.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {string} config.director
 * @param {object} config.personaDelAno   - { name, tagline, photo }
 * @param {Array}  config.influencers     - array, usa el primero para la foto
 * @param {object} config.sections        - secciones activas del guide
 */
export default function T03Indice({ config = {} }) {
  const {
    city          = 'BARCELONA',
    year          = '26',
    director      = 'Carlos Jacoste, CEO discoolver',
    personaDelAno = { name: 'Persona del Año', tagline: 'Reportaje exclusivo', photo: null },
    influencers   = [],
    sections      = {},
  } = config;

  const cityTitle = city.toUpperCase();
  const influencerPhoto = influencers[0]?.photo ?? null;

  return (
    <PageA4 bg="#ffffff" className="dv-indice">

      {/* ── Page header ── */}
      <div className="dv-page-header">
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 48,
          color: '#444',
          lineHeight: 1,
          paddingRight: 10,
        }}>Í</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color="#C8006B" />
        <span className="dv-page-section">ÍNDICE</span>
      </div>
      <hr className="dv-page-rule" />

      {/* ── Hero ── */}
      <div className="dv-indice__hero">
        <div className="dv-indice__hero-title">
          GUÍA<br /><em>DISCO</em>OLVER<br />{cityTitle}
        </div>
        <div className="dv-indice__hero-sub">
          La primera guía interactiva<br />de contenidos curados<br />por expertos.
          <div className="dv-indice__edition">
            Edición {city} 2
            <DiscoolverIsotipo size={14} color="#C8006B" style={{ display: 'inline', verticalAlign: 'middle' }} />
            {year}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="dv-indice__grid">

        <div className="dv-indice__section-divider">Editorial</div>
        <IndexItem side="left"  pageNum="1"  label="NOTA DEL DIRECTOR"  sublabel={director} href="#" />
        <IndexItem side="right" pageNum="4"  label="NUESTRA COOLTURE"   sublabel="Bienvenido al futuro del turismo" />

        <div className="dv-indice__section-divider">★ Reportaje especial</div>
        <FeaturedItem
          pageNum="5"
          photo={personaDelAno.photo}
          label={`${personaDelAno.name} — PERSONA DEL AÑO`}
          sublabel={personaDelAno.tagline || 'Reportaje exclusivo · Sus recomendados en ' + city}
          href="#"
        />

        <div className="dv-indice__section-divider">Categorías</div>
        {sections.restaurantes?.enabled !== false && (
          <IndexItem side="left"  pageNum="11" label="RESTAURANTES"      sublabel="Exclusivo · Trendy · Tradicional · Food Trucks · WOW" href="#" />
        )}
        <IndexItem side="right" pageNum="12" label="GASTRONOMÍA BCN"   sublabel="Selección local con fichas y enlaces directos" href="#" />
        {sections.fiesta?.enabled !== false && (
          <IndexItem side="left"  pageNum="18" label="FIESTA"             sublabel="Bares de copas · Speakeasy · Clubbing" href="#" />
        )}
        {sections.ocioEventos?.enabled !== false && (
          <IndexItem side="right" pageNum="22" label="OCIO Y EVENTOS"    sublabel="Conciertos · Teatro · Planes culturales" href="#" />
        )}
        {sections.arteExposiciones?.enabled !== false && (
          <IndexItem side="left"  pageNum="25" label="ARTE Y EXPOSICIONES" sublabel="Los mejores museos y galerías del mundo" href="#" />
        )}
        {sections.experienciasActividades?.enabled !== false && (
          <IndexItem side="right" pageNum="28" label="EXPERIENCIAS"       sublabel="Actividades únicas · WOW experiences" href="#" />
        )}
        {sections.alojamientos?.enabled !== false && (
          <IndexItem side="left"  pageNum="30" label="ALOJAMIENTOS"       sublabel="Los espacios más especiales del mundo" href="#" />
        )}
        {sections.shopping?.enabled !== false && (
          <IndexItem side="right" pageNum="38" label="SHOPPING"           sublabel="Cool places &amp; productos únicos" href="#" />
        )}

        <div className="dv-indice__section-divider">Especial</div>
        <FeaturedItem
          pageNum="44"
          photo={influencerPhoto}
          label="LOCAL INFLUENCERS"
          labelSize={18}
          sublabel="Las personas que inspiran la COOLtura local con su trabajo y contenido digital"
          href="#"
        />

      </div>

      {/* ── Footer ── */}
      <div className="dv-page-footer">
        <div className="dv-page-footer__brand">
          <DiscoolverIsotipo size={18} color="#C8006B" />
          <span className="dv-page-footer__wordmark">discoolver</span>
        </div>
        <span className="dv-page-footer__url">
          discoolver.com — Guía {city} 20{year}
        </span>
      </div>

    </PageA4>
  );
}
