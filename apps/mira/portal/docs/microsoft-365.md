# Conector Microsoft 365 (OneDrive · SharePoint · Outlook)

Añadido el 8-oct-2026 para grupo Aldea: las carpetas del equipo comercial (histórico de
clientes y condiciones, base de la herramienta de propuestas) y el buzón
`local@albasanzexpress.es`, que es de Microsoft 365 y rechaza IMAP por contraseña.

Código: `lib/microsoft/` (graph.ts = HTTP puro; connections.ts = cuentas y tokens cifrados;
sync.ts = carpetas → `agent_documents`; mail.ts + mail-poll.ts = buzones → Email Ops).
Rutas: `app/api/integrations/microsoft/*`, `app/api/email-ops/inboxes/microsoft`,
`app/api/cron/microsoft-sync` (cada 30 min). Pruebas puras: `npx tsx evals/microsoft/pure.ts`.
Migración: `0090_microsoft_365.sql`.

## 1. Lo que tiene que hacer Carlos UNA vez: registrar la aplicación (Entra ID)

Hace falta una cuenta Microsoft con un directorio de Entra ID propio (vale el gratuito: en
https://entra.microsoft.com, con cualquier cuenta Microsoft, «Crear inquilino» si no hay).
La app se registra en el directorio de **Startup Factory**, no en el del cliente: cada
cliente da su consentimiento en el suyo.

1. https://entra.microsoft.com → **Identidad → Aplicaciones → Registros de aplicaciones →
   Nuevo registro**.
   - Nombre: `MIRA — Startup Factory`
   - Tipos de cuenta: **«Cuentas en cualquier directorio organizativo (multiinquilino)»**
     (sin cuentas personales).
   - URI de redirección: tipo **Web**, valor
     `https://mira.startupsfactory.es/api/integrations/microsoft/callback`
     (y, para probar en local, añadir después `http://localhost:3000/api/integrations/microsoft/callback`).
2. En la app: **Certificados y secretos → Nuevo secreto de cliente** (caducidad 24 meses).
   Copiar el **Valor** en el momento (no se vuelve a ver).
3. **Permisos de API → Agregar un permiso → Microsoft Graph → Permisos delegados**:
   `openid`, `profile`, `email`, `offline_access`, `User.Read`, `Files.Read.All`,
   `Sites.Read.All`, `Mail.Read`. No hace falta «Conceder consentimiento de administrador»
   aquí (eso lo hace cada cliente en su organización).
4. **Información general**: copiar el **Id. de aplicación (cliente)**.
5. En Vercel (proyecto `mira-portal`, Production): añadir
   - `MS_OAUTH_CLIENT_ID` = Id. de aplicación
   - `MS_OAUTH_CLIENT_SECRET` = Valor del secreto
   - `MS_REDIRECT_URI` = `https://mira.startupsfactory.es/api/integrations/microsoft/callback`
   y redesplegar (o esperar al siguiente deploy). Sin estas variables, las rutas responden
   503 y la interfaz dice «Microsoft 365 aún no está configurado».
6. Opcional pero recomendable: **Personalización de marca → logotipo y URL de la web**, y
   verificar el editor (Microsoft Partner Network) para que no salga «no verificado» en el
   consentimiento. No bloquea: el administrador del cliente puede consentir igual.

## 2. Lo que hace el cliente

### Carpetas (OneDrive / SharePoint)

Brand Brain → Documents → **Carpetas de OneDrive / SharePoint → Conectar cuenta de
Microsoft**. Inicia sesión **la persona que tiene acceso a las carpetas** (el comercial). MIRA
pide solo lectura de ficheros y sitios. Después, pegar el enlace de la carpeta (desde el
navegador o «Copiar vínculo» en SharePoint) o elegirla navegando, y pulsar «Sincronizar».

- La primera pasada **inventaría** la carpeta entera sin descargar nada (ficheros por tipo,
  por año, por subcarpeta/cliente) y lee hasta 60 documentos; el resto entra solo, 40 cada
  media hora (≈ 1.900 al día). Formatos: PDF, DOCX, XLSX, PPTX, CSV, TXT/MD, .eml, imágenes.
  Los .doc/.xls/.msg antiguos se cuentan pero no se leen.
- Un fichero que no cambia no se vuelve a pagar (huella de contenido de Graph).
- El resumen por documento lo hace FAST_MODEL (≈ 0,002 $/documento) y cuenta en el tope
  mensual de la marca.

### Buzón de Outlook / Microsoft 365 (Email Ops)

Email Ops → Settings → **Conectar un buzón de Microsoft 365 → Iniciar sesión con
Microsoft**. Tiene que entrar **la cuenta del buzón** (p. ej. `local@albasanzexpress.es`),
no la de quien administra. Permiso pedido: `Mail.Read` (solo lectura). De vuelta, elegir
departamento y «Conectar este buzón». Se traen los correos del último día y, a partir de
ahí, lo nuevo cada 10 minutos.

## 3. Si Microsoft pide «aprobación del administrador»

Muchas organizaciones impiden que los usuarios consientan apps de terceros. Entonces el
**administrador de Microsoft 365 del cliente** abre UNA vez el enlace de consentimiento
(botón «Copiar enlace de consentimiento» en el panel) y acepta. Texto para enviarle:

> Hola. Para que MIRA (la plataforma de Startup Factory que usamos) pueda leer las carpetas
> de SharePoint/OneDrive que le indiquemos y el buzón de operaciones, necesita autorización
> en nuestro Microsoft 365. Es una aplicación multiinquilino de Startup Factory que solo
> pide permisos de LECTURA delegados (Files.Read.All, Sites.Read.All, Mail.Read): solo ve
> lo que ve la persona que inicia sesión, nunca todo el tenant, y no escribe nada. ¿Puedes
> abrir este enlace con tu cuenta de administrador y pulsar «Aceptar»? Después cada
> persona conecta su propia cuenta desde MIRA. Gracias. [enlace]

Alternativa más fina para SharePoint (cuando el administrador no quiera `Sites.Read.All`):
permisos de aplicación `Sites.Selected` con acceso concedido sitio a sitio. No está
implementado; se haría si lo piden.

## 4. Seguridad

- Tokens cifrados en reposo (AES-256-GCM, `MIRA_ENCRYPTION_KEY`), nunca salen por la API.
  Microsoft **rota** el refresh token en cada refresco: se guarda siempre el nuevo.
- El `state` del OAuth es opaco y vive en `oauth_sessions` con PKCE; el callback solo se
  fía de esa fila (mismo patrón que Drive, 0075).
- Una carpeta pertenece a UNA marca; conectarla a otra responde 409.
- Si un refresco devuelve `invalid_grant`, la conexión se marca como caída y la interfaz
  pide reconectar (no se queda «conectada» con un token muerto).
