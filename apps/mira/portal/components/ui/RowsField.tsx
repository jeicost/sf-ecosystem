'use client'

import { useCallback, useRef } from 'react'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { useDraftSync } from '@/lib/hooks/useDraftSync'

export type Row = Record<string, string>

export interface RowColumn {
  key: string
  label: string
  placeholder?: string
  /** Peso relativo del campo dentro de la fila (por defecto 1) */
  grow?: number
  multiline?: boolean
}

interface Props {
  value: Row[]
  onChange: (rows: Row[]) => void
  columns: RowColumn[]
  label?: string
  hint?: string
  addLabel?: string
  emptyHint?: string
  max?: number
  disabled?: boolean
}

interface Tracked { id: number; row: Row }

/**
 * ─── FUERA EL SEPARADOR 🔹 ───────────────────────────────────────────────
 *
 * Ocho campos del Brand Brain se editaban como texto plano con el formato
 * `segmento 🔹 necesidad 🔹 mensaje`, una fila por línea. Era inusable, y no
 * por gusto estético:
 *
 *  · 🔹 NO SE PUEDE TECLEAR. No está en ningún teclado físico: para añadir una
 *    fila había que copiar el rombo de otra línea y pegarlo. Ese es el "no me
 *    deja rellenar los campos con rombitos azules" que se reportó.
 *  · El valor se re-derivaba del objeto ya parseado en cada pulsación, así que
 *    una línea a medio escribir se pintaba como `algo 🔹  🔹 ` (con los huecos
 *    vacíos ya insertados) y el cursor saltaba.
 *  · `filter(l => l.trim())` se comía el Intro: no se podía abrir una fila nueva.
 *
 * Aquí cada parte es su propio input. No hay separador que teclear, no hay
 * parseo bajo el cursor, y el Intro abre una fila nueva porque eso es lo que
 * significa Intro en una lista.
 *
 * Se conserva la entrada en bloque: pegar varias líneas en cualquier campo
 * reparte cada línea en una fila y sigue entendiendo `🔹`, `|` y tabuladores,
 * así que el contenido antiguo (o pegado desde una hoja de cálculo) se importa
 * de una vez.
 */
