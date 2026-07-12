# Request Objects — DTOs para Endpoints Java

**Para:** Diego (Backend)  
**Propósito:** Modelos exactos para request body en cada POST/PUT  
**Formato:** JSON schema + Java class sugerido

---

## 1. CreateGuideRequest — POST `/cms/v2/guides`

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
  "cover_tagline": "Los mejores restaurantes",
  "cover_photo_url": null,
  "cover_bg_color": "#1a1a1a",
  "cover_tint_opacity": 0.3,
  "headline_align": "right",
  
  "directors_letter": "Querido lector...",
  "director_photo_url": null,
  "director_pull_quote": "La gastronomía es...",
  "director_signature": "— Carlos",
  "mission_text": "Seleccionamos lugares...",
  "criteria_list": [
    {"name": "Innovación", "desc": "Técnica culinaria excepcional"},
    {"name": "Sostenibilidad", "desc": "Compromiso ambiental"}
  ],
  
  "persona_name": "María García",
  "persona_tagline": "La influencer del año",
  "persona_photo_url": null,
  "persona_body_photo_url": null,
  "persona_bio": "Influencer de lifestyle...",
  "persona_quote": "Discoolver es mi guía",
  "persona_awards": [
    {"name": "Michelin *", "year": 2023}
  ],
  
  "sections_config": {
    "restaurantes": {"enabled": true, "page_number": "11"},
    "fiesta": {"enabled": true, "page_number": "18"},
    "influencers": {"enabled": true, "page_number": "44"}
  },
  "back_cover_config": {},
  "ad_config": {},
  "site_url": "discoolver.com"
}
```

**Java DTO:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGuideRequest {
  @NotBlank
  private String city;
  
  @NotBlank
  private String year;
  
  private String edition;
  
  @NotBlank
  @Pattern(regexp = "world|local|collection|influencer|dossier")
  private String guide_type;
  
  private String collection;
  private String status; // draft, review, published, archived
  
  private String director;
  private String director_role;
  
  private String primary_color;
  private String accent_color;
  
  private String cover_headline1;
  private String cover_headline2;
  private String cover_tagline;
  private String cover_photo_url;
  private String cover_bg_color;
  private Double cover_tint_opacity;
  private String headline_align;
  
  private String directors_letter;
  private String director_photo_url;
  private String director_pull_quote;
  private String director_signature;
  private String mission_text;
  
  @JsonProperty("criteria_list")
  private List<Map<String, String>> criteriaList;
  
  private String persona_name;
  private String persona_tagline;
  private String persona_photo_url;
  private String persona_body_photo_url;
  private String persona_bio;
  private String persona_quote;
  
  @JsonProperty("persona_awards")
  private List<Map<String, Object>> personaAwards;
  
  @JsonProperty("sections_config")
  private Map<String, Object> sectionsConfig;
  
  @JsonProperty("back_cover_config")
  private Map<String, Object> backCoverConfig;
  
  @JsonProperty("ad_config")
  private Map<String, Object> adConfig;
  
  private String site_url;
}
```

---

## 2. UpdateGuideRequest — PUT `/cms/v2/guides/{id}`

**Igual a CreateGuideRequest pero TODOS los campos son opcionales:**

```json
{
  "status": "review",
  "director": "Nuevo Director",
  "primary_color": "#FF0000"
}
```

```java
@Data
public class UpdateGuideRequest {
  private String city;
  private String year;
  private String edition;
  private String guide_type;
  private String collection;
  private String status;
  
  private String director;
  private String director_role;
  
  private String primary_color;
  private String accent_color;
  
  // ... resto igual a CreateGuideRequest pero sin @NotBlank/@NotNull
  // La lógica en el servicio: if (field != null) update(field)
}
```

---

## 3. CreateGuideItemRequest — POST `/cms/v2/guides/{id}/items`

