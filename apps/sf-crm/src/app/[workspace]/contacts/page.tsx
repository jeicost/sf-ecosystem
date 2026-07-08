import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ContactsClient from './ContactsClient'

export const metadata = {
  title: 'Contacts — SF CRM',
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const session = await getSession()
  if (!session || session.workspace.id !== workspace) {
    redirect('/')
  }

  return <ContactsClient workspaceId={workspace} workspace={session.workspace} />
}
