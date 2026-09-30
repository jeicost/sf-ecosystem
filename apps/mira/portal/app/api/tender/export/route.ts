import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'

// Cualquier documento de la licitación, como Word entregable.
//
// Tres orígenes, un solo formato de salida:
//   · la memoria técnica del expediente (tenders.memoria)
//   · la oferta económica (tenders.oferta), que sale con su tabla de precios
//   · cualquier documento de tender_documents (anexos y los que subió el
//     operador para trabajarlos)
//
// Word y no PDF a propósito: esto se sigue editando fuera, se le añade el
// membrete y se firma. Un PDF obliga a rehacer el camino.

export const maxDuration = 120

interface Section { titulo?: string; contenido?: string; criterio?: string; puntos_objetivo?: number | null; datos_a_confirmar?: string[]; nota?: string }
interface Memoria { titulo?: string; resumen_ejecutivo?: string; secciones?: Section[]; checklist_qa?: string[]; data_gaps?: string[] }
interface OfertaLinea { seccion?: string; servicio?: string; tramo?: string | null; max_sin_iva?: number | null; precio_ofertado?: number | null; baja_pct?: number | null; motivo?: string; a_confirmar?: boolean }
interface Oferta { lote?: string | null; formula_precio?: string | null; estrategia?: string; lineas?: OfertaLinea[]; criterios_automaticos?: { nombre?: string; respuesta?: string; puntos?: number | null }[]; a_confirmar_global?: string[]; avisos?: string[]; suma_ponderada?: number | null }

/**
 * XML no admite caracteres de control: uno solo dentro de un párrafo produce un
 * .docx que Word se niega a abrir, y la API lo devolvía con un 200 como si todo
 * hubiera ido bien. Los PDF de origen (sobre todo los firmados) los traen. Se
 * limpia TODO el texto de una vez, antes de construir nada.
 */
function sanear<T>(v: T): T {
  if (typeof v === 'string') return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '') as T
  if (Array.isArray(v)) return v.map(sanear) as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sanear(x)])) as T
  return v
}

/**
 * Cabecera de descarga que no revienta. Una sola letra fuera de Latin-1 en el
 * título (la ligadura «ﬁ» de un PDF, una Ω) tumbaba la respuesta con un 500. Se
 * manda un nombre ASCII de reserva y el nombre real codificado (RFC 5987).
 */
function disposition(nombre: string): string {
  const base = nombre.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'documento'
  const ascii = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '_')
  return `attachment; filename="${ascii}.docx"; filename*=UTF-8''${encodeURIComponent(base)}.docx`
}

