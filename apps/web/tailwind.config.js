/**** Tailwind config scoped for apps/web; extends root config ****/
const path = require('path')
const rootConfig = require('../../tailwind.config.js')

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...rootConfig,
  content: [
    path.join(__dirname, './app/**/*.{ts,tsx}'),
    path.join(__dirname, './components/**/*.{ts,tsx}'),
    path.join(__dirname, './stores/**/*.{ts,tsx}'),
    path.join(__dirname, './lib/**/*.{ts,tsx}'),
    // Include root content paths
    ...rootConfig.content,
  ],
  theme: {
    ...rootConfig.theme,
    extend: {
      ...rootConfig.theme.extend,
      // Add missing border utilities
      borderColor: {
        ...rootConfig.theme.extend.borderColor,
        'border': '#DDDDDD',
        'input': '#DDDDDD',
        'ring': '#FF385C',
      },
      colors: {
        ...rootConfig.theme.extend.colors,
        border: '#DDDDDD',
        input: '#DDDDDD',
        ring: '#FF385C',
        background: '#FFFFFF',
        foreground: '#222222',
        primary: {
          DEFAULT: '#FF385C',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F7F7F7',
          foreground: '#222222',
        },
        muted: {
          DEFAULT: '#F7F7F7',
          foreground: '#717171',
        },
        accent: {
          DEFAULT: '#F7F7F7',
          foreground: '#222222',
        },
        destructive: {
          DEFAULT: '#E00B41',
          foreground: '#FFFFFF',
        },
      },
    },
  },
}

