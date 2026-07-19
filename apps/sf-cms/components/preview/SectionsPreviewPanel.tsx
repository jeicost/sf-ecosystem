'use client'

import { useMemo, useState } from 'react'
import { detectLocales, resolveLocalized } from './localize'
import { SectionPreviewCard } from './SectionPreviewCard'

interface Section {
  id?: string
  type: string
  data?: Record<string, unknown>
}

interface SectionsPreviewPanelProps {
  sections: Section[]
}

export function SectionsPreviewPanel({ sections }: SectionsPreviewPanelProps) {
  const [showJson, setShowJson] = useState(false)
  const locales = useMemo(() => detectLocales(sections), [sections])
  const [locale, setLocale] = useState(locales[0] || 'es')

  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No sections yet. Start editing with the chat panel.
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1">
          {locales.length > 1 &&
            locales.map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  locale === loc ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {loc.toUpperCase()}
              </button>
            ))}
        </div>
        <button
          onClick={() => setShowJson(!showJson)}
          className="text-sm text-slate-600 hover:text-slate-900 underline"
        >
          {showJson ? 'Hide' : 'Show'} all JSON
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <SectionPreviewCard
            key={section.id || i}
            type={section.type}
            data={resolveLocalized(section.data, locale)}
            rawSection={section}
            showJson={showJson}
          />
        ))}
      </div>
    </div>
  )
}
