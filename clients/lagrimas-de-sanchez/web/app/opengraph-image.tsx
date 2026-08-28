import { ImageResponse } from "next/og";

/**
 * La tarjeta social. Amarillo pleno con la gota: en un timeline gris es un
 * semáforo. Tipografía del sistema — ImageResponse no carga Google Fonts y un
 * fallback silencioso a otra serif quedaría peor que una sans rotunda.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Lágrimas de Sánchez — 57 motivos para llorar, horneados en el vidrio";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "#FFD400",
          color: "#111110",
        }}
      >
        <svg width="86" height="112" viewBox="0 0 100 132">
          <path
            d="M50 6 C50 46 14 64 14 94 a36 36 0 0 0 72 0 C86 64 50 46 50 6 Z"
            fill="#111110"
          />
        </svg>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: -3, marginTop: 28 }}>
          Lágrimas de Sánchez
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 18, maxWidth: 900 }}>
          57 motivos para llorar, horneados en el vidrio a 600 grados.
        </div>
        <div style={{ display: "flex", fontSize: 26, marginTop: "auto", letterSpacing: 2 }}>
          LAGRIMASDESANCHEZ.COM
        </div>
      </div>
    ),
    size,
  );
}
