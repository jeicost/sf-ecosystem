// Tipografía de marca para los motores de exportación (2026-08-17).
//
// El Cerebro guarda la tipografía desde hace tiempo — el editor escribe
// brand_data.visual_identity.typography.{heading_font, body_font, accent_font,
// notes}, el onboarding lo mismo, el brand-briefing lo devuelve como
// {heading, body} y las filas viejas lo tienen como texto libre («Playfair
// Display para títulos, Inter para cuerpo») — pero ningún exportador lo leía:
// el color de marca viajaba hasta la slide (visual_identity.colors.primary →
// brandColor → DeckTheme) y la letra se quedaba en el Cerebro, con los cuatro
// motores de presentación llevando `const FONT = 'Inter' | 'Arial'` a fuego.
// De ahí la queja del CEO: «¿las plantillas cambian el tipo de letra?». No.
//
// Este módulo es el eslabón que faltaba: función PURA (sin BD, sin red) que
// traduce «lo que haya» en el Cerebro a nombres de fuente utilizables por
// pptxgenjs (fontFace: un solo nombre) y por CSS (font-family: pila con la de
// marca primero y un fallback seguro detrás). Tolerante a las tres formas en
// que el dato aparece en producción y con fallback a los defaults históricos
// de cada motor, para que un Cerebro sin tipografía siga exportando EXACTAMENTE
// igual que hasta ahora.
//
// Lo que NO hace, por decisión del CEO (va después del lanzamiento): importar
// el estilo de un .pptx real del cliente.

/** Lo que puede llegar: la tipografía en sí, visual_identity, brand_data
 *  entero, un BrandBrainContext, un string libre, o nada. */
export type BrandTypographyInput = string | Record<string, unknown> | null | undefined

export interface BrandFontDefaults {
  heading: string
  body: string
}

export interface BrandFonts {
  /** Nombre limpio de la fuente de titulares — lo que va en `fontFace` de pptxgenjs. */
  heading: string
  /** Nombre limpio de la fuente de cuerpo. */
  body: string
  /** Pila CSS para HTML: la de marca primero (entrecomillada) y detrás un fallback seguro. */
  headingStack: string
  bodyStack: string
  /** false = el Cerebro no tenía nada usable y se han aplicado los defaults del motor. */
  fromBrain: boolean
  /** Familias que NO están en la lista segura: en HTML hay que cargarlas (Google
   *  Fonts); en PPTX PowerPoint las sustituye en silencio si la máquina que abre
   *  el archivo no las tiene instaladas. Sin duplicados. */
  webFontFamilies: string[]
}

// ── Fuentes seguras para PPTX ─────────────────────────────────────────────
//
// Un .pptx no embebe fuentes (pptxgenjs no lo soporta): si la fuente de marca
// no está instalada donde se abre, PowerPoint/Keynote/Google Slides la
// sustituyen sin avisar. Estas están en cualquier Windows/macOS/Office y en
// Google Slides. Inter va en la lista porque es el default histórico del deck
// (se carga por Google Fonts en HTML y Office la sustituye por una sans
// equivalente): quitarla obligaría a tratar como «web font» todos los decks
// que hoy salen bien.
export const PPTX_SAFE_FONTS: readonly string[] = [
  'Arial',
  'Calibri',
  'Georgia',
  'Helvetica',
  'Times New Roman',
  'Verdana',
  'Inter',
  'Tahoma',
  'Trebuchet MS',
]

const SAFE_SET = new Set(PPTX_SAFE_FONTS.map((f) => f.toLowerCase()))

export function isPptxSafeFont(family: string): boolean {
  return SAFE_SET.has(String(family ?? '').trim().toLowerCase())
}

// ── Pilas CSS de fallback ─────────────────────────────────────────────────
//
// La pila sans es la que el deck HTML lleva desde siempre en <body>: si la de
// marca falla en el navegador se cae a lo mismo que se veía antes de esto.
const SANS_TAIL = ['Inter', 'Helvetica Neue', 'Arial']
const SERIF_TAIL = ['Georgia', 'Times New Roman']

