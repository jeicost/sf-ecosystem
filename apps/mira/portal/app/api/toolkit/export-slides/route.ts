import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { getClientDriveAccessToken } from '@/lib/drive-sync'
import { resolveClientDeliverablesFolder, uploadToClientDrive } from '@/lib/export/drive-upload'
import { buildPptxFromQueueRow, resolvePptxArtifact, type PptxBrand } from '@/lib/export/pptx-from-queue'
import { normalizeDocMode } from '@/lib/export/doc-theme'

export const runtime = 'nodejs'
export const maxDuration = 120

const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const GOOGLE_SLIDES = 'application/vnd.google-apps.presentation'

// F4: entrega como Google Slides EDITABLE en el Drive del cliente — el equipo
// trabaja el mes sobre la presentación, no sobre un HTML de solo lectura.
// La conversión la hace Google en la subida (convertTo) con el scope
// drive.file ya concedido.
//
// Sirve para cualquier fila con PPTX (deck mensual, Voice Guide, decks del
// Centro de Documentos y la vista "Presentación" de cualquier informe del
// toolkit): la decisión de qué PPTX toca vive en lib/export/pptx-from-queue,
// no aquí. Antes solo dos slugs pasaban y el resto moría en un 400 que la UI
// ni mostraba.

type Ctx = {
  admin: ReturnType<typeof adminClient>
  row: {
    id: string
    client_id: string
    project_id: string | null
    tool_slug: string
    status: string
    result_data: unknown
    input_data: unknown
  }
}

// Carga + autorización compartidas por GET (sonda) y POST (export). Devuelve
// la respuesta de error ya montada para que cada handler solo haga `return`.
async function loadRow(queueId: string): Promise<Ctx | NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = adminClient()
  const { data: row, error } = await admin
    .from('generation_queue')
    .select('id, client_id, project_id, tool_slug, status, result_data, input_data')
    .eq('id', queueId)
    .single()
  if (error || !row) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
  if (!(await userCanAccessClient(user, row.client_id))) {
    return NextResponse.json({ error: 'No access to this report' }, { status: 403 })
  }
  return { admin, row: row as Ctx['row'] }
}

// Misma resolución de marca que app/api/toolkit/export/route.ts: el deck que
// sube a Slides tiene que ser el mismo que el usuario ve en el visor.
async function loadBrand(admin: Ctx['admin'], clientId: string, result: unknown): Promise<PptxBrand> {
  const [{ data: brandData }, { data: clientRow }] = await Promise.all([
    admin.from('brand_profiles').select('name, brand_data').eq('client_id', clientId).single(),
    admin.from('clients').select('name, primary_color, logo_url').eq('id', clientId).single(),
  ])
  const r = (result && typeof result === 'object' ? result : {}) as Record<string, any>
  return {
    clientName: brandData?.name || clientRow?.name || 'Cliente',
    primaryColor:
      r.brandColor ||
      (brandData?.brand_data as any)?.visual_identity?.colors?.primary ||
      clientRow?.primary_color ||
      '#8B5CF6',
    logoUrl: clientRow?.logo_url || null,
    typography: (brandData?.brand_data as any)?.visual_identity?.typography ?? undefined,
  }
}

const DRIVE_MESSAGES = {
  not_connected:
    'Your Google Drive is not connected. Go to Integrations → Connect Google Drive and try again.',
  needs_reauth:
    'Your Google Drive connection needs to be renewed. Go to Integrations and reconnect your Drive.',
} as const

// Sonda para la UI: ¿esta fila tiene PPTX y está el Drive listo? Permite
// pintar el botón con el estado real (deshabilitado + motivo, o aviso de
// "reconecta Drive") en vez de esperar al clic para descubrir el 409.
// Consultar el token también sanea `is_authorized` cuando el refresh token
// está muerto (getClientDriveAccessToken lo marca), así que las siguientes
// sondas no vuelven a llamar a Google.
export async function GET(req: NextRequest) {
  try {
    const queueId = new URL(req.url).searchParams.get('queue_id')
    if (!queueId) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }
    const requested = new URL(req.url).searchParams.get('artifact')
    const ctx = await loadRow(queueId)
    if (ctx instanceof NextResponse) return ctx
    const { admin, row } = ctx

    const tokenResult = await getClientDriveAccessToken(row.client_id, admin)
    const drive = 'token' in tokenResult ? 'connected' : tokenResult.error

    if (row.status !== 'completed' || !row.result_data) {
      return NextResponse.json({
        available: false,
        reason: 'This report is not finished yet',
        tool_slug: row.tool_slug,
        drive,
      })
    }
    const resolution = resolvePptxArtifact(row, requested)
    return NextResponse.json({
      ...resolution,
      tool_slug: row.tool_slug,
      drive,
      ...(drive !== 'connected' ? { driveMessage: DRIVE_MESSAGES[drive] } : {}),
    })
  } catch (error) {
    console.error('Export-slides probe error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Probe failed' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { queue_id, artifact, theme } = body ?? {}
    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const ctx = await loadRow(queue_id)
    if (ctx instanceof NextResponse) return ctx
    const { admin, row } = ctx

    if (row.status !== 'completed' || !row.result_data) {
      return NextResponse.json({ error: 'This report is not finished yet' }, { status: 409 })
    }

    // ── Construcción del PPTX ──
    const brand = await loadBrand(admin, row.client_id, row.result_data)
    const built = await buildPptxFromQueueRow({
      row,
      brand,
      requested: artifact ?? null,
      mode: normalizeDocMode(theme),
    })
    if (!built.ok) {
      return NextResponse.json(
        { error: built.error, ...(built.verification ? { verification: built.verification } : {}) },
        { status: built.status }
      )
    }

    // ── Drive del cliente + conversión a Google Slides ──
    const tokenResult = await getClientDriveAccessToken(row.client_id, admin)
    if (!('token' in tokenResult)) {
      return NextResponse.json(
        {
          success: false,
          reason: tokenResult.error,
          error: DRIVE_MESSAGES[tokenResult.error],
        },
        { status: 409 }
      )
    }

    const folderId = await resolveClientDeliverablesFolder(
      admin,
      tokenResult.token,
      row.client_id,
      row.project_id ?? null
    )
    const upload = await uploadToClientDrive({
      token: tokenResult.token,
      folderId,
      fileName: built.fileName,
      content: built.buffer,
      mimeType: PPTX_MIME,
      convertTo: GOOGLE_SLIDES,
    })
    if (!upload.success) {
      console.error(`Slides export failed for client ${row.client_id}: ${upload.error}`)
      return NextResponse.json(
        { success: false, error: 'The presentation could not be created in your Drive. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      artifact: built.artifact,
      driveUrl: upload.webViewLink,
      fileId: upload.fileId,
      filename: built.fileName,
      ...(built.verification
        ? { verification: { slides: built.verification.slides, approveRows: built.verification.approveRows } }
        : {}),
    })
  } catch (error) {
    console.error('Export-slides error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
