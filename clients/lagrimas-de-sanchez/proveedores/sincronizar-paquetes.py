#!/usr/bin/env python3
"""
Rehace los paquetes que se mandan a proveedores desde los maestros.

    python3 sincronizar-paquetes.py

POR QUÉ EXISTE. Los paquetes se montaron copiando ficheros a mano y por eso
derivaron: el 30 de septiembre los de bodega, estuche y vidrio seguían
llevando renders del 23, anteriores a los redibujos del arte. Un proveedor
que presupuesta sobre un render viejo presupuesta otra botella.

Además acota el peso. Un correo en frío de 8 MB no rebota: se queda en la
cuarentena del servidor del taller y no se entera nadie. El proveedor mira
estas imágenes en pantalla —el arte vectorial va aparte—, así que se
reducen a lo que se ve bien en un monitor.
"""
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent
RENDERS = AQUI.parent / "diseno" / "renders"
DISENO = AQUI.parent / "diseno"
PAQUETES = AQUI / "paquetes"

#: paquete -> [(fichero de destino, maestro, ancho máximo en px)]
#: El ancho sale de para qué se mira: el desarrollo tiene que dejar LEER los
#: rótulos de las 67 piezas; un render de presentación, no.
CONTENIDO = {
    "serigrafia": [
        ("desarrollo-plano.png", DISENO / "desarrollo-plano.png", 2600),
        ("botella-vino.png", RENDERS / "botella-vino.png", 1500),
        ("botella-vacia.png", RENDERS / "botella-vacia.png", 1500),
    ],
    "bodega": [
        ("botella-vino.png", RENDERS / "botella-vino.png", 1500),
    ],
    "estuche": [
        ("botella-vacia.png", RENDERS / "botella-vacia.png", 1500),
        ("estuche-las-dos.png", RENDERS / "estuche-las-dos.png", 1800),
    ],
    "vidrio-estal": [
        ("botella-vino.png", RENDERS / "botella-vino.png", 1500),
        ("pack-tres-vinos.png", RENDERS / "pack-tres-vinos.png", 1800),
    ],
}

#: Lo que NO se regenera aquí porque tiene su propio generador o es texto.
#: Se comprueba que esté, nada más: un paquete al que le falta la
#: especificación se manda igual y el taller contesta preguntando por ella.
EXIGIDOS = {
    "serigrafia": ["ESPECIFICACION-TECNICA.pdf", "INFORME-IMPRIMIBILIDAD.md"],
    "bodega": ["NOTA.txt"],
    "estuche": ["NOTA.txt"],
    "vidrio-estal": ["NOTA.txt"],
}


def encoger(origen: Path, destino: Path, ancho: int) -> str:
    im = Image.open(origen)
    if im.width > ancho:
        im = im.resize((ancho, round(ancho * im.height / im.width)), Image.LANCZOS)
    # Paleta adaptativa: es tinta blanca sobre vidrio oscuro, no hay gama
    # que perder, y pesa la cuarta parte.
    im.convert("RGB").quantize(colors=128, method=Image.MEDIANCUT).save(
        destino, optimize=True)
    return f"{im.width}×{im.height} · {destino.stat().st_size/1024:.0f} KB"


def main() -> int:
    fallos = []
    for paquete, ficheros in CONTENIDO.items():
        carpeta = PAQUETES / paquete
        carpeta.mkdir(parents=True, exist_ok=True)
        print(f"\n{paquete}/")
        for nombre, maestro, ancho in ficheros:
            if not maestro.exists():
                fallos.append(f"{paquete}: falta el maestro {maestro.name}")
                print(f"  ✗ {nombre}: no existe {maestro}")
                continue
            print(f"  ✓ {nombre}: {encoger(maestro, carpeta / nombre, ancho)}")
        for nombre in EXIGIDOS.get(paquete, []):
            if not (carpeta / nombre).exists():
                fallos.append(f"{paquete}: falta {nombre}")
                print(f"  ✗ falta {nombre}")

        zip_ = PAQUETES / f"{paquete}.zip"
        zip_.unlink(missing_ok=True)
        subprocess.run(["zip", "-q", "-r", zip_.name, paquete, "-x", ".*"],
                       cwd=PAQUETES, check=True)
        print(f"  → {zip_.name} · {zip_.stat().st_size/1024/1024:.1f} MB")

    if fallos:
        print("\nFALTA:")
        for f in fallos:
            print(f"  · {f}")
        return 1
    print("\nTodos los paquetes al día.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
