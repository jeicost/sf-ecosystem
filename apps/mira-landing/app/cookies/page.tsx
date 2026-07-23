'use client'

const SECTIONS = [
  {
    title: '1. Qué son las cookies',
    body: 'Las cookies son pequeños archivos que se almacenan en tu navegador al visitar un sitio web. También usamos mecanismos equivalentes de almacenamiento local (localStorage) para recordar preferencias, como si ya has aceptado este aviso.',
  },
  {
    title: '2. Cookies que usamos',
    body: 'Esenciales / sesión — necesarias para que el portal de MIRA (mira.startupsfactory.es) mantenga tu sesión iniciada, gestionadas por Supabase. No se pueden desactivar sin dejar de poder usar el producto. Analíticas — en esta web usamos Google Tag Manager y Google Analytics para entender cómo se usa el sitio de forma agregada y anónima.',
  },
  {
    title: '3. Cookies de terceros',
    body: 'Algunas cookies analíticas provienen de servicios de terceros (Google). Estas empresas pueden tratar la información según sus propias políticas de privacidad.',
  },
  {
    title: '4. Cómo gestionar las cookies',
    body: 'Puedes eliminar o bloquear las cookies desde la configuración de tu navegador. Ten en cuenta que bloquear las cookies esenciales impedirá que puedas iniciar sesión y usar MIRA con normalidad.',
  },
  {
    title: '5. Cambios en esta política',
    body: 'Podemos actualizar esta Política de Cookies para reflejar cambios en las herramientas que usamos. Publicaremos la fecha de la última actualización en esta misma página.',
  },
  {
    title: '6. Contacto',
    body: 'Para cualquier consulta sobre cookies, escríbenos a [contacto@startupsfactory.es].',
  },
]

export default function CookiesPage() {
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
          Política de Cookies
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
          <a href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Términos de Servicio</a>
          <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Política de Privacidad</a>
        </div>
      </div>
    </main>
  )
}
