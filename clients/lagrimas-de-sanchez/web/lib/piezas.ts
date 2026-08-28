/**
 * El inventario del estampado — 57 piezas.
 *
 * FUENTE CANÓNICA: la hoja del dueño «lagrimas-prompts-ilustraciones con
 * mejoras» (27-ago), que recortó el inventario anterior, más el bloque D de
 * aforismos aprobado aparte. Si una pieza no está aquí, no existe: la cola de
 * generación de iconos (diseno/iconos/cola.json) numera distinto porque sigue
 * el orden de la hoja, no el de la botella.
 *
 * Vive en código y no en el CMS a propósito: es producto, no copy. Cambiar una
 * pieza significa rehacer pantallas de serigrafía y volver a hornear mil
 * botellas.
 *
 * EXCLUIDA a la espera de decisión legal: «PSOE con la O de Playboy» — dos
 * marcas registradas horneadas en un producto a la venta. Alternativa
 * propuesta: conejo genérico con pajarita, sin siglas.
 *
 * `historia` es la lección de 19 Crimes: cada pieza cuenta algo, en una línea
 * y en la voz de la marca. Nunca imputa hechos: definiciones de diccionario.
 */

export type Bloque = "A" | "B" | "C" | "D";

export type Pieza = {
  n: number;
  bloque: Bloque;
  texto: string;
  /** El objeto del pictograma. Vacío si la pieza es solo tipografía. */
  objeto?: string;
  /** Una línea deadpan, estilo entrada de diccionario. */
  historia?: string;
};

export const BLOQUES: Record<Bloque, { nombre: string; nota: string }> = {
  A: { nombre: "Apodos", nota: "Los nombres. Ninguna cara." },
  B: { nombre: "Frases", nota: "El vocabulario de la década, palabra por palabra." },
  C: { nombre: "La casa", nota: "Las piezas que son la marca hablando de sí misma." },
  D: {
    nombre: "Aforismos",
    nota: "Frases hechas de contradicción. Como la época, pero en una línea.",
  },
};

