import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", background: "var(--navy)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: 12,
            padding: "40px 36px", maxWidth: 440, textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Algo ha fallado
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20, lineHeight: 1.6 }}>
              El editor ha encontrado un error inesperado.
              Recarga la página para continuar.
            </p>
            <pre style={{
              background: "var(--bg)", borderRadius: 6,
              padding: "10px 12px", fontSize: 11,
              color: "var(--error)", textAlign: "left",
              overflow: "auto", maxHeight: 120, marginBottom: 20,
            }}>
              {this.state.error.message}
            </pre>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
