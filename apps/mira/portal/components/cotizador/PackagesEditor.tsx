'use client'
import { Plus, Trash2 } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { QuotePackage } from '@/lib/cotizador/contract'

// packages[] a mano. Es deliberadamente aburrido: una fila por tipo de bulto,
// con medidas y peso POR UNIDAD y un contador de unidades idénticas.
//
// No hay campo de "peso total" ni botón de repartir. El contrato lo prohíbe y
// la tentación de añadirlo es exactamente el fallo que quiere evitar: 3 bultos
// y 24 kg no significa 8 kg cada uno.

const N = 'w-full rounded-lg border border-line bg-page px-2 py-1 text-xs text-ink outline-none tabular-nums'

export default function PackagesEditor({ packages, locale, onChange }: {
  packages: QuotePackage[]; locale: Locale; onChange: (p: QuotePackage[]) => void
}) {
  const set = (i: number, field: keyof QuotePackage, raw: string) => {
    const next = packages.map((p, idx) => {
      if (idx !== i) return p
      if (field === 'id') return { ...p, id: raw }
      const n = raw.replace(',', '.')
      return { ...p, [field]: n === '' ? NaN : Number(n) }
    })
    onChange(next)
  }
  const add = () => onChange([...packages, {
    id: `P${packages.length + 1}`, quantity: 1, lengthCm: NaN, widthCm: NaN, heightCm: NaN, weightKg: NaN,
  }])
  const remove = (i: number) => onChange(packages.filter((_, idx) => idx !== i))
  const val = (n: number) => (Number.isFinite(n) ? String(n) : '')

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-ink">{t('quotes.packages', locale)}</h3>
        <button onClick={add} className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-1 text-[11px] text-ink-secondary transition-colors hover:text-ink">
          <Plus size={11} /> {t('quotes.packages.add', locale)}
        </button>
      </div>
      <p className="mb-2 text-[11px] text-ink-tertiary">{t('quotes.packages.help', locale)}</p>

      {packages.length > 0 && (
        <div className="space-y-2">
          <div className="hidden gap-2 px-1 text-[10px] uppercase tracking-wide text-ink-muted sm:grid sm:grid-cols-[3rem_6rem_1fr_1fr_1fr_1fr_1.5rem]">
            <span>id</span><span>{t('quotes.packages.qty', locale)}</span>
            <span>{t('quotes.packages.length', locale)}</span><span>{t('quotes.packages.width', locale)}</span>
            <span>{t('quotes.packages.height', locale)}</span><span>{t('quotes.packages.weight', locale)}</span><span />
          </div>
          {packages.map((p, i) => (
            <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-xl border border-line-subtle p-2 sm:grid-cols-[3rem_6rem_1fr_1fr_1fr_1fr_1.5rem] sm:items-center sm:border-0 sm:p-0">
              {/* La cabecera de columnas solo existe a partir de sm. En móvil,
                  sin estas etiquetas, la fila eran seis cajas con números y
                  nadie podía saber cuál era el ancho y cuál el alto. */}
              <Field label="id" locale={locale}>
                <input value={p.id} onChange={(e) => set(i, 'id', e.target.value)} className={N} aria-label="id" />
              </Field>
              <Field label={t('quotes.packages.qty', locale)} locale={locale}>
                <input value={val(p.quantity)} onChange={(e) => set(i, 'quantity', e.target.value)} inputMode="numeric" className={N} aria-label={t('quotes.packages.qty', locale)} />
              </Field>
              <Field label={t('quotes.packages.length', locale)} locale={locale}>
                <input value={val(p.lengthCm)} onChange={(e) => set(i, 'lengthCm', e.target.value)} inputMode="decimal" className={N} aria-label={t('quotes.packages.length', locale)} />
              </Field>
              <Field label={t('quotes.packages.width', locale)} locale={locale}>
                <input value={val(p.widthCm)} onChange={(e) => set(i, 'widthCm', e.target.value)} inputMode="decimal" className={N} aria-label={t('quotes.packages.width', locale)} />
              </Field>
              <Field label={t('quotes.packages.height', locale)} locale={locale}>
                <input value={val(p.heightCm)} onChange={(e) => set(i, 'heightCm', e.target.value)} inputMode="decimal" className={N} aria-label={t('quotes.packages.height', locale)} />
              </Field>
              <Field label={t('quotes.packages.weight', locale)} locale={locale}>
                <input value={val(p.weightKg)} onChange={(e) => set(i, 'weightKg', e.target.value)} inputMode="decimal" className={N} aria-label={t('quotes.packages.weight', locale)} />
              </Field>
              <button onClick={() => remove(i)} className="col-span-2 justify-self-end rounded-lg p-1 text-ink-tertiary transition-colors hover:text-red-400 sm:col-span-1" aria-label="remove">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Etiqueta visible solo en móvil: en escritorio manda la fila de cabecera. */
function Field({ label, children }: { label: string; locale: Locale; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-ink-muted sm:hidden">{label}</span>
      {children}
    </label>
  )
}
