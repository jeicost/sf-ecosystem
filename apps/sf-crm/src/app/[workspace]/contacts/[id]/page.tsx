import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ContactDetail from './ContactDetail'

export const metadata = {
  title: 'Contact Detail — SF CRM',
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>
}) {
  const { workspace: workspaceParam, id } = await params
  const session = await getSession()

  if (!session || session.workspace.id !== workspaceParam) {
    redirect('/')
  }

  return <ContactDetail workspaceId={workspaceParam} contactId={id} workspace={session.workspace} />
}
