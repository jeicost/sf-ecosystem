import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMedia, uploadMedia, deleteMedia, generateAiPhoto, api } from "../../lib/api";

const bulkImportPhotos = (guideId, photos) =>
  api.post(`/v2/guides/${guideId}/bulk-photos`, { photos }).then(r => r.data);

const FIELD_KEYS = [
  { value: "cover_photo",        label: "Foto portada" },
  { value: "director_photo",     label: "Foto director" },
  { value: "persona_photo",      label: "Foto persona del año" },
  { value: "persona_body_photo", label: "Foto artículo persona" },
  { value: "item_photo",         label: "Foto de ficha" },
  { value: "general",            label: "General" },
];

export default function TabMedia({ guide }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [fieldKey, setFieldKey]     = useState("general");
  const [uploading, setUploading]   = useState(false);
  const [showBulk, setShowBulk]         = useState(false);
  const [bulkText, setBulkText]         = useState("");
  const [bulkResult, setBulkResult]     = useState(null);
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [showAI, setShowAI]             = useState(false);
  const [aiPrompt, setAiPrompt]         = useState("");
  const [aiFieldKey, setAiFieldKey]     = useState("cover_photo");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState(null);
  const [aiResult, setAiResult]         = useState(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["media", guide.id],
    queryFn: () => listMedia(guide.id),
  });

  const deleteMut = useMutation({
    mutationFn: aid => deleteMedia(guide.id, aid),
    onSuccess: () => qc.invalidateQueries(["media", guide.id]),
  });

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("field_key", fieldKey);
        await uploadMedia(guide.id, form);
      }
      qc.invalidateQueries(["media", guide.id]);
      qc.invalidateQueries(["guide", guide.id]);
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    } finally {
      setUploading(false);
      fileRef.current.value = "";
    }
  };

  const copyUrl = (url) => navigator.clipboard.writeText(url);

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const asset = await generateAiPhoto(guide.id, {
        field_key: aiFieldKey,
        prompt: aiPrompt.trim() || undefined,
      });
      setAiResult(asset);
      qc.invalidateQueries(["media", guide.id]);
      qc.invalidateQueries(["guide", guide.id]);
    } catch (err) {
      setAiError(err.response?.data?.detail || err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleBulkImport = async () => {
    const urls = bulkText
      .split("\n")
      .map(u => u.trim())
      .filter(u => u.startsWith("http"));
    if (!urls.length) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const result = await bulkImportPhotos(guide.id, urls.map(url => ({ url })));
      setBulkResult(result);
      qc.invalidateQueries(["media", guide.id]);
    } catch (e) {
      setBulkResult({ error: e.response?.data?.detail || e.message });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* Upload area */}
      <div className="card" style={{
        borderStyle: "dashed", borderColor: "var(--mag)",
        marginBottom: 24, padding: 24, textAlign: "center",
      }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            Subir imágenes
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            JPG, PNG, WebP — máx. 10 MB por archivo
          </div>
        </div>

        <div className="flex gap-2 items-center" style={{ justifyContent: "center", marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "var(--muted)", width: "auto", marginBottom: 0 }}>Tipo:</label>
          <select value={fieldKey} onChange={e => setFieldKey(e.target.value)}
            style={{ width: 200 }}>
            {FIELD_KEYS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <label className={`btn btn-primary ${uploading ? "opacity-60" : ""}`}
            style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
            {uploading ? <><span className="spinner" /> Subiendo...</> : "📎 Seleccionar archivos"}
            <input ref={fileRef} type="file" accept="image/*" multiple
              style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
          </label>
          <button className="btn btn-secondary" onClick={() => setShowBulk(v => !v)}>
            🔗 Importar por URL
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => { setShowAI(v => !v); setShowBulk(false); }}
            style={{ borderColor: "var(--mag)", color: "var(--mag)" }}
          >
            ✨ Generar con IA
          </button>
        </div>

        {showAI && (
          <div style={{ marginTop: 16, textAlign: "left", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Generar imagen con Freepik IA</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
              La IA genera automáticamente una imagen según el tipo de guía y ciudad.
              Puedes personalizar el prompt o dejarlo vacío para que lo auto-genere.
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>APLICAR COMO</label>
                <select value={aiFieldKey} onChange={e => setAiFieldKey(e.target.value)}>
                  {FIELD_KEYS.filter(f => f.value !== "general" && f.value !== "item_photo").map(f =>
                    <option key={f.value} value={f.value}>{f.label}</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>
                PROMPT PERSONALIZADO <span style={{ fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder={`Auto: "${guide.city} travel photography, editorial style, golden hour…"`}
                style={{ width: "100%" }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleAiGenerate}
              disabled={aiLoading}
            >
              {aiLoading
                ? <><span className="spinner" /> Generando… (puede tardar 30-60s)</>
                : "✨ Generar imagen"}
            </button>

            {aiError && (
              <div style={{
                marginTop: 10, padding: "10px 14px", borderRadius: 6, fontSize: 12,
                background: "#FEE2E2", color: "#991B1B",
              }}>
                ✗ {aiError}
              </div>
            )}

            {aiResult && (
              <div style={{
                marginTop: 12, padding: 12, borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--surface)",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <img
                  src={aiResult.cdn_url || aiResult.url}
                  alt="AI generated"
                  style={{ width: 80, height: 100, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#10B981" }}>
                    ✓ Imagen generada y aplicada como {FIELD_KEYS.find(f => f.value === aiFieldKey)?.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
                    Ve al tab Preview para verla en la portada.
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyUrl(aiResult.cdn_url || aiResult.url)}
                    style={{ fontSize: 11 }}
                  >
                    📋 Copiar URL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showBulk && (
          <div style={{ marginTop: 16, textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              Una URL por línea (máx. 50). Se subirán a DO Spaces automáticamente.
            </div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
              rows={5} style={{ resize: "vertical", marginBottom: 8 }}
              placeholder={"https://res.cloudinary.com/...\nhttps://..."} />
            <button className="btn btn-primary btn-sm" onClick={handleBulkImport}
              disabled={bulkLoading || !bulkText.trim()}>
              {bulkLoading ? <><span className="spinner" /> Importando...</> : "⬇ Importar URLs"}
            </button>
            {bulkResult && (
              <div style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 6, fontSize: 12,
                background: bulkResult.error ? "#FEE2E2" : "#D1FAE5",
                color: bulkResult.error ? "#991B1B" : "#065F46",
              }}>
                {bulkResult.error
                  ? `✗ ${bulkResult.error}`
                  : `✓ ${bulkResult.imported} importadas · ${bulkResult.failed} fallidas`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="flex items-center gap-2" style={{ color: "var(--muted)" }}>
          <span className="spinner" /> Cargando...
        </div>
      ) : assets.length === 0 ? (
        <div className="empty">No hay imágenes subidas todavía.</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}>
          {assets.map(asset => (
            <div key={asset.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ position: "relative", height: 100, background: "var(--bg)" }}>
                <img
                  src={asset.cdn_url || asset.url}
                  alt={asset.original_filename}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {asset.field_key && asset.field_key !== "general" && (
                  <div style={{
                    position: "absolute", top: 4, left: 4,
                    background: "rgba(0,0,0,0.65)", color: "#fff",
                    fontSize: 8, padding: "2px 5px", borderRadius: 3,
                  }}>
                    {asset.field_key}
                  </div>
                )}
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {asset.original_filename}
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 11 }}
                    onClick={() => copyUrl(asset.cdn_url || asset.url)} title="Copiar URL">
                    📋 URL
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (confirm("¿Eliminar esta imagen?")) deleteMut.mutate(asset.id);
                    }} title="Eliminar">
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
