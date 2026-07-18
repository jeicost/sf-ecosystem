import { requireWorkspaceSession } from '@/lib/auth'
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
  const workspaceData = await requireWorkspaceSession(workspace)

  return <ContactsClient workspaceId={workspace} workspace={workspaceData} />
}
