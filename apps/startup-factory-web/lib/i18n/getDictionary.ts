import type { Locale } from './config'

export async function getDictionary(locale: Locale) {
  switch (locale) {
    case 'en': return (await import('./dictionaries/en')).default
    case 'th': return (await import('./dictionaries/th')).default
    default: return (await import('./dictionaries/es')).default
  }
}
