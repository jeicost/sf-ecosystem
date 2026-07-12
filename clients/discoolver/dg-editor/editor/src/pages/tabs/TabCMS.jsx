/**
 * Tab CMS — Importar recomendados desde api.discoolver.com
 *
 * Flujo:
 *  1. Editor introduce IDs de businesses del CMS (separados por coma/salto)
 *  2. Preview: se llama /v2/cms/business/:id/preview → muestra nombre, foto, sección inferida
 *  3. Editor ajusta sección y badge si quiere
 *  4. Importar → crea ItemRow en la guía
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cmsPreview, cmsImport } from "../../lib/api";
import { useToast } from "../../components/Toast";

const SECTIONS = [
  { key: "restaurantes",      label: "Restaurantes"         },
  { key: "fiesta",            label: "Fiesta"               },
  { key: "ocio_eventos",      label: "Ocio y Eventos"       },
  { key: "arte_exposiciones", label: "Arte y Exposiciones"  },
  { key: "experiencias",      label: "Experiencias"         },
  { key: "alojamientos",      label: "Alojamientos"         },
  { key: "shopping",          label: "Shopping"             },
  { key: "top_saves",         label: "10 Saves"             },
  { key: "coollections",      label: "Colecciones"          },
];

const BADGES = [
  "", "WOW", "NUEVO 2026", "ICÓNICO", "LOCAL-OWNED", "BEST VIEW",
  "ROMÁNTICO", "SOLO OK", "FAMILY OK", "DESIGN", "WELLNESS",
  "AF-FRIENDLY", "LATE NIGHT", "VALUE / €", "SPLURGE / €€€", "LUXURY",
];

const BADGE_COLORS = {
  "WOW": "#C8006B", "NUEVO 2026": "#C8006B", "ICÓNICO": "#111827",
  "LOCAL-OWNED": "#059669", "BEST VIEW": "#2563EB", "ROMÁNTICO": "#E11D48",
  "SOLO OK": "#7C3AED", "FAMILY OK": "#D97706", "DESIGN": "#475569",
  "WELLNESS": "#0D9488", "AF-FRIENDLY": "#65A30D", "LATE NIGHT": "#4338CA",
  "VALUE / €": "#6B7280", "SPLURGE / €€€": "#B8860B", "LUXURY": "#B8860B",
};

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ── Preview card ──────────────────────────────────────────────────────────────

function PreviewCard({ item, index, onChange, onRemove }) {
  const { cms_raw, mapped_item, gallery } = item;
  const [section, setSection] = useState(mapped_item.section);
  const [badge, setBadge]     = useState(mapped_item.badge || "");
  const photos = gallery.filter(g => g.cloudUrl);

  const [selectedPhoto, setSelectedPhoto] = useState(mapped_item.photo_url || "");

  const sync = (patch) => onChange(index, { ...item, _override: { ...item._override, ...patch } });

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, overflow: "hidden", marginBottom: 16,
    }}>
      <div style={{ display: "flex", gap: 0 }}>
        {/* Foto */}
        <div style={{ width: 120, flexShrink: 0, background: "#111", position: "relative" }}>
          {selectedPhoto
            ? <img src={selectedPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 28 }}>📷</div>
          }
        </div>

        {/* Info + controles */}
        <div style={{ flex: 1, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{mapped_item.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                ID CMS: {cms_raw.id} &nbsp;·&nbsp;
                <span style={{ color: "var(--mag)" }}>{cms_raw.city?.rawId}</span> &nbsp;·&nbsp;
                {cms_raw.categories?.[0]?.name}
              </div>
              {mapped_item.description && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, maxWidth: 480 }}>
                  {stripHtml(mapped_item.description).slice(0, 180)}…
                </div>
              )}
            </div>
            <button
              onClick={() => onRemove(index)}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}
            >×</button>
          </div>

          {/* Controles */}
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            {/* Sección */}
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>SECCIÓN</label>
              <select
                value={section}
                onChange={e => { setSection(e.target.value); sync({ section: e.target.value }); }}
                style={{ fontSize: 13, padding: "4px 8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6 }}
              >
                {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            {/* Badge */}
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>BADGE</label>
              <select
                value={badge}
                onChange={e => { setBadge(e.target.value); sync({ badge: e.target.value || null }); }}
                style={{ fontSize: 13, padding: "4px 8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6 }}
              >
                {BADGES.map(b => (
                  <option key={b} value={b}>{b || "Sin badge"}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Galería mini */}
          {photos.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 5 }}>FOTO DE PORTADA</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {photos.slice(0, 8).map((img, i) => (
                  <div
                    key={i}
                    onClick={() => { setSelectedPhoto(img.cloudUrl); sync({ photo_url: img.cloudUrl }); }}
                    style={{
                      width: 54, height: 40, borderRadius: 4, overflow: "hidden", cursor: "pointer",
                      border: selectedPhoto === img.cloudUrl ? "2px solid var(--mag)" : "2px solid transparent",
                      opacity: selectedPhoto === img.cloudUrl ? 1 : 0.65,
                      transition: "all 0.15s",
                    }}
                  >
                    <img src={img.cloudUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge visual */}
      {badge && (
        <div style={{
          padding: "4px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
          background: BADGE_COLORS[badge] || "#6B7280", color: "#fff",
        }}>
          {badge}
        </div>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function TabCMS({ guide }) {
  const toast = useToast();
  const qc    = useQueryClient();

  const [idsInput, setIdsInput]   = useState("");
  const [previews, setPreviews]   = useState([]);   // [{cms_raw, mapped_item, gallery, _override}]
  const [loading, setLoading]     = useState(false);

  // Cargar previews de IDs introducidos
  const handlePreview = async () => {
    const ids = idsInput
      .split(/[\s,;\n]+/)
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0);

    if (!ids.length) { toast.error("Introduce al menos un ID de CMS"); return; }

    setLoading(true);
    const results = [];
    for (const id of ids) {
      try {
        const data = await cmsPreview(id);
        results.push({ ...data, _override: {} });
      } catch (err) {
        toast.error(`ID ${id}: ${err.response?.data?.detail || err.message}`);
      }
    }
    setPreviews(results);
    setLoading(false);
    if (results.length) toast.success(`${results.length} recomendado${results.length > 1 ? "s" : ""} cargado${results.length > 1 ? "s" : ""}`);
  };

  const handleChange = (index, updated) => {
    setPreviews(prev => prev.map((p, i) => i === index ? updated : p));
  };

  const handleRemove = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Import mutation
  const importMut = useMutation({
    mutationFn: () => {
      const items = previews.map((p, i) => ({
        business_id: p.cms_raw.id,
        section: p._override.section ?? p.mapped_item.section,
        badge:   p._override.badge   ?? p.mapped_item.badge ?? null,
        sort_order: i,
      }));
      return cmsImport(guide.id, { items, language: "es" });
    },
    onSuccess: (data) => {
      toast.success(`${data.length} recomendado${data.length > 1 ? "s" : ""} importado${data.length > 1 ? "s" : ""} a la guía`);
      setPreviews([]);
      setIdsInput("");
      qc.invalidateQueries(["items", guide.id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Error importando"),
  });

  return (
    <div style={{ padding: "32px", maxWidth: 860 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          Importar desde CMS Discoolver
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>
          Introduce los IDs del CMS de Discoolver. Se cargarán los datos reales: nombre, descripción, imágenes y URL.
          Puedes ajustar la sección y el badge antes de importar.
        </p>
      </div>

      {/* Input IDs */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, padding: 20, marginBottom: 24,
      }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
          IDs del CMS
          <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: 8 }}>
            (separados por coma, espacio o salto de línea)
          </span>
        </label>
        <textarea
          value={idsInput}
          onChange={e => setIdsInput(e.target.value)}
          placeholder="Ej: 69, 1197, 3867&#10;o uno por línea"
          rows={3}
          style={{
            width: "100%", resize: "vertical", fontFamily: "monospace",
            fontSize: 14, padding: "10px 12px", boxSizing: "border-box",
            background: "var(--bg)", color: "var(--text)",
            border: "1px solid var(--border)", borderRadius: 6,
          }}
        />
        <button
          onClick={handlePreview}
          disabled={loading || !idsInput.trim()}
          className="btn btn-primary"
          style={{ marginTop: 12 }}
        >
          {loading ? "Cargando..." : "Cargar preview →"}
        </button>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {previews.length} recomendado{previews.length > 1 ? "s" : ""} listos para importar
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setPreviews([]); setIdsInput(""); }}
                className="btn btn-secondary btn-sm"
              >
                Limpiar
              </button>
              <button
                onClick={() => importMut.mutate()}
                disabled={importMut.isPending}
                className="btn btn-primary"
              >
                {importMut.isPending ? "Importando..." : `Importar ${previews.length} a la guía`}
              </button>
            </div>
          </div>

          {previews.map((item, i) => (
            <PreviewCard
              key={`${item.cms_raw.id}-${i}`}
              item={item}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
            />
          ))}

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <button
              onClick={() => importMut.mutate()}
              disabled={importMut.isPending}
              className="btn btn-primary"
            >
              {importMut.isPending ? "Importando..." : `Importar ${previews.length} a la guía`}
            </button>
          </div>
        </>
      )}

      {/* Estado vacío */}
      {previews.length === 0 && !loading && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          color: "var(--muted)", border: "1px dashed var(--border)", borderRadius: 10,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Conectado a api.discoolver.com</div>
          <div style={{ fontSize: 13 }}>
            Introduce IDs de recomendados del CMS para cargar su preview y añadirlos a la guía.
          </div>
        </div>
      )}
    </div>
  );
}
