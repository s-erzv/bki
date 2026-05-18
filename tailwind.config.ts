import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // Brand blue — primary kept for backward compat; same scale.
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f2060',  // deep editorial navy — sidebar, hero overlays
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        text: {
          primary:   '#0f172a',
          secondary: '#475569',
          tertiary:  '#94a3b8',
          inverse:   '#ffffff',
        },
        accent: {
          green:  '#10b981',
          amber:  '#f59e0b',
          red:    '#ef4444',
          purple: '#8b5cf6',
          teal:   '#14b8a6',
          rose:   '#f43f5e',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
      },
      keyframes: {
        'fade-slide-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'cross-fade': {
          '0%, 100%': { opacity: '0' },
          '20%, 80%': { opacity: '1' },
        },
      },
      animation: {
        'fade-slide-in': 'fade-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-right': 'slide-out-right 200ms cubic-bezier(0.4, 0, 1, 1)',
        'fade-in': 'fade-in 180ms ease-out',
      },
      boxShadow: {
        'soft':   '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'lift':   '0 4px 14px -2px rgb(15 23 42 / 0.08), 0 2px 4px -1px rgb(15 23 42 / 0.04)',
        'float':  '0 12px 32px -8px rgb(15 23 42 / 0.16), 0 4px 8px -2px rgb(15 23 42 / 0.06)',
        'inset-line': 'inset 0 -1px 0 0 rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [forms],
}

export default config
