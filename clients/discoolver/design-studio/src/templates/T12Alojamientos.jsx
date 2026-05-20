import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T12Alojamientos.css';

function AlojCard({ item, primaryColor }) {
  return (
    <div className="dv-aloj__card">
      <div className="dv-aloj__card-img">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span className="dv-aloj__card-ph">FOTO</span>
        }
        {item.badge && (
          <>
            <div className="dv-aloj__overlay" />
            <div className="dv-aloj__price-tag">{item.badge}</div>
          </>
        )}
      </div>
      <div className="dv-aloj__name">{item.name.toUpperCase()}</div>
      {item.tag         && <div className="dv-aloj__tag">{item.tag}</div>}
      {item.description && <p className="dv-aloj__desc">{item.description}</p>}
      {item.web         && <div className="dv-aloj__web">Web: {item.web}</div>}
      {item.address     && <div className="dv-aloj__addr">{item.address}</div>}
      <a href={item.discoolverUrl ?? '#'} className="dv-aloj__cta">
        <DiscoolverIsotipo size={13} color={primaryColor} />
        VER EN DISCOOLVER →
      </a>
    </div>
  );
}

function BoxedCategory({ cat, mainPhoto, introText, primaryColor }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-aloj__split">
        <div className="dv-aloj__split-l">
          <div className="dv-aloj__box" style={{ background: primaryColor }}>
            <div className="dv-aloj__box-hd">
              <span className="dv-aloj__box-big">{first}</span>
              <span className="dv-aloj__box-sm">{rest.join('')}</span>
            </div>
            <span className="dv-aloj__box-sub">{cat.subtitle}</span>
          </div>
          <p className="dv-aloj__intro">
            <span className="dv-aloj__drop-cap">{introText[0]}</span>
            {introText.slice(1)}
          </p>
        </div>
        <div className="dv-aloj__split-r">
          {mainPhoto
            ? <img src={mainPhoto} alt="" />
            : <span style={{ fontSize:8, color:'#999', letterSpacing:'0.1em', textTransform:'uppercase' }}>Foto principal</span>
          }
        </div>
      </div>
      <div className="dv-aloj__grid">
        {cat.items.slice(0, 3).map((item, i) => <AlojCard key={i} item={item} primaryColor={primaryColor} />)}
      </div>
    </>
  );
}

function TypoCategory({ cat, primaryColor }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-aloj__cat-typo">
        <span className="dv-aloj__cat-first">{first}</span>
        <span className="dv-aloj__cat-rest">{rest.join('')}</span>
      </div>
      <div className="dv-aloj__cat-sub">{cat.subtitle}</div>
      <div className="dv-aloj__grid" style={{ marginBottom: 0 }}>
        {cat.items.slice(0, 3).map((item, i) => <AlojCard key={i} item={item} primaryColor={primaryColor} />)}
      </div>
    </>
  );
}

