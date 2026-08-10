#!/usr/bin/env python3
"""
Regenera TODOS los derivados de la marca discoolver 360 a partir de un único maestro.

    python3 scripts/build-logo-360.py [ruta/al/maestro.png]

Sin argumento usa `public/assets/360/logo-360-master.png`, que es el maestro
commiteado. Cuando Carlos pase una versión nueva del logo, se sustituye ese
fichero y se vuelve a lanzar esto: así los seis derivados salen siempre del
mismo origen y la marca no se bifurca.

Qué genera en public/assets/360/:
    logo-360-mark.webp        lo que carga la web (nav y footer)
    logo-360-mark.png         mismo bitmap en PNG, para deck, firmas y export
    logo-360-mark-white.png   silueta de una tinta, fondos que no admiten color
    icon-512.png              favicon del segmento /360
    apple-icon.png            icono de iOS, opaco sobre el fondo de marca

El OG (og-360.png) NO sale de aquí: lleva tipografía y copy, se compone aparte.

EL DETALLE QUE IMPORTA: el maestro viene con fondo blanco, y la contraforma de
la D también es blanca. Por eso el fondo se quita con un flood fill **desde los
bordes** y no con un "todo lo blanco a transparente": lo segundo agujerearía la
letra. Si algún día el logo llega ya con alfa, este paso se vuelve inocuo.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "360"
MASTER = OUT / "logo-360-master.png"
WEB_HEIGHT = 720  # el uso más grande es el OG (~58px) y el favicon (512)


def quitar_fondo(im: Image.Image) -> Image.Image:
    """Transparenta el blanco EXTERIOR. La contraforma de la D se queda blanca."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    def es_fondo(p):
        r, g, b, _ = p
        return r > 244 and g > 244 and b > 244

    visto = bytearray(w * h)
    cola = deque()
    bordes = [(x, y) for x in range(w) for y in (0, h - 1)]
    bordes += [(x, y) for y in range(h) for x in (0, w - 1)]
    for x, y in bordes:
        if es_fondo(px[x, y]) and not visto[y * w + x]:
            visto[y * w + x] = 1
            cola.append((x, y))

    while cola:
        x, y = cola.popleft()
        px[x, y] = (255, 255, 255, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visto[ny * w + nx] and es_fondo(px[nx, ny]):
                visto[ny * w + nx] = 1
                cola.append((nx, ny))

    return im.crop(im.getbbox())


def main() -> None:
    origen = Path(sys.argv[1]) if len(sys.argv) > 1 else MASTER
    if not origen.exists():
        sys.exit(f"✗ No existe el maestro: {origen}")

    OUT.mkdir(parents=True, exist_ok=True)
    marca = quitar_fondo(Image.open(origen))
    print(f"maestro {origen.name} → recortado a {marca.size}")

    # si viene de fuera, se guarda como maestro para que esto sea reproducible
    if origen != MASTER:
        Image.open(origen).save(MASTER, optimize=True)
        print(f"  maestro commiteado en {MASTER.name}")

    ancho = round(marca.size[0] * WEB_HEIGHT / marca.size[1])
    web = marca.resize((ancho, WEB_HEIGHT), Image.LANCZOS)
    web.save(OUT / "logo-360-mark.webp", quality=92, method=6)
    web.save(OUT / "logo-360-mark.png", optimize=True)

    blanco = Image.new("RGBA", marca.size, (255, 255, 255, 0))
    blanco.paste((255, 255, 255, 255), (0, 0), marca.getchannel("A"))
    blanco.save(OUT / "logo-360-mark-white.png", optimize=True)

    # iconos cuadrados con un 6% de aire
    lado = max(marca.size)
    aire = int(lado * 0.06)
    pos = (aire + (lado - marca.size[0]) // 2, aire + (lado - marca.size[1]) // 2)

    lienzo = Image.new("RGBA", (lado + 2 * aire, lado + 2 * aire), (0, 0, 0, 0))
    lienzo.paste(marca, pos, marca)
    favicon = lienzo.resize((512, 512), Image.LANCZOS)
    # 128 colores basta para un favicon y baja de 129 KB a ~26 KB
    q = favicon.quantize(colors=128, method=Image.FASTOCTREE).convert("RGBA")
    q.putalpha(favicon.getchannel("A"))
    q.save(OUT / "icon-512.png", optimize=True)

    apple = Image.new("RGBA", (lado + 2 * aire, lado + 2 * aire), (10, 10, 22, 255))
    apple.paste(marca, pos, marca)
    apple.convert("RGB").resize((180, 180), Image.LANCZOS).save(OUT / "apple-icon.png", optimize=True)

    print()
    for f in sorted(OUT.iterdir()):
        print(f"  {f.name:26} {f.stat().st_size // 1024:>5} KB")


if __name__ == "__main__":
    main()
