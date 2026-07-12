package com.discoolver.guides.entity;

import lombok.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Entity: Guide (Guía de viaje)
 * Tabla: guide
 * Base de datos: MySQL (DigitalOcean)
 */
@Entity
@Table(name = "guide", indexes = {
    @Index(name = "idx_city_year", columnList = "city,year"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_guide_type", columnList = "guide_type"),
    @Index(name = "idx_owner", columnList = "owner_user_id"),
    @Index(name = "idx_created_by", columnList = "created_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guide {

    // ════════════════════════════════════════════════════════════════════════════
    // PRIMARY KEY
    // ════════════════════════════════════════════════════════════════════════════

    @Id
    @Column(name = "id", columnDefinition = "CHAR(36)")
    private String id; // UUID v4 generado en backend: UUID.randomUUID().toString()

    // ════════════════════════════════════════════════════════════════════════════
    // IDENTIFICACIÓN
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "city", nullable = false, length = 100)
    private String city; // Madrid, Barcelona, etc

    @Column(name = "year", nullable = false, length = 4)
    private String year; // 26, 25, etc

    @Column(name = "edition", length = 200)
    private String edition; // Ej: Foodie Selection Madrid

    @Column(name = "guide_type", nullable = false, length = 20)
    @Builder.Default
    private String guideType = "world"; // world|local|collection|influencer|dossier

    @Column(name = "collection", length = 50)
    @Builder.Default
    private String collection = "estandar"; // estandar|foodie-hoodie|travel-edition|etc

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "draft"; // draft|review|published|archived

    // ════════════════════════════════════════════════════════════════════════════
    // DIRECTOR
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "director", length = 200)
    private String director; // Nombre del director/editor

    @Column(name = "director_role", length = 200)
    private String directorRole; // Rol (Ej: Editor in Chief)

    // ════════════════════════════════════════════════════════════════════════════
    // PORTADA (COVER)
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "cover_headline1", length = 200)
    private String coverHeadline1; // Primera línea portada (FOODIE)

    @Column(name = "cover_headline2", length = 200)
    private String coverHeadline2; // Segunda línea portada (Selection)

    @Column(name = "cover_tagline", length = 300)
    private String coverTagline; // Subtítulo portada

    @Column(name = "cover_photo_url", columnDefinition = "TEXT")
    private String coverPhotoUrl; // URL de foto de portada

    @Column(name = "cover_bg_color", length = 7)
    @Builder.Default
    private String coverBgColor = "#1a1a1a"; // Color fondo portada (#hex)

    // ════════════════════════════════════════════════════════════════════════════
    // COLORES DE MARCA
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "primary_color", length = 7)
    @Builder.Default
    private String primaryColor = "#C8006B"; // Color primario (#hex)

    @Column(name = "accent_color", length = 7)
    private String accentColor; // Color accent (#hex)

    // ════════════════════════════════════════════════════════════════════════════
    // CARTA DEL DIRECTOR
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "directors_letter", columnDefinition = "LONGTEXT")
    private String directorsLetter; // Texto de la carta del director

    @Column(name = "director_photo_url", columnDefinition = "TEXT")
    private String directorPhotoUrl; // URL foto del director

    @Column(name = "director_pull_quote", length = 500)
    private String directorPullQuote; // Cita destacada del director

    @Column(name = "mission_text", columnDefinition = "TEXT")
    private String missionText; // Misión/criterios de selección

    @Column(name = "criteria_list", columnDefinition = "JSON")
    @Convert(converter = JsonConverter.class)
    @JsonProperty("criteriaList")
    private List<Map<String, Object>> criteriaList; // Array de {name, desc}

    // ════════════════════════════════════════════════════════════════════════════
    // PERSONA DEL AÑO
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "persona_name", length = 200)
    private String personaName; // Nombre de la persona del año

    @Column(name = "persona_tagline", length = 300)
    private String personaTagline; // Tagline de la persona

    @Column(name = "persona_photo_url", columnDefinition = "TEXT")
    private String personaPhotoUrl; // URL foto persona

    @Column(name = "persona_bio", columnDefinition = "TEXT")
    private String personaBio; // Biografía

    @Column(name = "persona_quote", columnDefinition = "TEXT")
    private String personaQuote; // Cita famosa

    @Column(name = "persona_awards", columnDefinition = "JSON")
    @Convert(converter = JsonConverter.class)
    @JsonProperty("personaAwards")
    private List<Map<String, Object>> personaAwards; // Array de premios

    // ════════════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "sections_config", columnDefinition = "JSON")
    @Convert(converter = JsonConverter.class)
    @JsonProperty("sectionsConfig")
    private Map<String, Object> sectionsConfig; // Config de secciones

    @Column(name = "back_cover_config", columnDefinition = "JSON")
    @Convert(converter = JsonConverter.class)
    @JsonProperty("backCoverConfig")
    private Map<String, Object> backCoverConfig; // Config contraportada

    // ════════════════════════════════════════════════════════════════════════════
    // OWNER (influencers)
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "owner_user_id")
    private Long ownerUserId; // FK users.id si es guía de influencer

    // ════════════════════════════════════════════════════════════════════════════
    // AUDITORÍA
    // ════════════════════════════════════════════════════════════════════════════

    @Column(name = "created_by", nullable = false)
    private Long createdBy; // FK users.id

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ════════════════════════════════════════════════════════════════════════════
    // RELACIONES
    // ════════════════════════════════════════════════════════════════════════════

    @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GuideItem> items = new ArrayList<>();

    // ════════════════════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES
    // ════════════════════════════════════════════════════════════════════════════

    public void addItem(GuideItem item) {
        items.add(item);
        item.setGuide(this);
    }

    public void removeItem(GuideItem item) {
        items.remove(item);
        item.setGuide(null);
    }

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
}
