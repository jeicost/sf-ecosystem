import {
  VisualGenerationProvider,
  VisualJobInput,
  VisualJobAccepted,
  VisualJobStatus as JobStatus,
  VisualFeedback,
  VisualAsset,
  ApprovalStatus
} from './visual-provider'

// Mock provider for testing — simulates async job lifecycle with artificial delays
export class MockVisualProvider implements VisualGenerationProvider {
  private jobs = new Map<string, {
    input: VisualJobInput
    status: JobStatus['status']
    assets: VisualAsset[]
    createdAt: Date
    currentSlide: number
  }>()

  async createJob(input: VisualJobInput): Promise<VisualJobAccepted> {
    const jobId = `mock_job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    this.jobs.set(jobId, {
      input,
      status: 'accepted',
      assets: [],
      createdAt: new Date(),
      currentSlide: 0,
    })

    // Simulate state machine: accepted → planning → rendering → qa → completed
    this.simulateJobProgression(jobId)

    return {
      jobId,
      status: 'accepted',
      estimatedDuration: input.actionType === 'crear_carrusel_visual'
        ? (input.request.numberOfSlides ?? 5) * 4000 // ~4s per slide
        : 8000, // ~8s for single post/edit
      createdAt: new Date().toISOString(),
    }
  }

  async getJob(jobId: string): Promise<JobStatus> {
    const job = this.jobs.get(jobId)
    if (!job) {
      return {
        jobId,
        status: 'error',
        error: 'Job not found',
      }
    }

    return {
      jobId,
      status: job.status,
      progress:
        job.input.actionType === 'crear_carrusel_visual'
          ? {
              current: job.currentSlide,
              total: job.input.request.numberOfSlides ?? 5,
            }
          : undefined,
      assets: job.assets,
    }
  }

  async submitFeedback(jobId: string, feedback: VisualFeedback): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) throw new Error('Job not found')

    // In a real implementation, this would queue a new job with the feedback as context
    // For mock, we just update the asset with the feedback
    const asset = job.assets.find(a => a.id === feedback.assetId)
    if (asset) {
      asset.version += 1
      asset.approvalStatus = 'pending'
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) throw new Error('Job not found')
    job.status = 'error'
  }

  // Private: simulate job state progression
  private simulateJobProgression(jobId: string) {
    const job = this.jobs.get(jobId)!
    const numSlides = job.input.actionType === 'crear_carrusel_visual'
      ? job.input.request.numberOfSlides ?? 5
      : 1

    const states: Array<JobStatus['status']> = ['planning', 'rendering', 'qa', 'completed']
    let currentStateIndex = 0

    const progressInterval = setInterval(() => {
      if (currentStateIndex === 0) {
        // planning → rendering
        job.status = 'rendering'
        currentStateIndex++
      } else if (currentStateIndex === 1) {
        // rendering: increment slides one by one
        job.currentSlide++
        if (job.currentSlide >= numSlides) {
          job.status = 'qa'
          currentStateIndex++
          // Generate mock assets
          for (let i = 0; i < numSlides; i++) {
            job.assets.push({
              id: `asset_${jobId}_${i}`,
              jobId,
              assetType: job.input.actionType === 'crear_carrusel_visual' ? 'carousel_slide' : 'post',
              storageUrl: `https://mock-generated-assets.example.com/${jobId}/slide_${i}.png`,
              version: 1,
              approvalStatus: 'pending' as ApprovalStatus,
              createdAt: new Date().toISOString(),
              providerJobId: `provider_${jobId}_${i}`,
            })
          }
        }
      } else if (currentStateIndex === 2) {
        // qa → completed
        job.status = 'completed'
        job.assets.forEach(a => { a.approvalStatus = 'pending' })
        currentStateIndex++
        clearInterval(progressInterval)
      }
    }, 2000) // progress every 2 seconds
  }
}
