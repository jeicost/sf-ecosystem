import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ContactsClient from './ContactsClient'

export const metadata = {
  title: 'Contacts — SF CRM',
}

export default async function ContactsPage({
  params,
}: {
  params: { workspace: string }
}) {
  const session = await getSession()
  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  return <ContactsClient workspaceId={params.workspace} workspace={session.workspace} />
}