```json
{
  "section": "restaurantes",
  "name": "DiverXO",
  "tagline": "3 estrellas Michelin",
  "description": "Fusión asiática-española en ambiente explosivo.",
  "photo_url": "https://...",
  "badge": "WOW",
  "web": "https://diverxo.com",
  "address": "NH Eurobuilding, Chamartín, Madrid",
  "discoolver_url": "https://discoolver.com/...",
  "subcategory": "Moderna",
  
  "handle": "@diverxo_david",
  "platform": "instagram",
  "ig_followers": 50000,
  "engagement_rate": 8.5,
  "stats": [
    {"label": "Posts en 2026", "value": "142"}
  ],
  "categories": ["GASTRONOMÍA", "INFLUENCER"],
  
  "timeline_year": "2020",
  "timeline_items": [
    {"title": "Apertura", "desc": "..."}
  ],
  
  "sort_order": 0,
  "enabled": true,
  "cms_business_id": 100
}
```

**Java DTO:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGuideItemRequest {
  @NotBlank
  private String section; // restaurantes, fiesta, influencers, etc
  
  @NotBlank
  private String name;
  
  private String tagline;
  private String description;
  private String photo_url;
  private String badge; // WOW, ICÓNICO, LOCAL-OWNED, etc
  private String web;
  private String address;
  private String discoolver_url;
  private String subcategory;
  
  // Para influencers
  private String handle;
  private String platform; // instagram, tiktok, youtube
  private Integer ig_followers;
  private Double engagement_rate;
  
  @JsonProperty("stats")
  private List<Map<String, String>> stats;
  
  @JsonProperty("categories")
  private List<String> categories;
  
  // Para timeline
  private String timeline_year;
  
  @JsonProperty("timeline_items")
  private List<Map<String, String>> timelineItems;
  
  @Builder.Default
  private Integer sort_order = 0;
  
  @Builder.Default
  private Boolean enabled = true;
  
  private Long cms_business_id;
}
```

---

## 4. UpdateGuideItemRequest — PUT `/cms/v2/guides/{id}/items/{itemId}`

**Igual a CreateGuideItemRequest pero TODOS opcionales:**

```json
{
  "tagline": "Nueva descripción",
  "badge": "ICÓNICO"
}
```

```java
@Data
public class UpdateGuideItemRequest {
  private String section;
  private String name;
  private String tagline;
  private String description;
  // ... resto igual pero sin @NotBlank
}
```

---

## 5. ReorderItemsRequest — POST `/cms/v2/guides/{id}/items/reorder`

```json
[
  {"id": "uuid-1", "sort_order": 0},
  {"id": "uuid-2", "sort_order": 1},
  {"id": "uuid-3", "sort_order": 2}
]
```

**Java DTO:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReorderItemRequest {
  @NotBlank
  private String id;
  
  @NotNull
  private Integer sort_order;
}

// Uso: List<ReorderItemRequest> items
```

---

## 6. BulkCreateItemsRequest — POST `/cms/v2/guides/{id}/items/bulk?replace_section=restaurantes`

```json
[
  {
    "section": "restaurantes",
    "name": "DiverXO",
    "tagline": "3 estrellas Michelin"
  },
  {
    "section": "restaurantes",
    "name": "La Tasquería",
    "tagline": "Casquería fine dining"
  }
]
```

**Java DTO:**
```java
// Es un List<CreateGuideItemRequest>
// Igual que crear items individuales, pero en bulk

List<CreateGuideItemRequest> items = ...;
```

---

## 7. DuplicateGuideRequest — POST `/cms/v2/guides/{id}/duplicate`

```json
{
  "new_city": "Barcelona",
  "new_year": "27"
}
```

**Java DTO:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateGuideRequest {
  private String new_city;    // Opcional
  private String new_year;    // Opcional
}
```

---

## 8. ExportPdfRequest — POST `/cms/v2/guides/{id}/export`

```json
{
  "format": "pdf",
  "async": false
}
```

**Java DTO:**
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportPdfRequest {
  @Builder.Default
  private String format = "pdf";
  
  @Builder.Default
  private Boolean async = false;
}
```

---

## 9. UploadMediaRequest — POST `/cms/v2/guides/{id}/media`

```json
{
  "file": "<binary multipart>",
  "field_key": "cover_photo_url",
  "item_id": null
}
```

**Java DTO:**
```java
@Data
public class UploadMediaRequest {
  @NotNull
  private MultipartFile file;
  
  private String field_key;    // cover_photo_url, director_photo_url, etc
  private String item_id;      // Si es foto de item
}
```

---

## 10. GenerateAiContentRequest — POST `/cms/v2/guides/{id}/ai/generate`

