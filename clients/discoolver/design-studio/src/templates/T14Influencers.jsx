import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T14Influencers.css';

function InfluencerCard({ infl, primaryColor }) {
  return (
    <div className="dv-infl__card">
      <div className="dv-infl__photo">
        {infl.photo
          ? <img src={infl.photo} alt={infl.name} />
          : <span className="dv-infl__photo-ph">FOTO</span>
        }
        {infl.platform && (
          <div className="dv-infl__platform" style={{ background: primaryColor }}>
            {infl.platform.toUpperCase()}
          </div>
        )}
      </div>
      <div className="dv-infl__name">{infl.name.toUpperCase()}</div>
      {infl.handle      && <div className="dv-infl__handle">{infl.handle}</div>}
      {infl.city        && <div className="dv-infl__city">{infl.city}</div>}
      {infl.description && <p className="dv-infl__desc">{infl.description}</p>}
      {infl.stats?.length > 0 && (
        <div className="dv-infl__stats">
          {infl.stats.map((s, i) => (
            <div key={i}>
              <span className="dv-infl__stat-num">{s.num}</span>
              <span className="dv-infl__stat-lbl">{s.label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
      {infl.categories?.length > 0 && (
        <div className="dv-infl__chips">
          {infl.categories.map((c, i) => (
            <span key={i} className="dv-infl__chip">{c.toUpperCase()}</span>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_INFLUENCERS = [
  { name: 'Alba Díaz',      handle: '@albadiazwilstermann', platform: 'Instagram', city: 'Madrid, España',    description: 'Hija de Vicky Martín Berrocal y Manuel Díaz "El Cordobés". Creadora de contenido de moda, lifestyle y viajes. Su autenticidad y cercanía la han convertido en un referente para la nueva generación.',                              stats: [{ num: '1.2M', label: 'Seguidores' }, { num: '8.4%', label: 'Engagement' }], categories: ['Moda', 'Lifestyle', 'Viajes'] },
  { name: 'Ibai Llanos',    handle: '@ibaillanos',           platform: 'TikTok',   city: 'Barcelona, España', description: 'Streamer y creador de contenido referente en el mundo hispanohablante. Sus retransmisiones de humor, deportes y eventos especiales han roto todos los récords de audiencia en Twitch en español.',                         stats: [{ num: '9.8M', label: 'Seguidores' }, { num: '12.1%', label: 'Engagement' }], categories: ['Gaming', 'Humor', 'Deportes'] },
  { name: 'Dulceida',       handle: '@dulceida',             platform: 'YouTube',  city: 'Barcelona, España', description: 'Pionera del blogging y las redes sociales en España. Referente en moda y lifestyle, su autenticidad y su capacidad para conectar con su audiencia la han convertido en un ícono de la cultura digital española.',        stats: [{ num: '3.1M', label: 'Seguidores' }, { num: '5.2%', label: 'Engagement' }], categories: ['Moda', 'Beauty', 'Viajes'] },
  { name: 'Marina Rivers',  handle: '@marinarivers',         platform: 'Instagram', city: 'Valencia, España',  description: 'Creadora de contenido de lifestyle, humor y entretenimiento. Conocida por su naturalidad y sus vlogs del día a día, ha construido una comunidad muy fiel que la sigue en todas sus aventuras y proyectos.',              stats: [{ num: '2.4M', label: 'Seguidores' }, { num: '7.8%', label: 'Engagement' }], categories: ['Lifestyle', 'Humor', 'Familia'] },
  { name: 'Willy Rex',      handle: '@willyrex',             platform: 'TikTok',   city: 'Madrid, España',    description: 'Youtuber y streamer de gaming, uno de los creadores más veteranos de habla hispana en YouTube. Su trayectoria es un ejemplo de constancia y adaptación a los nuevos formatos y plataformas digitales.',                    stats: [{ num: '11M', label: 'Suscriptores' }, { num: '4.9%', label: 'Engagement' }], categories: ['Gaming', 'Entretenimiento'] },
  { name: 'Rocío Osorno',   handle: '@rocio_osorno',         platform: 'Instagram', city: 'Sevilla, España',   description: 'Diseñadora de moda e influencer de estilo clásico andaluz. Su propuesta estética, elegante y con raíces en la moda española, la ha posicionado como un referente nacional e internacional en el mundo de la moda.',      stats: [{ num: '1.8M', label: 'Seguidores' }, { num: '6.3%', label: 'Engagement' }], categories: ['Moda', 'Diseño', 'Lifestyle'] },
];

/**
 * T14Influencers — Directorio editorial de creadores de contenido.
 * Template 14/17. Layout editorial diferenciado: sin caja magenta ni drop-cap.
 * Grid 2×3 con portrait, handle, stats KPI y category chips.
 * Sin disco-link — los influencers viven en sus redes propias.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {Array}  config.influencers - [{photo, platform, name, handle, city, description, stats, categories}]
 */
export default function T14Influencers({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const influencers  = config.influencers?.length ? config.influencers : DEFAULT_INFLUENCERS;
  const primaryColor = config.sections?.influencers?.primaryColor ?? '#C8006B';
  const pageNumber   = config.sections?.influencers?.pageNumber   ?? '44';
  const manifiesto   = config.sections?.influencers?.manifiesto   ?? 'Las personas que con su trabajo en redes sociales generan sinergias positivas ofreciendo gran contenido. No nos importa tanto el número de seguidores como la calidad del contenido generado.';
  const intro        = config.sections?.influencers?.intro        ?? 'En discoolver queremos reconocer a esas personas que con su trabajo y esfuerzo están contribuyendo a la COOLtura popular, no solo reconociendo su trabajo sino también a las personas que están detrás de cada éxito con un solo objetivo:';
  const introStrong  = config.sections?.influencers?.introStrong  ?? 'inspirar al mundo.';

  return (
    <PageA4 bg="#ffffff" className="dv-infl">

      {/* ── Header ── */}
      <div className="dv-page-header">
        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:'#555', lineHeight:1 }}>{pageNumber}</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color={primaryColor} />
        <span className="dv-page-section">LOCAL INFLUENCERS</span>
      </div>
      <hr className="dv-page-rule" />

      {/* ── Title bicolor + manifiesto ── */}
      <div className="dv-infl__title-block">
        <div className="dv-infl__title">
          <span className="dv-infl__title-navy">LOCAL</span>
          <span className="dv-infl__title-bicolor">
            <span className="dv-infl__title-mag">INFLU</span>
            <span className="dv-infl__title-nvy">ENCERS</span>
          </span>
        </div>
        <p className="dv-infl__manifiesto">{manifiesto}</p>
      </div>
      <hr className="dv-infl__rule" />

      {/* ── Pull-quote intro ── */}
      <div className="dv-infl__intro">
        {intro} <strong>{introStrong}</strong>
      </div>

      {/* ── 2×3 Grid ── */}
      <div className="dv-infl__grid">
        {influencers.slice(0, 6).map((infl, i) => (
          <InfluencerCard key={i} infl={infl} primaryColor={primaryColor} />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="dv-infl__footer">
        <span className="dv-infl__footer-txt">Guía discoolver {city} 20{year}</span>
        <span className="dv-infl__footer-num">{pageNumber}</span>
      </div>

    </PageA4>
  );
}
