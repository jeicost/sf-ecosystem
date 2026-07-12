# Implementación Backend — Guías Discoolver

**Para:** Diego CTO  
**De:** Carlos Jacoste  
**Fecha:** 25 Mayo 2026  
**Estado:** Todas las capas implementadas. Solo falta integración Spring Boot.

---

## 📦 Qué te entregamos hoy

### 1️⃣ **GuideService.java** ← INTERFAZ (qué hace cada método)
```
package com.discoolver.guides.service;

Métodos:
  - createGuide(guide, userId) → Guide
  - getGuide(id) → Optional<Guide>
  - listGuides(filters) → List<Guide>
  - updateGuide(id, guide, userId) → Guide
  - deleteGuide(id, userId) → void
  - duplicateGuide(sourceId, userId) → Guide
  - changeStatus(id, newStatus, userId) → Guide
  
  // Items
  - getGuideItems(guideId, sectionFilter) → List<GuideItem>
  - addGuideItem(guideId, item, userId) → GuideItem
  - updateGuideItem(guideId, itemId, item, userId) → GuideItem
  - deleteGuideItem(guideId, itemId, userId) → void
  - reorderGuideItems(guideId, itemOrder, userId) → void
  - addGuideItemsBulk(guideId, items, replaceSection, userId) → List<GuideItem>
  
  // Export
  - getGuideConfig(guideId) → Map (JSON para templates)
  - exportGuidePdf(guideId, templateType) → String (URL)
  
  // Utils
  - getGuideItemsCount(guideId) → int
  - hasPermission(guideId, userId, permission) → boolean
```

### 2️⃣ **GuideServiceImpl.java** ← IMPLEMENTACIÓN (cómo hace cada cosa)

**Incluye:**
- ✅ CRUD guías con transacciones
- ✅ CRUD items con ordenamiento
- ✅ Bulk insert con replace_section
- ✅ Duplicación completa (metadata + items)
- ✅ Soft delete (status → archived)
- ✅ Permisos básicos (creador puede editar)
- ✅ Validación de transiciones de estado
- ✅ Generación de UUIDs automática
- ✅ Timestamps (created_at, updated_at)
- ✅ Logging detallado con @Slf4j
- ✅ Manejo de excepciones

**Ya inyectados:**
```java
private final GuideMapper guideMapper;
private final GuideItemMapper guideItemMapper;

// Los mappers (XML) ya existen:
// - GuideMapper.xml (insert, select, update, delete, bulk)
// - GuideItemMapper.xml (insert, select, update, delete, reorder, bulk)
```

---

## 🛠️ Pasos para integrar en tu Spring Boot

### Paso 1: Copiar archivos al proyecto
```bash
# En tu proyecto Spring Boot
cp GuideService.java src/main/java/com/discoolver/guides/service/
cp GuideServiceImpl.java src/main/java/com/discoolver/guides/service/impl/
```

### Paso 2: Actualizar pom.xml (si no está)
```xml
<dependencies>
  <!-- MyBatis -->
  <dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.1</version>
  </dependency>

  <!-- FastJSON v1 -->
  <dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.83</version>
  </dependency>

  <!-- Lombok -->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <scope>provided</scope>
  </dependency>

  <!-- Logging -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-logging</artifactId>
  </dependency>
</dependencies>
```

