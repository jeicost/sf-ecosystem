interface PipelineStep {
  name: string
  emoji: string
  color: string
}

interface AgentPipelineHeaderProps {
  steps: PipelineStep[]
  finalOutput: string
  accentColor: string
}

export default function AgentPipelineHeader({
  steps,
  finalOutput,
  accentColor,
}: AgentPipelineHeaderProps) {
  return (
    <div
      className="mb-8 px-4 py-3 rounded-2xl flex items-center gap-2 flex-wrap"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span
        className="text-[9px] uppercase tracking-widest font-semibold shrink-0 mr-1"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        Flow
      </span>

      {steps.map((step, i) => (
        <div key={step.name} className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background: `${step.color}12`,
              border: `1px solid ${step.color}28`,
            }}
          >
            <span className="text-sm leading-none">{step.emoji}</span>
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: step.color }}
            >
              {step.name}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>→</span>
          )}
        </div>
      ))}

      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>→</span>

      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
        style={{
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}35`,
        }}
      >
        <span className="text-sm leading-none">📤</span>
        <span
          className="text-[10px] font-semibold leading-none"
          style={{ color: accentColor }}
        >
          {finalOutput}
        </span>
      </div>
    </div>
  )
}
