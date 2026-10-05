'use client'
import { useEffect, useState } from 'react'
import type { ActiveClient } from '@/lib/client-context'
import BrandName from '@/components/ui/BrandName'

// Sacado de la página de licitaciones al partirla en asistente + vista clásica:
// las dos lo necesitan y una página de Next no puede exportar otra cosa.

// La trampa real del multi-marca (vista con Noel/grupo Aldea, 10-sep): entras
// con la marca por defecto (la primera alfabética), Licitaciones no está para
// ella y la pantalla parece un fallo — cuando la herramienta SÍ está en otra
// de tus marcas. Aquí se comprueba y se ofrece el cambio con un clic, en vez
// de exigir descubrir el switcher.
interface GrantedBrand { id: string; name: string; slug: string; logo_url: string | null; primary_color: string | null }

export default function TenderBrandSwitch({ activeClientId, onSwitch }: { activeClientId: string; onSwitch: (c: ActiveClient) => void }) {
  const [brands, setBrands] = useState<GrantedBrand[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/me/clients')
        if (!res.ok) return
        const json = await res.json()
        const others: GrantedBrand[] = (Array.isArray(json?.clients) ? json.clients : [])
          .filter((c: GrantedBrand) => c.id !== activeClientId)
        // La agencia ve todos los clientes y /api/tools le devuelve todo
        // abierto: sondear aquí no informa de nada. Y con muchas marcas no
        // disparamos una ráfaga de peticiones por una pista.
        if (json?.super_admin || others.length === 0 || others.length > 8) return
        const withTool = await Promise.all(others.map(async (c) => {
          try {
            const r = await fetch(`/api/tools?clientId=${c.id}`)
            if (!r.ok) return null
            const d = await r.json()
            return d.tools?.some((t: { id: string; enabled: boolean }) => t.id === 'tenders' && t.enabled) ? c : null
          } catch { return null }
        }))
        if (alive) setBrands(withTool.filter((c): c is GrantedBrand => !!c))
      } catch { /* la pista es opcional: sin ella la pantalla base sigue siendo válida */ }
    })()
    return () => { alive = false }
  }, [activeClientId])

  if (brands.length === 0) return null

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs text-ink-tertiary">
        It <span className="font-medium text-ink-secondary">is</span> enabled for {brands.length === 1 ? 'another of your brands' : 'other brands of yours'}:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => onSwitch({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logo_url, primaryColor: b.primary_color })}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-page"
          >
            Switch to <BrandName>{b.name}</BrandName>
          </button>
        ))}
      </div>
    </div>
  )
}
