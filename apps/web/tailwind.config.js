/**** Tailwind config scoped for apps/web; extends root config ****/
const path = require('path')
const rootConfig = require('../../tailwind.config.js')

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    ...rootConfig,
  content: [
    path.join(__dirname, './app/**/*.{ts,tsx}'),
    path.join(__dirname, './components/**/*.{ts,tsx}'),
    path.join(__dirname, './stores/**/*.{ts,tsx}'),
    path.join(__dirname, './lib/**/*.{ts,tsx}'),
      ...rootConfig.content
],
  theme: {
      ...rootConfig.theme,
  	extend: {
            ...rootConfig.theme.extend,
  		borderColor: {
                ...rootConfig.theme.extend.borderColor,
  			border: '#DDDDDD',
  			input: '#DDDDDD',
  			ring: '#FF385C'
  		},
  		colors: {
                ...rootConfig.theme.extend.colors,
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
    plugins: [require("tailwindcss-animate")]
}

