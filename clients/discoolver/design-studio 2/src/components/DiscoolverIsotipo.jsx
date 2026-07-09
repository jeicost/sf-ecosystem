/**
 * DiscoolverIsotipo
 * ⚠️  Ratio FIJO 1.10:1 (width:height). NO cambiar.
 * ⚠️  En uso inline: height = font-size del texto adyacente (NO cap-height).
 *
 * @param {number}  size    - height en px (width se calcula automáticamente)
 * @param {string}  color   - color fill (default: var(--magenta))
 * @param {string}  className
 */
export default function DiscoolverIsotipo({ size = 20, color = 'var(--magenta)', className = '', style = {} }) {
  const height = size;
  const width  = Math.round(size * 1.10); // ratio fijo 1.10:1

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 110 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d="M59 0 A59 50 0 0 0 59 100 Z" fill={color} />
      <polygon points="72,13 110,50 72,87"  fill={color} />
    </svg>
  );
}
