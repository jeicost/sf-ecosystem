// Regresiones del módulo de Licitaciones. Sin red, sin BD, gratis.
//   npx tsx evals/licitaciones/check.ts
//
// Cada comprobación corresponde a un fallo real que existió (29-sep-2026).
import { cortarPorAnclas, limpiarMaquetacion, rotulo, trocearPorPaginas } from '../../lib/tenders/secciones'
import { pliegoTruncationGap, PLIEGO_WINDOW } from '../../lib/generation/tender-memoria'

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

console.log(`\n${pass} pasan · ${fail} fallan\n`)
process.exit(fail === 0 ? 0 : 1)
