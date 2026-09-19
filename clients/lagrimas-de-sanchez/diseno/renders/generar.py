#!/usr/bin/env python3
"""
Renders de producto, generados desde la web.

    python3 generar.py                arranca la web él solo y captura todo
    python3 generar.py --puerto 3000  usa un servidor que ya esté levantado

Por qué así y no un PNG dibujado aparte: la botella de la web es el componente
`Botella.tsx` y el estampado sale de `lib/piezas.ts`. Si el render se dibujara
por su cuenta, el día que se mueva una pieza el PNG se queda viejo y nadie se
entera — justo el fallo que ya costó nueve ficheros con el «67» pegado.
Capturando la web, el render no puede mentir.

NO son fotografía de producto: no la habrá hasta que el palé esté en el garaje.
Son el dibujo vectorial a 2x, que es lo que se le manda al serigrafista, al
ilustrador y a las bodegas para que vean qué se pretende.

En Python y no en Node a propósito: Playwright de Node pide un Chromium más
nuevo que el que hay en la caché de la máquina, y el de Python funciona con el
que ya está descargado. Una dependencia menos y 150 MB menos.
"""
import argparse
import os
import signal
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
WEB = AQUI.parent.parent / "web"

# id de la escena en app/render/page.tsx → nombre del fichero.
ESCENAS = [
    ("r-vino", "botella-vino"),
    ("r-vacia", "botella-vacia"),
    ("r-estuche", "estuche-las-dos"),
    ("r-pack-tres", "pack-tres-vinos"),
    ("r-cuadrada", "botella-cuadrada"),
]


def vivo(url: str, intentos: int = 60) -> bool:
    for _ in range(intentos):
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    return True
        except Exception:
            pass  # todavía levantando
        time.sleep(0.5)
    return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", help="usa un servidor ya levantado en este puerto")
    args = ap.parse_args()

    servidor = None
    puerto = args.puerto

    if not puerto:
        puerto = "3941"
        if not (WEB / ".next").exists():
            print("Falta el build. Ejecuta `npm run build` en web/ primero.")
            return 1
        print(f"Levantando la web en :{puerto}")
        servidor = subprocess.Popen(
            ["npm", "start", "--", "-p", puerto],
            cwd=WEB,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )

    base = f"http://localhost:{puerto}"
    try:
        if not vivo(f"{base}/render"):
            print(f"No responde {base}/render")
            return 1

        with sync_playwright() as pw:
            navegador = pw.chromium.launch()
            # 2x: los PNG salen al doble de píxeles, que es lo que pide un
            # adjunto para imprimir o para meter en una presentación.
            pagina = navegador.new_page(device_scale_factor=2)
            pagina.goto(f"{base}/render", wait_until="networkidle")
            # Las fuentes tienen que estar cargadas o el lockup sale con la
            # fallback y el render miente sobre la tipografía.
            pagina.evaluate("document.fonts.ready")
            pagina.wait_for_timeout(1200)

            for ident, nombre in ESCENAS:
                el = pagina.query_selector(f"#{ident}")
                if el is None:
                    print(f"  ✗ no existe la escena #{ident}")
                    continue
                el.screenshot(path=str(AQUI / f"{nombre}.png"))
                print(f"  ✓ {nombre}.png")

            navegador.close()
    finally:
        if servidor is not None:
            try:
                os.killpg(os.getpgid(servidor.pid), signal.SIGTERM)
            except (ProcessLookupError, PermissionError):
                pass  # ya se había ido solo

    print(f"\nRenders en {AQUI}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
