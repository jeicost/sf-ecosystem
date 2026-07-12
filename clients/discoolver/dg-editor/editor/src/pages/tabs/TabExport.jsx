import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exportGuide, listSnapshots, createSnapshot } from "../../lib/api";

export default function TabExport({ guide }) {
  const [format, setFormat] = useState("pdf");
  const [result, setResult] = useState(null);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => exportGuide(guide.id, format),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries(["snapshots", guide.id]);
    },
  });

  const snapMut = useMutation({
    mutationFn: () => createSnapshot(guide.id),
    onSuccess: () => qc.invalidateQueries(["snapshots", guide.id]),
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["snapshots", guide.id],
    queryFn:  () => listSnapshots(guide.id),
    staleTime: 10_000,
  });

  const API_BASE = import.meta.env.VITE_API_BASE?.replace("/api", "") || "http://localhost:8000";
  const viewerUrl = `${API_BASE}/viewer/${guide.id}`;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>⬇ Exportar guía</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Genera el output final de la guía: PDF para imprimir o web interactiva para publicar.
        </p>
        <a
          href={viewerUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 10, fontSize: 12, color: "var(--mag)",
            textDecoration: "none", fontWeight: 500,
          }}
        >
          👁 Ver lector interactivo →
        </a>
      </div>

      {/* Format selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {["pdf", "web"].map(f => (
          <button key={f} onClick={() => setFormat(f)}
            className={`btn ${format === f ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, justifyContent: "center", padding: 14 }}>
            {f === "pdf" ? "📄 PDF" : "🌐 Web"}
            <span style={{ fontSize: 11, display: "block", fontWeight: 400, marginTop: 2,
              color: format === f ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>
              {f === "pdf" ? "Listo para imprimir" : "URL pública interactiva"}
            </span>
          </button>
        ))}
      </div>

      {/* Guide summary */}
      <div className="card" style={{ marginBottom: 20, background: "var(--bg)", fontSize: 13 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {guide.city} 20{guide.year}
        </div>
        <div style={{ color: "var(--muted)" }}>{guide.edition}</div>
        <div style={{ color: "var(--muted)", marginTop: 4 }}>
          Estado: <span className={`badge badge-${guide.status}`}>{guide.status}</span>
        </div>
      </div>

      {guide.status !== "published" && (
        <div style={{
          padding: "10px 14px", borderRadius: 6, marginBottom: 16,
          background: "#FEF3C7", color: "#92400E", fontSize: 12,
        }}>
          ⚠ La guía está en estado "{guide.status}". Márcala como "published" antes de exportar para producción.
        </div>
      )}

      {/* Export button */}
      <button
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: 14 }}
        onClick={() => mut.mutate()}
        disabled={mut.isPending}
      >
        {mut.isPending
          ? <><span className="spinner" /> Generando {format.toUpperCase()}...</>
          : `⬇ Exportar como ${format.toUpperCase()}`}
      </button>

      {/* Error */}
      {mut.error && (
        <div style={{
          marginTop: 16, padding: "10px 14px", borderRadius: 6,
          background: "#FEE2E2", color: "#991B1B", fontSize: 12,
        }}>
          {mut.error.response?.data?.detail || mut.error.message}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 6,
          background: "#D1FAE5", border: "1px solid #A7F3D0",
        }}>
          <div style={{ fontWeight: 600, color: "#065F46", marginBottom: 10 }}>
            ✓ {format.toUpperCase()} generado
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href={`${API_BASE}${result.url}`}
              target="_blank" rel="noreferrer"
              className="btn btn-primary btn-sm"
            >
              {format === "pdf" ? "📄 Abrir PDF" : "🌐 Abrir web"} →
            </a>
            {format === "web" && (
              <a
                href={viewerUrl}
                target="_blank" rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                👁 Abrir lector →
              </a>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#065F46", marginTop: 8, wordBreak: "break-all" }}>
            {result.url}
          </div>
        </div>
      )}

      {/* ── Version history ── */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Historial de snapshots</div>
          <button className="btn btn-secondary btn-sm"
            onClick={() => snapMut.mutate()} disabled={snapMut.isPending}>
            {snapMut.isPending ? <span className="spinner" /> : "📸 Guardar snapshot"}
          </button>
        </div>
        {snapshots.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
            Los snapshots se crean automáticamente antes de cada export.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {snapshots.map(s => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", background: "var(--bg)", borderRadius: 6, fontSize: 12,
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{s.label}</span>
                  <span style={{
                    marginLeft: 8, fontSize: 10, color: "var(--muted)",
                    background: "var(--border)", padding: "1px 5px", borderRadius: 3,
                  }}>
                    {s.trigger}
                  </span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>
                  {s.items_count} items · {new Date(s.created_at).toLocaleString("es-ES", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live preview link — dev only */}
      {import.meta.env.DEV && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Vista previa del config</div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Devuelve el JSON que consumen los templates del design-studio.
            Útil para debug o para cargar la preview en el navegador.
          </p>
          <a
            href={`${API_BASE}/api/v2/guides/${guide.id}/export/config`}
            target="_blank" rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            👁 Ver GuideConfig JSON
          </a>
        </div>
      )}
    </div>
  );
}
