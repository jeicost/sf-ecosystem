package com.discoolver.guides.service;

import com.discoolver.guides.entity.Guide;
import com.discoolver.guides.entity.GuideItem;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Interfaz de servicios para Guías
 * Define contrato de operaciones CRUD y de negocio
 */
public interface GuideService {

    // ════════════════════════════════════════════════════════════════════════════
    // GUIDE CRUD
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Crear nueva guía
     * @param guide Datos de la guía (city, year, guide_type son obligatorios)
     * @param userId Usuario que crea la guía (para created_by)
     * @return Guía creada con ID generado
     */
    Guide createGuide(Guide guide, Long userId);

    /**
     * Obtener guía por ID
     * @param id ID de la guía (UUID)
     * @return Guía con todos sus datos
     */
    Optional<Guide> getGuide(String id);

    /**
     * Listar guías con filtros opcionales
     * @param filters Map con: city, year, status, guide_type, collection, q (búsqueda), page, limit
     * @return Lista de guías (sin items, solo metadatos)
     */
    List<Guide> listGuides(Map<String, Object> filters);

    /**
     * Actualizar guía (solo metadatos, no items)
     * @param id ID de la guía
     * @param guide Datos actualizados
     * @param userId Usuario que actualiza (verificar permisos)
     * @return Guía actualizada
     */
    Guide updateGuide(String id, Guide guide, Long userId);

    /**
     * Eliminar guía (soft delete: cambiar status a archived)
     * @param id ID de la guía
     * @param userId Usuario que elimina (verificar permisos)
     */
    void deleteGuide(String id, Long userId);

    /**
     * Duplicar guía completa (metadatos + items)
     * Genera nuevo ID, copia todos los items, cambia status a draft
     * @param sourceId ID de guía a duplicar
     * @param userId Usuario que crea la duplicada
     * @return Nueva guía duplicada
     */
    Guide duplicateGuide(String sourceId, Long userId);

    /**
     * Cambiar status de guía (draft → review → published)
     * @param id ID de la guía
     * @param newStatus Nuevo status: draft|review|published|archived
     * @param userId Usuario que cambia status
     * @return Guía actualizada
     */
    Guide changeStatus(String id, String newStatus, Long userId);

    // ════════════════════════════════════════════════════════════════════════════
    // GUIDE ITEMS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Listar items de una guía
     * @param guideId ID de la guía
     * @param sectionFilter (opcional) Filtrar por sección específica
     * @return Items ordenados por sort_order
     */
    List<GuideItem> getGuideItems(String guideId, String sectionFilter);

    /**
     * Crear item en guía
     * @param guideId ID de la guía
     * @param item Datos del item
     * @param userId Usuario que crea
     * @return Item creado con ID
     */
    GuideItem addGuideItem(String guideId, GuideItem item, Long userId);

    /**
     * Actualizar item
     * @param guideId ID de la guía
     * @param itemId ID del item
     * @param item Datos actualizados
     * @param userId Usuario que actualiza
     * @return Item actualizado
     */
    GuideItem updateGuideItem(String guideId, String itemId, GuideItem item, Long userId);

    /**
     * Eliminar item
     * @param guideId ID de la guía
     * @param itemId ID del item
     * @param userId Usuario que elimina
     */
    void deleteGuideItem(String guideId, String itemId, Long userId);

    /**
     * Reordenar items dentro de una guía
     * @param guideId ID de la guía
     * @param itemOrder Map[itemId] → sort_order
     * @param userId Usuario que reordena
     */
    void reorderGuideItems(String guideId, Map<String, Integer> itemOrder, Long userId);

    /**
     * Crear múltiples items (bulk insert)
     * @param guideId ID de la guía
     * @param items Lista de items a insertar
     * @param replaceSection (opcional) Si true, elimina items previos de esa sección
     * @param userId Usuario que inserta
     * @return Items creados
     */
    List<GuideItem> addGuideItemsBulk(String guideId, List<GuideItem> items,
                                       String replaceSection, Long userId);

    // ════════════════════════════════════════════════════════════════════════════
    // EXPORTACIÓN Y CONFIG
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Obtener config JSON para renderizado de templates HTML
     * Incluye metadatos + items agrupados por sección
     * @param guideId ID de la guía
     * @return Map con estructura: {metadata, sections: {section_name: [items]}}
     */
    Map<String, Object> getGuideConfig(String guideId);

    /**
     * Generar PDF de la guía (async)
     * Delega a servicio de PDF (WeasyPrint o similar)
     * @param guideId ID de la guía
     * @param templateType (opcional) Tipo de template: standard|editorial|influencer|etc
     * @return URL del PDF generado o job ID si es async
     */
    String exportGuidePdf(String guideId, String templateType);

    // ════════════════════════════════════════════════════════════════════════════
    // UTILIDADES
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Obtener contador de items en una guía
     * @param guideId ID de la guía
     * @return Número de items
     */
    int getGuideItemsCount(String guideId);

    /**
     * Validar permisos: ¿puede userId editar esta guía?
     * @param guideId ID de la guía
     * @param userId ID del usuario
     * @param permission Tipo de permiso: "read"|"edit"|"delete"
     * @return true si tiene permiso
     */
    boolean hasPermission(String guideId, Long userId, String permission);
}
