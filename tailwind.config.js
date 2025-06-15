/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        halo: '0 0 15px rgba(129, 140, 248, 0.5)', // A subtle indigo glow
      }
    },
  },
  plugins: [],
}

