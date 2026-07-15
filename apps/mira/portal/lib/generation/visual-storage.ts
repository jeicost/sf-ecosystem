import { createServiceClient } from '@/lib/supabase-admin'

const VISUAL_BUCKET = 'generated-assets'
const SIGNED_URL_EXPIRATION = 3600 * 24 * 7 // 7 days
const MAX_FILE_SIZE = 52428800 // 50MB

/**
 * Initialize visual assets storage bucket
 */
export async function initializeVisualStorageBucket() {
  try {
    const db = createServiceClient()

    const { data: buckets } = await db.storage.listBuckets()
    const exists = buckets?.some((b) => b.name === VISUAL_BUCKET)

    if (!exists) {
      const { data, error } = await db.storage.createBucket(VISUAL_BUCKET, {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
      })

      if (error) {
        console.error('Failed to create visual storage bucket:', error)
        return false
      }

      console.log('Visual storage bucket created:', data)
      return true
    }

    console.log('Visual storage bucket already exists')
    return true
  } catch (error) {
    console.error('Error initializing visual storage bucket:', error)
    return false
  }
}

/**
 * Upload generated visual asset to storage
 * Path structure: clients/{clientId}/visual-jobs/{jobId}/{category}/{filename}
 * Categories: source (original), candidates (multiple options), final (approved), manifests (metadata)
 */
export async function uploadVisualAsset(
  clientId: string,
  jobId: string,
  category: 'source' | 'candidates' | 'final' | 'manifests',
  file: File,
  slideIndex?: number
): Promise<{ success: boolean; storagePath?: string; signedUrl?: string; error?: string }> {
  try {
    const db = createServiceClient()

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).slice(2)
    const slideStr = slideIndex !== undefined ? `-slide${slideIndex}` : ''
    const fileName = `${timestamp}-${randomId}${slideStr}-${file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase()}`
    const storagePath = `clients/${clientId}/visual-jobs/${jobId}/${category}/${fileName}`

    const { data, error: uploadError } = await db.storage
      .from(VISUAL_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Get signed URL for immediate access
    const { data: signedData, error: signedError } = await db.storage
      .from(VISUAL_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION)

    if (signedError) {
      return { success: false, error: signedError.message }
    }

    return {
      success: true,
      storagePath,
      signedUrl: signedData.signedUrl,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Get signed URL for existing visual asset
 */
export async function getVisualAssetUrl(storagePath: string): Promise<string | null> {
  try {
    const db = createServiceClient()

    const { data, error } = await db.storage
      .from(VISUAL_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION)

    if (error) {
      console.error('Failed to get visual asset URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error getting visual asset URL:', error)
    return null
  }
}

/**
 * Delete visual asset from storage
 */
export async function deleteVisualAsset(storagePath: string): Promise<boolean> {
  try {
    const db = createServiceClient()

    const { error } = await db.storage
      .from(VISUAL_BUCKET)
      .remove([storagePath])

    if (error) {
      console.error('Failed to delete visual asset:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting visual asset:', error)
    return false
  }
}

/**
 * List all assets for a specific visual job
 */
export async function listVisualJobAssets(clientId: string, jobId: string): Promise<any[]> {
  try {
    const db = createServiceClient()

    const { data, error } = await db.storage
      .from(VISUAL_BUCKET)
      .list(`clients/${clientId}/visual-jobs/${jobId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      console.error('Failed to list visual job assets:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error listing visual job assets:', error)
    return []
  }
}

/**
 * Delete entire job folder (all assets, candidates, manifests)
 */
export async function deleteVisualJobFolder(clientId: string, jobId: string): Promise<boolean> {
  try {
    const db = createServiceClient()

    // List all files in the job folder
    const { data: files, error: listError } = await db.storage
      .from(VISUAL_BUCKET)
      .list(`clients/${clientId}/visual-jobs/${jobId}`, { limit: 1000 })

    if (listError) {
      console.error('Failed to list files for deletion:', listError)
      return false
    }

    if (!files || files.length === 0) {
      return true // Nothing to delete
    }

    // Build full paths and delete in batches
    const filePaths = files.flatMap((file) => {
      if (file.name) {
        return [`clients/${clientId}/visual-jobs/${jobId}/${file.name}`]
      }
      return []
    })

    if (filePaths.length > 0) {
      const { error: deleteError } = await db.storage
        .from(VISUAL_BUCKET)
        .remove(filePaths)

      if (deleteError) {
        console.error('Failed to delete visual job folder:', deleteError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error deleting visual job folder:', error)
    return false
  }
}
