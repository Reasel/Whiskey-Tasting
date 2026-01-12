/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      animation: {
        gradient: 'gradient 8s linear infinite',
      },
      keyframes: {
        gradient: {
          to: { 'background-position': '200% center' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Swiss International Style Color Palette
        'canvas-cream': '#F0F0E8',
        'panel-grey': '#E5E5E0',
        'light-grey': '#D8D8D2',
        'ink-black': '#000000',
        'hyper-blue': '#1D4ED8',
        'signal-green': '#15803D',
        'alert-orange': '#F97316',
        'alert-red': '#DC2626',
        'steel-grey': '#4B5563',
        'muted-text': '#6B7280',
      },
    },
  },
  plugins: [],
};
