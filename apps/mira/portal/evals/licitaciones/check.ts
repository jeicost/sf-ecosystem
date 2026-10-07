// Regresiones del módulo de Licitaciones. Sin red, sin BD, gratis.
//   npx tsx evals/licitaciones/check.ts
//
// Cada comprobación corresponde a un fallo real que existió (29-sep-2026).
import { cortarPorAnclas, limpiarMaquetacion, rotulo, trocearPorPaginas } from '../../lib/tenders/secciones'
import { pliegoTruncationGap, PLIEGO_WINDOW, avisosDeInstrucciones, maskOrganos, palabrasAEnmascarar, maskPalabras, recortarBase, avisoBaseRecortada, BASE_MEMORIA_CAP } from '../../lib/generation/tender-memoria'
import { teachingBlock, teachingBlockDetallado, baseMemoriaValida, isUuid, INSTRUCTIONS_CAP, INSTRUCTIONS_STORE_CAP, GUIDE_CAP, LESSONS_CAP, LESSON_MAX, avisoLeccionLarga } from '../../lib/tenders/teaching'
import { sanearImportes, sanearPorcentajes } from '../../lib/generation/tender-libre'

let pass = 0, fail = 0
const check = (name: string, ok: boolean, detail?: unknown) => {
  if (ok) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 200)) }
}

console.log('\nPliego: el recorte se AVISA (antes leía 45.000 caracteres en silencio)')
check('dentro de la ventana no hay aviso', pliegoTruncationGap('x'.repeat(PLIEGO_WINDOW)) === null)
check('fuera de la ventana sí', (pliegoTruncationGap('x'.repeat(PLIEGO_WINDOW + 1)) || '').includes('Solo se han leído'))
check('la ventana es la de la oferta (150.000)', PLIEGO_WINDOW === 150_000)

console.log('\nMaquetación: marcas de página, migas y cabeceras repetidas fuera')
const deck = [
  'PORTADA', '-- 1 of 3 --',
  'GLS hoy\tServicios\tActivos\tCalidad\tRSC', 'SOLUCIONES IT', 'Contamos con PDA en toda la flota.', 'Página confidencial',
  '-- 2 of 3 --',
  'GLS hoy\tServicios\tActivos\tCalidad\tRSC', 'EQUIPO HUMANO', 'Doce conductores con contrato indefinido.', 'Página confidencial',
  '-- 3 of 3 --',
  'GLS hoy\tServicios\tActivos\tCalidad\tRSC', 'Página confidencial',
].join('\n')
const limpio = limpiarMaquetacion(deck)
check('las marcas de página se convierten en saltos', !limpio.includes('of 3') && limpio.includes('\f'))
check('la fila de migas desaparece', !limpio.includes('Servicios\tActivos'))
check('la cabecera repetida desaparece', !limpio.includes('Página confidencial'))
check('el contenido se queda', limpio.includes('Doce conductores'))

console.log('\nRótulos: un trozo de frase NO es un título')
check('numerado gana', rotulo(['texto suelto', 'B.2 Gestión de las incidencias']) === 'B.2 Gestión de las incidencias')
check('MAYÚSCULAS antes que frase', rotulo(['El coordinador se responsabilizará de', 'EQUIPO HUMANO']) === 'EQUIPO HUMANO')
check('frase cortada en «de» se rechaza', rotulo(['El coordinador se responsabilizará de']) === null)
check('paso de instrucciones se rechaza', rotulo(['5. Haz clic en impresión masiva']) === null)
check('minúscula inicial se rechaza', rotulo(['soportes audiovisuales o elementos']) === null)

console.log('\nAnclas: el texto sale del ORIGINAL, entero')
const doc = 'PORTADA\nÍndice\nQuiénes somos\nGTD Mensajeros es una mensajería fundada en 1990 con sede en Madrid.\nServicio y compromiso\nPrestamos el servicio con una flota de más de 80 vehículos equipados.'
const secs = cortarPorAnclas(doc, [
  { titulo: 'Quiénes somos', empieza: 'GTD   Mensajeros es una mensajeria fundada' },   // espacios y tilde distintos
  { titulo: 'Inventada', empieza: 'esta frase no existe en ningún sitio del texto' },
  { titulo: 'Servicio', empieza: 'Prestamos el servicio con una flota de' },
])
check('encuentra las anclas pese a espacios y acentos', secs.length === 2, secs.map((s) => s.titulo))
check('un ancla que no existe no inventa sección', !secs.some((s) => s.titulo === 'Inventada'))
check('el contenido es literal del original', secs[0]?.contenido.startsWith('GTD Mensajeros es una mensajería fundada en 1990'))
check('la portada y el índice se quedan fuera', !secs.some((s) => s.contenido.includes('PORTADA')))
check('la última sección llega hasta el final', secs[1]?.contenido.endsWith('vehículos equipados.'))

console.log('\nTroceado por páginas (la red de seguridad sin modelo)')
const porPag = trocearPorPaginas([
  'PORTADA', '-- 1 of 2 --',
  'SOLUCIONES IT', 'x'.repeat(1300),
  '-- 2 of 2 --',
  'EQUIPO HUMANO', 'y'.repeat(1300),
].join('\n'))
check('una sección por página con rótulo', porPag.length === 2, porPag.map((s) => s.titulo))
check('los rótulos se ponen en tipo frase', porPag[0]?.titulo === 'Soluciones it')

