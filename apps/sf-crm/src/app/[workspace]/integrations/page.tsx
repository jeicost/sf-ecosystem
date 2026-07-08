import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import IntegrationsClient from './IntegrationsClient'

export const metadata = {
  title: 'Integrations — SF CRM',
}

export default async function IntegrationsPage({
  params,
}: {
  params: { workspace: string }
}) {
  const session = await getSession()
  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  return <IntegrationsClient workspaceId={params.workspace} workspace={session.workspace} />
}
