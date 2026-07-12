package com.discoolver.guides.service.impl;

import com.discoolver.guides.entity.Guide;
import com.discoolver.guides.entity.GuideItem;
import com.discoolver.guides.mapper.GuideMapper;
import com.discoolver.guides.mapper.GuideItemMapper;
import com.discoolver.guides.service.GuideService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementación de GuideService
 * Contiene toda la lógica de negocio para CRUD de Guías e Items
 *
 * Usa MyBatis mappers para acceso a BD:
 * - GuideMapper.java: CRUD guides
 * - GuideItemMapper.java: CRUD guide_items
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class GuideServiceImpl implements GuideService {

    private final GuideMapper guideMapper;
    private final GuideItemMapper guideItemMapper;

    // ════════════════════════════════════════════════════════════════════════════
    // GUIDE CRUD
    // ════════════════════════════════════════════════════════════════════════════

    @Override
    public Guide createGuide(Guide guide, Long userId) {
        log.info("Creating guide: city={}, year={}, guideType={}",
            guide.getCity(), guide.getYear(), guide.getGuideType());

        // Validar campos obligatorios
        if (guide.getCity() == null || guide.getYear() == null || guide.getGuideType() == null) {
            throw new IllegalArgumentException("city, year, guide_type son obligatorios");
        }

        // Generar ID (UUID v4)
        guide.setId(UUID.randomUUID().toString());

        // Establecer valores por defecto
        if (guide.getStatus() == null) {
            guide.setStatus("draft");
        }
        if (guide.getCollection() == null) {
            guide.setCollection("estandar");
        }

        // Establecer metadata de creación
        guide.setCreatedBy(userId);
        guide.setCreatedAt(LocalDateTime.now());
        guide.setUpdatedAt(LocalDateTime.now());

        // Insertar en BD
        int rowsInserted = guideMapper.insert(guide);
        if (rowsInserted == 0) {
            throw new RuntimeException("Failed to insert guide");
        }

        log.info("Guide created successfully: id={}", guide.getId());
        return guide;
    }

    @Override
    public Optional<Guide> getGuide(String id) {
        log.debug("Fetching guide: id={}", id);
        Guide guide = guideMapper.selectById(id);

        if (guide != null) {
            // Cargar items en la guía (opcional: comentar si solo quieres metadatos)
            List<GuideItem> items = guideItemMapper.selectByGuideId(id);
            // guide.setItems(items);  // Si Guide tiene propiedad items
        }

        return Optional.ofNullable(guide);
    }

    @Override
    public List<Guide> listGuides(Map<String, Object> filters) {
        log.info("Listing guides with filters: {}", filters);

        // Extraer parámetros de filtros
        String city = (String) filters.get("city");
        String year = (String) filters.get("year");
        String status = (String) filters.get("status");
        String guideType = (String) filters.get("guide_type");
        String collection = (String) filters.get("collection");
        String searchQuery = (String) filters.get("q");
        Integer page = (Integer) filters.getOrDefault("page", 1);
        Integer limit = (Integer) filters.getOrDefault("limit", 20);

        // Calcular offset para paginación
        int offset = (page - 1) * limit;

        // Si hay búsqueda general, aplicar en city o edition
        if (searchQuery != null && !searchQuery.isEmpty()) {
            // Buscar en city o edition (LIKE %query%)
            List<Guide> results = guideMapper.selectByQuery(searchQuery, limit, offset);
            return results;
        }

        // Sino, usar filtros específicos
        List<Guide> guides = guideMapper.selectByCriteria(city, year, status, guideType, collection, limit, offset);

        log.info("Found {} guides", guides.size());
        return guides;
    }

    @Override
    public Guide updateGuide(String id, Guide guide, Long userId) {
        log.info("Updating guide: id={}", id);

        // Verificar que la guía existe
        Guide existing = guideMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("Guide not found: " + id);
        }

        // Verificar permisos (solo creador o admin puede editar)
        if (!hasPermission(id, userId, "edit")) {
            throw new SecurityException("User does not have permission to edit this guide");
        }

        // Copiar ID y datos de auditoría
        guide.setId(id);
        guide.setCreatedBy(existing.getCreatedBy());
        guide.setCreatedAt(existing.getCreatedAt());
        guide.setUpdatedAt(LocalDateTime.now());

        // Actualizar en BD
        int rowsUpdated = guideMapper.update(guide);
        if (rowsUpdated == 0) {
            throw new RuntimeException("Failed to update guide");
        }

        log.info("Guide updated successfully: id={}", id);
        return guideMapper.selectById(id);
    }

    @Override
    public void deleteGuide(String id, Long userId) {
        log.info("Deleting guide: id={}", id);

        // Verificar que existe
        Guide existing = guideMapper.selectById(id);
        if (existing == null) {
            throw new RuntimeException("Guide not found: " + id);
        }

        // Verificar permisos
        if (!hasPermission(id, userId, "delete")) {
            throw new SecurityException("User does not have permission to delete this guide");
        }

        // Soft delete: cambiar status a "archived"
        existing.setStatus("archived");
        existing.setUpdatedAt(LocalDateTime.now());
        guideMapper.update(existing);

        // Opcional: también marcar items como archived (comentado si prefieres solo soft-delete la guía)
        // guideItemMapper.deleteByGuideId(id);

        log.info("Guide archived successfully: id={}", id);
    }

    @Override
    public Guide duplicateGuide(String sourceId, Long userId) {
        log.info("Duplicating guide: sourceId={}", sourceId);

        // Obtener guía origen
        Guide source = guideMapper.selectById(sourceId);
        if (source == null) {
            throw new RuntimeException("Source guide not found: " + sourceId);
        }

        // Crear copia
        Guide duplicate = new Guide();
        duplicate.setId(UUID.randomUUID().toString());
        duplicate.setCity(source.getCity());
        duplicate.setYear(source.getYear());
        duplicate.setEdition(source.getEdition() + " (Copy)");
        duplicate.setGuideType(source.getGuideType());
        duplicate.setCollection(source.getCollection());
        duplicate.setStatus("draft");
        duplicate.setDirector(source.getDirector());
        duplicate.setDirectorRole(source.getDirectorRole());
        duplicate.setCoverHeadline1(source.getCoverHeadline1());
        duplicate.setCoverHeadline2(source.getCoverHeadline2());
        duplicate.setCoverTagline(source.getCoverTagline());
        duplicate.setCoverPhotoUrl(source.getCoverPhotoUrl());
        duplicate.setCoverBgColor(source.getCoverBgColor());
        duplicate.setDirectorsLetter(source.getDirectorsLetter());
        duplicate.setDirectorPhotoUrl(source.getDirectorPhotoUrl());
        duplicate.setMissionText(source.getMissionText());
        duplicate.setCriteriaList(source.getCriteriaList());
        duplicate.setPersonaName(source.getPersonaName());
        duplicate.setPersonaTagline(source.getPersonaTagline());
        duplicate.setPersonaPhotoUrl(source.getPersonaPhotoUrl());
        duplicate.setPersonaBio(source.getPersonaBio());
        duplicate.setPersonaQuote(source.getPersonaQuote());
        duplicate.setPersonaAwards(source.getPersonaAwards());
        duplicate.setSectionsConfig(source.getSectionsConfig());
        duplicate.setBackCoverConfig(source.getBackCoverConfig());
        duplicate.setPrimaryColor(source.getPrimaryColor());
        duplicate.setAccentColor(source.getAccentColor());
        duplicate.setCreatedBy(userId);
        duplicate.setCreatedAt(LocalDateTime.now());
        duplicate.setUpdatedAt(LocalDateTime.now());

        // Insertar guía duplicada
        guideMapper.insert(duplicate);

        // Copiar todos los items de la guía origen
        List<GuideItem> sourceItems = guideItemMapper.selectByGuideId(sourceId);
        for (GuideItem sourceItem : sourceItems) {
            GuideItem newItem = new GuideItem();
            newItem.setId(UUID.randomUUID().toString());
            newItem.setGuideId(duplicate.getId());
            newItem.setSection(sourceItem.getSection());
            newItem.setTitle(sourceItem.getTitle());
            newItem.setDescription(sourceItem.getDescription());
            newItem.setPhotoUrl(sourceItem.getPhotoUrl());
            newItem.setRating(sourceItem.getRating());
            newItem.setCategory(sourceItem.getCategory());
            newItem.setPrice(sourceItem.getPrice());
            newItem.setLocation(sourceItem.getLocation());
            newItem.setContactInfo(sourceItem.getContactInfo());
            newItem.setUrl(sourceItem.getUrl());
            newItem.setTags(sourceItem.getTags());
            newItem.setStats(sourceItem.getStats());
            newItem.setCategories(sourceItem.getCategories());
            newItem.setTimelineItems(sourceItem.getTimelineItems());
            newItem.setEnabled(sourceItem.isEnabled());
            newItem.setSortOrder(sourceItem.getSortOrder());
            newItem.setCreatedBy(userId);
            newItem.setCreatedAt(LocalDateTime.now());
            newItem.setUpdatedAt(LocalDateTime.now());

            guideItemMapper.insert(newItem);
        }

        log.info("Guide duplicated successfully: sourceId={}, newId={}", sourceId, duplicate.getId());
        return duplicate;
    }

    @Override
    public Guide changeStatus(String id, String newStatus, Long userId) {
        log.info("Changing guide status: id={}, newStatus={}", id, newStatus);

        Guide guide = guideMapper.selectById(id);
        if (guide == null) {
            throw new RuntimeException("Guide not found: " + id);
        }

        // Validar transiciones de estado
        String currentStatus = guide.getStatus();
        if (!isValidStatusTransition(currentStatus, newStatus)) {
            throw new IllegalArgumentException(
                String.format("Invalid status transition: %s -> %s", currentStatus, newStatus)
            );
        }

        guide.setStatus(newStatus);
        guide.setUpdatedAt(LocalDateTime.now());
        guideMapper.update(guide);

        log.info("Guide status changed: id={}, newStatus={}", id, newStatus);
        return guide;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GUIDE ITEMS
    // ════════════════════════════════════════════════════════════════════════════

    @Override
    public List<GuideItem> getGuideItems(String guideId, String sectionFilter) {
        log.debug("Fetching items for guide: guideId={}, section={}", guideId, sectionFilter);

        if (sectionFilter != null && !sectionFilter.isEmpty()) {
            return guideItemMapper.selectByGuideAndSection(guideId, sectionFilter);
        }
        return guideItemMapper.selectByGuideId(guideId);
    }

    @Override
    public GuideItem addGuideItem(String guideId, GuideItem item, Long userId) {
        log.info("Adding item to guide: guideId={}, section={}", guideId, item.getSection());

        // Verificar que la guía existe
        Guide guide = guideMapper.selectById(guideId);
        if (guide == null) {
            throw new RuntimeException("Guide not found: " + guideId);
        }

        // Verificar permisos
        if (!hasPermission(guideId, userId, "edit")) {
            throw new SecurityException("User does not have permission to edit this guide");
        }

        // Generar ID y metadatos
        item.setId(UUID.randomUUID().toString());
        item.setGuideId(guideId);
        item.setCreatedBy(userId);
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        // Si no hay sort_order, asignar al final
        if (item.getSortOrder() == 0) {
            List<GuideItem> existing = guideItemMapper.selectByGuideAndSection(guideId, item.getSection());
            item.setSortOrder(existing.size() + 1);
        }

        // Insertar
        int rowsInserted = guideItemMapper.insert(item);
        if (rowsInserted == 0) {
            throw new RuntimeException("Failed to insert item");
        }

        log.info("Item added successfully: itemId={}", item.getId());
        return item;
    }

    @Override
    public GuideItem updateGuideItem(String guideId, String itemId, GuideItem item, Long userId) {
        log.info("Updating item: guideId={}, itemId={}", guideId, itemId);

        // Verificar que el item existe y pertenece a esta guía
        GuideItem existing = guideItemMapper.selectById(itemId);
        if (existing == null || !existing.getGuideId().equals(guideId)) {
            throw new RuntimeException("Item not found or does not belong to this guide");
        }

        // Verificar permisos
        if (!hasPermission(guideId, userId, "edit")) {
            throw new SecurityException("User does not have permission to edit this guide");
        }

        // Actualizar
        item.setId(itemId);
        item.setGuideId(guideId);
        item.setCreatedBy(existing.getCreatedBy());
        item.setCreatedAt(existing.getCreatedAt());
        item.setUpdatedAt(LocalDateTime.now());

        guideItemMapper.update(item);

        log.info("Item updated successfully: itemId={}", itemId);
        return guideItemMapper.selectById(itemId);
    }

    @Override
    public void deleteGuideItem(String guideId, String itemId, Long userId) {
        log.info("Deleting item: guideId={}, itemId={}", guideId, itemId);

        GuideItem item = guideItemMapper.selectById(itemId);
        if (item == null || !item.getGuideId().equals(guideId)) {
            throw new RuntimeException("Item not found or does not belong to this guide");
        }

        if (!hasPermission(guideId, userId, "edit")) {
            throw new SecurityException("User does not have permission to edit this guide");
        }

        guideItemMapper.delete(itemId);
        log.info("Item deleted successfully: itemId={}", itemId);
    }

    @Override
    public void reorderGuideItems(String guideId, Map<String, Integer> itemOrder, Long userId) {
        log.info("Reordering items in guide: guideId={}, itemCount={}", guideId, itemOrder.size());

        if (!hasPermission(guideId, userId, "edit")) {
            throw new SecurityException("User does not have permission to edit this guide");
        }

        // Actualizar sort_order para cada item
        for (Map.Entry<String, Integer> entry : itemOrder.entrySet()) {
            String itemId = entry.getKey();
            Integer newOrder = entry.getValue();

            GuideItem item = guideItemMapper.selectById(itemId);
            if (item != null && item.getGuideId().equals(guideId)) {
                item.setSortOrder(newOrder);
                item.setUpdatedAt(LocalDateTime.now());
                guideItemMapper.update(item);
            }
        }

        log.info("Items reordered successfully: guideId={}", guideId);
    }

    @Override
    public List<GuideItem> addGuideItemsBulk(String guideId, List<GuideItem> items,
                                              String replaceSection, Long userId) {
        log.info("Adding items in bulk: guideId={}, itemCount={}, replaceSection={}",
            guideId, items.size(), replaceSection);

        if (!hasPermission(guideId, userId, "edit")) {
            throw new SecurityException("User does not have permission to edit this guide");
        }

        // Si replaceSection está especificada, eliminar items previos de esa sección
        if (replaceSection != null && !replaceSection.isEmpty()) {
            guideItemMapper.deleteByGuideAndSection(guideId, replaceSection);
            log.info("Replaced section items: section={}", replaceSection);
        }

        // Insertar nuevos items
        List<GuideItem> inserted = new ArrayList<>();
        for (GuideItem item : items) {
            item.setId(UUID.randomUUID().toString());
            item.setGuideId(guideId);
            item.setCreatedBy(userId);
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());

            guideItemMapper.insert(item);
            inserted.add(item);
        }

        log.info("Bulk insert completed: inserted={} items", inserted.size());
        return inserted;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // EXPORTACIÓN Y CONFIG
    // ════════════════════════════════════════════════════════════════════════════

    @Override
    public Map<String, Object> getGuideConfig(String guideId) {
        log.info("Getting guide config: guideId={}", guideId);

        Guide guide = guideMapper.selectById(guideId);
        if (guide == null) {
            throw new RuntimeException("Guide not found: " + guideId);
        }

        Map<String, Object> config = new LinkedHashMap<>();

        // Metadatos de la guía
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("id", guide.getId());
        metadata.put("city", guide.getCity());
        metadata.put("year", guide.getYear());
        metadata.put("edition", guide.getEdition());
        metadata.put("guide_type", guide.getGuideType());
        metadata.put("collection", guide.getCollection());
        metadata.put("status", guide.getStatus());
        metadata.put("director", guide.getDirector());
        metadata.put("director_role", guide.getDirectorRole());
        metadata.put("cover_headline1", guide.getCoverHeadline1());
        metadata.put("cover_headline2", guide.getCoverHeadline2());
        metadata.put("cover_tagline", guide.getCoverTagline());
        metadata.put("cover_photo_url", guide.getCoverPhotoUrl());
        metadata.put("cover_bg_color", guide.getCoverBgColor());
        metadata.put("directors_letter", guide.getDirectorsLetter());
        metadata.put("director_photo_url", guide.getDirectorPhotoUrl());
        metadata.put("mission_text", guide.getMissionText());
        metadata.put("criteria_list", guide.getCriteriaList());
        metadata.put("persona_name", guide.getPersonaName());
        metadata.put("persona_tagline", guide.getPersonaTagline());
        metadata.put("persona_photo_url", guide.getPersonaPhotoUrl());
        metadata.put("persona_bio", guide.getPersonaBio());
        metadata.put("persona_quote", guide.getPersonaQuote());
        metadata.put("persona_awards", guide.getPersonaAwards());
        metadata.put("primary_color", guide.getPrimaryColor());
        metadata.put("accent_color", guide.getAccentColor());
        metadata.put("sections_config", guide.getSectionsConfig());
        metadata.put("back_cover_config", guide.getBackCoverConfig());

        config.put("metadata", metadata);

        // Items agrupados por sección
        List<GuideItem> allItems = guideItemMapper.selectByGuideId(guideId);
        Map<String, List<Map<String, Object>>> sections = new LinkedHashMap<>();

        for (GuideItem item : allItems) {
            String section = item.getSection() != null ? item.getSection() : "uncategorized";

            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("id", item.getId());
            itemMap.put("title", item.getTitle());
            itemMap.put("description", item.getDescription());
            itemMap.put("photo_url", item.getPhotoUrl());
            itemMap.put("rating", item.getRating());
            itemMap.put("category", item.getCategory());
            itemMap.put("price", item.getPrice());
            itemMap.put("location", item.getLocation());
            itemMap.put("contact_info", item.getContactInfo());
            itemMap.put("url", item.getUrl());
            itemMap.put("tags", item.getTags());
            itemMap.put("stats", item.getStats());
            itemMap.put("categories", item.getCategories());
            itemMap.put("timeline_items", item.getTimelineItems());
            itemMap.put("enabled", item.isEnabled());
            itemMap.put("sort_order", item.getSortOrder());

            sections.computeIfAbsent(section, k -> new ArrayList<>()).add(itemMap);
        }

        // Ordenar items por sort_order dentro de cada sección
        sections.forEach((section, items) ->
            items.sort(Comparator.comparing(item -> (Integer) item.get("sort_order")))
        );

        config.put("sections", sections);

        log.info("Guide config retrieved: guideId={}, sections={}", guideId, sections.keySet());
        return config;
    }

    @Override
    public String exportGuidePdf(String guideId, String templateType) {
        log.info("Exporting guide to PDF: guideId={}, template={}", guideId, templateType);

        Guide guide = guideMapper.selectById(guideId);
        if (guide == null) {
            throw new RuntimeException("Guide not found: " + guideId);
        }

        // TODO: Implementar integración con servicio PDF (WeasyPrint, Playwright, etc)
        // Por ahora retornar URL de ejemplo
        String pdfUrl = String.format("https://storage.discoolver.com/guides/%s.pdf", guideId);

        log.info("PDF export initiated: guideId={}, url={}", guideId, pdfUrl);
        return pdfUrl;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // UTILIDADES
    // ════════════════════════════════════════════════════════════════════════════

    @Override
    public int getGuideItemsCount(String guideId) {
        List<GuideItem> items = guideItemMapper.selectByGuideId(guideId);
        return items != null ? items.size() : 0;
    }

    @Override
    public boolean hasPermission(String guideId, Long userId, String permission) {
        Guide guide = guideMapper.selectById(guideId);
        if (guide == null) {
            return false;
        }

        // TODO: Implementar lógica de permisos basada en roles
        // Por ahora: solo creador puede editar/eliminar, cualquiera puede leer
        //
        // Lógica propuesta:
        // - ROLE_ADMIN: todo
        // - ROLE_EDITOR: solo si es creador o tiene permiso EDIT_GUIDE
        // - ROLE_VIEWER: solo lectura
        //
        // Implementar en base a JWT claims y tabla de permisos

        if ("read".equals(permission)) {
            return true; // Cualquiera puede leer
        }

        // Para edit/delete, verificar si es creador (placeholder)
        if ("edit".equals(permission) || "delete".equals(permission)) {
            return guide.getCreatedBy().equals(userId); // Por ahora: solo creador
        }

        return false;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // VALIDACIONES PRIVADAS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Validar transiciones de estado válidas
     * draft → review → published ✅
     * * → archived ✅
     */
    private boolean isValidStatusTransition(String from, String to) {
        if ("archived".equals(to)) {
            return true; // Se puede archivar desde cualquier estado
        }

        if ("draft".equals(from)) {
            return "review".equals(to) || "published".equals(to);
        }

        if ("review".equals(from)) {
            return "published".equals(to) || "draft".equals(to);
        }

        if ("published".equals(from)) {
            return "review".equals(to) || "draft".equals(to);
        }

        return false;
    }
}
