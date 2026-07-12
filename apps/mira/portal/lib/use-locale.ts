'use client'

import { useCallback } from 'react'

type Locale = 'es' | 'en'

export function useLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const getLocale = useCallback((): Locale => {
    if (typeof window === 'undefined') return 'es'
    return (localStorage.getItem('locale') as Locale) || 'es'
  }, [])

  const setLocale = useCallback((locale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
      window.location.reload() // Reload para aplicar traducción global
    }
  }, [])

  return { locale: getLocale(), setLocale }
}
