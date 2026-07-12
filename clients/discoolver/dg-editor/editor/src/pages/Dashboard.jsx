import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listGuides, deleteGuide, duplicateGuide, downloadTemplate, importExcel } from "../lib/api";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";

const COLLECTION_LABEL = {
  "estandar":          "Estándar",
  "club-hero":         "Club Hero",
  "plotwist-date":     "Plotwist Date",
  "wellness-nature":   "Wellness + Nature",
  "music-circuit":     "Music Circuit",
  "shopping-lover":    "Shopping Lover",
  "foodie-hoodie":     "Foodie with a Hoodie",
  "foodie-selection":  "Foodie Selection",
  "family-weekend":    "Family Weekend",
  "cultura-misterio":  "Cultura & Misterio",
  "solo-explorer":     "Solo Authentic Explorer",
  "nomadas-digitales": "Nómadas Digitales",
  "hidden-gems":       "Aesthetic Hidden Gems",
  "amantes-motor":     "Amantes del Motor",
};

const COLLECTION_COLOR = {
  "estandar":          "#C8006B",
  "club-hero":         "#8B5CF6",
  "plotwist-date":     "#F43F5E",
  "wellness-nature":   "#10B981",
  "music-circuit":     "#F97316",
  "shopping-lover":    "#EC4899",
  "foodie-hoodie":     "#D97706",
  "foodie-selection":  "#B45309",
  "family-weekend":    "#0EA5E9",
  "cultura-misterio":  "#0D9488",
  "solo-explorer":     "#475569",
  "nomadas-digitales": "#6366F1",
  "hidden-gems":       "#9F6CA8",
  "amantes-motor":     "#EF4444",
};

const STATUSES = ["", "draft", "review", "published", "archived"];

const GUIDE_TYPE_LABEL = {
  world:      { label: "Mundo",      icon: "🌍" },
  local:      { label: "Ciudad",     icon: "📍" },
  collection: { label: "Colección",  icon: "🗂" },
  influencer: { label: "Influencer", icon: "📸" },
  dossier:    { label: "Dossier",    icon: "📄" },
};

