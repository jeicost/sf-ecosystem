import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T08Fiesta.css';

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function DiscoLink({ href = '#', color = '#C8006B' }) {
  return (
    <a href={href} className="dv-fiesta__cta">
      <DiscoolverIsotipo size={13} color={color} />
      VER EN DISCOOLVER →
    </a>
  );
}

function Card({ item, overlayOpacity = 0.15, primaryColor = '#C8006B' }) {
  return (
    <div className="dv-fiesta__card">
      <div className="dv-fiesta__card-img">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span className="dv-fiesta__card-ph">FOTO</span>
        }
        <div className="dv-fiesta__overlay" style={{ background: `rgba(0,0,0,${overlayOpacity})` }} />
      </div>
      <div className="dv-fiesta__name">{item.name.toUpperCase()}</div>
      <div className="dv-fiesta__tag">{item.tagline}</div>
      <p className="dv-fiesta__desc">{item.description}</p>
      {item.web     && <div className="dv-fiesta__web">Web: {item.web}</div>}
      {item.address && <div className="dv-fiesta__addr">{item.address}</div>}
      <DiscoLink href={item.discoolverUrl} color={primaryColor} />
    </div>
  );
}

/** BOXED category — magenta bg header + hero split row */
function CategoryBoxed({ cat, mainPhoto, introText, primaryColor }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-fiesta__hero-split">
        <div className="dv-fiesta__hero-left">
          <div className="dv-fiesta__cat-boxed" style={{ background: primaryColor }}>
            <div className="dv-fiesta__cb-title">
              <span className="dv-fiesta__cb-big">{first}</span>
              <span className="dv-fiesta__cb-rest">{rest.join('')}</span>
            </div>
            <span className="dv-fiesta__cb-sub">{cat.subtitle}</span>
          </div>
          <p className="dv-fiesta__intro">
            <span className="dv-fiesta__drop-cap">{introText[0]}</span>
            {introText.slice(1)}
          </p>
        </div>
        <div className="dv-fiesta__hero-right">
          {mainPhoto
            ? <img className="dv-fiesta__hero-photo" src={mainPhoto} alt="" />
            : <div className="dv-fiesta__hero-photo-ph"><span>📷</span><span>Foto principal</span></div>
          }
        </div>
      </div>
      <div className="dv-fiesta__grid">
        {cat.cards.slice(0, 3).map((item, i) => (
          <Card key={i} item={item} overlayOpacity={0.15} primaryColor={primaryColor} />
        ))}
      </div>
    </>
  );
}

