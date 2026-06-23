const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#042EF2',
        btnHover: '#0325C2',
        headerText: '#081021',
        paragraphText: '#515B73',
        // Brand scale derived from the existing navy (#2E3A8C === brand-600),
        // so every screen can move off one-off hex literals onto a shared scale.
        brand: {
          50: '#F1F3FB',
          100: '#E1E5F6',
          200: '#C3CBED',
          300: '#9FACDF',
          400: '#6F80C7',
          500: '#46569E',
          600: '#2E3A8C',
          700: '#252F70',
          800: '#1C2456',
          900: '#141A3D',
        },
        ink: '#49608c',
        success: colors.emerald,
        warning: colors.amber,
        danger: colors.red,
        info: colors.sky,
      },
      fontFamily: {
        sans: ['Nunito Sans', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(20, 26, 61, 0.04)',
        card: '0 2px 8px -2px rgba(20, 26, 61, 0.08), 0 1px 2px -1px rgba(20, 26, 61, 0.06)',
        elevated: '0 12px 24px -8px rgba(20, 26, 61, 0.16), 0 4px 8px -4px rgba(20, 26, 61, 0.08)',
        focus: '0 0 0 3px rgba(46, 58, 140, 0.25)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out both',
        'slide-up': 'slideUp 0.3s ease-out both',
        'scale-in': 'scaleIn 0.2s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
