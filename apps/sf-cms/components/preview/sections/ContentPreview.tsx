/**
 * Preview for the generic `content` section type used by the merge-override
 * pages (startupsfactory et al.): a bag of per-field overrides layered on top
 * of the site's hardcoded copy. Renders each field as an override row; an
 * empty section means "inherits the site defaults for every field".
 */
export function ContentPreview({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data ?? {})

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No overrides — this page inherits the site&apos;s built-in content. Add a field to override it.
      </p>
    )
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">
        Per-field overrides on the site&apos;s built-in copy
      </p>
      <dl className="space-y-1 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <dt className="font-mono text-xs text-slate-500 shrink-0 pt-0.5">{key}</dt>
            <dd className="text-slate-800 break-words">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
