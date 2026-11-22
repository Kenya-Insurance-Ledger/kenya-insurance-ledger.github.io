/** @type {import('tailwindcss').Config} */
export default { content: ['./index.html','./src/**/*.{ts,tsx}'], darkMode: 'media',
  theme: { extend: { colors: { navy: { 900:'#0b1f3f', 800:'#132c55', 700:'#1c3a6b' } }, fontFamily: { sans:['Inter','system-ui','sans-serif'], display:['"Inter Tight"','Inter','system-ui','sans-serif'] } } }, plugins: [] };