/** TYPO category — Playfair drop-cap header, no split row */
function CategoryTypo({ cat, primaryColor }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-fiesta__cat-typo">
        <span className="dv-fiesta__typo-first">{first}</span>
        <span className="dv-fiesta__typo-rest">{rest.join('')}</span>
      </div>
      <div className="dv-fiesta__cat-sub">{cat.subtitle}</div>
      <div className="dv-fiesta__grid" style={{ marginBottom: 0 }}>
        {cat.cards.slice(0, 3).map((item, i) => (
          <Card key={i} item={item} overlayOpacity={0.22} primaryColor={primaryColor} />
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Default data
───────────────────────────────────────────── */
const DEFAULT_CATEGORIES = [
  {
    styleType: 'boxed',
    title: 'BARES DE COPAS',
    subtitle: '¿Ya no son suficientes las cañitas? Para los paladares más exquisitos',
    cards: [
      { name: 'Blackwell Rum Bar',    tagline: 'Jamaica. Una cueva volcánica en un paraíso.',    description: 'Bar ubicado en las Cuevas del Hotel Caves donde puedes disfrutar de un cóctel en un acantilado con vistas al mar. Entras tomando una escalera de coral hasta el borde del agua y llegas a la cueva secreta más exclusiva de Jamaica.', web: 'https://www.thecaveshotel.com/', address: 'Lighthouse Road, West End, Negril, Jamaica' },
      { name: 'Gold On 27, Dubai',    tagline: 'Oro en Dubai, no hay mayor lujo.',               description: 'Local nocturno decorado con pan de oro y música en directo. El lugar idóneo para las personalidades más exigentes con vistas increíbles a toda la ciudad. Consumición mínima de AED 275 por persona.', web: 'http://www.goldon27.com/', address: '27th Floor, Burj Al Arab, Dubai, EAU' },
      { name: 'The Nightjar, Londres',tagline: '100% ambiente inglés.',                          description: 'Bar de copas y coctelería donde puedes disfrutar de música jazz y swing en directo. Su reputación de dar nueva vida a los cócteles olvidados y brindar perspectiva fresca a recetas clásicas es mundialmente conocida.', web: 'https://barnightjar.com/', address: '129 City Rd, Shoreditch, London EC1V 1JB' },
    ],
  },
  {
    styleType: 'typo',
    title: 'SPEAKEASY',
    subtitle: 'Bares secretos que hay que saber encontrar. El acceso es parte de la experiencia.',
    cards: [
      { name: 'Mayor of Scaredy Cat', tagline: 'Londres. Demasiadas puertas.',                  description: "Speakeasy al que se accede desde la cafetería Breakfast Club. En su interior hay una nevera que es una puerta secreta. Para acceder hay que decir la contraseña 'ver al alcalde' a uno de los camareros del local.", web: 'http://www.themayorofscaredycattown.com/', address: '12-16 Artillery Ln, Spitalfields, London E1 7LS' },
      { name: 'The Barber Shop, Sydney', tagline: 'Australia. En Australia todo impresiona.',   description: 'Cocktail bar camuflado en la parte superior de una barbería. Destaca por tener una de las mejores barras de ginebras con gran variedad de marcas de todos los rincones del mundo. Sorpresa garantizada al encontrarlo.', web: 'https://thisisthebarbershop.com/', address: '89 York St, Sydney NSW 2000, Australia' },
      { name: 'Jerry Thomas, Roma',    tagline: 'Italia. En Roma todo es arte.',                description: 'Bar ubicado en un callejón de Roma. Para entrar hay que pasar por la web, responder una pregunta y esperar haber acertado. Amplia variedad de cócteles históricos. Fue el primer bartender que saltó a la escena gastronómica mundial.', web: 'https://www.thejerrythomasproject.it/', address: 'Vicolo Cellini, 30, 00186 Roma, Italia' },
    ],
  },
];

const DEFAULT_INTRO = 'La pandemia golpeó duro a este sector, lo sabemos, pero no por eso han dejado de pasar cosas interesantes. Estos son los bares de cócteles más destacados que no querrás perderte en tu próxima visita.';

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */

/**
 * T08Fiesta — Catálogo de ocio nocturno.
 * Template 8/17. Patrón "boxed + typo" reutilizable en Ocio, Arte, Shopping, etc.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.sections.fiesta
 *   pageNumber, primaryColor, mainPhoto, introText,
 *   categories: [{ styleType: 'boxed'|'typo', title, subtitle, cards }]
 */
export default function T08Fiesta({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const f = config.sections?.fiesta ?? {};

  const pageNumber   = f.pageNumber   ?? '18';
  const primaryColor = f.primaryColor ?? '#C8006B';
  const mainPhoto    = f.mainPhoto    ?? null;
  const introText    = f.introText    ?? DEFAULT_INTRO;
  const categories   = f.categories?.length ? f.categories : DEFAULT_CATEGORIES;

  const [firstCat, ...restCats] = categories;

  return (
    <PageA4 bg="#ffffff" className="dv-fiesta">

      {/* ── Header ── */}
      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">FIESTA</span>
      </div>
      <hr className="dv-page-rule" />

      {/* ── Slogan ── */}
      <div className="dv-fiesta__slogan">
        <span className="dv-fiesta__slogan-pre">ESTAS SON LAS SELECCIONES MÁS COOL DE</span>
        <span className="dv-fiesta__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-fiesta__slogan-year">
          PARA 2
          <DiscoolverIsotipo size={18} color={primaryColor} style={{ display:'inline-flex', verticalAlign:'middle' }} />
          {year}
        </div>
      </div>

      {/* ── First category (always boxed with hero row) ── */}
      {firstCat && (
        firstCat.styleType === 'boxed'
          ? <CategoryBoxed cat={firstCat} mainPhoto={mainPhoto} introText={introText} primaryColor={primaryColor} />
          : <CategoryTypo  cat={firstCat} primaryColor={primaryColor} />
      )}

      {/* ── Remaining categories ── */}
      {restCats.map((cat, i) => (
        cat.styleType === 'boxed'
          ? <CategoryBoxed key={i} cat={cat} mainPhoto={null} introText="" primaryColor={primaryColor} />
          : <CategoryTypo  key={i} cat={cat} primaryColor={primaryColor} />
      ))}

      {/* ── Footer ── */}
      <div className="dv-fiesta__footer">
        <span className="dv-fiesta__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-fiesta__footer-num">{pageNumber}</span>
      </div>

    </PageA4>
  );
}
