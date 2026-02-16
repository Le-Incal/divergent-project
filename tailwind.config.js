/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jet-black': '#092534',
        'deep-space': '#0C3146',
        'yale-blue': '#145277',
        'cerulean': '#30728C',
        'pacific-cyan': '#4C91A1',
        'tropical-teal': '#68B1B6',
        'pearl-aqua': '#83D0CB',
        'icy-aqua': '#B2E2DF',
        'azure-mist': '#E0F4F2',
        'soft-white': '#F5FAFA',
      },
      fontFamily: {
        'display': ['Syne', 'sans-serif'],
        'body': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
