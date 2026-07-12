package com.discoolver.guides.entity;

import lombok.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Entity: GuideItem (Recomendado dentro de una guía)
 * Tabla: guide_item
 * Base de datos: MySQL (DigitalOcean)
 * Relación: Muchos items pertenecen a una guía (OneToMany)
 */
@Entity
@Table(name = "guide_item", indexes = {
    @Index(name = "idx_guide_section", columnList = "guide_id,section"),
    @Index(name = "idx_section", columnList = "section"),
    @Index(name = "idx_enabled", columnList = "enabled"),
    @Index(name = "idx_cms_business", columnList = "cms_business_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideItem {

    // ════════════════════════════════════════════════════════════════════════════
    // PRIMARY KEY
    // ════════════════════════════════════════════════════════════════════════════

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id; // UUID v4 generado en backend: UUID.randomUUID().toString()

    // ════════════════════════════════════════════════════════════════════════════
    // FOREIGN KEY: Guide
    // ════════════════════════════════════════════════════════════════════════════

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = false, foreignKey = @ForeignKey(name = "fk_guide_item_guide"))
    @JsonIgnore
    private Guide guide;

    @Column(name = "guide_id", nullable = false, insertable = false, updatable = false)
    private String guideId; // Denormalized para queries

    // ════════════════════════════════════════════════════════════════════════════
    // SECCIÓN
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "section", nullable = false, length = 50)
    private String section;
    // restaurantes|fiesta|ocio_eventos|arte_exposiciones|experiencias|alojamientos|shopping|influencers|top_saves|coollections|persona_recom|persona_timeline

    // ════════════════════════════════════════════════════════════════════════════
    // DATOS DEL RECOMENDADO
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "name", nullable = false, length = 300)
    private String name; // Nombre del lugar/persona

    @Column(name = "tagline", length = 500)
    private String tagline; // Descripción breve

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description; // Descripción larga

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl; // URL de foto principal

    @Column(name = "badge", length = 50)
    private String badge; // WOW|ICÓNICO|LOCAL-OWNED|BEST-VIEW|HIDDEN-GEM

    @Column(name = "web", length = 500)
    private String web; // URL web del lugar

    @Column(name = "address", length = 500)
    private String address; // Dirección física

    @Column(name = "discoolver_url", length = 500)
    private String discoolverUrl; // URL en web Discoolver

    @Column(name = "subcategory", length = 100)
    private String subcategory; // Subcategoría (ej: japonesa, boutique)

    // ════════════════════════════════════════════════════════════════════════════
    // SOLO PARA INFLUENCERS
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "handle", length = 100)
    private String handle; // Handle en red social (@usuario)

    @Column(name = "platform", length = 20)
    private String platform; // instagram|tiktok|youtube

    @Column(name = "ig_followers")
    private Integer igFollowers; // Número de followers

    @Column(name = "engagement_rate")
    private java.math.BigDecimal engagementRate; // Tasa de engagement (%)

    @Column(name = "stats", columnDefinition = "JSON")
    @Convert(converter = JsonConverter.class)
    @JsonProperty("stats")
    private List<Map<String, Object>> stats; // Array de {label, value}

    @Column(name = "categories", columnDefinition = "JSON")
    @Convert(converter = JsonConverter.class)
    @JsonProperty("categories")
    private List<String> categories; // Array de categorías [MODA, LIFESTYLE, ...]

    // ════════════════════════════════════════════════════════════════════════════
    // PERSONA DEL AÑO / TIMELINE
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "timeline_year", length = 10)
    private String timelineYear; // Año en timeline

    @Column(name = "timeline_items", columnDefinition = "JSON")
    @Convert(converter = JsonConverter.class)
    @JsonProperty("timelineItems")
    private List<Map<String, Object>> timelineItems; // Array de items timeline

    // ════════════════════════════════════════════════════════════════════════════
    // VISIBILITY Y ORDEN
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0; // Orden dentro de la sección

    @Column(name = "enabled")
    @Builder.Default
    private Boolean enabled = true; // 0=desactivado, 1=activo

    // ════════════════════════════════════════════════════════════════════════════
    // CMS INTEGRATION
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "cms_business_id")
    private Long cmsBusinessId; // FK a business en CMS si aplica

    // ════════════════════════════════════════════════════════════════════════════
    // AUDITORÍA
    // ════════════════════════════════════════════════════════════════════════════

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ════════════════════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES
    // ════════════════════════════════════════════════════════════════════════════

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper para comparar con items del CMS
    public boolean matchesCmsBusiness(Long businessId) {
        return cmsBusinessId != null && cmsBusinessId.equals(businessId);
    }

    // Helper para activar/desactivar
    public void setActive(boolean active) {
        this.enabled = active;
    }

    public boolean isActive() {
        return enabled != null && enabled;
    }
}
