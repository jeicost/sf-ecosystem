import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import * as mammoth from 'mammoth'
import Anthropic from '@anthropic-ai/sdk'
import type { SyncResponse, SyncedDocument, DriveSourceMetadata } from '@/lib/drive-connection.types'

// AI summary of an ingested document — falls back to an excerpt if the call fails
async function summarizeDocument(fileName: string, text: string): Promise<string> {
  try {
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Resume este documento en 3-5 frases en español, capturando su propósito y los puntos clave para una base de conocimiento de marca.\n\nDocumento: "${fileName}"\n\n${text.slice(0, 12000)}`,
        },
      ],
    })
    const block = message.content[0]
    const summary = block && 'text' in block ? block.text.trim() : ''
    return summary || text.substring(0, 500)
  } catch {
    return text.substring(0, 500)
  }
}

export const runtime = 'nodejs'

// pdf-parse v2: class-based API (PDFParse). The v1 default-function API no longer exists.
const { PDFParse } = require('pdf-parse')

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    return result?.text || ''
  } finally {
    await parser.destroy().catch(() => {})
  }
}

/**
 * POST /api/brand-brain/drive/ingest
 * Initiates synchronization of documents from authorized Google Drive folder
 * to agent_documents table in Supabase.
 *
 * Request body:
 *   - clientId (optional): Explicit client ID for dev mode
 *   - folderId (optional): Specific folder to sync (defaults to stored folder)
 *   - maxFiles (optional): Max files to sync per request (default 10, max 10)
 *
 * Response:
 *   - success: Whether sync operation succeeded
 *   - syncStarted: Whether sync was queued (may be async)
 *   - jobId: Job ID if sync was queued for background processing
 *   - documents: List of synced documents with their status
 *   - error: Error message if sync failed
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId: explicitClientId, folderId: requestFolderId, maxFiles = 10 } = body

    // Rate limiting: max 10 files per sync
    const MAX_FILES_PER_SYNC = Math.min(maxFiles, 10)

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

    let clientId: string
    if (explicitClientId) {
      clientId = explicitClientId
    } else if (process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true' && (!user || authError)) {
      clientId = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
    } else {
      const admin = adminClient()
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!accessData?.length) {
        return NextResponse.json({ error: 'No client access', success: false }, { status: 403 })
      }
      clientId = accessData[0].project_id
    }

    const admin = adminClient()

    // Fetch Drive connection for this client
    const { data: driveConnection, error: connectionError } = await admin
      .from('drive_connections')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    if (connectionError || !driveConnection || !driveConnection.is_authorized) {
      return NextResponse.json(
        {
          success: false,
          syncStarted: false,
          message: 'Google Drive not authorized for this client',
          documents: [],
        },
        { status: 403 }
      )
    }

    // Check if access token is expired and refresh if necessary
    let accessToken = driveConnection.access_token
    if (driveConnection.token_expires_at && new Date(driveConnection.token_expires_at) < new Date()) {
      if (!driveConnection.refresh_token) {
        return NextResponse.json(
          {
            success: false,
            syncStarted: false,
            message: 'Access token expired and no refresh token available. Please re-authorize.',
            documents: [],
          },
          { status: 401 }
        )
      }

      // Refresh the access token
      const refreshResult = await refreshAccessToken(driveConnection.refresh_token)
      if (!refreshResult.success || !refreshResult.accessToken) {
        return NextResponse.json(
          {
            success: false,
            syncStarted: false,
            message: 'Failed to refresh access token',
            documents: [],
          },
          { status: 401 }
        )
      }

      accessToken = refreshResult.accessToken

      // Update stored token
      await admin
        .from('drive_connections')
        .update({
          access_token: accessToken,
          token_expires_at: refreshResult.expiresAt,
        })
        .eq('id', driveConnection.id)
    }

    const folderId = requestFolderId || driveConnection.folder_id
    if (!folderId) {
      return NextResponse.json(
        {
          success: false,
          syncStarted: false,
          message: 'No Drive folder configured. Please select a folder first.',
          documents: [],
        },
        { status: 400 }
      )
    }

    // List files in Drive folder
    const listResult = await listDriveFiles(accessToken, folderId, MAX_FILES_PER_SYNC)
    if (!listResult.success || !listResult.files) {
      return NextResponse.json(
        {
          success: false,
          syncStarted: false,
          message: listResult.error || 'Failed to list Drive files',
          documents: [],
        },
        { status: 500 }
      )
    }

    const files = listResult.files
    const syncedDocuments: SyncedDocument[] = []

    // Process each file sequentially (for now) with error handling
    for (const file of files) {
      try {
        // Skip unsupported MIME types
        if (!isSupportedMimeType(file.mimeType)) {
          console.warn(`Skipping unsupported file type: ${file.name} (${file.mimeType})`)
          syncedDocuments.push({
            id: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            size: parseInt(file.size || '0'),
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            syncedAt: new Date().toISOString(),
            status: 'error',
            error: 'Unsupported file type',
          })
          continue
        }

        // Download and extract text
        const downloadResult = await downloadAndExtractText(accessToken, file.id, file.mimeType)
        if (!downloadResult.success || !downloadResult.text) {
          syncedDocuments.push({
            id: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            size: parseInt(file.size || '0'),
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            syncedAt: new Date().toISOString(),
            status: 'error',
            error: downloadResult.error || 'Failed to extract text',
          })
          continue
        }

        const summary = await summarizeDocument(file.name, downloadResult.text)

        // Create metadata for Drive source
        const sourceMetadata: DriveSourceMetadata = {
          folder_id: folderId,
          folder_name: driveConnection.folder_name || 'Unnamed Folder',
          google_drive_file_id: file.id,
          synced_at: new Date().toISOString(),
          original_url: file.webViewLink,
        }

        // Insert into agent_documents table
        const { data: docData, error: docError } = await admin
          .from('agent_documents')
          .insert({
            client_id: clientId,
            title: file.name,
            document_type: 'drive_sync',
            content: downloadResult.text,
            summary,
            source_type: 'google_drive',
            source_metadata: sourceMetadata,
            file_size: parseInt(file.size || '0'),
            file_mime_type: file.mimeType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (docError) {
          console.error('Failed to insert document:', docError)
          syncedDocuments.push({
            id: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            size: parseInt(file.size || '0'),
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            syncedAt: new Date().toISOString(),
            status: 'error',
            error: 'Failed to save to database',
          })
          continue
        }

        syncedDocuments.push({
          id: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          size: parseInt(file.size || '0'),
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
          syncedAt: new Date().toISOString(),
          status: 'completed',
        })
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError)
        syncedDocuments.push({
          id: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          size: parseInt(file.size || '0'),
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
          syncedAt: new Date().toISOString(),
          status: 'error',
          error: 'Unexpected error during processing',
        })
      }
    }

    // Update last sync time
    await admin
      .from('drive_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', driveConnection.id)

    const response: SyncResponse = {
      success: true,
      syncStarted: true,
      documents: syncedDocuments,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Google Drive ingest error:', error)
    return NextResponse.json(
      {
        success: false,
        syncStarted: false,
        message: error instanceof Error ? error.message : 'Ingestion failed',
        documents: [],
      },
      { status: 500 }
    )
  }
}

/**
 * List files in a Google Drive folder
 * NOTE: This requires Google Drive API integration
 * Placeholder showing expected structure and error handling
 */
async function listDriveFiles(
  accessToken: string,
  folderId: string,
  maxResults: number
): Promise<{
  success: boolean
  files?: Array<{
    id: string
    name: string
    mimeType: string
    size?: string
    createdTime: string
    modifiedTime: string
    webViewLink: string
  }>
  error?: string
}> {
  try {
    const query = `'${folderId}' in parents and trashed=false`
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&maxResults=${maxResults}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Drive API error:', errorData)
      return {
        success: false,
        error: errorData.error?.message || 'Failed to list Drive files',
      }
    }

    const data = await response.json()
    return {
      success: true,
      files: data.files || [],
    }
  } catch (error) {
    console.error('Error listing Drive files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    }
  }
}

/**
 * Download file from Google Drive and extract text content
 * NOTE: Placeholder showing structure. Implementation requires:
 * - Fetching file from Drive API
 * - Converting based on MIME type (PDF extraction, DOCX parsing, etc.)
 * - Returning plain text content
 */
async function downloadAndExtractText(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<{
  success: boolean
  text?: string
  error?: string
}> {
  try {
    // For Google Docs/Sheets, export as plain text
    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    if (mimeType === 'application/vnd.google-apps.document') {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`
    }

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download file: ${response.statusText}`,
      }
    }

    let text = ''

    if (mimeType === 'application/pdf') {
      try {
        const buffer = Buffer.from(await response.arrayBuffer())
        text = await extractPdfText(buffer)
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        return {
          success: false,
          error: `Failed to extract text from PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`,
        }
      }
    } else if (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      mimeType === 'text/csv' ||
      mimeType === 'application/vnd.google-apps.document'
    ) {
      // For text files, decode directly
      text = await response.text()
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      try {
        const buffer = Buffer.from(await response.arrayBuffer())
        const result = await mammoth.extractRawText({ buffer })
        text = result.value || ''
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError)
        return {
          success: false,
          error: `Failed to extract text from DOCX: ${docxError instanceof Error ? docxError.message : 'Unknown error'}`,
        }
      }
    } else {
      return {
        success: false,
        error: `Unsupported MIME type for extraction: ${mimeType}`,
      }
    }

    // Trim extracted text
    if (text.length === 0) {
      return {
        success: false,
        error: 'No text content extracted from file',
      }
    }

    return {
      success: true,
      text: text.substring(0, 1000000), // Max 1MB text
    }
  } catch (error) {
    console.error('Error downloading/extracting file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download/extraction failed',
    }
  }
}

/**
 * Check if a MIME type is supported for ingestion
 */
function isSupportedMimeType(mimeType: string): boolean {
  const supported = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/pdf',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  return supported.includes(mimeType)
}

/**
 * Refresh an expired Google OAuth access token using refresh token
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<{
  success: boolean
  accessToken?: string
  expiresAt?: string
  error?: string
}> {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return {
        success: false,
        error: 'Google OAuth configuration incomplete',
      }
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Token refresh failed:', errorData)
      return {
        success: false,
        error: errorData.error_description || 'Token refresh failed',
      }
    }

    const tokens = await response.json()
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()

    return {
      success: true,
      accessToken: tokens.access_token,
      expiresAt,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh error',
    }
  }
}
