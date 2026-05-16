/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {keyframes: {
      shrink: { from: { width: '100%' }, to: { width: '0%' }},
    }},
  },
  plugins: [],
}