```json
{
  "field": "directors_letter",
  "style_hint": "poético y reflexivo",
  "overwrite": false
}
```

**Java DTO:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateAiContentRequest {
  @NotBlank
  private String field; // directors_letter, mission_text, etc
  
  private String style_hint;
  
  @Builder.Default
  private Boolean overwrite = false;
}
```

---

## 11. SuggestRecomendadosRequest — POST `/cms/v2/guides/{id}/ai/suggest`

```json
{
  "section": "restaurantes",
  "count": 5,
  "style_hint": "michelin starred"
}
```

**Java DTO:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuggestRecomendadosRequest {
  private String section; // restaurantes, fiesta, etc
  
  @Builder.Default
  private Integer count = 3;
  
  private String style_hint;
}
```

---

## 12. AcceptSuggestionsRequest — POST `/cms/v2/guides/{id}/ai/suggest/accept`

```json
{
  "suggestions": [
    {
      "section": "restaurantes",
      "name": "Suggested Restaurant",
      "tagline": "3 estrellas",
      "description": "..."
    }
  ]
}
```

**Java DTO:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcceptSuggestionsRequest {
  @NotEmpty
  @JsonProperty("suggestions")
  private List<CreateGuideItemRequest> suggestions;
}
```

---

## 13. CmsImportRequest — POST `/cms/v2/guides/{id}/cms/import`

```json
{
  "items": [
    {
      "cms_business_id": 100,
      "section": "restaurantes",
      "name": "DiverXO",
      "tagline": "3 estrellas Michelin",
      "description": "...",
      "web": "https://...",
      "address": "...",
      "photo_url": "https://..."
    }
  ],
  "language": "es"
}
```

**Java DTO:**
```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CmsImportRequest {
  @NotEmpty
  private List<CreateGuideItemRequest> items;
  
  private String language; // es, en, fr
}
```

---

## Mapeo Rápido

| Endpoint | Request DTO | Notas |
|----------|------------|-------|
| POST /guides | CreateGuideRequest | Todos campos requeridos |
| PUT /guides/{id} | UpdateGuideRequest | Todos opcionales |
| POST /guides/{id}/items | CreateGuideItemRequest | section + name requeridos |
| PUT /guides/{id}/items/{id} | UpdateGuideItemRequest | Todos opcionales |
| POST /guides/{id}/items/reorder | List<ReorderItemRequest> | Array de {id, sort_order} |
| POST /guides/{id}/items/bulk | List<CreateGuideItemRequest> | Array de items |
| POST /guides/{id}/duplicate | DuplicateGuideRequest | Campos opcionales |
| POST /guides/{id}/export | ExportPdfRequest | format + async |
| POST /guides/{id}/media | UploadMediaRequest | MultipartFile |
| POST /guides/{id}/ai/generate | GenerateAiContentRequest | field requerido |
| POST /guides/{id}/ai/suggest | SuggestRecomendadosRequest | Todos opcionales |
| POST /guides/{id}/ai/suggest/accept | AcceptSuggestionsRequest | suggestions requerido |
| POST /guides/{id}/cms/import | CmsImportRequest | items requerido |

---

## Response Objects

Todos los endpoints devuelven:

### GuideResponse (GET/POST/PUT)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "city": "Madrid",
  "year": "26",
  "edition": "Foodie Selection 2026",
  "guide_type": "local",
  "collection": "foodie-hoodie",
  "status": "draft",
  
  "director": "Carlos Jacoste",
  "director_role": "CEO & Fundador",
  
  "primary_color": "#C8006B",
  "accent_color": "#F94E1F",
  
  "cover_headline1": "FOODIE",
  "cover_headline2": "Selection",
  "cover_tagline": "Los mejores restaurantes",
  "cover_photo_url": null,
  "cover_bg_color": "#1a1a1a",
  
  "directors_letter": "Querido lector...",
  "director_photo_url": null,
  "director_pull_quote": "La gastronomía es...",
  "mission_text": "Seleccionamos lugares...",
  "criteria_list": [...],
  
  "persona_name": "María García",
  "persona_tagline": "La influencer del año",
  "persona_photo_url": null,
  "persona_bio": "Influencer de lifestyle...",
  "persona_quote": "Discoolver es mi guía",
  "persona_awards": [...],
  
  "sections_config": {...},
  "back_cover_config": {},
  "ad_config": {},
  "site_url": "discoolver.com",
  
  "items_count": 12,
  "created_by": 123,
  "created_at": "2026-05-15T10:30:00Z",
  "updated_at": "2026-05-15T10:30:00Z"
}
```

