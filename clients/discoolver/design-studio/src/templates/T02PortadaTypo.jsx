import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T02PortadaTypo.css';

/**
 * T02PortadaTypo — Portada tipográfica sin foto.
 * Template 2/17.
 * Fondo magenta corporativo a sangre + tipografía oversize.
 * Usar cuando no hay protagonista fotográfico o se quiere look editorial/abstracto.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year             - 2 dígitos ("26")
 * @param {string} config.ciudadLine       - etiqueta sobre city ("+ CIUDAD CONDAL")
 * @param {string} config.coverTagline     - tagline bajo wordmark
 * @param {string} config.coverSubTagline  - sub-tagline bajo city
 * @param {string} config.coverBgColor     - fondo principal
 * @param {string} config.coverStripColor  - franja inferior
 * @param {string} config.siteUrl
 */
export default function T02PortadaTypo({ config = {} }) {
  const {
    city            = 'BARCELONA',
    year            = '26',
    ciudadLine      = '+ CIUDAD CONDAL',
    coverTagline    = 'Descubre los lugares + cool de la ciudad',
    coverSubTagline = 'que cualquier local de la ciudad',
    coverBgColor    = '#C8006B',
    coverStripColor = '#a50057',
    siteUrl         = 'discoolver.com',
  } = config;

  return (
    <PageA4
      bg={coverBgColor}
      className="dv-portada-typo"
    >
      {/* Grain texture */}
      <div className="dv-portada-typo__grain" />

      {/* Decorative watermark */}
      <div className="dv-portada-typo__deco-plus">+</div>

      {/* ── TOP AREA ── */}
      <div className="dv-portada-typo__top">
        <div className="dv-portada-typo__wordmark">discoolver</div>
        <div className="dv-portada-typo__tagline">{coverTagline}</div>
        <div className="dv-portada-typo__rule" />
        <div className="dv-portada-typo__ciudad-line">{ciudadLine}</div>
        <div className="dv-portada-typo__city">{city.toUpperCase()}</div>
        <div className="dv-portada-typo__sub-tagline">{coverSubTagline}</div>
      </div>

      {/* ── BOTTOM STRIP ── */}
      <div className="dv-portada-typo__strip" style={{ background: coverStripColor }}>
        <div className="dv-portada-typo__strip-label">Guía discoolver</div>

        <div className="dv-portada-typo__year-row">
          <span className="dv-portada-typo__year">2</span>
          <DiscoolverIsotipo
            size={72}
            color="#ffffff"
            style={{ position: 'relative', top: 2, margin: '0 2px' }}
          />
          <span className="dv-portada-typo__year">{year}</span>
        </div>

        <div className="dv-portada-typo__strip-city">{city.toUpperCase()}</div>

        <div className="dv-portada-typo__strip-bottom">
          <div />
          <div className="dv-portada-typo__url">{siteUrl}</div>
        </div>
      </div>
    </PageA4>
  );
}
