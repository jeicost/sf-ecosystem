# Discoolver Guide Editor — Deploy Guide

> **Estado:** Local 100% funcional · Deploy DO pendiente (bloqueado por Diego — CMS endpoints + IG OAuth)  
> **Última actualización:** 2026-05-09

## Stack

| Layer | Tech |
|---|---|
| Backend API | FastAPI + SQLAlchemy async |
| Database | PostgreSQL (DigitalOcean Managed DB) |
| Image storage | DigitalOcean Spaces (S3-compatible) |
| AI editorial | Anthropic Claude Haiku |
| Editor frontend | React + Vite → served at `/editor` |
| Portal influencers | HTML vanilla → `/portal` |
| Landing creators | HTML standalone → `creators-landing-gamma.vercel.app` |
| PDF export | WeasyPrint (Playwright pendiente de instalar en DO) |

---

## Quick start (development)

```bash
# 1. Enter project
cd "clients/Discoolver/dg-editor"

# 2. Start server (venv ya configurado)
.venv/bin/python3 -m uvicorn main:app --port 8000
# ⚠️ Usar .venv/bin/python3 directamente — NO "source .venv/bin/activate && uvicorn"
#    (el Python del sistema no resuelve el venv correctamente en este entorno)

# 3. Build editor frontend (después de cambios en editor/src/)
cd editor && npm run build && cd ..
```

**URLs locales:**
- Editor: `http://localhost:8000/editor`
- Portal influencer: `http://localhost:8000/portal`
- Landing creators: `http://localhost:8000/influencers`
- API docs: `http://localhost:8000/docs`
- Design hub: `http://localhost:8000/design/hub.html`

---

## First login credentials

> ⚠️ Change these immediately in `app/api/v2/auth.py` before deploying to production.

| Email | Password | Role |
|---|---|---|
| `editor@discoolver.com` | `discoolver2026` | editor |
| `admin@discoolver.com` | `admin2026` | admin |

---

## DigitalOcean production deploy

### PostgreSQL
```bash
# Create managed database in DO console
# Copy connection string → DATABASE_URL in .env

# Run ALL migrations (005 incluye triggers updated_at + índice collection)
alembic upgrade head
# Migrations: 001 → 002 → 003 → 004 (users + guide_type) → 005 (triggers + índices)
```

### Spaces (image storage)
```bash
# Create Space in DO console (frankfurt/fra1 recommended)
# Set CORS: Allow GET from * and PUT/POST from your domain
# Copy keys → DO_SPACES_KEY, DO_SPACES_SECRET in .env
# Enable CDN → copy CDN endpoint → DO_SPACES_CDN_BASE
```

### App Platform / Droplet
```bash
# Build editor frontend
cd editor && npm run build && cd ..

# Install Playwright for PDF (optional — WeasyPrint ya funciona como fallback)
pip install playwright && playwright install chromium --with-deps

# Start server (production)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Create a guide from Excel

1. **Download template**: `GET /api/v2/import/template`  
   Or click **⬇ Plantilla Excel** in the editor dashboard.

2. **Fill the Excel**:
   - Sheet `METADATA` → guide identity, cover, director, persona del año
   - Sheet `RECOMENDADOS` → all places (restaurants, hotels, bars, etc.)
   - Sheet `INFLUENCERS` → influencer profiles
   - Sheet `PERSONA_DEL_ANO` → career timeline + awards + recommendations

3. **Import**: `POST /api/v2/import/excel` (multipart/form-data, field `file`)  
   Or click **📥 Importar Excel** in the editor dashboard.

4. **Edit & enrich**: Open the guide in the editor, upload photos, run AI generation.

5. **Export**: Tab Export → PDF or Web → share/download.

---

## Generate AI editorial texts

```bash
POST /api/guides/<uuid>/ai/generate
{
  "field": "both",          # "description" | "tagline" | "both"
  "overwrite": false,       # true = rewrite existing
  "style_hint": "guía de nómadas digitales, tono casual"
}
```

Uses **Claude Haiku** (fast + cheap) with the Discoolver editorial style guide built in.

---

## Design Studio preview

Add `?guide=<uuid>` to the design-studio URL to load a real guide config:

```
http://localhost:8000/design/studio/?guide=abc123-...
```

Or export as web to get a standalone URL with the config baked in.

---

## Configurar emails en producción

El sistema envía emails automáticos en tres eventos:
- Nueva solicitud de influencer (al admin)
- Solicitud aprobada (al influencer)
- Solicitud rechazada (al influencer)

En desarrollo están **desactivados** (`EMAIL_ENABLED=false`). Para activarlos en producción:

```env
# .env en producción
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com       # o smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=hola@discoolver.com
SMTP_PASSWORD=tu-app-password  # Gmail: Ajustes → Seguridad → Contraseñas de app
EMAIL_FROM=Discoolver <hola@discoolver.com>
ADMIN_EMAIL=hola@discoolver.com
PORTAL_URL=https://discoolver.com/portal
```

### Gmail (recomendado para empezar)
1. Activar verificación en dos pasos en la cuenta Google
2. Ir a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Crear contraseña de app → copiar en `SMTP_PASSWORD`

### SendGrid (recomendado para escalar)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxx...   # API key de SendGrid
```

### Probar el envío de emails
```bash
# Con el servidor arriba, aprobar una aplicación de influencer vía API:
curl -X POST http://localhost:8000/api/v2/applications/{id}/approve \
  -H "Authorization: Bearer TOKEN"
# → Debe llegar email al influencer y al admin
```

---

## CMS integration (future)

The v2 API is designed to be CMS-compatible. To connect to the Discoolver CMS:
1. Add CMS JWT as a valid auth token in `app/api/v2/auth.py`
2. Mount the editor as an iframe at `/herramientas/guias` in the CMS
3. Use `VITE_API_BASE` to point to the shared API

---

## File structure

```
dg-editor/
├── main.py                   # FastAPI entry point
├── alembic.ini               # DB migration config
├── migrations/               # Alembic migrations
│   └── versions/001_initial_schema.py
├── app/
│   ├── config.py             # Settings (env vars)
│   ├── db/
│   │   ├── models.py         # SQLAlchemy ORM
│   │   ├── crud.py           # Async CRUD
│   │   └── database.py       # Engine + session
│   ├── models/guide_v2.py    # Pydantic schemas
│   ├── api/v2/
│   │   ├── auth.py           # JWT login
│   │   ├── guides.py         # Guide CRUD
│   │   ├── items.py          # Items CRUD
│   │   ├── media.py          # DO Spaces upload
│   │   ├── import_excel.py   # Excel import
│   │   ├── editorial_ai.py   # Claude AI texts
│   │   └── export.py         # PDF + web export
│   └── services/
│       ├── spaces.py         # DO Spaces client
│       ├── excel_template.py # Generate .xlsx template
│       ├── excel_parser.py   # Parse .xlsx → DB
│       ├── pdf_renderer.py   # WeasyPrint PDF
│       └── web_renderer.py   # Static web export
├── editor/                   # React editor app
│   └── dist/                 # Built → served at /editor
└── design/                   # HTML templates (dev)
    ├── hub.html              # Navigation hub
    ├── 01-portada.html
    └── ...16 templates
```
