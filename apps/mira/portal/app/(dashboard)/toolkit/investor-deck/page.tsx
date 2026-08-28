'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { getStoredClientId } from '@/lib/client-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { InvestorDeckResult } from './investor-deck-result'

const getToolConfig = (locale: Locale): ToolConfig => ({
  slug: 'investor-deck',
  icon: '💰',
  title: t('toolkit.investor-deck.title', locale),
  timing: t('toolkit.investor-deck.timing', locale),
  brandBrainNote: t('toolkit.investor-deck.brand-brain-note', locale),
  submitButtonColor: '#10B981',
  submitButtonText: t('toolkit.investor-deck.submit', locale),
  fields: [
    {
      name: 'company_name',
      label: t('toolkit.investor-deck.field.company-name.label', locale),
      type: 'text',
      placeholder: t('toolkit.investor-deck.field.company-name.placeholder', locale),
      required: true,
    },
    {
      name: 'stage',
      label: t('toolkit.investor-deck.field.stage.label', locale),
      type: 'select',
      options: [
        { value: 'pre-seed', label: t('toolkit.investor-deck.field.stage.option.pre-seed', locale) },
        { value: 'seed', label: t('toolkit.investor-deck.field.stage.option.seed', locale) },
        { value: 'series-a', label: t('toolkit.investor-deck.field.stage.option.series-a', locale) },
        { value: 'series-b', label: t('toolkit.investor-deck.field.stage.option.series-b', locale) },
      ],
      required: true,
    },
    {
      name: 'problem_market_size',
      label: t('toolkit.investor-deck.field.problem-market-size.label', locale),
      type: 'textarea',
      placeholder: t('toolkit.investor-deck.field.problem-market-size.placeholder', locale),
      required: true,
    },
    {
      name: 'solution_traction',
      label: t('toolkit.investor-deck.field.solution-traction.label', locale),
      type: 'textarea',
      placeholder: t('toolkit.investor-deck.field.solution-traction.placeholder', locale),
      required: true,
    },
    {
      name: 'team_background',
      label: t('toolkit.investor-deck.field.team-background.label', locale),
      type: 'textarea',
      placeholder: t('toolkit.investor-deck.field.team-background.placeholder', locale),
      required: true,
    },
    {
      name: 'funding_ask',
      label: t('toolkit.investor-deck.field.funding-ask.label', locale),
      type: 'text',
      placeholder: t('toolkit.investor-deck.field.funding-ask.placeholder', locale),
      required: true,
    },
    {
      name: 'use_of_funds',
      label: t('toolkit.investor-deck.field.use-of-funds.label', locale),
      type: 'textarea',
      placeholder: t('toolkit.investor-deck.field.use-of-funds.placeholder', locale),
      required: true,
    },
    {
      name: 'valuation_terms',
      label: t('toolkit.investor-deck.field.valuation-terms.label', locale),
      type: 'text',
      placeholder: t('toolkit.investor-deck.field.valuation-terms.placeholder', locale),
    },
    {
      name: 'board_advisors',
      label: t('toolkit.investor-deck.field.board-advisors.label', locale),
      type: 'textarea',
      placeholder: t('toolkit.investor-deck.field.board-advisors.placeholder', locale),
    },
  ],
})

export default function InvestorDeckPage() {
  const { locale } = useLocaleContext()
  const toolConfig = getToolConfig(locale)

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'investor-deck',
        input_data: formData,
        attachments,
        project_id: getStoredProjectId(),
        clientId: getStoredClientId(),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || t('toolkit.report.generate-error-fallback', locale))
    }

    return await res.json()
  }

  return (
    <ToolRunnerPage
      config={toolConfig}
      onGenerate={handleGenerate}
      resultComponent={InvestorDeckResult}
    />
  )
}
