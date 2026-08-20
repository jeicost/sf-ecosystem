/**
 * El listado de creadores, tal y como lo pasó el CEO el 19-ago-2026.
 *
 * QUÉ PUBLICA ESTA SECCIÓN — decisión del CEO, 20-ago-2026. Es una lista de
 * **cuentas públicas que nos gustan** en cada destino, con su foto de perfil y
 * un enlace a su perfil. Recomendación editorial, no relación comercial: el
 * copy no puede sugerir en ningún momento que trabajen con discoolver, que
 * cobren, ni que hayan firmado nada.
 *
 * Las 43 fotos son la imagen de perfil pública de cada cuenta, obtenida con el
 * actor `apify~instagram-profile-scraper` (coste 0,11 $) y normalizada a un
 * cuadrado de 224 px por `scripts/fotos-creadores.mjs`.
 *
 * Si alguien pide salir de aquí, se le quita y punto — sin discutirlo. Esa es
 * la contrapartida de mencionar a gente sin pedirle permiso antes.
 *
 * `frase` sigue vacío a propósito: una cita en primera persona SÍ hay que
 * habérsela oído. Atribuir palabras a alguien no es lo mismo que enseñar su
 * foto de perfil.
 *
 * El `estado` viene del documento del CEO y se respeta tal cual:
 *  · verificado — arroba comprobada. Las 27 que venían de rankings de terceros
 *                 las confirmó el CEO el 19-ago-2026.
 *  · aportado   — lo pasó el equipo; a veces sin territorio asignado.
 *
 * `esPersona: false` marca estudios, cuentas colectivas y medios (Plan Madrid,
 * Bangkok Foodies, Lovin Dubai…). Sirven para volumen, pero **no valen para
 * esta sección**: su copy dice "gente que vive la ciudad y firma con su
 * nombre", y una cuenta de marca no firma nada.
 */
export type EstadoCreador = "verificado" | "aportado";

export type Creador = {
  nombre: string;
  handle: string;
  mercado: "es" | "th" | "ae";
  /** Ciudad concreta, o el país si trabaja por todo el territorio. */
  donde: string;
  /** Una de las ocho canónicas, o null si está por asignar. */
  territorio: string | null;
  estado: EstadoCreador;
  /** false = estudio, cuenta colectiva o medio. No firma con su nombre. */
  esPersona: boolean;
  /** Solo con permiso por escrito. Sin él, no hay retrato. */
  foto?: string;
  /** Suya, literal. Nunca escrita por nosotros. */
  frase?: string;
  /** Notas que condicionan el uso: agencia, tarifa, residencia… */
  aviso?: string;
};

