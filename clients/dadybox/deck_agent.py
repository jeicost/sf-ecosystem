#!/usr/bin/env python3
"""
Dadybox Deck Agent — genera presentaciones y dossieres en PDF 16:9.

Uso:
  python deck_agent.py dossier                       # Dossier corporativo estándar
  python deck_agent.py "propuesta para [cliente X]"  # Presentación personalizada
  python deck_agent.py --demo                        # Demo sin API (dossier fijo)
"""

import sys
import json
import argparse
from datetime import datetime
from pathlib import Path

from brand import (
    COMPANY, STATS, TEAM, PLANS, SHIPPING_SERVICES, PROCESS_STEPS,
    PAIN_POINTS, VALUE_PROPS, DIFFERENTIATORS, INTEGRATIONS, REFERENCES,
    DIVISIONS, DECK_SYSTEM_PROMPT
)


OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


# ─────────────────────────────────────────────────────────────
# DOSSIER CORPORATIVO FIJO (sin API)
# ─────────────────────────────────────────────────────────────

def build_corporate_dossier() -> dict:
    """Genera el dossier corporativo estándar de Dadybox desde brand.py."""
    return {
        "title": "Dossier Corporativo Dadybox",
        "slides": [
            # 1 — Portada
            {
                "type": "cover",
                "headline": COMPANY["headline"],
                "subheadline": COMPANY["subheadline"],
                "badges": [
                    f'{STATS["experience_years"]} años de experiencia',
                    "estructura propia",
                    "partner oficial de la red GLS",
                ],
            },
            # 2 — El problema
            {
                "type": "numbered_items",
                "eyebrow": "El reto del ecommerce",
                "title": "Muchas veces el problema no es vender más. Es poder operar mejor.",
                "subtitle": "Cuando faltan estructura, espacio y método, la logística empieza a frenar lo que tu negocio produce.",
                "items": PAIN_POINTS,
                "gradient": True,
            },
            # 3 — Tres divisiones
            {
                "type": "split_content",
                "eyebrow": "Grupo logístico",
                "title": "Tres divisiones. Un mismo estándar.",
                "subtitle": "Dadybox nace dentro de una estructura logística ya operativa, con 36 años de experiencia, red real y capacidad contrastada.",
                "items": [{"title": d["name"], "desc": d["desc"]} for d in DIVISIONS],
                "panel_color": "navy",
                "panel_width": "35%",
                "flip": False,
                "key_metric": f"36 años de experiencia · Onboarding en {COMPANY['onboarding']}",
            },
            # 4 — Propuesta de valor
            {
                "type": "split_content",
                "eyebrow": "Nuestra propuesta",
                "title": "Dadybox convierte tu logística en una operación controlada",
                "subtitle": "Más visibilidad, más trazabilidad y más capacidad para escalar sin perder consistencia operativa.",
                "items": VALUE_PROPS,
                "panel_color": "green",
                "panel_width": "36%",
                "flip": True,
                "key_metric": f"{STATS['on_time_delivery']} de entregas a tiempo · {STATS['shipments_year']} envíos al año",
            },
            # 5 — Cómo trabajamos (flow)
            {
                "type": "flow",
                "eyebrow": "Cómo trabajamos",
                "title": "Un sistema que conecta toda tu operación",
                "subtitle": "Integración, almacén, envíos, devoluciones y control bajo una misma lógica operativa.",
                "steps": PROCESS_STEPS,
                "icons": ["🛍️", "📦", "🚛", "📍"],
                "footer": "Integración, almacén, envíos, devoluciones y control bajo una misma lógica operativa",
            },
            # 6 — Tecnología e integraciones
            {
                "type": "numbered_items",
                "eyebrow": "Tecnología y integraciones",
                "title": "Dadybox se integra con las principales plataformas de e-commerce",
                "subtitle": "Onboarding de 48 a 72 horas desde la firma del contrato.",
                "gradient": False,
                "items": [
                    {"title": "Integración con plataformas", "desc": f"Shopify, Shopify Plus, WooCommerce, PrestaShop y más donde tu marca ya vende."},
                    {"title": "Sincronización de pedidos y stock", "desc": "Conectamos la operativa para reducir tareas manuales y mantener una lectura más limpia."},
                    {"title": "SGA y visibilidad operativa", "desc": "Gestión de almacén, trazabilidad y seguimiento con una capa de control de alto criterio."},
                    {"title": "Reglas y coordinación", "desc": "Una base más sólida para escalar con menos fricción, menos errores y más consistencia."},
                ],
            },
            # 7 — Servicios de envío
            {
                "type": "services_tier",
                "eyebrow": "Servicios de envío",
                "title": "Nuestros servicios de envío",
                "subtitle": f"Eco, 24H y Premium en una misma cuenta. Red de {STATS['parcel_shops']} Parcel Shops y {STATS['lockers']} lockers en España.",
                "services": SHIPPING_SERVICES,
                "footer": "Operativa apoyada en red GLS y partners logísticos según servicio y zona.",
            },
            # 8 — Planes
            {
                "type": "plans",
                "title": "Planes que crecen contigo",
                "subtitle": "Ajustamos la logística, las tarifas y el nivel de servicio a tu ritmo de crecimiento.",
                "plans": PLANS,
            },
            # 9 — Diferenciadores
            {
                "type": "split_content",
                "eyebrow": "Por qué Dadybox",
                "title": "Más flexibilidad. Más criterio. Más tranquilidad.",
                "subtitle": "Adaptamos la operación al volumen, a las campañas y a la realidad de cada e-commerce.",
                "items": DIFFERENTIATORS,
                "panel_color": "mid",
                "panel_width": "36%",
                "flip": False,
                "key_metric": f"{STATS['clients']} clientes confían en Dadybox · {COMPANY['email']}",
            },
            # 10 — Credibilidad / Stats
            {
                "type": "stats_grid",
                "eyebrow": "Una credibilidad construida durante 36 años",
                "title": "Números que hablan",
                "subtitle": f"Partner logístico dentro de una estructura conectada a GLS, con apoyo operativo de DHL y FedEx. Referencias: {', '.join(REFERENCES[:4])}.",
                "stats": [
                    {"value": STATS["clients"],          "label": "clientes activos"},
                    {"value": STATS["shipments_year"],   "label": "envíos al año"},
                    {"value": STATS["on_time_delivery"], "label": "entregas a tiempo"},
                    {"value": STATS["sla"],              "label": "de SLA"},
                    {"value": STATS["carriers"],         "label": "transportistas"},
                ],
            },
            # 11 — Equipo
            {
                "type": "team",
                "eyebrow": "Equipo",
                "title": "Un equipo especializado",
                "members": TEAM,
            },
            # 12 — CTA
            {
                "type": "cta",
                "headline": "Tu logística puede dejar de ser un límite",
                "desc": "Estamos listos para hablar de tu proyecto y diseñar juntos la solución logística que tu e-commerce necesita para crecer.",
                "button": COMPANY["cta_label"],
                "sign": f"Noel Aldea — CEO · Natalia Aldea — Marketing Manager & Innovation",
            },
            # 13 — Contacto
            {
                "type": "contact",
                "title": "Contactos",
            },
        ],
    }