const DEFAULT_CATEGORIES = [
  {
    styleType: 'boxed',
    title: 'ALOJAMIENTOS TOP',
    subtitle: 'Los espacios más especiales del mundo donde el hospedaje es la experiencia',
    items: [
      { badge: 'LUXURY',   name: 'Hotel Arts Barcelona', tag: 'El ícono de lujo frente al mar.',       description: 'Torre emblemática de 44 pisos en la Barceloneta con vistas directas al Mediterráneo. Spa de lujo, restaurante estrella Michelin y acceso privado a la playa. El referente del lujo urbano en Barcelona desde su apertura en 1994.', web: 'https://www.hotelartsbarcelona.com/', address: 'Carrer de la Marina, 19-21, Barcelona' },
      { badge: 'BOUTIQUE', name: 'Casa Camper Barcelona', tag: 'Design hotel con espíritu libre.',     description: 'Hotel boutique de la marca de calzado Camper en el Raval. Habitaciones con zona de noche y zona de día separadas, snack bar 24h gratuito y una terraza espectacular. Diseño inteligente en pleno barrio cultural de Barcelona.', web: 'https://www.casacamper.com/barcelona', address: "Carrer d'Elisabets, 11, Barcelona" },
      { badge: 'APART',    name: 'Yurbban Trafalgar',     tag: 'Urban chic en el Born.',               description: 'Hotel con rooftop pool y vistas panorámicas a los tejados de Barcelona. Ubicado en el límite entre el Eixample y el Born, el punto perfecto para explorar la ciudad a pie. Ambiente joven y cosmopolita con servicio impecable.', web: 'https://www.yurbban.com/', address: 'Carrer de Trafalgar, 30, Barcelona' },
    ],
  },
  {
    styleType: 'typo',
    title: 'ESPACIOS ÚNICOS',
    subtitle: 'Más allá del hotel: espacios que son experiencias en sí mismos.',
    items: [
      { badge: null, name: 'The Caves, Jamaica',     tag: 'Un escondite del océano en el paraíso.',          description: 'Boutique hotel sobre un acantilado en Negril. Cada habitación es diferente, escondida entre la roca viva. Acceso al mar por escaleras de coral, jacuzzis naturales y el legendario Blackwell Rum Bar en la cueva secreta.', web: 'https://www.thecaveshotel.com/', address: 'Lighthouse Road, West End, Negril, Jamaica' },
      { badge: null, name: 'Burj Al Arab, Dubai',    tag: 'El hotel más famoso del mundo.',                  description: 'El único hotel del mundo considerado de siete estrellas. Su silueta de vela domina el skyline de Dubai. Suites de más de 170m², helipuerto en la planta 28, restaurantes submarinos y el legendario Sky Bar Gold on 27.', web: 'https://www.jumeirah.com/burj-al-arab', address: 'Jumeirah Beach Rd, Dubai, Emiratos Árabes Unidos' },
      { badge: null, name: 'Mirazur Villa, Menton',  tag: 'Francia. Vivir el Mediterráneo desde las alturas.', description: 'Villa privada anexa al restaurante tres estrellas Michelin con vistas al Mediterráneo. Experiencia gastronómica completa con acceso a las huertas del chef Mauro Colagreco, desayuno incluido y estancia en un jardín botánico único.', web: 'https://www.mirazur.fr/', address: '30 Avenue Aristide Briand, 06500 Menton, Francia' },
    ],
  },
];

const DEFAULT_INTRO = 'o es solo donde duermes, es parte de tu viaje. Estos alojamientos han sido seleccionados porque en sí mismos son una experiencia única: por su diseño, su historia, su ubicación o su propuesta cultural. El lugar importa.';

/**
 * T12Alojamientos — Catálogo de alojamientos y espacios.
 * Template 12/17. Price-tag badge por ítem (top-right, negro semitrans).
 * Diferencia con T11: badge individual por ficha, no por categoría.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.sections.alojamientos
 *   pageNumber, primaryColor, mainPhoto, introText,
 *   categories: [{ styleType, title, subtitle, items: [{badge?, name, tag, ...}] }]
 */
export default function T12Alojamientos({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const s = config.sections?.alojamientos ?? {};

  const pageNumber   = s.pageNumber   ?? '30';
  const primaryColor = s.primaryColor ?? '#C8006B';
  const mainPhoto    = s.mainPhoto    ?? null;
  const introText    = s.introText    ?? DEFAULT_INTRO;
  const categories   = s.categories?.length ? s.categories : DEFAULT_CATEGORIES;
  const [firstCat, ...restCats] = categories;

  return (
    <PageA4 bg="#ffffff" className="dv-aloj">

      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">ALOJAMIENTOS Y ESPACIOS</span>
      </div>
      <hr className="dv-page-rule" />

      <div className="dv-aloj__slogan">
        <span className="dv-aloj__slogan-pre">DÓNDE DORMIR EN</span>
        <span className="dv-aloj__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-aloj__slogan-year">
          GUÍA 2
          <DiscoolverIsotipo size={18} color={primaryColor} style={{ display:'inline-flex', verticalAlign:'middle' }} />
          {year}
        </div>
      </div>

      {firstCat && (
        firstCat.styleType === 'boxed'
          ? <BoxedCategory cat={firstCat} mainPhoto={mainPhoto} introText={introText} primaryColor={primaryColor} />
          : <TypoCategory  cat={firstCat} primaryColor={primaryColor} />
      )}

      {restCats.map((cat, i) => (
        cat.styleType === 'boxed'
          ? <BoxedCategory key={i} cat={cat} mainPhoto={null} introText="" primaryColor={primaryColor} />
          : <TypoCategory  key={i} cat={cat} primaryColor={primaryColor} />
      ))}

      <div className="dv-aloj__footer">
        <span className="dv-aloj__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-aloj__footer-num">{pageNumber}</span>
      </div>

    </PageA4>
  );
}
