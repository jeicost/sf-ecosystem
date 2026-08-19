import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { onDocumentCompleted } from '@/lib/goals/hooks'
import { userCanAccessClient } from '@/lib/resolve-client'
import { DOC_TYPES } from '@/lib/generation/document-prompts'
import { generateDocument, DocumentGenerationError } from '@/lib/generation/document'

// La generación en sí vive en lib/generation/document para que el ejecutor de
// objetivos pueda llamarla sin sesión de usuario. Aquí queda solo lo propio de
// la ruta: autenticación, resolución del cliente/proyecto y códigos HTTP.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { getAll: () => cookieStore.getAll() }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { doc_type, client_id, project_id, input_data = {} } = await req.json()

    if (!doc_type || !DOC_TYPES.includes(doc_type)) {
      return NextResponse.json({ error: 'Invalid doc_type' }, { status: 400 })
    }

    const admin = adminClient()

    // Resolve client: explicit id (validated against the user's grants) or the user's client
    let clientId = client_id as string | undefined
    if (clientId && !(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }
    if (!clientId) {
      clientId = user.user_metadata?.client_id
    }
    if (!clientId) {
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      clientId = accessData?.project_id
    }
    if (!clientId) {
      return NextResponse.json({ error: 'No client context' }, { status: 403 })
    }

    // Optional project scoping: the project must exist and belong to the resolved client
    let projectId: string | null = null
    if (typeof project_id === 'string' && project_id.trim()) {
      const { data: projectRow } = await admin
        .from('mira_projects')
        .select('id, client_id')
        .eq('id', project_id)
        .maybeSingle()
      if (!projectRow) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      if (projectRow.client_id !== clientId) {
        return NextResponse.json(
          { error: 'Project does not belong to this client' },
          { status: 403 }
        )
      }
      projectId = projectRow.id
    }

    try {
      const { queueId } = await generateDocument({
        clientId,
        userId: user.id,
        docType: doc_type,
        inputData: input_data,
        projectId,
      })
      // Si este documento era una tarea de un objetivo (un playbook), se da por hecha.
      await onDocumentCompleted(admin, queueId)
      return NextResponse.json({ success: true, queue_id: queueId })
    } catch (error) {
      if (error instanceof DocumentGenerationError) {
        return NextResponse.json({ error: error.message, queue_id: error.queueId }, { status: 500 })
      }
      // Mismo literal que antes del refactor para un valor lanzado que no sea Error.
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Request failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 }
    )
  }
}
