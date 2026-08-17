'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { getUser, setUser, type MiraUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { canAccessSection, minPlanForSection, planLabel, type UserPlan } from '@/lib/plans'
import { DEPARTMENT_METADATA, type DepartmentMetadata } from '@/lib/department-meta'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import ComingSoon from '@/components/coming-soon'

// Guard de plan para la portada de un departamento (Sales, Strategy, Finance,
// Operations). Hasta ahora el candado vivía solo en el sidebar y la página se
// abría igual escribiendo la URL — "gating cosmético" (docs/MIRA-LANZAMIENTO-
// FASE2.md:41). proxy.ts sí sabe cortarlo, pero detrás de ENFORCE_PLAN_LIMITS y
// con un redirect a /home; esto es la versión que no depende del flag y que en
// vez de rebotar enseña la portada bloqueada con el plan que hace falta.
//
// Es un guard de UX, no de seguridad: las rutas /api siguen con sus propias
// comprobaciones y el corte duro sigue siendo el middleware. Por eso lee el
// plan como lo lee el sidebar (localStorage vía lib/auth, con Supabase de
// respaldo) y no vuelve a validar el JWT.

/** Plan de quien mira. undefined = todavía no se sabe; null = sin sesión. */
export function useUserPlan(): UserPlan | null | undefined {
  // Arranca en undefined también en el cliente (no se lee localStorage en el
  // initializer): la página se renderiza en servidor sin window y un initializer
  // distinto en cada lado es una hidratación rota. El coste es un frame en blanco.
  const [plan, setPlan] = useState<UserPlan | null | undefined>(undefined)

  useEffect(() => {
    if (plan !== undefined) return
    const cached = getUser()?.plan
    if (cached) { setPlan(cached); return }
    let cancelled = false
    createClient().auth.getUser().then(({ data }) => {
      if (cancelled) return
      if (!data.user) { setPlan(null); return }
      // Misma construcción que el sidebar del layout, para que las dos lecturas
      // coincidan y la caché de localStorage quede rellena para la siguiente.
      const meta = data.user.user_metadata ?? {}
      const u: MiraUser = {
        id: data.user.id,
        name: meta.name ?? data.user.email ?? 'User',
        email: data.user.email ?? '',
        role: meta.role ?? 'client',
        plan: meta.plan ?? 'starter',
        avatar: meta.avatar ?? (data.user.email?.[0]?.toUpperCase() ?? 'U'),
      }
      setUser(u)
      setPlan(u.plan)
    }).catch(() => { if (!cancelled) setPlan(null) })
    return () => { cancelled = true }
  }, [plan])

  return plan
}

export default function PlanGate({
  section,
  children,
}: {
  section: DepartmentMetadata['slug']
  children: ReactNode
}) {
  const plan = useUserPlan()
  const { locale } = useLocaleContext()

  // Sin plan conocido no se enseña ni el contenido ni el candado: un parpadeo
  // de "bloqueado" a un usuario con acceso sería peor que medio segundo en blanco.
  if (plan === undefined) return null
  if (canAccessSection(plan, section)) return <>{children}</>

  const dept = DEPARTMENT_METADATA[section]
  const requiredPlan = minPlanForSection(section)
  const sectionName = locale === 'es' ? dept.nameEs : dept.name
  const desc = t('plan.blocked-banner', locale)
    .replace('{section}', sectionName)
    .replace('{plan}', requiredPlan ? planLabel(requiredPlan) : '—')

  return (
    <ComingSoon
      variant="locked"
      title={sectionName}
      icon={dept.icon}
      color={dept.color}
      desc={desc}
      requiredPlan={requiredPlan ? planLabel(requiredPlan) : null}
      ctaLabel={t('plan.blocked-cta', locale)}
    />
  )
}
