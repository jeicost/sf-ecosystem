/** Single source of truth for site-wide constants. */
export const site = {
  name: 'Adrian Grooves',
  // Preview deploy for now — no custom domain yet. Update on go-live.
  url: 'https://adrian-grooves.vercel.app',
  tagline: 'Haz vídeos que parecen profesionales con el equipo que ya tienes',
  description:
    'Curso de Adrian Grooves, filmmaker de videoclips para Natos y Waor, YSY A y C.R.O. Aprende la metodología de rodajes profesionales y consigue vídeos de otro nivel con tu móvil o cámara — sin gastar en equipo.',
  locale: 'es_ES',
  lang: 'es',
  // All CTAs point here (checkout). Overridable per-section via CMS `cta_url`.
  checkoutUrl: '#checkout',
  price: '197',
  priceAnchor: '297',
  artists: ['Natos y Waor', 'YSY A', 'C.R.O.'],
} as const
