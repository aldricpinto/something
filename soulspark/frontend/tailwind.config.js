/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        skyglass: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bfe0ff',
          300: '#99cdff',
          400: '#66b3ff',
          500: '#3399ff',
          600: '#1a7fe6',
          700: '#1465b3',
          800: '#0f4c80',
          900: '#0a3354'
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
}
