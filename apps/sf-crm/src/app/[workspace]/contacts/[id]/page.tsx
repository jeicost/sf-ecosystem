import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ContactDetailClient from './ContactDetailClient'

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>
}) {
  const { workspace, id } = await params
  const session = await getSession()

  if (!session || session.workspace.id !== workspace) {
    redirect('/')
  }

  return <ContactDetailClient contactId={id} />
}
