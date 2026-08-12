/**
 * Copy de /360/alojamientos — marca discoolver 360.
 *
 * Generado desde deliverables/copy-360/360-alojamientos.json (workflow de copy, 2026-08-06).
 * Modelo flat-fields, igual que el resto del ecosistema: una sección "content"
 * por página en SF-CMS. Estos valores son el FALLBACK; cuando la página se siembre
 * en el CMS, mergeContent los pisa. Ojo a la regla de web/CLAUDE.md: mergeContent
 * solo recorre las claves del fallback, así que un campo que se borre de aquí queda
 * inerte en el CMS.
 *
 * Los valores con [PENDIENTE: ...] son deliberados: marcan lo que falta y de quién,
 * y la UI los pinta como aviso en vez de publicarlos como si fueran copy bueno.
 */
export const defaultAlojamientos360Content = {
  hero_eyebrow: "Hoteles · Hostales · Redes de apartamentos",
  hero_title: "Tu concierge digital. Y una línea de ingreso por cada recomendación.",
  hero_sub:
    "discoolver entra en el check-in que ya tienes, responde a tu huésped a cualquier hora y te devuelve parte de lo que reserva fuera del alojamiento.",
  hero_cta_primary: "Agendar una demo",
  hero_cta_secondary: "Ver módulos y precios",  // href corregido en page.tsx: #modulos, no #comision
  hero_reassurance:
    "Demo de 30 minutos, sin compromiso. Sin desarrollo propio. Sin app obligatoria para el huésped.",
  problema_eyebrow: "El punto de partida",
  problema_title: "El huésped pregunta y la respuesta la da Google",
  problema_intro:
    "Dónde ceno esta noche, qué hago mañana si llueve, cómo llego al mirador. Son las mismas preguntas todos los días. Hoy las resuelve un buscador, una reseña de TripAdvisor o el turno de recepción que tenga tiempo. El huésped acaba reservando algo que tu alojamiento no ha elegido, en una plataforma que no te devuelve nada.",
  problema_1_titulo: "Recepción responde lo mismo cien veces",
  problema_1_texto:
    "Las recomendaciones viven en la cabeza de tu equipo, en un folio plastificado o en un cajón de folletos. Cambian con cada turno, se quedan desactualizadas y no existen a las dos de la mañana.",
  problema_2_titulo: "El relato de tu entorno lo escribe otro",
  problema_2_texto:
    "Cuando el huésped busca por su cuenta, ve lo que las plataformas genéricas posicionan: lo más masificado, no lo que encaja con él ni con lo que tú quieres que se lleve de la zona.",
  problema_3_titulo: "La venta se cierra fuera y sin retorno",
  problema_3_texto:
    "Cada cena, entrada o excursión que tu huésped reserva es dinero que se mueve gracias a tu alojamiento. Hoy no pasa por ti, no lo ves y no te deja ingreso ni dato.",
  concierge_eyebrow: "Herramientas de descubrimiento",
  concierge_title: "Convierte tu establecimiento en el alma del viaje",
  concierge_lead:
    "Cuatro herramientas que trabajan juntas y que el huésped abre desde el navegador, sin descargar nada.",
  concierge_1_nombre: "Asistente de voz local",
  concierge_1_texto:
    "Un asistente basado en IA que se entrena con los contenidos de tu alojamiento y de su entorno para convertirse en tu atención al huésped 24/7. Responde preguntas complejas, crea rutas personalizadas y actualiza su información en tiempo real.",
  concierge_1_precio: "250 €/mes",
  concierge_2_nombre: "Plan My Trip",
  concierge_2_texto:
    "El huésped indica con quién viaja, cuánto tiempo tiene y qué le interesa. Plan My Trip le genera una ruta descargable, reservable y compartible en segundos. Premio Hospitality 2021 en el Digital Enterprise Show.",
  concierge_2_precio: "150 €/mes",
  concierge_3_nombre: "Calendario y mapa del entorno",
  concierge_3_texto:
    "La agenda de eventos de la zona, con venta de entradas integrada, y un mapa claro con las zonas y puntos destacados. El huésped ve qué pasa esta semana a diez minutos de tu puerta.",
  concierge_3_precio: "100 €/mes",
  concierge_4_nombre: "QR y tótems",
  concierge_4_texto:
    "Los puntos de entrada físicos: QR en la habitación, en la llave, en el ascensor o en el mostrador, y tótem interactivo en el hall. El huésped escanea y ya está dentro.",
  concierge_4_precio: "100 €/mes",
  checkin_eyebrow: "Sistema de check-in",
  checkin_title: "El descubrimiento empieza en el check-in, no en el móvil del huésped",
  checkin_intro:
    "No añadimos un paso más a tu operativa. discoolver se acopla al flujo que ya tienes: en el momento en que el huésped completa el check-in, recibe el acceso a su concierge. En recepción, en el kiosco o en el enlace que le envías antes de llegar.",
  checkin_paso_1_momento: "Antes de llegar",
  checkin_paso_1_accion:
    "El enlace al concierge viaja en el correo de confirmación o en el check-in online. El huésped empieza a planificar su estancia antes de deshacer la maleta.",
  checkin_paso_2_momento: "En el mostrador",
  checkin_paso_2_accion:
    "Recepción entrega la llave con su QR. Un escaneo y el huésped tiene delante las recomendaciones de la casa, el mapa y la agenda de la semana.",
  checkin_paso_3_momento: "Durante la estancia",
  checkin_paso_3_accion:
    "El QR de la habitación y el tótem del hall mantienen la puerta abierta. El asistente responde a cualquier hora, también cuando no hay nadie en recepción.",
  checkin_integracion:
    "Sin cambiar de PMS y sin desarrollo por tu parte: nos acoplamos a tu sistema de check-in actual, no lo sustituimos.",
  comision_eyebrow: "Comisión por venta",
  comision_title: "Deja de ser un coste y pasa a ser una línea de ingreso",
  comision_intro:
    "Cada reserva que tu huésped hace desde tu concierge (una entrada, una cata, una excursión, una mesa) se cierra dentro del marketplace de discoolver. Sobre esa venta hay una comisión, y una parte de esa comisión vuelve a tu alojamiento. No cobras por recomendar: cobras por lo que se reserva.",
  comision_flujo_1:
    "Tu huésped abre el concierge y encuentra una recomendación que encaja con él.",
  comision_flujo_2: "Reserva y paga dentro de la plataforma, sin salir a un buscador.",
  comision_flujo_3: "La venta queda registrada y tu alojamiento cobra su parte.",
  comision_dato_plataforma_valor: "10-15%",
  comision_dato_plataforma_label: "Comisión de discoolver sobre las ventas del marketplace",
  comision_dato_alojamiento_valor: "Tu parte",
  comision_dato_alojamiento_label:
    "Se fija en el contrato, sobre cada venta cerrada desde tu concierge, y se liquida periódicamente",
  comision_nota:
    "Tu porcentaje te lo decimos en la primera llamada, con tu volumen delante: cambia según los módulos que contrates y según si eres una propiedad o un grupo. No es una cifra de folleto porque no aplicamos lo mismo a un hostal de veinte camas que a una cadena de nueve hoteles. La liquidación es mensual.",
  comision_cierre:
    "El gasto del viajero se va cada vez más a lo que hace en destino — actividades, mesas, experiencias — y cada vez menos a la cama. Ese gasto hoy pasa por delante de tu recepción sin dejarte nada.",
  caso_eyebrow: "Despliegue real",
  caso_title:
    "Ronda: la plataforma desplegada en un destino entero, con venta cruzada con hoteles",
  caso_texto:
    "En Ronda, discoolver está desplegado como plataforma de destino desde 2022: más de 200 negocios y propuestas locales integrados, tótems interactivos, señalética QR en puntos clave y ocho puntos de venta. Los alojamientos entran en ese ecosistema por la vía de la venta cruzada: recomiendan dentro de la plataforma y la reserva se cierra ahí.",
  caso_dato_1_valor: "200+",
  caso_dato_1_label: "Negocios y propuestas locales integrados",
  caso_dato_2_valor: "8",
  caso_dato_2_label: "Puntos de venta desplegados",
  caso_dato_3_valor: "2022",
  caso_dato_3_label: "Año de despliegue, cliente de pago desde entonces",
  caso_dato_4_valor: "QR",
  caso_dato_4_label: "Señalética y tótems interactivos en el destino",
  segmentos_eyebrow: "Tres formas distintas de usarlo",
  segmentos_title: "Diseñamos la solución según cómo funciona tu casa",
  segmento_1_nombre: "Cadenas y grupos hoteleros",
  segmento_1_compra: "Estandarización",
  segmento_1_texto:
    "Un mismo concierge en todas tus propiedades, con contenido local distinto en cada plaza. El mismo flujo de check-in, el mismo criterio de recomendación y el mismo cuadro de mando para todas. Dejas de depender de que cada director tenga su lista de sitios y pasas a tener un estándar de marca que se despliega igual en Málaga que en Bilbao.",
  segmento_1_cierre:
    "Una sola forma de recomendar en toda la cadena, y una sola lectura de lo que reserva tu huésped.",
  segmento_2_nombre: "Hostales y hoteles pequeños",
  segmento_2_compra: "Diferenciación sin estructura",
  segmento_2_texto:
    "Cliente joven, mucha rotación y un equipo corto que no puede estar explicando la ciudad quince veces al día. El asistente responde por ti a cualquier hora y tus recomendaciones dejan de ser un folio plastificado en el mostrador. Sin contratar a nadie y sin obra: un QR y un módulo activo bastan para dar un servicio que hasta ahora era de hotel grande.",
  segmento_2_cierre:
    "El servicio que te diferencia sale por el precio de un módulo, no por el de una plantilla.",
  segmento_3_nombre: "Redes de apartamentos y property managers",
  segmento_3_compra: "Atención al huésped sin recepción",
  segmento_3_texto:
    "Sin mostrador, el huésped llega y no tiene a quién preguntar. El QR que recibe en el check-in le abre un concierge que contesta a las once de la noche y a las siete de la mañana. Generamos modelos propios para redes de apartamentos, de forma que todos tus pisos den el mismo nivel de atención sin que tú multipliques llamadas ni mensajes.",
  segmento_3_cierre:
    "Atención de recepción en pisos que no tienen recepción, y el mismo estándar en todos.",
  modulos_eyebrow: "Módulos y precios",
  modulos_title: "Cada módulo funciona solo. Juntos son el concierge completo.",
  modulos_lead:
    "Todos los módulos se contratan en modo suscripción y se integran en la web que ya tienes o se despliegan como plataforma nueva. Sin desarrollo propio.",
  modulo_1_nombre: "Asistente de Voz Local",
  modulo_1_desc:
    "Chatbot con IA entrenado con los contenidos de tu alojamiento y su entorno. Atención al huésped 24/7.",
  modulo_1_para: "El huésped, a cualquier hora",
  modulo_1_precio: "250 €/mes",
  modulo_2_nombre: "Plan My Trip",
  modulo_2_desc:
    "Planificador de rutas personalizadas por tipología de viajero, duración y presupuesto. Premio Hospitality 2021.",
  modulo_2_para: "Huéspedes que llegan sin plan",
  modulo_2_precio: "150 €/mes",
  modulo_3_nombre: "Calendario Inteligente",
  modulo_3_desc:
    "Agenda cultural y de eventos del entorno, con venta de entradas integrada.",
  modulo_3_para: "Estancias de fin de semana y repetidores",
  modulo_3_precio: "100 €/mes",
  modulo_4_nombre: "Señalética y tótems",
  modulo_4_desc:
    "Tótems interactivos y sistema de QR en habitación, hall y puntos de paso.",
  modulo_4_para: "Alojamientos con espacio físico de entrada",
  modulo_4_precio: "100 €/mes de mantenimiento",
  modulo_5_nombre: "Marketplace",
  modulo_5_desc:
    "Venta de servicios turísticos propios y de colaboradores. Es el módulo que convierte tus recomendaciones en reservas cobrables.",
  modulo_5_para: "Alojamientos que quieren ingresar por recomendación",
  modulo_5_precio: "750 €/mes + comisión 10-15% sobre ventas",
  modulo_6_nombre: "Business Intelligence",
  modulo_6_desc:
    "Cuadro de mando e informes con lo que tu huésped consulta, planifica y reserva.",
  modulo_6_para: "Dirección y revenue",
  modulo_6_precio: "Incluido con los módulos",
  modulo_7_nombre: "Software de Caja (POS)",
  modulo_7_desc:
    "Cobro en el punto físico que ya tienes: la recepción, la tienda del hotel o el mostrador de excursiones. Mismo catálogo que el concierge, y el arqueo del día en el mismo sitio.",
  modulo_7_para: "Opcional, para alojamientos con punto de venta propio",
  modulo_7_precio: "495 €/mes + 50 € por punto",
  modulos_stack: "El stack completo de los siete módulos suma 1.845 €/mes de tarifa.",
  arranque_eyebrow: "Puesta en marcha",
  arranque_title: "Qué necesitas para arrancar",
  arranque_paso_1_titulo: "Tus recomendaciones actuales",
  arranque_paso_1_texto:
    "Lo que hoy recomienda tu equipo: el listado, el folleto o lo que está en la cabeza del jefe de recepción. Lo cargamos nosotros y lo completamos con el contenido local del destino.",
  arranque_paso_2_titulo: "Conexión con tu check-in",
  arranque_paso_2_texto:
    "Acoplamos el acceso al concierge al flujo que ya usas: enlace en el correo de confirmación, QR en la llave o en el kiosco. Tú no cambias de sistema.",
  arranque_paso_3_titulo: "Puntos de entrada físicos",
  arranque_paso_3_texto:
    "Colocamos los QR en habitación, hall y ascensor, y el tótem si lo contratas. Sin obra y sin hardware complejo.",
  arranque_paso_4_titulo: "Una sesión con tu equipo",
  arranque_paso_4_texto:
    "Recepción no gestiona la plataforma: la consulta y la entrega. Con enseñar a entregar el QR y a mirar el cuadro de mando es suficiente.",
  arranque_requisito_integracion:
    "Integración: nos acoplamos a tu sistema de check-in. Sin desarrollo por tu parte y sin app obligatoria para el huésped.",
  arranque_requisito_tiempo:
    "Tiempo: el arranque depende de cuánto contenido propio nos pases y de tu sistema de check-in. Te damos fecha cerrada en la propuesta, no antes.",
  arranque_requisito_personal:
    "Personal: una persona de contacto para validar el contenido. Ninguna alta nueva en recepción.",
  faq_eyebrow: "Objeciones habituales",
  faq_title: "Lo que nos pregunta la dirección antes de firmar",
  faq_1_pregunta: "¿Esto no manda a mi huésped fuera del alojamiento?",
  faq_1_respuesta:
    "Tu huésped va a salir igual. La cuestión es si sale con la recomendación de tu casa o con la de un buscador, y si esa salida te deja un ingreso o no. Con el concierge, sale con lo que tú has aprobado y la reserva pasa por ti.",
  faq_2_pregunta: "¿Tengo que cambiar mi PMS o mi sistema de check-in?",
  faq_2_respuesta:
    "No, y no hace falta: el concierge funciona en paralelo a tu sistema, sin integración con tu PMS. Se entrega con un QR o un enlace en el check-in — no toca tu operativa, no requiere desarrollo y da igual qué software uses.",
  faq_3_pregunta: "¿El huésped tiene que descargarse una aplicación?",
  faq_3_respuesta:
    "No es obligatorio. Escanea el QR y entra desde el navegador. La app existe para quien la quiera, pero nunca es un requisito para usar el concierge.",
  faq_4_pregunta: "¿Quién mantiene actualizado el contenido?",
  faq_4_respuesta:
    "El contenido del destino lo mantiene discoolver dentro de la plataforma, y el asistente actualiza su información en tiempo real. Tus recomendaciones propias las decides y las apruebas tú.",
  faq_5_pregunta: "¿Puedo elegir a quién recomiendo?",
  faq_5_respuesta:
    "Sí. Tú apruebas qué entra en las recomendaciones de tu alojamiento. La visibilidad dentro de tu concierge no se compra: la decides tú.",
  faq_6_pregunta: "¿De quién son los datos de mis huéspedes?",
  faq_6_respuesta:
    "Tuyos. Tienes cuadro de mando e informes con lo que tus huéspedes consultan, planifican y reservan, incluidos en la contratación de los módulos.",
  faq_7_pregunta: "¿Cuánto tarda en estar funcionando?",
  faq_7_respuesta:
    "El punto de venta se integra en 15 días; el resto depende de tu contenido y tu check-in, y va con fecha cerrada en la propuesta. Sin meses de desarrollo y sin hardware complejo.",
  faq_8_pregunta: "¿Cómo y cuándo cobro la comisión?",
  faq_8_respuesta:
    "Sobre cada venta cerrada en el marketplace desde tu concierge. discoolver aplica una comisión del 10-15% sobre esas ventas y tu parte se fija en el contrato según tu volumen, con liquidación mensual.",
  faq_9_pregunta: "Tengo varias propiedades. ¿Se contrata una a una?",
  faq_9_respuesta:
    "La tarifa aplica por establecimiento, y el despliegue en varias propiedades comparte estándar y cuadro de mando. Para grupos y cadenas se dimensiona un acuerdo conjunto en la propuesta, con condiciones por volumen.",
  cta_title: "¿Quieres probar el concierge en tu alojamiento?",
  cta_sub:
    "Media hora de demo con tu caso delante: tu tipo de establecimiento, tu flujo de check-in y qué reservaría tu huésped en tu zona.",
  cta_boton: "Agendar una demo",
  cta_reassurance:
    "Demo de 30 minutos, sin compromiso. Contacta con nosotros y un miembro del equipo resolverá tus dudas.",
  cta_contacto:
    "info@discoolver.com · Consultas por WhatsApp · (+66) 83 829 1723 · C/ María de Molina 39, 28006 Madrid",
} as const;

export type Alojamientos360Content = { -readonly [K in keyof typeof defaultAlojamientos360Content]: string };
