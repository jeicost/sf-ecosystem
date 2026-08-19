/**
 * Genera el juego completo de iconos de las dos marcas.
 *
 *   node scripts/generar-iconos.mjs
 *
 * Está en el repo y no se hace a mano por un motivo: los iconos se han
 * regenerado tres veces y cada vez había que recordar el recorte, el relleno y
 * qué versión del isotipo tocaba. Aquí las reglas están escritas.
 *
 * LAS REGLAS, Y POR QUÉ
 *
 *  · **Recorte al contenido y relleno propio.** El isotipo del B2C venía en un
 *    lienzo donde la marca ocupaba el 37 %: en una pestaña era una mota. Se
 *    recorta al alfa real y se rellena parejo, así las dos marcas pesan lo
 *    mismo a 16 px aunque sus dibujos sean distintos.
 *  · **360 usa el isotipo CALADO.** En el original el hueco de la D está
 *    pintado de blanco. Sobre pestaña clara se confunde con el fondo y sobre
 *    oscura es una mancha. Calado se comporta igual en las dos.
 *  · **El icono de iOS lleva más margen.** Apple recorta a esquina redondeada
 *    y no añade ningún margen: con la marca a sangre, el swoosh de 360 se
 *    cortaba. Aquí ocupa el 68 % del cuadro.
 *  · **El icono de iOS lleva fondo sólido.** iOS no respeta el alfa: sin fondo
 *    se pinta en negro plano y se pierde el filo del dibujo.
 *  · **Maskable para Android.** Android recorta hasta un 20 % por cada lado,
 *    así que la versión maskable deja la marca dentro de la zona segura.
 */
import { mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ejecutar = promisify(execFile);
const PAPER = "#0a0a0f";

/** Cada marca con su origen y su destino. */
const MARCAS = [
  {
    nombre: "discoolver",
    origen: "public/assets/isotipo-b2c-master.png",
    salida: "public",
    prefijo: "",
  },
  {
    nombre: "discoolver 360",
    // El calado, no el original: ver la regla de arriba.
    origen: "public/assets/360/logo-360-mark-calado.webp",
    salida: "public/assets/360",
    prefijo: "",
  },
];

const GUION = `
import sys
from PIL import Image

origen, salida, papel = sys.argv[1], sys.argv[2], sys.argv[3]

def recorta_y_rellena(im, relleno):
    """Recorta al alfa real y centra en un cuadrado con el relleno pedido."""
    im = im.convert("RGBA").crop(im.convert("RGBA").split()[3].getbbox())
    w, h = im.size
    lado = int(max(w, h) / (1 - relleno * 2))
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    lienzo.paste(im, ((lado - w) // 2, (lado - h) // 2), im)
    return lienzo

def sobre_fondo(im, hex_color):
    rgb = tuple(int(hex_color[i:i+2], 16) for i in (1, 3, 5))
    f = Image.new("RGBA", im.size, rgb + (255,))
    f.alpha_composite(im)
    return f.convert("RGB")

base = Image.open(origen)

# Pestaña y PWA: relleno corto, la marca tiene que pesar a 16 px.
tab = recorta_y_rellena(base, 0.07)
for n in (192, 512):
    tab.resize((n, n), Image.LANCZOS).save(f"{salida}/icon-{n}.png")
tab.resize((256, 256), Image.LANCZOS).save(
    f"{salida}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# iOS: más margen (Apple recorta a esquina redondeada y no añade ninguno) y
# fondo sólido (iOS no respeta el alfa).
ios = recorta_y_rellena(base, 0.16)
sobre_fondo(ios, papel).resize((180, 180), Image.LANCZOS).save(f"{salida}/apple-icon-tmp.png")

# Android maskable: recorta hasta un 20 % por lado, así que la marca se mete
# en la zona segura y el resto es fondo de marca.
mask = recorta_y_rellena(base, 0.26)
sobre_fondo(mask, papel).resize((512, 512), Image.LANCZOS).save(f"{salida}/icon-maskable-512.png")
print("ok")
`;

for (const marca of MARCAS) {
  await mkdir(marca.salida, { recursive: true });
  await ejecutar("python3", ["-c", GUION, marca.origen, marca.salida, PAPER]);
  console.log(`✅ ${marca.nombre}`);
}

// Cada marca declara su icono de iOS con un nombre distinto (herencia del
// root layout frente al segmento /360), así que se renombra al que toca.
await ejecutar("mv", ["public/apple-icon-tmp.png", "public/apple-touch-icon.png"]);
await ejecutar("mv", ["public/assets/360/apple-icon-tmp.png", "public/assets/360/apple-icon.png"]);
console.log("\nJuego completo: favicon.ico · icon-192 · icon-512 · icon-maskable-512 · icono de iOS.");
