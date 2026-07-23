import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import MiraLogo from '@/components/mira-logo'

export const metadata: Metadata = {
  title: 'Política de Privacidad — MIRA',
}

export default function PrivacyPage() {
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
            <Link href="/privacy" className="text-ink">Privacidad</Link>
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

        <h1 className="text-2xl font-semibold text-ink tracking-tight mb-1">Política de Privacidad</h1>
        <p className="text-xs text-ink-tertiary mb-8">Última actualización: 23 de julio de 2026</p>

        <div className="space-y-7 text-sm text-ink-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-ink mb-2">1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de tus datos personales es Startup Factory, operador de MIRA.
              Para cualquier consulta relacionada con privacidad, contacta con [contacto@startupsfactory.es].
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">2. Qué datos recopilamos</h2>
            <p>Recopilamos tres tipos de datos:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <span className="text-ink">Datos de cuenta</span> — nombre, email y contraseña (almacenada de
                forma cifrada), plan contratado y rol dentro de tu organización.
              </li>
              <li>
                <span className="text-ink">Contenido de marca y negocio</span> — documentos, briefs,
                información de tu empresa y cualquier material que subas o conectes a tu Brand Brain para que
                los agentes de IA lo usen como contexto.
              </li>
              <li>
                <span className="text-ink">Datos de uso</span> — páginas visitadas, acciones dentro del
                producto y analítica agregada, para entender cómo se usa MIRA y mejorarlo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">3. Cómo usamos tus datos</h2>
            <p>Usamos estos datos para:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Prestar el Servicio, incluida la generación de resultados por parte de los agentes de IA.</li>
              <li>Dar soporte y responder a tus consultas.</li>
              <li>Mejorar el producto y detectar y corregir errores.</li>
              <li>Enviarte comunicaciones relacionadas con tu cuenta o el Servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">4. Con quién compartimos datos</h2>
            <p>
              No vendemos tus datos. Los compartimos únicamente con proveedores necesarios para operar MIRA,
              actuando como encargados del tratamiento: alojamiento de base de datos y autenticación
              (Supabase), alojamiento de la aplicación (Vercel), proveedores de modelos de IA para generar los
              resultados de los agentes (p. ej. Anthropic, OpenAI) y herramientas de analítica (Google
              Analytics / Google Tag Manager).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">5. Conservación de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Si cancelas tu cuenta, conservaremos los
              datos el tiempo razonablemente necesario para cumplir obligaciones legales o resolver disputas,
              y los eliminaremos o anonimizaremos posteriormente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">6. Tus derechos</h2>
            <p>
              Puedes solicitar acceso, rectificación o eliminación de tus datos personales en cualquier
              momento escribiendo a [contacto@startupsfactory.es]. Al ser un producto en fase beta, estas
              solicitudes se gestionan manualmente y responderemos en un plazo razonable.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">7. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas razonables (cifrado en tránsito, control de acceso, autenticación)
              para proteger tus datos. Ningún sistema es 100% infalible; si detectamos una incidencia de
              seguridad relevante, te lo comunicaremos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">8. Cookies</h2>
            <p>
              MIRA utiliza cookies esenciales de sesión y, en la web informativa, cookies de analítica. Más
              detalle en nuestra <Link href="/cookies" className="underline hover:text-ink">Política de Cookies</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">9. Menores de edad</h2>
            <p>
              MIRA no está dirigido a menores de 18 años y no recopilamos conscientemente datos de menores.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">10. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad para reflejar cambios en el producto o en la
              normativa aplicable. Publicaremos la fecha de la última actualización en esta misma página.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink mb-2">11. Contacto</h2>
            <p>
              Para cualquier consulta sobre privacidad, escríbenos a [contacto@startupsfactory.es].
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
