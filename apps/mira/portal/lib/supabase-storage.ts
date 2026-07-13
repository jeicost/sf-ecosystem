import { createServiceClient } from '@/lib/supabase-admin'

const STORAGE_BUCKET = 'agent-documents'
const SIGNED_URL_EXPIRATION = 3600 * 24 * 7 // 7 days

/**
 * Initialize storage bucket if it doesn't exist
 * Call this once during app initialization
 */
export async function initializeStorageBucket() {
  try {
    const db = createServiceClient()

    // Check if bucket exists
    const { data: buckets } = await db.storage.listBuckets()
    const exists = buckets?.some((b) => b.name === STORAGE_BUCKET)

    if (!exists) {
      // Create bucket
      const { data, error } = await db.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      })

      if (error) {
        console.error('Failed to create storage bucket:', error)
        return false
      }

      console.log('Storage bucket created:', data)
      return true
    }

    console.log('Storage bucket already exists')
    return true
  } catch (error) {
    console.error('Error initializing storage bucket:', error)
    return false
  }
}

/**
 * Upload file to Supabase Storage
 * Returns signed URL valid for 7 days
 */
export async function uploadFileToStorage(
  clientId: string,
  agentRole: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const db = createServiceClient()

    // Generate unique path
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).slice(2)
    const fileName = `${timestamp}-${randomId}-${file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase()}`
    const filePath = `clients/${clientId}/agents/${agentRole}/${fileName}`

    // Upload file
    const { data, error: uploadError } = await db.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Get signed URL
    const { data: signedData, error: signedError } = await db.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(data.path, SIGNED_URL_EXPIRATION)

    if (signedError) {
      return { success: false, error: signedError.message }
    }

    return {
      success: true,
      url: signedData.signedUrl,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  try {
    const db = createServiceClient()

    const { error } = await db.storage.from(STORAGE_BUCKET).remove([filePath])

    if (error) {
      console.error('Failed to delete file:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

/**
 * Get signed URL for existing file
 */
export async function getSignedUrl(filePath: string): Promise<string | null> {
  try {
    const db = createServiceClient()

    const { data, error } = await db.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRATION)

    if (error) {
      console.error('Failed to get signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error getting signed URL:', error)
    return null
  }
}

/**
 * List files for a specific agent
 */
export async function listAgentFiles(clientId: string, agentRole: string): Promise<any[]> {
  try {
    const db = createServiceClient()

    const { data, error } = await db.storage
      .from(STORAGE_BUCKET)
      .list(`clients/${clientId}/agents/${agentRole}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      console.error('Failed to list files:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error listing files:', error)
    return []
  }
}
