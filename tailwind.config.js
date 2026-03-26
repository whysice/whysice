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
        slate: '#6C7A89',
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
