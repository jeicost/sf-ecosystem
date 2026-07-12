# API Contract — Endpoints `/cms/v2/guides`

**Versión:** 1.0  
**Backend:** Java Spring Boot  
**BBDD:** MySQL  
**Auth:** Token en header `Authorization: Bearer {token}`  

---

## Resumen de Endpoints

```
POST   /cms/v2/guides                              Crear guía
GET    /cms/v2/guides                              Listar guías (con filtros)
GET    /cms/v2/guides/{id}                         Obtener guía
PUT    /cms/v2/guides/{id}                         Actualizar guía
DELETE /cms/v2/guides/{id}                         Eliminar guía
POST   /cms/v2/guides/{id}/duplicate               Duplicar guía

GET    /cms/v2/guides/{id}/items                   Listar items (opcional: filtro section)
POST   /cms/v2/guides/{id}/items                   Crear item
PUT    /cms/v2/guides/{id}/items/{itemId}          Actualizar item
DELETE /cms/v2/guides/{id}/items/{itemId}          Eliminar item
POST   /cms/v2/guides/{id}/items/reorder           Reordenar items
POST   /cms/v2/guides/{id}/items/bulk              Crear múltiples items (opcional: replace_section)

GET    /cms/v2/guides/{id}/config                  Obtener config JSON para templates (publico)
POST   /cms/v2/guides/{id}/export                  Generar PDF (async o sync)
GET    /cms/v2/guides/{id}/media                   Listar archivos (fotos, etc)
POST   /cms/v2/guides/{id}/media                   Subir archivo
DELETE /cms/v2/guides/{id}/media/{assetId}         Eliminar archivo

POST   /cms/v2/import/excel                        Importar guía desde Excel
GET    /cms/v2/import/template                     Descargar plantilla Excel
```

---

## Autenticación

### Header obligatorio
```
Authorization: Bearer {token}
CMSAuthorization: {token}  (alternativa legacy, si aplica)
```

### Validación
- 401 Unauthorized → Token ausente o inválido
- 403 Forbidden → Usuario no tiene permiso para la acción (ej: editor externo editando guía de otro)

---

## Endpoints Detallados

### 1️⃣ POST `/cms/v2/guides` — Crear guía

**Descripción:** Crea una nueva guía (inicialmente en draft)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "city": "Madrid",
  "year": "26",
  "edition": "Foodie Selection 2026",
  "guide_type": "local",
  "collection": "foodie-hoodie",
  "director": "Carlos Jacoste",
  "director_role": "CEO & Fundador",
  "primary_color": "#C8006B",
  "accent_color": "#F94E1F",
  
  "cover_headline1": "FOODIE",
  "cover_headline2": "Selection",
  "cover_tagline": "Los mejores restaurantes de Madrid",
  "cover_photo_url": "https://...",
  "cover_bg_color": "#1a1a1a",
  
  "directors_letter": "Querido lector...",
  "director_photo_url": "https://...",
  "mission_text": "Seleccionamos los mejores...",
  "criteria_list": [
    {"name": "Innovación", "desc": "Técnica culinaria excepcional"},
    {"name": "Sostenibilidad", "desc": "Compromiso ambiental"}
  ],
  
  "persona_name": "María García",
  "persona_tagline": "La influencer del año",
  "persona_photo_url": "https://...",
  "persona_bio": "Influencer de lifestyle...",
  "persona_quote": "Discoolver es mi guía...",
  
  "sections_config": {
    "restaurantes": {"enabled": true, "page_number": "11"},
    "fiesta": {"enabled": false},
    "influencers": {"enabled": true, "page_number": "24"}
  }
}
```

**Campos opcionales:** Todos excepto `city`, `year`, `guide_type`

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "city": "Madrid",
  "year": "26",
  "edition": "Foodie Selection 2026",
  "status": "draft",
  "guide_type": "local",
  "collection": "foodie-hoodie",
  "created_by": 123,
  "created_at": "2026-05-15T10:30:00Z",
  "updated_at": "2026-05-15T10:30:00Z",
  "items_count": 0,
  
  "director": "Carlos Jacoste",
  "director_role": "CEO & Fundador",
  "primary_color": "#C8006B",
  "accent_color": "#F94E1F",
  "cover_headline1": "FOODIE",
  "cover_headline2": "Selection",
  "cover_tagline": "Los mejores restaurantes de Madrid",
  "cover_photo_url": "https://...",
  "cover_bg_color": "#1a1a1a",
  "directors_letter": "Querido lector...",
  "director_photo_url": "https://...",
  "mission_text": "Seleccionamos los mejores...",
  "criteria_list": [...]
}
```