console.log('\nEnseñanza (0084): lo que Usoa dice entra en el prompt, con precedencia y topes')
check('sin nada → cadena vacía (el prompt no carga cabeceras huecas)', teachingBlock({}) === '' && teachingBlock({ instructions: '  ', guide: null, lessons: [] }) === '')
const soloIns = teachingBlock({ instructions: 'Subraya la experiencia sanitaria' })
check('las instrucciones llevan cabecera de máxima prioridad y cláusula anti-invención', soloIns.includes('máxima prioridad') && soloIns.includes('[FALTA: …]') && soloIns.includes('Subraya la experiencia sanitaria'))
const largas = teachingBlock({ instructions: 'a'.repeat(INSTRUCTIONS_CAP + 500) })
check('instrucciones largas se recortan al tope y se AVISA', largas.includes('instrucciones recortadas') && largas.includes(`${(INSTRUCTIONS_CAP + 500).toLocaleString('es-ES')}`) && !largas.includes('a'.repeat(INSTRUCTIONS_CAP + 1)))
const guiaLarga = teachingBlock({ guide: 'g'.repeat(GUIDE_CAP + 10) })
check('la guía también se recorta con aviso', guiaLarga.includes('guía recortadas') && !guiaLarga.includes('g'.repeat(GUIDE_CAP + 1)))
const conLecciones = teachingBlock({ lessons: [{ text: 'Nunca prometas plazos sin KPI propio' }, 'Nombra al órgano en cada sección', { text: 'x' }] })
check('las lecciones salen numeradas', conLecciones.includes('1. Nunca prometas plazos sin KPI propio') && conLecciones.includes('2. Nombra al órgano en cada sección'))
check('una lección de menos de 3 caracteres no cuenta', !conLecciones.includes('3. '))
const muchas = teachingBlock({ lessons: Array.from({ length: 200 }, (_, i) => `Lección número ${i + 1} ${'z'.repeat(60)}`) })
const cuerpoLecciones = muchas.slice(muchas.indexOf('LECCIONES'), muchas.indexOf('Nada de lo anterior'))
check('el tope total de lecciones se respeta', cuerpoLecciones.length <= LESSONS_CAP + 400, cuerpoLecciones.length)
check('y se dice cuántas quedaron fuera', /\d+ lecciones más no caben/.test(muchas) && muchas.includes('1. Lección número 1') && !muchas.includes('200. Lección número 200'))
const orden = teachingBlock({ instructions: 'INS', guide: 'GUIA', lessons: ['LECCION-UNO'] })
check('precedencia: instrucciones → guía → lecciones', orden.indexOf('INSTRUCCIONES') < orden.indexOf('GUÍA DE REDACCIÓN') && orden.indexOf('GUÍA DE REDACCIÓN') < orden.indexOf('LECCIONES'))

console.log('\nMemoria de partida: la elige la persona, pero la frontera la pone el servidor')
const mia = { id: '11111111-1111-4111-8111-111111111111', client_id: 'cliente-A', title: 'Memoria X', memoria: { secciones: [{ titulo: 'A', contenido: 'texto real' }] } }
check('una memoria del mismo cliente vale', baseMemoriaValida(mia, 'cliente-A', mia.id)?.id === mia.id)
check('la de OTRO cliente se ignora (aunque el id coincida)', baseMemoriaValida({ ...mia, client_id: 'cliente-B' }, 'cliente-A', mia.id) === null)
check('un id distinto al pedido se ignora', baseMemoriaValida(mia, 'cliente-A', '22222222-2222-4222-8222-222222222222') === null)
check('el propio expediente no puede ser su base', baseMemoriaValida(mia, 'cliente-A', mia.id, mia.id) === null)
check('sin secciones con texto no hay base', baseMemoriaValida({ ...mia, memoria: { secciones: [{ titulo: 'A', contenido: '  ' }] } }, 'cliente-A', mia.id) === null && baseMemoriaValida({ ...mia, memoria: null }, 'cliente-A', mia.id) === null)
check('un baseTenderId que no es uuid ni siquiera se consulta', !isUuid('cógete-la-memoria-de-X') && isUuid(mia.id))
check('el enmascarado [ÓRGANO ANTERIOR] sigue funcionando', maskOrganos('Servicio para Renfe Viajeros en 2024', ['RENFE VIAJEROS']) === 'Servicio para [ÓRGANO ANTERIOR] [ÓRGANO ANTERIOR] en 2024')

console.log('\nInstrucciones: el modelo marca, TS avisa (sin inventar)')
const marcadas = avisosDeInstrucciones({ instrucciones_aplicadas: ['Subrayé la experiencia sanitaria en la sección 2'], instrucciones_no_aplicadas: [{ instruccion: 'Cita la ISO 14001', motivo: 'no consta en el material' }] }, true)
check('la no aplicada se convierte en aviso con su motivo', marcadas.avisos.length === 1 && marcadas.avisos[0].includes('Cita la ISO 14001') && marcadas.avisos[0].includes('no consta'))
check('la aplicada se conserva para la pantalla', marcadas.aplicadas.length === 1)
const mudo = avisosDeInstrucciones({}, true)
check('había instrucciones y el modelo no dice nada → aviso de revisar', mudo.avisos.some((a) => a.includes('no ha indicado qué instrucciones aplicó')))
check('sin instrucciones no se exige nada', avisosDeInstrucciones({}, false).avisos.length === 0)

