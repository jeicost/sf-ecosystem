# Disclover Guides Editor

Sistema conversacional para editar y generar guías de viaje Disclover mediante un asistente de IA.

## Stack

- **Backend**: Python 3.11+ · FastAPI · Pydantic v2
- **IA**: Claude API (claude-sonnet-4-6) con Tool Use
- **PDF**: WeasyPrint + Jinja2
- **Storage**: JSON files en disco (fase 1)
- **UI**: HTML + JS vanilla (sin framework, sin build step)

## Instalación

```bash
# 1. Entrar al directorio
cd "Disclover Guides/dg-editor"

# 2. Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate   # macOS/Linux
# .venv\Scripts\activate    # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env y añadir tu ANTHROPIC_API_KEY

# 5. Arrancar el servidor
uvicorn main:app --reload --port 8000
```

## Uso

- **UI del chatbot**: http://localhost:8000
- **API docs (OpenAPI)**: http://localhost:8000/docs

### Ejemplos de instrucciones al chatbot

```
"Añade el restaurante Disfrutar con precio €€€€ en la sección de Gastronomía"
"Desactiva la sección de Playas y Naturaleza"
"Reescribe la introducción de Gastronomía con un tono más local y directo"
"Cambia el estado de la guía a revisión"
"Adapta esta guía al perfil de nómadas digitales"
"¿Qué recomendados tenemos activos en Gastronomía?"
```

### Exportar PDF

Haz click en **⬇ Exportar PDF** en la cabecera de la UI o usa la API:

```bash
curl -X POST http://localhost:8000/api/v1/guides/barcelona-pais/export/pdf \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Estructura de carpetas

```
dg-editor/
├── main.py                  # FastAPI entry point
├── requirements.txt
├── .env                     # ANTHROPIC_API_KEY (no commitear)
├── app/
│   ├── api/                 # Endpoints REST
│   ├── core/                # Claude client + tool definitions + executor
│   ├── models/              # Pydantic models
│   ├── storage/             # JSON I/O + session store
│   └── pdf/                 # WeasyPrint renderer + helpers Jinja2
├── templates/               # Jinja2 HTML para PDFs
│   ├── base/                # Componentes reutilizables
│   └── tipos/               # pais.html, mundo.html, ...
├── static/css/              # CSS tokens, pdf-base, components
├── ui/index.html            # Chat UI (single file)
└── data/guides/             # Guías en JSON
    └── barcelona-pais/
        ├── guide.json       # Guía semilla de ejemplo
        └── history/         # Snapshots de versiones
```

## API Reference

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/guides` | Listar guías |
| GET | `/api/v1/guides/{id}` | Obtener guía completa |
| POST | `/api/v1/guides` | Crear guía nueva |
| PATCH | `/api/v1/guides/{id}/metadata` | Editar metadatos |
| POST | `/api/v1/chat/{guide_id}` | Chat (SSE streaming) |
| POST | `/api/v1/guides/{id}/export/pdf` | Generar PDF |
| GET | `/api/v1/guides/{id}/history` | Ver historial de cambios |
| POST | `/api/v1/guides/{id}/history/snapshot` | Crear snapshot manual |
| POST | `/api/v1/guides/{id}/history/restore/{v}` | Restaurar versión |

Ver documentación completa en `/docs`.

## Herramientas del chatbot (Claude Tools)

| Tool | Acción |
|------|--------|
| `toggle_section` | Activar/desactivar sección o subsección |
| `edit_section_content` | Reescribir contenido editorial |
| `add_recomendado` | Añadir lugar recomendado |
| `edit_recomendado` | Editar datos de un recomendado |
| `delete_recomendado` | Eliminar recomendado |
| `change_guide_metadata` | Cambiar título, estado, idioma |
| `adapt_to_profile` | Adaptar guía a perfil de viajero |

## Roadmap

### Fase 2
- [ ] SQLite/Postgres (reemplazar JSON files)
- [ ] Templates para nómadas, moteros, familias, luxury
- [ ] Fonts reales Disclover (Montserrat/Lora locales)
- [ ] Assets de marca: logo, paleta oficial
- [ ] Deploy en Railway

### Fase 3
- [ ] Generación de guías nuevas desde plantilla vía chat
- [ ] Actualización masiva de recomendados
- [ ] Integración con fuentes de datos externas (Google Maps, Tripadvisor)
- [ ] Multiidioma (EN, FR, PT)
- [ ] Gestión de assets visuales (imágenes de portada, mapas)
