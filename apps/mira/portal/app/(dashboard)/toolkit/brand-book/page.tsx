'use client'

import ToolRunnerPage from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { getStoredClientId } from '@/lib/client-context'
import { getBrandBookConfig } from './tool-config'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

function BrandBookResult({ data, locale }: { data?: any; locale: Locale }) {
  if (!data) return null
  const findings = Array.isArray(data.consistency_findings) ? data.consistency_findings.length : 0
  const openItems = Array.isArray(data.open_items) ? data.open_items.length : 0
  return (
    <div className="card p-6 space-y-3">
      <h3 className="text-lg font-semibold text-ink">{t('toolkit.brand-book.result.title', locale)}</h3>
      <p className="text-sm text-ink-secondary">
        {findings === 0
          ? t('toolkit.brand-book.result.findings-none', locale)
          : findings === 1
            ? t('toolkit.brand-book.result.findings-singular', locale).replace('{n}', String(findings))
            : t('toolkit.brand-book.result.findings-plural', locale).replace('{n}', String(findings))}
        {openItems > 0 &&
          ` ${
            openItems === 1
              ? t('toolkit.brand-book.result.open-items-singular', locale).replace('{n}', String(openItems))
              : t('toolkit.brand-book.result.open-items-plural', locale).replace('{n}', String(openItems))
          }`}
      </p>
      <p className="text-xs text-ink-tertiary">
        {t('toolkit.brand-book.result.footer-note', locale)}
      </p>
    </div>
  )
}

export default function BrandBookPage() {
  const { locale } = useLocaleContext()
  const config = getBrandBookConfig(locale)

  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'brand-book',
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
    return res.json()
  }

  return (
    <ToolRunnerPage
      config={config}
      onGenerate={handleGenerate}
      resultComponent={(props: { data?: any }) => <BrandBookResult {...props} locale={locale} />}
    />
  )
}
