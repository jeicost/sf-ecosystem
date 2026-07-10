'use client'

interface AgentWorkspaceProps {
  agentId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export default function AgentWorkspace({ agentId }: AgentWorkspaceProps) {
  return (
    <div className="card px-6 py-8">
      <p className="text-sm text-white">Agent Workspace: {agentId || 'Default'}</p>
      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Coming soon — agent interaction workspace
      </p>
    </div>
  )
}
