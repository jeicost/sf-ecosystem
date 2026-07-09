import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T04NotaDirector.css';

const DEFAULT_CRITERIA = [
  { name: 'Atención',       desc: 'La calidad humana en el trato es el primero de nuestros criterios. Nos da lo mismo lo guay que seas si no existe un trato de calidad a tus clientes.' },
  { name: 'Autenticidad',   desc: 'No buscamos la típica franquicia de moda. Queremos lugares únicos donde se note la autenticidad de la propuesta para ese mercado en concreto.' },
  { name: 'Autoría',        desc: 'Queremos saber quién está detrás del negocio, quién le da color. Sus fundadores, su agencia de marketing, cada detalle cuenta.' },
  { name: 'Merece la pena', desc: 'No importa si hay que rascarse el bolsillo o es para todos los públicos. Lo importante es si merece la pena invertir ese dinero y tiempo en la experiencia.' },
];

const DEFAULT_MISSION = 'Reconocer las propuestas más destacadas de cada ciudad y valorar el desempeño de los profesionales detrás de cada una de ellas. Interrelacionar las propuestas más destacadas para generar un turismo sostenible que descubra las joyas escondidas de la ciudad, permitiendo explorar como un auténtico local.';

/**
 * T04NotaDirector — Carta editorial del director.
 * Template 4/17. Doble columna.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {string} config.director               - Nombre del director
 * @param {string} config.directorRole           - Cargo ("CEO & Fundador — discoolver")
 * @param {string} config.directorPhoto          - URL foto o null
 * @param {string} config.directorsLetter        - Texto editorial (multi-párrafo, \n como separador)
 * @param {string} config.directorPullQuote      - Cita destacada
 * @param {string} config.directorSignature      - Firma ("Carlos Jacoste · CEO · Enero 2021")
 * @param {Array}  config.criteriaList           - [{ name, desc }]
 * @param {string} config.missionText
 * @param {object} config.sections               - secciones activas (para chips)
 */
