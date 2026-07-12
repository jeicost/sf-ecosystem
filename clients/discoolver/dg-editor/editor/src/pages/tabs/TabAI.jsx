import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listItems, generateAI, suggestItems, acceptSuggestions } from "../../lib/api";
import { useToast } from "../../components/Toast";

const SECTIONS = [
  { key: "restaurantes",      label: "Restaurantes",        emoji: "🍽️" },
  { key: "fiesta",            label: "Fiesta",              emoji: "🎉" },
  { key: "ocio_eventos",      label: "Ocio y Eventos",      emoji: "🎭" },
  { key: "arte_exposiciones", label: "Arte y Exposiciones", emoji: "🖼️" },
  { key: "experiencias",      label: "Experiencias",        emoji: "🌍" },
  { key: "alojamientos",      label: "Alojamientos",        emoji: "🏨" },
  { key: "shopping",          label: "Shopping",            emoji: "🛍️" },
];

const SECTION_COLORS = {
  restaurantes: "#F59E0B", fiesta: "#8B5CF6", ocio_eventos: "#3B82F6",
  arte_exposiciones: "#EC4899", experiencias: "#10B981",
  alojamientos: "#F97316", shopping: "#06B6D4",
};

// ── Suggest mode ──────────────────────────────────────────────────────────────

