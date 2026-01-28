/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        urgent: '#EF4444',
        important: '#F59E0B',
      }
    }
  },
  plugins: [],
}

