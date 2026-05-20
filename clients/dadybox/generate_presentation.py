#!/usr/bin/env python3
"""
Generate Q1 2026 results presentation from JSON
"""

import json
from pathlib import Path
from deck_renderer import generate_pdf

json_file = Path(__file__).parent / "q1_2026_results.json"
data = json.loads(json_file.read_text(encoding="utf-8"))

output_path = Path(__file__).parent / "output" / "Dadybox_Q1_2026_Resultados_Internos.pdf"
output_path.parent.mkdir(exist_ok=True)

print(f"🎬 Generando presentación: {data['title']}")
print(f"   Slides: {len(data['slides'])}")
print(f"   Output: {output_path}")

pdf_path = generate_pdf(data, str(output_path))
print(f"✓ Presentación generada: {pdf_path}")