// Heurística por nombre — no hay metadatos: si parece serif, el fallback es
// serif para que la sustitución no cambie el carácter del documento.
// «Sans»/«Grotesk» ganan a todo lo demás (Source Sans, Neue Haas Grotesk…).
const SERIF_HINT =
  /serif|playfair|garamond|georgia|times|merriweather|lora|baskerville|bodoni|didot|cormorant|caslon|crimson|spectral|fraunces|cardo|literata|newsreader|prata|slab|bitter|vollkorn|zilla|domine|gelasio|tinos|cambria|palatino|antiqua|minion|sabon|tiempos|canela|reckless|editorial|gt super|freight/i
const SANS_HINT = /sans|grotesk|grotesque|gothic/i

function looksSerif(family: string): boolean {
  if (SANS_HINT.test(family)) return false
  return SERIF_HINT.test(family)
}

function cssQuote(family: string): string {
  return `'${family.replace(/'/g, "\\'")}'`
}

/** Pila CSS: marca primero, fallback detrás (sin repetir la de marca si ya
 *  estaba en la cola, p.ej. Inter o Arial). */
export function cssFontStack(family: string): string {
  const serif = looksSerif(family)
  const tail = (serif ? SERIF_TAIL : SANS_TAIL).filter((f) => f.toLowerCase() !== family.trim().toLowerCase())
  return [family.trim(), ...tail].map(cssQuote).join(', ') + (serif ? ', serif' : ', sans-serif')
}

/**
 * Enlaces de Google Fonts para una familia que no es segura. Se devuelven DOS
 * hrefs a propósito y el llamador emite un <link> por cada uno:
 *  - `:wght@400;700` — regular + bold reales, que es lo que usan los titulares;
 *  - sin ejes — sólo la regular.
 * Comprobado contra la API CSS2 (2026-08-17): una familia desconocida devuelve
 * 400 y ese <link> simplemente no aplica; por eso NUNCA se mete la de marca en
 * la misma URL que Inter — un 400 tiraría también la fuente de fallback. El
 * segundo enlace cubre familias que sólo tienen un peso (Anton, Bebas Neue…):
 * el navegador sintetiza la negrita en vez de quedarse sin fuente.
 */
export function googleFontsHrefs(family: string): string[] {
  const fam = encodeURIComponent(family.trim()).replace(/%20/g, '+')
  if (!fam) return []
  return [
    `https://fonts.googleapis.com/css2?family=${fam}:wght@400;700&display=swap`,
    `https://fonts.googleapis.com/css2?family=${fam}&display=swap`,
  ]
}

// ── Extracción: de «lo que haya» a {heading?, body?} ──────────────────────

export interface ExtractedTypography {
  heading?: string
  body?: string
}

// Palabras que dicen «esto es para títulos» / «esto es para cuerpo», en los
// dos idiomas en que escriben los clientes. Deliberadamente NO están
// «display» ni «text» a secas: forman parte de nombres de fuente reales
// (Playfair Display, SF Pro Text) y clasificarían mal justo esos casos.
const HEADING_RE = /\b(t[ií]tulos?|titulares?|headings?|headlines?|encabezados?|cabeceras?|h1|primary|principal|primaria|main)\b/i
const BODY_RE = /\b(cuerpo|body|p[áa]rrafos?|paragraphs?|texto|copy|secondary|secundaria|running)\b/i

