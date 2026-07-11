import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Startups Factory — Team as a Service";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0F0F0F",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "2px solid #3D2FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "#3D2FFF",
              }}
            />
          </div>
          <span style={{ color: "#F5F0E8", fontSize: "18px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            STARTUPS FACTORY
          </span>
        </div>

        {/* Center: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#3D2FFF",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Team as a Service
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#F5F0E8",
              lineHeight: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span>Fábrica de equipos</span>
            <span style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              para{" "}
              <span
                style={{
                  backgroundColor: "#3D2FFF",
                  color: "#F5F0E8",
                  padding: "0 20px",
                }}
              >
                proyectos
              </span>
            </span>
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#888880",
              marginTop: "8px",
              maxWidth: "700px",
            }}
          >
            Montamos el squad exacto y lo ponemos a ejecutar contigo.
          </div>
        </div>

        {/* Bottom: stats + domain */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #2A2A2A",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "48px" }}>
            {[
              { n: "30/60/90", label: "días para plan" },
              { n: "8+", label: "roles disponibles" },
              { n: "100%", label: "ejecución real" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#3D2FFF" }}>{s.n}</span>
                <span style={{ fontSize: "13px", color: "#888880" }}>{s.label}</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: "16px", color: "#3D2FFF", fontWeight: 600 }}>
            startupsfactory.es
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
