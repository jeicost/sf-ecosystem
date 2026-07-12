from __future__ import annotations
import json
import anthropic
from typing import AsyncGenerator

from app.config import settings
from app.models.guide import Guide
from app.models.chat import ChatSession
from app.core.tool_definitions import ALL_TOOLS
from app.core import tool_executor
from app.storage import guide_repo

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT_TEMPLATE = """Eres el asistente editorial de Disclover, una empresa de guías de viaje premium.
Tu rol es ayudar a editar y mejorar guías de viaje en español.
Tienes acceso a herramientas para modificar directamente el contenido de la guía.

VOZ EDITORIAL DISCLOVER
• Directa y útil: cada frase aporta información accionable
• Sin superlativos vacíos — "increíble" o "espectacular" solo si son literalmente ciertos
• Perspectiva local: datos de horarios, precios, cómo evitar colas
• Máximo 150 palabras por descripción de recomendado
• Español de España (no latinoamericano)

GUÍA ACTUAL EN CONTEXTO
<guide>
{guide_json}
</guide>

Esta es la guía completa en su estado actual. Todos tus cambios deben referirse a secciones
e IDs existentes en la guía, o crear nuevos elementos correctamente.

REGLAS DE USO DE HERRAMIENTAS
1. Usa SIEMPRE las herramientas disponibles para hacer cambios. Nunca describas un cambio sin ejecutarlo.
2. Para cambios destructivos (delete_recomendado, adapt_to_profile con scope full_guide),
   confirma con el usuario antes de llamar la herramienta.
3. Puedes encadenar múltiples llamadas a herramientas en un mismo turno.
4. Tras ejecutar herramientas, confirma brevemente qué cambios se aplicaron.
5. Si el usuario hace una pregunta sin pedir cambios, responde directamente sin llamar herramientas.

LIMITACIONES
• No puedes exportar el PDF desde el chat — dile al usuario que use el botón "Exportar PDF".
• No inventes IDs. Usa solo IDs que aparezcan en <guide>.
"""


def _build_system_prompt(guide: Guide) -> str:
    guide_json = guide.model_dump_json(indent=2)
    return SYSTEM_PROMPT_TEMPLATE.format(guide_json=guide_json)


def _messages_for_api(session: ChatSession) -> list[dict]:
    result = []
    for msg in session.messages:
        if isinstance(msg.content, str):
            result.append({"role": msg.role, "content": msg.content})
        else:
            result.append({"role": msg.role, "content": msg.content})
    return result


async def stream_chat(
    guide: Guide,
    session: ChatSession,
    user_message: str,
) -> AsyncGenerator[dict, None]:
    """
    Agentic loop: calls Claude, handles tool_use blocks, yields SSE-compatible dicts.
    Mutates guide in-place and saves after each tool execution.
    """
    from app.storage import session_store

    # Append user message
    session_store.append_message(session.session_id, "user", user_message)

    changes_this_turn: list[tuple[str, str, str]] = []

    while True:
        messages = _messages_for_api(session)
        system = _build_system_prompt(guide)

        # Use streaming
        with _client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=system,
            messages=messages,
            tools=ALL_TOOLS,
        ) as stream:
            assistant_content_blocks = []
            current_text = ""

            for event in stream:
                if event.type == "content_block_start":
                    block = event.content_block
                    if block.type == "text":
                        current_text = ""
                    elif block.type == "tool_use":
                        assistant_content_blocks.append({
                            "type": "tool_use",
                            "id": block.id,
                            "name": block.name,
                            "input": {},
                        })

                elif event.type == "content_block_delta":
                    delta = event.delta
                    if delta.type == "text_delta":
                        current_text += delta.text
                        yield {"type": "text_delta", "delta": delta.text}
                    elif delta.type == "input_json_delta":
                        # Accumulate JSON for current tool
                        if assistant_content_blocks and assistant_content_blocks[-1]["type"] == "tool_use":
                            assistant_content_blocks[-1].setdefault("_raw", "")
                            assistant_content_blocks[-1]["_raw"] += delta.partial_json

                elif event.type == "content_block_stop":
                    if current_text:
                        assistant_content_blocks.append({"type": "text", "text": current_text})
                        current_text = ""
                    # Parse accumulated tool input JSON
                    if assistant_content_blocks and assistant_content_blocks[-1].get("type") == "tool_use":
                        raw = assistant_content_blocks[-1].pop("_raw", "{}")
                        try:
                            assistant_content_blocks[-1]["input"] = json.loads(raw)
                        except Exception:
                            assistant_content_blocks[-1]["input"] = {}

            stop_reason = stream.get_final_message().stop_reason

        # Append assistant turn to session
        session_store.append_message(session.session_id, "assistant", assistant_content_blocks)

        if stop_reason == "end_turn":
            break

        if stop_reason == "tool_use":
            tool_results = []
            for block in assistant_content_blocks:
                if block.get("type") != "tool_use":
                    continue

                tool_name = block["name"]
                tool_input = block["input"]
                tool_id = block["id"]

                yield {"type": "tool_use", "tool": tool_name, "input": tool_input}

                success, summary = tool_executor.execute(tool_name, tool_input, guide)
                tool_executor.record_change(guide, tool_name, tool_input.get("section_id", "guide"), summary)
                guide_repo.save_guide(guide)
                changes_this_turn.append((tool_name, "guide", summary))

                yield {"type": "tool_result", "tool": tool_name, "success": success, "summary": summary}

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_id,
                    "content": summary,
                })

            session_store.append_message(session.session_id, "user", tool_results)
            continue

        break

    yield {
        "type": "done",
        "session_id": session.session_id,
        "changes_count": len(changes_this_turn),
    }
