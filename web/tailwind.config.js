/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          canvas: '#f1f3f5',
          sheet: '#ffffff',
          ink: '#1f2328',
          muted: '#656d76',
          border: '#d0d7de',
          subtle: '#f6f8fa',
        },
        sepia: {
          canvas: '#e8e2d5',
          sheet: '#fbf7ee',
          ink: '#382f25',
          muted: '#766755',
          border: '#d8cdbe',
          subtle: '#f3ece0',
        },
        slate: {
          canvas: '#1a1f2c',
          sheet: '#222938',
          ink: '#e2e8f0',
          muted: '#94a3b8',
          border: '#334155',
          subtle: '#2d3748',
        },
        dark: {
          canvas: '#0d1117',
          sheet: '#161b22',
          ink: '#e6edf3',
          muted: '#8b949e',
          border: '#30363d',
          subtle: '#21262d',
        },
      },
      boxShadow: {
        'pdf-sheet': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.05)',
        'pdf-sheet-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.25)',
        'pdf-bar': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Merriweather"', '"Charter"', '"Georgia"', '"Cambria"', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
      },
    },
  },
  plugins: [],
};
