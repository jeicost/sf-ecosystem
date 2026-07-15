import { adminClient } from '@/lib/supabase'

export interface RefinementRequest {
  jobId: string
  assetId: string
  refinementPrompt: string
  blockedElements?: string[]
  previousProviderJobId?: string
}

/**
 * Submit refinement feedback for a visual asset
 * Creates audit trail in visual_feedback table and marks asset for re-generation
 */
export async function submitVisualRefinement(
  clientId: string,
  refinement: RefinementRequest
): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    const db = adminClient()

    // Get current asset version to create next refinement record
    const { data: asset, error: assetError } = await db
      .from('visual_assets')
      .select('version')
      .eq('id', refinement.assetId)
      .single()

    if (assetError || !asset) {
      return { success: false, error: 'Asset not found' }
    }

    // Insert refinement feedback record
    const { data, error } = await db
      .from('visual_feedback')
      .insert({
        job_id: refinement.jobId,
        asset_id: refinement.assetId,
        client_id: clientId,
        version: asset.version,
        refinement_prompt: refinement.refinementPrompt,
        blocked_elements: refinement.blockedElements || [],
        previous_provider_job_id: refinement.previousProviderJobId,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Mark asset for re-generation by incrementing version
    await db
      .from('visual_assets')
      .update({
        version: asset.version + 1,
        approval_status: 'revision_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', refinement.assetId)

    return { success: true, feedbackId: data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

/**
 * Get refinement history for an asset
 */
export async function getAssetRefinementHistory(assetId: string): Promise<any[]> {
  try {
    const db = adminClient()

    const { data, error } = await db
      .from('visual_feedback')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to get refinement history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching refinement history:', error)
    return []
  }
}

/**
 * Get all pending refinements for a job
 */
export async function getJobPendingRefinements(jobId: string): Promise<any[]> {
  try {
    const db = adminClient()

    const { data, error } = await db
      .from('visual_feedback')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to get pending refinements:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching pending refinements:', error)
    return []
  }
}

/**
 * Mark refinement as applied (after provider processes it)
 */
export async function markRefinementApplied(feedbackId: string): Promise<boolean> {
  try {
    const db = adminClient()

    const { error } = await db
      .from('visual_feedback')
      .update({
        status: 'applied',
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)

    if (error) {
      console.error('Failed to mark refinement as applied:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking refinement as applied:', error)
    return false
  }
}
