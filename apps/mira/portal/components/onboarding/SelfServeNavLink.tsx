'use client'

// Entrada al alta autoservicio en la barra lateral.
//
// Se auto-oculta, igual que ActivationChecklist se oculta al 100%. La regla de
// visibilidad es un dato, no una preferencia: se enseña solo si el cliente NO
// tiene pilares de contenido y no ha terminado el alta guiada.
//
// Por qué los pilares y no "el Cerebro está incompleto": sin pilares el motor
// de contenido devuelve 404 y el producto entero no funciona
// (content-engine/generate/route.ts:60-62). En el censo del 2026-08-11, 4 de 11
// clientes tenían CERO pilares — Adrian Grooves, Discoolver 360, GLS y 3dotpay.
// Esos cuatro son exactamente a quien hay que ofrecerle esto; Salsa Burgers,
// con 14 pilares, no necesita ver un enlace de "configura tu marca" para
// siempre.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Rocket } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'

export default function SelfServeNavLink({ path, isAgency }: { path: string; isAgency: boolean }) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (isAgency || !clientId) { setShow(false); return }

    fetch(`/api/onboarding/self-serve/progress?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.readiness) return
        const pillars = json.readiness.items?.find((i: { id: string }) => i.id === 'pillars')
        setShow(!json.finished && pillars?.done === false)
      })
      .catch(() => { /* el alta no es crítica para navegar: en silencio */ })

    return () => { cancelled = true }
  }, [clientId, isAgency])

  if (!show) return null

  return (
    <Link
      href="/onboarding"
      className={clsx(
        'mx-3 mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all',
        path === '/onboarding'
          ? 'bg-violet-500/15 text-violet-400'
          : 'text-ink-tertiary hover:bg-violet-500/10 hover:text-violet-400'
      )}
    >
      <Rocket size={13} />
      <span>Set up your brand</span>
      <span
        className="ml-auto rounded-full px-1.5 py-0.5 text-[8px] font-bold"
        style={{ background: 'rgba(168,85,247,0.15)', color: 'rgba(168,85,247,0.8)' }}
      >
        10 MIN
      </span>
    </Link>
  )
}
