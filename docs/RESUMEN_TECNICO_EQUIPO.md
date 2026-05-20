# Resumen Técnico — Proyecto Discoolver
*Para el equipo técnico — estado actual, arquitectura y próximos pasos*

---

## Qué es este proyecto

Discoolver es una plataforma de guías de viaje curadas que combina tres productos:

| Producto | URL | Usuarios |
|---------|-----|---------|
| **App de usuario** | `app.discoolver.com` | Viajeros que descubren y guardan recomendaciones |
| **CMS de influencers** | `cms.discoolver.com` | Influencers/directores que crean guías |
| **Editor de guías** | `localhost:8000/editor` | Equipo interno que maqueta y exporta las guías a PDF |

---

## Arquitectura actual

```
app.discoolver.com          cms.discoolver.com         dg-editor (local)
   React / Vite                Next.js 15                FastAPI + React
        │                          │                           │
        └──────────────────────────┴───────────────────────────┘
                                   │
                          api.discoolver.com
                          (Spring Boot · Java)
                                   │
                            Base de datos
                          (PostgreSQL / MySQL)
```

El editor de guías (`dg-editor`) tiene su **propia base de datos SQLite en local** (dev) o PostgreSQL en producción, independiente de `api.discoolver.com`.

---

## dg-editor — Stack completo

**Backend:**
- Python 3.9 · FastAPI · SQLAlchemy 2.0 async · SQLite (dev) / PostgreSQL (prod)
- Alembic para migraciones en producción
- Playwright + Chromium para export PDF · WeasyPrint como fallback
- Claude API (Anthropic) para funcionalidades de IA editorial

**Frontend:**
- React 19 · Vite · React Query v5 · React Router v6 · React Hook Form
- Sin librería UI externa — estilos custom con CSS variables

**Servicio en local:**
```bash
cd "Desktop/Claude/Disclover Guides/dg-editor"
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```
- Editor: `http://localhost:8000/editor`
- API docs: `http://localhost:8000/docs`

---

## Lo que está construido (estado hoy)

### ✅ Sistema de guías completo
- CRUD de guías, secciones e ítems
- 20 templates HTML A4 para exportar a PDF
- Export PDF/web con Playwright
- Historial de versiones (snapshots)

### ✅ Integración CMS (`api.discoolver.com`)
- Importar lugares del CMS directamente al editor
- Auth: `POST /cms/v1/user` → header `CMSAuthorization`
- **Pendiente Diego**: endpoints de listado (`/cms/v1/business`, `/cms/v1/city`, `/cms/v1/category`) retornan 500

### ✅ IA Editorial (Claude Haiku/Opus)
- Generación automática de textos para fichas
- Sugerencias de recomendados con criterios editoriales

### ✅ Integración Instagram (construida HOY)
El influencer entra al editor, va a la tab "📸 Instagram" y conecta su cuenta:
- OAuth completo con Meta (Instagram API with Instagram Login)
- Feed paginado de posts con selección múltiple
- Importación directa como fichas en la guía

**Prerequisito para activar:** Registrar app en Meta y añadir al `.env`:
```
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
INSTAGRAM_REDIRECT_URI=http://localhost:8000/api/v2/instagram/callback
```

### ✅ Templates 17-20 conectados (HOY)
Los 4 templates nuevos (v1.2) ahora leen datos reales de `window.GUIDE_CONFIG`:

| Template | Datos que consume |
|----------|-----------------|
| 17 — Cómo usar la guía | Estático, solo `primaryColor` |
| 18 — 10 Saves en 2 min | `GUIDE_CONFIG.topSaves` (sección `top_saves` del editor) |
| 19 — Entre secciones | `GUIDE_CONFIG.sectionTitle`, `sectionNum`, `primaryColor`, `pageNumber` |
| 20 — Coollections | `GUIDE_CONFIG.coollections` (ítems agrupados por estilo de viaje) |

---

## Variables de entorno necesarias

Crear `/Desktop/Claude/Disclover Guides/dg-editor/.env`:

