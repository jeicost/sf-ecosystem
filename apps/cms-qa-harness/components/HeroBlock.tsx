export interface HeroBlockData {
  headline?: string
  subheadline?: string
  cta_text?: string
  cta_url?: string
  background_color?: string
  text_color?: string
}

interface HeroBlockProps {
  data: HeroBlockData
}

export function HeroBlock({ data }: HeroBlockProps) {
  return (
    <section
      className="py-20 px-6"
      style={{
        backgroundColor: data.background_color || '#1f2937',
        color: data.text_color || '#ffffff',
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {data.headline && (
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {data.headline}
          </h1>
        )}
        {data.subheadline && (
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {data.subheadline}
          </p>
        )}
        {data.cta_text && data.cta_url && (
          <a
            href={data.cta_url}
            className="inline-block px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:shadow-lg transition"
          >
            {data.cta_text}
          </a>
        )}
      </div>
    </section>
  )
}
