package com.discoolver.guides.dto;

import com.discoolver.guides.entity.Guide;
import com.discoolver.guides.entity.GuideItem;
import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.*;

// ════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ════════════════════════════════════════════════════════════════════════════

/**
 * Crear nueva guía
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class CreateGuideRequest {
    @NotBlank(message = "city es obligatorio")
    private String city;

    @NotBlank(message = "year es obligatorio")
    private String year;

    private String edition;

    @NotBlank(message = "guide_type es obligatorio")
    private String guideType; // world|local|collection|influencer|dossier

    private String collection; // estandar|foodie-hoodie|travel-edition|etc

    private String director;
    private String directorRole;

    private String coverHeadline1;
    private String coverHeadline2;
    private String coverTagline;
    private String coverPhotoUrl;
    private String coverBgColor;

    private String directorsLetter;
    private String directorPhotoUrl;
    private String missionText;
    private Object criteriaList; // List<Map>

    private String personaName;
    private String personaTagline;
    private String personaPhotoUrl;
    private String personaBio;
    private String personaQuote;
    private Object personaAwards; // List<Map>

    private String primaryColor;
    private String accentColor;

    private Object sectionsConfig; // Map
    private Object backCoverConfig; // Map
}

/**
 * Actualizar guía existente
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class UpdateGuideRequest {
    private String city;
    private String year;
    private String edition;
    private String guideType;
    private String collection;
    private String status;
    private String director;
    private String directorRole;
    private String coverHeadline1;
    private String coverHeadline2;
    private String coverTagline;
    private String coverPhotoUrl;
    private String coverBgColor;
    private String directorsLetter;
    private String directorPhotoUrl;
    private String missionText;
    private Object criteriaList;
    private String personaName;
    private String personaTagline;
    private String personaPhotoUrl;
    private String personaBio;
    private String personaQuote;
    private Object personaAwards;
    private String primaryColor;
    private String accentColor;
    private Object sectionsConfig;
    private Object backCoverConfig;
}

/**
 * Cambiar status de guía
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class ChangeStatusRequest {
    @NotBlank(message = "status es obligatorio")
    private String status; // draft|review|published|archived
}

/**
 * Crear item en guía
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class CreateGuideItemRequest {
    @NotBlank(message = "section es obligatorio")
    private String section;

    @NotBlank(message = "title es obligatorio")
    private String title;

    private String description;
    private String photoUrl;
    private Double rating;
    private String category;
    private String price;
    private String location;
    private String contactInfo;
    private String url;
    private List<String> tags;
    private Object stats;
    private Object categories;
    private Object timelineItems;
    private boolean enabled = true;
    private int sortOrder = 0;
}

/**
 * Actualizar item existente
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class UpdateGuideItemRequest {
    private String section;
    private String title;
    private String description;
    private String photoUrl;
    private Double rating;
    private String category;
    private String price;
    private String location;
    private String contactInfo;
    private String url;
    private List<String> tags;
    private Object stats;
    private Object categories;
    private Object timelineItems;
    private boolean enabled;
    private int sortOrder;
}

/**
 * Reordenar items: { itemId: sort_order, ... }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class ReorderItemsRequest {
    @NotNull(message = "itemOrder es obligatorio")
    private Map<String, Integer> itemOrder;
}

/**
 * Crear múltiples items (bulk)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
class BulkGuideItemsRequest {
    @NotNull(message = "items es obligatorio")
    @Size(min = 1, message = "debe haber al menos 1 item")
    private List<CreateGuideItemRequest> items;

    private String replaceSection; // opcional: si se especifica, elimina items previos de esa sección
}

// ════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ════════════════════════════════════════════════════════════════════════════

/**
 * Respuesta de guía
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class GuideResponse {
    private String id;
    private String city;
    private String year;
    private String edition;
    private String guideType;
    private String collection;
    private String status;
    private String director;
    private String directorRole;
    private String coverHeadline1;
    private String coverHeadline2;
    private String coverTagline;
    private String coverPhotoUrl;
    private String coverBgColor;
    private String directorsLetter;
    private String directorPhotoUrl;
    private String missionText;
    private Object criteriaList;
    private String personaName;
    private String personaTagline;
    private String personaPhotoUrl;
    private String personaBio;
    private String personaQuote;
    private Object personaAwards;
    private String primaryColor;
    private String accentColor;
    private Object sectionsConfig;
    private Object backCoverConfig;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int itemsCount;

    public static GuideResponse fromEntity(Guide guide) {
        return GuideResponse.builder()
            .id(guide.getId())
            .city(guide.getCity())
            .year(guide.getYear())
            .edition(guide.getEdition())
            .guideType(guide.getGuideType())
            .collection(guide.getCollection())
            .status(guide.getStatus())
            .director(guide.getDirector())
            .directorRole(guide.getDirectorRole())
            .coverHeadline1(guide.getCoverHeadline1())
            .coverHeadline2(guide.getCoverHeadline2())
            .coverTagline(guide.getCoverTagline())
            .coverPhotoUrl(guide.getCoverPhotoUrl())
            .coverBgColor(guide.getCoverBgColor())
            .directorsLetter(guide.getDirectorsLetter())
            .directorPhotoUrl(guide.getDirectorPhotoUrl())
            .missionText(guide.getMissionText())
            .criteriaList(guide.getCriteriaList())
            .personaName(guide.getPersonaName())
            .personaTagline(guide.getPersonaTagline())
            .personaPhotoUrl(guide.getPersonaPhotoUrl())
            .personaBio(guide.getPersonaBio())
            .personaQuote(guide.getPersonaQuote())
            .personaAwards(guide.getPersonaAwards())
            .primaryColor(guide.getPrimaryColor())
            .accentColor(guide.getAccentColor())
            .sectionsConfig(guide.getSectionsConfig())
            .backCoverConfig(guide.getBackCoverConfig())
            .createdBy(guide.getCreatedBy())
            .createdAt(guide.getCreatedAt())
            .updatedAt(guide.getUpdatedAt())
            .build();
    }
}

/**
 * Respuesta de item
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class GuideItemResponse {
    private String id;
    private String guideId;
    private String section;
    private String title;
    private String description;
    private String photoUrl;
    private Double rating;
    private String category;
    private String price;
    private String location;
    private String contactInfo;
    private String url;
    private List<String> tags;
    private Object stats;
    private Object categories;
    private Object timelineItems;
    private boolean enabled;
    private int sortOrder;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GuideItemResponse fromEntity(GuideItem item) {
        return GuideItemResponse.builder()
            .id(item.getId())
            .guideId(item.getGuideId())
            .section(item.getSection())
            .title(item.getTitle())
            .description(item.getDescription())
            .photoUrl(item.getPhotoUrl())
            .rating(item.getRating())
            .category(item.getCategory())
            .price(item.getPrice())
            .location(item.getLocation())
            .contactInfo(item.getContactInfo())
            .url(item.getUrl())
            .tags(item.getTags())
            .stats(item.getStats())
            .categories(item.getCategories())
            .timelineItems(item.getTimelineItems())
            .enabled(item.isEnabled())
            .sortOrder(item.getSortOrder())
            .createdBy(item.getCreatedBy())
            .createdAt(item.getCreatedAt())
            .updatedAt(item.getUpdatedAt())
            .build();
    }
}

/**
 * Respuesta de error
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private String path;
    private LocalDateTime timestamp;
}
