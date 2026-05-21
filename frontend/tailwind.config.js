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
        // HSL Cyberpunk Dark Industrial Palette
        cyber: {
          950: '#02040a', // slate-950 equivalent (deep space)
          900: '#070c17', // card background dark
          800: '#0e182c', // border/hover state
          700: '#1b2a47', // highlight borders
          primary: '#10b981',   // Emerald-500 (Heathy Status / OK)
          secondary: '#22d3ee', // Cyan-400 (Data Streams)
          warning: '#f59e0b',   // Amber-500 (Alert Limit)
          danger: '#f43f5e',    // Rose-500 (Extreme Danger / Alert)
          purple: '#a855f7',    // Purple-500 (Aggregations)
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2), 0 0 10px rgba(16, 185, 129, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(16, 185, 129, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