### GuideItemResponse (GET/POST/PUT items)
```json
{
  "id": "uuid",
  "guide_id": "uuid",
  "section": "restaurantes",
  "name": "DiverXO",
  "tagline": "3 estrellas Michelin",
  "description": "Fusión asiática-española...",
  "photo_url": "https://...",
  "badge": "WOW",
  "web": "https://diverxo.com",
  "address": "NH Eurobuilding...",
  "discoolver_url": "https://...",
  "subcategory": "Moderna",
  
  "handle": "@diverxo_david",
  "platform": "instagram",
  "ig_followers": 50000,
  "engagement_rate": 8.5,
  "stats": [...],
  "categories": ["GASTRONOMÍA"],
  
  "timeline_year": "2020",
  "timeline_items": [...],
  
  "sort_order": 0,
  "enabled": true,
  "cms_business_id": 100,
  
  "created_at": "2026-05-15T10:30:00Z",
  "updated_at": "2026-05-15T10:30:00Z"
}
```

---

## Java Entity (Ejemplo)

```java
@Entity
@Table(name = "guide")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guide {
  @Id
  private String id;
  
  @Column(nullable = false)
  private String city;
  
  @Column(nullable = false, columnDefinition = "VARCHAR(4)")
  private String year;
  
  private String edition;
  
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private GuideType guide_type; // WORLD, LOCAL, COLLECTION, INFLUENCER, DOSSIER
  
  @Column(columnDefinition = "VARCHAR(50)")
  private String collection;
  
  @Enumerated(EnumType.STRING)
  @Column(columnDefinition = "VARCHAR(20)")
  private GuideStatus status; // DRAFT, REVIEW, PUBLISHED, ARCHIVED
  
  private String director;
  private String director_role;
  
  @Column(columnDefinition = "VARCHAR(7)")
  private String primary_color;
  
  @Column(columnDefinition = "VARCHAR(7)")
  private String accent_color;
  
  private String cover_headline1;
  private String cover_headline2;
  private String cover_tagline;
  
  @Column(columnDefinition = "TEXT")
  private String cover_photo_url;
  
  @Column(columnDefinition = "VARCHAR(7)")
  private String cover_bg_color;
  
  private Double cover_tint_opacity;
  private String headline_align;
  
  @Column(columnDefinition = "LONGTEXT")
  private String directors_letter;
  
  @Column(columnDefinition = "TEXT")
  private String director_photo_url;
  
  private String director_pull_quote;
  private String director_signature;
  
  @Column(columnDefinition = "LONGTEXT")
  private String mission_text;
  
  @Column(columnDefinition = "JSON")
  private String criteria_list;
  
  private String persona_name;
  private String persona_tagline;
  
  @Column(columnDefinition = "TEXT")
  private String persona_photo_url;
  
  @Column(columnDefinition = "TEXT")
  private String persona_body_photo_url;
  
  @Column(columnDefinition = "LONGTEXT")
  private String persona_bio;
  
  @Column(columnDefinition = "LONGTEXT")
  private String persona_quote;
  
  @Column(columnDefinition = "JSON")
  private String persona_awards;
  
  @Column(columnDefinition = "JSON")
  private String sections_config;
  
  @Column(columnDefinition = "JSON")
  private String back_cover_config;
  
  @Column(columnDefinition = "JSON")
  private String ad_config;
  
  private String site_url;
  
  private Long owner_user_id;
  
  @NotNull
  private Long created_by;
  
  @CreationTimestamp
  @Column(nullable = false)
  private LocalDateTime created_at;
  
  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDateTime updated_at;
  
  @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<GuideItem> items = new ArrayList<>();
}
```

---

**Todo listo para que Diego lo implemente en Java.** Cada DTO tiene:
- Campo requerido/opcional claramente
- Tipo de dato exacto
- Validaciones (@NotNull, @NotBlank, @Pattern)
- Comentarios

¿Necesita algo más específico?
