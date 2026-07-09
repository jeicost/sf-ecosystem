import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T13Shopping.css';

function ShopCard({ item, primaryColor }) {
  return (
    <div className="dv-shop__card">
      <div className="dv-shop__card-img">
        {item.photo
          ? <img src={item.photo} alt={item.name} />
          : <span className="dv-shop__card-ph">FOTO</span>
        }
        {item.badge && <div className="dv-shop__badge">{item.badge}</div>}
      </div>
      <div className="dv-shop__name">{item.name.toUpperCase()}</div>
      {item.tag         && <div className="dv-shop__tag">{item.tag}</div>}
      {item.description && <p className="dv-shop__desc">{item.description}</p>}
      {item.web         && <div className="dv-shop__web">Web: {item.web}</div>}
      {item.address     && <div className="dv-shop__addr">{item.address}</div>}
      <a href={item.discoolverUrl ?? '#'} className="dv-shop__cta">
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
      <div className="dv-shop__split">
        <div className="dv-shop__split-l">
          <div className="dv-shop__box" style={{ background: primaryColor }}>
            <div className="dv-shop__box-hd">
              <span className="dv-shop__box-big">{first}</span>
              <span className="dv-shop__box-sm">{rest.join('')}</span>
            </div>
            <span className="dv-shop__box-sub">{cat.subtitle}</span>
          </div>
          <p className="dv-shop__intro">
            <span className="dv-shop__drop-cap">{introText[0]}</span>
            {introText.slice(1)}
          </p>
        </div>
        <div className="dv-shop__split-r">
          {mainPhoto
            ? <img src={mainPhoto} alt="" />
            : <span style={{ fontSize:8, color:'#999', letterSpacing:'0.1em', textTransform:'uppercase' }}>Foto principal</span>
          }
        </div>
      </div>
      <div className="dv-shop__grid">
        {cat.items.slice(0, 3).map((item, i) => <ShopCard key={i} item={item} primaryColor={primaryColor} />)}
      </div>
    </>
  );
}

function TypoCategory({ cat, primaryColor }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-shop__cat-typo">
        <span className="dv-shop__cat-first">{first}</span>
        <span className="dv-shop__cat-rest">{rest.join('')}</span>
      </div>
      <div className="dv-shop__cat-sub">{cat.subtitle}</div>
      <div className="dv-shop__grid" style={{ marginBottom: 0 }}>
        {cat.items.slice(0, 3).map((item, i) => <ShopCard key={i} item={item} primaryColor={primaryColor} />)}
      </div>
    </>
  );
}

const DEFAULT_CATEGORIES = [
  {
    styleType: 'boxed',
    title: 'COOL PLACES & PRODUCTS',
    subtitle: 'Tiendas, productos y nuevas propuestas que merece la pena conocer',
    items: [
      { badge: 'LOCAL',   name: 'Basso & Brooke BCN',    tag: 'Moda local con identidad propia.',        description: 'Concepto store en el Born que reúne las mejores marcas de diseño local barcelonés. Ropa, accesorios, libros de diseño y objetos de decoración seleccionados a mano. Un espacio que entiende el comercio como experiencia cultural.', web: 'https://bassobrooke.com', address: 'Carrer del Rec, 28, Barcelona' },
      { badge: 'ICÓNICO', name: 'La Central del Raval',  tag: 'La librería más bella de Barcelona.',     description: 'Librería instalada en la capilla barroca del antiguo Hospital de la Santa Creu. Selección editorial exquisita, con especial énfasis en arte, arquitectura, diseño y pensamiento contemporáneo. Un templo del conocimiento en pleno Raval.', web: 'https://www.lacentral.com/', address: "Carrer d'Elisabets, 6, Barcelona" },
      { badge: 'COOL',    name: 'Colmado Quílez',        tag: 'El delicatessen más antiguo de Barcelona.', description: 'Fundado en 1908, este colmado de lujo en la Rambla de Catalunya es un viaje en el tiempo. Más de 3.000 referencias entre licores, conservas, quesos y embutidos de todo el mundo. La tienda gourmet de referencia de la ciudad.', web: 'https://colmadoquilez.com/', address: 'Rambla de Catalunya, 63, Barcelona' },
    ],
  },
  {
    styleType: 'typo',
    title: 'PRODUCTOS DESTACADOS',
    subtitle: 'Productos con historia, diseño y propuesta que los hace únicos y merecedores de estar aquí.',
    items: [
      { badge: null, name: 'Camper Imagination', tag: 'El zapato con alma mediterránea.',        description: 'La marca mallorquina que revolucionó el calzado desde 1975. Su propuesta combina tradición artesanal con diseño contemporáneo. Cada temporada colaboran con diseñadores de talla mundial manteniendo su esencia mediterránea y sostenible.', web: 'https://www.camper.com/', address: 'Passeig de Gràcia, 2, Barcelona' },
      { badge: null, name: 'Festina Timeless',   tag: 'Relojería española de autor.',            description: 'Marca de relojes con sede en Barcelona y presencia global. Patrocinadora del Tour de France durante décadas, sus relojes combinan precisión suiza con diseño mediterráneo. La referencia del reloj deportivo-elegante a precio razonable.', web: 'https://www.festina.com/', address: 'Av. Diagonal, 514, Barcelona' },
      { badge: null, name: 'Rituals Barcelona',  tag: 'El ritual del cuidado personal elevado.', description: 'La marca holandesa que convirtió la rutina diaria en una experiencia de lujo asequible. Sus productos de cosmética inspirados en filosofías orientales han conquistado el mundo. Su tienda del Passeig de Gràcia es la más visitada de España.', web: 'https://www.rituals.com/', address: 'Passeig de Gràcia, 39, Barcelona' },
    ],
  },
];

const DEFAULT_INTRO = 'l shopping más allá de las grandes superficies. Tiendas con carácter, propuestas únicas y productos que no encontrarás en ningún otro sitio. Seleccionados por su autenticidad, su propuesta y la pasión de quienes hay detrás.';

/**
 * T13Shopping — Catálogo de shopping y cool products.
 * Template 13/17. Badge navy top-left (LOCAL/ICÓNICO/COOL) por ítem.
 */
export default function T13Shopping({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const s = config.sections?.shopping ?? {};

  const pageNumber   = s.pageNumber   ?? '38';
  const primaryColor = s.primaryColor ?? '#C8006B';
  const mainPhoto    = s.mainPhoto    ?? null;
  const introText    = s.introText    ?? DEFAULT_INTRO;
  const categories   = s.categories?.length ? s.categories : DEFAULT_CATEGORIES;
  const [firstCat, ...restCats] = categories;

  return (
    <PageA4 bg="#ffffff" className="dv-shop">
      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">SHOPPING &amp; COOL PRODUCTS</span>
      </div>
      <hr className="dv-page-rule" />

      <div className="dv-shop__slogan">
        <span className="dv-shop__slogan-pre">LO MÁS COOL PARA COMPRAR EN</span>
        <span className="dv-shop__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-shop__slogan-year">
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

      <div className="dv-shop__footer">
        <span className="dv-shop__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-shop__footer-num">{pageNumber}</span>
      </div>
    </PageA4>
  );
}
