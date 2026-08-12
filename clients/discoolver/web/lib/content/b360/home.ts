/**
 * Copy de /360 — marca discoolver 360.
 *
 * Generado desde deliverables/copy-360/360.json (workflow de copy, 2026-08-06).
 * Modelo flat-fields, igual que el resto del ecosistema: una sección "content"
 * por página en SF-CMS. Estos valores son el FALLBACK; cuando la página se siembre
 * en el CMS, mergeContent los pisa. Ojo a la regla de web/CLAUDE.md: mergeContent
 * solo recorre las claves del fallback, así que un campo que se borre de aquí queda
 * inerte en el CMS.
 *
 * Los valores con [PENDIENTE: ...] son deliberados: marcan lo que falta y de quién,
 * y la UI los pinta como aviso en vez de publicarlos como si fueran copy bueno.
 */
export const defaultHome360Content = {
  hero_eyebrow: "discoolver 360 · plataforma B2B para turismo",
  hero_title: "Vende el destino. Entiende al visitante. Quédate con los datos.",
  hero_sub:
    "discoolver 360 es la plataforma SaaS todo-en-uno para destinos, alojamientos y agencias que quieren digitalizar, personalizar y monetizar la experiencia del viajero sin desarrollar tecnología propia. Siete módulos que se contratan por separado y funcionan sobre la web que ya tienes.",
  hero_cta_primary_label: "Pedir una demo",
  hero_cta_primary_href: "/360/demo",
  hero_cta_secondary_label: "Ver los 7 módulos y sus precios",
  hero_cta_secondary_href: "#modulos",
  hero_proof:
    "Desplegada en Ronda: más de 200 negocios locales integrados, tótems interactivos, señalética QR y ocho puntos de venta, con contrato en vigor desde 2022. Parte de SEGITTUR y de la red DTI de Destinos Turísticos Inteligentes, acelerada en Costa del Sol Tourism Hub, presente en FITUR y Premio Hospitality 2021 por Plan My Trip en el Digital Enterprise Show.",
  hero_note:
    "Se integra en tu web actual o se despliega como plataforma nueva. Sin desarrollo propio. Sin app obligatoria para el visitante.",
  diferenciales_eyebrow: "Por qué discoolver 360",
  diferenciales_titulo: "Tres cosas que no vas a encontrar en una plataforma genérica",
  dif_1_titulo: "Integración sin fricción",
  dif_1_texto:
    "Los módulos se montan sobre la web que ya tienes o se despliegan como plataforma nueva. Ni desarrollo propio por tu parte, ni migración de tu web, ni una app que el visitante tenga que descargarse para poder comprar.",
  dif_2_titulo: "Los datos son del destino",
  dif_2_texto:
    "Qué busca el visitante, qué compra, cuándo y en qué zona. Cuadro de mando e informes propios para decidir con datos del viajero real y para justificar la inversión ante quien la aprueba, no una muestra agregada que te presta un tercero.",
  dif_3_titulo: "Monetización real",
  dif_3_texto:
    "Marketplace y punto de venta propios. El tráfico turístico que ya tienes se convierte en ventas para el tejido local, con una comisión del 10-15% sobre lo que se vende en el marketplace y trazabilidad de cada operación.",
  modulos_eyebrow: "Los 7 módulos",
  modulos_titulo: "Siete módulos, un ecosistema, precios públicos",
  modulos_intro:
    "Cada módulo resuelve un problema concreto de gestión y se contrata por separado, siempre en modo suscripción. Estos son los precios de tarifa.",
  modulos_col_1: "Módulo",
  modulos_col_2: "Qué resuelve",
  modulos_col_3: "Precio",
  modulo_1_nombre: "Marketplace",
  modulo_1_resuelve:
    "Tu destino ya recibe visitantes que compran; hoy compran en plataformas que no te devuelven ni un euro ni un dato. El marketplace vende experiencias, entradas, productos y servicios propios y de tus colaboradores (hoteles, comercios, actividades, eventos) en un único escaparate con un único carrito.",
  modulo_1_precio: "750 €/mes",
  modulo_2_nombre: "Software de caja (POS)",
  modulo_2_resuelve:
    "Convierte oficinas de turismo, monumentos y puntos físicos en puntos de venta digitales: cobro, entradas, arqueo y todo el histórico de ventas en el mismo sitio. Se integra en 15 días, sin hardware complejo y sin meses de desarrollo.",
  modulo_2_precio: "495 €/mes + 50 € por punto de venta",
  modulo_3_nombre: "Plan My Trip",
  modulo_3_resuelve:
    "El visitante dice con quién viaja, qué le interesa, cuántos días tiene y qué presupuesto maneja, y recibe una ruta descargable, reservable y compartible. Sirve para repartir el flujo hacia zonas que hoy nadie pisa y para llevar visitantes a negocios que están fuera del circuito. Premio Hospitality 2021 en el Digital Enterprise Show.",
  modulo_3_precio: "150 €/mes",
  modulo_4_nombre: "Calendario inteligente",
  modulo_4_resuelve:
    "La agenda cultural y de eventos del destino en un solo canal, actualizada por quien la gestiona y con venta de entradas integrada. Deja de haber tres calendarios distintos y ninguno al día.",
  modulo_4_precio: "100 €/mes",
  modulo_5_nombre: "Asistente de voz local",
  modulo_5_resuelve:
    "Un asistente de IA entrenado con los contenidos de tu destino que atiende al visitante 24/7, responde preguntas complejas y crea rutas. Descarga a la oficina de turismo fuera de horario y en temporada alta, y te deja un registro de lo que la gente pregunta de verdad.",
  modulo_5_precio: "250 €/mes",
  modulo_6_nombre: "Señalética y tótems",
  modulo_6_resuelve:
    "Tótems interactivos, displays y QR en los puntos donde ya está el visitante, para moverlo desde el punto saturado hacia el resto del destino. Es la pieza que conecta la calle con la plataforma.",
  modulo_6_precio: "100 €/mes de mantenimiento",
  modulo_7_nombre: "Business Intelligence",
  modulo_7_resuelve:
    "Cuadro de mando e informes con toda la data del ecosistema: qué se busca, qué se vende, dónde, cuándo y en qué zonas. Es lo que llevas al pleno, al patronato o al consejo cuando toca justificar la inversión.",
  modulo_7_precio: "Incluido con cualquier módulo",
  modulos_nota:
    "El coste del hardware de tótems y displays se presupuesta aparte del mantenimiento y se cierra en la propuesta, según formato y número de puntos.",
  inversion_eyebrow: "Lo que cuesta, dicho entero",
  inversion_titulo: "Antes de que lo preguntes en la demo",
  inversion_intro:
    "Preferimos que la conversación de precio empiece resuelta. Esto es todo lo que hay.",
  inversion_1_valor: "1.845 €/mes",
  inversion_1_titulo: "El stack completo",
  inversion_1_texto:
    "Es la suma de los siete módulos a tarifa base; cada punto de venta físico añade 50 €/mes. Casi nadie empieza aquí: la entrada habitual es un módulo, entre 100 y 750 €/mes — de 1.200 a 9.000 € al año, para dimensionar la partida — y el cuadro de mando entra incluido desde el primero.",
  inversion_2_valor: "10-15%",
  inversion_2_titulo: "Comisión sobre marketplace",
  inversion_2_texto:
    "Además de la suscripción, la plataforma se lleva entre un 10% y un 15% de las ventas que pasan por el marketplace. Solo sobre lo vendido: si no hay venta, no hay comisión. El porcentaje concreto se fija en el contrato.",
  inversion_3_valor: "Caso a caso",
  inversion_3_titulo: "La tarifa se ajusta por volumen, no por regateo",
  inversion_3_texto:
    "El precio de esta página es la tarifa de referencia, la que se usa para dimensionar una partida. Cambia por criterios objetivos y verificables — número de módulos, puntos de venta y duración del contrato — y el criterio aplicado queda escrito en la propuesta. No hay precio de amigo ni tarifa que dependa de quién pregunte.",
  inversion_nota:
    "Suscripción anual con facturación mensual, sin permanencia añadida: se renueva —o no— cada año, con 60 días de preaviso. Y si te vas, te llevas un export completo de tus datos.",
  eco_eyebrow: "Cómo se empieza",
  eco_titulo: "Cada uno funciona solo. Juntos, son un ecosistema.",
  eco_intro:
    "Nadie contrata siete módulos de golpe y nosotros no lo pedimos. Se empieza por uno, el que resuelva el problema que más te está costando ahora.",
  paso_1_titulo: "Empieza por el que te duele",
  paso_1_texto:
    "Si el problema es que el destino no ingresa nada de lo que gasta el visitante, se empieza por marketplace. Si es la caja de la oficina de turismo y los monumentos, por el POS. Si es la masificación de una zona concreta, por Plan My Trip y señalética.",
  paso_2_titulo: "Suma el siguiente cuando el primero rinde",
  paso_2_texto:
    "Los módulos comparten catálogo, ficha de negocio y usuarios. Añadir el segundo no es un proyecto nuevo: es activar una pieza sobre lo que ya está montado y cargado.",
  paso_3_titulo: "El cuadro de mando entra desde el día uno",
  paso_3_texto:
    "Business Intelligence va incluido con cualquier módulo. Aunque contrates uno solo, desde el primer mes tienes datos propios del destino, no impresiones.",
  eco_cierre:
    "Cuanto más ecosistema, más completo es el dato: cada módulo nuevo alimenta el mismo cuadro de mando.",
  caso_eyebrow: "Despliegue real · Ronda",
  caso_titulo: "En Ronda la plataforma lleva años funcionando en la calle",
  caso_contexto:
    "El punto de partida es el de tantos cascos históricos: la actividad concentrada en el entorno del Puente Nuevo y cientos de negocios locales que existían pero no aparecían en el recorrido del visitante. El encargo no fue hacer una guía de la ciudad: fue desplegar la plataforma del destino.",
  caso_bullet_1: "Más de 200 negocios y propuestas locales integrados en la plataforma",
  caso_bullet_2: "Tótems interactivos y señalética QR en puntos clave de la ciudad",
  caso_bullet_3: "Ocho puntos de venta operativos con el software de caja",
  caso_bullet_4: "Venta cruzada con hoteles del destino",
  caso_dato_1_valor: "200+",
  caso_dato_1_label: "Negocios locales integrados",
  caso_dato_2_valor: "8",
  caso_dato_2_label: "Puntos de venta",
  caso_dato_3_valor: "2022",
  caso_dato_3_label: "Inicio del despliegue",
  caso_dato_4_valor: "4 años",
  caso_dato_4_label: "De contrato en vigor sin interrupción, desde 2022",
  caso_estado: "Ronda es cliente de pago y el despliegue sigue en producción.",
  caso_segundo:
    "El proyecto además forma parte de SEGITTUR y de la red DTI de Destinos Turísticos Inteligentes, pasó por el programa de aceleración Costa del Sol Tourism Hub y se ha presentado en FITUR.",
  caso_cita:
    "«discoolver ha sido parte esencial en la transformación digital de nuestra ciudad.» — Turismo de Ronda",
  vert_eyebrow: "Dos puertas de entrada",
  vert_titulo: "Dime quién eres y te enseño lo tuyo",
  vert_intro:
    "La plataforma es la misma, pero lo que resuelve cambia según quién la contrate.",
  vert_1_etiqueta: "Destinos",
  vert_1_frase: "Diriges un patronato, una concejalía de turismo o una DMO.",
  vert_1_texto:
    "Tienes visitantes, comercio local invisible fuera de la zona saturada y ningún dato propio con el que decidir. Aquí el objetivo es redistribuir el flujo, digitalizar la oficina de turismo y convertir el tráfico en ingresos para el tejido local.",
  vert_1_cta_label: "Ver la plataforma para destinos",
  vert_1_cta_href: "/360/destinos",
  vert_2_etiqueta: "Alojamientos",
  vert_2_frase: "Gestionas un hotel, un hostal o una red de apartamentos.",
  vert_2_texto:
    "Tu huésped pregunta qué hacer y la respuesta hoy es un mapa de papel o una recepción saturada. Aquí el objetivo es convertir tu establecimiento en el alma del viaje: recomendaciones propias, concierge digital 24/7 y una nueva línea de ingresos por lo que vendes de la zona.",
  vert_2_cta_label: "Ver la plataforma para alojamientos",
  vert_2_cta_href: "/360/alojamientos",
  vert_3_etiqueta: "Agencias",
  vert_3_frase: "Produces y comercializas experiencias en destino para terceros.",
  vert_3_texto:
    "[PENDIENTE: propuesta de valor, alcance y modelo de precio para agencias y receptivos. No existe material aprobado ni caso de referencia en esta vertical — CEO. No se publica esta tarjeta hasta tenerlo.]",
  vert_3_cta_label: "Ver la plataforma para agencias",
  vert_3_cta_href: "/360/agencias",
  faq_titulo: "Lo que preguntan siempre",
  faq_1_p: "¿Cuánto me va a costar de verdad?",
  faq_1_r:
    "Los precios de la tabla son de tarifa y son públicos. Los siete módulos juntos suman 1.845 €/mes a tarifa base, más 50 €/mes por cada punto de venta físico. A la suscripción se le añade una comisión del 10-15% sobre las ventas que pasen por el marketplace, y solo sobre lo vendido. Hay clientes con condiciones negociadas por debajo de tarifa según alcance, puntos de venta y plazo, así que la cifra final sale de la propuesta, no de esta página.",
  faq_2_p: "¿Tengo que rehacer mi web o montar un desarrollo?",
  faq_2_r:
    "No. Los módulos se integran en la web que ya tienes o se despliegan como plataforma nueva si prefieres empezar de cero. No necesitas equipo técnico propio ni migrar tu web actual.",
  faq_3_p: "¿El visitante tiene que descargarse una app?",
  faq_3_r:
    "No. Todo funciona en navegador, desde tu web, desde un QR o desde un tótem. La app existe, pero no es requisito para comprar, planificar ni consultar.",
  faq_4_p: "¿De quién son los datos que se generan?",
  faq_4_r:
    "Del destino o del negocio que contrata. El dato sale de la interacción real del público con la plataforma —búsquedas, rutas, compras, uso de tótems— y se te devuelve en un cuadro de mando y en informes. Y si el contrato termina, te llevas un export completo: los datos siguen siendo tuyos.",
  faq_5_p: "¿Puedo contratar un solo módulo?",
  faq_5_r:
    "Sí, y es lo habitual. Cada módulo funciona solo, en modo suscripción, y el Business Intelligence va incluido desde el primero. Se añaden los siguientes cuando el primero está rindiendo.",
  faq_6_p: "¿Cuánto se tarda en tenerlo funcionando?",
  faq_6_r:
    "El software de caja se integra en 15 días: se conecta a tu catálogo y opera, sin hardware complejo. El resto de módulos se dimensiona en la propuesta según el catálogo a cargar — te damos fecha cerrada ahí, no antes.",
  faq_7_p: "¿A quién más le está funcionando esto?",
  faq_7_r:
    "Ronda es el despliegue de referencia: más de 200 negocios locales integrados, tótems, señalética QR y ocho puntos de venta, con contrato en vigor desde 2022. El proyecto forma parte de SEGITTUR y de la red DTI de Destinos Turísticos Inteligentes, pasó por la aceleradora Costa del Sol Tourism Hub, tiene acuerdos con ICEX e ITH y se ha presentado en FITUR. En la demo te enseñamos el despliegue de Ronda en vivo con sus datos reales de venta — los enseñamos en directo, no los publicamos.",
  faq_8_p: "¿Qué tiene que hacer el comercio local para estar dentro? ¿Paga por aparecer?",
  faq_8_r:
    "No paga. Ningún negocio paga a discoolver por salir en la plataforma de su destino, ni por aparecer más arriba en una ruta o en un listado: aquí no se venden posiciones. Quien contrata es el destino, el alojamiento o la agencia, y lo que contrata es tecnología. Quién entra en el marketplace y con qué criterio lo decide el destino, no nosotros, y el alta del tejido local es parte del despliegue, no un proyecto aparte — la carga inicial del catálogo la hace discoolver. Lo único que se cobra es la comisión del 10-15% sobre una venta efectivamente cerrada: si no hay venta, no hay cobro. Es la misma regla que aplicamos en la marca de viajero de discoolver, donde tampoco existen rankings de pago.",
  faq_9_p: "Somos administración pública. ¿Cómo se contrata esto?",
  faq_9_r:
    "Como servicio en suscripción anual con facturación mensual — gasto corriente, no inversión ni desarrollo a medida: no hay activo tecnológico que amortizar. Los importes por módulo son públicos y están en esta página, así que la partida se dimensiona en euros por ejercicio antes de sentarte con nosotros. Ya operamos con administración pública — Ronda es cliente en vigor desde 2022 — y acompañamos al organismo en la preparación de la documentación técnica y económica que requiera su procedimiento. La vía concreta de tramitación la determina tu órgano de contratación con el objeto y el importe delante; si necesitas el encaje en tu expediente, dínoslo en la demo y te lo mandamos por escrito.",
  faq_10_p: "¿En qué idiomas atiende al visitante?",
  faq_10_r:
    "La plataforma del viajero funciona hoy en castellano, inglés y francés. Si tu destino necesita otra lengua — cooficial o de mercado emisor — dínoslo en la demo: es de las primeras cosas que se dimensionan en la propuesta.",
  cta_eyebrow: "Siguiente paso",
  cta_titulo: "Media hora, tu destino sobre la mesa",
  cta_texto:
    "Una demo de 30 minutos, sin compromiso, con la plataforma funcionando y el despliegue de Ronda abierto. Salimos de ahí con una propuesta de por qué módulo empezar en tu caso y qué cuesta.",
  cta_boton_label: "Pedir una demo",
  cta_boton_href: "/360/demo",
  cta_reaseguro:
    "Te responde alguien del equipo, no un formulario automático. Si prefieres escribir antes, también vale.",
  cta_email: "info@discoolver.com",
  cta_telefono: "Consultas por WhatsApp · (+66) 83 829 1723",
  cta_direccion: "C/ María de Molina 39, 28006 Madrid",
} as const;

export type Home360Content = { -readonly [K in keyof typeof defaultHome360Content]: string };
