import './PageFooter.css';

/**
 * PageFooter — línea inferior con URL de referencia.
 * Aparece en páginas de contenido (no en portadas ni full-bleed).
 */
export default function PageFooter({ url = 'discoolver.com' }) {
  return (
    <div className="dv-page-footer">
      <span className="dv-pf-rule" />
      <span className="dv-pf-url">{url}</span>
    </div>
  );
}