// Ruido que acompaña al nombre y hay que quitar antes de quedarnos con él:
// las palabras de rol, los conectores y la morralla habitual de una frase
// («usamos X para todo», «X de Google Fonts»). Todo con \b: «in» no toca a
// Inter, «la» no toca a Lato.
const NOISE_RE =
  /\b(t[ií]tulos?|titulares?|headings?|headlines?|encabezados?|cabeceras?|h1|primary|principal|primaria|main|cuerpo|body|p[áa]rrafos?|paragraphs?|texto|copy|secondary|secundaria|running|para|for|de|del|of|the|los|las|el|la|en|in|as|como|use|usar|usamos|utilizamos|uses|used|using|con|with|font|fonts|fuente|fuentes|typeface|typefaces|tipograf[ií]a|family|familia|google|weight|peso|regular|we|our|nuestra|nuestro|is|es|son|are|everywhere|everything|todo|toda|always|siempre|marca|brand|s[oó]lo|only|tambi[eé]n|also|both|ambas|misma|same|una|un|a|an|it|its|su|sus|resto|rest|dem[aá]s|else|y|and|e|o|or)\b/gi

// Pesos/estilos al final del nombre: «Inter Bold», «Roboto Light» → la
// familia es Inter/Roboto (en CSS «Inter Bold» no existe como familia). «Black»
// se deja: Archivo Black es una familia de verdad.
const TRAILING_WEIGHT_RE = /\s+(bold|semi-?bold|extra-?bold|light|extra-?light|thin|medium|italic|oblique|book|heavy)$/i

// Familias genéricas de CSS: nunca son un nombre de fuente para PPTX.
const GENERIC_RE = /^(sans-serif|serif|monospace|system-ui|cursive|fantasy|ui-sans-serif|ui-serif|inherit|default|none|n\/a|tbd|-)$/i

// Fragmentos que son metadatos, no una fuente («notes: usar en mayúsculas»).
const SKIP_SEGMENT_RE = /^\s*(notes?|notas?|status|estado|hierarchy|jerarqu[ií]a|usage|uso|sizes?|tama[ñn]os?)\s*[:\-–]/i

// Ejes de Google Fonts y pesos numéricos pegados al nombre: «Inter:wght@400;700», «Lora 400/700».
const AXES_RE = /:?\s*(ital,)?wght@[\d.,;]+|\b\d{3}(\s*[\/,-]\s*\d{3})*\b/g

/** Limpia un fragmento hasta dejar (o no) un nombre de fuente plausible. */
export function cleanFontName(raw: unknown): string {
  if (SKIP_SEGMENT_RE.test(String(raw ?? ''))) return ''
  const s = String(raw ?? '')
    .replace(/_/g, ' ')
    .replace(/\([^)]*\)/g, ' ') // «(400/700)», «(Google Fonts)», «(headings)»
    .replace(/["'“”‘’`«»]/g, ' ')
    .replace(AXES_RE, ' ')
    .replace(NOISE_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[\s:.\-–—,;=]+|[\s:.\-–—,;=]+$/g, '')
    .replace(TRAILING_WEIGHT_RE, '')
  if (!s || GENERIC_RE.test(s)) return ''
  // Nombres reales: letras, dígitos, espacios, guiones, «+» (Source Sans 3, PT
  // Sans, Helvetica Neue, SF Pro Display, GT America…) y como mucho cinco
  // palabras (Neue Haas Grotesk Display Pro). Con esto se descartan restos de
  // frase («no tenemos», «ver manual de marca») que no parecen una fuente.
  if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 .+\-]{0,49}$/.test(s)) return ''
  if (s.length < 2 || s.split(' ').length > 5) return ''
  // Capitaliza cada palabra: los clientes escriben «inter» o «playfair display»
  // y tanto CSS como PowerPoint son tolerantes, pero el nombre limpio queda mejor.
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase())
}

/**
 * Texto libre → {heading?, body?}. Cubre lo que se ve en producción:
 *   «Playfair Display para títulos, Inter para cuerpo»
 *   «Headings: Montserrat; Body: Open Sans»
 *   «Typography: heading_font: Anton, body_font: Inter.» (visualIdentitySummary)
 *   «Inter»  «Inter, sans-serif»  «Montserrat / Lato»
 * Regla: los fragmentos con palabra de rol se asignan a su rol; los que no la
 * tienen rellenan por orden lo que quede (primero títulos, luego cuerpo). Un
 * único nombre sirve para los dos.
 */
