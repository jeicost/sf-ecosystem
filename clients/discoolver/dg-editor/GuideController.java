package com.discoolver.guides.controller;

import com.discoolver.guides.entity.Guide;
import com.discoolver.guides.entity.GuideItem;
import com.discoolver.guides.service.GuideService;
import com.discoolver.guides.dto.*;
import com.discoolver.guides.security.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller para API de Guías
 * Endpoints: POST/GET/PUT/DELETE /api/v3/guides
 */
@RestController
@RequestMapping("/api/v3/guides")
@RequiredArgsConstructor
@Validated
@Slf4j
public class GuideController {

    private final GuideService guideService;
    private final AuthService authService;

    // ════════════════════════════════════════════════════════════════════════════
    // GUIDE CRUD
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/v3/guides
     * Crear nueva guía
     */
    @PostMapping
    public ResponseEntity<GuideResponse> createGuide(
        @Valid @RequestBody CreateGuideRequest request,
        @RequestHeader("Authorization") String token) {

        log.info("POST /api/v3/guides - Creating guide: city={}, year={}",
            request.getCity(), request.getYear());

        Long userId = authService.extractUserIdFromToken(token);

        // Mapear request a entity
        Guide guide = new Guide();
        guide.setCity(request.getCity());
        guide.setYear(request.getYear());
        guide.setEdition(request.getEdition());
        guide.setGuideType(request.getGuideType());
        guide.setCollection(request.getCollection());
        guide.setDirector(request.getDirector());
        guide.setDirectorRole(request.getDirectorRole());
        guide.setCoverHeadline1(request.getCoverHeadline1());
        guide.setCoverHeadline2(request.getCoverHeadline2());
        guide.setCoverTagline(request.getCoverTagline());
        guide.setCoverPhotoUrl(request.getCoverPhotoUrl());
        guide.setCoverBgColor(request.getCoverBgColor());
        guide.setDirectorsLetter(request.getDirectorsLetter());
        guide.setDirectorPhotoUrl(request.getDirectorPhotoUrl());
        guide.setMissionText(request.getMissionText());
        guide.setCriteriaList(request.getCriteriaList());
        guide.setPersonaName(request.getPersonaName());
        guide.setPersonaTagline(request.getPersonaTagline());
        guide.setPersonaPhotoUrl(request.getPersonaPhotoUrl());
        guide.setPersonaBio(request.getPersonaBio());
        guide.setPersonaQuote(request.getPersonaQuote());
        guide.setPersonaAwards(request.getPersonaAwards());
        guide.setSectionsConfig(request.getSectionsConfig());
        guide.setBackCoverConfig(request.getBackCoverConfig());
        guide.setPrimaryColor(request.getPrimaryColor());
        guide.setAccentColor(request.getAccentColor());

        Guide created = guideService.createGuide(guide, userId);

        log.info("Guide created: id={}", created.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(GuideResponse.fromEntity(created));
    }

    /**
     * GET /api/v3/guides
     * Listar guías con filtros
     */
    @GetMapping
    public ResponseEntity<List<GuideResponse>> listGuides(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String year,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String collection,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit) {

        log.info("GET /api/v3/guides - Listing guides: city={}, year={}, status={}",
            city, year, status);

        Map<String, Object> filters = new HashMap<>();
        if (q != null) filters.put("q", q);
        if (city != null) filters.put("city", city);
        if (year != null) filters.put("year", year);
        if (status != null) filters.put("status", status);
        if (collection != null) filters.put("collection", collection);
        filters.put("page", page);
        filters.put("limit", limit);

        List<Guide> guides = guideService.listGuides(filters);
        List<GuideResponse> responses = guides.stream()
            .map(GuideResponse::fromEntity)
            .collect(Collectors.toList());

        log.info("Found {} guides", responses.size());
        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/v3/guides/{id}
     * Obtener guía por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<GuideResponse> getGuide(@PathVariable String id) {
        log.debug("GET /api/v3/guides/{} - Fetching guide", id);

        return guideService.getGuide(id)
            .map(guide -> {
                log.info("Guide found: id={}, city={}", id, guide.getCity());
                return ResponseEntity.ok(GuideResponse.fromEntity(guide));
            })
            .orElseGet(() -> {
                log.warn("Guide not found: id={}", id);
                return ResponseEntity.notFound().build();
            });
    }

    /**
     * PUT /api/v3/guides/{id}
     * Actualizar guía
     */
    @PutMapping("/{id}")
    public ResponseEntity<GuideResponse> updateGuide(
        @PathVariable String id,
        @Valid @RequestBody UpdateGuideRequest request,
        @RequestHeader("Authorization") String token) {

        log.info("PUT /api/v3/guides/{} - Updating guide", id);

        Long userId = authService.extractUserIdFromToken(token);

        // Mapear request a entity
        Guide guide = new Guide();
        guide.setCity(request.getCity());
        guide.setYear(request.getYear());
        guide.setEdition(request.getEdition());
        guide.setGuideType(request.getGuideType());
        guide.setCollection(request.getCollection());
        guide.setStatus(request.getStatus());
        guide.setDirector(request.getDirector());
        guide.setDirectorRole(request.getDirectorRole());
        guide.setCoverHeadline1(request.getCoverHeadline1());
        guide.setCoverHeadline2(request.getCoverHeadline2());
        guide.setCoverTagline(request.getCoverTagline());
        guide.setCoverPhotoUrl(request.getCoverPhotoUrl());
        guide.setCoverBgColor(request.getCoverBgColor());
        guide.setDirectorsLetter(request.getDirectorsLetter());
        guide.setDirectorPhotoUrl(request.getDirectorPhotoUrl());
        guide.setMissionText(request.getMissionText());
        guide.setCriteriaList(request.getCriteriaList());
        guide.setPersonaName(request.getPersonaName());
        guide.setPersonaTagline(request.getPersonaTagline());
        guide.setPersonaPhotoUrl(request.getPersonaPhotoUrl());
        guide.setPersonaBio(request.getPersonaBio());
        guide.setPersonaQuote(request.getPersonaQuote());
        guide.setPersonaAwards(request.getPersonaAwards());
        guide.setSectionsConfig(request.getSectionsConfig());
        guide.setBackCoverConfig(request.getBackCoverConfig());
        guide.setPrimaryColor(request.getPrimaryColor());
        guide.setAccentColor(request.getAccentColor());

        Guide updated = guideService.updateGuide(id, guide, userId);

        log.info("Guide updated: id={}", id);
        return ResponseEntity.ok(GuideResponse.fromEntity(updated));
    }

    /**
     * DELETE /api/v3/guides/{id}
     * Eliminar guía (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGuide(
        @PathVariable String id,
        @RequestHeader("Authorization") String token) {

        log.info("DELETE /api/v3/guides/{} - Deleting guide", id);

        Long userId = authService.extractUserIdFromToken(token);
        guideService.deleteGuide(id, userId);

        log.info("Guide deleted: id={}", id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v3/guides/{id}/duplicate
     * Duplicar guía
     */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<GuideResponse> duplicateGuide(
        @PathVariable String id,
        @RequestHeader("Authorization") String token) {

        log.info("POST /api/v3/guides/{}/duplicate - Duplicating guide", id);

        Long userId = authService.extractUserIdFromToken(token);
        Guide duplicate = guideService.duplicateGuide(id, userId);

        log.info("Guide duplicated: sourceId={}, newId={}", id, duplicate.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(GuideResponse.fromEntity(duplicate));
    }

    /**
     * PATCH /api/v3/guides/{id}/status
     * Cambiar status de guía
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<GuideResponse> changeStatus(
        @PathVariable String id,
        @RequestBody ChangeStatusRequest request,
        @RequestHeader("Authorization") String token) {

        log.info("PATCH /api/v3/guides/{}/status - Changing status to {}", id, request.getStatus());

        Long userId = authService.extractUserIdFromToken(token);
        Guide updated = guideService.changeStatus(id, request.getStatus(), userId);

        log.info("Guide status changed: id={}, newStatus={}", id, request.getStatus());
        return ResponseEntity.ok(GuideResponse.fromEntity(updated));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GUIDE ITEMS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/v3/guides/{id}/items
     * Listar items de guía
     */
    @GetMapping("/{id}/items")
    public ResponseEntity<List<GuideItemResponse>> getGuideItems(
        @PathVariable String id,
        @RequestParam(required = false) String section) {

        log.debug("GET /api/v3/guides/{}/items - Fetching items", id);

        List<GuideItem> items = guideService.getGuideItems(id, section);
        List<GuideItemResponse> responses = items.stream()
            .map(GuideItemResponse::fromEntity)
            .collect(Collectors.toList());

        log.info("Found {} items in guide: id={}", responses.size(), id);
        return ResponseEntity.ok(responses);
    }

    /**
     * POST /api/v3/guides/{id}/items
     * Crear item en guía
     */
    @PostMapping("/{id}/items")
    public ResponseEntity<GuideItemResponse> addGuideItem(
        @PathVariable String id,
        @Valid @RequestBody CreateGuideItemRequest request,
        @RequestHeader("Authorization") String token) {

        log.info("POST /api/v3/guides/{}/items - Creating item: section={}", id, request.getSection());

        Long userId = authService.extractUserIdFromToken(token);

        GuideItem item = new GuideItem();
        item.setSection(request.getSection());
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setPhotoUrl(request.getPhotoUrl());
        item.setRating(request.getRating());
        item.setCategory(request.getCategory());
        item.setPrice(request.getPrice());
        item.setLocation(request.getLocation());
        item.setContactInfo(request.getContactInfo());
        item.setUrl(request.getUrl());
        item.setTags(request.getTags());
        item.setStats(request.getStats());
        item.setCategories(request.getCategories());
        item.setTimelineItems(request.getTimelineItems());
        item.setEnabled(request.isEnabled());
        item.setSortOrder(request.getSortOrder());

        GuideItem created = guideService.addGuideItem(id, item, userId);

        log.info("Item created: guideId={}, itemId={}", id, created.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(GuideItemResponse.fromEntity(created));
    }

    /**
     * PUT /api/v3/guides/{id}/items/{itemId}
     * Actualizar item
     */
    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<GuideItemResponse> updateGuideItem(
        @PathVariable String id,
        @PathVariable String itemId,
        @Valid @RequestBody UpdateGuideItemRequest request,
        @RequestHeader("Authorization") String token) {

        log.info("PUT /api/v3/guides/{}/items/{} - Updating item", id, itemId);

        Long userId = authService.extractUserIdFromToken(token);

        GuideItem item = new GuideItem();
        item.setSection(request.getSection());
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setPhotoUrl(request.getPhotoUrl());
        item.setRating(request.getRating());
        item.setCategory(request.getCategory());
        item.setPrice(request.getPrice());
        item.setLocation(request.getLocation());
        item.setContactInfo(request.getContactInfo());
        item.setUrl(request.getUrl());
        item.setTags(request.getTags());
        item.setStats(request.getStats());
        item.setCategories(request.getCategories());
        item.setTimelineItems(request.getTimelineItems());
        item.setEnabled(request.isEnabled());
        item.setSortOrder(request.getSortOrder());

        GuideItem updated = guideService.updateGuideItem(id, itemId, item, userId);

        log.info("Item updated: guideId={}, itemId={}", id, itemId);
        return ResponseEntity.ok(GuideItemResponse.fromEntity(updated));
    }

    /**
     * DELETE /api/v3/guides/{id}/items/{itemId}
     * Eliminar item
     */
    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<Void> deleteGuideItem(
        @PathVariable String id,
        @PathVariable String itemId,
        @RequestHeader("Authorization") String token) {

        log.info("DELETE /api/v3/guides/{}/items/{} - Deleting item", id, itemId);

        Long userId = authService.extractUserIdFromToken(token);
        guideService.deleteGuideItem(id, itemId, userId);

        log.info("Item deleted: guideId={}, itemId={}", id, itemId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v3/guides/{id}/items/reorder
     * Reordenar items
     */
    @PostMapping("/{id}/items/reorder")
    public ResponseEntity<Map<String, String>> reorderGuideItems(
        @PathVariable String id,
        @Valid @RequestBody ReorderItemsRequest request,
        @RequestHeader("Authorization") String token) {

        log.info("POST /api/v3/guides/{}/items/reorder - Reordering {} items",
            id, request.getItemOrder().size());

        Long userId = authService.extractUserIdFromToken(token);
        guideService.reorderGuideItems(id, request.getItemOrder(), userId);

        log.info("Items reordered: guideId={}", id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    /**
     * POST /api/v3/guides/{id}/items/bulk
     * Crear múltiples items
     */
    @PostMapping("/{id}/items/bulk")
    public ResponseEntity<List<GuideItemResponse>> addGuideItemsBulk(
        @PathVariable String id,
        @Valid @RequestBody BulkGuideItemsRequest request,
        @RequestHeader("Authorization") String token) {

        log.info("POST /api/v3/guides/{}/items/bulk - Adding {} items, replaceSection={}",
            id, request.getItems().size(), request.getReplaceSection());

        Long userId = authService.extractUserIdFromToken(token);

        List<GuideItem> items = request.getItems().stream()
            .map(dto -> {
                GuideItem item = new GuideItem();
                item.setSection(dto.getSection());
                item.setTitle(dto.getTitle());
                item.setDescription(dto.getDescription());
                item.setPhotoUrl(dto.getPhotoUrl());
                item.setRating(dto.getRating());
                item.setCategory(dto.getCategory());
                item.setPrice(dto.getPrice());
                item.setLocation(dto.getLocation());
                item.setContactInfo(dto.getContactInfo());
                item.setUrl(dto.getUrl());
                item.setTags(dto.getTags());
                item.setStats(dto.getStats());
                item.setCategories(dto.getCategories());
                item.setTimelineItems(dto.getTimelineItems());
                item.setEnabled(dto.isEnabled());
                item.setSortOrder(dto.getSortOrder());
                return item;
            })
            .collect(Collectors.toList());

        List<GuideItem> created = guideService.addGuideItemsBulk(
            id, items, request.getReplaceSection(), userId);

        List<GuideItemResponse> responses = created.stream()
            .map(GuideItemResponse::fromEntity)
            .collect(Collectors.toList());

        log.info("Bulk insert completed: guideId={}, count={}", id, responses.size());
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // EXPORT & CONFIG
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/v3/guides/{id}/config
     * Obtener configuración JSON para templates (público)
     */
    @GetMapping("/{id}/config")
    public ResponseEntity<Map<String, Object>> getGuideConfig(@PathVariable String id) {
        log.debug("GET /api/v3/guides/{}/config - Fetching config", id);

        Map<String, Object> config = guideService.getGuideConfig(id);

        log.info("Config retrieved: guideId={}", id);
        return ResponseEntity.ok(config);
    }

    /**
     * POST /api/v3/guides/{id}/export
     * Exportar guía a PDF
     */
    @PostMapping("/{id}/export")
    public ResponseEntity<Map<String, String>> exportGuidePdf(
        @PathVariable String id,
        @RequestParam(required = false) String template,
        @RequestHeader("Authorization") String token) {

        log.info("POST /api/v3/guides/{}/export - Exporting to PDF: template={}", id, template);

        Long userId = authService.extractUserIdFromToken(token);

        // Verificar permisos
        if (!guideService.hasPermission(id, userId, "read")) {
            log.warn("Export denied: userId={}, guideId={}", userId, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String pdfUrl = guideService.exportGuidePdf(id, template);

        log.info("PDF export initiated: guideId={}, url={}", id, pdfUrl);
        return ResponseEntity.ok(Map.of("pdf_url", pdfUrl));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // HEALTH CHECK
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/v3/guides/health
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "guides-api-v3"));
    }
}
