/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B0F19',
          800: '#111827',
          700: '#1A2235',
          600: '#243049',
        },
        accent: {
          green: '#22C55E',
          teal: '#14B8A6',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
