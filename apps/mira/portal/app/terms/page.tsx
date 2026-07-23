import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import MiraLogo from '@/components/mira-logo'

export const metadata: Metadata = {
  title: 'Términos de Servicio — MIRA',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line-subtle">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2">
            <MiraLogo size={22} variant="icon" />
            <span className="text-sm font-bold text-ink">MIRA</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs text-ink-tertiary">
            <Link href="/terms" className="text-ink">Términos</Link>
            <Link href="/privacy" className="hover:text-ink">Privacidad</Link>
            <Link href="/cookies" className="hover:text-ink">Cookies</Link>
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

        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-1">Términos de Servicio</h1>
        <p className="text-xs text-ink-tertiary mb-8">Última actualización: 23 de julio de 2026</p>

        <div className="space-y-7 text-sm text-ink-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">1. Objeto y aceptación</h2>
            <p>
              Estos Términos de Servicio regulan el acceso y uso de MIRA, una plataforma SaaS que ofrece un
              equipo de agentes de inteligencia artificial para automatizar tareas de marketing, ventas,
              estrategia, operaciones y finanzas de tu negocio ("el Servicio"), operada por Startup Factory
              ("nosotros", "MIRA"). Al crear una cuenta o utilizar el Servicio aceptas estos términos. Si no
              estás de acuerdo, no debes utilizar MIRA.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">2. Descripción del servicio</h2>
            <p>
              MIRA proporciona agentes de IA organizados por departamento (marketing, ventas, estrategia,
              operaciones y finanzas) que generan contenido, análisis, informes y recomendaciones a partir de
              la información de tu negocio y de tus instrucciones. MIRA se encuentra actualmente en fase
              beta: algunas funciones pueden cambiar, fallar ocasionalmente o estar incompletas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">3. Registro y cuenta de usuario</h2>
            <p>
              Para usar MIRA necesitas crear una cuenta con datos veraces y mantenerlos actualizados. Eres
              responsable de la confidencialidad de tus credenciales y de toda la actividad que ocurra bajo tu
              cuenta. Avísanos de inmediato ante cualquier uso no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">4. Uso aceptable</h2>
            <p>
              Te comprometes a no usar MIRA para fines ilegales, para generar contenido difamatorio, engañoso,
              fraudulento o que infrinja derechos de terceros, ni a intentar acceder sin autorización a
              sistemas, datos de otros clientes o a la infraestructura del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">5. Tu contenido</h2>
            <p>
              Todo el contenido que subas o conectes a MIRA (documentos de marca, información de negocio,
              briefs, conexiones a herramientas externas) sigue siendo tuyo. Nos concedes una licencia
              limitada para almacenar y procesar ese contenido con el único fin de prestarte el Servicio,
              incluida su uso como contexto para que los agentes de IA generen resultados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">6. Resultados generados por IA</h2>
            <p>
              Los textos, informes, análisis e imágenes que generan los agentes de MIRA son producidos por
              modelos de inteligencia artificial y pueden contener errores, imprecisiones o sesgos. Eres
              responsable de revisar y validar cualquier resultado antes de usarlo, publicarlo o tomar
              decisiones de negocio basadas en él.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">7. Planes, precios y facturación</h2>
            <p>
              MIRA se ofrece bajo distintos planes de suscripción. Al estar en fase beta, los precios,
              límites de uso y funcionalidades incluidas en cada plan pueden cambiar; te avisaremos con
              antelación razonable ante cambios que te afecten como cliente activo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">8. Disponibilidad del servicio</h2>
            <p>
              Trabajamos para mantener MIRA disponible de forma continua, pero al ser un producto en beta no
              garantizamos un nivel de servicio (SLA) determinado ni la ausencia total de interrupciones o
              errores.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">9. Propiedad intelectual</h2>
            <p>
              La plataforma MIRA, su marca, diseño, código y los agentes de IA son propiedad de Startup
              Factory. Nada en estos términos te transfiere derechos sobre ellos, más allá de la licencia de
              uso del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">10. Limitación de responsabilidad</h2>
            <p>
              El Servicio se ofrece "tal cual", especialmente durante esta fase beta. En la medida permitida
              por la ley, MIRA no será responsable de daños indirectos o pérdida de negocio derivados del uso
              del Servicio o de las decisiones tomadas a partir de los resultados generados por los agentes de
              IA.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">11. Suspensión y cancelación</h2>
            <p>
              Puedes cancelar tu cuenta cuando quieras contactando con nosotros. Podemos suspender o cancelar
              cuentas que incumplan estos términos, tras aviso previo salvo casos graves o urgentes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">12. Modificaciones de estos términos</h2>
            <p>
              Podemos actualizar estos Términos de Servicio para reflejar cambios en el producto o en la
              normativa aplicable. Publicaremos la fecha de la última actualización en esta misma página.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">13. Ley aplicable y jurisdicción</h2>
            <p>
              Estos términos se rigen por la legislación de [España]. Cualquier disputa se someterá a los
              juzgados y tribunales competentes conforme a dicha legislación.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">14. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos, escríbenos a [contacto@startupsfactory.es].
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