# ─────────────────────────────────────────────────────────────
# AI AGENT (requiere ANTHROPIC_API_KEY)
# ─────────────────────────────────────────────────────────────

def ask_claude(client, messages: list, system: str, max_tokens: int = 4096) -> str:
    resp = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    return resp.content[0].text


SLIDE_TYPE_GUIDE = """
TIPOS DE SLIDE DISPONIBLES:

1. "cover" — portada principal
   Campos: headline (string), subheadline (string), badges (list[str] max 3)

2. "tagline" — slide de sección, fondo oscuro con título grande
   Campos: eyebrow (str, opcional), title (str), subtitle (str, opcional)

3. "split_content" — layout dividido panel color + contenido con items numerados
   Campos: eyebrow, title, subtitle, body (texto opcional), items (list de {title, desc}),
   panel_color ("green"|"navy"|"mid"), panel_width ("35%"), flip (bool)

4. "numbered_items" — 2-4 columnas sobre fondo oscuro/gradient
   Campos: eyebrow, title, subtitle, items (list de {title, desc}), gradient (bool), footer (str opcional)

5. "stats_grid" — números grandes sobre fondo oscuro
   Campos: eyebrow, title, subtitle, stats (list de {value, label}), note (str opcional)

6. "plans" — tarjetas de plan sobre fondo gradient
   Campos: title, subtitle — usa los planes de brand.py automáticamente si no se especifica

7. "team" — tarjetas de equipo sobre fondo blanco
   Campos: eyebrow, title — usa el equipo de brand.py automáticamente

8. "comparison_table" — tabla comparativa sobre fondo blanco
   Campos: eyebrow, title, subtitle, footer — usa los servicios de brand.py automáticamente

9. "flow" — flujo horizontal con iconos sobre fondo blanco
   Campos: eyebrow, title, subtitle, steps (list {title, desc}), icons (list de emojis), footer

10. "services_tier" — tarjetas de tier de servicio sobre fondo blanco
    Campos: eyebrow, title, subtitle, footer — usa SHIPPING_SERVICES de brand.py automáticamente

11. "contact" — slide de contacto con datos de brand.py
    Campos: title

12. "cta" — slide de cierre con botón, fondo gradient
    Campos: headline, desc, button, sign (firmantes)

REGLAS:
- Máximo 12-15 slides por deck
- Siempre empezar con "cover" y terminar con "cta" o "contact"
- Los slides de tipo plans/team/comparison_table/services_tier/contact/flow usan datos de brand.py automáticamente
- Textos concisos: títulos ≤ 8 palabras, subtítulos ≤ 20 palabras, body ≤ 40 palabras
- Items: máximo 4 por slide, máximo 15 palabras por descripción
"""


