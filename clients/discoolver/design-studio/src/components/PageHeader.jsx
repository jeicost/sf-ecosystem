import DiscoolverIsotipo from './DiscoolverIsotipo';
import './PageHeader.css';

/**
 * PageHeader — strip superior universal de todas las páginas de contenido.
 * Formato: "XX | ◉  NOMBRE SECCIÓN"
 *
 * @param {string|number} pageNum   - número de página (ej. "11", "32")
 * @param {string}        section   - nombre de la sección en mayúsculas
 * @param {string}        color     - color del isotipo y acento (default magenta)
 */
export default function PageHeader({ pageNum, section, color = 'var(--magenta)' }) {
  return (
    <div className="dv-page-header">
      <span className="dv-ph-num">{pageNum}</span>
      <span className="dv-ph-sep" style={{ color }}>|</span>
      <DiscoolverIsotipo size={16} color={color} />
      <span className="dv-ph-section">{String(section).toUpperCase()}</span>
    </div>
  );
}
