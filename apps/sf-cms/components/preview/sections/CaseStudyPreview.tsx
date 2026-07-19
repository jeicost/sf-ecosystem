export function CaseStudyPreview({ data }: { data: Record<string, unknown> }) {
  const customer = data.customer as string | undefined
  const industry = data.industry as string | undefined
  const challenge = data.challenge as string | undefined
  const solution = data.solution as string | undefined
  const results = data.results as string | undefined
  const testimonial = data.testimonial as string | undefined

  return (
    <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
      <div className="flex items-baseline gap-2 mb-3">
        {customer && <h4 className="font-semibold text-slate-900">{customer}</h4>}
        {industry && <span className="text-xs text-slate-500">· {industry}</span>}
      </div>
      <div className="space-y-2 text-sm">
        {challenge && (
          <p><span className="font-medium text-slate-700">Challenge: </span><span className="text-slate-600">{challenge}</span></p>
        )}
        {solution && (
          <p><span className="font-medium text-slate-700">Solution: </span><span className="text-slate-600">{solution}</span></p>
        )}
        {results && (
          <p><span className="font-medium text-slate-700">Results: </span><span className="text-slate-600">{results}</span></p>
        )}
      </div>
      {testimonial && (
        <blockquote className="mt-3 pl-3 border-l-2 border-slate-300 italic text-sm text-slate-600">
          &ldquo;{testimonial}&rdquo;
        </blockquote>
      )}
    </div>
  )
}