console.log('\nG1 · Enmascarado sin órgano registrado: los nombres salen de los TÍTULOS, salvo los legítimos de ESTA licitación')
const pliegoRenfe = 'PLIEGO. Órgano: Renfe Viajeros S.M.E. Objeto: mensajería entre estaciones de Madrid y Sevilla.'
const derivadas = palabrasAEnmascarar(['Memoria técnica UAM 2024 — Lote 2', 'MEMORIA TÉCNICA PARA EL SERVICIO DE MENSAJERÍA DE LA UNIVERSIDAD AUTÓNOMA DE MADRID'], pliegoRenfe)
check('siglas y nombres propios del título se derivan', derivadas.includes('UAM') && derivadas.includes('UNIVERSIDAD') && derivadas.includes('AUTÓNOMA'), derivadas)
check('el vocabulario común, los números y la geografía NO', !derivadas.some((w) => /^(memoria|técnica|servicio|mensajería|lote|de|la|para|el|madrid|2024)$/i.test(w)), derivadas)
check('lo que aparece en el pliego ACTUAL es legítimo y no se deriva', palabrasAEnmascarar(['Memoria Renfe Viajeros 2023'], pliegoRenfe).length === 0)
check('la propia marca (texto legítimo) no se deriva', JSON.stringify(palabrasAEnmascarar(['Memoria GTD Mensajeros para UAM'], `${pliegoRenfe}\nGTD Mensajeros`)) === '["UAM"]')
check('sin título no hay nada que enmascarar (→ data_gap en la carga)', palabrasAEnmascarar([null, undefined, ''], pliegoRenfe).length === 0)
check('las palabras derivadas se enmascaran como palabra completa, sin distinguir mayúsculas', maskPalabras('Servicio para la Universidad Autónoma de Madrid (uam); UAMX no', ['UAM', 'Universidad', 'Autónoma']) === 'Servicio para la [ÓRGANO ANTERIOR] [ÓRGANO ANTERIOR] de Madrid ([ÓRGANO ANTERIOR]); UAMX no')

console.log('\nG2 · El recorte de la memoria de partida es un DATO, no solo una marca para el modelo')
check('si cabe, no hay recorte', recortarBase('x'.repeat(BASE_MEMORIA_CAP)).recorte === null)
const rb = recortarBase('x'.repeat(BASE_MEMORIA_CAP + 1000))
check('si no cabe, se sabe cuánto se leyó de cuánto', rb.recorte?.leidos === BASE_MEMORIA_CAP && rb.recorte?.total === BASE_MEMORIA_CAP + 1000 && rb.texto.includes('recortada'))
check('y el aviso lo dice en castellano', rb.recorte !== null && avisoBaseRecortada(rb.recorte).includes('solo se han leído') && avisoBaseRecortada(rb.recorte).includes('secciones finales'))

console.log('\nG3/G6 · Lo que no cabe en el prompt se devuelve como recorte (para data_gaps), no solo se marca')
check('las instrucciones entran enteras: el tope del prompt es el de la BD', INSTRUCTIONS_CAP === INSTRUCTIONS_STORE_CAP)
const det = teachingBlockDetallado({ instructions: 'a'.repeat(INSTRUCTIONS_CAP + 500), guide: 'g'.repeat(GUIDE_CAP + 10), lessons: Array.from({ length: 200 }, (_, i) => `Lección número ${i + 1} ${'z'.repeat(60)}`) })
check('instrucciones, guía y lecciones recortadas → tres recortes', det.recortes.length === 3, det.recortes)
check('el de instrucciones y el de guía dicen cuánto se leyó', det.recortes.some((r) => r.includes('instrucciones') && r.includes('solo se han leído')) && det.recortes.some((r) => r.includes('guía') && r.includes('solo se han leído')))
check('el de lecciones dice cuántas y manda a Teach MIRA', det.recortes.some((r) => /\d+ lecciones no han cabido/.test(r) && r.includes('más antiguas') && r.includes('Teach MIRA')))
check('si todo cabe, cero recortes', teachingBlockDetallado({ instructions: 'INS', guide: 'GUIA', lessons: ['LECCION-UNO'] }).recortes.length === 0)
check('teachingBlock (string) sigue siendo el .text', teachingBlock({ instructions: 'INS', lessons: ['L1'] }) === teachingBlockDetallado({ instructions: 'INS', lessons: ['L1'] }).text)

console.log('\nG5 · Importes en una oferta: sin restos, con porcentajes de descuento, sin tocar lo que no es precio')
check('«1250 €» se sustituye ENTERO', sanearImportes('Tarifa: 1250 € por ruta').texto === 'Tarifa: [FALTA: tarifa] por ruta')
check('«12500 EUR» también', sanearImportes('12500 EUR anuales').texto === '[FALTA: tarifa] anuales')
check('los formatos de siempre siguen', sanearImportes('1.250,00 € y € 30 y 30 euros y 45 EUR').n === 4)
check('«24 horas», «15 repartidores», «ISO 9001», «año 2026» intactos', sanearImportes('Entrega en 24 horas con 15 repartidores, ISO 9001, año 2026').n === 0)
check('un % de descuento → [FALTA: descuento]', sanearPorcentajes('Aplicamos un descuento del 15 % sobre tarifa').texto === 'Aplicamos un descuento del [FALTA: descuento] sobre tarifa')
const kpi = sanearPorcentajes('Puntualidad del 99,5 % en entregas a tiempo')
check('un % que es KPI no se borra pero se cuenta como dudoso', kpi.texto.includes('99,5 %') && kpi.n === 0 && kpi.dudosos === 1)

