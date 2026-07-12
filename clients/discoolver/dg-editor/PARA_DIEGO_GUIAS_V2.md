# Arquitectura Guías Discoolver — Integración en CMS
**Para:** Diego (CTO / backend)  
**De:** Carlos  
**Fecha:** Mayo 2026  
**Reemplaza:** PARA_DIEGO_CTO.md

---

## Decisión de arquitectura

El editor de guías **pasa a ser una sección del CMS** (`cms.discoolver.com`) sin base de datos propia.

```
ANTES:
  FastAPI independiente + SQLite/PostgreSQL propio
  → guías almacenadas en BD separada del CMS

AHORA:
  React integrado en cms.discoolver.com
  → guías almacenadas en api.discoolver.com (Spring Boot + tu BD)
  → auth compartida con el CMS (mismo token CMSAuthorization)
  → sin servidor intermedio, sin BD extra
```

---

## Lo que necesitas añadir a `api.discoolver.com`

### 1. Tablas nuevas en tu BD (MySQL)

**`guide` — La guía como documento**

```sql
CREATE TABLE guide (
  id            CHAR(36)     PRIMARY KEY,   -- UUID generado en el backend Java
  city          VARCHAR(100) NOT NULL,
  year          VARCHAR(4)   NOT NULL,       -- ej. "26"
  edition       VARCHAR(200),
  guide_type    VARCHAR(20)  NOT NULL DEFAULT 'world',
                -- world | local | collection | influencer | dossier
  collection    VARCHAR(50)  DEFAULT 'estandar',
  status        VARCHAR(20)  DEFAULT 'draft',
                -- draft | review | published | archived
  director      VARCHAR(200),
  director_role VARCHAR(200),

  -- Colores
  primary_color  VARCHAR(7) DEFAULT '#C8006B',
  accent_color   VARCHAR(7),

  -- Portada
  cover_headline1    VARCHAR(200),
  cover_headline2    VARCHAR(200),
  cover_tagline      VARCHAR(300),
  cover_photo_url    TEXT,
  cover_bg_color     VARCHAR(7) DEFAULT '#1a1a1a',

  -- Carta del director
  directors_letter   TEXT,
  director_photo_url TEXT,
  director_pull_quote TEXT,
  mission_text       TEXT,
  criteria_list      JSON,   -- [{name, desc}]

  -- Persona del Año
  persona_name       VARCHAR(200),
  persona_tagline    VARCHAR(300),
  persona_photo_url  TEXT,
  persona_bio        TEXT,
  persona_quote      TEXT,
  persona_awards     JSON,

  -- Config de secciones activas + número de página
  -- {"restaurantes": {"enabled": true, "page_number": "11"}, ...}
  sections_config    JSON,

  -- Config contraportada
  back_cover_config  JSON,

  -- Influencer propietario de esta guía (NULL = guía interna del equipo)
  owner_user_id  BIGINT,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Auditoría
  created_by     BIGINT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**`guide_item` — Recomendado dentro de una guía**

```sql
CREATE TABLE guide_item (
  id          CHAR(36)    PRIMARY KEY,   -- UUID generado en el backend Java
  guide_id    CHAR(36)    NOT NULL,
  FOREIGN KEY (guide_id) REFERENCES guide(id) ON DELETE CASCADE,

  -- Sección a la que pertenece
  section     VARCHAR(50) NOT NULL,
  -- restaurantes | fiesta | ocio_eventos | arte_exposiciones
  -- experiencias | alojamientos | shopping | influencers
  -- top_saves | coollections | persona_recom | persona_timeline

  -- Datos del lugar/persona
  name           VARCHAR(300),
  tagline        VARCHAR(500),
  description    TEXT,
  photo_url      TEXT,
  badge          VARCHAR(50),    -- WOW | ICÓNICO | LOCAL-OWNED | BEST VIEW...
  web            VARCHAR(500),
  address        VARCHAR(500),
  discoolver_url VARCHAR(500),
  subcategory    VARCHAR(100),   -- para coollections: travel style

  -- Solo para influencers
  handle           VARCHAR(100),
  platform         VARCHAR(20),  -- instagram | tiktok | youtube
  ig_followers     INT,
  engagement_rate  DECIMAL(5,2),
  stats            JSON,         -- [{label, value}]
  categories       JSON,         -- ["MODA", "LIFESTYLE"]

  -- Solo para persona del año / timeline
  timeline_year  VARCHAR(10),
  timeline_items JSON,

  -- Orden y visibilidad
  sort_order  INT     DEFAULT 0,
  enabled     TINYINT DEFAULT 1,

  -- Si fue importado del CMS, guardamos su ID para no duplicar
  cms_business_id BIGINT,

  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_guide_section (guide_id, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 2. Endpoints nuevos en Spring Boot

Todos bajo `/cms/v2/guides`. Auth: mismo header `CMSAuthorization` que ya usáis.

```
── GUÍAS ─────────────────────────────────────────────────────
GET    /cms/v2/guides                    Lista guías (filtros: city, status, type, owner)
POST   /cms/v2/guides                    Crear guía
GET    /cms/v2/guides/{id}               Ver guía completa
PUT    /cms/v2/guides/{id}               Actualizar metadata de guía
DELETE /cms/v2/guides/{id}               Eliminar (solo admin/editor)
POST   /cms/v2/guides/{id}/duplicate     Duplicar guía

── ITEMS (recomendados dentro de la guía) ────────────────────
GET    /cms/v2/guides/{id}/items                 Lista items (filtro: section)
POST   /cms/v2/guides/{id}/items                 Añadir item
PUT    /cms/v2/guides/{id}/items/{itemId}         Actualizar item
DELETE /cms/v2/guides/{id}/items/{itemId}         Eliminar item
POST   /cms/v2/guides/{id}/items/reorder         Reordenar (body: [{id, sort_order}])

── EXPORTACIÓN ───────────────────────────────────────────────
GET    /cms/v2/guides/{id}/config        Config JSON para los templates HTML
POST   /cms/v2/guides/{id}/export/pdf    Genera PDF (llama al renderer)
```

**Ejemplo de respuesta `GET /cms/v2/guides`:**
```json
[
  {
    "id": "uuid",
    "city": "MADRID",
    "year": "26",
    "guide_type": "local",
    "collection": "foodie-hoodie",
    "status": "draft",
    "items_count": 12,
    "updated_at": "2026-05-13T..."
  }
]
```

**Ejemplo de respuesta `GET /cms/v2/guides/{id}/config`:**  
Este es el endpoint más crítico — los templates HTML lo llaman directamente para renderizar las páginas.
```json
{
  "city": "Madrid",
  "year": "26",
  "edition": "Los mejores restaurantes de Madrid",
  "primaryColor": "#6366F1",
  "accentColor": "#C8006B",
  "coverHeadline1": "FOODIE",
  "coverHeadline2": "Selection",
  "coverPhoto": "https://...",
  "sections": {
    "restaurantes": {
      "enabled": true,
      "pageNumber": "11",
      "items": [
        {
          "name": "DiverXO",
          "tagline": "3 estrellas Michelin",
          "description": "...",
          "photo": "https://...",
          "badge": "WOW",
          "address": "NH Eurobuilding, Chamartín"
        }
      ]
    }
  },
  "influencers": [],
  "topSaves": [],
  "coollections": []
}
```

---

### 3. Control de acceso por rol

Los roles que ya tenéis en el CMS mapeados a permisos del editor:

| Rol CMS | Puede en guías |
|---------|---------------|
| `editor_interno` | CRUD completo, exportar, cambiar status |
| `influencer` | Ver y editar SU guía asignada (owner_user_id = su id), subir fotos |
| `destino` | Ver guías de su ciudad (read-only) |
| `recomendado` | Ver guías donde aparece su negocio (read-only) |

Implementación sugerida: en cada endpoint verificar el rol del token `CMSAuthorization` y filtrar/denegar según la tabla.

---

### 4. Importar desde el CMS existente (Tab CMS del editor)

El editor tiene un tab para importar recomendados directamente desde la BBDD del CMS. Cuando los endpoints de listado estén operativos, el flujo es:

1. Editor filtra por ciudad + categoría
2. `GET /cms/v1/business?language=es&city=madrid&category=restaurantes` → lista
3. Editor selecciona los que quiere → `POST /cms/v2/guides/{id}/items` con los datos mapeados + `cms_business_id`

Los endpoints que actualmente dan 500 (necesitamos que funcionen):
```
GET /cms/v1/city/{lang}
GET /cms/v1/category/{lang}
GET /cms/v1/business?language={lang}&...filtros
```
**Usuario que usamos:** `atenea` / `Discoolcms1!`

---

### 5. Exportación PDF

El PDF lo genera un renderer HTML → PDF (actualmente WeasyPrint/Playwright). Puede ser:

**Opción simple:** El CMS llama a un endpoint del renderer que siga existiendo como microservicio internal (sin FastAPI completo, solo el renderer).

**Opción integrada:** El Spring Boot hace un `HTTP POST` al renderer con el config JSON y recibe el PDF binario para servírselo al cliente.

Recomendamos **Opción simple** mientras avanzáis — el renderer es el componente más complejo de portar a Java.

---

## Lo que hacemos nosotros (frontend)

Una vez que tengas los endpoints disponibles:

1. Portamos el editor React a una sección de `cms.discoolver.com` — una ruta tipo `/herramientas/guias`
2. El auth usa el token del CMS directamente (sin login propio)
3. Todas las llamadas a la API van a `api.discoolver.com/cms/v2/guides/...`
4. Los templates HTML (los 20 archivos de `/design/`) siguen siendo estáticos y llaman a `/cms/v2/guides/{id}/config`

---

## Orden de trabajo sugerido

```
Semana 1 (Diego)
  ✅ Tablas guide + guide_item en BD
  ✅ CRUD básico: GET/POST/PUT/DELETE /cms/v2/guides
  ✅ CRUD items: GET/POST/PUT/DELETE /cms/v2/guides/{id}/items
  ✅ GET /cms/v2/guides/{id}/config (formato JSON de arriba)

Semana 2 (Diego)
  ✅ Control de acceso por rol
  ✅ Fix endpoints listado: /city, /category, /business (los que dan 500)
  ✅ POST /cms/v2/guides/{id}/export/pdf

Semana 2 (Carlos/equipo frontend)
  ✅ Portar editor React a sección de cms.discoolver.com
  ✅ Adaptar llamadas API al nuevo schema
  ✅ Integrar con sistema de roles del CMS
```

---

## Preguntas que necesitamos responder antes de empezar

1. ¿Usáis PostgreSQL o MySQL en producción? (para adaptar el SQL de arriba)
2. ¿Los roles que mencioné (`editor_interno`, `influencer`, `destino`, `recomendado`) coinciden con los que tenéis en el CMS o tienen nombres distintos?
3. ¿El renderer PDF puede ser un microservicio separado al que el Spring Boot llama, o preferís que todo esté en Java?
4. ¿Qué usuario/rol tiene acceso a los endpoints `/cms/v1/business`, `/city`, `/category`? (los que dan 500 con `atenea`)
