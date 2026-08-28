import { useId } from "react";

/**
 * El lockup de marca.
 *
 * Es el mismo que va horneado en el vidrio, y eso no es un ahorro: que la
 * cabecera de la web y la botella lleven exactamente la misma composición es lo
 * que hace que el producto y el sitio se reconozcan como la misma cosa.
 *
 * Escala con `tam` en píxeles: todo lo de dentro se deriva de ese número, así
 * que no hay dos versiones que mantener sincronizadas.
 */

/**
 * La A de LÁGRIMAS, dibujada como una lágrima.
 *
 * Funciona porque las dos formas comparten estructura: punta arriba, cuerpo
 * ancho abajo. Lo que la convierte en letra y no en un símbolo suelto es el
 * travesaño, calado con una máscara para que el hueco deje ver el fondo sea
 * cual sea — así el mismo glifo sirve en blanco sobre negro y en negro sobre
 * blanco sin dos versiones.
 *
 * Va a la altura de mayúscula de Bodoni (~0,70 em) y con `aria-hidden`: el
 * texto accesible lo aporta el contenedor, que sigue diciendo LÁGRIMAS entero.
 */
function GotaA({ id, tilde = false }: { id: string; tilde?: boolean }) {
  return (
    <svg
      viewBox={tilde ? "0 0 100 168" : "0 0 100 132"}
      aria-hidden="true"
      focusable="false"
      style={{
        height: tilde ? "0.884em" : "0.70em",
        width: "auto",
        display: "inline-block",
        verticalAlign: "baseline",
        marginInline: "0.012em",
      }}
    >
      <mask id={id}>
        <rect width="100" height="168" fill="#fff" />
        {/* El travesaño de la A. */}
        <rect x="8" y={tilde ? 118 : 82} width="84" height="17" rx="1" fill="#000" />
      </mask>
      {tilde && (
        /* La tilde de la Á, con la inclinación de la de Bodoni. */
        <path d="M38 26 L64 2 L76 13 L46 33 Z" fill="currentColor" />
      )}
      <g transform={tilde ? "translate(0 36)" : undefined}>
        <path
          d="M50 6 C50 46 14 64 14 94 a36 36 0 0 0 72 0 C86 64 50 46 50 6 Z"
          fill="currentColor"
          mask={`url(#${id})`}
        />
      </g>
    </svg>
  );
}


/**
 * El galgo del emblema — el animal de la casa, como manda la heráldica de
 * bodega. Es el MISMO galgo de la pieza 01 del estampado, re-trazado en
 * versión ligera (3 KB) para vivir inline: emblema y botella cuentan el mismo
 * animal. La versión a plena resolución está en /marca/galgo.svg.
 */
