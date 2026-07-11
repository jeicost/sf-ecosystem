interface AgentWorkspaceProps {
  role: string
  agentName: string
  agentEmoji: string
  color: string
  gradient: string
  title: string
  description: string
  placeholder: string
  quickPrompts: Array<{ label: string; prompt: string }>
}

export default function AgentWorkspace(props: AgentWorkspaceProps) {
  return (
    <div className="p-8">
      <p className="text-gray-500">Agent Workspace — Coming Soon</p>
    </div>
  )
}
