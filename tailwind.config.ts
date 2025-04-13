import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tiffany: {
          50: '#f0fafa',
          100: '#e0f5f5',
          200: '#b8e8e8',
          300: '#81d8d8',
          400: '#4cc3c3',
          500: '#0abab5',
          600: '#089c98',
          700: '#067d7a',
          800: '#055e5c',
          900: '#044f4d',
        },
        accent: {
          50: '#fff7f0',
          100: '#ffefdf',
          200: '#ffd9b8',
          300: '#ffbd81',
          400: '#ff9c4c',
          500: '#ff6f61',
          600: '#ff5f00',
          700: '#cc4c00',
          800: '#993900',
          900: '#662600',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-playfair-display)'],
      },
    },
  },
  plugins: [],
}

export default config 