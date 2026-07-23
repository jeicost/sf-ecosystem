'use client'

const SECTIONS = [
  {
    title: '1. Responsable del tratamiento',
    body: 'El responsable del tratamiento de tus datos personales es Startup Factory, operador de MIRA. Para cualquier consulta relacionada con privacidad, contacta con [contacto@startupsfactory.es].',
  },
  {
    title: '2. Qué datos recopilamos',
    body: 'Recopilamos tres tipos de datos: datos de cuenta (nombre, email, contraseña cifrada, plan y rol); contenido de marca y negocio (documentos, briefs e información que subas o conectes a tu Brand Brain para que los agentes de IA lo usen como contexto); y datos de uso (páginas visitadas, acciones dentro del producto y analítica agregada, para entender cómo se usa MIRA y mejorarlo).',
  },
  {
    title: '3. Cómo usamos tus datos',
    body: 'Usamos estos datos para prestar el Servicio (incluida la generación de resultados por los agentes de IA), dar soporte, mejorar el producto y detectar errores, y enviarte comunicaciones relacionadas con tu cuenta.',
  },
  {
    title: '4. Con quién compartimos datos',
    body: 'No vendemos tus datos. Los compartimos únicamente con proveedores necesarios para operar MIRA, actuando como encargados del tratamiento: alojamiento de base de datos y autenticación (Supabase), alojamiento de la aplicación (Vercel), proveedores de modelos de IA para generar los resultados de los agentes (p. ej. Anthropic, OpenAI) y herramientas de analítica (Google Analytics / Google Tag Manager).',
  },
  {
    title: '5. Conservación de datos',
    body: 'Conservamos tus datos mientras tu cuenta esté activa. Si cancelas tu cuenta, conservaremos los datos el tiempo razonablemente necesario para cumplir obligaciones legales o resolver disputas, y los eliminaremos o anonimizaremos posteriormente.',
  },
  {
    title: '6. Tus derechos',
    body: 'Puedes solicitar acceso, rectificación o eliminación de tus datos personales en cualquier momento escribiendo a [contacto@startupsfactory.es]. Al ser un producto en fase beta, estas solicitudes se gestionan manualmente y responderemos en un plazo razonable.',
  },
  {
    title: '7. Seguridad',
    body: 'Aplicamos medidas técnicas razonables (cifrado en tránsito, control de acceso, autenticación) para proteger tus datos. Ningún sistema es 100% infalible; si detectamos una incidencia de seguridad relevante, te lo comunicaremos.',
  },
  {
    title: '8. Cookies',
    body: 'MIRA utiliza cookies esenciales de sesión y, en esta web informativa, cookies de analítica. Más detalle en nuestra Política de Cookies.',
  },
  {
    title: '9. Menores de edad',
    body: 'MIRA no está dirigido a menores de 18 años y no recopilamos conscientemente datos de menores.',
  },
  {
    title: '10. Cambios en esta política',
    body: 'Podemos actualizar esta Política de Privacidad para reflejar cambios en el producto o en la normativa aplicable. Publicaremos la fecha de la última actualización en esta misma página.',
  },
  {
    title: '11. Contacto',
    body: 'Para cualquier consulta sobre privacidad, escríbenos a [contacto@startupsfactory.es].',
  },
]

export default function PrivacyPage() {
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
          Política de Privacidad
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
          <a href="/cookies" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Política de Cookies</a>
        </div>
      </div>
    </main>
  )
}
