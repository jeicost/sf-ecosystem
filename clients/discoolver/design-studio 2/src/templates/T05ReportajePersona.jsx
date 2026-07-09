import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T05ReportajePersona.css';

const DEFAULT_TIMELINE = [
  { year: '2016', items: ['EP debut independiente', '"Antes de morirme" ft. C. Tangana'] },
  { year: '2017', items: ['Álbum "Los Ángeles"', 'Premio Nacional Músicas Actuales'] },
  { year: '2018', items: ['"El Mal Querer" — álbum del año', 'Grammy Latino mejor álbum alternativo', 'Latin Grammy álbum del año'] },
  { year: '2019', items: ['Colaboración "Con Altura" ft. J Balvin', 'Coachella — headline', 'NME Award'] },
  { year: '2020', items: ['"Yo x Ti, Tu x Mi" ft. Ozuna', 'MTV EMA Best Artist'] },
  { year: '2022', items: ['Álbum "MOTOMAMI" — disco del año', 'Platino en 14 países', 'TIME 100 Most Influential People'] },
  { year: '2024', items: ['"RAUW × ROSALÍA" EP', 'Gira mundial sold-out', 'Grammy Best Latin Pop Album'] },
  { year: '2026', items: ['Nuevo álbum anunciado', '★ Persona del Año discoolver BCN'] },
];

const DEFAULT_AWARDS = ['Grammy Latino ×4', 'MTV EMA', 'NME Award', 'Brit Award', 'Premio Nac. Músicas Actuales', 'TIME 100'];

const DEFAULT_RECOMENDADOS = [
  { name: '71 Oyster Bar',    category: 'Bar de ostras y cócteles',        badge: 'Bar',         address: 'C/ Enric Granados, 71',      desc: 'Speakeasy íntimo con las mejores ostras de la ciudad y coctelería de autor.' },
  { name: 'Disfrutar',        category: 'Alta cocina de vanguardia',       badge: 'Restaurante', address: 'C/ de Villarroel, 163',      desc: 'Top 3 en The World\'s 50 Best. La experiencia gastronómica más exclusiva.' },
  { name: 'Sala Bikini',      category: 'Música en directo',               badge: 'Club',        address: 'Av. Diagonal, 547',          desc: 'La sala de conciertos de referencia en Barcelona. Programación infalible.' },
  { name: 'El Xampanyet',     category: 'Bodega y tapas',                  badge: 'Bodega',      address: 'C/ de Montcada, 22',         desc: 'Bodega centenaria en el Born. Cava artesano, anchovas y montaditos históricos.' },
  { name: 'Hotel Arts',       category: 'Hotel de lujo frente al mar',     badge: 'Aloj.',       address: 'C/ de la Marina, 19-21',     desc: 'El skyline de Barcelona desde la torre más icónica. Piscina infinity y vistas al Mediterráneo.' },
  { name: 'Palau de la Música', category: 'Sala de conciertos patrimonio UNESCO', badge: 'Cultura', address: 'C/ del Palau de la Música, 4-6', desc: 'Joya del modernismo catalán. Cada concierto es una experiencia sin igual.' },
];

/**
 * T05ReportajePersona — Reportaje Persona del Año, 3 páginas A4.
 * Template 5/17.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.personaDelAno         - { name, tagline, photo, origen, disciplina, bio, quote, awards }
 * @param {object} config.personaDelAno.bodyPhoto - URL foto p. 2 (si es null = placeholder)
 * @param {Array}  config.personaDelAno.quotes  - [{ text, attr }]
 * @param {Array}  config.personaDelAno.awards  - string[]
 * @param {Array}  config.personaDelAno.timeline - [{ year, items }]
 * @param {Array}  config.personaDelAno.recomendados - lista de recomendados BCN
 */