console.log('\nG8 · «Remember» no guarda una lección a medias')
check('una instrucción que cabe no da aviso', avisoLeccionLarga('x'.repeat(LESSON_MAX)) === null)
const larga = avisoLeccionLarga('x'.repeat(LESSON_MAX + 1))
check('una que no cabe da aviso con el tope y manda a Teach MIRA', !!larga && larga.includes('demasiado larga') && larga.includes(LESSON_MAX.toLocaleString('es-ES')) && larga.includes('Teach MIRA'))

// (el resumen y la salida van al final del fichero: las comprobaciones del 6-oct siguen debajo)

// ─── 6-oct-2026: maquetación del Word, hoja oficial, páginas diseñadas, freno de gasto ───
import { parseBloques, trozosInline, esRotuloMayusculas, columnaNumerica, rutaFicheroPermitida, fuenteValida, CLAVES_PLANTILLA, type Bloque } from '../../lib/tenders/word'
import { pieConNumeracion, MARCA_CABECERA, MARCA_PIE } from '../../lib/tenders/membrete'
import { normalizarMarcadores, resolverReferencia, anexosObligatorios, bloqueDisenadasPrompt, marcadoresEn, parseDisenada, marcador, type Disenada } from '../../lib/tenders/disenadas'
import { sumarGasto, limiteParaRuta, inicioDeHoyMadrid, DAILY_BUDGET_USD, EMAIL_OPS_RESERVE, esErrorDePresupuesto, DailyBudgetExceededError } from '../../lib/ai/budget'
import { estimateCostUsdWithCache, MODEL_PRICING } from '../../lib/anthropic-client'
import { techoSalida, ajustesModelo, modeloConPensamiento, TENDER_MODEL, CHEAP_MODEL } from '../../lib/ai/models'
import { buildOutputSchema, EMAIL_OPS_MODEL } from '../../lib/email-ops/extract'
import { COURIER_V1_FIELDS as DEFAULT_SCHEMA } from '../../lib/email-ops/schema'

console.log('\nMaquetación del texto: lo que escribe el redactor se reconoce, lo que no, es párrafo')
const bl = parseBloques([
  'Párrafo normal con **negrita** dentro.',
  '## Subapartado',
  'PLAN DE CONTINGENCIA',
  '- uno', '- dos',
  '1. primero', '2) segundo',
  '| Servicio | Plazo | Importe |', '|---|---|---|', '| Urbano | 2 h | 100 |', '| Nacional | 24 h | 250 |',
  '[[DISEÑO:abc]]',
  'Texto [[diseño: Flota]] seguido.',
  'ISO 9001.',
  '',
].join('\n'))
const txt = (b: Bloque | undefined) => (b && 'texto' in b ? b.texto : '')
const items = (b: Bloque | undefined) => (b && 'items' in b ? b.items : [])
const filas = (b: Bloque | undefined) => (b && 'filas' in b ? b.filas : [])
const ref = (b: Bloque | undefined) => (b && 'ref' in b ? b.ref : '')
check('párrafo', bl[0]?.t === 'p' && txt(bl[0]).startsWith('Párrafo'))
check('## → subtítulo', bl[1]?.t === 'h' && txt(bl[1]) === 'Subapartado')
check('MAYÚSCULAS → subtítulo', bl[2]?.t === 'h' && txt(bl[2]) === 'PLAN DE CONTINGENCIA')
check('viñetas agrupadas', bl[3]?.t === 'ul' && items(bl[3]).length === 2)
check('numeradas agrupadas (1. y 2))', bl[4]?.t === 'ol' && items(bl[4]).join('|') === 'primero|segundo')
check('tabla con cabecera y 2 filas, sin separador', bl[5]?.t === 'tabla' && filas(bl[5]).length === 3 && filas(bl[5])[0][2] === 'Importe')
check('marcador solo → diseno', bl[6]?.t === 'diseno' && ref(bl[6]) === 'abc')
check('marcador pegado a texto se separa', bl[7]?.t === 'p' && bl[8]?.t === 'diseno' && ref(bl[8]) === 'Flota' && bl[9]?.t === 'p' && txt(bl[9]) === 'seguido.')
check('«ISO 9001.» no es subtítulo (punto final, pocas letras)', bl[10]?.t === 'p')
check('no se pierde texto (11 bloques)', bl.length === 11, bl.length)
check('rótulo: frase normal no', !esRotuloMayusculas('El coordinador se responsabilizará de todo'))
check('rótulo: sigla sola no', !esRotuloMayusculas('GTD'))
check('rótulo: «RECURSOS HUMANOS Y MATERIALES» sí', esRotuloMayusculas('RECURSOS HUMANOS Y MATERIALES'))
const tr = trozosInline('Texto **fuerte** y [FALTA: cifra] y [ÓRGANO ANTERIOR] fin')
check('negrita separada', tr.some((t) => t.negrita && t.texto === 'fuerte'))
check('[FALTA] y [ÓRGANO ANTERIOR] son avisos', tr.filter((t) => t.aviso).length === 2)
check('el texto se conserva entero', tr.map((t) => t.texto).join('') === 'Texto fuerte y [FALTA: cifra] y [ÓRGANO ANTERIOR] fin')
check('columna numérica (€ y %)', columnaNumerica([['a', '100 €'], ['b', '2,50 %'], ['c', '—']], 1))
check('columna de texto no', !columnaNumerica([['a', 'Madrid'], ['b', '24 h']], 1))

