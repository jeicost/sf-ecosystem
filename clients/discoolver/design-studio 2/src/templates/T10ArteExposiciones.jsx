import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T10ArteExposiciones.css';

function ArtCard({ item, overlayOpacity = 0 }) {
  return (
    <div className="dv-arte__card">
      <div className="dv-arte__card-img">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span className="dv-arte__card-ph">FOTO</span>
        }
        {overlayOpacity > 0 && (
          <div className="dv-arte__overlay" style={{ background: `rgba(0,0,0,${overlayOpacity})` }} />
        )}
      </div>
      <div className="dv-arte__name">{item.name.toUpperCase()}</div>
      {item.tag         && <div className="dv-arte__tag">{item.tag}</div>}
      {item.description && <p className="dv-arte__desc">{item.description}</p>}
      {item.where       && <div className="dv-arte__where">Dónde: {item.where}</div>}
      {item.when        && <div className="dv-arte__when">Cuándo: {item.when}</div>}
    </div>
  );
}

function BoxedCategory({ cat, mainPhoto, introText, primaryColor }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-arte__split">
        <div className="dv-arte__split-l">
          <div className="dv-arte__box" style={{ background: primaryColor }}>
            <div className="dv-arte__box-hd">
              <span className="dv-arte__box-big">{first}</span>
              <span className="dv-arte__box-sm">{rest.join('')}</span>
            </div>
            <span className="dv-arte__box-sub">{cat.subtitle}</span>
          </div>
          <p className="dv-arte__intro">
            <span className="dv-arte__drop-cap">{introText[0]}</span>
            {introText.slice(1)}
          </p>
        </div>
        <div className="dv-arte__split-r">
          {mainPhoto
            ? <img src={mainPhoto} alt="" />
            : <span style={{ fontSize:8, color:'#999', letterSpacing:'0.1em', textTransform:'uppercase' }}>Foto principal</span>
          }
        </div>
      </div>
      <div className="dv-arte__grid">
        {cat.items.slice(0, 3).map((item, i) => <ArtCard key={i} item={item} overlayOpacity={0} />)}
      </div>
    </>
  );
}

function TypoCategory({ cat }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-arte__cat-typo">
        <span className="dv-arte__cat-first">{first}</span>
        <span className="dv-arte__cat-rest">{rest.join('')}</span>
      </div>
      <div className="dv-arte__cat-sub">{cat.subtitle}</div>
      <div className="dv-arte__grid" style={{ marginBottom: 0 }}>
        {cat.items.slice(0, 3).map((item, i) => <ArtCard key={i} item={item} overlayOpacity={0.2} />)}
      </div>
    </>
  );
}

