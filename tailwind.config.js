/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'legal-primary': '#1e3a8a',
        'legal-secondary': '#0f172a',
        'legal-accent': '#10b981',
        'legal-bg': '#f8fafc',
      },
    },
  },
  plugins: [],
}
