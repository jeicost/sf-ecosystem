'use client'
import Link from 'next/link'
import { ArrowLeft, Settings2 } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import InboxSetupPanel from '@/components/email-ops/InboxSetupPanel'
import RulesPanel from '@/components/email-ops/RulesPanel'

export default function EmailOpsSettingsPage() {
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  if (!activeClient) return null
  const brand = activeClient.primaryColor || '#6366F1'
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <Link href="/email-ops" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink"><ArrowLeft size={13} /> {t('emailops.action.back', locale)}</Link>
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}><Settings2 size={13} /> {t('emailops.title', locale)}</p>
        <h1 className="text-2xl font-semibold text-ink">{t('emailops.action.settings', locale)}</h1>
      </div>
      <div className="space-y-6">
        <InboxSetupPanel clientId={activeClient.id} locale={locale} brand={brand} />
        <RulesPanel clientId={activeClient.id} locale={locale} brand={brand} />
      </div>
    </div>
  )
}
