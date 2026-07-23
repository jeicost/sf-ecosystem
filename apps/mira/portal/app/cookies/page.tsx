import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import MiraLogo from '@/components/mira-logo'

export const metadata: Metadata = {
  title: 'Política de Cookies — MIRA',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line-subtle">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <MiraLogo size={22} variant="icon" />
            <span className="text-sm font-bold text-ink">MIRA</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs text-ink-tertiary">
            <Link href="/terms" className="hover:text-ink">Términos</Link>
            <Link href="/privacy" className="hover:text-ink">Privacidad</Link>
            <Link href="/cookies" className="text-ink">Cookies</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
          <p className="text-xs font-medium leading-relaxed" style={{ color: '#fbbf24' }}>
            Plantilla legal — revisar con un abogado antes de publicar. No sustituye asesoría legal profesional.
          </p>
        </div>

        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-1">Política de Cookies</h1>
        <p className="text-xs text-ink-tertiary mb-8">Última actualización: 23 de julio de 2026</p>

        <div className="space-y-7 text-sm text-ink-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">1. Qué son las cookies</h2>
            <p>
              Las cookies son pequeños archivos que se almacenan en tu navegador al visitar un sitio web.
              También usamos mecanismos equivalentes de almacenamiento local (localStorage) para recordar
              preferencias como el idioma o el tema visual.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">2. Cookies que usamos</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <span className="text-ink">Esenciales / sesión</span> — necesarias para mantener tu sesión
                iniciada y para que la autenticación (gestionada por Supabase) funcione correctamente. No se
                pueden desactivar sin dejar de poder usar MIRA.
              </li>
              <li>
                <span className="text-ink">Preferencias</span> — recuerdan ajustes como el tema (claro/oscuro)
                o el idioma, guardados localmente en tu navegador.
              </li>
              <li>
                <span className="text-ink">Analíticas</span> — en nuestra web informativa usamos Google Tag
                Manager y Google Analytics para entender cómo se usa el sitio de forma agregada y anónima.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">3. Cookies de terceros</h2>
            <p>
              Algunas cookies analíticas provienen de servicios de terceros (Google). Estas empresas pueden
              tratar la información según sus propias políticas de privacidad.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">4. Cómo gestionar las cookies</h2>
            <p>
              Puedes eliminar o bloquear las cookies desde la configuración de tu navegador. Ten en cuenta que
              bloquear las cookies esenciales impedirá que puedas iniciar sesión y usar MIRA con normalidad.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">5. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta Política de Cookies para reflejar cambios en las herramientas que
              usamos. Publicaremos la fecha de la última actualización en esta misma página.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">6. Contacto</h2>
            <p>
              Para cualquier consulta sobre cookies, escríbenos a [contacto@startupsfactory.es].
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