/* ── Defaults ── */
const DEFAULT_CATEGORIES = [
  {
    styleType: 'boxed',
    title: 'EXPOSICIONES',
    subtitle: 'Exposiciones que te alegrarán el día y ampliarán tu visión del mundo',
    items: [
      { name: 'Andy Warhol',      tag: 'El padre del pop art.',                           description: 'El Tate Modern muestra piezas icónicas de Andy Warhol en un espacio clave del arte contemporáneo a nivel mundial. Una oportunidad única de ver de cerca las obras más reconocibles del arte del siglo XX.', where: 'Tate Modern, Londres', when: 'Del 12 de marzo al 6 de septiembre' },
      { name: 'Rafael, Quirinale', tag: 'La mayor exposición de Rafael de la historia.',  description: 'Más de 200 obras que honran al gran maestro del Renacimiento en Italia. Se celebra el 500 centenario de la muerte del artista. El itinerario recorre su vida a la inversa, desde su prematura muerte hasta sus inicios.', where: 'Scuderie del Quirinale, Roma', when: 'Del 5 de marzo al 30 de agosto' },
      { name: 'Gego, Guggenheim', tag: 'Toda una vida de arte.',                          description: '200 piezas divididas en 5 pisos y 5 momentos de la evolución de Gertrud Goldschmidt, desde su etapa de abstracción, pasando por las formas orgánicas, hasta llegar a su investigación en torno al espacio y la línea.', where: 'Museo Guggenheim, Bilbao', when: 'Del 9 de octubre al 21 de marzo' },
    ],
  },
  {
    styleType: 'typo',
    title: 'TEATRO Y ESPECTÁCULOS',
    subtitle: 'Que suba el telón y a disfrutar de estas propuestas para todos los públicos.',
    items: [
      { name: 'Aladdin, Broadway',      tag: 'Nueva York. El teatro de tus sueños.',        description: 'Musical en Broadway donde entras en un mundo de fantasía con una de las creaciones de más éxito de Disney llevada a la vida. Espectáculo para todas las edades que combina efectos visuales espectaculares con música memorable.', where: 'New Amsterdam Theatre, Nueva York', when: 'Todo el año' },
      { name: 'Lago de los Cisnes',     tag: 'San Petersburgo. El clásico eterno.',          description: 'Ballet ruso clásico compuesto por Tchaikovsky. Símbolo del arte ruso, la actuación se basa en cuentos de hadas acerca de la princesa Odette, convertida en cisne por una maldición y rescatada por el amor del príncipe.', where: 'Teatro Mariinsky, San Petersburgo', when: 'Temporada: Octubre — Junio' },
      { name: 'Manifiesto 13',          tag: 'Marsella. Arte contemporáneo.',               description: 'Uno de los eventos artísticos más importantes del circuito del arte contemporáneo. Plataforma de reflexión para observar los debates internacionales sobre cómo las comunidades pueden unirse y crear nuevos lazos de solidaridad.', where: 'Marsella, Francia', when: 'Del 7 de junio al 11 de noviembre' },
    ],
  },
];

const DEFAULT_INTRO = 'l arte en su expresión más amplia: desde las grandes retrospectivas en museos mundiales hasta las galerías más íntimas y propuestas emergentes. La cultura como experiencia que trasciende y conecta personas.';

/**
 * T10ArteExposiciones — Catálogo de arte y espectáculos.
 * Template 10/17. Cards con Dónde/Cuándo. Reutiliza patrón boxed+typo de T08.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.sections.arteExposiciones
 *   pageNumber, primaryColor, mainPhoto, introText,
 *   categories: [{ styleType, title, subtitle, items: [{name,tag,description,where,when,photo}] }]
 */
export default function T10ArteExposiciones({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const s = config.sections?.arteExposiciones ?? {};

  const pageNumber   = s.pageNumber   ?? '25';
  const primaryColor = s.primaryColor ?? '#C8006B';
  const mainPhoto    = s.mainPhoto    ?? null;
  const introText    = s.introText    ?? DEFAULT_INTRO;
  const categories   = s.categories?.length ? s.categories : DEFAULT_CATEGORIES;

  const [firstCat, ...restCats] = categories;

  return (
    <PageA4 bg="#ffffff" className="dv-arte">

      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">ARTE Y EXPOSICIONES</span>
      </div>
      <hr className="dv-page-rule" />

      <div className="dv-arte__slogan">
        <span className="dv-arte__slogan-pre">LAS MEJORES EXPOSICIONES DE</span>
        <span className="dv-arte__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-arte__slogan-year">
          GUÍA 2
          <DiscoolverIsotipo size={18} color={primaryColor} style={{ display:'inline-flex', verticalAlign:'middle' }} />
          {year}
        </div>
      </div>

      {firstCat && (
        firstCat.styleType === 'boxed'
          ? <BoxedCategory cat={firstCat} mainPhoto={mainPhoto} introText={introText} primaryColor={primaryColor} />
          : <TypoCategory  cat={firstCat} />
      )}

      {restCats.map((cat, i) => (
        cat.styleType === 'boxed'
          ? <BoxedCategory key={i} cat={cat} mainPhoto={null} introText="" primaryColor={primaryColor} />
          : <TypoCategory  key={i} cat={cat} />
      ))}

      <div className="dv-arte__footer">
        <span className="dv-arte__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-arte__footer-num">{pageNumber}</span>
      </div>

    </PageA4>
  );
}
