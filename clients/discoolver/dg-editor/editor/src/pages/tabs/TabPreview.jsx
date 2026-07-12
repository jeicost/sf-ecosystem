import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getConfig, exportGuide } from "../../lib/api";

const TEMPLATES = [
  { file: "00-descubre.html",          label: "00 · Descubre ciudad ★" },
  { file: "01-portada.html",          label: "01 · Portada" },
  { file: "02-portada-typo.html",     label: "02 · Portada tipográfica" },
  { file: "03-indice.html",           label: "03 · Índice ★" },
  { file: "04-nota-director.html",    label: "04 · Nota del director ★" },
  { file: "06-restaurantes.html",     label: "06 · Restaurantes" },
  { file: "08-fiesta.html",           label: "08 · Fiesta" },
  { file: "09-ocio-eventos.html",     label: "09 · Ocio y Eventos ★" },
  { file: "10-arte-exposiciones.html",label: "10 · Arte" },
  { file: "11-experiencias.html",     label: "11 · Experiencias" },
  { file: "12-alojamientos.html",     label: "12 · Alojamientos" },
  { file: "13-shopping.html",         label: "13 · Shopping ★" },
  { file: "16-contraportada.html",    label: "16 · Contraportada ★" },
  { file: "18-10saves.html",          label: "18 · 10 Saves" },
  { file: "20-coollections.html",     label: "20 · Coollections" },
];

export default function TabPreview({ guide }) {
  const [activeTemplate, setActiveTemplate] = useState("06-restaurantes.html");
  const [scale, setScale] = useState(0.6);
  const [showConfig, setShowConfig] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["config", guide.id],
    queryFn:  () => getConfig(guide.id),
    staleTime: 30_000,
  });

  const exportMut = useMutation({
    mutationFn: () => exportGuide(guide.id, "pdf"),
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
  });

  const iframeUrl = (file) => `/design/${file}?guide=${guide.id}`;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>

      {/* ── Sidebar templates ── */}
      <div style={{
        width: 210, borderRight: "1px solid var(--border)",
        background: "var(--surface)", flexShrink: 0,
        display: "flex", flexDirection: "column",
      }}>
        {/* Export CTA */}
        <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)" }}>
          <button
            className="btn btn-primary"
            style={{ width: "100%", fontSize: 13 }}
            onClick={() => exportMut.mutate()}
            disabled={exportMut.isPending}
          >
            {exportMut.isPending ? "Generando PDF…" : "⬇ Exportar PDF"}
          </button>
          {exportMut.isSuccess && (
            <div style={{ fontSize: 11, color: "#10B981", marginTop: 6, textAlign: "center" }}>
              ✅ PDF generado — revisa la pestaña ⬇ Exportar
            </div>
          )}
          {exportMut.isError && (
            <div style={{ fontSize: 11, color: "var(--error)", marginTop: 6 }}>
              Error al exportar
            </div>
          )}
        </div>

        {/* Template list */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 6px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            color: "var(--muted)", padding: "4px 8px 6px" }}>
            TEMPLATES DE DISEÑO
          </div>
          {TEMPLATES.map(t => (
            <button
              key={t.file}
              onClick={() => setActiveTemplate(t.file)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "7px 10px", fontSize: 12, borderRadius: 6,
                background: activeTemplate === t.file ? "var(--mag)" : "transparent",
                color: activeTemplate === t.file ? "#fff" : "var(--text)",
                border: "none", cursor: "pointer", marginBottom: 2,
              }}
            >
              {t.label}
            </button>
          ))}
          <div style={{ padding: "10px 8px 4px", marginTop: 6, borderTop: "1px solid var(--border)" }}>
            <a href="/design/hub.html" target="_blank"
              style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none" }}>
              ↗ Ver todos los templates
            </a>
          </div>
        </div>

        {/* Config toggle */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", fontSize: 11 }}
            onClick={() => setShowConfig(v => !v)}
          >
            {showConfig ? "▲ Ocultar config JSON" : "▼ Ver config JSON"}
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 16px", borderBottom: "1px solid var(--border)",
          background: "var(--surface)", flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            Vista de diseño · {guide.city} {guide.year}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Zoom:</span>
          {[0.4, 0.6, 0.8, 1].map(s => (
            <button key={s} onClick={() => setScale(s)}
              className={`btn btn-sm ${scale === s ? "btn-primary" : "btn-ghost"}`}
              style={{ minWidth: 38, padding: "2px 6px" }}>
              {Math.round(s * 100)}%
            </button>
          ))}
          <a href={iframeUrl(activeTemplate)} target="_blank"
            className="btn btn-ghost btn-sm" title="Abrir template en nueva pestaña">↗</a>
        </div>

        {/* Config JSON panel */}
        {showConfig && config && (
          <div style={{
            background: "#0f0f0f", color: "#10B981", fontFamily: "monospace",
            fontSize: 11, padding: "12px 16px", maxHeight: 220, overflow: "auto",
            flexShrink: 0, borderBottom: "1px solid var(--border)",
          }}>
            <pre>{JSON.stringify(config, null, 2)}</pre>
          </div>
        )}

        {/* Template iframe */}
        <div style={{
          flex: 1, overflow: "auto", background: "#555",
          display: "flex", justifyContent: "center", padding: "24px 0",
        }}>
          <div style={{
            transformOrigin: "top center",
            transform: `scale(${scale})`,
            width: 794, flexShrink: 0,
          }}>
            <iframe
              key={activeTemplate}
              src={iframeUrl(activeTemplate)}
              title="Template preview"
              style={{
                width: 794, height: 1123,
                border: "none", background: "#fff", display: "block",
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
