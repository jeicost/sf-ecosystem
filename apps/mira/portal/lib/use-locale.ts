'use client'

import { useEffect, useState } from 'react'

type Locale = 'es' | 'en'

export function useLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const [locale, setLocaleState] = useState<Locale>('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = (localStorage.getItem('locale') as Locale) || 'es'
    setLocaleState(stored)
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('locale', newLocale)
    setLocaleState(newLocale)
  }

  return { locale: mounted ? locale : 'es', setLocale }
}
