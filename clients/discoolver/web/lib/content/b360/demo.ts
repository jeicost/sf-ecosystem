/**
 * Copy de /360/demo — marca discoolver 360.
 *
 * Extraído del JSX en 2026-08-10 al sembrar las páginas de 360 en SF-CMS: estaba
 * hardcodeado en la página y era la única de las cinco que no se podía editar desde
 * el CMS. Modelo flat-fields, una sección "content", igual que el resto.
 *
 * Los textos del formulario en sí viven en components/b360/DemoForm.tsx (client
 * component): no entran en el CMS todavía.
 */
export const defaultDemo360Content = {
  eyebrow: "Demo",
  title: "Media hora, tu caso sobre la mesa",
  lead:
    "Sin compromiso y sin presentación de cuarenta diapositivas. Enseñamos la plataforma funcionando y el despliegue de Ronda abierto, no capturas de pantalla.",
  tick_1_label: "Qué ves:",
  tick_1_texto:
    "la plataforma en vivo con datos reales de un despliegue en producción — marketplace, cuadro de mando y, según tu caso, el concierge o el punto de venta.",
  tick_2_label: "Qué te llevas:",
  tick_2_texto:
    "por qué módulo empezar en tu caso, qué cuesta y en qué plazo puede estar operativo.",
  tick_3_label: "Quién la hace:",
  tick_3_texto: "alguien del equipo que conoce el producto, no un comercial de guion.",
  tick_4_label: "Cuánto dura:",
  tick_4_texto: "30 minutos. Si hace falta una segunda, se cuadra.",
  contacto_label: "También puedes escribir",
  contacto_email: "info@discoolver.com",
  contacto_direccion: "C/ María de Molina 39, 28006 Madrid",
};