```env
# Base de datos (dev usa SQLite automático)
DATABASE_URL=sqlite+aiosqlite:///./dev.db

# IA
ANTHROPIC_API_KEY=sk-ant-...

# CMS Discoolver
CMS_API_PASSWORD=Discoolcms1!

# Instagram / Meta (pendiente registro de app)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:8000/api/v2/instagram/callback

# Producción (no necesario en local)
DO_SPACES_KEY=
DO_SPACES_SECRET=
SECRET_KEY=cambiar-en-produccion
```

---

## Próximos pasos técnicos pendientes

### 🔴 Bloqueado por Diego
1. **Endpoints CMS con 500**: `/cms/v1/business` (listado), `/cms/v1/city/:lang`, `/cms/v1/category/:lang` retornan 500 — necesario para el buscador del editor
2. **Meta App**: ¿Existe ya una app en `developers.facebook.com`? Si sí, pasar App ID + Secret para activar Instagram

### 🟡 Pendiente de decisión de producto
3. **Instagram en `app.discoolver.com`**: Los usuarios finales podrán guardar posts de Instagram en sus listas. Necesitamos acceso al repo de la app y al schema de la DB de `api.discoolver.com` (tablas de usuarios, listas, items guardados)

### 🟢 Listos para implementar cuando haya acceso
4. **Deploy dg-editor** a DigitalOcean App Platform con PostgreSQL (hay un `DEPLOY.md` con instrucciones)
5. **Design-studio build**: El renderer de PDF carga un build de React (`design-studio/dist/`) que no existe aún — necesita `cd design-studio && npm run build`
6. **Playwright en producción**: `pip install playwright && playwright install chromium --with-deps`

---

## Estructura de archivos clave

```
dg-editor/
├── main.py                          ← FastAPI app, rutas, startup
├── app/
│   ├── config.py                    ← Todas las variables de entorno
│   ├── db/
│   │   ├── models.py                ← ORM: GuideRow, ItemRow, InstagramConnectionRow...
│   │   └── crud.py                  ← Operaciones de base de datos
│   ├── api/v2/
│   │   ├── guides.py                ← CRUD guías
│   │   ├── items.py                 ← CRUD ítems
│   │   ├── instagram.py             ← OAuth Meta + feed + import (NUEVO)
│   │   ├── cms_bridge.py            ← Integración api.discoolver.com
│   │   └── editorial_ai.py          ← IA con Claude
│   └── services/
│       ├── instagram_client.py      ← Cliente Meta Graph API (NUEVO)
│       ├── cms_client.py            ← Cliente api.discoolver.com
│       └── pdf_renderer.py          ← Export PDF con Playwright
├── design/                          ← 20 templates HTML A4
│   ├── 17-como-usar.html            ← Conectado (ACTUALIZADO)
│   ├── 18-10saves.html              ← Conectado, lee topSaves (ACTUALIZADO)
│   ├── 19-entre-secciones.html      ← Conectado, lee sección activa (ACTUALIZADO)
│   └── 20-coollections.html         ← Conectado, lee coollections (ACTUALIZADO)
└── editor/src/                      ← Frontend React
    ├── pages/GuideEdit.jsx          ← 9 tabs del editor
    └── pages/tabs/
        ├── TabInstagram.jsx         ← Tab Instagram (NUEVO)
        ├── TabCMS.jsx               ← Import desde CMS
        └── TabAI.jsx                ← Generación con IA
```

---

## API endpoints disponibles

Todos los endpoints en `http://localhost:8000/docs` (Swagger UI)

**Nuevos endpoints Instagram:**
```
GET  /api/v2/instagram/auth-url?guide_id={id}
GET  /api/v2/instagram/callback              ← callback OAuth
GET  /api/v2/guides/{id}/instagram/status
GET  /api/v2/guides/{id}/instagram/media
POST /api/v2/guides/{id}/instagram/import
DEL  /api/v2/guides/{id}/instagram/connection
```

---

*Preguntas técnicas → responder al brief en `PARA_DIEGO_TECH_BRIEF.md`*
