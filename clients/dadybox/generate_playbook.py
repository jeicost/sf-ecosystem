#!/usr/bin/env python3
"""
Simple script to render playbook JSON to PDF
"""

import json
from pathlib import Path
from renderer import generate_pdf

json_file = Path(__file__).parent / "playbook_incrementar_ventas.json"
data = json.loads(json_file.read_text(encoding="utf-8"))

output_path = Path(__file__).parent / "output" / "Dadybox_Incremente_Tus_Ventas_ecommerce_Mayo_2026.pdf"
output_path.parent.mkdir(exist_ok=True)

print(f"📄 Renderizando playbook: {data['title']}")
print(f"   → {output_path}")

pdf_path = generate_pdf(data, str(output_path))
print(f"✓ PDF generado exitosamente: {pdf_path}")