export function parseTypographyText(text: unknown): ExtractedTypography {
  // «heading_font: Anton» — sin esto \bheading\b no casa (el «_» es \w).
  const src = String(text ?? '')
    .replace(/_/g, ' ')
    .replace(/^\s*(typography|tipograf[ií]a)\s*[:\-–]\s*/i, '')
    .trim()
  if (!src) return {}
  // Separadores: puntuación, «y/e/and/&/+» entre espacios (el «e» es el «y»
  // castellano delante de i-: «Playfair para títulos e Inter para cuerpo»).
  const segments = src
    .split(/[;,/|·•\n]+|\.\s+|\.$|\s+(?:y|e|and|&|\+)\s+/i)
    .map((seg) => seg.trim())
    .filter(Boolean)

  const out: ExtractedTypography = {}
  const loose: string[] = []
  for (const seg of segments) {
    const name = cleanFontName(seg)
    if (!name) continue
    const isHeading = HEADING_RE.test(seg)
    const isBody = BODY_RE.test(seg)
    if (isHeading && !isBody) {
      if (!out.heading) out.heading = name
    } else if (isBody && !isHeading) {
      if (!out.body) out.body = name
    } else {
      loose.push(name)
    }
  }
  for (const name of loose) {
    if (!out.heading) out.heading = name
    else if (!out.body) out.body = name
  }
  return out
}

/** Nombre de fuente de un valor que puede ser string, {family}, {name}, {font}… */
function fontNameOf(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') {
    const parsed = parseTypographyText(value)
    return parsed.heading ?? parsed.body ?? ''
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>
    return fontNameOf(v.family ?? v.name ?? v.font ?? v.typeface ?? v.value)
  }
  return ''
}

// Claves con las que ha aparecido cada rol: editor/onboarding (heading_font,
// body_font), brand-briefing ({heading, body}), brand-book ({primary, secondary}
// con {family, usage}), y variantes que el modelo inventa cuando le dejan.
const HEADING_KEYS = ['heading_font', 'heading', 'headings', 'headline', 'headlines', 'title', 'titles', 'titulos', 'títulos', 'titulares', 'display_font', 'h1', 'primary', 'principal']
const BODY_KEYS = ['body_font', 'body', 'text', 'texto', 'paragraph', 'paragraphs', 'copy', 'cuerpo', 'secondary', 'secundaria']
// Claves que existen en el objeto pero no dicen nada de qué fuente usar.
const IGNORED_KEYS = new Set(['accent_font', 'notes', 'status', 'hierarchy', 'qa_safe_fallback', 'source', 'usage', 'sizes', 'scale', 'weights'])

