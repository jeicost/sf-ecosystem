import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProspectionClient from './ProspectionClient'

export const metadata = {
  title: 'Prospection — SF CRM',
}

export default async function ProspectionPage({
  params,
}: {
  params: { workspace: string }
}) {
  const session = await getSession()
  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  return <ProspectionClient workspaceId={params.workspace} workspace={session.workspace} />
}
