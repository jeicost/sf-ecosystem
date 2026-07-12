# 🚀 Backend Setup — Sistema de Guías Discoolver

**Para:** Diego (CTO/Backend)  
**Propósito:** Guía completa para implementar endpoints Java  
**Estimado:** 2-3 semanas  
**Último actualizado:** 15 Mayo 2026

---

## 📋 Índice Rápido

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Base de Datos](#base-de-datos)
3. [DTOs & Request Objects](#dtos--request-objects)
4. [API Specification](#api-specification)
5. [Implementación Paso a Paso](#implementación-paso-a-paso)
6. [Autenticación & CORS](#autenticación--cors)
7. [Testing](#testing)
8. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Resumen Ejecutivo

### ¿Qué estamos construyendo?

Un sistema completo de guías de viaje (PDF templates + editor web) que funciona con tu CMS existente.

**Tu rol:** Backend Java que almacene y sirva guías desde la BBDD

**Lo que nosotros ya hicimos:**
- ✅ Editor React (Vite) — UI completa
- ✅ Mock API (Node.js) — todos los endpoints simulados
- ✅ Documentación técnica completa

**Lo que necesitas hacer:**
- Crear tablas MySQL (script listo)
- Implementar ~14 endpoints Java Spring Boot
- Configurar auth + CORS

---

## Base de Datos

### 1. Archivo SQL

**Ubicación en GitHub:** [`SCHEMA_SQL_GUIAS.sql`](./SCHEMA_SQL_GUIAS.sql)

**Acciones:**

```bash
# 1. Descargar el archivo (o copiar contenido)
wget https://raw.githubusercontent.com/discoolver-group/discoolver-dg-editor/main/SCHEMA_SQL_GUIAS.sql

# 2. Conectar a tu BBDD discoolver
mysql -h bbdd-mysql-cluster-do-user-4186381-0.m.db.ondigitalocean.com \
       -u doadmin \
       -p \
       discoolver < SCHEMA_SQL_GUIAS.sql

# 3. Verificar que se crearon las tablas
mysql> SHOW TABLES LIKE 'guide%';
+------------------+
| Tables_in_discoolver |
+------------------+
| guide            |
| guide_item       |
+------------------+
```

### 2. Tablas Creadas

**`guide` — Documento principal**
```sql
Campos principales:
  - id (UUID, PK)
  - city (VARCHAR 100)
  - year (VARCHAR 4)  -- "26", "25", etc
  - edition (VARCHAR 200)
  - guide_type (VARCHAR 20) -- world|local|collection|influencer|dossier
  - collection (VARCHAR 50) -- estandar|foodie|travel|etc
  - status (VARCHAR 20) -- draft|review|published|archived
  
  - director, director_role (VARCHAR)
  - primary_color, accent_color (VARCHAR 7, hex colors)
  
  - cover_headline1, cover_headline2, cover_tagline
  - cover_photo_url (TEXT)
  - cover_bg_color (VARCHAR 7)
  
  - directors_letter (LONGTEXT)
  - director_photo_url (TEXT)
  - director_pull_quote (VARCHAR 500)
  - mission_text (LONGTEXT)
  - criteria_list (JSON) -- [{name, desc}, ...]
  
  - persona_name, persona_tagline (VARCHAR)
  - persona_photo_url, persona_body_photo_url (TEXT)
  - persona_bio, persona_quote (LONGTEXT)
  - persona_awards (JSON) -- [{name, year}, ...]
  
  - sections_config (JSON) -- {restaurantes: {enabled, page_number}, ...}
  - back_cover_config (JSON)
  - ad_config (JSON)
  - site_url (VARCHAR)
  
  - owner_user_id (BIGINT, FK users) -- NULL para guías internas
  - created_by (BIGINT, FK users, NOT NULL)
  - created_at, updated_at (DATETIME)

Índices:
  - idx_city_year (city, year)
  - idx_status
  - idx_guide_type
  - idx_owner
  - idx_created_by
```

**`guide_item` — Recomendados dentro de guía**
```sql
Campos principales:
  - id (UUID, PK)
  - guide_id (UUID, FK guide.id, ON DELETE CASCADE)
  - section (VARCHAR 50) -- restaurantes|fiesta|influencers|etc
  - name (VARCHAR 300, NOT NULL)
  - tagline, description (TEXT)
  - photo_url (TEXT)
  - badge (VARCHAR 50) -- WOW|ICÓNICO|LOCAL-OWNED|etc
  - web, address, discoolver_url (VARCHAR 500)
  - subcategory (VARCHAR 100)
  
  - handle, platform (VARCHAR) -- Para influencers
  - ig_followers (INT)
  - engagement_rate (DECIMAL 5,2)
  - stats (JSON) -- [{label, value}, ...]
  - categories (JSON) -- ["MODA", "LIFESTYLE", ...]
  
  - timeline_year, timeline_items (JSON)
  
  - sort_order (INT, default 0)
  - enabled (TINYINT, default 1)
  - cms_business_id (BIGINT) -- Si fue importado del CMS
  
  - created_at, updated_at (DATETIME)

Índices:
  - idx_guide_section (guide_id, section)
  - idx_section
  - idx_enabled
  - idx_cms_business
```

---

## DTOs & Request Objects

### 📖 Archivo Referencia

**Ubicación en GitHub:** [`REQUEST_OBJECTS.md`](./REQUEST_OBJECTS.md)

Este archivo contiene **EXACTAMENTE** qué campos envía cada request POST/PUT.

### Estructura de DTOs

Todos los DTOs están documentados con:
- JSON schema (qué envía el cliente)
- Java DTO class (qué recibe tu backend)
- Validaciones (@NotNull, @NotBlank, etc)
- Campos requeridos vs opcionales

### Ejemplo: CreateGuideRequest

**JSON que envía el editor:**
```json
{
  "city": "Madrid",
  "year": "26",
  "edition": "Foodie Selection 2026",
  "guide_type": "local",
  "collection": "foodie-hoodie",
  "director": "Carlos Jacoste",
  "primary_color": "#C8006B",
  "cover_headline1": "FOODIE",
  ...
}
```

**Java DTO que recibe tu servidor:**
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
  private String status;
  private String director;
  // ... resto de campos
}
```

**Ver archivo completo:** [`REQUEST_OBJECTS.md`](./REQUEST_OBJECTS.md)

---

## API Specification

### 📚 Archivo Referencia

**Ubicación en GitHub:** [`API_CONTRACT.md`](./API_CONTRACT.md)

Contiene:
- **14 endpoints** Spring Boot completos
- **Request/response examples** para cada uno
- **Códigos de error** (400, 401, 403, 404, 500)
- **Ejemplos cURL** para testing

### Endpoints Principales

```
✅ POST   /cms/v2/guides                        Crear guía
✅ GET    /cms/v2/guides                        Listar guías (con filtros)
✅ GET    /cms/v2/guides/{id}                   Obtener guía
✅ PUT    /cms/v2/guides/{id}                   Actualizar guía
✅ DELETE /cms/v2/guides/{id}                   Eliminar guía
✅ POST   /cms/v2/guides/{id}/duplicate         Duplicar guía

✅ GET    /cms/v2/guides/{id}/items             Listar items
✅ POST   /cms/v2/guides/{id}/items             Crear item
✅ PUT    /cms/v2/guides/{id}/items/{itemId}    Actualizar item
✅ DELETE /cms/v2/guides/{id}/items/{itemId}    Eliminar item
✅ POST   /cms/v2/guides/{id}/items/reorder     Reordenar items
✅ POST   /cms/v2/guides/{id}/items/bulk        Crear múltiples items

✅ GET    /cms/v2/guides/{id}/config            Obtener config (para templates HTML)
✅ POST   /cms/v2/guides/{id}/export            Generar PDF
```

**Ver especificación completa:** [`API_CONTRACT.md`](./API_CONTRACT.md)

---

## Implementación Paso a Paso

### Fase 1: Setup Inicial (30 min)

```bash
# 1. Clonar repo (si no lo hiciste)
git clone https://github.com/discoolver-group/discoolver-dg-editor.git
cd discoolver-dg-editor

# 2. Ejecutar SQL
mysql -u doadmin -p discoolver < SCHEMA_SQL_GUIAS.sql

# 3. Verificar conexión
mysql> SELECT COUNT(*) FROM guide;
+-------+
| COUNT |
+-------+
|     0 |
+-------+
```

### Fase 2: DTOs & Entities (2-3 horas)

**Crear paquete `com.discoolver.cms.guides.dto`**

Copiar de [`REQUEST_OBJECTS.md`](./REQUEST_OBJECTS.md):
- `CreateGuideRequest.java`
- `UpdateGuideRequest.java`
- `CreateGuideItemRequest.java`
- `UpdateGuideItemRequest.java`
- `ReorderItemRequest.java`
- `BulkCreateItemsRequest.java`
- (todos están listos, solo copy-paste)

**Crear entities en `com.discoolver.cms.guides.entity`**

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
  
  // ... resto de campos (ver REQUEST_OBJECTS.md)
  
  @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<GuideItem> items = new ArrayList<>();
}

@Entity
@Table(name = "guide_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideItem {
  @Id
  private String id;
  
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "guide_id", nullable = false)
  private Guide guide;
  
  // ... resto de campos
}
```

### Fase 3: Repository (1 hora)

```java
@Repository
public interface GuideRepository extends JpaRepository<Guide, String> {
  List<Guide> findByCity(String city);
  List<Guide> findByStatus(String status);
  List<Guide> findByGuideType(String guideType);
  List<Guide> findByCollection(String collection);
  
  @Query("SELECT g FROM Guide g WHERE " +
         "LOWER(g.city) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
         "LOWER(g.edition) LIKE LOWER(CONCAT('%', :q, '%'))")
  List<Guide> search(@Param("q") String query);
}

@Repository
public interface GuideItemRepository extends JpaRepository<GuideItem, String> {
  List<GuideItem> findByGuideId(String guideId);
  List<GuideItem> findByGuideIdAndSection(String guideId, String section);
  void deleteByGuideIdAndSection(String guideId, String section);
}
```

### Fase 4: Services (3-4 horas)

```java
@Service
@Transactional
public class GuideService {
  
  @Autowired
  private GuideRepository guideRepository;
  
  @Autowired
  private GuideItemRepository itemRepository;
  
  // POST /cms/v2/guides
  public Guide createGuide(CreateGuideRequest req) {
    Guide guide = Guide.builder()
      .id(UUID.randomUUID().toString())
      .city(req.getCity())
      .year(req.getYear())
      .edition(req.getEdition())
      .guide_type(req.getGuide_type())
      .collection(req.getCollection())
      .status("draft")
      .director(req.getDirector())
      .primary_color(req.getPrimary_color())
      // ... resto de campos
      .created_at(LocalDateTime.now())
      .updated_at(LocalDateTime.now())
      .build();
    
    return guideRepository.save(guide);
  }
  
  // GET /cms/v2/guides?q=...&status=...
  public List<Guide> listGuides(String q, String status, String collection, String guide_type) {
    if (q != null) {
      return guideRepository.search(q);
    }
    if (status != null) {
      return guideRepository.findByStatus(status);
    }
    // ... etc
    return guideRepository.findAll();
  }
  
  // GET /cms/v2/guides/{id}
  public Guide getGuide(String id) {
    return guideRepository.findById(id)
      .orElseThrow(() -> new NotFoundException("Guide not found"));
  }
  
  // PUT /cms/v2/guides/{id}
  public Guide updateGuide(String id, UpdateGuideRequest req) {
    Guide guide = getGuide(id);
    
    if (req.getCity() != null) guide.setCity(req.getCity());
    if (req.getYear() != null) guide.setYear(req.getYear());
    if (req.getStatus() != null) guide.setStatus(req.getStatus());
    // ... resto de campos
    
    guide.setUpdated_at(LocalDateTime.now());
    return guideRepository.save(guide);
  }
  
  // DELETE /cms/v2/guides/{id}
  public void deleteGuide(String id) {
    guideRepository.deleteById(id);
  }
}
```

### Fase 5: Controllers (4-5 horas)

```java
@RestController
@RequestMapping("/cms/v2/guides")
@Transactional
public class GuideController {
  
  @Autowired
  private GuideService guideService;
  
  // POST /cms/v2/guides
  @PostMapping
  public ResponseEntity<GuideResponse> createGuide(
    @Valid @RequestBody CreateGuideRequest req,
    @RequestHeader("Authorization") String auth) {
    
    // Validar token (ver sección Auth)
    validateToken(auth);
    
    Guide guide = guideService.createGuide(req);
    return ResponseEntity.status(201).body(mapToResponse(guide));
  }
  
  // GET /cms/v2/guides
  @GetMapping
  public ResponseEntity<List<GuideResponse>> listGuides(
    @RequestParam(required = false) String q,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String collection,
    @RequestParam(required = false) String guide_type,
    @RequestHeader("Authorization") String auth) {
    
    validateToken(auth);
    
    List<Guide> guides = guideService.listGuides(q, status, collection, guide_type);
    return ResponseEntity.ok(guides.stream()
      .map(this::mapToResponse)
      .collect(Collectors.toList()));
  }
  
  // GET /cms/v2/guides/{id}
  @GetMapping("/{id}")
  public ResponseEntity<GuideResponse> getGuide(
    @PathVariable String id,
    @RequestHeader("Authorization") String auth) {
    
    validateToken(auth);
    
    Guide guide = guideService.getGuide(id);
    return ResponseEntity.ok(mapToResponse(guide));
  }
  
  // PUT /cms/v2/guides/{id}
  @PutMapping("/{id}")
  public ResponseEntity<GuideResponse> updateGuide(
    @PathVariable String id,
    @Valid @RequestBody UpdateGuideRequest req,
    @RequestHeader("Authorization") String auth) {
    
    validateToken(auth);
    
    Guide guide = guideService.updateGuide(id, req);
    return ResponseEntity.ok(mapToResponse(guide));
  }
  
  // DELETE /cms/v2/guides/{id}
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteGuide(
    @PathVariable String id,
    @RequestHeader("Authorization") String auth) {
    
    validateToken(auth);
    
    guideService.deleteGuide(id);
    return ResponseEntity.noContent().build();
  }
  
  // ... resto de endpoints
  
  private void validateToken(String auth) {
    if (auth == null || !auth.startsWith("Bearer ")) {
      throw new UnauthorizedException("Invalid token");
    }
    // Validar con tu sistema de auth del CMS
  }
  
  private GuideResponse mapToResponse(Guide guide) {
    // Mapear entity a DTO de response
  }
}
```

---

## Autenticación & CORS

### Auth

**Token en Header:**
```
Authorization: Bearer {token}
```

**Validación:**
```java
@Component
public class AuthFilter extends OncePerRequestFilter {
  
  @Override
  protected void doFilterInternal(HttpServletRequest req, 
                                  HttpServletResponse res, 
                                  FilterChain chain) throws ServletException, IOException {
    
    String auth = req.getHeader("Authorization");
    
    if (auth == null || !auth.startsWith("Bearer ")) {
      res.sendError(401, "Missing or invalid token");
      return;
    }
    
    String token = auth.substring(7); // Remove "Bearer "
    
    // TODO: Validar token con tu CMS
    // (Puede ser JWT, call a otro endpoint, etc)
    
    chain.doFilter(req, res);
  }
}
```

**Nota:** El token es el mismo que genera tu CMS al login. Reutiliza tu lógica de validación existente.

### CORS

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/cms/v2/**")
      .allowedOrigins(
        "https://cms.discoolver.com",
        "https://guias.discoolver.com",
        "http://localhost:5173",  // dev editor
        "http://localhost:3100"   // dev mock
      )
      .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
      .allowedHeaders("Authorization", "Content-Type")
      .allowCredentials(false)
      .maxAge(3600);
  }
}
```

---

## Testing

### Mock API para Testing

Mientras implementas tu backend, puedes usar nuestro mock API en `:3100`:

```bash
# 1. Arrancar mock API
cd /Users/carlosjacoste/Desktop/Claude/clients/discoolver/dg-editor
./start-dev.sh mock

# 2. Probar endpoints (en otra terminal)
curl -X GET http://localhost:3100/cms/v2/guides \
  -H "Authorization: Bearer mock-token"

# 3. Comparar respuestas con tu implementación
```

### Casos de Test Principales

**Crear guía:**
```bash
curl -X POST http://localhost:PORT/cms/v2/guides \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Madrid",
    "year": "26",
    "guide_type": "local",
    "director": "Test"
  }'

# Expected: 201 Created + guide JSON
```

**Listar guías:**
```bash
curl http://localhost:PORT/cms/v2/guides?status=draft \
  -H "Authorization: Bearer {token}"

# Expected: 200 OK + array de guías
```

**Error: sin token:**
```bash
curl http://localhost:PORT/cms/v2/guides

# Expected: 401 Unauthorized
```

---

## FAQ & Troubleshooting

### P: ¿Dónde veo todos los campos de la guía?

**R:** En [`REQUEST_OBJECTS.md`](./REQUEST_OBJECTS.md) está la lista completa con tipos de datos.

### P: ¿Qué devuelve GET `/guides/{id}/config`?

**R:** Un JSON especial que los 20 templates HTML esperan. Ver [`API_CONTRACT.md`](./API_CONTRACT.md) sección "GuideConfig Response".

### P: ¿Cómo hago para que `/guides/{id}/config` sea público (sin auth)?

**R:** Configura un endpoint separado sin `@AuthRequired`:

```java
@GetMapping("/{id}/config")
// NO incluyas auth header check aquí
public ResponseEntity<GuideConfigResponse> getConfig(@PathVariable String id) {
  // Los templates HTML lo llaman desde cliente
  return ResponseEntity.ok(...);
}
```

### P: ¿JSON fields en MySQL soportan transacciones?

**R:** Sí, MySQL 5.7+ soporta nativo y con transacciones ACID.

### P: ¿Cuál es el límite de tamaño de criteria_list?

**R:** MySQL JSON puede ser muy grande, pero recomendamos no exceder 1MB por campo.

### P: ¿El campo `owner_user_id` es obligatorio?

**R:** No. NULL para guías internas, BIGINT para influencers que tengan guía propia.

### P: ¿Cómo dejo que usuarios normales no puedan editar guías ajenas?

**R:** En el servicio:

```java
public void updateGuide(String id, UpdateGuideRequest req, Long userId) {
  Guide guide = getGuide(id);
  
  // Solo admin puede editar guías internas
  // Solo owner puede editar sus guías
  if (guide.getOwner_user_id() != null && 
      !guide.getOwner_user_id().equals(userId)) {
    throw new ForbiddenException("No permission");
  }
  
  // ... continuar
}
```

### P: ¿Debo usar UUIDs o IDs numéricos?

**R:** UUIDs. El schema y DTOs usan String para UUID. Genéralos en Java:

```java
String id = UUID.randomUUID().toString();
```

### P: ¿El endpoint `/export` genera el PDF?

**R:** Por ahora devuelve una URL simulada. El PDF real lo genera un renderer (WeasyPrint u otro) que puede ser un microservicio separado.

---

## Checklist de Implementación

- [ ] **SQL:** Ejecutado `SCHEMA_SQL_GUIAS.sql`
- [ ] **DTOs:** Creados todos los request/response objects
- [ ] **Entities:** `Guide` y `GuideItem` mapeadas
- [ ] **Repositories:** `GuideRepository` y `GuideItemRepository`
- [ ] **Services:** `GuideService` con lógica CRUD
- [ ] **Controllers:** `GuideController` con todos los endpoints
- [ ] **Auth:** Token validation + CORS configurado
- [ ] **Testing:** Probados con mock API en `:3100`
- [ ] **Errors:** Manejo de 400, 401, 403, 404, 500
- [ ] **Documentación:** Actualizado README del backend

---

## Preguntas? Contacta

**Documentación principal:** Ver archivos en GitHub
- [`REQUEST_OBJECTS.md`](./REQUEST_OBJECTS.md) — DTOs completos
- [`API_CONTRACT.md`](./API_CONTRACT.md) — Especificación endpoints
- [`SCHEMA_SQL_GUIAS.sql`](./SCHEMA_SQL_GUIAS.sql) — Script SQL

**Mock API para testing:**
```bash
cd /Users/carlosjacoste/Desktop/Claude/clients/discoolver/dg-editor
./start-dev.sh mock
# http://localhost:3100 disponible
```

---

## Timeline Esperado

```
Semana 1:
  Día 1-2: Setup SQL + DTOs
  Día 3-4: Services + Repositories
  Día 5: Controllers básicos + testing

Semana 2:
  Día 1-2: Error handling + validaciones
  Día 3-4: Auth + CORS
  Día 5: Refinamientos + testing exhaustivo

Semana 3:
  Integración con editor (fe cambios necesarios)
  Deploy a DigitalOcean
```

---

**Status:** Todo listo. Adelante con la implementación.
