import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050507' }}>
      <div className="text-center max-w-sm px-6">
        <p className="text-6xl font-bold text-white mb-2" style={{ letterSpacing: '-0.05em', opacity: 0.15 }}>404</p>
        <p className="text-white font-semibold text-sm mb-1">Página no encontrada</p>
        <p className="text-[#444] text-xs mb-6">Esta ruta no existe en MIRA.</p>
        <Link href="/home"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-block"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
