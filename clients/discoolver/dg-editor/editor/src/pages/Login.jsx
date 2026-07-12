import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, cmsLogin } from "../lib/auth";
import { useApp } from "../contexts/AppContext";

const SvgD = () => (
  <svg width="28" height="26" viewBox="0 0 110 100" fill="none">
    <path d="M59 0 A59 50 0 0 0 59 100 Z" fill="#FF00C8"/>
    <polygon points="72,13 110,50 72,87" fill="#FF00C8"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { t, theme, toggleTheme, lang, setLang } = useApp();
  const isDark = theme === "dark";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [cmsChecking, setCmsChecking] = useState(
    () => new URLSearchParams(window.location.search).has("cms_token")
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cmsToken = params.get("cms_token");
    if (!cmsToken) return;
    setLoading(true); setError("");
    window.history.replaceState({}, "", window.location.pathname);
    cmsLogin(cmsToken)
      .then(() => navigate("/", { replace: true }))
      .catch(err => {
        setError(err.response?.data?.detail || t("login_error_default"));
        setLoading(false); setCmsChecking(false);
      });
  }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || t("login_error_default"));
    } finally { setLoading(false); }
  };

  if (cmsChecking) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16, color: "var(--muted)",
    }}>
      <span className="spinner" style={{ width: 24, height: 24 }} />
      <span style={{ fontSize: 13 }}>Accediendo desde CMS Discoolver…</span>
    </div>
  );

  const leftBg  = isDark ? "#fff"    : "#fff";
  const leftText = isDark ? "#111120" : "#111120";
  const inputBorder = isDark ? "#E0E0E8" : "#E0E0E8";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Panel izquierdo: formulario ── */}
      <div style={{
        width: "min(460px, 42%)", flexShrink: 0,
        background: leftBg, color: leftText,
        display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "48px",
        position: "relative",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
          <SvgD />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: leftText, letterSpacing: -0.3 }}>Discoolver</div>
            <div style={{ fontSize: 11, color: "#70708A" }}>Editor de Guías</div>
          </div>
        </div>

        {/* Lang + theme toggles top-right */}
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 6 }}>
          <button onClick={toggleTheme}
            style={{ background: "transparent", border: "1px solid #E0E0E8", borderRadius: 6, padding: "4px 8px", fontSize: 14, cursor: "pointer" }}>
            {isDark ? "☀️" : "🌙"}
          </button>
          {["es", "en"].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "4px 8px", cursor: "pointer",
                background: lang === l ? "#FF00C8" : "transparent",
                color: lang === l ? "#fff" : "#70708A",
                border: lang === l ? "1px solid #FF00C8" : "1px solid #E0E0E8",
              }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: leftText, letterSpacing: -0.5, marginBottom: 6 }}>
            {t("login_title")}
          </h1>
          <p style={{ fontSize: 13, color: "#70708A" }}>{t("login_sub")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#70708A", marginBottom: 6 }}>
              {t("login_email")}
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="editor@discoolver.com" required autoFocus
              style={{ background: "#fff", border: `1px solid ${inputBorder}`, borderRadius: 6, color: leftText, fontSize: 14, padding: "10px 12px", width: "100%", outline: "none" }}
              onFocus={e => { e.target.style.borderColor = "#FF00C8"; e.target.style.boxShadow = "0 0 0 3px rgba(255,0,200,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#70708A", marginBottom: 6 }}>
              {t("login_password")}
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{ background: "#fff", border: `1px solid ${inputBorder}`, borderRadius: 6, color: leftText, fontSize: 14, padding: "10px 12px", width: "100%", outline: "none" }}
              onFocus={e => { e.target.style.borderColor = "#FF00C8"; e.target.style.boxShadow = "0 0 0 3px rgba(255,0,200,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {error && (
            <div style={{ padding: "10px 12px", borderRadius: 6, background: "#FEE2E2", color: "#991B1B", fontSize: 13, fontWeight: 500, border: "1px solid #FCA5A5" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 20px", marginTop: 4,
              background: "#FF00C8", color: "#fff",
              border: "none", borderRadius: 6,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 0 20px rgba(255,0,200,0.3)",
              opacity: loading ? 0.7 : 1, transition: "all 0.15s",
            }}>
            {loading
              ? <><span className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Accediendo...</>
              : t("login_btn")}
          </button>
        </form>

        <p style={{ marginTop: 32, fontSize: 12, color: "#9090A8", textAlign: "center" }}>
          {t("login_restricted")}
        </p>
      </div>

      {/* ── Panel derecho: dark con patrón ── */}
      <div style={{
        flex: 1,
        background: "linear-gradient(145deg, #0D0D18 0%, #111128 50%, #18182A 100%)",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,0,200,0.12) 0%, transparent 65%)", top: "20%", right: "10%" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)", bottom: "20%", left: "15%" }} />
        <div style={{ position: "relative", textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
            Guías<br/>
            <span style={{ background: "linear-gradient(120deg, #FF00C8, #00D4FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Discoolver
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, maxWidth: 280, margin: "0 auto" }}>
            Editor interno de guías PDF para destinos turísticos
          </p>
        </div>
      </div>

    </div>
  );
}
