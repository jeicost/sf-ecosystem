'use client'

import ToolRunnerPage from '@/components/ToolRunnerPage'
import { getCompetitiveConfig } from './tool-config'
import { getStoredProjectId } from '@/lib/project-context'
import { getStoredClientId } from '@/lib/client-context'
import { CompetitiveAnalysisResult } from './competitive-analysis-result'
import { useLocaleContext } from '@/app/locale-provider'


export default function CompetitiveAnalysisPage() {
  const { locale } = useLocaleContext()

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'competitive-analysis',
        input_data: formData,
        attachments,
        project_id: getStoredProjectId(),
        clientId: getStoredClientId(),
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
      config={getCompetitiveConfig(locale)}
      onGenerate={handleGenerate}
      resultComponent={CompetitiveAnalysisResult}
    />
  )
}
