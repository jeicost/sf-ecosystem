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

console.log(`\n${pass} pasan · ${fail} fallan\n`)
process.exit(fail === 0 ? 0 : 1)
