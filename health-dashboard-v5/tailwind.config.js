/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'monospace'],
        'serif': ['Cormorant Garamond', 'serif'],
      },
      colors: {
        'bg': '#000000',
        'surface': '#0D1117',
        'surface2': '#161B22',
        'border': '#30363d',
        'text': '#E6EDF3',
        'text-dim': '#8b949e',
        'blue': '#58a6ff',
        'green': '#3fb950',
        'purple': '#bc8cff',
        'orange': '#f0883e',
        'red': '#f85149',
        'yellow': '#d29922',
        'cyan': '#39d2c0',
        'pink': '#f778ba',
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
