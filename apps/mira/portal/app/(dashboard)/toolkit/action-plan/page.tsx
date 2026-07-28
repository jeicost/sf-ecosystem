'use client'

import ToolRunnerPage from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { getActionPlanConfig } from './tool-config'
import { useLocaleContext } from '@/app/locale-provider'
import { ActionPlanResult } from './action-plan-result'


export default function ActionPlanPage() {
  const { locale } = useLocaleContext()
  const toolConfig = getActionPlanConfig(locale)

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'action-plan',
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
      config={toolConfig}
      onGenerate={handleGenerate}
      resultComponent={ActionPlanResult}
    />
  )
}
