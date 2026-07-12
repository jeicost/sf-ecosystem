import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listItems, createItem, updateItem, deleteItem } from "../../lib/api";
import { useToast } from "../../components/Toast";
import { useConfirm } from "../../components/ConfirmDialog";

const SECTIONS = [
  { key: "restaurantes",            label: "Restaurantes",          icon: "🍽", itemType: "recomendado" },
  { key: "gastronomia_bcn",         label: "Gastronomía Local",     icon: "🥘", itemType: "recomendado" },
  { key: "fiesta",                  label: "Fiesta",                icon: "🎉", itemType: "recomendado" },
  { key: "ocio_eventos",            label: "Ocio y Eventos",        icon: "🎭", itemType: "event"       },
  { key: "arte_exposiciones",       label: "Arte y Exposiciones",   icon: "🖼", itemType: "recomendado" },
  { key: "experiencias",            label: "Experiencias",          icon: "🌍", itemType: "recomendado" },
  { key: "alojamientos",            label: "Alojamientos",          icon: "🏨", itemType: "recomendado" },
  { key: "shopping",                label: "Shopping",              icon: "🛍", itemType: "recomendado" },
  { key: "influencers",             label: "Influencers",           icon: "📱", itemType: "influencer"  },
  { key: "persona_timeline",        label: "Timeline Persona",      icon: "📅", itemType: "timeline"    },
  { key: "persona_recom",           label: "Recomendados Persona",  icon: "⭐", itemType: "persona_recom"},
  { key: "top_saves",               label: "10 Saves",              icon: "🔖", itemType: "recomendado", dividerBefore: true },
  { key: "coollections",            label: "Colecciones",           icon: "💜", itemType: "recomendado" },
];

// Badge taxonomy with colors — matches design system in templates
const BADGES = [
  { value: "",             label: "Sin badge",     color: "transparent", textColor: "var(--text)" },
  { value: "WOW",          label: "WOW",           color: "#C8006B" },
  { value: "NUEVO 2026",   label: "NUEVO 2026",    color: "#C8006B" },
  { value: "ICÓNICO",      label: "ICÓNICO",       color: "#111827" },
  { value: "LOCAL-OWNED",  label: "LOCAL-OWNED",   color: "#059669" },
  { value: "BEST VIEW",    label: "BEST VIEW",     color: "#2563EB" },
  { value: "ROMÁNTICO",    label: "ROMÁNTICO",     color: "#E11D48" },
  { value: "SOLO OK",      label: "SOLO OK",       color: "#7C3AED" },
  { value: "FAMILY OK",    label: "FAMILY OK",     color: "#D97706" },
  { value: "DESIGN",       label: "DESIGN",        color: "#475569" },
  { value: "WELLNESS",     label: "WELLNESS",      color: "#0D9488" },
  { value: "AF-FRIENDLY",  label: "AF-FRIENDLY",   color: "#65A30D" },
  { value: "LATE NIGHT",   label: "LATE NIGHT",    color: "#4338CA" },
  { value: "VALUE / €",    label: "VALUE / €",     color: "#6B7280" },
  { value: "SPLURGE / €€€",label: "SPLURGE / €€€", color: "#B8860B" },
  { value: "LUXURY",       label: "LUXURY",        color: "#B8860B" },
  { value: "BOUTIQUE",     label: "BOUTIQUE",      color: "#475569" },
  { value: "LOCAL",        label: "LOCAL",         color: "#059669" },
  { value: "SPEAKEASY",    label: "SPEAKEASY",     color: "#4338CA" },
  { value: "TRENDY",       label: "TRENDY",        color: "#C8006B" },
];

const ITEM_TYPE_MAP = {
  ocio_eventos:    "event",
  influencers:     "influencer",
  persona_timeline:"timeline",
  persona_recom:   "persona_recom",
};

