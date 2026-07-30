import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Kind = 'success' | 'error' | 'info' | 'loading'

const kindStyles: Record<Kind, { wrap: string; Icon: typeof CheckCircle2 }> = {
  success: { wrap: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  error: { wrap: 'bg-red-50 text-red-700 border-red-200', Icon: AlertCircle },
  info: { wrap: 'bg-accent-50 text-accent-700 border-accent-200', Icon: AlertCircle },
  loading: { wrap: 'bg-slate-50 text-slate-600 border-slate-200', Icon: Loader2 },
}

export function InlineMessage({ kind, children, className }: { kind: Kind; children: React.ReactNode; className?: string }) {
  const { wrap, Icon } = kindStyles[kind]
  return (
    <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', wrap, className)}>
      <Icon className={cn('h-4 w-4 shrink-0', kind === 'loading' && 'animate-spin')} />
      <span>{children}</span>
    </div>
  )
}
