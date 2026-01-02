/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        accent: {
          yellow: '#FBBF24',
          green: '#10B981',
          purple: '#8B5CF6',
          pink: '#EC4899',
        },
        dark: {
          900: '#0c0c0c',
          800: '#1a1a1a',
          700: '#2d2d2d',
        }
      },
    },
  },
  plugins: [],
}
