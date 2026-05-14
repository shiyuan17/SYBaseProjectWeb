import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          strong: 'var(--color-brand-strong)',
          muted: 'var(--color-brand-muted)'
        },
        surface: {
          base: 'var(--color-surface-base)',
          muted: 'var(--color-surface-muted)',
          border: 'var(--color-surface-border)'
        },
        state: {
          success: 'var(--color-state-success)',
          warning: 'var(--color-state-warning)',
          danger: 'var(--color-state-danger)'
        }
      },
      boxShadow: {
        panel: '0 18px 48px rgba(15, 23, 42, 0.08)'
      },
      borderRadius: {
        panel: '1rem'
      }
    }
  },
  plugins: []
} satisfies Config

