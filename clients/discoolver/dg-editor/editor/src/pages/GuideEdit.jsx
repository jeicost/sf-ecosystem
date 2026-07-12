import { useState } from "react";
import { useParams, Link, Routes, Route, NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGuide } from "../lib/api";
import { useApp } from "../contexts/AppContext";

// Tab pages
import TabMetadata   from "./tabs/TabMetadata";
import TabSections   from "./tabs/TabSections";
import TabItems      from "./tabs/TabItems";
import TabMedia      from "./tabs/TabMedia";
import TabAI         from "./tabs/TabAI";
import TabExport     from "./tabs/TabExport";
import TabPreview    from "./tabs/TabPreview";
import TabCMS        from "./tabs/TabCMS";
import TabInstagram  from "./tabs/TabInstagram";

const TAB_KEYS = [
  { to: "",          key: "tab_cover",     end: true },
  { to: "sections",  key: "tab_sections" },
  { to: "items",     key: "tab_items"    },
  { to: "media",     key: "tab_media"    },
  { to: "preview",   key: "tab_preview"  },
  { to: "cms",       key: "tab_cms"      },
  { to: "instagram", key: "tab_instagram"},
  { to: "ai",        key: "tab_ai"       },
  { to: "export",    key: "tab_export"   },
];

const STATUS_COLOR = {
  draft: "#F59E0B", review: "#3B82F6",
  published: "#10B981", archived: "#6B7280",
};

export default function GuideEdit() {
  const { id } = useParams();
  const { t } = useApp();
  const { data: guide, isLoading, error } = useQuery({
    queryKey: ["guide", id],
    queryFn: () => getGuide(id),
  });

  if (isLoading) return (
    <div className="flex items-center gap-2" style={{ padding: 40, color: "var(--muted)" }}>
      <span className="spinner" /> Cargando guía...
    </div>
  );
  if (error) return (
    <div style={{ padding: 40, color: "var(--error)" }}>
      Error: {error.message} · <Link to="/">Volver al dashboard</Link>
    </div>
  );
  if (!guide) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Guide header ── */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          {/* Breadcrumb */}
          <div className="breadcrumb" style={{ marginBottom: 6 }}>
            <Link to="/">{t("edit_breadcrumb_home")}</Link>
            <span className="sep">›</span>
            <Link to="/">{t("edit_breadcrumb_guides")}</Link>
            <span className="sep">›</span>
            <span className="current">{guide.city} 20{guide.year}</span>
          </div>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, color: "var(--text)" }}>
              {guide.city} 20{guide.year}
            </h1>
            <span className={`badge badge-${guide.status}`}>{guide.status}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
            {guide.edition || `Edición ${guide.city} 20${guide.year}`}
            {" · "}
            <span style={{
              display: "inline-block", width: 8, height: 8, borderRadius: "50%",
              background: guide.accent_color || "var(--mag)",
              verticalAlign: "middle", marginRight: 4,
            }} />
            {guide.collection}
          </div>
        </div>

        {import.meta.env.DEV && (
          <a
            href={`/api/v2/guides/${id}/export/config`}
            target="_blank" rel="noreferrer"
            className="btn btn-secondary btn-sm"
          >
            {t("edit_config")}
          </a>
        )}
      </div>

      {/* ── Tabs nav — estilo CMS ── */}
      <div className="tab-bar">
        {TAB_KEYS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.end ? `/guides/${id}` : `/guides/${id}/${tab.to}`}
            end={tab.end}
            className={({ isActive }) => `tab-item${isActive ? " active" : ""}`}
          >
            {t(tab.key)}
          </NavLink>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <Routes>
          <Route index element={<TabMetadata guide={guide} />} />
          <Route path="sections" element={<TabSections guide={guide} />} />
          <Route path="items" element={<TabItems guide={guide} />} />
          <Route path="media" element={<TabMedia guide={guide} />} />
          <Route path="preview" element={<TabPreview guide={guide} />} />
          <Route path="cms" element={<TabCMS guide={guide} />} />
          <Route path="instagram" element={<TabInstagram guide={guide} />} />
          <Route path="ai" element={<TabAI guide={guide} />} />
          <Route path="export" element={<TabExport guide={guide} />} />
        </Routes>
      </div>
    </div>
  );
}
