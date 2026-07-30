'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { BRAND_BRAIN_TAB_LABELS, type BrandBrainTab } from '@/lib/brand-brain-pages'

interface IndexContradiction {
  id: string
  field_path: string
  note: string
  existing_value_excerpt?: string | null
  proposed_value_excerpt?: string | null
}

interface IndexPage {
  fieldPath: string
  label: string
  tab: BrandBrainTab
  lastSourceType: string | null
  lastUpdatedAt: string | null
  openContradictions: IndexContradiction[]
}

export default function BrandBrainIndexView({ clientId }: { clientId: string }) {
  const { locale } = useLocaleContext()
  const [pages, setPages] = useState<IndexPage[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }
    setError(null)
    fetch(`/api/brand-brain/index?clientId=${clientId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data) => setPages(data.pages ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : t('bb.index-load-failed', locale)))
      .finally(() => setLoading(false))
  }, [clientId, locale])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-secondary py-8 justify-center">
        <Loader2 size={14} className="animate-spin" /> {t('bb.index-loading', locale)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400 py-8 justify-center">
        <AlertCircle size={14} /> {t('bb.index-load-failed', locale)}
      </div>
    )
  }

  if (!pages) return null

  const groups = (Object.keys(BRAND_BRAIN_TAB_LABELS) as BrandBrainTab[]).map((tab) => ({
    tab,
    label: BRAND_BRAIN_TAB_LABELS[tab],
    pages: pages.filter((p) => p.tab === tab),
  }))

  const sourceLabel = (source: string | null) =>
    source ? t(`bb.index-source-${source}`, locale) || source : t('bb.index-no-source', locale)

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.tab}>
          <p className="text-xs uppercase tracking-wider text-ink-tertiary mb-2">{group.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.pages.map((page) => (
              <div
                key={page.fieldPath}
                className={
                  page.openContradictions.length > 0
                    ? 'p-3 rounded-lg border border-amber-500/30 bg-amber-500/5'
                    : 'p-3 rounded-lg border border-line bg-surface'
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink font-medium">{page.label}</p>
                  {page.openContradictions.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <AlertTriangle size={11} />
                      {page.openContradictions.length}{' '}
                      {page.openContradictions.length === 1
                        ? t('bb.index-contradiction', locale)
                        : t('bb.index-contradictions', locale)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-tertiary mt-1">
                  {t('bb.index-last-updated', locale)}: {sourceLabel(page.lastSourceType)}
                  {page.lastUpdatedAt ? ` · ${new Date(page.lastUpdatedAt).toLocaleDateString(locale)}` : ''}
                </p>
                {page.openContradictions.map((c) => (
                  <p key={c.id} className="text-[11px] text-amber-400/90 mt-1.5 border-t border-amber-500/15 pt-1.5">
                    {c.note}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