**Errores:**
- 400 Bad Request → Campos requeridos faltantes
- 401 Unauthorized → Sin token o token inválido

---

### 2️⃣ GET `/cms/v2/guides` — Listar guías

**Query Params:**
```
?q=madrid               // Buscar por ciudad o edition
?status=draft           // Filtrar por estado: draft|review|published|archived
?collection=foodie     // Filtrar por colección
?guide_type=local      // Filtrar por tipo: world|local|collection|influencer|dossier
?limit=20              // Paginación (default 100)
?offset=0              // Paginación
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "city": "Madrid",
    "year": "26",
    "edition": "Foodie Selection 2026",
    "status": "draft",
    "guide_type": "local",
    "items_count": 12,
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z"
  },
  ...
]
```

---

### 3️⃣ GET `/cms/v2/guides/{id}` — Obtener guía completa

**Response (200 OK):** Igual a respuesta de POST/PUT (todos los campos)

**Errores:**
- 404 Not Found → Guía no existe

---

### 4️⃣ PUT `/cms/v2/guides/{id}` — Actualizar guía

**Request Body:** Cualquier campo parcial (solo los que se van a cambiar)

```json
{
  "status": "review",
  "director": "Nuevo Director",
  "primary_color": "#FF0000"
}
```

**Response (200 OK):** Guía actualizada completa

---

### 5️⃣ DELETE `/cms/v2/guides/{id}` — Eliminar guía

**Response:** 204 No Content

**Nota:** Borra también todos los items asociados (CASCADE)

---

### 6️⃣ POST `/cms/v2/guides/{id}/duplicate` — Duplicar guía

**Request Body (opcional):**
```json
{
  "new_city": "Barcelona",
  "new_year": "27"
}
```

**Response (201 Created):** Guía duplicada con nuevo ID y ciudad/año

---

### 7️⃣ GET `/cms/v2/guides/{id}/items` — Listar items (recomendados)

**Query Params:**
```
?section=restaurantes          // Filtrar por sección
?enabled_only=true             // Solo items activos
?sort_by=sort_order            // Campo de orden (default sort_order)
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "guide_id": "uuid",
    "section": "restaurantes",
    "name": "DiverXO",
    "tagline": "3 estrellas Michelin",
    "description": "Fusión asiática-española en ambiente explosivo.",
    "photo_url": "https://...",
    "badge": "WOW",
    "web": "https://diverxo.com",
    "address": "NH Eurobuilding, Chamartín, Madrid",
    "discoolver_url": "https://discoolver.com/place/...",
    "subcategory": "Moderna",
    
    "handle": "@diverxo_david",
    "platform": "instagram",
    "ig_followers": 50000,
    "engagement_rate": 8.5,
    "stats": [
      {"label": "Posts en 2026", "value": "142"},
      {"label": "Engagement", "value": "8.5%"}
    ],
    "categories": ["GASTRONOMÍA", "INFLUENCER"],
    
    "timeline_year": "2020",
    "timeline_items": [
      {"title": "Apertura DiverXO Madrid", "desc": "..."}
    ],
    
    "sort_order": 0,
    "enabled": true,
    "cms_business_id": 100,
    "created_at": "2026-05-15T10:30:00Z",
    "updated_at": "2026-05-15T10:30:00Z"
  }
]
```

---

### 8️⃣ POST `/cms/v2/guides/{id}/items` — Crear item

