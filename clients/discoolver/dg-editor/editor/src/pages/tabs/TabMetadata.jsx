import { useForm } from "react-hook-form";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGuide, generateAiPhoto } from "../../lib/api";

const COLLECTIONS = [
  "estandar", "nomadas-digitales", "ocio-nocturno",
  "gastronomia", "influencers", "luxury", "custom",
];

export default function TabMetadata({ guide }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { isDirty, errors } } = useForm({
    defaultValues: {
      city: guide.city,
      year: guide.year,
      edition: guide.edition || "",
      director: guide.director,
      director_role: guide.director_role,
      collection: guide.collection,
      accent_color: guide.accent_color || "#C8006B",
      status: guide.status,
      cover_headline1: guide.cover_headline1,
      cover_headline2: guide.cover_headline2,
      cover_tagline: guide.cover_tagline,
      cover_sub_tagline: guide.cover_sub_tagline || "",
      cover_bg_color: guide.cover_bg_color,
      headline_align: guide.headline_align,
      directors_letter: guide.directors_letter || "",
      director_pull_quote: guide.director_pull_quote || "",
      mission_text: guide.mission_text || "",
      persona_name: guide.persona_name || "",
      persona_tagline: guide.persona_tagline || "",
      persona_origen: guide.persona_origen || "",
      persona_disciplina: guide.persona_disciplina || "",
      persona_bio: guide.persona_bio || "",
      persona_quote: guide.persona_quote || "",
    },
  });

  const mut = useMutation({
    mutationFn: data => updateGuide(guide.id, data),
    onSuccess: () => qc.invalidateQueries(["guide", guide.id]),
  });

  const [aiCoverLoading, setAiCoverLoading] = useState(false);
  const [aiCoverError,   setAiCoverError]   = useState(null);
  const [aiCoverResult,  setAiCoverResult]  = useState(null);
  const [aiCoverPrompt,  setAiCoverPrompt]  = useState("");

  const handleAiCover = async () => {
    setAiCoverLoading(true);
    setAiCoverError(null);
    setAiCoverResult(null);
    try {
      const asset = await generateAiPhoto(guide.id, {
        field_key: "cover_photo",
        prompt: aiCoverPrompt.trim() || undefined,
      });
      setAiCoverResult(asset.cdn_url || asset.url);
      qc.invalidateQueries(["guide", guide.id]);
    } catch (err) {
      setAiCoverError(err.response?.data?.detail || err.message);
    } finally {
      setAiCoverLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(data => mut.mutate(data))}
      style={{ padding: "28px 32px", maxWidth: 900 }}>

      {/* ── Save bar ── */}
      {(isDirty || mut.isSuccess || mut.isError) && (
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: mut.isSuccess ? "#D1FAE5" : mut.isError ? "#FEE2E2" : "var(--navy)",
          color: mut.isSuccess ? "#065F46" : mut.isError ? "#991B1B" : "#fff",
          padding: "10px 16px", borderRadius: 6, marginBottom: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 13,
        }}>
          <span>
            {mut.isSuccess ? "✓ Guardado" : mut.isError ? "✗ Error al guardar" : "Cambios sin guardar"}
          </span>
          {isDirty && (
            <button type="submit" className="btn btn-primary btn-sm" disabled={mut.isPending}>
              {mut.isPending ? <><span className="spinner" /> Guardando...</> : "Guardar cambios"}
            </button>
          )}
        </div>
      )}

      {/* ── Guide identity ── */}
      <Section title="Identidad de la guía">
        <div className="field-row">
          <div className="field">
            <label>Ciudad</label>
            <input {...register("city")} style={{ textTransform: "uppercase" }} />
          </div>
          <div className="field">
            <label>Año (2 dígitos)</label>
            <input {...register("year")} maxLength={4} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Nombre de edición</label>
            <input {...register("edition")} />
          </div>
          <div className="field">
            <label>Estado</label>
            <select {...register("status")}>
              <option value="draft">Draft</option>
              <option value="review">En revisión</option>
              <option value="published">Publicada</option>
              <option value="archived">Archivada</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Colección</label>
            <select {...register("collection")}>
              {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Color accent</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" {...register("accent_color")}
                style={{ width: 44, height: 36, padding: 2 }} />
              <input {...register("accent_color")} style={{ flex: 1 }} />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Cover ── */}
      <Section title="Portada (Templates 01 / 02)">
        <div className="field-row">
          <div className="field">
            <label>Titular línea 1 (Bebas)</label>
            <input {...register("cover_headline1")} />
          </div>
          <div className="field">
            <label>Titular línea 2 (Italic)</label>
            <input {...register("cover_headline2")} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Tagline (bajo wordmark)</label>
            <input {...register("cover_tagline")} />
          </div>
          <div className="field">
            <label>Sub-tagline (bajo ciudad)</label>
            <input {...register("cover_sub_tagline")} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Color fondo</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" {...register("cover_bg_color")}
                style={{ width: 44, height: 36, padding: 2 }} />
              <input {...register("cover_bg_color")} style={{ flex: 1 }} />
            </div>
          </div>
          <div className="field">
            <label>Alineación titular</label>
            <select {...register("headline_align")}>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
            </select>
          </div>
        </div>
      </Section>

      {/* ── Foto de portada ── */}
      <Section title="Foto de portada">
        {/* Preview si ya hay foto */}
        {guide.cover_photo_url || aiCoverResult ? (
          <div style={{ marginBottom: 16, position: "relative", display: "inline-block" }}>
            <img
              src={aiCoverResult || guide.cover_photo_url}
              alt="Portada"
              style={{ width: 160, height: 200, objectFit: "cover", borderRadius: 6,
                border: "2px solid var(--border)", display: "block" }}
            />
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              Foto actual — visible en Preview y PDF
            </div>
          </div>
        ) : (
          <div style={{
            width: 160, height: 200, borderRadius: 6,
            border: "2px dashed var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 8, color: "var(--muted)",
            fontSize: 12, marginBottom: 16,
          }}>
            <span style={{ fontSize: 28 }}>🖼</span>
            <span>Sin foto</span>
          </div>
        )}

        {/* Generador IA */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, padding: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Generar con IA — Freepik</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Genera una foto de portada según ciudad y tipo de guía. Requiere{" "}
                <code style={{ fontSize: 10 }}>FREEPIK_API_KEY</code> en <code style={{ fontSize: 10 }}>.env</code>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
              PROMPT <span style={{ fontWeight: 400 }}>(opcional — déjalo vacío para auto-generar)</span>
            </label>
            <input
              value={aiCoverPrompt}
              onChange={e => setAiCoverPrompt(e.target.value)}
              placeholder={`Auto: "${guide.city} travel photography, editorial, golden hour…"`}
              style={{ width: "100%" }}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAiCover}
            disabled={aiCoverLoading}
            style={{ background: "linear-gradient(135deg, var(--mag), #7c3aed)" }}
          >
            {aiCoverLoading
              ? <><span className="spinner" /> Generando… (30-60s)</>
              : "✨ Generar foto de portada"}
          </button>

          {aiCoverError && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 6, fontSize: 12,
              background: "#FEE2E2", color: "#991B1B",
            }}>
              {aiCoverError}
            </div>
          )}

          {aiCoverResult && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#10B981", fontWeight: 600 }}>
              ✓ Foto generada y aplicada. Ve a Preview para verla.
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
          También puedes subir tu propia foto en el tab{" "}
          <strong>Media</strong> → Tipo: Foto portada.
        </div>
      </Section>

      {/* ── Director ── */}
      <Section title="Nota del Director (Template 04)">
        <div className="field-row">
          <div className="field">
            <label>Nombre del director</label>
            <input {...register("director")} />
          </div>
          <div className="field">
            <label>Cargo</label>
            <input {...register("director_role")} />
          </div>
        </div>
        <div className="field">
          <label>Carta editorial</label>
          <textarea {...register("directors_letter")} rows={5}
            style={{ resize: "vertical" }}
            placeholder="Texto de la carta del director..." />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Pull-quote</label>
            <textarea {...register("director_pull_quote")} rows={3}
              style={{ resize: "vertical" }} />
          </div>
          <div className="field">
            <label>Texto misión</label>
            <textarea {...register("mission_text")} rows={3}
              style={{ resize: "vertical" }} />
          </div>
        </div>
      </Section>

      {/* ── Persona del Año ── */}
      <Section title="Persona del Año (Template 05)">
        <div className="field-row">
          <div className="field">
            <label>Nombre</label>
            <input {...register("persona_name")} />
          </div>
          <div className="field">
            <label>Tagline</label>
            <input {...register("persona_tagline")} />
          </div>
        </div>
        <div className="field-row-3">
          <div className="field">
            <label>Origen</label>
            <input {...register("persona_origen")} />
          </div>
          <div className="field">
            <label>Disciplina</label>
            <input {...register("persona_disciplina")} />
          </div>
          <div className="field">
            <label>Cita destacada</label>
            <input {...register("persona_quote")} />
          </div>
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea {...register("persona_bio")} rows={3} style={{ resize: "vertical" }} />
        </div>
      </Section>

    </form>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{
        fontSize: 13, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "var(--muted)",
        marginBottom: 14, paddingBottom: 8,
        borderBottom: "1px solid var(--border)",
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
