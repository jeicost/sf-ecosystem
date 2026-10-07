# Plantilla de correo — alta de usuario en MIRA

Correo estándar que se envía a cada persona a la que se da de alta en MIRA. Sale siempre desde
**carlos@startupsfactory.es** (cuenta «Startupsfactory» de Mail.app) y **nunca se envía sin que
Carlos vea el mensaje completo y dé el OK** (regla del 7-oct-2026). Corto y genérico: sin detalle de
herramientas ni explicaciones (Carlos, 7-oct: «debe ser más genérico sin entrar en mucho detalle»).

## Cómo se prepara el alta (antes del correo)

1. Crear el usuario con `auth.admin.createUser` (email confirmado, contraseña aleatoria que nadie
   conoce, `user_metadata: { client_id: <marca por defecto>, plan: 'growth', full_name }`).
2. Dar acceso a cada marca con `mira_project_access` (`role: 'admin'`), respetando `clients.max_seats`.
3. Generar el enlace para fijar contraseña: `auth.admin.generateLink({ type: 'recovery', email,
   options: { redirectTo: 'https://mira.startupsfactory.es/reset-password' } })`. Caduca y es de un uso.
4. Rellenar la plantilla, enseñársela a Carlos, esperar su OK, enviar, confirmar.

## Variables

`{{nombre}}` nombre de pila · `{{empresa}}` marca o marcas a las que accede · `{{enlace}}` enlace de
recuperación · `{{email}}` correo del usuario.

## Correo

**De:** Carlos Jacoste <carlos@startupsfactory.es>
**Para:** {{email}}
**Asunto:** Tu acceso a MIRA

Hola, {{nombre}}:

Ya tienes tu usuario en MIRA, la plataforma de IA de Startup Factory que utiliza {{empresa}}.

Para activarlo, fija tu contraseña en este enlace (es personal y caduca en unas horas):
{{enlace}}

A partir de ahí entras siempre en https://mira.startupsfactory.es con tu correo y tu contraseña. Si el
enlace caduca, usa «¿Olvidaste tu contraseña?» en esa misma página.

Para cualquier duda, escríbeme a este correo.

Un saludo,

Carlos Jacoste
Startup Factory