export default function T04NotaDirector({ config = {} }) {
  const {
    city              = 'BARCELONA',
    year              = '26',
    director          = 'Carlos Jacoste',
    directorRole      = 'CEO & Fundador — discoolver',
    directorPhoto     = null,
    directorsLetter   = '',
    directorPullQuote = 'Conocer y reconocer las mejores propuestas locales y hacerlas asequibles a cualquier usuario generando un turismo sostenible.',
    directorSignature = `${director} · CEO discoolver · Enero 20${year}`,
    criteriaList      = DEFAULT_CRITERIA,
    missionText       = DEFAULT_MISSION,
    sections          = {},
  } = config;

  const paragraphs = directorsLetter
    ? directorsLetter.split('\n').filter(p => p.trim())
    : [
        '020 fue un año diferente, sin duda, uno que quedará en el imaginario popular como el año en el que se paralizó el mundo cual película de ficción y en el que todos tuvimos que encerrarnos en casa y tomar perspectiva.',
        'Y es que vivimos en un mundo muy rápido donde casi no da tiempo a saborear los grandes cambios. Desde discoolver, creemos que estos momentos difíciles deberían servirnos para apreciar lo verdaderamente importante y coger impulso para volver con fuerzas renovadas y espíritu de mejora.',
        'En nuestro caso, llevábamos trabajando durante dos incansables años en nuestro concepto: discoolver, una plataforma que selecciona y ofrece las recomendaciones de las propuestas más destacadas por destino.',
      ];

  const activeChips = Object.entries({
    restaurantes:             'RESTAURANTES',
    fiesta:                   'FIESTA',
    ocioEventos:              'OCIO Y EVENTOS',
    arteExposiciones:         'ARTE',
    experienciasActividades:  'EXPERIENCIAS',
    alojamientos:             'ALOJAMIENTOS',
    shopping:                 'SHOPPING',
  })
    .filter(([key]) => sections[key]?.enabled !== false)
    .map(([, label]) => label);

  return (
    <PageA4 bg="#ffffff" className="dv-nota-director">

      {/* ── Header ── */}
      <div className="dv-page-header">
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: '#444', lineHeight: 1 }}>01</span>
        <div className="dv-page-divider" />
        <DiscoolverIsotipo size={24} color="#C8006B" />
        <span className="dv-page-section">NOTA DEL DIRECTOR</span>
      </div>
      <hr className="dv-page-rule" />

      <div className="dv-nota-director__layout">

        {/* ── LEFT ── */}
        <div>
          <div className="dv-nota-director__name">{director}</div>
          <div className="dv-nota-director__role">{directorRole}</div>

          {directorPhoto
            ? <img className="dv-nota-director__photo" src={directorPhoto} alt={director} />
            : (
              <div className="dv-nota-director__photo-ph">
                <span className="dv-nota-director__photo-ph-icon">📷</span>
                <span className="dv-nota-director__photo-ph-lbl">Foto director</span>
              </div>
            )
          }

          {paragraphs.map((p, i) => (
            <p key={i} className="dv-nota-director__body">
              {i === 0 ? (
                <><span className="dv-nota-director__drop-cap">2</span>{p}</>
              ) : p}
            </p>
          ))}

          <div className="dv-nota-director__pull-quote">
            <p>{directorPullQuote}</p>
            <cite>— Misión discoolver</cite>
          </div>

          <p className="dv-nota-director__body">Para ello este año hemos decidido completar nuestra propuesta con unos premios anuales a la cooltura, los primeros en su género. Como la Guía Michelin pero mucho más variadito y poniendo en valor a los empresarios y profesionales detrás de cada uno de ellos.</p>

          <div className="dv-nota-director__signature">
            <div className="dv-nota-director__sig-line" />
            <div className="dv-nota-director__sig-text">{directorSignature}</div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div>
          <p className="dv-nota-director__body" style={{ marginBottom: 14 }}>
            ¿Qué es cool? Es una pregunta que nos hacen mucho y siempre contestamos igual. Lo cool no tiene edad, no tiene precio, no tiene género. A veces algo es cool dada su modernidad, otras gracias a su antigüedad e historia. Es como la buena música: si está hecha con pasión puede poner los pelos de gallina sin importar tu edad, raza o cualquier otro dato. Trasciende...
          </p>

          <div className="dv-nota-director__criteria">
            <div className="dv-nota-director__criteria-title">CRITERIOS DE SELECCIÓN</div>
            {criteriaList.map((c, i) => (
              <div key={i} className="dv-nota-director__criteria-item">
                <div className="dv-nota-director__criteria-name">{c.name}</div>
                <div className="dv-nota-director__criteria-desc">{c.desc}</div>
              </div>
            ))}
          </div>

          <div className="dv-nota-director__mission">
            <div className="dv-nota-director__mission-title">MISIÓN</div>
            <p className="dv-nota-director__mission-text">{missionText}</p>
          </div>

          <div className="dv-nota-director__becquer">
            <div className="dv-nota-director__becquer-label">Remix de Bécquer</div>
            <p className="dv-nota-director__becquer-quote">
              "¿Qué es cool? Dices mientras clavas en mi pupila tu pupila azul. ¡Qué es cool! ¿Y tú me lo preguntas? cool... eres tú."
            </p>
            <p className="dv-nota-director__becquer-author">— Un usuario de discoolver</p>
          </div>

          <div className="dv-nota-director__chips">
            <div className="dv-nota-director__chips-label">EN ESTA GUÍA</div>
            <div className="dv-nota-director__chips-wrap">
              {activeChips.map(label => (
                <span key={label} className="dv-nota-director__chip">{label}</span>
              ))}
              <span className="dv-nota-director__chip dv-nota-director__chip--magenta">INFLUENCERS</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Mini footer ── */}
      <div className="dv-nota-director__mini-footer">
        <span className="dv-nota-director__footer-left">Guía discoolver {city} 20{year}</span>
        <span className="dv-nota-director__footer-right">discoolver.com</span>
      </div>

    </PageA4>
  );
}
