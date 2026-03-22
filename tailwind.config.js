/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,js,ts,jsx,tsx}'],
  // Theme toggling is handled via CSS custom properties + .light class on <html>
  // so we don't use Tailwind's built-in dark mode here
  theme: {
    extend: {
      colors: {
        // All SO- colors reference CSS custom properties so they switch with theme
        'so-bg':           'var(--so-bg)',
        'so-surface':      'var(--so-surface)',
        'so-elevated':     'var(--so-elevated)',
        'so-active':       'var(--so-active)',
        'so-border':       'var(--so-border)',
        'so-border-dim':   'var(--so-border-dim)',

        'so-accent':       'var(--so-accent)',
        'so-accent-hi':    'var(--so-accent-hi)',
        'so-accent-dim':   'var(--so-accent-dim)',

        'so-text':         'var(--so-text)',
        'so-text-2':       'var(--so-text-2)',
        'so-text-3':       'var(--so-text-3)',

        // Screenplay semantic colors
        'so-scene':        'var(--so-scene)',
        'so-action':       'var(--so-action)',
        'so-character':    'var(--so-character)',
        'so-dialogue':     'var(--so-dialogue)',
        'so-paren':        'var(--so-paren)',
        'so-transition':   'var(--so-transition)',
        'so-note':         'var(--so-note)',

        // Status colors
        'so-success':      'var(--so-success)',
        'so-warning':      'var(--so-warning)',
        'so-error':        'var(--so-error)',
      },
      fontFamily: {
        ui: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        screenplay: ['var(--font-screenplay)', '"Courier Prime"', '"Courier New"', 'Courier', 'monospace'],
        mono: ['var(--font-mono)', '"Cascadia Code"', '"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'xxs': ['0.65rem', { lineHeight: '1rem' }],
      },
      transitionDuration: {
        '150': '150ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
