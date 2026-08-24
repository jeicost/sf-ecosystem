'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_ENTRIES = 50

/**
 * ─── HISTORIAL DEL COMPOSER (comportamiento de VS Code) ──────────────────
 *
 * En el terminal integrado de VS Code, en su chat y en cualquier REPL, la
 * flecha ↑ recupera lo último que enviaste y ↓ vuelve hacia delante hasta
 * devolverte el borrador que estabas escribiendo. Es el gesto con el que se
 * corrige un prompt: subir, editar dos palabras, reenviar.
 *
 * En los chats de MIRA no existía: para reintentar un mensaje había que
 * reescribirlo entero, y si la petición fallaba el texto se había perdido ya.
 *
 * El historial se guarda por chat (`key`) y sobrevive a la recarga, igual que
 * el del terminal.
 */
export function useChatHistory(key: string) {
  const storageKey = `mira_chat_history:${key}`
  const [entries, setEntries] = useState<string[]>([])
  /** null = no estamos navegando; 0 = el más reciente. */
  const [index, setIndex] = useState<number | null>(null)
  /** Lo que había escrito antes de empezar a navegar, para poder devolverlo. */
  const stash = useRef('')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) setEntries(JSON.parse(raw))
    } catch { /* almacenamiento no disponible: el historial es opcional */ }
    setIndex(null)
  }, [storageKey])

  const push = useCallback((text: string) => {
    const value = text.trim()
    setIndex(null)
    stash.current = ''
    if (!value) return
    setEntries((prev) => {
      // Repetir el mismo mensaje no debe llenar el historial de duplicados.
      const next = [value, ...prev.filter((e) => e !== value)].slice(0, MAX_ENTRIES)
      try { window.localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* noop */ }
      return next
    })
  }, [storageKey])

  /** ↑ — devuelve el mensaje anterior, o null si ya no hay más arriba. */
  const recallPrev = useCallback((current: string): string | null => {
    if (!entries.length) return null
    if (index === null) {
      stash.current = current
      setIndex(0)
      return entries[0]
    }
    if (index + 1 >= entries.length) return null
    setIndex(index + 1)
    return entries[index + 1]
  }, [entries, index])

  /** ↓ — vuelve hacia delante; al pasar del más reciente devuelve tu borrador. */
  const recallNext = useCallback((): string | null => {
    if (index === null) return null
    if (index === 0) {
      setIndex(null)
      return stash.current
    }
    setIndex(index - 1)
    return entries[index - 1]
  }, [entries, index])

  const reset = useCallback(() => setIndex(null), [])

  return { push, recallPrev, recallNext, reset, navigating: index !== null, size: entries.length }
}
