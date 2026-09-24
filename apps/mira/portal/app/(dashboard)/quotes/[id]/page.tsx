'use client'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calculator } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import ShipmentEditor from '@/components/cotizador/ShipmentEditor'

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  if (!activeClient) return null
  const brand = activeClient.primaryColor || '#6366F1'
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <Link href="/quotes" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink">
        <ArrowLeft size={13} /> {t('quotes.title', locale)}
      </Link>
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: brand }}>
          <Calculator size={13} /> {t('quotes.title', locale)}
        </p>
      </div>
      <ShipmentEditor clientId={activeClient.id} shipmentId={id} locale={locale} brand={brand} />
    </div>
  )
}
