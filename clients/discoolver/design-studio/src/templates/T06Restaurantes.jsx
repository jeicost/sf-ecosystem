import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T06Restaurantes.css';

const QR_PATTERN = [1,1,1,0,1, 1,0,1,0,0, 1,1,1,0,1, 0,0,0,1,1, 1,0,1,1,1];

function QrDeco() {
  return (
    <div className="dv-restaurantes__scan">
      <div className="dv-restaurantes__qr">
        {QR_PATTERN.map((b, i) => (
          <div key={i} className={`dv-restaurantes__qr-cell${b ? '' : ' dv-restaurantes__qr-cell--empty'}`} />
        ))}
      </div>
      <span className="dv-restaurantes__scan-lbl">SCAN</span>
    </div>
  );
}

function DiscoLink({ href = '#' }) {
  return (
    <a href={href} className="dv-restaurantes__cta">
      <DiscoolverIsotipo size={13} color="#C8006B" />
      VER EN DISCOOLVER →
    </a>
  );
}

/** Card vertical (Exclusivo — 3 cols) */
function CardV({ item }) {
  return (
    <div className="dv-restaurantes__card">
      <div className="dv-restaurantes__card-photo">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span className="dv-restaurantes__card-ph-lbl">FOTO</span>
        }
        <QrDeco />
      </div>
      <div className="dv-restaurantes__name">{item.name.toUpperCase()}</div>
      <div className="dv-restaurantes__tag-item">{item.tagline}</div>
      <p className="dv-restaurantes__desc">{item.description}</p>
      {item.web     && <div className="dv-restaurantes__web">Web: {item.web}</div>}
      {item.address && <div className="dv-restaurantes__addr">Dirección: {item.address}</div>}
      <DiscoLink href={item.discoolverUrl} />
    </div>
  );
}

/** Card horizontal (Trendy — 2 cols) */
function CardH({ item }) {
  return (
    <div className="dv-restaurantes__card-h">
      <div className="dv-restaurantes__h-thumb">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span style={{ fontSize: 18, opacity: 0.3 }}>📷</span>
        }
      </div>
      <div className="dv-restaurantes__h-body">
        <div className="dv-restaurantes__name">{item.name.toUpperCase()}</div>
        <div className="dv-restaurantes__tag-item">{item.tagline}</div>
        <p className="dv-restaurantes__desc">{item.description}</p>
        {item.web     && <div className="dv-restaurantes__web">Web: {item.web}</div>}
        {item.address && <div className="dv-restaurantes__addr">{item.address}</div>}
        <DiscoLink href={item.discoolverUrl} />
      </div>
    </div>
  );
}

/** Section heading ("Exclusivo", "Trendy", etc.) */
function SectionTag({ label, desc }) {
  const [first, ...rest] = label;
  return (
    <>
      <div className="dv-restaurantes__section-tag">
        <span className="dv-restaurantes__tag-letter">{first}</span>
        <span className="dv-restaurantes__tag-word">{rest.join('')}</span>
      </div>
      {desc && <div className="dv-restaurantes__section-desc">{desc}</div>}
    </>
  );
}

const DEFAULT_EXCLUSIVOS = [
  { name: 'Den, Tokio',     tagline: 'Cocina japonesa creativa.',         description: 'El mejor restaurante de Japón interpreta sus platos con un sentido del humor inteligente. Recurre a hábitos de Occidente que superpone a sus trabajos culinarios y desconcierta con sorpresas que esconde en la manga para provocar sonrisas.', web: 'https://www.jimbochoden.com/', address: 'Jingumae 2-3-18, Shibuya, Tokyo, Japón' },
  { name: 'Mirazur, Francia', tagline: 'La alta cocina francesa.',       description: 'Edificio de los años 30 aferrado a la montaña con vistas al Mediterráneo. Tres estrellas Michelin. Chef Mauro Colagreco encuentra su inspiración en las hortalizas de las huertas del Mirazur, bebiendo de sus orígenes italo-argentinos.', web: 'https://www.mirazur.fr/', address: '30 Avenue Aristide Briand, 06500 Menton, Francia' },
  { name: 'Central, Lima',  tagline: 'Gastronomía del Perú en estado puro.', description: 'Conocido por su interpretación contemporánea de la cocina peruana. Su fundador ha intentado redefinir la gastronomía peruana introduciendo productos indígenas poco conocidos del país en preparaciones de altísimo nivel técnico.', web: 'https://centralrestaurante.com.pe/', address: 'Av. Pedro de Osma 301, Barranco, Lima, Perú' },
];

