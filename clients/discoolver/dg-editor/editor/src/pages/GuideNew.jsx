import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGuide } from "../lib/api";
import { useToast } from "../components/Toast";

// ── Guide types ───────────────────────────────────────────────────────────────
const GUIDE_TYPES = [
  {
    value: "world",
    label: "Mundo",
    labelEn: "World",
    desc: "Guía de destino global sin ciudad fija",
    descEn: "Global destination guide without fixed city",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    accentColor: "#C8006B",
  },
  {
    value: "local",
    label: "Ciudad",
    labelEn: "City",
    desc: "Guía local de una ciudad o destino específico",
    descEn: "Local guide for a specific city or destination",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    accentColor: "#059669",
  },
  {
    value: "collection",
    label: "Colección",
    labelEn: "Collection",
    desc: "Colección temática — Club Hero, Foodie, Wellness...",
    descEn: "Themed collection — Club Hero, Foodie, Wellness...",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    accentColor: "#6366F1",
  },
  {
    value: "influencer",
    label: "Influencer",
    labelEn: "Influencer",
    desc: "Guía personalizada de un content creator",
    descEn: "Personalized guide from a content creator",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/>
      </svg>
    ),
    accentColor: "#EC4899",
  },
  {
    value: "dossier",
    label: "Dossier",
    labelEn: "Dossier",
    desc: "Dosier libre generado con asistencia de IA",
    descEn: "Free-form dossier with AI assistance",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    accentColor: "#475569",
  },
];

