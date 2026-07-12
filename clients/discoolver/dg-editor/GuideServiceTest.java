package com.discoolver.guides.service;

import com.discoolver.guides.entity.Guide;
import com.discoolver.guides.entity.GuideItem;
import com.discoolver.guides.mapper.GuideMapper;
import com.discoolver.guides.mapper.GuideItemMapper;
import com.discoolver.guides.service.impl.GuideServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para GuideService
 * Usa mocks de GuideMapper y GuideItemMapper
 */
@DisplayName("GuideService Tests")
class GuideServiceTest {

    @Mock
    private GuideMapper guideMapper;

    @Mock
    private GuideItemMapper guideItemMapper;

    @InjectMocks
    private GuideServiceImpl guideService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CREATE TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Crear guía con campos obligatorios")
    void testCreateGuide_Success() {
        // Arrange
        Guide request = new Guide();
        request.setCity("Madrid");
        request.setYear("26");
        request.setGuideType("local");

        when(guideMapper.insert(any(Guide.class))).thenReturn(1);

        // Act
        Guide created = guideService.createGuide(request, 123L);

        // Assert
        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals("Madrid", created.getCity());
        assertEquals("26", created.getYear());
        assertEquals("local", created.getGuideType());
        assertEquals("draft", created.getStatus());
        assertEquals(123L, created.getCreatedBy());
        verify(guideMapper, times(1)).insert(any(Guide.class));
    }

