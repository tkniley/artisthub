/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        art: {
          bg: '#FAF9F6', // Beautiful off-white
          darkBg: '#121212', // Premium deep dark theme bg
          dark: '#1A1A1A', // Charcoal text / UI elements
          card: '#F4F3EF', // Slightly warmer off-white card
          darkCard: '#1E1E1E', // Dark mode card
          muted: '#75726D', // Premium warm neutral grey
          darkMuted: '#A09D98', // Dark mode warm neutral grey
          accent: '#A88D65', // Muted brushed champagne gold
          border: '#E8E6E1', // Delicate warm grey border
          darkBorder: '#2E2D2B', // Dark mode border
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.15em',
        extra: '0.25em',
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(1.05)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