function SuggestTab({ guide }) {
  const toast = useToast();
  const qc = useQueryClient();

  const [selected, setSelected] = useState({ restaurantes: 6, fiesta: 5 });
  const [hint, setHint] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [approved, setApproved] = useState(new Set());

  const suggestMut = useMutation({
    mutationFn: () => suggestItems(guide.id, {
      sections: Object.entries(selected).map(([section, count]) => ({ section, count })),
      style_hint: hint || undefined,
    }),
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      // Pre-approve all by default
      setApproved(new Set(data.suggestions.map((_, i) => i)));
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Error generando sugerencias"),
  });

  const acceptMut = useMutation({
    mutationFn: () => acceptSuggestions(guide.id, {
      items: suggestions.filter((_, i) => approved.has(i)),
    }),
    onSuccess: (data) => {
      toast.success(`${data.created} recomendados añadidos a la guía`);
      setSuggestions(null);
      setApproved(new Set());
      qc.invalidateQueries(["items", guide.id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Error guardando items"),
  });

  const toggleSection = (key) => {
    setSelected(prev => {
      const next = { ...prev };
      if (key in next) { delete next[key]; } else { next[key] = 6; }
      return next;
    });
    setSuggestions(null);
  };

  const setCount = (key, val) => {
    setSelected(prev => ({ ...prev, [key]: Number(val) }));
    setSuggestions(null);
  };

  const toggleApprove = (i) => {
    setApproved(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const approvedCount = suggestions ? [...approved].length : 0;
  const sectionGroups = suggestions
    ? SECTIONS.map(s => ({
        ...s,
        items: suggestions
          .map((item, i) => ({ ...item, _idx: i }))
          .filter(it => it.section === s.key),
      })).filter(g => g.items.length > 0)
    : [];

  // ── Review screen ──────────────────────────────────────────────────────────
  if (suggestions) {
    return (
      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setSuggestions(null)}>
            ← Volver
          </button>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
              Sugerencias generadas — {suggestions.length} items
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              Aprueba o descarta cada sugerencia antes de guardar
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => acceptMut.mutate()}
            disabled={approvedCount === 0 || acceptMut.isPending}
            style={{ whiteSpace: "nowrap" }}
          >
            {acceptMut.isPending
              ? <><span className="spinner" /> Guardando...</>
              : `✓ Guardar selección (${approvedCount})`}
          </button>
        </div>

        {/* Select all / none */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="btn btn-secondary btn-sm"
            onClick={() => setApproved(new Set(suggestions.map((_, i) => i)))}>
            Seleccionar todo
          </button>
          <button className="btn btn-secondary btn-sm"
            onClick={() => setApproved(new Set())}>
            Deseleccionar todo
          </button>
        </div>

        {sectionGroups.map(group => (
          <div key={group.key} style={{ marginBottom: 28 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
              paddingBottom: 8, borderBottom: `2px solid ${SECTION_COLORS[group.key] || "var(--border)"}`,
            }}>
              <span style={{ fontSize: 16 }}>{group.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{group.label}</span>
              <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>
                {group.items.filter(it => approved.has(it._idx)).length}/{group.items.length} seleccionados
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.items.map((item) => {
                const isApproved = approved.has(item._idx);
                return (
                  <div key={item._idx}
                    onClick={() => toggleApprove(item._idx)}
                    style={{
                      padding: "12px 14px", borderRadius: 8, cursor: "pointer",
                      border: `2px solid ${isApproved ? "var(--mag)" : "var(--border)"}`,
                      background: isApproved ? "rgba(200,0,107,0.04)" : "var(--surface)",
                      transition: "all 0.15s",
                      display: "flex", gap: 12, alignItems: "flex-start",
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${isApproved ? "var(--mag)" : "var(--border)"}`,
                      background: isApproved ? "var(--mag)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isApproved && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</span>
                        {item.badge && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                            background: "var(--mag)", color: "#fff", letterSpacing: 0.5,
                          }}>{item.badge}</span>
                        )}
                        {item.subcategory && (
                          <span style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>
                            {item.subcategory}
                          </span>
                        )}
                      </div>
                      {item.tagline && (
                        <div style={{ fontSize: 11, color: "var(--mag)", marginBottom: 4, fontStyle: "italic" }}>
                          {item.tagline}
                        </div>
                      )}
                      {item.description && (
                        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 4 }}>
                          {item.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
                        {item.address && <span>📍 {item.address}</span>}
                        {item.web && <span>🌐 {item.web.replace("https://", "").replace("http://", "").split("/")[0]}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button
            className="btn btn-primary"
            onClick={() => acceptMut.mutate()}
            disabled={approvedCount === 0 || acceptMut.isPending}
            style={{ width: "100%", justifyContent: "center", padding: 12 }}
          >
            {acceptMut.isPending
              ? <><span className="spinner" /> Guardando...</>
              : `✓ Guardar selección (${approvedCount} de ${suggestions.length})`}
          </button>
        </div>
      </div>
    );
  }

  // ── Config screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 32px", maxWidth: 680 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
          ✦ Sugerencias de recomendados
        </h3>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Claude generará recomendados reales de {guide.city} para las secciones que elijas.
          Tú apruebas cuáles añadir a la guía.
        </p>
      </div>

      {/* Section selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 12, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Secciones a incluir
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SECTIONS.map(sec => {
            const isOn = sec.key in selected;
            return (
              <div key={sec.key} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                border: `1.5px solid ${isOn ? (SECTION_COLORS[sec.key] || "var(--mag)") : "var(--border)"}`,
                background: isOn ? `${SECTION_COLORS[sec.key] || "var(--mag)"}10` : "transparent",
                transition: "all 0.15s",
              }}
                onClick={() => toggleSection(sec.key)}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{sec.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: isOn ? 600 : 400 }}>{sec.label}</span>
                {isOn && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}
                    onClick={e => e.stopPropagation()}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Cuántos:</span>
                    {[3, 5, 6, 8, 10].map(n => (
                      <button key={n}
                        onClick={() => setCount(sec.key, n)}
                        style={{
                          width: 28, height: 24, borderRadius: 4, border: "1.5px solid",
                          borderColor: selected[sec.key] === n ? "var(--mag)" : "var(--border)",
                          background: selected[sec.key] === n ? "var(--mag)" : "transparent",
                          color: selected[sec.key] === n ? "#fff" : "var(--text)",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Style hint */}
      <div className="field" style={{ marginBottom: 20 }}>
        <label>Contexto adicional (opcional)</label>
        <input value={hint} onChange={e => setHint(e.target.value)}
          placeholder="Ej: enfocado en nómadas digitales, presupuesto medio-alto, 2026..." />
      </div>

      {/* Summary */}
      {Object.keys(selected).length > 0 && (
        <div style={{
          padding: "10px 14px", borderRadius: 7, background: "var(--bg)",
          fontSize: 13, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {Object.entries(selected).map(([key, count]) => {
            const sec = SECTIONS.find(s => s.key === key);
            return (
              <span key={key} style={{
                padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: SECTION_COLORS[key] || "var(--mag)", color: "#fff",
              }}>
                {sec?.emoji} {count} {sec?.label}
              </span>
            );
          })}
          <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center", marginLeft: 4 }}>
            = {Object.values(selected).reduce((a, b) => a + b, 0)} sugerencias totales
          </span>
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: 12, fontSize: 14 }}
        onClick={() => suggestMut.mutate()}
        disabled={Object.keys(selected).length === 0 || suggestMut.isPending}
      >
        {suggestMut.isPending
          ? <><span className="spinner" /> Consultando a Claude... puede tardar 20-30s</>
          : `✦ Generar sugerencias (${Object.values(selected).reduce((a, b) => a + b, 0)} items)`}
      </button>

      {suggestMut.isPending && (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 12 }}>
          Claude está buscando los mejores sitios reales de {guide.city}…
        </p>
      )}
    </div>
  );
}


// ── Generate texts mode (existing functionality) ──────────────────────────────

function GenerateTextsTab({ guide }) {
  const qc = useQueryClient();
  const [section, setSection] = useState("restaurantes");
  const [field, setField] = useState("both");
  const [overwrite, setOverwrite] = useState(false);
  const [hint, setHint] = useState("");
  const [results, setResults] = useState(null);

  const { data: items = [] } = useQuery({
    queryKey: ["items", guide.id, section],
    queryFn: () => listItems(guide.id, { section }),
  });

  const emptyCount = items.filter(it =>
    (field === "description" || field === "both") ? !it.description :
    (field === "tagline") ? !it.tagline : false
  ).length;

  const genMut = useMutation({
    mutationFn: () => generateAI(guide.id, { field, overwrite, style_hint: hint || undefined }),
    onSuccess: (data) => {
      setResults(data);
      qc.invalidateQueries(["items", guide.id, section]);
    },
  });

  return (
    <div style={{ padding: "24px 32px", maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>✦ Generar textos</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Rellena taglines y descripciones de fichas ya existentes con el estilo editorial Discoolver.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="field-row" style={{ marginBottom: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Sección</label>
            <select value={section} onChange={e => setSection(e.target.value)}>
              {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Campo</label>
            <select value={field} onChange={e => setField(e.target.value)}>
              <option value="both">Tagline + Descripción</option>
              <option value="description">Solo descripción</option>
              <option value="tagline">Solo tagline</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Contexto adicional (opcional)</label>
          <input value={hint} onChange={e => setHint(e.target.value)}
            placeholder="Ej: estilo minimalista, público joven..." />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)}
            style={{ width: "auto" }} />
          Sobrescribir textos existentes
        </label>
      </div>

      <div className="card" style={{ marginBottom: 20, background: "var(--bg)" }}>
        <div style={{ fontSize: 13 }}>
          <strong>{items.length}</strong> items en esta sección ·{" "}
          <strong style={{ color: overwrite ? "var(--mag)" : "var(--success)" }}>
            {overwrite ? items.length : emptyCount}
          </strong> se procesarán
        </div>
      </div>

      <button className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", padding: 12 }}
        onClick={() => genMut.mutate()}
        disabled={genMut.isPending || items.length === 0}
      >
        {genMut.isPending
          ? <><span className="spinner" /> Generando con Claude...</>
          : `✦ Generar textos (${overwrite ? items.length : emptyCount} items)`}
      </button>

      {results && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            padding: "10px 14px", borderRadius: 6, marginBottom: 14,
            background: "#D1FAE5", color: "#065F46", fontSize: 13, fontWeight: 500,
          }}>
            ✓ {results.generated} generados · {results.skipped} omitidos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.items.filter(it => !it.error).slice(0, 10).map((it, i) => (
              <div key={i} className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{it.name}</div>
                {it.tagline && <div style={{ fontSize: 11, color: "var(--mag)", marginBottom: 4, fontStyle: "italic" }}>{it.tagline}</div>}
                {it.description && <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{it.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Main TabAI ─────────────────────────────────────────────────────────────────

export default function TabAI({ guide }) {
  const [mode, setMode] = useState("suggest");

  return (
    <div>
      {/* Mode switcher */}
      <div style={{
        display: "flex", gap: 0, borderBottom: "1px solid var(--border)",
        padding: "0 32px",
      }}>
        {[
          { key: "suggest", label: "✦ Sugerir recomendados" },
          { key: "texts",   label: "✦ Generar textos" },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setMode(tab.key)}
            style={{
              padding: "10px 16px", border: "none", background: "transparent",
              fontSize: 13, fontWeight: mode === tab.key ? 700 : 400,
              color: mode === tab.key ? "var(--mag)" : "var(--muted)",
              borderBottom: mode === tab.key ? "2px solid var(--mag)" : "2px solid transparent",
              cursor: "pointer", marginBottom: -1,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "suggest" ? <SuggestTab guide={guide} /> : <GenerateTextsTab guide={guide} />}
    </div>
  );
}
