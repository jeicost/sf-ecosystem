import { ICONOS_PNG } from '@/lib/tenders/iconos'

// Sistema de diseño del Word de Licitaciones (7-oct-2026).
//
// Un solo constructor sirve a todas las marcas (GTD azul, GLS y Albasanz
// amarillas, Dadybox azul petróleo) y la plantilla solo trae dos colores. De
// esos dos se DERIVA aquí todo lo demás: el acento como relleno, el acento como
// color de texto (un amarillo no se lee sobre blanco), una tinta al 7 % para
// la cebra de las tablas y los fondos suaves, y unos grises neutros con un
// sesgo mínimo hacia el acento para que el gris de GTD sea frío y el de GLS
// cálido sin que nadie lo note. Las escalas (tipografía, espacios) son fijas:
// la coherencia entre marcas está en que todas usan la misma.
//
// Unidades: colores hex SIN '#'; tamaños de letra en medios puntos (docx);
// espacios en DXA (1/20 pt).

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(0, 6), 16)
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [51, 51, 51]
}
const hex2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase()

/** Mezcla lineal en RGB: `t` = 0 devuelve `a`, `t` = 1 devuelve `b`. */
export function mezclar(a: string, b: string, t: number): string {
  const x = rgb(a), y = rgb(b)
  return [0, 1, 2].map((i) => hex2(x[i] + (y[i] - x[i]) * t)).join('')
}

