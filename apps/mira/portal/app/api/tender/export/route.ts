import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'
import { construirWord, resolverPlantilla, rotuloPorKind, sanear, disposition, type EntradaWord, type SeccionWord } from '@/lib/tenders/word'
import { anexosObligatorios, loadDisenadas, marcadoresEn, resolverDisenadas, type Disenada } from '@/lib/tenders/disenadas'

// Cualquier documento de la licitación, como Word entregable.
//
// Cuatro orígenes, un solo constructor (lib/tenders/word.ts) y un solo formato:
//   · la memoria técnica del expediente (tenders.memoria)
//   · la oferta económica (tenders.oferta), que sale con su tabla de precios
//   · cualquier documento de tender_documents (anexos y los que subió el
//     operador para trabajarlos)
//   · una MUESTRA (body.sample) con texto neutro, para que la usuaria vea su
//     plantilla de marca desde la pantalla de ajustes sin tocar datos reales
//
// Word y no PDF a propósito: esto se sigue editando fuera, se le añade lo que
// falte y se firma. Un PDF obliga a rehacer el camino. Desde el 1-oct-2026 el
// Word sale con membrete de marca (portada, índice, cabecera y pie): antes
// era Arial negro y Usoa lo maquetaba entero a mano.

export const maxDuration = 120

interface Section { titulo?: string; contenido?: string; criterio?: string; puntos_objetivo?: number | null; datos_a_confirmar?: string[]; nota?: string }
interface Memoria { titulo?: string; resumen_ejecutivo?: string; secciones?: Section[]; checklist_qa?: string[]; data_gaps?: string[] }
interface OfertaLinea { seccion?: string; servicio?: string; tramo?: string | null; max_sin_iva?: number | null; precio_ofertado?: number | null; baja_pct?: number | null; motivo?: string; a_confirmar?: boolean }
interface Oferta { lote?: string | null; formula_precio?: string | null; estrategia?: string; lineas?: OfertaLinea[]; criterios_automaticos?: { nombre?: string; respuesta?: string; puntos?: number | null }[]; a_confirmar_global?: string[]; avisos?: string[]; suma_ponderada?: number | null }

const eur = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'

