// Qué integraciones funcionan de verdad HOY, comprobado contra la configuración
// real del servidor.
//
// El problema que arregla: MARKETPLACE_TOOLS trae un `status` escrito a mano en
// el código, y las 15 tarjetas decían "disconnected" o "coming soon" aunque
// cinco funcionaran. Un cliente entraba en Integraciones, veía todo apagado, y
// concluía que MIRA no está conectada a nada — justo lo contrario de la verdad.
//
// Hay dos clases de conexión y confundirlas es lo que causó el desajuste:
//
//   · DE PLATAFORMA — la pone Startup Factory y vale para todos los clientes.
//     Claude, OpenAI, y Apollo/Hunter a través del motor comercial. El cliente
//     no tiene que hacer nada: viene incluido en lo que paga.
//   · DE CLIENTE — cada marca conecta la suya, y vive en `tool_connections`
//     (o en el OAuth propio de Drive). Ahí sí el estado es por cliente.
//
// Esto resuelve la primera. Solo se ejecuta en servidor: mira variables de
// entorno, que no existen en el navegador.

export interface PlatformIntegration {
  /** id de MARKETPLACE_TOOLS */
  toolId: string
  connected: boolean
  /** Por qué está conectada, en lenguaje de cliente. */
  note: string
}

export function platformIntegrations(): PlatformIntegration[] {
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY)
  const openai = Boolean(process.env.OPENAI_API_KEY)
  // Apollo y Hunter no se conectan aquí: se usan A TRAVÉS del motor comercial
  // (apps/sf-sales-engine), que es quien tiene las claves. Si el motor está
  // configurado, el cliente tiene descubrimiento y verificación de correos.
  const salesEngine = Boolean(process.env.SALES_ENGINE_API_URL && process.env.SALES_ENGINE_API_KEY)
  const freepik = Boolean(process.env.FREEPIK_API_KEY)
  const drive = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET)

  return [
    { toolId: 'anthropic', connected: anthropic, note: 'Incluido en tu plan — no necesitas cuenta propia' },
    { toolId: 'openai', connected: openai, note: 'Incluido en tu plan — no necesitas cuenta propia' },
    { toolId: 'apollo', connected: salesEngine, note: 'A través del motor comercial de MIRA' },
    { toolId: 'hunter', connected: salesEngine, note: 'A través del motor comercial de MIRA' },
    { toolId: 'freepik', connected: freepik, note: 'Incluido — escalado y mejora de imágenes' },
    { toolId: 'magnific', connected: freepik, note: 'Incluido — usa la misma cuenta que Freepik' },
    // Drive es la excepción: la plataforma tiene el OAuth montado, pero la
    // conexión es de CADA cliente. Aquí solo se dice que se puede conectar.
    { toolId: 'google-drive', connected: false, note: drive ? 'Listo para conectar tu Drive' : '' },
  ].filter((i) => i.connected || i.note)
}
