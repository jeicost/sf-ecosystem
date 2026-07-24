/**
 * Create the SF-CMS project 'adrian-grooves' (if missing) and seed the `home`
 * page with the 14 landing sections — real copy in each section's `data` so
 * the admin shows editable content matching the site. Idempotent.
 *
 * Reads apps/sf-cms/.env.local for SUPABASE_SERVICE_ROLE_KEY + URL.
 * Prints the project api_key at the end (put it in the site's Vercel env).
 */
import fs from 'node:fs'
import crypto from 'node:crypto'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../../apps/sf-cms/.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
)
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const SLUG = 'adrian-grooves'

const SECTIONS = [
  { id: 'hero', type: 'hero', data: {
    eyebrow: 'Formación de Adrian Grooves · Filmmaker',
    headline_pre: 'Haz vídeos que parecen', headline_accent: 'profesionales', headline_post: 'con el móvil o la cámara que ya tienes',
    subtitle: 'La misma metodología que uso en rodajes para artistas como Natos y Waor, YSY A o C.R.O. — adaptada para que consigas resultados de otro nivel sin gastarte miles de euros en equipo.',
    cta: 'Quiero grabar como un profesional', cta_url: '#checkout',
    microcopy: 'Acceso de por vida · Garantía de 14 días · Empieza a aplicarlo hoy mismo',
    trust_label: 'Detrás de cámara en videoclips para',
  } },
  { id: 'problema', type: 'content', data: {
    eyebrow: 'Si esto te suena, sigue leyendo', headline: 'Grabas, le das al play… y algo no encaja',
    body: 'La luz, el encuadre, el color, ese aire "casero" que no sabes de dónde sale. Tu contenido no está mal, pero al lado de los creadores que admiras se nota que juegas en otra liga. Y lo peor: no sabes exactamente qué estás haciendo mal.',
    highlight: 'Así que llegas a la conclusión de siempre: "necesito una cámara mejor". Ahorras, te gastas el dinero… y a las dos semanas tus vídeos siguen pareciendo los de antes. Solo que ahora con una cámara más cara.',
    closing: 'Si te ha pasado, no es culpa tuya. Es que nadie te ha explicado la verdad: el equipo casi nunca es el problema.',
  } },
  { id: 'gran-idea', type: 'content', data: {
    eyebrow: 'La idea que lo cambia todo',
    quote_pre: 'La diferencia entre un vídeo amateur y uno profesional no la marca el precio del equipo.', quote_accent: 'La marca saber usarlo.',
    support: 'He rodado videoclips que compiten con producciones de sello grande resolviendo con lo que había en el set. La cámara ayuda, claro. Pero lo que de verdad cambia un vídeo son las decisiones: dónde pones la luz, cómo encuadras, cuándo mueves y cuándo no, cómo suena. Y eso se aprende.',
  } },
  { id: 'autor', type: 'content', data: {
    eyebrow: 'Quién te va a enseñar', name_pre: 'Soy', name: 'Adrian Grooves',
    body1: 'Llevo años trabajando como filmmaker en rodajes reales: videoclips y producción audiovisual para artistas de primera línea. He estado en el set resolviendo los mismos problemas que tú tienes ahora, pero con la presión de un cliente delante y sin margen para que salga mal.',
    body2: 'No vengo a enseñarte teoría de cine ni a llenarte de tecnicismos. Vengo a enseñarte el mismo criterio y las mismas decisiones que aplico en producciones profesionales, traducidos para que los uses con tu móvil o tu cámara básica.',
    kicker: 'Sin postureo. Sin humo. Solo lo que funciona de verdad.',
  } },
  { id: 'transformacion', type: 'content', data: {
    eyebrow: 'Lo que vas a conseguir',
    intro: 'Cuando termines, no serás director de fotografía. Serás algo mucho más útil para ti: alguien que sabe hacer que sus vídeos se vean profesionales, con lo que ya tiene en la mano.',
    items: [
      'Dejarás de grabar en automático y sabrás qué hace cada ajuste de tu cámara o tu móvil.',
      'Entenderás la luz y sacarás imágenes limpias y cinematográficas aunque solo tengas una ventana.',
      'Moverás la cámara con intención — y sabrás cuándo NO moverla, que es lo que separa a los profesionales.',
      'Conseguirás un sonido que suene tan bien como se ve la imagen (el error nº1 que delata a un amateur).',
      'Planificarás antes de grabar, así grabarás menos y con muchísimo mejor resultado.',
      'Editarás rápido con un flujo que funciona igual en el móvil que en el ordenador.',
      'Te diferenciarás en redes con una imagen que te posiciona por encima de tu competencia.',
    ],
  } },
  { id: 'programa', type: 'content', data: {
    eyebrow: 'El programa', headline: 'De cero a vídeos que parecen profesionales',
    intro: 'Nueve módulos que siguen exactamente el orden en el que yo pienso un rodaje. Nada de relleno: cada lección resuelve un problema real.',
    modules: [
      { n: '00', title: 'El secreto de un vídeo profesional', desc: 'Cambiamos el chip: por qué el aspecto profesional depende del criterio, no del presupuesto. Aquí empieza todo.' },
      { n: '01', title: 'Configura cualquier cámara o móvil como un profesional', desc: 'Deja lista cualquier cámara en minutos y entiende de verdad qué hace cada ajuste.' },
      { n: '02', title: 'Aprende a mirar como un filmmaker', desc: 'Desarrolla el criterio visual que hace que un plano funcione… o no.' },
      { n: '03', title: 'Movimiento de cámara con intención', desc: 'Deja de mover la cámara porque sí. Cada movimiento va a contar algo.' },
      { n: '04', title: 'Iluminación: lo que más cambia un vídeo', desc: 'Aprovecha cualquier fuente de luz para conseguir imágenes limpias y cinematográficas con muy poco.' },
      { n: '05', title: 'El sonido: la diferencia real entre amateur y profesional', desc: 'Por qué el sonido importa tanto como la imagen, y cómo conseguir que tus vídeos suenen bien.' },
      { n: '06', title: 'Piensa el vídeo antes de pulsar REC', desc: 'Planifica como un profesional: graba menos y consigue mucho más.' },
      { n: '07', title: 'Edición rápida y profesional', desc: 'Un flujo de trabajo sencillo que funciona en móvil y en ordenador, sin complicarte.' },
      { n: '08', title: 'Casos reales: así se hicieron estos vídeos', desc: 'El módulo más diferencial. Analizo proyectos reales y te cuento las decisiones que tomé durante el rodaje.' },
    ],
  } },
  { id: 'comunidad', type: 'intro-grid', data: {
    eyebrow: 'No te quedas solo', headline: 'Acceso a la comunidad y a todas las actualizaciones',
    intro: 'Aprender viendo vídeos está bien. Aprender con alguien que te corrige y una comunidad que empuja contigo es otra cosa.',
    cards: [
      { title: 'Comunidad privada', desc: 'Comparte tus vídeos, recibe feedback y rodéate de gente que está en tu mismo punto y quiere mejorar.' },
      { title: 'Nuevas clases y especialidades', desc: 'El curso no se queda quieto: sumo formación nueva y la tienes incluida.' },
      { title: 'Actualizaciones de por vida', desc: 'Cuando cambia una herramienta o descubro algo que funciona mejor, lo actualizo.' },
      { title: 'Directos y resolución de dudas', desc: 'Momentos para preguntar en directo y resolver justo eso que se te atasca en tus propios vídeos.' },
    ],
    closing: 'El primer año de comunidad y actualizaciones va incluido en tu acceso.',
  } },
  { id: 'bonus', type: 'content', data: {
    eyebrow: 'Además, te llevas', headline: 'Bonus que valen por sí solos',
    items: [
      'Mi equipo recomendado según presupuesto — qué comprar (y qué NO) con 0 €, 300 € o 1.000 €.',
      'Cómo grabarte tú solo — el sistema para conseguir buenos planos sin nadie detrás de la cámara.',
      'Cómo grabar para Instagram, TikTok y YouTube — adaptado a cada plataforma.',
      'Mis LUTs y presets — el color de mis rodajes, listo para aplicar en tus vídeos.',
      'Mi checklist antes de cada rodaje — para que no se te olvide nada nunca más.',
      'Recursos de música, efectos y tipografías — dónde saco lo que uso.',
      'Errores que sigo viendo incluso en creadores con miles de seguidores — y cómo evitarlos.',
    ],
  } },
  { id: 'para-quien', type: 'content', data: {
    eyebrow: 'Para quién', yes_title: 'Esto es para ti si…', no_title: 'Esto NO es para ti si…',
    yes: [
      'Creas contenido y quieres que se vea profesional.',
      'Eres músico o artista y quieres videoclips a otro nivel.',
      'Tienes una marca o negocio y quieres vender con mejor imagen.',
      'Ya tienes un móvil o una cámara y quieres exprimirlos al máximo.',
    ],
    no: [
      'Buscas un curso de teoría de cine para aprobar un examen.',
      'Crees que el problema se arregla comprando más equipo.',
      'No estás dispuesto a coger la cámara y aplicar lo que aprendes.',
    ],
  } },
  { id: 'testimonios', type: 'testimonials', data: {
    eyebrow: 'Lo que dicen', headline: 'Resultados de quienes ya lo aplican',
    items: [
      { quote: 'Llevaba un año pensando en cambiar de cámara. Con el módulo de luz y el de edición mis Reels dieron un salto que no había conseguido en meses. No me he gastado un euro en equipo nuevo.', author: 'Creador de contenido · 8k seguidores' },
      { quote: 'Grabé el videoclip de mi último single yo solo con el móvil siguiendo lo que enseña Adrian. La discográfica pensó que lo había pagado a una productora.', author: 'Artista urbano independiente' },
      { quote: 'Tengo una tienda online y ahora grabo yo los vídeos de producto. Han subido las ventas y me ahorro lo que pagaba a una agencia.', author: 'Pequeña marca de moda' },
    ],
  } },
  { id: 'oferta', type: 'content', data: {
    eyebrow: 'Acceso completo', headline: 'Todo lo que te llevas hoy',
    product_label: 'Curso · De cero a vídeos que parecen profesionales',
    stack: [
      'Los 9 módulos completos, paso a paso',
      'Todos los bonus (equipo, LUTs, checklist, recursos…)',
      '1er año de comunidad y feedback incluido',
      'Actualizaciones y nuevas clases de por vida',
      'Acceso de por vida al contenido, desde cualquier dispositivo',
    ],
    price: '197', price_anchor: '297', price_note: 'Pago único · sin suscripciones ocultas',
    cta: 'Empezar ahora', microcopy: 'Acceso inmediato · Garantía de 14 días',
  } },
  { id: 'garantia', type: 'content', data: {
    title: 'Garantía de 14 días sin riesgo',
    body: 'Entra, mira el curso y aplica lo que enseño en tus vídeos. Si en 14 días sientes que no te ha aportado nada, me escribes y te devuelvo el 100 %. El riesgo lo asumo yo, no tú.',
  } },
  { id: 'faq', type: 'faq', data: {
    eyebrow: 'Preguntas frecuentes',
    items: [
      { q: '¿Me sirve si solo tengo el móvil?', a: 'Sí, y es precisamente el punto. Todo lo que enseño está pensado para aplicarse con lo que ya tienes, empezando por el móvil. La técnica es la misma; solo cambia la herramienta.' },
      { q: '¿Necesito comprar equipo para hacer el curso?', a: 'No. De hecho, uno de los objetivos es que dejes de pensar que la solución es comprar. Te dejo una guía de equipo por presupuesto por si algún día quieres dar el paso, pero no necesitas nada para empezar.' },
      { q: 'Soy principiante total, ¿voy a poder seguirlo?', a: 'Está diseñado para eso. Explico cada concepto de forma sencilla y aplicable desde el primer día, sin tecnicismos innecesarios. Empezamos desde cero.' },
      { q: '¿Cuánto tiempo necesito?', a: 'El que tú quieras. El acceso es de por vida y los módulos son directos al grano. Puedes verlo a tu ritmo y volver a cualquier lección cuando la necesites.' },
      { q: '¿Es un curso de edición o de cámara?', a: 'Es las dos cosas y ninguna. No es un curso de un programa concreto ni de un modelo de cámara: es un curso para que tus vídeos dejen de parecer amateur, uses lo que uses.' },
      { q: '¿Y si no me convence?', a: 'Tienes 14 días de garantía. Si no es para ti, te devuelvo el dinero íntegro. Así de simple.' },
    ],
  } },
  { id: 'cta-final', type: 'cta-banner', data: {
    eyebrow: 'El problema nunca fue tu cámara', headline_pre: 'Deja de grabar vídeos que parecen', headline_accent: 'amateur',
    support: 'Ya tienes el equipo. Solo te falta saber usarlo. Y eso puedo enseñártelo hoy.',
    cta: 'Quiero mis vídeos a otro nivel', price: '197',
    microcopy: 'Acceso de por vida · Garantía de 14 días · Empieza ahora mismo',
    ps: 'P.D.: La mayoría de gente seguirá creyendo que necesita una cámara mejor y seguirá grabando vídeos que parecen caseros. Tú puedes seguir en ese grupo… o aprender de una vez lo que de verdad marca la diferencia. Con 14 días de garantía, lo único que puedes perder es ese aire amateur.',
  } },
  { id: 'seo', type: 'seo', data: {
    seo_title: 'Adrian Grooves — Curso de vídeo profesional con el equipo que ya tienes',
    seo_description: 'Aprende a hacer vídeos profesionales con tu móvil o cámara. La metodología de rodajes reales de Adrian Grooves (Natos y Waor, YSY A, C.R.O.).',
  } },
]

