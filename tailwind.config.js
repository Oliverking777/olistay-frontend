/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue':    '#0F2B5B',
        'brand-emerald': '#1A9E6E',
        'brand-gold':    '#D4A017',
        'ink':           '#1A1A18',
        'ink-muted':     '#5A5A56',
        'ink-subtle':    '#9A9A94',
        'hairline':      '#E5E3DC',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        soft: '0 1px 4px rgba(0,0,0,0.08)',
        deep: '0 8px 32px rgba(0,0,0,0.14)',
      },
      borderColor: {
        DEFAULT: '#E5E3DC',
      },
    },
  },
  plugins: [],
}