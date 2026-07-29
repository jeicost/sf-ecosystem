import Link from 'next/link'
import WizardShell from '@/components/admin/onboarding-wizard/WizardShell'

// P7 (2026-07-29): el alta pasa de chat-libre (sin pasos, sin atrás, creaba
// un cliente-borrador nada más abrir la página) a un wizard de 5 pasos con
// navegación y revisión. El chat original queda disponible en /chat por si
// hace falta el flujo conversacional libre para un caso complejo.
export default function AdminOnboardingPage() {
  return (
    <div>
      <div className="max-w-2xl mx-auto px-8 pt-4 flex justify-end">
        <Link href="/admin/onboarding/chat" className="text-[11px] text-ink-tertiary hover:text-ink-secondary transition-colors">
          ¿Prefieres el chat libre? →
        </Link>
      </div>
      <WizardShell />
    </div>
  )
}
