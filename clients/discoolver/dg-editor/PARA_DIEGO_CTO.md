# Integración Editor de Guías ↔ CMS Discoolver
**Para:** Diego (CTO / backend)
**De:** Carlos
**Fecha:** Mayo 2026

---

## Qué hemos construido

Hemos construido el **Editor de Guías Discoolver** — una herramienta interna que genera las guías PDF de la marca (14 templates HTML → PDF). El editor tiene un tab `🔗 CMS` donde los editores pueden buscar recomendados directamente desde `api.discoolver.com` e importarlos a la guía con un clic, en vez de introducirlos a mano.

El flujo previsto:
1. Editor filtra por ciudad + categoría → ve listado de recomendados
2. Selecciona cuáles incluir en la guía + elige foto de portada y badge editorial
3. Importa → los recomendados quedan en la guía con todos los campos del CMS mapeados

**El buscador está bloqueado** porque los endpoints de listado devuelven 500. Te doy exactamente qué está pasando para que puedas localizarlo en los logs del servidor.

---

## Lo que ya funciona — probado en producción

La autenticación funciona correctamente:

```
POST https://api.discoolver.com/cms/v1/user
Body: { "user": "atenea", "password": "Discoolcms1!" }

→ 200 OK
→ Token: "gkmhxffccjcepgcckhkkkdabdajffcabbccek"
```

Algunos endpoints de detalle funcionan:

```
GET /cms/v1/business/500/es    → 200 OK  ✅
GET /cms/v2/gallery/:id        → 200 OK  ✅
GET /cms/v2/contact/:id        → 200 OK  ✅
```

---

## El problema — errores 500 sin mensaje

Los siguientes endpoints devuelven `500 Internal Server Error` con **respuesta genérica de Spring Boot** (sin mensaje de error ni causa):

```json
{ "timestamp": 1778288439243, "status": 500, "error": "Internal Server Error", "path": "/cms/v1/city/es" }
```

### Endpoints que fallan (probados con token válido):

```
GET /cms/v1/city/es                         → 500
GET /cms/v1/category/es                     → 500
GET /cms/v1/business                        → 500
GET /cms/v1/business?language=es&state=4   → 500
GET /cms/v1/business/1/es                  → 500  (pero /500/es → 200)
GET /cms/v1/business/1000/es               → 500
GET /cms/v1/subregion/es/actives           → 500
```

**Cómo reproduces el error** — copy-paste listo:

```bash
# 1. Login
TOKEN=$(curl -s -X POST https://api.discoolver.com/cms/v1/user \
  -H "Content-Type: application/json" \
  -d '{"user":"atenea","password":"Discoolcms1!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Endpoint que falla
curl -v -H "CMSAuthorization: $TOKEN" "https://api.discoolver.com/cms/v1/city/es"
curl -v -H "CMSAuthorization: $TOKEN" "https://api.discoolver.com/cms/v1/business"
curl -v -H "CMSAuthorization: $TOKEN" "https://api.discoolver.com/cms/v1/business/1/es"
```

### Importante: NO es un problema de permisos

Lo sé porque el login de `atenea` devuelve esto en la respuesta:

```json
"roles": [
  { "authority": "ROLE_ADMIN" },
  { "authority": "ROLE_PROFESSIONAL" },
  { "authority": "ROLE_PRODUCER" }
],
"permissions": [
  { "name": "SEARCH_RECOMMENDED" },
  { "name": "DETAIL_RECOMMENDED" },
  { "name": "NEW_RECOMMENDED" },
  { "name": "UPDATE_RECOMMENDED" },
  { "name": "DELETE_RECOMMENDED" }
]
```

El usuario es `ROLE_ADMIN` con `SEARCH_RECOMMENDED`. Si fuera permisos habría recibido un 401 o 403, no un 500. **El 500 es un error del servidor** — necesito que mires los logs de la aplicación en el momento de las peticiones para ver qué excepción está lanzando Spring.

---

## Lo que necesito de ti

### 1. Revisar los logs del servidor para las peticiones de arriba

El timestamp de la última prueba fue alrededor de `1778288439` (Unix epoch). Busca en los logs de Spring Boot qué excepción lanza cuando llega una petición a `/cms/v1/city/es` o `/cms/v1/business`.

**Si es un NullPointerException** en la serialización de algún campo → probablemente hay un recomendado o ciudad con un campo que el ORM no espera.

**Si es un error de BD** → puede ser una query que falla contra la base de producción.

**Si es una excepción de seguridad** → quizás hay un filtro adicional que no aplica el token de la Postman collection.

### 2. Confirmarnos si el listado `/cms/v1/business` tiene paginación

Cuando el endpoint esté activo, necesitamos saber:
- ¿Devuelve array directo `[{...}]` o paginado `{ data: [...], total: N, page: N }`?
- ¿Qué parámetros acepta? (`language`, `city`, `category`, `state`, `page`, `size`...)
- ¿Cuál es el `state` para "publicado"? (Nuestra Postman tenía `state=4`)

### 3. El campo `address` viene vacío en todos los recomendados que probamos

En `business/500/es` el campo `address` devuelve `""`. Sin embargo, el objeto tiene `locations` (array), `latitude` y `longitude`. ¿Cuál es el campo canónico donde está la dirección? Necesitamos mostrarla en las guías impresas.

---

## Contexto de los campos que ya mapeamos de tu API

A partir de `GET /cms/v1/business/500/es` hemos mapeado estos campos al editor:

| Campo CMS | Campo en la guía | Notas |
|---|---|---|
| `title` | Nombre del recomendado | ✅ Siempre presente |
| `subtitle` | Tagline | Viene `null` en la mayoría — lo escribe el editor |
| `description` (HTML Quill) | Descripción | Lo limpiamos de tags HTML |
| `web` | Sitio web | ✅ |
| `urlDiscoolver` | URL canónica en discoolver.com | Concatenamos `https://discoolver.com/` + `urlDiscoolver` |
| `categories[0].rawId` | Sección de la guía (restaurantes, fiesta, etc.) | Usamos un mapa de categorías |
| `city.name` | Ciudad | ✅ |
| `priceRange` | Futuro badge VALUE/SPLURGE | No lo usamos aún — ¿qué valores puede tener? |
| `instagramHandle` | Futuro perfil de Instagram | Descubierto hoy — no lo usamos aún |
| `address` | Dirección impresa en la guía | **Siempre vacío** — ¿cuál es el campo correcto? |
| `images` | Fotos del negocio | Existe en el detalle — ¿es lo mismo que `/cms/v2/gallery/:id`? |

---

## Campos que son 100% nuestros (no toques el CMS por esto)

Estos campos son editoriales y los asigna el equipo de Discoolver en el editor. **No los necesitas en el CMS**:

- `badge` — WOW, ICÓNICO, LOCAL-OWNED, etc.
- `sort_order` — orden dentro de la sección de la guía
- `tagline` editorial — frase estilo Discoolver (cuando el `subtitle` del CMS viene vacío)

---

## Resumen de lo que bloquea el lanzamiento

| Bloqueante | Quién lo resuelve |
|---|---|
| 500 en `/cms/v1/city/es`, `/cms/v1/category/es`, `/cms/v1/business` | **Diego** — mirar logs del servidor |
| Campo correcto para la dirección física del negocio | **Diego** — ¿`locations`? ¿coordenadas? ¿hay otro campo? |
| Instagram OAuth: `App ID` + `App Secret` de la Meta App del portal de influencers | **Diego** — necesitamos las credenciales para activar el login con Instagram |

---

Gracias Diego. Con los logs del servidor debería ser rápido de localizar. Cualquier duda me dices.

— Carlos
