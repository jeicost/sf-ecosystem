/**
 * El listado de creadores, tal y como lo pasó el CEO el 19-ago-2026.
 *
 * QUÉ SE PUEDE PUBLICAR Y QUÉ NO. Estar en esta lista no basta para salir en la
 * web. Hay dos permisos distintos y se confunden con facilidad:
 *
 *  · **Citar a alguien como fuente** (nombre + arroba + enlace a su perfil) es
 *    atribución editorial. Se puede, y es lo que hace `estado: "verificado"`.
 *  · **Usar su foto y su cara** en una página comercial necesita permiso por
 *    escrito: hay derechos de imagen y, además, la fotografía tiene su propio
 *    autor. Bajarla de Instagram no da ninguno de los dos.
 *
 * Por eso `foto` y `frase` solo se rellenan cuando existe ese permiso, y el
 * componente enseña retratos únicamente si los hay. Sin permiso se sirve la
 * atribución, que ya es cierta y ya es útil.
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
  { nombre: "Pablo Cabezali", handle: "cenandoconpablo", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Nacho Pla", handle: "nachopla12", mercado: "es", donde: "Madrid", territorio: "Vida nocturna", estado: "verificado", esPersona: true,
    aviso: "Representado por Go Talents: el contacto va por agencia y con tarifa." },
  { nombre: "Plan Madrid", handle: "planmadrid", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: false,
    aviso: "Es un estudio, no una persona: no puede firmar una recomendación." },
  { nombre: "Planea en Madrid", handle: "planeaenmadrid", mercado: "es", donde: "Madrid", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "Alfonso Ortega", handle: "cocituber", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Peldanyos", handle: "peldanyos", mercado: "es", donde: "Madrid", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Nicanor García", handle: "nicanorgarcia", mercado: "es", donde: "Barcelona", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "Kike Arnaiz", handle: "kikearnaiz", mercado: "es", donde: "España", territorio: "Naturaleza y aire libre", estado: "verificado", esPersona: true },
  { nombre: "Ariane Hoyos", handle: "arianehoyos", mercado: "es", donde: "Bizkaia", territorio: "Naturaleza y aire libre", estado: "verificado", esPersona: true },
  { nombre: "Rachel Bernabeu", handle: "rachelbernabeu", mercado: "es", donde: "Barcelona", territorio: "Experiencias y eventos", estado: "verificado", esPersona: true },
  { nombre: "Danna Ponce", handle: "dannaponce", mercado: "es", donde: "España", territorio: "Alojamiento", estado: "verificado", esPersona: true },
  { nombre: "Miriam Iniesta", handle: "miriaminiesta", mercado: "es", donde: "España", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Buscando a Cere", handle: "buscandoacere", mercado: "es", donde: "España", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Sergio Castillo", handle: "sergiocastillo.180", mercado: "es", donde: "España", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Paul Lee", handle: "impaullee", mercado: "es", donde: "España", territorio: null, estado: "aportado", esPersona: true },

  // ── Tailandia ─────────────────────────────────────────────────────────
  { nombre: "Travis Leon Price", handle: "travisleon1", mercado: "th", donde: "Bangkok", territorio: "Vida nocturna", estado: "verificado", esPersona: true,
    aviso: "Prioridad nº1 del CEO. Contacto directo: travisprice09@gmail.com" },
  { nombre: "Phol Tantasatien", handle: "pholfoodmafia", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Chef Pam", handle: "chefpam", mercado: "th", donde: "Bangkok", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Bangkok Foodies", handle: "bangkokfoodies", mercado: "th", donde: "Bangkok", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: false },
  { nombre: "Chin Chinawut", handle: "chinchinawut", mercado: "th", donde: "Tailandia", territorio: "Naturaleza y aire libre", estado: "verificado", esPersona: true },
  { nombre: "I Roam Alone", handle: "i_roamalone", mercado: "th", donde: "Tailandia", territorio: "Experiencias y eventos", estado: "verificado", esPersona: true },
  { nombre: "Dome Pakorn Lam", handle: "domepakornlam", mercado: "th", donde: "Tailandia", territorio: "Alojamiento", estado: "verificado", esPersona: true },
  { nombre: "Neung Yutthaphum", handle: "iamneung", mercado: "th", donde: "Tailandia", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "Mai Phed Mai Aroi", handle: "maiphedmaiaroi", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Army Palakorn", handle: "armypalakorn", mercado: "th", donde: "Bangkok", territorio: "Experiencias y eventos", estado: "verificado", esPersona: true },
  { nombre: "Starvingtime", handle: "starvingtime", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: false },
  { nombre: "Mark Wiens", handle: "migrationology", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true,
    aviso: "Audiencia global, no local: comprobar si su público está en Bangkok." },
  { nombre: "Peach Eat Laek", handle: "peach_eat_laek", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true },
  { nombre: "Bangkok Foodie", handle: "bangkok.foodie", mercado: "th", donde: "Bangkok", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: false },
  { nombre: "Chopstick Travel", handle: "chopsticktravel", mercado: "th", donde: "Asia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true },
  { nombre: "Foodie Girl Kinkakoi", handle: "foodiegirl.kinkakoi", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: true },
  { nombre: "Foodie Munchies", handle: "foodie.munchies", mercado: "th", donde: "Tailandia", territorio: "Restaurantes y cafés", estado: "aportado", esPersona: false },
  { nombre: "Gin Carb BKK", handle: "gincarb.bkk", mercado: "th", donde: "Bangkok", territorio: null, estado: "aportado", esPersona: false,
    aviso: "Confirmar si es coctelería: si lo es, cubre el hueco de vida nocturna." },
  { nombre: "Go Eat Go Drink", handle: "goeatgodrink", mercado: "th", donde: "Tailandia", territorio: null, estado: "aportado", esPersona: false,
    aviso: "Confirmar si cubre bebida y bares." },
  { nombre: "Emily Srichala", handle: "emilysrichala.blog", mercado: "th", donde: "Tailandia", territorio: null, estado: "aportado", esPersona: true },
  { nombre: "Sam Zack Tyler", handle: "samzacktyler", mercado: "th", donde: "Tailandia", territorio: null, estado: "aportado", esPersona: true },

  // ── Emiratos ──────────────────────────────────────────────────────────
  { nombre: "Mr. Taster", handle: "mr.taster", mercado: "ae", donde: "Dubái", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Moayad Alsawaf", handle: "moayadalsawaf", mercado: "ae", donde: "Dubái", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "Ahmed Rashid", handle: "ahmedrashid", mercado: "ae", donde: "Dubái", territorio: "Experiencias y eventos", estado: "verificado", esPersona: true },
  { nombre: "Latifa Shamsi", handle: "latifashamsi", mercado: "ae", donde: "Dubái", territorio: "Arte y cultura", estado: "verificado", esPersona: true },
  { nombre: "WhereMyFoodAt", handle: "wheremyfoodat", mercado: "ae", donde: "Dubái", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: false },
  { nombre: "Frying Pan Adventures", handle: "fryingpanadventures", mercado: "ae", donde: "Dubái", territorio: "Arte y cultura", estado: "verificado", esPersona: false },
  { nombre: "FooDiva", handle: "foodivadubai", mercado: "ae", donde: "Dubái", territorio: "Restaurantes y cafés", estado: "verificado", esPersona: true },
  { nombre: "My Fash Diary", handle: "myfashdiary", mercado: "ae", donde: "Dubái", territorio: "Compras y moda", estado: "verificado", esPersona: true },
  { nombre: "Lavina Israni", handle: "lavinaisrani", mercado: "ae", donde: "Dubái", territorio: "Bienestar y belleza", estado: "verificado", esPersona: true },
  { nombre: "Ascia", handle: "ascia", mercado: "ae", donde: "Kuwait", territorio: "Compras y moda", estado: "verificado", esPersona: true,
    aviso: "Reside en Kuwait: cubre Dubái en visitas, no vive allí." },
  { nombre: "Lovin Dubai", handle: "lovindubai", mercado: "ae", donde: "Dubái", territorio: "Experiencias y eventos", estado: "verificado", esPersona: false,
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
