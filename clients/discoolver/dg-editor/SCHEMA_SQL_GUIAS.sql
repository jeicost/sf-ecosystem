-- ============================================================================
-- SCHEMA: Tablas para el Sistema de Guías Discoolver
-- BBDD: discoolver (DigitalOcean MySQL)
-- ============================================================================

-- Tabla: GUIDE (la guía como documento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS guide (
  id                    CHAR(36)      PRIMARY KEY COMMENT 'UUID v4',
  city                  VARCHAR(100)  NOT NULL COMMENT 'Madrid, Barcelona, etc',
  year                  VARCHAR(4)    NOT NULL COMMENT 'Ej: 26, 25',
  edition               VARCHAR(200)  COMMENT 'Ej: Foodie Selection Madrid',
  guide_type            VARCHAR(20)   NOT NULL DEFAULT 'world'
    COMMENT 'world|local|collection|influencer|dossier',
  collection            VARCHAR(50)   DEFAULT 'estandar'
    COMMENT 'estandar|foodie-hoodie|travel-edition|etc',
  status                VARCHAR(20)   DEFAULT 'draft'
    COMMENT 'draft|review|published|archived',

  -- Director
  director              VARCHAR(200)  COMMENT 'Nombre del director/editor',
  director_role         VARCHAR(200)  COMMENT 'Rol (Ej: Editor in Chief)',

  -- Portada
  cover_headline1       VARCHAR(200)  COMMENT 'Primera línea portada (FOODIE)',
  cover_headline2       VARCHAR(200)  COMMENT 'Segunda línea portada (Selection)',
  cover_tagline         VARCHAR(300)  COMMENT 'Subtítulo portada',
  cover_photo_url       TEXT          COMMENT 'URL de foto de portada',
  cover_bg_color        VARCHAR(7)    DEFAULT '#1a1a1a' COMMENT 'Color fondo portada (#hex)',

  -- Colores de marca
  primary_color         VARCHAR(7)    DEFAULT '#C8006B' COMMENT 'Color primario (#hex)',
  accent_color          VARCHAR(7)    COMMENT 'Color accent (#hex)',

  -- Carta del director
  directors_letter      LONGTEXT      COMMENT 'Texto de la carta del director',
  director_photo_url    TEXT          COMMENT 'URL foto del director',
  director_pull_quote   VARCHAR(500)  COMMENT 'Cita destacada del director',
  mission_text          TEXT          COMMENT 'Misión/criterios de selección',
  criteria_list         JSON          COMMENT 'Array de {name, desc}',

  -- Persona del Año
  persona_name          VARCHAR(200)  COMMENT 'Nombre de la persona del año',
  persona_tagline       VARCHAR(300)  COMMENT 'Tagline de la persona',
  persona_photo_url     TEXT          COMMENT 'URL foto persona',
  persona_bio           TEXT          COMMENT 'Biografía',
  persona_quote         TEXT          COMMENT 'Cita famosa',
  persona_awards        JSON          COMMENT 'Array de premios',

  -- Config
  sections_config       JSON          COMMENT 'Config de secciones: {restaurantes: {enabled, page_number}, ...}',
  back_cover_config     JSON          COMMENT 'Config contraportada',

  -- Owner (para guías de influencers)
  owner_user_id         BIGINT        COMMENT 'FK users.id si es guía de influencer',

  -- Auditoría
  created_by            BIGINT        NOT NULL COMMENT 'FK users.id',
  created_at            DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_city_year (city, year),
  INDEX idx_status (status),
  INDEX idx_guide_type (guide_type),
  INDEX idx_owner (owner_user_id),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Guías de viaje Discoolver';


-- Tabla: GUIDE_ITEM (recomendados dentro de una guía)
-- ============================================================================
CREATE TABLE IF NOT EXISTS guide_item (
  id                    CHAR(36)      PRIMARY KEY COMMENT 'UUID v4',
  guide_id              CHAR(36)      NOT NULL COMMENT 'FK guide.id',

  -- Sección a la que pertenece
  section               VARCHAR(50)   NOT NULL
    COMMENT 'restaurantes|fiesta|ocio_eventos|arte_exposiciones|experiencias|alojamientos|shopping|influencers|top_saves|coollections|persona_recom|persona_timeline',

  -- Datos del recomendado
  name                  VARCHAR(300)  NOT NULL COMMENT 'Nombre del lugar/persona',
  tagline               VARCHAR(500)  COMMENT 'Descripción breve',
  description           LONGTEXT      COMMENT 'Descripción larga',
  photo_url             TEXT          COMMENT 'URL de foto principal',
  badge                 VARCHAR(50)   COMMENT 'WOW|ICÓNICO|LOCAL-OWNED|BEST-VIEW|HIDDEN-GEM',
  web                   VARCHAR(500)  COMMENT 'URL web del lugar',
  address               VARCHAR(500)  COMMENT 'Dirección física',
  discoolver_url        VARCHAR(500)  COMMENT 'URL en web Discoolver',
  subcategory           VARCHAR(100)  COMMENT 'Subcategoría (ej: japonesa, boutique)',

  -- Solo para influencers
  handle                VARCHAR(100)  COMMENT 'Handle en red social (@usuario)',
  platform              VARCHAR(20)   COMMENT 'instagram|tiktok|youtube',
  ig_followers          INT           COMMENT 'Número de followers',
  engagement_rate       DECIMAL(5,2)  COMMENT 'Tasa de engagement (%)',
  stats                 JSON          COMMENT 'Array de {label, value}',
  categories            JSON          COMMENT 'Array de categorías [MODA, LIFESTYLE, ...]',

  -- Persona del año / Timeline
  timeline_year         VARCHAR(10)   COMMENT 'Año en timeline',
  timeline_items        JSON          COMMENT 'Array de items timeline',

  -- Visibility y orden
  sort_order            INT           DEFAULT 0 COMMENT 'Orden dentro de la sección',
  enabled               TINYINT       DEFAULT 1 COMMENT '0=desactivado, 1=activo',

  -- Si fue importado del CMS
  cms_business_id       BIGINT        COMMENT 'FK a business en CMS si aplica',

  -- Auditoría
  created_at            DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_guide_item_guide FOREIGN KEY (guide_id)
    REFERENCES guide(id) ON DELETE CASCADE,

  INDEX idx_guide_section (guide_id, section),
  INDEX idx_section (section),
  INDEX idx_enabled (enabled),
  INDEX idx_cms_business (cms_business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Items/recomendados dentro de guías';


-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
/*

1. UUIDs: Los IDs se generan en el backend Java (UUID.randomUUID())

2. JSON fields: MySQL 5.7+ soporta nativo. Ejemplos:

   sections_config: {
     "restaurantes": {"enabled": true, "page_number": 11},
     "fiesta": {"enabled": false},
     "influencers": {"enabled": true, "page_number": 24}
   }

   persona_awards: [
     {name: "Michelin *", year: 2023},
     {name: "Mencia de Oro", year: 2022}
   ]

   stats: [
     {label: "Posts este año", value: "142"},
     {label: "Engagement promedio", value: "8.5%"}
   ]

3. Collation: utf8mb4_unicode_ci para emojis y caracteres especiales

4. created_by: Debe existir en tabla users

5. owner_user_id: NULL para guías internas, BIGINT para influencers

6. Constraints:
   - guide_item.guide_id → CASCADE DELETE (borrar guía borra items)
   - No hay FK a users aún (puedes añadirlo después si existe tabla users)

*/