/** Luminancia relativa (0-1, WCAG) de un hex sin '#'. */
export function luminancia(hex: string): number {
  const c = rgb(hex).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export interface Paleta {
  /** El acento tal cual: relleno de la caja del número, cabecera de tabla, filete de la cabecera generada. */
  acento: string
  /** El acento como COLOR DE TEXTO sobre blanco. Si es claro (amarillos), un carbón con su matiz. */
  acentoTexto: string
  /** Un paso más oscuro que el acento: filete de cierre de las tablas. */
  acentoOscuro: string
  /** Texto encima del acento. */
  sobreAcento: string
  portada: string
  sobrePortada: string
  /** Acento al 7 % sobre blanco: cebra y losetas de icono. */
  tinta: string
  /** Acento al 16 %: fondos de resalte suave. */
  tintaMedia: string
  /** Filetes finos (0,5 pt). */
  linea: string
  texto: string
  textoSuave: string
  textoMudo: string
  /** Avisos editoriales (lo que NO debe llegar a la Administración): fijos, no dependen de la marca. */
  ambar: { texto: string; borde: string; fondo: string; resalte: string }
}

const NEGRO_CALIDO = '1F1F1F'
const BLANCO = 'FFFFFF'

/** Texto que se lee ENCIMA de un fondo: blanco sobre oscuro, casi negro sobre claro. */
export function contrasteSobre(fondo: string): string { return luminancia(fondo) > 0.45 ? '1A1A1A' : BLANCO }

export function paleta(cover: string, accent: string): Paleta {
  const claro = luminancia(accent) > 0.45
  return {
    acento: accent,
    acentoTexto: claro ? mezclar(NEGRO_CALIDO, accent, 0.1) : accent,
    acentoOscuro: mezclar(accent, '000000', claro ? 0.22 : 0.3),
    sobreAcento: contrasteSobre(accent),
    portada: cover,
    sobrePortada: contrasteSobre(cover),
    tinta: mezclar(BLANCO, accent, 0.07),
    tintaMedia: mezclar(BLANCO, accent, 0.16),
    linea: mezclar('CFCFCF', accent, 0.18),
    texto: mezclar('2E2E2E', accent, 0.06),
    textoSuave: mezclar('6A6A6A', accent, 0.08),
    textoMudo: mezclar('9C9C9C', accent, 0.08),
    ambar: { texto: '8A5A00', borde: 'E0A400', fondo: 'FFF6E0', resalte: 'FFE08A' },
  }
}

// ---------------------------------------------------------------------------
// Escala tipográfica (medios puntos)
// ---------------------------------------------------------------------------

export const TIPO = {
  portadaRotulo: 80,     // 40 pt  «MEMORIA TÉCNICA»
  portadaTitulo: 30,     // 15 pt  título del contrato
  portadaEtiqueta: 17,   // 8,5 pt rótulo pequeño en versales espaciadas
  portadaEmpresa: 24,    // 12 pt
  portadaMeta: 21,       // 10,5 pt
  h1: 28,                // 14 pt  en mayúsculas
  h1Numero: 28,
  h2: 24,                // 12 pt
  cuerpo: 22,            // 11 pt
  indice: 21,            // 10,5 pt
  indiceSub: 20,         // 10 pt
  tabla: 19,             // 9,5 pt
  tablaDensa: 18,        // 9 pt   (más de 4 columnas o más de 12 filas)
  tablaCabecera: 17,     // 8,5 pt en versales espaciadas
  pieTabla: 20,          // 10 pt  negrita
  pieFigura: 18,         // 9 pt   cursiva
  nota: 18,              // 9 pt
  cabecera: 16,          // 8 pt
  pieDoc: 14,            // 7 pt
} as const

// ---------------------------------------------------------------------------
// Espaciado (DXA). Unidad base: 120 = 6 pt.
// ---------------------------------------------------------------------------

export const ESPACIO = {
  parrafo: 120,
  item: 60,
  antesH1: 420,
  despuesH1: 200,
  antesH2: 320,
  despuesH2: 120,
  antesTabla: 80,
  despuesTabla: 240,
  antesAviso: 200,
  despuesAviso: 240,
  /** Lado de la caja del número y de la loseta del icono en los títulos. */
  cajaTitulo: 640,
  /** Hueco entre la caja y el texto del título. */
  huecoTitulo: 200,
  celdaV: 90,
  celdaH: 140,
  filaMin: 380,
  cabeceraMin: 440,
} as const

/** Interlineado del cuerpo (240 = sencillo). */
export const INTERLINEADO = 276

// ---------------------------------------------------------------------------
// Iconos de sección (Lucide, PNG monocromos generados una vez)
// ---------------------------------------------------------------------------

/**
 * Elección por palabras clave del título. El orden importa: la primera regla
 * que casa gana, así «plan de contingencia» es salvavidas y no plan, y
 * «seguridad de la información» es escudo antes que «seguridad y salud».
 * Lo que no casa va con el documento genérico.
 */
const REGLAS_ICONO: [RegExp, string][] = [
  [/\banexos?\b/, 'paperclip'],
  [/\b(contingencia|continuidad|emergencias?|imprevistos?)\b/, 'life-buoy'],
  [/\b(incidencias?|reclamaciones|no conformidad(es)?|quejas?)\b/, 'triangle-alert'],
  [/\b(trazabilidad|seguimiento|localizacion|control de (envios|entregas)|prueba de entrega|pod)\b/, 'scan-barcode'],
  [/\b(proteccion de datos|confidencialidad|seguridad de la informacion|ens|rgpd|lopd|ciberseguridad)\b/, 'shield-check'],
  [/\b(seguridad|prevencion|prl|riesgos laborales)\b/, 'shield-check'],
  [/\b(calidad|iso ?\d|certificaciones?|certificados?|acreditaciones?|mejora continua)\b/, 'badge-check'],
  [/\b(medio ?ambient\w*|sostenib\w*|ambiental(es)?|emisiones|huella|ecologic\w*|verde)\b/, 'leaf'],
  [/\b(rsc|responsabilidad social|integracion social|igualdad|inclusion|discapacidad|conciliacion|social(es)?)\b/, 'heart-handshake'],
  [/\b(formacion|capacitacion|cualificacion)\b/, 'graduation-cap'],
  [/\b(equipo humano|personal|plantilla|recursos humanos|rrhh|organigrama|equipo de trabajo|medios humanos|responsables?)\b/, 'users'],
  [/\b(flota|vehiculos?|furgonetas?|camiones?|motos?|medios materiales|medios tecnicos|material(es)?)\b/, 'truck'],
  [/\b(instalaciones|naves?|almacen(es)?|delegaciones|sedes?|infraestructuras?)\b/, 'building-2'],
  [/\b(coordinacion|comunicacion|interlocucion|interlocutor(es)?|atencion al cliente|relacion con)\b/, 'messages-square'],
  [/\b(puesta en marcha|implantacion|transicion|arranque|inicio del (servicio|contrato)|cronograma|calendario|plazos? de ejecucion)\b/, 'calendar-check'],
  [/\b(tecnolog\w*|informatic\w*|software|aplicacion(es)?|app|sistemas? de informacion|digital\w*|plataforma|it|ti)\b/, 'monitor-smartphone'],
  [/\b(valor(es)? anadid\w*|mejoras?|servicios adicionales|compromisos adicionales|extras?)\b/, 'circle-plus'],
  [/\b(precios?|economic\w*|oferta|presupuesto|tarifas?|costes?|facturacion)\b/, 'euro'],
  [/\b(horarios?|tiempos? de (entrega|respuesta)|plazos?|frecuencias?|urgen\w*)\b/, 'clock'],
  [/\b(ambito geografico|cobertura|rutas?|zonas?|territori\w*|red de)\b/, 'map'],
  [/\b(metodologia|organizacion del (servicio|trabajo)|procedimientos?|procesos?|modelo operativo|operativa)\b/, 'layers'],
  [/\b(plan(es)? de trabajo|planificacion|programa de trabajo|plan)\b/, 'list-checks'],
  [/\b(objeto|alcance|descripcion del servicio|prestacion|servicios?|propuesta tecnica|memoria)\b/, 'clipboard-list'],
  [/\b(paqueteria|mensajeria|envios|entregas|recogidas|distribucion|transporte|logistic\w*)\b/, 'package'],
]

/** Sin acentos ni mayúsculas: así las reglas son ASCII y `\b` funciona (en JS no reconoce la ñ ni las vocales acentuadas como letra). */
function plano(s: string): string {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/gi, 'n').toLowerCase()
}

export function iconoParaTitulo(titulo: string): string {
  const t = plano(titulo)
  for (const [re, nombre] of REGLAS_ICONO) if (re.test(t)) return nombre
  return 'file-text'
}

const cacheIconos = new Map<string, Buffer | null>()

/** PNG 128×128 del icono en la variante pedida; null si no existe (el título sale sin icono, nunca falla). */
export function iconoPng(nombre: string, variante: 'oscuro' | 'blanco'): Buffer | null {
  const clave = `${nombre}-${variante}`
  if (!cacheIconos.has(clave)) {
    const b64 = ICONOS_PNG[clave]
    cacheIconos.set(clave, b64 ? Buffer.from(b64, 'base64') : null)
  }
  return cacheIconos.get(clave) ?? null
}

export const ICONO_INDICE = 'list'
export const ICONO_NOTAS = 'triangle-alert'
export const ICONO_ANEXOS = 'paperclip'
