/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ms: {
          50: '#f0f8ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Dashboard-Designsprache – dieselben Werte wie die öffentliche
        // Website (app/globals.css, app/impressum/page.tsx u.a.), damit
        // das Command Center visuell zur Marke passt statt generisches
        // SaaS-Indigo zu sein.
        dash: {
          bg: '#0c0a06',
          surface: '#1c1912',
          surfaceAlt: '#100d09',
          border: '#2d2820',
          gold: '#c9a84c',
          goldHover: '#b8943a',
          textBright: '#f4edd8',
          textSubtle: '#d4c4a8',
          textMuted: '#a89880',
          textDim: '#7a6d5a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-dashboard-display)', '"Chakra Petch"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
