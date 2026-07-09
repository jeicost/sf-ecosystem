import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T11Experiencias.css';

function ExpCard({ item, badge, primaryColor }) {
  return (
    <div className="dv-exp__card">
      <div className="dv-exp__card-img">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span className="dv-exp__card-ph">FOTO</span>
        }
        {badge && (
          <div className="dv-exp__badge" style={{ background: primaryColor }}>{badge}</div>
        )}
      </div>
      <div className="dv-exp__name">{item.name.toUpperCase()}</div>
      {item.tag         && <div className="dv-exp__tag">{item.tag}</div>}
      {item.description && <p className="dv-exp__desc">{item.description}</p>}
      {item.web         && <div className="dv-exp__web">Web: {item.web}</div>}
      {item.address     && <div className="dv-exp__addr">{item.address}</div>}
      <a href={item.discoolverUrl ?? '#'} className="dv-exp__cta">
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
      <div className="dv-exp__split">
        <div className="dv-exp__split-l">
          <div className="dv-exp__box" style={{ background: primaryColor }}>
            <div className="dv-exp__box-hd">
              <span className="dv-exp__box-big">{first}</span>
              <span className="dv-exp__box-sm">{rest.join('')}</span>
            </div>
            <span className="dv-exp__box-sub">{cat.subtitle}</span>
          </div>
          <p className="dv-exp__intro">
            <span className="dv-exp__drop-cap">{introText[0]}</span>
            {introText.slice(1)}
          </p>
        </div>
        <div className="dv-exp__split-r">
          {mainPhoto
            ? <img src={mainPhoto} alt="" />
            : <span style={{ fontSize:8, color:'#999', letterSpacing:'0.1em', textTransform:'uppercase' }}>Foto principal</span>
          }
        </div>
      </div>
      <div className="dv-exp__grid">
        {cat.items.slice(0, 3).map((item, i) => (
          <ExpCard key={i} item={item} badge={cat.badge ?? null} primaryColor={primaryColor} />
        ))}
      </div>
    </>
  );
}

function TypoCategory({ cat, primaryColor }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-exp__cat-typo">
        <span className="dv-exp__cat-first">{first}</span>
        <span className="dv-exp__cat-rest">{rest.join('')}</span>
      </div>
      <div className="dv-exp__cat-sub">{cat.subtitle}</div>
      <div className="dv-exp__grid" style={{ marginBottom: 0 }}>
        {cat.items.slice(0, 3).map((item, i) => (
          <ExpCard key={i} item={item} badge={cat.badge ?? null} primaryColor={primaryColor} />
        ))}
      </div>
    </>
  );
}

const DEFAULT_CATEGORIES = [
  {
    styleType: 'boxed',
    badge: 'WOW',
    title: 'EXPERIENCIAS WOW',
    subtitle: 'Sólo los ves en Callejeros Viajeros pero tú también vas a poder ir',
    items: [
      { name: 'Escalar Puente de Sydney',   tag: 'Australia. ¿Te atreves?',                           description: 'Escala el Sydney Harbour Bridge y sube a su cumbre, a 134 metros de altura. Una de las mejores perspectivas de la ciudad australiana que te dejará sin palabras. Experiencia guiada de 3,5 horas con equipo completo incluido.', web: 'https://www.bridgeclimb.com/', address: '3 Cumberland St, The Rocks NSW 2000, Australia' },
      { name: 'Ithaa Undersea Restaurant',  tag: 'Maldivas. El restaurante que soñabas de pequeño.',  description: 'Restaurante submarino recubierto de cristal donde los visitantes cenan a 5 metros bajo el nivel del mar. Vistas panorámicas de 180 grados de la vida marina: tiburones y jardín de corales mientras tomas tu cóctel.', web: 'https://www.conradmaldives.com/', address: 'Conrad Rangali Island, Maldivas' },
      { name: 'Dinner in the Sky',          tag: 'Bélgica. Un auténtico desafío.',                    description: 'Restaurante donde descubres la alta cocina bruselense de la forma más extraordinaria posible: en el cielo de la capital, en una plataforma giratoria suspendida por una grúa, a más de 50 metros de altura sobre Bruselas.', web: 'https://dinnerinthesky.be/', address: 'Avenue du Port 1, 1000 Bruxelles, Bélgica' },
    ],
  },
  {
    styleType: 'typo',
    badge: null,
    title: 'ACTIVIDADES COOL',
    subtitle: 'Planes con historia, con naturaleza y con mucho carácter.',
    items: [
      { name: 'Tobotronc, Andorra',         tag: 'El tobogán de montaña más largo de Europa.',        description: 'Tobogán alpino de 5,3 km de longitud en plena naturaleza andorrana. Una experiencia de adrenalina pura entre el bosque, con vistas espectaculares a los valles de Andorra. Apto para toda la familia con diferentes modalidades.', web: 'https://www.grandvalira.com/', address: 'Grandvalira, Andorra' },
      { name: 'Labassin Waterfall',         tag: 'Filipinas. Para los más calurosos.',               description: 'Restaurante a los pies de una cascada en mitad de una plantación de cocos. En plena naturaleza y literalmente dentro de una cascada. Degusta los manjares de la cocina local sintiendo cómo el agua moja tus pies.', web: 'https://villaescudero.com/', address: 'Tiaong, Quezon, Filipinas' },
      { name: 'Sirocco & Sky Bar',          tag: 'Bangkok. Conviértete en el amo de la ciudad.',     description: 'Restaurante con las mejores vistas de todo Bangkok, situado en la planta 63 de la State Tower. La cocina del restaurante Sirocco es sin duda una de las más creativas de toda Tailandia. Imprescindible al atardecer.', web: 'https://lebua.com/restaurants/sky-bar/', address: '1055 Si Lom, Silom, Bang Rak, Bangkok 10500' },
    ],
  },
];

const DEFAULT_INTRO = 'venturas que van más allá de lo ordinario. Experiencias que solo se dan una vez en la vida y que te harán ver el mundo con otros ojos. Porque viajar no es solo llegar a un sitio, sino lo que haces cuando estás allí.';

/**
 * T11Experiencias — Catálogo de experiencias y actividades.
 * Template 11/17. Patrón boxed+typo con badge opcional por categoría.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.sections.experienciasActividades
 *   pageNumber, primaryColor, mainPhoto, introText,
 *   categories: [{ styleType, badge, title, subtitle, items }]
 */
export default function T11Experiencias({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const s = config.sections?.experienciasActividades ?? {};

  const pageNumber   = s.pageNumber   ?? '28';
  const primaryColor = s.primaryColor ?? '#C8006B';
  const mainPhoto    = s.mainPhoto    ?? null;
  const introText    = s.introText    ?? DEFAULT_INTRO;
  const categories   = s.categories?.length ? s.categories : DEFAULT_CATEGORIES;
  const [firstCat, ...restCats] = categories;

  return (
    <PageA4 bg="#ffffff" className="dv-exp">

      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">EXPERIENCIAS Y ACTIVIDADES</span>
      </div>
      <hr className="dv-page-rule" />

      <div className="dv-exp__slogan">
        <span className="dv-exp__slogan-pre">LAS EXPERIENCIAS MÁS ÚNICAS DE</span>
        <span className="dv-exp__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-exp__slogan-year">
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

      <div className="dv-exp__footer">
        <span className="dv-exp__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-exp__footer-num">{pageNumber}</span>
      </div>

    </PageA4>
  );
}
