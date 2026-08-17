'use client'
import { use } from 'react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import TicketDetail from '@/components/email-ops/TicketDetail'

export default function EmailOpsTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = use(params)
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  if (!activeClient) return null
  return <TicketDetail ticketId={ticketId} clientId={activeClient.id} locale={locale} brand={activeClient.primaryColor || '#6366F1'} />
}
