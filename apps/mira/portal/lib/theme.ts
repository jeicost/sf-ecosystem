'use client'

export type Theme = 'dark' | 'light'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('mira_theme') as Theme) ?? 'dark'
}

export function setTheme(theme: Theme) {
  localStorage.setItem('mira_theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme() {
  const t = getTheme()
  document.documentElement.setAttribute('data-theme', t)
  return t
}
