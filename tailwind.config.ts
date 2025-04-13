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
        orange: {
          50: '#fff7f0',
          100: '#ffefdf',
          200: '#ffd9b8',
          300: '#ffbd81',
          400: '#ff9c4c',
          500: '#ff6b35',
          600: '#e65a2f',
          700: '#cc4a1b',
          800: '#993900',
          900: '#662600',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
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