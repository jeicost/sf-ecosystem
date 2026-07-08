import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import IntegrationsClient from './IntegrationsClient'

export const metadata = {
  title: 'Integrations — SF CRM',
}

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const session = await getSession()
  if (!session || session.workspace.id !== workspace) {
    redirect('/')
  }

  return <IntegrationsClient workspaceId={workspace} workspace={session.workspace} />
}
