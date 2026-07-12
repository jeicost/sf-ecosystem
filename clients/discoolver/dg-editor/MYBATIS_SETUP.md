# MyBatis Setup — Guías Discoolver

**Para:** Diego (Backend)  
**Propósito:** Integrar mappers MyBatis en tu proyecto Spring Boot  
**Generado:** 2026-05-15

---

## 📋 Checklist Rápido

- [ ] Copiar `GuideMapper.xml` y `GuideItemMapper.xml` a `src/main/resources/mybatis/`
- [ ] Crear interfaces mapper (`GuideMapper.java`, `GuideItemMapper.java`)
- [ ] Configurar MyBatis en `application.yml` o `application.properties`
- [ ] Agregar dependency: `mybatis-spring-boot-starter` + `fastjson` (para JSON)
- [ ] Crear entidades JPA (`Guide.java`, `GuideItem.java`)
- [ ] Crear servicios que llaman a los mappers
- [ ] Testear con curl

---

## 1️⃣ Dependencias Maven

En `pom.xml`, añade:

```xml
<!-- MyBatis Spring Boot Starter -->
<dependency>
  <groupId>org.mybatis.spring.boot</groupId>
  <artifactId>mybatis-spring-boot-starter</artifactId>
  <version>3.0.3</version>
</dependency>

<!-- FastJSON para JSON fields -->
<dependency>
  <groupId>com.alibaba</groupId>
  <artifactId>fastjson</artifactId>
  <version>2.0.43</version>
</dependency>

<!-- MySQL Driver -->
<dependency>
  <groupId>mysql</groupId>
  <artifactId>mysql-connector-java</artifactId>
  <version>8.0.33</version>
</dependency>

<!-- Spring Data JPA (si lo usas) -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

---

## 2️⃣ Estructura de Carpetas

```
src/main/
├── java/com/discoolver/cms/
│   ├── entity/
│   │   ├── Guide.java
│   │   └── GuideItem.java
│   ├── mapper/
│   │   ├── GuideMapper.java
│   │   └── GuideItemMapper.java
│   ├── service/
│   │   ├── GuideService.java
│   │   └── GuideItemService.java
│   ├── controller/
│   │   └── GuideController.java
│   └── config/
│       └── MyBatisConfig.java
│
└── resources/
    ├── mybatis/
    │   ├── GuideMapper.xml
    │   └── GuideItemMapper.xml
    └── application.yml
```

---

## 3️⃣ Entidades JPA

### Guide.java

```java
package com.discoolver.cms.entity;

import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "guide")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guide {

  @Id
  @Column(columnDefinition = "CHAR(36)")
  private String id;

  @Column(nullable = false, length = 100)
  private String city;

  @Column(nullable = false, length = 4)
  private String year;

  @Column(length = 200)
  private String edition;

  @Column(name = "guide_type", nullable = false, length = 20)
  private String guideType; // world|local|collection|influencer|dossier

  @Column(length = 50)
  private String collection;

  @Column(length = 20)
  private String status; // draft|review|published|archived

  // Director
  @Column(length = 200)
  private String director;

  @Column(length = 200)
  private String directorRole;

  // Portada
  @Column(length = 200)
  private String coverHeadline1;

  @Column(length = 200)
  private String coverHeadline2;

  @Column(length = 300)
  private String coverTagline;

  @Column(columnDefinition = "TEXT")
  private String coverPhotoUrl;

  @Column(length = 7)
  private String coverBgColor;

  // Colors
  @Column(length = 7)
  private String primaryColor;

  @Column(length = 7)
  private String accentColor;

  // Director's Letter
  @Column(columnDefinition = "LONGTEXT")
  private String directorsLetter;

  @Column(columnDefinition = "TEXT")
  private String directorPhotoUrl;

  @Column(length = 500)
  private String directorPullQuote;

  @Column(columnDefinition = "TEXT")
  private String directorSignature;

  @Column(columnDefinition = "LONGTEXT")
  private String missionText;

  // JSON fields (like `[{name, desc}, ...]`)
  @Column(columnDefinition = "JSON")
  private String criteriaList;

  // Persona del Año
  @Column(length = 200)
  private String personaName;

  @Column(length = 300)
  private String personaTagline;

  @Column(columnDefinition = "TEXT")
  private String personaPhotoUrl;

  @Column(columnDefinition = "TEXT")
  private String personaBodyPhotoUrl;

  @Column(columnDefinition = "LONGTEXT")
  private String personaBio;

  @Column(columnDefinition = "LONGTEXT")
  private String personaQuote;

  // JSON arrays
  @Column(columnDefinition = "JSON")
  private String personaAwards;

  // Config
  @Column(columnDefinition = "JSON")
  private String sectionsConfig;

  @Column(columnDefinition = "JSON")
  private String backCoverConfig;

  // Owner (influencer guides)
  @Column(name = "owner_user_id")
  private Long ownerUserId;

  // Audit
  @Column(nullable = false)
  private Long createdBy;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  // Relación
  @OneToMany(mappedBy = "guideId", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<GuideItem> items;
}
```

### GuideItem.java

```java
package com.discoolver.cms.entity;

import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "guide_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideItem {

  @Id
  @Column(columnDefinition = "CHAR(36)")
  private String id;

  @Column(name = "guide_id", nullable = false, columnDefinition = "CHAR(36)")
  private String guideId;

  @Column(nullable = false, length = 50)
  private String section; // restaurantes|fiesta|influencers|etc

  @Column(nullable = false, length = 300)
  private String name;

  @Column(length = 500)
  private String tagline;

  @Column(columnDefinition = "LONGTEXT")
  private String description;

  @Column(columnDefinition = "TEXT")
  private String photoUrl;

  @Column(length = 50)
  private String badge; // WOW|ICÓNICO|LOCAL-OWNED|BEST-VIEW|HIDDEN-GEM

  @Column(length = 500)
  private String web;

  @Column(length = 500)
  private String address;

  @Column(length = 500)
  private String discoolverUrl;

  @Column(length = 100)
  private String subcategory;

  // Influencers
  @Column(length = 100)
  private String handle;

  @Column(length = 20)
  private String platform; // instagram|tiktok|youtube

  @Column(name = "ig_followers")
  private Integer igFollowers;

  @Column(name = "engagement_rate", columnDefinition = "DECIMAL(5,2)")
  private Double engagementRate;

  @Column(columnDefinition = "JSON")
  private String stats; // [{label, value}]

  @Column(columnDefinition = "JSON")
  private String categories; // [MODA, LIFESTYLE]

  // Timeline
  @Column(name = "timeline_year", length = 10)
  private String timelineYear;

  @Column(name = "timeline_items", columnDefinition = "JSON")
  private String timelineItems; // [{title, desc}]

  // Visibilidad
  @Column(name = "sort_order")
  private Integer sortOrder;

  @Column(columnDefinition = "TINYINT(1)")
  private Boolean enabled;

  // FK a CMS
  @Column(name = "cms_business_id")
  private Long cmsBusinessId;

  // Audit
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;
}
```

---

## 4️⃣ Interfaces Mapper

### GuideMapper.java

```java
package com.discoolver.cms.mapper;

