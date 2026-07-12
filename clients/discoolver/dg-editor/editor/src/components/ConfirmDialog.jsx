import { createContext, useContext, useState, useCallback } from "react";

const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise(resolve => {
      setState({
        message,
        confirmLabel: options.confirmLabel || "Confirmar",
        cancelLabel:  options.cancelLabel  || "Cancelar",
        danger:       options.danger       ?? false,
        resolve,
      });
    });
  }, []);

  const handle = (result) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10000,
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: 10,
            padding: "24px 28px", maxWidth: 380, width: "calc(100vw - 40px)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20, color: "var(--text)" }}>
              {state.message}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handle(false)}>
                {state.cancelLabel}
              </button>
              <button
                className={`btn btn-sm ${state.danger ? "btn-danger" : "btn-primary"}`}
                onClick={() => handle(true)}
                autoFocus
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
