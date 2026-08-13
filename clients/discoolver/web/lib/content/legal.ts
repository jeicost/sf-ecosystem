/**
 * Textos legales — aviso legal, términos y cookies, en ES y EN.
 *
 * Los tres documentos comparten componente (`components/legal/LegalDoc.tsx`)
 * y salen de aquí como datos, no como JSX: así el ES y el EN no se
 * desincronizan y añadir un idioma es añadir una clave.
 *
 * IDENTIDAD FISCAL: vive una sola vez, en `TITULAR`, y de ahí sale a las ocho
 * páginas. Datos confirmados por Carlos el 12-ago-2026.
 *
 * SON DOS DIRECCIONES DISTINTAS y las dos son buenas:
 *   - Alfonso XII 62 (28014) = domicilio social de la S.L. Va AQUÍ, en las
 *     legales, porque es lo que exige la LSSI.
 *   - María de Molina 39 (28006) = la oficina. Va en el copy comercial de 360
 *     (lib/content/b360/**), que es donde tiene sentido decirle a un cliente
 *     dónde estamos.
 * No unificarlas "por coherencia": no son lo mismo.
 *
 * Sintaxis inline admitida en los párrafos: [texto](destino) para enlaces y
 * correos. No hay HTML crudo a propósito — nada de dangerouslySetInnerHTML.
 */

/**
 * ¿Hay medición activada? De esto dependen DOS textos legales: la página de
 * cookies y el apartado de cookies de la privacidad. Se resuelve en un sitio
 * para que no puedan contradecirse entre sí.
 */
export const HAY_MEDICION = Boolean(process.env.NEXT_PUBLIC_GA_ID);

export const TITULAR = {
  razonSocial: "Discoolverworld S.L.",
  nif: "B88394465",
  domicilio: "C/ Alfonso XII 62, 28014 Madrid, España",
  emailB2C: "hola@discoolver.com",
  emailB2B: "info@discoolver.com",
  /**
   * Dónde se devuelven las guías en papel. Va aparte del domicilio aunque hoy
   * coincidan: el art. 97.1.i del TRLGDCU obliga a designar una dirección de
   * devolución, y quien recibe los paquetes puede no ser quien figura en el
   * Registro. Si los devueltos deben ir a la oficina de María de Molina 39, se
   * cambia AQUÍ y solo aquí — decisión de Carlos, no de código.
   */
  devoluciones: "C/ Alfonso XII 62, 28014 Madrid, España",
} as const;

/** Fecha de última revisión — se muestra al pie de cada documento. */
export const LEGAL_UPDATED = "12 de agosto de 2026";
export const LEGAL_UPDATED_EN = "12 August 2026";

export type LegalSection = { h: string; p?: string[]; ul?: string[] };
export type LegalDoc = {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lead: string;
  updatedLabel: string;
  back: string;
  sections: LegalSection[];
};

const T = TITULAR;

// ───────────────────────────────────────────────────────────── aviso legal ──

const avisoEs: LegalDoc = {
  title: "Aviso legal — discoolver",
  description:
    "Quién está detrás de discoolver: titular, datos fiscales, condiciones de uso del sitio y propiedad intelectual.",
  eyebrow: "Legal",
  h1: "Aviso legal",
  lead: "Quién hay detrás de esta web y bajo qué condiciones puedes usarla.",
  updatedLabel: `Última revisión: ${LEGAL_UPDATED}`,
  back: "Volver a discoolver",
  sections: [
    {
      h: "Titular del sitio",
      p: [
        `En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico:`,
      ],
      ul: [
        `**Razón social:** ${T.razonSocial}`,
        `**NIF:** ${T.nif}`,
        `**Domicilio:** ${T.domicilio}`,
        `**Correo:** [${T.emailB2C}](mailto:${T.emailB2C})`,
        `**Actividad:** edición y venta de guías de viaje, y explotación de la plataforma discoolver.`,
      ],
    },
    {
      h: "Qué es esta web",
      p: [
        "discoolver.com es el sitio de la marca: el catálogo de guías, la captación de creadores y la presentación de discoolver 360, nuestra plataforma para destinos y alojamientos. La plataforma en sí vive en [app.discoolver.com](https://app.discoolver.com).",
        "Usar esta web te convierte en usuario y supone que aceptas este aviso. Si vas a comprar una guía, además se te aplican los [términos y condiciones de venta](/terminos).",
      ],
    },
    {
      h: "Propiedad intelectual",
      p: [
        "El diseño, los textos, el código y las marcas de este sitio son nuestros o los usamos con permiso. Las guías —su selección, su redacción y su edición— son obra protegida: puedes leerlas y usarlas, no republicarlas ni revenderlas.",
        "El contenido que aporta un creador sigue siendo suyo. Nos concede una licencia para editarlo y publicarlo dentro de su guía, y las condiciones van por escrito antes de empezar.",
        "Si crees que algo publicado aquí vulnera un derecho tuyo, escríbenos y lo revisamos en serio.",
      ],
    },
    {
      h: "Responsabilidad",
      p: [
        "Ponemos cuidado en que lo que recomendamos exista y esté bien, pero los negocios cambian de horario, de carta y de dueño. Una recomendación no es una garantía: comprueba horarios y disponibilidad antes de ir.",
        "No respondemos de lo que pase en webs de terceros a las que enlazamos, ni de interrupciones del servicio ajenas a nosotros.",
      ],
    },
    {
      h: "Enlaces a esta web",
      p: [
        "Puedes enlazarnos sin pedir permiso, siempre que no sugieras una relación comercial que no existe ni presentes discoolver de forma que induzca a error.",
      ],
    },
    {
      h: "Ley aplicable",
      p: [
        "Se aplica la ley española. Para cualquier conflicto, y salvo que la normativa de consumo diga otra cosa, los juzgados de Madrid.",
      ],
    },
  ],
};