console.log('\nHoja oficial: numeración en el pie y rutas')
const pieVacio = '<w:ftr><w:p><w:r><w:t>NIF</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Pie"/></w:pPr></w:p></w:ftr>'
const conNum = pieConNumeracion(pieVacio)
check('usa el último párrafo vacío para «Página X de Y»', conNum.includes('NUMPAGES') && (conNum.match(/<w:p\b/g) || []).length === 2)
check('si ya numera, no toca', pieConNumeracion('<w:ftr><w:p><w:fldSimple w:instr=" PAGE "/></w:p></w:ftr>').split('PAGE').length === 2)
check('sin párrafo vacío, añade uno', (pieConNumeracion('<w:ftr><w:p><w:r><w:t>x</w:t></w:r></w:p></w:ftr>').match(/<w:p\b/g) || []).length === 2)
check('las marcas de cabecera y pie son distintas y raras', String(MARCA_CABECERA) !== String(MARCA_PIE) && MARCA_CABECERA.includes('MEMBRETE'))
check('ruta de hoja de la propia marca sí', rutaFicheroPermitida('tenders/c1/x.docx', 'c1'))
check('ruta de hoja de otra marca no', !rutaFicheroPermitida('tenders/c2/x.docx', 'c1') && !rutaFicheroPermitida('tenders/c1/../c2/x.docx', 'c1'))
check('fuente válida / inválida', fuenteValida(' Aptos ') === 'Aptos' && fuenteValida('<script>') === null)
check('la plantilla admite letterhead_path, letterhead_name y body_font', ['letterhead_path', 'letterhead_name', 'body_font'].every((k) => (CLAVES_PLANTILLA as readonly string[]).includes(k)))

console.log('\nPáginas diseñadas: el modelo marca, TS valida')
const D1: Disenada = { id: '11111111-1111-4111-8111-111111111111', title: 'Certificaciones ISO', keywords: 'calidad, ISO', placement: 'page', always_include: true, pages: [{ path: 'tenders/c1/a.jpg', w: 10, h: 10, type: 'jpg' }], source_filename: null, active: true }
const D2: Disenada = { ...D1, id: '22222222-2222-4222-8222-222222222222', title: 'Flota', always_include: false, placement: 'figure' }
check('referencia por id', resolverReferencia(D1.id, [D1, D2])?.title === 'Certificaciones ISO')
check('referencia por título (sin acentos, mayúsculas)', resolverReferencia('certificaciones iso', [D1, D2])?.id === D1.id)
check('referencia desconocida → null', resolverReferencia('Organigrama', [D1, D2]) === null)
const nm = normalizarMarcadores(`Intro.\n[[diseño: flota]] y luego [[DISEÑO:${D1.id}]] y [[DISEÑO:inventada]].`, [D1, D2])
check('marcas normalizadas a [[DISEÑO:id]] en línea propia', nm.texto.includes(`\n${marcador(D2.id)}\n`) && nm.texto.includes(marcador(D1.id)))
check('la inventada se quita y se avisa', !nm.texto.includes('inventada') && nm.desconocidas.join() === 'inventada')
check('usadas en orden', nm.usadas.join(',') === `${D2.id},${D1.id}`)
check('marcadoresEn devuelve ids', marcadoresEn(`x ${marcador(D1.id)}`, [D1, D2]).join() === D1.id)
check('anexos obligatorios: la de «siempre» no usada', anexosObligatorios([D1, D2], []).map((d) => d.id).join() === D1.id)
check('anexos obligatorios: usada → no se repite', anexosObligatorios([D1, D2], [D1.id]).length === 0)
check('bloque de prompt lista las dos y pide una línea sola', bloqueDisenadasPrompt([D1, D2]).includes(marcador(D1.id)) && bloqueDisenadasPrompt([D1, D2]).includes('UNA LÍNEA SOLA'))
check('sin páginas → bloque vacío', bloqueDisenadasPrompt([{ ...D1, pages: [] }]) === '')
check('parseDisenada descarta páginas sin forma', parseDisenada({ id: 'x', title: 't', pages: [{ path: 'p', w: 1, h: 1, type: 'gif' }, { path: 'q', w: 1, h: 1, type: 'png' }] })?.pages.length === 1)

