/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/app/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/components/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // sleek color palette
        rausch: {
          50: '#FFF5F6',
          100: '#FFEEF0',
          200: '#FEE5E7',
          300: '#FFD2D7',
          400: '#FFABB6',
          500: '#FF385C',
          600: '#E00B41',
          700: '#DA1249',
          800: '#A21039',
          900: '#732139',
        },
        sleek: {
          black: '#222222',
          'dark-gray': '#717171',
          gray: '#B0B0B0',
          'light-gray': '#DDDDDD',
          'background-secondary': '#F7F7F7',
          border: '#DDDDDD',
          'border-light': '#EBEBEB',
        },
        gray: {
          50: '#F7F7F7',
          100: '#F2F2F2',
          200: '#EBEBEB',
          300: '#DDDDDD',
          400: '#C1C1C1',
          500: '#8C8C8C',
          600: '#6C6C6C',
          700: '#515151',
          800: '#3F3F3F',
          900: '#222222',
          950: '#000000',
        },
      },
      fontFamily: {
        sans: ['Circular', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-large': ['3rem', { lineHeight: '3.375rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-medium': ['2.5rem', { lineHeight: '2.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-small': ['2rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        'title-large': ['1.625rem', { lineHeight: '1.875rem', fontWeight: '600' }],
        'title-medium': ['1.375rem', { lineHeight: '1.625rem', fontWeight: '600' }],
        'title-small': ['1.125rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'body-large': ['1rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'body-medium': ['0.875rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        'body-small': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'sleek-small': '8px',
        'sleek-medium': '12px',
        'sleek-large': '16px',
        'sleek-xl': '24px',
      },
      boxShadow: {
        'sleek-light': '0 1px 2px rgba(0, 0, 0, 0.08)',
        'sleek-medium': '0 2px 4px rgba(0, 0, 0, 0.12)',
        'sleek-large': '0 6px 16px rgba(0, 0, 0, 0.12)',
        'sleek-xl': '0 8px 28px rgba(0, 0, 0, 0.28)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: '500',
            },
            '[class~="lead"]': {
              color: 'inherit',
            },
            strong: {
              color: 'inherit',
              fontWeight: '600',
            },
            'ol[type="A"]': {
              '--list-counter-style': 'upper-alpha',
            },
            'ol[type="a"]': {
              '--list-counter-style': 'lower-alpha',
            },
            'ol[type="A" s]': {
              '--list-counter-style': 'upper-alpha',
            },
            'ol[type="a" s]': {
              '--list-counter-style': 'lower-alpha',
            },
            'ol[type="I"]': {
              '--list-counter-style': 'upper-roman',
            },
            'ol[type="i"]': {
              '--list-counter-style': 'lower-roman',
            },
            'ol[type="I" s]': {
              '--list-counter-style': 'upper-roman',
            },
            'ol[type="i" s]': {
              '--list-counter-style': 'lower-roman',
            },
            'ol[type="1"]': {
              '--list-counter-style': 'decimal',
            },
            'ol > li': {
              position: 'relative',
            },
            'ol > li::marker': {
              fontWeight: '400',
              color: 'var(--tw-prose-counters)',
            },
            'ul > li': {
              position: 'relative',
            },
            'ul > li::marker': {
              color: 'var(--tw-prose-bullets)',
            },
            hr: {
              borderColor: 'var(--tw-prose-hr)',
              borderTopWidth: 1,
            },
            blockquote: {
              fontWeight: '500',
              fontStyle: 'italic',
              color: 'inherit',
              borderLeftWidth: '0.25rem',
              borderLeftColor: 'var(--tw-prose-quote-borders)',
              quotes: '"\\201C""\\201D""\\2018""\\2019"',
            },
            h1: {
              color: 'inherit',
              fontWeight: '800',
            },
            h2: {
              color: 'inherit',
              fontWeight: '700',
            },
            h3: {
              color: 'inherit',
              fontWeight: '600',
            },
            h4: {
              color: 'inherit',
              fontWeight: '600',
            },
            'figure figcaption': {
              color: 'var(--tw-prose-captions)',
            },
            code: {
              color: 'inherit',
              fontWeight: '600',
            },
            'a code': {
              color: 'inherit',
            },
            pre: {
              color: 'var(--tw-prose-pre-code)',
              backgroundColor: 'var(--tw-prose-pre-bg)',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: 'inherit',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            table: {
              width: '100%',
              tableLayout: 'auto',
              textAlign: 'left',
              marginTop: '2em',
              marginBottom: '2em',
            },
            thead: {
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--tw-prose-th-borders)',
            },
            'thead th': {
              color: 'inherit',
              fontWeight: '600',
              verticalAlign: 'bottom',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--tw-prose-td-borders)',
            },
            'tbody tr:last-child': {
              borderBottomWidth: '0',
            },
            'tbody td': {
              verticalAlign: 'baseline',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
