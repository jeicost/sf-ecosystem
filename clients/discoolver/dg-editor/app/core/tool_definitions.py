ALL_TOOLS = [
    {
        "name": "toggle_section",
        "description": (
            "Activar o desactivar una sección o subsección de la guía. "
            "Úsalo cuando el usuario quiera incluir o excluir una sección del PDF generado."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "section_id": {"type": "string", "description": "ID de la sección a modificar"},
                "subsection_id": {
                    "type": "string",
                    "description": "ID de la subsección (opcional). Si se omite, se togglea la sección padre.",
                },
                "active": {"type": "boolean", "description": "true para activar, false para desactivar"},
                "reason": {"type": "string", "description": "Breve explicación del cambio para el historial"},
            },
            "required": ["section_id", "active", "reason"],
        },
    },
    {
        "name": "edit_section_content",
        "description": (
            "Editar el texto de introducción de una sección o subsección. "
            "Úsalo para reescribir, ampliar, reducir o cambiar el tono del contenido editorial."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "section_id": {"type": "string", "description": "ID de la sección a editar"},
                "subsection_id": {"type": "string", "description": "ID de la subsección (opcional)"},
                "content": {
                    "type": "string",
                    "description": "Nuevo contenido completo de la sección. Solo párrafos de texto plano.",
                },
                "edit_type": {
                    "type": "string",
                    "enum": ["rewrite", "append", "tone_adjust", "translate", "shorten", "expand"],
                    "description": "Tipo de edición para el historial de cambios",
                },
                "reason": {"type": "string", "description": "Breve descripción del cambio"},
            },
            "required": ["section_id", "content", "edit_type", "reason"],
        },
    },
    {
        "name": "add_recomendado",
        "description": (
            "Añadir un nuevo lugar recomendado a la guía. "
            "Úsalo cuando el usuario quiera incluir un restaurante, hotel, actividad u otro punto de interés."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "category": {
                    "type": "string",
                    "enum": ["restaurant", "hotel", "activity", "bar", "shop", "transport", "tip"],
                },
                "description": {
                    "type": "string",
                    "description": "Descripción editorial en español, máximo 150 palabras, voz Disclover: útil, directa, sin superlativos vacíos.",
                },
                "address": {"type": "string"},
                "price_range": {"type": "string", "enum": ["€", "€€", "€€€", "€€€€"]},
                "rating": {"type": "number", "minimum": 0, "maximum": 5},
                "section_id": {
                    "type": "string",
                    "description": "ID de la sección a la que pertenece este recomendado",
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Entre 2 y 6 etiquetas descriptivas en minúsculas",
                },
                "website": {"type": "string"},
            },
            "required": ["name", "category", "description", "section_id", "price_range"],
        },
    },
    {
        "name": "edit_recomendado",
        "description": (
            "Editar cualquier campo de un recomendado existente. "
            "Úsalo para actualizar descripción, precio, rating, etiquetas o cualquier dato."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "recomendado_id": {"type": "string", "description": "ID del recomendado a editar"},
                "fields": {
                    "type": "object",
                    "description": "Objeto con los campos a actualizar (solo los campos que cambian)",
                    "properties": {
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "address": {"type": "string"},
                        "price_range": {"type": "string", "enum": ["€", "€€", "€€€", "€€€€"]},
                        "rating": {"type": "number", "minimum": 0, "maximum": 5},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "website": {"type": "string"},
                        "active": {"type": "boolean"},
                        "section_id": {"type": "string"},
                    },
                },
                "reason": {"type": "string"},
            },
            "required": ["recomendado_id", "fields", "reason"],
        },
    },
    {
        "name": "delete_recomendado",
        "description": (
            "Eliminar permanentemente un recomendado de la guía. "
            "Pide confirmación al usuario antes de llamar esta herramienta."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "recomendado_id": {"type": "string", "description": "ID del recomendado a eliminar"},
                "reason": {"type": "string"},
            },
            "required": ["recomendado_id", "reason"],
        },
    },
    {
        "name": "change_guide_metadata",
        "description": (
            "Modificar los metadatos de la guía: título, idioma, estado de publicación, etiquetas, autor. "
            "No usar para contenido de secciones."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "fields": {
                    "type": "object",
                    "description": "Solo los campos a modificar",
                    "properties": {
                        "title": {"type": "string"},
                        "destination": {"type": "string"},
                        "language": {"type": "string"},
                        "status": {"type": "string", "enum": ["draft", "review", "published"]},
                        "tags": {"type": "array", "items": {"type": "string"}},
                        "author": {"type": "string"},
                    },
                },
                "reason": {"type": "string"},
            },
            "required": ["fields", "reason"],
        },
    },
    {
        "name": "adapt_to_profile",
        "description": (
            "Adaptar el tono y contenido editorial de la guía a un perfil de viajero. "
            "Activa/desactiva secciones relevantes y reescribe contenido según el perfil. "
            "Para cambios grandes, confirma con el usuario antes de ejecutar."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "profile": {
                    "type": "string",
                    "enum": ["nomadas", "moteros", "familias", "luxury"],
                    "description": "Perfil de viajero al que adaptar",
                },
                "scope": {
                    "type": "string",
                    "enum": ["full_guide", "selected_sections"],
                    "description": "Si aplicar a toda la guía o solo a secciones específicas",
                },
                "section_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Requerido si scope = selected_sections",
                },
                "preserve_recomendados": {
                    "type": "boolean",
                    "description": "Si true, no toca los recomendados existentes, solo adapta el texto editorial",
                },
                "reason": {"type": "string"},
            },
            "required": ["profile", "scope", "reason"],
        },
    },
]
