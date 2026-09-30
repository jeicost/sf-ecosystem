'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored === 'es' || stored === 'en') return stored
    // Sin elección previa, el idioma del navegador. Una persona con Edge en
    // español que veía el portal en inglés dejaba que el navegador lo
    // tradujera, y eso rompía React. Con el español propio no hay nada que
    // traducir. Quien elija idioma, manda (localStorage).
    return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en'
  })

  // El atributo lang de <html> tiene que decir la verdad: si declara inglés y
  // el contenido está en español, el navegador ofrece traducirlo.
  useEffect(() => { document.documentElement.lang = locale }, [locale])

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