function Galgo({ alto }: { alto: number }) {
  return (
    <svg
      viewBox="0 0 420 178"
      aria-hidden="true"
      focusable="false"
      style={{ height: alto, width: "auto", display: "block" }}
      fill="currentColor"
    >
      <path d="M 152.874 16.037 C 149.229 16.462, 142.704 17.800, 138.374 19.008 C 134.043 20.217, 125.550 22.448, 119.500 23.966 C 96.329 29.781, 85.503 35.631, 69.376 51.056 C 49.848 69.734, 38.182 71.847, 21.734 59.686 C 14.539 54.367, 13.843 55.704, 20.210 62.612 C 34.986 78.642, 52.401 76.271, 73.500 55.358 C 86.422 42.550, 95.244 37.345, 110.654 33.436 C 123.731 30.119, 124.178 30.212, 119.308 35.250 C 113.567 41.189, 110.434 47.877, 107.949 59.500 C 103.672 79.506, 98.654 82.491, 76 78.500 C 63.963 76.380, 64.025 76.364, 59.538 82.623 C 52.375 92.613, 41.991 101.602, 36.443 102.617 C 31.257 103.565, 29.171 105.908, 26.439 113.855 C 24.555 119.336, 29.287 119.670, 35.042 114.462 C 35.931 113.658, 37.420 113, 38.353 113 C 39.285 113, 44.360 108.941, 49.629 103.981 C 58.990 95.168, 67.464 89.131, 68.716 90.382 C 71.149 92.815, 55.006 117.936, 49.061 120.969 C 44.717 123.185, 43 126.777, 43 133.649 C 43 138.760, 43.884 139.001, 48.860 135.250 C 50.866 133.738, 53.406 132.019, 54.504 131.430 C 55.602 130.842, 59.650 125.191, 63.500 118.873 C 76.522 97.504, 74.566 98.500, 103.500 98.500 L 125.500 98.500 131.276 95.664 C 138.571 92.082, 140.962 89.073, 149 73.363 C 161.638 48.662, 178.393 50.289, 208.684 79.158 C 228.710 98.244, 244.603 103.803, 262.880 98.115 C 269.935 95.919, 269.506 95.448, 270.519 106.500 C 271.468 116.849, 271.301 116.603, 278.278 117.970 C 314.940 125.154, 337.416 136.061, 345 150.350 C 349.715 159.232, 354.855 162.209, 365.601 162.278 C 369.674 162.304, 373.308 162.026, 373.674 161.659 C 375.571 159.763, 365.525 153, 360.811 153 C 358.984 153, 357.445 151.510, 354.248 146.648 C 348.891 138.500, 341.867 130.699, 337.404 127.941 C 332.568 124.952, 333.588 124.629, 341.626 126.605 C 350.295 128.736, 353.024 130.104, 360.642 136.137 C 364.020 138.811, 367.525 141, 368.432 141 C 370.642 141, 377.055 144.334, 380.628 147.341 C 386.865 152.588, 396.170 152.922, 402.110 148.112 L 404.410 146.250 400.245 144.125 C 397.954 142.956, 394.208 142, 391.921 142 C 387.336 142, 383.266 139.800, 364.942 127.417 C 359.136 123.493, 352.611 119.737, 350.442 119.071 C 330.010 112.792, 313.161 106.820, 306.511 103.500 L 298.500 99.500 298.500 89.155 C 298.500 77.095, 298.489 77.110, 312 70.098 C 334.621 58.357, 343.103 58.609, 372.343 71.891 C 380.781 75.724, 385.431 75.884, 389.500 72.481 L 392.500 69.972 383.341 61.236 C 377.160 55.340, 373.628 51.113, 372.476 48.234 C 370.309 42.814, 363.278 36.585, 356.961 34.487 C 353.343 33.285, 351.511 31.945, 349.880 29.306 C 347.660 25.714, 342.677 22.868, 336.250 21.522 C 332.473 20.731, 332.335 21.237, 334.434 28.153 C 336.219 34.035, 337.116 33.766, 313 34.576 C 295.187 35.175, 294.147 35.101, 285 32.601 C 274.299 29.677, 265.852 29.318, 251.790 31.190 C 240.120 32.744, 231.138 31.458, 212 25.493 C 190.759 18.872, 166.028 13.931, 160.144 15.131 C 159.790 15.204, 156.518 15.611, 152.874 16.037" />
    </svg>
  );
}

export function Marca({
  tam = 22,
  linea = true,
  origen = true,
  className = "",
}: {
  tam?: number;
  /** El filete entre el nombre y la procedencia. */
  linea?: boolean;
  /** "VINOS DE MADRID". Se quita en usos muy pequeños. */
  origen?: boolean;
  className?: string;
}) {
  // Un id por instancia: en la misma página conviven varias marcas (cabecera,
  // pie, botella) y una máscara con id repetido las rompe todas menos la primera.
  const idGota = useId().replace(/:/g, "");
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span aria-hidden="true" style={{ marginBottom: tam * 0.18 }}>
        <Galgo alto={tam * 0.62} />
      </span>
      <span
        className="font-[family-name:var(--font-display)] font-normal"
        style={{ fontSize: tam, letterSpacing: "0.005em" }}
      >
        <span aria-hidden="true">
          L
          <GotaA id={idGota} tilde />
          GRIMAS
        </span>
        <span className="sr-only">LÁGRIMAS</span>
      </span>
      <span
        className="font-[family-name:var(--font-display)] font-normal"
        style={{ fontSize: tam * 0.6, letterSpacing: "0.09em", marginTop: tam * 0.07 }}
      >
        DE SÁNCHEZ
      </span>
      {linea && (
        <span
          aria-hidden="true"
          className="flex items-center"
          style={{ gap: tam * 0.3, marginTop: tam * 0.16, marginBottom: tam * 0.11 }}
        >
          <span className="bg-current" style={{ width: tam * 1.25, height: 1 }} />
          <span className="u-cond" style={{ fontSize: tam * 0.24, lineHeight: 1 }}>✦</span>
          <span className="bg-current" style={{ width: tam * 1.25, height: 1 }} />
        </span>
      )}
      {origen && (
        <span
          className="u-cond font-semibold"
          style={{ fontSize: tam * 0.185, letterSpacing: tam * 0.055 }}
        >
          VINOS DE MADRID
        </span>
      )}
    </span>
  );
}
