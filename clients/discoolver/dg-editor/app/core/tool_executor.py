import uuid
from datetime import datetime

from app.models.guide import Guide, Recomendado, HistoryChange


def execute(tool_name: str, tool_input: dict, guide: Guide) -> tuple[bool, str]:
    """
    Dispatch a Claude tool_use block to the corresponding guide mutation.
    Returns (success, summary_message).
    """
    try:
        if tool_name == "toggle_section":
            return _toggle_section(tool_input, guide)
        elif tool_name == "edit_section_content":
            return _edit_section_content(tool_input, guide)
        elif tool_name == "add_recomendado":
            return _add_recomendado(tool_input, guide)
        elif tool_name == "edit_recomendado":
            return _edit_recomendado(tool_input, guide)
        elif tool_name == "delete_recomendado":
            return _delete_recomendado(tool_input, guide)
        elif tool_name == "change_guide_metadata":
            return _change_guide_metadata(tool_input, guide)
        elif tool_name == "adapt_to_profile":
            return _adapt_to_profile(tool_input, guide)
        else:
            return False, f"Herramienta desconocida: {tool_name}"
    except Exception as e:
        return False, f"Error ejecutando {tool_name}: {str(e)}"


def _toggle_section(inp: dict, guide: Guide) -> tuple[bool, str]:
    section = guide.get_section(inp["section_id"])
    if not section:
        return False, f"Sección {inp['section_id']} no encontrada"

    sub_id = inp.get("subsection_id")
    if sub_id:
        sub = next((s for s in section.subsections if s.id == sub_id), None)
        if not sub:
            return False, f"Subsección {sub_id} no encontrada"
        sub.active = inp["active"]
        state = "activada" if inp["active"] else "desactivada"
        return True, f"Subsección '{sub.name}' {state}"
    else:
        section.active = inp["active"]
        state = "activada" if inp["active"] else "desactivada"
        return True, f"Sección '{section.name}' {state}"


def _edit_section_content(inp: dict, guide: Guide) -> tuple[bool, str]:
    section = guide.get_section(inp["section_id"])
    if not section:
        return False, f"Sección {inp['section_id']} no encontrada"

    sub_id = inp.get("subsection_id")
    if sub_id:
        sub = next((s for s in section.subsections if s.id == sub_id), None)
        if not sub:
            return False, f"Subsección {sub_id} no encontrada"
        sub.content = inp["content"]
        return True, f"Contenido de subsección '{sub.name}' actualizado ({inp['edit_type']})"
    else:
        section.content = inp["content"]
        return True, f"Contenido de sección '{section.name}' actualizado ({inp['edit_type']})"


def _add_recomendado(inp: dict, guide: Guide) -> tuple[bool, str]:
    rec = Recomendado(
        id=f"rec-{str(uuid.uuid4())[:8]}",
        name=inp["name"],
        category=inp["category"],
        description=inp["description"],
        address=inp.get("address", ""),
        price_range=inp.get("price_range", "€€"),
        rating=inp.get("rating", 0.0),
        active=True,
        section_id=inp["section_id"],
        tags=inp.get("tags", []),
        website=inp.get("website", ""),
    )
    guide.recomendados.append(rec)
    return True, f"Recomendado '{rec.name}' añadido (ID: {rec.id})"


def _edit_recomendado(inp: dict, guide: Guide) -> tuple[bool, str]:
    rec = guide.get_recomendado(inp["recomendado_id"])
    if not rec:
        return False, f"Recomendado {inp['recomendado_id']} no encontrado"
    fields = inp.get("fields", {})
    for key, value in fields.items():
        if hasattr(rec, key):
            setattr(rec, key, value)
    changed = ", ".join(fields.keys())
    return True, f"Recomendado '{rec.name}' actualizado: {changed}"


def _delete_recomendado(inp: dict, guide: Guide) -> tuple[bool, str]:
    rec = guide.get_recomendado(inp["recomendado_id"])
    if not rec:
        return False, f"Recomendado {inp['recomendado_id']} no encontrado"
    name = rec.name
    guide.recomendados = [r for r in guide.recomendados if r.id != inp["recomendado_id"]]
    return True, f"Recomendado '{name}' eliminado"


def _change_guide_metadata(inp: dict, guide: Guide) -> tuple[bool, str]:
    fields = inp.get("fields", {})
    allowed = {"title", "destination", "language", "status", "tags", "author"}
    changed = []
    for key, value in fields.items():
        if key in allowed and hasattr(guide.metadata, key):
            setattr(guide.metadata, key, value)
            changed.append(key)
    return True, f"Metadatos actualizados: {', '.join(changed)}"


def _adapt_to_profile(inp: dict, guide: Guide) -> tuple[bool, str]:
    """
    Meta-tool: applies basic profile adaptations by toggling sections.
    Full content rewriting is handled by the Claude agentic loop which
    calls the atomic tools after receiving this tool result.
    """
    profile = inp["profile"]
    scope = inp["scope"]

    profile_section_hints = {
        "nomadas": {
            "keep": ["gastronomia", "barrios-esenciales", "bienvenida"],
            "hide": ["playas-naturaleza"],
        },
        "moteros": {
            "keep": ["bienvenida", "barrios-esenciales"],
            "hide": [],
        },
        "familias": {
            "keep": ["bienvenida", "playas-naturaleza", "barrios-esenciales"],
            "hide": [],
        },
        "luxury": {
            "keep": ["bienvenida", "gastronomia", "arquitectura-cultura", "barrios-esenciales"],
            "hide": [],
        },
    }

    hints = profile_section_hints.get(profile, {})
    hide_slugs = hints.get("hide", [])
    toggled = []

    if scope == "full_guide" and hide_slugs:
        for section in guide.sections:
            if section.slug in hide_slugs:
                section.active = False
                toggled.append(section.name)

    summary = f"Perfil '{profile}' aplicado."
    if toggled:
        summary += f" Secciones desactivadas: {', '.join(toggled)}."
    summary += " Continúa editando el contenido editorial con edit_section_content."
    return True, summary


def record_change(guide: Guide, tool_name: str, target: str, summary: str) -> None:
    """Append a change entry to guide history (in-memory; caller must save guide)."""
    from app.models.guide import HistoryChange, HistoryEntry
    entry = HistoryEntry(
        version=guide.metadata.version,
        timestamp=datetime.utcnow(),
        changes=[HistoryChange(tool=tool_name, target=target, summary=summary)],
        author="chatbot",
    )
    guide.history.append(entry)
