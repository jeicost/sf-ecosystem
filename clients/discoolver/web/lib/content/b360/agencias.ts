/**
 * Copy de /360/agencias — marca discoolver 360.
 *
 * Generado desde deliverables/copy-360/360-agencias.json (workflow de copy, 2026-08-06).
 * Modelo flat-fields, igual que el resto del ecosistema: una sección "content"
 * por página en SF-CMS. Estos valores son el FALLBACK; cuando la página se siembre
 * en el CMS, mergeContent los pisa. Ojo a la regla de web/CLAUDE.md: mergeContent
 * solo recorre las claves del fallback, así que un campo que se borre de aquí queda
 * inerte en el CMS.
 *
 * Los valores con [PENDIENTE: ...] son deliberados: marcan lo que falta y de quién,
 * y la UI los pinta como aviso en vez de publicarlos como si fueran copy bueno.
 */
export const defaultAgencias360Content = {
  hero_label: "discoolver 360 · agencias, DMC y receptivos",
  hero_title: "El catálogo local que hoy no puedes vender",
  hero_sub:
    "El producto de experiencias del destino está disperso en doscientos negocios que no tienen ficha, ni precio publicado, ni forma de contratarse. Nosotros lo digitalizamos y te damos el escaparate y el punto de venta para comercializarlo.",
  hero_cta_1: "Hablemos de tu catálogo",
  hero_cta_1_url: "/360/demo?v=agencia",
  hero_cta_2: "Ver módulos y precios",
  hero_cta_2_url: "#modulos",
  hero_honestidad:
    "Esta es la vertical más reciente de discoolver 360. Los módulos llevan años funcionando en destinos y hay despliegues reales con cobro en la calle. Con agencias todavía no tenemos un caso cerrado, y preferimos decirlo aquí antes que en la segunda reunión.",
  perfiles_label: "A quién sirve",
  perfiles_title: "Si vendes destino, el producto local es tu inventario",
  perfiles_lead:
    "Hablamos con dirección y con responsables de producto. Tres perfiles distintos, el mismo cuello de botella: el catálogo local está disperso, cuesta más incorporarlo que lo que deja, y el margen se va en gestionarlo a mano.",
  perfil_1_nombre: "DMC",
  perfil_1_texto:
    "Montas programas a medida y el producto de experiencias lo cierras por teléfono, por correo o por WhatsApp. Cada proveedor nuevo es trabajo manual que no escala y que se pierde cuando cambia la persona que lo llevaba.",
  perfil_2_nombre: "Touroperador receptivo",
  perfil_2_texto:
    "Tienes volumen y contratación resuelta en alojamiento y transporte. En el producto local repites siempre los mismos diez proveedores, porque incorporar un negocio pequeño cuesta más de lo que aporta al margen.",
  perfil_3_nombre: "Agencia receptiva y de excursiones",
  perfil_3_texto:
    "Vendes en mostrador, en recepción de hotel y en punto físico. Necesitas cobrar en el sitio, con el mismo catálogo y los mismos precios en todos los canales, y saber al cierre del día qué se ha vendido y dónde.",
  no_encaje_titulo: "Cuándo no somos tu proveedor",
  no_encaje_texto:
    "Si buscas un motor de reservas de vuelos, un back office contable o un conector con tu ERP, no somos eso. discoolver 360 aporta el catálogo local digitalizado, el sitio donde venderlo y el punto donde cobrarlo. Lo demás se queda donde está.",
  que_damos_label: "Qué ponemos nosotros",
  que_damos_title: "La parte que nadie quiere hacer, ya hecha",
  que_damos_lead:
    "No te vendemos un canal más. Te vendemos el inventario local convertido en producto vendible, el escaparate donde ponerlo y la caja donde cobrarlo.",
  bloque_1_titulo: "Catálogo local digitalizado",
  bloque_1_texto:
    "Negocios, productos, actividades y eventos del destino convertidos en fichas con contenido, foto y datos estructurados. Es el trabajo lento y poco agradecido sin el cual no hay nada que vender, y es lo que llevamos años haciendo en destino.",
  bloque_2_titulo: "Marketplace",
  bloque_2_texto:
    "Un sistema de venta con tus productos y los de tus colaboradores. Se integra en la web que ya tienes o se despliega como plataforma nueva. Sin desarrollo por tu parte y sin obligar a nadie a descargarse una app.",
  bloque_3_titulo: "Punto de venta físico",
  bloque_3_texto:
    "Cobro en mostrador, en oficina, en hotel o en monumento, con el mismo catálogo que el canal online. Se conecta en quince días, sin hardware complejo y sin meses de desarrollo.",
  bloque_4_titulo: "Datos de qué se busca y qué se vende",
  bloque_4_texto:
    "Cuadro de mando e informes con toda la actividad del ecosistema: qué consulta el viajero, qué reserva y qué se queda sin comprar. Los datos son tuyos y sirven para negociar con proveedores y decidir qué producto merece la pena contratar. El módulo de inteligencia de negocio va incluido con los módulos que contrates.",
  comision_texto:
    "Para el canal, el modelo es tarifa neta: compras el producto local a neto y construyes tu margen sobre él — sin comisión sobre tus ventas. La comisión del 10-15% aplica al marketplace del destino, no al canal de agencias. Los módulos se contratan por separado, siempre en suscripción.",
  encaje_label: "Cómo encaja",
  encaje_title: "No sustituye a lo que ya vendes, llena el hueco de al lado",
  paso_1_titulo: "Lo tuyo sigue siendo tuyo",
  paso_1_texto:
    "Alojamiento, transporte, guías y programa propio no se tocan. discoolver 360 entra en la capa que hoy tienes vacía o resuelta a mano: el producto local del destino.",
  paso_2_titulo: "El catálogo se digitaliza una vez",
  paso_2_texto:
    "Cada negocio pasa a ser una ficha con contenido, precio y condiciones. A partir de ahí deja de ser una agenda de contactos y pasa a ser inventario consultable, actualizable y vendible.",
  paso_3_titulo: "Se vende por tus canales",
  paso_3_texto:
    "Marketplace en tu web, punto de venta en mostrador, tótems y códigos QR en el destino, planificador de rutas para el cliente final. El mismo catálogo alimentando todos los canales.",
  paso_4_titulo: "Se mide y se renegocia",
  paso_4_texto:
    "Con el dato de qué se busca y qué se compra vas a la mesa de contratación con argumentos, y decides qué producto local escalas y cuál dejas caer.",
  encaje_pendiente:
    "[PENDIENTE: producto y dirección deben definir si existe API, marca blanca o acceso al catálogo desde el sistema de reservas de la agencia. Hoy no hay documentación técnica que lo respalde, así que no se promete en esta página.]",
  caso_label: "Lo que ya está desplegado",
  caso_title: "Ronda",
  caso_texto:
    "En Ronda hay más de doscientos negocios y propuestas locales integrados en la plataforma, ocho puntos de venta, tótems interactivos y señalética QR repartida por la ciudad. Es un cliente de pago, con la oficina de turismo vendiendo desde el punto de venta y venta cruzada con hoteles. El proyecto forma parte además de SEGITTUR y de la red DTI, y pasó por la aceleradora Costa del Sol Tourism Hub.",
  caso_stat_1_valor: "200+",
  caso_stat_1_label: "Negocios locales integrados",
  caso_stat_2_valor: "8",
  caso_stat_2_label: "Puntos de venta en el destino",
  caso_stat_3_valor: "4 años",
  caso_stat_3_label: "De contrato en vigor en Ronda",
  caso_honestidad:
    "Ronda es un destino, no una agencia. Lo que demuestra no es que ya trabajemos con DMC, sino que la parte difícil está hecha y en producción: digitalizar doscientos negocios locales, ponerlos a la venta y cobrar de verdad en la calle.",
  caso_pendiente:
    "[PENDIENTE: no existe todavía un caso con una agencia, DMC o receptivo. Cuando exista, sustituye a este bloque. No se simula ninguno mientras tanto.]",
  modulos_label: "Módulos aplicables",
  modulos_title: "Se contratan por separado, en suscripción",
  modulos_lead:
    "Estos son los precios de tarifa. Para una agencia el núcleo son los dos primeros; el resto entra según cómo y dónde vendas.",
  modulo_1_nombre: "Marketplace",
  modulo_1_precio: "750 €/mes",
  modulo_1_para_que:
    "Venta de tus servicios y los de tus colaboradores: alojamientos, productos, actividades y eventos. Es el escaparate donde vive el catálogo.",
  modulo_2_nombre: "Software de caja (POS)",
  modulo_2_precio: "495 €/mes + 50 € por punto",
  modulo_2_para_que:
    "Cobro en mostrador, oficina, hotel o monumento. Integración en quince días, sin hardware complejo.",
  modulo_3_nombre: "Plan My Trip",
  modulo_3_precio: "150 €/mes",
  modulo_3_para_que:
    "Planificador de rutas por tipo de viajero, duración y presupuesto. Convierte una consulta suelta en un itinerario reservable. Premio Hospitality 2021 en el Digital Enterprise Show.",
  modulo_4_nombre: "Asistente de voz local",
  modulo_4_precio: "250 €/mes",
  modulo_4_para_que:
    "Chatbot entrenado con el contenido del destino. Atiende consultas del viajero las veinticuatro horas sin ampliar plantilla.",
  modulo_5_nombre: "Calendario inteligente",
  modulo_5_precio: "100 €/mes",
  modulo_5_para_que:
    "Agenda cultural y de eventos del destino con venta de entradas integrada. Producto de temporada que hoy se te escapa.",
  modulo_6_nombre: "Señalética y tótems",
  modulo_6_precio: "100 €/mes",
  modulo_6_para_que:
    "Tótems interactivos y códigos QR en puntos físicos. Venta fuera del mostrador, donde está el viajero.",
  modulo_7_nombre: "Inteligencia de negocio",
  modulo_7_precio: "Incluido",
  modulo_7_para_que:
    "Cuadro de mando e informes con toda la data del ecosistema. Va incluido con los módulos contratados.",
  modulos_stack:
    "El stack completo de los siete módulos suma 1.845 €/mes. Sobre las ventas del marketplace se aplica una comisión del 10-15%.",
  modulos_pendiente:
    "[PENDIENTE: dirección comercial debe confirmar si la tarifa de módulo se aplica igual a una agencia o si hay un paquete específico de canal, y qué se vende exactamente en el arranque mínimo.]",
  cta_label: "Siguiente paso",
  cta_title: "Una conversación, no una demo genérica",
  cta_texto:
    "Cuéntanos en qué destino operas, qué producto local vendes hoy y cómo lo cobras. De esa llamada sales con una respuesta concreta: qué módulos te encajan, a qué precio y qué queda por definir por nuestra parte.",
  cta_boton: "Hablemos de tu catálogo",
  cta_boton_url: "/360/demo?v=agencia",
  cta_contacto_email: "info@discoolver.com",
  cta_contacto_telefono: "(+66) 83 829 1723",
  cta_contacto_direccion: "C/ María de Molina 39, 28006 Madrid",
} as const;

export type Agencias360Content = { -readonly [K in keyof typeof defaultAgencias360Content]: string };