### Paso 3: Crear GuideController
```java
package com.discoolver.guides.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v3/guides")
@RequiredArgsConstructor
@Slf4j
public class GuideController {

    private final GuideService guideService;
    private final AuthService authService; // Para extraer userId del JWT

    // POST /api/v3/guides
    @PostMapping
    public ResponseEntity<Guide> createGuide(
        @RequestBody Guide guide,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        Guide created = guideService.createGuide(guide, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // GET /api/v3/guides
    @GetMapping
    public ResponseEntity<List<Guide>> listGuides(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String year,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit) {
        
        Map<String, Object> filters = new HashMap<>();
        if (q != null) filters.put("q", q);
        if (city != null) filters.put("city", city);
        if (year != null) filters.put("year", year);
        if (status != null) filters.put("status", status);
        filters.put("page", page);
        filters.put("limit", limit);
        
        List<Guide> guides = guideService.listGuides(filters);
        return ResponseEntity.ok(guides);
    }

    // GET /api/v3/guides/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Guide> getGuide(@PathVariable String id) {
        return guideService.getGuide(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // PUT /api/v3/guides/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Guide> updateGuide(
        @PathVariable String id,
        @RequestBody Guide guide,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        Guide updated = guideService.updateGuide(id, guide, userId);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/v3/guides/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGuide(
        @PathVariable String id,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        guideService.deleteGuide(id, userId);
        return ResponseEntity.noContent().build();
    }

    // POST /api/v3/guides/{id}/duplicate
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<Guide> duplicateGuide(
        @PathVariable String id,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        Guide duplicate = guideService.duplicateGuide(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicate);
    }

    // GET /api/v3/guides/{id}/items
    @GetMapping("/{id}/items")
    public ResponseEntity<List<GuideItem>> getGuideItems(
        @PathVariable String id,
        @RequestParam(required = false) String section) {
        
        List<GuideItem> items = guideService.getGuideItems(id, section);
        return ResponseEntity.ok(items);
    }

    // POST /api/v3/guides/{id}/items
    @PostMapping("/{id}/items")
    public ResponseEntity<GuideItem> addGuideItem(
        @PathVariable String id,
        @RequestBody GuideItem item,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        GuideItem created = guideService.addGuideItem(id, item, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/v3/guides/{id}/items/{itemId}
    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<GuideItem> updateGuideItem(
        @PathVariable String id,
        @PathVariable String itemId,
        @RequestBody GuideItem item,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        GuideItem updated = guideService.updateGuideItem(id, itemId, item, userId);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/v3/guides/{id}/items/{itemId}
    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<Void> deleteGuideItem(
        @PathVariable String id,
        @PathVariable String itemId,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        guideService.deleteGuideItem(id, itemId, userId);
        return ResponseEntity.noContent().build();
    }

    // POST /api/v3/guides/{id}/items/reorder
    @PostMapping("/{id}/items/reorder")
    public ResponseEntity<Void> reorderGuideItems(
        @PathVariable String id,
        @RequestBody Map<String, Integer> itemOrder,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        guideService.reorderGuideItems(id, itemOrder, userId);
        return ResponseEntity.noContent().build();
    }

    // POST /api/v3/guides/{id}/items/bulk
    @PostMapping("/{id}/items/bulk")
    public ResponseEntity<List<GuideItem>> addGuideItemsBulk(
        @PathVariable String id,
        @RequestBody Map<String, Object> payload,
        @RequestHeader("Authorization") String token) {
        
        Long userId = authService.extractUserIdFromToken(token);
        List<GuideItem> items = (List<GuideItem>) payload.get("items");
        String replaceSection = (String) payload.get("replace_section");
        
        List<GuideItem> created = guideService.addGuideItemsBulk(id, items, replaceSection, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // GET /api/v3/guides/{id}/config
    @GetMapping("/{id}/config")
    public ResponseEntity<Map<String, Object>> getGuideConfig(@PathVariable String id) {
        Map<String, Object> config = guideService.getGuideConfig(id);
        return ResponseEntity.ok(config);
    }

    // POST /api/v3/guides/{id}/export
    @PostMapping("/{id}/export")
    public ResponseEntity<Map<String, String>> exportGuidePdf(
        @PathVariable String id,
        @RequestParam(required = false) String template) {
        
        String pdfUrl = guideService.exportGuidePdf(id, template);
        return ResponseEntity.ok(Map.of("pdf_url", pdfUrl));
    }
}
```

### Paso 4: Configurar application.yml
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/discoolver_guides
    username: root
    password: your_password
    
mybatis:
  mapper-locations: classpath:mybatis/*.xml
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
```

### Paso 5: Agregar los XML mappers
Los archivos ya existen en GitHub:
- `GuideMapper.xml`
- `GuideItemMapper.xml`

Copiar a: `src/main/resources/mybatis/`

### Paso 6: Crear/Ejecutar schema
```sql
-- En tu BD MySQL, ejecutar SCHEMA_SQL_GUIAS.sql
-- Ya está en el repo: SCHEMA_SQL_GUIAS.sql
```

---

## 🧪 Probar localmente

### Mock API (mientras completas el Spring Boot)
```bash
cd discoolver-dg-editor
./start-dev.sh mock  # Arranca editor + mock API
```

### Spring Boot (cuando esté listo)
```bash
cd your-spring-boot-project
mvn spring-boot:run

# Probar endpoints
curl -X POST http://localhost:8080/api/v3/guides \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Madrid",
    "year": "26",
    "guide_type": "local",
    "collection": "foodie-hoodie"
  }'
```

---

## 📝 TODO para completar

- [ ] Integrar GuideService en Spring Boot
- [ ] Crear GuideController con los 20+ endpoints
- [ ] Implementar extracción de userId del JWT (AuthService)
- [ ] Implementar lógica de permisos (roles ADMIN/EDITOR/VIEWER)
- [ ] Integración con servicio PDF (WeasyPrint/Playwright)
- [ ] Tests unitarios para GuideService
- [ ] Tests de integración (BD real)
- [ ] Conectar editor React en cms.discoolver.com
- [ ] Deploy en DigitalOcean

---

## 🆘 Dudas frecuentes

**P: ¿Dónde busco los Mappers (XML)?**  
R: En el repo, en la raíz:
- GuideMapper.xml
- GuideItemMapper.xml

**P: ¿Cómo manejo los campos JSON (criteria_list, persona_awards, etc)?**  
R: Ya lo hace JsonConverter.java + FastJSON v1. Solo asegúrate de usar `@Convert(converter = JsonConverter.class)` en los fields de Guide.java

**P: ¿Cómo obtengo el userId del token JWT?**  
R: Depends on your JWT library (auth0, jjwt, etc). En el ejemplo usé `authService.extractUserIdFromToken(token)`. Implementa esto según tu JWT provider.

**P: ¿Qué pasa con las imágenes/archivos?**  
R: El campo photo_url es una string (URL). Implementar upload en servicio de storage aparte (Cloudflare R2, S3, etc).

**P: ¿Puedo usar JPA en lugar de MyBatis?**  
R: Sí, pero necesitarías reconfigurar los mapeos. Los XML están optimizados para MyBatis. Si cambias, usa Hibernate/JPA directamente.

---

**Status:** ✅ Todo listo en GitHub — rama `main` commit c722ff0  
**Branch:** https://github.com/discoolver-group/discoolver-dg-editor  
**Próximo:** Tu implementación en Spring Boot + tests
