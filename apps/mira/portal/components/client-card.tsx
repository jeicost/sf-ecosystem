import Link from 'next/link'

interface ClientCardProps {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  onboardingStatus?: string
  createdAt: string
}

export default function ClientCard({
  id,
  name,
  slug,
  logoUrl,
  primaryColor,
  onboardingStatus,
  createdAt,
}: ClientCardProps) {
  const accentColor = primaryColor || '#8B5CF6'
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Link href={`/resources?client=${slug}`}>
      <div
        className="card px-5 py-4 cursor-pointer transition hover:border-opacity-100"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start gap-4 mb-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-white"
            style={{
              background: logoUrl
                ? 'transparent'
                : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">{name}</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date(createdAt).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        {onboardingStatus && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {onboardingStatus}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
