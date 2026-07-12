import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="empty" style={{ padding: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
      <p>Página no encontrada.</p>
      <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: 16, display: "inline-flex" }}>
        Volver al dashboard
      </Link>
    </div>
  );
}
