'use client'

import { useLocaleContext } from '@/app/locale-provider'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext()

  const handleToggle = () => {
    const newLocale = locale === 'es' ? 'en' : 'es'
    setLocale(newLocale)
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-line transition-colors text-sm text-ink-secondary hover:text-ink"
      title="Toggle language"
    >
      <Globe size={16} />
      <span>{locale === 'es' ? 'ES' : 'EN'}</span>
    </button>
  )
}