**Request Body:**
```json
{
  "section": "restaurantes",
  "name": "DiverXO",
  "tagline": "3 estrellas Michelin",
  "description": "Fusión asiática-española...",
  "photo_url": "https://...",
  "badge": "WOW",
  "web": "https://diverxo.com",
  "address": "NH Eurobuilding, Chamartín",
  "discoolver_url": "https://discoolver.com/...",
  "subcategory": "Moderna",
  "sort_order": 0,
  "enabled": true
}
```

**Campos requeridos:** `section`, `name`  
**Campos opcionales:** Todo lo demás  
**Default:** `enabled=true`, `sort_order=0`

**Response (201 Created):** Item creado

---

### 9️⃣ PUT `/cms/v2/guides/{id}/items/{itemId}` — Actualizar item

**Request Body:** Cualquier campo parcial

**Response (200 OK):** Item actualizado

---

### 🔟 DELETE `/cms/v2/guides/{id}/items/{itemId}` — Eliminar item

**Response:** 204 No Content

---

### 1️⃣1️⃣ POST `/cms/v2/guides/{id}/items/reorder` — Reordenar items

**Request Body:**
```json
[
  {"id": "item-uuid-1", "sort_order": 0},
  {"id": "item-uuid-2", "sort_order": 1},
  {"id": "item-uuid-3", "sort_order": 2}
]
```

**Response (200 OK):**
```json
{"ok": true}
```

---

### 1️⃣2️⃣ POST `/cms/v2/guides/{id}/items/bulk` — Crear múltiples items

**Query Params:**
```
?replace_section=restaurantes    // Opcional: borra todos los items de esa sección primero
```

**Request Body:** Array de items (igual estructura que crear 1 item)

```json
[
  {"section": "restaurantes", "name": "DiverXO", ...},
  {"section": "restaurantes", "name": "La Tasquería", ...},
  {"section": "restaurantes", "name": "Coque", ...}
]
```

**Response (201 Created):** Array de items creados

---

### 1️⃣3️⃣ GET `/cms/v2/guides/{id}/config` — Config JSON para templates

**Auth:** NO requerida (público para templates HTML)

**Response (200 OK):** JSON que los templates HTML esperan:

```json
{
  "city": "Madrid",
  "year": "26",
  "edition": "Foodie Selection 2026",
  "director": "Carlos Jacoste",
  "primaryColor": "#C8006B",
  "accentColor": "#F94E1F",
  "coverHeadline1": "FOODIE",
  "coverHeadline2": "Selection",
  "coverTagline": "Los mejores restaurantes de Madrid",
  "coverPhoto": "https://...",
  "coverBgColor": "#1a1a1a",
  
  "directorsLetter": "Querido lector...",
  "directorRole": "CEO & Fundador",
  "directorPhoto": "https://...",
  "criteriaList": [...],
  "missionText": "Seleccionamos los mejores...",
  
  "personaDelAno": {
    "name": "María García",
    "tagline": "La influencer del año",
    "photo": "https://...",
    "bio": "Influencer de lifestyle...",
    "quote": "Discoolver es mi guía...",
    "awards": [],
    "timeline": [{"year": "2020", "items": [...]}],
    "recomendados": [...]
  },
  
  "sections": {
    "restaurantes": {
      "enabled": true,
      "pageNumber": 11,
      "items": [
        {
          "name": "DiverXO",
          "tagline": "3 estrellas Michelin",
          "description": "...",
          "photo": "https://...",
          "badge": "WOW",
          "web": "https://...",
          "address": "...",
          "discoolverUrl": "https://..."
        }
      ]
    },
    "fiesta": {"enabled": false, "pageNumber": null, "items": []},
    "influencers": {...}
  },
  
  "influencers": [
    {
      "name": "Carlos Jacoste",
      "handle": "@carlosjacoste",
      "platform": "instagram",
      "city": "Madrid",
      "description": "Fundador Discoolver",
      "photo": "https://...",
      "stats": [],
      "categories": ["TECH", "LIFESTYLE"]
    }
  ],
  
  "topSaves": [],
  "coollections": [
    {
      "style": "Travel Style",
      "items": [...]
    }
  ],
  
  "siteUrl": "discoolver.com"
}
```

