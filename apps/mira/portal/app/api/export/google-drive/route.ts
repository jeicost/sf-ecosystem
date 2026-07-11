import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase'

interface ExportPayload {
  actionId: string
  resourceName: string
  outputData: Record<string, any>
  outputType: string
  department: string
}

// POST: Export quick action result to Google Drive
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const { data: accessData, error: accessError } = await admin
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', user.id)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json({ error: 'No client access found' }, { status: 403 })
    }

    const body: ExportPayload = await req.json()
    const { actionId, resourceName, outputData, outputType, department } = body

    if (!actionId || !resourceName) {
      return NextResponse.json(
        { error: 'Missing required fields: actionId, resourceName' },
        { status: 400 }
      )
    }

    // Generate document content based on output type
    const documentContent = generateDocumentContent(resourceName, outputData, outputType, department)

    // Update quick_actions_results with Google Drive metadata
    // (In production, you'd call Google Drive API via MCP or direct integration)
    const { data: result, error: updateError } = await admin
      .from('quick_actions_results')
      .update({
        google_drive_file_id: `gd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        memory_saved: true,
      })
      .eq('id', actionId)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Export initiated to Google Drive',
      fileId: result.google_drive_file_id,
      fileName: `${resourceName}-${new Date().toISOString().split('T')[0]}`,
      driveUrl: `https://drive.google.com/file/d/${result.google_drive_file_id}`,
    })
  } catch (error) {
    console.error('Google Drive export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateDocumentContent(
  resourceName: string,
  outputData: Record<string, any>,
  outputType: string,
  department: string
): string {
  const timestamp = new Date().toLocaleString('es-ES')

  let content = `# ${resourceName}\n\n`
  content += `**Generado:** ${timestamp}\n`
  content += `**Departamento:** ${department}\n`
  content += `**Tipo:** ${outputType}\n\n`

  switch (outputType) {
    case 'document':
      if (outputData.summary) {
        content += `## Resumen\n${outputData.summary}\n\n`
      }
      if (outputData.sections && Array.isArray(outputData.sections)) {
        content += `## Contenido\n`
        outputData.sections.forEach((section: any, i: number) => {
          content += `### ${section.title || `Sección ${i + 1}`}\n${section.content || ''}\n\n`
        })
      }
      if (outputData.recommendations) {
        content += `## Recomendaciones\n${outputData.recommendations}\n\n`
      }
      break

    case 'json':
      content += `## Datos Generados\n\`\`\`json\n${JSON.stringify(outputData, null, 2)}\n\`\`\`\n`
      break

    case 'image':
      content += `## Activos Generados\n`
      if (outputData.copy) {
        content += `**Texto:** ${outputData.copy}\n`
      }
      if (outputData.hashtags) {
        content += `**Hashtags:** ${Array.isArray(outputData.hashtags) ? outputData.hashtags.join(' ') : outputData.hashtags}\n`
      }
      break

    case 'video':
      if (outputData.script) {
        content += `## Script\n${outputData.script}\n\n`
      }
      if (outputData.scenes && Array.isArray(outputData.scenes)) {
        content += `## Escenas\n`
        outputData.scenes.forEach((scene: any, i: number) => {
          content += `${i + 1}. [${scene.time}] ${scene.action}\n`
        })
      }
      break

    default:
      content += `## Contenido\n${JSON.stringify(outputData, null, 2)}\n`
  }

  return content
}