/** Muestra neutra: ni un dato de cliente. Solo enseña cómo queda la plantilla. */
function seccionesMuestra(): SeccionWord[] {
  return [
    { titulo: 'Objeto del documento', puntos: 20, contenido:
      'Este documento es una muestra generada para comprobar la plantilla de Word de la marca: portada, índice, cabecera, pie y estilo de los títulos.\nEl texto es neutro y no procede de ningún expediente. Sustituye este contenido por la memoria real cuando exportes una licitación.' },
    { titulo: 'Metodología propuesta', contenido:
      'Las secciones se numeran solas y aparecen en el índice y en el panel de navegación de Word. Cada párrafo del texto original se convierte en un párrafo propio.\n- Las líneas que empiezan por guion salen como viñetas reales.\n- Se pueden reformatear desde Word sin romper nada.\n- El pie repite la línea legal de la marca en todas las páginas menos la portada.',
      porConfirmar: ['Así se marca un dato que hay que comprobar antes de presentar.'] },
    { titulo: 'Compromisos y garantías', contenido:
      'El cuerpo va en la tipografía de la plantilla (la de la hoja oficial si se ha subido; si no, Arial) a 11 pt. Los títulos usan el color de acento y la portada el color de portada.\n## Un subapartado\nUna línea que empieza por «## » o va entera en MAYÚSCULAS sale como subtítulo; **lo que va entre asteriscos dobles** sale en negrita; un dato que falta se marca así: [FALTA: cifra de la flota].\n1. Las listas numeradas se numeran solas.\n2. Y siguen el orden del texto.\n| Servicio | Plazo | Importe |\n|---|---|---|\n| Mensajería urbana | 2 h | 100 |\n| Paquetería nacional | 24 h | 250 |\nSi algo de la plantilla no encaja, cámbialo en los ajustes y vuelve a generar esta muestra. Las páginas con diseño propio marcadas como «siempre» aparecen al final como anexos.' },
  ]
}

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; tenderId?: string; documentId?: string; kind?: 'memoria' | 'oferta'; sample?: boolean }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/export', access)

    const db = adminClient()
    // La plantilla se resuelve en paralelo con los datos: lee dos filas y baja el logo.
    const plantillaP = resolverPlantilla(db, access.clientId)

    let entrada: Omit<EntradaWord, 'plantilla'>
    let nombre = 'documento'
    let tipoRegistro: 'memoria' | 'oferta' | 'documento' | 'sample'

    if (body.sample === true) {
      tipoRegistro = 'sample'
      nombre = 'Word template preview'
      entrada = {
        tipo: 'memoria', rotulo: 'MEMORIA TÉCNICA', titulo: 'Documento de muestra de la plantilla',
        expediente: 'Ejemplo 0000/2026', organo: 'Órgano de contratación (ejemplo)',
        secciones: seccionesMuestra(),
        internas: ['Esta página solo aparece cuando la memoria trae notas de trabajo: huecos del corpus, comprobaciones. Se elimina antes de presentar.'],
      }
    } else if (body.documentId) {
      tipoRegistro = 'documento'
      const { data, error } = await db.from('tender_documents').select('id,title,sections,kind,tender_id')
        .eq('id', body.documentId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const secs = sanear((data.sections || []) as unknown as Section[])
      if (!secs.length) return NextResponse.json({ error: 'Este documento no tiene contenido todavía.' }, { status: 400 })
      nombre = String(data.title || 'documento')
      // Expediente y órgano vienen del expediente al que pertenece el documento, si lo hay.
      let expediente: string | null = null, organo: string | null = null
      if (data.tender_id) {
        const { data: t } = await db.from('tenders').select('expediente,organo').eq('id', data.tender_id).eq('client_id', access.clientId).maybeSingle()
        expediente = t?.expediente ?? null; organo = t?.organo ?? null
      }
      entrada = {
        tipo: 'documento', rotulo: rotuloPorKind(data.kind), titulo: nombre, expediente, organo,
        secciones: secs.map((s) => ({ titulo: s.titulo || 'Sección', contenido: s.contenido || '', porConfirmar: s.nota ? [s.nota] : undefined })),
      }
    } else if (body.kind === 'oferta') {
      tipoRegistro = 'oferta'
      if (typeof body.tenderId !== 'string') return NextResponse.json({ error: 'tenderId required' }, { status: 400 })
      const { data, error } = await db.from('tenders').select('id,title,expediente,organo,oferta')
        .eq('id', body.tenderId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const oferta = sanear((data.oferta || null) as Oferta | null)
      if (!oferta?.lineas?.length) return NextResponse.json({ error: 'Este expediente todavía no tiene oferta económica.' }, { status: 400 })
      nombre = `Oferta económica — ${data.title || ''}`.trim()

      const bloques: EntradaWord['bloques'] = []
      if (oferta.formula_precio) bloques.push({ titulo: 'Fórmula de precio del pliego', parrafos: [oferta.formula_precio] })
      if (oferta.estrategia) bloques.push({ titulo: 'Criterio seguido', parrafos: [oferta.estrategia] })
      if (oferta.criterios_automaticos?.length) {
        bloques.push({ titulo: 'Criterios automáticos', parrafos: oferta.criterios_automaticos.map((c) =>
          `- ${c.nombre || ''}: ${c.respuesta || ''}${typeof c.puntos === 'number' ? ` (${c.puntos} puntos)` : ''}`) })
      }
      entrada = {
        tipo: 'oferta', rotulo: 'OFERTA ECONÓMICA', titulo: String(data.title || ''),
        expediente: [data.expediente, oferta.lote].filter(Boolean).join(' · ') || null, organo: data.organo,
        secciones: [],
        // El desglose va en tabla: una lista de precios en párrafos no se lee.
        tabla: {
          cabecera: ['Servicio', 'Tramo', 'Máx. sin IVA', 'Ofertado', 'Baja'],
          anchos: [3238, 1500, 1600, 1700, 1600], alinearDerecha: [2, 3, 4],
          filas: oferta.lineas.map((l) => [
            String(l.servicio || l.seccion || ''),
            String(l.tramo || '—'),
            eur(l.max_sin_iva),
            // Un precio propuesto por analogía NO puede salir igual que uno firme en un entregable.
            l.a_confirmar ? `${eur(l.precio_ofertado)} (a confirmar)` : eur(l.precio_ofertado),
            // Coma decimal: esto lo lee una administración española.
            typeof l.baja_pct === 'number' ? `${l.baja_pct.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '—',
          ]),
          pie: typeof oferta.suma_ponderada === 'number' ? `Puntuación ponderada estimada: ${oferta.suma_ponderada}` : undefined,
        },
        bloques,
        porConfirmar: [
          ...oferta.lineas.filter((l) => l.a_confirmar).map((l) => `«${String(l.servicio || l.seccion || '')}${l.tramo ? ` ${l.tramo}` : ''}»: ${eur(l.precio_ofertado)} propuesto por analogía${l.motivo ? ` — ${l.motivo}` : ''}`),
          ...(oferta.a_confirmar_global || []), ...(oferta.avisos || []),
        ],
      }
    } else {
      tipoRegistro = 'memoria'
      if (typeof body.tenderId !== 'string') return NextResponse.json({ error: 'tenderId required' }, { status: 400 })
      const { data, error } = await db.from('tenders').select('id,title,expediente,organo,memoria')
        .eq('id', body.tenderId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const memoria = sanear((data.memoria || null) as Memoria | null)
      if (!memoria?.secciones?.length) return NextResponse.json({ error: 'Este expediente todavía no tiene memoria generada.' }, { status: 400 })
      nombre = memoria.titulo || String(data.title || 'memoria')

      const secciones: SeccionWord[] = []
      if (memoria.resumen_ejecutivo) secciones.push({ titulo: 'Resumen ejecutivo', contenido: memoria.resumen_ejecutivo })
      for (const s of memoria.secciones) {
        secciones.push({ titulo: s.titulo || s.criterio || 'Sección', contenido: s.contenido || '', puntos: s.puntos_objetivo ?? null, porConfirmar: s.datos_a_confirmar })
      }
      entrada = {
        tipo: 'memoria', rotulo: 'MEMORIA TÉCNICA', titulo: nombre, expediente: data.expediente, organo: data.organo,
        secciones,
        // Las notas de trabajo (huecos del corpus, comprobaciones) NO son parte
        // de la memoria: van al final, en página aparte, en ámbar y fuera de la
        // navegación, para que no se presenten a la administración.
        internas: [...(memoria.data_gaps || []), ...(memoria.checklist_qa || [])],
      }
    }

    // Páginas con diseño propio: las que el texto marca ([[DISEÑO:id]]) y las de
    // «siempre» como anexo. Solo se descargan las que hacen falta.
    const lista = await loadDisenadas(db, access.clientId).catch((): Disenada[] => [])
    let disenadas: EntradaWord['disenadas'] = []
    let anexos: EntradaWord['anexos'] = []
    if (lista.length) {
      const textos = [...entrada.secciones.map((s) => s.contenido), ...(entrada.bloques || []).flatMap((b) => b.parrafos)]
      const usadas = new Set(textos.flatMap((t) => marcadoresEn(t, lista)))
      const obligatorias = anexosObligatorios(lista, usadas)
      const necesarias = lista.filter((d) => usadas.has(d.id) || obligatorias.some((a) => a.id === d.id))
      const { resueltas, avisos } = await resolverDisenadas(db, access.clientId, necesarias)
      disenadas = resueltas.filter((d) => usadas.has(d.id))
      anexos = resueltas.filter((d) => obligatorias.some((a) => a.id === d.id))
      if (avisos.length) console.warn('tender/export páginas diseñadas:', avisos.join(' | '))
    }
    const buffer = await construirWord({ ...entrada, plantilla: await plantillaP, disenadas, anexos })
    done({ kind: tipoRegistro, bytes: buffer.length })
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': disposition(sanear(nombre)),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    done?.error(500, errorMessage(error))
    console.error('tender/export error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