export const PIEZAS: Pieza[] = [
  // ── A · Apodos ──────────────────────────────────────────────────────────
  { n: 1, bloque: "A", texto: "Galgo de Paiporta", objeto: "Galgo corriendo", historia: "El único galgo que corre alejándose de la caza." },
  { n: 2, bloque: "A", texto: "Chepas", objeto: "Figura encorvada de perfil", historia: "De tanto cargar con el Estado, se le nota." },
  { n: 3, bloque: "A", texto: "Chirimoyas", objeto: "Chirimoya con banda", historia: "Dulce por fuera. Llena de pepitas." },
  { n: 4, bloque: "A", texto: "Chiqui", objeto: "Boca con la lengua fuera", historia: "Lo que la boca calla, la lengua lo enseña." },
  { n: 5, bloque: "A", texto: "Pili Juerga", objeto: "Copa con llavero de hotel", historia: "Toda fiesta es institucional si te invitan por el cargo." },
  { n: 6, bloque: "A", texto: "La niña de la curva", objeto: "Señal de curva peligrosa", historia: "La leyenda dice que si paras, te cuenta su programa." },
  { n: 7, bloque: "A", texto: "Catedrática", objeto: "Sello de goma estampando", historia: "El título se estampa. El temario, ya si eso." },
  { n: 8, bloque: "A", texto: "Gracita Bolaños", objeto: "Mandil con campanilla", historia: "Sirve para todo. Literalmente." },
  { n: 9, bloque: "A", texto: "El portero", objeto: "Segurata de brazos cruzados", historia: "Decide quién entra. La lista no la hizo él." },
  { n: 10, bloque: "A", texto: "Cejas", objeto: "Una ceja de rombos", historia: "Optimistas por naturaleza: siempre mirando hacia arriba." },
  { n: 11, bloque: "A", texto: "La cajera", objeto: "Código de barras", historia: "Todo pasa por caja. Todo." },
  { n: 12, bloque: "A", texto: "Tucán", objeto: "Tucán con cazadora", historia: "Mucho pico." },
  { n: 13, bloque: "A", texto: "Charo", objeto: "Gafas y pelo corto", historia: "Icono pop. No pidió serlo." },
  { n: 14, bloque: "A", texto: "Marlaskona", objeto: "Mazo con goma de borrar", historia: "Golpea flojo y borra después." },
  { n: 15, bloque: "A", texto: "Felpudo VI", objeto: "Un felpudo" },
  { n: 16, bloque: "A", texto: "Hermanísimo", historia: "Grado superlativo. Se hereda." },
  { n: 17, bloque: "A", texto: "Oscargután", objeto: "La palabra en la cara de un orangután", historia: "Responde a todo. Sobre todo si no le preguntan." },
  { n: 18, bloque: "A", texto: "Javierito", objeto: "Cuernos de reno", historia: "Llegó por Navidad." },
  { n: 19, bloque: "A", texto: "Rufián", objeto: "s. m.", historia: "Sustantivo común. Consulte el diccionario." },
  { n: 20, bloque: "A", texto: "Mema" },
  { n: 21, bloque: "A", texto: "Patxi vergüenza ajena" },

  // ── B · Frases ──────────────────────────────────────────────────────────
  { n: 22, bloque: "B", texto: "Al menos no gobierna la ultraderecha" },
  { n: 23, bloque: "B", texto: "No dormiría tranquilo" },
  { n: 24, bloque: "B", texto: "España va como un cohete" },
  { n: 25, bloque: "B", texto: "Son las 5 y no he comido" },
  { n: 26, bloque: "B", texto: "Facha", historia: "Usted, probablemente." },
  { n: 27, bloque: "B", texto: "Yo estoy bien" },
  { n: 28, bloque: "B", texto: "Por 7 votos" },
  { n: 29, bloque: "B", texto: "Fiscal soplón" },
  { n: 30, bloque: "B", texto: "Ecologetas" },
  { n: 31, bloque: "B", texto: "Soy feminista porque soy socialista" },
  { n: 32, bloque: "B", texto: "Sincronizada", objeto: "Metrónomo", historia: "Nadan todos a la vez. Nadie sabe quién marca." },
  { n: 33, bloque: "B", texto: "La banda del Peugeot", objeto: "Coche con cuatro cabezas", historia: "De gira por España. Ya no tocan juntos." },
  { n: 34, bloque: "B", texto: "Fango", objeto: "Goteo en las letras", historia: "Materia prima nacional. Cosecha continua." },
  { n: 35, bloque: "B", texto: "Bulos", objeto: "Triángulo de aviso", historia: "Todo lo que incomoda, lo es." },
  { n: 36, bloque: "B", texto: "Telepedro", objeto: "Televisor con antena", historia: "Programación continua. Sin mando a distancia." },
  { n: 37, bloque: "B", texto: "Saunas", objeto: "Tres líneas de vapor", historia: "Mucho vapor. Poca transparencia." },
  { n: 38, bloque: "B", texto: "El puto amo", objeto: "Corona de tres puntas", historia: "Autoproclamado. Reelegido por sí mismo." },
  { n: 39, bloque: "B", texto: "El uno", objeto: "Dedo índice levantado", historia: "En toda lista, se vota al primero." },
  { n: 40, bloque: "B", texto: "Falcon", objeto: "Jet privado", historia: "Transporte público. Público lo paga, quiero decir." },
  { n: 41, bloque: "B", texto: "Máquina del fango", objeto: "Máquina con manivela", historia: "Se acciona sola." },
  { n: 42, bloque: "B", texto: "Cabalgar contradicciones", objeto: "Caballo", historia: "Deporte nacional. Medalla fija." },
  { n: 43, bloque: "B", texto: "Izquierda caviar", objeto: "Lata de caviar abierta", historia: "Puño en alto, carta de vinos en la otra." },

  // ── D · Aforismos ───────────────────────────────────────────────────────
  { n: 44, bloque: "D", texto: "Alma socialista, mente de tiburón" },
  { n: 45, bloque: "D", texto: "Transversal, como el IVA" },
  { n: 46, bloque: "D", texto: "Horizonte 2030, legislatura 2027" },
  { n: 47, bloque: "D", texto: "Compromiso firme hasta nueva orden" },
  { n: 48, bloque: "D", texto: "Escucha activa, decisión tomada" },
  { n: 49, bloque: "D", texto: "Resiliente, o sea, que aguantas" },
  { n: 50, bloque: "D", texto: "Transparencia total, previa cita" },
  { n: 51, bloque: "D", texto: "El pueblo primero. Después de mí." },
  { n: 52, bloque: "D", texto: "Cambio de opinión, no de sueldo" },
  { n: 53, bloque: "D", texto: "Vocación de servicio, nómina de por vida" },

  // ── C · La casa ─────────────────────────────────────────────────────────
  { n: 54, bloque: "C", texto: "Lagrimómetro", objeto: "Escala vertical de seis marcas" },
  { n: 55, bloque: "C", texto: "Pucherazo", objeto: "Urna con papeleta" },
  { n: 56, bloque: "C", texto: "Contiene lágrimas", objeto: "Una gota", historia: "Etiquetado honesto." },
  // Cayó de la hoja del dueño, pero es el hueco FÍSICO donde se numera a mano
  // cada botella: sin él, "numerada a mano" no tiene dónde ocurrir.
  { n: 57, bloque: "C", texto: "Edición nº ____", objeto: "Recuadro para numerar a mano" },
];

export const CON_PICTOGRAMA = PIEZAS.filter((p) => p.objeto).length;
