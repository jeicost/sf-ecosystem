#!/usr/bin/env python3
"""Render every *.mockup.svg in a folder to *.mockup.png (for embedding in the deck).
Usage: python3 render_svg.py output/ [width]
Requires: pip install cairosvg --break-system-packages
"""
import sys, glob, os
try:
    import cairosvg
except ImportError:
    os.system("pip install cairosvg --break-system-packages -q")
    import cairosvg

folder = sys.argv[1] if len(sys.argv) > 1 else "output"
width = int(sys.argv[2]) if len(sys.argv) > 2 else 800
n = 0
for svg in glob.glob(os.path.join(folder, "*.mockup.svg")):
    png = svg[:-4] + ".png"
    cairosvg.svg2png(url=svg, write_to=png, output_width=width)
    n += 1
print(f"Rendered {n} mockup(s) to PNG in {folder}")