function extractFromObject(obj: Record<string, unknown>): ExtractedTypography {
  const out: ExtractedTypography = {}
  for (const k of HEADING_KEYS) {
    const name = fontNameOf(obj[k])
    if (name) { out.heading = name; break }
  }
  for (const k of BODY_KEYS) {
    const name = fontNameOf(obj[k])
    if (name) { out.body = name; break }
  }
  if (out.heading && out.body) return out

  // Listas: {fonts: ['Montserrat', 'Lato']} → títulos, cuerpo
  const list = obj.fonts ?? obj.families ?? obj.typefaces
  if (Array.isArray(list)) {
    const names = list.map(fontNameOf).filter(Boolean)
    if (!out.heading && names[0]) out.heading = names[0]
    if (!out.body && (names[1] ?? names[0])) out.body = names[1] ?? names[0]
    if (out.heading && out.body) return out
  }

  // Claves libres (Record<string,string> del tipo BrandData): se leen como
  // texto «clave: valor» y decide el parser por las palabras de rol.
  const known = new Set([...HEADING_KEYS, ...BODY_KEYS, 'fonts', 'families', 'typefaces'])
  const restText = Object.entries(obj)
    .filter(([k, v]) => !known.has(k) && !IGNORED_KEYS.has(k) && (typeof v === 'string' || (v && typeof v === 'object')))
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'string' ? v : fontNameOf(v)}`)
    .join('; ')
  if (restText) {
    const parsed = parseTypographyText(restText)
    if (!out.heading && parsed.heading) out.heading = parsed.heading
    if (!out.body && parsed.body) out.body = parsed.body
  }
  if (out.heading && out.body) return out

  // Último recurso: las notas («usamos Playfair para títulos y Inter para el resto»).
  if (typeof obj.notes === 'string') {
    const parsed = parseTypographyText(obj.notes)
    if (!out.heading && parsed.heading) out.heading = parsed.heading
    if (!out.body && parsed.body) out.body = parsed.body
  }
  return out
}

/**
 * Saca {heading?, body?} de cualquiera de las formas en que viaja la
 * tipografía: brand_data → visual_identity → typography, un
 * BrandBrainContext (sólo tiene el resumen en texto), o el valor directo.
 */
export function extractTypography(source: unknown): ExtractedTypography {
  if (source == null) return {}
  if (typeof source === 'string') return parseTypographyText(source)
  if (typeof source !== 'object') return {}
  // Lista suelta: ['Montserrat', 'Lato'] → títulos, cuerpo
  if (Array.isArray(source)) return extractFromObject({ fonts: source })
  const obj = source as Record<string, unknown>

  // brand_data entero
  if (obj.visual_identity != null && obj.typography == null) return extractTypography(obj.visual_identity)
  // BrandBrainContext: fetchBrandBrain sólo deja el resumen en texto
  // («Colors: … Typography: heading_font: X, body_font: Y. Imagery style: …»).
  if (typeof obj.visualIdentitySummary === 'string' && obj.typography == null) {
    const m = /typography\s*:\s*([^]*?)(?:\.\s+(?:imagery|notes|status|colors)\b|$)/i.exec(obj.visualIdentitySummary)
    return m ? parseTypographyText(m[1]) : {}
  }
  // visual_identity: la tipografía puede ser objeto o texto
  if (obj.typography != null) return extractTypography(obj.typography)
  // El objeto typography en sí (o algo que se le parece)
  return extractFromObject(obj)
}

// ── Resolución con defaults del motor ─────────────────────────────────────

/**
 * Tipografía definitiva para un motor: la del Cerebro si la hay, si no los
 * defaults que le pasa el motor (los que llevaba a fuego hasta ahora), para
 * que un Cerebro sin tipografía siga exportando idéntico.
 *
 * Si el Cerebro sólo define una de las dos (p.ej. heading_font relleno,
 * body_font vacío) la otra la ESPEJA: una marca con una sola fuente es lo
 * normal («Montserrat» y ya) y mezclar la de marca con Arial se lee como
 * «no me ha cogido la letra». Si al CEO no le gusta el cuerpo, rellena
 * body_font y listo.
 */
export function resolveBrandFonts(source: unknown, defaults?: Partial<BrandFontDefaults>): BrandFonts {
  const defHeading = defaults?.heading ?? 'Inter'
  const defBody = defaults?.body ?? defHeading
  const found = extractTypography(source)
  const heading = found.heading ?? found.body ?? defHeading
  const body = found.body ?? found.heading ?? defBody
  const web = [heading, body].filter((f, i, arr) => !isPptxSafeFont(f) && arr.indexOf(f) === i)
  return {
    heading,
    body,
    headingStack: cssFontStack(heading),
    bodyStack: cssFontStack(body),
    fromBrain: Boolean(found.heading || found.body),
    webFontFamilies: web,
  }
}
