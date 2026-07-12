import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listItems, api } from "../../lib/api";
import { Link, useParams } from "react-router-dom";

const getSections    = id => api.get(`/v2/guides/${id}/sections`).then(r => r.data);
const patchSection   = (id, key, data) => api.patch(`/v2/guides/${id}/sections/${key}`, data).then(r => r.data);

const SECTION_META = [
  { key: "nota_director",      label: "Nota del Director",   icon: "✍" },
  { key: "persona_del_ano",    label: "Persona del Año",     icon: "⭐" },
  { key: "restaurantes",       label: "Restaurantes",        icon: "🍽" },
  { key: "gastronomia_bcn",    label: "Gastronomía Local",     icon: "🥘" },
  { key: "fiesta",             label: "Fiesta",              icon: "🎉" },
  { key: "ocio_eventos",       label: "Ocio y Eventos",      icon: "🎭" },
  { key: "arte_exposiciones",  label: "Arte y Exposiciones", icon: "🖼" },
  { key: "experiencias",       label: "Experiencias",        icon: "🌍" },
  { key: "alojamientos",       label: "Alojamientos",        icon: "🏨" },
  { key: "shopping",           label: "Shopping",            icon: "🛍" },
  { key: "influencers",        label: "Local Influencers",   icon: "📱" },
];

export default function TabSections({ guide }) {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: sectionsConfig = {}, isLoading } = useQuery({
    queryKey: ["sections-config", guide.id],
    queryFn:  () => getSections(guide.id),
  });

  const patchMut = useMutation({
    mutationFn: ({ key, data }) => patchSection(guide.id, key, data),
    onSuccess: () => qc.invalidateQueries(["sections-config", guide.id]),
  });

  const enabledCount = Object.values(sectionsConfig).filter(s => s.enabled).length;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 860 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Secciones de la guía</h3>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          {isLoading ? "Cargando..." : `${enabledCount} de ${SECTION_META.length} secciones activas`}
        </p>
      </div>

      {isLoading ? (
        <div style={{ color: "var(--muted)", display: "flex", gap: 8 }}>
          <span className="spinner" /> Cargando...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {SECTION_META.map(meta => {
            const cfg     = sectionsConfig[meta.key] || { enabled: true, page_number: "" };
            const enabled = cfg.enabled !== false;
            return (
              <SectionRow
                key={meta.key}
                meta={meta}
                cfg={cfg}
                enabled={enabled}
                guideId={guide.id}
                onToggle={() => patchMut.mutate({ key: meta.key, data: { enabled: !enabled } })}
                onPageChange={(v) => patchMut.mutate({ key: meta.key, data: { page_number: v } })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionRow({ meta, cfg, enabled, guideId, onToggle, onPageChange }) {
  const { data: items = [] } = useQuery({
    queryKey: ["items-count", guideId, meta.key],
    queryFn:  () => listItems(guideId, { section: meta.key }),
    staleTime: 60_000,
  });

  return (
    <div className="card" style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px",
      opacity: enabled ? 1 : 0.5,
      borderLeft: `3px solid ${enabled ? "var(--success)" : "var(--border)"}`,
    }}>
      {/* Toggle */}
      <label style={{
        position: "relative", width: 36, height: 20,
        flexShrink: 0, cursor: "pointer",
      }}>
        <input type="checkbox" checked={enabled} onChange={onToggle}
          style={{ opacity: 0, width: 0, height: 0 }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: 10,
          background: enabled ? "var(--success)" : "var(--border)",
          transition: "background 0.2s",
        }} />
        <div style={{
          position: "absolute", top: 2, left: enabled ? 18 : 2, width: 16, height: 16,
          borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </label>

      {/* Icon + Label */}
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: "var(--bg)", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 16, flexShrink: 0,
      }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{meta.label}</div>
        {items.length > 0 && (
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Page number */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ fontSize: 11, color: "var(--muted)", marginBottom: 0, width: "auto" }}>
          Pág.
        </label>
        <input
          value={cfg.page_number || ""}
          onChange={e => onPageChange(e.target.value)}
          style={{ width: 50, textAlign: "center", fontSize: 12 }}
          placeholder="—"
        />
      </div>

      {/* Link to items */}
      <Link
        to={`../items`}
        relative="path"
        className="btn btn-secondary btn-sm"
        style={{ fontSize: 11, flexShrink: 0 }}
      >
        Fichas →
      </Link>
    </div>
  );
}