**Nota:** Este endpoint es CRÍTICO. Los 20 templates HTML en `/design/` lo llaman directamente:
```html
<script src="https://api.discoolver.com/cms/v2/guides/550e8400.../config"></script>
```

---

### 1️⃣4️⃣ POST `/cms/v2/guides/{id}/export` — Generar PDF

**Request Body (opcional):**
```json
{
  "format": "pdf",
  "async": true
}
```

**Response (200 OK) — modo sync:**
```json
{
  "url": "/exports/madrid-26.pdf",
  "format": "pdf",
  "size_bytes": 2048000,
  "generated_at": "2026-05-15T10:30:00Z"
}
```

**Response (202 Accepted) — modo async:**
```json
{
  "job_id": "uuid-export-job",
  "status": "processing",
  "estimated_seconds": 30
}
```

**Nota:** El PDF se genera llamando a un renderer (WeasyPrint o similar). Puede ser microservicio separado.

---

## Mapeo: Editor ↔ BBDD

| Campo en Editor | Campo BBDD | Tipo | Notas |
|-----------------|-----------|------|-------|
| `guide.title` | `guide.edition` | string | Título de la guía |
| `guide.city` | `guide.city` | string | Ciudad |
| `guide.year` | `guide.year` | varchar(4) | "26", "25", etc |
| `guide.status` | `guide.status` | enum | draft\|review\|published\|archived |
| `guide.collection` | `guide.collection` | string | estandar\|foodie\|travel\|etc |
| `item.name` | `guide_item.name` | string | Nombre del recomendado |
| `item.badge` | `guide_item.badge` | string | WOW\|ICÓNICO\|LOCAL-OWNED\|etc |
| `item.section` | `guide_item.section` | string | restaurantes\|fiesta\|influencers\|etc |

---

## Códigos de Error

| Código | Significado | Ejemplos |
|--------|-------------|----------|
| 200 | OK | GET, POST con creación |
| 201 | Created | POST, PUT de creación |
| 204 | No Content | DELETE |
| 400 | Bad Request | Campos inválidos, formato JSON incorrecto |
| 401 | Unauthorized | Sin token, token expirado, inválido |
| 403 | Forbidden | Usuario sin permisos (editor externo en guía ajena) |
| 404 | Not Found | Guía/item no existe |
| 409 | Conflict | Duplicado (ej: crear guía con city+year existente) |
| 500 | Server Error | Bug en backend |

---

## Ejemplo: Crear guía + items completo

```bash
# 1. Crear guía
curl -X POST http://localhost:5002/cms/v2/guides \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Madrid",
    "year": "26",
    "edition": "Foodie Selection",
    "guide_type": "local"
  }'

# Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "city": "Madrid",
  "year": "26",
  ...
}

# 2. Crear items
curl -X POST http://localhost:5002/cms/v2/guides/550e8400-e29b-41d4-a716-446655440000/items \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{
    "section": "restaurantes",
    "name": "DiverXO",
    "tagline": "3 estrellas Michelin"
  }'

# 3. Obtener config para templates
curl http://localhost:5002/cms/v2/guides/550e8400-e29b-41d4-a716-446655440000/config

# 4. Generar PDF
curl -X POST http://localhost:5002/cms/v2/guides/550e8400-e29b-41d4-a716-446655440000/export \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{"format": "pdf"}'
```

---

## Notas Finales

1. **UUIDs:** Todos los IDs se generan en el backend (UUID v4)
2. **Timestamps:** SISTEMP.ISO 8601 formato (`2026-05-15T10:30:00Z`)
3. **JSON fields:** MySQL soporta nativo
4. **Validación:** El editor NO valida; confía en que el backend valida
5. **Paginación:** Implementar `limit` + `offset` en GET /guides
6. **Rate Limiting:** (Opcional) Implementar después de MVP
