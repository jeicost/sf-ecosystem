import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T16Contraportada.css';

/** QR decorativo SVG — mock visual con 3 finder corners + isotipo central */
function QrMock() {
  const M = '#111827';
  const dot = (x, y, w = 1, h = 1) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={M} />;

  const dataModules = [
    [9,10], [11,10], [13,10,2], [17,10], [19,10,2], [22,10],
    [10,11,2], [16,11], [20,11,2],
    [9,12], [14,12], [18,12], [21,12,2],
    [11,13,2], [15,13,2], [19,13], [22,13],
    [9,16,2], [13,16], [17,16,2], [21,16],
    [10,17], [14,17,2], [18,17], [22,17,2],
    [9,19], [11,19,2], [15,19], [20,19,2],
    [10,20,2], [14,20], [17,20,2], [22,20],
    [9,22], [13,22,2],
  ].map(([x, y, w = 1]) => dot(x, y, w, 1));

  return (
    <svg width="124" height="124" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg">
      <rect width="31" height="31" fill="white" />

      {/* Finder TL */}
      <rect x="1" y="1" width="7" height="7" fill={M} />
      <rect x="2" y="2" width="5" height="5" fill="white" />
      <rect x="3" y="3" width="3" height="3" fill={M} />

      {/* Finder TR */}
      <rect x="23" y="1" width="7" height="7" fill={M} />
      <rect x="24" y="2" width="5" height="5" fill="white" />
      <rect x="25" y="3" width="3" height="3" fill={M} />

      {/* Finder BL */}
      <rect x="1" y="23" width="7" height="7" fill={M} />
      <rect x="2" y="24" width="5" height="5" fill="white" />
      <rect x="3" y="25" width="3" height="3" fill={M} />

      {/* Timing dots */}
      {[8,10,12,14].map(x => <rect key={`th${x}`} x={x} y={8} width="1" height="1" fill={M} />)}
      {[10,12,14,16].map(y => <rect key={`tv${y}`} x={8} y={y} width="1" height="1" fill={M} />)}

      {/* Data modules */}
      {dataModules}

      {/* Center logo background */}
      <rect x="12" y="12" width="7" height="7" fill="white" />

      {/* Isotipo magenta centrado */}
      <svg x="13" y="12.5" width="5" height="6" viewBox="0 0 110 100">
        <path d="M59 0 A59 50 0 0 0 59 100 Z" fill="#C8006B" />
        <polygon points="72,13 110,50 72,87" fill="#C8006B" />
      </svg>
    </svg>
  );
}

const DEFAULT_FEATURES = [
  { icon: '◑',   label: 'Guía\ninteractiva' },
  { icon: '+20', label: 'Ciudades\ndisponibles' },
  { icon: '1ª',  label: 'Guía curada\ndel mundo' },
  { icon: '∞',   label: 'Plan\nmy trip' },
];

/**
 * T16Contraportada — Contraportada con QR decorativo.
 * Template 16/17. Full-bleed navy simétrico a la portada.
 * Función: convertir → escanear QR → discoolver.com.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.backCover
 *   tagline, qrUrl, qrDescription, features, copyright, contact
 */
export default function T16Contraportada({ config = {} }) {
  const { city = 'BARCELONA', year = '26' } = config;
  const bc = config.backCover ?? {};

  const tagline       = bc.tagline       ?? 'DESCUBRE LOS LUGARES + COOL DE TU CIUDAD';
  const qrUrl         = bc.qrUrl         ?? 'DISCOOLVER.COM';
  const qrDescription = bc.qrDescription ?? `Accede a nuestra guía interactiva con todas las recomendaciones, reservas y rutas personalizadas para ${city} y más de 20 destinos en todo el mundo.`;
  const features      = bc.features?.length ? bc.features : DEFAULT_FEATURES;
  const copyright     = bc.copyright     ?? `© 20${year} discoolver · Todos los derechos reservados`;
  const contact       = bc.contact       ?? 'business@discoolver.es · @discoolver';

  return (
    <PageA4 bg="#1A1A2E" className="dv-back">

      {/* Decorative */}
      <div className="dv-back__top-strip" />
      <div className="dv-back__grid" />
      <div className="dv-back__circle-tr" />
      <div className="dv-back__circle-bl" />

      <div className="dv-back__content">

        {/* ── LOGO ── */}
        <div className="dv-back__logo">
          <DiscoolverIsotipo size={70} color="#C8006B" />
          <span className="dv-back__wordmark">discoolver</span>
        </div>

        {/* ── TAGLINE ── */}
        <div className="dv-back__tagline">{tagline}</div>

        {/* ── QR AREA ── */}
        <div className="dv-back__qr-area">
          <div className="dv-back__qr-box">
            <QrMock />
          </div>
          <div>
            <div className="dv-back__qr-label">Escanea y descubre</div>
            <div className="dv-back__qr-url">{qrUrl}</div>
            <p className="dv-back__qr-desc">{qrDescription}</p>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="dv-back__divider" />

        {/* ── FEATURES ── */}
        <div className="dv-back__features">
          {features.map((f, i) => (
            <div key={i} className="dv-back__feat">
              <div className="dv-back__feat-icon">{f.icon}</div>
              <div className="dv-back__feat-label">
                {f.label.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < f.label.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── YEAR STAMP ── */}
        <div className="dv-back__year">
          GUÍA {city.toUpperCase()} 2
          <DiscoolverIsotipo size={14} color="rgba(255,255,255,0.2)" style={{ display:'inline-flex', verticalAlign:'middle' }} />
          {year}
        </div>

      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="dv-back__bar">
        <span className="dv-back__bar-copy">{copyright}</span>
        <span className="dv-back__bar-contact">{contact}</span>
      </div>

    </PageA4>
  );
}
