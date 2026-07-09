import './PageA4.css';

/**
 * PageA4 — wrapper A4 para todas las plantillas.
 * 794 × 1123 px (96 dpi). overflow:hidden garantizado.
 *
 * @param {string}  bg          - color/image de fondo CSS (default: var(--paper))
 * @param {string}  className
 * @param {object}  style       - overrides inline
 */
export default function PageA4({ children, bg, className = '', style = {} }) {
  return (
    <div
      className={`dv-a4 ${className}`}
      style={{ background: bg ?? 'var(--paper)', ...style }}
    >
      {children}
    </div>
  );
}
