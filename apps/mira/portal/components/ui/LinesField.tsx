'use client'

import { useEffect, useRef } from 'react'
import { sameStringList, useDraftSync } from '@/lib/hooks/useDraftSync'

interface Props {
  label?: string
  hint?: string
  /** Lista guardada. El textarea NO se deriva de aquí mientras escribes. */
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
  disabled?: boolean
  /** Etiqueta del contador ("values", "phrases"…). Sin ella no se muestra. */
  countLabel?: string
}

/**
 * Campo "una por línea" que de verdad deja escribir.
 *
 * Antes: `value={list.join('\n')}` + `onChange={v => v.split('\n').filter(...)}`.
 * Con eso, pulsar Intro no hacía nada (la línea vacía se borraba en el mismo
 * keystroke) y no se podía teclear un espacio final. Ver useDraftSync.
 *
 * Ahora el texto es del usuario; la lista limpia se emite en paralelo. Las
 * líneas en blanco intermedias son legítimas mientras editas y simplemente no
 * se guardan.
 */
export default function LinesField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  minRows = 4,
  maxRows = 18,
  disabled,
  countLabel,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const { draft, setDraft, markEmitted } = useDraftSync<string[], string>({
    external: value,
    toDraft: (list) => list.join('\n'),
    isSame: sameStringList,
  })

  // Auto-alto: un campo de 128px fijos con `resize-none` para una lista de 12
  // ítems obliga a editar por una mirilla. Crece con el contenido y además se
  // puede arrastrar.
  const autoGrow = () => {
    const el = ref.current
    if (!el) return
    const line = 20
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minRows * line), maxRows * line)}px`
  }
  useEffect(autoGrow, [draft, minRows, maxRows])

  const handle = (text: string) => {
    setDraft(text)
    const list = text.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim().length > 0)
    markEmitted(list)
    onChange(list)
  }

  const count = draft.split('\n').filter((l) => l.trim()).length

  return (
    <div>
      {label && <label className="block text-sm font-medium text-ink mb-2">{label}</label>}
      {hint && <p className="text-xs text-ink-secondary mb-2">{hint}</p>}
      <textarea
        ref={ref}
        value={draft}
        disabled={disabled}
        onChange={(e) => handle(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary focus:border-purple-500 focus:outline-none transition-colors text-sm leading-5 resize-y disabled:opacity-50"
      />
      {countLabel && (
        <p className="mt-1 text-[11px] text-ink-tertiary">
          {count} {countLabel} · one per line, Enter for a new one
        </p>
      )}
    </div>
  )
}
