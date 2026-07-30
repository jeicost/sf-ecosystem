'use client'

import Link from 'next/link'
import { useActiveClient } from '@/lib/client-context'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export default function ToolkitOverviewPage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()

  if (!activeClient?.id) {
    return (
      <div className="flex items-center justify-center h-screen bg-page">
        <p className="text-ink-tertiary text-sm">{t('toolkit.overview.no-client', locale)}</p>
      </div>
    )
  }

  const src = `/api/toolkit/export?overview=1&clientId=${activeClient.id}&inline=1`

  return (
    <div className="flex flex-col h-screen bg-page">
      <div className="flex items-center justify-between px-4 py-2 border-b border-line shrink-0">
        <Link href="/toolkit" className="text-sm text-ink-secondary hover:text-ink transition-colors">
          {t('toolkit.overview.back-link', locale)}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-tertiary">
            {t('toolkit.overview.subtitle', locale).replace('{name}', activeClient.name)}
          </span>
          <a
            href={`/api/toolkit/export?overview=1&clientId=${activeClient.id}`}
            className="text-sm px-4 py-1.5 rounded bg-surface text-ink hover:bg-surface-hover transition-colors"
          >
            {t('toolkit.download-html', locale)}
          </a>
        </div>
      </div>
      <iframe src={src} className="flex-1 w-full border-0" title={t('toolkit.overview.iframe-title', locale)} />
    </div>
  )
}