console.log('\nFreno de gasto diario y precios')
check('precio Opus 5.5 con caché: 1M entrada normal = 4 $, 1M lectura caché = 0,20 $', Math.abs(estimateCostUsdWithCache('claude-opus-5-5', 1_000_000, 0) - 4) < 1e-9 && Math.abs(estimateCostUsdWithCache('claude-opus-5-5', 0, 0, 0, 1_000_000) - 0.2) < 1e-9)
check('precio Opus 4.8: lectura caché 0,50 $', Math.abs(estimateCostUsdWithCache('claude-opus-4-8', 0, 0, 0, 1_000_000) - 0.5) < 1e-9)
check('modelo desconocido se tasa como Sonnet 4.6', Math.abs(estimateCostUsdWithCache('claude-x', 1_000_000, 1_000_000) - 18) < 1e-9)
check('tabla de precios tiene los modelos en uso', [TENDER_MODEL, CHEAP_MODEL, EMAIL_OPS_MODEL].every((m) => !!MODEL_PRICING[m]))
const g = sumarGasto([
  { route: 'tender/chat', model: 'claude-opus-5-5', input_tokens: 1_000_000, output_tokens: 0, cache_creation_tokens: 0, cache_read_tokens: 0 },
  { route: 'email-ops-extract', model: 'claude-sonnet-5-5', input_tokens: 0, output_tokens: 1_000_000, cache_creation_tokens: 0, cache_read_tokens: 0 },
], '2026-10-06T00:00:00Z')
check('suma por ruta: 4 $ chat + 10 $ email = 14 $', Math.abs(g.total - 14) < 1e-9 && Math.abs(g.porRuta['tender/chat'] - 4) < 1e-9 && g.llamadas === 2)
check('límite: rutas normales dejan la reserva de Email Ops', limiteParaRuta('tender/chat', 100) === 100 * (1 - EMAIL_OPS_RESERVE) && limiteParaRuta('email-ops-extract', 100) === 100)
check('freno diario global por defecto 100 $ (env MIRA_DAILY_BUDGET_USD)', DAILY_BUDGET_USD === 100 || !!process.env.MIRA_DAILY_BUDGET_USD)
const medianoche = inicioDeHoyMadrid(new Date('2026-10-06T12:00:00Z'))
check('medianoche de Madrid en verano = 22:00 UTC del día anterior', medianoche.toISOString() === '2026-10-05T22:00:00.000Z', medianoche.toISOString())
const inv = inicioDeHoyMadrid(new Date('2026-01-15T12:00:00Z'))
check('en invierno = 23:00 UTC', inv.toISOString() === '2026-01-14T23:00:00.000Z', inv.toISOString())
const e = new DailyBudgetExceededError(31, 30, 'tender/chat')
check('el error del freno se reconoce por su mensaje', esErrorDePresupuesto(e.message) && !esErrorDePresupuesto('credit balance too low'))

console.log('\nModelos: pensamiento y techos')
check('Opus 5.5 piensa; Opus 4.8 no', modeloConPensamiento('claude-opus-5-5') && !modeloConPensamiento('claude-opus-4-8'))
check('techo se duplica en los que piensan (16k → 32k) y se respeta en los demás', techoSalida('claude-opus-5-5', 16000) === 32000 && techoSalida('claude-opus-4-8', 16000) === 16000)
check('techo nunca pasa de 64k', techoSalida('claude-opus-5-5', 40000) === 64000)
check('ajustes: effort para 5.x y 4.7/4.8; nada para Haiku 4.5', 'output_config' in ajustesModelo('claude-opus-5-5') && 'output_config' in ajustesModelo('claude-opus-4-8') && !('output_config' in ajustesModelo('claude-haiku-4-5')))

console.log('\nEmail Ops: esquema de salida estructurada')
const sch = buildOutputSchema(DEFAULT_SCHEMA) as { properties: Record<string, Record<string, unknown>>; required: string[]; additionalProperties: boolean }
check('additionalProperties:false en la raíz y en los objetos', sch.additionalProperties === false && sch.properties.fields.additionalProperties === false && sch.properties.confidence.additionalProperties === false)
check('urgency sin minimum/maximum (no admitidos): se acota en TS', !('minimum' in sch.properties.urgency))
check('confidence y evidence exigen todas las claves del parte', (sch.properties.confidence.required as string[]).length === DEFAULT_SCHEMA.length)
check('original_sender y notes admiten null y son requeridos', sch.required.includes('notes') && Array.isArray(sch.properties.notes.type))
check('modelo de Email Ops: Sonnet 5.5 salvo env', EMAIL_OPS_MODEL === 'claude-sonnet-5-5' || !!process.env.EMAIL_OPS_MODEL)

console.log('\nTítulos de sección que ya traen número o puntos (un Word subido vuelve con ellos)')
import { limpiarTituloSeccion } from '../../lib/tenders/word'
import { htmlDocxATexto } from '../../lib/attachments'
check('«1. OBJETO (20 puntos)» → OBJETO + 20', JSON.stringify(limpiarTituloSeccion('1. OBJETO (20 puntos)')) === JSON.stringify({ titulo: 'OBJETO', puntos: 20 }))
check('«2.3 Plan de contingencia» → sin número', limpiarTituloSeccion('2.3 Plan de contingencia').titulo === 'Plan de contingencia')
check('«B) Recursos» → Recursos', limpiarTituloSeccion('B) Recursos').titulo === 'Recursos')
check('un título sin número se queda igual', limpiarTituloSeccion('Sistema de gestión').titulo === 'Sistema de gestión' && limpiarTituloSeccion('Sistema de gestión').puntos === null)
check('«ISO 9001 y 14001» no pierde el 9001', limpiarTituloSeccion('ISO 9001 y 14001').titulo === 'ISO 9001 y 14001')

