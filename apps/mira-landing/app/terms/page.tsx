'use client'

const SECTIONS = [
  {
    title: '1. Objeto y aceptación',
    body: 'Estos Términos de Servicio regulan el acceso y uso de MIRA, una plataforma SaaS que ofrece un equipo de agentes de inteligencia artificial para automatizar tareas de marketing, ventas, estrategia, operaciones y finanzas de tu negocio ("el Servicio"), operada por Startup Factory ("nosotros", "MIRA"). Al crear una cuenta o utilizar el Servicio aceptas estos términos. Si no estás de acuerdo, no debes utilizar MIRA.',
  },
  {
    title: '2. Descripción del servicio',
    body: 'MIRA proporciona agentes de IA organizados por departamento (marketing, ventas, estrategia, operaciones y finanzas) que generan contenido, análisis, informes y recomendaciones a partir de la información de tu negocio y de tus instrucciones. MIRA se encuentra actualmente en fase beta: algunas funciones pueden cambiar, fallar ocasionalmente o estar incompletas.',
  },
  {
    title: '3. Registro y cuenta de usuario',
    body: 'Para usar MIRA necesitas crear una cuenta con datos veraces y mantenerlos actualizados. Eres responsable de la confidencialidad de tus credenciales y de toda la actividad que ocurra bajo tu cuenta. Avísanos de inmediato ante cualquier uso no autorizado.',
  },
  {
    title: '4. Uso aceptable',
    body: 'Te comprometes a no usar MIRA para fines ilegales, para generar contenido difamatorio, engañoso, fraudulento o que infrinja derechos de terceros, ni a intentar acceder sin autorización a sistemas, datos de otros clientes o a la infraestructura del Servicio.',
  },
  {
    title: '5. Tu contenido',
    body: 'Todo el contenido que subas o conectes a MIRA (documentos de marca, información de negocio, briefs, conexiones a herramientas externas) sigue siendo tuyo. Nos concedes una licencia limitada para almacenar y procesar ese contenido con el único fin de prestarte el Servicio, incluido su uso como contexto para que los agentes de IA generen resultados.',
  },
  {
    title: '6. Resultados generados por IA',
    body: 'Los textos, informes, análisis e imágenes que generan los agentes de MIRA son producidos por modelos de inteligencia artificial y pueden contener errores, imprecisiones o sesgos. Eres responsable de revisar y validar cualquier resultado antes de usarlo, publicarlo o tomar decisiones de negocio basadas en él.',
  },
  {
    title: '7. Planes, precios y facturación',
    body: 'MIRA se ofrece bajo distintos planes. Al estar en fase beta, los precios, límites de uso y funcionalidades incluidas en cada plan pueden cambiar; te avisaremos con antelación razonable ante cambios que te afecten como cliente activo.',
  },
  {
    title: '8. Disponibilidad del servicio',
    body: 'Trabajamos para mantener MIRA disponible de forma continua, pero al ser un producto en beta no garantizamos un nivel de servicio (SLA) determinado ni la ausencia total de interrupciones o errores.',
  },
  {
    title: '9. Propiedad intelectual',
    body: 'La plataforma MIRA, su marca, diseño, código y los agentes de IA son propiedad de Startup Factory. Nada en estos términos te transfiere derechos sobre ellos, más allá de la licencia de uso del Servicio.',
  },
  {
    title: '10. Limitación de responsabilidad',
    body: 'El Servicio se ofrece "tal cual", especialmente durante esta fase beta. En la medida permitida por la ley, MIRA no será responsable de daños indirectos o pérdida de negocio derivados del uso del Servicio o de las decisiones tomadas a partir de los resultados generados por los agentes de IA.',
  },
  {
    title: '11. Suspensión y cancelación',
    body: 'Puedes cancelar tu cuenta cuando quieras contactando con nosotros. Podemos suspender o cancelar cuentas que incumplan estos términos, tras aviso previo salvo casos graves o urgentes.',
  },
  {
    title: '12. Modificaciones de estos términos',
    body: 'Podemos actualizar estos Términos de Servicio para reflejar cambios en el producto o en la normativa aplicable. Publicaremos la fecha de la última actualización en esta misma página.',
  },
  {
    title: '13. Ley aplicable y jurisdicción',
    body: 'Estos términos se rigen por la legislación de [España]. Cualquier disputa se someterá a los juzgados y tribunales competentes conforme a dicha legislación.',
  },
  {
    title: '14. Contacto',
    body: 'Para cualquier consulta sobre estos términos, escríbenos a [contacto@startupsfactory.es].',
  },
]

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <a href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Volver a MIRA</a>

        <div style={{
          marginTop: 24, marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '14px 18px', borderRadius: 12,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <p style={{ fontSize: 13, color: '#fbbf24', lineHeight: 1.5, fontWeight: 500 }}>
            Plantilla legal — revisar con un abogado antes de publicar. No sustituye asesoría legal profesional.
          </p>
        </div>

        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
          Términos de Servicio
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 40 }}>
          Última actualización: 23 de julio de 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {SECTIONS.map(s => (
            <section key={s.title}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f4f4f8', marginBottom: 8 }}>{s.title}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{s.body}</p>
            </section>
          ))}
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 16 }}>
          <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Política de Privacidad</a>
          <a href="/cookies" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Política de Cookies</a>
        </div>
      </div>
    </main>
  )
}