import com.discoolver.cms.entity.Guide;
import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;

@Mapper
public interface GuideMapper {

  // CRUD
  @Insert("")
  void insertGuide(Guide guide);

  @Select("")
  Guide selectGuideById(String id);

  @Select("")
  List<Guide> selectGuides(Map<String, Object> params);

  @Select("")
  Integer countGuides(Map<String, Object> params);

  @Update("")
  void updateGuide(Guide guide);

  @Delete("")
  void deleteGuide(String id);

  // Custom queries
  @Select("")
  Guide selectGuideByCityYear(@Param("city") String city, @Param("year") String year);

  @Select("")
  List<Guide> selectGuidesByOwner(Long userId);
}
```

### GuideItemMapper.java

```java
package com.discoolver.cms.mapper;

import com.discoolver.cms.entity.GuideItem;
import org.apache.ibatis.annotations.*;
import java.util.List;
import java.util.Map;

@Mapper
public interface GuideItemMapper {

  // CRUD
  @Insert("")
  void insertGuideItem(GuideItem item);

  @Select("")
  GuideItem selectGuideItemById(String id);

  @Select("")
  List<GuideItem> selectGuideItemsByGuideId(Map<String, Object> params);

  @Select("")
  Integer countGuideItems(String guideId);

  @Update("")
  void updateGuideItem(GuideItem item);

  @Delete("")
  void deleteGuideItem(String id);

  // Bulk operations
  @Insert("")
  void insertGuideItemBatch(@Param("items") List<GuideItem> items);

  @Update("")
  void updateItemSortOrder(@Param("items") List<GuideItem> items);

  @Delete("")
  void deleteItemsBySection(@Param("guideId") String guideId, @Param("section") String section);

  @Select("")
  List<GuideItem> selectItemsBySection(@Param("guideId") String guideId, @Param("section") String section);

  @Select("")
  Integer getMaxSortOrderInSection(@Param("guideId") String guideId, @Param("section") String section);
}
```

**Nota:** Las anotaciones `@Select`, `@Insert`, etc. quedan vacías porque MyBatis las carga desde los XMLs. No necesitas escribir SQL en las anotaciones.

---

## 5️⃣ Configuración application.yml

```yaml
spring:
  application:
    name: discoolver-cms-guides

  datasource:
    url: jdbc:mysql://localhost:3306/discoolver?useSSL=false&serverTimezone=UTC&characterEncoding=utf8mb4
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: validate  # No altera schema; cambia a 'create' si es primera vez
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect

