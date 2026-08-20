/**
 * Hardcoded fallback copy for the home page — the "flat-fields" shape this
 * mirrors 1:1 in SF-CMS (project: discoolver, page slug: app-home, section id:
 * "content", type: flat-fields). Every key here is a candidate CMS field.
 * scripts/fetch-cms-content.mjs bakes CMS overrides into content/pages.json
 * at build time; lib/cms-pages.ts#mergeContent() merges them over this
 * object so a CMS outage (or an empty field) never breaks the page — the
 * hardcoded value here always renders.
 *
 * REESCRITO 2026-08-10 (repaso de negocio + decisiones del CEO):
 * - La plataforma está VIVA en https://app.discoolver.com — la landing deja de
 *   vender una espera y pasa a ser la puerta: cada sección enlaza a su
 *   contrapartida real (/map, /plan-my-trip, /calendar, /search, /wishlist).
 * - Cero cifras inventadas. Todos los números salen del corte de producción
 *   del 2026-08-06 (tarjetas listas = viva + STATE=4 + foto + categoría):
 *   Madrid 858 · Barcelona 182 · Ronda 165 · Punta Cana 128 · Málaga 107 ·
 *   Santo Domingo 75 · Aranjuez 64 · Ibiza 50 → 1.629 en total (sin el cajón
 *   "Filipinas"). Por categoría: Restaurantes 367 · Ocio y eventos 262 ·
 *   Alojamiento 237 · Compras 217 · Qué ver 216 · Fiesta 199.
 * - PROHIBIDO reintroducir (regla del CEO): "No es una guía. No es un blog.",
 *   plazas por ciudad, contadores de lista, nº de curators inventado,
 *   ratings/reseñas/precios inventados, "12 ciudades activas".
 * - El countdown cuenta el lanzamiento de ciudades (Countdown.tsx), no una app.
 */
