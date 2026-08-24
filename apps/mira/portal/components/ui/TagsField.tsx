'use client'

import { useRef, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  label?: string
  hint?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
}

/**
 * Lista corta como chips. Sustituye a los campos "separado por comas", que se
 * editaban con `value={list.join(', ')}` y `onChange={v.split(',').map(trim)
 * .filter(Boolean)}`: al teclear la coma, el fragmento vacío que queda detrás
 * se filtraba y la coma DESAPARECÍA bajo el cursor. Escribir el segundo
 * elemento de la lista era imposible sin trucos.
 *
 * Aquí lo que se teclea vive en un borrador aparte y solo se convierte en chip
 * al confirmarlo (coma, Intro o al salir del campo).
 */
export default function TagsField({ label, hint, value, onChange, placeholder, disabled }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = (raw: string) => {
    const items = raw.split(',').map((s) => s.trim()).filter(Boolean)
    if (!items.length) return
    const merged = [...value]
    items.forEach((i) => { if (!merged.includes(i)) merged.push(i) })
    onChange(merged)
  }

  const commit = () => {
    add(text)
    setText('')
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-ink mb-2">{label}</label>}
      {hint && <p className="text-xs text-ink-secondary mb-2">{hint}</p>}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-2 transition-colors focus-within:border-purple-500"
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-page px-2.5 py-1 text-xs text-ink"
          >
            {tag}
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => { e.stopPropagation(); onChange(value.filter((_, idx) => idx !== i)) }}
              aria-label={`Remove ${tag}`}
              className="text-ink-tertiary transition-colors hover:text-red-400"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            // Escribir la coma confirma el chip, pero la coma NO se pierde en
            // mitad de una palabra pegada: se procesa el trozo completo.
            if (e.target.value.includes(',')) {
              add(e.target.value)
              setText('')
            } else {
              setText(e.target.value)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            if (e.key === 'Backspace' && !text && value.length) {
              // Retroceso con el campo vacío devuelve el último chip a texto
              // editable, en vez de borrarlo sin más.
              e.preventDefault()
              setText(value[value.length - 1])
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={commit}
          // Con chips ya puestos el placeholder largo estorba, pero dejarlo en
          // blanco esconde que se puede seguir escribiendo.
          placeholder={value.length ? 'Add another…' : placeholder}
          aria-label={label ? `${label} — add item` : 'Add item'}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm text-ink placeholder-ink-tertiary outline-none disabled:opacity-50"
        />
      </div>
      <p className="mt-1 text-[11px] text-ink-tertiary">Enter or a comma adds it · Backspace edits the last one</p>
    </div>
  )
}
