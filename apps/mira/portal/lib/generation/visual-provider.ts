// Visual generation provider interface — decoupled from any specific implementation
// Enables swapping between mock (testing) and real (OpenAI, Midjourney, etc.) providers

export type VisualJobStatusType = 'accepted' | 'planning' | 'rendering' | 'qa' | 'completed' | 'error'
export type VisualAssetType = 'post' | 'carousel_slide' | 'image_edit'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested'

export interface VisualJobInput {
  clientId: string
  actionType: 'crear_post_visual' | 'crear_carrusel_visual' | 'editar_imagen_visual'
  brandContext: {
    brandId: string
    brandName: string
    colorPalette?: string[] // hex colors from brand_profiles
    tone?: string
    guidelines?: string
  }
  request: {
    topic?: string
    copy?: string
    imageUrl?: string // for edits
    numberOfSlides?: number
    style?: string
  }
}

export interface VisualJobAccepted {
  jobId: string
  status: 'accepted'
  estimatedDuration?: number // seconds
  createdAt: string
}

export interface VisualJobStatus {
  jobId: string
  status: VisualJobStatusType
  progress?: {
    current: number
    total: number
  }
  assets?: VisualAsset[]
  error?: string
}

export interface VisualAsset {
  id: string
  jobId: string
  assetType: VisualAssetType
  storageUrl: string
  version: number
  approvalStatus: ApprovalStatus
  createdAt: string
  providerJobId?: string // reference to external job (OpenAI, etc.)
}

export interface VisualFeedback {
  jobId: string
  assetId: string
  version: number
  refinementPrompt: string // "make background darker", "fix only the headline"
  blockedElements?: string[] // elements that should not be regenerated
  previousProviderJobId?: string // for chaining refinements without regenerating from scratch
}

export interface VisualGenerationProvider {
  // Create a new visual generation job
  createJob(input: VisualJobInput): Promise<VisualJobAccepted>

  // Poll job status
  getJob(jobId: string): Promise<VisualJobStatus>

  // Submit refinement feedback
  submitFeedback(jobId: string, feedback: VisualFeedback): Promise<void>

  // Cancel job (optional)
  cancelJob?(jobId: string): Promise<void>
}
