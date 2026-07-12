import { createContext, useContext, useState, useCallback, useEffect } from "react";

const ToastCtx = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "info", duration = 3500) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const remove = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, d) => add(msg, "success", d),
    error:   (msg, d) => add(msg, "error", d ?? 5000),
    info:    (msg, d) => add(msg, "info",  d),
    warn:    (msg, d) => add(msg, "warn",  d),
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <ToastStack toasts={toasts} onDismiss={remove} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const TYPE_STYLE = {
  success: { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7" },
  error:   { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  warn:    { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  info:    { bg: "#EFF6FF", color: "#1E40AF", border: "#93C5FD" },
};

const TYPE_ICON = { success: "✓", error: "✗", warn: "⚠", info: "ℹ" };

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999, pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const s = TYPE_STYLE[t.type] || TYPE_STYLE.info;
        return (
          <div key={t.id} style={{
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            borderRadius: 8, padding: "10px 14px",
            fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxWidth: 360, pointerEvents: "all",
            animation: "slideIn 0.18s ease",
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{TYPE_ICON[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: s.color, opacity: 0.5, fontSize: 16, lineHeight: 1,
                padding: 0, marginLeft: 4,
              }}
            >×</button>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}
