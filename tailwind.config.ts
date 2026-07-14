import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        raised: 'var(--bg-raised)',
        overlay: 'var(--bg-overlay)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          glow: 'var(--color-primary-glow)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          glow: 'var(--color-accent-glow)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        foreground: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-chewy)', 'Chewy', 'cursive'],
        hand: ['var(--font-patrick)', 'Patrick Hand', 'cursive'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        float: 'float 6s ease-in-out infinite',
        'scan-line': 'scan-line 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scan-line': {
          '0%, 100%': { top: '10%' },
          '50%': { top: '85%' },
        },
      },
      boxShadow: {
        glow: '0 8px 0 rgba(0,0,0,0.04), 0 12px 28px var(--color-primary-glow)',
        'glow-amber':
          '0 8px 0 rgba(0,0,0,0.04), 0 12px 28px var(--color-accent-glow)',
        'glow-red': '0 8px 0 rgba(0,0,0,0.04), 0 12px 28px rgba(239, 68, 68, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
