# Technical Brief — Discoolver Dev Handoff
*Documento preparado por el equipo de producto para agilizar el desarrollo y reducir dependencias*

---

## 1. Repositorios y acceso al código

| Pregunta | Tu respuesta |
|----------|-------------|
| ¿Dónde está el código de `app.discoolver.com`? (GitHub, GitLab, otro) | |
| ¿Puedes dar acceso de lectura/escritura al repo? | |
| ¿Hay repo separado para `api.discoolver.com`? | |
| ¿Existe un repo de infraestructura o IaC (Terraform, Docker, etc.)? | |
| ¿Hay un `.env.example` o documento de variables de entorno por servicio? | |

---

## 2. Stack técnico de `api.discoolver.com`

| Pregunta | Tu respuesta |
|----------|-------------|
| Framework y versión (Spring Boot 3.x, Node, otro) | |
| Versión de Java / Node / lenguaje principal | |
| Base de datos: motor y versión (PostgreSQL, MySQL, MongoDB…) | |
| ORM o query builder que usáis | |
| ¿Hay migrations versionadas? ¿Con qué herramienta? (Flyway, Liquibase…) | |
| ¿Dónde está alojado? (AWS, GCP, Railway, Render, propio…) | |
| ¿Hay entorno de staging aparte del de producción? URL si existe | |

---

## 3. Autenticación y seguridad en la API

| Pregunta | Tu respuesta |
|----------|-------------|
| ¿Cómo se autentica el usuario final de `app.discoolver.com`? (JWT, session, OAuth…) | |
| ¿Cuál es el endpoint de login? (`POST /v1/token` — confirmar body y response) | |
| ¿El token JWT lleva `userId`, `email`, `role`? ¿Qué campos? | |
| ¿Cuánto dura el access token? ¿Hay refresh token? | |
| ¿Hay autenticación social (Google, Apple, Facebook) ya implementada? | |
| Para llamadas server-to-server (entre microservicios), ¿se usa API key, JWT de servicio, u otro? | |

---

## 4. Modelo de datos — Usuarios y Listas

*Esta sección es crítica para integrar guardado de posts de Instagram*

| Pregunta | Tu respuesta |
|----------|-------------|
| ¿Qué tabla/colección guarda los usuarios? Campos principales | |
| ¿Existe ya campo `instagram_user_id` o `instagram_token` en el usuario? | |
| ¿Cómo funciona el sistema de listas? (`/follow/list/{id}` — ¿qué guarda cada lista?) | |
| ¿Qué tipo de items puede guardar una lista? ¿Solo lugares del CMS o cualquier contenido? | |
| Estructura de un "saved item": ¿qué campos tiene? (tipo, id externo, metadata…) | |
| ¿Existe ya el concepto de "post externo" guardado o solo lugares de Discoolver? | |
| ¿Hay un campo `source` o `type` en los items guardados para distinguir origen? | |

---

## 5. Endpoints existentes — app.discoolver.com

*Lista los endpoints que ya existen para que no dupliquemos trabajo*

| Área | Endpoint | Método | ¿Existe? |
|------|----------|--------|----------|
| Listas del usuario | `/follow/list/{userId}` | GET | |
| Crear lista | `/follow/list/{userId}` | POST | |
| Guardar item en lista | `/follow/list/{listId}/item` | POST | |
| Eliminar item de lista | `/follow/list/{listId}/item/{itemId}` | DELETE | |
| Wishlist del usuario | `/wishlist/{userId}` | GET | |
| Añadir a wishlist | `/wishlist/{userId}` | POST | |
| Favoritos | `/favorites/{userId}` | GET/POST | |
| Perfil de usuario | `/v1/user/{userId}` | GET | |
| Actualizar perfil | `/v1/user/{userId}` | PUT/PATCH | |

*Añade los endpoints reales si los nombres son distintos*

---

## 6. Instagram / Meta — Estado actual

| Pregunta | Tu respuesta |
|----------|-------------|
| ¿Existe ya una Meta App registrada en developers.facebook.com? | |
| Si existe: ¿App ID? (el secret lo guardamos en .env, no aquí) | |
| ¿Qué permisos tiene aprobados la app actualmente? | |
| ¿Está en modo Development o Live? | |
| ¿Apify se usa solo para el equipo interno o también para features de usuarios? | |
| Si hay features de usuario con Apify: ¿cuáles exactamente? | |

---

## 7. Stack de `app.discoolver.com` (frontend)

| Pregunta | Tu respuesta |
|----------|-------------|
| Framework: React/Vite confirmado — ¿versión? | |
| ¿Gestión de estado global? (Zustand, Redux, Context, React Query…) | |
| ¿Librería de UI? (Tailwind, MUI, Chakra, custom…) | |
| ¿Routing: React Router v6? | |
| ¿Hay design system o componentes compartidos documentados? | |
| Variables de entorno que necesita el frontend (VITE_API_BASE, etc.) | |
| ¿Cómo se despliega? (Vercel, Netlify, S3+CloudFront…) | |

---

## 8. CMS de influencers — `cms.discoolver.com`

| Pregunta | Tu respuesta |
|----------|-------------|
| ¿Es el mismo `api.discoolver.com` el backend del CMS? | |
| ¿Los influencers tienen un rol/tipo de usuario específico en la DB? | |
| ¿Qué puede hacer un influencer en el CMS actualmente? | |
| ¿Hay endpoints específicos para influencers (`/influencer/…`)? | |
| ¿El CMS está preparado para recibir un token de Instagram por usuario? | |

---

## 9. Infraestructura y despliegue

| Pregunta | Tu respuesta |
|----------|-------------|
| ¿Cómo se despliega un cambio en `api.discoolver.com`? (CI/CD, manual, pipeline) | |
| ¿Hay un proceso de DB migration para producción? | |
| ¿Logs centralizados? ¿Dónde? (Datadog, Sentry, CloudWatch, otro) | |
| ¿Monitoring / alertas en producción? | |
| ¿Backups automáticos de DB? ¿Con qué frecuencia? | |

---

## 10. Prioridades de colaboración

*Para que podamos trabajar de forma autónoma sin bloquearte*

| Pregunta | Tu respuesta |
|----------|-------------|
| ¿Qué parte del código prefieres que no toquemos sin consultarte primero? | |
| ¿Hay algo en producción que sea especialmente delicado? | |
| ¿Cómo prefieres recibir los PRs/cambios? (descripción mínima, tests, otro) | |
| ¿Hay documentación técnica interna (Notion, Confluence, README) que debamos leer? | |
| Mejor forma de contactarte para dudas urgentes técnicas | |

---

*Gracias Diego — con esta info podemos avanzar mucho más rápido y con menos interrupciones para ti.*