STRUCTURE_PROMPT = """El usuario quiere generar una presentación/dossier.

Tu tarea: Proponer la ESTRUCTURA de slides (tipo + idea de contenido).

Devuelve SOLO JSON válido con este formato:
{
  "title": "Título del deck",
  "purpose": "Descripción del propósito en 1 frase",
  "audience": "Audiencia objetivo",
  "slides": [
    {"type": "cover", "idea": "descripción breve de qué irá en este slide"},
    ...
  ]
}

""" + SLIDE_TYPE_GUIDE


CONTENT_PROMPT = """Tienes la estructura aprobada del deck.
Tu tarea: generar el JSON COMPLETO y FINAL del deck con todo el contenido.

IMPORTANTE:
- Para slides tipo plans, team, comparison_table, services_tier, contact: incluye solo los campos type + eyebrow/title/subtitle (los datos se cargan de brand.py)
- Para el resto: incluye todos los campos necesarios con el contenido real y bien redactado
- Textos en español, profesionales, alineados con la marca Dadybox
- Devuelve SOLO el JSON final del deck, sin explicaciones

Formato exacto:
{
  "title": "string",
  "slides": [ ... ]
}
"""


def run_ai_agent(purpose: str):
    try:
        import anthropic
    except ImportError:
        print("[!] pip install anthropic")
        sys.exit(1)

    api_key = None
    try:
        import os
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.environ.get("ANTHROPIC_API_KEY")
    except ImportError:
        pass

    if not api_key:
        print("[!] ANTHROPIC_API_KEY no encontrada.")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    msgs = []

    # ── FASE 1: Estructura ────────────────────────────────────
    print(f"\n📊 Generando estructura para: {purpose}\n")

    msgs.append({"role": "user", "content": f"Quiero crear una presentación/dossier sobre: {purpose}"})
    structure_raw = ask_claude(client, msgs, DECK_SYSTEM_PROMPT + "\n\n" + STRUCTURE_PROMPT)
    msgs.append({"role": "assistant", "content": structure_raw})

    try:
        structure = json.loads(structure_raw.strip().removeprefix("```json").removesuffix("```").strip())
    except json.JSONDecodeError:
        import re
        m = re.search(r'\{.*\}', structure_raw, re.DOTALL)
        structure = json.loads(m.group()) if m else {}

    print("=" * 60)
    print(f"📋 PROPUESTA: {structure.get('title', '')}")
    print(f"   Propósito: {structure.get('purpose', '')}")
    print(f"   Audiencia: {structure.get('audience', '')}")
    print(f"\n   Slides ({len(structure.get('slides', []))}):")
    for i, s in enumerate(structure.get("slides", []), 1):
        print(f"   {i:02d}. [{s.get('type','?')}] {s.get('idea', '')}")
    print("=" * 60)

    resp = input("\n¿Continuar con esta estructura? [s/n/cambio]: ").strip().lower()
    if resp == "n":
        print("Cancelado.")
        sys.exit(0)
    if resp not in ("s", ""):
        msgs.append({"role": "user", "content": f"Ajuste: {resp}. Actualiza la estructura."})
        structure_raw = ask_claude(client, msgs, DECK_SYSTEM_PROMPT + "\n\n" + STRUCTURE_PROMPT)
        msgs.append({"role": "assistant", "content": structure_raw})
        try:
            structure = json.loads(structure_raw.strip().removeprefix("```json").removesuffix("```").strip())
        except Exception:
            pass

    # ── FASE 2: Contenido completo ────────────────────────────
    print("\n✍️  Generando contenido completo...\n")

    msgs.append({"role": "user", "content": "Perfecto. Ahora genera el JSON completo y final del deck con todo el contenido."})
    content_raw = ask_claude(
        client, msgs,
        DECK_SYSTEM_PROMPT + "\n\n" + CONTENT_PROMPT,
        max_tokens=8000
    )
    msgs.append({"role": "assistant", "content": content_raw})

    try:
        deck_data = json.loads(content_raw.strip().removeprefix("```json").removesuffix("```").strip())
    except json.JSONDecodeError:
        import re
        m = re.search(r'\{.*\}', content_raw, re.DOTALL)
        deck_data = json.loads(m.group()) if m else {"title": purpose, "slides": []}

    # Revisión humana
    print("\n📝 CONTENIDO GENERADO:")
    print(f"   Título: {deck_data.get('title', '')}")
    print(f"   Slides: {len(deck_data.get('slides', []))}")
    for i, s in enumerate(deck_data.get("slides", []), 1):
        preview = s.get("title") or s.get("headline") or s.get("type", "")
        print(f"   {i:02d}. [{s.get('type','?')}] {preview[:60]}")
    print()

    resp2 = input("¿Generar PDF? [s/n/cambio]: ").strip().lower()
    if resp2 == "n":
        print("Cancelado.")
        sys.exit(0)
    if resp2 not in ("s", ""):
        msgs.append({"role": "user", "content": f"Aplica este cambio y devuelve el JSON completo actualizado: {resp2}"})
        content_raw = ask_claude(client, msgs, DECK_SYSTEM_PROMPT + "\n\n" + CONTENT_PROMPT, max_tokens=8000)
        try:
            deck_data = json.loads(content_raw.strip().removeprefix("```json").removesuffix("```").strip())
        except Exception:
            pass

    return deck_data


