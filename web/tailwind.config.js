/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        safe: {
          bg:     'var(--color-safe-bg)',
          border: 'var(--color-safe-border)',
          text:   'var(--color-safe-text)',
          accent: 'var(--color-safe-accent)',
        },
        danger: {
          bg:     'var(--color-danger-bg)',
          border: 'var(--color-danger-border)',
          text:   'var(--color-danger-text)',
          accent: 'var(--color-danger-accent)',
        },
        warning: {
          bg:     'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
          text:   'var(--color-warning-text)',
          accent: 'var(--color-warning-accent)',
        },
        ink: {
          900: 'var(--color-ink-900)',
          700: 'var(--color-ink-700)',
          500: 'var(--color-ink-500)',
          300: 'var(--color-ink-300)',
          100: 'var(--color-ink-100)',
        },
        brand: {
          DEFAULT: 'var(--color-brand)',
          light:   'var(--color-brand-light)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};