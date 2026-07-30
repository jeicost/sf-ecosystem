'use client'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { DEPARTMENT_METADATA, type DepartmentMetadata } from '@/lib/department-meta'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

// Entrada del chat por departamento (opción A: una sola voz) — un botón
// consistente en el header de las 5 páginas de departamento, en vez de
// obligar a entrar agente por agente.
export default function DepartmentChatLink({ slug }: { slug: DepartmentMetadata['slug'] }) {
  const { locale } = useLocaleContext()
  const dept = DEPARTMENT_METADATA[slug]
  return (
    <Link
      href={`/agent/dept/${slug}`}
      className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
      style={{ background: `${dept.color}18`, border: `1px solid ${dept.color}40`, color: dept.color }}
    >
      <MessageSquare size={13} />
      {t('department-chat.cta', locale)}
    </Link>
  )
}
