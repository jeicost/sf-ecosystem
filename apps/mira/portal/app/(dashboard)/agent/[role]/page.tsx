import AgentWorkspace from '@/components/agent-workspace'
import { AGENT_METADATA } from '@/lib/agent-meta'

interface Props {
  params: { role: string }
}

export default function AgentPage({ params }: Props) {
  const meta = AGENT_METADATA[params.role]

  if (!meta) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-white mb-2">Agente no encontrado</h1>
        <p className="text-gray-400">El agente "{params.role}" no existe.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <AgentWorkspace
        role={params.role}
        agentName={meta.name}
        agentEmoji={meta.emoji}
        color={meta.color}
        gradient={meta.gradient}
        title={meta.description}
        description={`Especialista en ${meta.department}`}
        placeholder={`Hola ${meta.name}, ¿cómo puedes ayudarme hoy?`}
        quickPrompts={[
          { label: '💡 Consejo rápido', prompt: `${meta.name}, dame tu mejor consejo sobre mi ${meta.department}` },
          { label: '📊 Análisis', prompt: `Analiza mi situación actual como experto en ${meta.department}` },
          { label: '🚀 Plan de acción', prompt: `Crea un plan de acción detallado para mejorar mi ${meta.department}` },
        ]}
      />
    </div>
  )
}