# ─────────────────────────────────────────────────────────────
# PDF OUTPUT
# ─────────────────────────────────────────────────────────────

def save_and_render(deck_data: dict, slug: str):
    from deck_renderer import generate_pdf

    ts = datetime.now().strftime("%Y%m%d_%H%M")
    base = OUTPUT_DIR / f"{slug}_{ts}"

    json_path = str(base) + ".json"
    pdf_path = str(base) + ".pdf"

    Path(json_path).write_text(json.dumps(deck_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n💾 JSON guardado: {json_path}")

    print("🎨 Renderizando PDF...")
    generate_pdf(deck_data, pdf_path)
    print(f"✅ PDF generado: {pdf_path}")


# ─────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Dadybox Deck Agent")
    parser.add_argument("purpose", nargs="?", default="dossier",
                        help="Propósito del deck o 'dossier' para dossier corporativo")
    parser.add_argument("--demo", action="store_true",
                        help="Genera dossier corporativo sin API")
    args = parser.parse_args()

    if args.demo or args.purpose.lower() == "dossier" and "--demo" not in sys.argv:
        # Preguntar si quieren el dossier fijo o con IA
        if args.purpose.lower() == "dossier" and not args.demo:
            print("\n📊 DADYBOX DECK AGENT")
            print("1. Dossier corporativo estándar (sin API, rápido)")
            print("2. Dossier personalizado con IA")
            choice = input("Elige [1/2]: ").strip()
            if choice == "1":
                args.demo = True

    if args.demo or (args.purpose.lower() == "dossier" and args.demo):
        print("\n🚀 Generando dossier corporativo estándar...")
        deck_data = build_corporate_dossier()
        save_and_render(deck_data, "dossier-corporativo")
    else:
        deck_data = run_ai_agent(args.purpose)
        slug = args.purpose.lower().replace(" ", "-")[:30].replace("/", "-")
        save_and_render(deck_data, slug)


if __name__ == "__main__":
    main()