export default function RowsField({
  value,
  onChange,
  columns,
  label,
  hint,
  addLabel = 'Add row',
  emptyHint,
  max,
  disabled,
}: Props) {
  const nextId = useRef(1)
  const inputsRef = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({})

  const track = useCallback((rows: Row[]): Tracked[] =>
    rows.map((row) => ({ id: nextId.current++, row })), [])

  const sameRows = useCallback((a: Row[], b: Row[]) =>
    a.length === b.length &&
    a.every((row, i) => columns.every((c) => (row[c.key] ?? '') === (b[i]?.[c.key] ?? ''))),
  [columns])

  const { draft, setDraft, markEmitted } = useDraftSync<Row[], Tracked[]>({
    external: value,
    toDraft: track,
    isSame: sameRows,
  })

  const isEmptyRow = (row: Row) => columns.every((c) => !(row[c.key] ?? '').trim())

  /**
   * Las filas en blanco existen mientras editas (acabas de pulsar "Add row")
   * pero nunca se guardan: si no, borrar el texto de una fila dejaría un
   * `{segment:'', need:'', message:''}` en el Brain.
   */
  const commit = (rows: Tracked[]) => {
    setDraft(rows)
    const clean = rows.map((r) => r.row).filter((r) => !isEmptyRow(r))
    markEmitted(clean)
    onChange(clean)
  }

  const update = (id: number, key: string, text: string) =>
    commit(draft.map((r) => (r.id === id ? { ...r, row: { ...r.row, [key]: text } } : r)))

  const addRow = (afterIndex?: number) => {
    if (max && draft.length >= max) return
    const blank: Tracked = { id: nextId.current++, row: {} }
    const at = afterIndex === undefined ? draft.length : afterIndex + 1
    const next = [...draft.slice(0, at), blank, ...draft.slice(at)]
    commit(next)
    requestAnimationFrame(() => inputsRef.current[`${blank.id}:${columns[0].key}`]?.focus())
  }

  const removeRow = (id: number) => commit(draft.filter((r) => r.id !== id))

  const move = (index: number, delta: number) => {
    const to = index + delta
    if (to < 0 || to >= draft.length) return
    const next = [...draft]
    ;[next[index], next[to]] = [next[to], next[index]]
    commit(next)
  }

  /** Pegar varias líneas reparte filas y entiende los separadores antiguos. */
  const handlePaste = (e: React.ClipboardEvent, index: number, colIndex: number) => {
    const text = e.clipboardData.getData('text')
    if (!text.includes('\n')) return
    e.preventDefault()
    const parsed = text
      .split('\n')
      .filter((l) => l.trim())
      .map((line) => {
        const parts = line.split(/\s*(?:🔹|\t|\s\|\s)\s*/).map((p) => p.trim())
        const row: Row = {}
        columns.forEach((c, i) => {
          // Al pegar en la 2ª columna, la 1ª parte de cada línea va a esa 2ª.
          const part = parts[i - colIndex]
          if (i >= colIndex && part) row[c.key] = part
        })
        return row
      })
    const next = [
      ...draft.slice(0, index),
      ...parsed.map((row) => ({ id: nextId.current++, row })),
      ...draft.slice(index + 1),
    ]
    commit(next)
  }

  const keyHandler = (e: React.KeyboardEvent, index: number, col: RowColumn) => {
    // Intro abre fila nueva (salvo en un campo multilínea, donde escribe un
    // salto de línea de verdad y hace falta Cmd/Ctrl+Intro).
    if (e.key === 'Enter' && (!col.multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      addRow(index)
      return
    }
    // Retroceso en una fila totalmente vacía la elimina y sube el foco.
    if (e.key === 'Backspace' && isEmptyRow(draft[index].row) && draft.length > 1) {
      e.preventDefault()
      const prev = draft[index - 1]
      removeRow(draft[index].id)
      if (prev) {
        requestAnimationFrame(() =>
          inputsRef.current[`${prev.id}:${columns[columns.length - 1].key}`]?.focus()
        )
      }
    }
  }

  const fieldClass =
    'w-full bg-page border border-line rounded-lg px-3 py-2 text-xs text-ink placeholder-ink-tertiary outline-none focus:border-purple-500 transition-colors disabled:opacity-50'

  return (
    <div>
      {label && <h4 className="text-sm font-medium text-ink mb-1">{label}</h4>}
      {hint && <p className="text-xs text-ink-secondary mb-3">{hint}</p>}

      <div className="space-y-2">
        {draft.map((tracked, index) => (
          <div key={tracked.id} className="rounded-xl border border-line bg-surface p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-4 shrink-0 text-center text-[11px] tabular-nums text-ink-tertiary">
                {index + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {columns.map((col, colIndex) => {
                  const common = {
                    value: tracked.row[col.key] ?? '',
                    disabled,
                    placeholder: col.placeholder ?? col.label,
                    'aria-label': `${col.label} (row ${index + 1})`,
                    onPaste: (e: React.ClipboardEvent) => handlePaste(e, index, colIndex),
                    onKeyDown: (e: React.KeyboardEvent) => keyHandler(e, index, col),
                    className: fieldClass,
                  }
                  return (
                    <div
                      key={col.key}
                      className="min-w-[150px]"
                      style={{ flex: `${col.grow ?? 1} 1 0%` }}
                    >
                      <label className="mb-1 block text-[10px] uppercase tracking-wide text-ink-tertiary">
                        {col.label}
                      </label>
                      {col.multiline ? (
                        <textarea
                          {...common}
                          rows={2}
                          ref={(el) => { inputsRef.current[`${tracked.id}:${col.key}`] = el }}
                          onChange={(e) => update(tracked.id, col.key, e.target.value)}
                          className={`${fieldClass} resize-y`}
                        />
                      ) : (
                        <input
                          {...common}
                          type="text"
                          ref={(el) => { inputsRef.current[`${tracked.id}:${col.key}`] = el }}
                          onChange={(e) => update(tracked.id, col.key, e.target.value)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                  title="Move up"
                  className="rounded p-1 text-ink-tertiary transition-colors hover:text-ink disabled:opacity-25"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === draft.length - 1}
                  title="Move down"
                  className="rounded p-1 text-ink-tertiary transition-colors hover:text-ink disabled:opacity-25"
                >
                  <ArrowDown size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => removeRow(tracked.id)}
                  disabled={disabled}
                  title="Remove row"
                  className="rounded p-1 text-ink-tertiary transition-colors hover:text-red-400"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {draft.length === 0 && emptyHint && (
        <p className="py-2 text-xs text-ink-tertiary">{emptyHint}</p>
      )}

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => addRow()}
          disabled={disabled || (max ? draft.length >= max : false)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-ink transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <Plus size={12} /> {addLabel}
        </button>
        <span className="text-[11px] text-ink-tertiary">
          {columns.some((c) => c.multiline) ? '⌘/Ctrl+Enter' : 'Enter'} adds a row · you can paste
          several lines at once
        </span>
      </div>
    </div>
  )
}