console.log('\nWord subido → texto con estructura (listas, tablas, negritas)')
const htmlDoc = '<h1>1. Objeto</h1><p>Texto con <strong>negrita</strong> dentro.</p><p><strong>Rótulo corto</strong></p><ul><li>uno</li><li>dos &amp; tres</li></ul><ol><li>primero</li></ol><table><tr><td>Norma</td><td>Alcance</td></tr><tr><td>ISO 9001</td><td>Calidad</td></tr></table><p>Fin.</p>'
const txtDoc = htmlDocxATexto(htmlDoc)
check('cabecera como línea sola sin marcas', txtDoc.startsWith('1. Objeto\n\n'))
check('negrita dentro del párrafo con **', txtDoc.includes('Texto con **negrita** dentro.'))
check('párrafo corto todo en negrita = rótulo sin asteriscos', txtDoc.includes('\nRótulo corto\n') && !txtDoc.includes('**Rótulo'))
check('viñetas con «- » y entidades decodificadas', txtDoc.includes('- uno\n- dos & tres'))
check('numeradas con «1. »', txtDoc.includes('1. primero'))
check('tabla en filas con barras y separador', txtDoc.includes('| Norma | Alcance |\n| --- | --- |\n| ISO 9001 | Calidad |'))
check('la tabla vuelve a ser tabla al maquetar', parseBloques(txtDoc).some((b) => b.t === 'tabla' && b.filas.length === 2))
check('las viñetas vuelven a ser viñetas', parseBloques(txtDoc).some((b) => b.t === 'ul' && b.items.length === 2))
check('tabla de una columna → párrafos (la portada no es una tabla)', !htmlDocxATexto('<table><tr><td><strong>MARCA</strong></td></tr><tr><td>Título</td></tr></table>').includes('|') && htmlDocxATexto('<table><tr><td>MARCA</td></tr><tr><td>Título</td></tr></table>').includes('MARCA\n\nTítulo'))

console.log('\nTope mensual por marca y parámetros centrales del modelo')
import { inicioDeMesMadrid, mesDe, MonthlyBudgetExceededError, esErrorDePresupuestoMensual, CLIENT_MONTHLY_BUDGET_USD } from '../../lib/ai/budget'
import { prepararParams, primerTexto, textoDe, DEFAULT_MODEL, FAST_MODEL } from '../../lib/ai/models'
check('día 1 del mes en Madrid (octubre, verano) = 30-sep 22:00 UTC', inicioDeMesMadrid(new Date('2026-10-15T12:00:00Z')).toISOString() === '2026-09-30T22:00:00.000Z', inicioDeMesMadrid(new Date('2026-10-15T12:00:00Z')).toISOString())
check('día 1 en invierno = 23:00 UTC del día anterior', inicioDeMesMadrid(new Date('2026-02-10T12:00:00Z')).toISOString() === '2026-01-31T23:00:00.000Z')
check('mesDe en Madrid', mesDe(new Date('2026-10-31T23:30:00Z')) === '2026-11')
check('tope mensual por defecto 30 $ (env MIRA_CLIENT_MONTHLY_BUDGET_USD)', CLIENT_MONTHLY_BUDGET_USD === 30 || !!process.env.MIRA_CLIENT_MONTHLY_BUDGET_USD)
const em = new MonthlyBudgetExceededError(31, 30, 'c1')
check('el error mensual se reconoce como presupuesto y como mensual', esErrorDePresupuesto(em.message) && esErrorDePresupuestoMensual(em.message) && !esErrorDePresupuestoMensual(e.message))
const pp = prepararParams({ model: 'claude-opus-5-5', max_tokens: 2000 })
check('prepararParams: techo mínimo 4000 y esfuerzo medium en los 5.x', pp.max_tokens === 4000 && JSON.stringify((pp as { output_config?: unknown }).output_config) === JSON.stringify({ effort: 'medium' }))
const pp2 = prepararParams({ model: 'claude-sonnet-5-5', max_tokens: 2500, output_config: { format: { type: 'json_schema' } } } as { model: string; max_tokens: number })
check('prepararParams respeta un output_config existente y añade el esfuerzo', JSON.stringify((pp2 as { output_config?: Record<string, unknown> }).output_config) === JSON.stringify({ effort: 'medium', format: { type: 'json_schema' } }) && pp2.max_tokens === 5000)
const pp3 = prepararParams({ model: FAST_MODEL, max_tokens: 512 })
check('Haiku: ni techo doblado ni output_config', pp3.max_tokens === 512 && !('output_config' in pp3))
check('el modelo por defecto es Opus 5.5 salvo env', DEFAULT_MODEL === 'claude-opus-5-5' || !!process.env.MIRA_MODEL)
const contenido = [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: '{"a":1}', citations: null }, { type: 'text', text: ' fin', citations: null }] as unknown as Parameters<typeof primerTexto>[0]
check('primerTexto salta el bloque de pensamiento', primerTexto(contenido)?.text === '{"a":1}')
check('textoDe une solo los bloques de texto', textoDe(contenido) === '{"a":1} fin')

