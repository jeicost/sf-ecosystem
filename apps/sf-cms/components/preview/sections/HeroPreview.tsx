export function HeroPreview({ data }: { data: Record<string, unknown> }) {
  const headline = data.headline as string | undefined
  const subheading = data.subheading as string | undefined
  const ctaText = data.cta_text as string | undefined
  const image = data.image as string | undefined
  const darkOverlay = Boolean(data.dark_overlay)

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-slate-800 text-white p-10 text-center min-h-[180px] flex flex-col items-center justify-center"
      style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {image && darkOverlay && <div className="absolute inset-0 bg-black/50" />}
      <div className="relative z-10">
        {headline && <h2 className="text-2xl font-bold mb-2">{headline}</h2>}
        {subheading && <p className="text-slate-200 mb-4">{subheading}</p>}
        {ctaText && (
          <span className="inline-block px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium">
            {ctaText}
          </span>
        )}
      </div>
    </div>
  )
}
