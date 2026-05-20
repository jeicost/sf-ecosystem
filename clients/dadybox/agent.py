#!/usr/bin/env python3
"""
Dadybox Playbook Agent
Genera playbooks PDF de logística y ecommerce para Dadybox.

Uso:
  python agent.py
  python agent.py "Cómo reducir devoluciones en tu ecommerce"

Requisitos:
  pip install anthropic playwright
  playwright install chromium
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime

import anthropic
from brand import SYSTEM_PROMPT, COMPANY, AUTHOR

OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

client = anthropic.Anthropic()  # Usa ANTHROPIC_API_KEY del entorno


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def print_section(title: str, char: str = "─", width: int = 62):
    print(f"\n{char * width}")
    print(f"  {title}")
    print(char * width)


def ask_user(prompt: str) -> str:
    return input(f"\n{prompt}\n→ ").strip()


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[áàä]", "a", text)
    text = re.sub(r"[éèë]", "e", text)
    text = re.sub(r"[íìï]", "i", text)
    text = re.sub(r"[óòö]", "o", text)
    text = re.sub(r"[úùü]", "u", text)
    text = re.sub(r"[ñ]", "n", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


def extract_json(text: str) -> dict:
    """Extracts the first JSON object from a string."""
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("No JSON object found in response.")
    return json.loads(match.group())


def call_claude(messages: list, max_tokens: int = 8000) -> str:
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=max_tokens,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


# ─────────────────────────────────────────────────────────────
# PHASE 1 — BRIEF
# ─────────────────────────────────────────────────────────────

BRIEF_PROMPT = """
Dado el tema: "{topic}"

Genera una propuesta de playbook en JSON con este esquema exacto:

{{
  "title": "Título principal del playbook (directo, con gancho)",
  "subtitle": "Subtítulo descriptivo de lo que aprenderá el lector (1-2 líneas)",
  "tagline": "Una frase de impacto para la portada (máx 10 palabras)",
  "audience_fit": "Para quién es exactamente este playbook (1 párrafo)",
  "value_proposition": "Qué obtendrá el lector al descargarlo (1 párrafo)",
  "chapters": [
    {{
      "number": 1,
      "title": "Título del capítulo",
      "description": "De qué trata en 1 frase"
    }}
  ],
  "unique_angle": "Qué hace único este playbook frente a otros recursos del sector",
  "dadybox_connection": "Cómo conecta el tema con los servicios de Dadybox"
}}

Propón entre 4 y 5 capítulos. Devuelve SOLO el JSON, sin texto adicional.
"""

def phase1_brief(topic: str) -> dict:
    print_section("FASE 1 — Generando propuesta del playbook...")
    print(f"  Tema: {topic}")

    messages = [{"role": "user", "content": BRIEF_PROMPT.format(topic=topic)}]
    raw = call_claude(messages, max_tokens=2000)
    brief = extract_json(raw)
    brief["topic"] = topic

    print_section("PROPUESTA DEL PLAYBOOK", "═")
    print(f"\n  Título:    {brief['title']}")
    print(f"  Subtítulo: {brief['subtitle']}")
    print(f"\n  Capítulos propuestos:")
    for ch in brief.get("chapters", []):
        print(f"   {ch['number']:02d}. {ch['title']}")
        print(f"       → {ch['description']}")
    print(f"\n  Ángulo único: {brief['unique_angle']}")
    print(f"  Conexión Dadybox: {brief['dadybox_connection']}")

    return brief


# ─────────────────────────────────────────────────────────────
# PHASE 2 — FULL CONTENT
# ─────────────────────────────────────────────────────────────

CONTENT_PROMPT = """
Basándote en este brief de playbook:

TÍTULO: {title}
SUBTÍTULO: {subtitle}
CAPÍTULOS: {chapters}
CONEXIÓN DADYBOX: {dadybox_connection}

Genera el contenido completo del playbook en JSON con este esquema:

{{
  "title": "{title}",
  "subtitle": "{subtitle}",
  "date": "{date}",
  "introduction": {{
    "letter_content": "Carta personal de Natalia Aldea al lector (3-4 párrafos, tono cercano y experto, menciona el reto concreto del tema, por qué Dadybox ha preparado este recurso y qué encontrará el lector)",
    "key_points": ["Lo que aprenderás 1", "Lo que aprenderás 2", "Lo que aprenderás 3", "Lo que aprenderás 4"]
  }},
  "context": {{
    "title": "Título de la sección de contexto",
    "intro": "Frase introductoria impactante (1-2 líneas) que resume el estado del sector",
    "content": "2-3 párrafos sobre el contexto actual del sector, tendencias y por qué este tema es urgente ahora",
    "stats": [
      {{
        "value": "XX%",
        "label": "descripción del dato en una frase",
        "source": "Fuente real del sector, año"
      }},
      {{
        "value": "XXX€",
        "label": "descripción del dato",
        "source": "Fuente"
      }}
    ]
  }},
  "chapters": [
    {{
      "number": 1,
      "title": "Título del capítulo",
      "intro": "Párrafo introductorio del capítulo (2-3 líneas, directo y enganchador)",
      "sections": [
        {{
          "title": "Subtítulo de sección",
          "content": "2-3 párrafos de contenido denso y accionable",
          "bullets": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
        }}
      ],
      "tip_dadybox": "Consejo práctico específico de Dadybox relacionado con el tema del capítulo. Menciona un servicio o funcionalidad de Dadybox de forma natural y útil.",
      "key_stat": {{
        "value": "XX%",
        "label": "descripción breve del dato",
        "source": "Fuente real"
      }}
    }}
  ],
  "case_studies": [
    {{
      "title": "Título descriptivo del caso",
      "industry": "Sector del ecommerce (ej: Moda, Electrónica, Alimentación)",
      "challenge": "El reto concreto que enfrentaba este tipo de negocio (2-3 líneas)",
      "solution": "Cómo lo resolvieron paso a paso (2-3 líneas)",
      "result": "Resultado concreto con métricas si es posible (2-3 líneas)"
    }},
    {{
      "title": "Segundo caso práctico",
      "industry": "Sector",
      "challenge": "...",
      "solution": "...",
      "result": "..."
    }}
  ],
  "checklist": {{
    "title": "Tu checklist de implementación",
    "items": [
      {{
        "category": "Categoría 1",
        "tasks": ["Tarea 1", "Tarea 2", "Tarea 3", "Tarea 4"]
      }},
      {{
        "category": "Categoría 2",
        "tasks": ["Tarea 1", "Tarea 2", "Tarea 3"]
      }},
      {{
        "category": "Categoría 3",
        "tasks": ["Tarea 1", "Tarea 2", "Tarea 3"]
      }}
    ]
  }},
  "resources": [
    {{
      "name": "Nombre del recurso",
      "description": "Para qué sirve y cuándo usarlo (1-2 líneas)",
      "type": "Herramienta | Guía | Template | Plataforma"
    }}
  ],
  "conclusion": {{
    "text": "2-3 párrafos de cierre: resume lo aprendido, da perspectiva, motiva al lector a actuar. Tono de Natalia Aldea.",
    "takeaways": [
      "Aprendizaje clave 1 (frase concisa y accionable)",
      "Aprendizaje clave 2",
      "Aprendizaje clave 3",
      "Aprendizaje clave 4",
      "Aprendizaje clave 5"
    ]
  }},
  "cta": {{
    "headline": "Pregunta o afirmación impactante para el CTA (ej: ¿Listo para escalar sin dramas logísticos?)",
    "description": "1-2 líneas explicando cómo Dadybox puede ayudar a implementar todo lo aprendido",
    "button_text": "Reserva tu llamada gratuita"
  }}
}}

IMPORTANTE:
- Genera contenido en ESPAÑOL
- Cada capítulo debe tener 2-3 secciones con contenido denso y accionable
- Las estadísticas deben ser realistas y de fuentes del sector (Statista, IAB, Forrester, etc.)
- Los consejos de Dadybox deben ser concretos, no genéricos
- El tono es el de un experto que comparte conocimiento genuino, no vende directamente
- Devuelve SOLO el JSON, sin texto adicional
"""

def phase2_content(brief: dict) -> dict:
    print_section("FASE 2 — Generando contenido completo...")
    print("  (Esto puede tardar 1-2 minutos...)")

    chapters_str = "\n".join(
        f"  {ch['number']}. {ch['title']}: {ch['description']}"
        for ch in brief.get("chapters", [])
    )

    prompt = CONTENT_PROMPT.format(
        title=brief["title"],
        subtitle=brief["subtitle"],
        chapters=chapters_str,
        dadybox_connection=brief.get("dadybox_connection", ""),
        date=datetime.now().strftime("%B %Y"),
    )

    messages = [{"role": "user", "content": prompt}]
    raw = call_claude(messages, max_tokens=8000)
    content = extract_json(raw)
    content["date"] = datetime.now().strftime("%B %Y")
    return content


# ─────────────────────────────────────────────────────────────
# CONTENT PREVIEW
# ─────────────────────────────────────────────────────────────

def print_content_preview(content: dict):
    print_section("BORRADOR DEL CONTENIDO", "═")
    print(f"\n  TÍTULO: {content.get('title', '')}")
    print(f"  SUBTÍTULO: {content.get('subtitle', '')}")

    intro = content.get("introduction", {})
    letter = intro.get("letter_content", "")
    print(f"\n  CARTA DE NATALIA (primeras 300 caracteres):")
    print(f"  {letter[:300]}...")

    print(f"\n  CONTEXTO DEL SECTOR:")
    ctx = content.get("context", {})
    print(f"  → {ctx.get('intro', '')}")
    for s in ctx.get("stats", [])[:2]:
        print(f"  📊 {s.get('value', '')} — {s.get('label', '')} ({s.get('source', '')})")

    print(f"\n  CAPÍTULOS:")
    for ch in content.get("chapters", []):
        print(f"\n  {ch.get('number', ''):02}. {ch.get('title', '')}")
        print(f"     → {ch.get('intro', '')[:120]}...")
        tip = ch.get("tip_dadybox", "")
        if tip:
            print(f"     💡 Tip: {tip[:100]}...")

    print(f"\n  CHECKLIST: {len(content.get('checklist', {}).get('items', []))} categorías")
    print(f"  CASOS PRÁCTICOS: {len(content.get('case_studies', []))}")
    print(f"  RECURSOS: {len(content.get('resources', []))}")


# ─────────────────────────────────────────────────────────────
# CHANGE HANDLER
# ─────────────────────────────────────────────────────────────

def apply_changes(content: dict, feedback: str) -> dict:
    print_section("Aplicando cambios...")

    messages = [
        {
            "role": "user",
            "content": f"""Tengo el siguiente contenido de un playbook en JSON:

{json.dumps(content, ensure_ascii=False, indent=2)}

El revisor ha pedido los siguientes cambios:
{feedback}

Aplica los cambios solicitados y devuelve el JSON completo actualizado.
Devuelve SOLO el JSON, sin texto adicional.""",
        }
    ]
    raw = call_claude(messages, max_tokens=8000)
    return extract_json(raw)


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 62)
    print("  DADYBOX PLAYBOOK AGENT")
    print("  Creador de playbooks de logística para ecommerce")
    print("═" * 62)
    print(f"  Firmante: {AUTHOR['name']}, {AUTHOR['role']}")
    print(f"  Output:   {OUTPUT_DIR}")

    # ── Obtener tema ──
    if len(sys.argv) > 1:
        topic = " ".join(sys.argv[1:])
        print(f"\n  Tema recibido: {topic}")
    else:
        topic = ask_user("¿Sobre qué tema quieres crear el playbook?")

    if not topic:
        print("Error: debes indicar un tema.")
        sys.exit(1)

    # ── FASE 1: Brief ──
    brief = phase1_brief(topic)

    answer = ask_user("¿Apruebas esta propuesta? (s) o escribe los cambios que quieres:").lower()
    if answer not in ("s", "si", "sí", "y", "yes", "ok"):
        brief_messages = [
            {"role": "user", "content": BRIEF_PROMPT.format(topic=topic)},
            {"role": "assistant", "content": json.dumps(brief, ensure_ascii=False)},
            {
                "role": "user",
                "content": f"Aplica estos cambios a la propuesta: {answer}. Devuelve el JSON actualizado completo.",
            },
        ]
        raw = call_claude(brief_messages, max_tokens=2000)
        brief = extract_json(raw)
        brief["topic"] = topic

        print(f"\n  Propuesta actualizada: {brief['title']}")
        ok = ask_user("¿Apruebas ahora? (s/n)").lower()
        if ok not in ("s", "si", "sí", "y", "yes", "ok"):
            print("  Operación cancelada.")
            sys.exit(0)

    # ── FASE 2: Contenido ──
    content = phase2_content(brief)
    print_content_preview(content)

    answer2 = ask_user(
        "¿Apruebas el contenido y pasamos a generar el PDF? (s)\n"
        "O escribe los cambios que quieres aplicar antes:"
    ).lower()

    if answer2 not in ("s", "si", "sí", "y", "yes", "ok"):
        content = apply_changes(content, answer2)
        print("\n  Cambios aplicados.")
        input("  Pulsa ENTER para continuar con la generación del PDF...")

    # Guardar JSON del contenido como backup
    slug = slugify(content.get("title", topic))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    json_path = OUTPUT_DIR / f"{slug}_{timestamp}.json"
    json_path.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n  Contenido guardado: {json_path.name}")

    # ── FASE 3: PDF ──
    print_section("FASE 3 — Generando PDF...")
    print("  Renderizando con Playwright...")

    try:
        from renderer import generate_pdf
        pdf_path = str(OUTPUT_DIR / f"{slug}_{timestamp}.pdf")
        generate_pdf(content, pdf_path)
        print(f"\n{'═' * 62}")
        print(f"  ✓ Playbook generado correctamente")
        print(f"  📄 {pdf_path}")
        print(f"{'═' * 62}\n")
    except ImportError:
        print("\n  ERROR: Playwright no está instalado.")
        print("  Ejecuta: pip install playwright && playwright install chromium")
        print(f"\n  El contenido JSON ha sido guardado en: {json_path}")
    except Exception as e:
        print(f"\n  ERROR al generar el PDF: {e}")
        print(f"  El contenido JSON ha sido guardado en: {json_path}")
        raise


if __name__ == "__main__":
    main()