export const CREADORES: Creador[] = [
  // ── España ────────────────────────────────────────────────────────────
  { nombre: "Pablo Cabezali", handle: "cenandoconpablo", foto: "/assets/creadores/cenandoconpablo.jpg", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Nacho Pla", handle: "nachopla12", foto: "/assets/creadores/nachopla12.jpg", mercado: "es", donde: "Madrid", territorio: "Vida nocturna", estado: "verificado", esPersona: true,
    aviso: "Representado por Go Talents: el contacto va por agencia y con tarifa." },
  { nombre: "Plan Madrid", handle: "planmadrid", foto: "/assets/creadores/planmadrid.jpg", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: false,
    aviso: "Es un estudio, no una persona: no puede firmar una recomendación." },
  { nombre: "Planea en Madrid", handle: "planeaenmadrid", foto: "/assets/creadores/planeaenmadrid.jpg", mercado: "es", donde: "Madrid", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "Alfonso Ortega", handle: "cocituber", foto: "/assets/creadores/cocituber.jpg", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Peldanyos", handle: "peldanyos", foto: "/assets/creadores/peldanyos.jpg", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Nicanor García", handle: "nicanorgarcia", foto: "/assets/creadores/nicanorgarcia.jpg", mercado: "es", donde: "Barcelona", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "Kike Arnaiz", handle: "kikearnaiz", foto: "/assets/creadores/kikearnaiz.jpg", mercado: "es", donde: "España", territorio: "Naturaleza y aire libre", estado: "verificado", esPersona: true },
  { nombre: "Ariane Hoyos", handle: "arianehoyos", foto: "/assets/creadores/arianehoyos.jpg", mercado: "es", donde: "Bizkaia", territorio: "Naturaleza y aire libre", estado: "verificado", esPersona: true },
  { nombre: "Rachel Bernabeu", handle: "rachelbernabeu", foto: "/assets/creadores/rachelbernabeu.jpg", mercado: "es", donde: "Barcelona", territorio: "Experiencias y eventos", estado: "verificado", esPersona: true },
  { nombre: "Danna Ponce", handle: "danielagartija", foto: "/assets/creadores/danielagartija.jpg", mercado: "es", donde: "España", territorio: "Alojamiento", estado: "verificado", esPersona: true },
  { nombre: "Miriam Iniesta", handle: "miriaminiesta", foto: "/assets/creadores/miriaminiesta.jpg", mercado: "es", donde: "España", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Buscando a Cere", handle: "buscandoacere", foto: "/assets/creadores/buscandoacere.jpg", mercado: "es", donde: "España", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Sergio Castillo", handle: "sergiocastillo.180", foto: "/assets/creadores/sergiocastillo.180.jpg", mercado: "es", donde: "España", territorio: null, estado: "aportado", esPersona: true },

  // ── Tailandia ─────────────────────────────────────────────────────────
  { nombre: "Paul Lee", handle: "impaullee", foto: "/assets/creadores/impaullee.jpg", mercado: "th", donde: "Tailandia", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Travis Leon Price", handle: "travisleon1", foto: "/assets/creadores/travisleon1.jpg", mercado: "th", donde: "Bangkok", territorio: "Vida nocturna", estado: "verificado", esPersona: true,
    aviso: "Prioridad nº1 del CEO. Contacto directo: travisprice09@gmail.com" },
  { nombre: "Phol Tantasatien", handle: "pholfoodmafia", foto: "/assets/creadores/pholfoodmafia.jpg", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Chef Pam", handle: "chefpam", foto: "/assets/creadores/chefpam.jpg", mercado: "th", donde: "Bangkok", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Bangkok Foodies", handle: "bangkokfoodies", foto: "/assets/creadores/bangkokfoodies.jpg", mercado: "th", donde: "Bangkok", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: false },
  { nombre: "Chin Chinawut", handle: "chinchinawut", foto: "/assets/creadores/chinchinawut.jpg", mercado: "th", donde: "Tailandia", territorio: "Naturaleza y aire libre", estado: "verificado", esPersona: true },
  { nombre: "I Roam Alone", handle: "i_roamalone", foto: "/assets/creadores/i_roamalone.jpg", mercado: "th", donde: "Tailandia", territorio: "Experiencias y eventos", estado: "verificado", esPersona: true },
  { nombre: "Dome Pakorn Lam", handle: "domepakornlam", foto: "/assets/creadores/domepakornlam.jpg", mercado: "th", donde: "Tailandia", territorio: "Alojamiento", estado: "verificado", esPersona: true },
  { nombre: "Neung Yutthaphum", handle: "iamneung", foto: "/assets/creadores/iamneung.jpg", mercado: "th", donde: "Tailandia", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "Army Palakorn", handle: "armypalakorn", foto: "/assets/creadores/armypalakorn.jpg", mercado: "th", donde: "Bangkok", territorio: "Experiencias y eventos", estado: "verificado", esPersona: true },
  { nombre: "Starvingtime", handle: "starvingtime", foto: "/assets/creadores/starvingtime.jpg", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: false },
  { nombre: "Mark Wiens", handle: "migrationology", foto: "/assets/creadores/migrationology.jpg", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true,
    aviso: "Audiencia global, no local: comprobar si su público está en Bangkok." },
  { nombre: "Peach Eat Laek", handle: "peach_eat_laek", foto: "/assets/creadores/peach_eat_laek.jpg", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true },
  { nombre: "Bangkok Foodie", handle: "bangkok.foodie", foto: "/assets/creadores/bangkok.foodie.jpg", mercado: "th", donde: "Bangkok", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: false },
  { nombre: "Chopstick Travel", handle: "chopsticktravel", foto: "/assets/creadores/chopsticktravel.jpg", mercado: "th", donde: "Asia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true },
  { nombre: "Foodie Girl Kinkakoi", handle: "foodiegirl.kinkakoi", foto: "/assets/creadores/foodiegirl.kinkakoi.jpg", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true },
  { nombre: "Foodie Munchies", handle: "foodie.munchies", foto: "/assets/creadores/foodie.munchies.jpg", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: false },
  { nombre: "Gin Carb BKK", handle: "gincarb.bkk", foto: "/assets/creadores/gincarb.bkk.jpg", mercado: "th", donde: "Bangkok", territorio: null, estado: "aportado", esPersona: false,
    aviso: "Confirmar si es coctelería: si lo es, cubre el hueco de vida nocturna." },
  { nombre: "Go Eat Go Drink", handle: "goeatgodrink", foto: "/assets/creadores/goeatgodrink.jpg", mercado: "th", donde: "Tailandia", territorio: null, estado: "aportado", esPersona: false,
    aviso: "Confirmar si cubre bebida y bares." },
  { nombre: "Emily Srichala", handle: "emilysrichala.blog", foto: "/assets/creadores/emilysrichala.blog.jpg", mercado: "th", donde: "Tailandia", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Sam Zack Tyler", handle: "samzacktyler", foto: "/assets/creadores/samzacktyler.jpg", mercado: "th", donde: "Tailandia", territorio: null, estado: "aportado", esPersona: true },

  // ── Emiratos ──────────────────────────────────────────────────────────
  { nombre: "Mr. Taster", handle: "mr.taster", foto: "/assets/creadores/mr.taster.jpg", mercado: "ae", donde: "Dubái", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Moayad Alsawaf", handle: "moayad.alsawaf", foto: "/assets/creadores/moayad.alsawaf.jpg", mercado: "ae", donde: "Dubái", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Latifa Shamsi", handle: "latifashamsi", foto: "/assets/creadores/latifashamsi.jpg", mercado: "ae", donde: "Dubái", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "WhereMyFoodAt", handle: "wheremyfoodat", foto: "/assets/creadores/wheremyfoodat.jpg", mercado: "ae", donde: "Dubái", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: false },
  { nombre: "Frying Pan Adventures", handle: "fryingpanadventures", foto: "/assets/creadores/fryingpanadventures.jpg", mercado: "ae", donde: "Dubái", territorio: "Arte y cultura", estado: "verificado", esPersona: false },
  { nombre: "My Fash Diary", handle: "myfashdiary", foto: "/assets/creadores/myfashdiary.jpg", mercado: "ae", donde: "Dubái", territorio: "Compras y moda", estado: "verificado", esPersona: true },
  { nombre: "Lavina Israni", handle: "lavinaisrani", foto: "/assets/creadores/lavinaisrani.jpg", mercado: "ae", donde: "Dubái", territorio: "Bienestar y belleza", estado: "verificado", esPersona: true },
  { nombre: "Ascia", handle: "ascia", foto: "/assets/creadores/ascia.jpg", mercado: "ae", donde: "Kuwait", territorio: "Compras y moda", estado: "verificado", esPersona: true,
    aviso: "Reside en Kuwait: cubre Dubái en visitas, no vive allí." },
  { nombre: "Lovin Dubai", handle: "lovindubai", foto: "/assets/creadores/lovindubai.jpg", mercado: "ae", donde: "Dubái", territorio: "Experiencias y eventos", estado: "verificado", esPersona: false,
    aviso: "Es un medio, no un creador: canal de distribución, no firma." },
];

/** Las ocho canónicas, en el orden de la sección de territorios de la home. */
export const TERRITORIOS = [
  "Restaurantes y cafés",
  "Vida nocturna",
  "Arte y cultura",
  "Experiencias y eventos",
  "Compras y moda",
  "Alojamiento",
  "Bienestar y belleza",
  "Naturaleza y aire libre",
] as const;

/**
 * Los que salen en la web.
 *
 * Decisión del CEO (19-ago-2026): entran TODOS. Son cuentas públicas y lo que
 * publica la página es cobertura de lo que ellos ya publican —nombre, arroba y
 * enlace a su perfil—, no un aval suyo ni una relación comercial. La firma con
 * cada uno hace falta para **comercializar guías** con su nombre, que es otro
 * trámite y no condiciona esta sección.
 *
 * Lo que sigue sin poder publicarse es la CARA: los derechos de imagen y la
 * autoría de la fotografía son cosa aparte, así que `foto` sigue vacío hasta
 * que exista permiso.
 *
 * Salen TODOS, también los ocho que aún no tienen territorio asignado: ahora el
 * territorio es su propia línea bajo la arroba, así que cuando falta
 * simplemente no se pinta. Antes se caían porque la ficha imprimía
 * "Ciudad · Territorio" en una sola línea y sin el segundo dato salía coja.
 */
export function creadoresPublicables(): Creador[] {
  return CREADORES;
}

/**
 * Agrupados POR DESTINO, que es como los pidió el CEO y como los busca el
 * visitante: quien va a Bangkok quiere ver quién cubre Bangkok, no quién cubre
 * Tailandia. Los destinos abiertos van primero y en el orden de la colección;
 * los que trabajan a nivel de país cierran cada bloque de mercado.
 */
/**
 * Agrupados por PAÍS (decisión del CEO, 19-ago). Por ciudad salían nueve
 * bloques para 47 nombres, tres de ellos con una sola persona; por país son
 * tres y cada uno se lee de un vistazo. La ciudad concreta no se pierde: sigue
 * impresa bajo cada creador.
 *
 * Emiratos va marcado como próximamente: allí no hay catálogo abierto todavía.
 */
export type BloquePais = {
  mercado: Creador["mercado"];
  /** true = el destino aún no está abierto. */
  proximamente: boolean;
  lista: Creador[];
};

export function creadoresPorPais(): BloquePais[] {
  const orden: Creador["mercado"][] = ["es", "th", "ae"];
  return orden
    .map((mercado) => ({
      mercado,
      proximamente: mercado === "ae",
      lista: CREADORES.filter((c) => c.mercado === mercado),
    }))
    .filter((b) => b.lista.length > 0);
}

/**
 * Rota el arranque de la lista para que en cada carga no encabece siempre el
 * mismo. Es una ROTACIÓN, no una baraja: el orden relativo se conserva, así que
 * el bloque no se descompone y todos pasan por la primera posición.
 *
 * El desplazamiento lo decide quien llama, no esta función: el componente lo
 * calcula ya montado en el cliente. Sortearlo en el servidor no serviría —la
 * home se prerenderiza y el sorteo se quedaría congelado hasta el siguiente
 * build— y hacerlo durante el render rompería la hidratación.
 */
export function rotar<T>(lista: T[], desplazamiento: number): T[] {
  if (lista.length < 2) return lista;
  const n = ((desplazamiento % lista.length) + lista.length) % lista.length;
  return [...lista.slice(n), ...lista.slice(0, n)];
}

/**
 * Iniciales para el avatar de quien todavía no tiene foto cedida, y un tono
 * estable sacado de la arroba: el mismo creador siempre sale del mismo color,
 * y el bloque se ve variado sin ser aleatorio en cada carga.
 */
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

const TONOS_AVATAR = ["#c426c4", "#00d4d4", "#c9ff3f", "#e04ce0", "#7a5cf0", "#f4b47a"];

export function tonoAvatar(handle: string): string {
  let n = 0;
  for (const ch of handle) n = (n + ch.charCodeAt(0)) % 997;
  return TONOS_AVATAR[n % TONOS_AVATAR.length];
}

/**
 * Los lugares que se escriben distinto en inglés. `donde` es texto libre y a
 * veces es ciudad (Madrid, Bangkok) y a veces país (España, Tailandia): las
 * ciudades se escriben igual en los dos idiomas y solo hay que traducir las
 * que cambian. Sin esto, la web inglesa enseñaba «España» y «Tailandia» en las
 * fichas de creadores — 22 apariciones, encontrado el 20-ago-2026 al revisar
 * qué caía al español dentro de /en.
 */
export const LUGAR_EN: Record<string, string> = {
  "España": "Spain",
  "Tailandia": "Thailand",
  "Dubái": "Dubai",
};

/** El lugar de un creador en el idioma pedido. */
export function lugar(donde: string, locale: string): string {
  return locale === "es" ? donde : (LUGAR_EN[donde] ?? donde);
}
