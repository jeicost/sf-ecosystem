/**
 * Generic tool result component that renders ReportTemplate
 * based on tool slug and optional custom data
 */

import ReportTemplate from '@/components/ReportTemplate'
import { getToolReportTemplate } from '@/lib/tool-result-templates'

interface ToolResultProps {
  slug: string
  data?: any
}

export default function ToolResultComponent({ slug, data }: ToolResultProps) {
  const template = getToolReportTemplate(slug)

  if (!template) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>No report template found for {slug}</p>
      </div>
    )
  }

  // Merge provided data with template defaults
  const reportData = {
    ...template,
    ...data,
    // Don't override structural fields
    statCards: data?.statCards || template.statCards,
    sections: data?.sections || template.sections,
    // Actions with sensible defaults
    actions: data?.actions || template.actions || [
      {
        id: 1,
        title: 'Review Findings',
        priority: 'high',
        impact: 'Foundation for execution',
        effort: '2-4 hours',
      },
    ],
  }

  return (
    <ReportTemplate
      title={reportData.title}
      subtitle={reportData.subtitle}
      score={reportData.score}
      scoreLabel={reportData.scoreLabel}
      statCards={reportData.statCards}
      sections={reportData.sections}
      actions={reportData.actions}
    />
  )
}
