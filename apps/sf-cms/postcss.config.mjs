/**
 * Without this file, Next/Turbopack never runs Tailwind's PostCSS plugin,
 * so the @tailwind directives in globals.css are dropped and NO utility
 * classes are generated — the entire admin UI rendered unstyled. Tailwind v3
 * needs the plugin wired here explicitly.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
