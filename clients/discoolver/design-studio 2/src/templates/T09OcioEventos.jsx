import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T09OcioEventos.css';

function EventCard({ event }) {
  return (
    <div className="dv-ocio__card">
      <div className="dv-ocio__card-img">
        {event.photo
          ? <img src={event.photo} alt={event.name} />
          : <span className="dv-ocio__card-ph">FOTO</span>
        }
      </div>
      <div className="dv-ocio__name">{event.name.toUpperCase()}</div>
      {event.when        && <div className="dv-ocio__when">{event.when}</div>}
      {event.tag         && <div className="dv-ocio__tag">{event.tag}</div>}
      {event.description && <p className="dv-ocio__desc">{event.description}</p>}
    </div>
  );
}

function CategorySection({ cat }) {
  const [first, ...rest] = cat.title;
  return (
    <>
      <div className="dv-ocio__cat-hd">
        <span className="dv-ocio__cat-first">{first}</span>
        <span className="dv-ocio__cat-rest">{rest.join('')}</span>
      </div>
      {cat.subtitle && <div className="dv-ocio__cat-sub">{cat.subtitle}</div>}
      <div className="dv-ocio__grid">
        {cat.events.slice(0, 3).map((ev, i) => <EventCard key={i} event={ev} />)}
      </div>
    </>
  );
}

/* ── Defaults ── */
const DEFAULT_FEATURED = {
  photo: null,
  tag: '★ Destacado del año',
  name: 'PRIMAVERA SOUND BARCELONA',
  when: 'Junio 2026 · Parc del Fòrum, Barcelona',
  description: 'El festival de música independiente más importante de Europa, con artistas de talla mundial durante cinco días en el Parc del Fòrum. Una cita imprescindible para los amantes de la música que convierte Barcelona en la capital mundial del indie durante una semana.',
};

const DEFAULT_CATEGORIES = [
  {
    title: 'CONCIERTOS Y FESTIVALES',
    subtitle: 'La música en vivo como experiencia transformadora. Los eventos que no te puedes perder.',
    events: [
      { name: 'Sónar Barcelona',       when: 'Junio 2026',             tag: 'Festival de música avanzada y arte digital.',      description: 'El festival referente de la música electrónica, el arte digital y la creatividad. Dos sedes, Sónar de Día y Sónar de Noche, con los mejores artistas de música electrónica del planeta durante 3 días intensos.' },
      { name: 'Gran Teatre del Liceu', when: 'Temporada 2025-2026',    tag: 'Ópera en el templo más emblemático.',              description: 'El teatro de ópera más importante de España y uno de los más reconocidos de Europa. Su temporada incluye ópera, ballet y recitales. El Liceu es patrimonio vivo de la cultura barcelonesa desde 1847.' },
      { name: 'Palau de la Música',    when: 'Todo el año',            tag: 'Música en el edificio modernista más bello.',     description: 'Joya del modernismo catalán declarada Patrimonio de la Humanidad por la UNESCO. La acústica y la luz del sol entrando por la vidriera de Domènech i Montaner hacen de cada concierto una experiencia única e irrepetible.' },
    ],
  },
  {
    title: 'PLANES CULTURALES',
    subtitle: 'Más allá del concierto: experiencias culturales que amplían horizontes.',
    events: [
      { name: 'Sagrada Família',       when: 'Visita nocturna especial · Todo el año', tag: 'La obra maestra inacabada de Gaudí.',            description: 'La visita nocturna a la Sagrada Família es una experiencia completamente diferente. Las luces interiores crean una atmósfera mágica que transforma la catedral en algo casi irreal. Reserva con mucha antelación, las plazas son limitadas.' },
      { name: 'MACBA – Noche en Blanco', when: 'Septiembre 2026',                       tag: 'El arte contemporáneo se apodera de la noche.',  description: 'Durante la Nit dels Museus, el MACBA abre sus puertas de forma gratuita hasta la madrugada. Performances en directo, visitas guiadas especiales y activaciones artísticas que convierten la plaza en un espacio de creación colectiva.' },
      { name: 'Mercat de la Boqueria', when: 'Lunes a Sábado · 8h-20h',               tag: 'El mercado más famoso del mundo.',               description: 'Mercado cubierto emblemático en Las Ramblas que acumula más de 170 años de historia gastronómica. Paradas de frutas exóticas, mariscos frescos, jamones y bocados únicos. Evita las horas punta y disfrútalo como un local auténtico.' },
    ],
  },
];

/**
 * T09OcioEventos — Calendario de ocio y eventos.
 * Template 9/17. Nuevo patrón: featured horizontal + cards con fecha magenta.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.sections.ocioEventos
 *   pageNumber, primaryColor, featuredEvent, categories
 */
export default function T09OcioEventos({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const s = config.sections?.ocioEventos ?? {};

  const pageNumber    = s.pageNumber    ?? '22';
  const primaryColor  = s.primaryColor  ?? '#C8006B';
  const featuredEvent = s.featuredEvent ?? DEFAULT_FEATURED;
  const categories    = s.categories?.length ? s.categories : DEFAULT_CATEGORIES;

  return (
    <PageA4 bg="#ffffff" className="dv-ocio">

      {/* ── Header ── */}
      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">OCIO Y EVENTOS</span>
      </div>
      <hr className="dv-page-rule" />

      {/* ── Slogan ── */}
      <div className="dv-ocio__slogan">
        <span className="dv-ocio__slogan-pre">LOS MEJORES PLANES DE</span>
        <span className="dv-ocio__slogan-city">{city.toUpperCase()}</span>
        <div className="dv-ocio__slogan-year">
          GUÍA 2
          <DiscoolverIsotipo size={18} color={primaryColor} style={{ display:'inline-flex', verticalAlign:'middle' }} />
          {year}
        </div>
      </div>

      {/* ── Featured event ── */}
      <div className="dv-ocio__featured">
        <div className="dv-ocio__feat-img-wrap">
          {featuredEvent.photo
            ? <img className="dv-ocio__feat-img" src={featuredEvent.photo} alt={featuredEvent.name} />
            : <div className="dv-ocio__feat-img-ph"><span>📷</span><span>Foto destacado</span></div>
          }
          <div className="dv-ocio__feat-grad" />
        </div>
        <div className="dv-ocio__feat-body">
          <div className="dv-ocio__feat-tag" style={{ color: primaryColor }}>{featuredEvent.tag}</div>
          <div className="dv-ocio__feat-name">{featuredEvent.name.toUpperCase()}</div>
          <div className="dv-ocio__feat-when">¿Cuándo? {featuredEvent.when}</div>
          <p className="dv-ocio__feat-desc">{featuredEvent.description}</p>
        </div>
      </div>

      {/* ── Categories ── */}
      {categories.map((cat, i) => (
        <CategorySection key={i} cat={cat} />
      ))}

      {/* ── Footer ── */}
      <div className="dv-ocio__footer">
        <span className="dv-ocio__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-ocio__footer-num">{pageNumber}</span>
      </div>

    </PageA4>
  );
}