const GUIDE_TYPE_COLOR = {
  world:      "#C8006B",
  local:      "#059669",
  collection: "#6366F1",
  influencer: "#EC4899",
  dossier:    "#475569",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef();
  const toast   = useToast();
  const confirm = useConfirm();

  // Filters
  const [search,     setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterColl,   setFilterColl]   = useState("");
  const [importing, setImporting]   = useState(false);
  const [importMsg, setImportMsg]   = useState(null);

  const params = {
    ...(search        ? { q: search }              : {}),
    ...(filterStatus  ? { status: filterStatus }   : {}),
    ...(filterColl    ? { collection: filterColl } : {}),
  };

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["guides", params],
    queryFn: () => listGuides(params),
  });

  const deleteMut = useMutation({
    mutationFn: deleteGuide,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guides"] });
      toast.success("Guía eliminada");
    },
    onError: () => toast.error("Error al eliminar la guía"),
  });

  const dupMut = useMutation({
    mutationFn: ({ id, city, year }) => duplicateGuide(id, { new_city: city, new_year: year }),
    onSuccess: (guide) => {
      qc.invalidateQueries({ queryKey: ["guides"] });
      navigate(`/guides/${guide.id}`);
    },
  });

  const handleDownloadTemplate = async () => {
    const blob = await downloadTemplate();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "discoolver-guide-template.xlsx"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await importExcel(form);
      toast.success(`Guía importada: ${result.city} 20${result.year} — ${result.items_created} items`);
      setImportMsg(null);
      qc.invalidateQueries({ queryKey: ["guides"] });
      setTimeout(() => navigate(`/guides/${result.guide_id}`), 800);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "object" ? detail.errors?.join(" | ") : detail || err.message;
      toast.error(msg);
      setImportMsg({ type: "error", text: `✗ ${msg}` });
    } finally {
      setImporting(false); fileRef.current.value = "";
    }
  };

  const handleDuplicate = (guide) => {
    const city = prompt("Ciudad para la copia (vacío = misma):", guide.city) ?? guide.city;
    const year = prompt("Año para la copia (2 dígitos):", guide.year) ?? guide.year;
    dupMut.mutate({ id: guide.id, city: city || guide.city, year: year || guide.year });
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Guías</h1>
          <p className="page-sub">
            Gestiona y visualiza las guías de destino
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadTemplate}>
            Descargar plantilla
          </button>
          <label className="btn btn-secondary btn-sm"
            style={{ cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.6 : 1 }}>
            {importing ? <span className="spinner" /> : null}
            {importing ? "Importando…" : "Importar Excel"}
            <input ref={fileRef} type="file" accept=".xlsx" style={{ display: "none" }}
              onChange={handleImport} disabled={importing} />
          </label>
          <Link to="/guides/new" className="btn btn-primary btn-sm">+ Nueva guía</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "16px 20px",
        display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap",
        alignItems: "center",
      }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filtrar por ciudad o edición..."
          style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ width: 150 }}>
          <option value="">Todos los estados</option>
          {STATUSES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterColl} onChange={e => setFilterColl(e.target.value)}
          style={{ width: 180 }}>
          <option value="">Todas las colecciones</option>
          {Object.entries(COLLECTION_LABEL).map(([k, v]) =>
            <option key={k} value={k}>{v}</option>
          )}
        </select>
        {(search || filterStatus || filterColl) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(""); setFilterStatus(""); setFilterColl(""); }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
        {guides.length} guía{guides.length !== 1 ? "s" : ""}
        {(search || filterStatus || filterColl) ? " (filtradas)" : ""}
      </div>

      {/* Import message */}
      {importMsg && (
        <div className={`alert alert-${importMsg.type}`} style={{ marginBottom: 16 }}>
          {importMsg.text}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div style={{ color: "var(--muted)", display: "flex", gap: 8 }}>
          <span className="spinner" /> Cargando...
        </div>
      ) : guides.length === 0 ? (
        search || filterStatus || filterColl ? (
          <div className="card empty">
            <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>🔍</span>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              Sin resultados para esos filtros
            </p>
            <p style={{ fontSize: 12 }}>Prueba con otros criterios o limpia los filtros.</p>
          </div>
        ) : (
          <div className="card empty" style={{ padding: "56px 24px" }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🗺️</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Aquí aparecerán tus guías
            </p>
            <p style={{ fontSize: 13, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>
              Crea tu primera guía desde cero o importa una plantilla Excel con los recomendados ya rellenados.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/guides/new" className="btn btn-primary btn-sm">
                + Crear guía
              </Link>
              <button className="btn btn-secondary btn-sm" onClick={handleDownloadTemplate}>
                ⬇ Descargar plantilla Excel
              </button>
            </div>
          </div>
        )
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: 16,
        }}>
          {guides.map(guide => (
            <GuideCard key={guide.id} guide={guide}
              onDelete={async () => {
                const ok = await confirm(
                  `¿Eliminar la guía ${guide.city} 20${guide.year}? Esta acción no se puede deshacer.`,
                  { danger: true, confirmLabel: "Eliminar" }
                );
                if (ok) deleteMut.mutate(guide.id);
              }}
              onDuplicate={() => handleDuplicate(guide)}
              duplicating={dupMut.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GuideCard({ guide, onDelete, onDuplicate, duplicating }) {
  const accent = COLLECTION_COLOR[guide.collection] || "#FF00C8";
  const updated = new Date(guide.updated_at).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="card" style={{
      borderTop: `2px solid ${accent}`,
      display: "flex", flexDirection: "column", gap: 12,
      transition: "border-color 0.15s",
    }}>
      {/* Header */}
      <div>
        <div style={{
          fontWeight: 700, fontSize: 16, letterSpacing: -0.4,
          color: "var(--text)", marginBottom: 6,
        }}>
          {guide.city}
          <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 6, fontSize: 14 }}>
            20{guide.year}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`badge badge-${guide.status}`}>{guide.status}</span>
          {/* Guide type badge */}
          {(() => {
            const typeInfo = GUIDE_TYPE_LABEL[guide.guide_type] || GUIDE_TYPE_LABEL.world;
            const typeColor = GUIDE_TYPE_COLOR[guide.guide_type] || "#C8006B";
            return (
              <span style={{
                fontSize: 10, color: typeColor,
                background: `${typeColor}15`, border: `1px solid ${typeColor}30`,
                padding: "1px 7px", borderRadius: 4, fontWeight: 700,
                letterSpacing: "0.05em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                {typeInfo.icon} {typeInfo.label}
              </span>
            );
          })()}
          {/* Collection badge — only for collection type */}
          {guide.guide_type === "collection" && guide.collection && guide.collection !== "estandar" && (
            <span style={{
              fontSize: 10, color: accent,
              background: `${accent}15`, border: `1px solid ${accent}30`,
              padding: "1px 7px", borderRadius: 4, fontWeight: 700,
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              {COLLECTION_LABEL[guide.collection] || guide.collection}
            </span>
          )}
        </div>
      </div>

      {guide.edition && (
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
          {guide.edition}
        </div>
      )}

      <div style={{ height: 1, background: "var(--border)", margin: "0 0 2px" }} />

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 11, color: "var(--muted)",
      }}>
        <span>Actualizado {updated}</span>
        <span style={{ color: "var(--muted2)" }}>{guide.items_count ?? 0} items</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Link to={`/guides/${guide.id}`} className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: "center" }}>
          Editar
        </Link>
        <button className="btn btn-secondary btn-sm" title="Duplicar"
          onClick={onDuplicate} disabled={duplicating}
          style={{ minWidth: 36, justifyContent: "center" }}>
          {duplicating ? <span className="spinner" /> : "⧉"}
        </button>
        <button className="btn btn-ghost btn-sm" title="Eliminar" onClick={onDelete}
          style={{ minWidth: 36, justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