const avisoEn: LegalDoc = {
  title: "Legal notice — discoolver",
  description:
    "Who runs discoolver: company details, terms of use for the site and intellectual property.",
  eyebrow: "Legal",
  h1: "Legal notice",
  lead: "Who is behind this site and on what terms you can use it.",
  updatedLabel: `Last reviewed: ${LEGAL_UPDATED_EN}`,
  back: "Back to discoolver",
  sections: [
    {
      h: "Site owner",
      p: [
        "Under article 10 of Spanish Law 34/2002 on information society services and electronic commerce:",
      ],
      ul: [
        `**Company:** ${T.razonSocial}`,
        `**Tax ID:** ${T.nif}`,
        `**Registered address:** ${T.domicilio}`,
        `**Email:** [${T.emailB2C}](mailto:${T.emailB2C})`,
        `**Activity:** publishing and selling travel guides, and operating the discoolver platform.`,
      ],
    },
    {
      h: "What this site is",
      p: [
        "discoolver.com is the brand site: the guide catalogue, creator recruitment, and discoolver 360, our platform for destinations and hotels. The platform itself lives at [app.discoolver.com](https://app.discoolver.com).",
        "Using this site makes you a user and means you accept this notice. If you buy a guide, the [terms of sale](/en/terminos) also apply.",
      ],
    },
    {
      h: "Intellectual property",
      p: [
        "The design, copy, code and trademarks on this site are ours or used with permission. The guides — their selection, writing and editing — are protected work: read them and use them, don't republish or resell them.",
        "Content contributed by a creator stays theirs. They grant us a licence to edit and publish it within their guide, and the terms are agreed in writing beforehand.",
        "If you believe something published here infringes your rights, write to us and we'll look into it properly.",
      ],
    },
    {
      h: "Liability",
      p: [
        "We take care that what we recommend exists and is good, but businesses change their hours, their menu and their owners. A recommendation is not a guarantee: check opening times and availability before you go.",
        "We are not responsible for third-party sites we link to, or for service interruptions outside our control.",
      ],
    },
    {
      h: "Linking to this site",
      p: [
        "You may link to us without asking, as long as you don't imply a commercial relationship that doesn't exist or present discoolver misleadingly.",
      ],
    },
    {
      h: "Governing law",
      p: [
        "Spanish law applies. For any dispute, and unless consumer law says otherwise, the courts of Madrid.",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────── términos ──

const terminosEs: LegalDoc = {
  title: "Términos y condiciones — discoolver",
  description:
    "Condiciones de venta de las guías de discoolver: precios, pago, entrega, derecho de desistimiento y devoluciones.",
  eyebrow: "Legal",
  h1: "Términos y condiciones",
  lead: "Las condiciones de venta de las guías. En corto y sin trampas.",
  updatedLabel: `Última revisión: ${LEGAL_UPDATED}`,
  back: "Volver a discoolver",
  sections: [
    {
      h: "Quién vende",
      p: [
        `${T.razonSocial}, NIF ${T.nif}, con domicilio en ${T.domicilio}. Para cualquier cosa relacionada con tu pedido: [${T.emailB2C}](mailto:${T.emailB2C}).`,
      ],
    },
    {
      h: "Qué compras",
      ul: [
        "**Guía digital.** Un archivo descargable con la edición del año de esa ciudad, más el acceso a la IA que la acompaña. Se entrega por correo electrónico.",
        "**Guía en papel.** El libro impreso, que incluye además la versión digital. Se envía a la dirección que indiques.",
      ],
      p: [
        "Cada guía se cierra una vez al año. Lo que compras es esa edición: no se actualiza sola a la del año siguiente.",
      ],
    },
    {
      h: "Precios y pago",
      p: [
        "Los precios se muestran en euros con el IVA incluido. Los gastos de envío del papel, si los hay, se calculan y se enseñan antes de que confirmes.",
        "El pago se procesa con Stripe. No vemos ni guardamos los datos de tu tarjeta en ningún momento.",
        "El precio de lanzamiento es el que figura en la ficha cuando compras; los precios pueden cambiar en el futuro, pero nunca con efecto retroactivo sobre un pedido ya hecho.",
      ],
    },
    {
      h: "Entrega",
      ul: [
        "**Digital:** te llega por correo justo después del pago. Si en una hora no ha llegado, mira el spam y luego escríbenos: lo resolvemos el mismo día.",
        "**Papel:** se envía en el plazo que se indique en la ficha del producto. Te avisamos cuando salga.",
      ],
    },
    {
      h: "Derecho de desistimiento",
      p: [
        "**Guía en papel:** tienes 14 días naturales desde que la recibes para desistir sin dar explicaciones. Basta con que nos lo comuniques antes de que venza el plazo, por cualquier medio inequívoco: un correo a " +
          `[${T.emailB2C}](mailto:${T.emailB2C}) vale, y también el formulario que reproducimos más abajo, aunque usarlo es opcional.`,
        `Una vez nos avises, tienes otros 14 días naturales para devolvernos el libro a **${T.devoluciones}**. Te reembolsamos todo lo pagado —incluidos los gastos de envío estándar— **como muy tarde 14 días naturales** desde que recibimos tu comunicación, con el mismo medio de pago que usaste y sin coste para ti; podemos esperar a que el libro nos llegue o a que nos enseñes que lo has enviado, lo que ocurra antes. El coste de devolverlo corre de tu cuenta, salvo que llegara defectuoso o equivocado, en cuyo caso lo pagamos nosotros.`,
        "**Guía digital:** al comprar te pedimos que confirmes expresamente que quieres recibirla ya y que aceptas que, al hacerlo, pierdes el derecho de desistimiento —es lo que prevé el artículo 103.m del texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios para el contenido digital que se entrega al instante—. Si no marcas esa casilla, no hay descarga inmediata.",
        "Que no puedas desistir no significa que te aguantes: si el archivo no abre, está incompleto o no es lo que describimos, lo arreglamos o te devolvemos el dinero.",
      ],
    },
    {
      // El artículo 97.1.i del TRLGDCU obliga a facilitar este modelo, no solo
      // a mencionar que existe el derecho. Usarlo es opcional para el cliente.
      h: "Modelo de formulario de desistimiento",
      p: [
        "No hace falta que uses este modelo —cualquier declaración inequívoca sirve—, pero lo dejamos aquí por si te resulta más cómodo. Cópialo, rellénalo y envíanoslo:",
      ],
      ul: [
        `A la atención de ${T.razonSocial}, ${T.devoluciones} · [${T.emailB2C}](mailto:${T.emailB2C})`,
        "Por la presente le comunico que desisto de mi contrato de venta del siguiente bien:",
        "Pedido el / recibido el:",
        "Nombre del consumidor:",
        "Domicilio del consumidor:",
        "Firma del consumidor (solo si se presenta en papel):",
        "Fecha:",
      ],
    },
    {
      h: "Si algo sale mal",
      p: [
        `Escríbenos a [${T.emailB2C}](mailto:${T.emailB2C}). Contestamos a todo, y lo normal es que sea en menos de 48 horas laborables.`,
        // La plataforma ODR europea dejó de funcionar el 20-jul-2025
        // (Reglamento UE 2024/3228). Enlazarla era mandar al consumidor a una
        // puerta cerrada.
        "Como consumidor tienes las garantías legales del TRLGDCU. Si no llegamos a un acuerdo, puedes acudir a las juntas arbitrales de consumo o a los organismos de consumo de tu comunidad autónoma; en Madrid, a la [Dirección General de Comercio y Consumo](https://www.comunidad.madrid/servicios/consumo). El Centro Europeo del Consumidor ([cec.consumo.gob.es](https://cec.consumo.gob.es)) atiende las compras transfronterizas dentro de la UE.",
      ],
    },
    {
      h: "Uso de las guías",
      p: [
        "La guía es para ti. Puedes leerla en tus dispositivos y enseñársela a quien quieras; no puedes revenderla, subirla a ningún sitio ni repartir copias.",
      ],
    },
    {
      h: "Ley aplicable",
      p: [
        "Ley española. Si compras como consumidor, conservas la protección de las normas imperativas de tu país de residencia en la UE.",
      ],
    },
  ],
};

const terminosEn: LegalDoc = {
  title: "Terms and conditions — discoolver",
  description:
    "Terms of sale for discoolver guides: prices, payment, delivery, right of withdrawal and refunds.",
  eyebrow: "Legal",
  h1: "Terms and conditions",
  lead: "The terms of sale for the guides. Short, and no tricks.",
  updatedLabel: `Last reviewed: ${LEGAL_UPDATED_EN}`,
  back: "Back to discoolver",
  sections: [
    {
      h: "Who sells",
      p: [
        `${T.razonSocial}, tax ID ${T.nif}, registered at ${T.domicilio}. For anything about your order: [${T.emailB2C}](mailto:${T.emailB2C}).`,
      ],
    },
    {
      h: "What you buy",
      ul: [
        "**Digital guide.** A downloadable file with that city's edition for the year, plus access to the AI that comes with it. Delivered by email.",
        "**Print guide.** The printed book, which also includes the digital version. Shipped to the address you give us.",
      ],
      p: [
        "Each guide closes once a year. What you buy is that edition: it does not roll over to next year's on its own.",
      ],
    },
    {
      h: "Prices and payment",
      p: [
        "Prices are shown in euros, VAT included. Shipping costs for print, where they apply, are calculated and shown before you confirm.",
        "Payment is processed by Stripe. We never see or store your card details.",
        "The launch price is whatever the product page shows when you buy; prices may change later, but never retroactively on an order already placed.",
      ],
    },
    {
      h: "Delivery",
      ul: [
        "**Digital:** arrives by email right after payment. If it hasn't landed within an hour, check your spam and then write to us — we fix it the same day.",
        "**Print:** shipped within the timeframe stated on the product page. We'll tell you when it leaves.",
      ],
    },
    {
      h: "Right of withdrawal",
      p: [
        "**Print guide:** you have 14 calendar days from delivery to withdraw, no explanation needed. Just tell us before the deadline, by any unambiguous means: an email to " +
          `[${T.emailB2C}](mailto:${T.emailB2C}) is enough, and so is the form reproduced below, though using it is optional.`,
        `Once you've told us, you have a further 14 calendar days to send the book back to **${T.devoluciones}**. We refund everything you paid — standard shipping included — **within 14 calendar days at the latest** of receiving your notice, using the same payment method you used and at no cost to you; we may wait until the book reaches us or until you show us you've sent it, whichever comes first. Return shipping is on you, unless the book arrived faulty or wasn't what you ordered, in which case we cover it.`,
        "**Digital guide:** at checkout we ask you to expressly confirm that you want it delivered immediately and that you accept losing the right of withdrawal by doing so — this is what article 103.m of the Spanish consumer protection act provides for digital content delivered instantly. If you don't tick that box, there is no immediate download.",
        "Losing the right to withdraw doesn't mean you're stuck: if the file won't open, is incomplete, or isn't what we described, we fix it or refund you.",
      ],
    },
    {
      h: "Model withdrawal form",
      p: [
        "You don't have to use this model — any unambiguous statement works — but here it is in case it's easier. Copy it, fill it in and send it to us:",
      ],
      ul: [
        `To ${T.razonSocial}, ${T.devoluciones} · [${T.emailB2C}](mailto:${T.emailB2C})`,
        "I hereby give notice that I withdraw from my contract of sale of the following goods:",
        "Ordered on / received on:",
        "Name of consumer:",
        "Address of consumer:",
        "Signature of consumer (only if this form is sent on paper):",
        "Date:",
      ],
    },
    {
      h: "If something goes wrong",
      p: [
        `Write to [${T.emailB2C}](mailto:${T.emailB2C}). We answer everything, usually within 48 working hours.`,
        "As a consumer you have the statutory guarantees of Spanish consumer law. If we can't reach an agreement, you can go to the consumer arbitration boards or to the consumer authority of your region; in Madrid, the [Dirección General de Comercio y Consumo](https://www.comunidad.madrid/servicios/consumo). For cross-border purchases within the EU, the European Consumer Centre ([cec.consumo.gob.es](https://cec.consumo.gob.es)) can help.",
      ],
    },
    {
      h: "Using the guides",
      p: [
        "The guide is yours. Read it on your devices and show it to whoever you like; you can't resell it, upload it anywhere, or hand out copies.",
      ],
    },
    {
      h: "Governing law",
      p: [
        "Spanish law. If you buy as a consumer, you keep the protection of the mandatory rules of your country of residence in the EU.",
      ],
    },
  ],
};

// ───────────────────────────────────────────────────────────────── cookies ──

const cookiesEs: LegalDoc = {
  title: "Política de cookies — discoolver",
  description:
    "discoolver.com no usa cookies: ni de análisis, ni de publicidad, ni de seguimiento. Qué significa eso y qué pasaría si cambiara.",
  eyebrow: "Legal",
  h1: "Cookies",
  lead: "Esta web no usa cookies. Ni una.",
  updatedLabel: `Última revisión: ${LEGAL_UPDATED}`,
  back: "Volver a discoolver",
  sections: [
    {
      h: "No hay banner porque no hay nada que consentir",
      p: [
        "Esta web no instala cookies de análisis, ni de publicidad, ni de redes sociales, ni de seguimiento entre sitios. No usamos Google Analytics, ni el píxel de Meta, ni ninguna herramienta equivalente. Tampoco guardamos nada en el almacenamiento local de tu navegador.",
        "Por eso no verás una ventana pidiéndote permiso: la ley obliga a pedirlo para las cookies que no son estrictamente necesarias, y aquí no hay ninguna.",
      ],
    },
    {
      h: "Entonces, ¿cómo sabéis cuánta gente entra?",
      p: [
        "Por los registros del servidor, que son anónimos y agregados. Nuestro proveedor de alojamiento cuenta peticiones para poder servir la web y protegerla de abusos; eso no identifica a nadie ni se usa para perfilarte.",
      ],
    },
    {
      h: "Cuando compres una guía",
      p: [
        "El pago lo procesa Stripe en sus propias páginas. Stripe sí usa cookies técnicas y antifraude mientras estás allí, bajo su propia política. Nosotros no recibimos esas cookies ni tus datos de tarjeta.",
      ],
    },
    {
      h: "Si esto cambia, lo verás",
      p: [
        "El día que añadamos medición o publicidad, aparecerá el banner de consentimiento correspondiente y esta página se reescribirá con el detalle de cada cookie antes de activar nada. No vamos a colar seguimiento en silencio.",
      ],
    },
    {
      h: "Tus datos",
      p: [
        "Lo que sí recogemos —lo que nos escribes en un formulario— está explicado en la [política de privacidad](/privacidad).",
      ],
    },
  ],
};

const cookiesEn: LegalDoc = {
  title: "Cookie policy — discoolver",
  description:
    "discoolver.com uses no cookies: no analytics, no advertising, no tracking. What that means and what would change if it did.",
  eyebrow: "Legal",
  h1: "Cookies",
  lead: "This site uses no cookies. Not one.",
  updatedLabel: `Last reviewed: ${LEGAL_UPDATED_EN}`,
  back: "Back to discoolver",
  sections: [
    {
      h: "No banner, because there's nothing to consent to",
      p: [
        "This site sets no analytics, advertising, social or cross-site tracking cookies. No Google Analytics, no Meta pixel, no equivalent tool. We don't store anything in your browser's local storage either.",
        "That's why you won't see a pop-up asking permission: the law requires consent for cookies that aren't strictly necessary, and here there are none.",
      ],
    },
    {
      h: "So how do you know how many people visit?",
      p: [
        "From server logs, which are anonymous and aggregated. Our hosting provider counts requests in order to serve the site and protect it from abuse; that identifies nobody and is not used to profile you.",
      ],
    },
    {
      h: "When you buy a guide",
      p: [
        "Payment is handled by Stripe on their own pages. Stripe does use technical and anti-fraud cookies while you're there, under their own policy. We receive neither those cookies nor your card details.",
      ],
    },
    {
      h: "If this changes, you'll see it",
      p: [
        "The day we add measurement or advertising, the corresponding consent banner will appear and this page will be rewritten with the detail of every cookie before anything is switched on. We won't slip tracking in quietly.",
      ],
    },
    {
      h: "Your data",
      p: [
        "What we do collect — whatever you type into a form — is explained in the [privacy policy](/en/privacidad).",
      ],
    },
  ],
};

// ────────────────────────────────────────────────────────────── privacidad ──
// Migrada desde el JSX suelto de app/privacidad/page.tsx (que llevaba
// "[dirección fiscal]" literal en producción) para que use TITULAR y tenga EN.

const privacidadEs: LegalDoc = {
  title: "Privacidad — discoolver",
  description:
    "Qué datos recogemos en discoolver cuando pides tu ciudad, compras una guía o envías una candidatura de creator, para qué los usamos y cómo ejercer tus derechos.",
  eyebrow: "Legal",
  h1: "Privacidad",
  lead: "Sin letra pequeña: esto es todo lo que hacemos con tus datos.",
  updatedLabel: `Última revisión: ${LEGAL_UPDATED}`,
  back: "Volver a discoolver",
  sections: [
    {
      h: "Quién trata tus datos",
      p: [
        `${T.razonSocial}, NIF ${T.nif}, con domicilio en ${T.domicilio}. Para cualquier cosa relacionada con tus datos: [${T.emailB2C}](mailto:${T.emailB2C}).`,
      ],
    },
    {
      h: "Qué recogemos y por qué",
      p: ["Solo lo que nos escribes tú en un formulario de esta web:"],
      ul: [
        "**Aviso por destino:** tu email y la ciudad que pides, para escribirte cuando esa edición exista.",
        "**Candidatura de creator:** nombre, email, tu handle, tu ciudad y un enlace a tu contenido, para valorar la candidatura y responderte.",
        "**Envío de vídeo:** los mismos datos más el enlace al vídeo, para que lo valore el equipo editorial.",
        "**Compra de una guía:** tu email y, si pides el papel, la dirección de envío. El pago lo procesa Stripe: los datos de tu tarjeta no pasan por nosotros.",
        "**Demo de discoolver 360:** los datos de contacto profesionales que dejas en el formulario, para llamarte.",
      ],
    },
    {
      h: "Cookies",
      p: [
        HAY_MEDICION
          ? "Una sola cookie de medición, y solo si la aceptas: sin publicidad, sin seguimiento entre webs y sin perfilado. Si dices que no, no se carga. El detalle está en la [política de cookies](/cookies)."
          : "Ninguna. No usamos analítica, ni publicidad, ni seguimiento, ni perfilado, ni decisiones automatizadas. El detalle está en la [política de cookies](/cookies).",
      ],
    },
    {
      h: "Base legal",
      p: [
        "Tu consentimiento al enviar el formulario; la ejecución del contrato cuando compras una guía; y nuestro interés legítimo en responder a una candidatura que nos has enviado tú. Puedes retirar el consentimiento cuando quieras escribiéndonos.",
      ],
    },
    {
      h: "Cuánto tiempo",
      p: [
        "Los avisos por destino, hasta que salga esa edición o nos pidas borrarte. Las candidaturas, mientras la colaboración esté viva o hasta que pidas borrarlas. Los datos de una compra, el tiempo que exige la normativa fiscal y contable.",
      ],
    },
    {
      h: "Con quién los compartimos",
      p: [
        "Con nadie que no sea necesario para que esto funcione. **No vendemos ni cedemos tus datos a terceros**, y no los usamos para perfilarte ni para tomar decisiones automatizadas.",
      ],
      // Nombrar a cada encargado es obligatorio (art. 13.1.e RGPD) y además es
      // lo único que permite al usuario comprobar dónde acaban sus datos. La
      // lista genérica que había antes —«el proveedor que aloja la web»— no
      // decía nada.
      ul: [
        "**Vercel Inc.** (EE. UU.) — aloja y sirve la web. Cláusulas contractuales tipo de la Comisión Europea.",
        "**Supabase Inc.** (infraestructura en la UE, Fráncfort) — guarda lo que nos dejas en los formularios.",
        "**FormSubmit** — nos avisa por correo de cada formulario nuevo. Recibe únicamente lo que has escrito en él.",
        "**Stripe Payments Europe Ltd.** (Irlanda) — cobra las guías. Los datos de tu tarjeta van directos a Stripe y no pasan por nosotros.",
      ],
    },
    {
      h: "Cuánto tiempo los guardamos",
      p: [
        "Lo que nos dejas en un formulario, mientras siga teniendo sentido la razón por la que nos lo dejaste —el aviso de lanzamiento de tu ciudad, la candidatura de creador, la demo que pediste— y como mucho tres años desde el último contacto. Después se borra.",
        "Los datos de un pedido se conservan seis años, que es lo que exige la normativa fiscal y mercantil.",
      ],
    },
    {
      h: "Tus derechos",
      p: [
        `Puedes acceder, rectificar, borrar, oponerte, limitar el tratamiento y llevarte tus datos. Escríbenos a [${T.emailB2C}](mailto:${T.emailB2C}) y lo resolvemos. Si algo no te cuadra, puedes reclamar ante la Agencia Española de Protección de Datos ([aepd.es](https://www.aepd.es)).`,
      ],
    },
    {
      h: "Contenido de creators",
      p: [
        "Cuando publicamos una guía firmada por un creator, su contenido sigue siendo suyo: nos concede una licencia no exclusiva para editarlo y publicarlo dentro de esa guía, y las condiciones van por escrito antes de empezar.",
      ],
    },
  ],
};

const privacidadEn: LegalDoc = {
  title: "Privacy — discoolver",
  description:
    "What we collect at discoolver when you request your city, buy a guide or apply as a creator, what we use it for and how to exercise your rights.",
  eyebrow: "Legal",
  h1: "Privacy",
  lead: "No small print: this is everything we do with your data.",
  updatedLabel: `Last reviewed: ${LEGAL_UPDATED_EN}`,
  back: "Back to discoolver",
  sections: [
    {
      h: "Who processes your data",
      p: [
        `${T.razonSocial}, tax ID ${T.nif}, registered at ${T.domicilio}. For anything to do with your data: [${T.emailB2C}](mailto:${T.emailB2C}).`,
      ],
    },
    {
      h: "What we collect and why",
      p: ["Only what you type into a form on this site:"],
      ul: [
        "**City notification:** your email and the city you ask for, so we can write when that edition exists.",
        "**Creator application:** name, email, your handle, your city and a link to your work, to assess the application and reply.",
        "**Video submission:** the same, plus the link to the video, for the editorial team to review.",
        "**Buying a guide:** your email and, for print, a shipping address. Payment is processed by Stripe: your card details never pass through us.",
        "**discoolver 360 demo:** the professional contact details you leave in the form, so we can call you.",
      ],
    },
    {
      h: "Cookies",
      p: [
        HAY_MEDICION
          ? "One measurement cookie, and only if you accept it: no advertising, no cross-site tracking, no profiling. Say no and it never loads. The detail is in the [cookie policy](/en/cookies)."
          : "None. No analytics, no advertising, no tracking, no profiling, no automated decisions. The detail is in the [cookie policy](/en/cookies).",
      ],
    },
    {
      h: "Legal basis",
      p: [
        "Your consent when you submit the form; performance of the contract when you buy a guide; and our legitimate interest in replying to an application you sent us. You can withdraw consent at any time by writing to us.",
      ],
    },
    {
      h: "How long",
      p: [
        "City notifications, until that edition ships or you ask to be removed. Applications, while the collaboration is alive or until you ask us to delete them. Purchase data, for as long as tax and accounting law requires.",
      ],
    },
    {
      h: "Who we share it with",
      p: [
        "Nobody who isn't needed to make this work. **We don't sell or hand your data to third parties**, and we don't use it to profile you or make automated decisions about you.",
      ],
      ul: [
        "**Vercel Inc.** (USA) — hosts and serves the site. European Commission standard contractual clauses.",
        "**Supabase Inc.** (EU infrastructure, Frankfurt) — stores what you leave in the forms.",
        "**FormSubmit** — emails us when a new form comes in. It receives only what you typed into it.",
        "**Stripe Payments Europe Ltd.** (Ireland) — takes payment for the guides. Card details go straight to Stripe and never pass through us.",
      ],
    },
    {
      h: "How long we keep it",
      p: [
        "Whatever you leave in a form, for as long as the reason you left it still stands — the launch notice for your city, your creator application, the demo you asked for — and at most three years from our last contact. After that it's deleted.",
        "Order data is kept for six years, which is what Spanish tax and commercial law requires.",
      ],
    },
    {
      h: "Your rights",
      p: [
        `You can access, correct, delete, object, restrict processing and take your data with you. Write to [${T.emailB2C}](mailto:${T.emailB2C}) and we'll sort it. If something doesn't add up, you can complain to the Spanish data protection authority ([aepd.es](https://www.aepd.es)).`,
      ],
    },
    {
      h: "Creator content",
      p: [
        "When we publish a guide signed by a creator, their content stays theirs: they grant us a non-exclusive licence to edit and publish it within that guide, and the terms are agreed in writing beforehand.",
      ],
    },
  ],
};

// ── cookies, la versión CON medición ────────────────────────────────────────
// La página de arriba dice "no usamos ninguna", y es verdad mientras no haya
// NEXT_PUBLIC_GA_ID. En cuanto se pone, esa frase pasa a ser mentira: la ruta
// /cookies elige entre las dos según el interruptor, para que el texto legal no
// dependa de que alguien se acuerde de reescribirlo.

const cookiesGaEs: LegalDoc = {
  ...cookiesEs,
  description:
    "Qué cookies usa discoolver.com, para qué, cuánto duran y cómo cambiar tu decisión cuando quieras.",
  lead: "Una sola cookie, de medición, y solo si tú dices que sí.",
  sections: [
    {
      h: "Qué usamos exactamente",
      p: [
        "Google Analytics, para saber qué páginas se leen y cuáles no. Nada más: ni publicidad, ni remarketing, ni seguimiento entre webs. Lo tenemos configurado con la IP anonimizada y con las señales de anuncios de Google desactivadas.",
        "**No se carga hasta que aceptas.** Si dices que no, no se descarga ni el script. Y si no contestas, tampoco: el silencio no es un sí.",
      ],
      ul: [
        "**_ga** — distingue visitantes de forma anónima. Dura 2 años.",
        "**_ga_XXXXXXX** — mantiene el estado de la sesión. Dura 2 años.",
      ],
    },
    {
      h: "Cómo cambiar de opinión",
      p: [
        "Tu decisión se guarda en tu propio navegador. Para revocarla, borra los datos de sitio de discoolver.com desde los ajustes de tu navegador y volveremos a preguntarte.",
      ],
    },
    {
      h: "Cuando compres una guía",
      p: [
        "El pago lo procesa Stripe en sus propias páginas. Stripe usa cookies técnicas y antifraude mientras estás allí, bajo su propia política. Nosotros no recibimos esas cookies ni tus datos de tarjeta.",
      ],
    },
    {
      h: "Tus datos",
      p: [
        "Lo que recogemos cuando nos escribes en un formulario está explicado en la [política de privacidad](/privacidad).",
      ],
    },
  ],
};

const cookiesGaEn: LegalDoc = {
  ...cookiesEn,
  description:
    "Which cookies discoolver.com uses, what for, how long they last and how to change your mind.",
  lead: "One cookie, for measurement, and only if you say yes.",
  sections: [
    {
      h: "What we use, exactly",
      p: [
        "Google Analytics, to know which pages get read and which don't. Nothing else: no advertising, no remarketing, no cross-site tracking. It runs with IP anonymisation and Google's ad signals switched off.",
        "**Nothing loads until you accept.** Say no and the script is never downloaded. Same if you don't answer at all: silence is not a yes.",
      ],
      ul: [
        "**_ga** — tells visitors apart anonymously. Lasts 2 years.",
        "**_ga_XXXXXXX** — keeps session state. Lasts 2 years.",
      ],
    },
    {
      h: "Changing your mind",
      p: [
        "Your choice is stored in your own browser. To revoke it, clear site data for discoolver.com in your browser settings and we'll ask again.",
      ],
    },
    {
      h: "When you buy a guide",
      p: [
        "Payment is handled by Stripe on their own pages. Stripe uses technical and anti-fraud cookies while you're there, under their own policy. We receive neither those cookies nor your card details.",
      ],
    },
    {
      h: "Your data",
      p: [
        "What we collect when you type into a form is explained in the [privacy policy](/en/privacidad).",
      ],
    },
  ],
};

export const LEGAL = {
  aviso: { es: avisoEs, en: avisoEn },
  terminos: { es: terminosEs, en: terminosEn },
  cookies: HAY_MEDICION
    ? { es: cookiesGaEs, en: cookiesGaEn }
    : { es: cookiesEs, en: cookiesEn },
  privacidad: { es: privacidadEs, en: privacidadEn },
} as const;

export type LegalSlug = keyof typeof LEGAL;