    @Test
    @DisplayName("Crear guía sin campos obligatorios debe fallar")
    void testCreateGuide_MissingRequiredFields() {
        // Arrange
        Guide request = new Guide();
        request.setCity("Madrid");
        // Falta year y guideType

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
            guideService.createGuide(request, 123L)
        );
        verify(guideMapper, never()).insert(any());
    }

    @Test
    @DisplayName("Crear guía con valores por defecto")
    void testCreateGuide_WithDefaults() {
        // Arrange
        Guide request = new Guide();
        request.setCity("Barcelona");
        request.setYear("25");
        request.setGuideType("world");

        when(guideMapper.insert(any(Guide.class))).thenReturn(1);

        // Act
        Guide created = guideService.createGuide(request, 456L);

        // Assert
        assertEquals("estandar", created.getCollection());
        assertEquals("draft", created.getStatus());
        assertNotNull(created.getCreatedAt());
        assertNotNull(created.getUpdatedAt());
    }

    // ════════════════════════════════════════════════════════════════════════════
    // READ TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Obtener guía existente")
    void testGetGuide_Success() {
        // Arrange
        String guideId = "550e8400-e29b-41d4-a716-446655440000";
        Guide expected = new Guide();
        expected.setId(guideId);
        expected.setCity("Madrid");
        expected.setYear("26");

        when(guideMapper.selectById(guideId)).thenReturn(expected);
        when(guideItemMapper.selectByGuideId(guideId)).thenReturn(new ArrayList<>());

        // Act
        Optional<Guide> result = guideService.getGuide(guideId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(guideId, result.get().getId());
        assertEquals("Madrid", result.get().getCity());
        verify(guideMapper, times(1)).selectById(guideId);
    }

    @Test
    @DisplayName("Obtener guía inexistente")
    void testGetGuide_NotFound() {
        // Arrange
        String guideId = "nonexistent-id";
        when(guideMapper.selectById(guideId)).thenReturn(null);

        // Act
        Optional<Guide> result = guideService.getGuide(guideId);

        // Assert
        assertFalse(result.isPresent());
        verify(guideMapper, times(1)).selectById(guideId);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // LIST TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Listar guías sin filtros")
    void testListGuides_NoFilters() {
        // Arrange
        List<Guide> expected = Arrays.asList(
            new Guide() {{ setId("1"); setCity("Madrid"); }},
            new Guide() {{ setId("2"); setCity("Barcelona"); }}
        );

        when(guideMapper.selectByCriteria(null, null, null, null, null, 20, 0))
            .thenReturn(expected);

        // Act
        List<Guide> result = guideService.listGuides(new HashMap<>());

        // Assert
        assertEquals(2, result.size());
        verify(guideMapper, times(1)).selectByCriteria(anyString(), anyString(), anyString(), anyString(), anyString(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("Listar guías con filtro por ciudad")
    void testListGuides_WithCityFilter() {
        // Arrange
        List<Guide> expected = Collections.singletonList(
            new Guide() {{ setId("1"); setCity("Madrid"); }}
        );

        when(guideMapper.selectByCriteria("Madrid", null, null, null, null, 20, 0))
            .thenReturn(expected);

        // Act
        Map<String, Object> filters = new HashMap<>();
        filters.put("city", "Madrid");
        List<Guide> result = guideService.listGuides(filters);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Madrid", result.get(0).getCity());
    }

    // ════════════════════════════════════════════════════════════════════════════
    // UPDATE TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Actualizar guía existente")
    void testUpdateGuide_Success() {
        // Arrange
        String guideId = "550e8400-e29b-41d4-a716-446655440000";
        Guide existing = new Guide();
        existing.setId(guideId);
        existing.setCity("Madrid");
        existing.setCreatedBy(123L);
        existing.setCreatedAt(LocalDateTime.now());

        Guide updateData = new Guide();
        updateData.setCity("Barcelona");
        updateData.setEdition("Updated Edition");

        when(guideMapper.selectById(guideId)).thenReturn(existing);
        when(guideMapper.update(any(Guide.class))).thenReturn(1);

        Guide updated = new Guide();
        updated.setId(guideId);
        updated.setCity("Barcelona");
        when(guideMapper.selectById(guideId)).thenReturn(updated);

        // Act
        Guide result = guideService.updateGuide(guideId, updateData, 123L);

        // Assert
        assertNotNull(result);
        verify(guideMapper, times(2)).selectById(guideId);
        verify(guideMapper, times(1)).update(any(Guide.class));
    }

    @Test
    @DisplayName("Actualizar guía sin permisos debe fallar")
    void testUpdateGuide_NoPermission() {
        // Arrange
        String guideId = "550e8400-e29b-41d4-a716-446655440000";
        Guide existing = new Guide();
        existing.setId(guideId);
        existing.setCreatedBy(123L); // Otro usuario

        Guide updateData = new Guide();
        updateData.setCity("Barcelona");

        when(guideMapper.selectById(guideId)).thenReturn(existing);

        // Act & Assert
        assertThrows(SecurityException.class, () ->
            guideService.updateGuide(guideId, updateData, 999L) // Usuario diferente
        );
        verify(guideMapper, never()).update(any());
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DELETE TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Eliminar guía (soft delete)")
    void testDeleteGuide_Success() {
        // Arrange
        String guideId = "550e8400-e29b-41d4-a716-446655440000";
        Guide existing = new Guide();
        existing.setId(guideId);
        existing.setStatus("draft");
        existing.setCreatedBy(123L);

        when(guideMapper.selectById(guideId)).thenReturn(existing);
        when(guideMapper.update(any(Guide.class))).thenReturn(1);

        // Act
        guideService.deleteGuide(guideId, 123L);

        // Assert
        verify(guideMapper, times(1)).selectById(guideId);
        verify(guideMapper, times(1)).update(argThat(guide ->
            guide.getStatus().equals("archived")
        ));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // DUPLICATE TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Duplicar guía completa con items")
    void testDuplicateGuide_Success() {
        // Arrange
        String sourceId = "source-id";
        Guide source = new Guide();
        source.setId(sourceId);
        source.setCity("Madrid");
        source.setYear("26");
        source.setEdition("Original");
        source.setGuideType("local");

        GuideItem item = new GuideItem();
        item.setId("item-1");
        item.setGuideId(sourceId);
        item.setTitle("Item 1");
        item.setSection("restaurantes");

        when(guideMapper.selectById(sourceId)).thenReturn(source);
        when(guideItemMapper.selectByGuideId(sourceId)).thenReturn(Collections.singletonList(item));
        when(guideMapper.insert(any(Guide.class))).thenReturn(1);
        when(guideItemMapper.insert(any(GuideItem.class))).thenReturn(1);

        // Act
        Guide duplicate = guideService.duplicateGuide(sourceId, 123L);

        // Assert
        assertNotNull(duplicate);
        assertNotNull(duplicate.getId());
        assertNotEquals(sourceId, duplicate.getId());
        assertEquals("Original (Copy)", duplicate.getEdition());
        assertEquals("draft", duplicate.getStatus());
        verify(guideMapper, times(1)).insert(any(Guide.class));
        verify(guideItemMapper, times(1)).insert(any(GuideItem.class));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // STATUS CHANGE TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Cambiar status válido: draft → review")
    void testChangeStatus_ValidTransition() {
        // Arrange
        String guideId = "550e8400-e29b-41d4-a716-446655440000";
        Guide existing = new Guide();
        existing.setId(guideId);
        existing.setStatus("draft");

        when(guideMapper.selectById(guideId)).thenReturn(existing);
        when(guideMapper.update(any(Guide.class))).thenReturn(1);

        // Act
        Guide result = guideService.changeStatus(guideId, "review", 123L);

        // Assert
        assertNotNull(result);
        verify(guideMapper, times(1)).update(argThat(guide ->
            guide.getStatus().equals("review")
        ));
    }

    @Test
    @DisplayName("Cambiar status inválido debe fallar")
    void testChangeStatus_InvalidTransition() {
        // Arrange
        String guideId = "550e8400-e29b-41d4-a716-446655440000";
        Guide existing = new Guide();
        existing.setId(guideId);
        existing.setStatus("published");

        when(guideMapper.selectById(guideId)).thenReturn(existing);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () ->
            guideService.changeStatus(guideId, "draft", 123L) // published → draft es inválido
        );
        verify(guideMapper, never()).update(any());
    }

    // ════════════════════════════════════════════════════════════════════════════
    // ITEMS TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Obtener items de guía")
    void testGetGuideItems_Success() {
        // Arrange
        String guideId = "guide-1";
        List<GuideItem> expected = Arrays.asList(
            new GuideItem() {{ setId("item-1"); setTitle("Item 1"); }},
            new GuideItem() {{ setId("item-2"); setTitle("Item 2"); }}
        );

        when(guideItemMapper.selectByGuideId(guideId)).thenReturn(expected);

        // Act
        List<GuideItem> result = guideService.getGuideItems(guideId, null);

        // Assert
        assertEquals(2, result.size());
        verify(guideItemMapper, times(1)).selectByGuideId(guideId);
    }

    @Test
    @DisplayName("Crear item en guía")
    void testAddGuideItem_Success() {
        // Arrange
        String guideId = "guide-1";
        Guide guide = new Guide();
        guide.setId(guideId);

        GuideItem request = new GuideItem();
        request.setSection("restaurantes");
        request.setTitle("El Retiro");
        request.setDescription("Restaurante de comida española");

        when(guideMapper.selectById(guideId)).thenReturn(guide);
        when(guideItemMapper.selectByGuideAndSection(guideId, "restaurantes")).thenReturn(new ArrayList<>());
        when(guideItemMapper.insert(any(GuideItem.class))).thenReturn(1);

        // Act
        GuideItem created = guideService.addGuideItem(guideId, request, 123L);

        // Assert
        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals("El Retiro", created.getTitle());
        assertEquals(1, created.getSortOrder());
        verify(guideItemMapper, times(1)).insert(any(GuideItem.class));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // PERMISSION TESTS
    // ════════════════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Verificar permisos: creador puede leer")
    void testHasPermission_ReadAccess() {
        // Arrange
        String guideId = "guide-1";
        Guide guide = new Guide();
        guide.setId(guideId);
        guide.setCreatedBy(123L);

        when(guideMapper.selectById(guideId)).thenReturn(guide);

        // Act
        boolean result = guideService.hasPermission(guideId, 123L, "read");

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Verificar permisos: creador puede editar")
    void testHasPermission_EditAccess() {
        // Arrange
        String guideId = "guide-1";
        Guide guide = new Guide();
        guide.setId(guideId);
        guide.setCreatedBy(123L);

        when(guideMapper.selectById(guideId)).thenReturn(guide);

        // Act
        boolean result = guideService.hasPermission(guideId, 123L, "edit");

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Verificar permisos: otro usuario NO puede editar")
    void testHasPermission_NoEditAccess() {
        // Arrange
        String guideId = "guide-1";
        Guide guide = new Guide();
        guide.setId(guideId);
        guide.setCreatedBy(123L);

        when(guideMapper.selectById(guideId)).thenReturn(guide);

        // Act
        boolean result = guideService.hasPermission(guideId, 999L, "edit");

        // Assert
        assertFalse(result);
    }
}