mybatis:
  mapper-locations: classpath:mybatis/*.xml
  type-aliases-package: com.discoolver.cms.entity
  configuration:
    map-underscore-to-camel-case: true  # Convierte snake_case en camelCase
    jdbc-type-for-null: NULL

server:
  port: 8080
  servlet:
    context-path: /api
```

---

## 6️⃣ MyBatis Config (Opcional)

Si necesitas custom type handlers o configuración avanzada:

```java
package com.discoolver.cms.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.discoolver.cms.mapper")
public class MyBatisConfig {
  // MyBatis se configura desde application.yml
  // No necesitas beans adicionales si usas Spring Boot starter
}
```

---

## 7️⃣ Service (Ejemplo: GuideService)

```java
package com.discoolver.cms.service;

import com.discoolver.cms.entity.Guide;
import com.discoolver.cms.mapper.GuideMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GuideService {

  private final GuideMapper guideMapper;

  public Guide createGuide(Guide guide) {
    guide.setId(UUID.randomUUID().toString());
    guideMapper.insertGuide(guide);
    return guide;
  }

  public Guide getGuideById(String id) {
    return guideMapper.selectGuideById(id);
  }

  public List<Guide> listGuides(String city, String status, int limit, int offset) {
    Map<String, Object> params = new HashMap<>();
    params.put("city", city);
    params.put("status", status);
    params.put("limit", limit);
    params.put("offset", offset);
    return guideMapper.selectGuides(params);
  }

  public void updateGuide(Guide guide) {
    guideMapper.updateGuide(guide);
  }

  public void deleteGuide(String id) {
    guideMapper.deleteGuide(id);
  }
}
```

---

## 8️⃣ Controller (Ejemplo)

```java
package com.discoolver.cms.controller;

import com.discoolver.cms.entity.Guide;
import com.discoolver.cms.service.GuideService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/cms/v2/guides")
@RequiredArgsConstructor
public class GuideController {

  private final GuideService guideService;

  @PostMapping
  public ResponseEntity<Guide> createGuide(@RequestBody Guide guide) {
    Guide created = guideService.createGuide(guide);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Guide> getGuide(@PathVariable String id) {
    Guide guide = guideService.getGuideById(id);
    if (guide == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(guide);
  }

  @GetMapping
  public ResponseEntity<List<Guide>> listGuides(
      @RequestParam(required = false) String city,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "100") int limit,
      @RequestParam(defaultValue = "0") int offset
  ) {
    List<Guide> guides = guideService.listGuides(city, status, limit, offset);
    return ResponseEntity.ok(guides);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Guide> updateGuide(@PathVariable String id, @RequestBody Guide guide) {
    guide.setId(id);
    guideService.updateGuide(guide);
    return ResponseEntity.ok(guideService.getGuideById(id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteGuide(@PathVariable String id) {
    guideService.deleteGuide(id);
    return ResponseEntity.noContent().build();
  }
}
```

---

## 9️⃣ Testing con curl

```bash
# 1. Crear guía
curl -X POST http://localhost:8080/api/cms/v2/guides \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Madrid",
    "year": "26",
    "edition": "Foodie Selection",
    "guideType": "local",
    "createdBy": 123
  }'

# 2. Obtener guía
curl http://localhost:8080/api/cms/v2/guides/{id}

# 3. Listar guías
curl "http://localhost:8080/api/cms/v2/guides?city=Madrid&status=draft"

# 4. Actualizar
curl -X PUT http://localhost:8080/api/cms/v2/guides/{id} \
  -H "Content-Type: application/json" \
  -d '{"status": "review"}'

# 5. Eliminar
curl -X DELETE http://localhost:8080/api/cms/v2/guides/{id}
```

---

## 🔟 Troubleshooting

| Error | Causa | Fix |
|-------|-------|-----|
| `Mapper interface class not found` | MyBatis no encuentra la interfaz | Asegúrate de que el paquete coincide con `@MapperScan` |
| `No database selected` | No hay conexión a MySQL | Verifica `spring.datasource.url` |
| `Unknown column 'cover_photo_url'` | Schema no ejecutado | Corre `SCHEMA_SQL_GUIAS.sql` en MySQL primero |
| `JSON parse error` | FastJSON no está en classpath | Añade la dependencia `fastjson` |
| `Property 'guideType' not found` | MyBatis no mapea snake_case → camelCase | Asegúrate de que `map-underscore-to-camel-case: true` en `application.yml` |

---

## ✅ Siguiente Paso

Una vez que tengas todo esto:

1. **Implementa GuideItemService** (igual que GuideService pero para items)
2. **Implementa GuideItemController** (endpoints `/items`, `/items/{id}`, etc)
3. **Implementa endpoints de imagen/media** (subida a Cloudflare R2)
4. **Añade autenticación** (Bearer token en header)
5. **Testa con el editor** en `cms.discoolver.com`

---

**¿Dudas?** Todo está en API_CONTRACT.md + REQUEST_OBJECTS.md. Este doc es solo la parte de MyBatis.
