/**
 * Copy de /360/destinos — marca discoolver 360.
 *
 * Generado desde deliverables/copy-360/360-destinos.json (workflow de copy, 2026-08-06).
 * Modelo flat-fields, igual que el resto del ecosistema: una sección "content"
 * por página en SF-CMS. Estos valores son el FALLBACK; cuando la página se siembre
 * en el CMS, mergeContent los pisa. Ojo a la regla de web/CLAUDE.md: mergeContent
 * solo recorre las claves del fallback, así que un campo que se borre de aquí queda
 * inerte en el CMS.
 *
 * Los valores con [PENDIENTE: ...] son deliberados: marcan lo que falta y de quién,
 * y la UI los pinta como aviso en vez de publicarlos como si fueran copy bueno.
 */
export const defaultDestinos360Content = {
  hero_eyebrow: "Para ayuntamientos, patronatos de turismo y DMO",
  hero_title:
    "El flujo se concentra en cuatro calles y el dato del visitante no es tuyo",
  hero_sub:
    "discoolver es la plataforma SaaS que un ayuntamiento, un patronato o una DMO contrata por módulos para redistribuir el flujo de visitantes, tener datos propios del viajero y convertir el tráfico turístico en ingresos para el tejido local. Se integra en la web que ya tienes. Sin desarrollo propio. Sin app obligatoria.",
  hero_cta_label: "Solicitar una demo de 30 minutos",
  hero_cta_sub:
    "Sin compromiso. En la demo se enseña el cuadro de mando y cómo quedaría cada módulo en la web de tu destino.",
  hero_stat_1_val: "2019",
  hero_stat_1_label: "Operando desde",
  hero_stat_2_val: "200+",
  hero_stat_2_label: "Negocios locales integrados en Ronda",
  hero_stat_3_val: "7",
  hero_stat_3_label: "Módulos contratables por separado",
  hero_stat_4_val: "2021",
  hero_stat_4_label: "Premio Hospitality, Digital Enterprise Show",
  problema_eyebrow: "El problema",
  problema_title: "Lo que no se mide no se defiende en un pleno",
  problema_lead:
    "Los cuatro síntomas que aparecen siempre que un destino crece en visitantes sin crecer en herramientas propias.",
  problema_1_title: "El flujo se concentra",
  problema_1_text:
    "El visitante repite el mismo recorrido corto entre los tres o cuatro hitos de siempre. El resto del municipio queda fuera de su mapa mental, con la presión concentrada en unas pocas calles y el resto del término sin apenas retorno.",
  problema_2_title: "El dato del visitante lo tiene otro",
  problema_2_text:
    "Las búsquedas, las reseñas y las reservas ocurren en plataformas generalistas. El destino recibe agregados de terceros cuando le interesa al tercero, nunca el comportamiento real de quien está pisando sus calles esta mañana.",
  problema_3_title: "El comercio local es invisible",
  problema_3_text:
    "Los negocios fuera del circuito principal no tienen presencia digital propia y dependen del ranking de una plataforma que no controlan. Nadie los pone en la ruta del viajero, así que para el viajero no existen.",
  problema_4_title: "El gasto en destino se escapa",
  problema_4_dato: "Sin capturar",
  problema_4_text:
    "El gasto del viajero se desplaza cada año hacia los servicios locales en destino — actividades, restauración, experiencias — y cada vez menos hacia el transporte y la cama. Sin herramientas propias, el destino ni captura ni mide ese gasto: se reparte fuera del tejido local.",
  problema_4_fuente: "",
  plataforma_eyebrow: "Qué hace por el destino",
  plataforma_title: "No es una app para el turista. Es infraestructura para el destino",
  plataforma_claim:
    "La única plataforma SaaS todo-en-uno pensada desde el primer día para destinos turísticos",
  plataforma_lead:
    "Marketplace, punto de venta, planificador de rutas, calendario de eventos, asistente de voz, señalética e inteligencia de negocio en un solo ecosistema. Cada módulo funciona solo. Juntos, cubren el ciclo completo del visitante en tu destino.",
  plataforma_1_title: "Redistribuye el flujo de visitantes",
  plataforma_1_text:
    "El planificador de rutas y la señalética llevan al visitante a zonas y negocios que hoy no pisa, en función de sus intereses y del tiempo que tiene. El destino decide qué se recomienda y desde dónde.",
  plataforma_2_title: "Te devuelve el dato del viajero",
  plataforma_2_text:
    "Cada interacción con los módulos del destino alimenta un cuadro de mando propio: qué se busca, por dónde se mueve, qué se reserva, qué eventos tiran. El destino es dueño de esos datos.",
  plataforma_3_title: "Convierte tráfico en ingresos locales",
  plataforma_3_text:
    "Marketplace y punto de venta permiten vender producto propio y producto de comercios, hoteles y actividades de la zona. El visitante que ya está en la ciudad compra dentro del ecosistema del destino.",
  plataforma_4_title: "Digitaliza la oficina de turismo",
  plataforma_4_text:
    "La oficina y los monumentos pasan de informar a vender, con sistema de cobro propio, entradas y venta cruzada. Y con atención al visitante 24/7 mediante un asistente entrenado con los contenidos del destino.",
  modulos_eyebrow: "Módulos y tarifas",
  modulos_title: "Siete módulos. Se contratan por separado",
  modulos_lead:
    "Suscripción mensual, sin inversión inicial en desarrollo. Se empieza por el módulo que resuelve el problema más urgente y se amplía cuando el destino lo decide.",
  modulos_col_1: "Módulo",
  modulos_col_2: "Qué resuelve al destino",
  modulos_col_3: "Tarifa",
  modulo_1_nombre: "Marketplace",
  modulo_1_desc:
    "Venta de servicios turísticos propios y de colaboradores: hoteles, productos y eventos del destino en un solo escaparate.",
  modulo_1_precio: "750 €/mes",
  modulo_2_nombre: "Software de caja (POS)",
  modulo_2_desc:
    "Sistema de cobro para oficinas de turismo, monumentos y puntos físicos. Convierte la oficina en punto de venta.",
  modulo_2_precio: "495 €/mes + 50 € por punto",
  modulo_3_nombre: "Plan My Trip",
  modulo_3_desc:
    "Planificador de rutas por tipología de viajero, duración y presupuesto. Es la herramienta que reparte el flujo fuera del circuito saturado.",
  modulo_3_precio: "150 €/mes",
  modulo_4_nombre: "Calendario inteligente",
  modulo_4_desc:
    "Agenda cultural y de eventos del destino con venta de entradas integrada. Programación y taquilla en el mismo sitio.",
  modulo_4_precio: "100 €/mes",
  modulo_5_nombre: "Asistente de voz local",
  modulo_5_desc:
    "Chatbot con IA entrenado con los contenidos del destino. Atención al visitante 24/7 sin ampliar plantilla.",
  modulo_5_precio: "250 €/mes",
  modulo_6_nombre: "Señalética y tótems",
  modulo_6_desc:
    "Tótems interactivos y puntos QR en enclaves clave. Es el módulo que empuja físicamente al visitante hacia las zonas que el destino quiere activar.",
  modulo_6_precio: "100 €/mes de mantenimiento",
  modulo_7_nombre: "Business Intelligence",
  modulo_7_desc:
    "Cuadro de mando e informes personalizados con toda la información del ecosistema del destino.",
  modulo_7_precio: "Incluido con los módulos",
  modulos_total_label: "Stack completo",
  modulos_total_valor: "1.845 €/mes",
  modulos_nota:
    "Tarifas públicas de módulo, en modo suscripción. El punto de venta añade 50 € por cada punto físico adicional. La inteligencia de negocio va incluida con cualquier combinación de módulos.",
  datos_eyebrow: "Los datos",
  datos_title: "El destino es dueño de sus datos",
  datos_lead:
    "El dato no llega de un informe comprado a un tercero: nace de la interacción real del visitante con los módulos que el destino tiene desplegados. Quien consulta una ruta, quien escanea un QR en un tótem, quien compra una entrada o reserva una actividad. Eso se convierte en un cuadro de mando propio y en informes que se pueden llevar a una junta de gobierno.",
  datos_claim:
    "Si el dato no es tuyo, no puedes usarlo para decidir ni para justificar.",
  datos_bullet_1:
    "Cuadro de mando en tiempo real: zonas activas, rutas más generadas, categorías más buscadas, comportamiento por tipología de visitante.",
  datos_bullet_2:
    "Informes personalizados para memoria de gestión, seguimiento de plan estratégico y justificación de partidas.",
  datos_bullet_3:
    "Serie histórica propia: la comparativa entre temporadas deja de depender de que un tercero siga publicando su informe.",
  datos_mockup_label: "Vista de ejemplo del cuadro de mando",
  datos_bi_nota:
    "La inteligencia de negocio va incluida con los módulos contratados, sin coste adicional. El cuadro de mando en vivo, con los datos reales de Ronda, se enseña en la demo.",
  datos_pendiente: "",
  monetizacion_eyebrow: "Monetización",
  monetizacion_title: "Que el comercio local gane dinero, y el destino también",
  monetizacion_lead:
    "El visitante ya está en la ciudad. La diferencia entre que su gasto se quede en el tejido local o se vaya fuera es tener un canal de venta propio del destino.",
  monetizacion_1_title: "Venta directa del destino",
  monetizacion_1_text:
    "Entradas de monumentos, visitas guiadas, actividades y producto propio se venden desde el marketplace y desde el punto de venta de la oficina de turismo, con cobro integrado.",
  monetizacion_2_title: "El comercio de fuera del circuito, dentro del canal",
  monetizacion_2_text:
    "Comercios, restauración y actividades de la zona entran en el marketplace y en las rutas del planificador. Dejan de depender de una plataforma generalista para ser encontrados.",
  monetizacion_3_title: "Comisión sobre ventas",
  monetizacion_3_dato: "10-15%",
  monetizacion_3_text:
    "Comisión sobre las ventas realizadas en el marketplace. El modelo económico está alineado: si el canal no vende, no genera comisión.",
  monetizacion_claim:
    "El reto del destino es hacer visible lo invisible. Un negocio que no está en la ruta del viajero, para el viajero no existe.",
  monetizacion_nota:
    "En el despliegue de Ronda esto incluyó venta cruzada con hoteles: el alojamiento como punto de entrada a la oferta local del destino.",
  caso_eyebrow: "Caso",
  caso_title:
    "Ronda: de la concentración en el centro a una ruta viva por toda la ciudad",
  caso_contexto_title: "El punto de partida",
  caso_contexto_text:
    "Un destino con una presión de visitantes muy concentrada en su hito más conocido y un tejido de negocios locales fuera de ese circuito que era, a efectos prácticos, invisible para quien llegaba.",
  caso_despliegue_title: "Qué se desplegó",
  caso_despliegue_1:
    "Más de 200 negocios y propuestas locales integrados en la plataforma del destino",
  caso_despliegue_2: "Tótems interactivos en enclaves clave de la ciudad",
  caso_despliegue_3: "Señalética con sistema de QR",
  caso_despliegue_4: "Ocho puntos de venta operativos, incluida la oficina de turismo",
  caso_despliegue_5: "Venta cruzada con hoteles del destino",
  caso_estado: "Ronda es cliente de pago y el despliegue sigue en operación.",
  caso_stat_1_val: "200+",
  caso_stat_1_label: "Negocios locales integrados",
  caso_stat_2_val: "8",
  caso_stat_2_label: "Puntos de venta",
  caso_segundo_title: "Respaldo del sector, no solo un cliente",
  caso_segundo_text:
    "discoolver forma parte de SEGITTUR y de la red DTI de Destinos Turísticos Inteligentes, pasó por el programa de aceleración Costa del Sol Tourism Hub, se ha presentado en FITUR y tiene el Premio Hospitality 2021 del Digital Enterprise Show.",
  caso_respaldo:
    "discoolver ha cerrado acuerdos con SEGITTUR, ICEX, ITH (Instituto Tecnológico Hotelero) y Costa del Sol Tourism Hub.",
  caso_pendiente_1:
    "«Discoolver ha sido parte esencial en la transformación digital de nuestra ciudad.» — Turismo de Ronda",
  caso_pendiente_2: "",
  caso_pendiente_3: "",
  caso_pendiente_4: "",
  integracion_eyebrow: "Integración",
  integracion_title: "Entra en la web que ya tienes",
  integracion_lead:
    "Los módulos se integran en el portal existente del destino o se despliegan como plataforma nueva si el destino lo prefiere. La decisión es del destino, no una imposición del proveedor.",
  integracion_1_title: "Sin desarrollo propio",
  integracion_1_text:
    "No hace falta un equipo técnico municipal ni un contrato de desarrollo a medida. Los módulos llegan operativos y se conectan al portal actual.",
  integracion_2_title: "Sin app obligatoria",
  integracion_2_text:
    "El visitante no tiene que descargarse nada para usar las rutas, el calendario o el asistente. Todo funciona desde el navegador y desde los QR de la señalética.",
  integracion_3_title: "Sin hardware complejo",
  integracion_3_text:
    "El punto de venta se conecta al catálogo de producto local y funciona. Tótems y QR se despliegan sobre puntos ya existentes del destino.",
  integracion_4_title: "Sin proyectos de meses",
  integracion_4_text:
    "El software de caja se integra en 15 días: conectarlo al catálogo de productos locales y empezar a vender.",
  integracion_dato_val: "15",
  integracion_dato_unidad: "días",
  integracion_dato_label: "Puesta en marcha del punto de venta",
  contratacion_eyebrow: "Contratación",
  contratacion_title: "Cómo se contrata y cómo se justifica",
  contratacion_paso_1_title: "Demo de 30 minutos",
  contratacion_paso_1_text:
    "Sesión con el equipo de discoolver sobre el caso concreto del destino. Sin compromiso.",
  contratacion_paso_2_title: "Selección de módulos",
  contratacion_paso_2_text:
    "Se define qué módulos resuelven el problema prioritario y se cierra el alcance. Tarifas públicas por módulo.",
  contratacion_paso_3_title: "Propuesta económica",
  contratacion_paso_3_text:
    "Propuesta en modo suscripción, con el importe mensual desglosado por módulo y por punto de venta.",
  contratacion_paso_4_title: "Integración y formación",
  contratacion_paso_4_text:
    "Los módulos se integran en el portal del destino y el equipo de turismo recibe formación de uso y de gestión de contenidos.",
  contratacion_paso_5_title: "Operación y cuadro de mando",
  contratacion_paso_5_text:
    "Plataforma en marcha, datos del destino fluyendo e informes disponibles desde el primer mes.",
  justificacion_title: "Lo que necesitas para defender la partida",
  justificacion_1:
    "Gasto corriente, no inversión: suscripción mensual por módulo, sin desarrollo a medida ni activos tecnológicos que amortizar.",
  justificacion_2:
    "Importe anual conocido de antemano: 495 €/mes de punto de venta son 5.940 € al año; 750 €/mes de marketplace, 9.000 €. La partida se dimensiona en euros por ejercicio antes de sentarse a negociar, no después de pedir una propuesta.",
  justificacion_3:
    "Alcance modular: se puede empezar por un módulo y ampliar en el ejercicio siguiente, en lugar de comprometer un proyecto completo de una sola vez.",
  justificacion_4:
    "Memoria justificativa con datos propios: la inteligencia de negocio incluida da los informes con los que se justifica el gasto y se mide la política turística.",
  justificacion_5:
    "Impacto en el tejido local demostrable: comercios integrados, puntos de venta activos y ventas por el canal del destino.",
  contratacion_publica_title: "Sobre el encaje en contratación pública",
  contratacion_publica_text:
    "Lo que podemos decirte hoy, y lo decimos entero: es gasto corriente en modo suscripción, no inversión ni desarrollo a medida — no hay activo tecnológico que amortizar ni entregable de obra que recepcionar. Las tarifas son públicas y el importe anual es calculable antes de pedirnos nada. Ya operamos con administración pública: Ronda es cliente en vigor y hay despliegue en Costa del Sol Tourism Hub, además de acuerdos con SEGITTUR, ICEX e ITH. Y preparamos la documentación técnica y económica que requiera tu procedimiento, trabajando con tu servicio de contratación en lugar de mandarte un PDF. Lo que no vamos a decirte en una web es por qué vía concreta debe tramitarse tu expediente: eso lo determina tu órgano de contratación con el objeto y el importe delante, y quien te diga lo contrario en una landing te está vendiendo un problema.",
  faq_title: "Preguntas que salen siempre",
  faq_1_q: "¿De quién son los datos que genera la plataforma?",
  faq_1_a:
    "Del destino. discoolver aporta la tecnología que los recoge y los ordena, pero el cuadro de mando y los informes son del organismo que contrata.",
  faq_2_q: "¿Hay que tirar la web del destino y hacer una nueva?",
  faq_2_a:
    "No. Los módulos se integran en el portal existente. Si el destino prefiere plataforma nueva, también es posible, pero no es un requisito para empezar.",
  faq_3_q: "¿El visitante tiene que descargarse una aplicación?",
  faq_3_a:
    "No. Rutas, calendario, asistente y compra funcionan desde el navegador y desde los QR de la señalética. No hay app obligatoria.",
  faq_4_q: "¿Se puede empezar con un solo módulo?",
  faq_4_a:
    "Sí. Cada módulo funciona por separado y se contrata por separado, con su tarifa pública. La inteligencia de negocio va incluida desde el primer módulo.",
  faq_5_q: "¿Qué necesita mi equipo técnico para ponerlo en marcha?",
  faq_5_a:
    "No hace falta desarrollo propio. El software de caja se integra en 15 días conectándolo al catálogo de producto local, y el equipo de turismo recibe formación para gestionar contenidos sin depender del proveedor.",
  faq_6_q: "¿Qué otros destinos lo tienen desplegado?",
  faq_6_a:
    "Ronda, con más de 200 negocios locales integrados, tótems, señalética QR y ocho puntos de venta. Y Costa del Sol y Málaga, con señalética QR e integración de marketplace dentro del Costa del Sol Tourism Hub.",
  faq_7_q: "¿Cómo encaja esto en un procedimiento de contratación pública?",
  faq_7_a:
    "Como suscripción anual con facturación mensual: gasto corriente con importe público y calculable por ejercicio. El equipo de discoolver acompaña al destino en la preparación de la documentación técnica y económica que requiera su procedimiento — la vía concreta la determina tu órgano de contratación, y el encaje en tu expediente te lo mandamos por escrito tras la demo.",
  cta_title: "Conoce qué puede hacer discoolver por tu destino",
  cta_sub:
    "Treinta minutos con el equipo, sobre el caso concreto de tu destino: qué módulos aplican, qué se integra en la web que ya tienes y qué verías en el cuadro de mando.",
  cta_button: "Agendar una demo",
  cta_reaseguro:
    "Sin compromiso. Un miembro del equipo responde en menos de 24 horas laborables.",
  cta_form_title: "Cuéntanos de qué destino hablamos",
  cta_contacto_email: "info@discoolver.com",
  cta_contacto_direccion: "C/ María de Molina 39, 28006 Madrid",
  cta_pendiente_telefono:
    "(+66) 83 829 1723",
} as const;

export type Destinos360Content = { -readonly [K in keyof typeof defaultDestinos360Content]: string };