const eur = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; tenderId?: string; documentId?: string; kind?: 'memoria' | 'oferta' }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/export', access)

    const db = adminClient()
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageOrientation, BorderStyle,
      Table, TableRow, TableCell, WidthType, ShadingType,
    } = await import('docx')

    const H = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
      new Paragraph({ heading: level, children: [new TextRun(text)] })
    // Un \n dentro de un TextRun no salta de línea en Word: cada párrafo, suyo.
    const parrafos = (texto: string) =>
      String(texto || '').split(/\n+/).filter((x) => x.trim()).map((p) => new Paragraph({ children: [new TextRun(p.trim())] }))
    const porConfirmar = (items: string[]) => [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'E5B800', space: 4 } },
        children: [new TextRun({ text: 'Por confirmar antes de presentar:', bold: true, color: '946200' })],
      }),
      ...items.map((d) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: d, color: '946200' })] })),
    ]

    const children: object[] = []
    let nombre = 'documento'

    if (body.documentId) {
      const { data, error } = await db.from('tender_documents').select('id,title,sections,kind')
        .eq('id', body.documentId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const secs = sanear((data.sections || []) as unknown as Section[])
      if (!secs.length) return NextResponse.json({ error: 'Este documento no tiene contenido todavía.' }, { status: 400 })
      nombre = String(data.title || 'documento')
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: nombre, bold: true, size: 40 })] }), new Paragraph({ children: [] }))
      for (const s of secs) {
        children.push(H(s.titulo || 'Sección', HeadingLevel.HEADING_1), ...parrafos(s.contenido || ''))
        if (s.nota) children.push(...porConfirmar([s.nota]))
      }
    } else if (body.kind === 'oferta') {
      if (typeof body.tenderId !== 'string') return NextResponse.json({ error: 'tenderId required' }, { status: 400 })
      const { data, error } = await db.from('tenders').select('id,title,expediente,oferta')
        .eq('id', body.tenderId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const oferta = sanear((data.oferta || null) as Oferta | null)
      if (!oferta?.lineas?.length) return NextResponse.json({ error: 'Este expediente todavía no tiene oferta económica.' }, { status: 400 })
      nombre = `Oferta económica — ${data.title || ''}`.trim()

      children.push(
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'OFERTA ECONÓMICA', bold: true, size: 40 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(data.title || ''), size: 24, color: '595959' })] }),
      )
      if (data.expediente) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Expediente ${data.expediente}${oferta.lote ? ` · ${oferta.lote}` : ''}`, size: 22, color: '595959' })] }))
      children.push(new Paragraph({ children: [] }))

      // El desglose va en tabla: una lista de precios en párrafos no se lee.
      const ANCHO = 9638
      const COLS = [3238, 1500, 1600, 1700, 1600]
      const borde = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
      const bordes = { top: borde, bottom: borde, left: borde, right: borde }
      const celda = (t: string, i: number, opts: { bold?: boolean; fill?: string; right?: boolean } = {}) =>
        new TableCell({
          borders: bordes, width: { size: COLS[i], type: WidthType.DXA },
          ...(opts.fill ? { shading: { fill: opts.fill, type: ShadingType.CLEAR } } : {}),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text: t, bold: opts.bold, size: 20 })] })],
        })
      const cabecera = ['Servicio', 'Tramo', 'Máx. sin IVA', 'Ofertado', 'Baja']
      const filas = [
        new TableRow({ children: cabecera.map((t, i) => celda(t, i, { bold: true, fill: 'EFEFEF', right: i >= 2 })) }),
        ...oferta.lineas.map((l) => new TableRow({
          children: [
            celda(String(l.servicio || l.seccion || ''), 0),
            celda(String(l.tramo || '—'), 1),
            celda(eur(l.max_sin_iva), 2, { right: true }),
            celda(eur(l.precio_ofertado), 3, { right: true }),
            // Coma decimal: esto lo lee una administración española.
            celda(typeof l.baja_pct === 'number' ? `${l.baja_pct.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : '—', 4, { right: true }),
          ],
        })),
      ]
      children.push(new Table({ width: { size: ANCHO, type: WidthType.DXA }, columnWidths: COLS, rows: filas }))

      if (typeof oferta.suma_ponderada === 'number') {
        children.push(new Paragraph({ children: [] }), new Paragraph({ children: [new TextRun({ text: `Puntuación ponderada estimada: ${oferta.suma_ponderada}`, bold: true })] }))
      }
      if (oferta.estrategia) { children.push(H('Criterio seguido', HeadingLevel.HEADING_1), ...parrafos(oferta.estrategia)) }
      if (oferta.criterios_automaticos?.length) {
        children.push(H('Criterios automáticos', HeadingLevel.HEADING_1))
        for (const c of oferta.criterios_automaticos) {
          children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(`${c.nombre || ''}: ${c.respuesta || ''}${typeof c.puntos === 'number' ? ` (${c.puntos} puntos)` : ''}`)] }))
        }
      }
      const pendientes = [...(oferta.a_confirmar_global || []), ...(oferta.avisos || [])]
      if (pendientes.length) children.push(...porConfirmar(pendientes))
    } else {
      if (typeof body.tenderId !== 'string') return NextResponse.json({ error: 'tenderId required' }, { status: 400 })
      const { data, error } = await db.from('tenders').select('id,title,expediente,memoria')
        .eq('id', body.tenderId).eq('client_id', access.clientId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const memoria = sanear((data.memoria || null) as Memoria | null)
      if (!memoria?.secciones?.length) return NextResponse.json({ error: 'Este expediente todavía no tiene memoria generada.' }, { status: 400 })
      nombre = memoria.titulo || String(data.title || 'memoria')

      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: nombre, bold: true, size: 40 })] }))
      if (data.expediente) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Expediente ${data.expediente}`, size: 22, color: '595959' })] }))
      children.push(new Paragraph({ children: [] }))
      if (memoria.resumen_ejecutivo) { children.push(H('Resumen ejecutivo', HeadingLevel.HEADING_1), ...parrafos(memoria.resumen_ejecutivo)) }
      for (const s of memoria.secciones) {
        const puntos = typeof s.puntos_objetivo === 'number' ? ` (${s.puntos_objetivo} puntos)` : ''
        children.push(H(`${s.titulo || s.criterio || 'Sección'}${puntos}`, HeadingLevel.HEADING_1), ...parrafos(s.contenido || ''))
        if (s.datos_a_confirmar?.length) children.push(...porConfirmar(s.datos_a_confirmar))
      }
      // Las notas de trabajo (huecos del corpus, comprobaciones) NO son parte de
      // la memoria: iban con el mismo Heading 1 que las secciones reales, así
      // que entraban en el índice y se presentaban a la administración. Ahora
      // van al final, en página aparte, en ámbar y sin estilo de encabezado.
      const internas = [...(memoria.data_gaps || []), ...(memoria.checklist_qa || [])]
      if (internas.length) {
        children.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: 'NOTAS INTERNAS — ELIMINAR ANTES DE PRESENTAR', bold: true, color: '946200', size: 26 })] }))
        for (const n of internas) children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: n, color: '946200' })] }))
      }
    }

    const doc = new Document({
      styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 30, bold: true, font: 'Arial' },
            paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
        ],
      },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
        children: children as never,
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    done({ kind: body.documentId ? 'documento' : (body.kind || 'memoria'), bytes: buffer.length }); return new NextResponse(new Uint8Array(buffer), {
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
