/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        carbon: {
          950: '#080808',
          900: '#0d0d0d',
          800: '#141414',
          700: '#1c1c1c',
          600: '#252525',
          500: '#2e2e2e',
          400: '#3a3a3a',
        },
      },
      keyframes: {
        fadeSlide: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse2: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.6' },
        },
      },
      animation: {
        fadeSlide: 'fadeSlide 0.28s ease-out',
        pulse2: 'pulse2 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
