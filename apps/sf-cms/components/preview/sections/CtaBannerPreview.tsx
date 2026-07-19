export function CtaBannerPreview({ data }: { data: Record<string, unknown> }) {
  const headline = data.headline as string | undefined
  const description = data.description as string | undefined
  const ctaText = data.cta_text as string | undefined
  const backgroundImage = data.background_image as string | undefined

  return (
    <div
      className="rounded-lg p-6 text-center text-white bg-slate-900"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {headline && <h3 className="text-xl font-bold mb-1">{headline}</h3>}
      {description && <p className="text-slate-300 text-sm mb-3">{description}</p>}
      {ctaText && (
        <span className="inline-block px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium">
          {ctaText}
        </span>
      )}
    </div>
  )
}
