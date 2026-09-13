/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#070a12',
          900: '#0b1120',
          850: '#0f172a',
        },
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
};
