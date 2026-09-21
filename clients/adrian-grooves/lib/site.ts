/** Single source of truth for site-wide constants. */
export const site = {
  /**
   * «Groves», con una o. Confirmado por Carlos el 22-sep-2026: el Brand Brain
   * ya decía Groves y la web, el logo y el slug decían Grooves. Los
   * identificadores técnicos (carpeta, slug del CMS `adrian-grooves`, proyecto
   * de Vercel, URL de preview) NO se cambian: romperían la integración.
   */
  name: 'Adrian Groves',
  // Preview deploy for now — no custom domain yet. Update on go-live.
  url: 'https://adrian-grooves.vercel.app',
  tagline: 'Haz vídeos que parecen profesionales con el equipo que ya tienes',
  description:
    'Curso de Adrian Groves, filmmaker de videoclips para Natos y Waor, YSY A y C.R.O. Aprende la metodología de rodajes profesionales y consigue vídeos de otro nivel con tu móvil o cámara — sin gastar en equipo.',
  locale: 'es_ES',
  lang: 'es',
  /**
   * Destino de TODOS los CTA. Se sobrescribe desde el CMS con `hero.cta_url`,
   * y ese es el único interruptor del lanzamiento: hasta el 15-oct-2026 apunta
   * a `#lista` (captación) y ese día se cambia por la URL del checkout de
   * Hotmart. Es un cambio de contenido, no de código — no hace falta deploy
   * para abrir la venta, solo republicar desde el admin del CMS.
   */
  checkoutUrl: '#lista',
  /**
   * 99 €, confirmado por Carlos el 21-sep-2026. La página estuvo publicada con
   * 197 € y un ancla de 297 € desde julio: era un error de la landing, no un
   * cambio de precio — el Brand Brain siempre dijo ~99 €.
   */
  price: '99',
  /**
   * Sin ancla. El precio es único (99 € en pre-venta y en lanzamiento), así que
   * tachar un precio que nunca se ha cobrado es inventarse un descuento. Si
   * algún día sube de verdad, aquí va el precio anterior y el tachado vuelve
   * solo (`Oferta` lo oculta mientras esté vacío).
   */
  priceAnchor: '',
  artists: ['Natos y Waor', 'YSY A', 'C.R.O.'],
  /**
   * Calendario del lanzamiento (Plan de acción Q4 2026, informe f5110091).
   * Estas fechas son una PROMESA PÚBLICA: si cambian, se cambian aquí y en el
   * CMS, y se avisa a quien ya compró antes de que lo note.
   */
  launch: {
    presaleOpens: '15 de octubre',
    modulesAtOpen: 3,
    totalModules: 9,
    dripCadence: 'un módulo nuevo cada semana',
    courseComplete: '30 de noviembre',
  },
  /**
   * El trabajo real de Adrian, que es la prueba que sostiene la página hasta
   * que existan testimonios de alumnos de verdad (diciembre 2026). Salen de
   * `brand_references` en MIRA: son videoclips publicados y verificables.
   */
  work: [
    { title: 'Natos y Waor — Dispuestos a morir', feat: 'ft. C.R.O & Homer el Mero Mero', url: 'https://www.youtube.com/watch?v=RCyR6eugk-Q' },
    { title: 'Natos y Waor — Cura de humildad', feat: '', url: 'https://www.youtube.com/watch?v=hZHNLk3BoBk' },
    { title: 'Natos y Waor — Cicatrices', feat: '', url: 'https://www.youtube.com/watch?v=GL_BaF283TM' },
  ],
  /**
   * Titular de la web y responsable del tratamiento: Startups Factory LLC
   * (decisión de Carlos, 22-sep-2026). Datos sacados de los documentos de
   * constitución (Articles + Certificate of Organization, Wyoming, 13-oct-2025).
   * Es una LLC de EE. UU.: NO tiene NIF español, así que el aviso legal la
   * identifica por su registro y número, que es lo que pide la LSSI (art. 10)
   * para un prestador no inscrito en España.
   */
  legal: {
    titular: 'STARTUPS FACTORY LLC' as string | null,
    registro: 'Wyoming Secretary of State (EE. UU.), ID 2025-001789591' as string | null,
    domicilio: '5830 E 2nd St, Ste 7000 #29333, Casper, WY 82609 (EE. UU.)' as string | null,
    // El buzón que MIRA ya publica para cuestiones de privacidad.
    email: 'contacto@startupsfactory.es' as string | null,
  },
} as const