export default function TabItems({ guide }) {
  const [activeSection, setActiveSection] = useState("restaurantes");
  const [showAdd, setShowAdd] = useState(false);
  const qc      = useQueryClient();
  const toast   = useToast();
  const confirm = useConfirm();

  const queryKey = ["items", guide.id, activeSection];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listItems(guide.id, { section: activeSection, include_disabled: true }),
  });

  const deleteMut = useMutation({
    mutationFn: iid => deleteItem(guide.id, iid),
    onSuccess: () => {
      qc.invalidateQueries(queryKey);
      toast.success("Item eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const reorderMut = useMutation({
    mutationFn: ({ iid, sort_order }) => updateItem(guide.id, iid, { sort_order }),
    onSuccess: () => qc.invalidateQueries(queryKey),
  });

  const currentSection = SECTIONS.find(s => s.key === activeSection);

  const moveItem = async (index, direction) => {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const target = sorted[index];
    const swap   = sorted[index + direction];
    if (!target || !swap) return;
    await Promise.all([
      reorderMut.mutateAsync({ iid: target.id, sort_order: swap.sort_order }),
      reorderMut.mutateAsync({ iid: swap.id,   sort_order: target.sort_order }),
    ]);
  };

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>

      {/* ── Section sidebar ── */}
      <div style={{
        width: 200, borderRight: "1px solid var(--border)",
        padding: "16px 8px", flexShrink: 0, overflow: "auto",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          color: "var(--muted)", padding: "4px 8px", marginBottom: 6 }}>
          SECCIONES
        </div>
        {SECTIONS.map(sec => (
          <div key={sec.key}>
            {sec.dividerBefore && (
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                color: "var(--muted)", padding: "10px 8px 4px",
                borderTop: "1px solid var(--border)", marginTop: 6,
              }}>
                ESPECIALES
              </div>
            )}
            <SectionNavItem
              sec={sec}
              guideId={guide.id}
              isActive={activeSection === sec.key}
              onClick={() => { setActiveSection(sec.key); setShowAdd(false); }}
            />
          </div>
        ))}
      </div>

      {/* ── Items list ── */}
      <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>
            {currentSection?.icon} {currentSection?.label}
            <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
              ({sortedItems.length})
            </span>
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? "✕ Cancelar" : "+ Añadir"}
          </button>
        </div>

        {showAdd && (
          <ItemForm
            guideId={guide.id}
            section={activeSection}
            itemType={ITEM_TYPE_MAP[activeSection] || "recomendado"}
            sortOrder={sortedItems.length}
            onDone={() => { setShowAdd(false); qc.invalidateQueries(queryKey); }}
            onCancel={() => setShowAdd(false)}
          />
        )}

        {isLoading ? (
          <div style={{ color: "var(--muted)", display: "flex", gap: 8, alignItems: "center" }}>
            <span className="spinner" /> Cargando...
          </div>
        ) : sortedItems.length === 0 && !showAdd ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontStyle: "italic" }}>
            No hay items. Añade uno o importa desde Excel.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedItems.map((item, idx) => (
              <ItemCard
                key={item.id}
                item={item}
                guideId={guide.id}
                index={idx}
                total={sortedItems.length}
                onDelete={async () => {
                  const ok = await confirm(`¿Eliminar "${item.name}"?`, { danger: true, confirmLabel: "Eliminar" });
                  if (ok) deleteMut.mutate(item.id);
                }}
                onMove={dir => moveItem(idx, dir)}
                onSaved={() => qc.invalidateQueries(queryKey)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ItemCard — collapsed view with inline expand-to-edit
───────────────────────────────────────────── */
function ItemCard({ item, guideId, index, total, onDelete, onMove, onSaved }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{
      padding: 0, overflow: "hidden",
      opacity: item.enabled ? 1 : 0.5,
      border: expanded ? "1px solid var(--mag)" : "1px solid var(--border)",
    }}>
      {/* ── Collapsed header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", cursor: "pointer",
      }}
        onClick={() => setExpanded(v => !v)}
      >
        {item.photo_url && (
          <img src={item.photo_url} alt="" style={{
            width: 52, height: 38, objectFit: "cover", borderRadius: 4, flexShrink: 0,
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {item.badge && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                background: BADGES.find(b => b.value === item.badge)?.color || "#1A1A2E",
                color: "#fff", padding: "1px 5px", borderRadius: 2,
              }}>
                {item.badge}
              </span>
            )}
            <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
            {!item.enabled && <span style={{ fontSize: 10, color: "var(--muted)" }}>· desactivado</span>}
          </div>
          {item.tagline && (
            <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", marginTop: 1 }}>
              {item.tagline}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" title="Subir" onClick={() => onMove(-1)} disabled={index === 0}>↑</button>
          <button className="btn btn-ghost btn-sm" title="Bajar" onClick={() => onMove(1)} disabled={index === total - 1}>↓</button>
          <button className="btn btn-ghost btn-sm" title="Eliminar" onClick={onDelete}>🗑</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(v => !v)}>
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* ── Expanded inline form ── */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 14px 12px", background: "var(--bg)" }}>
          <ItemForm
            guideId={guideId}
            section={item.section}
            itemType={item.item_type}
            existingItem={item}
            onDone={() => { setExpanded(false); onSaved(); }}
            onCancel={() => setExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ItemForm — used for both ADD and EDIT
───────────────────────────────────────────── */
function ItemForm({ guideId, section, itemType, existingItem, sortOrder = 0, onDone, onCancel }) {
  const isEdit = !!existingItem;
  const [form, setForm] = useState({
    name:           existingItem?.name           || "",
    tagline:        existingItem?.tagline         || "",
    description:    existingItem?.description     || "",
    web:            existingItem?.web             || "",
    address:        existingItem?.address         || "",
    discoolver_url: existingItem?.discoolver_url  || "",
    badge:          existingItem?.badge           || "",
    subcategory:    existingItem?.subcategory     || "",
    photo_url:      existingItem?.photo_url       || "",
    enabled:        existingItem?.enabled         ?? true,
    // Event fields
    event_when:     existingItem?.event_when      || "",
    event_where:    existingItem?.event_where     || "",
    // Influencer fields
    handle:         existingItem?.handle          || "",
    platform:       existingItem?.platform        || "",
    city:           existingItem?.city            || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    setLoading(true);
    setError("");
    try {
      const payload = {
        item_type: itemType,
        section,
        sort_order: existingItem?.sort_order ?? sortOrder,
        ...form,
      };
      if (isEdit) {
        await updateItem(guideId, existingItem.id, payload);
      } else {
        await createItem(guideId, payload);
      }
      onDone();
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const isInfluencer  = itemType === "influencer";
  const isEvent       = itemType === "event";
  const isTimeline    = itemType === "timeline";

  return (
    <div>
      <div className="field-row" style={{ marginBottom: 10 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Nombre *</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} autoFocus />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Tagline</label>
          <input value={form.tagline} onChange={e => set("tagline", e.target.value)} />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <label>Descripción</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)}
          rows={3} style={{ resize: "vertical" }} />
      </div>

      {/* Recomendado / place fields */}
      {!isInfluencer && !isTimeline && (
        <>
          <div className="field-row" style={{ marginBottom: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{isEvent ? "Cuándo" : "Web"}</label>
              <input value={isEvent ? form.event_when : form.web}
                onChange={e => set(isEvent ? "event_when" : "web", e.target.value)}
                placeholder={isEvent ? "Junio 2026" : "https://"} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{isEvent ? "Dónde" : "Dirección"}</label>
              <input value={isEvent ? form.event_where : form.address}
                onChange={e => set(isEvent ? "event_where" : "address", e.target.value)} />
            </div>
          </div>

          <div className="field-row" style={{ marginBottom: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Badge</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {BADGES.map(b => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => set("badge", b.value)}
                    style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                      padding: "3px 7px", borderRadius: 3, cursor: "pointer",
                      border: form.badge === b.value ? "2px solid var(--mag)" : "1px solid var(--border)",
                      background: b.value ? b.color : "var(--bg)",
                      color: b.value ? "#fff" : "var(--muted)",
                      outline: "none",
                      boxShadow: form.badge === b.value ? "0 0 0 2px rgba(200,0,107,0.25)" : "none",
                    }}
                  >
                    {b.label || "—"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="field-row" style={{ marginBottom: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Subcategoría</label>
              <input value={form.subcategory} onChange={e => set("subcategory", e.target.value)} />
            </div>
          </div>

          {!isEvent && (
            <div className="field" style={{ marginBottom: 10 }}>
              <label>URL Discoolver</label>
              <input value={form.discoolver_url}
                onChange={e => set("discoolver_url", e.target.value)}
                placeholder="https://discoolver.com/barcelona/lugar" />
            </div>
          )}
        </>
      )}

      {/* Influencer fields */}
      {isInfluencer && (
        <>
          <div className="field-row" style={{ marginBottom: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>@handle</label>
              <input value={form.handle} onChange={e => set("handle", e.target.value)} placeholder="@username" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Plataforma</label>
              <select value={form.platform} onChange={e => set("platform", e.target.value)}>
                <option value="">—</option>
                {["Instagram","TikTok","YouTube","Twitter","Twitch"].map(p =>
                  <option key={p} value={p}>{p}</option>
                )}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Ciudad</label>
            <input value={form.city} onChange={e => set("city", e.target.value)} />
          </div>
        </>
      )}

      {/* Photo URL */}
      <div className="field" style={{ marginBottom: 10 }}>
        <label>URL foto (o sube desde la pestaña Media)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={form.photo_url} onChange={e => set("photo_url", e.target.value)}
            placeholder="https://..." />
          {form.photo_url && (
            <img src={form.photo_url} alt="" style={{
              width: 48, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0,
            }} onError={e => e.target.style.display = "none"} />
          )}
        </div>
      </div>

      {/* Enabled toggle */}
      <label style={{
        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
        width: "auto", marginBottom: 12, fontSize: 13, color: "var(--text)",
      }}>
        <input type="checkbox" checked={form.enabled} onChange={e => set("enabled", e.target.checked)}
          style={{ width: "auto" }} />
        Activo (visible en la guía)
      </label>

      {error && (
        <div style={{
          padding: "7px 10px", borderRadius: 5, marginBottom: 10,
          background: "#FEE2E2", color: "#991B1B", fontSize: 12,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}
          disabled={loading || !form.name.trim()}>
          {loading ? <span className="spinner" /> : isEdit ? "Guardar cambios" : "Añadir item"}
        </button>
      </div>
    </div>
  );
}


/* ── SectionNavItem — proper component so useQuery obeys Rules of Hooks ── */
function SectionNavItem({ sec, guideId, isActive, onClick }) {
  const { data: secItems = [] } = useQuery({
    queryKey: ["items-count", guideId, sec.key],
    queryFn:  () => listItems(guideId, { section: sec.key }),
    staleTime: 60_000,
  });
  return (
    <button onClick={onClick}
      style={{
        width: "100%", textAlign: "left", padding: "8px 10px",
        borderRadius: 6, marginBottom: 2, fontSize: 12, border: "none",
        background: isActive ? "rgba(200,0,107,0.1)" : "transparent",
        color: isActive ? "var(--mag)" : "var(--text)",
        fontWeight: isActive ? 600 : 400,
        cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
      <span>{sec.icon} {sec.label}</span>
      {secItems.length > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: isActive ? "var(--mag)" : "var(--border)",
          color: isActive ? "#fff" : "var(--muted)",
          padding: "1px 5px", borderRadius: 10,
        }}>
          {secItems.length}
        </span>
      )}
    </button>
  );
}
