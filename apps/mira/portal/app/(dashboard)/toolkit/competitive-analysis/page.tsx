'use client'

import ToolRunnerPage from '@/components/ToolRunnerPage'
import { COMPETITIVE_CONFIG } from './tool-config'
import { getStoredProjectId } from '@/lib/project-context'
import { CompetitiveAnalysisResult } from './competitive-analysis-result'


export default function CompetitiveAnalysisPage() {
  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'competitive-analysis',
        input_data: formData,
        attachments,
        project_id: getStoredProjectId(),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }

    return await res.json()
  }

  return (
    <ToolRunnerPage
      config={COMPETITIVE_CONFIG}
      onGenerate={handleGenerate}
      resultComponent={CompetitiveAnalysisResult}
    />
  )
}