// ── Collections (14 reales) ───────────────────────────────────────────────────
const COLLECTIONS = [
  { value: "estandar",          label: "Estándar",              color: "#C8006B" },
  { value: "club-hero",         label: "Club Hero",             color: "#8B5CF6" },
  { value: "plotwist-date",     label: "Plotwist Date",         color: "#F43F5E" },
  { value: "wellness-nature",   label: "Wellness + Nature",     color: "#10B981" },
  { value: "music-circuit",     label: "Music Circuit",         color: "#F97316" },
  { value: "shopping-lover",    label: "Shopping Lover",        color: "#EC4899" },
  { value: "foodie-hoodie",     label: "Foodie with a Hoodie",  color: "#D97706" },
  { value: "foodie-selection",  label: "Foodie Selection",      color: "#B45309" },
  { value: "family-weekend",    label: "Family Weekend",        color: "#0EA5E9" },
  { value: "cultura-misterio",  label: "Cultura & Misterio",   color: "#0D9488" },
  { value: "solo-explorer",     label: "Solo Authentic Explorer", color: "#475569" },
  { value: "nomadas-digitales", label: "Nómadas Digitales",     color: "#6366F1" },
  { value: "hidden-gems",       label: "Aesthetic Hidden Gems", color: "#9F6CA8" },
  { value: "amantes-motor",     label: "Amantes del Motor",    color: "#EF4444" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function GuideNew() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [step, setStep]             = useState(1);
  const [guideType, setGuideType]   = useState(null);
  const [collection, setCollection] = useState("estandar");
  const [city, setCity]             = useState("");
  const [year, setYear]             = useState(new Date().getFullYear().toString().slice(-2));
  const [director, setDirector]     = useState("Carlos Jacoste");
  const [dirRole, setDirRole]       = useState("CEO & Fundador — discoolver");
  const [edition, setEdition]       = useState("");
  const [error, setError]           = useState(null);
  const toast = useToast();

  const mut = useMutation({
    mutationFn: createGuide,
    onSuccess: (guide) => {
      qc.invalidateQueries(["guides"]);
      toast.success(`Guía "${guide.city || "Global"} 20${guide.year}" creada — ahora añade tus primeros items`);
      navigate(`/guides/${guide.id}`);
    },
    onError: (e) => setError(e.response?.data?.detail || e.message),
  });

  const selectedType = GUIDE_TYPES.find(t => t.value === guideType);

  // ── Step 1: type selection ─────────────────────────────────────────────────
  if (step === 1) return (
    <div style={{ padding: "32px 40px", maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Nueva guía</h1>
        <p className="page-sub">Elige el tipo de guía que quieres crear</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {GUIDE_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => { setGuideType(type.value); setStep(2); }}
            style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              padding: "18px 18px",
              background: "var(--surface)",
              border: `1px solid var(--border)`,
              borderRadius: "var(--radius)",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = type.accentColor;
              e.currentTarget.style.background = `${type.accentColor}10`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--surface)";
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: `${type.accentColor}15`,
              border: `1px solid ${type.accentColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: type.accentColor,
            }}>
              {type.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3, letterSpacing: -0.3 }}>
                {type.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                {type.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
      </div>
    </div>
  );

  // ── Step 2: details ────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    mut.mutate({
      guide_type:   guideType,
      collection:   guideType === "collection" ? collection : "estandar",
      city:         city.toUpperCase() || "GLOBAL",
      year:         year || new Date().getFullYear().toString().slice(-2),
      director,
      director_role: dirRole,
      edition:      edition || undefined,
    });
  };

  const selCol = COLLECTIONS.find(c => c.value === collection);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 640 }}>
      {/* Header with back */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setStep(1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--muted)", fontSize: 12, padding: "0 0 12px",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Cambiar tipo
        </button>

        {/* Type badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${selectedType.accentColor}15`,
            border: `1px solid ${selectedType.accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: selectedType.accentColor,
          }}>
            {selectedType.icon}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              {selectedType.label}
            </h1>
            <p className="page-sub">{selectedType.desc}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* City + Year */}
        <div className="field-row">
          <div className="field">
            <label>Ciudad <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Barcelona"
              style={{ textTransform: "uppercase" }}
            />
          </div>
          <div className="field">
            <label>Año <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none" }}>(últimos 2 dígitos — ej. 26 para 2026)</span></label>
            <input
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder={new Date().getFullYear().toString().slice(-2)}
              maxLength={4}
            />
          </div>
        </div>

        {/* Collections — only for "collection" type */}
        {guideType === "collection" && (
          <div className="field">
            <label>Colección temática</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLLECTIONS.map(col => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setCollection(col.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                    border: `2px solid ${collection === col.value ? col.color : "var(--border)"}`,
                    background: collection === col.value ? `${col.color}18` : "var(--surface2)",
                    fontSize: 12, fontWeight: collection === col.value ? 600 : 400,
                    color: collection === col.value ? col.color : "var(--muted2)",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                  {col.label}
                </button>
              ))}
            </div>
            {selCol && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                Seleccionada: <strong style={{ color: selCol.color }}>{selCol.label}</strong>
              </div>
            )}
          </div>
        )}

        {/* Director + Role */}
        <div className="field-row">
          <div className="field">
            <label>Director / Editor</label>
            <input value={director} onChange={e => setDirector(e.target.value)} />
          </div>
          <div className="field">
            <label>Cargo</label>
            <input value={dirRole} onChange={e => setDirRole(e.target.value)} />
          </div>
        </div>

        {/* Edition name */}
        <div className="field">
          <label>Nombre de edición <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
          <input
            value={edition}
            onChange={e => setEdition(e.target.value)}
            placeholder={(() => {
              if (guideType === "world")      return `Edición Global 20${year}`;
              if (guideType === "dossier")    return `Dossier 20${year}`;
              if (guideType === "influencer") return `Guía Influencer 20${year}`;
              if (guideType === "collection") return `Colección ${year}`;
              return `Edición ${city || "Ciudad"} 20${year}`;
            })()}
          />
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={mut.isPending}
            style={{ flex: 1, justifyContent: "center" }}>
            {mut.isPending
              ? <><span className="spinner" /> Creando...</>
              : "Crear guía →"}
          </button>
        </div>
      </form>
    </div>
  );
}
