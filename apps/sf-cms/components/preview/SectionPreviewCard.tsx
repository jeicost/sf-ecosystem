'use client'

import { useState } from 'react'
import { PREVIEW_REGISTRY } from './registry'

interface SectionPreviewCardProps {
  type: string
  data: Record<string, unknown>
  rawSection: unknown
  showJson: boolean
}

export function SectionPreviewCard({ type, data, rawSection, showJson }: SectionPreviewCardProps) {
  const [localJson, setLocalJson] = useState(false)
  const Component = PREVIEW_REGISTRY[type]

  if (Component === null) return null // e.g. "seo" — metadata, not visual

  const jsonVisible = showJson || localJson

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{type}</span>
        <button
          onClick={() => setLocalJson(!localJson)}
          className="text-xs text-slate-400 hover:text-slate-700 underline"
        >
          {jsonVisible ? 'Hide JSON' : 'JSON'}
        </button>
      </div>

      <div className="p-4">
        {Component ? (
          <Component data={data} />
        ) : (
          <div className="border border-dashed border-slate-300 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-2">Unknown section type — showing raw fields</p>
            <dl className="space-y-1 text-sm">
              {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="font-medium text-slate-700 shrink-0">{key}:</dt>
                  <dd className="text-slate-600 truncate">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {jsonVisible && (
          <pre className="text-xs bg-slate-100 p-2 rounded mt-3 overflow-x-auto">
            {JSON.stringify(rawSection, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
