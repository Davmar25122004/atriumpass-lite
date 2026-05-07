/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#412DB6',
          dark: '#2C2554',
          light: '#a5b4fc',
          lighter: '#e0e7ff',
        },
      },
    },
  },
  plugins: [],
}