const DEFAULT_TRENDY = [
  { name: "Ellen's Stardust Diner", tagline: 'Nueva York, Estados Unidos.', description: "Cafetería ambientada en los años 50 con camareros que cantan como si estuvieras en un musical y una carta de buenas hamburguesas y comida americana. Uno de los diners más originales de toda la gran manzana.", web: 'https://www.ellensstardustdiner.com/', address: '1650 Broadway, New York, NY 10019' },
  { name: "Rick's Cafe, Jamaica",   tagline: 'Mar y sabrosa comida a ritmo de Reggae.', description: "Café-bar con platos y cócteles caribeños y vistas al mar espectaculares, con música en directo. Ubicado en la cima de un acantilado de 35 pies de altura en el extremo oeste de Jamaica.", web: 'http://www.rickscafejamaica.com/', address: 'West End, Negril, Jamaica' },
];

/**
 * T06Restaurantes — Catálogo de restaurantes estilo Michelin.
 * Template 6/17.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.sections.restaurantes.items  - lista completa
 * @param {Array}  config.sections.restaurantes.subcategories - ['Exclusivo','Trendy',...]
 *
 * Items con subcategory='Exclusivo' → 3-col grid vertical
 * Resto → 2-col grid horizontal (Trendy)
 */
export default function T06Restaurantes({ config = {} }) {
  const { city = 'MUNDO', year = '21' } = config;
  const items = config.sections?.restaurantes?.items ?? [];

  const exclusivos = items.filter(it => it.subcategory === 'Exclusivo').length
    ? items.filter(it => it.subcategory === 'Exclusivo')
    : DEFAULT_EXCLUSIVOS;

  const trendy = items.filter(it => it.subcategory !== 'Exclusivo').length
    ? items.filter(it => it.subcategory !== 'Exclusivo')
    : DEFAULT_TRENDY;

  const bigPhoto = config.sections?.restaurantes?.coverPhoto ?? null;

  return (
    <PageA4 bg="#ffffff" className="dv-restaurantes">

      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>11</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color="#C8006B" />
        <span className="dv-page-section">RESTAURANTES</span>
      </div>
      <hr className="dv-page-rule" />

      {/* Slogan */}
      <div className="dv-restaurantes__slogan">
        <span className="dv-restaurantes__slogan-pre">ESTAS SON LAS SELECCIONES MÁS COOL DE</span>
        <span className="dv-restaurantes__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-restaurantes__slogan-year">
          PARA 2
          <DiscoolverIsotipo size={18} color="#C8006B" style={{ display:'inline-flex', verticalAlign:'middle' }} />
          {year}
        </div>
      </div>

      {/* Split row */}
      <div className="dv-restaurantes__split">
        <div className="dv-restaurantes__split-left">
          <div className="dv-restaurantes__excl-box">
            <div className="dv-restaurantes__excl-title">
              <span className="dv-restaurantes__excl-first">E</span>
              <span className="dv-restaurantes__excl-rest">XCLUSIVO</span>
            </div>
            <span className="dv-restaurantes__excl-sub">Lo más top del mundo, donde debería llevarte tu jefe a comer</span>
          </div>
          <p className="dv-restaurantes__split-intro">
            <span className="dv-restaurantes__drop-cap">L</span>os restaurantes más exclusivos del planeta, seleccionados por nuestro equipo de expertos. Propuestas que trascienden la gastronomía y se convierten en experiencias únicas e irrepetibles.
          </p>
        </div>
        <div className="dv-restaurantes__split-right">
          {bigPhoto
            ? <img className="dv-restaurantes__big-photo" src={bigPhoto} alt="" />
            : <div className="dv-restaurantes__big-ph"><span>📷</span><span style={{ fontSize:8, color:'#999', letterSpacing:'0.1em', textTransform:'uppercase' }}>Foto principal</span></div>
          }
        </div>
      </div>

      {/* Exclusivos grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
        {exclusivos.slice(0, 3).map((item, i) => <CardV key={i} item={item} />)}
      </div>

      {/* Trendy section */}
      <SectionTag
        label="TRENDY"
        desc="Estos son los sitios que más dieron de hablar en 2020 y seguro que se seguirán escuchando en 2021."
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
        {trendy.slice(0, 2).map((item, i) => <CardH key={i} item={item} />)}
      </div>

      {/* Footer */}
      <div className="dv-restaurantes__footer">
        <span className="dv-restaurantes__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-restaurantes__footer-num">11</span>
      </div>

    </PageA4>
  );
}