console.log('\nSecciones fijas de la casa: el modelo las recibe, TS comprueba que están y no se reescribieron')
import { parseStandardSections, tituloCoincide, coincidenciaTexto, comprobarSeccionesFijas, insertarSeccionesFijas, bloqueSeccionesFijas, REGLA_MEDIOS_MATERIALES, type StandardSection } from '../../lib/tenders/teaching'
const FIJAS: StandardSection[] = [
  { id: 'a', title: 'Quiénes somos', content: 'GTD mensajeros es una compañía fundada en 1990, especializada en transporte urgente y líder en servicios de transporte integral a la administración pública.', enabled: true },
  { id: 'b', title: 'Equipo humano', content: 'GTD cuenta con un equipo de profesionales compuesto por personal propio y colaboradores, incluyendo mensajeros, conductores y personal de apoyo.', enabled: true },
  { id: 'c', title: 'Qué te ofrecemos', content: 'Transporte y mensajería nacional e internacional.', enabled: false },
]
check('parse: descarta lo sin forma, recorta, conserva enabled', parseStandardSections([{ title: ' Quiénes  somos ', content: 'x', enabled: false }, { title: 'sin texto' }, 'basura']).length === 1 && parseStandardSections([{ title: 'Q', content: 'x', enabled: false }])[0].enabled === false)
check('título coincide con número delante y mayúsculas', tituloCoincide('1. QUIÉNES SOMOS', 'Quiénes somos') && tituloCoincide('Equipo humano y medios', 'Equipo humano'))
check('título distinto no coincide', !tituloCoincide('Plan de contingencia', 'Quiénes somos'))
check('coincidencia de texto: igual 1, distinto ~0', coincidenciaTexto(FIJAS[0].content, FIJAS[0].content) === 1 && coincidenciaTexto('Otra cosa totalmente distinta y nueva', FIJAS[0].content) < 0.2)
const comp = comprobarSeccionesFijas([
  { titulo: '1. QUIÉNES SOMOS', contenido: FIJAS[0].content.replace('administración pública', 'Administración Pública del Estado') },
  { titulo: 'Equipo humano', contenido: 'Un equipo joven y dinámico que trabaja con pasión por el cliente final en toda España.' },
], FIJAS)
check('la que está casi igual pasa; la reescrita se avisa; la desactivada no cuenta', comp.faltan.length === 0 && comp.reescritas.length === 1 && comp.reescritas[0].title === 'Equipo humano')
const comp2 = comprobarSeccionesFijas([{ titulo: 'Servicio', contenido: 'x' }], FIJAS)
check('las que faltan se detectan (2 activas)', comp2.faltan.map((f) => f.id).join() === 'a,b')
const ins = insertarSeccionesFijas([{ titulo: 'Servicio', contenido: 'x' }], comp2.faltan)
check('se insertan al principio en orden con su texto y aviso', ins.length === 3 && ins[0].titulo === 'Quiénes somos' && ins[1].titulo === 'Equipo humano' && ins[2].titulo === 'Servicio' && ins[0].contenido === FIJAS[0].content)
const blq = bloqueSeccionesFijas(FIJAS)
check('bloque: solo activas, con título y texto, y la orden de no reescribir', blq.includes('titulo="Quiénes somos"') && blq.includes(FIJAS[1].content) && !blq.includes('Qué te ofrecemos') && blq.includes('tal cual'))
check('sin activas, bloque vacío', bloqueSeccionesFijas([FIJAS[2]]) === '')
check('la regla de medios materiales prohíbe ofrecer lo no pedido', /no pida expresamente/.test(REGLA_MEDIOS_MATERIALES) && /ESTE pliego/.test(REGLA_MEDIOS_MATERIALES))

console.log('\nEsqueleto mínimo: plan de contingencia siempre; lo que falte se detecta')
import { parseRequiredSections, seccionesRequeridas, requeridasQueFaltan, bloqueSeccionesRequeridas, SECCIONES_SIEMPRE } from '../../lib/tenders/teaching'
check('parse: limpia, sin repetidos (con número y mayúsculas)', parseRequiredSections(['Gestión de incidencias', ' 1. GESTIÓN DE INCIDENCIAS ', 'Puesta en marcha', 7]).join('|') === 'Gestión de incidencias|Puesta en marcha')
const reqs = seccionesRequeridas(['Puesta en marcha', 'Equipo humano'], FIJAS)
check('requeridas = lista + Plan de contingencia, sin las que ya son fijas', reqs.join('|') === 'Puesta en marcha|Plan de contingencia' && SECCIONES_SIEMPRE[0] === 'Plan de contingencia')
check('sin lista, al menos el plan de contingencia', seccionesRequeridas([]).join() === 'Plan de contingencia')
check('faltan: detecta la que no está y acepta «1.8 Plan de contingencia»', requeridasQueFaltan([{ titulo: '1.8 PLAN DE CONTINGENCIA' }, { titulo: 'Servicio' }], reqs).join() === 'Puesta en marcha')
check('bloque: lo más completa posible, con la lista', bloqueSeccionesRequeridas(reqs).includes('- Plan de contingencia') && /COMPLETA POSIBLE/.test(bloqueSeccionesRequeridas(reqs)) && bloqueSeccionesRequeridas([]) === '')

console.log(`\n${pass} pasan · ${fail} fallan\n`)
process.exit(fail === 0 ? 0 : 1)
