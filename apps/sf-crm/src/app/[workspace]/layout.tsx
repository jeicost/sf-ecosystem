import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getWorkspace } from '@/lib/workspaces'
import Sidebar from '@/components/Sidebar'
import styles from './workspace.module.css'

export const metadata = {
  title: 'SF CRM',
}

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: {
    workspace: string
  }
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const session = await getSession()

  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  const workspace = getWorkspace(params.workspace)
  if (!workspace) {
    redirect('/')
  }

  return (
    <div className={styles.container}>
      <Sidebar workspaceId={workspace.id} workspaceName={workspace.name} />
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}