export const defaultAppHomeContent = {
  // Hero — reescrito 19-ago-2026 (brief del CEO).
  //
  // hero_eyebrow y hero_stat1/2_num NO son copy: los reescribe
  // lib/platform-stats.ts con el dato vivo de api.discoolver.com. Lo que hay
  // aquí es solo el valor de emergencia si la API no contesta.
  //
  // {sitios} en hero_sub lo sustituye el mismo número maestro de la barra.
  //
  // PALABRAS PROHIBIDAS en copy visible: "curado/curada/curaduría/curamos",
  // "vibra", "elegido a mano". Se dicen con verbos: revisamos, elegimos,
  // publicamos.
  hero_eyebrow: "Madrid · Barcelona · Ibiza — ya abiertas",
  hero_title_line1: "Lo mejor de las redes,",
  hero_title_line2: "elegido por editores.",
  hero_sub:
    "Miles de sitios se recomiendan cada día en las redes. Nosotros los revisamos uno a uno y publicamos los que valen la pena. {sitios} hasta hoy, en mapa, rutas y calendario.",
  hero_stat1_num: "+1.300",
  hero_stat1_label: "sitios publicados",
  hero_stat2_num: "3",
  hero_stat2_label: "ciudades abiertas",
  hero_stat3_num: "Los 10 mejores",
  hero_stat3_label: "creadores por ciudad",
  hero_stat4_num: "0",
  hero_stat4_label: "recomendaciones patrocinadas",
  hero_social_count: "",
  hero_social_label: "",
  hero_social_live: "",
  hero_visual_pill: "● Madrid · ahora mismo",
  hero_visual_title: "Cool Map · el mapa de la ciudad",

  // Ticker — inventario real por ciudad, nada de plazas
  ticker_1: "Madrid · sitios publicados",
  ticker_2: "Cine Doré · Arte y Cultura",
  ticker_3: "Barcelona · sitios publicados",
  ticker_4: "1862 Dry Bar · Vida nocturna",
  ticker_5: "Ibiza · sitios publicados",
  ticker_6: "Acinipo · Arte y cultura",
  ticker_7: "",
  ticker_8: "La Croquetta · Restaurantes",
  ticker_9: "",
  ticker_10: "",

  // Categorías — copy del CEO (19-ago-2026).
  //
  // "Territorios" es la palabra de superficie SOLO en la home. En /search, en
  // la base de datos, en las guías y en las fichas se sigue diciendo
  // "categorías": no renombrar el modelo de datos ni la navegación.
  //
  // El argumento de los editores y el criterio ya lo carga el hero. El trabajo
  // de esta sección es dar ganas de entrar, no repetirlo.
  categories_eyebrow: "Los ocho territorios",
  categories_title: "Toda la ciudad,",
  categories_title_highlight: "ordenada.",
  categories_lead: "Ocho territorios. La ciudad que ya conocen los de dentro.",
  categories_cta: "Entrar y explorar",
  cat8_restaurantes_name: "Restaurantes y cafés",
  cat8_restaurantes_desc: "Dónde come la gente de aquí, del mediodía a la sobremesa larga.",
  cat8_nightlife_name: "Vida nocturna",
  cat8_nightlife_desc: "Copas, música y las zonas que se despiertan cuando cierra todo lo demás.",
  cat8_cultura_name: "Arte y cultura",
  cat8_cultura_desc: "Museos, arquitectura y lo que hay detrás de cada barrio.",
  cat8_experiencias_name: "Experiencias y eventos",
  cat8_experiencias_desc: "Lo que solo pasa esta semana, y lo que hay que reservar antes.",
  cat8_compras_name: "Compras y moda",
  cat8_compras_desc: "Tiendas con criterio, vintage y lo que no está en la calle principal.",
  cat8_alojamiento_name: "Alojamiento",
  cat8_alojamiento_desc: "Dónde dormir según a qué vengas: hoteles, boutique y casas con historia.",
  cat8_wellness_name: "Bienestar y belleza",
  cat8_wellness_desc: "Spa, cuidado y los sitios donde la ciudad baja el ritmo.",
  cat8_naturaleza_name: "Naturaleza y aire libre",
  cat8_naturaleza_desc: "Parques, rutas y el campo que empieza donde acaba el asfalto.",

  cat_1_name: "Restaurantes y cafés",
  cat_1_highlight: "sabores",
  cat_1_count: "367 sitios",
  cat_2_name: "Qué",
  cat_2_highlight: "ver",
  cat_2_count: "216",
  cat_3_name: "Ocio y",
  cat_3_highlight: "eventos",
  cat_3_count: "262",
  cat_4_name: "Night",
  cat_4_highlight: "life",
  cat_4_count: "199 sitios",
  cat_5_name: "Compras",
  cat_5_count: "217",
  cat_6_name: "Alojamiento",
  cat_6_count: "237",

  // Bloque magenta — copy del CEO (19-ago-2026). Estructura intacta: eyebrow,
  // H2 y cuatro bullets con check. Cada bullet abre con su beneficio, que vive
  // en su propio campo `_lead` para que el CMS no tenga que llevar marcado.
  //
  // Fuera: la cita anónima (sin firma, y los testimonios tendrán sección
  // propia), "Curación humana" y "Recomendaciones curadas" (vocabulario
  // prohibido y, además, repetían el H1 del hero).
  travel_brain_eyebrow: "Cómo se usa",
  travel_brain_badge: "◉ En vivo · app.discoolver.com",
  travel_brain_title_1: "Del scroll infinito a",
  travel_brain_title_highlight: "un plan cerrado.",
  travel_brain_bullet_1_lead: "Todo en un sitio.",
  travel_brain_bullet_1: "Mapa, ruta y calendario. Sin quince pestañas abiertas.",
  travel_brain_bullet_2_lead: "Se adapta a ti.",
  travel_brain_bullet_2: "Dinos tus fechas y a qué vienes, y la ciudad se reordena.",
  travel_brain_bullet_3_lead: "Sitios con historia.",
  travel_brain_bullet_3: "Azoteas, cenas escondidas y bares que no salen en Google.",
  travel_brain_bullet_4_lead: "Guardas y compartes.",
  travel_brain_bullet_4: "Tus listas te esperan en el móvil cuando llegas.",

  // Herramientas — copy del CEO (19-ago-2026). El mensaje nuevo es que las
  // cuatro son GRATIS: la home no lo decía en ningún sitio y, con las guías a
  // 14€/29€ más abajo, el visitante daba por hecho que la plataforma se pagaba.
  //
  // Regla de marca: ningún nombre de producto en inglés viaja sin su descriptor
  // en español al lado. Y los cuatro CTA son distintos y prometen el resultado.
  //
  // La etiqueta "requiere cuenta" solo la lleva Colecciones: es la única de las
  // cuatro que topa con muro de login (comprobado en producción).
  how_it_works_eyebrow: "Gratis con tu cuenta",
  how_it_works_title_1: "Cuatro herramientas.",
  how_it_works_title_highlight: "Ninguna de pago.",
  how_it_works_lead:
    "Entra con tu email y son tuyas: planifica, guarda y vuelve cuando quieras. Tus viajes se quedan guardados.",
  how_it_works_cta: "Entrar gratis",
  herramientas_cuenta: "Requiere cuenta",
  herramientas_pie: "Cuenta gratuita, sin tarjeta. Las guías editoriales se venden aparte.",
  step_1_title: "Cool Map",
  step_1_descriptor: "el mapa",
  step_1_desc:
    "Los sitios buenos, sin el ruido. Filtra por barrio, hora y a qué vas. Navega como quien vive aquí.",
  step_1_cta: "Abrir el mapa",
  step_2_title: "Plan My Trip",
  step_2_descriptor: "tu ruta",
  step_2_desc:
    "Tus fechas, tu presupuesto y a qué vienes. Te montamos la ruta completa en un minuto.",
  step_2_cta: "Montar mi ruta",
  step_3_title: "Smart Calendar",
  step_3_descriptor: "la agenda",
  step_3_desc:
    "Lo que pasa en la ciudad esta semana, con avisos de lo que hay que reservar antes.",
  step_3_cta: "Ver qué pasa",
  step_4_title: "Colecciones",
  step_4_descriptor: "tus listas",
  step_4_desc:
    "Guarda lo que te llame, móntalo en listas y compártelas. Te esperan en el móvil cuando llegues.",
  step_4_cta: "Crear mi lista",

  // Selector de ciudades — sustituye al carrusel de "Sitios publicados".
  // Los nombres de ciudad, los recuentos y los tres sitios de cada portal NO
  // son copy: salen de la API (lib/platform-stats.ts). Aquí solo vive el texto.
  ciudades_eyebrow: "Ciudades abiertas",
  ciudades_title: "Elige por dónde entras.",
  ciudades_lead: "Cada ciudad es un territorio distinto. Ábrelo y mira quién anda dentro.",
  ciudades_sitios: "sitios publicados",
  ciudades_cta: "Entrar en {ciudad}",
  // Sobrescritura editorial de los tres nombres por ciudad, separados por "·".
  // Vacío = mandan los de la base de datos. Existe porque `list_plan` mezcla
  // sitios con fiestas y con pueblos de la provincia.
  ciudad_madrid_destacados: "Museo Thyssen-Bornemisza · Cine Doré · Mercado de San Fernando",
  ciudad_barcelona_destacados: "Mercado de la Boquería · Teatro Tívoli · Mercado Sant Antoni",
  ciudad_ibiza_destacados: "Cala Saladeta · Passeig de Vara de Rey · Santa Gertrudis de Fruitera",
  ciudades_cerrada_vertical: "¿Y TU CIUDAD?",
  ciudades_cerrada_title: "¿Y tu ciudad?",
  ciudades_cerrada_lead: "Abrimos de una en una, cuando sus sitios están revisados.",
  ciudades_cerrada_ciudad: "Tu ciudad",
  ciudades_cerrada_email: "tu@email.com",
  ciudades_cerrada_cta: "Quiero la mía",
  ciudades_cerrada_ok: "Anotada. Te escribimos el día que abra.",
  ciudades_cerrada_error: "No hemos podido guardarlo. Prueba otra vez en un momento.",

  // Mapa — es una PREVISUALIZACIÓN a propósito, no el mapa real: enseña unos
  // pocos recomendados de verdad para dar ganas de abrir la herramienta. El
  // mapa de verdad vive en app.discoolver.com/map y es donde lleva el CTA.
  //
  // Los cinco pines son sitios reales de Madrid repartidos por territorio: la
  // gracia de la muestra es la variedad. El feed `main_post` de la API no vale
  // Mapa — con la sección 5 convertida en portales de ciudad, ESTA es la única
  // sección de la home que enseña sitios reales con nombre. Su trabajo ya no es
  // enseñar una función: es demostrar que el catálogo existe y es bueno.
  //
  // Las categorías de los pines son las OCHO canónicas, las mismas que en la
  // sección de territorios, en las guías y en la plataforma. Antes decían
  // "Gastronomía", "Cultura", "Nightlife" (en inglés) y "Aire libre".
  //
  // Los cinco sitios son reales, publicados y verificables, y están elegidos
  // por variedad de categoría. ⚠️ La frase de la tarjeta de detalle debería
  // salir del campo editorial de la BBDD de Diego: hoy no se puede, la API
  // pública no tiene búsqueda de sitios ni consulta por id (comprobado el
  // 19-ago-2026). Mientras tanto es editable aquí y en el CMS.
  map_eyebrow: "Cool Map — el mapa",
  map_title: "La ciudad,",
  map_title_highlight: "sin",
  map_title_2: "el ruido.",
  map_lead:
    "Filtra por barrio, por categoría y por hora del día: enseña lo que está abierto ahora, no lo que abrió en 2019. Guarda tus pins y compártelos con quien vayas.",
  map_cta: "Abrir el mapa",
  map_pin_1_cat: "Restaurantes y cafés",
  map_pin_1_name: "Mercado de San Fernando",
  map_pin_2_cat: "Arte y cultura",
  map_pin_2_name: "Azotea del Círculo",
  map_pin_3_cat: "Naturaleza y aire libre",
  map_pin_3_name: "Parque del Capricho",
  map_pin_4_cat: "Vida nocturna",
  map_pin_4_name: "Macera Taller",
  map_pin_5_cat: "Arte y cultura",
  map_pin_5_name: "Lavapiés Streetart",
  map_popup_desc: "Vistas de 360º sobre la ciudad y un atardecer que vale la entrada.",

  // Creadores — este bloque vive en la home del VIAJERO. El titular le hablaba
  // a él y las cuatro tarjetas ("Monetizable", "Escalable"…) le hablaban al
  // creador: cambio de interlocutor a mitad del embudo. Ahora las cuatro dicen
  // qué gana el viajero porque detrás hay una persona con nombre; la puerta
  // Creadores — copy del CEO (19-ago-2026). La home es del VIAJERO: aquí se
  // enseña quién hay detrás, no se capta. Todo el argumento de monetización,
  // alcance y seguimiento se ha mudado a /influencers, que es su landing.
  //
  // `creators_refuerzo` solo se pinta cuando exista el dato real de cuántos
  // creadores publican y en cuántas ciudades. Vacío = no se enseña.
  creators_eyebrow: "Top content creators por destinos",
  creators_title_1: "Ellos recomiendan,",
  creators_title_highlight: "tú disfrutas.",
  creators_lead:
    "Los mejores creadores de contenido de cada destino. Nadie paga por aparecer, y nadie recomienda un sitio en el que no ha estado.",
  creators_refuerzo: "Sus recomendaciones ya están publicadas. Cada ficha dice de quién viene.",
  creators_salida:
    "¿Creas contenido sobre tu ciudad? Trabajamos por invitación — cuéntanos qué recomiendas.",
  creators_cta: "Programa de creadores",

  // La próxima ciudad — copy del CEO (19-ago-2026), sin contador.
  //
  // El subtítulo NO promete que la siguiente ciudad la voten los usuarios: la
  // colección de guías ya publica el orden dos secciones más arriba, así que
  // prometer voto se contradiría con solo hacer scroll. Se usa la alternativa
  // que el propio brief daba para ese caso.
  app_soon_eyebrow: "La próxima ciudad",
  app_soon_title_1: "Bangkok está",
  app_soon_title_2: "en camino.",
  app_soon_desc:
    "La primera fuera de España. Nuestros editores ya están dentro, revisando sitio por sitio. Deja tu correo y entras el primer día.",
  app_soon_ciudad: "¿Qué ciudad quieres?",
  app_soon_email: "tu@email.com",
  app_soon_cta: "Pedir mi ciudad",
  app_soon_nota: "Un solo email el día que abra. Nada más.",
  app_soon_ok: "Anotada. Te escribimos el día que abra, y ni un correo más.",
  app_soon_app: "Avísame cuando salga la app",
  app_soon_estados_aria: "Estado de apertura de cada ciudad",
  app_soon_abierta: "Abierta",
  app_soon_sitios: "sitios",
  app_soon_revision: "En revisión editorial",
  app_soon_tu_ciudad: "Tu ciudad",
  app_soon_pidela: "Pídela",
  // Puente a la tienda de guías (componente GuiasBridge). La home no enlazaba
  // Guías — copy del CEO (19-ago-2026). Es la única sección de la home con
  // producto de pago, y el riesgo que controla es contaminar la gratuidad de la
  // plataforma: por eso el precio solo sale dos veces (línea de apoyo y
  // tarjeta) y la nota de "producto aparte" es obligatoria.
  //
  // PROHIBIDO por producción bajo demanda: "edición limitada", "tirada
  // limitada", "ejemplares numerados", "últimas unidades", "stock", "quedan
  // pocas". No hay escasez que vender: lo que distingue a la guía es que la
  // edición es anual y la selección, editorial.
  //
  // "IVA incluido" sale de la home a propósito: vive en /guias y en la ficha.
  shop_eyebrow: "Guías discoolver",
  shop_title_1: "La selección",
  shop_title_highlight: "2026.",
  shop_lead:
    "Lo mejor de todo un año, en tus manos. Los ocho territorios de tu ciudad, con lo mejor de cada uno seleccionado por nuestros editores. Sin buscar, sin filtrar y sin batería.",
  shop_cta: "Quiero la mía",
  shop_price_line: "En digital 14€, o en papel con el digital dentro.",
  shop_price: "Digital 14€ · Papel + digital desde 29€",
  // Estado de cada guía. Ninguna está a la venta todavía: la tienda anuncia
  // Madrid el 1 de septiembre y el resto en otoño. Sin fecha no se enseña
  // precio ni enlace a ficha — no habría nada que ver.
  shop_estado_fecha: "A la venta el 1 de septiembre",
  shop_estado_otono: "Otoño 2026",
  shop_estado_pronto: "Próximamente",
  shop_card_cta: "Ver la guía de {ciudad}",
  shop_arg_1_title: "Objeto, no archivo.",
  shop_arg_1_desc: "Para llevar en el bolso o para regalar.",
  shop_arg_2_title: "Una por año.",
  shop_arg_2_desc: "La edición 2026 recoge este año. La de 2027 será otra.",
  shop_arg_3_title: "Papel con digital dentro.",
  shop_arg_3_desc: "Si compras la física, el PDF viene incluido.",
  shop_aparte: "Las guías son un producto aparte. La plataforma sigue siendo gratis.",

  // FAQ — copy del CEO (19-ago-2026). Ocho preguntas, no siete.
  //
  // Cambios de contenido, no de estilo: el tono directo se mantiene.
  //  · El precio sube al puesto 02: es la duda nº1 de quien llega hasta aquí.
  //  · Entra la 04, «¿quién decide qué entra y qué no?», que es la pregunta
  //    que sostiene todo el posicionamiento y no existía.
  //  · La de ciudades deja de decir «no una promesa de esta página»: la home
  //    SÍ lista ciudades desde que hay portales, así que se contradecía.
  //  · Ninguna fecha de apertura ni de app.
  //
  // ⚠️ La 03 describe el enlace de acceso sin contraseña. Hoy la plataforma no
  // lo tiene (correo+contraseña y Google), así que el texto dice lo que sí
  // ocurre. Cuando Diego exponga el endpoint —y se ponga MAGIC_LINK a true en
  // HeroEntrar.tsx— esta respuesta cambia con él.
  faq_eyebrow: "Preguntas frecuentes",
  faq_title_1: "Antes de que nos",
  faq_title_highlight: "preguntes.",
  faq_lead_pre: "Si no encuentras tu respuesta, escríbenos a",
  faq_lead_email: "hello@discoolver.com",
  faq_lead_post: ". Contestamos en 24-48 h laborables.",
  faq_q1: "¿Qué es discoolver?",
  faq_a1:
    "Una plataforma para descubrir tu ciudad con criterio: los sitios que recomienda quien vive allí, revisados uno a uno por editores antes de publicarse. Mapa, rutas y calendario en app.discoolver.com. Sin rankings de pago y sin trampas para turistas.",
  faq_q2: "¿Cuánto cuesta?",
  faq_a2:
    "La plataforma es gratis. Entras con tu email, sin tarjeta, y exploras sin pagar. Las guías editoriales son un producto aparte: 14€ en digital y desde 29€ en papel, con el digital incluido. Si algún día una parte de la plataforma pasara a ser de pago, lo sabrías antes y sin sorpresas.",
  faq_q3: "¿Cómo entro?",
  faq_a3:
    "Entra en app.discoolver.com y explora: no hace falta cuenta para mirar. Si dejas tu email te reconocemos la próxima vez, y con cuenta gratuita puedes guardar sitios y armar tus listas.",
  faq_q4: "¿Quién decide qué entra y qué no?",
  faq_a4:
    "Un editor. Los creadores locales proponen los sitios que conocen, y un editor los revisa antes de publicarlos: comprueba que sigue abierto, que encaja en su territorio y que merece el viaje. Los que no convencen no entran. Nadie paga por aparecer, ni negocio ni marca.",
  faq_q5: "¿En qué ciudades funciona?",
  faq_a5:
    "Abrimos de una en una, cuando los sitios de esa ciudad están revisados. La lista actualizada está siempre en app.discoolver.com. ¿La tuya no está? Déjanos tu email y te avisamos el día que abra.",
  faq_q6: "¿Y la app del móvil?",
  faq_a6:
    "La web ya funciona en el móvil sin descargar nada. La app nativa llegará, pero no ponemos fecha hasta tenerla: apúntate y recibes el aviso el día que salga.",
  faq_q7: "Soy creador local, ¿cómo participo?",
  faq_a7:
    "Trabajamos por invitación: tus recomendaciones se publican editadas y firmadas con tu nombre, con seguimiento de lo que generan. Cuéntanos qué recomendarías desde la sección de creadores.",
  faq_q8: "Soy negocio o ayuntamiento, ¿hay algo para mí?",
  faq_a8:
    "Sí: discoolver 360, para destinos, alojamientos y agencias. Son herramientas para tu propia web y tus propios datos — no compran posiciones en el catálogo público, que no está en venta. Te lo enseñamos funcionando con tus datos delante en media hora: escríbenos desde /360 o a info@discoolver.com.",

  // Cierre — copy del CEO (19-ago-2026). Un cierre cierra, no resume: el
  // párrafo anterior repetía literalmente el hero y volvía a nombrar ciudades a
  // mano. Ahora el eyebrow las saca de base de datos y el cuerpo son dos frases.
  //
  // La frecuencia de apertura sale del eyebrow: nadie ha comprometido «una
  // ciudad al mes» y prometerlo en el cierre es exactamente el tipo de promesa
  // que este repaso ha estado quitando de la página.
  cta_eyebrow: "Plataforma abierta · {ciudades}",
  cta_title_1: "Tu ciudad,",
  cta_title_1_em: "en serio.",
  cta_title_2: "",
  cta_title_2_em: "",
  cta_title_3: "",
  cta_sub: "Deja de buscar dónde ir. Entra y ve.",
  cta_primary: "Entrar gratis",
  cta_nota: "Sin cuenta, sin tarjeta, sin descargar nada.",
  cta_ciudad: "¿Tu ciudad no está? Avísame cuando abra",
  cta_secondary: "¿Eres negocio o destino? discoolver 360",
  cta_tertiary: "¿Creas contenido? Programa de creadores",
  cta_cities: "",

  // Footer
  footer_brand_desc: "La plataforma para descubrir tu ciudad como nunca antes lo habías hecho.",
  footer_copyright: "Discoolver · Hecho con ♥ desde España",
} as const;

export type AppHomeContent = { -readonly [K in keyof typeof defaultAppHomeContent]: string };
