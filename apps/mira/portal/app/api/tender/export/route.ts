import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'

// La memoria, como documento entregable.
//
// Hasta ahora el único destino de una memoria generada era el portapapeles: se
// copiaba a mano a un Word y allí se maquetaba. Para una licitación pública eso
// es la mitad del trabajo hecho a mano sobre un texto que MIRA ya tenía
// estructurado en secciones con sus puntos.
//
// Se genera .docx (no PDF) a propósito: una memoria técnica se sigue editando
// después —el responsable ajusta, añade su anexo, cambia una cifra— y un PDF
// obliga a rehacer el camino. El documento sale con estilos de encabezado
// reales, así que Word le construye el índice solo.

export const maxDuration = 120

interface Section { criterio?: string; puntos_objetivo?: number | null; titulo?: string; contenido?: string; datos_a_confirmar?: string[] }
interface Memoria { titulo?: string; resumen_ejecutivo?: string; secciones?: Section[]; checklist_qa?: string[]; data_gaps?: string[] }

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; tenderId?: string }
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (typeof body.tenderId !== 'string') return NextResponse.json({ error: 'tenderId required' }, { status: 400 })

    const db = adminClient()
    const { data: tender, error } = await db
      .from('tenders')
      .select('id,client_id,title,expediente,memoria')
      .eq('id', body.tenderId)
      .eq('client_id', access.clientId)   // frontera de inquilino
      .maybeSingle()
    if (error) throw error
    if (!tender) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const memoria = (tender.memoria || null) as Memoria | null
    if (!memoria?.secciones?.length) {
      return NextResponse.json({ error: 'Este expediente todavía no tiene memoria generada.' }, { status: 400 })
    }

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageOrientation, BorderStyle } =
      await import('docx')

    const H = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
      new Paragraph({ heading: level, children: [new TextRun(text)] })

    // Cada párrafo del contenido va como Paragraph propio: un \n dentro de un
    // TextRun no salta de línea en Word, se queda pegado.
    const body_: InstanceType<typeof Paragraph>[] = []
    body_.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: memoria.titulo || tender.title || 'Memoria técnica', bold: true, size: 40 })],
    }))
    if (tender.expediente) {
      body_.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Expediente ${tender.expediente}`, size: 22, color: '595959' })],
      }))
    }
    body_.push(new Paragraph({ children: [] }))

    if (memoria.resumen_ejecutivo) {
      body_.push(H('Resumen ejecutivo', HeadingLevel.HEADING_1))
      for (const p of String(memoria.resumen_ejecutivo).split(/\n{1,}/).filter((x) => x.trim())) {
        body_.push(new Paragraph({ children: [new TextRun(p.trim())] }))
      }
    }

    for (const s of memoria.secciones) {
      const puntos = typeof s.puntos_objetivo === 'number' ? ` (${s.puntos_objetivo} puntos)` : ''
      body_.push(H(`${s.titulo || s.criterio || 'Sección'}${puntos}`, HeadingLevel.HEADING_1))
      for (const p of String(s.contenido || '').split(/\n{1,}/).filter((x) => x.trim())) {
        body_.push(new Paragraph({ children: [new TextRun(p.trim())] }))
      }
      // Lo que falta por confirmar viaja DENTRO del documento, marcado: si se
      // queda solo en la pantalla, se entrega una memoria con huecos sin que
      // nadie lo note.
      if (s.datos_a_confirmar?.length) {
        body_.push(new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'E5B800', space: 4 } },
          children: [new TextRun({ text: 'Por confirmar antes de presentar:', bold: true, color: '946200' })],
        }))
        for (const d of s.datos_a_confirmar) {
          body_.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: d, color: '946200' })] }))
        }
      }
    }

    if (memoria.data_gaps?.length) {
      body_.push(H('Datos que faltaban en el corpus', HeadingLevel.HEADING_1))
      for (const g of memoria.data_gaps) body_.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(g)] }))
    }
    if (memoria.checklist_qa?.length) {
      body_.push(H('Comprobaciones antes de presentar', HeadingLevel.HEADING_1))
      for (const c of memoria.checklist_qa) body_.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun(c)] }))
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
        properties: {
          page: {
            // A4: es lo que pide una administración española.
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: body_,
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const safe = (memoria.titulo || tender.title || 'memoria').replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().slice(0, 60) || 'memoria'
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safe}.docx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('tender/export error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