export default function T05ReportajePersona({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const p = config.personaDelAno ?? {};

  const name         = p.name         ?? 'La Rosalía';
  const tagline      = p.tagline      ?? '"Siento que hago música desde el respeto y la libertad"';
  const coverPhoto   = p.photo        ?? null;
  const bodyPhoto    = p.bodyPhoto    ?? null;
  const origen       = p.origen       ?? city;
  const disciplina   = p.disciplina   ?? 'Música';
  const awards       = p.awards       ?? DEFAULT_AWARDS;
  const timeline     = p.timeline     ?? DEFAULT_TIMELINE;
  const recomendados = p.recomendados ?? DEFAULT_RECOMENDADOS;
  const quotes       = p.quotes       ?? [
    { text: 'Barcelona siempre será mi base. Aquí está mi familia, mi historia, mis raíces.', attr: `— ${name}` },
    { text: 'Hago lo que siento aunque no encaje en ninguna caja. La libertad es mi único criterio.', attr: `— ${name}` },
  ];

  const tlLeft  = timeline.slice(0, Math.ceil(timeline.length / 2));
  const tlRight = timeline.slice(Math.ceil(timeline.length / 2));

  return (
    <>
      {/* ══════ PAGE 1: COVER ══════ */}
      <PageA4 bg="#1A1A2E" className="dv-reportaje__cover">
        {coverPhoto
          ? <img className="dv-reportaje__cover-bg" src={coverPhoto} alt={name} />
          : <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#2a1a3e,#1A1A2E)' }} />
        }
        <div className="dv-reportaje__cover-gradient" />

        <div className="dv-reportaje__cover-top">
          <div className="dv-reportaje__cover-logo">
            <DiscoolverIsotipo size={24} color="#ffffff" />
            <span className="dv-reportaje__cover-wordmark">discoolver</span>
          </div>
          <div className="dv-reportaje__cover-edition">
            Guía {city} 20{year}<br />Persona del Año
          </div>
        </div>

        <div className="dv-reportaje__cover-content">
          <div className="dv-reportaje__eyebrow">Persona del Año · discoolver {city} 20{year}</div>
          <div className="dv-reportaje__name">{name.toUpperCase()}</div>
          <div className="dv-reportaje__tagline">{tagline}</div>
          <div className="dv-reportaje__divider" />
          <div className="dv-reportaje__meta">
            <div className="dv-reportaje__meta-item">
              <span className="dv-reportaje__meta-lbl">Origen</span>
              <span className="dv-reportaje__meta-val">{origen.toUpperCase()}</span>
            </div>
            <div className="dv-reportaje__meta-item">
              <span className="dv-reportaje__meta-lbl">Disciplina</span>
              <span className="dv-reportaje__meta-val">{disciplina.toUpperCase()}</span>
            </div>
            <div className="dv-reportaje__meta-item">
              <span className="dv-reportaje__meta-lbl">Año</span>
              <span className="dv-reportaje__meta-val">20{year}</span>
            </div>
          </div>
        </div>

        <div className="dv-reportaje__page-num">P.05</div>
      </PageA4>

      {/* ══════ PAGE 2: BODY ══════ */}
      <PageA4 bg="#ffffff" className="dv-reportaje__body" style={{ padding: '44px 52px 56px' }}>

        <div className="dv-page-header">
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, color:'#555', lineHeight:1 }}>05</span>
          <div className="dv-page-divider" />
          <DiscoolverIsotipo size={22} color="#C8006B" />
          <span className="dv-page-section">REPORTAJE — PERSONA DEL AÑO</span>
        </div>
        <hr className="dv-page-rule" />

        <div className="dv-reportaje__two-col">
          {/* Left */}
          <div>
            <div className="dv-reportaje__article-photo">
              {bodyPhoto
                ? <img src={bodyPhoto} alt={name} />
                : <div style={{ width:'100%', height:'100%', background:'#d0d0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>🎤</div>
              }
              <div className="dv-reportaje__photo-cap">{name} en Barcelona</div>
            </div>

            <div className="dv-reportaje__sec-tag">1. ¿Quién es?</div>
            <p className="dv-reportaje__body-p">
              <span className="dv-reportaje__drop-cap">{name[0]}</span>
              {p.bio || `${name} es la artista más influyente que ha dado ${city} en la última década. Su propuesta fusiona tradición y vanguardia creando un lenguaje completamente propio que ha sacudido la industria global.`}
            </p>

            <div className="dv-reportaje__pull-q">
              <div className="dv-reportaje__pull-q-text">"{quotes[0]?.text}"</div>
              <div className="dv-reportaje__pull-q-attr">{quotes[0]?.attr}</div>
            </div>

            <div className="dv-reportaje__sec-tag">2. Orígenes</div>
            <p className="dv-reportaje__body-p">
              Creció entre tradición e innovación. Esa convivencia aparentemente imposible es la clave de su universo artístico. Empezó desde muy joven, dedicando miles de horas a dominar su técnica antes de dar el salto al mundo.
            </p>
          </div>

          {/* Right */}
          <div>
            <div className="dv-reportaje__sec-tag">3. Estilo</div>
            <div className="dv-reportaje__sec-title">TRADICIÓN + VANGUARDIA</div>
            <p className="dv-reportaje__body-p">
              Su propuesta artística mezcla referencias de la tradición con producción de vanguardia, creando un sonido que no encaja en ninguna caja pero que conecta con millones de personas en todo el mundo.
            </p>
            <p className="dv-reportaje__body-p">
              Cada proyecto es un ejercicio de honestidad emocional y libertad creativa. Trabaja con los mejores productores del mundo pero siempre desde sus propias coordenadas artísticas.
            </p>

            <div className="dv-reportaje__sec-tag">4. Colaboraciones</div>
            <p className="dv-reportaje__body-p">
              La lista de artistas que han buscado trabajar con ella refleja su posición única como puente entre mundos creativos que raramente se tocan.
            </p>

            <div className="dv-reportaje__pull-q">
              <div className="dv-reportaje__pull-q-text">"{quotes[1]?.text}"</div>
              <div className="dv-reportaje__pull-q-attr">{quotes[1]?.attr}</div>
            </div>

            <div className="dv-reportaje__sec-tag">5. Filosofía</div>
            <p className="dv-reportaje__body-p">
              Su acercamiento al arte es de profundo respeto y al mismo tiempo de absoluta libertad creativa. No reivindica pureza: reivindica verdad.
            </p>

            <div className="dv-reportaje__awards">
              <div className="dv-reportaje__awards-lbl">Reconocimientos destacados</div>
              <div className="dv-reportaje__awards-chips">
                {awards.map((a, i) => (
                  <span key={i} className="dv-reportaje__chip">{a.toUpperCase()}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dv-page-footer" style={{ bottom:20, left:52, right:52 }}>
          <span style={{ fontSize:8.5, color:'#bbb', fontStyle:'italic' }}>Guía discoolver {city} 20{year}</span>
          <span style={{ fontSize:8.5, color:'#bbb', fontStyle:'italic' }}>discoolver.com</span>
        </div>

      </PageA4>

      {/* ══════ PAGE 3: TIMELINE + RECOMENDADOS ══════ */}
      <PageA4 bg="#ffffff" className="dv-reportaje__body" style={{ padding: '40px 52px 48px' }}>

        <div className="dv-page-header">
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, color:'#555', lineHeight:1 }}>07</span>
          <div className="dv-page-divider" />
          <DiscoolverIsotipo size={22} color="#C8006B" />
          <span className="dv-page-section">TRAYECTORIA &amp; RECOMENDADOS</span>
        </div>
        <hr className="dv-page-rule" />

        {/* Timeline */}
        <div className="dv-reportaje__tl-hd">TRAYECTORIA</div>
        <div className="dv-reportaje__tl-cols">
          <div className="dv-reportaje__tl-track">
            {tlLeft.map((e, i) => (
              <div key={i} className="dv-reportaje__tl-block">
                <div className="dv-reportaje__tl-year">{e.year}</div>
                <div className="dv-reportaje__tl-items">
                  {e.items.map((it, j) => (
                    <div key={j} className="dv-reportaje__tl-chip">{it}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="dv-reportaje__tl-track">
            {tlRight.map((e, i) => (
              <div key={i} className="dv-reportaje__tl-block">
                <div className="dv-reportaje__tl-year">{e.year}</div>
                <div className="dv-reportaje__tl-items">
                  {e.items.map((it, j) => (
                    <div key={j} className="dv-reportaje__tl-chip">{it}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendados */}
        <div className="dv-reportaje__recom-hd">
          <div>
            <div className="dv-reportaje__recom-hd-title">SUS RECOMENDADOS EN {city.toUpperCase()}</div>
            <div className="dv-reportaje__recom-hd-sub">Los lugares favoritos de {name} · haz clic para ver la ficha en discoolver.com</div>
          </div>
          <DiscoolverIsotipo size={24} color="#ffffff" />
        </div>

        <div className="dv-reportaje__recom-grid">
          {recomendados.map((r, i) => (
            <a key={i} href={r.discoolverUrl ?? '#'} className="dv-reportaje__recom-card">
              <div className="dv-reportaje__recom-thumb">
                {r.photo
                  ? <img src={r.photo} alt={r.name} />
                  : <div className="dv-reportaje__recom-thumb-ph">📍</div>
                }
                <div className="dv-reportaje__recom-badge">{r.badge}</div>
              </div>
              <div className="dv-reportaje__recom-body">
                <div className="dv-reportaje__recom-name">{r.name.toUpperCase()}</div>
                <div className="dv-reportaje__recom-cat">{r.category}</div>
                <div className="dv-reportaje__recom-desc">{r.description ?? r.desc}</div>
                <div className="dv-reportaje__recom-foot">
                  <div className="dv-reportaje__recom-addr">{r.address}</div>
                  <a href={r.discoolverUrl ?? '#'} className="dv-reportaje__recom-cta">Ver →</a>
                </div>
              </div>
            </a>
          ))}
        </div>

      </PageA4>
    </>
  );
}
