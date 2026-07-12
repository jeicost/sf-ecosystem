import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { logout, getUser } from "../lib/auth";
import { useApp } from "../contexts/AppContext";

const NAV_KEYS = [
  { to: "/",           key: "nav_guides", end: true },
  { to: "/guides/new", key: "nav_new" },
];

const SvgD = () => (
  <svg width="22" height="20" viewBox="0 0 110 100" fill="none">
    <path d="M59 0 A59 50 0 0 0 59 100 Z" fill="#FF00C8"/>
    <polygon points="72,13 110,50 72,87" fill="#FF00C8"/>
  </svg>
);

export default function Layout() {
  const navigate = useNavigate();
  const user = getUser();
  const { theme, toggleTheme, lang, setLang, t } = useApp();
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };
  const isDark = theme === "dark";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}>

        {/* Logo */}
        <Link to="/" style={{
          padding: "18px 20px 16px",
          display: "flex", alignItems: "center", gap: 10,
          textDecoration: "none",
          borderBottom: "1px solid var(--border)",
        }}>
          <SvgD />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", letterSpacing: -0.2, lineHeight: 1.2 }}>
            Guías<br/>
            <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>Discoolver</span>
          </span>
        </Link>

        {/* Nav section label */}
        <div style={{ padding: "16px 20px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
          Editor
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "4px 10px" }}>
          {NAV_KEYS.map(({ to, key, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: "flex", alignItems: "center",
              padding: "9px 12px", borderRadius: 6,
              marginBottom: 2, textDecoration: "none",
              color: isActive ? "var(--text)" : "var(--muted2)",
              background: isActive ? "var(--mag-dim)" : "transparent",
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? "2px solid var(--mag)" : "2px solid transparent",
              transition: "all 0.15s",
            })}>
              {t(key)}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          {/* Theme + Lang toggles */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
            <button onClick={toggleTheme} title={t(isDark ? "theme_light" : "theme_dark")}
              style={{
                flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)",
                borderRadius: 5, color: "var(--text)", fontSize: 13, padding: "5px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            {["es", "en"].map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{
                  flex: 1, borderRadius: 5, fontSize: 11, fontWeight: 700, padding: "5px",
                  cursor: "pointer", transition: "all 0.15s",
                  background: lang === l ? "var(--mag)" : "var(--surface2)",
                  color: lang === l ? "#fff" : "var(--muted)",
                  border: lang === l ? "1px solid var(--mag)" : "1px solid var(--border2)",
                }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--mag-dim)", border: "1px solid var(--mag-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "var(--mag)", flexShrink: 0,
            }}>
              {(user?.name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || user?.email}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.role || "editor"}
              </div>
            </div>
          </div>

          <button onClick={handleLogout}
            style={{
              width: "100%", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 5,
              color: "var(--muted)", fontSize: 12, padding: "6px 10px",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>
            {t("nav_logout")}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "auto", minHeight: "100vh" }}>
        <Outlet />
      </main>
    </div>
  );
}
