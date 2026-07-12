# Discoolver Guide Editor — Dev Setup

> Documentación para el equipo de desarrollo.  
> **Arquitectura objetivo:** Editor React integrado en `cms.discoolver.com`, backend en `api.discoolver.com`.

---

## Arranque rápido

```bash
# Clonar + instalar
git clone git@github.com:discoolver-group/discoolver-dg-editor.git
cd discoolver-dg-editor

# Instalar dependencias del mock y del editor
cd mock-api && npm install && cd ..
cd editor && npm install && cd ..

# Arrancar TODO en un comando (mock + editor)
./start-dev.sh mock
```

Eso es todo. Abre `http://localhost:5174/editor/` en el navegador.

---

## Modos de desarrollo

| Comando | Backend | Puerto editor | Cuándo usar |
|---------|---------|---------------|-------------|
| `./start-dev.sh mock`    | Mock API (local) | :5174 | Desarrollo sin depender de Diego |
| `./start-dev.sh fastapi` | FastAPI + SQLite  | :5174 | Pruebas locales con Python |
| `npm run dev:spring` (en `editor/`) | `api.discoolver.com` | :5174 | Integración real con Spring Boot |

---

## Arquitectura actual (en desarrollo)

```
                   MOCK MODE
┌─────────────────────────────────────────┐
│                                         │
│   Browser :5174/editor/                 │
│   └── React Editor (Vite)               │
│       ├── /api/*   ──proxy──► :3100     │
│       ├── /design/*──proxy──► :3100     │
│       └── /static/*──proxy──► :3100     │
│                                         │
│   Mock API :3100  (Node/Express)        │
│   ├── GET  /cms/v2/guides               │
│   ├── GET  /cms/v2/guides/:id/items     │
│   ├── GET  /cms/v2/guides/:id/config    │
│   ├── GET  /cms/v2/cms/cities           │
│   ├── GET  /design/*  (templates HTML)  │
│   └── ... 30+ endpoints                 │
│                                         │
└─────────────────────────────────────────┘

                ARQUITECTURA OBJETIVO
┌─────────────────────────────────────────┐
│                                         │
│   cms.discoolver.com/herramientas/guias │
│   └── React Editor (Next.js section)   │
│       └── usa CMSAuthorization token   │
│                                         │
│   api.discoolver.com/cms/v2/guides      │
│   (Spring Boot — implementado por Diego)│
│                                         │
└─────────────────────────────────────────┘
```

---

## Qué tiene el Mock API

El mock en `mock-api/` simula **todos** los endpoints que necesita el editor:

- **Guías** — CRUD completo (GET/POST/PUT/PATCH/DELETE + duplicate)
- **Items** — CRUD + bulk + reorder
- **Secciones** — GET config + PATCH enable/disable + page number
- **Media** — stubs con URLs placeholder (upload real usa R2 vía FastAPI)
- **CMS Bridge** — ciudades, categorías, búsqueda, preview de negocio
- **AI Editorial** — stubs de generate/suggest/accept
- **Export** — config JSON para templates (funciona de verdad) + PDF stub
- **Auth** — token mock que acepta cualquier credencial
- **Templates HTML** — sirve los 20 templates de `/design/` como estático
- **Instagram** — stubs mínimos para que no rompa

### Datos de prueba (seed desde SQLite)

```
5 guías:  MADRID (local), GLOBAL (world), MADRID (collection), ESPAÑA (influencer), GLOBAL (influencer)
63 items: distribuidos en las 5 guías
```

---

## Variables de entorno del editor

| Archivo | `VITE_API_BASE` | Cuándo usar |
|---------|-----------------|-------------|
| `.env` (default) | `http://localhost:8000/api` | FastAPI local |
| `.env.mock` | `http://localhost:3100/cms` | Mock API |
| `.env.spring` | `https://api.discoolver.com/cms` | Spring Boot real |

---

## Integración en cms.discoolver.com (cuando Diego tenga los endpoints)

### Opción A — Sección Next.js nativa (recomendada)

```typescript
// pages/herramientas/guias/[[...slug]].tsx
// El editor React se porta como componente Next.js
// Token: se pasa via window.DISCOOLVER_TOKEN antes de montar
```

### Opción B — Iframe embebido (más rápido de implementar)

```html
<!-- En cms.discoolver.com -->
<iframe
  src="https://editor.discoolver.com/editor/?cms_token=TOKEN_DEL_CMS"
  width="100%" height="100vh"
/>
```

El editor ya soporta `?cms_token=TOKEN` — detecta el param, lo almacena y omite el login propio.

### Control de acceso por rol

```
editor_interno → acceso total (CRUD + export + AI)
influencer     → solo ve SU guía asignada (owner_user_id = su id)
destino        → read-only de guías de su ciudad
recomendado    → read-only de guías donde aparece
```

---

## Migración de datos

Las guías actuales (SQLite local) están exportadas en:
```
mock-api/data/migration_for_diego.json
```

Contiene 5 guías + 63 items en el formato exacto de las tablas `guide` y `guide_item`.
Cuando Diego tenga la API lista, se importan via `POST /cms/v2/guides` + `POST /cms/v2/guides/:id/items`.

---

## Pendiente de Diego (Spring Boot)

Ver `PARA_DIEGO_GUIAS_V2.md` para el spec completo con:
- Schema MySQL de tablas `guide` y `guide_item`  
- Listado completo de 10 endpoints a implementar
- Control de acceso por rol
- Fix de los endpoints `/city`, `/category`, `/business` que dan 500 con usuario `atenea / Discoolcms1!`
