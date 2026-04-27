/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Whysice Tanzanite Palette
        tanzanite: {
          50: '#EDE8F8',
          100: '#D8CFF2',
          200: '#C4B8E8',
          300: '#A89BD8',
          400: '#8B7FD4',
          500: '#6A5ACD',
          600: '#5548A8',
          700: '#3F3583',
          800: '#2D1B69',
          900: '#1A0F45',
        },
        ice: {
          50: '#E4F5F8',
          100: '#C8EBF2',
          200: '#A8DDE6',
          300: '#7DCBD8',
          400: '#4DB8C9',
          500: '#1B9AAD',
          600: '#147A8A',
          700: '#0E5E6F',
          800: '#0A3D5C',
          900: '#062536',
        },
        // Utility
        body: '#1A1A2E',
        // WCAG 1.4.3 AA: tightened from #6C7A89 (4.6:1, just barely passing)
        // to #5A6878 (5.7:1) — matches the :root --slate variable in
        // globals.css and gives a safer headroom on white. Any place using
        // text-slate/70 now lands at ~4.0:1 for large text only; for normal
        // text, prefer text-body/70 (~4.6:1).
        slate: '#5A6878',
        gold: '#D4A843',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
