// Subida al Drive del CLIENTE (OAuth por cliente, esquema B3) — extraído de
// app/api/export/google-drive/route.ts para que export-slides (F4) y futuros
// exports lo compartan. Generalizado a contenido binario (Buffer) y a
// conversión nativa de Google (p.ej. PPTX → Google Slides pasando
// convertTo='application/vnd.google-apps.presentation').

import type { adminClient } from '@/lib/supabase'

type Admin = ReturnType<typeof adminClient>

export async function createDriveFolder(
  token: string,
  name: string,
  parentId?: string | null
): Promise<string | null> {
  const body: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) body.parents = [parentId]
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    console.warn(`Could not create Drive folder "${name}":`, await res.json().catch(() => ({})))
    return null
  }
  const created = await res.json()
  return created.id ?? null
}

async function registerFolder(admin: Admin, row: Record<string, unknown>) {
  const { error } = await admin.from('drive_folders').insert({
    sync_status: 'completed',
    files_synced: 0,
    ...row,
  })
  if (error) console.warn('Could not register folder in drive_folders:', error)
}

/**
 * Resuelve la carpeta destino en el Drive del cliente:
 * 1. drive_folders del proyecto → 2. raíz "MIRA — Entregables" del cliente
 * (creándola si falta) → 3. con proyecto, subcarpeta "{Proyecto}".
 * null = subir a la raíz del Drive.
 */
export async function resolveClientDeliverablesFolder(
  admin: Admin,
  token: string,
  clientId: string,
  projectId: string | null
): Promise<string | null> {
  if (projectId) {
    const { data: projectFolder } = await admin
      .from('drive_folders')
      .select('folder_id')
      .eq('client_id', clientId)
      .eq('project_id', projectId)
      .eq('purpose', 'deliverables')
      .limit(1)
    if (projectFolder?.length) return projectFolder[0].folder_id
  }

  const { data: deliverablesFolder } = await admin
    .from('drive_folders')
    .select('folder_id')
    .eq('client_id', clientId)
    .eq('purpose', 'deliverables')
    .is('project_id', null)
    .limit(1)

  let rootId = deliverablesFolder?.[0]?.folder_id ?? null
  if (!rootId) {
    rootId = await createDriveFolder(token, 'MIRA — Entregables')
    if (!rootId) return null
    await registerFolder(admin, {
      client_id: clientId,
      folder_id: rootId,
      folder_name: 'MIRA — Entregables',
      purpose: 'deliverables',
    })
  }

  if (projectId) {
    const { data: project } = await admin
      .from('mira_projects')
      .select('name')
      .eq('id', projectId)
      .maybeSingle()
    const projectName = project?.name?.slice(0, 80) || 'Proyecto'
    const subId = await createDriveFolder(token, projectName, rootId)
    if (subId) {
      await registerFolder(admin, {
        client_id: clientId,
        project_id: projectId,
        folder_id: subId,
        folder_name: projectName,
        purpose: 'deliverables',
      })
      return subId
    }
  }

  return rootId
}

export interface DriveUploadResult {
  success: boolean
  fileId?: string
  webViewLink?: string
  error?: string
}

/**
 * Sube contenido (texto o Buffer) al Drive del cliente vía multipart.
 * `convertTo` fuerza la conversión nativa de Google en la subida (el metadata
 * lleva el mimeType destino y el cuerpo el de origen): PPTX →
 * 'application/vnd.google-apps.presentation' abre como Google Slides editable.
 * Funciona con el scope drive.file ya concedido — sin re-consent.
 */
export async function uploadToClientDrive(params: {
  token: string
  folderId: string | null
  fileName: string
  content: Buffer | string
  mimeType: string
  convertTo?: string
}): Promise<DriveUploadResult> {
  const { token, folderId, fileName, content, mimeType, convertTo } = params
  try {
    const boundary = `mira_export_${Date.now().toString(36)}`
    const metadata: { name: string; mimeType: string; parents?: string[] } = {
      name: fileName,
      mimeType: convertTo || mimeType,
    }
    if (folderId) metadata.parents = [folderId]

    const isBuffer = Buffer.isBuffer(content)
    const head =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n` +
      (isBuffer ? 'Content-Transfer-Encoding: base64\r\n' : '') +
      '\r\n'
    const tail = `\r\n--${boundary}--`
    const middle = isBuffer ? (content as Buffer).toString('base64') : (content as string)
    const body = head + middle + tail

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || `Client Drive upload failed (HTTP ${response.status})`,
      }
    }
    const data = await response.json()
    return { success: true, fileId: data.id, webViewLink: data.webViewLink }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Drive upload failed' }
  }
}
