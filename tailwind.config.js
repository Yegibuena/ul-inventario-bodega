/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bodega: {
          bg: '#FFFFFF',       // blanco limpio
          panel: '#F8FAFC',    // gris azulado muy claro para tarjetas
          line: '#E2E8F0',     // bordes suaves
          tag: '#2563EB',      // azul principal (botones, activos, links)
          tagDark: '#1D4ED8',  // azul hover
          ok: '#16A34A',       // verde "en bodega / devuelto"
          out: '#2563EB',      // azul "prestado / activo"
          lost: '#DC2626',     // rojo "perdido"
          paper: '#1E293B',    // texto principal
          muted: '#64748B',    // texto secundario
        },
      },
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        body: ['ui-sans-serif', 'system-ui', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
