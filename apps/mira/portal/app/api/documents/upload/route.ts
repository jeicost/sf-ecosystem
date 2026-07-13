import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToStorage, initializeStorageBucket } from '@/lib/supabase-storage'
import { createServiceClient } from '@/lib/supabase-admin'
import { getUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const docType = formData.get('docType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get client ID
    const db = createServiceClient()
    const { data: userClients } = await db
      .from('mira_users')
      .select('primary_client_id')
      .eq('id', user.id)
      .single()

    const clientId = userClients?.primary_client_id || 'default'

    // Ensure bucket exists
    await initializeStorageBucket()

    // Upload to storage
    const result = await uploadFileToStorage(clientId, 'documents', file)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Generate unique document ID
    const documentId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    return NextResponse.json({
      success: true,
      fileUrl: result.url,
      documentId,
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
