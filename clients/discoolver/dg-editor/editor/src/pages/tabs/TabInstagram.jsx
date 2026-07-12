/**
 * Tab Instagram — Conectar cuenta Instagram y convertir posts en fichas.
 *
 * Flujo:
 *  1. Comprueba si la guía tiene Instagram conectado (GET /status)
 *  2. Si no → botón "Conectar Instagram" → OAuth Meta (ventana nueva)
 *  3. Tras conectar → grid de todos los posts del influencer
 *  4. Influencer selecciona posts → elige sección y badge → Importar
 */
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  disconnectInstagram,
  getInstagramAuthUrl,
  getInstagramMedia,
  getInstagramStatus,
  importInstagramPosts,
} from "../../lib/api";
import { useToast } from "../../components/Toast";

// ── Constantes ────────────────────────────────────────────────────────────────

const SECTIONS = [
  { key: "influencers",      label: "Influencers"         },
  { key: "restaurantes",     label: "Restaurantes"        },
  { key: "fiesta",           label: "Fiesta"              },
  { key: "ocio_eventos",     label: "Ocio y Eventos"      },
  { key: "arte_exposiciones",label: "Arte y Exposiciones" },
  { key: "experiencias",     label: "Experiencias"        },
  { key: "alojamientos",     label: "Alojamientos"        },
  { key: "shopping",         label: "Shopping"            },
  { key: "top_saves",        label: "10 Saves"            },
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

// ── Post card (grid item) ─────────────────────────────────────────────────────

function PostCard({ post, selected, onToggle }) {
  const caption = (post.caption || "").split("\n")[0].slice(0, 80);
  const isVideo = post.media_type === "VIDEO" || post.media_type === "REEL";
  const thumb = isVideo ? post.thumbnail_url : post.media_url;

  return (
    <div
      onClick={() => onToggle(post.id)}
      style={{
        border: selected ? "2px solid var(--mag)" : "2px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        cursor: "pointer",
        background: "var(--surface)",
        transition: "border-color 0.15s",
        position: "relative",
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", paddingTop: "100%", background: "#111" }}>
        {thumb ? (
          <img
            src={thumb}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "var(--muted)", fontSize: 28,
          }}>📷</div>
        )}

        {/* Checkbox overlay */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          width: 22, height: 22, borderRadius: "50%",
          background: selected ? "var(--mag)" : "rgba(0,0,0,0.45)",
          border: `2px solid ${selected ? "var(--mag)" : "rgba(255,255,255,0.6)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 700,
          transition: "all 0.15s",
        }}>
          {selected ? "✓" : ""}
        </div>

        {/* Media type badge */}
        {isVideo && (
          <div style={{
            position: "absolute", bottom: 6, left: 6,
            background: "rgba(0,0,0,0.6)", borderRadius: 4,
            padding: "2px 6px", fontSize: 10, color: "#fff",
          }}>▶ {post.media_type}</div>
        )}
        {post.media_type === "CAROUSEL_ALBUM" && (
          <div style={{
            position: "absolute", bottom: 6, left: 6,
            background: "rgba(0,0,0,0.6)", borderRadius: 4,
            padding: "2px 6px", fontSize: 10, color: "#fff",
          }}>⊞ ÁLBUM</div>
        )}
      </div>

      {/* Caption */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{
          fontSize: 11, color: "var(--muted)", lineHeight: 1.4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {caption || <span style={{ fontStyle: "italic" }}>Sin descripción</span>}
        </div>
      </div>
    </div>
  );
}

// ── Panel de importación ──────────────────────────────────────────────────────

function ImportPanel({ count, section, badge, onSectionChange, onBadgeChange, onImport, isPending }) {
  if (count === 0) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      marginBottom: 20,
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, minWidth: 120 }}>
        {count} post{count > 1 ? "s" : ""} seleccionado{count > 1 ? "s" : ""}
      </div>

      <div>
        <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>SECCIÓN</label>
        <select
          value={section}
          onChange={e => onSectionChange(e.target.value)}
          style={{ fontSize: 13, padding: "4px 8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6 }}
        >
          {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 3 }}>BADGE</label>
        <select
          value={badge}
          onChange={e => onBadgeChange(e.target.value)}
          style={{ fontSize: 13, padding: "4px 8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6 }}
        >
          {BADGES.map(b => (
            <option key={b} value={b} style={b ? { color: BADGE_COLORS[b] || "inherit" } : {}}>
              {b || "Sin badge"}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onImport}
        disabled={isPending}
        className="btn btn-primary"
        style={{ marginLeft: "auto" }}
      >
        {isPending ? "Importando..." : `Importar ${count} post${count > 1 ? "s" : ""} a la guía`}
      </button>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function TabInstagram({ guide }) {
  const toast        = useToast();
  const qc           = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selected, setSelected]   = useState(new Set());  // post IDs
  const [section, setSection]     = useState("influencers");
  const [badge, setBadge]         = useState("");
  const [cursor, setCursor]       = useState(null);       // pagination
  const [allPosts, setAllPosts]   = useState([]);         // accumulated posts
  const [connecting, setConnecting] = useState(false);
  const popupRef = useRef(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const statusQuery = useQuery({
    queryKey: ["instagram-status", guide.id],
    queryFn:  () => getInstagramStatus(guide.id),
  });

  const mediaQuery = useQuery({
    queryKey: ["instagram-media", guide.id, cursor],
    queryFn:  () => getInstagramMedia(guide.id, cursor),
    enabled:  statusQuery.data?.connected === true,
    staleTime: 60_000,
  });

  // Acumular posts al paginar
  useEffect(() => {
    if (mediaQuery.data?.posts) {
      if (!cursor) {
        setAllPosts(mediaQuery.data.posts);
      } else {
        setAllPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = mediaQuery.data.posts.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }
    }
  }, [mediaQuery.data]);

  // Detectar callback OAuth (?connected=1)
  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      setSearchParams({});
      setConnecting(false);
      setAllPosts([]);
      setCursor(null);
      qc.invalidateQueries(["instagram-status", guide.id]);
      qc.invalidateQueries(["instagram-media", guide.id]);
      toast.success("Instagram conectado correctamente");
    }
    if (searchParams.get("error")) {
      setSearchParams({});
      setConnecting(false);
      toast.error(`Error conectando Instagram: ${searchParams.get("error")}`);
    }
  }, [searchParams]);

  // Vigilar la ventana OAuth (detecta cuando se cierra)
  useEffect(() => {
    if (!connecting) return;
    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        setConnecting(false);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [connecting]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const disconnectMut = useMutation({
    mutationFn: () => disconnectInstagram(guide.id),
    onSuccess: () => {
      toast.success("Instagram desconectado");
      setAllPosts([]);
      setCursor(null);
      setSelected(new Set());
      qc.invalidateQueries(["instagram-status", guide.id]);
      qc.invalidateQueries(["instagram-media", guide.id]);
    },
    onError: () => toast.error("Error desconectando Instagram"),
  });

  const importMut = useMutation({
    mutationFn: () => {
      const selectedPosts = allPosts
        .filter(p => selected.has(p.id))
        .map((p, i) => ({
          post_id:       p.id,
          media_url:     p.media_url     || null,
          thumbnail_url: p.thumbnail_url || null,
          caption:       p.caption       || "",
          media_type:    p.media_type    || "IMAGE",
          permalink:     p.permalink     || null,
          timestamp:     p.timestamp     || null,
          section,
          badge: badge || null,
          sort_order: i,
        }));
      return importInstagramPosts(guide.id, { posts: selectedPosts });
    },
    onSuccess: (data) => {
      toast.success(`${data.length} ficha${data.length > 1 ? "s" : ""} creada${data.length > 1 ? "s" : ""} en la guía`);
      setSelected(new Set());
      qc.invalidateQueries(["items", guide.id]);
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Error importando posts"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    try {
      const { auth_url } = await getInstagramAuthUrl(guide.id);
      setConnecting(true);
      popupRef.current = window.open(auth_url, "_blank", "width=600,height=700,noopener");
    } catch (err) {
      if (err.response?.status === 503) {
        toast.error("Instagram no configurado. Añade INSTAGRAM_APP_ID al .env");
      } else {
        toast.error("Error iniciando conexión con Instagram");
      }
    }
  };

  const togglePost = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLoadMore = () => {
    if (mediaQuery.data?.next_cursor) {
      setCursor(mediaQuery.data.next_cursor);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (statusQuery.isLoading) {
    return (
      <div style={{ padding: 32, color: "var(--muted)", fontSize: 14 }}>
        Comprobando conexión con Instagram…
      </div>
    );
  }

  const connected  = statusQuery.data?.connected;
  const username   = statusQuery.data?.username;
  const expiresAt  = statusQuery.data?.expires_at;
  const nextCursor = mediaQuery.data?.next_cursor;

  // ── Estado: NO conectado ───────────────────────────────────────────────────
  if (!connected) {
    return (
      <div style={{ padding: "32px", maxWidth: 600 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>
          📸 Instagram
        </h2>
        <p style={{ margin: "0 0 32px", fontSize: 13, color: "var(--muted)" }}>
          Conecta tu cuenta de Instagram para ver todos tus posts y convertirlos en fichas de la guía.
        </p>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "40px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📸</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
            Conecta tu Instagram
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>
            Podrás ver todos tus posts y elegir cuáles transformar en fichas para tu guía de viaje.
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="btn btn-primary"
            style={{ fontSize: 15, padding: "10px 28px" }}
          >
            {connecting ? "Abriendo ventana de login…" : "🔗 Conectar Instagram"}
          </button>

          {connecting && (
            <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
              Completa el login en la ventana que se ha abierto…
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: 12, color: "var(--muted)" }}>
            Requiere cuenta Business o Creator · Solo esta guía accede a tus posts
          </div>
        </div>
      </div>
    );
  }

  // ── Estado: CONECTADO ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px", maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            📸 @{username}
          </h2>
          {expiresAt && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
              Token válido hasta {new Date(expiresAt).toLocaleDateString("es-ES")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="btn btn-secondary btn-sm"
            >
              Deseleccionar todo
            </button>
          )}
          <button
            onClick={() => { if (window.confirm(`¿Desconectar @${username} de esta guía?`)) disconnectMut.mutate(); }}
            disabled={disconnectMut.isPending}
            className="btn btn-secondary btn-sm"
            style={{ color: "var(--muted)" }}
          >
            {disconnectMut.isPending ? "Desconectando…" : "Desconectar"}
          </button>
        </div>
      </div>

      {/* Panel de importación */}
      <ImportPanel
        count={selected.size}
        section={section}
        badge={badge}
        onSectionChange={setSection}
        onBadgeChange={setBadge}
        onImport={() => importMut.mutate()}
        isPending={importMut.isPending}
      />

      {/* Grid de posts */}
      {mediaQuery.isLoading && allPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          Cargando posts de @{username}…
        </div>
      ) : mediaQuery.isError ? (
        <div style={{
          textAlign: "center", padding: "40px 20px", color: "var(--muted)",
          border: "1px dashed var(--border)", borderRadius: 10,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Error cargando posts</div>
          <div style={{ fontSize: 13 }}>
            {mediaQuery.error?.response?.data?.detail || "Comprueba que el token de Instagram sigue siendo válido"}
          </div>
          <button
            onClick={() => qc.invalidateQueries(["instagram-media", guide.id])}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 16 }}
          >
            Reintentar
          </button>
        </div>
      ) : allPosts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px", color: "var(--muted)",
          border: "1px dashed var(--border)", borderRadius: 10,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600 }}>No se encontraron posts</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            La cuenta @{username} no tiene posts públicos accesibles.
          </div>
        </div>
      ) : (
        <>
          {/* Contador + seleccionar todo */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {allPosts.length} post{allPosts.length > 1 ? "s" : ""} cargado{allPosts.length > 1 ? "s" : ""}
              {selected.size > 0 && (
                <span style={{ marginLeft: 12, color: "var(--mag)", fontWeight: 600 }}>
                  · {selected.size} seleccionado{selected.size > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                if (selected.size === allPosts.length) {
                  setSelected(new Set());
                } else {
                  setSelected(new Set(allPosts.map(p => p.id)));
                }
              }}
              className="btn btn-secondary btn-sm"
            >
              {selected.size === allPosts.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </button>
          </div>

          {/* Grid 4 columnas */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
          }}>
            {allPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                selected={selected.has(post.id)}
                onToggle={togglePost}
              />
            ))}
          </div>

          {/* Load more */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            {nextCursor ? (
              <button
                onClick={handleLoadMore}
                disabled={mediaQuery.isFetching}
                className="btn btn-secondary"
              >
                {mediaQuery.isFetching ? "Cargando…" : "Cargar más posts"}
              </button>
            ) : (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {allPosts.length > 0 && "Ya has cargado todos los posts"}
              </div>
            )}
          </div>

          {/* Bottom import bar (sticky para scroll largo) */}
          {selected.size > 0 && (
            <div style={{
              position: "sticky", bottom: 16, marginTop: 24,
              background: "var(--surface)", border: "1px solid var(--mag)",
              borderRadius: 10, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {selected.size} post{selected.size > 1 ? "s" : ""} seleccionado{selected.size > 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 2 }}>SECCIÓN</label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    style={{ fontSize: 13, padding: "4px 8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6 }}
                  >
                    {SECTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 2 }}>BADGE</label>
                  <select
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    style={{ fontSize: 13, padding: "4px 8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6 }}
                  >
                    {BADGES.map(b => <option key={b} value={b}>{b || "Sin badge"}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => importMut.mutate()}
                  disabled={importMut.isPending}
                  className="btn btn-primary"
                >
                  {importMut.isPending ? "Importando…" : `Importar ${selected.size} a la guía`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
