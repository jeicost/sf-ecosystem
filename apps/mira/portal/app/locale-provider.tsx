'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Locale = 'es' | 'en'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Inglés por defecto: la regla del portal es que la UI está en inglés, pero
  // el default era 'es', así que un cliente que entraba por primera vez (o
  // desde otro navegador) veía el portal en español por mucho que el 100% de
  // las claves estuvieran traducidas. Quien haya elegido idioma sigue con el
  // suyo, porque el valor de localStorage manda.
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en'
    return (localStorage.getItem('locale') as Locale) || 'en'
  })

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocaleContext() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider')
  }
  return context
}
