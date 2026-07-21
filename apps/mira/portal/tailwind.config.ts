import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Alias semánticos de los tokens de globals.css — theme-aware vía data-theme.
        // Nota: no admiten modificador de opacidad (text-ink/60); usar ink-secondary etc.
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
        },
        line: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-surface-hover)',
          border: 'var(--border)',
          hover: 'var(--bg-surface-hover)',
        },
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
