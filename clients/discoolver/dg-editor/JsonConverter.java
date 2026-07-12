package com.discoolver.guides.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import com.alibaba.fastjson.JSON;
import java.util.Map;

/**
 * JPA Attribute Converter para campos JSON en MySQL
 * Serializa/deserializa automáticamente Map<String, Object> a/desde JSON
 * Usa FastJSON v1 (compatible con los MyBatis type handlers)
 *
 * Uso: @Convert(converter = JsonConverter.class)
 * Dependencia: com.alibaba:fastjson:1.2.x
 */
@Converter(autoApply = false)
public class JsonConverter implements AttributeConverter<Object, String> {

    @Override
    public String convertToDatabaseColumn(Object attribute) {
        if (attribute == null) {
            return null;
        }

        try {
            // Serializar a JSON string usando FastJSON v1
            return JSON.toJSONString(attribute);
        } catch (Exception e) {
            throw new IllegalArgumentException("Error serializando JSON", e);
        }
    }

    @Override
    public Object convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }

        try {
            // Deserializar desde JSON string
            // Si es un array devuelve List, si es un objeto devuelve Map
            if (dbData.trim().startsWith("[")) {
                return JSON.parseArray(dbData);
            } else {
                return JSON.parseObject(dbData);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Error deserializando JSON", e);
        }
    }
}
