import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DiscoveryClient from './DiscoveryClient'

export const metadata = {
  title: 'Discovery — SF CRM',
}

export default async function DiscoveryPage({
  params,
}: {
  params: { workspace: string }
}) {
  const session = await getSession()
  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  return <DiscoveryClient workspaceId={params.workspace} workspace={session.workspace} />
}
