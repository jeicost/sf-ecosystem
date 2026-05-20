import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T15Publicidad.css';

const DEFAULT_FEATURES = [
  { icon: '🌍', title: 'ALCANCE GLOBAL',    desc: 'Presencia en los principales destinos del mundo con contenido editorial curado.' },
  { icon: '✦',  title: 'AUDIENCIA PREMIUM', desc: 'Lectores con alto poder adquisitivo y pasión por las mejores experiencias.' },
  { icon: '◑',  title: 'FORMATO ÚNICO',     desc: 'Guía impresa + digital interactiva. Presencia en ambos canales con un solo partner.' },
];

/**
 * T15Publicidad — Página publicitaria full-bleed navy.
 * Template 15/17. Ruptura total: padding 0, fondo navy, sin header editorial.
 *
 * @param {object} config
 * @param {string} config.city
 * @param {string} config.year
 * @param {object} config.ad
 *   eyebrow, headlineLines: string[], accentLine (última con color magenta),
 *   body, ctaLabel, ctaHref, features: [{icon, title, desc}],
 *   guideLabel, email, social, tagline
 */
export default function T15Publicidad({ config = {} }) {
  const { city = 'MUNDO', year = '26' } = config;
  const ad = config.ad ?? {};

  const eyebrow      = ad.eyebrow      ?? 'Anunciate con nosotros';
  const headLines    = ad.headlineLines ?? ['LLEGA A', 'LOS MÁS'];
  const accentLine   = ad.accentLine    ?? 'COOL.';
  const body         = ad.body         ?? 'Discoolver conecta tu marca con la audiencia más selecta y comprometida. Nuestros lectores son curiosos, viajeros y apasionados por descubrir las mejores propuestas locales del mundo.';
  const ctaLabel     = ad.ctaLabel     ?? 'CONTÁCTANOS →';
  const ctaHref      = ad.ctaHref      ?? 'mailto:business@discoolver.es';
  const features     = ad.features?.length ? ad.features : DEFAULT_FEATURES;
  const guideLabel   = ad.guideLabel   ?? `Guía ${city}`;
  const email        = ad.email        ?? 'business@discoolver.es';
  const social       = ad.social       ?? '@discoolver';
  const tagline      = ad.tagline      ?? 'Descubre los lugares + cool del mundo';

  return (
    <PageA4 bg="#1A1A2E" className="dv-ad">

      {/* Decorative background */}
      <div className="dv-ad__geo-grid" />
      <div className="dv-ad__circle-1" />
      <div className="dv-ad__circle-2" />
      <div className="dv-ad__circle-3" />

      <div className="dv-ad__content">

        {/* ── TOP: branding ── */}
        <div className="dv-ad__top">
          <div className="dv-ad__logo">
            <DiscoolverIsotipo size={28} color="#ffffff" />
            <span className="dv-ad__wordmark">discoolver</span>
          </div>
          <div className="dv-ad__meta">
            {guideLabel}<br />
            Edición 2
            <DiscoolverIsotipo size={9} color="rgba(255,255,255,0.4)" style={{ display:'inline-flex', verticalAlign:'middle', margin:'0 1px' }} />
            {year}<br />
            discoolver.com
          </div>
        </div>

        {/* ── MIDDLE: headline ── */}
        <div className="dv-ad__middle">
          <div className="dv-ad__eyebrow">{eyebrow}</div>
          <div className="dv-ad__headline">
            {headLines.map((line, i) => <span key={i}>{line}<br /></span>)}
            <span className="dv-ad__headline-accent">{accentLine}</span>
          </div>
          <p className="dv-ad__body">{body}</p>
          <a href={ctaHref} className="dv-ad__cta">{ctaLabel}</a>
        </div>

        {/* ── FEATURES ── */}
        <div className="dv-ad__features">
          {features.map((f, i) => (
            <div key={i}>
              <span className="dv-ad__feat-icon">{f.icon}</span>
              <div className="dv-ad__feat-title">{f.title}</div>
              <p className="dv-ad__feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div className="dv-ad__footer">
          <div className="dv-ad__footer-url">DISCOOLVER.COM</div>
          <div className="dv-ad__footer-right">
            {email}<br />
            {social}<br />
            <em>{tagline}</em>
          </div>
        </div>

      </div>
    </PageA4>
  );
}