async function main() {
  // 1. project (create if missing)
  let proj = (await fetch(`${URL_}/rest/v1/projects?slug=eq.${SLUG}&select=id,client_slug,api_key`, { headers: H }).then((r) => r.json()))[0]
  if (!proj) {
    const api_key = `sk_${crypto.randomBytes(32).toString('hex')}`
    const res = await fetch(`${URL_}/rest/v1/projects`, {
      method: 'POST', headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify({ name: 'Adrian Grooves', slug: SLUG, client_slug: SLUG, api_key, domain: null }),
    })
    proj = (await res.json())[0]
    if (!proj) throw new Error('project create failed')
    console.log('created project adrian-grooves')
  } else {
    console.log('project adrian-grooves already exists')
  }

  // 2. home page (upsert by slug within project)
  const existing = (await fetch(`${URL_}/rest/v1/pages?project_id=eq.${proj.id}&slug=eq.home&select=id`, { headers: H }).then((r) => r.json()))[0]
  const row = {
    project_id: proj.id, client_slug: proj.client_slug,
    section_id: `page-home-${crypto.randomBytes(4).toString('hex')}`,
    title: 'Home', slug: 'home', status: 'published', sections_json: SECTIONS,
  }
  if (existing) {
    await fetch(`${URL_}/rest/v1/pages?id=eq.${existing.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ sections_json: SECTIONS }) })
    console.log('updated home page sections')
  } else {
    const r = await fetch(`${URL_}/rest/v1/pages`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(row) })
    const body = await r.json()
    if (!r.ok) throw new Error(JSON.stringify(body))
    console.log('seeded home page with', SECTIONS.length, 'sections')
  }

  console.log('\nAPI KEY (set as SF_CMS_API_KEY in Vercel):', proj.api_key)
}
main()
