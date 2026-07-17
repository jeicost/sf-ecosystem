'use client'
import { useEffect, useState } from 'react'
import { t } from '@/lib/i18n'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [locale, setLocale] = useState<'es' | 'en'>('es')

  useEffect(() => { console.error(error) }, [error])

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale') as 'es' | 'en' | null
    if (storedLocale) setLocale(storedLocale)
  }, [])

  return (
    <div className="px-8 py-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl mx-auto mb-4">
          ⚠️
        </div>
        <p className="text-white font-semibold text-sm mb-1">{t('error.page-load-error', locale)}</p>
        <p className="text-[#444] text-xs leading-relaxed mb-5">
          {error.message ?? t('error.something-wrong', locale)}
        </p>
        <button onClick={reset}
          className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 16px rgba(99,102,241,0.2)' }}>
          {t('common.retry', locale)}
        </button>
      </div>
    </div>
  )
}
