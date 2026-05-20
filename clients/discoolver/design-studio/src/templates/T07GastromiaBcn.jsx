import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T07GastromiaBcn.css';

const QR_PATTERN = [1,1,1,0,1, 1,0,1,0,0, 1,1,1,0,1, 0,0,0,1,1, 1,0,1,1,1];

function ScanBox() {
  return (
    <div className="dv-gastro__scan-box">
      <div className="dv-gastro__qr">
        {QR_PATTERN.map((b, i) => (
          <div key={i} className={`dv-gastro__qr-cell${b ? '' : ' dv-gastro__qr-cell--empty'}`} />
        ))}
      </div>
      <span className="dv-gastro__scan-lbl">SCAN ME</span>
    </div>
  );
}

function Card({ item, primaryColor }) {
  return (
    <div className="dv-gastro__card">
      <div className="dv-gastro__card-img">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span className="dv-gastro__card-ph-lbl">FOTO</span>
        }
        <ScanBox />
      </div>
      <div className="dv-gastro__name">{item.name.toUpperCase()}</div>
      <div className="dv-gastro__tag">{item.tagline}</div>
      <p className="dv-gastro__desc">{item.description}</p>
      {item.web     && <div className="dv-gastro__web" style={{ color: primaryColor }}>Web: {item.web}</div>}
      {item.address && <div className="dv-gastro__addr">Dirección: {item.address}</div>}
      <a href={item.discoolverUrl ?? '#'} className="dv-gastro__cta">
        <DiscoolverIsotipo size={13} color={primaryColor} />
        VER EN DISCOOLVER →
      </a>
    </div>
  );
}

const DEFAULT_CARDS = [
  {
    name: 'Bodega Sepúlveda',
    tagline: 'Taberna de vinos naturales.',
    description: 'Un local íntimo en el Eixample donde los vinos de pequeños productores protagonizan cada mesa. La cocina acompaña con propuestas de temporada, sencillas y honestas. El sitio perfecto para descubrir el vino natural con los amigos.',
    web: 'https://bodegasepulveda.com',
    address: 'Carrer de Sepúlveda, 180, Barcelona',
  },
  {
    name: 'Restaurant Coure',
    tagline: 'Alta cocina de autor en el Born.',
    description: 'Albert Ventura firma una carta de cocina contemporánea que rinde homenaje al producto mediterráneo. Espacio reducido, experiencia máxima. Reserva con antelación: las mesas vuelan cada semana sin excepción alguna.',
    web: 'https://restaurantcoure.com',
    address: 'Passatge de la Concepció, 5, Barcelona',
  },
  {
    name: 'Bar Brutal',
    tagline: 'Vins naturals i cuina honesta.',
    description: 'Local de referencia para amantes del vino natural en Barcelona. Ambiente desenfadado, selección de botellas imposible de encontrar en otro sitio, y una cocina que no decepciona nunca. Imprescindible en El Born.',
    web: 'https://barbrutal.com',
    address: 'Carrer de la Princesa, 14, Barcelona',
  },
];

/**
 * T07GastromiaBcn — Catálogo gastronómico de ciudad.
 * Template 7/17. Variante "ciudad" de T06Restaurantes.
 * Diferencias: excl-box con fondo primaryColor sólido, sin sección Trendy.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {string} config.gastronomySection.pageNumber
 * @param {string} config.gastronomySection.sectionName
 * @param {string} config.gastronomySection.primaryColor
 * @param {string} config.gastronomySection.mainPhoto
 * @param {string} config.gastronomySection.introText
 * @param {string} config.gastronomySection.exclSubtitle
 * @param {Array}  config.gastronomySection.cards - [{ name, tagline, description, web, address, photo, discoolverUrl }]
 */
export default function T07GastromiaBcn({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const g = config.gastronomySection ?? {};

  const pageNumber   = g.pageNumber   ?? '2';
  const sectionName  = g.sectionName  ?? 'GASTRONOMÍA';
  const primaryColor = g.primaryColor ?? '#C8006B';
  const mainPhoto    = g.mainPhoto    ?? null;
  const introText    = g.introText    ?? 'Lo más selecto de la escena gastronómica barcelonesa, donde la tradición catalana se funde con la vanguardia creativa. Estos son los rincones que todo amante de la buena mesa debería conocer, elegidos por su propuesta única, ambiente y cocina de autor.';
  const exclSubtitle = g.exclSubtitle ?? `Las mejores propuestas de ${city}`;
  const cards        = g.cards?.length ? g.cards : DEFAULT_CARDS;

  return (
    <PageA4 bg="#ffffff" className="dv-gastro">

      {/* ── Header ── */}
      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:48, color:'#444', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">{sectionName}</span>
      </div>
      <hr className="dv-page-rule" />

      {/* ── Slogan ── */}
      <div className="dv-gastro__slogan">
        <span className="dv-gastro__slogan-pre">ESTAS SON LAS SELECCIONES MÁS COOL DE</span>
        <span className="dv-gastro__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-gastro__slogan-year">
          <span>PARA 2</span>
          <DiscoolverIsotipo size={18} color={primaryColor} style={{ display:'inline-flex', verticalAlign:'middle' }} />
          <span>{year}</span>
        </div>
      </div>

      {/* ── Split row ── */}
      <div className="dv-gastro__split">
        <div className="dv-gastro__split-l">
          <div className="dv-gastro__excl-box" style={{ background: primaryColor }}>
            <div className="dv-gastro__excl-head">
              <span className="dv-gastro__excl-big">E</span>
              <span className="dv-gastro__excl-small">XCLUSIVO</span>
            </div>
            <span className="dv-gastro__excl-sub">{exclSubtitle}</span>
          </div>
          <p className="dv-gastro__intro">
            <span className="dv-gastro__drop-cap">L</span>
            {introText}
          </p>
        </div>
        <div className="dv-gastro__split-r">
          {mainPhoto
            ? <img className="dv-gastro__main-photo" src={mainPhoto} alt="" />
            : <div className="dv-gastro__main-ph">
                <span>📷</span>
                <span style={{ fontSize:9, color:'#999', letterSpacing:'0.1em', textTransform:'uppercase' }}>Foto principal</span>
              </div>
          }
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div className="dv-gastro__grid">
        {cards.slice(0, 3).map((item, i) => (
          <Card key={i} item={item} primaryColor={primaryColor} />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="dv-gastro__footer">
        <span className="dv-gastro__footer-l">
          Guía discoolver {city.charAt(0) + city.slice(1).toLowerCase()} 20{year}
        </span>
        <span className="dv-gastro__footer-r">discoolver.com</span>
      </div>

    </PageA4>
  );
}
